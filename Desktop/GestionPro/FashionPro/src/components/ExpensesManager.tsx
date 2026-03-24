import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { OperationalExpense } from '../types';
import { Plus, Trash2, CheckCircle, AlertTriangle, Calendar, Wallet, TrendingDown, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { expenseDB } from '../services/dbService';

export const ExpensesManager: React.FC = () => {
    const expenses = useStore(s => s.expenses);
    const setExpenses = useStore(s => s.setExpenses);
    const fetchExpenses = useStore(s => s.fetchExpenses);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<OperationalExpense['category']>('Other');
    const [status, setStatus] = useState<'Paid' | 'Pending'>('Paid');
    const [date, setDate] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    });

    const currentMonthKey = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }, []);

    const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        months.add(currentMonthKey);
        (expenses || []).forEach(e => { if (e.date) months.add(e.date.substring(0, 7)); });
        return Array.from(months).sort().reverse();
    }, [expenses, currentMonthKey]);

    const filteredExpenses = useMemo(() =>
        (expenses || []).filter(e => e.date?.startsWith(selectedMonth)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [expenses, selectedMonth]
    );

    const totalPaid = filteredExpenses.filter(e => e.status === 'Paid').reduce((a, e) => a + e.amount, 0);
    const totalPending = filteredExpenses.filter(e => e.status === 'Pending').reduce((a, e) => a + e.amount, 0);

    const formatMonthName = (key: string) => {
        const [y, m] = key.split('-');
        return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    };

    const formatDate = (d: string) => {
        if (!d) return '-';
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
    };

    const handleCancel = () => {
        setIsFormOpen(false); setEditingId(null); setDescription(''); setAmount(''); setStatus('Paid');
        setDate(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !amount) return;

        try {
            if (editingId) {
                const updates = { description, amount: Number(amount), category, status, date, isRecurring: false };
                await expenseDB.update({ id: editingId, ...updates });
                toast.success('Gasto actualizado');
            } else {
                const newExpense: OperationalExpense = {
                    id: crypto.randomUUID(), description, amount: Number(amount), category, status, date, isRecurring: false
                };
                await expenseDB.insert(newExpense);
                toast.success('Gasto registrado');
            }
            await fetchExpenses();
            handleCancel();
        } catch {
            toast.error('Error al guardar');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este gasto?')) return;
        try {
            await expenseDB.delete(id);
            await fetchExpenses();
            toast.success('Eliminado');
        } catch { toast.error('Error al eliminar'); }
    };

    const handleMarkPaid = async (id: string) => {
        try {
            const exp = expenses.find(e => e.id === id);
            if (exp) {
                await expenseDB.update({ ...exp, status: 'Paid' });
                await fetchExpenses();
                toast.success('Marcado como pagado');
            }
        } catch { toast.error('Error'); }
    };

    const cardStyle: React.CSSProperties = {
        background: '#ffffff', border: '1px solid #000000', borderRadius: '16px', padding: '20px'
    };
    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 12px', background: '#f8fafc',
        border: '1px solid #000000', borderRadius: '10px', color: '#000000', fontSize: '14px'
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }} className="animate-fadeIn">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#000000' }}>Gastos Operativos</h2>
                    <p style={{ color: '#000000', fontSize: '13px' }}>Control de costos fijos y variables</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative' }}>
                        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                            style={{ ...inputStyle, paddingRight: '32px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                            {availableMonths.map(m => (
                                <option key={m} value={m} style={{ textTransform: 'capitalize' }}>{formatMonthName(m)}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={() => { handleCancel(); setIsFormOpen(!isFormOpen); }}
                        style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Plus size={16} /> Nuevo Gasto
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={cardStyle}>
                    <p style={{ color: '#000000', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Pagado</p>
                    <p style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>${totalPaid.toLocaleString()}</p>
                </div>
                <div style={cardStyle}>
                    <p style={{ color: '#000000', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pendiente</p>
                    <p style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>${totalPending.toLocaleString()}</p>
                </div>
                <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #ffffff, #f8fafc)' }}>
                    <p style={{ color: '#000000', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Total <span style={{ textTransform: 'capitalize', color: '#000000' }}>{formatMonthName(selectedMonth)}</span>
                    </p>
                    <p style={{ fontSize: '24px', fontWeight: '800', color: '#000000', marginTop: '4px' }}>${(totalPaid + totalPending).toLocaleString()}</p>
                </div>
            </div>

            {/* Form */}
            {isFormOpen && (
                <div style={{ ...cardStyle, marginBottom: '16px' }} className="animate-fadeIn">
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#000000', marginBottom: '12px' }}>{editingId ? 'Editar' : 'Nuevo'} Gasto</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Descripción</label>
                            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Alquiler, Internet, Sueldo..." style={inputStyle} autoFocus />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Monto ($)</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={{ ...inputStyle, fontWeight: '600' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Categoría</label>
                            <select value={category} onChange={e => setCategory(e.target.value as any)} style={inputStyle}>
                                <option value="Rent">Alquiler</option>
                                <option value="Utilities">Servicios</option>
                                <option value="Salaries">Sueldos</option>
                                <option value="Taxes">Impuestos</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Other">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Estado</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {(['Paid', 'Pending'] as const).map(s => (
                                    <button key={s} type="button" onClick={() => setStatus(s)} style={{
                                        flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                                        border: `1px solid ${status === s ? (s === 'Paid' ? '#22c55e' : '#f59e0b') : '#ffffff'}`,
                                        background: status === s ? (s === 'Paid' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)') : 'transparent',
                                        color: status === s ? (s === 'Paid' ? '#22c55e' : '#f59e0b') : '#475569', cursor: 'pointer'
                                    }}>
                                        {s === 'Paid' ? 'Pagado' : 'Pendiente'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Fecha</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
                        </div>
                        <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                            <button type="button" onClick={handleCancel} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: '#000000', color: '#000000', fontWeight: '500', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                            <button type="submit" style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                                {editingId ? 'Actualizar' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Expenses Table */}
            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', textAlign: 'left', fontSize: '13px', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '12px 16px', color: '#000000', fontWeight: '500', fontSize: '11px', textTransform: 'uppercase' }}>Descripción</th>
                            <th style={{ padding: '12px 16px', color: '#000000', fontWeight: '500', fontSize: '11px', textTransform: 'uppercase' }}>Categoría</th>
                            <th style={{ padding: '12px 16px', color: '#000000', fontWeight: '500', fontSize: '11px', textTransform: 'uppercase' }}>Fecha</th>
                            <th style={{ padding: '12px 16px', color: '#000000', fontWeight: '500', fontSize: '11px', textTransform: 'uppercase' }}>Estado</th>
                            <th style={{ padding: '12px 16px', color: '#000000', fontWeight: '500', fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>Monto</th>
                            <th style={{ padding: '12px 16px', color: '#000000', fontWeight: '500', fontSize: '11px', textTransform: 'uppercase', textAlign: 'center' }}>Acc.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExpenses.length > 0 ? filteredExpenses.map(exp => (
                            <tr key={exp.id} style={{ borderBottom: '1px solid #ffffff', cursor: 'pointer' }}
                                onClick={() => { setEditingId(exp.id); setDescription(exp.description); setAmount(String(exp.amount)); setCategory(exp.category); setStatus(exp.status); setDate(exp.date); setIsFormOpen(true); }}>
                                <td style={{ padding: '12px 16px', color: '#000000', fontWeight: '500' }}>{exp.description}</td>
                                <td style={{ padding: '12px 16px' }}>
                                    <span style={{ background: '#f8fafc', color: '#000000', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '500' }}>{exp.category}</span>
                                </td>
                                <td style={{ padding: '12px 16px', color: '#000000' }}>{formatDate(exp.date)}</td>
                                <td style={{ padding: '12px 16px' }}>
                                    {exp.status === 'Paid' ? (
                                        <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <CheckCircle size={12} /> Pagado
                                        </span>
                                    ) : (
                                        <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                            onClick={(e) => { e.stopPropagation(); handleMarkPaid(exp.id); }}>
                                            <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Pendiente
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: '#ef4444' }}>
                                    -${exp.amount.toLocaleString()}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                    <button onClick={() => handleDelete(exp.id)} style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer', padding: '4px' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#000000', fontStyle: 'italic' }}>
                                    No hay gastos en <span style={{ fontWeight: '600' }}>{formatMonthName(selectedMonth)}</span>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
