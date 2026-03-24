# SOP: Auditoría de Trazabilidad de Stock

## Objetivo
Verificar que toda la información de stock sea consistente al 100% entre las capas del sistema:
`inventory_batches` / `bulk_products` ↔ `stock_movements` ↔ `sale_items` ↔ `sales`.

---

## Diagrama de Flujo de Stock

```
ENTRADA DE STOCK
└── addBatch() → inventory_batches (INSERT)
                → stock_movements type=IN (INSERT)

VENTA (Flujo Normal - RPC Atómico)
└── process_sale_transaction (RPC)
    ├── inventory_batches → quantity - N (UPDATE, FIFO, FOR UPDATE)
    ├── bulk_products → stock_kg - N (UPDATE, FOR UPDATE)
    ├── stock_movements → INSERT (tipo OUT, detail="Venta #XXXX")
    ├── sales → INSERT
    └── sale_items → INSERT
    → addSale() en frontend: solo actualiza estado local con deductLocalStock()

EGRESO MANUAL
└── exitBatchStock() → inventory_batches (UPDATE)
                     → stock_movements type=OUT (INSERT)

ELIMINACIÓN DE VENTA
└── deleteSale() → sale_items buscados por sale_id
                 → bulk_products/batches restaurados en DB
                 → sales DELETE
```

---

## Restricciones y Casos Borde Conocidos

### ⚠️ CRÍTICO: Bug INTEGER en stock_movements (granel)
- **Problema**: La columna `quantity` en `stock_movements` fue originalmente tipo `INTEGER`. Las ventas de granel con decimales (ej. 0.15 Kg) se guardaban como `0`.
- **Evidencia**: 136 movimientos con `quantity=0` detectados en auditoría 2026-03-23.
- **Solución**: Ejecutar `fix_stock_movements_quantity.sql` (ALTER TABLE → NUMERIC) en el panel SQL de Supabase.
- **Estado**: **PENDIENTE** de ejecutar en producción.

### ⚠️ CRÍTICO: 2 lotes con stock NEGATIVO
- **Problema**: Los lotes `9c95a5a5` (producto `9f512243`) y `2531bbd3` (producto `5f62fe70`) tienen quantity=-1.
- **Causa posible**: Una venta fue procesada cuando el stock era 0, o el RPC no lanzó excepción correctamente.
- **Solución**: Ejecutar en Supabase SQL:
  ```sql
  UPDATE inventory_batches SET quantity = 0 WHERE quantity < 0;
  ```
- **Estado**: **PENDIENTE** de corrección.

### ⚠️ Discrepancias entre sale_items y stock_movements
- **Problema**: La tabla `stock_movements` tiene más registros OUT que unidades vendidas en `sale_items` para ~250 productos.
- **Causa principal**: Los `stock_movements` incluyen TODOS los egressos (ventas + egressos manuales + ventas eliminadas que restauraron stock y volvieron a descuenta). El cruce 1:1 con `sale_items` no es la comparación correcta.
- **Diagnóstico correcto**: Comparar solo los movimientos con `reason='Venta'` o `reason='Venta (Granel)'` vs `sale_items`.
- **El stock físico real** es la tabla `inventory_batches.quantity` y `bulk_products.stock_kg`, que son actualizadas atómicamente por el RPC.

### ✅ Sin dobles registros de movimientos
- El RPC inserta directamente en `stock_movements`. El frontend no llama a `addStockMovement` después de `addSale`. No hay duplicación.

### ✅ Ventas atómicas con RPC
- `process_sale_transaction` usa `FOR UPDATE` para locking de filas. Idempotente por `p_sale_id`.
- No hay riesgo de race conditions en ventas normales del POS.

### ⚠️ deleteSale() - Riesgo en restauración de stock
- El stock se restaura usando el estado local (`state.batches`), no datos frescos de DB.
- **Riesgo**: Si el estado local está desincronizado, la restauración puede ser incorrecta.
- **Nota**: No ejecutar `deleteSale` en volumen o automáticamente; siempre verificar manualmente.

### ⚠️ 9 productos eliminados que aparecen en ventas históricas
- Productos eliminados del catálogo siguen referenciados en `sale_items` históricos (correcto por integridad histórica).
- No es un error del sistema, pero puede confundir reportes de inventario.

### ⚠️ 1 venta sin session_id
- Venta `54256851...` del 2025-11-30 por $10 no tiene session vinculada.
- Impact mínimo (1 registro). No requiere acción urgente.

---

## Pasos de Ejecución de la Auditoría

1. Activar el entorno virtual y asegurarse de tener `requests` y `python-dotenv` instalados.
2. Ejecutar: `python scripts/stock_traceability_audit.py`
3. Revisar `.tmp/stock_audit_result.json` para el reporte completo.
4. Para errores críticos (stock negativo, INTEGER quantity), aplicar los SQL correspondientes en Supabase.

## Acciones Correctivas Pendientes (Prioridad)

| # | Acción | Archivo | Prioridad |
|---|--------|---------|-----------|
| 1 | Cambiar `stock_movements.quantity` a NUMERIC | `fix_stock_movements_quantity.sql` | 🔴 ALTA |
| 2 | Resetear lotes con stock negativo a 0 | SQL manual (ver arriba) | 🔴 ALTA |
| 3 | Mejorar `deleteSale` para usar datos frescos de DB | `salesSlice.ts` | 🟡 MEDIA |
