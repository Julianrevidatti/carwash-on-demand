-- Verificar si existen métodos de pago para el tenant

SELECT 
    COUNT(*) as total_payment_methods
FROM payment_methods
WHERE tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';

-- Listar los métodos de pago existentes
SELECT 
    id,
    name,
    surcharge_percent,
    is_cash,
    is_current_account
FROM payment_methods
WHERE tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2'
ORDER BY name;
