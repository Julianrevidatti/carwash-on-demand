-- Verificar el estado actual después de ejecutar update_tenant_user_id.sql

-- 1. Verificar el user_id del tenant
SELECT 
    t.id as tenant_id,
    t.user_id,
    t.business_name,
    CASE 
        WHEN t.user_id LIKE 'user_%' THEN '❌ CLERK (no actualizado)'
        ELSE '✅ SUPABASE (actualizado)'
    END as estado
FROM tenants t
WHERE t.id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';

-- 2. Verificar el UUID del usuario de Supabase
SELECT 
    id as supabase_uuid,
    email
FROM auth.users
WHERE email = 'fmurtagh1981+2@gmail.com';

-- 3. Verificar todos los tenants
SELECT 
    t.id as tenant_id,
    t.business_name,
    t.user_id
FROM tenants
ORDER BY t.created_at DESC
LIMIT 5;

-- 4. Contar proveedores en el tenant
SELECT 
    COUNT(*) as total_proveedores
FROM suppliers
WHERE tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';

-- 5. Verificar políticas RLS
SELECT 
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE tablename = 'suppliers';
