import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { CashMovement, MovementType } from '../types';
import {
    ArrowDownCircle, ArrowUpCircle, DollarSign, Wallet, Calendar
} from 'lucide-react';
import { toast } from 'sonner';

type Filter = 'all' | 'today' | 'week' | 'month';

export const CashFlow: React.FC = () => {
    const cashMovements = useStore(s => s.cashMovements);
    const sales = useStore(s => s.sales);
    const currentSession = useStore(s => s.currentSession);
    const addCashMovement = useStore(s => s.addCashMovement);

    const [filter, setFilter] = useState<Filter>('today');
    const [showForm, setShowForm] = useState(false);
    const [newType, setNewType] = useState<MovementType>(MovementType.DEPOSIT);
    const [newAmount, setNewAmount] = useState('');
    const [newDescription, setNewDescription] = useState('');

    const now = new Date();

    const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

    const isSameMonth = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();

    const filterDate = (dateStr: string) => {
        const d = new Date(dateStr);
        switch (filter) {
            case 'today': return isSameDay(d, now);
            case 'week': {
                const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
                return d >= weekAgo;
            }
            case 'month': return isSameMonth(d, now);
            default: return true;
        }
    };

    const filteredMovements = useMemo(() =>
        (cashMovements || []).filter(m => filterDate(m.date)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [cashMovements, filter]
    );

    const filteredSales = useMemo(() =>
        (sales || []).filter(s => filterDate(s.date)),
        [sales, filter]
    );

    const totalSales = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const totalIn = filteredMovements.filter(m => m.type === MovementType.DEPOSIT).reduce((sum, m) => sum + m.amount, 0);
    const totalOut = filteredMovements.filter(m => m.type === MovementType.WITHDRAWAL).reduce((sum, m) => sum + m.amount, 0);
    const netFlow = totalSales + totalIn - totalOut;

    const handleAddMovement = () => {
        if (!newAmount || !newDescription) return;
        const movement: CashMovement = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            sessionId: currentSession?.id || '',
            type: newType,
            amount: parseFloat(newAmount),
            description: newDescription
        };
        addCashMovement(movement);
        setNewAmount('');
        setNewDescription('');
        setShowForm(false);
        toast.success(`Movimiento ${newType === MovementType.DEPOSIT ? 'ingreso' : 'egreso'} registrado`);
    };

    const cardStyle: React.CSSProperties = {
        background: '#ffffff', border: '1px solid #000000',
        borderRadius: '16px', padding: '20px'
    };

    const filterButtons: { key: Filter; label: string }[] = [
        { key: 'today', label: 'Hoy' },
        { key: 'week', label: 'Semana' },
        { key: 'month', label: 'Mes' },
        { key: 'all', label: 'Todo' }
    ];

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }} className="animate-fadeIn">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#000000', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wallet size={22} style={{ color: '#6366f1' }} /> Flujo de Caja
                </h2>
                <div style={{ display: 'flex', gap: '6px' }}>
                    {filterButtons.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            style={{
                                padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '500',
                                border: `1px solid ${filter === f.key ? '#6366f1' : '#ffffff'}`,
                                background: filter === f.key ? 'rgba(99,102,241,0.15)' : 'transparent',
                                color: filter === f.key ? '#818cf8' : '#475569', cursor: 'pointer'
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                    { label: 'Ventas', value: totalSales, color: '#6366f1', icon: <DollarSign size={18} /> },
                    { label: 'Ingresos', value: totalIn, color: '#22c55e', icon: <ArrowDownCircle size={18} /> },
                    { label: 'Egresos', value: totalOut, color: '#ef4444', icon: <ArrowUpCircle size={18} /> },
                    { label: 'Neto', value: netFlow, color: netFlow >= 0 ? '#22c55e' : '#ef4444', icon: <Wallet size={18} /> }
                ].map(card => (
                    <div key={card.label} style={cardStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ color: card.color }}>{card.icon}</span>
                            <span style={{ color: '#000000', fontSize: '12px', fontWeight: '500' }}>{card.label}</span>
                        </div>
                        <p style={{ fontSize: '22px', fontWeight: '700', color: card.color }}>
                            ${card.value.toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>

            {/* Add Movement Button */}
            <div style={{ marginBottom: '16px' }}>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        padding: '10px 20px', borderRadius: '10px', border: 'none',
                        background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                        color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                    }}
                >
                    + Nuevo Movimiento
                </button>
            </div>

            {/* Add Movement Form */}
            {showForm && (
                <div style={{ ...cardStyle, marginBottom: '16px' }} className="animate-fadeIn">
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#000000', marginBottom: '12px' }}>Registrar Movimiento</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: '10px', alignItems: 'end' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Tipo</label>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {[MovementType.DEPOSIT, MovementType.WITHDRAWAL].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setNewType(t)}
                                        style={{
                                            flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                                            border: `1px solid ${newType === t ? (t === MovementType.DEPOSIT ? '#22c55e' : '#ef4444') : '#ffffff'}`,
                                            background: newType === t ? (t === MovementType.DEPOSIT ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)') : 'transparent',
                                            color: newType === t ? (t === MovementType.DEPOSIT ? '#22c55e' : '#ef4444') : '#475569', cursor: 'pointer'
                                        }}
                                    >
                                        {t === MovementType.DEPOSIT ? 'Ingreso' : 'Egreso'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Monto</label>
                            <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="0.00"
                                style={{ width: '100%', padding: '8px 12px', background: '#f8fafc', border: '1px solid #000000', borderRadius: '8px', color: '#000000', fontSize: '14px', fontWeight: '600' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Descripción</label>
                            <input type="text" value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Motivo del movimiento..."
                                style={{ width: '100%', padding: '8px 12px', background: '#f8fafc', border: '1px solid #000000', borderRadius: '8px', color: '#000000', fontSize: '13px' }}
                            />
                        </div>
                        <button onClick={handleAddMovement}
                            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#6366f1', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                            Guardar
                        </button>
                    </div>
                </div>
            )}

            {/* Movements List */}
            <div style={cardStyle}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#000000', marginBottom: '12px' }}>Movimientos</h3>
                {filteredMovements.length === 0 ? (
                    <p style={{ color: '#000000', fontSize: '13px', textAlign: 'center', padding: '30px' }}>
                        Sin movimientos en el período seleccionado
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {filteredMovements.map(m => (
                            <div key={m.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #000000'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {m.type === MovementType.DEPOSIT ? (
                                        <ArrowDownCircle size={16} style={{ color: '#22c55e' }} />
                                    ) : (
                                        <ArrowUpCircle size={16} style={{ color: '#ef4444' }} />
                                    )}
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: '500', color: '#000000' }}>{m.description}</p>
                                        <p style={{ fontSize: '11px', color: '#000000' }}>{new Date(m.date).toLocaleString('es-AR')}</p>
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: '14px', fontWeight: '700',
                                    color: m.type === MovementType.DEPOSIT ? '#22c55e' : '#ef4444'
                                }}>
                                    {m.type === MovementType.DEPOSIT ? '+' : '-'}${m.amount.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
