-- Insertar proveedores directamente para fmurtagh1981+2@gmail.com
-- Este script es más directo y no requiere autenticación activa

DO $$
DECLARE
    v_tenant_id UUID;
    v_user_id UUID;
BEGIN
    -- Obtener el user_id y tenant_id del usuario
    SELECT u.id, t.id INTO v_user_id, v_tenant_id
    FROM auth.users u
    LEFT JOIN tenants t ON t.user_id = u.id
    WHERE u.email = 'fmurtagh1981+2@gmail.com'
    LIMIT 1;
    
    -- Verificar que se encontró el usuario
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el usuario fmurtagh1981+2@gmail.com';
    END IF;
    
    -- Verificar que se encontró el tenant
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró un tenant para el usuario fmurtagh1981+2@gmail.com';
    END IF;
    
    RAISE NOTICE 'Usuario encontrado: %', v_user_id;
    RAISE NOTICE 'Tenant encontrado: %', v_tenant_id;
    
    -- Eliminar proveedores existentes para este tenant (opcional, comentar si no quieres borrar)
    -- DELETE FROM suppliers WHERE tenant_id = v_tenant_id;
    
    -- Insertar proveedores iniciales
    INSERT INTO public.suppliers (id, tenant_id, name, contact_info, visit_frequency, created_at, updated_at)
    VALUES 
        (
            gen_random_uuid(), 
            v_tenant_id, 
            'Distribuidora Norte', 
            '11-1234-5678', 
            'Lunes', 
            NOW(),
            NOW()
        ),
        (
            gen_random_uuid(), 
            v_tenant_id, 
            'Aguas Argentinas', 
            '11-8765-4321', 
            'Jueves', 
            NOW(),
            NOW()
        )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Proveedores insertados correctamente';
    
    -- Mostrar los proveedores insertados
    RAISE NOTICE 'Total de proveedores para este tenant: %', (SELECT COUNT(*) FROM suppliers WHERE tenant_id = v_tenant_id);
END $$;

-- Verificar que los proveedores se insertaron correctamente
SELECT 
    s.id,
    s.name,
    s.contact_info,
    s.visit_frequency,
    s.created_at,
    t.business_name as negocio,
    u.email as usuario
FROM suppliers s
JOIN tenants t ON s.tenant_id = t.id
JOIN auth.users u ON t.user_id = u.id
WHERE u.email = 'fmurtagh1981+2@gmail.com'
ORDER BY s.created_at DESC;
