-- ============================================
-- ARREGLAR TODAS LAS POLÍTICAS RLS
-- ============================================
-- Aplicar la misma solución a TODAS las tablas principales

-- 1. PAYMENT_METHODS
DROP POLICY IF EXISTS "Users can access their own payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can view their own payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can insert their own payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can update their own payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can delete their own payment_methods" ON payment_methods;

CREATE POLICY "Enable all access for payment_methods based on tenant_id"
ON payment_methods
FOR ALL
USING (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- 2. PRODUCTS
DROP POLICY IF EXISTS "Users can access their own products" ON products;
DROP POLICY IF EXISTS "Users can view their own products" ON products;
DROP POLICY IF EXISTS "Users can insert their own products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;

CREATE POLICY "Enable all access for products based on tenant_id"
ON products
FOR ALL
USING (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 3. CLIENTS
DROP POLICY IF EXISTS "Users can access their own clients" ON clients;
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;

CREATE POLICY "Enable all access for clients based on tenant_id"
ON clients
FOR ALL
USING (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- 4. SALES
DROP POLICY IF EXISTS "Users can access their own sales" ON sales;
DROP POLICY IF EXISTS "Users can view their own sales" ON sales;
DROP POLICY IF EXISTS "Users can insert their own sales" ON sales;

CREATE POLICY "Enable all access for sales based on tenant_id"
ON sales
FOR ALL
USING (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- 5. SETTINGS
DROP POLICY IF EXISTS "Users can access their own settings" ON settings;
DROP POLICY IF EXISTS "Users can view their own settings" ON settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON settings;

CREATE POLICY "Enable all access for settings based on tenant_id"
ON settings
FOR ALL
USING (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 6. CASH_SESSIONS
DROP POLICY IF EXISTS "Users can access their own cash_sessions" ON cash_sessions;
DROP POLICY IF EXISTS "Users can view their own cash_sessions" ON cash_sessions;
DROP POLICY IF EXISTS "Users can insert their own cash_sessions" ON cash_sessions;
DROP POLICY IF EXISTS "Users can update their own cash_sessions" ON cash_sessions;

CREATE POLICY "Enable all access for cash_sessions based on tenant_id"
ON cash_sessions
FOR ALL
USING (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
);

ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;

-- 7. INVENTORY_BATCHES
DROP POLICY IF EXISTS "Users can access their own inventory_batches" ON inventory_batches;
DROP POLICY IF EXISTS "Users can view their own inventory_batches" ON inventory_batches;
DROP POLICY IF EXISTS "Users can insert their own inventory_batches" ON inventory_batches;
DROP POLICY IF EXISTS "Users can update their own inventory_batches" ON inventory_batches;
DROP POLICY IF EXISTS "Users can delete their own inventory_batches" ON inventory_batches;

CREATE POLICY "Enable all access for inventory_batches based on tenant_id"
ON inventory_batches
FOR ALL
USING (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
);

ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;

-- 8. STOCK_MOVEMENTS
DROP POLICY IF EXISTS "Users can access their own stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "Users can view their own stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "Users can insert their own stock_movements" ON stock_movements;

CREATE POLICY "Enable all access for stock_movements based on tenant_id"
ON stock_movements
FOR ALL
USING (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- 9. BULK_PRODUCTS
DROP POLICY IF EXISTS "Users can access their own bulk_products" ON bulk_products;
DROP POLICY IF EXISTS "Users can view their own bulk_products" ON bulk_products;
DROP POLICY IF EXISTS "Users can insert their own bulk_products" ON bulk_products;
DROP POLICY IF EXISTS "Users can update their own bulk_products" ON bulk_products;
DROP POLICY IF EXISTS "Users can delete their own bulk_products" ON bulk_products;

CREATE POLICY "Enable all access for bulk_products based on tenant_id"
ON bulk_products
FOR ALL
USING (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
);

ALTER TABLE bulk_products ENABLE ROW LEVEL SECURITY;

-- Verificación final
SELECT 
    tablename,
    COUNT(*) as num_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
