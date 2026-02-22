-- Ensure table exists
CREATE TABLE IF NOT EXISTS public.bulk_products (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    barcode TEXT,
    cost_per_bulk NUMERIC NOT NULL,
    weight_per_bulk NUMERIC NOT NULL,
    price_per_kg NUMERIC NOT NULL,
    stock_kg NUMERIC NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bulk_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own bulk products" ON public.bulk_products;
DROP POLICY IF EXISTS "Users can insert their own bulk products" ON public.bulk_products;
DROP POLICY IF EXISTS "Users can update their own bulk products" ON public.bulk_products;
DROP POLICY IF EXISTS "Users can delete their own bulk products" ON public.bulk_products;

-- Create Policies (using the same logic as suppliers/products)
CREATE POLICY "Users can view their own bulk products"
ON public.bulk_products
FOR SELECT
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE 
    user_id = auth.uid()::text OR 
    contact_name = (auth.jwt() ->> 'email') OR
    contact_name = (auth.jwt() -> 'user_metadata' ->> 'email')
  )
);

CREATE POLICY "Users can insert their own bulk products"
ON public.bulk_products
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT id FROM tenants WHERE 
    user_id = auth.uid()::text OR 
    contact_name = (auth.jwt() ->> 'email') OR
    contact_name = (auth.jwt() -> 'user_metadata' ->> 'email')
  )
);

CREATE POLICY "Users can update their own bulk products"
ON public.bulk_products
FOR UPDATE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE 
    user_id = auth.uid()::text OR 
    contact_name = (auth.jwt() ->> 'email') OR
    contact_name = (auth.jwt() -> 'user_metadata' ->> 'email')
  )
);

CREATE POLICY "Users can delete their own bulk products"
ON public.bulk_products
FOR DELETE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE 
    user_id = auth.uid()::text OR 
    contact_name = (auth.jwt() ->> 'email') OR
    contact_name = (auth.jwt() -> 'user_metadata' ->> 'email')
  )
);

-- Grant permissions just in case
GRANT ALL ON public.bulk_products TO authenticated;
GRANT ALL ON public.bulk_products TO service_role;
