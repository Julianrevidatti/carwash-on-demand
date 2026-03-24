# Directiva: Mejoras de Layout POS para Pantallas Pequeñas (Notebook) - Compactación

Esta directiva define cómo optimizar la interfaz del POS mediante la compactación de elementos en dispositivos con resolución limitada.

## Compactación de Componentes

Para asegurar que el carrito sea visible en notebooks, los componentes del sidebar deben ser densos:

1.  **Totales**: Los valores deben estar alineados y usar tipografía moderada (`text-sm` o `text-base`). Eliminar márgenes redundantes.
2.  **Métodos de Pago**:
    - Usar `gap-1` en lugar de `gap-2`.
    - Paddings de `1` o `1.5`.
    - Fuentes `text-xs` para etiquetas largas.
3.  **Botón de Cobro**:
    - Reducir `py` a `1.5` o `2` en pantallas menores a `2xl`.
    - Mantener el peso de la fuente pero reducir el espaciado interno.
4.  **Sección MP QR**:
    - El tamaño del QR no debe exceder los `120px` en pantallas compactas.

## Distribución Dinámica
- Respetar la configuración `posSidebarActions` elegida por el usuario.
- Independientemente del orden (arriba o abajo), la sección de acciones debe ser lo más pequeña posible para dejar espacio al contenedor con `flex-1` del carrito.

## Reglas de CSS/Tailwind
- Utilizar prefijos responsivos (`xl:`, `2xl:`) para aplicar la compactación solo donde sea necesario.
- Asegurar que los contenedores `flex-1` tengan `min-h-0` para evitar que se expandan más allá de su contenedor padre y rompan el scroll.
