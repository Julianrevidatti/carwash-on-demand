import { supabase } from '../lib/supabase';
import { OperationalExpense } from '../../types';

export const expenseService = {
    // Fetch all expenses for the current tenant's current month
    async getExpenses(tenantId: string) {
        const { data, error } = await supabase
            .from('operational_expenses')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('date', { ascending: false });

        if (error) throw error;

        // Convert DB keys to Frontend keys if necessary (snake_case -> camelCase is handled if we map)
        // Or we keep consistency. Let's map for safety.
        return data.map((e: any) => ({
            id: e.id,
            category: e.category,
            description: e.description,
            amount: Number(e.amount),
            date: e.date,
            isRecurring: e.is_recurring,
            status: e.status
        } as OperationalExpense));
    },

    async addExpense(tenantId: string, expense: OperationalExpense) {
        const { data, error } = await supabase
            .from('operational_expenses')
            .insert({
                id: expense.id, // Optional, let DB gen if uuid
                tenant_id: tenantId,
                description: expense.description,
                amount: expense.amount,
                category: expense.category,
                date: expense.date,
                status: expense.status,
                is_recurring: expense.isRecurring
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteExpense(id: string) {
        const { error } = await supabase
            .from('operational_expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async updateExpense(id: string, updates: Partial<OperationalExpense>) {
        // Map frontend keys to backend snake_case
        const dbUpdates: any = {};
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.amount) dbUpdates.amount = updates.amount;
        if (updates.description) dbUpdates.description = updates.description;
        if (updates.category) dbUpdates.category = updates.category;
        if (updates.date) dbUpdates.date = updates.date;
        if (updates.isRecurring !== undefined) dbUpdates.is_recurring = updates.isRecurring;

        const { error } = await supabase
            .from('operational_expenses')
            .update(dbUpdates)
            .eq('id', id);

        if (error) throw error;
    }
};
