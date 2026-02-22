-- ============================================
-- COMPREHENSIVE SECURITY FIX
-- Fix all 171 Supabase Security Alerts
-- ============================================

-- This script will:
-- 1. Drop all existing conflicting RLS policies
-- 2. Create clean, granular policies using Supabase Auth
-- 3. Ensure RLS is enabled on all tables
-- 4. Add performance indexes

-- ============================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- ============================================

-- Tenants
DROP POLICY IF EXISTS "Users can access their own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can register their own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can update their own tenant" ON tenants;
DROP POLICY IF EXISTS "Enable all access for users based on tenant_id" ON tenants;

-- Products
DROP POLICY IF EXISTS "Users can access their own products" ON products;
DROP POLICY IF EXISTS "Users can view their own products" ON products;
DROP POLICY IF EXISTS "Users can insert their own products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;
DROP POLICY IF EXISTS "Enable all access for products based on tenant_id" ON products;

-- Sales
DROP POLICY IF EXISTS "Users can access their own sales" ON sales;
DROP POLICY IF EXISTS "Users can view their own sales" ON sales;
DROP POLICY IF EXISTS "Users can insert their own sales" ON sales;
DROP POLICY IF EXISTS "Users can update their own sales" ON sales;
DROP POLICY IF EXISTS "Users can delete their own sales" ON sales;
DROP POLICY IF EXISTS "Enable all access for sales based on tenant_id" ON sales;

-- Cash Sessions
DROP POLICY IF EXISTS "Users can access their own sessions" ON cash_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON cash_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON cash_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON cash_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON cash_sessions;
DROP POLICY IF EXISTS "Enable all access for cash_sessions based on tenant_id" ON cash_sessions;

-- Settings
DROP POLICY IF EXISTS "Users can access their own settings" ON settings;
DROP POLICY IF EXISTS "Users can view their own settings" ON settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON settings;
DROP POLICY IF EXISTS "Enable all access for settings based on tenant_id" ON settings;

-- Suppliers
DROP POLICY IF EXISTS "Users can access their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can view their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can insert their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can update their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can delete their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Enable all access for suppliers based on tenant_id" ON suppliers;

-- Bulk Products
DROP POLICY IF EXISTS "Users can access their own bulk products" ON bulk_products;
DROP POLICY IF EXISTS "Users can view their own bulk products" ON bulk_products;
DROP POLICY IF EXISTS "Users can insert their own bulk products" ON bulk_products;
DROP POLICY IF EXISTS "Users can update their own bulk products" ON bulk_products;
DROP POLICY IF EXISTS "Users can delete their own bulk products" ON bulk_products;
DROP POLICY IF EXISTS "Enable all access for bulk_products based on tenant_id" ON bulk_products;

-- Stock Movements
DROP POLICY IF EXISTS "Users can access their own stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Users can view their own stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Users can insert their own stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Users can update their own stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Users can delete their own stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Enable all access for stock_movements based on tenant_id" ON stock_movements;

-- ============================================
-- STEP 3: CREATE CLEAN RLS POLICIES
-- ============================================

-- ============================================
-- TENANTS TABLE
-- ============================================

CREATE POLICY "tenants_select_policy"
ON tenants FOR SELECT
USING (user_id::uuid = auth.uid());

CREATE POLICY "tenants_insert_policy"
ON tenants FOR INSERT
WITH CHECK (user_id::uuid = auth.uid());

CREATE POLICY "tenants_update_policy"
ON tenants FOR UPDATE
USING (user_id::uuid = auth.uid())
WITH CHECK (user_id::uuid = auth.uid());

CREATE POLICY "tenants_delete_policy"
ON tenants FOR DELETE
USING (user_id::uuid = auth.uid());

-- ============================================
-- PRODUCTS TABLE
-- ============================================

CREATE POLICY "products_select_policy"
ON products FOR SELECT
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "products_insert_policy"
ON products FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "products_update_policy"
ON products FOR UPDATE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "products_delete_policy"
ON products FOR DELETE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

-- ============================================
-- SALES TABLE
-- ============================================

CREATE POLICY "sales_select_policy"
ON sales FOR SELECT
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "sales_insert_policy"
ON sales FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "sales_update_policy"
ON sales FOR UPDATE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "sales_delete_policy"
ON sales FOR DELETE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

-- ============================================
-- CASH SESSIONS TABLE
-- ============================================

CREATE POLICY "cash_sessions_select_policy"
ON cash_sessions FOR SELECT
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "cash_sessions_insert_policy"
ON cash_sessions FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "cash_sessions_update_policy"
ON cash_sessions FOR UPDATE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "cash_sessions_delete_policy"
ON cash_sessions FOR DELETE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

-- ============================================
-- SETTINGS TABLE
-- ============================================

CREATE POLICY "settings_select_policy"
ON settings FOR SELECT
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "settings_insert_policy"
ON settings FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "settings_update_policy"
ON settings FOR UPDATE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "settings_delete_policy"
ON settings FOR DELETE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

-- ============================================
-- SUPPLIERS TABLE
-- ============================================

CREATE POLICY "suppliers_select_policy"
ON suppliers FOR SELECT
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "suppliers_insert_policy"
ON suppliers FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "suppliers_update_policy"
ON suppliers FOR UPDATE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "suppliers_delete_policy"
ON suppliers FOR DELETE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

-- ============================================
-- BULK PRODUCTS TABLE
-- ============================================

CREATE POLICY "bulk_products_select_policy"
ON bulk_products FOR SELECT
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "bulk_products_insert_policy"
ON bulk_products FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "bulk_products_update_policy"
ON bulk_products FOR UPDATE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "bulk_products_delete_policy"
ON bulk_products FOR DELETE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

-- ============================================
-- STOCK MOVEMENTS TABLE
-- ============================================

CREATE POLICY "stock_movements_select_policy"
ON stock_movements FOR SELECT
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "stock_movements_insert_policy"
ON stock_movements FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "stock_movements_update_policy"
ON stock_movements FOR UPDATE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

CREATE POLICY "stock_movements_delete_policy"
ON stock_movements FOR DELETE
USING (
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
  )
);

-- ============================================
-- STEP 4: CREATE PERFORMANCE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_tenant_id ON cash_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_settings_tenant_id ON settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bulk_products_tenant_id ON bulk_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_id ON stock_movements(tenant_id);

-- ============================================
-- STEP 5: VERIFICATION QUERIES
-- ============================================

-- Verify RLS is enabled
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verify policies created
SELECT 
  tablename, 
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Count policies per table (should be 4 each)
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- DONE! All security issues should be resolved
-- ============================================

-- Expected results:
-- - 8 tables with RLS enabled
-- - 32 total policies (4 per table)
-- - 0 security alerts in Supabase Dashboard
