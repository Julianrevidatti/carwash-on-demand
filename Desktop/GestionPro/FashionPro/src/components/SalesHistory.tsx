import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Sale } from '../types';
import { Search, Calendar, CreditCard, ChevronDown } from 'lucide-react';

type DateFilter = 'today' | 'week' | 'month' | 'all';

export const SalesHistory: React.FC = () => {
    const sales = useStore(s => s.sales);
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState<DateFilter>('today');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const now = new Date();

    const filtered = useMemo(() => {
        let result = [...sales];

        // Date filter
        result = result.filter(s => {
            const d = new Date(s.date);
            switch (dateFilter) {
                case 'today': return d.toDateString() === now.toDateString();
                case 'week': { const w = new Date(now); w.setDate(w.getDate() - 7); return d >= w; }
                case 'month': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                default: return true;
            }
        });

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(s =>
                s.items.some(i => i.name.toLowerCase().includes(q)) ||
                s.paymentMethodName.toLowerCase().includes(q) ||
                s.id.includes(q)
            );
        }

        return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sales, dateFilter, search]);

    const totalFiltered = filtered.reduce((sum, s) => sum + s.total, 0);

    const filterButtons: { key: DateFilter; label: string }[] = [
        { key: 'today', label: 'Hoy' },
        { key: 'week', label: 'Semana' },
        { key: 'month', label: 'Mes' },
        { key: 'all', label: 'Todo' }
    ];

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }} className="animate-fadeIn">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#000000' }}>
                    Historial de Ventas
                </h2>
                <div style={{ display: 'flex', gap: '6px' }}>
                    {filterButtons.map(f => (
                        <button key={f.key} onClick={() => setDateFilter(f.key)}
                            style={{
                                padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '500',
                                border: `1px solid ${dateFilter === f.key ? '#6366f1' : '#ffffff'}`,
                                background: dateFilter === f.key ? 'rgba(99,102,241,0.15)' : 'transparent',
                                color: dateFilter === f.key ? '#818cf8' : '#475569', cursor: 'pointer'
                            }}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search & Summary */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#000000' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por producto, método de pago..."
                        style={{ width: '100%', padding: '10px 12px 10px 36px', background: '#ffffff', border: '1px solid #000000', borderRadius: '10px', color: '#000000', fontSize: '13px' }} />
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #000000', borderRadius: '10px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#000000', fontSize: '12px' }}>{filtered.length} ventas</span>
                    <span style={{ color: '#6366f1', fontSize: '16px', fontWeight: '700' }}>${totalFiltered.toLocaleString()}</span>
                </div>
            </div>

            {/* Sales List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#000000' }}>
                        Sin ventas en el período seleccionado
                    </div>
                ) : filtered.map(sale => (
                    <div key={sale.id} style={{ background: '#ffffff', border: '1px solid #000000', borderRadius: '12px', overflow: 'hidden' }}>
                        {/* Summary Row */}
                        <button onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}
                            style={{
                                width: '100%', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: 'transparent', border: 'none', cursor: 'pointer', color: '#000000', textAlign: 'left'
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '12px', color: '#000000' }}>
                                    {new Date(sale.date).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span style={{ fontSize: '13px', color: '#000000', fontWeight: '500' }}>
                                    {sale.items.map(i => i.name).join(', ').substring(0, 50)}{sale.items.length > 2 ? '...' : ''}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '11px', color: '#000000', background: '#f8fafc', padding: '2px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CreditCard size={10} /> {sale.paymentMethodName}
                                </span>
                                <span style={{ fontSize: '15px', fontWeight: '700', color: '#6366f1' }}>${sale.total.toLocaleString()}</span>
                                <ChevronDown size={14} style={{ color: '#000000', transform: expandedId === sale.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </div>
                        </button>

                        {/* Expanded Details */}
                        {expandedId === sale.id && (
                            <div style={{ padding: '0 16px 12px', borderTop: '1px solid #ffffff' }}>
                                <table style={{ width: '100%', fontSize: '12px', marginTop: '10px' }}>
                                    <thead>
                                        <tr style={{ color: '#000000' }}>
                                            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Producto</th>
                                            <th style={{ textAlign: 'center', padding: '4px 8px' }}>Cant.</th>
                                            <th style={{ textAlign: 'right', padding: '4px 8px' }}>Precio</th>
                                            <th style={{ textAlign: 'right', padding: '4px 8px' }}>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sale.items.map((item, i) => (
                                            <tr key={i} style={{ color: '#000000' }}>
                                                <td style={{ padding: '4px 8px' }}>{item.name}</td>
                                                <td style={{ padding: '4px 8px', textAlign: 'center' }}>{item.quantity}</td>
                                                <td style={{ padding: '4px 8px', textAlign: 'right' }}>${item.price.toLocaleString()}</td>
                                                <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '600' }}>${(item.price * item.quantity).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {sale.surcharge > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', marginTop: '6px', borderTop: '1px solid #ffffff', color: '#f59e0b', fontSize: '12px' }}>
                                        <span>Recargo</span>
                                        <span>+${sale.surcharge.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
