-- ==============================================================================
-- VALIDACIÓN DE STOCK: HISTORIAL VS LOTES ACTUALES (ÚLTIMOS 3 DÍAS)
-- Este script permite comparar los movimientos de stock registrados en el 
-- historial ("Historial de Movimientos") contra la cantidad real de stock 
-- almacenado en la tabla de lotes (inventory_batches) y a granel.
-- ==============================================================================

WITH recent_movements AS (
    -- 1. Obtenemos todos los movimientos de los últimos 3 días (o el tiempo que desees)
    SELECT 
        product_id,
        tenant_id,
        SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END) as total_ingresado_historial,
        SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) as total_egresado_historial,
        SUM(CASE WHEN type = 'IN' THEN quantity ELSE -quantity END) as stock_neto_historico
    FROM stock_movements
    WHERE date >= NOW() - INTERVAL '3 days' 
    -- Para ver todo el tiempo, comenta la línea de arriba poniendo -- al principio
    GROUP BY product_id, tenant_id
),
actual_batches AS (
    -- 2. Obtenemos el stock actual real de la base de datos (Lotes)
    SELECT 
        product_id,
        tenant_id,
        SUM(quantity) as stock_real_en_lotes
    FROM inventory_batches
    GROUP BY product_id, tenant_id
)
-- 3. Unimos la información para comparar y detectar discrepancias
SELECT 
    p.name as "Nombre del Producto",
    rm.stock_neto_historico as "Stock Neto Historial (3 días)",
    COALESCE(ab.stock_real_en_lotes, 0) as "Stock Real en Sistema (Lotes)",
    rm.total_ingresado_historial as "Total Ingresado (Historial)",
    rm.total_egresado_historial as "Total Egresado (Historial)",
    (COALESCE(ab.stock_real_en_lotes, 0) - rm.stock_neto_historico) as "Diferencia"
FROM recent_movements rm
LEFT JOIN actual_batches ab 
    ON rm.product_id = ab.product_id AND rm.tenant_id = ab.tenant_id
LEFT JOIN products p 
    ON rm.product_id = p.id
ORDER BY "Diferencia" ASC, rm.stock_neto_historico DESC;

-- NOTA PARA EL USUARIO:
-- Si "Stock Neto Historial" es mayor que "Stock Real en Sistema", significa que
-- hubo registros en el historial que NO se guardaron correctamente en la tabla de lotes 
-- (posiblemente porque el período de gracia expiró o hubo un bloqueo de base de datos).
