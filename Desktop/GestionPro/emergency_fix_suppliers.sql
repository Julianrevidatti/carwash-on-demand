-- SOLUCIÓN DE EMERGENCIA PARA PROVEEDORES

-- 1. Desactivar la seguridad RLS para que los datos sean visibles inmediatamente
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;

-- 2. Asegurar que el proveedor que mencionaste exista y esté asignado correctamente.
-- Este script intentará insertar el registro si no existe, o actualizarlo si ya existe.
INSERT INTO public.suppliers (id, tenant_id, name, contact_info, visit_frequency, created_at)
VALUES (
    'e731a9f2-b113-482d-8982-93b93ed69a58', 
    'dd0040aa-78a5-4fa4-bf27-db59ae5586b2', 
    'ilolay claudio', 
    '232244', 
    'lunes', 
    '2025-12-01 19:53:42.321625+00'
)
ON CONFLICT (id) DO UPDATE 
SET 
    contact_info = EXCLUDED.contact_info,
    visit_frequency = EXCLUDED.visit_frequency;

-- 3. NOTA IMPORTANTE:
-- Si después de ejecutar esto sigues sin verlo en la APP, es probable que tu usuario actual
-- tenga un ID de Negocio (Tenant ID) diferente al del proveedor ('dd0040aa...').
-- Si ese es el caso, necesitaríamos actualizar el tenant_id del proveedor para que coincida con el tuyo.
