-- FIX PRODUCT OWNERSHIP
-- The catalog is looking for products belonging to Tenant ID: dd0040aa-78a5-4fa4-bf27-db59e5586b2
-- But found 0. This likely means your products are "orphaned" or belong to an old ID.

-- This command assigns ALL existing products to your current business.
UPDATE products 
SET tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59e5586b2';

-- Also ensure they are active
UPDATE products 
SET is_active = true;

-- Verify the result (this will show in the SQL Editor output)
SELECT count(*) as products_assigned FROM products WHERE tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59e5586b2';
