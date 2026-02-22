-- Script simple para ver los tenants
SELECT 
  id,
  user_id,
  contact_name,
  business_name
FROM tenants
WHERE contact_name LIKE '%fmurtagh%'
   OR user_id LIKE '%dd0040aa%'
ORDER BY created_at DESC
LIMIT 20;
