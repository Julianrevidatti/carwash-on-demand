import { SystemSettings } from '../../types';
import { PLATFORM_MP_CONFIG } from '../../config/planLimits';

interface MPItem {
    title: string;
    quantity: number;
    currency_id: string;
    unit_price: number;
}

interface MPPreference {
    items: MPItem[];
    external_reference: string;
    back_urls: {
        success: string;
        failure: string;
        pending: string;
    };
    auto_return: "approved" | "all";
}

export const createPreference = async (items: MPItem[], settings: SystemSettings | { mpAccessToken: string }, externalReference: string) => {
    // Determine token: Use provided token (e.g. for platform) or the one from merchant settings
    const token = (settings as any).mpAccessToken || (settings as SystemSettings).mercadoPagoAccessToken;

    if (!token || token === 'PLATFORM_OWNER_TOKEN') {
        const platformToken = PLATFORM_MP_CONFIG.accessToken;
        if (!platformToken) {
            throw new Error("Token de Plataforma no configurado. El dueño debe configurar PLATFORM_MP_CONFIG.");
        }
        return executeCreatePreference(items, platformToken, externalReference);
    }

    return executeCreatePreference(items, token, externalReference);
};

const executeCreatePreference = async (items: MPItem[], token: string, externalReference: string) => {
    const preference: MPPreference = {
        items,
        external_reference: externalReference,
        back_urls: {
            success: window.location.origin,
            failure: window.location.origin,
            pending: window.location.origin,
        },
        auto_return: "approved",
    };

    try {
        const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(preference),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("MP Error:", errorData);
            throw new Error(errorData.message || "Error al crear preferencia de pago");
        }

        const data = await response.json();
        if (!data.init_point) {
            throw new Error("La respuesta de Mercado Pago no contiene un punto de inicio (init_point).");
        }
        return data.init_point;
    } catch (error) {
        console.error("Error creating preference:", error);
        throw error;
    }
};

export const validateToken = async (accessToken: string): Promise<boolean> => {
    try {
        const response = await fetch("https://api.mercadopago.com/v1/payment_methods", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
        });
        return response.ok;
    } catch (error) {
        console.error("Error validating token:", error);
        return false;
    }
};

export const checkPaymentStatus = async (externalReference: string, token: string): Promise<boolean> => {
    if (!token) return false;

    try {
        // The correct parameter for searching by external_reference is 'external_reference'
        const response = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${externalReference}&status=approved`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                // Sort by date_approved descending
                data.results.sort((a: any, b: any) => new Date(b.date_approved).getTime() - new Date(a.date_approved).getTime());
                const recentPayment = data.results[0];

                // Check if payment is recent (e.g., within last 30-35 days)
                const paymentDate = new Date(recentPayment.date_approved);
                const daysAgo = (new Date().getTime() - paymentDate.getTime()) / (1000 * 3600 * 24);

                // Allow a buffer, e.g., 32 days to cover monthly cycles
                if (daysAgo <= 32) {
                    return true;
                } else {
                    console.log("Payment found but expired:", paymentDate);
                    return false;
                }
            }
        }
        return false;
    } catch (error) {
        console.error("Error checking payment status:", error);
        return false;
    }
};

/**
 * Check if a subscription (preapproval) is active in Mercado Pago
 * This is used for recurring subscription payments
 */
export const checkSubscriptionStatus = async (externalReference: string, token: string): Promise<boolean> => {
    if (!token) return false;

    try {
        // Search for preapprovals with the external_reference
        const response = await fetch(
            `https://api.mercadopago.com/preapproval/search?external_reference=${externalReference}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            }
        );

        if (response.ok) {
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                // Check if there's an authorized subscription
                const authorizedSubscription = data.results.find(
                    (sub: any) => sub.status === 'authorized' || sub.status === 'paused'
                );

                if (authorizedSubscription) {
                    console.log("Active subscription found:", authorizedSubscription.id);
                    return true;
                }
            }
        }
        return false;
    } catch (error) {
        console.error("Error checking subscription status:", error);
        return false;
    }
};
