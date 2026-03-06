import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const body = await req.json()
    console.log("Recibido Webhook MP:", body)

    // Mercado Pago envía avisos de tipo 'preapproval' o 'subscription_preapproval' para suscripciones
    if (body.type === 'preapproval' || body.type === 'subscription_preapproval') {
      const id = body.data?.id || body.id

      // 1. Consultamos a Mercado Pago los detalles de la suscripción
      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}`
        }
      })

      const subscription = await mpResponse.json()

      if (subscription.status === 'authorized') {
        const externalReference = subscription.external_reference // tenantId|PLAN

        // Parse external_reference
        let tenantId = externalReference;
        let newPlan = null;

        if (externalReference && externalReference.includes('|')) {
          const parts = externalReference.split('|');
          tenantId = parts[0];
          newPlan = parts[1];
        }

        // 1.5. Obtener fechas actuales del tenant para sumar días
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('next_due_date')
          .eq('id', tenantId)
          .single()

        // 2. Calculamos nueva fecha (si ya le queda tiempo, se lo sumamos a ese tiempo, sino desde hoy)
        const nextDue = new Date()
        if (tenantData && tenantData.next_due_date) {
          const currentDueDate = new Date(tenantData.next_due_date)
          if (currentDueDate > nextDue) {
            nextDue.setTime(currentDueDate.getTime())
          }
        }
        nextDue.setDate(nextDue.getDate() + 30)

        const updateData: any = {
          next_due_date: nextDue.toISOString(),
          payment_status: 'PAID', // CORREGIDO: MAYÚSCULA PARA QUE DESAPAREZCA EL BANNER
          status: 'ACTIVE', // IMPORTANTE: Desbloquear cuenta
          grace_period_start: null, // Limpiar periodo de gracia
          mp_preapproval_id: id
        };

        if (newPlan) {
          updateData.pricing_plan = newPlan;
        }

        console.log(`[WEBHOOK] Procesando pago para Tenant: ${tenantId}, Plan: ${newPlan || 'Mantener'}`);

        const { data, error } = await supabase
          .from('tenants')
          .update(updateData)
          .eq('id', tenantId)
          .select()

        if (error) {
          console.error("Error actualizando tenant:", error);
          throw error;
        }
        console.log("Tenant actualizado y desbloqueado con éxito:", data);
      }

      // Handle cancellation from Mercado Pago
      if (subscription.status === 'cancelled') {
        console.log("Suscripción cancelada detectada:", id);

        const { data, error } = await supabase
          .from('tenants')
          .update({
            payment_status: 'cancelled',
            mp_preapproval_id: null
          })
          .eq('mp_preapproval_id', id)
          .select()

        if (error) {
          console.error("Error actualizando tenant cancelado:", error);
          throw error;
        }
        console.log("Tenant marcado como cancelado:", data);
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error: any) {
    console.error("Error en webhook:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
