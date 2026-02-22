-- ============================================
-- MIGRACIÓN DE CLERK A SUPABASE AUTH
-- Crear tablas faltantes y actualizar RLS
-- ============================================

-- IMPORTANTE: Ejecuta este script EN ORDEN en Supabase SQL Editor

-- ============================================
-- PASO 1: Verificar qué tablas existen
-- ============================================

-- Ejecuta esto primero para ver qué tablas tienes:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- ============================================
-- PASO 2: Crear tablas faltantes (si no existen)
-- ============================================

-- Tabla SETTINGS (si no existe)
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    mercadopago_access_token TEXT,
    mercadopago_user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PASO 3: Habilitar RLS en todas las tablas
-- ============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Solo si existen:
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'settings') THEN
        ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bulk_products') THEN
        ALTER TABLE bulk_products ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stock_movements') THEN
        ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================
-- PASO 4: Actualizar Políticas RLS
-- ============================================

-- 1. TENANTS
DROP POLICY IF EXISTS "Users can access their own tenant" ON tenants;

CREATE POLICY "Users can access their own tenant"
ON tenants FOR ALL
USING (auth.uid() = user_id::uuid);

-- 2. PRODUCTS
DROP POLICY IF EXISTS "Users can access their own products" ON products;

CREATE POLICY "Users can access their own products"
ON products FOR ALL
USING (tenant_id IN (
  SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
));

-- 3. SALES
DROP POLICY IF EXISTS "Users can access their own sales" ON sales;

CREATE POLICY "Users can access their own sales"
ON sales FOR ALL
USING (tenant_id IN (
  SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
));

-- 4. CASH SESSIONS
DROP POLICY IF EXISTS "Users can access their own sessions" ON cash_sessions;

CREATE POLICY "Users can access their own sessions"
ON cash_sessions FOR ALL
USING (tenant_id IN (
  SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
));

-- 5. SUPPLIERS
DROP POLICY IF EXISTS "Users can access their own suppliers" ON suppliers;

CREATE POLICY "Users can access their own suppliers"
ON suppliers FOR ALL
USING (tenant_id IN (
  SELECT id FROM tenants WHERE user_id::uuid = auth.uid()
));

-- 6. SETTINGS (solo si existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'settings') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Users can access their own settings" ON settings';
        EXECUTE 'CREATE POLICY "Users can access their own settings" ON settings FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE user_id::uuid = auth.uid()))';
    END IF;
END $$;

-- 7. BULK PRODUCTS (solo si existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bulk_products') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Users can access their own bulk products" ON bulk_products';
        EXECUTE 'CREATE POLICY "Users can access their own bulk products" ON bulk_products FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE user_id::uuid = auth.uid()))';
    END IF;
END $$;

-- 8. STOCK MOVEMENTS (solo si existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stock_movements') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Users can access their own stock movements" ON stock_movements';
        EXECUTE 'CREATE POLICY "Users can access their own stock movements" ON stock_movements FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE user_id::uuid = auth.uid()))';
    END IF;
END $$;

-- ============================================
-- PASO 5: Verificar Políticas
-- ============================================

-- Ver todas las políticas creadas
SELECT 
  tablename, 
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- ¡LISTO! Políticas RLS actualizadas
-- ============================================

-- Notas:
-- - Las políticas ahora usan auth.uid() de Supabase
-- - Ya no necesitas JWT templates de Clerk
-- - RLS funciona automáticamente con Supabase Auth
-- - Solo se crean políticas para tablas que existen
