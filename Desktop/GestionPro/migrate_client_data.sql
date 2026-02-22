-- ============================================
-- SCRIPT DE MIGRACIÓN DE DATOS DE CLIENTE
-- De Clerk a Supabase Auth
-- ============================================

-- PASO 1: Identificar el email del cliente
-- Reemplaza 'cliente@email.com' con el email real del cliente
DO $$
DECLARE
  client_email TEXT := 'cliente@email.com'; -- ⚠️ CAMBIAR ESTO
  old_tenant_id UUID;
  new_user_id UUID;
  new_tenant_id UUID;
BEGIN
  -- Buscar el tenant antiguo por email de contacto
  SELECT id INTO old_tenant_id
  FROM tenants
  WHERE contact_name = client_email
  LIMIT 1;

  IF old_tenant_id IS NULL THEN
    RAISE NOTICE 'No se encontró tenant con email: %', client_email;
    RETURN;
  END IF;

  RAISE NOTICE 'Tenant antiguo encontrado: %', old_tenant_id;

  -- Buscar el nuevo user_id en Supabase Auth
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = client_email
  LIMIT 1;

  IF new_user_id IS NULL THEN
    RAISE NOTICE 'El cliente aún no se ha registrado en Supabase Auth';
    RAISE NOTICE 'Debe crear una cuenta con: %', client_email;
    RETURN;
  END IF;

  RAISE NOTICE 'Nuevo user_id de Supabase: %', new_user_id;

  -- Buscar o crear el nuevo tenant
  SELECT id INTO new_tenant_id
  FROM tenants
  WHERE user_id = new_user_id
  LIMIT 1;

  IF new_tenant_id IS NULL THEN
    -- Crear nuevo tenant
    INSERT INTO tenants (
      id,
      business_name,
      contact_name,
      user_id,
      status,
      payment_status,
      pricing_plan
    )
    SELECT
      gen_random_uuid(),
      business_name,
      contact_name,
      new_user_id,
      status,
      payment_status,
      pricing_plan
    FROM tenants
    WHERE id = old_tenant_id
    RETURNING id INTO new_tenant_id;

    RAISE NOTICE 'Nuevo tenant creado: %', new_tenant_id;
  ELSE
    RAISE NOTICE 'Tenant ya existe: %', new_tenant_id;
  END IF;

  -- MIGRAR PRODUCTOS
  UPDATE products
  SET tenant_id = new_tenant_id
  WHERE tenant_id = old_tenant_id;

  RAISE NOTICE 'Productos migrados: % productos', (SELECT COUNT(*) FROM products WHERE tenant_id = new_tenant_id);

  -- MIGRAR VENTAS
  UPDATE sales
  SET tenant_id = new_tenant_id
  WHERE tenant_id = old_tenant_id;

  RAISE NOTICE 'Ventas migradas: % ventas', (SELECT COUNT(*) FROM sales WHERE tenant_id = new_tenant_id);

  -- MIGRAR PROVEEDORES
  UPDATE suppliers
  SET tenant_id = new_tenant_id
  WHERE tenant_id = old_tenant_id;

  RAISE NOTICE 'Proveedores migrados: % proveedores', (SELECT COUNT(*) FROM suppliers WHERE tenant_id = new_tenant_id);

  -- MIGRAR CLIENTES
  UPDATE clients
  SET tenant_id = new_tenant_id
  WHERE tenant_id = old_tenant_id;

  RAISE NOTICE 'Clientes migrados: % clientes', (SELECT COUNT(*) FROM clients WHERE tenant_id = new_tenant_id);

  -- MIGRAR CONFIGURACIÓN
  UPDATE settings
  SET tenant_id = new_tenant_id
  WHERE tenant_id = old_tenant_id;

  RAISE NOTICE 'Configuración migrada';

  -- MIGRAR MÉTODOS DE PAGO
  UPDATE payment_methods
  SET tenant_id = new_tenant_id
  WHERE tenant_id = old_tenant_id;

  RAISE NOTICE 'Métodos de pago migrados';

  -- MIGRAR SESIONES DE CAJA
  UPDATE cash_sessions
  SET tenant_id = new_tenant_id
  WHERE tenant_id = old_tenant_id;

  RAISE NOTICE 'Sesiones de caja migradas';

  -- OPCIONAL: Eliminar tenant antiguo
  -- DELETE FROM tenants WHERE id = old_tenant_id;
  -- RAISE NOTICE 'Tenant antiguo eliminado';

  RAISE NOTICE '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE';
END $$;
