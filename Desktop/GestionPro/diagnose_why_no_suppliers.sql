-- ============================================
-- DIAGNÓSTICO COMPLETO: Por qué no aparecen los proveedores
-- ============================================

-- 1. Verificar el user_id actual del tenant
SELECT 
    t.id as tenant_id,
    t.user_id,
    t.business_name,
    CASE 
        WHEN t.user_id LIKE 'user_%' THEN 'CLERK (ANTIGUO)'
        ELSE 'SUPABASE (NUEVO)'
    END as tipo_user_id
FROM tenants t
WHERE t.id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';

-- 2. Verificar el UUID del usuario de Supabase
SELECT 
    id as supabase_user_id,
    email,
    created_at
FROM auth.users
WHERE email = 'fmurtagh1981+2@gmail.com';

-- 3. Verificar proveedores y su tenant_id
SELECT 
    COUNT(*) as total_proveedores,
    tenant_id
FROM suppliers
WHERE tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2'
GROUP BY tenant_id;

-- 4. Verificar políticas RLS en suppliers
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'suppliers';

-- 5. Probar query que usa la aplicación (simulando auth.uid())
-- IMPORTANTE: Reemplaza 'TU_SUPABASE_UUID' con el UUID del paso 2
DO $$
DECLARE
    v_supabase_user_id UUID := 'TU_SUPABASE_UUID'; -- REEMPLAZAR CON EL UUID DEL PASO 2
    v_tenant_id UUID;
    v_suppliers_count INT;
BEGIN
    -- Simular lo que hace la app: buscar tenant por user_id
    SELECT id INTO v_tenant_id
    FROM tenants
    WHERE user_id = v_supabase_user_id::text
    LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE NOTICE '❌ NO SE ENCONTRÓ TENANT para user_id: %', v_supabase_user_id;
        RAISE NOTICE '⚠️ ESTE ES EL PROBLEMA: El tenant tiene user_id de Clerk, no de Supabase';
    ELSE
        RAISE NOTICE '✓ Tenant encontrado: %', v_tenant_id;
        
        -- Buscar proveedores
        SELECT COUNT(*) INTO v_suppliers_count
        FROM suppliers
        WHERE tenant_id = v_tenant_id;
        
        RAISE NOTICE '✓ Proveedores encontrados: %', v_suppliers_count;
    END IF;
END $$;
