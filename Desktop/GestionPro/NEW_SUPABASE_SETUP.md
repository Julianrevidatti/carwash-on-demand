# Guía Rápida: Crear Nuevo Proyecto Supabase Gratuito

## 🎯 Situación
- Proyecto anterior pausado y no accesible
- Prefieres opción gratuita
- Tienes archivos SQL para recrear la estructura

---

## ⚡ Pasos Rápidos (15 minutos)

### Paso 1: Crear Nuevo Proyecto (2 minutos)

1. **Ve a Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```

2. **Click en "New Project"**

3. **Completa el formulario:**
   ```
   Organization: [Tu organización existente]
   Name: GestionPro
   Database Password: [Crea una contraseña SEGURA]
   Region: South America (São Paulo)
   Pricing Plan: Free
   ```

4. **Click "Create new project"**

5. **Espera 2-3 minutos** (se está creando la base de datos)

---

### Paso 2: Obtener Credenciales (1 minuto)

1. **Una vez creado, ve a:**
   ```
   Settings → API
   ```

2. **Copia estos valores:**
   ```
   Project URL: https://xxxxx.supabase.co
   anon public: eyJhbGc...
   ```

3. **Actualiza tu archivo `.env`:**
   ```env
   # Supabase
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```

---

### Paso 3: Ejecutar Scripts SQL (5 minutos)

1. **Ve a SQL Editor:**
   ```
   SQL Editor → New query
   ```

2. **Ejecuta los scripts EN ESTE ORDEN:**

#### A) Crear tabla de tenants
```sql
-- 1. Tabla de tenants (clientes SaaS)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    pricing_plan TEXT NOT NULL DEFAULT 'FREE',
    next_due_date TIMESTAMP WITH TIME ZONE,
    user_id TEXT UNIQUE, -- Clerk User ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Política: usuarios solo ven su propio tenant
CREATE POLICY "Users can access their own tenant"
ON tenants
FOR ALL
USING (user_id = auth.jwt() ->> 'sub');
```

#### B) Crear tabla de productos
```sql
-- 2. Tabla de productos
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    barcode TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política
CREATE POLICY "Users can access their own products"
ON products
FOR ALL
USING (tenant_id IN (
    SELECT id FROM tenants WHERE user_id = auth.jwt() ->> 'sub'
));
```

#### C) Crear tabla de ventas
```sql
-- 3. Tabla de ventas
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    total DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Política
CREATE POLICY "Users can access their own sales"
ON sales
FOR ALL
USING (tenant_id IN (
    SELECT id FROM tenants WHERE user_id = auth.jwt() ->> 'sub'
));
```

#### D) Crear tabla de sesiones de caja
```sql
-- 4. Tabla de sesiones de caja
CREATE TABLE IF NOT EXISTS public.cash_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    initial_float DECIMAL(10,2) NOT NULL,
    final_cash DECIMAL(10,2),
    status TEXT NOT NULL DEFAULT 'OPEN',
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;

-- Política
CREATE POLICY "Users can access their own sessions"
ON cash_sessions
FOR ALL
USING (tenant_id IN (
    SELECT id FROM tenants WHERE user_id = auth.jwt() ->> 'sub'
));
```

#### E) Crear tabla de configuración
```sql
-- 5. Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    mercadopago_access_token TEXT,
    mercadopago_user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Política
CREATE POLICY "Users can access their own settings"
ON settings
FOR ALL
USING (tenant_id IN (
    SELECT id FROM tenants WHERE user_id = auth.jwt() ->> 'sub'
));
```

#### F) Ejecutar scripts adicionales
```sql
-- Copia y pega el contenido de estos archivos uno por uno:
-- 1. fix_suppliers_table.sql
-- 2. fix_bulk_products_table.sql
-- 3. create_stock_movements.sql
```

---

### Paso 4: Configurar JWT con Clerk (3 minutos)

1. **Ve a Settings → API → JWT Settings**

2. **Click en "Add custom claims"**

3. **En "JWT Secret", pega el Signing Key de Clerk:**
   ```
   [El que copiaste del JWT Template "supabase" en Clerk]
   ```

4. **Guarda los cambios**

---

### Paso 5: Probar la Conexión (2 minutos)

1. **Actualiza tu aplicación:**
   ```bash
   # En tu terminal
   npm run dev
   ```

2. **Abre la app en el navegador:**
   ```
   http://localhost:5173
   ```

3. **Intenta registrarte con un nuevo usuario**

4. **Verifica en Supabase:**
   ```
   Table Editor → tenants
   ```
   Deberías ver tu nuevo tenant creado

---

## 🔧 Archivo .env Completo

```env
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Supabase (NUEVOS VALORES)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## ✅ Verificación

Después de completar todos los pasos:

- [ ] Nuevo proyecto creado en Supabase
- [ ] Credenciales actualizadas en .env
- [ ] Tablas creadas (tenants, products, sales, etc.)
- [ ] RLS habilitado en todas las tablas
- [ ] JWT configurado con Clerk
- [ ] App corriendo sin errores
- [ ] Registro de usuario funciona
- [ ] Datos se guardan en Supabase

---

## 🚨 Problemas Comunes

### Error: "JWT verification failed"

**Solución:**
1. Verifica que copiaste el Signing Key correcto de Clerk
2. En Clerk → JWT Templates → supabase → Copia el Signing Key
3. En Supabase → Settings → API → JWT Settings → Pega el key

### Error: "relation does not exist"

**Solución:**
1. Verifica que ejecutaste todos los scripts SQL
2. Ve a Table Editor y confirma que las tablas existen
3. Re-ejecuta el script que falta

### Error: "Row Level Security policy violation"

**Solución:**
1. Verifica que las políticas RLS estén creadas
2. Ejecuta:
```sql
SELECT * FROM pg_policies WHERE tablename = 'tenants';
```
3. Si no hay políticas, re-ejecuta los scripts de RLS

---

## 💾 Datos Anteriores

### Si necesitas recuperar datos del proyecto pausado:

**Opción 1: Contactar a Supabase Support**
```
support@supabase.com

Asunto: Request database export from paused project
Mensaje: 
"Hi, my project [PROJECT_ID] was paused. 
Can you provide a database dump? 
I need to migrate to a new project."
```

**Opción 2: Empezar de cero**
```
- Usa el nuevo proyecto
- Recarga los datos manualmente
- Considera esto una "limpieza" de datos de prueba
```

---

## 📊 Plan Gratuito - Límites

```
✅ Suficiente para:
├─ Desarrollo completo
├─ Testing exhaustivo
├─ Hasta 10-20 usuarios reales
└─ Proyectos pequeños en producción

Límites:
├─ 500 MB de base de datos
├─ 1 GB de almacenamiento
├─ 2 GB de transferencia/mes
├─ 50,000 usuarios activos/mes
└─ Pausa después de 1 semana sin actividad

⚠️ Para evitar pausa:
- Haz login al menos 1 vez por semana
- O configura un cron job que haga ping
```

---

## 🎯 Próximos Pasos

1. **Crea el proyecto ahora** (sigue Paso 1)
2. **Actualiza .env** (Paso 2)
3. **Ejecuta los SQL** (Paso 3)
4. **Prueba la app** (Paso 5)
5. **Comparte el resultado** (¿funcionó?)

---

## 📞 Necesitas Ayuda?

Si tienes problemas en algún paso:
1. Dime en qué paso estás
2. Comparte el error que ves
3. Te ayudo a resolverlo

---

**¡Empecemos! Ve al Paso 1 y dime cuando hayas creado el proyecto.** 🚀
