# SOP: Compilación de Ejecutables (.exe) para Aplicaciones Electron

## Objetivo
Automatizar y estandarizar la creación de los archivos ejecutables (.exe) para las aplicaciones derivadas (ej. StockPro, FashionPro). Garantiza que las compilaciones se realicen de forma sistemática utilizando npm y electron-builder.

## Entradas
- Rutas de los directorios de los proyectos (ej. `C:/Users/54112/Desktop/GestionPro/StockPro`).

## Salidas
- Archivos `.exe` generados dentro de la carpeta `release/` de cada directorio correspondiente.

## Flujo de Trabajo

1.  **Verificación del Entorno:**
    *   Verificar que la carpeta destino exista y contenga un archivo `package.json`.
    *   Asegurarse de que el script cuenta con permisos para ejecutar comandos de sistema (`npm`).

2.  **Instalación de Dependencias:**
    *   Ejecutar `npm cache clean --force` (opcional si hay problemas previos) e instalar dependencias usando `npm install`.

3.  **Compilación y Empaquetado:**
    *   Ejecutar el comando de construcción de electron definido en el `package.json` (`npm run build`).
    *   Capturar los logs de salida (stdout y stderr) para identificar posibles errores durante el empaquetado.

4.  **Confirmación de Salida:**
    *   Una vez que el proceso culmine, verificar la existencia de un archivo `.exe` en el directorio `release/` del proyecto.

## Restricciones y Casos Borde
*   **Nota:** Si la terminal lanza un error de compilación (ej. TypeScript `tsc` fallando), es probable que el código base contenga errores de sintaxis que deban resolverse antes de poder crear el `.exe`. No intentar omitir la verificación de tipos a menos que sea estrictamente necesario.
*   **Nota:** No usar `"language": "3082"` ni `"installerLanguages": ["es_419"]` en la configuración "nsis" del package.json porque causa el error de compilación "warning 7025: undefined is not a valid language id" que se trata como error fatal. En su lugar, usar `"installerLanguages": ["es_ES"]` sin el atributo `language`.
*   **Límites de RAM:** El empaquetado mediante electron-builder puede consumir memoria significativa y tiempo, por tanto los scripts deben poseer un timeout adecuado al esperar el resultado.
