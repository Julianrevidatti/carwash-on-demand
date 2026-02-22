-- Add address column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT;
