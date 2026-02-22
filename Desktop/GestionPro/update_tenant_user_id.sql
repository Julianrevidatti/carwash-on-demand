-- ============================================
-- SOLUCIÓN DEFINITIVA: Actualizar user_id de Clerk a Supabase
-- ============================================

DO $$
DECLARE
  target_tenant_id UUID := 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';
  new_email TEXT := 'fmurtagh1981+2@gmail.com';
  new_user_id UUID;
  current_user_id TEXT;
BEGIN
  -- ============================================
  -- PASO 1: Obtener el UUID del usuario de Supabase
  -- ============================================
  
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = new_email;
  
  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'ERROR: No se encontró usuario con email: %', new_email;
  END IF;
  
  RAISE NOTICE '✓ Usuario de Supabase encontrado';
  RAISE NOTICE '  Email: %', new_email;
  RAISE NOTICE '  UUID: %', new_user_id;
  
  -- ============================================
  -- PASO 2: Verificar el user_id actual del tenant
  -- ============================================
  
  SELECT user_id INTO current_user_id
  FROM tenants
  WHERE id = target_tenant_id;
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'ERROR: No se encontró tenant con ID: %', target_tenant_id;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '✓ Tenant encontrado';
  RAISE NOTICE '  Tenant ID: %', target_tenant_id;
  RAISE NOTICE '  User ID actual: %', current_user_id;
  
  -- Verificar si es de Clerk
  IF current_user_id LIKE 'user_%' THEN
    RAISE NOTICE '  Tipo: CLERK (necesita actualización)';
  ELSE
    RAISE NOTICE '  Tipo: SUPABASE (ya está actualizado)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ El tenant ya tiene un UUID de Supabase';
    RAISE NOTICE '   Si los proveedores no aparecen, el problema es otro';
    RETURN;
  END IF;
  
  -- ============================================
  -- PASO 3: Actualizar user_id del tenant
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Actualizando user_id del tenant...';
  
  UPDATE tenants
  SET user_id = new_user_id::text
  WHERE id = target_tenant_id;
  
  RAISE NOTICE '✅ Tenant actualizado';
  
  -- ============================================
  -- PASO 4: Actualizar user_id en otras tablas
  -- ============================================
  
  -- Actualizar ventas
  UPDATE sales
  SET user_id = new_user_id::text
  WHERE tenant_id = target_tenant_id;
  
  RAISE NOTICE '✅ Ventas actualizadas: % filas', (SELECT COUNT(*) FROM sales WHERE tenant_id = target_tenant_id);
  
  -- Actualizar cash_sessions
  UPDATE cash_sessions
  SET user_id = new_user_id::text
  WHERE tenant_id = target_tenant_id;
  
  RAISE NOTICE '✅ Cash sessions actualizadas: % filas', (SELECT COUNT(*) FROM cash_sessions WHERE tenant_id = target_tenant_id);
  
  -- Actualizar stock_movements
  UPDATE stock_movements
  SET user_id = new_user_id::text
  WHERE tenant_id = target_tenant_id;
  
  RAISE NOTICE '✅ Stock movements actualizados: % filas', (SELECT COUNT(*) FROM stock_movements WHERE tenant_id = target_tenant_id);
  
  -- ============================================
  -- PASO 5: Verificación final
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '🎉 MIGRACIÓN COMPLETADA';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📧 Email: %', new_email;
  RAISE NOTICE '🔑 Nuevo UUID: %', new_user_id;
  RAISE NOTICE '🏢 Tenant ID: %', target_tenant_id;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Datos migrados:';
  RAISE NOTICE '  • Productos: %', (SELECT COUNT(*) FROM products WHERE tenant_id = target_tenant_id);
  RAISE NOTICE '  • Proveedores: %', (SELECT COUNT(*) FROM suppliers WHERE tenant_id = target_tenant_id);
  RAISE NOTICE '  • Ventas: %', (SELECT COUNT(*) FROM sales WHERE tenant_id = target_tenant_id);
  RAISE NOTICE '';
  RAISE NOTICE '✅ Ahora puedes iniciar sesión con: %', new_email;
  RAISE NOTICE '✅ Todos los datos estarán disponibles';
  RAISE NOTICE '';
  
END $$;
