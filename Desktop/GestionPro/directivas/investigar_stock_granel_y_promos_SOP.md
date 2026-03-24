# Directiva: Corrección de Historial de Stock para Granel

## Objetivo
Resolver el problema con las ventas de productos a granel. 
- En el historial de movimientos de stock, las ventas a granel aparecen con cantidad `(0)` porque la base de datos redondea los decimales.
- El usuario asume que no se descuenta el stock por cómo se visualiza, aunque matemáticamente el stock en la tabla `bulk_products` sí usa decimales. Modificaremos el historial para que muestre el peso correcto.

## Diagnóstico y Restricciones Conocidas
- **Causa Raíz:** La tabla `stock_movements` en Supabase tiene la columna `quantity` definida como `INTEGER` (entero). Cuando se vende por ejemplo `0.5 Kg`, la base de datos registra el movimiento convirtiendo el valor a entero (`0`).
- **Solución Obligatoria:** Alterar el esquema de la base de datos para que `stock_movements.quantity` sea de tipo `NUMERIC`, permitiendo así guardar y mostrar los decimales en el historial.

## Pasos de Ejecución
1. El archivo `fix_stock_movements_quantity.sql` fue generado.
2. Como se trata de un DDL (`ALTER TABLE`), y no operamos con permisos de administrador directo a través de la API REST, este comando debe ejecutarse en el panel SQL del proyecto Supabase.
