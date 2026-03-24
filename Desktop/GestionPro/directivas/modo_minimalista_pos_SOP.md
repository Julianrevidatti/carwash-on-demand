# SOP: Modo POS Minimalista (Solo Búsqueda)

## Objetivo
Permitir a los usuarios del POS ocultar la galería de productos por defecto para centrar la atención en el carrito (ticket), ahorrando espacio en pantallas pequeñas y optimizando el flujo para uso con escáner.

## Entradas / Configuración
- Ajuste: `posHideProductsByDefault` (boolean).
- Ubicación: Ajustes > Personalización > Modo Minimalista.

## Lógica de Funcionamiento
1. **Estado de Reposo (Sin Búsqueda)**:
   - Si `posHideProductsByDefault` es `true` y el término de búsqueda está vacío:
     - Ocultar la cuadrícula de productos.
     - Expandir el carrito al área central (layout de 1 columna).
     - Mostrar detalles del ticket con un diseño más amplio.
2. **Estado de Acción (Búsqueda Activa)**:
   - Al empezar a escribir o escanear un código (searchTerm no vacío):
     - Restaurar automáticamente el layout de 2 o 3 columnas (según la configuración de `posLayout`).
     - Mostrar los resultados de la búsqueda inmediatamente.
3. **Persistencia**:
   - Guardar el estado en `localStorage` (Zustand persist).
   - Sincronizar con la tabla `tenant_settings` en Supabase.

## Restricciones y Casos Borde
- **SQL Requerido**: Se debe añadir la columna `pos_hide_products_by_default` a la tabla `tenant_settings` para que la configuración persista entre sesiones/dispositivos.
- **Pérdida de Foco**: El buscador debe mantener el auto-foco para que el escáner funcione siempre, incluso cuando los productos están ocultos.
- **Layouts Especiales**: El modo minimalista ignora temporalmente el `posLayout` elegido (compacto, clásico, etc.) mientras el carrito esté centralizado para asegurar la mejor visualización.

## Solución de Problemas
- Si la configuración no se guarda: Verificar que la columna SQL exista.
- Si los productos no aparecen al buscar: Comprobar que el `searchTerm` se esté actualizando correctamente en `POS.tsx`.
