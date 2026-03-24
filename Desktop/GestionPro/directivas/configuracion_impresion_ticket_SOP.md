# Directiva: Configuración e Impresión de Tickets en Sistema Online (GestionPro)

## Objetivo
Replicar la funcionalidad de configuración, previsualización e impresión de tickets del sistema de escritorio (StockPro) en el entorno web (GestionPro). La configuración debe persistir por usuario (Tenant) y aplicarse a todas las ventas realizadas.

## Lógica y Pasos
1. **Servicio de Impresión Web:**
   - Crear `src/services/webPrintService.ts` en lugar de usar librerías de escritorio (Electron).
   - Generar el HTML del ticket dinámicamente según el ancho (58mm u 80mm).
   - Inyectar el HTML en un `iframe` oculto en el DOM e invocar `contentWindow.print()` para levantar la ventana de impresión del navegador.

2. **Tipos y Estado (types.ts / store):**
   - Asegurar que `SystemSettings` en `types.ts` incluya las propiedades de impresión si no existen, o usar propiedades almacenadas localmente. (Ej: `paperWidth`, `autoPrint`).

3. **Interfaz de Configuración (Settings.tsx):**
   - Añadir una nueva pestaña "Impresora" en `Settings.tsx`.
   - Incluir controles para: "Ancho de Papel" (58mm/80mm), "Impresión automática".
   - Incluir la "Vista previa del Encabezado del Ticket".
   - Botón de "Imprimir Ticket de Prueba".

4. **Interfaz de Punto de Venta (POS.tsx):**
   - Al ejecutarse `onCompleteSale`, verificar si la impresión automática está activa.
   - Si está activa, llamar al servicio de impresión con los datos de la venta recién finalizada.
   - Agregar botón "Imprimir Último Ticket".

## Restricciones y Casos Borde Known Traps)
- **Bloqueo de Pop-ups:** No usar `window.open` para imprimir, ya que los navegadores móviles o de escritorio lo bloquean. Usar un `iframe` oculto agregado al `document.body`.
- **Estilos de Impresión:** El HTML generado debe tener estilos in-line (`<style>`) que definan `@page { margin: 0; }` y anchos fijos para evitar que el navegador agregue márgenes por defecto a los tickets térmicos.
- **Persistencia Múltiples Dispositivos:** Tratar de guardar la configuración de impresión (Ancho, Autoprint) de manera que se recuerde por navegador (localStorage) o por perfil de Tenant (base de datos) según corresponda. Si es por caja, a veces es preferible `localStorage` para que una PC use 58mm y otra 80mm.
- **Asincronía en POS:** Asegurarse de realizar la llamada a `print` después de que `onCompleteSale` termine satisfactoriamente para no bloquear la UI o imprimir si falla la venta a BD.

## Acción a Ejecutar por Python
El script `scripts/patch_ticket_print.py` debe parchear `types.ts`, `Settings.tsx`, crear `webPrintService.ts` y parchear `POS.tsx`.
