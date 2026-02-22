-- DIAGNÓSTICO DEL GRACE PERIOD
-- Verificar el estado actual de tu tenant

-- 1. Ver datos completos del tenant
SELECT 
  id,
  business_name,
  pricing_plan,
  status,
  next_due_date,
  grace_period_start,
  -- Cálculos de días
  EXTRACT(DAY FROM (next_due_date - NOW())) as dias_hasta_vencimiento,
  CASE 
    WHEN grace_period_start IS NOT NULL THEN 
      EXTRACT(DAY FROM (NOW() - grace_period_start))
    ELSE NULL 
  END as dias_desde_grace_inicio,
  NOW() as fecha_actual
FROM tenants 
WHERE user_id = (SELECT auth.uid());

-- 2. Si grace_period_start es NULL, inicializarlo manualmente
-- (esto debería hacerlo automáticamente el código, pero vamos a forzarlo)
UPDATE tenants 
SET grace_period_start = '2026-02-11 00:00:00-03'::timestamptz
WHERE user_id = (SELECT auth.uid())
  AND grace_period_start IS NULL
  AND next_due_date < NOW()
  AND pricing_plan != 'FREE';

-- 3. Verificar el resultado
SELECT 
  business_name,
  next_due_date,
  grace_period_start,
  status,
  pricing_plan,
  -- Días restantes de grace period
  5 - CEIL(EXTRACT(EPOCH FROM (NOW() - grace_period_start)) / 86400) as grace_days_remaining
FROM tenants 
WHERE user_id = (SELECT auth.uid());
