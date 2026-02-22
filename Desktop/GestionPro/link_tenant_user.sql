-- PASO 1: Buscar el user_id por email
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email = 'fmurtagh1981-2@gmail.com';

-- PASO 2: Copiar el user_id que aparezca arriba y reemplazarlo aquí
-- (Reemplaza 'PEGAR_USER_ID_AQUI' con el id del PASO 1)
UPDATE tenants 
SET user_id = 'PEGAR_USER_ID_AQUI'
WHERE id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';

-- PASO 3: Verificar que se vinculó correctamente
SELECT 
  id,
  business_name,
  contact_name,
  user_id,
  next_due_date,
  grace_period_start,
  status
FROM tenants 
WHERE id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';
