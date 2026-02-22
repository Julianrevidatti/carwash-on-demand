import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const rawBody = await req.text();
        console.log("[DEPLOY] Received raw body:", rawBody);

        let body;
        try {
            body = JSON.parse(rawBody);
        } catch (e) {
            throw new Error("Invalid JSON body");
        }

        const { reason, external_reference, payer_email, amount } = body;

        // Validar campos obligatorios
        if (!reason || !external_reference || !payer_email || !amount) {
            throw new Error(`Faltan campos obligatorios: ${JSON.stringify({ reason: !!reason, external_reference: !!external_reference, payer_email: !!payer_email, amount: !!amount })}`);
        }

        const token = Deno.env.get('MP_ACCESS_TOKEN')?.trim();

        if (!token) {
            throw new Error("Token no configurado en Deno.env");
        }

        // FALLBACK EMAIL: Si tiene '+', usamos uno por defecto para no romper MP
        let finalEmail = payer_email;
        if (payer_email && payer_email.includes('+')) {
            console.log(`[DEPLOY] Email con '+' detectado (${payer_email}). Usando default.`);
            finalEmail = "suscripciones@gestionnow.site";
        }

        // Extraer plan del external_reference (format: tenantId|PLAN)
        const parts = external_reference.split('|');
        const planCode = parts[1] || 'PRO';

        // NOTA: Volvemos a usar Suscripción Ad-Hoc (/preapproval sin plan_id)
        // porque usar preapproval_plan_id requiere card_token_id (S2S) y no genera link de pago.

        console.log(`[DEPLOY] Creating Ad-Hoc Subscription for Plan: ${planCode}`);

        const mpBody = {
            reason: reason.substring(0, 50), // Asegurar longitud válida
            external_reference: external_reference, // Clave para vincular el pago
            payer_email: finalEmail, // Usar email validado
            auto_recurring: {
                frequency: 1,
                frequency_type: "months",
                transaction_amount: Math.round(Number(amount)),
                currency_id: "ARS"
            },
            back_url: `https://gestionnow.site/payment-success?external_reference=${encodeURIComponent(external_reference)}&plan=${planCode}`,
            status: "pending"
        };

        console.log("[DEPLOY] Payload:", JSON.stringify(mpBody));

        const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(mpBody),
        });

        const data = await mpResponse.json();

        if (!mpResponse.ok) {
            return new Response(
                JSON.stringify({
                    error: data.message || "Error en Mercado Pago",
                    details: data
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        return new Response(
            JSON.stringify({ init_point: data.init_point }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );

    } catch (error: any) {
        console.error("[DEPLOY] ERROR:", error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
});
