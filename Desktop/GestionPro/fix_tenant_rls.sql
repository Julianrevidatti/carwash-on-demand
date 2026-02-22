-- Enable RLS on tenants table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 1. Policy for SELECT (Reading tenant)
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
CREATE POLICY "Users can view their own tenant"
ON tenants
FOR SELECT
USING (
  -- Check against email in JWT (Clerk/Supabase)
  contact_name = (auth.jwt() ->> 'email')
  OR
  -- Fallback for native Supabase Auth
  contact_name = auth.email()
);

-- 2. Policy for INSERT (Registering tenant)
DROP POLICY IF EXISTS "Users can register their own tenant" ON tenants;
CREATE POLICY "Users can register their own tenant"
ON tenants
FOR INSERT
WITH CHECK (
  contact_name = (auth.jwt() ->> 'email')
  OR
  contact_name = auth.email()
);

-- 3. Policy for UPDATE (Updating settings)
DROP POLICY IF EXISTS "Users can update their own tenant" ON tenants;
CREATE POLICY "Users can update their own tenant"
ON tenants
FOR UPDATE
USING (
  contact_name = (auth.jwt() ->> 'email')
  OR
  contact_name = auth.email()
);
