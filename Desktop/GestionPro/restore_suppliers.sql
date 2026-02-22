-- !! IMPORTANTE: Ejecuta esto para recuperar la visibilidad de tus proveedores !!

-- 1. Desactivar temporalmente la seguridad para ver todos los datos
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;

-- 2. Asignar todos los proveedores existentes a tu negocio actual
-- Esto asegura que cuando reactivemos la seguridad, sigan visibles.
UPDATE public.suppliers
SET tenant_id = (
    SELECT id FROM tenants 
    WHERE 
      user_id = auth.uid()::text OR 
      contact_name = (auth.jwt() ->> 'email')
    LIMIT 1
);

-- 3. (Opcional) Volver a activar la seguridad una vez corregidos los datos
-- Descomenta la siguiente línea si quieres reactivar la seguridad después
-- ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
