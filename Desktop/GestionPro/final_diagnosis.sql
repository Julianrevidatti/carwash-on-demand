-- DIAGNÓSTICO FINAL: Verificar TODO el flujo de datos

-- 1. Verificar que el tenant tiene el UUID correcto
SELECT 
    'PASO 1: Tenant' as paso,
    t.id as tenant_id,
    t.user_id,
    t.business_name,
    CASE 
        WHEN t.user_id LIKE 'user_%' THEN '❌ ERROR: Todavía es Clerk'
        ELSE '✅ OK: Es UUID de Supabase'
    END as estado
FROM tenants t
WHERE t.id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';

-- 2. Verificar el UUID del usuario de Supabase
SELECT 
    'PASO 2: Usuario Supabase' as paso,
    id as supabase_uuid,
    email
FROM auth.users
WHERE email = 'fmurtagh1981+2@gmail.com';

-- 3. Verificar que coinciden
SELECT 
    'PASO 3: Coincidencia' as paso,
    CASE 
        WHEN t.user_id = u.id::text THEN '✅ OK: user_id coincide con UUID'
        ELSE '❌ ERROR: NO coinciden'
    END as estado,
    t.user_id as tenant_user_id,
    u.id::text as supabase_uuid
FROM tenants t
CROSS JOIN auth.users u
WHERE t.id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2'
  AND u.email = 'fmurtagh1981+2@gmail.com';

-- 4. Contar proveedores en el tenant
SELECT 
    'PASO 4: Proveedores' as paso,
    COUNT(*) as total_proveedores,
    tenant_id
FROM suppliers
WHERE tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2'
GROUP BY tenant_id;

-- 5. Listar algunos proveedores
SELECT 
    'PASO 5: Lista de Proveedores' as paso,
    s.id,
    s.name,
    s.tenant_id
FROM suppliers s
WHERE s.tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2'
ORDER BY s.name
LIMIT 5;

-- 6. Verificar políticas RLS en suppliers
SELECT 
    'PASO 6: Políticas RLS' as paso,
    policyname,
    cmd as operacion,
    CASE 
        WHEN qual IS NOT NULL THEN 'Tiene restricción'
        ELSE 'Sin restricción'
    END as tiene_filtro
FROM pg_policies
WHERE tablename = 'suppliers';

-- 7. PROBAR LA QUERY QUE USA LA APP
-- Simular: SELECT * FROM suppliers WHERE tenant_id = 'dd0040aa...'
SELECT 
    'PASO 7: Query de la App' as paso,
    COUNT(*) as proveedores_que_veria_la_app
FROM suppliers
WHERE tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';
