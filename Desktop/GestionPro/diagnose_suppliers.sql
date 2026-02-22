-- ============================================
-- DIAGNÓSTICO: Verificar estado de proveedores
-- ============================================
-- Este script verifica dónde están los proveedores

-- 1. Verificar proveedores en el tenant que tiene los productos
SELECT 
    'Proveedores en tenant con productos' as descripcion,
    COUNT(*) as cantidad
FROM suppliers
WHERE tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';

-- 2. Verificar productos en ese mismo tenant
SELECT 
    'Productos en tenant' as descripcion,
    COUNT(*) as cantidad
FROM products
WHERE tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';

-- 3. Verificar el user_id del tenant
SELECT 
    t.id as tenant_id,
    t.user_id,
    t.business_name,
    u.email as usuario_email
FROM tenants t
LEFT JOIN auth.users u ON t.user_id = u.id
WHERE t.id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';

-- 4. Listar todos los proveedores que existen en la base de datos
SELECT 
    s.id,
    s.name,
    s.contact_info,
    s.visit_frequency,
    s.tenant_id,
    t.business_name,
    u.email as usuario
FROM suppliers s
LEFT JOIN tenants t ON s.tenant_id = t.id
LEFT JOIN auth.users u ON t.user_id = u.id
ORDER BY s.created_at DESC;

-- 5. Verificar si hay proveedores huérfanos (sin tenant válido)
SELECT 
    s.id,
    s.name,
    s.tenant_id,
    CASE 
        WHEN t.id IS NULL THEN 'HUÉRFANO - Tenant no existe'
        ELSE 'OK'
    END as estado
FROM suppliers s
LEFT JOIN tenants t ON s.tenant_id = t.id;
