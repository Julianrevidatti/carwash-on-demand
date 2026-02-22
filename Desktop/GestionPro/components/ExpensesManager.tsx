import React, { useState, useMemo } from 'react';
import { useStore } from '../src/store/useStore';
import { OperationalExpense } from '../types';
import { Plus, Trash2, CheckCircle, XCircle, DollarSign, Wallet, TrendingDown, RefreshCw, AlertTriangle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { expenseService } from '../src/services/expenseService';

export const ExpensesManager: React.FC = () => {
    const expenses = useStore((state) => state.expenses);
    const addExpense = useStore((state) => state.addExpense);
    const deleteExpense = useStore((state) => state.deleteExpense);
    const updateExpense = useStore((state) => state.updateExpense);
    const currentTenant = useStore((state) => state.currentTenant);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Initial state for form: Use local date string YYYY-MM-DD
    const getLocalDateString = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Form State
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<OperationalExpense['category']>('Other');
    const [status, setStatus] = useState<'Paid' | 'Pending'>('Paid');
    const [date, setDate] = useState(getLocalDateString());

    // Month Selection State
    // Format: "YYYY-MM"
    const currentMonthKey = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }, []);

    const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

    // Derived: Available Months
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        months.add(currentMonthKey); // Always show current month

        (expenses || []).forEach(e => {
            if (e.date) {
                // e.date is YYYY-MM-DD string
                const monthKey = e.date.substring(0, 7); // "YYYY-MM"
                if (monthKey) months.add(monthKey);
            }
        });

        return Array.from(months).sort().reverse(); // Newest first
    }, [expenses, currentMonthKey]);

    // Derived: Filtered Expenses by Month
    const filteredExpenses = useMemo(() => {
        return (expenses || []).filter(e => {
            return e.date && e.date.startsWith(selectedMonth);
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date desc
    }, [expenses, selectedMonth]);

    const totalPaid = filteredExpenses.filter(e => e.status === 'Paid').reduce((acc, e) => acc + e.amount, 0);
    const totalPending = filteredExpenses.filter(e => e.status === 'Pending').reduce((acc, e) => acc + e.amount, 0);

    // Helper to format month name
    const formatMonthName = (monthKey: string) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    };

    // Helper to format date for display (Manual to avoid timezone shifts)
    const formatDateDisplay = (dateString: string) => {
        if (!dateString) return '-';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const handleEdit = (expense: OperationalExpense) => {
        setEditingId(expense.id);
        setDescription(expense.description);
        setAmount(String(expense.amount));
        setCategory(expense.category);
        setStatus(expense.status);
        setDate(expense.date);
        setIsFormOpen(true);
    };

    const handleCancel = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setDescription('');
        setAmount('');
        setStatus('Paid');
        setDate(getLocalDateString());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !amount) return;

        try {
            if (!currentTenant) {
                toast.error("Error: No se identificó el negocio (Tenant missing)");
                return;
            }

            if (editingId) {
                // EDIT MODE
                const updates = {
                    description,
                    amount: Number(amount),
                    category,
                    status,
                    date
                };
                await expenseService.updateExpense(editingId, updates);
                updateExpense(editingId, updates);
                toast.success("Gasto actualizado");
            } else {
                // CREATE MODE
                const newExpense: OperationalExpense = {
                    id: crypto.randomUUID(),
                    description,
                    amount: Number(amount),
                    category,
                    status,
                    date,
                    isRecurring: false // For now simple
                };
                await expenseService.addExpense(currentTenant.id, newExpense);
                addExpense(newExpense);
                toast.success("Gasto registrado");
            }

            // Reset
            handleCancel();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar el gasto");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Gastos Operativos</h2>
                    <p className="text-slate-500 text-sm">Control de costos fijos y variables.</p>
                </div>

                <div className="flex gap-3">
                    {/* Month Selector */}
                    <div className="relative">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="appearance-none bg-white border border-slate-200 text-slate-700 py-2 pl-4 pr-10 rounded-lg font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer hover:bg-slate-50"
                        >
                            {availableMonths.map(month => (
                                <option key={month} value={month} className="capitalize">
                                    {formatMonthName(month)}
                                </option>
                            ))}
                        </select>
                        <Calendar className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <button
                        onClick={() => {
                            handleCancel();
                            setIsFormOpen(!isFormOpen);
                        }}
                        className="bg-rose-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-rose-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" /> Nuevo Gasto
                    </button>
                </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet className="w-12 h-12 text-rose-600" /></div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Gastado (Pagado)</p>
                    <p className="text-2xl font-black text-rose-600 mt-1">${totalPaid.toLocaleString()}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingDown className="w-12 h-12 text-orange-500" /></div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Pendiente de Pago</p>
                    <p className="text-2xl font-black text-orange-500 mt-1">${totalPending.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden text-white">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total <span className="capitalize text-slate-200">{formatMonthName(selectedMonth)}</span></p>
                    <p className="text-2xl font-black mt-1">${(totalPaid + totalPending).toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-2">Proyección de salida de caja</p>
                </div>
            </div>

            {/* FORM */}
            {isFormOpen && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg animate-in slide-in-from-top-2">
                    <h3 className="font-bold text-lg mb-4 text-slate-700">{editingId ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Descripción</label>
                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                                placeholder="Ej: Alquiler Local, Internet, Sueldo Juan..."
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Monto ($)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-bold text-slate-700"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Categoría</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value as any)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-white"
                            >
                                <option value="Rent">Alquiler</option>
                                <option value="Utilities">Servicios (Luz/Gas/Int)</option>
                                <option value="Salaries">Sueldos</option>
                                <option value="Taxes">Impuestos</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Other">Otro</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Estado de Pago</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setStatus('Paid')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold border ${status === 'Paid' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-200 text-slate-500'}`}
                                >
                                    Pagado
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatus('Pending')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold border ${status === 'Pending' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'border-slate-200 text-slate-500'}`}
                                >
                                    Pendiente
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Fecha</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-slate-600"
                            />
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-bold"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 shadow-md"
                            >
                                {editingId ? 'Actualizar Gasto' : 'Guardar Gasto'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* EXPENSES LIST */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Descripción</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Categoría</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Fecha</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Estado</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Monto</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredExpenses.length > 0 ? (
                            filteredExpenses.map((expense) => (
                                <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => handleEdit(expense)}>
                                    <td className="p-4 font-medium text-slate-800">{expense.description}</td>
                                    <td className="p-4">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold border border-slate-200">
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-500">{formatDateDisplay(expense.date)}</td>
                                    <td className="p-4">
                                        {expense.status === 'Paid' ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                                <CheckCircle className="w-3 h-3" /> Pagado
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs font-bold text-orange-500 cursor-pointer hover:underline"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        await expenseService.updateExpense(expense.id, { status: 'Paid' });
                                                        updateExpense(expense.id, { status: 'Paid' });
                                                        toast.success("Marcado como pagado");
                                                    } catch (e) { toast.error("Error al actualizar"); }
                                                }}>
                                                <AlertTriangle className="w-3 h-3" /> Pendiente
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right font-bold text-slate-800">
                                        -${expense.amount.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={async () => {
                                                if (confirm('¿Eliminar este gasto?')) {
                                                    try {
                                                        await expenseService.deleteExpense(expense.id);
                                                        deleteExpense(expense.id);
                                                        toast.success("Gasto eliminado");
                                                    } catch (e) { toast.error("Error al eliminar"); }
                                                }
                                            }}
                                            className="text-slate-400 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                                    No hay gastos registrados en <span className="font-bold">{formatMonthName(selectedMonth)}</span>.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


