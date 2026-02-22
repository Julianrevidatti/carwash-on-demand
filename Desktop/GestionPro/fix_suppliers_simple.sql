-- ============================================
-- SOLUCIÓN SIMPLE: Crear proveedores directamente en el tenant
-- ============================================
-- Este script NO depende del user_id, solo usa el tenant_id

DO $$
DECLARE
  target_tenant_id UUID := 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';
  suppliers_count INT;
  products_count INT;
BEGIN
  -- ============================================
  -- PASO 1: Verificar que el tenant existe
  -- ============================================
  
  IF NOT EXISTS (SELECT 1 FROM tenants WHERE id = target_tenant_id) THEN
    RAISE EXCEPTION 'ERROR: No se encontró tenant con ID: %', target_tenant_id;
  END IF;
  
  RAISE NOTICE '✓ Tenant encontrado: %', target_tenant_id;
  
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
  
  RAISE NOTICE '🏪 Proveedores actuales: %', suppliers_count;
  
  -- ============================================
  -- PASO 4: Crear proveedores si no existen
  -- ============================================
  
  IF suppliers_count = 0 THEN
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
      );
    
    GET DIAGNOSTICS suppliers_count = ROW_COUNT;
    RAISE NOTICE '✅ Proveedores creados: %', suppliers_count;
  ELSE
    RAISE NOTICE '✅ El tenant ya tiene % proveedores', suppliers_count;
  END IF;
  
  -- ============================================
  -- PASO 5: Verificación final
  -- ============================================
  
  SELECT COUNT(*) INTO suppliers_count
  FROM suppliers
  WHERE tenant_id = target_tenant_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '✅ COMPLETADO';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '🏢 Tenant ID: %', target_tenant_id;
  RAISE NOTICE '📦 Productos: %', products_count;
  RAISE NOTICE '🏪 Proveedores: %', suppliers_count;
  RAISE NOTICE '';
  
END $$;

-- Mostrar los proveedores creados
SELECT 
    s.id,
    s.name,
    s.contact_info,
    s.visit_frequency,
    s.created_at
FROM suppliers s
WHERE s.tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2'
ORDER BY s.name;
