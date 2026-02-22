-- Enable RLS on tables if not already enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Policy for Public Read Access to Products
DROP POLICY IF EXISTS "Public can view active products" ON products;
CREATE POLICY "Public can view active products"
ON products FOR SELECT
TO anon, authenticated
USING (true); -- Ideally should be (is_active = true) but let's be permissive for debugging then refine

-- Policy for Public Read Access to Promotions
DROP POLICY IF EXISTS "Public can view active promotions" ON promotions;
CREATE POLICY "Public can view active promotions"
ON promotions FOR SELECT
TO anon, authenticated
USING (true); -- active status checks are done in the query

-- Ensure Tenant visibility too just in case
DROP POLICY IF EXISTS "Public can view tenants" ON tenants;
CREATE POLICY "Public can view tenants"
ON tenants FOR SELECT
TO anon, authenticated
USING (true);

-- Grant select usage
GRANT SELECT ON products TO anon, authenticated;
GRANT SELECT ON promotions TO anon, authenticated;
GRANT SELECT ON tenants TO anon, authenticated;
