
-- Add whatsapp_number to tenants if it doesn't exist
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Optional: Update your own tenant with a placeholder or real number if known
-- UPDATE tenants SET whatsapp_number = '5491112345678', business_name = 'Mi Negocio Real' WHERE contact_name = 'your_email';
