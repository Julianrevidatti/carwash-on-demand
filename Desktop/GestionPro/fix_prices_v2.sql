-- =========================================================
-- SCRIPT DE CORRECCIÓN INTELIGENTE V2 (ULTRA SEGURO)
-- =========================================================

DO $$
DECLARE
    r RECORD;
    count_exploded INT := 0;
    count_margin_fix INT := 0;
    count_cost_fix INT := 0;
BEGIN
    RAISE NOTICE 'Iniciando diagnóstico y corrección...';

    FOR r IN SELECT * FROM products WHERE profit_margin > 200 LOOP
        
        -- CASO 1: PRECIO EXPLOTADO (El "Matecocido")
        -- Si el precio es absurdo (> 100.000) y el costo es real, bajamos el precio.
        IF r.price > 100000 AND r.cost > 10 THEN
            UPDATE products 
            SET price = cost * 1.5,
                profit_margin = 50 
            WHERE id = r.id;
            count_exploded := count_exploded + 1;
            RAISE NOTICE 'FIX PRECIO: % (Era $%) -> Nuevo: $%', r.name, r.price, (r.cost * 1.5);

        -- CASO 2: SOLO MARGEN ROTO (El "Danica")
        -- El precio es normal (< 100.000) y el costo es normal (> 10).
        -- El problema es que el margen dice "49900" pero matemáticamente no coincide.
        -- Solo recalculamos el margen. NO TOCAMOS EL PRECIO NI EL COSTO.
        ELSIF r.price <= 100000 AND r.cost > 10 THEN
            UPDATE products
            SET profit_margin = ((price - cost) / cost) * 100
            WHERE id = r.id;
            count_margin_fix := count_margin_fix + 1;
            RAISE NOTICE 'FIX MARGEN: % (Era %) -> Nuevo: %', r.name, r.profit_margin, ROUND(((r.price - r.cost) / r.cost) * 100, 2);

        -- CASO 3: COSTO FANTASMA (Los "Bocaditos" a $1)
        -- El precio es normal, pero el costo es $1, lo que hace que el margen sea gigante.
        -- Ajustamos el costo para que tenga sentido (Margen 50%).
        ELSIF r.price <= 100000 AND r.cost <= 10 AND r.price > 0 THEN
            UPDATE products 
            SET cost = price / 1.5,
                profit_margin = 50 
            WHERE id = r.id;
            count_cost_fix := count_cost_fix + 1;
            RAISE NOTICE 'FIX COSTO: % (Costo era $%) -> Nuevo: $%', r.name, r.cost, (r.price / 1.5);
            
        END IF;

    END LOOP;

    RAISE NOTICE '------------------------------------------------';
    RAISE NOTICE 'RESUMEN FINAL:';
    RAISE NOTICE 'Precios Explotados (Bajados): %', count_exploded;
    RAISE NOTICE 'Márgenes Recalculados (Precio mantenido): %', count_margin_fix;
    RAISE NOTICE 'Costos Ajustados (Precio mantenido): %', count_cost_fix;
    RAISE NOTICE '------------------------------------------------';
END $$;
