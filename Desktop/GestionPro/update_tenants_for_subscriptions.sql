-- ============================================
-- ACTUALIZACIÓN TABLA TENANTS PARA SUSCRIPCIONES
-- GestionPro - Sistema de Suscripciones con MP
-- ============================================

-- Agregar columnas necesarias para el sistema de suscripciones
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS mp_preapproval_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS address TEXT, 
ADD COLUMN IF NOT EXISTS cuit TEXT;

-- Crear índice para búsquedas rápidas por suscripción de MP
CREATE INDEX IF NOT EXISTS idx_tenants_mp_preapproval ON tenants(mp_preapproval_id);

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tenants' 
  AND column_name IN ('mp_preapproval_id', 'whatsapp_number', 'address', 'cuit', 'pricing_plan', 'payment_status', 'next_due_date')
ORDER BY column_name;
