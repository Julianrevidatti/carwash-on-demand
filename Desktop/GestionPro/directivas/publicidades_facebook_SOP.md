# Directiva: Generación de Publicidades para Facebook/Instagram (SOP)

## Objetivo
Generar copy (texto) para redes sociales donde se discute sobre sistemas de gestión (POS), destacando la propuesta de valor "De dueños para dueños", el precio ($9.999) y la potencia del software. **CRÍTICO: El texto debe evadir filtros anti-spam/IA de los grupos.**

## Entradas
- **Nombre del Sistema:** **Gestion Now**.
- Público objetivo: Dueños de negocios y tiendas.
- **Precio Competitivo:** "Desde $9.999 / mes". 
- **NUEVAS CARACTERÍSTICAS:** Usuarios, métricas celular, lotes, ingresos/egresos, gastos fijos.

## Estrategia Anti-Bot (NUEVO)
Para saltar los filtros de IA de los grupos de Facebook que detectan publicidades de sistemas, debemos aplicar técnicas de "camuflaje de texto" y semántica conversacional:
1. **Evitar palabras "gatillo":** No escribir palabras como *VENCIMIENTO, GRATIS, PRECIO, VENDER, SISTEMA POINT OF SALE, SOFTWARE*.
2. **Reemplazo semántico:**
    - "Sistema de ventas" -> "Programa para el negocio" / "Herramienta de caja"
    - "Vender" -> "Despachar" / "Atender al mostrador"
    - "$9.999 por mes" -> "9.999 al m3s" / "Nueve mil por mes" / "menos de 10k"
    - "Prueba Gratis" -> "Probalo sin cargo" / "Uso l1bre por unos días"
3. **Errores intencionales (humanización):** Puntuación ligeramente informal, algún tilde faltante intencional, emojis espaciados.
4. **Formato:** No usar listas con viñetas perfectas (`✅`), sino guiones simples (`-` o `👉`) o texto de corrido en párrafos cortos, simulando que alguien escribió rápido desde su teléfono.

## Salidas
- Archivo de texto `.tmp/publicidades_facebook.txt` con el copy sugerido por el usuario re-adaptado con las reglas Anti-Bot ingresadas.

## Lógica y Pasos
1. Presentar "Gestion Now" como una recomendación súper casual de colega a colega.
2. Modificar el borrador original ("¿Seguís usando papel y lápiz?") para aplicarle las reglas de camuflaje.
3. El script en Python generará y sobreescribirá el archivo de textos `.tmp/publicidades_facebook.txt`.

## Restricciones / Casos Borde
- No usar links explícitos (`http://...`).
- Mantener la legibilidad para el humano, pero ofuscando palabras para el bot de Facebook.
