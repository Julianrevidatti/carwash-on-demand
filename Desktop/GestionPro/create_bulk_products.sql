-- Create table for bulk/weighted products
CREATE TABLE IF NOT EXISTS bulk_products (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    barcode TEXT,
    cost_per_bulk NUMERIC NOT NULL, -- Cost of the sack/box
    weight_per_bulk NUMERIC NOT NULL, -- Weight of the sack/box in KG
    price_per_kg NUMERIC NOT NULL, -- Selling price per KG
    stock_kg NUMERIC NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bulk_products ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own bulk products" ON bulk_products;
CREATE POLICY "Users can view their own bulk products"
ON bulk_products
FOR SELECT
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE 
    user_id = auth.uid()::text OR 
    contact_name = (auth.jwt() ->> 'email') OR
    contact_name = (auth.jwt() -> 'user_metadata' ->> 'email')
  )
);

DROP POLICY IF EXISTS "Users can insert their own bulk products" ON bulk_products;
CREATE POLICY "Users can insert their own bulk products"
ON bulk_products
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT id FROM tenants WHERE 
    user_id = auth.uid()::text OR 
    contact_name = (auth.jwt() ->> 'email') OR
    contact_name = (auth.jwt() -> 'user_metadata' ->> 'email')
  )
);

DROP POLICY IF EXISTS "Users can update their own bulk products" ON bulk_products;
CREATE POLICY "Users can update their own bulk products"
ON bulk_products
FOR UPDATE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE 
    user_id = auth.uid()::text OR 
    contact_name = (auth.jwt() ->> 'email') OR
    contact_name = (auth.jwt() -> 'user_metadata' ->> 'email')
  )
);

DROP POLICY IF EXISTS "Users can delete their own bulk products" ON bulk_products;
CREATE POLICY "Users can delete their own bulk products"
ON bulk_products
FOR DELETE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE 
    user_id = auth.uid()::text OR 
    contact_name = (auth.jwt() ->> 'email') OR
    contact_name = (auth.jwt() -> 'user_metadata' ->> 'email')
  )
);
