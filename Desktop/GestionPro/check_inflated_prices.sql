-- =============================================
-- SCRIPT DE DETECCIÓN DE PRECIOS INFLADOS
-- =============================================
-- Este script busca productos con márgenes sospechosamente altos
-- o precios que superan por mucho al costo.

SELECT 
    name as "Producto", 
    cost as "Costo Base", 
    price as "Precio Venta", 
    profit_margin as "Margen %",
    (price / NULLIF(cost, 0)) as "Relacion_Precio_Costo",
    tenant_id
FROM 
    products 
WHERE 
    profit_margin > 500 -- Margen mayor al 500%
    OR price > (cost * 5) -- Precio 5 veces mayor al costo
ORDER BY 
    profit_margin DESC;
