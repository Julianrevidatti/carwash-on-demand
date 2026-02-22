# Configuración de Clerk para GestionPro

## 🎯 Guía Completa de Settings

Esta guía te muestra **exactamente** qué configurar en Clerk Dashboard para que el login funcione correctamente.

---

## 📋 Checklist Rápido

- [ ] Email + Password habilitado
- [ ] Email verification deshabilitado (o configurado)
- [ ] JWT Template "supabase" creado
- [ ] API Keys copiadas al .env
- [ ] Dominio autorizado
- [ ] Rate limiting configurado

---

## 1️⃣ Configuración de Autenticación

### Paso 1: Ve a Clerk Dashboard

1. Abre https://dashboard.clerk.com
2. Selecciona tu aplicación
3. Ve a **"Configure"** → **"Email, Phone, Username"**

### Paso 2: Habilita Email + Password

```
✅ Email address
   ├─ ✅ Require (marcado)
   └─ ⚠️ Verify at sign-up (DESMARCADO para testing, marcado para producción)

✅ Password
   └─ ✅ Require (marcado)
```

**Importante**: 
- Si "Verify at sign-up" está **marcado**, el usuario debe verificar su email antes de poder iniciar sesión
- Si está **desmarcado**, puede iniciar sesión inmediatamente después de registrarse

### Paso 3: Configuración Recomendada

```
Email address
├─ [✓] Require
├─ [ ] Verify at sign-up          ← DESMARCAR para testing
└─ [ ] Used for authentication     ← Automático

Password
├─ [✓] Require
├─ Minimum length: 8
└─ Require special character: No   ← Opcional
```

---

## 2️⃣ Configuración de Social Login (Opcional)

### Para Google Login

1. Ve a **"Configure"** → **"Social Connections"**
2. Habilita **Google**
3. Sigue el wizard de configuración

```
✅ Google
   ├─ Client ID: [tu-client-id]
   ├─ Client Secret: [tu-client-secret]
   └─ Scopes: email, profile
```

---

## 3️⃣ JWT Template para Supabase (CRÍTICO)

### Paso 1: Crear Template

1. Ve a **"Configure"** → **"JWT Templates"**
2. Click en **"+ New template"**
3. Selecciona **"Supabase"** de la lista

### Paso 2: Configurar el Template

```
Name: supabase

Claims:
{
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "email_verified": "{{user.email_verified}}",
  "phone": "{{user.primary_phone_number}}",
  "app_metadata": {},
  "user_metadata": {}
}

Token lifetime: 3600 (1 hora)
```

### Paso 3: Copiar el JWT Secret

1. Después de crear el template, verás un **"Signing key"**
2. **Copia esta clave** (la necesitarás para Supabase)
3. Guárdala en un lugar seguro

---

## 4️⃣ API Keys

### Paso 1: Obtener las Keys

1. Ve a **"API Keys"** en el menú lateral
2. Verás dos tipos de keys:

```
Publishable Key (Frontend)
pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

Secret Key (Backend - NO uses esta en frontend)
sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Paso 2: Agregar al .env

Crea o edita el archivo `.env` en la raíz de tu proyecto:

```env
# Clerk Keys
VITE_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# NO incluyas la Secret Key en el frontend
# Solo usa la Publishable Key
```

**⚠️ IMPORTANTE**: 
- Solo usa la **Publishable Key** en el frontend
- **NUNCA** expongas la Secret Key en el código del cliente

---

## 5️⃣ Configuración de Supabase

### Paso 1: Configurar JWT en Supabase

1. Ve a Supabase Dashboard
2. Settings → API
3. Busca **"JWT Settings"**

### Paso 2: Agregar Clerk como Provider

```sql
-- En Supabase SQL Editor, ejecuta:

-- 1. Habilitar el provider de Clerk
ALTER DATABASE postgres SET "app.jwt_secret" TO '[TU_CLERK_JWT_SECRET]';

-- 2. Crear función para extraer user_id de JWT
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    (current_setting('request.jwt.claims', true)::json->>'user_id')
  )::text;
$$ LANGUAGE SQL STABLE;
```

### Paso 3: Configurar RLS (Row Level Security)

```sql
-- Ejemplo para la tabla tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own tenant"
ON tenants
FOR ALL
USING (user_id = auth.user_id());
```

---

## 6️⃣ Dominios Autorizados

### Paso 1: Configurar Dominios

1. Ve a **"Configure"** → **"Domains"**
2. Agrega tus dominios:

```
Development:
├─ localhost:5173
├─ localhost:3000
└─ 127.0.0.1:5173

Production:
└─ tu-dominio.com
```

### Paso 2: Configurar CORS

En **"Configure"** → **"Advanced"** → **"CORS"**:

```
Allowed Origins:
├─ http://localhost:5173
├─ http://localhost:3000
└─ https://tu-dominio.com
```

---

## 7️⃣ Rate Limiting (Importante para Testing)

### Configuración Recomendada

1. Ve a **"Configure"** → **"Attack Protection"**
2. Configura:

```
Rate Limiting:
├─ Sign-in attempts: 10 per hour (default: 5)
├─ Sign-up attempts: 5 per hour
└─ Password reset: 3 per hour

CAPTCHA:
├─ [ ] Enable CAPTCHA (desmarcar para testing)
└─ Threshold: 3 failed attempts
```

**Para Testing**:
- Aumenta los límites temporalmente
- Desactiva CAPTCHA
- Recuerda reactivar en producción

---

## 8️⃣ Configuración de Sesiones

### Paso 1: Session Settings

1. Ve a **"Configure"** → **"Sessions"**
2. Configura:

```
Session lifetime:
├─ Inactivity timeout: 7 days
└─ Maximum lifetime: 30 days

Multi-session handling:
└─ [✓] Allow multiple sessions (para multi-dispositivo)
```

---

## 9️⃣ Verificación de Email (Opcional)

### Si quieres verificación de email:

1. Ve a **"Configure"** → **"Email, Phone, Username"**
2. Marca **"Verify at sign-up"** en Email address
3. Configura el template de email:

```
Email Templates:
├─ Verification email
│  ├─ Subject: Verifica tu email
│  └─ Template: [personaliza el mensaje]
└─ Magic link (opcional)
```

---

## 🔟 Configuración de Webhooks (Opcional)

### Para sincronizar con tu backend:

1. Ve a **"Configure"** → **"Webhooks"**
2. Click **"+ Add Endpoint"**
3. Configura:

```
Endpoint URL: https://tu-api.com/webhooks/clerk
Events:
├─ [✓] user.created
├─ [✓] user.updated
└─ [✓] session.created
```

---

## ✅ Verificación Final

### Checklist de Configuración Completa

```
[ ] 1. Email + Password habilitado
[ ] 2. Email verification configurado (o deshabilitado para testing)
[ ] 3. JWT Template "supabase" creado
[ ] 4. Publishable Key en .env
[ ] 5. Dominios autorizados (localhost)
[ ] 6. Rate limiting ajustado para testing
[ ] 7. Multi-session habilitado
[ ] 8. CORS configurado
[ ] 9. Supabase JWT configurado
[ ] 10. RLS policies creadas
```

---

## 🧪 Prueba de Configuración

### Test 1: Registro de Usuario

1. Intenta registrar un nuevo usuario
2. Deberías ver:
   - ✅ Formulario de registro
   - ✅ Confirmación de registro
   - ✅ Redirección a la app (si email verification está OFF)
   - ✅ Email de verificación (si está ON)

### Test 2: Inicio de Sesión

1. Intenta iniciar sesión
2. Deberías ver:
   - ✅ Formulario de login
   - ✅ "Login: Signin result status: complete" en consola
   - ✅ Redirección a la app
   - ✅ Datos del usuario cargados

### Test 3: JWT Token

1. Abre la consola (F12)
2. Ejecuta:
```javascript
// Obtener el token
const token = await window.Clerk.session.getToken({template: 'supabase'});
console.log('Token:', token);

// Decodificar (en jwt.io)
// Deberías ver: sub, email, etc.
```

---

## 🚨 Problemas Comunes

### Problema 1: "Signin incomplete"

**Causa**: Email verification habilitado pero email no verificado

**Solución**:
1. Ve a Clerk Dashboard → Users
2. Encuentra el usuario
3. Click en "..." → "Verify email address"
4. O desmarca "Verify at sign-up" en settings

### Problema 2: "Too many requests"

**Causa**: Rate limiting muy estricto

**Solución**:
1. Ve a Attack Protection
2. Aumenta los límites temporalmente
3. O espera 1 hora

### Problema 3: "Token invalid"

**Causa**: JWT Template mal configurado

**Solución**:
1. Verifica que el template se llame exactamente "supabase"
2. Verifica los claims
3. Copia el signing key correcto a Supabase

### Problema 4: "CORS error"

**Causa**: Dominio no autorizado

**Solución**:
1. Agrega localhost:5173 a dominios autorizados
2. Configura CORS en Advanced settings

---

## 📝 Configuración Mínima para Empezar

Si solo quieres que funcione **YA**, esta es la configuración mínima:

```
1. Email + Password: ✅ ON
2. Email verification: ❌ OFF (para testing)
3. JWT Template "supabase": ✅ Creado
4. Publishable Key: ✅ En .env
5. Dominio localhost: ✅ Autorizado
```

Con esto debería funcionar el login básico.

---

## 🔐 Configuración para Producción

Cuando vayas a producción, cambia:

```
1. Email verification: ✅ ON
2. Rate limiting: ✅ Valores por defecto
3. CAPTCHA: ✅ ON
4. Dominios: ✅ Solo tu dominio de producción
5. HTTPS: ✅ Obligatorio
6. Webhooks: ✅ Configurados
```

---

## 📞 Recursos

- **Clerk Docs**: https://clerk.com/docs
- **JWT Templates**: https://clerk.com/docs/backend-requests/making/jwt-templates
- **Supabase Integration**: https://clerk.com/docs/integrations/databases/supabase
- **Status Page**: https://status.clerk.com

---

**Última actualización**: Diciembre 2025  
**Versión**: 1.0.0
