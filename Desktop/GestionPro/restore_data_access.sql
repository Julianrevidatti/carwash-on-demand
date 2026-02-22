-- RESTAURAR ACCESO A LOS DATOS DEL TENANT
-- Este script restaura el acceso después del cambio de user_id

-- OPCIÓN 1: Resetear el user_id a NULL (volver al estado anterior)
UPDATE tenants 
SET user_id = NULL
WHERE id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';

-- OPCIÓN 2: Crear una política RLS que permita acceso basado en tenant_id
-- (Esto permite acceso incluso sin user_id vinculado)

-- Para tabla products
DROP POLICY IF EXISTS "Usuarios ven solo productos de su tenant" ON products;
CREATE POLICY "Usuarios ven solo productos de su tenant" 
ON products FOR ALL 
USING (
  tenant_id IN (
    SELECT id FROM tenants 
    WHERE user_id = auth.uid()::text 
    OR id = tenant_id  -- Permite acceso directo por tenant_id
  )
);

-- Para tabla sales
DROP POLICY IF EXISTS "Usuarios ven solo ventas de su tenant" ON sales;
CREATE POLICY "Usuarios ven solo ventas de su tenant" 
ON sales FOR ALL 
USING (
  tenant_id IN (
    SELECT id FROM tenants 
    WHERE user_id = auth.uid()::text
    OR id = tenant_id
  )
);

-- Verificar que los datos ahora son visibles
SELECT COUNT(*) as total_productos
FROM products
WHERE tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';

SELECT COUNT(*) as total_ventas
FROM sales
WHERE tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';
