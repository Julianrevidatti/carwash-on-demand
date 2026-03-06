# SOP: Creación de Cuentas de Cliente desde Panel Owner

## Objetivo
Permitir que el dueño del sistema (Owner) pueda crear cuentas completas para nuevos clientes (tenants) directamente desde su panel de administración, incluyendo el usuario de acceso en Supabase Auth, sin requerir confirmación por correo electrónico.

## Entradas (Inputs)
- **Datos requeridos:** `email` (Username), `password` (Contraseña temporal), `businessName` (Nombre del negocio), `pricingPlan` (Plan Inicial).
- **Acción a realizar:** Ejecutar la Edge Function `create-tenant-user` que comunica con la API Admin de Supabase.

## Lógica y Pasos a Seguir
1. El Owner de la plataforma entra a `SaaSAdmin.tsx` (Panel Owner).
2. Abre el modal de "Registrar Nuevo Cliente" y completa los campos obligatorios, incluyendo una **contraseña temporal** que luego le compartirá al cliente.
3. El frontend (vía `authSlice.ts -> createTenantUser`) llama a la Edge Function alojada en Supabase bajo `/functions/v1/create-tenant-user`.
4. La Edge Function procesa el request usando la `SUPABASE_SERVICE_ROLE_KEY` (que otorga permisos de administrador para saltar políticas de seguridad y validaciones estándar):
    - Crea el usuario en Supabase Auth usando `supabase.auth.admin.createUser({ email, password, email_confirm: true })`.
    - Toma el UUID devuelto y crea una nueva fila en la tabla `tenants` enlazando a ese UUID.
    - Se incluyen valores por defecto obligatorios, ej: `status: 'ACTIVE'`, `payment_status: 'PAID'` y `next_due_date` a 30 días para empezar.
5. Si el proceso falla a medio camino (ej, el usuario se crea pero el tenant lanza un error), la función intenta hacer un *rollback* borrando el usuario que acabó de ser creado en Auth con `supabase.auth.admin.deleteUser()`.
6. Si la respuesta es exitosa (código 200), el estado global (Zustand) recarga la lista completa llamando a `fetchAllTenants()`.

## Trampas Conocidas y Reglas (¡CRÍTICO!)

- **No crear cuentas usando `supabase.auth.signUp` si no quieres requerir verificación de Email:** `signUp` está pensado para registros públicos y envía un email de confirmación. Por eso **fallaba** el intentar crear usuarios desde el UI client-side.
- **Nota: No hacer:** Intentar insertar filas directamente en la tabla `tenants` y pretender que el cliente ya tiene acceso.
- **En su lugar, hacer:** Invocar la Edge Function con permisos de servicio (`service_role`) para crear sincronizadamente tanto el record del usuario en Auth como su contraparte en la base de datos de negocio (`tenants`).
- **Problemas de CORS en la Edge Function:** Las edge functions son llamadas por un origen diferente desde el cliente web. *Siempre* manejar el request tipo `OPTIONS` y devolver los *headers* correspondientes (`Access-Control-Allow-Origin: *`, `...Methods`, `...Headers`). Si se omite, la red del navegador bloqueará la petición e impedirá llamar a la función.
