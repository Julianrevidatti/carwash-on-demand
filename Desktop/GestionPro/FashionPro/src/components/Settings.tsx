import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { PaymentMethodConfig, Client, User } from '../types';
import {
    Settings2, CreditCard, Users, Bell, Building2,
    Plus, Save, Trash2, X, Pencil, Shield, Key, Printer, RefreshCw,
    Layout, ArrowLeftRight, ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import { printService } from '../services/printService';
import { UserProfile } from './UserProfile';

type SettingsTab = 'business' | 'payments' | 'clients' | 'users' | 'alerts' | 'printer' | 'profile' | 'personalization';

export const Settings: React.FC = () => {
    const settings = useStore(s => s.settings);
    const updateSettings = useStore(s => s.updateSettings);
    const paymentMethods = useStore(s => s.paymentMethods);
    const updatePaymentMethods = useStore(s => s.updatePaymentMethods);
    const clients = useStore(s => s.clients);
    const addClient = useStore(s => s.addClient);
    const updateClient = useStore(s => s.updateClient);
    const systemUsers = useStore(s => s.systemUsers);
    const addSystemUser = useStore(s => s.addSystemUser);
    const updateSystemUser = useStore(s => s.updateSystemUser);
    const deleteSystemUser = useStore(s => s.deleteSystemUser);

    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const currentUser = useStore(s => s.currentUser);

    // Business
    const [businessName, setBusinessName] = useState(settings.businessName || '');
    const [businessAddress, setBusinessAddress] = useState((settings as any).businessAddress || '');
    const [businessPhone, setBusinessPhone] = useState((settings as any).businessPhone || '');

    // Payments
    const [methods, setMethods] = useState<PaymentMethodConfig[]>(paymentMethods);

    // Clients
    const [showClientModal, setShowClientModal] = useState(false);
    const [clientName, setClientName] = useState('');
    const [clientDni, setClientDni] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [editingClientId, setEditingClientId] = useState<string | null>(null);

    // Users
    const [showUserModal, setShowUserModal] = useState(false);
    const [userName, setUserName] = useState('');
    const [userUsername, setUserUsername] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const [userRole, setUserRole] = useState('admin');
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    // Alerts
    const [alertStock, setAlertStock] = useState(settings.alertStockMinDefault);
    const [alertDays, setAlertDays] = useState(settings.alertDaysBeforeExpiration);
    const [maxDebt, setMaxDebt] = useState(settings.maxClientDebt);

    // Printer
    const [printers, setPrinters] = useState<any[]>([]);
    const [selectedPrinter, setSelectedPrinter] = useState(printService.getSelectedPrinter() || '');
    const [printerPaperWidth, setPrinterPaperWidth] = useState<'58mm' | '80mm'>(printService.getPaperWidth());
    const [autoPrint, setAutoPrint] = useState(printService.getAutoPrint());
    const [loadingPrinters, setLoadingPrinters] = useState(false);
    const [testPrinting, setTestPrinting] = useState(false);

    const loadPrinters = async () => {
        setLoadingPrinters(true);
        try {
            const list = await printService.getPrinters();
            setPrinters(list);
            if (list.length > 0) toast.success(`${list.length} impresora(s) detectada(s)`);
            else toast.warning('No se detectaron impresoras');
        } catch { toast.error('Error al buscar impresoras'); }
        finally { setLoadingPrinters(false); }
    };

    useEffect(() => {
        if (activeTab === 'printer' && printers.length === 0) loadPrinters();
    }, [activeTab]);

    const cardStyle: React.CSSProperties = { background: '#ffffff', border: '1px solid #000000', borderRadius: '16px', padding: '24px' };
    const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', background: '#f8fafc', border: '1px solid #000000', borderRadius: '10px', color: '#000000', fontSize: '14px' };
    const modalOverlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
    const modalBox: React.CSSProperties = { background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '460px', padding: '24px', border: '1px solid #000000' };

    const tabs: { key: SettingsTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
        { key: 'profile', label: 'Mi Perfil', icon: <Shield size={16} /> },
        { key: 'business', label: 'Negocio', icon: <Building2 size={16} />, adminOnly: true },
        { key: 'payments', label: 'Medios de Pago', icon: <CreditCard size={16} />, adminOnly: true },
        { key: 'printer', label: 'Impresora', icon: <Printer size={16} />, adminOnly: true },
        { key: 'clients', label: 'Clientes', icon: <Users size={16} />, adminOnly: true },
        { key: 'users', label: 'Usuarios', icon: <Users size={16} />, adminOnly: true },
        { key: 'personalization', label: 'Personalización', icon: <Layout size={16} />, adminOnly: true },
        { key: 'alerts', label: 'Alertas', icon: <Bell size={16} />, adminOnly: true }
    ];

    const handleSavePayments = () => {
        updatePaymentMethods(methods);
        toast.success('Métodos de pago actualizados');
    };

    const handleSaveBusiness = () => {
        updateSettings({ businessName, businessAddress, businessPhone } as any);
        toast.success('Datos del negocio guardados');
    };

    const handleSaveAlerts = () => {
        updateSettings({ alertStockMinDefault: alertStock, alertDaysBeforeExpiration: alertDays, maxClientDebt: maxDebt });
        toast.success('Alertas actualizadas');
    };

    const handleSaveClient = () => {
        if (!clientName) return;
        if (editingClientId) {
            const existing = clients.find(c => c.id === editingClientId);
            if (existing) {
                updateClient({ ...existing, name: clientName, dni: clientDni, phone: clientPhone });
                toast.success('Cliente actualizado');
            }
        } else {
            addClient({ id: crypto.randomUUID(), name: clientName, dni: clientDni, phone: clientPhone, currentAccountBalance: 0, virtualWalletBalance: 0 });
            toast.success('Cliente registrado');
        }
        setShowClientModal(false); setClientName(''); setClientDni(''); setClientPhone(''); setEditingClientId(null);
    };

    const handleSaveUser = () => {
        if (!userName || !userUsername) return;
        if (editingUserId) {
            const existing = systemUsers.find(u => u.id === editingUserId);
            if (existing) {
                updateSystemUser({ ...existing, name: userName, username: userUsername, role: userRole as any, ...(userPassword ? { password: userPassword } : {}) });
                toast.success('Usuario actualizado');
            }
        } else {
            if (!userPassword) { toast.error('La contraseña es requerida'); return; }
            addSystemUser({ id: crypto.randomUUID(), name: userName, username: userUsername, password: userPassword, role: userRole as any });
            toast.success('Usuario creado');
        }
        setShowUserModal(false); setUserName(''); setUserUsername(''); setUserPassword(''); setUserRole('admin'); setEditingUserId(null);
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }} className="animate-fadeIn">
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#000000', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings2 size={22} style={{ color: '#6366f1' }} /> Configuración
            </h2>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid #ffffff', paddingBottom: '4px', flexWrap: 'wrap' }}>
                {tabs.filter(t => !t.adminOnly || currentUser?.role === 'admin').map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                        style={{
                            padding: '10px 16px', borderRadius: '8px 8px 0 0', fontSize: '13px', fontWeight: '500',
                            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                            background: activeTab === t.key ? 'rgba(99,102,241,0.15)' : 'transparent',
                            color: activeTab === t.key ? '#818cf8' : '#000000'
                        }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && <UserProfile />}

            {/* Business Tab */}
            {activeTab === 'business' && (
                <div style={cardStyle}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#000000', marginBottom: '16px' }}>Datos del Negocio</h3>
                    <div style={{ display: 'grid', gap: '12px', maxWidth: '400px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Nombre</label>
                            <input value={businessName} onChange={e => setBusinessName(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Dirección</label>
                            <input value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Teléfono</label>
                            <input value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} style={inputStyle} />
                        </div>
                        <button onClick={handleSaveBusiness}
                            style={{ padding: '12px', borderRadius: '10px', border: 'none', background: '#6366f1', color: 'white', fontWeight: '600', cursor: 'pointer', width: 'fit-content', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Save size={14} /> Guardar
                        </button>
                    </div>

                    {/* Vista Previa del Ticket */}
                    <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Printer size={14} style={{ color: '#64748b' }} /> Vista previa del Encabezado del Ticket
                        </h4>

                        <div style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            padding: '20px',
                            width: '280px',
                            fontFamily: 'monospace',
                            color: '#000000',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                            textAlign: 'center'
                        }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                                {businessName || 'NOMBRE NEGOCIO'}
                            </h2>
                            {businessAddress && <p style={{ fontSize: '12px', margin: '0 0 2px 0' }}>{businessAddress}</p>}
                            {businessPhone && <p style={{ fontSize: '12px', margin: '0 0 2px 0' }}>Tel: {businessPhone}</p>}
                            <p style={{ fontSize: '12px', margin: '0 0 10px 0' }}>---------------------------------</p>
                            <p style={{ fontSize: '12px', margin: '0', textAlign: 'left' }}>FECHA: 08/03/2026 14:30</p>
                            <p style={{ fontSize: '12px', margin: '0', textAlign: 'left' }}>TK NRO: 00001234</p>
                            <p style={{ fontSize: '12px', margin: '0 0 10px 0' }}>---------------------------------</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
                                <span>CANT DETALLE</span>
                                <span>IMPORTE</span>
                            </div>
                        </div>
                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                            * Así se verá el inicio de tus comprobantes al imprimirlos.
                        </p>
                    </div>
                </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
                <div style={cardStyle}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#000000', marginBottom: '16px' }}>Medios de Pago</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                        {methods.map((m, i) => (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #000000' }}>
                                <span style={{ flex: 1, fontSize: '13px', color: '#000000', fontWeight: '500' }}>{m.name}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '11px', color: '#000000' }}>Recargo %</span>
                                    <input type="number" value={m.surchargePercent}
                                        onChange={e => setMethods(methods.map((x, j) => j === i ? { ...x, surchargePercent: parseFloat(e.target.value) || 0 } : x))}
                                        style={{ width: '70px', padding: '6px 8px', background: '#ffffff', border: '1px solid #000000', borderRadius: '6px', color: '#000000', fontSize: '13px', textAlign: 'center' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleSavePayments}
                        style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', background: '#6366f1', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                        <Save size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} /> Guardar Cambios
                    </button>
                </div>
            )}

            {/* Clients Tab */}
            {activeTab === 'clients' && (
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#000000' }}>Clientes ({clients.length})</h3>
                        <button onClick={() => { setEditingClientId(null); setClientName(''); setClientDni(''); setClientPhone(''); setShowClientModal(true); }}
                            style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#6366f1', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                            <Plus size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Nuevo
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '400px', overflowY: 'auto' }}>
                        {clients.map(c => (
                            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #000000' }}>
                                <div>
                                    <p style={{ fontSize: '13px', fontWeight: '500', color: '#000000' }}>{c.name}</p>
                                    <p style={{ fontSize: '11px', color: '#000000' }}>{c.dni || 'Sin DNI'} • {c.phone || 'Sin tel.'}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: c.currentAccountBalance > 0 ? '#ef4444' : '#22c55e' }}>
                                        ${c.currentAccountBalance?.toLocaleString() || 0}
                                    </span>
                                    <button onClick={() => { setEditingClientId(c.id); setClientName(c.name); setClientDni(c.dni || ''); setClientPhone(c.phone || ''); setShowClientModal(true); }}
                                        style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer', padding: '4px' }}>
                                        <Pencil size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#000000' }}>Usuarios del Sistema</h3>
                        <button onClick={() => { setEditingUserId(null); setUserName(''); setUserUsername(''); setUserPassword(''); setUserRole('admin'); setShowUserModal(true); }}
                            style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#6366f1', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                            <Plus size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Nuevo
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {systemUsers.map(u => (
                            <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #000000' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Shield size={14} style={{ color: '#6366f1' }} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: '500', color: '#000000' }}>{u.name}</p>
                                        <p style={{ fontSize: '11px', color: '#000000' }}>@{u.username} • {u.role}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button onClick={() => { setEditingUserId(u.id); setUserName(u.name); setUserUsername(u.username); setUserPassword(''); setUserRole(u.role); setShowUserModal(true); }}
                                        style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer', padding: '4px' }}>
                                        <Pencil size={12} />
                                    </button>
                                    {u.username !== 'admin' && (
                                        <button onClick={() => { if (confirm(`¿Eliminar ${u.name}?`)) { deleteSystemUser(u.id); toast.success('Eliminado'); } }}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
                <div style={cardStyle}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#000000', marginBottom: '16px' }}>Alertas y Umbrales</h3>
                    <div style={{ display: 'grid', gap: '16px', maxWidth: '400px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Stock Mínimo (alerta)</label>
                            <input type="number" value={alertStock} onChange={e => setAlertStock(Number(e.target.value))} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Días antes de vencimiento (alerta)</label>
                            <input type="number" value={alertDays} onChange={e => setAlertDays(Number(e.target.value))} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Deuda máxima cliente ($)</label>
                            <input type="number" value={maxDebt} onChange={e => setMaxDebt(Number(e.target.value))} style={inputStyle} />
                        </div>
                        <button onClick={handleSaveAlerts}
                            style={{ padding: '12px', borderRadius: '10px', border: 'none', background: '#6366f1', color: 'white', fontWeight: '600', cursor: 'pointer', width: 'fit-content', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Save size={14} /> Guardar
                        </button>
                    </div>
                </div>
            )}

            {/* Personalization Tab */}
            {activeTab === 'personalization' && (
                <div style={cardStyle}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#000000', marginBottom: '16px' }}>Personalización del POS</h3>

                    {/* Proporciones de Layout */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '8px' }}>Distribución de Columnas</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                            {[
                                { id: 'classic', label: 'Clásico (2:1)', desc: 'Más balanceado' },
                                { id: 'modern', label: 'Moderno (1:1)', desc: 'Espacio equitativo' },
                                { id: 'checkout-focused', label: 'Foco Cobro', desc: 'Prioridad al carrito' },
                                { id: 'compact', label: 'Compacto', desc: 'Foco al selector' }
                            ].map(l => (
                                <button key={l.id} onClick={() => updateSettings({ posLayout: l.id as any })}
                                    style={{
                                        padding: '12px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                                        border: `1px solid ${settings.posLayout === l.id ? '#6366f1' : '#000000'}`,
                                        background: settings.posLayout === l.id ? 'rgba(99,102,241,0.05)' : 'white'
                                    }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: settings.posLayout === l.id ? '#6366f1' : '#000000' }}>{l.label}</div>
                                    <div style={{ fontSize: '10px', color: '#64748b' }}>{l.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar Position */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '8px' }}>Ubicación de la Barra Lateral</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => updateSettings({ posReverseLayout: false })}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    border: `1px solid ${!settings.posReverseLayout ? '#6366f1' : '#000000'}`,
                                    background: !settings.posReverseLayout ? 'rgba(99,102,241,0.05)' : 'white'
                                }}>
                                <ArrowLeftRight size={14} /> Derecha
                            </button>
                            <button onClick={() => updateSettings({ posReverseLayout: true })}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    border: `1px solid ${settings.posReverseLayout ? '#6366f1' : '#000000'}`,
                                    background: settings.posReverseLayout ? 'rgba(99,102,241,0.05)' : 'white'
                                }}>
                                <ArrowLeftRight size={14} /> Izquierda
                            </button>
                        </div>
                    </div>

                    {/* Sidebar Actions Reordering */}
                    <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '8px' }}>Ubicación del Botón de Cobro</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => updateSettings({ posSidebarActions: 'bottom' })}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    border: `1px solid ${settings.posSidebarActions === 'bottom' ? '#6366f1' : '#000000'}`,
                                    background: settings.posSidebarActions === 'bottom' ? 'rgba(99,102,241,0.05)' : 'white'
                                }}>
                                <ArrowUpDown size={14} /> Abajo
                            </button>
                            <button onClick={() => updateSettings({ posSidebarActions: 'top' })}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    border: `1px solid ${settings.posSidebarActions === 'top' ? '#6366f1' : '#000000'}`,
                                    background: settings.posSidebarActions === 'top' ? 'rgba(99,102,241,0.05)' : 'white'
                                }}>
                                <ArrowUpDown size={14} /> Arriba
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'printer' && (
                <div style={cardStyle}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#000000', marginBottom: '16px' }}>Impresora de Tickets</h3>
                    <div style={{ display: 'grid', gap: '16px', maxWidth: '500px' }}>

                        {/* Printer Selection */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <label style={{ fontSize: '11px', fontWeight: '500', color: '#000000' }}>Impresora</label>
                                <button onClick={loadPrinters} disabled={loadingPrinters}
                                    style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                                    <RefreshCw size={12} style={{ animation: loadingPrinters ? 'spin 1s linear infinite' : 'none' }} />
                                    {loadingPrinters ? 'Buscando...' : 'Actualizar'}
                                </button>
                            </div>
                            <select value={selectedPrinter}
                                onChange={e => { setSelectedPrinter(e.target.value); printService.setSelectedPrinter(e.target.value || null); }}
                                style={inputStyle}>
                                <option value="">Impresora predeterminada del sistema</option>
                                {printers.map(p => (
                                    <option key={p.name} value={p.name}>
                                        {p.displayName || p.name} {p.isDefault ? '(default)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Paper Width */}
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Ancho de Papel</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {(['58mm', '80mm'] as const).map(w => (
                                    <button key={w} onClick={() => { setPrinterPaperWidth(w); printService.setPaperWidth(w); }}
                                        style={{
                                            flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer',
                                            border: `1px solid ${printerPaperWidth === w ? '#6366f1' : '#ffffff'}`,
                                            background: printerPaperWidth === w ? 'rgba(99,102,241,0.15)' : '#f8fafc',
                                            color: printerPaperWidth === w ? '#818cf8' : '#475569',
                                            fontWeight: '600', fontSize: '14px'
                                        }}>
                                        {w}
                                    </button>
                                ))}
                            </div>
                            <p style={{ fontSize: '10px', color: '#000000', marginTop: '4px' }}>58mm = impresoras portátiles • 80mm = impresoras de mostrador</p>
                        </div>

                        {/* Auto Print Toggle */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #000000'
                        }}>
                            <div>
                                <p style={{ fontSize: '13px', fontWeight: '500', color: '#000000' }}>Impresión automática</p>
                                <p style={{ fontSize: '11px', color: '#000000' }}>Imprime ticket al cobrar cada venta</p>
                            </div>
                            <button onClick={() => {
                                const newVal = !autoPrint;
                                setAutoPrint(newVal);
                                printService.setAutoPrint(newVal);
                                toast.success(newVal ? 'Impresión automática activada' : 'Impresión automática desactivada');
                            }}
                                style={{
                                    width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer',
                                    background: autoPrint ? '#6366f1' : '#ffffff', position: 'relative', transition: 'background 0.2s'
                                }}>
                                <div style={{
                                    width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                                    position: 'absolute', top: '3px',
                                    left: autoPrint ? '25px' : '3px', transition: 'left 0.2s'
                                }} />
                            </button>
                        </div>

                        {/* Test Print */}
                        <button onClick={async () => {
                            setTestPrinting(true);
                            try {
                                const testSale = {
                                    id: 'TEST-' + Date.now(),
                                    date: new Date().toISOString(),
                                    sessionId: '', items: [
                                        { id: '1', name: 'Producto de prueba', quantity: 2, price: 500, cost: 0, barcode: '', profitMargin: 0, supplierId: '' },
                                        { id: '2', name: 'Otro producto', quantity: 1, price: 1200, cost: 0, barcode: '', profitMargin: 0, supplierId: '' }
                                    ],
                                    subtotal: 2200, surcharge: 0, total: 2200, paymentMethodName: 'Efectivo'
                                };
                                const success = await printService.printReceipt(
                                    testSale as any,
                                    settings.businessName || 'FashionPro',
                                    (settings as any).businessAddress,
                                    (settings as any).businessPhone
                                );
                                if (success) toast.success('Ticket de prueba impreso');
                                else toast.error('No se pudo imprimir. Verificá la impresora.');
                            } catch { toast.error('Error de impresión'); }
                            finally { setTestPrinting(false); }
                        }} disabled={testPrinting}
                            style={{ padding: '14px', borderRadius: '10px', border: 'none', background: '#6366f1', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Printer size={16} /> {testPrinting ? 'Imprimiendo...' : 'Imprimir Ticket de Prueba'}
                        </button>

                        <div style={{ padding: '12px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px' }}>
                            <p style={{ fontSize: '11px', color: '#818cf8', lineHeight: '1.5' }}>
                                💡 <strong>Tip:</strong> Asegurate de que la impresora térmica esté instalada como impresora de Windows. FashionPro imprime usando el driver del sistema.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Client Modal */}
            {showClientModal && (
                <div style={modalOverlay}>
                    <div style={modalBox}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#000000' }}>{editingClientId ? 'Editar' : 'Nuevo'} Cliente</h3>
                            <button onClick={() => setShowClientModal(false)} style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Nombre</label>
                                <input value={clientName} onChange={e => setClientName(e.target.value)} style={inputStyle} autoFocus /></div>
                            <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>DNI</label>
                                <input value={clientDni} onChange={e => setClientDni(e.target.value)} style={inputStyle} /></div>
                            <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Teléfono</label>
                                <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} style={inputStyle} /></div>
                            <button onClick={handleSaveClient} style={{ padding: '12px', borderRadius: '10px', border: 'none', background: '#6366f1', color: 'white', fontWeight: '600', cursor: 'pointer', marginTop: '4px' }}>
                                {editingClientId ? 'Guardar' : 'Registrar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Modal */}
            {showUserModal && (
                <div style={modalOverlay}>
                    <div style={modalBox}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#000000' }}>{editingUserId ? 'Editar' : 'Nuevo'} Usuario</h3>
                            <button onClick={() => setShowUserModal(false)} style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Nombre completo</label>
                                <input value={userName} onChange={e => setUserName(e.target.value)} style={inputStyle} autoFocus /></div>
                            <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Usuario (login)</label>
                                <input value={userUsername} onChange={e => setUserUsername(e.target.value)} style={inputStyle} /></div>
                            <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Contraseña {editingUserId && '(dejar vacío para no cambiar)'}</label>
                                <input type="password" value={userPassword} onChange={e => setUserPassword(e.target.value)} style={inputStyle} placeholder={editingUserId ? '••••••••' : ''} /></div>
                            <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Rol</label>
                                <select value={userRole} onChange={e => setUserRole(e.target.value)} style={inputStyle}>
                                    <option value="admin">Administrador</option>
                                    <option value="operator">Operador</option>
                                </select></div>
                            <button onClick={handleSaveUser} style={{ padding: '12px', borderRadius: '10px', border: 'none', background: '#6366f1', color: 'white', fontWeight: '600', cursor: 'pointer', marginTop: '4px' }}>
                                {editingUserId ? 'Guardar' : 'Crear Usuario'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
