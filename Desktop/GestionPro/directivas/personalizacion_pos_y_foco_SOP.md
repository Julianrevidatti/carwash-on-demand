# Directiva: Personalización de POS y Foco Inteligente

Esta directiva define cómo manejar la interfaz del Punto de Venta (POS) para asegurar una experiencia fluida con lectores de código de barras y personalización de diseño.

## Lógica de Foco Inteligente (Sticky Focus)

Para que el lector de códigos funcione siempre sin que el usuario tenga que hacer clic en la barra de búsqueda, se aplica un "Sticky Focus".

### Reglas de Implementación:
- **Prioridad del Buscador**: Cualquier clic en zonas muertas de la pantalla o en botones de acción debe devolver el foco a la barra de búsqueda.
- **Retraso de Seguridad**: Al hacer clic en botones, se debe usar un `setTimeout` de al menos 50ms antes de devolver el foco. Esto permite que el evento `onClick` del botón se ejecute correctamente antes de que el foco cambie.
- **Excepciones Críticas**:
    - **Inputs Secundarios**: Si el usuario hace clic en otro `INPUT` (ej: "Monto recibido"), NO se debe robar el foco.
    - **Modales/Dialogos**: Mientras haya un modal abierto (`showWeightModal`, `showSuccessModal`, etc.), el foco automático debe desactivarse para permitir la interacción con el modal.

## Cálculo de Productos a Granel (Pesables)

Al vender productos pesables, el sistema debe permitir ingresar tanto el Peso (Kg) como el Monto ($).

### Lógica de Conversión:
- **Sincronización Bidireccional**: Al cambiar el Peso, se calcula el Monto (`peso * precio_kg`). Al cambiar el Monto, se calcula el Peso (`monto / precio_kg`).
- **Precisión**: El peso debe manejarse con 3 decimales y el monto con 2.
- **Validación**: Siempre mostrar un "Insight de Cálculo" que confirme el valor resultante antes de añadir al carrito.

## Personalización de Distribución (Layouts)

El POS debe ser altamente adaptable a diferentes monitores y preferencias.

### Variables de Diseño:
- **Sidebar Swap**: Capacidad de alternar entre carrito a la izquierda o a la derecha usando clases de orden (`order-first`, `order-last`).
- **Internal Reordering**: Capacidad de mover los totales y el botón de cobrar a la parte superior o inferior de la barra lateral.
- **Proporciones**: Implementar layouts con diferentes pesos visuales (66/33, 50/50, 40/60, 25/75).
- **Densidad Responsiva**: En resoluciones de notebook (xl) o menores, se aplican automáticamente paddings y gaps reducidos (`gap-2`, `p-2.5`) para maximizar la visibilidad sin romper la personalización elegida por el usuario.

## Trampas Conocidas y Restricciones
- **Safari (iOS)**: La impresión automática puede ser bloqueada por el navegador. Siempre ofrecer un botón manual en el modal de éxito.
- **Pérdida de Foco**: Si se añade un nuevo botón a la interfaz, verificar que la lógica global de clic no interfiera con su funcionalidad o que se le asigne el foco correctamente tras usarlo.
- **Jerarquía de Clases**: Las clases responsivas de Tailwind (`xl:`, `2xl:`) deben usarse junto con las clases de layout dinámico para asegurar un comportamiento coherente en todas las configuraciones.
