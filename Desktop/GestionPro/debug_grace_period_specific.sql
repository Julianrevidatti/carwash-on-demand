-- DIAGNÓSTICO DEL GRACE PERIOD PARA TENANT ESPECÍFICO
-- Tenant ID: dd0040aa-78a5-4fa4-bf27-db59ae5586b2

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
WHERE id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';

-- 2. Inicializar grace_period_start si está NULL
-- Esto establece el inicio del grace period al 11/2/2026 (día del vencimiento)
UPDATE tenants 
SET grace_period_start = '2026-02-11 00:00:00-03'::timestamptz
WHERE id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2'
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
  5 - CEIL(EXTRACT(EPOCH FROM (NOW() - grace_period_start)) / 86400) as grace_days_remaining,
  -- Información adicional
  NOW() as ahora,
  NOW() - grace_period_start as tiempo_en_grace
FROM tenants 
WHERE id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';
