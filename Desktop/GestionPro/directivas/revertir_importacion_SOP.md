# Directiva para Revertir Importación de Productos

## Objetivo
Establecer un Procedimiento Operativo Estándar (SOP) seguro para deshacer una importación masiva de productos (CSV) realizada por error en la plataforma, revirtiendo el catálogo al estado anterior sin afectar ventas pasadas.

## Estrategia de Reversión
La creación de productos durante la importación (CSV) genera entradas que comparten una característica clave: **fueron creadas casi exactamente en el mismo segundo/minuto**.
El script de reversión se basará en eliminar los últimos *N* productos insertados por un *Tenant* en un lapso temporal específico, o los *N* más recientes si se indica la cantidad exacta.

### Reglas Críticas para la Reversión
1. **Verificar antes de destruir (`--dry-run`)**: El script en Python SIEMPRE debe preguntar por consola qué productos va a borrar y esperar una confirmación `Y/N` antes de ejecutar el comando `DELETE` en la base de datos.
2. **Propagación en Cascada (ON DELETE CASCADE)**: 
   - Al eliminar un registro en `products`, Supabase debería eliminar automáticamente los lotes (`inventory_batches`) y movimientos (`stock_movements`) si la Foreign Key está configurada con `CASCADE`.
   - *Nota Borde:* Las ventas (`sales_items`) no poseen un CASCADE estricto sobre el producto para conservar el historial. **SOLO** se deben revertir importaciones recién hechas que **no tengan ventas asociadas**. Si un producto importado ya se vendió, la base de datos abortará la eliminación o dejará huérfana la venta (dependiendo de la configuración RLS y Constraints).
3. **Filtro Estricto por Tenant**: Es fundamental que el script pida explícitamente el ID o Nombre del Cliente (Tenant) al que se le aplicará el borrado, para no vaciar catálogos de terceros por error.

## Parámetros del Script `scripts/revert_import.py`
El script debe recibir:
- `TENANT_ID` (o email del cliente para buscar su ID).
- `MINUTES_AGO` (Ventana de tiempo hacia atrás desde "ahora" para buscar productos creados).
- `LIMIT_COUNT` (Límite de seguridad de cantidad máxima de items a borrar, ej: 100).
