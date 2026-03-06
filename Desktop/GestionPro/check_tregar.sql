-- ==============================================================================
-- VALIDACION DE VENTAS POR PROVEEDOR Y COSTOS REALES (TREGAR BCO)
-- ==============================================================================

WITH tregar_products AS (
    -- 1. Buscamos el ID exacto del proveedor TREGAR BCO
    SELECT p.id as product_id, p.name as product_name, p.cost, p.price, p.is_pack, s.name as supplier_name
    FROM products p
    JOIN suppliers s ON p.supplier_id = s.id
    WHERE s.name ILIKE '%TREGAR BCO%'
),
ventas_hoy AS (
    -- 2. Buscamos todas las ventas de hoy
    SELECT id as sale_id, date
    FROM sales 
    WHERE date >= '2026-02-26 00:00:00' AND date <= '2026-02-26 23:59:59'
)
-- 3. Unimos Ventas -> Items Vendidos -> Catálogo de Tregar
SELECT 
    v.date as "Hora Venta",
    v.sale_id as "ID Venta",
    tp.product_name as "Producto (Tregar)",
    si.quantity as "Cant. Vendida",
    tp.cost as "Costo Unit. (Catálogo Actual)",
    si.cost as "Costo Unit. (Guardado en Caja)",
    (si.cost * si.quantity) as "Costo Total Cobrado",
    si.price as "Precio Cobrado"
FROM ventas_hoy v
JOIN sale_items si ON v.sale_id = si.sale_id
JOIN tregar_products tp ON si.product_id = tp.product_id
ORDER BY v.date ASC;
