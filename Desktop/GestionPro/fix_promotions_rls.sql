-- FIX PROMOTIONS RLS & SCHEMA (v2)
-- ==============================================

-- 1. Ensure Table Permissions (RLS)
-- Breakdown: 
-- - Public can READ (already exists, but we ensure it covers everything needed)
-- - Authenticated Users (Tenants) can CRUD (Create, Read, Update, Delete) their OWN rows.

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts/confusion
DROP POLICY IF EXISTS "Public access to promotions" ON promotions;
DROP POLICY IF EXISTS "Public can view active promotions" ON promotions;
DROP POLICY IF EXISTS "Users can manage their own promotions" ON promotions;
DROP POLICY IF EXISTS "Authenticated users can insert promotions" ON promotions;
DROP POLICY IF EXISTS "Authenticated users can select promotions" ON promotions;
DROP POLICY IF EXISTS "Authenticated users can update promotions" ON promotions;
DROP POLICY IF EXISTS "Authenticated users can delete promotions" ON promotions;

-- Policy 1: Public Read Access (For Catalog)
CREATE POLICY "Public access to promotions"
ON promotions FOR SELECT
TO public
USING (true);

-- Policy 2: Tenant Full Access (For Admin Panel)
-- Allows Insert, Update, Select, Delete if they own the record (tenant_id matches)
-- Fix: Use auth.uid()::text or (auth.jwt() ->> 'sub') to match text user_id column in tenants table.
CREATE POLICY "Users can manage their own promotions"
ON promotions
FOR ALL
TO authenticated
USING (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = (auth.jwt() ->> 'sub')
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = (auth.jwt() ->> 'sub')
    )
);


-- 2. Ensure Missing Columns Exist
-- The 'requirements' column is used for Weighted Combos but might be missing.
DO $$
BEGIN
    -- Check for 'requirements' (JSONB)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'requirements') THEN
        ALTER TABLE promotions ADD COLUMN requirements JSONB;
    END IF;

    -- Check for 'type' (TEXT) - Just in case
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'type') THEN
        ALTER TABLE promotions ADD COLUMN type TEXT DEFAULT 'standard';
    END IF;

    -- Check for 'quantity_required' (INTEGER) - Just in case
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'quantity_required') THEN
        ALTER TABLE promotions ADD COLUMN quantity_required INTEGER;
    END IF;
END $$;

-- 3. Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'promotions';

SELECT count(*) as policies_active FROM pg_policies WHERE tablename = 'promotions';
