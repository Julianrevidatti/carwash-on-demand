
-- Enable RLS on products table (just in case)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to be clean
DROP POLICY IF EXISTS "Public access to products" ON products;
DROP POLICY IF EXISTS "Authenticated access to products" ON products;
DROP POLICY IF EXISTS "Authenticated insert products" ON products;
DROP POLICY IF EXISTS "Authenticated update products" ON products;
DROP POLICY IF EXISTS "Authenticated delete products" ON products;

-- 1. Allow Public Read Access
CREATE POLICY "Public access to products"
ON products FOR SELECT
TO public
USING (true);

-- 2. Allow Authenticated Users to INSERT
CREATE POLICY "Authenticated insert products"
ON products FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR tenant_id IN (
    SELECT id FROM tenants WHERE user_id = auth.uid()
));

-- 3. Allow Authenticated Users to UPDATE
CREATE POLICY "Authenticated update products"
ON products FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR tenant_id IN (
    SELECT id FROM tenants WHERE user_id = auth.uid()
));

-- 4. Allow Authenticated Users to DELETE
CREATE POLICY "Authenticated delete products"
ON products FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR tenant_id IN (
    SELECT id FROM tenants WHERE user_id = auth.uid()
));

-- 5. Fix Tenant Permissions as well (just in case)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access to tenants" ON tenants;
DROP POLICY IF EXISTS "Authenticated access to tenants" ON tenants;

CREATE POLICY "Public access to tenants"
ON tenants FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated access to tenants"
ON tenants FOR ALL
TO authenticated
USING (user_id = auth.uid());
