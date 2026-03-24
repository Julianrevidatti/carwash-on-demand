# Directiva: Modificación del Botón "Ver Demo"

## Objetivo
Actualizar el comportamiento del botón "Ver Demo en Vivo" en la página de aterrizaje (`LandingPage.tsx`) para que, al ser presionado, informe al usuario que debe crearse una cuenta para acceder a los 7 días de prueba gratuitos, y posteriormente abrir el modal de registro/login.

## Lógica y Pasos
1. **Localizar el botón en `LandingPage.tsx`**:
   - Encontrar la etiqueta `<button>` que contiene el texto "Ver Demo en Vivo".
2. **Importar notificaciones (Opcional pero recomendado)**:
   - Importar `toast` de `sonner` para una mejor experiencia de usuario, o usar `alert()` como fallback. En este caso, para no fallar usaremos un simple `alert` o verificaremos si `sonner` está disponible.
3. **Modificar el evento `onClick`**:
   - Agregar o modificar el manejador `onClick` del botón.
   - El manejador debe ejecutar: `alert("Solo tenés que crearte una cuenta y aprovechar los 7 días de prueba");` seguido de `onGoToLogin();`.
   - Alternativamente, si se importa `toast`, usar `toast.info("Solo tenés que crearte una cuenta y aprovechar los 7 días de prueba"); onGoToLogin();`.

## Restricciones y Casos Borde (Known Traps)
- El componente `LandingPage` recibe como prop `onGoToLogin`. Asegurarse de invocar a esta función para no romper la navegación del usuario.
- El botón actualmente puede no tener un manejador `onClick`. Si es así, debe añadirse con la sintaxis correcta de JSX.

## Acción a Ejecutar por Python
El script `scripts/patch_demo_button.py` deberá leer `LandingPage.tsx`, buscar el botón "Ver Demo en Vivo", reemplazarlo inyectando el evento `onClick` con el mensaje requerido y luego guardar el archivo.
