-- ============================================
-- CREAR MÉTODOS DE PAGO INICIALES
-- ============================================

INSERT INTO payment_methods (id, tenant_id, name, surcharge_percent, is_cash, is_current_account, created_at)
VALUES 
    (
        gen_random_uuid(),
        'dd0040aa-78a5-4fa4-bf27-db59ae5586b2',
        'Efectivo',
        0,
        true,
        false,
        NOW()
    ),
    (
        gen_random_uuid(),
        'dd0040aa-78a5-4fa4-bf27-db59ae5586b2',
        'Débito',
        0,
        false,
        false,
        NOW()
    ),
    (
        gen_random_uuid(),
        'dd0040aa-78a5-4fa4-bf27-db59ae5586b2',
        'Crédito',
        10,
        false,
        false,
        NOW()
    ),
    (
        gen_random_uuid(),
        'dd0040aa-78a5-4fa4-bf27-db59ae5586b2',
        'Mercado Pago',
        0,
        false,
        false,
        NOW()
    ),
    (
        gen_random_uuid(),
        'dd0040aa-78a5-4fa4-bf27-db59ae5586b2',
        'Cuenta Corriente',
        0,
        false,
        true,
        NOW()
    );

-- Verificar que se crearon
SELECT 
    id,
    name,
    surcharge_percent,
    is_cash,
    is_current_account
FROM payment_methods
WHERE tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2'
ORDER BY name;
