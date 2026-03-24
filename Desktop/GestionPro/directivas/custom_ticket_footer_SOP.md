# Directiva: Configuración de Pie de Ticket Personalizado

## Objetivo
Permitir a los usuarios configurar un texto personalizado ("Pie de Ticket") que aparecerá al final de todos sus comprobantes impresos, conservando obligatoriamente la marca de agua y los créditos del sistema original ("Software por GestionNow").

## Lógica y Pasos
1. **Actualizar Tipos (`types.ts`)**:
   - En la interfaz `SystemSettings`, añadir la propiedad opcional: `customTicketFooter?: string;`.
   
2. **Actualizar Configuración (`Settings.tsx`)**:
   - En la pestaña "Impresora" (agregada previamente), insertar un nuevo campo debajo de la configuración de ancho de papel (`paperWidth`).
   - El campo debe ser un `input` o `textarea` donde el usuario pueda tipear su mensaje de pie de ticket, enlazado a `settings.customTicketFooter`.
   - La vista previa (mockup) del ticket en esta misma pantalla debe reflejar este texto antes del mensaje de "GestionNow" si está ingresado.

3. **Actualizar Servicio de Impresión (`webPrintService.ts`)**:
   - En la función `printReceipt`, inyectar dinámicamente `settings.customTicketFooter` en el HTML.
   - Si `customTicketFooter` tiene texto, renderizar un bloque div centrado con el contenido, ubicado *después* del TOTAL y de la línea punteada divisoria, pero *antes* del texto fijo "Software por GestionNow".

## Restricciones y Casos Borde (Known Traps)
- **Marca de agua obligatoria**: El requerimiento del usuario especifica expresamente *no quitar* "GestionNow". Todo el texto personalizado debe ir arriba de este.
- **Seguridad en HTML**: Tener cuidado al inyectar el texto del usuario para no romper el HTML básico de la impresión. Se recomienda envolverlo en `<div>` simples.

## Acción a Ejecutar por Python
El bot creará y ejecutará `scripts/patch_ticket_footer.py` que usará reemplazos de string/regex para insertar las definiciones en los 3 archivos sin alterar la lógica de cajas anterior.
