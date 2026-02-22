-- DIAGNÓSTICO COMPLETO - Por qué se perdió la información

-- 1. Verificar el tenant actual (debe aparecer)
SELECT 
  id,
  business_name,
  contact_name,
  user_id,
  pricing_plan,
  status,
  next_due_date,
  grace_period_start
FROM tenants 
WHERE id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';

-- 2. Ver con qué usuario estás autenticado AHORA
SELECT 
  auth.uid() as mi_user_id_actual,
  auth.email() as mi_email_actual;

-- 3. Ver TODOS los productos (para verificar si existen)
SELECT COUNT(*) as total_productos
FROM products
WHERE tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';

-- 4. SOLUCIÓN TEMPORAL: Deshabilitar RLS para ver si ese es el problema
-- (Solo para diagnóstico, NO dejar así en producción)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE batches DISABLE ROW LEVEL SECURITY;

-- 5. Intentar ver productos de nuevo
SELECT COUNT(*) as total_productos_sin_rls
FROM products
WHERE tenant_id = 'dd0040aa-78a5-4fa4-bf27-db59ae5586b2';
