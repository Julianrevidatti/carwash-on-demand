-- Add is_manual_price column to products table
-- Run this in Supabase SQL Editor

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_manual_price BOOLEAN DEFAULT FALSE;

-- Optional: Update existing products that have manual prices (price != calculated)
-- This is a heuristic and might not be 100% accurate
-- UPDATE products SET is_manual_price = TRUE WHERE price != CEIL(cost * (1 + profit_margin / 100));
