-- ============================================
-- SOLUCIÓN PERMANENTE: Recrear políticas RLS correctamente
-- ============================================

-- 1. Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can access their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can view their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can insert their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can update their own suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can delete their own suppliers" ON suppliers;

-- 2. Crear política unificada para todas las operaciones
CREATE POLICY "Enable all access for users based on tenant_id"
ON suppliers
FOR ALL
USING (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()::text
    )
);

-- 3. Asegurar que RLS está habilitado
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- 4. Verificar las políticas
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'suppliers';
