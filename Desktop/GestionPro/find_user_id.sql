-- PASO 1: Buscar el user_id con el email CORRECTO (con +)
SELECT 
  id as user_id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'fmurtagh1981+2@gmail.com';

-- Si no aparece nada, buscar TODOS los usuarios para encontrar el correcto
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
