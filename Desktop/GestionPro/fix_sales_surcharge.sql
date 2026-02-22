
-- ADD SURCHARGE COLUMN TO SALES

ALTER TABLE sales ADD COLUMN IF NOT EXISTS surcharge NUMERIC DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;

-- Optional: If you want to backfill subtotal where it's 0, you can do:
-- UPDATE sales SET subtotal = total WHERE subtotal = 0;
-- But subtotal might be different if there was a discount. 
-- For now, defaults are fine for new sales.
