-- SOLUCIÓN EMERGENCIA: Deshabilitar RLS temporalmente y restaurar acceso

-- 1. DESHABILITAR RLS en tablas principales (permite acceso inmediato)
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;

-- 2. Resetear user_id a NULL
UPDATE tenants 
SET user_id = NULL
WHERE id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';

-- 3. Verificar que se restauró
SELECT 
  id,
  business_name,
  contact_name,
  user_id,
  pricing_plan,
  next_due_date,
  grace_period_start,
  status
FROM tenants 
WHERE id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';

-- 4. Verificar que los productos son visibles
SELECT COUNT(*) as total_productos
FROM products
WHERE tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';
