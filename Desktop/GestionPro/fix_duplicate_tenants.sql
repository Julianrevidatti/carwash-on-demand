-- SOLUCIÓN: Vincular al tenant CORRECTO y eliminar duplicados

-- PASO 1: Buscar tu user_id actual en Supabase Auth
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'fmurtagh1981+2@gmail.com'
ORDER BY created_at DESC
LIMIT 1;

-- PASO 2: Copiar el ID que aparezca arriba y reemplazarlo aquí
-- (Reemplaza 'TU_USER_ID_DE_AUTH' con el id del PASO 1)
UPDATE tenants 
SET user_id = 'TU_USER_ID_DE_AUTH'
WHERE id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';

-- PASO 3: Eliminar los tenants duplicados (vacíos, creados recientemente)
DELETE FROM tenants
WHERE contact_name = 'fmurtagh1981+2@gmail.com'
AND id != 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';

-- PASO 4: Verificar que quedó solo el tenant correcto
SELECT 
  id,
  business_name,
  contact_name,
  user_id,
  pricing_plan,
  next_due_date,
  grace_period_start,
  created_at
FROM tenants
WHERE contact_name = 'fmurtagh1981+2@gmail.com';
