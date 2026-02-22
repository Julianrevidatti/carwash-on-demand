-- ============================================
-- CORRECCIÓN: Asegurar que proveedores estén en el tenant correcto
-- ============================================
-- Este script verifica y corrige el problema de proveedores faltantes

DO $$
DECLARE
  target_tenant_id UUID := 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';
  target_email TEXT := 'fmurtagh1981+2@gmail.com';
  current_user_id UUID;
  suppliers_count INT;
  products_count INT;
BEGIN
  -- ============================================
  -- PASO 1: Verificar que el tenant existe y tiene el user_id correcto
  -- ============================================
  
  SELECT user_id INTO current_user_id
  FROM tenants
  WHERE id = target_tenant_id;
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'ERROR: No se encontró tenant con ID: %', target_tenant_id;
  END IF;
  
  RAISE NOTICE '✓ Tenant encontrado: %', target_tenant_id;
  RAISE NOTICE '✓ User ID del tenant: %', current_user_id;
  
  -- Verificar que el user_id corresponde al email correcto
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = current_user_id::uuid AND email = target_email
  ) THEN
    RAISE WARNING '⚠️ El tenant NO pertenece a %', target_email;
    RAISE NOTICE 'User ID actual: %', current_user_id;
    RAISE NOTICE 'Ejecuta primero el script change_user_uuid.sql';
    RETURN;
  END IF;
  
  RAISE NOTICE '✓ Tenant pertenece a: %', target_email;
  
  -- ============================================
  -- PASO 2: Verificar productos en el tenant
  -- ============================================
  
  SELECT COUNT(*) INTO products_count
  FROM products
  WHERE tenant_id = target_tenant_id;
  
  RAISE NOTICE '📦 Productos en tenant: %', products_count;
  
  -- ============================================
  -- PASO 3: Verificar proveedores en el tenant
  -- ============================================
  
  SELECT COUNT(*) INTO suppliers_count
  FROM suppliers
  WHERE tenant_id = target_tenant_id;
  
  RAISE NOTICE '🏪 Proveedores en tenant: %', suppliers_count;
  
  -- ============================================
  -- PASO 4: Si no hay proveedores, crear los iniciales
  -- ============================================
  
  IF suppliers_count = 0 THEN
    RAISE NOTICE '⚠️ No hay proveedores en el tenant';
    RAISE NOTICE '🔄 Creando proveedores iniciales...';
    
    INSERT INTO suppliers (id, tenant_id, name, contact_info, visit_frequency, created_at, updated_at)
    VALUES 
      (
        gen_random_uuid(),
        target_tenant_id,
        'Distribuidora Norte',
        '11-1234-5678',
        'Lunes',
        NOW(),
        NOW()
      ),
      (
        gen_random_uuid(),
        target_tenant_id,
        'Aguas Argentinas',
        '11-8765-4321',
        'Jueves',
        NOW(),
        NOW()
      )
    ON CONFLICT (id) DO NOTHING;
    
    GET DIAGNOSTICS suppliers_count = ROW_COUNT;
    RAISE NOTICE '✅ Proveedores creados: %', suppliers_count;
  ELSE
    RAISE NOTICE '✅ El tenant ya tiene proveedores';
  END IF;
  
  -- ============================================
  -- PASO 5: Verificación final
  -- ============================================
  
  SELECT COUNT(*) INTO suppliers_count
  FROM suppliers
  WHERE tenant_id = target_tenant_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '✅ VERIFICACIÓN COMPLETADA';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '📧 Email: %', target_email;
  RAISE NOTICE '🏢 Tenant ID: %', target_tenant_id;
  RAISE NOTICE '📦 Productos: %', products_count;
  RAISE NOTICE '🏪 Proveedores: %', suppliers_count;
  RAISE NOTICE '';
  
END $$;

-- Mostrar los proveedores del usuario
SELECT 
    s.id,
    s.name,
    s.contact_info,
    s.visit_frequency,
    s.created_at
FROM suppliers s
JOIN tenants t ON s.tenant_id = t.id
JOIN auth.users u ON t.user_id::uuid = u.id
WHERE u.email = 'fmurtagh1981+2@gmail.com'
ORDER BY s.name;
