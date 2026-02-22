import { PLATFORM_MP_CONFIG } from '../../config/planLimits';
import { supabase } from '../lib/supabase';

interface PreApprovalPlanResponse {
    id: string;
    init_point: string;
}

/**
 * Service to handle Mercado Pago Pre-approvals (Subscriptions/Automated Debit)
 * Documentation: https://www.mercadopago.com.ar/developers/es/reference/subscriptions/_preapproval/post
 * 
 * IMPORTANTE: Los códigos de referencia en MP son FIJOS por plan (BASIC, PRO, ULTIMATE)
 * El tenant se vincula mediante el preapproval_id que retorna MP
 */

export const createSubscriptionLink = async (
    tenant: any,
    plan: 'BASIC' | 'PRO' | 'ULTIMATE',
    amount: number,
    email?: string
): Promise<string> => {
    try {
        const reason = `Suscripción ${plan} - ${tenant.businessName || 'Cliente GestionPro'}`;
        // Código de referencia con formato: tenantId|PLAN (requerido por Edge Function)
        const externalReference = `${tenant.id}|${plan}`; // "tenant-uuid|BASIC"
        const payerEmail = email || tenant.contactName || 'noreply@gestionpro.com';

        // Validate email format basic
        const validEmail = payerEmail.includes('@') ? payerEmail : 'noreply@gestionpro.com';

        console.log("Creating Subscription Plan for:", { reason, externalReference, plan, tenantId: tenant.id });

        // Guardar el tenant_id en metadata para vincularlo después del pago
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-subscription`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                reason: reason.substring(0, 50),
                external_reference: externalReference, // Plan name: BASIC, PRO, ULTIMATE
                payer_email: validEmail,
                amount: Math.round(Number(amount)),
                tenant_id: tenant.id // Enviamos el tenant_id para guardarlo en metadata
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Edge Function Error:", errorData);
            throw new Error(errorData.error || "Error al crear plan de suscripción");
        }

        const data = await response.json();
        console.log("Subscription Plan Created:", data);

        if (!data.init_point) {
            throw new Error("La respuesta de Mercado Pago no contiene un punto de inicio (init_point).");
        }

        // Guardamos temporalmente el tenant_id en localStorage para vincular después del pago
        localStorage.setItem('pending_subscription_tenant', tenant.id);
        localStorage.setItem('pending_subscription_plan', plan);

        return data.init_point;

    } catch (error: any) {
        console.error("Error creating subscription (Service):", error);
        throw error;
    }
};

export const cancelSubscription = async (tenantId: string): Promise<boolean> => {
    try {
        console.log("Cancelling subscription for tenant:", tenantId);
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ tenantId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Error al cancelar la suscripción");
        }

        const data = await response.json();
        console.log("Subscription Cancelled:", data);
        return true;

    } catch (error: any) {
        console.error("Error cancelling subscription (Service):", error);
        throw error;
    }
};
