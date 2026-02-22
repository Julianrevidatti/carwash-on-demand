# Migración a Supabase Auth - Pasos Completados y Pendientes

## ✅ PASO 1: Componente de Login Creado

**Archivo:** `components/SupabaseAuthLogin.tsx`

**Status:** ✅ COMPLETADO

**Features incluidas:**
- Login con email/password
- Registro de usuarios
- Google OAuth
- Recuperación de contraseña
- Mensajes de error específicos
- UI moderna y responsive

---

## 🔄 PASO 2: Actualizar App.tsx (PENDIENTE)

### Cambios Necesarios:

#### A) Reemplazar imports de Clerk:

**ANTES:**
```typescript
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';
```

**DESPUÉS:**
```typescript
import { Session } from '@supabase/supabase-js';
```

#### B) Reemplazar hooks de Clerk:

**ANTES:**
```typescript
const { user, isLoaded, isSignedIn } = useUser();
const { signOut } = useClerk();
const { getToken } = useAuth();
```

**DESPUÉS:**
```typescript
const [session, setSession] = useState<Session | null>(null);
const [loading, setLoading] = useState(true);
```

#### C) Agregar listener de autenticación:

```typescript
useEffect(() => {
  // Obtener sesión actual
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setLoading(false);
  });

  // Escuchar cambios de autenticación
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  return () => subscription.unsubscribe();
}, []);
```

#### D) Actualizar lógica de logout:

**ANTES:**
```typescript
await signOut();
```

**DESPUÉS:**
```typescript
await supabase.auth.signOut();
```

#### E) Actualizar condición de renderizado:

**ANTES:**
```typescript
if (!isLoaded) return <div>Loading...</div>;
if (!isSignedIn) return <SupabaseLogin />;
```

**DESPUÉS:**
```typescript
if (loading) return <div>Loading...</div>;
if (!session) return <SupabaseAuthLogin />;
```

---

## 🔄 PASO 3: Actualizar authSlice.ts (PENDIENTE)

### Cambios Necesarios:

#### A) Reemplazar user_id de Clerk con Supabase:

**ANTES:**
```typescript
user_id: clerkUser.id  // Clerk user ID (string)
```

**DESPUÉS:**
```typescript
user_id: session.user.id  // Supabase user ID (UUID)
```

#### B) Actualizar función fetchUserAndTenant:

```typescript
export const fetchUserAndTenant = async (session: Session) => {
  const userId = session.user.id;
  
  // Buscar tenant del usuario
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // No existe tenant, crear uno nuevo
    const newTenant = {
      business_name: session.user.email?.split('@')[0] || 'Mi Negocio',
      contact_name: session.user.email || '',
      user_id: userId,
      status: 'ACTIVE',
      payment_status: 'PENDING',
      pricing_plan: 'FREE'
    };

    const { data: createdTenant, error: createError } = await supabase
      .from('tenants')
      .insert([newTenant])
      .select()
      .single();

    if (createError) throw createError;
    return createdTenant;
  }

  if (error) throw error;
  return tenant;
};
```

---

## 🔄 PASO 4: Actualizar RLS Policies (PENDIENTE)

### SQL a ejecutar en Supabase:

```sql
-- 1. Cambiar tipo de columna user_id de TEXT a UUID
ALTER TABLE tenants 
  ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

-- 2. Actualizar políticas RLS
DROP POLICY IF EXISTS "Users can access their own tenant" ON tenants;

CREATE POLICY "Users can access their own tenant"
ON tenants FOR ALL
USING (auth.uid() = user_id);

-- 3. Repetir para todas las tablas
-- Products
DROP POLICY IF EXISTS "Users can access their own products" ON products;

CREATE POLICY "Users can access their own products"
ON products FOR ALL
USING (tenant_id IN (
  SELECT id FROM tenants WHERE user_id = auth.uid()
));

-- Sales
DROP POLICY IF EXISTS "Users can access their own sales" ON sales;

CREATE POLICY "Users can access their own sales"
ON sales FOR ALL
USING (tenant_id IN (
  SELECT id FROM tenants WHERE user_id = auth.uid()
));

-- Cash Sessions
DROP POLICY IF EXISTS "Users can access their own sessions" ON cash_sessions;

CREATE POLICY "Users can access their own sessions"
ON cash_sessions FOR ALL
USING (tenant_id IN (
  SELECT id FROM tenants WHERE user_id = auth.uid()
));

-- Settings
DROP POLICY IF EXISTS "Users can access their own settings" ON settings;

CREATE POLICY "Users can access their own settings"
ON settings FOR ALL
USING (tenant_id IN (
  SELECT id FROM tenants WHERE user_id = auth.uid()
));

-- Suppliers
DROP POLICY IF EXISTS "Users can access their own suppliers" ON suppliers;

CREATE POLICY "Users can access their own suppliers"
ON suppliers FOR ALL
USING (tenant_id IN (
  SELECT id FROM tenants WHERE user_id = auth.uid()
));

-- Bulk Products
DROP POLICY IF EXISTS "Users can access their own bulk products" ON bulk_products;

CREATE POLICY "Users can access their own bulk products"
ON bulk_products FOR ALL
USING (tenant_id IN (
  SELECT id FROM tenants WHERE user_id = auth.uid()
));

-- Stock Movements
DROP POLICY IF EXISTS "Users can access their own stock movements" ON stock_movements;

CREATE POLICY "Users can access their own stock movements"
ON stock_movements FOR ALL
USING (tenant_id IN (
  SELECT id FROM tenants WHERE user_id = auth.uid()
));
```

---

## 🔄 PASO 5: Remover Clerk (PENDIENTE)

### A) Desinstalar paquete:

```bash
npm uninstall @clerk/clerk-react
```

### B) Actualizar main.tsx:

**ANTES:**
```typescript
import { ClerkProvider } from '@clerk/clerk-react';

<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
  <App />
</ClerkProvider>
```

**DESPUÉS:**
```typescript
<App />
```

### C) Limpiar .env:

**REMOVER:**
```env
VITE_CLERK_PUBLISHABLE_KEY=...
```

---

## 🔄 PASO 6: Actualizar Session Manager (PENDIENTE)

### Cambios en sessionManager.ts:

**ANTES:**
```typescript
initialize(getToken: () => Promise<string | null>) {
  this.tokenRefreshCallback = getToken;
  // ...
}
```

**DESPUÉS:**
```typescript
// Ya no es necesario con Supabase Auth
// Supabase maneja el refresh automáticamente
// Puedes simplificar o remover el session manager
```

---

## 📋 Checklist de Migración

```
✅ 1. Crear SupabaseAuthLogin.tsx
⏳ 2. Actualizar App.tsx
⏳ 3. Actualizar authSlice.ts
⏳ 4. Ejecutar SQL para RLS
⏳ 5. Remover Clerk
⏳ 6. Simplificar Session Manager
⏳ 7. Probar login/signup
⏳ 8. Probar Google OAuth
⏳ 9. Verificar RLS
⏳ 10. Deploy
```

---

## 🚀 Próximos Pasos

1. **Actualizar App.tsx** - Reemplazar lógica de Clerk
2. **Actualizar authSlice.ts** - Cambiar de Clerk a Supabase
3. **Ejecutar SQL** - Actualizar RLS policies
4. **Probar** - Verificar que todo funcione
5. **Remover Clerk** - Limpiar código

---

## ⚠️ Notas Importantes

### Migración de Usuarios Existentes

Si ya tienes usuarios en Clerk:

**Opción 1: Empezar de cero**
- Más simple
- Usuarios deben registrarse nuevamente
- Recomendado si aún no tienes usuarios en producción

**Opción 2: Migración manual**
- Exportar usuarios de Clerk
- Crear en Supabase Auth
- Pedir reset de contraseña
- Más complejo

### Diferencias Clave

| Aspecto | Clerk | Supabase Auth |
|---------|-------|---------------|
| User ID | String | UUID |
| Session | Manual | Automático |
| RLS | JWT template | auth.uid() |
| Refresh | Manual | Automático |

---

**¿Listo para continuar con el Paso 2?** 🚀
