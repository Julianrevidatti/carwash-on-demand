-- Asegurar que la columna existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'user_id') THEN
        ALTER TABLE tenants ADD COLUMN user_id TEXT;
        CREATE INDEX idx_tenants_user_id ON tenants(user_id);
    END IF;
END $$;

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Política de LECTURA (Select) - Más permisiva con el email
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
CREATE POLICY "Users can view their own tenant"
ON tenants
FOR SELECT
USING (
  -- 1. Coincidencia exacta de ID (Lo más seguro)
  user_id = auth.uid()::text
  OR
  -- 2. Coincidencia de Email (Ignorando mayúsculas/minúsculas)
  LOWER(contact_name) = LOWER( (auth.jwt() ->> 'email') )
  OR
  LOWER(contact_name) = LOWER( (auth.jwt() -> 'user_metadata' ->> 'email') )
);

-- Política de ACTUALIZACIÓN (Update)
DROP POLICY IF EXISTS "Users can update their own tenant" ON tenants;
CREATE POLICY "Users can update their own tenant"
ON tenants
FOR UPDATE
USING (
  user_id = auth.uid()::text
  OR
  LOWER(contact_name) = LOWER( (auth.jwt() ->> 'email') )
  OR
  LOWER(contact_name) = LOWER( (auth.jwt() -> 'user_metadata' ->> 'email') )
);

-- Política de INSERCIÓN (Insert)
DROP POLICY IF EXISTS "Users can register their own tenant" ON tenants;
CREATE POLICY "Users can register their own tenant"
ON tenants
FOR INSERT
WITH CHECK (
  user_id = auth.uid()::text
  OR
  LOWER(contact_name) = LOWER( (auth.jwt() ->> 'email') )
  OR
  LOWER(contact_name) = LOWER( (auth.jwt() -> 'user_metadata' ->> 'email') )
);
