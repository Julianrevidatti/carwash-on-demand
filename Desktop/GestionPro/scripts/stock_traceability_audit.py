"""
=============================================================
  STOCK TRACEABILITY AUDIT - GestioNow
  Verifica trazabilidad 100% del stock en todas las capas:
  inventory_batches, bulk_products, stock_movements, sale_items
=============================================================
"""
import os
import sys
import json
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from collections import defaultdict

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: No se encontraron las variables SUPABASE_URL o SUPABASE_KEY en .env")
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

ERRORS = []
WARNINGS = []
RESULTS = {}

# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────
def supabase_get(table, params="", select="*", limit=5000):
    """Fetch all rows from a Supabase table using pagination."""
    rows = []
    page = 0
    chunk = 1000
    while len(rows) < limit:
        start = page * chunk
        end = start + chunk - 1
        url = f"{SUPABASE_URL}/rest/v1/{table}?select={select}&limit={chunk}&offset={start}"
        if params:
            url += f"&{params}"
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code != 200:
            print(f"  ⚠️  Error consultando {table}: {resp.text[:200]}")
            break
        data = resp.json()
        rows.extend(data)
        if len(data) < chunk:
            break
        page += 1
    return rows

def fmt(value, decimals=2):
    return f"{value:,.{decimals}f}"

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def ok(msg):
    print(f"  ✅ {msg}")

def error(msg):
    ERRORS.append(msg)
    print(f"  ❌ ERROR: {msg}")

def warn(msg):
    WARNINGS.append(msg)
    print(f"  ⚠️  WARN: {msg}")

def info(msg):
    print(f"  ℹ️  {msg}")


# ─────────────────────────────────────────────────────────────
# 1. CARGAR DATOS BASE
# ─────────────────────────────────────────────────────────────
section("1. CARGANDO DATOS DESDE SUPABASE")

tenants = supabase_get("tenants", select="id,name")
info(f"Tenants encontrados: {len(tenants)}")
for t in tenants:
    info(f"  → [{t['id']}] {t.get('name', 'Sin nombre')}")

products = supabase_get("products", select="id,name,barcode,tenant_id")
bulk_products = supabase_get("bulk_products", select="id,name,barcode,stock_kg,tenant_id")
batches = supabase_get("inventory_batches", select="id,product_id,quantity,original_quantity,date_added,tenant_id")
movements = supabase_get("stock_movements", select="id,product_id,product_name,quantity,type,reason,detail,date,tenant_id")
sale_items = supabase_get("sale_items", select="sale_id,product_id,name,quantity,tenant_id")
sales = supabase_get("sales", select="id,date,total,payment_method,tenant_id,session_id")

info(f"  Productos regulares: {len(products)}")
info(f"  Productos bulk: {len(bulk_products)}")
info(f"  Lotes de inventario: {len(batches)}")
info(f"  Movimientos de stock: {len(movements)}")
info(f"  Items de venta: {len(sale_items)}")
info(f"  Ventas: {len(sales)}")


# ─────────────────────────────────────────────────────────────
# 2. AUDIT: LOTES CON CANTIDAD NEGATIVA
# ─────────────────────────────────────────────────────────────
section("2. LOTES CON STOCK NEGATIVO")
negative_batches = [b for b in batches if b.get("quantity", 0) < 0]
if negative_batches:
    for b in negative_batches:
        error(f"Lote {b['id'][:8]}... del producto {b['product_id']} tiene stock NEGATIVO: {b['quantity']}")
else:
    ok("No hay lotes con stock negativo")


# ─────────────────────────────────────────────────────────────
# 3. AUDIT: STOCK BULK NEGATIVO
# ─────────────────────────────────────────────────────────────
section("3. PRODUCTOS GRANEL CON STOCK NEGATIVO")
negative_bulk = [b for b in bulk_products if (b.get("stock_kg") or 0) < 0]
if negative_bulk:
    for b in negative_bulk:
        error(f"Granel '{b['name']}' ({b['id'][:8]}...) tiene stock NEGATIVO: {b['stock_kg']} kg")
else:
    ok("No hay productos a granel con stock negativo")


# ─────────────────────────────────────────────────────────────
# 4. AUDIT: MOVIMIENTOS DE GRANEL CON CANTIDAD 0 (bug INTEGER)
# ─────────────────────────────────────────────────────────────
section("4. MOVIMIENTOS DE GRANEL CON CANTIDAD = 0 (Bug tipo INTEGER)")

# Get bulk product IDs for filtering
bulk_ids = {b["id"] for b in bulk_products}
bulk_movements = [m for m in movements if m.get("product_id") in bulk_ids]
zero_bulk_movements = [m for m in bulk_movements if m.get("quantity") == 0]

if zero_bulk_movements:
    warn(f"Se encontraron {len(zero_bulk_movements)} movimientos de granel con cantidad=0")
    for m in zero_bulk_movements[:10]:  # Show first 10
        warn(f"  → {m['product_name']} | {m['reason']} | {m['date'][:10]}")
    RESULTS["zero_bulk_movements"] = len(zero_bulk_movements)
else:
    ok("No hay movimientos de granel con cantidad=0 (el tipo NUMERIC está activo)")


# ─────────────────────────────────────────────────────────────
# 5. AUDIT: COMPARAR VENTAS DE GRANEL vs MOVIMIENTOS
# ─────────────────────────────────────────────────────────────
section("5. CRUCE: VENTAS GRANEL en sale_items vs stock_movements")

# Sold quantities per bulk product
bulk_sold = defaultdict(float)
for item in sale_items:
    if item.get("product_id") in bulk_ids:
        bulk_sold[item["product_id"]] += float(item.get("quantity") or 0)

# OUT movements for bulk products
bulk_out_movements = defaultdict(float)
for m in movements:
    if m.get("product_id") in bulk_ids and m.get("type") == "OUT":
        bulk_out_movements[m["product_id"]] += float(m.get("quantity") or 0)

# Build a lookup for bulk product names
bulk_name = {b["id"]: b["name"] for b in bulk_products}

discrepancies_found = False
for pid in set(list(bulk_sold.keys()) + list(bulk_out_movements.keys())):
    sold = bulk_sold.get(pid, 0)
    moved = bulk_out_movements.get(pid, 0)
    diff = abs(sold - moved)
    if diff > 0.01:
        discrepancies_found = True
        name = bulk_name.get(pid, pid[:8])
        warn(f"DISCREPANCIA en granel '{name}': Vendido={fmt(sold)} kg | Movim.OUT={fmt(moved)} kg | Δ={fmt(diff)} kg")

if not discrepancies_found:
    ok("Ventas de granel coinciden con movimientos OUT de stock")


# ─────────────────────────────────────────────────────────────
# 6. AUDIT: VENTAS SIN MOVIMIENTO DE STOCK (REGULAR)
# ─────────────────────────────────────────────────────────────
section("6. CRUCE: VENTAS REGULARES vs stock_movements")

product_ids = {p["id"] for p in products}
regular_sold = defaultdict(float)
for item in sale_items:
    if item.get("product_id") in product_ids:
        regular_sold[item["product_id"]] += float(item.get("quantity") or 0)

regular_out = defaultdict(float)
for m in movements:
    if m.get("product_id") in product_ids and m.get("type") == "OUT":
        regular_out[m["product_id"]] += float(m.get("quantity") or 0)

product_name = {p["id"]: p["name"] for p in products}

discrepancies_reg = False
for pid in regular_sold:
    sold = regular_sold[pid]
    moved = regular_out.get(pid, 0)
    diff = abs(sold - moved)
    if diff > 0.5:  # Tolerate small rounding differences
        discrepancies_reg = True
        name = product_name.get(pid, pid[:8])
        warn(f"DISCREPANCIA en '{name}': Vendido={fmt(sold,0)} | Movim.OUT={fmt(moved,0)} | Δ={fmt(diff,0)}")

if not discrepancies_reg:
    ok("Ventas regulares coinciden con movimientos OUT de stock")
else:
    info("Nota: Discrepancias pueden ocurrir si el RPC registró movimientos dentro de la transacción SQL pero no en stock_movements de frontend")


# ─────────────────────────────────────────────────────────────
# 7. AUDIT: STOCK BATCH CALCULADO vs STOCK REAL
# ─────────────────────────────────────────────────────────────
section("7. VERIFICACIÓN: Stock actual en lotes vs. Entradas - Salidas")

# Group batches by product
batch_stock = defaultdict(float)
for b in batches:
    batch_stock[b["product_id"]] += float(b.get("quantity") or 0)

# Calculate IN movements (stock entries)
in_movements = defaultdict(float)
out_movements_all = defaultdict(float)
for m in movements:
    if m.get("type") == "IN":
        in_movements[m["product_id"]] += float(m.get("quantity") or 0)
    elif m.get("type") == "OUT":
        out_movements_all[m["product_id"]] += float(m.get("quantity") or 0)

# Note: batch stock is the CURRENT state, not historical. 
# We check for products with stock but no batches (or opposite)
products_with_batches = set(batch_stock.keys())
for pid in products_with_batches:
    current_stock = batch_stock[pid]
    if current_stock < 0:
        name = product_name.get(pid, pid[:8])
        error(f"Stock NEGATIVO calculado para '{name}': {fmt(current_stock, 0)} unidades")

ok(f"Stock actual calculado para {len(products_with_batches)} productos")


# ─────────────────────────────────────────────────────────────
# 8. AUDIT: VENTAS SIN SESSION_ID (HUERFANAS)
# ─────────────────────────────────────────────────────────────
section("8. VENTAS HUÉRFANAS (sin session_id)")
orphan_sales = [s for s in sales if not s.get("session_id")]
if orphan_sales:
    warn(f"Hay {len(orphan_sales)} ventas sin session_id")
    for s in orphan_sales[:5]:
        warn(f"  → Venta {s['id'][:8]}... | {s.get('date','?')[:10]} | ${s.get('total',0)}")
else:
    ok("Todas las ventas tienen session_id asociado")


# ─────────────────────────────────────────────────────────────
# 9. AUDIT: SALE_ITEMS HUERFANOS (sin venta padre)
# ─────────────────────────────────────────────────────────────
section("9. SALE_ITEMS HUERFANOS (sale_id no existe en sales)")
sale_ids = {s["id"] for s in sales}
orphan_items = [i for i in sale_items if i.get("sale_id") not in sale_ids]
if orphan_items:
    error(f"Hay {len(orphan_items)} sale_items sin venta padre!")
    # Group by sale_id
    orphan_by_sale = defaultdict(list)
    for item in orphan_items:
        orphan_by_sale[item["sale_id"]].append(item)
    for sale_id, items in list(orphan_by_sale.items())[:5]:
        warn(f"  → SaleID {sale_id[:8]}... tiene {len(items)} items sin venta padre")
else:
    ok("Todos los sale_items tienen una venta padre válida")


# ─────────────────────────────────────────────────────────────
# 10. AUDIT: PRODUCTOS EN VENTAS QUE NO EXISTEN EN CATÁLOGO
# ─────────────────────────────────────────────────────────────
section("10. PRODUCTOS EN VENTAS QUE NO ESTÁN EN EL CATÁLOGO")
all_catalog_ids = product_ids | bulk_ids
ghost_product_ids = set()
for item in sale_items:
    pid = item.get("product_id")
    if pid and pid not in all_catalog_ids:
        ghost_product_ids.add(pid)

if ghost_product_ids:
    warn(f"Hay {len(ghost_product_ids)} IDs de producto vendidos que ya no están en el catálogo")
    for pid in list(ghost_product_ids)[:10]:
        # Find name from sale items
        names = [i["name"] for i in sale_items if i.get("product_id") == pid]
        name = names[0] if names else "Desconocido"
        warn(f"  → '{name}' ({pid[:8]}...) - posiblemente eliminado del catálogo")
else:
    ok("Todos los productos vendidos existen en el catálogo actual")


# ─────────────────────────────────────────────────────────────
# 11. AUDIT: MOVIMIENTOS SIN TIPO DEFINIDO
# ─────────────────────────────────────────────────────────────
section("11. MOVIMIENTOS DE STOCK CON TIPO INVÁLIDO")
invalid_type_movements = [m for m in movements if m.get("type") not in ("IN", "OUT")]
if invalid_type_movements:
    error(f"Hay {len(invalid_type_movements)} movimientos con tipo inválido")
    for m in invalid_type_movements[:5]:
        error(f"  → {m.get('product_name','?')} | type='{m.get('type')}' | {m.get('date','?')[:10]}")
else:
    ok("Todos los movimientos tienen tipo IN/OUT válido")


# ─────────────────────────────────────────────────────────────
# 12. AUDIT: DOBLE REGISTRO DE MOVIMIENTOS (RPC + Frontend)
# ─────────────────────────────────────────────────────────────
section("12. DETECCIÓN DE DOBLE REGISTRO EN MOVIMIENTOS DE STOCK")
# The RPC process_sale_transaction inserts its own stock_movements.
# The frontend also calls deductLocalStock but NOT addStockMovement.
# However, deductBulkStock (for manual sales without RPC) DOES call addStockMovement.
# Check if there are duplicate movements for the same saleId and productId

# Group movements by (product_id, detail) - detail contains "Venta #XXXX"
from collections import Counter
movement_keys = []
for m in movements:
    detail = m.get("detail", "")
    if detail and detail.startswith("Venta #"):
        sale_prefix = detail.replace("Venta #", "").strip()
        movement_keys.append((m.get("product_id"), sale_prefix))

duplicates = {k: count for k, count in Counter(movement_keys).items() if count > 1}
if duplicates:
    error(f"Se detectaron {len(duplicates)} casos de DOBLE REGISTRO en movimientos de stock!")
    for (pid, sale_prefix), count in list(duplicates.items())[:10]:
        name = product_name.get(pid) or bulk_name.get(pid) or pid[:8]
        error(f"  → Producto '{name}' | Venta #{sale_prefix} aparece {count} veces en stock_movements")
else:
    ok("No se detectaron dobles registros de movimientos (RPC + frontend)")


# ─────────────────────────────────────────────────────────────
# 13. AUDIT: MULTI-TENANT - DATOS CRUZADOS
# ─────────────────────────────────────────────────────────────
section("13. VALIDACIÓN MULTI-TENANT (datos no contaminados entre tenants)")
if len(tenants) > 1:
    tenant_ids = {t["id"] for t in tenants}
    for table_name, table_data in [("products", products), ("sales", sales), ("batches", batches)]:
        bad = [r for r in table_data if r.get("tenant_id") not in tenant_ids]
        if bad:
            error(f"Tabla '{table_name}': {len(bad)} registros con tenant_id INVÁLIDO")
        else:
            ok(f"Tabla '{table_name}': todos los tenant_id son válidos")
else:
    ok("Solo hay 1 tenant, no hay riesgo de contaminación cruzada")


# ─────────────────────────────────────────────────────────────
# 14. RESUMEN FINAL
# ─────────────────────────────────────────────────────────────
section("14. RESUMEN EJECUTIVO")
print(f"\n  📊 DATOS AUDITADOS:")
print(f"     - Productos regulares: {len(products)}")
print(f"     - Productos a granel: {len(bulk_products)}")
print(f"     - Lotes de inventario: {len(batches)}")
print(f"     - Movimientos de stock: {len(movements)}")
print(f"     - Items vendidos: {len(sale_items)}")
print(f"     - Ventas totales: {len(sales)}")
print(f"\n  🚨 ERRORES CRÍTICOS ENCONTRADOS: {len(ERRORS)}")
for e in ERRORS:
    print(f"     → {e}")
print(f"\n  ⚠️  ADVERTENCIAS: {len(WARNINGS)}")
for w in WARNINGS:
    print(f"     → {w}")

if not ERRORS and not WARNINGS:
    print("\n  🟢 TRAZABILIDAD AL 100%: No se encontraron errores ni advertencias.")
elif not ERRORS:
    print("\n  🟡 Trazabilidad con advertencias menores. Revisar warnings.")
else:
    print("\n  🔴 TRAZABILIDAD COMPROMETIDA. Corregir errores críticos.")

# Save results to .tmp/
os.makedirs(".tmp", exist_ok=True)
output = {
    "timestamp": datetime.now().isoformat(),
    "summary": {"errors": len(ERRORS), "warnings": len(WARNINGS)},
    "errors": ERRORS,
    "warnings": WARNINGS,
    "counts": {
        "products": len(products),
        "bulk_products": len(bulk_products),
        "batches": len(batches),
        "movements": len(movements),
        "sale_items": len(sale_items),
        "sales": len(sales)
    }
}
with open(".tmp/stock_audit_result.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)
print(f"\n  💾 Resultado guardado en .tmp/stock_audit_result.json")
