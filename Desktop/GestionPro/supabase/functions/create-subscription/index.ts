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

        const { reason, external_reference, amount, payer_email } = body;

        // Validar campos obligatorios
        if (!reason || !external_reference || !amount || !payer_email) {
            throw new Error(`Faltan campos obligatorios: ${JSON.stringify({ reason: !!reason, external_reference: !!external_reference, amount: !!amount, payer_email: !!payer_email })}`);
        }

        const token = Deno.env.get('MP_ACCESS_TOKEN')?.trim();

        if (!token) {
            throw new Error("Token no configurado en Deno.env");
        }

        // Extraer plan del external_reference (format: tenantId|PLAN)
        const parts = external_reference.split('|');
        const planCode = parts[1] || 'PRO';

        // Limpiar el email: quitar alias con '+' (ej: user+2@gmail.com → user@gmail.com)
        // porque Mercado Pago rechaza emails con '+'
        let cleanEmail = payer_email;
        if (cleanEmail.includes('+')) {
            const [localPart, domain] = cleanEmail.split('@');
            const cleanLocal = localPart.split('+')[0];
            cleanEmail = cleanLocal + '@' + domain;
        }

        console.log(`[DEPLOY] Creating Ad-Hoc Subscription for Plan: ${planCode}, original email: ${payer_email}, clean email: ${cleanEmail}`);

        const mpBody = {
            reason: reason.substring(0, 50),
            external_reference: external_reference,
            payer_email: cleanEmail,
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
