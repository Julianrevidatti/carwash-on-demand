import { StateCreator } from 'zustand';
import { OperationalExpense } from '../../../types';

export interface ExpenseSlice {
    expenses: OperationalExpense[];
    setExpenses: (expenses: OperationalExpense[]) => void;
    addExpense: (expense: OperationalExpense) => void;
    updateExpense: (id: string, updates: Partial<OperationalExpense>) => void;
    deleteExpense: (id: string) => void;
}

export const createExpenseSlice: StateCreator<ExpenseSlice> = (set) => ({
    expenses: [],
    setExpenses: (expenses) => set({ expenses }),
    addExpense: (expense) => set((state) => ({ expenses: [...state.expenses, expense] })),
    updateExpense: (id, updates) => set((state) => ({
        expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e))
    })),
    deleteExpense: (id) => set((state) => ({
        expenses: (state.expenses || []).filter((e) => e.id !== id)
    })),
});
