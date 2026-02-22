-- ============================================
-- SCRIPT SIMPLIFICADO: Actualizar user_id (SIN validaciones complejas)
-- ============================================
-- Este script actualiza directamente sin verificaciones que puedan fallar

DO $$
DECLARE
  target_tenant_id UUID := 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';
  new_email TEXT := 'fmurtagh1981+2@gmail.com';
  new_user_id TEXT;
BEGIN
  -- Obtener UUID del usuario de Supabase (como TEXT)
  SELECT id::TEXT INTO new_user_id
  FROM auth.users
  WHERE email = new_email;
  
  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró usuario: %', new_email;
  END IF;
  
  RAISE NOTICE '🔑 UUID de Supabase: %', new_user_id;
  
  -- Actualizar tenant
  UPDATE tenants
  SET user_id = new_user_id
  WHERE id = target_tenant_id;
  
  RAISE NOTICE '✅ Tenant actualizado';
  
  -- Actualizar sales
  UPDATE sales
  SET user_id = new_user_id
  WHERE tenant_id = target_tenant_id;
  
  RAISE NOTICE '✅ Sales actualizadas';
  
  -- Actualizar cash_sessions
  UPDATE cash_sessions
  SET user_id = new_user_id
  WHERE tenant_id = target_tenant_id;
  
  RAISE NOTICE '✅ Cash sessions actualizadas';
  
  -- Actualizar stock_movements
  UPDATE stock_movements
  SET user_id = new_user_id
  WHERE tenant_id = target_tenant_id;
  
  RAISE NOTICE '✅ Stock movements actualizados';
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 COMPLETADO - Ahora cierra sesión y vuelve a entrar';
  
END $$;

-- Verificar el cambio
SELECT 
    id as tenant_id,
    user_id,
    business_name,
    CASE 
        WHEN user_id LIKE 'user_%' THEN '❌ Todavía es Clerk'
        ELSE '✅ Ahora es Supabase'
    END as estado
FROM tenants
WHERE id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';
