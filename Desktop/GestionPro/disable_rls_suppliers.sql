-- ============================================
-- SOLUCIÓN: Deshabilitar RLS en suppliers temporalmente
-- ============================================
-- Las políticas RLS están bloqueando el acceso a los proveedores

-- Opción 1: Deshabilitar RLS completamente (TEMPORAL para testing)
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;

-- Verificar que se deshabilitó
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'suppliers';

-- Ahora intenta ver los proveedores
SELECT 
    COUNT(*) as total_proveedores
FROM suppliers
WHERE tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';
