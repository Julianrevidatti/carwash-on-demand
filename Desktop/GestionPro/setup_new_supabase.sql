-- ============================================
-- SCRIPT COMPLETO PARA NUEVO PROYECTO SUPABASE
-- GestionPro - Configuración Inicial
-- ============================================

-- PASO 1: CREAR TABLAS PRINCIPALES
-- ============================================

-- 1. Tabla de Tenants (Clientes SaaS)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    pricing_plan TEXT NOT NULL DEFAULT 'FREE',
    next_due_date TIMESTAMP WITH TIME ZONE,
    user_id TEXT UNIQUE, -- Clerk User ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Productos
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    barcode TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    category TEXT,
    supplier_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Ventas
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    total DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    client_id UUID,
    session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Sesiones de Caja
CREATE TABLE IF NOT EXISTS public.cash_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    initial_float DECIMAL(10,2) NOT NULL,
    final_cash DECIMAL(10,2),
    status TEXT NOT NULL DEFAULT 'OPEN',
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de Configuración
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    mercadopago_access_token TEXT,
    mercadopago_user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabla de Proveedores
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabla de Productos a Granel
CREATE TABLE IF NOT EXISTS public.bulk_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_per_kg DECIMAL(10,2) NOT NULL,
    current_stock_kg DECIMAL(10,3) DEFAULT 0,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabla de Movimientos de Stock
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'IN' o 'OUT'
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 2: HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- PASO 3: CREAR POLÍTICAS DE SEGURIDAD
-- ============================================

-- Políticas para Tenants
CREATE POLICY "Users can access their own tenant"
ON tenants
FOR ALL
USING (user_id = (auth.jwt() ->> 'sub')::text);

-- Políticas para Products
CREATE POLICY "Users can access their own products"
ON products
FOR ALL
USING (tenant_id IN (
    SELECT id FROM tenants WHERE user_id = (auth.jwt() ->> 'sub')::text
));

-- Políticas para Sales
CREATE POLICY "Users can access their own sales"
ON sales
FOR ALL
USING (tenant_id IN (
    SELECT id FROM tenants WHERE user_id = (auth.jwt() ->> 'sub')::text
));

-- Políticas para Cash Sessions
CREATE POLICY "Users can access their own sessions"
ON cash_sessions
FOR ALL
USING (tenant_id IN (
    SELECT id FROM tenants WHERE user_id = (auth.jwt() ->> 'sub')::text
));

-- Políticas para Settings
CREATE POLICY "Users can access their own settings"
ON settings
FOR ALL
USING (tenant_id IN (
    SELECT id FROM tenants WHERE user_id = (auth.jwt() ->> 'sub')::text
));

-- Políticas para Suppliers
CREATE POLICY "Users can access their own suppliers"
ON suppliers
FOR ALL
USING (tenant_id IN (
    SELECT id FROM tenants WHERE user_id = (auth.jwt() ->> 'sub')::text
));

-- Políticas para Bulk Products
CREATE POLICY "Users can access their own bulk products"
ON bulk_products
FOR ALL
USING (tenant_id IN (
    SELECT id FROM tenants WHERE user_id = (auth.jwt() ->> 'sub')::text
));

-- Políticas para Stock Movements
CREATE POLICY "Users can access their own stock movements"
ON stock_movements
FOR ALL
USING (tenant_id IN (
    SELECT id FROM tenants WHERE user_id = (auth.jwt() ->> 'sub')::text
));

-- PASO 4: CREAR ÍNDICES PARA MEJOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_tenant_id ON cash_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bulk_products_tenant_id ON bulk_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_id ON stock_movements(tenant_id);

-- PASO 5: CREAR FUNCIONES ÚTILES
-- ============================================

-- Función para obtener el tenant_id del usuario actual
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
    SELECT id FROM tenants 
    WHERE user_id = (auth.jwt() ->> 'sub')::text
    LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 6: CREAR TRIGGERS
-- ============================================

-- Trigger para tenants
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para products
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para suppliers
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para settings
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que todas las tablas se crearon
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Verificar políticas
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- ============================================
-- ¡LISTO! Tu base de datos está configurada
-- ============================================

-- Próximos pasos:
-- 1. Actualiza tu .env con las nuevas credenciales
-- 2. Configura el JWT con Clerk en Settings → API
-- 3. Prueba la aplicación
