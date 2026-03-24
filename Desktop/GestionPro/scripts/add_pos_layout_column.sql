
-- Add pos_layout column to tenant_settings if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_settings' AND column_name = 'pos_layout') THEN
        ALTER TABLE tenant_settings ADD COLUMN pos_layout TEXT DEFAULT 'classic';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_settings' AND column_name = 'pos_sidebar_actions') THEN
        ALTER TABLE tenant_settings ADD COLUMN pos_sidebar_actions TEXT DEFAULT 'top';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_settings' AND column_name = 'pos_reverse_layout') THEN
        ALTER TABLE tenant_settings ADD COLUMN pos_reverse_layout BOOLEAN DEFAULT false;
    END IF;
END $$;
