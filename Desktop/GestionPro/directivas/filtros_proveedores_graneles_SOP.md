# Directiva: Corrección de Filtros de Proveedores en Graneles

## Objetivo
Solucionar el problema reportado por el usuario donde los productos a granel aparecían como "Sin Proveedor" en el Dashboard (métricas de ventas) y no se filtraban correctamente por proveedor en los movimientos de stock (InventoryV2), a pesar de tener el proveedor asignado en la base de datos.

## Contexto
El objeto `Sale` (o `SaleItem`) o `StockMovement` asocia el `productId`. Las interfaces antiguas buscaban el producto únicamente en la matriz genérica `products`. Sin embargo, los productos a granel residen en una matriz separada `bulkProducts`. Cuando estas búsquedas (como `products.find(p => p.id === itemId)`) fallaban, se infería "Sin Proveedor" o se ignoraba en los filtros.

## Acciones a Realizar
1.  **Parchear DashboardV2.tsx**:
    -   Modificar `processSupplierSales` para que, si no encuentra el producto en `safeProducts`, realice una búsqueda en `bulkProducts`.
    -   Si encuentra coincidencia en `bulkProducts`, extraer su `supplierId` y resolver el nombre del proveedor.
2.  **Parchear InventoryV2.tsx**:
    -   Modificar la condición de filtrado `matchesSupplier` dentro del cálculo de `filteredHistory`.
    -   Si el producto no se encuentra en `products`, buscarlo en `bulkProducts` y validar su `supplierId` contra `historySupplierFilter`.

## Restricciones y Casos Borde
-   Garantizar que no se interrumpa el flujo si `bulkProducts` es `undefined` o está vacío (usar validaciones `bulkProducts.find(...)` con cuidado si no se manejan predeterminados, aunque ambos componentes parecen recibir un array predeterminado `[]`).
-   En `InventoryV2.tsx`, el prop `bulkProducts` se recibe como opcional, comprobar que exista u operar preventivamente.
-   **NUEVA RESTRICCIÓN VISUAL**: El simple filtrado lógico no es suficiente. `CartItem` guarda `supplierId` (útil si el producto original es eliminado). Para un cálculo robusto, en el Dashboard siempre confiar primero en `item.supplierId`, y usar el catálogo actual como fallback.
-   Además, el renderizado de la interfaz en las tablas (`InventoryV2.tsx`) debe realizar el mismo fallback explicitamente antes de mapear la etiqueta del proveedor.

## Entregable
Scripts de Python en `scripts/patch_filtros_graneles.py` y `scripts/patch_visual_proveedores.py` que reemplacen exactamente las líneas afectadas utilizando la lógica detallada iterativa.
