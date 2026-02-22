# SOP: Actualizar Contenidos de Tutoriales (Imágenes)

## Objetivo
Asegurar que todas las imágenes en los tutoriales del sistema correspondan exactamente a lo que se está explicando en el texto.

## Entradas
- Archivos Markdown en `public/tutorials/guides/`
- Capturas de pantalla en `public/tutorials/screenshots/`

## Salidas
- Tutoriales actualizados con referencias a imágenes correctas.

## Lógica
1. **Auditoría:** Revisar cada archivo `.md` buscando etiquetas de imagen `![...]`.
2. **Verificación:** Comparar el texto circundante con el contenido visual de la imagen referenciada.
3. **Corrección:**
    - Si la imagen es incorrecta pero existe una correcta en `screenshots/`, actualizar la ruta.
    - Si no existe una imagen correcta, marcar para captura o generación.
4. **Validación:** Verificar que todos los enlaces a imágenes en los archivos `.md` sean válidos y apunten a archivos existentes en `public/tutorials/screenshots/`.

## Trampas Conocidas
- Nombres de archivos de imágenes con timestamps (ej. `media__1771385100533.png`) hacen difícil la identificación manual.
- Algunas imágenes pueden estar en `public/tutorials/guides/image.png` (verificado en list_dir).
- No borrar imágenes existentes a menos que se esté seguro de que no se usan en otros tutoriales.
