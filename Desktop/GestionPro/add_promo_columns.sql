-- Add missing columns for Mix & Match promotions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'type') THEN
        ALTER TABLE public.promotions ADD COLUMN "type" TEXT DEFAULT 'standard';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotions' AND column_name = 'quantity_required') THEN
        ALTER TABLE public.promotions ADD COLUMN "quantity_required" INTEGER;
    END IF;
END $$;
