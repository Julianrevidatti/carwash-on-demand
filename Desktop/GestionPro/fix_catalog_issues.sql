-- 1. Add is_active column to products if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT; 
-- (Adding image_url too just in case, as PublicCatalog uses it)

-- 2. ENABLE PUBLIC ACCESS (RLS) for Catalog

-- Drop existing policies to prevent errors
DROP POLICY IF EXISTS "Public access to tenants" ON tenants;
DROP POLICY IF EXISTS "Public access to products" ON products;
DROP POLICY IF EXISTS "Public access to promotions" ON promotions;

-- Allow public read of tenants (to see business name) - applies to logged in users too
CREATE POLICY "Public access to tenants"
ON tenants FOR SELECT
TO public
USING (true);

-- Allow public read of products
CREATE POLICY "Public access to products"
ON products FOR SELECT
TO public
USING (true);

-- Allow public read of promotions (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'promotions') THEN
        EXECUTE 'CREATE POLICY "Public access to promotions" ON promotions FOR SELECT TO anon USING (true);';
    END IF;
END
$$;

-- 3. FORCE UPDATE EXISTING PRODUCTS
-- Ensure all current products are visible (Unconditionally active for now to ensure catalog works)
UPDATE products SET is_active = true;

-- 4. OPEN/CLOSED STATUS LOGIC
-- Add is_open column to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT false;

-- Create Function to Sync Session Status to Tenant
CREATE OR REPLACE FUNCTION sync_session_status_to_tenant()
RETURNS TRIGGER AS $$
BEGIN
    -- If a session is opened (INSERT or UPDATE to OPEN)
    IF (TG_OP = 'INSERT' AND NEW.status = 'OPEN') OR (TG_OP = 'UPDATE' AND NEW.status = 'OPEN') THEN
        UPDATE tenants SET is_open = true WHERE id = NEW.tenant_id;
    
    -- If a session is closed (UPDATE to CLOSED)
    ELSIF (TG_OP = 'UPDATE' AND NEW.status = 'CLOSED') THEN
        UPDATE tenants SET is_open = false WHERE id = NEW.tenant_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger on cash_sessions
DROP TRIGGER IF EXISTS trigger_sync_session_status ON cash_sessions;
CREATE TRIGGER trigger_sync_session_status
AFTER INSERT OR UPDATE ON cash_sessions
FOR EACH ROW
EXECUTE FUNCTION sync_session_status_to_tenant();

-- Initial Sync (in case they have an open session right now)
UPDATE tenants 
SET is_open = true 
WHERE id IN (SELECT tenant_id FROM cash_sessions WHERE status = 'OPEN');

