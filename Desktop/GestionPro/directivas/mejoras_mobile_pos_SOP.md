# Directiva: Mejora de Experiencia Móvil en POS

## Objetivo
Optimizar la pantalla del Punto de Venta (`POS.tsx`) para la vista en teléfonos celulares y tablets, resolviendo el problema actual de que el carrito y el botón de cobrar quedan muy abajo (debajo de toda la grilla de productos). **El requisito estricto es que la vista de computadora (Desktop) permanezca exactamente igual a como está hoy.**

## Diseño Responsivo Propuesto
Se utilizarán las clases responsivas preexistentes de Tailwind CSS (`lg:`) para separar el comportamiento.

1. **Computadora (Resolución >= `lg`)**: 
   Permanece el layout de `grid-cols-3` donde los productos ocupan 2 columnas y el carrito 1 columna fija a la derecha.
   
2. **Móvil (Resolución < `lg`)**:
   - **Grilla de productos**: Ocupa el 100% del ancho.
   - **Carrito (Sidebar)**: Estará oculto por defecto.
   - **Barra Flotante Inferior (Sticky Bottom Bar)**: Se agregará una barra fija en la parte inferior de la pantalla que muestre la cantidad de ítems agregados, el total actual ($) y un botón de "Ver Carrito / Cobrar".
   - **Panel del Carrito (Modal/Offcanvas)**: Al tocar el botón de la barra inferior, el panel lateral original (Sidebar del carrito) se abrirá ocupando toda la pantalla (modal fijo) permitiendo ver el detalle, elegir el cliente, método de pago y, finalmente, presionar el botón "COBRAR" gigante. Desde ese panel también se podrá volver a la vista de productos tocando un botón de "Cerrar".

## Implementación Técnica (`POS.tsx`)
1. Instanciar estado nuevo: `const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);`
2. **Contenedor Principal**: Eliminar la restricción estricta de altura `h-[calc(100vh-140px)]` pura y cambiarla por un flex o mantenerla adaptada. *(Nota: La implementación actual tiene `h-[calc(100vh-...)]`. Debemos cuidar no romper el scroll del desktop).*
3. **Sidebar de Checkout**: 
   - Agregar lógica condicional a sus clases de clase padre. 
   - En Desktop: `lg:relative lg:flex lg:col-span-1 lg:h-full lg:z-0 lg:translate-x-0` 
   - En Mobile: `fixed inset-0 z-50 bg-white translate-x-full transition-transform` dependiente de `isMobileCartOpen` para deslizarse (`translate-x-0`).
   - Agregar un botón "Volver a Productos" adentro del sidebar que solo se vea en mobile (`lg:hidden`).
4. **Barra Fija Footer**:
   - Renderizar un `<div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-between items-center">`
   - Si el carrito está vacío, se puede ocultar para dejar más espacio, o mostrar grisado.
   - Si tiene ítems, muestra el total y dispara `setIsMobileCartOpen(true)`.

## Restricciones y Casos Borde
- **Scroll del Carrito**: El panel lateral del carrito es internamente _scrollable_ (ya tiene `overflow-y-auto`). Al pasarlo a pantalla completa en móvil se debe garantizar que esa sección siga scrolleando, de lo contrario los productos del medio empujarán al botón "COBRAR" fuera de la vista en pantallas chicas.
- **Acceso a botones**: Asegurarse de que en estado Mobile el botón de "Cerrar" del carrito quede a mano.
- **Mercado Pago Modal**: El POS tiene un modal extra para Mercado Pago. Modals sobre mods (z-index) pueden dar problemas visuales, verificar que `z-index` de MP sea altísimo (`z-[60]`).

## Acciones del Python Script
El script `scripts/patch_mobile_pos.py` inyectará el estado base y el JSX modificado usando expresiones regulares exactas para no dañar las lógicas transaccionales que son altamente críticas en este componente.
