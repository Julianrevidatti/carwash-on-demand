import React, { useState, useEffect } from 'react';
import { Menu, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useStore } from './store/useStore';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { Inventory } from './components/Inventory';
import { CashControl } from './components/CashControl';
import { CashFlow } from './components/CashFlow';
import { Suppliers } from './components/Suppliers';
import { SalesHistory } from './components/SalesHistory';
import { Promotions } from './components/Promotions';
import { ExpensesManager } from './components/ExpensesManager';
import { Settings } from './components/Settings';

const TAB_LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    pos: 'Punto de Venta',
    inventory: 'Inventario',
    cashcontrol: 'Control de Caja',
    cashflow: 'Flujo de Caja',
    suppliers: 'Proveedores',
    reports: 'Historial de Ventas',
    promotions: 'Promociones',
    expenses: 'Gastos Operativos',
    settings: 'Configuración'
};

const App: React.FC = () => {
    const currentUser = useStore(s => s.currentUser);
    const login = useStore(s => s.login);
    const logout = useStore(s => s.logout);
    const loadAllData = useStore(s => s.loadAllData);
    const currentSession = useStore(s => s.currentSession);

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [dataLoaded, setDataLoaded] = useState(false);

    useEffect(() => {
        if (currentUser && !dataLoaded) {
            setLoading(true);
            loadAllData()
                .then(() => { setDataLoaded(true); toast.success('Datos cargados'); })
                .catch(err => { console.error(err); toast.error('Error al cargar datos'); })
                .finally(() => setLoading(false));
        }
    }, [currentUser, dataLoaded]);

    useEffect(() => { if (!currentUser) setDataLoaded(false); }, [currentUser]);

    const handleLogin = async (username: string, password: string): Promise<boolean> => {
        const success = await login(username, password);
        if (success) toast.success('¡Bienvenido!');
        return success;
    };

    const handleLogout = () => {
        logout();
        setActiveTab('dashboard');
        toast.success('Sesión cerrada');
    };

    if (!currentUser) {
        return (
            <>
                <Toaster position="top-right" richColors theme="light" />
                <LoginScreen onLogin={handleLogin} />
            </>
        );
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', gap: '16px' }}>
                <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
                <p style={{ color: '#000000', fontSize: '14px' }}>Cargando datos...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <Dashboard />;
            case 'pos': return <POS />;
            case 'inventory': return <Inventory />;
            case 'cashcontrol': return <CashControl />;
            case 'cashflow': return <CashFlow />;
            case 'suppliers': return <Suppliers />;
            case 'reports': return <SalesHistory />;
            case 'promotions': return <Promotions />;
            case 'expenses': return <ExpensesManager />;
            case 'settings': return <Settings />;
            default: return <Dashboard />;
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Toaster position="top-right" richColors theme="light" />
            <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isOpen={isSidebarOpen}
                onLogout={handleLogout}
                userName={currentUser.name}
                hasOpenSession={!!currentSession}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                    height: '56px', display: 'flex', alignItems: 'center', padding: '0 20px',
                    background: 'rgba(255,255,255,0.5)', borderBottom: '1px solid #ffffff',
                    backdropFilter: 'blur(10px)', gap: '12px'
                }}>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)}
                        style={{ background: 'none', border: 'none', color: '#000000', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <Menu size={20} />
                    </button>
                    <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#000000' }}>
                        {TAB_LABELS[activeTab] || activeTab}
                    </h2>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#000000', fontSize: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                        Offline — Datos locales
                    </div>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: activeTab === 'pos' ? '0' : '24px', background: '#f8fafc' }}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default App;
