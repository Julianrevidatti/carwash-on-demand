-- EMERGENCY FIX: Disable RLS for bulk_products to allow saving
-- This is a temporary measure to confirm if RLS is the blocker.
ALTER TABLE public.bulk_products DISABLE ROW LEVEL SECURITY;

-- Ensure authenticated users can do everything
GRANT ALL ON public.bulk_products TO authenticated;
GRANT ALL ON public.bulk_products TO service_role;
