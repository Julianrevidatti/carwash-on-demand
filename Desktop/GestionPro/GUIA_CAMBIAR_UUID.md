# 🔄 GUÍA: Cambiar UUID de Usuario (Método Simplificado)

## 🎯 Objetivo

Cambiar el UUID del usuario en Supabase Auth para que coincida con el UUID antiguo de Clerk, manteniendo todos los datos intactos.

---

## ✅ VENTAJAS DE ESTE MÉTODO

```
✅ No necesitas migrar datos
✅ Todos los datos permanecen intactos
✅ Más rápido (1 script vs migrar todo)
✅ Menos riesgo de errores
✅ El cliente solo se registra una vez
```

---

## 📋 REQUISITOS PREVIOS

### **1. Obtener el UUID Antiguo de Clerk**

Necesitas el UUID que el cliente tenía en Clerk. Puedes encontrarlo en:

**Opción A: En la tabla `tenants`**
```sql
SELECT user_id, business_name, contact_name
FROM tenants
WHERE contact_name LIKE '%email_del_cliente%';
```

**Opción B: En la tabla `products`** (si tienes el tenant_id)
```sql
SELECT t.user_id, t.business_name
FROM tenants t
WHERE t.id = 'TENANT_ID_DEL_CLIENTE';
```

**Ejemplo de UUID de Clerk:**
```
user_2abc123xyz456def789
```

### **2. Cliente se Registra en Supabase Auth**

El cliente debe:
1. Ir a tu app
2. Registrarse con **el mismo email** que usaba con Clerk
3. Crear una contraseña nueva
4. Verificar email (si es necesario)

---

## 🚀 PASOS PARA EJECUTAR

### **Paso 1: Editar el Script**

Abrir `change_user_uuid.sql` y modificar las líneas 13-14:

```sql
client_email TEXT := 'cliente@email.com'; -- ⚠️ CAMBIAR
old_clerk_uuid UUID := '00000000-0000-0000-0000-000000000000'; -- ⚠️ CAMBIAR
```

**Cambiar por:**
```sql
client_email TEXT := 'cliente@negocio.com'; -- Email real del cliente
old_clerk_uuid UUID := 'user_2abc123xyz456def789'; -- UUID real de Clerk
```

---

### **Paso 2: Ejecutar en Supabase**

1. **Ir a Supabase Dashboard**
   - https://supabase.com/dashboard
   - Seleccionar tu proyecto
   - Ir a "SQL Editor"

2. **Copiar y Pegar el Script**
   - Copiar todo el contenido de `change_user_uuid.sql`
   - Pegarlo en el SQL Editor

3. **Ejecutar**
   - Click en "Run" o `Ctrl + Enter`

---

### **Paso 3: Verificar Resultados**

El script mostrará mensajes como:

```
📧 Email del cliente: cliente@negocio.com
🆕 UUID actual en Supabase: abc-123-xyz...
🔄 UUID antiguo de Clerk: user_2abc123...
✅ Tenant encontrado con UUID antiguo
✅ UUID actualizado en auth.users
✅ UUID actualizado en auth.identities
✅ UUID actualizado en auth.sessions
✅ Productos accesibles: 50
✅ Ventas accesibles: 120

═══════════════════════════════════════
🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE
═══════════════════════════════════════
```

---

### **Paso 4: Cliente Inicia Sesión**

1. El cliente cierra sesión (si estaba logueado)
2. Inicia sesión con su **nuevo email y contraseña** de Supabase
3. ✅ Debería ver todos sus datos antiguos

---

## 🔍 VERIFICACIÓN MANUAL

### **Antes de Ejecutar el Script:**

**1. Verificar UUID antiguo:**
```sql
SELECT id, business_name, contact_name, user_id
FROM tenants
WHERE contact_name = 'cliente@negocio.com';
```

**2. Verificar que el cliente se registró:**
```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'cliente@negocio.com';
```

### **Después de Ejecutar el Script:**

**1. Verificar UUID actualizado:**
```sql
SELECT id, email
FROM auth.users
WHERE email = 'cliente@negocio.com';
-- El 'id' ahora debería ser el UUID antiguo de Clerk
```

**2. Verificar acceso a datos:**
```sql
SELECT COUNT(*) as productos
FROM products p
JOIN tenants t ON p.tenant_id = t.id
JOIN auth.users u ON t.user_id = u.id
WHERE u.email = 'cliente@negocio.com';
```

---

## ⚠️ IMPORTANTE

### **Antes de Ejecutar:**
- ✅ El cliente DEBE haberse registrado en Supabase Auth
- ✅ Usar el MISMO email que usaba con Clerk
- ✅ Tener el UUID antiguo de Clerk correcto
- ✅ (Recomendado) Hacer backup de `auth.users`

### **Qué Hace el Script:**
- ✅ Cambia el UUID en `auth.users`
- ✅ Cambia el UUID en `auth.identities`
- ✅ Cambia el UUID en `auth.sessions`
- ✅ NO toca los datos (productos, ventas, etc.)

### **Qué NO Hace:**
- ❌ NO migra datos
- ❌ NO crea nuevos registros
- ❌ NO elimina nada

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### **Error: "No se encontró usuario con email"**

**Causa:** El cliente no se ha registrado en Supabase Auth

**Solución:**
1. El cliente debe registrarse primero
2. Usar el mismo email
3. Luego ejecutar el script

---

### **Error: "No se encontró tenant con UUID"**

**Causa:** El UUID antiguo de Clerk es incorrecto

**Solución:**
```sql
-- Ver todos los tenants y sus UUIDs
SELECT id, business_name, contact_name, user_id
FROM tenants;
```
Busca el tenant del cliente y copia su `user_id`.

---

### **Error: "duplicate key value violates unique constraint"**

**Causa:** Ya existe un usuario con ese UUID

**Solución:**
Verifica que no haya otro usuario con el mismo UUID:
```sql
SELECT id, email FROM auth.users WHERE id = 'UUID_ANTIGUO';
```

---

## 💾 BACKUP (RECOMENDADO)

Antes de ejecutar, hacer backup de la tabla `auth.users`:

```sql
-- Crear backup
CREATE TABLE auth.users_backup AS 
SELECT * FROM auth.users;

-- Para restaurar si algo sale mal
DELETE FROM auth.users WHERE email = 'cliente@negocio.com';
INSERT INTO auth.users 
SELECT * FROM auth.users_backup 
WHERE email = 'cliente@negocio.com';
```

---

## 📊 EJEMPLO COMPLETO

### **Datos del Cliente:**
```
Email: juan@ferreteria.com
UUID Clerk: user_2nX9kL3mP5qR8tY1wZ4vB6cD
```

### **Script Editado:**
```sql
client_email TEXT := 'juan@ferreteria.com';
old_clerk_uuid UUID := 'user_2nX9kL3mP5qR8tY1wZ4vB6cD';
```

### **Resultado:**
```
✅ UUID actualizado
✅ 45 productos accesibles
✅ 230 ventas accesibles
🎉 MIGRACIÓN COMPLETADA
```

---

## ✅ CHECKLIST

Antes de ejecutar:
- [ ] Tengo el email exacto del cliente
- [ ] Tengo el UUID antiguo de Clerk
- [ ] El cliente se registró en Supabase Auth
- [ ] Edité el script con los datos correctos
- [ ] (Opcional) Hice backup de auth.users

Durante la ejecución:
- [ ] Copié el script completo
- [ ] Lo pegué en SQL Editor
- [ ] Click en "Run"
- [ ] Vi los mensajes de confirmación

Después de ejecutar:
- [ ] El cliente cerró sesión
- [ ] El cliente inició sesión de nuevo
- [ ] El cliente ve todos sus datos
- [ ] ✅ Migración exitosa

---

## 🎉 RESULTADO ESPERADO

Después de ejecutar el script:

```
✅ El cliente inicia sesión con Supabase Auth
✅ Su UUID ahora es el mismo que tenía en Clerk
✅ Ve todos sus productos antiguos
✅ Ve todas sus ventas antiguas
✅ Toda la configuración se mantiene
✅ No se perdió ningún dato
✅ Puede seguir trabajando normalmente
```

---

## 🆚 COMPARACIÓN DE MÉTODOS

### **Método 1: Migrar Datos** (anterior)
```
⏱️  Tiempo: 10-15 min
🔧 Complejidad: Media
⚠️  Riesgo: Medio (migrar datos)
📊 Tablas afectadas: 7+
```

### **Método 2: Cambiar UUID** (este)
```
⏱️  Tiempo: 2-3 min
🔧 Complejidad: Baja
⚠️  Riesgo: Bajo (solo cambiar UUID)
📊 Tablas afectadas: 3 (auth)
```

**Recomendación:** ✅ **Método 2 (Cambiar UUID)** es más simple y seguro.

---

**¡Listo para ejecutar!** 🚀
