-- Asignar user_id al tenant usando el mismo UUID del tenant_id
UPDATE tenants 
SET user_id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2'
WHERE id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';

-- Verificar que se actualizó correctamente
SELECT 
  id,
  business_name,
  contact_name,
  user_id,
  pricing_plan,
  next_due_date,
  grace_period_start,
  status
FROM tenants 
WHERE id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';
