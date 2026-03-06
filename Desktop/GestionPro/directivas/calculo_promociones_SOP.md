# Directiva: Cálculo de Promociones en Desglose de Caja

## Objetivo
Unificar la lógica mediante la cual se atribuyen los descuentos ("promociones") a los distintos proveedores en los reportes de facturación, específicamente en el Desglose de Caja (Reporte Z) y en el Registro de Ventas.

## Restricciones y Casos Borde
- **Inconsistencia de Cálculos (Ticket vs Z-Report)**: Previamente, el cierre de caja re-calculaba teóricamente los descuentos mirando las promociones activas e ignorando las cantidades (`item.quantity`). Esto causaba que la suma ticket por ticket diera `$50,600` mientras que el desglose mostraba datos erróneos.
- **Solución Obligatoria**: **NUNCA** se debe intentar "re-adivinar" el descuento basándose en la configuración de las promociones en el backend en el momento de generar el reporte. Las promociones cambian, se desactivan o borran. 

## Lógica Determinista de Atribución
Para atribuir las ganancias/descuentos de un ticket a múltiples proveedores, debe usarse la misma matemática estricta siempre:

1. **Obtener Descuento Real**: `ticketDiscount = ticketGross - ticketNet`
   - `ticketGross` es la suma estricta de `item.price * item.quantity` de todos los ítems.
   - `ticketNet` es `sale.total - sale.surcharge`.
2. **Atribución Basada en Triggers**:
   - Identificar si alguno de los ítems del ticket pertenece a los triggers de *cualquier* promoción en el sistema (`promotions.some(...)`).
   - **CRÍTICO:** Las promociones tienen dos formas de almacenar los productos objetivo:
     - Promociones estándar/flexibles pueden usar `triggerProductIds`.
     - Promociones pesables usan `requirements`.
     - El check debe ser: `p.triggerProductIds?.includes(itemId) || p.requirements?.some(r => r.productId === itemId)`.
     - Omitir `requirements` causará que las promociones pesables se procesen como un descuento manual (distribuyendo injustamente la penalidad).
   - Si un proveedor o varios participan de esos triggers, ellos absorben el `ticketDiscount`.
   - **CRÍTICO:** Los descuentos manuales NO existen. Nunca distribuir un descuento sobrante entre todos los proveedores. Si ningún ítem matchea una promo pero hay descuento, fue una promoción fallida/borrada y no debe penalizar a los proveedores inocentes.
3. **Distribución Proporcional**:
   - `supplierDiscount = ticketDiscount * (supplierGrossInPromo / totalPromoGrossDeTicket)`
   - La venta neta del proveedor pasa a ser `supplierNet = supplierGross - supplierDiscount`.

## Actualización y Mantenimiento
Si se agregan nuevas modalidades de promociones (ej. 2x1 automático a nivel backend que no requiere creación por el usuario), la lógica de distribución proporcional seguirá siendo válida, pues el descuento siempre estará consolidado a nivel `sale.discount` o de `sale.total`. Solo se debe garantizar que el identificador del producto en oferta ("trigger" o "requirements") sea detectable.
