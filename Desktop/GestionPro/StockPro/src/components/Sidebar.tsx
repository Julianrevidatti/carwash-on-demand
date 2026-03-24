import React from 'react';
import {
    LayoutDashboard, ShoppingCart, Package, DollarSign,
    Truck, BarChart3, Tag, Receipt, Settings, LogOut, Lock
} from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    isOpen: boolean;
    onLogout: () => void;
    userName: string;
    hasOpenSession: boolean;
}

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Punto de Venta', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'cashcontrol', label: 'Control Caja', icon: Lock },
    { id: 'cashflow', label: 'Flujo Caja', icon: DollarSign },
    { id: 'suppliers', label: 'Proveedores', icon: Truck },
    { id: 'reports', label: 'Reportes', icon: BarChart3 },
    { id: 'promotions', label: 'Promos', icon: Tag },
    { id: 'expenses', label: 'Gastos', icon: Receipt },
    { id: 'settings', label: 'Config', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
    activeTab, onTabChange, isOpen, onLogout, userName, hasOpenSession
}) => {
    if (!isOpen) return null;

    return (
        <div className="animate-slideIn" style={{
            width: '220px',
            minWidth: '220px',
            height: '100vh',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            borderRight: '1px solid #ffffff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Logo */}
            <div style={{
                padding: '20px 16px',
                borderBottom: '1px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}>
                    <Package size={20} color="white" />
                </div>
                <div>
                    <h1 style={{
                        fontSize: '18px',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #f8fafc, #818cf8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        StockPro
                    </h1>
                    <p style={{ fontSize: '10px', color: '#000000', marginTop: '-2px' }}>v1.0.0</p>
                </div>
            </div>

            {/* Nav Items */}
            <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
                {navItems.map(item => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 12px',
                                marginBottom: '2px',
                                border: 'none',
                                borderRadius: '10px',
                                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                color: isActive ? '#818cf8' : '#475569',
                                fontSize: '13px',
                                fontWeight: isActive ? '600' : '400',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'rgba(226, 232, 240, 0.5)';
                                    e.currentTarget.style.color = '#ffffff';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#000000';
                                }
                            }}
                        >
                            <Icon size={18} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Session Status */}
            {hasOpenSession && (
                <div style={{
                    margin: '0 12px',
                    padding: '8px 12px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#22c55e',
                        animation: 'pulse 2s infinite'
                    }} />
                    <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: '500' }}>
                        Caja Abierta
                    </span>
                </div>
            )}

            {/* User & Logout */}
            <div style={{
                padding: '12px 12px 16px',
                borderTop: '1px solid #ffffff',
                marginTop: '8px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'rgba(226, 232, 240, 0.3)'
                }}>
                    <div>
                        <p style={{ fontSize: '13px', fontWeight: '500', color: '#000000' }}>
                            {userName}
                        </p>
                        <p style={{ fontSize: '10px', color: '#000000' }}>Administrador</p>
                    </div>
                    <button
                        onClick={onLogout}
                        title="Cerrar Sesión"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            padding: '6px',
                            borderRadius: '8px',
                            display: 'flex',
                            cursor: 'pointer'
                        }}
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
