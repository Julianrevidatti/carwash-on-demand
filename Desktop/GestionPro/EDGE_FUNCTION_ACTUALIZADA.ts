import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const rawBody = await req.text()
        console.log("[DEPLOY] Received raw body:", rawBody)

        // Parse manually to ensure field names
        const body = JSON.parse(rawBody)
        const { reason, external_reference, payer_email, amount, tenant_id } = body

        if (!reason || !external_reference || !payer_email || !amount) {
            throw new Error(`Faltan campos obligatorios: ${JSON.stringify({ reason: !!reason, external_reference: !!external_reference, payer_email: !!payer_email, amount: !!amount })}`)
        }

        const token = Deno.env.get('MP_ACCESS_TOKEN')?.trim()

        if (!token) {
            throw new Error("Token no configurado en Deno.env")
        }

        // external_reference is the fixed plan code (BASIC, PRO, ULTIMATE)
        const plan = external_reference;

        // Clean payload for MP (Using Preapproval Plan for generic subscription link)
        const mpBody = {
            reason: reason.substring(0, 50),
            external_reference: external_reference, // Fixed plan code: BASIC, PRO, ULTIMATE
            // payer_email removed: Plans don't require it upfront
            auto_recurring: {
                frequency: 1,
                frequency_type: "months",
                transaction_amount: Math.round(Number(amount)),
                currency_id: "ARS"
            },
            back_url: `https://gestionnow.site/payment-success?plan=${plan}&tenant_id=${tenant_id || ''}` // Include plan and tenant_id
        }

        console.log("[DEPLOY] Final MP Payload (Plan):", JSON.stringify(mpBody))

        // Switch to preapproval_plan endpoint
        const mpResponse = await fetch("https://api.mercadopago.com/preapproval_plan", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(mpBody),
        })

        const data = await mpResponse.json()
        console.log(`[DEPLOY] MP Response (${mpResponse.status}):`, JSON.stringify(data))

        if (!mpResponse.ok) {
            return new Response(
                JSON.stringify({
                    error: data.message || "Error en Mercado Pago",
                    details: data.cause || data.error_list || data
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            )
        }

        return new Response(
            JSON.stringify({ init_point: data.init_point }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        )

    } catch (error: any) {
        console.error("[DEPLOY] ERROR:", error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        )
    }
})
