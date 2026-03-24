import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
    Lock, Unlock, DollarSign, Save, X, Banknote, Coins,
    Calculator, AlertTriangle, Clock, ShoppingCart, History, Calendar, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const DENOMINATIONS = [
    { value: 20000, type: 'bill' },
    { value: 10000, type: 'bill' },
    { value: 2000, type: 'bill' },
    { value: 1000, type: 'bill' },
    { value: 500, type: 'bill' },
    { value: 200, type: 'bill' },
    { value: 100, type: 'bill' },
    { value: 50, type: 'bill' },
    { value: 20, type: 'coin' },
    { value: 10, type: 'coin' },
    { value: 5, type: 'coin' },
];

export const CashControl: React.FC = () => {
    const currentSession = useStore(s => s.currentSession);
    const sessions = useStore(s => s.sessions);
    const currentUser = useStore(s => s.currentUser);
    const openSession = useStore(s => s.openSession);
    const closeSession = useStore(s => s.closeSession);
    const sales = useStore(s => s.sales);
    const paymentMethods = useStore(s => s.paymentMethods);

    const [tab, setTab] = useState<'current' | 'history'>('current');
    const [floatInput, setFloatInput] = useState('');
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [counts, setCounts] = useState<Record<number, string>>({});
    const [withdrawalAmount, setWithdrawalAmount] = useState('');

    // Session sales
    const sessionSales = currentSession
        ? sales.filter(s => s.sessionId === currentSession.id)
        : [];

    const totalRevenue = sessionSales.reduce((acc, s) => acc + s.total, 0);

    // Breakdown by payment method
    const breakdown = paymentMethods.map(pm => {
        const total = sessionSales
            .filter(s => s.paymentMethodName === pm.name)
            .reduce((acc, s) => acc + s.total, 0);
        return { name: pm.name, total, isCash: pm.isCash };
    });

    const cashSales = breakdown.find(b => b.isCash)?.total || 0;
    const expectedCashInDrawer = (currentSession?.initialFloat || 0) + cashSales;

    const totalCounted = DENOMINATIONS.reduce((acc, d) => {
        const count = parseInt(counts[d.value] || '0');
        return acc + (count * d.value);
    }, 0);

    const difference = totalCounted - expectedCashInDrawer;
    const withdrawal = parseFloat(withdrawalAmount) || 0;
    const remainingCash = totalCounted - withdrawal;

    const handleOpenSession = () => {
        const initialFloat = parseFloat(floatInput) || 0;
        const session = {
            id: crypto.randomUUID(),
            startTime: new Date().toISOString(),
            initialFloat,
            status: 'OPEN' as const,
            userId: currentUser?.id || '',
            userName: currentUser?.name || ''
        };
        openSession(session);
        setFloatInput('');
        toast.success('Caja abierta correctamente');
    };

    const handleConfirmClose = () => {
        if (!currentSession) return;
        closeSession(currentSession.id, totalCounted, new Date().toISOString());
        setShowCloseModal(false);
        setCounts({});
        setWithdrawalAmount('');
        toast.success('Caja cerrada correctamente');
        setTab('history');
    };

    const isSessionActive = currentSession && currentSession.status === 'OPEN';

    // Style helpers for dark theme
    const cardStyle: React.CSSProperties = {
        background: '#ffffff',
        border: '1px solid #000000',
        borderRadius: '16px',
        padding: '24px'
    };

    const closedSessions = sessions
        .filter(s => s.status === 'CLOSED')
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }} className="animate-fadeIn">
            {/* Header Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #ffffff', paddingBottom: '16px' }}>
                <button
                    onClick={() => setTab('current')}
                    style={{
                        padding: '10px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '600',
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                        border: 'none',
                        background: tab === 'current' ? 'linear-gradient(135deg, #6366f1, #7c3aed)' : 'transparent',
                        color: tab === 'current' ? '#ffffff' : '#475569',
                        boxShadow: tab === 'current' ? '0 4px 15px rgba(99,102,241,0.3)' : 'none'
                    }}
                >
                    <Calculator size={18} />
                    Turno Actual
                </button>
                <button
                    onClick={() => setTab('history')}
                    style={{
                        padding: '10px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '600',
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                        border: 'none',
                        background: tab === 'history' ? 'linear-gradient(135deg, #6366f1, #7c3aed)' : 'transparent',
                        color: tab === 'history' ? '#ffffff' : '#475569',
                        boxShadow: tab === 'history' ? '0 4px 15px rgba(99,102,241,0.3)' : 'none'
                    }}
                >
                    <History size={18} />
                    Historial de Turnos
                </button>
            </div>

            {tab === 'current' ? (
                <>
                    {!isSessionActive ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                            <div className="animate-fadeIn" style={{ ...cardStyle, maxWidth: '420px', width: '100%', textAlign: 'center' }}>
                                <div style={{
                                    width: '72px', height: '72px', borderRadius: '50%',
                                    background: 'rgba(99,102,241,0.1)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
                                }}>
                                    <Lock size={32} style={{ color: '#6366f1' }} />
                                </div>
                                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#000000', marginBottom: '8px' }}>
                                    Caja Cerrada
                                </h2>
                                <p style={{ color: '#000000', fontSize: '14px', marginBottom: '28px' }}>
                                    Abrí un turno de caja para empezar a operar.
                                </p>

                                <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#000000', marginBottom: '6px' }}>
                                        Fondo Inicial (Cambio)
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <DollarSign size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#000000' }} />
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={floatInput}
                                            onChange={e => setFloatInput(e.target.value)}
                                            autoFocus
                                            style={{
                                                width: '100%', padding: '12px 14px 12px 38px',
                                                background: '#f8fafc', border: '1px solid #000000',
                                                borderRadius: '12px', color: '#000000', fontSize: '16px', fontWeight: '700'
                                            }}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleOpenSession}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                                        background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                                        color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        boxShadow: '0 4px 15px rgba(99,102,241,0.3)'
                                    }}
                                >
                                    <Unlock size={18} /> ABRIR CAJA
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fadeIn">
                            {/* Session Header */}
                            <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#000000' }}>Control de Turno</h2>
                                    <p style={{ color: '#22c55e', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                        <Unlock size={14} /> Turno Abierto: {new Date(currentSession.startTime).toLocaleTimeString()}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: '#000000', fontSize: '12px' }}>Fondo Inicial</p>
                                    <p style={{ fontSize: '20px', fontWeight: '700', color: '#000000' }}>${currentSession.initialFloat?.toLocaleString()}</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                {/* Z-Report Preview */}
                                <div style={cardStyle}>
                                    <h3 style={{ fontWeight: '600', color: '#000000', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                                        <Calculator size={16} style={{ color: '#6366f1' }} /> Resumen Parcial
                                    </h3>
                                    <div style={{ padding: '8px 12px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)', borderRadius: '8px', marginBottom: '16px' }}>
                                        <p style={{ fontSize: '11px', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Clock size={12} /> La caja sigue <strong>abierta</strong>
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {breakdown.filter(b => b.total > 0).map(b => (
                                            <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                <span style={{ color: '#000000' }}>{b.name}</span>
                                                <span style={{ fontWeight: '600', color: '#000000' }}>${b.total.toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div style={{ borderTop: '1px solid #ffffff', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                                            <span style={{ fontWeight: '700', color: '#6366f1' }}>Total Ventas</span>
                                            <span style={{ fontWeight: '700', color: '#6366f1' }}>${totalRevenue.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Close Action */}
                                <div style={{ ...cardStyle, borderLeft: '3px solid #ef4444', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <h3 style={{ fontWeight: '600', color: '#ef4444', marginBottom: '8px', fontSize: '15px' }}>Cierre de Caja</h3>
                                    <p style={{ color: '#000000', fontSize: '13px', marginBottom: '20px' }}>
                                        Al cerrar la caja, se realiza el arqueo físico de billetes.
                                    </p>
                                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', fontSize: '14px' }}>
                                            <span style={{ color: '#000000' }}>Esperado en cajón:</span>
                                            <span style={{ color: '#000000' }}>${expectedCashInDrawer.toLocaleString()}</span>
                                        </div>
                                        <p style={{ color: '#000000', fontSize: '11px', marginTop: '4px' }}>Fondo Inicial + Ventas Efectivo</p>
                                    </div>
                                    <button
                                        onClick={() => setShowCloseModal(true)}
                                        style={{
                                            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                                            background: '#ef4444', color: 'white', fontSize: '14px', fontWeight: '700',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                        }}
                                    >
                                        <Save size={16} /> INICIAR ARQUEO Y CIERRE
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="animate-fadeIn">
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {closedSessions.length === 0 ? (
                            <div style={{ ...cardStyle, textAlign: 'center', padding: '40px' }}>
                                <History size={48} style={{ color: '#000000', margin: '0 auto 16px' }} />
                                <h3 style={{ color: '#000000', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>No hay cierres registrados</h3>
                                <p style={{ color: '#000000', fontSize: '14px' }}>Las cajas que vayas cerrando aparecerán aquí con el desglose del día.</p>
                            </div>
                        ) : (
                            closedSessions.map(session => {
                                // Calculate total sales for THIS SPECIFIC SESSION
                                const thisSessionSales = sales.filter(s => s.sessionId === session.id);
                                const thisTotalSales = thisSessionSales.reduce((acc, s) => acc + s.total, 0);

                                const thisBreakdown = paymentMethods.map(pm => {
                                    const total = thisSessionSales
                                        .filter(s => s.paymentMethodName === pm.name)
                                        .reduce((acc, s) => acc + s.total, 0);
                                    return { name: pm.name, total, isCash: pm.isCash };
                                });

                                const thisCashSales = thisBreakdown.find(b => b.isCash)?.total || 0;
                                const thisExpectedCashInDrawer = (session.initialFloat || 0) + thisCashSales;
                                const thisFinalDeclared = session.finalDeclaredCash || 0;
                                const diff = thisFinalDeclared - thisExpectedCashInDrawer;

                                return (
                                    <div key={session.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {/* Row 1: Time, User, Totals */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ffffff', paddingBottom: '16px' }}>
                                            <div>
                                                <h3 style={{ color: '#000000', fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <CheckCircle size={18} style={{ color: '#22c55e' }} /> Turno Cerrado
                                                </h3>
                                                <p style={{ color: '#000000', fontSize: '13px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Calendar size={12} /> {new Date(session.startTime).toLocaleString('es-AR')} — {session.endTime ? new Date(session.endTime).toLocaleString('es-AR') : 'N/A'}
                                                </p>
                                                <p style={{ color: '#000000', fontSize: '12px', marginTop: '2px' }}>
                                                    Operador: {session.userName || 'Usuario'}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ color: '#000000', fontSize: '12px' }}>Total Ventas (Todos los Medios)</p>
                                                <p style={{ fontSize: '20px', fontWeight: '700', color: '#818cf8' }}>
                                                    ${thisTotalSales.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Row 2: Cash Math */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                                                <p style={{ color: '#000000', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>Fondo Inicial</p>
                                                <p style={{ color: '#000000', fontSize: '15px', fontWeight: '700' }}>${session.initialFloat.toLocaleString()}</p>
                                            </div>
                                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                                                <p style={{ color: '#000000', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>Ventas Efectivo</p>
                                                <p style={{ color: '#000000', fontSize: '15px', fontWeight: '700' }}>${thisCashSales.toLocaleString()}</p>
                                            </div>
                                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)' }}>
                                                <p style={{ color: '#818cf8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>Cajón (Efectivo)</p>
                                                <p style={{ color: '#818cf8', fontSize: '15px', fontWeight: '700' }}>${thisExpectedCashInDrawer.toLocaleString()}</p>
                                            </div>
                                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', borderLeft: diff < 0 ? '3px solid #ef4444' : diff > 0 ? '3px solid #22c55e' : '3px solid #475569' }}>
                                                <p style={{ color: '#000000', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>Arqueado (Físico)</p>
                                                <p style={{ color: diff < 0 ? '#ef4444' : diff > 0 ? '#22c55e' : '#f8fafc', fontSize: '15px', fontWeight: '700' }}>
                                                    ${thisFinalDeclared.toLocaleString()} {diff !== 0 && <span style={{ fontSize: '11px' }}>({diff > 0 ? '+' : ''}{diff.toLocaleString()})</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Close Modal */}
            {showCloseModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)', zIndex: 50,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{
                        background: '#ffffff', borderRadius: '16px', width: '100%',
                        maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
                    }}>
                        <div style={{ background: '#ef4444', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Lock size={18} /> Cerrar Caja
                            </h3>
                            <button onClick={() => setShowCloseModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: '20px', overflowY: 'auto' }}>
                            {/* Denomination Grid */}
                            <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#818cf8', marginBottom: '12px' }}>Conteo de Dinero (Arqueo)</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                    {DENOMINATIONS.map(d => (
                                        <div key={d.value} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', color: '#000000', marginBottom: '4px' }}>
                                                {d.type === 'bill' ? <Banknote size={10} /> : <Coins size={10} />} {d.value}
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={counts[d.value] || ''}
                                                onChange={e => setCounts(prev => ({ ...prev, [d.value]: e.target.value }))}
                                                style={{
                                                    width: '100%', padding: '8px 4px', textAlign: 'center',
                                                    background: '#f8fafc', border: '1px solid #000000',
                                                    borderRadius: '8px', color: '#000000', fontSize: '13px', fontWeight: '600'
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Calculations */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#000000', fontSize: '13px' }}>Efectivo Arqueado:</span>
                                    <span style={{ fontWeight: '700', color: '#000000', fontSize: '14px' }}>${totalCounted.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#000000', fontSize: '13px' }}>Efectivo Calculado:</span>
                                    <span style={{ fontWeight: '600', color: '#000000', fontSize: '14px' }}>${expectedCashInDrawer.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#000000', fontSize: '13px' }}>Diferencia:</span>
                                    <span style={{
                                        fontWeight: '700', fontSize: '14px',
                                        color: difference < 0 ? '#ef4444' : difference > 0 ? '#22c55e' : '#475569'
                                    }}>
                                        ${difference.toLocaleString()}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px' }}>
                                    <span style={{ color: '#000000', fontWeight: '600', fontSize: '13px' }}>Monto a Retirar:</span>
                                    <input
                                        type="number"
                                        value={withdrawalAmount}
                                        onChange={e => setWithdrawalAmount(e.target.value)}
                                        placeholder="0.00"
                                        style={{
                                            width: '120px', padding: '6px 10px', textAlign: 'right',
                                            background: '#f8fafc', border: '1px solid #000000',
                                            borderRadius: '8px', color: '#000000', fontSize: '14px', fontWeight: '600'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px dashed #ffffff' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#000000', textTransform: 'uppercase' }}>Saldo que queda:</span>
                                    <span style={{
                                        fontWeight: '700', fontSize: '14px', color: '#818cf8',
                                        background: 'rgba(99,102,241,0.1)', padding: '4px 12px', borderRadius: '8px'
                                    }}>
                                        ${remainingCash.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '16px 20px', borderTop: '1px solid #ffffff' }}>
                            <button
                                onClick={handleConfirmClose}
                                style={{
                                    width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                                    background: '#ef4444', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer'
                                }}
                            >
                                Confirmar Cierre
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
