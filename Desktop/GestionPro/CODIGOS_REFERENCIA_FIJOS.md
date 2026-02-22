# Códigos de Referencia FIJOS en Mercado Pago

## Problema Original

Intentamos usar `externalReference = tenantId|PLAN` pero **el código de referencia en MP es FIJO por plan**, no cambia por cada suscriptor.

## Solución Correcta

### En Mercado Pago (Manual):

Crea 3 planes separados con códigos fijos:

| Plan | Código de Referencia | Precio |
|------|---------------------|--------|
| **BASIC** | `BASIC` | $9.999 |
| **PRO** | `PRO` | $13.999 |
| **ULTIMATE** | `ULTIMATE` | $29.999 |

### En el Código:

**✅ Ya actualizado:**
- [`preApprovalService.ts`](file:///c:/Users/54112/Desktop/GestionPro/src/services/preApprovalService.ts)
  - Usa `external_reference = plan` (BASIC, PRO, o ULTIMATE)
  - Guarda `tenant_id` en localStorage
  - Pasa `tenant_id` al Edge Function

**⚠️ Pendiente de actualizar manualmente:**

#### 1. Edge Function: `create-subscription/index.ts`

Cambiar de:
```typescript
const { reason, external_reference, payer_email, amount } = await req.json();
```

A:
```typescript
const { reason, external_reference, payer_email, amount, tenant_id } = await req.json();

// ...

back_url: `https://gestionnow.site/payment-success?plan=${external_reference}&tenant_id=${tenant_id || ''}`
```

#### 2. PaymentSuccessPage: `components/PaymentSuccessPage.tsx`

Cambiar líneas 18-25 de:
```typescript
const externalReference = urlParams.get('external_reference') || '';
const tenantId = externalReference.split('|')[0] || currentTenant?.id || '';
```

A:
```typescript
const planParam = urlParams.get('plan') || 'PRO';
const tenantIdFromUrl = urlParams.get('tenant_id') || '';
const tenantId = tenantIdFromUrl || 
                 localStorage.getItem('pending_subscription_tenant') || 
                 currentTenant?.id || '';
```

#### 3. authSlice: `src/store/slices/authSlice.ts`

Cambiar la función `verifySubscriptionPayment` (líneas 183-195):

De:
```typescript
verifySubscriptionPayment: async (externalReference, plan) => {
  const tenantId = externalReference.split('|')[0];
  const isApproved = await checkSubscriptionStatus(externalReference, ...);
```

A:
```typescript
verifySubscriptionPayment: async (tenantId, plan) => {
  // Check by plan code (BASIC, PRO, ULTIMATE)
  const isApproved = await checkSubscriptionStatus(plan, ...);
```

---

## Flujo Completo

1. **Usuario selecciona plan** → Guarda `tenant_id` en localStorage
2. **Se redirige a MP** con plan BASIC/PRO/ULTIMATE
3. **MP crea suscripción individual** (genera `preapproval_id`)
4. **MP redirige de vuelta** con `?plan=PRO&tenant_id=xxx`
5. **Página de confirmación**:
   - Lee `tenant_id` de URL o localStorage
   - Verifica suscripción con MP
   - Actualiza tenant en Supabase

---

## ⚠️ IMPORTANTE

El webhook `mp-webhook` también debe actualizarse para buscar por `mp_preapproval_id` en lugar de `external_reference` cuando se reciba la notificación de pago.

---

## ¿Necesitas que actualice estos archivos manualmente?

Puedo ayudarte a editar cada archivo uno por uno, o puedes hacerlo tú siguiendo esta guía.
