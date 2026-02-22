# Guía de Deployment en Hostinger

## 📋 Requisitos Previos

- ✅ Cuenta de Hostinger activa
- ✅ Dominio configurado
- ✅ Acceso al panel de control de Hostinger
- ✅ Variables de entorno de Supabase

---

## 🚀 Paso 1: Preparar el Build de Producción

### 1.1 Configurar Variables de Entorno

Crea un archivo `.env.production` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_supabase_url_aqui
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
```

> ⚠️ **IMPORTANTE**: Reemplaza con tus credenciales reales de Supabase

### 1.2 Generar el Build

Abre la terminal en la carpeta del proyecto y ejecuta:

```bash
npm run build
```

Esto creará una carpeta `dist/` con todos los archivos optimizados para producción.

---

## 📤 Paso 2: Subir Archivos a Hostinger

### Opción A: File Manager (Más Fácil)

1. **Accede al panel de Hostinger**
   - Ve a [hpanel.hostinger.com](https://hpanel.hostinger.com)
   - Inicia sesión con tu cuenta

2. **Abre el File Manager**
   - En el panel, busca "File Manager" o "Administrador de Archivos"
   - Haz clic para abrirlo

3. **Navega a la carpeta public_html**
   - Esta es la carpeta raíz de tu sitio web
   - Si tienes archivos antiguos, elimínalos primero

4. **Sube los archivos del build**
   - Haz clic en "Upload" o "Subir"
   - Selecciona **TODOS** los archivos dentro de la carpeta `dist/`
   - **NO subas la carpeta `dist/` en sí, solo su contenido**
   - Espera a que se complete la subida

### Opción B: FTP (Más Rápido para muchos archivos)

1. **Obtén las credenciales FTP**
   - En Hostinger, ve a "FTP Accounts" o "Cuentas FTP"
   - Anota:
     - Host/Servidor
     - Usuario
     - Contraseña
     - Puerto (usualmente 21)

2. **Descarga un cliente FTP**
   - Recomendado: [FileZilla](https://filezilla-project.org/)

3. **Conecta por FTP**
   - Abre FileZilla
   - Ingresa las credenciales
   - Conéctate

4. **Sube los archivos**
   - En el panel derecho, navega a `public_html`
   - En el panel izquierdo, navega a tu carpeta `dist/`
   - Selecciona todo el contenido de `dist/` y arrástralo a `public_html`

---

## ⚙️ Paso 3: Configurar el Servidor para SPA

Las aplicaciones React necesitan que todas las rutas apunten al `index.html`. Crea un archivo `.htaccess` en `public_html`:

### 3.1 Crear archivo .htaccess

En el File Manager de Hostinger:

1. Haz clic en "New File" o "Nuevo Archivo"
2. Nómbralo exactamente: `.htaccess`
3. Haz clic derecho → Edit
4. Pega este contenido:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Redirigir HTTP a HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  
  # No reescribir archivos o directorios que existen
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  
  # Reescribir todo lo demás a index.html para permitir HTML5 state links
  RewriteRule . /index.html [L]
</IfModule>

# Habilitar compresión GZIP
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Configurar caché del navegador
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
```

5. Guarda el archivo

---

## 🌐 Paso 4: Configurar el Dominio

### 4.1 Verificar DNS

1. En Hostinger, ve a "Domains" o "Dominios"
2. Selecciona tu dominio
3. Verifica que los DNS apunten a Hostinger:
   - Tipo A → IP de Hostinger
   - Tipo CNAME (www) → tu dominio

### 4.2 Configurar SSL (HTTPS)

1. En el panel de Hostinger, busca "SSL"
2. Activa el SSL gratuito de Let's Encrypt
3. Espera 5-10 minutos para que se active

---

## ✅ Paso 5: Verificar el Deployment

### 5.1 Prueba Básica

1. Abre tu dominio en el navegador: `https://tudominio.com`
2. Deberías ver la **Landing Page**
3. Haz clic en "Comenzar Ahora"
4. Deberías ver el **formulario de login**
5. Inicia sesión
6. Deberías entrar al **Dashboard**

### 5.2 Prueba de Rutas

1. Navega por diferentes secciones de la app
2. Recarga la página (F5) en cualquier sección
3. No debería dar error 404

### 5.3 Prueba en Móvil

1. Abre el sitio desde tu celular
2. Verifica que se vea bien
3. Prueba el flujo completo

---

## 🔄 Actualizaciones Futuras

Cada vez que hagas cambios en el código:

1. **Genera nuevo build**
   ```bash
   npm run build
   ```

2. **Sube solo los archivos modificados**
   - Puedes subir todo el contenido de `dist/` de nuevo
   - O solo los archivos que cambiaron

3. **Limpia caché del navegador**
   - Presiona `Ctrl + Shift + R` (Windows)
   - O `Cmd + Shift + R` (Mac)

---

## 🐛 Solución de Problemas

### Problema: "Error 404" al recargar la página

**Solución**: Verifica que el archivo `.htaccess` esté correctamente configurado.

### Problema: La página se ve en blanco

**Solución**: 
1. Abre la consola del navegador (F12)
2. Busca errores relacionados con Supabase
3. Verifica que las variables de entorno estén correctas

### Problema: "Failed to fetch" o errores de CORS

**Solución**:
1. Ve a Supabase Dashboard
2. Settings → API
3. Agrega tu dominio a "Allowed Origins"

### Problema: Los estilos no se cargan

**Solución**:
1. Verifica que todos los archivos de la carpeta `assets/` se hayan subido
2. Limpia caché del navegador

---

## 📊 Optimizaciones Adicionales

### Habilitar Cloudflare (Opcional pero Recomendado)

Hostinger ofrece integración con Cloudflare:

1. En el panel, busca "Cloudflare"
2. Actívalo (es gratis)
3. Beneficios:
   - CDN global (sitio más rápido)
   - Protección DDoS
   - Caché automático
   - Analytics

### Monitoreo

1. Configura Google Analytics (opcional)
2. Usa Hostinger Analytics para ver tráfico
3. Monitorea errores en la consola del navegador

---

## 📞 Soporte

Si tienes problemas:

1. **Hostinger Support**: Chat en vivo 24/7 en el panel
2. **Supabase Support**: [supabase.com/support](https://supabase.com/support)
3. **Documentación**: [docs.hostinger.com](https://docs.hostinger.com)

---

## ✨ ¡Listo!

Tu aplicación GestionNow ya está en producción y lista para captar clientes. 🎉

**Próximos pasos recomendados:**
- Compartir el link en redes sociales
- Configurar Google Analytics
- Crear contenido de marketing
- Ofrecer prueba gratuita de 15 días
