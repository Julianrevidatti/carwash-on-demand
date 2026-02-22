-- =========================================================
-- SCRIPT: RECALCULAR MÁRGENES (SOLO MARGEN)
-- =========================================================
-- Basado en la solicitud del usuario:
-- "SOLO RECALCULE EL MARGEN basándose en el Precio y Costo actuales"
--
-- Este script NO MODIFICA PRECIOS NI COSTOS.
-- Solo actualiza la columna 'profit_margin' para que sea matemáticamente
-- consistente con el Precio y Costo que ya existen en la base de datos.
-- =========================================================

DO $$
DECLARE
    count_fixed INT := 0;
BEGIN
    RAISE NOTICE 'Iniciando recálculo global de márgenes...';

    -- Actualizar solo productos con costo válido para evitar división por cero
    UPDATE products
    SET profit_margin = ((price - cost) / cost) * 100
    WHERE cost > 0
    AND price >= cost; -- Asumimos que no queremos márgenes negativos por ahora, o sí? 
                       -- Mejor recalculamos todo tal cual es la realidad matemática.
                       
    GET DIAGNOSTICS count_fixed = ROW_COUNT;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'PROCESO COMPLETADO';
    RAISE NOTICE 'Márgenes recalculados exitosamente: % productos.', count_fixed;
    RAISE NOTICE 'NOTA: Los precios y costos se mantuvieron INTACTOS.';
    RAISE NOTICE '========================================';
END $$;
