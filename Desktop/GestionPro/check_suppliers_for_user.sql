-- Verificar proveedores para el usuario fmurtagh1981+2@gmail.com

-- 1. Verificar el usuario y su tenant
SELECT 
    u.id as user_id,
    u.email,
    t.id as tenant_id,
    t.business_name
FROM auth.users u
LEFT JOIN tenants t ON t.user_id = u.id
WHERE u.email = 'fmurtagh1981+2@gmail.com';

-- 2. Verificar proveedores existentes para este tenant
SELECT 
    s.*
FROM suppliers s
JOIN tenants t ON s.tenant_id = t.id
JOIN auth.users u ON t.user_id = u.id
WHERE u.email = 'fmurtagh1981+2@gmail.com';

-- 3. Verificar políticas RLS en la tabla suppliers
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'suppliers';
