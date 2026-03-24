# Directiva: Creador de Etiquetas de Precios

## Objetivo
Agregar una nueva funcionalidad en GestionPro que permita a los usuarios seleccionar productos y generar un formato de impresión con etiquetas de precios para colocar en las góndolas.

## Lógica y Pasos
1. **Componente Principal (`src/components/PriceTagsCreator.tsx`)**:
   - Crear una interfaz donde el usuario pueda buscar productos y agregarlos a una "Cola de Impresión".
   - **(NUEVO)** Mostrar un `select` o dropdown para filtrar la lista de productos por Proveedor (recibiendo `suppliers` como prop).
   - **(NUEVO)** Agregar un botón "Seleccionar Todo" que tome los productos actualmente filtrados (por búsqueda y proveedor) y los añada a la cola de impresión con cantidad 1 (o incremente si existen).
   - Generar un bloque HTML optimizado (`@media print`) que organice las etiquetas en un layout flexible para hoja A4.
   - **(RESTRICCIÓN FÍSICA AÑADIDA)** Cada etiqueta debe medir estrictamente **70 x 40 mm** usando `width: 70mm` y `height: 40mm`.
   - **(RESTRICCIÓN DE APROVECHAMIENTO A4)** Para aprovechar toda la hoja y colocar 3 columnas exactas (3 x 70mm = 210mm, que es el ancho del A4), el grid debe tener `gap: 0`, la página debe tener `@page { margin: 0; size: A4; }` y el contenedor no debe tener padding. Así encajarán 21 etiquetas por página (3x7).

2. **Integración en Navbar/Sidebar (`src/components/Sidebar.tsx` / `App.tsx`)**:
   - Agregar una opción de menú llamada "Etiquetas" bajo la sección de Inventario o Comercial.
   - Usar el ícono `<Tag />` de Lucide-React.
   - En `App.tsx`, pasar el prop `suppliers={suppliers}` al render de `<PriceTagsCreator />`.

## Restricciones y Casos Borde (Known Traps)
- **Bloqueo emergentes:** Al igual que en tickets, para la impresión se debe evitar abrir pestañas nuevas que puedan ser bloqueadas. Una opción es usar un componente "imprimible" en la misma página y ocultar el resto de la UI, o un `iframe` para el `window.print()`.
- **CSS Print Mode:** El diseño de la etiqueta debe manejar correctamente los saltos de página (`page-break-inside: avoid;`) para que no se corte una etiqueta por la mitad al imprimir en A4.

## Acción a Ejecutar por Python
El script `scripts/creador_etiquetas.py` generará dinámicamente el código React para `PriceTagsCreator.tsx` y usará expresiones regulares para parchear `App.tsx` y `Sidebar.tsx`. Tolerará cambios de formato y no sobre-escribirá archivos si ya fue aplicado.
