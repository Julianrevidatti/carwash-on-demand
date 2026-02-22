import React, { useState } from 'react';
import { createPreference, validateToken } from '../src/services/mercadoPago';
import { Client, PaymentMethodConfig, CashSession, CashMovement, MovementType, SystemSettings, User, UserRole } from '../types';
import { CreditCard, User as UserIcon, Edit2, Plus, DollarSign, X, CheckCircle, Zap, ShieldCheck, Users, Lock, Trash2, Wifi, TrendingUp, CheckSquare, Square, LayoutDashboard, QrCode as QrIcon, ExternalLink, Copy, Settings as SettingsIcon, Clock, ShieldAlert } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useStore } from '../src/store/useStore';
import { toast } from 'sonner';
import { PlanSelectionModal } from './PlanSelectionModal';
import { createSubscriptionLink } from '../src/services/preApprovalService';
import { PricingPlan } from '../config/planLimits';
import { SessionStatus } from './SessionStatus';
import { usePlanPermissions } from '../hooks/usePlanPermissions';
import { PERMISSIONS, PERMISSIONS_GROUPS, ROLE_TEMPLATES } from '../config/permissions';

interface SettingsProps {
  paymentMethods: PaymentMethodConfig[];
  onUpdatePaymentMethods: (methods: PaymentMethodConfig[]) => void;
  clients: Client[];
  onUpdateClients: (clients: Client[]) => void;
  currentSession: CashSession | null;
  onAddCashMovement: (movement: CashMovement) => void;
  settings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => void;
  // User Management
  systemUsers: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  currentUserRole: UserRole;
}

export const Settings: React.FC<SettingsProps> = ({
  paymentMethods,
  onUpdatePaymentMethods,
  clients,
  onUpdateClients,
  currentSession,
  onAddCashMovement,
  settings,
  onUpdateSettings,
  systemUsers,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentUserRole
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const currentUser = useStore(state => state.currentUser);
  const currentTenant = useStore(state => state.currentTenant);
  const updateTenant = useStore(state => state.updateTenant); // Get updateTenant action
  const [whatsappNumber, setWhatsappNumber] = useState(currentTenant?.whatsappNumber || '');
  const [businessName, setBusinessName] = useState(currentTenant?.businessName || '');
  const [address, setAddress] = useState(currentTenant?.address || '');
  const [cuit, setCuit] = useState(currentTenant?.cuit || '');
  const [enableCatalog, setEnableCatalog] = useState(currentTenant?.enableCatalog ?? true);

  // Update local state when tenant changes
  // Update local state when tenant changes
  React.useEffect(() => {
    if (currentTenant) {
      if (currentTenant.whatsappNumber) setWhatsappNumber(currentTenant.whatsappNumber);
      if (currentTenant.businessName) setBusinessName(currentTenant.businessName);
      if (currentTenant.address) setAddress(currentTenant.address);
      if (currentTenant.cuit) setCuit(currentTenant.cuit);
      setEnableCatalog(currentTenant.enableCatalog ?? true);
    }
  }, [currentTenant]);

  // New Client State
  const [newClientName, setNewClientName] = useState('');
  const [newClientDni, setNewClientDni] = useState('');

  // Editing Client State
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Paying Debt State
  const [payingClient, setPayingClient] = useState<Client | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  // Mercado Pago State
  const [mpToken, setMpToken] = useState(settings.mercadoPagoAccessToken || '');
  const [mpUserId, setMpUserId] = useState(settings.mercadoPagoUserId || '');

  // New User State
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('employee');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [showPermissions, setShowPermissions] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // --- Handlers ---

  const handleUpdateSurcharge = (id: string, newPercent: string) => {
    const val = parseFloat(newPercent);
    if (isNaN(val)) return;
    onUpdatePaymentMethods(paymentMethods.map(pm => pm.id === id ? { ...pm, surchargePercent: val } : pm));
  };

  const handleAddClient = () => {
    if (!newClientName || !newClientDni) return;
    const newClient: Client = {
      id: crypto.randomUUID(),
      name: newClientName,
      dni: newClientDni,
      currentAccountBalance: 0,
      virtualWalletBalance: 0
    };
    onUpdateClients([...clients, newClient]);
    setNewClientName('');
    setNewClientDni('');
  };

  const handleSaveEdit = () => {
    if (!editingClient) return;
    onUpdateClients(clients.map(c => c.id === editingClient.id ? editingClient : c));
    setEditingClient(null);
  };

  const handleSaveMP = () => {
    onUpdateSettings({
      ...settings,
      mercadoPagoAccessToken: mpToken.trim(),
      mercadoPagoUserId: mpUserId.trim()
    });
    alert("Credenciales de Mercado Pago guardadas. El POS ahora generará QRs dinámicos reales.");
  };

  const handleConfirmPayment = () => {
    if (!payingClient || !paymentAmount) return;

    // 1. Validation
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Ingrese un monto válido");
      return;
    }

    if (!currentSession || currentSession.status === 'CLOSED') {
      alert("Debe abrir la caja para registrar pagos.");
      return;
    }

    // 2. Create Cash Movement (Money IN)
    const movement: CashMovement = {
      id: crypto.randomUUID(),
      sessionId: currentSession.id,
      date: new Date().toISOString(),
      type: MovementType.DEPOSIT,
      amount: amount,
      description: `Pago Deuda: ${payingClient.name} `
    };
    onAddCashMovement(movement);

    // 3. Update Client Balance (Reduce Debt)
    const updatedClient = {
      ...payingClient,
      currentAccountBalance: payingClient.currentAccountBalance - amount
    };
    onUpdateClients(clients.map(c => c.id === payingClient.id ? updatedClient : c));

    // 4. Close Modal
    setPayingClient(null);
    setPaymentAmount('');
  };

  const handleCreateUser = () => {
    if (!newUserName || !newUserUsername || !newUserPassword) {
      alert("Todos los campos son obligatorios");
      return;
    }
    const newUser: User = {
      id: crypto.randomUUID(),
      name: newUserName,
      username: newUserUsername,
      password: newUserPassword,
      pin: newUserPin,
      role: newUserRole,
      permissions: newUserRole === 'admin' ? Object.values(PERMISSIONS) : selectedPermissions,
      subscriptionExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
    };
    onAddUser(newUser);
    setNewUserName('');
    setNewUserUsername('');
    setNewUserPassword('');
    setNewUserPin('');
    setNewUserRole('employee');
    setSelectedPermissions([]);
    alert("Usuario creado exitosamente.");
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    onUpdateUser(editingUser);
    setEditingUser(null);
    alert("Usuario actualizado exitosamente.");
  };

  const handleCheckoutDirect = async (plan: PricingPlan) => {
    try {
      toast.info("Generando link de suscripción...");
      const reference = currentTenant?.id || `sub_${Date.now()}`;

      const amount = plan === 'BASIC' ? 9999 : plan === 'PRO' ? 13999 : 29999;
      const planName = plan === 'BASIC' ? 'Básico' : plan === 'PRO' ? 'PRO' : 'Ultimate';

      // Use the store's current user email or tenant contact name (which is often the same)
      const userEmail = currentUser?.email || currentTenant?.contactName || "cliente@gestionpro.com";

      const checkoutUrl = await createSubscriptionLink(
        currentTenant,
        plan as 'BASIC' | 'PRO' | 'ULTIMATE',
        amount,
        userEmail
      );

      if (!checkoutUrl) {
        throw new Error("No se pudo obtener el punto de inicio de pago.");
      }

      toast.success("Redirigiendo a Mercado Pago...");
      window.location.href = checkoutUrl;

    } catch (error: any) {
      toast.error(`Error: ${error.message || "No se pudo iniciar el pago"}`);
    }
  };

  const isMpConnected = !!settings.mercadoPagoAccessToken;

  const { canAddUser, limits } = usePlanPermissions();

  // --- Subscription Logic ---
  const today = new Date();
  const dueDate = new Date(currentTenant?.nextDueDate || today);
  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysUntilDue <= 0;

  // Grace Period Calculation
  const gracePeriodStart = currentTenant?.gracePeriodStart;
  const graceDaysElapsed = gracePeriodStart
    ? Math.floor((today.getTime() - new Date(gracePeriodStart).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const graceDaysTotal = 5;
  const graceDaysRemaining = Math.max(0, graceDaysTotal - graceDaysElapsed);
  const isInGracePeriod = isExpired && graceDaysRemaining > 0;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Configuración del Sistema</h2>
        <button
          onClick={() => {
            if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
              localStorage.removeItem('user_id'); // Or whatever key is used
              window.location.reload();
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors border border-red-100"
        >
          <div className="bg-red-200 p-1 rounded-full">
            <SettingsIcon className="w-3 h-3 text-red-600" />
          </div>
          Cerrar Sesión
        </button>
      </div>

      {/* Tabs */}
      {/* Tabs */}
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar mb-8">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border-2 ${activeTab === 'payments' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 border-blue-600 scale-105' : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50'}`}
        >
          Medios de Pago
        </button>

        {currentUserRole === 'admin' && (
          <>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border-2 ${activeTab === 'users' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 border-blue-600 scale-105' : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50'}`}
            >
              Usuarios del Sistema
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border-2 ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 border-blue-600 scale-105' : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50'}`}
            >
              Dashboard
            </button>
          </>
        )}
        <button
          onClick={() => setActiveTab('subscription')}
          className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border-2 flex items-center gap-2 ${activeTab === 'subscription' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 border-blue-600 scale-105' : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50'}`}
        >
          <CreditCard className="w-4 h-4" />
          Mi Suscripción
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border-2 ${activeTab === 'integrations' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 border-blue-600 scale-105' : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50'}`}
        >
          Integraciones
        </button>
        <button
          onClick={() => setActiveTab('session')}
          className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border-2 flex items-center gap-2 ${activeTab === 'session' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 border-blue-600 scale-105' : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50'}`}
        >
          <Wifi className="w-4 h-4" />
          Sesión
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border-2 flex items-center gap-2 ${activeTab === 'catalog' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 border-blue-600 scale-105' : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50'}`}
        >
          <QrIcon className="w-4 h-4" />
          Mi Negocio
        </button>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="mt-6">
        {activeTab === 'payments' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" /> Configurar Recargos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-4 rounded-tl-lg">Método de Pago</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4 rounded-tr-lg">Recargo al Cliente (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paymentMethods.map(pm => (
                    <tr key={pm.id} className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{pm.name}</td>
                      <td className="p-4 text-gray-500">
                        {pm.isCash ? 'Efectivo' : pm.isCurrentAccount ? 'Cuenta Corriente' : 'Digital/Bancario'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className="border border-gray-300 p-2 rounded w-20 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                            value={pm.surchargePercent}
                            onChange={(e) => handleUpdateSurcharge(pm.id, e.target.value)}
                            disabled={pm.isCash || pm.isCurrentAccount}
                          />
                          <span className="text-gray-500">%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-4">* Los recargos se aplican automáticamente al total de la venta en el POS.</p>
          </div>
        )}

        {activeTab === 'users' && currentUserRole === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
            {/* New User Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" /> Registrar Usuario
              </h3>

              {!canAddUser() ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6 text-slate-500" />
                  </div>
                  <h4 className="font-bold text-slate-700 mb-1">Límite Alcanzado</h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Tu plan actual solo permite {limits.maxUsers} usuarios.
                  </p>
                  <button className="text-xs bg-gradient-to-r from-orange-500 to-pink-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1 w-full">
                    <TrendingUp className="w-3 h-3" /> Actualizar Plan
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 p-2 rounded-lg"
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                      placeholder="Nombre del empleado"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nombre de Usuario</label>
                    <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg px-3">
                      <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                      <input
                        type="text"
                        className="w-full border-none bg-transparent p-2 focus:ring-0 text-gray-900"
                        value={newUserUsername}
                        onChange={e => setNewUserUsername(e.target.value)}
                        placeholder="Ej: juan.caja1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña (Opcional)</label>
                    <input
                      type="password"
                      className="w-full border border-gray-300 p-2 rounded-lg"
                      value={newUserPassword}
                      onChange={e => setNewUserPassword(e.target.value)}
                      placeholder="Para login remoto"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">PIN de Acceso (4 dígitos)</label>
                    <input
                      type="text"
                      maxLength={4}
                      className="w-full border border-gray-300 p-2 rounded-lg font-mono tracking-widest text-center"
                      value={newUserPin}
                      onChange={e => setNewUserPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="0000"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Rol Base</label>
                    <select
                      className="w-full border border-gray-300 p-2 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                      value={newUserRole}
                      onChange={e => {
                        const role = e.target.value as UserRole;
                        setNewUserRole(role);
                        if (role === 'employee') setSelectedPermissions(ROLE_TEMPLATES.CASHIER?.permissions || []);
                        if (role === 'admin') setSelectedPermissions(ROLE_TEMPLATES.ADMIN?.permissions || []);
                      }}
                    >
                      <option value="employee">Empleado (Estándar)</option>
                      <option value="custom">Personalizado / Avanzado</option>
                      <option value="admin">Administrador (Total)</option>
                    </select>
                  </div>

                  {newUserRole !== 'admin' && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-700">Permisos y Accesos</span>
                        <button
                          onClick={() => setShowPermissions(!showPermissions)}
                          className="text-[10px] text-blue-600 font-bold hover:underline"
                        >
                          {showPermissions ? 'Ocultar Detalle' : 'Ver Detalle'}
                        </button>
                      </div>

                      {showPermissions && (
                        <div className="space-y-3 animate-in slide-in-from-top-2">
                          {Object.entries(PERMISSIONS_GROUPS).map(([groupKey, group]) => (
                            <div key={groupKey}>
                              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 border-b border-slate-200 pb-1">
                                {groupKey}
                              </h5>
                              <div className="grid grid-cols-1 gap-1">
                                {group.map(p => (
                                  <label key={p.key} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded">
                                    <div className="relative flex items-center">
                                      <input
                                        type="checkbox"
                                        className="peer h-3 w-3 cursor-pointer appearance-none rounded border border-slate-300 shadow-sm checked:border-blue-500 checked:bg-blue-500 hover:border-blue-400"
                                        checked={(selectedPermissions || []).includes(p.key)}
                                        onChange={() => {
                                          const currentPerms = selectedPermissions || [];
                                          if (currentPerms.includes(p.key)) {
                                            setSelectedPermissions(currentPerms.filter(id => id !== p.key));
                                          } else {
                                            setSelectedPermissions([...currentPerms, p.key]);
                                          }
                                        }}
                                      />
                                      <CheckCircle className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100" />
                                    </div>
                                    <span className="text-xs text-slate-700 select-none">{p.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 mt-2 text-center">
                        {(selectedPermissions || []).length} permisos seleccionados
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleCreateUser}
                    className="w-full bg-purple-600 text-white py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors shadow-md shadow-purple-200"
                  >
                    Crear Usuario
                  </button>
                </div>
              )}
            </div>

            {/* Users List */}
            <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" /> Usuarios Registrados
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="p-4 rounded-tl-lg">Nombre</th>
                      <th className="p-4">Usuario</th>
                      <th className="p-4">Rol</th>
                      <th className="p-4 rounded-tr-lg">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(systemUsers || []).map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-900">{user.name}</td>
                        <td className="p-4 text-gray-500">{user.username}</td>
                        <td className="p-4 text-gray-500 capitalize">{user.role}</td>
                        <td className="p-4">
                          <button
                            onClick={() => onDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-bold"
                          >
                            Eliminar
                          </button>
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-bold ml-4"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Mercado Pago</h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">Configura tu cuenta para cobros con QR Dinámico</p>
                  {isMpConnected ? (
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">CONECTADO</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200">INACTIVO</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800">
                <p className="flex gap-2">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  Al ingresar tus credenciales de producción, el sistema generará un QR único por cada venta. El estado del pago se actualizará automáticamente.
                </p>
              </div>

              {/* Toggle Enable Integration */}
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <label className="text-sm font-bold text-gray-800">Activar integración automática</label>
                  <p className="text-xs text-gray-500">
                    Si se desactiva, el cobro con QR se registrará manualmente sin conectar con Mercado Pago ni validar el pago.
                  </p>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ...settings, enableMpIntegration: !settings.enableMpIntegration })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${settings.enableMpIntegration ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.enableMpIntegration ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {settings.enableMpIntegration && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Access Token (Producción)</label>
                    <input
                      type="password"
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm text-gray-900 bg-white"
                      placeholder="APP_USR-..."
                      value={mpToken}
                      onChange={e => setMpToken(e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1">Lo encontrás en el Panel de Desarrolladores de Mercado Pago.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">User ID / Store ID (Opcional)</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
                      placeholder="Ej: 12345678"
                      value={mpUserId}
                      onChange={e => setMpUserId(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveMP}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
                  >
                    Guardar y Activar
                  </button>
                  <button
                    onClick={async () => {
                      if (!mpToken) {
                        alert("Ingrese un Access Token para probar.");
                        return;
                      }
                      try {
                        const isValid = await validateToken(mpToken);
                        if (isValid) {
                          alert("✅ ¡Conexión Exitosa!\n\nEl Access Token es válido y funciona correctamente.");
                        } else {
                          alert("❌ Error de Conexión\n\nEl Access Token no es válido o no tiene permisos suficientes.");
                        }
                      } catch (error) {
                        alert("❌ Error al probar conexión.");
                      }
                    }}
                    className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                  >
                    Probar Credenciales
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
        }

        {
          activeTab === 'dashboard' && (
            <div className="animate-in fade-in space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-blue-600" /> Personalizar Dashboard
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Seleccione qué tarjetas y widgets desea visualizar en la pantalla principal.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'dailySales', label: 'Ventas del Día' },
                    { key: 'monthlySales', label: 'Ventas del Mes' },
                    { key: 'netProfit', label: 'Ganancia Neta' },
                    { key: 'topProducts', label: 'Productos Top' },
                    { key: 'lowStock', label: 'Alertas de Stock Bajo' },
                    { key: 'pendingRestocks', label: 'Reposición Pendiente' },
                    { key: 'monthlyExpenses', label: 'Gastos del Mes' },
                    { key: 'smartPromo', label: 'Recomendador de Promos' },
                    { key: 'businessCapital', label: 'Capital del Negocio' },
                    { key: 'salesEvolution', label: 'Gráfico de Ventas' },
                    { key: 'categoryDistribution', label: 'Distribución por Categoría' },
                  ].map((widget) => {
                    const isChecked = settings.dashboardWidgets?.[widget.key as keyof typeof settings.dashboardWidgets] ?? true;
                    return (
                      <div key={widget.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="font-medium text-gray-700">{widget.label}</span>
                        <button
                          onClick={() => {
                            const newWidgets = { ...settings.dashboardWidgets };
                            // @ts-ignore
                            newWidgets[widget.key] = !isChecked;
                            onUpdateSettings({ ...settings, dashboardWidgets: newWidgets });
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isChecked ? 'bg-blue-600' : 'bg-gray-200'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isChecked ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )
        }

        {/* --- SUBSCRIPTION TAB --- */}
        {
          activeTab === 'subscription' && (
            <div className="animate-in fade-in">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-500" />
                  Mi Suscripción
                </h3>

                <p className="text-sm text-gray-500 mb-6">
                  Administra tu plan y opciones de facturación desde aquí.
                </p>

                {/* Dynamic Plan Info */}
                {(() => {
                  // Determine if trial or paid
                  const isTrial = currentTenant?.pricingPlan === 'FREE';
                  const isPaid = !isTrial;

                  // Calculate days remaining (Mock logic if createdAt is missing, assuming 7 days trial)
                  // In a real scenario, we'd use currentTenant.createdAt
                  // For now, let's use a robust fallback or the actual field if available
                  const activationDate = currentTenant?.createdAt ? new Date(currentTenant.createdAt) : new Date();
                  const now = new Date();
                  const diffTime = Math.abs(now.getTime() - activationDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const daysRemaining = Math.max(0, 7 - diffDays);
                  const progress = Math.min(100, (diffDays / 7) * 100);

                  if (isTrial) {
                    return (
                      <div className="space-y-6">
                        {/* Trial Status Card */}
                        <div className="bg-gradient-to-br from-orange-50 to-pink-50 border border-orange-200 p-6 rounded-xl">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-xs text-orange-600 font-bold uppercase tracking-wide mb-1">Estado del Plan</p>
                              <p className="text-2xl font-black text-slate-800">Prueba Gratuita</p>
                            </div>
                            <div className="bg-orange-100 px-3 py-1.5 rounded-full">
                              <p className="text-xs font-bold text-orange-700 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {daysRemaining} días restantes
                              </p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-orange-200 rounded-full h-2.5 mb-1">
                            <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                          </div>
                          <p className="text-xs text-orange-600/80 text-right">Expira pronto</p>
                        </div>

                        {/* Plan Selection for Upgrade */}
                        <div>
                          <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-purple-600" /> Elige tu Plan Ideal
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* BASIC */}
                            <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-400 transition-all cursor-pointer bg-white" onClick={() => handleCheckoutDirect('BASIC')}>
                              <h5 className="font-bold text-slate-700">Básico</h5>
                              <p className="text-2xl font-black text-slate-900 mt-1">$9.999</p>
                              <p className="text-xs text-slate-500 mb-3">/mes</p>
                              <button className="w-full bg-slate-100 text-slate-700 font-bold py-2 rounded-lg text-xs hover:bg-slate-200">
                                Elegir Básico
                              </button>
                            </div>

                            {/* PRO */}
                            <div className="border-2 border-blue-500 rounded-xl p-4 relative bg-blue-50/50 cursor-pointer shadow-sm" onClick={() => handleCheckoutDirect('PRO')}>
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                RECOMENDADO
                              </div>
                              <h5 className="font-bold text-blue-800">PRO</h5>
                              <p className="text-2xl font-black text-blue-900 mt-1">$13.999</p>
                              <p className="text-xs text-blue-600/70 mb-3">/mes</p>
                              <button className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg text-xs hover:bg-blue-700 shadow-blue-200 shadow-md">
                                Elegir PRO
                              </button>
                            </div>

                            {/* ULTIMATE */}
                            <div className="border border-purple-200 rounded-xl p-4 hover:border-purple-400 transition-all cursor-pointer bg-purple-50/30" onClick={() => handleCheckoutDirect('ULTIMATE')}>
                              <h5 className="font-bold text-purple-800">Ultimate</h5>
                              <p className="text-2xl font-black text-purple-900 mt-1">$29.999</p>
                              <p className="text-xs text-purple-600/70 mb-3">/mes</p>
                              <button className="w-full bg-purple-100 text-purple-700 font-bold py-2 rounded-lg text-xs hover:bg-purple-200">
                                Elegir Ultimate
                              </button>
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2 text-center">
                            * Al seleccionar un plan serás redirigido a Mercado Pago para completar la suscripción segura via tarjeta de crédito/débito.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  // Paid View (Default PRO or others)
                  // Logic is now lifted to component scope

                  return (
                    <div className={`border p-6 rounded-xl mb-6 ${isInGracePeriod ? 'bg-red-50 border-red-200' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${isInGracePeriod ? 'text-red-600' : 'text-blue-600'}`}>Plan Actual</p>
                          <p className={`text-2xl font-black ${isInGracePeriod ? 'text-red-900' : 'text-blue-900'}`}>{currentTenant?.pricingPlan || 'PRO'}</p>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full ${isInGracePeriod ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-green-100 text-green-700'}`}>
                          <p className="text-xs font-bold flex items-center gap-1">
                            {isInGracePeriod ? (
                              <>
                                <ShieldAlert className="w-3 h-3" />
                                LICENCIA VENCIDA
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                ACTIVA
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {isInGracePeriod && (
                        <div className="bg-white/80 p-4 rounded-lg border border-red-100 mb-4">
                          <div className="flex items-center gap-2 text-red-700 font-bold mb-1">
                            <Clock className="w-4 h-4" />
                            <span>Período de Gracia Activo</span>
                          </div>
                          <p className="text-sm text-red-600">
                            Tu licencia venció el <strong>{dueDate.toLocaleDateString()}</strong>.
                            Tienes <span className="underline decoration-2">{graceDaysRemaining} días</span> para regularizar tu pago antes del bloqueo.
                          </p>
                          <div className="w-full bg-red-200 rounded-full h-1.5 mt-3">
                            <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${(graceDaysRemaining / 5) * 100}%` }}></div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-200">
                        <div>
                          <p className="text-xs text-blue-600 font-medium mb-1">Próximo Vencimiento</p>
                          <p className="font-bold text-blue-900">
                            {currentTenant?.nextDueDate
                              ? new Date(currentTenant.nextDueDate).toLocaleDateString()
                              : 'Calculando...'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 font-medium mb-1">Método</p>
                          <p className="font-bold text-blue-900">Mercado Pago</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (!confirm('¿Estás seguro que deseas cancelar tu suscripción?\n\nMantendrás acceso hasta la fecha de vencimiento, luego tu cuenta pasará al plan GRATUITO.')) return;

                      try {
                        toast.info("Cancelando suscripción...");
                        // Dynamic import to avoid circular dependency issues if any
                        const { cancelSubscription } = await import('../src/services/preApprovalService');

                        if (currentTenant?.id) {
                          await cancelSubscription(currentTenant.id);
                          toast.success("Suscripción cancelada correctamente.");
                          // Optional: Reload to reflect changes immediately
                          setTimeout(() => window.location.reload(), 2000);
                        } else {
                          toast.error("No se identificó el tenant.");
                        }
                      } catch (error: any) {
                        console.error("Error cancelling:", error);
                        toast.error(error.message || "Error al cancelar.");
                      }
                    }}
                    className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium text-sm border border-red-200 transition-colors"
                  >
                    Cancelar Suscripción
                  </button>

                  <button
                    onClick={() => setShowPlanSelection(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                  >
                    Cambiar de Plan
                  </button>
                </div>

                {showPlanSelection && (
                  <PlanSelectionModal
                    currentPlan={currentTenant?.pricingPlan || 'FREE'}
                    isCurrentPlanExpired={isExpired || isInGracePeriod}
                    onClose={() => setShowPlanSelection(false)}
                    onSelectPlan={(plan) => {
                      setShowPlanSelection(false);
                      handleCheckoutDirect(plan);
                    }}
                  />
                )}

                {/* Info Note */}
                <div className="mt-6 bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <p className="text-xs text-gray-600">
                    💡 <strong>Importante:</strong> Si cancelas, mantendrás acceso a todas las funciones hasta la fecha de tu próximo pago. Después de eso, tu cuenta pasará al plan gratuito.
                  </p>
                </div>
              </div>
            </div>
          )
        }

        {/* --- SESSION TAB --- */}
        {
          activeTab === 'session' && (
            <div className="animate-in fade-in">
              <SessionStatus />
            </div>
          )
        }




        {/* --- MI NEGOCIO TAB --- */}
        {activeTab === 'catalog' && (
          <div className="animate-in fade-in max-w-4xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* DATA SECTION */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-purple-600" /> Datos del Comercio
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nombre del Negocio (Visible en el catálogo)</label>
                    <input
                      type="text"
                      placeholder="Ej: Mi Negocio"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Dirección</label>
                    <input
                      type="text"
                      placeholder="Ej: Av. Principal 123"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">CUIT</label>
                    <input
                      type="text"
                      placeholder="Ej: 20-12345678-9"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      value={cuit}
                      onChange={(e) => setCuit(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Número de WhatsApp para Pedidos</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej: 5491112345678"
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Ingresa el número con código de país (Ej: 549 para Argentina) sin + ni espacios.</p>
                  </div>

                  <button
                    onClick={async () => {
                      if (!currentTenant) return;
                      try {
                        await updateTenant({
                          ...currentTenant,
                          whatsappNumber,
                          businessName,
                          address,
                          cuit,
                          enableCatalog
                        });
                        toast.success("Información del negocio guardada");
                      } catch (e) {
                        toast.error("Error al guardar información");
                      }
                    }}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-700 mt-4 shadow-md shadow-purple-100"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>


              {/* CATALOG QR SECTION */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <QrIcon className="w-5 h-5 text-purple-600" /> Catálogo Digital QR
                </h3>

                <div className="flex items-center justify-between bg-purple-50 p-4 rounded-lg border border-purple-100 mb-6">
                  <div>
                    <p className="text-sm font-bold text-purple-900">Habilitar Catálogo Público</p>
                    <p className="text-[10px] text-purple-700">Permite que tus clientes vean tus productos vía QR o link.</p>
                  </div>
                  <button
                    onClick={() => setEnableCatalog(!enableCatalog)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${enableCatalog ? 'bg-purple-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableCatalog ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {enableCatalog ? (
                  <>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-6 text-sm text-purple-800">
                      <p>
                        <strong>¡Nuevo!</strong> Tus clientes pueden ver tus productos y enviarte pedidos por WhatsApp.
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center p-6 border border-slate-100 rounded-xl bg-slate-50">
                      <div className="bg-white p-4 rounded-xl shadow-md mb-6">
                        {currentTenant ? (
                          <QRCodeCanvas
                            value={`${window.location.origin}?catalog=${currentTenant.id}`}
                            size={200}
                            level={"H"}
                            includeMargin={true}
                          />
                        ) : (
                          <div className="w-[200px] h-[200px] bg-slate-200 animate-pulse rounded-lg" />
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!currentTenant) return;
                            const url = `${window.location.origin}?catalog=${currentTenant.id}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Link copiado");
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-bold text-slate-700 text-sm transition-colors"
                        >
                          <Copy className="w-4 h-4" /> Copiar Link
                        </button>
                        <a
                          href={`${window.location.origin}?catalog=${currentTenant?.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 border border-purple-200 rounded-lg hover:bg-purple-200 font-bold text-purple-700 text-sm transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" /> Abrir Catálogo
                        </a>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-200 rounded-xl bg-gray-50 text-center">
                    <QrIcon className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">El catálogo está desactivado</p>
                    <p className="text-xs text-gray-400 mt-1">Actívalo arriba para compartir tus productos con tus clientes.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}




        {/* --- MODAL: EDIT USER --- */}
        {
          editingUser && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Editar Usuario: {editingUser.username}</h3>
                  <button onClick={() => setEditingUser(null)}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                    <input
                      className="w-full border border-gray-300 p-2 rounded-lg"
                      value={editingUser.name}
                      onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">PIN (4 dígitos)</label>
                    <input
                      className="w-full border border-gray-300 p-2 rounded-lg font-mono tracking-widest text-center"
                      maxLength={4}
                      value={editingUser.pin || ''}
                      onChange={e => setEditingUser({ ...editingUser, pin: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <button onClick={handleUpdateUser} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* --- MODAL: PAY DEBT --- */}
        {
          payingClient && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border-t-4 border-green-500">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" /> Registrar Pago de Deuda
                  </h3>
                  <button onClick={() => setPayingClient(null)}><X className="w-5 h-5 text-gray-400" /></button>
                </div>

                <div className="bg-red-50 p-4 rounded-lg mb-4 text-center">
                  <p className="text-xs text-red-500 font-bold uppercase">Deuda Actual</p>
                  <p className="text-3xl font-black text-red-600">${payingClient.currentAccountBalance.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 mt-1">{payingClient.name}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto a Pagar ($)</label>
                    <input
                      type="number"
                      className="w-full border-2 border-green-100 p-3 rounded-xl text-xl font-bold focus:border-green-500 outline-none text-center text-gray-900 bg-white"
                      placeholder="0.00"
                      autoFocus
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleConfirmPayment}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold mt-2 hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" /> Confirmar Pago
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-4">
                  Esta acción generará una "Entrada de Caja" automáticamente.
                </p>
              </div>
            </div>
          )
        }
      </div>
    </div>
  );
};
