# Directiva para Importación de Productos

## Objetivo
Definir la estructura exacta y las reglas (SOP) para la importación masiva de productos (unitarios y packs). 
**ACTUALIZACIÓN**: La herramienta Web nativa ("Importar CSV" en Inventario) ahora ha sido unificada para soportar el mismo formato avanzado completo.

## Estructura Unificada (Para UI Web o Scripts)
El archivo CSV (ej: `Ejemplo.csv`) debe respetar **exactamente** estas 8 columnas en el siguiente orden, separadas por coma `,`:

`barcode,name,cost,profitMargin,price,isPack,supplierId,stock`

### Ejemplo válido `Ejemplo.csv`:
```csv
barcode,name,cost,profitMargin,price,isPack,supplierId,stock
7791234567890,Alfajor de Chocolate,500,50,750,false,a1b2c3d4-e5f6-7890-1234-567890abcdef,100
0000000000001,Pack x6 Cerveza,5000,30,6500,true,,20
```

### Reglas para el Analizador (Parser):
- **Opcionalidad**: 
  - `name` y `price` (o `cost` y `profitMargin` que formen el precio) son obligatorios.
  - El resto de los campos pueden ir vacíos (ejemplo: `, ,`).
- **Margen y Costo**: Si falta el Precio pero envías Costo y Margen, el sistema calcula el precio. Si envías Precio y Costo pero no Margen, el sistema calcula el margen.
- **Stock Inicial**: Si la columna `stock` tiene un número mayor a cero, la importación le generará automáticamente a ese producto un Lote Inicial (fecha de vencimiento +1 año).
- **isPack**: Acepta `true`, `false`, `1` o `0`.
- **supplierId (Proveedor)**: Si vas a enviar este UUID, **debe existir** en la tabla Supabase de lo contrario fallará silenciosamente. Puedes mandarlo en blanco.
