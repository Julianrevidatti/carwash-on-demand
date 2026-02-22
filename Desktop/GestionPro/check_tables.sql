
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('products', 'promotions', 'tenants');

SELECT count(*) FROM products;
SELECT count(*) FROM promotions;
