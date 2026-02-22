
-- 1. Check if 'clients' table exists and has necessary columns
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    name TEXT NOT NULL,
    dni TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    current_account_balance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create 'client_movements' table for tracking current account history
CREATE TABLE IF NOT EXISTS client_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('DEBT', 'PAYMENT', 'ADJUSTMENT')), -- DEBT = Sale, PAYMENT = Client pays, ADJUSTMENT = Correction
    amount NUMERIC NOT NULL,
    description TEXT,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL, -- Link to a sale if applicable
    date TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT -- Who recorded this
);

-- 3. Add 'client_id' to 'sales' table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'client_id') THEN
        ALTER TABLE sales ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_movements ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "Enable all access for tenant users" ON clients;
CREATE POLICY "Enable all access for tenant users" ON clients
    USING (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()::text))
    WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()::text));

DROP POLICY IF EXISTS "Enable all access for tenant users" ON client_movements;
CREATE POLICY "Enable all access for tenant users" ON client_movements
    USING (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()::text))
    WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()::text));
