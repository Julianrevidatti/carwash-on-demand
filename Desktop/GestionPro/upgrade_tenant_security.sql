-- 1. Add user_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'user_id') THEN
        ALTER TABLE tenants ADD COLUMN user_id TEXT;
        CREATE INDEX idx_tenants_user_id ON tenants(user_id);
    END IF;
END $$;

-- 2. Update RLS to check user_id OR various email paths
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
CREATE POLICY "Users can view their own tenant"
ON tenants
FOR SELECT
USING (
  user_id = auth.uid() -- Match by Clerk ID (stable)
  OR
  contact_name = (auth.jwt() ->> 'email')
  OR
  contact_name = (auth.jwt() -> 'user_metadata' ->> 'email')
  OR
  contact_name = (auth.jwt() -> 'app_metadata' ->> 'email')
  OR
  contact_name = auth.email()
);

DROP POLICY IF EXISTS "Users can update their own tenant" ON tenants;
CREATE POLICY "Users can update their own tenant"
ON tenants
FOR UPDATE
USING (
  user_id = auth.uid()
  OR
  contact_name = (auth.jwt() ->> 'email')
  OR
  contact_name = (auth.jwt() -> 'user_metadata' ->> 'email')
  OR
  contact_name = (auth.jwt() -> 'app_metadata' ->> 'email')
  OR
  contact_name = auth.email()
);

DROP POLICY IF EXISTS "Users can register their own tenant" ON tenants;
CREATE POLICY "Users can register their own tenant"
ON tenants
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR
  contact_name = (auth.jwt() ->> 'email')
  OR
  contact_name = (auth.jwt() -> 'user_metadata' ->> 'email')
  OR
  contact_name = (auth.jwt() -> 'app_metadata' ->> 'email')
  OR
  contact_name = auth.email()
);
