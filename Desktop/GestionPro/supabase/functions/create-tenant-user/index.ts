import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseServiceRoleKey) {
            throw new Error('Variables de entorno de Supabase no configuradas');
        }

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const rawBody = await req.text();
        console.log("[CREATE_TENANT] Received body:", rawBody);

        let body;
        try {
            body = JSON.parse(rawBody);
        } catch (e) {
            throw new Error("Invalid JSON body");
        }

        const { email, password, businessName, pricingPlan, address, cuit } = body;

        // Validate required fields
        if (!email || !password || !businessName) {
            return new Response(
                JSON.stringify({ error: 'Faltan campos obligatorios' }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        // 1. Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Auto confirm so they can login immediately
            user_metadata: {
                role: 'owner',
                businessName: businessName
            }
        });

        if (authError) {
            console.error("[CREATE_TENANT] Auth Error:", authError);
            return new Response(
                JSON.stringify({ error: authError.message }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        const userId = authData.user.id;
        const tenantId = crypto.randomUUID();

        // 30 days initial next_due_date per requirements
        const nextDueDate = new Date();
        nextDueDate.setDate(nextDueDate.getDate() + 30);

        // 2. Create Tenant Record
        const { error: tenantError } = await supabaseAdmin.from('tenants').insert([{
            id: tenantId,
            user_id: userId,
            business_name: businessName,
            contact_name: email,
            status: 'ACTIVE',
            payment_status: 'PAID', // Start as PAID/Trial
            pricing_plan: pricingPlan || 'PRO',
            next_due_date: nextDueDate.toISOString(),
            address: address || null,
            cuit: cuit || null,
            created_at: new Date().toISOString()
        }]);

        if (tenantError) {
            console.error("[CREATE_TENANT] Tenant Insert Error:", tenantError);
            // Rollback auth user creation if tenant insert fails
            await supabaseAdmin.auth.admin.deleteUser(userId);
            return new Response(
                JSON.stringify({ error: tenantError.message }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                user: authData.user,
                tenantId: tenantId
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );

    } catch (error: any) {
        console.error("[CREATE_TENANT] Internal Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
