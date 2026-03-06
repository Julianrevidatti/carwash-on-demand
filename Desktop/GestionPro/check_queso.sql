-- Diagnóstico más profundo para ver por qué el lote no se enlaza con el producto en el Gestor
WITH prod_info AS (
    SELECT id, tenant_id, name FROM products WHERE name ILIKE '%queso crema light%'
)
SELECT 
    b.batch_number AS "Lote",
    b.quantity AS "Cantidad",
    b.tenant_id AS "Tenant del Lote",
    p.tenant_id AS "Tenant del Prod",
    b.product_id AS "ID Producto Lote",
    p.id AS "ID Producto Tabla",
    (b.tenant_id = p.tenant_id) AS "Mismo Tenant?",
    (b.product_id::text = p.id::text) AS "Mismo Producto?"
FROM inventory_batches b
JOIN prod_info p ON p.id::text = b.product_id::text;
