# Solución de Desincronización de Stock vs Historial

## El Problema
Al ingresar productos (ya sea por lote o a granel), el sistema mostraba el movimiento en el historial pero el stock real del producto seguía siendo cero o no se incrementaba de forma precisa.

## La Causa Raíz
1. **Lotes Normales (`InventoryV2.tsx` -> `handleStockEntry`)**: La función `onAddBatch` es asíncrona y hace una inserción a la base de datos (`inventory_batches`). Sin embargo, el componente no estaba usando `await` para esperar esa acción. Si la base de datos fallaba o el servicio tardaba, el `onAddStockMovement` (que genera el registro en el historial de movimientos) se ejecutaba igual de manera incondicional. Esto creaba "historiales fantasmas" cuando el lote fallaba en insertarse.
2. **Productos a Granel (`BulkProductsManager` -> `handleAddStock`)**: Al incrementar el stock, se estaba actualizando vía `onUpdate(updatedProduct)` pero no se estaba disparando la función de registrar movimiento en el historial (`useStore.getState().addStockMovement(...)`).

## Restricciones y Casos Borde (El Paso de Memoria)
- **Nota: No ejecutar guardados de bases de datos que impliquen múltiples tablas sin `await`**, porque causa que la segunda acción asuma que la primera siempre funcionó. 
- **En su lugar**, debes usar constructores async/await: `await useStore.getState().addBatch(newBatch);` y recién proceder a registrar el movimiento histórico.
- **Auditoría**: Siempre que toques código relacionado con inventario (`inventorySlice.ts`), asegúrate de que el estado local solo se actualice **después** de confirmar inserciones en la BD.
