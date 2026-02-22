-- =========================================================
-- SCRIPT DE CORRECCIÓN INTELIGENTE DE PRECIOS Y COSTOS
-- =========================================================
-- Autor: Sistema de Soporte
-- Descripción:
-- Corrige dos tipos de errores detectados:
-- 1. "PRECIOS EXPLOTADOS": Cuando el Costo parece real (>10) pero el Precio es absurdo (>100.000)
--    -> Se recálcula el Precio (Costo + 50%)
-- 2. "COSTOS FANTASMA": Cuando el Precio es normal pero el Costo es irrisorio (<=10) y el Margen gigante.
--    -> Se recálcula el Costo para que coincida con el Precio manteniendo un margen del 50%.

DO $$
DECLARE
    r RECORD;
    count_exploded INT := 0;
    count_phantom INT := 0;
BEGIN
    RAISE NOTICE 'Iniciando corrección de precios...';

    -- Iterar sobre productos con margen sospechosamente alto (> 200%)
    FOR r IN SELECT * FROM products WHERE profit_margin > 200 LOOP
        
        -- CASO 1: PRECIO EXPLOTADO
        -- Criterio: Precio mayor a $100.000 Y Costo mayor a $10 (es decir, costo real)
        -- Ejemplo: Matecocido (Costo 980, Precio 1.470.000)
        IF r.price > 100000 AND r.cost > 10 THEN
            UPDATE products 
            SET price = cost * 1.5,     -- Precio = Costo + 50%
                profit_margin = 50 
            WHERE id = r.id;
            
            count_exploded := count_exploded + 1;
            RAISE NOTICE 'CORREGIDO (Precio Explotado): % | Costo: % | Precio Ant: % -> Nuevo: %', r.name, r.cost, r.price, (r.cost * 1.5);
        
        -- CASO 2: COSTO FANTASMA / PRECIO SEGURO
        -- Criterio: El Precio es menor a $100.000 (asumimos es correcto) O el Costo es muy bajo (usuario puso 1)
        -- Ejemplo: Bocaditos (Costo 1, Precio 6600)
        ELSE
            -- Evitar división por cero si precio es 0
            IF r.price > 0 THEN
                UPDATE products 
                SET cost = price / 1.5,    -- Ajustar Costo para que el margen sea 50%
                    profit_margin = 50 
                WHERE id = r.id;
                
                count_phantom := count_phantom + 1;
                RAISE NOTICE 'CORREGIDO (Costo Irreal): % | Precio: % | Costo Ant: % -> Nuevo: %', r.name, r.price, r.cost, (r.price / 1.5);
            END IF;
        END IF;

    END LOOP;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMEN DE CAMBIOS:';
    RAISE NOTICE 'Precios Explotados Corregidos: %', count_exploded;
    RAISE NOTICE 'Costos Irreales Ajustados: %', count_phantom;
    RAISE NOTICE '========================================';
END $$;
