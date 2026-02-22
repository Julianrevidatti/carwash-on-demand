-- DIAGNOSTIC SCRIPT
-- Run this and tell me what you see in the "Results" tab.

-- 1. Check if there are ANY products in the database
SELECT count(*) as total_products FROM products;

-- 2. Check the Tenant ID of the first 5 products
SELECT id, name, tenant_id FROM products LIMIT 5;

-- 3. Check specific count for your Tenant
SELECT count(*) as my_products 
FROM products 
WHERE tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59e5586b2';
