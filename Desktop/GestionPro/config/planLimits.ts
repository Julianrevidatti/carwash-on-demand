export const PLAN_LIMITS = {
    FREE: {
        maxUsers: 1,
        maxProducts: 50,
        canAccessReports: true,
        canAccessOrderPlanner: true,
        canAccessPromotions: true,
        supportLevel: 'community',
        label: 'Prueba Gratis',
        monthlyPrice: 0
    },
    BASIC: {
        maxUsers: 1,
        maxProducts: 200,
        canAccessReports: true,
        canAccessOrderPlanner: false,
        canAccessPromotions: false,
        supportLevel: 'community',
        label: 'Plan Básico',
        monthlyPrice: 9999
    },
    PRO: {
        maxUsers: 3,
        maxProducts: 750,
        canAccessReports: true,
        canAccessOrderPlanner: true,
        canAccessPromotions: true,
        supportLevel: 'priority',
        label: 'Plan Pro',
        monthlyPrice: 13999
    },
    ULTIMATE: {
        maxUsers: 999, // Unlimited
        maxProducts: 999999, // Unlimited
        canAccessReports: true,
        canAccessOrderPlanner: true,
        canAccessPromotions: true,
        supportLevel: 'dedicated',
        label: 'Plan Ultimate',
        monthlyPrice: 29999
    }
};

export type PricingPlan = keyof typeof PLAN_LIMITS;

// PLATFORM LEVEL CONFIG (For SaaS Subscriptions)
// This is the owner's MP account where subscription money goes
export const PLATFORM_MP_CONFIG = {
    accessToken: import.meta.env.VITE_PLATFORM_MP_ACCESS_TOKEN || '',
    publicKey: import.meta.env.VITE_PLATFORM_MP_PUBLIC_KEY || ''
};
