import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Tag,
  Package,
  DollarSign,
  PieChart,
  Settings,
  LogOut,
  Menu,
  X,
  UserCircle,
  ShieldCheck,
  Percent,
  Server,
  Truck,
  Users, // RESTORED
  Wallet,
  AlertTriangle,
  RotateCcw, // NEW
  BookOpen // TUTORIALS
} from 'lucide-react';
import { User, CashSession } from '../types';
import { PERMISSIONS } from '../config/permissions';
import { useStore } from '../src/store/useStore';
import { usePlanPermissions } from '../hooks/usePlanPermissions';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  user: User;
  currentSession: CashSession | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onNavigate, isOpen, onClose, user, currentSession }) => {
  // Calculate days remaining
  const today = new Date();
  const expiryDate = new Date(user.subscriptionExpiry);
  const timeDiff = expiryDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const isUrgent = daysRemaining <= 5;

  // Role Based Visibility Helper
  const hasPermission = (perm: string) => {
    if (user.role === 'sysadmin' || user.role === 'admin') return true;
    return user.permissions?.includes(perm);
  };

  const isSessionOpen = currentSession && currentSession.status === 'OPEN';

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 flex flex-col print:hidden`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">GESTIÓN NOW</h1>
          <p className="text-xs text-slate-400 mt-1">v4.0 Ultimate</p>
        </div>
        <button onClick={onClose} className="lg:hidden text-slate-400"><X /></button>
      </div>

      {/* Scrollable Navigation Area */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

        {/* --- MAIN OPERATIONS --- */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-4">Operaciones Principales</h3>
          <div className="space-y-1">
            <NavBtn icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => onNavigate('dashboard')} />
            <NavBtn
              icon={<ShoppingCart />}
              label={!isSessionOpen ? "Punto de Venta (Cerrado)" : "Punto de Venta"}
              active={activeTab === 'pos'}
              onClick={() => onNavigate('pos')}
            />

            <NavBtn icon={<Package />} label="Inventario" active={activeTab === 'inventory'} onClick={() => onNavigate('inventory')} />
            {usePlanPermissions().canAccessPromotions && (
              <NavBtn icon={<Percent />} label="Promociones" active={activeTab === 'promotions'} onClick={() => onNavigate('promotions')} />
            )}
            {hasPermission(PERMISSIONS.POS_VIEW_CASH_FLOW) && (
              <NavBtn icon={<DollarSign />} label="Flujo de Caja" active={activeTab === 'cash_flow'} onClick={() => onNavigate('cash_flow')} />
            )}
            {hasPermission(PERMISSIONS.POS_CLOSE_CASH) && (
              <NavBtn icon={<Wallet />} label="Cierre de Caja" active={activeTab === 'cash_control'} onClick={() => onNavigate('cash_control')} />
            )}
          </div>
        </div>

        {/* --- BUSINESS MANAGEMENT --- */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-4">Gestión Comercial</h3>
          <div className="space-y-1">
            {hasPermission(PERMISSIONS.REPORTS_VIEW) && (
              <NavBtn icon={<PieChart />} label="Data & BI" active={activeTab === 'reports'} onClick={() => onNavigate('reports')} />
            )}
            {user.role === 'sysadmin' && (
              <NavBtn icon={<Server />} label="SaaS Admin" active={activeTab === 'saas_admin'} onClick={() => onNavigate('saas_admin')} />
            )}
            {hasPermission(PERMISSIONS.SUPPLIERS_MANAGE) && (
              <NavBtn icon={<Truck />} label="Proveedores" active={activeTab === 'suppliers'} onClick={() => onNavigate('suppliers')} />
            )}
            {hasPermission(PERMISSIONS.CLIENTS_MANAGE) && (
              <NavBtn icon={<Users />} label="Clientes" active={activeTab === 'clients'} onClick={() => onNavigate('clients')} />
            )}

            {hasPermission(PERMISSIONS.EXPENSES_MANAGE) && (
              <NavBtn icon={<Wallet />} label="Gastos Operativos" active={activeTab === 'expenses'} onClick={() => onNavigate('expenses')} />
            )}
          </div>
        </div>

        {/* --- HELP & LEARNING --- */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-4">Ayuda y Aprendizaje</h3>
          <div className="space-y-1">
            <NavBtn icon={<BookOpen />} label="Tutoriales" active={activeTab === 'tutorials'} onClick={() => onNavigate('tutorials')} />
          </div>
        </div>
      </nav>

      {/* --- BOTTOM SECTION (Fixed) --- */}
      <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0 space-y-4">
        {hasPermission(PERMISSIONS.ADMIN_SETTINGS) && (
          <NavBtn icon={<Settings />} label="Configuración" active={activeTab === 'settings'} onClick={() => onNavigate('settings')} />
        )}

        {/* ACCOUNT & STATUS WIDGET */}
        <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-white">{user.name}</p>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <p className="text-xs text-slate-400 capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          <div className="text-xs bg-slate-900 rounded px-2 py-1 text-center text-slate-400 mb-2">
            Permisos: {user.role === 'admin' ? 'Acceso Total' : 'Limitado'}
          </div>

          <button
            onClick={() => useStore.getState().logoutOperator()}
            className="w-full text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 rounded flex items-center justify-center gap-2 transition-colors mb-2"
          >
            <RotateCcw className="w-3 h-3" /> Cambiar Usuario
          </button>

          {/* SUBSCRIPTION ALERT */}
          {isUrgent ? (
            <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-2 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-300">
                  {daysRemaining < 0 ? "Licencia Vencida" : "Licencia Expira"}
                </p>
                <p className="text-[10px] text-red-200">
                  {daysRemaining < 0
                    ? `Venció hace ${Math.abs(daysRemaining)} días.`
                    : `Pago requerido en ${daysRemaining} días.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 text-center">
              Licencia válida por {daysRemaining} días
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

const NavBtn: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void; disabled?: boolean }> = ({ icon, label, active, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${disabled
      ? 'text-slate-600 cursor-not-allowed opacity-50'
      : active
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
  >
    {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
    <span className="font-medium text-sm">{label} {disabled && '(Cerrado)'}</span>
  </button>
);
