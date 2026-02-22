-- ============================================
-- ADD GRACE PERIOD TRACKING TO TENANTS TABLE
-- ============================================

-- Add grace_period_start column to track when grace period begins
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS grace_period_start TIMESTAMP WITH TIME ZONE;

-- Add comment to document the field usage
COMMENT ON COLUMN public.tenants.grace_period_start IS 
'Timestamp when grace period started (only for paid plans). NULL while license is valid. Set when daysRemaining <= 0 for BASIC/PRO/ULTIMATE plans.';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tenants' 
  AND column_name = 'grace_period_start';
