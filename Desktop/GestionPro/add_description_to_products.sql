
-- Fix missing column for E-commerce Catalog
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
