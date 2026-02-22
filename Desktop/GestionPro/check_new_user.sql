-- Verificar UUID del usuario nuevo
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'fmurtagh1981+2@gmail.com';
