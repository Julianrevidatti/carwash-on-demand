-- Add whatsapp_number column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
