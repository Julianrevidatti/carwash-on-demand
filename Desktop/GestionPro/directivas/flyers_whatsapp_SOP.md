# Directiva: Generación de Flyers para Estados de WhatsApp (SOP)

## Objetivo
Generar flyers publicitarios optimizados para **Estados de WhatsApp** (formato vertical 9:16 o similar) para promocionar el software de gestión empresarial.

## Entradas
- **Producto:** Sistema de gestión "Gestion Now".
- **Público Objetivo:** Dueños de comercios, kioscos, minimarkets que buscan modernizar su atención y control de stock.
- **Precio Competitivo:** "Desde $8.000 / mes" o similar (basado en publicidades previas).
- **Formato Visual:** Imágenes en formato vertical (9:16). Diseño minimalista, corporativo y altamente profesional. Paleta de colores restringida (blanco, gris oscuro, y un solo color de acento sobrio como azul marino o negro). Sin elementos saturados ni recargados.
- **Textos:** Textos cortos y legibles en pantallas móviles.

## Salidas
- Imágenes generadas mediante la herramienta de IA del Agente (`generate_image`), guardadas localmente o presentadas en el chat como adjuntos para que el usuario las descargue. No es factible generar imágenes complejas usando scripts de Python locales sin una API key externa, por lo cual se delega a las herramientas directas del modelo.

## Lógica y Pasos
1. Interpretar la solicitud del usuario asegurando el formato "WhatsApp Status" (vertical).
2. Construir _prompts_ en inglés o español claros para la herramienta `generate_image`.
3. Evitar sobrecargar la imagen de texto, ya que la IA generativa puede cometer errores tipográficos. Priorizar estética y un texto central fuerte (ej: "Gestion Now").
4. Generar al menos 2 variaciones para dar opciones al usuario.

## Restricciones / Casos Borde
- **Texto en IA:** La IA suele tener problemas con textos largos. Mantener las palabras en la imagen al mínimo ("Gestion Now", "Control de Stock", "App").
- **Formato:** Asegurar aspect ratio vertical si es posible, o diseños que encajen bien en móviles.
