-- ==============================================================================
-- SIMULADOR DE "REPORTE Z" (DataReports.tsx logic)
-- Este script simula exactamente la lógica de DataReports.tsx línea 373
-- para ver si al cruzar la data obtenemos los famosos $49.965
-- ==============================================================================

WITH ventas_hoy AS (
    SELECT id as sale_id, date, total, surcharge
    FROM sales 
    WHERE date >= '2026-02-26 00:00:00' AND date <= '2026-02-26 23:59:59'
),
items_vendidos AS (
    SELECT 
        v.sale_id,
        si.product_id,
        si.quantity,
        si.price as price_sold_at,
        si.cost as cost_at_sale_time,
        p.supplier_id as current_product_supplier_id,
        s_prod.name as current_supplier_name
    FROM ventas_hoy v
    JOIN sale_items si ON v.sale_id = si.sale_id
    LEFT JOIN products p ON si.product_id = p.id
    LEFT JOIN suppliers s_prod ON p.supplier_id = s_prod.id
),
tregar_items AS (
    SELECT * FROM items_vendidos 
    WHERE current_supplier_name ILIKE '%TREGAR BCO%'
)
SELECT 
    'TOTAL TREGAR SEGUN LOGICA DE CAJA (Z REPORT)' as "Métrica",
    SUM(quantity * cost_at_sale_time) as "Costo Total Calculado"
FROM tregar_items;

-- Listado detallado de todo lo que cayó en la bolsa de Tregar BCO
SELECT 
    sale_id,
    product_id,
    current_supplier_name,
    quantity,
    cost_at_sale_time,
    (quantity * cost_at_sale_time) as total_cost_row
FROM tregar_items;
