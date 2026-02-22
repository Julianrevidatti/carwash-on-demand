-- Add original_quantity column to inventory_batches table
-- This preserves the initial quantity when the batch was created
-- so we can show accurate history even after stock is depleted

-- Step 1: Add column as NULLABLE first
ALTER TABLE inventory_batches 
ADD COLUMN IF NOT EXISTS original_quantity INTEGER;

-- Step 2: Populate existing records with current quantity values
-- This is a one-time migration for historical data
UPDATE inventory_batches 
SET original_quantity = quantity 
WHERE original_quantity IS NULL;

-- Step 3: Now make the column NOT NULL (after data is populated)
ALTER TABLE inventory_batches 
ALTER COLUMN original_quantity SET NOT NULL;

-- Step 4: Set default value for future inserts (just in case)
ALTER TABLE inventory_batches 
ALTER COLUMN original_quantity SET DEFAULT 0;

-- Documentation
COMMENT ON COLUMN inventory_batches.original_quantity IS 'Original quantity when batch was created, never changes';
COMMENT ON COLUMN inventory_batches.quantity IS 'Current remaining quantity, decreases with sales';
