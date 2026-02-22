import { StateCreator } from 'zustand';
import { User, SaaSClient } from '../../../types';
import { supabase } from '../../lib/supabase';
import { PricingPlan } from '../../../config/planLimits';

export interface AuthSlice {
  currentUser: User | null;
  currentTenant: SaaSClient | null;
  saasClients: SaaSClient[];

  // Local Operator Session
  activeOperator: User | null;
  loginOperator: (userId: string, pin: string) => boolean;
  logoutOperator: () => void;
  setActiveOperator: (user: User | null) => void; // Exposed for direct setting

  setCurrentUser: (user: User | null) => void;
  setCurrentTenant: (tenant: SaaSClient | null) => void;
  fetchTenantByEmail: (email: string, userId?: string) => Promise<SaaSClient | null>;
  registerTenant: (client: SaaSClient) => Promise<void>;
  updateTenant: (client: SaaSClient) => Promise<void>;
  fetchCurrentTenant: (tenantId: string) => Promise<void>;
  verifySubscriptionPayment: (externalReference: string, plan: PricingPlan) => Promise<boolean>;
  fetchAllTenants: () => Promise<void>;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  // ... existing fields
  currentUser: null,
  currentTenant: null,
  saasClients: [],
  activeOperator: null,

  // ... existing methods
  loginOperator: (userId, pin) => {
    const state = get() as any;
    const user = state.systemUsers?.find((u: User) => u.id === userId);
    if (user && user.password === pin) {
      set({ activeOperator: user });
      return true;
    }
    return false;
  },
  logoutOperator: () => set({ activeOperator: null }),
  setActiveOperator: (user) => set({ activeOperator: user }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentTenant: (tenant) => set({ currentTenant: tenant }),

  fetchTenantByEmail: async (email, userId) => {
    try {
      let data = null;
      if (userId) {
        const result = await supabase.from('tenants').select('*').eq('user_id', userId).limit(1).maybeSingle();
        if (result.data) data = result.data;
      }
      if (!data) {
        const result = await supabase.from('tenants').select('*').eq('contact_name', email).limit(1).maybeSingle();
        if (result.data) {
          data = result.data;
          if (userId && !data.user_id) {
            await supabase.from('tenants').update({ user_id: userId }).eq('id', data.id);
          }
        }
      }
      if (data) {
        const tenant: SaaSClient = {
          id: data.id,
          businessName: data.business_name,
          contactName: data.contact_name,
          status: data.status,
          paymentStatus: data.payment_status,
          pricingPlan: data.pricing_plan,
          nextDueDate: data.next_due_date,
          mpPreapprovalId: data.mp_preapproval_id,
          adminUsername: data.contact_name,
          lastLogin: new Date().toISOString(),
          pendingAmount: 0,
          paymentMethod: 'TBD',
          whatsappNumber: data.whatsapp_number,
          address: data.address,
          cuit: data.cuit,
          createdAt: data.created_at,
          gracePeriodStart: data.grace_period_start
        };
        set((state) => ({
          currentTenant: tenant,
          saasClients: state.saasClients.some(c => c.id === tenant.id) ? state.saasClients : [...state.saasClients, tenant]
        }));
        return tenant;
      }
      return null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  registerTenant: async (client) => {
    set((state) => ({ currentTenant: client, saasClients: [...state.saasClients, client] }));
    const { error } = await supabase.from('tenants').insert([{
      id: client.id,
      business_name: client.businessName,
      contact_name: client.contactName,
      status: client.status,
      payment_status: client.paymentStatus,
      pricing_plan: client.pricingPlan,
      next_due_date: client.nextDueDate,
      user_id: client.userId,
      whatsapp_number: client.whatsappNumber,
      address: client.address,
      cuit: client.cuit,
      grace_period_start: client.gracePeriodStart
    }]);
    if (error) throw error;
  },

  updateTenant: async (client) => {
    const currentUser = get().currentUser;
    const isCurrentTenant = get().currentTenant?.id === client.id;

    set((state) => ({
      currentTenant: isCurrentTenant ? client : state.currentTenant,
      currentUser: (isCurrentTenant && currentUser) ? {
        ...currentUser,
        subscriptionExpiry: client.nextDueDate,
        // Sync plan and status to user for permission hooks
        pricingPlan: client.pricingPlan,
        status: client.status
      } : currentUser,
      saasClients: state.saasClients.map((c) => (c.id === client.id ? client : c)),
    }));

    await supabase.from('tenants').update({
      business_name: client.businessName,
      contact_name: client.contactName,
      status: client.status,
      payment_status: client.paymentStatus,
      pricing_plan: client.pricingPlan,
      next_due_date: client.nextDueDate,
      mp_preapproval_id: client.mpPreapprovalId,
      whatsapp_number: client.whatsappNumber,
      address: client.address,
      cuit: client.cuit,
      grace_period_start: client.gracePeriodStart
    }).eq('id', client.id);
  },

  fetchCurrentTenant: async (tenantId) => {
    const { data, error } = await supabase.from('tenants').select('*').eq('id', tenantId).maybeSingle();
    if (data && !error) {
      const tenant: SaaSClient = {
        id: data.id,
        businessName: data.business_name,
        contactName: data.contact_name,
        status: data.status,
        paymentStatus: data.payment_status,
        pricingPlan: data.pricing_plan,
        nextDueDate: data.next_due_date,
        mpPreapprovalId: data.mp_preapproval_id,
        adminUsername: data.contact_name,
        lastLogin: new Date().toISOString(),
        pendingAmount: 0,
        paymentMethod: 'TBD',
        whatsappNumber: data.whatsapp_number,
        address: data.address,
        cuit: data.cuit,
        createdAt: data.created_at,
        gracePeriodStart: data.grace_period_start
      };

      const currentUser = get().currentUser;
      const isCurrent = get().currentTenant?.id === tenantId;

      set({
        currentTenant: isCurrent ? tenant : get().currentTenant,
        currentUser: (isCurrent && currentUser) ? {
          ...currentUser,
          subscriptionExpiry: tenant.nextDueDate,
          pricingPlan: tenant.pricingPlan,
          status: tenant.status
        } : currentUser,
        saasClients: get().saasClients.map(c => c.id === tenantId ? tenant : c)
      });
    }
  },

  verifySubscriptionPayment: async (tenantId, plan) => {
    try {
      // 1. Check MP for authorized preapproval using plan code (BASIC, PRO, ULTIMATE)
      const { checkSubscriptionStatus } = await import('../../services/mercadoPago');
      const { PLATFORM_MP_CONFIG } = await import('../../../config/planLimits');

      // Check by plan code (external_reference in MP)
      const isApproved = await checkSubscriptionStatus(plan, PLATFORM_MP_CONFIG.accessToken);

      if (!isApproved) return false;

      // 2. Update Supabase using tenant_id
      const currentTenant = get().currentTenant;
      if (!currentTenant) return false;

      // Calculate next due date (30 days from now)
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 30);
      const nextDueDateISO = nextDue.toISOString();

      const { error } = await supabase.from('tenants').update({
        pricing_plan: plan,
        next_due_date: nextDueDateISO,
        payment_status: 'paid'
      }).eq('id', tenantId); // Use tenantId parameter instead of currentTenant.id

      if (error) throw error;

      // 3. Update Local State
      const updatedTenant = {
        ...currentTenant,
        pricingPlan: plan,
        nextDueDate: nextDueDateISO,
        paymentStatus: 'paid' as any
      };

      const currentUser = get().currentUser;
      const updatedUser = currentUser ? { ...currentUser, subscriptionExpiry: nextDueDateISO } : null;

      set({
        currentTenant: updatedTenant,
        currentUser: updatedUser,
        saasClients: get().saasClients.map(c => c.id === updatedTenant.id ? updatedTenant : c)
      });

      return true;
    } catch (error) {
      console.error('Error verifying subscription:', error);
      return false;
    }
  },

  fetchAllTenants: async () => {
    const { data, error } = await supabase.from('tenants').select('*');
    if (error) {
      console.error(error);
    } else if (data) {
      const allTenants = data.map(d => ({
        id: d.id,
        businessName: d.business_name,
        contactName: d.contact_name,
        status: d.status,
        paymentStatus: d.payment_status,
        pricingPlan: d.pricing_plan,
        nextDueDate: d.next_due_date,
        mpPreapprovalId: d.mp_preapproval_id,
        adminUsername: d.contact_name || 'unknown',
        lastLogin: new Date().toISOString(),
        pendingAmount: 0,
        paymentMethod: 'TBD',
        whatsappNumber: d.whatsapp_number,
        address: d.address,
        cuit: d.cuit,
        createdAt: d.created_at,
        gracePeriodStart: d.grace_period_start
      }));
      set({ saasClients: allTenants });
    }
  },
});

