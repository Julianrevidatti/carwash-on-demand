-- COPIA Y PEGA ESTO EN EL EDITOR SQL DE SUPABASE
-- Esto agregará las columnas necesarias para guardar teléfono y día de visita.

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS contact_info text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS visit_frequency text;
