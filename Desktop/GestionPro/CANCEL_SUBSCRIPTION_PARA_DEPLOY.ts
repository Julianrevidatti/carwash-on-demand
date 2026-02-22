import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        const { tenantId } = await req.json()

        if (!tenantId) {
            throw new Error('tenantId is required')
        }

        console.log('[CANCEL-SUB] Cancelling subscription for tenant:', tenantId)

        // 1. Obtener el mp_preapproval_id del tenant
        const { data: tenant, error: fetchError } = await supabase
            .from('tenants')
            .select('mp_preapproval_id, business_name')
            .eq('id', tenantId)
            .single()

        if (fetchError) {
            throw new Error(`Error fetching tenant: ${fetchError.message}`)
        }

        if (!tenant?.mp_preapproval_id) {
            throw new Error('No hay suscripción activa de Mercado Pago')
        }

        console.log('[CANCEL-SUB] MP Preapproval ID:', tenant.mp_preapproval_id)

        // 2. Cancelar en Mercado Pago
        const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
        if (!mpToken) {
            throw new Error('MP_ACCESS_TOKEN not configured')
        }

        const mpResponse = await fetch(
            `https://api.mercadopago.com/preapproval/${tenant.mp_preapproval_id}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${mpToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'cancelled' })
            }
        )

        const mpData = await mpResponse.json()
        console.log('[CANCEL-SUB] MP Response:', mpData)

        if (!mpResponse.ok) {
            throw new Error(`Error al cancelar en Mercado Pago: ${mpData.message || JSON.stringify(mpData)}`)
        }

        // 3. Actualizar estado en la base de datos
        const { error: updateError } = await supabase
            .from('tenants')
            .update({
                payment_status: 'cancelled',
                mp_preapproval_id: null
            })
            .eq('id', tenantId)

        if (updateError) {
            throw new Error(`Error updating tenant: ${updateError.message}`)
        }

        console.log('[CANCEL-SUB] Subscription cancelled successfully for:', tenant.business_name)

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Suscripción cancelada con éxito'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error: any) {
        console.error('[CANCEL-SUB] ERROR:', error.message)
        return new Response(
            JSON.stringify({
                error: error.message,
                success: false
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
