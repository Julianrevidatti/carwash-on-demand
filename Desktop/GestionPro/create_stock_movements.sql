-- Create table for stock movements
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY,
    date TIMESTAMPTZ NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    reason TEXT,
    type TEXT NOT NULL, -- 'OUT' or 'IN'
    user_id TEXT,
    tenant_id UUID NOT NULL REFERENCES tenants(id)
);

-- Enable RLS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own stock movements" ON stock_movements;
CREATE POLICY "Users can view their own stock movements"
ON stock_movements
FOR SELECT
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE 
    user_id = auth.uid()::text OR 
    contact_name = (auth.jwt() ->> 'email') OR
    contact_name = (auth.jwt() -> 'user_metadata' ->> 'email')
  )
);

DROP POLICY IF EXISTS "Users can insert their own stock movements" ON stock_movements;
CREATE POLICY "Users can insert their own stock movements"
ON stock_movements
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT id FROM tenants WHERE 
    user_id = auth.uid()::text OR 
    contact_name = (auth.jwt() ->> 'email') OR
    contact_name = (auth.jwt() -> 'user_metadata' ->> 'email')
  )
);
