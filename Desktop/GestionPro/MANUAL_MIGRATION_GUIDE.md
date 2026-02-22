# Guía de Migración Manual: Clerk → Supabase Auth

## 🎯 Pasos a Seguir (30 minutos total)

---

## ✅ PASO 1: Ejecutar SQL en Supabase (5 min)

### Acción:
1. Abre Supabase Dashboard: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (menú lateral izquierdo)
4. Click **"New query"**
5. Abre el archivo `migrate_to_supabase_auth.sql` en tu editor
6. **Copia TODO el contenido**
7. **Pega** en el SQL Editor de Supabase
8. Click **"Run"** (o presiona F5)

### Resultado Esperado:
```
✅ Success
Rows affected: 0
```

### Verificación:
En el mismo SQL Editor, ejecuta:
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

Deberías ver políticas como:
- `Users can access their own tenant`
- `Users can access their own products`
- etc.

---

## ✅ PASO 2: Habilitar Supabase Auth Providers (2 min)

### Acción:
1. En Supabase Dashboard, ve a **Authentication** → **Providers**
2. Busca **"Email"**
3. Click en **"Enable"** o asegúrate que esté ON
4. Configuración recomendada:
   ```
   ✅ Enable Email provider
   ✅ Confirm email (opcional - desactiva para testing)
   ✅ Secure email change
   ```
5. Click **"Save"**

### (Opcional) Habilitar Google OAuth:
1. En la misma página, busca **"Google"**
2. Click **"Enable"**
3. Necesitarás:
   - Client ID de Google Cloud Console
   - Client Secret de Google Cloud Console
4. Si no tienes, sáltate este paso por ahora

---

## ✅ PASO 3: Desinstalar Clerk (1 min)

### Acción:
Abre tu terminal en la carpeta del proyecto y ejecuta:

```bash
npm uninstall @clerk/clerk-react
```

### Resultado Esperado:
```
removed 1 package
```

---

## ✅ PASO 4: Actualizar main.tsx (2 min)

### Acción:
1. Abre `src/main.tsx`
2. Busca estas líneas:

```typescript
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// ...

<ClerkProvider publishableKey={PUBLISHABLE_KEY}>
  <App />
</ClerkProvider>
```

3. **REEMPLAZA** por:

```typescript
<App />
```

### Archivo Completo Debería Quedar:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## ✅ PASO 5: Actualizar App.tsx - Parte 1: Auth Listener (5 min)

### Acción:
1. Abre `App.tsx`
2. Busca el `useEffect` que tiene `sessionManager` (alrededor de línea 110-136)
3. **REEMPLAZA TODO ESE BLOQUE** por:

```typescript
// Supabase Auth Listener
useEffect(() => {
  // Obtener sesión actual
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setAuthLoading(false);
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

---

## ✅ PASO 6: Actualizar App.tsx - Parte 2: Cargar Usuario (5 min)

### Acción:
1. En `App.tsx`, busca el `useEffect` que carga el usuario de Clerk (alrededor de línea 150-250)
2. Busca esta sección:

```typescript
useEffect(() => {
  if (!isLoaded) return;
  
  if (isSignedIn && user) {
    // ... código de Clerk ...
  }
}, [isLoaded, isSignedIn, user, getToken]);
```

3. **REEMPLAZA** por:

```typescript
useEffect(() => {
  if (!session) return;

  const loadUserData = async () => {
    try {
      const userId = session.user.id;
      
      // Buscar o crear tenant
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

        if (createError) {
          console.error('Error creating tenant:', createError);
          toast.error('Error al crear cuenta');
          return;
        }

        console.log('✅ Tenant created:', createdTenant);
        
        // Cargar datos iniciales si es necesario
        // ...
      } else if (error) {
        console.error('Error loading tenant:', error);
        toast.error('Error al cargar datos');
      } else {
        console.log('✅ Tenant loaded:', tenant);
      }
    } catch (error) {
      console.error('Error in loadUserData:', error);
    }
  };

  loadUserData();
}, [session]);
```

---

## ✅ PASO 7: Actualizar App.tsx - Parte 3: Logout (2 min)

### Acción:
1. En `App.tsx`, busca la función de logout (alrededor de línea 350)
2. Busca:

```typescript
await signOut();
sessionManager.cleanup();
```

3. **REEMPLAZA** por:

```typescript
await supabase.auth.signOut();
```

---

## ✅ PASO 8: Actualizar App.tsx - Parte 4: Renderizado (2 min)

### Acción:
1. En `App.tsx`, busca el final del componente (alrededor de línea 420-430)
2. Busca:

```typescript
if (!isLoaded) {
  return <div>Loading...</div>;
}

if (!isSignedIn) {
  return <SupabaseLogin />;
}
```

3. **REEMPLAZA** por:

```typescript
if (authLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );
}

if (!session) {
  return <SupabaseAuthLogin />;
}
```

---

## ✅ PASO 9: Limpiar .env (1 min)

### Acción:
1. Abre `.env`
2. **REMOVER** esta línea:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

3. **MANTENER** estas líneas:

```env
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## ✅ PASO 10: Remover Debug de Clerk (2 min)

### Acción:
1. En `App.tsx`, busca el estado `debugStatus` (alrededor de línea 100-108)
2. **REMOVER** todo el bloque:

```typescript
const [debugStatus, setDebugStatus] = useState<{
  clerk: string;
  token: string;
  supabase: string;
  tenant: string;
  sessionRefresh: string;
  error?: string;
}>({ clerk: 'Checking...', token: '...', supabase: '...', tenant: '...', sessionRefresh: '...' });
```

3. Busca el `useEffect` que actualiza `debugStatus` (alrededor de línea 138-150)
4. **REMOVER** todo ese `useEffect`

---

## ✅ PASO 11: Probar la Aplicación (5 min)

### Acción:
1. En la terminal, ejecuta:

```bash
npm run dev
```

2. Abre http://localhost:5173

3. **Prueba 1: Registro**
   - Click en "Regístrate"
   - Ingresa email y contraseña
   - Click "Crear Cuenta"
   - Deberías ver: "¡Cuenta creada! Revisa tu email"

4. **Prueba 2: Verificar Email**
   - Revisa tu email
   - Click en el link de verificación
   - Deberías ser redirigido a la app

5. **Prueba 3: Login**
   - Ingresa email y contraseña
   - Click "Iniciar Sesión"
   - Deberías ver: "¡Bienvenido de nuevo!"
   - La app debería cargar

6. **Prueba 4: Google OAuth** (si lo habilitaste)
   - Click "Continuar con Google"
   - Selecciona cuenta
   - Deberías iniciar sesión

---

## 🚨 Solución de Problemas

### Error: "Cannot find module '@clerk/clerk-react'"
**Solución:** Ejecuta `npm install` de nuevo

### Error: "Invalid login credentials"
**Solución:** 
- Verifica que el email esté verificado
- O desactiva "Confirm email" en Supabase Auth settings

### Error: "Row Level Security policy violation"
**Solución:**
- Verifica que ejecutaste el SQL correctamente
- Ejecuta de nuevo `migrate_to_supabase_auth.sql`

### La app no carga después del login
**Solución:**
- Abre la consola del navegador (F12)
- Busca errores en rojo
- Comparte el error conmigo

---

## ✅ Checklist Final

```
[ ] 1. SQL ejecutado en Supabase
[ ] 2. Email provider habilitado
[ ] 3. Clerk desinstalado
[ ] 4. main.tsx actualizado
[ ] 5. App.tsx - Auth listener agregado
[ ] 6. App.tsx - Load user actualizado
[ ] 7. App.tsx - Logout actualizado
[ ] 8. App.tsx - Renderizado actualizado
[ ] 9. .env limpiado
[ ] 10. Debug removido
[ ] 11. App probada y funcionando
```

---

## 🎉 ¡Migración Completada!

Una vez que todos los pasos estén hechos:

✅ **Sin Clerk**
✅ **Solo Supabase Auth**
✅ **Código más simple**
✅ **Sin errores de configuración**
✅ **Gratis para siempre**

---

## 📞 Necesitas Ayuda?

Si te atascas en algún paso:
1. Dime en qué paso estás
2. Comparte el error que ves
3. Te ayudo a resolverlo

**¡Éxito con la migración!** 🚀
