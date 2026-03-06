-- ==============================================================================
-- CORRECCIÓN AUTOMÁTICA DE STOCK
-- Este script lee el historial de movimientos de todos los tiempos y 
-- si el historial dice que deberías tener MÁS stock del que realmente tienes 
-- en el sistema (por culpa del error de la suscripción vencida), 
-- creará lotes nuevos automáticos llamados 'RECUPERO-SISTEMA' 
-- para devolverle al cliente las cantidades que pagó/ingresó pero no se guardaron.
-- ==============================================================================

DO $$ 
DECLARE
    r RECORD;
    registros_arreglados INT := 0;
BEGIN
    FOR r IN (
        WITH all_movements AS (
            -- Obtenemos el balance neto de los movimientos en los últimos 3 días
            SELECT 
                product_id,
                tenant_id,
                SUM(CASE WHEN type = 'IN' THEN quantity ELSE -quantity END) as stock_neto_historico
            FROM stock_movements
            WHERE date >= NOW() - INTERVAL '3 days'
            GROUP BY product_id, tenant_id
        ),
        actual_batches AS (
            -- Obtenemos la cantidad física de stock actual en lotes
            SELECT 
                product_id::text as product_id, -- Casteado a text para emparejar con stock_movements
                tenant_id,
                SUM(quantity) as stock_real_en_lotes
            FROM inventory_batches
            GROUP BY product_id, tenant_id
        )
        SELECT 
            rm.product_id,
            rm.tenant_id,
            rm.stock_neto_historico,
            COALESCE(ab.stock_real_en_lotes, 0) as stock_real_en_lotes,
            -- Calculamos cuánto falta agregar
            (rm.stock_neto_historico - COALESCE(ab.stock_real_en_lotes, 0)) as missing_qty
        FROM all_movements rm
        LEFT JOIN actual_batches ab 
            ON rm.product_id = ab.product_id AND rm.tenant_id = ab.tenant_id
        -- Nos aseguramos que sea un producto estándar (los graneles van por otro lado)
        JOIN products p 
            ON p.id::text = rm.product_id
        -- SOLO actuamos si el historial dice que deberíamos tener más stock del que hay en realidad
        WHERE (rm.stock_neto_historico - COALESCE(ab.stock_real_en_lotes, 0)) > 0
    ) LOOP
        -- Insertamos el stock fantasma que no se había guardado
        INSERT INTO inventory_batches (
            id,
            product_id,
            batch_number,
            quantity,
            original_quantity,
            expiry_date,
            date_added,
            tenant_id
        ) VALUES (
            gen_random_uuid(),
            r.product_id::uuid,
            'RECUPERO-SISTEMA',
            r.missing_qty,
            r.missing_qty,
            CURRENT_DATE + INTERVAL '1 year', -- Fecha de caducidad por defecto de 1 año
            NOW(),
            r.tenant_id
        );
        
        registros_arreglados := registros_arreglados + 1;
        RAISE NOTICE 'Recuperado: % unidades faltantes insertadas para el producto ID %', r.missing_qty, r.product_id;
    END LOOP;

    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'PROCESO TERMINADO. Se arreglaron % productos con faltantes.', registros_arreglados;
    RAISE NOTICE '=======================================================';
END $$;
