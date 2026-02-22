-- Create suppliers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_info TEXT,
    visit_frequency TEXT,
    tenant_id UUID NOT NULL, -- references tenants(id) ideally, but keeping it loose for now to avoid FK errors if table name differs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own suppliers" ON public.suppliers;
CREATE POLICY "Users can view their own suppliers"
ON public.suppliers
FOR SELECT
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE 
    user_id = auth.uid()::text OR 
    contact_name = (auth.jwt() ->> 'email') OR
    contact_name = (auth.jwt() -> 'user_metadata' ->> 'email')
  )
);

DROP POLICY IF EXISTS "Users can insert their own suppliers" ON public.suppliers;
CREATE POLICY "Users can insert their own suppliers"
ON public.suppliers
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT id FROM tenants WHERE 
    user_id = auth.uid()::text OR 
    contact_name = (auth.jwt() ->> 'email') OR
    contact_name = (auth.jwt() -> 'user_metadata' ->> 'email')
  )
);

DROP POLICY IF EXISTS "Users can update their own suppliers" ON public.suppliers;
CREATE POLICY "Users can update their own suppliers"
ON public.suppliers
FOR UPDATE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE 
    user_id = auth.uid()::text OR 
    contact_name = (auth.jwt() ->> 'email') OR
    contact_name = (auth.jwt() -> 'user_metadata' ->> 'email')
  )
);

DROP POLICY IF EXISTS "Users can delete their own suppliers" ON public.suppliers;
CREATE POLICY "Users can delete their own suppliers"
ON public.suppliers
FOR DELETE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE 
    user_id = auth.uid()::text OR 
    contact_name = (auth.jwt() ->> 'email') OR
    contact_name = (auth.jwt() -> 'user_metadata' ->> 'email')
  )
);
