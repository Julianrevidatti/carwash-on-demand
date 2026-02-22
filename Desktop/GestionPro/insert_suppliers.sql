-- Script para insertar proveedores iniciales
-- IMPORTANTE: Reemplaza 'TU_TENANT_ID_AQUI' con tu tenant_id real

-- Primero, verifica tu tenant_id ejecutando:
-- SELECT id, user_id, business_name FROM tenants WHERE user_id = auth.uid();

-- Luego reemplaza el valor abajo y ejecuta el resto del script

-- Variable para tu tenant_id (REEMPLAZAR CON TU VALOR REAL)
DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Obtener el tenant_id del usuario actual
    SELECT id INTO v_tenant_id 
    FROM tenants 
    WHERE user_id = auth.uid() 
    LIMIT 1;
    
    -- Si no se encuentra, mostrar error
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró un tenant para el usuario actual. Por favor, inicia sesión primero.';
    END IF;
    
    -- Insertar proveedores iniciales
    INSERT INTO public.suppliers (id, tenant_id, name, contact_info, visit_frequency, created_at)
    VALUES 
        (
            gen_random_uuid(), 
            v_tenant_id, 
            'Distribuidora Norte', 
            '11-1234-5678', 
            'Lunes', 
            NOW()
        ),
        (
            gen_random_uuid(), 
            v_tenant_id, 
            'Aguas Argentinas', 
            '11-8765-4321', 
            'Jueves', 
            NOW()
        )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Proveedores insertados correctamente para tenant_id: %', v_tenant_id;
END $$;

-- Verificar que los proveedores se insertaron correctamente
SELECT 
    s.id,
    s.name,
    s.contact_info,
    s.visit_frequency,
    s.created_at,
    t.business_name as negocio
FROM suppliers s
JOIN tenants t ON s.tenant_id = t.id
WHERE s.tenant_id IN (
    SELECT id FROM tenants WHERE user_id = auth.uid()
);
