
-- FIX RLS POLICIES FOR CLIENTS

-- 1. Enable RLS (Ensure it's on)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_movements ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable all access for tenant users" ON clients;
DROP POLICY IF EXISTS "Enable all access for tenant users" ON client_movements;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON clients;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON clients;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON clients;

-- 3. Create BROAD policies for authenticated users
-- Since `auth.uid()` might not match `user_id` in tenants table perfectly in some legacy cases,
-- we will use a simpler policy for now: "Allow access if user is authenticated".
-- Ideally, we check tenant, but to FIX the "not showing" issue, let's start broad.

-- OPTION A: Proper Tenant Check (Recommended)
CREATE POLICY "Enable all access for tenant users" ON clients
    USING (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()::text))
    WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()::text));

CREATE POLICY "Enable all access for tenant users" ON client_movements
    USING (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()::text))
    WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()::text));

-- OPTION B: Fallback (If the above fails because of UUID/Text mismatch or mismatched IDs)
-- UNCOMMENT ONLY IF OPTION A FAILS
-- CREATE POLICY "Allow all authenticated" ON clients
--     USING (auth.role() = 'authenticated')
--     WITH CHECK (auth.role() = 'authenticated');

-- 4. Grant Permissions to authenticated role (Just in case)
GRANT ALL ON clients TO authenticated;
GRANT ALL ON client_movements TO authenticated;

-- 5. Force valid tenant_id check (Self-healing)
-- This ensures that if a client was inserted with NULL tenant_id (due to a bug), it might be visible if we relax policy, 
-- but users should only see their own.
