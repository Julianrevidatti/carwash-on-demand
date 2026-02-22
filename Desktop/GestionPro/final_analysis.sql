-- ANALISIS FINAL DEL GRACE PERIOD
-- Tenant: dd0040aa-78a5-4fa4-bf27-db59ae5586b2

SELECT 
    t.id,
    t.business_name,
    t.contact_name,
    t.user_id,
    t.pricing_plan,
    t.status,
    t.next_due_date,
    t.grace_period_start,
    NOW() as current_server_time,
    
    -- Cálculos de fechas
    EXTRACT(DAY FROM (NOW() - t.next_due_date)) as days_overdue,
    EXTRACT(DAY FROM (NOW() - t.grace_period_start)) as days_since_grace_start,
    
    -- Lógica de negocio simulada
    (t.pricing_plan != 'FREE') as is_paid_plan,
    (EXTRACT(DAY FROM (NOW() - t.next_due_date)) > 0) as is_expired,
    (t.grace_period_start IS NOT NULL) as has_grace_period,
    
    -- Cálculo de días restantes (5 días - días pasados)
    5 - CEIL(EXTRACT(EPOCH FROM (NOW() - t.grace_period_start)) / 86400) as grace_days_remaining

FROM tenants t
WHERE t.id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';
