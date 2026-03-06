import { StateCreator } from 'zustand';
import { SystemSettings, PaymentMethodConfig, Promotion, User } from '../../../types';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export interface SettingsSlice {
    settings: SystemSettings;
    paymentMethods: PaymentMethodConfig[];
    promotions: Promotion[];
    systemUsers: User[]; // Employees
    fetchSettings: () => Promise<void>;
    fetchPaymentMethods: () => Promise<void>;
    updateSettings: (settings: SystemSettings) => Promise<void>;
    updatePaymentMethods: (methods: PaymentMethodConfig[]) => Promise<void>;
    addPaymentMethod: (method: PaymentMethodConfig) => Promise<void>;
    addPromotion: (promo: Promotion) => Promise<void>;
    seedPromotions: (promotions: any[]) => Promise<void>;
    updatePromotion: (promo: Promotion) => Promise<void>;
    deletePromotion: (id: string) => Promise<void>;
    addSystemUser: (user: User) => Promise<void>;
    updateSystemUser: (user: User) => Promise<void>;
    deleteSystemUser: (id: string) => Promise<void>;
}

const INITIAL_SETTINGS: SystemSettings = {
    alertStockMinDefault: 5,
    alertDaysBeforeExpiration: 10,
    maxClientDebt: 10000,
    subscriptionStatus: 'ACTIVE',
    mercadoPagoAccessToken: '',
    mercadoPagoUserId: ''
};

export const createSettingsSlice: StateCreator<SettingsSlice> = (set, get) => ({
    settings: INITIAL_SETTINGS,
    paymentMethods: [],
    promotions: [],
    systemUsers: [],

    fetchPaymentMethods: async () => {
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        const { data } = await supabase.from('payment_methods').select('*').eq('tenant_id', tenantId);

        if (data) {
            const mappedMethods = data.map((pm: any) => ({
                id: pm.id,
                name: pm.name,
                surchargePercent: pm.surcharge_percent,
                isCash: pm.is_cash,
                isCurrentAccount: pm.is_current_account
            }));
            set({ paymentMethods: mappedMethods });
        }
    },

    fetchSettings: async () => {
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        const [settingsRes, promoRes, userRes] = await Promise.all([
            supabase.from('tenant_settings').select('*').eq('tenant_id', tenantId).single(),
            supabase.from('promotions').select('*').eq('tenant_id', tenantId),
            supabase.from('system_users').select('*').eq('tenant_id', tenantId)
        ]);

        // 1. Process Settings
        if (settingsRes.data) {
            set({
                settings: {
                    alertStockMinDefault: settingsRes.data.alert_stock_min_default,
                    alertDaysBeforeExpiration: settingsRes.data.alert_days_before_expiration,
                    maxClientDebt: settingsRes.data.max_client_debt,
                    mercadoPagoAccessToken: settingsRes.data.mercado_pago_access_token,
                    mercadoPagoUserId: settingsRes.data.mercado_pago_user_id,
                    subscriptionStatus: 'ACTIVE'
                }
            });
        }

        // 2. Process Promotions
        if (promoRes.data) {
            const mappedPromos = promoRes.data.map((p: any) => ({
                id: p.id,
                name: p.name,
                triggerProductIds: p.trigger_product_ids,
                promoPrice: p.promo_price,
                active: p.active,
                type: p.type || 'standard',
                quantityRequired: p.quantity_required,
                requirements: p.requirements,
                imageUrl: p.image_url
            }));
            set({ promotions: mappedPromos });
        }

        // 3. Process System Users
        if (userRes.data) {
            const mappedUsers = userRes.data.map((u: any) => ({
                id: u.id,
                username: u.username,
                name: u.full_name || u.username,
                role: u.role,
                pin: u.pin,
                permissions: u.permissions,
                subscriptionExpiry: u.subscription_expiry || new Date().toISOString()
            }));
            set({ systemUsers: mappedUsers as User[] });
        }
    },

    updateSettings: async (newSettings) => {
        set({ settings: newSettings });
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        // Upsert settings
        const { error } = await supabase.from('tenant_settings').upsert({
            tenant_id: tenantId,
            alert_stock_min_default: newSettings.alertStockMinDefault,
            alert_days_before_expiration: newSettings.alertDaysBeforeExpiration,
            max_client_debt: newSettings.maxClientDebt,
            mercado_pago_access_token: newSettings.mercadoPagoAccessToken,
            mercado_pago_user_id: newSettings.mercadoPagoUserId
        });
        if (error) console.error('Error updating settings:', error);
    },

    updatePaymentMethods: async (methods) => {
        set({ paymentMethods: methods });
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        // Prepare data for batch upsert
        const methodsToUpsert = methods.map(method => ({
            id: method.id,
            tenant_id: tenantId,
            name: method.name,
            surcharge_percent: method.surchargePercent,
            is_cash: method.isCash,
            is_current_account: method.isCurrentAccount
        }));

        const { error } = await supabase
            .from('payment_methods')
            .upsert(methodsToUpsert); // Supabase supports batch upsert by passing an array

        if (error) {
            console.error('Error updating payment methods:', error);
            toast.error('Error al sincronizar métodos de pago');
        } else {
            toast.success('Cambios guardados correctamente');
        }
    },

    addPaymentMethod: async (method: PaymentMethodConfig) => {
        set((state) => ({ paymentMethods: [...state.paymentMethods, method] }));
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        const { error } = await supabase.from('payment_methods').insert([{
            ...method,
            tenant_id: tenantId
        }]);
        if (error) console.error('Error adding payment method:', error);
    },

    addPromotion: async (promo) => {
        set((state) => ({ promotions: [...state.promotions, promo] }));
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        const dbPromo = {
            id: promo.id,
            name: promo.name,
            trigger_product_ids: promo.triggerProductIds,
            promo_price: promo.promoPrice,
            active: promo.active,
            type: promo.type,
            quantity_required: promo.quantityRequired,
            requirements: promo.requirements, // Added requirements
            image_url: promo.imageUrl,
            tenant_id: tenantId
        };

        const { error } = await supabase.from('promotions').insert([dbPromo]);
        if (error) {
            console.error('Error adding promotion:', error);
            toast.error('Error al guardar promoción', {
                description: `Detalle: ${error.message}`
            });
        } else {
            toast.success('Promoción guardada correctamente');
        }
    },

    seedPromotions: async (promotions) => {
        set({ promotions });
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        const { error } = await supabase
            .from('promotions')
            .upsert(promotions.map(p => ({
                id: p.id,
                name: p.name,
                trigger_product_ids: p.triggerProductIds,
                promo_price: p.promoPrice,
                active: p.active,
                type: p.type || 'standard',
                quantity_required: p.quantityRequired,
                requirements: p.requirements,
                image_url: p.imageUrl,
                tenant_id: tenantId
            })));

        if (error) console.error('Error seeding promotions:', error);
    },

    updatePromotion: async (promo) => {
        set((state) => ({
            promotions: state.promotions.map(p => p.id === promo.id ? promo : p)
        }));
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        const dbPromo = {
            name: promo.name,
            trigger_product_ids: promo.triggerProductIds,
            promo_price: promo.promoPrice,
            active: promo.active,
            type: promo.type,
            quantity_required: promo.quantityRequired,
            requirements: promo.requirements,
            image_url: promo.imageUrl,
            tenant_id: tenantId
        };

        const { error } = await supabase.from('promotions').update(dbPromo).eq('id', promo.id);

        if (error) {
            console.error('Error updating promotion:', error);
            toast.error('Error al actualizar promoción', {
                description: `Detalle: ${error.message}`
            });
        } else {
            toast.success('Promoción actualizada correctamente');
        }
    },

    deletePromotion: async (id) => {
        set((state) => ({ promotions: (state.promotions || []).filter(p => p.id !== id) }));
        const { error } = await supabase.from('promotions').delete().eq('id', id);
        if (error) console.error('Error deleting promotion:', error);
    },

    addSystemUser: async (user) => {
        set((state) => ({ systemUsers: [...state.systemUsers, user] }));
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        const { error } = await supabase.from('system_users').insert([{
            id: user.id,
            tenant_id: tenantId,
            username: user.username,
            full_name: user.name,
            role: user.role,
            pin: user.pin || '0000'
        }]);
        if (error) console.error('Error adding system user:', error);
    },

    deleteSystemUser: async (id) => {
        set((state) => ({ systemUsers: (state.systemUsers || []).filter(u => u.id !== id) }));
        const { error } = await supabase.from('system_users').delete().eq('id', id);
        if (error) console.error('Error deleting system user:', error);
    },

    updateSystemUser: async (user) => {
        set((state) => ({
            systemUsers: state.systemUsers.map(u => u.id === user.id ? user : u)
        }));
        const state = get() as any;
        const tenantId = state.currentTenant?.id;

        const { error } = await supabase.from('system_users').update({
            username: user.username,
            full_name: user.name, // Ensure mapping back to full_name
            role: user.role,
            pin: user.pin,
            permissions: user.permissions
        }).eq('id', user.id);

        if (error) console.error('Error updating system user:', error);
    },
});
