-- ============================================
-- SCRIPT: MIGRAR DATOS DE CUENTA VIEJA A CUENTA NUEVA
-- Transfiere todos los datos del tenant viejo al usuario nuevo
-- ============================================

DO $$
DECLARE
  old_email TEXT := 'fmurtagh1981+1@gmail.com'; -- Email de la cuenta VIEJA con datos
  new_email TEXT := 'fmurtagh1981+2@gmail.com'; -- Email de la cuenta NUEVA vacía
  old_tenant_id UUID := 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2'; -- Tenant ID con los datos
  new_user_id TEXT;
  affected_rows INT;
BEGIN
  -- ============================================
  -- PASO 1: Obtener UUID del nuevo usuario
  -- ============================================
  
  SELECT id::TEXT INTO new_user_id
  FROM auth.users
  WHERE email = new_email;

  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'ERROR: No se encontró usuario con email: %', new_email;
  END IF;

  RAISE NOTICE '📧 Email cuenta vieja: %', old_email;
  RAISE NOTICE '📧 Email cuenta nueva: %', new_email;
  RAISE NOTICE '🏢 Tenant ID con datos: %', old_tenant_id;
  RAISE NOTICE '🔑 UUID nuevo usuario: %', new_user_id;

  -- ============================================
  -- PASO 2: Verificar que el tenant existe
  -- ============================================
  
  IF NOT EXISTS (SELECT 1 FROM tenants WHERE id = old_tenant_id) THEN
    RAISE EXCEPTION 'ERROR: No se encontró tenant con ID: %', old_tenant_id;
  END IF;

  RAISE NOTICE '✅ Tenant con datos encontrado';

  -- ============================================
  -- PASO 3: Actualizar user_id del tenant viejo
  -- ============================================
  
  RAISE NOTICE '🔄 Actualizando tenant...';
  
  UPDATE tenants
  SET user_id = new_user_id
  WHERE id = old_tenant_id;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE '✅ Tenant actualizado (% filas)', affected_rows;

  -- ============================================
  -- PASO 4: Actualizar ventas (user_id)
  -- ============================================
  
  RAISE NOTICE '🔄 Actualizando ventas...';
  
  UPDATE sales
  SET user_id = new_user_id
  WHERE tenant_id = old_tenant_id;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE '✅ Ventas actualizadas (% filas)', affected_rows;

  -- ============================================
  -- PASO 5: Actualizar cash_sessions (user_id)
  -- ============================================
  
  RAISE NOTICE '🔄 Actualizando cash_sessions...';
  
  UPDATE cash_sessions
  SET user_id = new_user_id
  WHERE tenant_id = old_tenant_id;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE '✅ Cash_sessions actualizadas (% filas)', affected_rows;

  -- ============================================
  -- PASO 6: Actualizar stock_movements (user_id)
  -- ============================================
  
  RAISE NOTICE '🔄 Actualizando stock_movements...';
  
  UPDATE stock_movements
  SET user_id = new_user_id
  WHERE tenant_id = old_tenant_id;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE '✅ Stock_movements actualizados (% filas)', affected_rows;

  -- ============================================
  -- PASO 7: Eliminar tenant vacío de cuenta nueva (si existe)
  -- ============================================
  
  RAISE NOTICE '🔄 Limpiando tenant vacío...';
  
  DELETE FROM tenants
  WHERE contact_name = new_email AND id != old_tenant_id;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE '✅ Tenants vacíos eliminados (% filas)', affected_rows;

  -- ============================================
  -- PASO 8: Verificar datos accesibles
  -- ============================================
  
  RAISE NOTICE '🔍 Verificando datos accesibles...';
  
  DECLARE
    product_count INT;
    sales_count INT;
    tenant_user TEXT;
  BEGIN
    SELECT user_id INTO tenant_user
    FROM tenants
    WHERE id = old_tenant_id;

    SELECT COUNT(*) INTO product_count
    FROM products
    WHERE tenant_id = old_tenant_id;

    SELECT COUNT(*) INTO sales_count
    FROM sales
    WHERE tenant_id = old_tenant_id;

    RAISE NOTICE '✅ Tenant user_id: %', tenant_user;
    RAISE NOTICE '✅ Productos: %', product_count;
    RAISE NOTICE '✅ Ventas: %', sales_count;
  END;

  -- ============================================
  -- RESULTADO FINAL
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📧 Email nuevo: %', new_email;
  RAISE NOTICE '🔑 UUID nuevo: %', new_user_id;
  RAISE NOTICE '🏢 Tenant ID: %', old_tenant_id;
  RAISE NOTICE '';
  RAISE NOTICE '✅ El cliente puede iniciar sesión con: %', new_email;
  RAISE NOTICE '✅ Todos los datos de % están ahora accesibles', old_email;
  RAISE NOTICE '';

END $$;
