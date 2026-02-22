-- ============================================
-- MIGRAR PROVEEDORES DE CUENTA ANTIGUA A NUEVA
-- ============================================
-- De: fmurtagh1981+1@gmail.com (tenant: dd0040aa-78a5-4fa4-bf27-db59ae5586b2)
-- A: fmurtagh1981+2@gmail.com

DO $$
DECLARE
  old_tenant_id UUID := 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2'; -- Tenant con los datos antiguos
  new_user_email TEXT := 'fmurtagh1981+2@gmail.com'; -- Email del nuevo usuario
  new_user_id UUID;
  new_tenant_id UUID;
  suppliers_count INTEGER;
BEGIN
  -- 1. Buscar el nuevo user_id en Supabase Auth
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = new_user_email
  LIMIT 1;

  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el usuario con email: %', new_user_email;
  END IF;

  RAISE NOTICE '✓ Usuario nuevo encontrado: %', new_user_id;

  -- 2. Buscar el tenant del nuevo usuario
  SELECT id INTO new_tenant_id
  FROM tenants
  WHERE user_id = new_user_id
  LIMIT 1;

  IF new_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró tenant para el usuario: %', new_user_email;
  END IF;

  RAISE NOTICE '✓ Tenant nuevo encontrado: %', new_tenant_id;

  -- 3. Verificar cuántos proveedores hay en la cuenta antigua
  SELECT COUNT(*) INTO suppliers_count
  FROM suppliers
  WHERE tenant_id = old_tenant_id;

  RAISE NOTICE '📦 Proveedores en cuenta antigua: %', suppliers_count;

  IF suppliers_count = 0 THEN
    RAISE NOTICE '⚠️ No hay proveedores para migrar en el tenant antiguo';
    RETURN;
  END IF;

  -- 4. Migrar proveedores de la cuenta antigua a la nueva
  UPDATE suppliers
  SET tenant_id = new_tenant_id
  WHERE tenant_id = old_tenant_id;

  RAISE NOTICE '✅ Proveedores migrados: % proveedores', suppliers_count;

  -- 5. Verificar la migración
  SELECT COUNT(*) INTO suppliers_count
  FROM suppliers
  WHERE tenant_id = new_tenant_id;

  RAISE NOTICE '✓ Total de proveedores en cuenta nueva: %', suppliers_count;

END $$;

-- Verificar los proveedores migrados
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
ORDER BY s.name;
