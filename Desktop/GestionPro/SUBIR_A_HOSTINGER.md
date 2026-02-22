# Guía Rápida: Subir a Hostinger

## ✅ Build Completado

El build de producción se generó exitosamente en la carpeta `dist/`

**Archivos generados:**
- `dist/index.html` (2.89 kB)
- `dist/assets/index-CbZq3opf.css` (0.24 kB)
- `dist/assets/index-udl_1_UY.js` (1,059.61 kB)

---

## 📤 Pasos para Subir a Hostinger

### 1. Accede a Hostinger
- Ve a [hpanel.hostinger.com](https://hpanel.hostinger.com)
- Inicia sesión

### 2. Abre el File Manager
- Busca "File Manager" o "Administrador de Archivos"
- Haz clic para abrirlo

### 3. Navega a public_html
- Esta es la carpeta raíz de tu sitio web
- **IMPORTANTE:** Si hay archivos antiguos, elimínalos primero

### 4. Sube los Archivos
- Haz clic en "Upload" o "Subir"
- Selecciona **TODOS** los archivos dentro de `dist/`:
  - `index.html`
  - Carpeta `assets/` completa
- **NO subas la carpeta `dist/` en sí, solo su contenido**
- Espera a que termine la subida

### 5. Crea el archivo .htaccess
- En File Manager, haz clic en "New File"
- Nómbralo: `.htaccess`
- Haz clic derecho → Edit
- Pega este contenido:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Redirigir HTTP a HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  
  # SPA Routing
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Compresión GZIP
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

- Guarda el archivo

### 6. Activa SSL (HTTPS)
- En el panel de Hostinger, busca "SSL"
- Activa el SSL gratuito de Let's Encrypt
- Espera 5-10 minutos

### 7. Verifica
- Abre tu dominio: `https://tudominio.com`
- Deberías ver la landing page
- Prueba hacer clic en "Comenzar Ahora"
- Verifica que funcione en móvil

---

## 🔧 Solución de Problemas

### Página en blanco
1. Abre la consola del navegador (F12)
2. Busca errores
3. Verifica que todos los archivos se hayan subido

### Error 404 al recargar
- Verifica que el archivo `.htaccess` esté creado correctamente

### Estilos no se cargan
- Verifica que la carpeta `assets/` se haya subido completa
- Limpia caché: `Ctrl + Shift + R`

---

## 📝 Checklist Final

- [ ] Archivos de `dist/` subidos a `public_html`
- [ ] Archivo `.htaccess` creado
- [ ] SSL activado
- [ ] Sitio funciona en `https://tudominio.com`
- [ ] Landing page se ve correctamente
- [ ] Botón "Comenzar Ahora" funciona
- [ ] Probado en móvil

---

## 🎉 ¡Listo!

Tu landing page está en producción. Mañana vemos la implementación del sistema de pagos.

**Próximos pasos:**
- Compartir el link en redes sociales
- Configurar Google Analytics (opcional)
- Empezar a captar clientes
