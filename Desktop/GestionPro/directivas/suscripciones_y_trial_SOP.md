# SOP: Renovación Manual de Suscripción y Arreglo de Trial Banner

## Objetivo
Renovar manualmente la suscripción de un cliente (tenant) en la base de datos de Supabase y asegurar que el "Trial Banner" (Prueba Gratis) desaparezca correctamente del panel de control.

## Entradas (Inputs)
- **Identificador del Cliente:** `email`, `whatsapp_number`, o `id` del tenant.
- **Acción a realizar:** Establecer el estado de pago, plan y días de suscripción.

## Lógica y Pasos a Seguir
1. Conectar a la tabla `tenants` en Supabase utilizando la llave de servicio y la URL.
2. Buscar al cliente específico utilizando el campo `contact_name` (email) u otro identificador.
3. Actualizar los siguientes campos:
    - `payment_status` = "PAID" (DEBE SER MAYÚSCULA).
    - `status` = "ACTIVE"
    - `next_due_date` = Recalcular según los días a sumar, u omitir si el usuario ya los sumó manualmente y solo desea remover el banner.
    - `pricing_plan` = "PRO" o el plan que corresponda.

## Trampas Conocidas y Reglas (¡CRÍTICO!)
- **El Trial Banner:** El UI en `DashboardV2.tsx` (y otras vistas) verifica estrictamente que `paymentStatus` sea **desigual** a `"PAID"`. Si por error se guarda `"paid"` en minúsculas en la base de datos de Supabase, el React lo interpretará como distinto de `"PAID"` y el cartel interactivo seguirá mostrándose, causando fricción con clientes que ya pagaron.
- **Nota: No hacer:** Setear la propiedad `payment_status` en la base de datos a `'paid'` (minúscula), porque causa el error de que el banner de suscripción sigua apareciendo. **En su lugar, hacer:** Setear la propiedad `payment_status` estrictamente a `'PAID'` (todo en MAYÚSCULAS).

## El "Error del Reloj Local" (CRÍTICO)
Se detectó un bug donde el sistema podía bloquearse a sí mismo permanentemente si el reloj de la computadora del usuario estaba adelantado (cambiado por error a un mes futuro).
- **Efecto:** El cliente ve el mensaje "Periodo de Gracia Finalizado" aunque haya pagado.
- **Solución Automática:** El frontend ahora tiene una lógica de "auto-sanación" que restaura el estado a `ACTIVE` si detecta días restantes.
- **Solución Manual (SQL):** Ejecutar esto en Supabase:
```sql
UPDATE tenants 
SET status = 'ACTIVE', payment_status = 'PAID' 
WHERE id = 'ID_DEL_TENANT_AQUI' 
  AND next_due_date > NOW();
```
