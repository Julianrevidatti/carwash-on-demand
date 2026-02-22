# Acceso Multi-Dispositivo - GestionPro

## 🎯 Resumen

GestionPro ahora soporta **acceso simultáneo desde múltiples dispositivos** para el mismo usuario. Puedes iniciar sesión desde tu PC, tablet y móvil al mismo tiempo, y todos los datos se sincronizarán automáticamente.

## ✨ Características Implementadas

### 1. **Autenticación Multi-Dispositivo**
- ✅ Inicio de sesión con Clerk (OAuth)
- ✅ Tokens JWT que se sincronizan entre dispositivos
- ✅ Sesión persistente en Supabase
- ✅ Refresco automático de tokens cada 45 minutos

### 2. **Sincronización Automática**
- ✅ Los datos se guardan en Supabase en tiempo real
- ✅ Cada dispositivo obtiene los datos más recientes al cargar
- ✅ Los cambios realizados en un dispositivo están disponibles en otros

### 3. **Gestión de Sesiones**
- ✅ Verificación automática de sesión al cambiar de pestaña
- ✅ Reconexión automática si la sesión expira
- ✅ Indicador visual del estado de la sesión
- ✅ Botón manual para refrescar la sesión

## 🔧 Cómo Funciona

### Flujo de Autenticación

```
1. Usuario inicia sesión con Clerk (email/password o OAuth)
   ↓
2. Clerk genera un JWT token
   ↓
3. El token se intercambia con Supabase
   ↓
4. Supabase crea una sesión autenticada
   ↓
5. Los datos del usuario se cargan desde Supabase
   ↓
6. El token se refresca automáticamente cada 45 minutos
```

### Sincronización de Datos

```
Dispositivo A                    Supabase                    Dispositivo B
    |                               |                              |
    |--- Guarda Producto --------->|                              |
    |                               |<---- Consulta Productos -----|
    |                               |                              |
    |                               |--- Envía Producto ---------->|
    |                               |                              |
```

## 📱 Uso en Múltiples Dispositivos

### Escenario 1: PC + Móvil
1. Inicia sesión en tu PC de escritorio
2. Abre la aplicación en tu móvil
3. Inicia sesión con las mismas credenciales
4. Ambos dispositivos tendrán acceso a los mismos datos

### Escenario 2: Trabajo en Equipo
1. El administrador inicia sesión en la oficina
2. El cajero inicia sesión en el punto de venta
3. Ambos ven los mismos productos, ventas y configuraciones
4. Los cambios se reflejan en tiempo real

## 🛡️ Seguridad

### Tokens y Sesiones
- **Tokens JWT**: Expiran cada 1 hora
- **Refresco Automático**: Cada 45 minutos (antes de expirar)
- **Encriptación**: Todas las comunicaciones usan HTTPS
- **Row Level Security (RLS)**: Solo accedes a tus propios datos

### Políticas de Seguridad
```sql
-- Ejemplo de política RLS en Supabase
CREATE POLICY "Users can only access their own data"
ON products
FOR ALL
USING (tenant_id = auth.uid());
```

## 📊 Monitoreo de Sesión

### Panel de Estado de Sesión
Accede a **Configuración → Sesión** para ver:
- ✅ Estado de la sesión (Activa/Inactiva)
- ⏰ Última actualización
- 🔄 Refresco automático activo
- 📱 Dispositivos compatibles

### Indicadores Visuales
- **Verde con ✓**: Sesión activa y sincronizada
- **Rojo con ✗**: Sesión inactiva, requiere refresco
- **Animación de pulso**: Refresco automático activo

## 🔄 Refresco Manual

Si experimentas problemas de sincronización:
1. Ve a **Configuración → Sesión**
2. Haz clic en el botón **Refrescar**
3. Espera a que se actualice el estado

## ⚠️ Solución de Problemas

### Problema: "Sesión Inactiva"
**Solución**: 
1. Verifica tu conexión a internet
2. Haz clic en "Refrescar" en el panel de sesión
3. Si persiste, cierra sesión y vuelve a iniciar

### Problema: "Los datos no se sincronizan"
**Solución**:
1. Verifica que estés conectado a internet
2. Refresca la página (F5)
3. Verifica el estado de la sesión en Configuración

### Problema: "Token MISSING"
**Solución**:
1. Verifica la configuración de Clerk
2. Asegúrate de tener el template "supabase" configurado
3. Contacta al administrador del sistema

## 🔐 Configuración de Clerk (Administradores)

Para que el sistema funcione correctamente, necesitas:

1. **Crear un JWT Template en Clerk**:
   - Nombre: `supabase`
   - Claims personalizados:
     ```json
     {
       "sub": "{{user.id}}",
       "email": "{{user.primary_email_address}}"
     }
     ```

2. **Configurar Supabase**:
   - Agregar el JWT Secret de Clerk en Supabase
   - Configurar las políticas RLS

## 📝 Notas Técnicas

### Archivos Modificados
- `src/lib/sessionManager.ts` - Gestor de sesiones
- `App.tsx` - Integración del gestor de sesiones
- `components/SessionStatus.tsx` - Panel de estado
- `components/Settings.tsx` - Pestaña de sesión

### Dependencias
- `@clerk/clerk-react` - Autenticación
- `@supabase/supabase-js` - Base de datos
- `zustand` - Estado global

## 🚀 Próximas Mejoras

- [ ] Notificaciones push entre dispositivos
- [ ] Sincronización en tiempo real con WebSockets
- [ ] Historial de dispositivos conectados
- [ ] Opción para cerrar sesión en todos los dispositivos

## 📞 Soporte

Si tienes problemas con el acceso multi-dispositivo:
1. Revisa esta documentación
2. Verifica el panel de estado de sesión
3. Contacta al administrador del sistema

---

**Última actualización**: Diciembre 2025
**Versión**: 2.0.0
