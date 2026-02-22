-- ============================================
-- SCRIPT DE REPARACIÓN: TABLA SALE_ITEMS (FIX GRANEL)
-- ============================================

-- 1. Crear tabla si no existe (SIN FOREIGN KEY a products para permitir Granel)
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID, -- SIN REFERENCES products(id) para permitir IDs de granel
    name TEXT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL, -- DECIMAL PARA GRANEL (ej: 0.500)
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Eliminar la Foreign Key "sale_items_product_id_fkey" si existe (para corregir tablas existentes)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'sale_items_product_id_fkey' 
        AND table_name = 'sale_items'
    ) THEN
        ALTER TABLE public.sale_items DROP CONSTRAINT sale_items_product_id_fkey;
    END IF;
END $$;

-- 3. Asegurar que las columnas existan y corregir tipos
DO $$
BEGIN
    -- Añadir columna name si falta
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sale_items' AND column_name='name') THEN
        ALTER TABLE public.sale_items ADD COLUMN name TEXT;
    END IF;

    -- CORRECCIÓN CRÍTICA: Cambiar quantity a DECIMAL si era INTEGER
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sale_items' AND column_name='quantity' AND data_type='integer') THEN
        ALTER TABLE public.sale_items ALTER COLUMN quantity TYPE DECIMAL(10,3);
    END IF;

    -- Asegurar cost
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sale_items' AND column_name='cost') THEN
        ALTER TABLE public.sale_items ADD COLUMN cost DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Asegurar tenant_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sale_items' AND column_name='tenant_id') THEN
        ALTER TABLE public.sale_items ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Habilitar RLS
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- 5. Actualizar Políticas de Seguridad
DROP POLICY IF EXISTS "Users can insert their own sale items" ON public.sale_items;
CREATE POLICY "Users can insert their own sale items"
ON public.sale_items
FOR INSERT
WITH CHECK (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = (auth.jwt() ->> 'sub')::text
    )
);

DROP POLICY IF EXISTS "Users can select their own sale items" ON public.sale_items;
CREATE POLICY "Users can select their own sale items"
ON public.sale_items
FOR SELECT
USING (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = (auth.jwt() ->> 'sub')::text
    )
);

-- 6. Crear Índices
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_tenant_id ON public.sale_items(tenant_id);

-- 7. Verificar
SELECT 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'sale_items' 
    AND column_name = 'quantity';
