import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createInventorySlice, InventorySlice } from './slices/inventorySlice';
import { createSalesSlice, SalesSlice } from './slices/salesSlice';
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice';
import { createExpenseSlice, ExpenseSlice } from './slices/expenseSlice';

type StoreState = AuthSlice & InventorySlice & SalesSlice & SettingsSlice & ExpenseSlice;

export const useStore = create<StoreState>()(
    persist(
        (...a) => ({
            ...createAuthSlice(...a),
            ...createInventorySlice(...a),
            ...createSalesSlice(...a),
            ...createSettingsSlice(...a),
            ...createExpenseSlice(...a),
        }),
        {
            name: 'gestion-pro-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // Persist auth and configurations for instant availability
                currentUser: state.currentUser,
                currentTenant: state.currentTenant,
                settings: state.settings,
                paymentMethods: state.paymentMethods,
                promotions: state.promotions,
                systemUsers: state.systemUsers,
                // Business data remains excluded for fresh sync
                // products, batches, suppliers, stockMovements, etc.
            })
        }
    )
);
