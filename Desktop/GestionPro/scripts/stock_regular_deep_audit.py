"""
============================================================
  DEEP AUDIT: STOCK REGULAR (NO GRANEL)
  Diagnostica problemas específicos en inventory_batches:
  - Lotes con stock negativo + qué producto son
  - Ventas sin movimiento de stock registrado (Vendido > OUT)
  - Productos con stock en sistema pero sin batches activos
  - Análisis de las sales 90 days vs. total movements window
============================================================
"""
import os
import json
import requests
from datetime import datetime
from collections import defaultdict
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

CRITICAL = []
WARNINGS = []

def fetch_all(table, select="*", params="", limit=10000):
    rows, page, chunk = [], 0, 1000
    while len(rows) < limit:
        start = page * chunk
        url = f"{SUPABASE_URL}/rest/v1/{table}?select={select}&limit={chunk}&offset={start}"
        if params:
            url += f"&{params}"
        r = requests.get(url, headers=HEADERS)
        if r.status_code != 200:
            print(f"  ⚠ Error {table}: {r.text[:100]}")
            break
        data = r.json()
        rows.extend(data)
        if len(data) < chunk:
            break
        page += 1
    return rows

def section(title):
    print(f"\n{'='*62}")
    print(f"  {title}")
    print(f"{'='*62}")

def err(msg):
    CRITICAL.append(msg)
    print(f"  ❌ {msg}")

def warn(msg):
    WARNINGS.append(msg)
    print(f"  ⚠️  {msg}")

def ok(msg):
    print(f"  ✅ {msg}")

def info(msg):
    print(f"  ℹ️  {msg}")

# ─────────────────────────────────────────────────────────────
# CARGAR DATOS (sin límite en movements para análisis completo)
# ─────────────────────────────────────────────────────────────
section("CARGANDO DATOS")

products      = fetch_all("products",   select="id,name,barcode,tenant_id")
batches       = fetch_all("inventory_batches", select="id,product_id,quantity,original_quantity,date_added,tenant_id")
# Fetch ALL movements, no 3000 cap - use 10k
movements_all = fetch_all("stock_movements", select="id,product_id,product_name,quantity,type,reason,detail,date,tenant_id", limit=10000)
# Sale items - everything (paginated to 10k)
sale_items    = fetch_all("sale_items",  select="sale_id,product_id,name,quantity,tenant_id", limit=10000)
bulk_products = fetch_all("bulk_products", select="id,name,tenant_id")

bulk_ids    = {b["id"] for b in bulk_products}
product_map = {p["id"]: p["name"] for p in products}
product_ids = set(product_map.keys())

info(f"Productos regulares: {len(products)}")
info(f"Lotes activos+inactivos en batches: {len(batches)}")
info(f"Movimientos totales cargados: {len(movements_all)}")
info(f"Sale items totales cargados: {len(sale_items)}")

# ─────────────────────────────────────────────────────────────
# CHECK A: LOTES CON STOCK NEGATIVO - IDENTIFICAR PRODUCTOS
# ─────────────────────────────────────────────────────────────
section("CHECK A: LOTES CON STOCK NEGATIVO")

negative = [(b, product_map.get(b["product_id"], "????")) for b in batches if (b.get("quantity") or 0) < 0]
if negative:
    for b, name in negative:
        err(f"Lote {b['id'][:8]}... → Producto: '{name}' | qty={b['quantity']} | original_qty={b.get('original_quantity','?')} | added={b.get('date_added','?')[:10]}")
    print()
    print("  SQL FIX (ejecutar en Supabase):")
    print("  UPDATE inventory_batches SET quantity = 0 WHERE quantity < 0;")
else:
    ok("Sin lotes con stock negativo")

# ─────────────────────────────────────────────────────────────
# CHECK B: STOCK ACTUAL EN BATCHES POR PRODUCTO
# ─────────────────────────────────────────────────────────────
section("CHECK B: PRODUCTOS CON STOCK CALCULADO")

batch_stock = defaultdict(float)
for b in batches:
    pid = b.get("product_id")
    if pid in product_ids:
        batch_stock[pid] += float(b.get("quantity") or 0)

# Products with batches but all zero
zero_stock = [(pid, product_map[pid]) for pid, qty in batch_stock.items() if qty == 0]
neg_stock  = [(pid, product_map[pid], qty) for pid, qty in batch_stock.items() if qty < 0]

info(f"Productos con batches en DB: {len(batch_stock)}")
info(f"Productos con stock calculado = 0 (vacíos): {len(zero_stock)}")

if neg_stock:
    for pid, name, qty in neg_stock:
        err(f"Stock NEGATIVO acumulado en lotes para '{name}': {qty} unidades")
else:
    ok("Ningún producto tiene stock acumulado negativo cuando se suman sus lotes")

# ─────────────────────────────────────────────────────────────
# CHECK C: VENTAS SIN MOVIMIENTO DE STOCK (Vendido > OUT)
#          Solo productos regulares, solo reason='Venta'
# ─────────────────────────────────────────────────────────────
section("CHECK C: VENTAS SIN MOVIMIENTO DE STOCK REGISTRADO")
info("Comparando sale_items con stock_movements tipo OUT reason='Venta'")
info(f"(Esto usa TODOS los movimientos cargados: {len(movements_all)})")

# Count OUT movements per product for SALE reasons
sale_out = defaultdict(float)
for m in movements_all:
    pid = m.get("product_id")
    if pid not in product_ids:
        continue
    if m.get("type") != "OUT":
        continue
    reason = m.get("reason", "")
    # Only count sale-type movements (from RPC or old system)
    if "Venta" in reason:
        sale_out[pid] += float(m.get("quantity") or 0)

# Count sold quantities per product (all sale_items for regular products)
sold_qty = defaultdict(float)
for item in sale_items:
    pid = item.get("product_id")
    if pid in product_ids:
        sold_qty[pid] += float(item.get("quantity") or 0)

# Find: sold but not in movements at all (most critical)
untracked_sales = []
for pid, qty_sold in sold_qty.items():
    qty_moved = sale_out.get(pid, 0)
    delta = qty_sold - qty_moved
    if delta > 1:  # Tolerance of 1 unit for rounding
        untracked_sales.append((pid, product_map.get(pid, "????"), qty_sold, qty_moved, delta))

# Sort by delta descending (worst first)
untracked_sales.sort(key=lambda x: -x[4])

info(f"Productos con ventas que NO tienen movimiento sale_out equivalente: {len(untracked_sales)}")
print()

if untracked_sales:
    print(f"  {'Producto':<45} {'Vendido':>8} {'Mvmt.OUT(Vta)':>14} {'Delta':>7}")
    print(f"  {'-'*45} {'-'*8} {'-'*14} {'-'*7}")
    for pid, name, sold, moved, delta in untracked_sales[:50]:
        # Flag as critical if moved is 0 (no movement at all)
        icon = "❌" if moved == 0 else "⚠️"
        print(f"  {icon} {name[:44]:<44} {sold:>8.0f} {moved:>14.0f} {delta:>7.0f}")
    if len(untracked_sales) > 50:
        print(f"\n  ... y {len(untracked_sales)-50} productos más")
else:
    ok("Todos los productos vendidos tienen movimientos de stock OUT correspondientes")

# Classify: no movement at all vs partial mismatch
no_movement_at_all = [(pid, name, sold) for pid, name, sold, moved, delta in untracked_sales if moved == 0]
partial_mismatch   = [(pid, name, sold, moved, delta) for pid, name, sold, moved, delta in untracked_sales if moved > 0]

print()
info(f"Sin NINGÚN movimiento de venta registrado: {len(no_movement_at_all)} productos")
info(f"Con movimientos parciales (delta positivo): {len(partial_mismatch)} productos")


# ─────────────────────────────────────────────────────────────
# CHECK D: MOVIMIENTOS MANUALES vs VENTA (ratio)
# ─────────────────────────────────────────────────────────────
section("CHECK D: DESGLOSE DE MOVIMIENTOS OUT POR TIPO DE RAZÓN")

reason_counts = defaultdict(int)
reason_qty = defaultdict(float)
for m in movements_all:
    if m.get("type") == "OUT" and m.get("product_id") in product_ids:
        r = m.get("reason", "Sin razón")
        reason_counts[r] += 1
        reason_qty[r] += float(m.get("quantity") or 0)

print(f"\n  {'Razón':<35} {'#Movim':>8} {'Total Qty':>12}")
print(f"  {'-'*35} {'-'*8} {'-'*12}")
for reason, count in sorted(reason_counts.items(), key=lambda x: -x[1]):
    print(f"  {reason[:34]:<34} {count:>8} {reason_qty[reason]:>12.0f}")


# ─────────────────────────────────────────────────────────────
# CHECK E: VENTAS SIN STOCK DISPONIBLE (vendido > stock actual)
# ─────────────────────────────────────────────────────────────
section("CHECK E: PRODUCTOS VENDIDOS CON STOCK ACTUAL = 0 EN BATCHES")
info("Productos que se siguen vendiendo sin stock cargado (posible venta a crédito o batch vacío)")

# Find products sold in last sale_items records but with 0 current stock
no_stock_but_selling = []
for pid, qty_sold in sold_qty.items():
    if qty_sold > 0:
        current_stock = batch_stock.get(pid, 0)
        if current_stock <= 0:
            name = product_map.get(pid, "????")
            no_stock_but_selling.append((name, qty_sold, current_stock))

no_stock_but_selling.sort(key=lambda x: -x[1])
info(f"Productos vendidos con stock actual <= 0: {len(no_stock_but_selling)}")
print()

if no_stock_but_selling:
    print(f"  {'Producto':<45} {'Total Vendido':>14} {'Stock Actual':>13}")
    print(f"  {'-'*45} {'-'*14} {'-'*13}")
    for name, sold, stock in no_stock_but_selling[:30]:
        icon = "❌" if stock < 0 else "⚠️"
        print(f"  {icon} {name[:44]:<44} {sold:>14.0f} {stock:>13.0f}")
    if len(no_stock_but_selling) > 30:
        print(f"\n  ... y {len(no_stock_but_selling)-30} más (muchos son productos sin batch cargado, normal)")


# ─────────────────────────────────────────────────────────────
# RESUMEN FINAL
# ─────────────────────────────────────────────────────────────
section("RESUMEN EJECUTIVO - STOCK REGULAR")

print(f"\n  Errores críticos confirmados: {len(CRITICAL)}")
for c in CRITICAL:
    print(f"    ❌ {c}")

print(f"\n  Principales hallazgos:")
print(f"    → Lotes negativos: {len(negative)} lotes de productos regulares")
print(f"    → Vendidos sin ningún movimiento OUT(Venta): {len(no_movement_at_all)} productos")
print(f"    → Vendidos con movimiento parcial (falta cobertura): {len(partial_mismatch)} productos")
print(f"    → Con stock actual ≤ 0 pero que aparecen vendidos: {len(no_stock_but_selling)} casos")

# Save
os.makedirs(".tmp", exist_ok=True)
result = {
    "timestamp": datetime.now().isoformat(),
    "negative_batches": [{"id": b["id"], "product": nm, "qty": b["quantity"]} for b, nm in negative],
    "no_movement_sales": [{"product_id": p, "name": n, "sold": s} for p, n, s in no_movement_at_all],
    "partial_mismatch": [{"product_id": p, "name": n, "sold": s, "moved": m, "delta": d} for p, n, s, m, d in partial_mismatch[:100]],
}
with open(".tmp/stock_regular_deep_audit.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
print(f"\n  💾 Guardado en .tmp/stock_regular_deep_audit.json")
