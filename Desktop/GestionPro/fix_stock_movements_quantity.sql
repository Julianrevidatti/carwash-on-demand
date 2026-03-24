-- Fix the quantity column in stock_movements to support decimals for bulk (granel) products
BEGIN;

-- Check if the column is currently integer
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_movements' 
        AND column_name = 'quantity' 
        AND data_type = 'integer'
    ) THEN
        -- Safely change the type from integer to numeric
        ALTER TABLE stock_movements ALTER COLUMN quantity TYPE NUMERIC USING quantity::numeric;
        RAISE NOTICE 'Changed stock_movements.quantity to NUMERIC.';
    ELSE
        RAISE NOTICE 'stock_movements.quantity is already NUMERIC.';
    END IF;
END $$;

COMMIT;
