# Directiva: Configuración de Variables de Entorno (.env)

## Objetivo
Mantener las claves de API y otros secretos fuera del control de versiones utilizando un archivo `.env`.

## Entradas
- Clave de API de Google (desde `google-services.json`).
- Archivo `.gitignore`.
- Archivo `app/build.gradle.kts`.
- Archivo `AndroidManifest.xml`.

## Lógica y Pasos
1. **Crear archivo `.env`**: Crear un archivo en la raíz del proyecto con el formato `KEY_NAME=VALUE`.
2. **Ignorar `.env`**: Asegurarse de que `.env` esté listado en `.gitignore`.
3. **Cargar en Gradle**: Modificar `app/build.gradle.kts` para leer el archivo `.env` y exponer las variables mediante `manifestPlaceholders` o `buildConfigField`.
4. **Usar en AndroidManifest**: Reemplazar valores hardcoded por placeholders `${VARIABLE_NAME}`.

## Restricciones y Advertencias
- **IMPORTANTE**: Nunca comitear el archivo `.env`.
- **WARNING**: Si el archivo `.env` no existe, el build podría fallar si no se maneja el caso nulo.
- **CAUTION**: Asegurarse de que el nombre del placeholder en Gradle coincida exactamente con el del `AndroidManifest.xml`.
