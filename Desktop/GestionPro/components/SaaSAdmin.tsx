
import React, { useState } from 'react';
import { SaaSClient, User } from '../types';
import { Server, ShieldAlert, LogOut, Users, CheckCircle, Lock, DollarSign, RefreshCw, Unlock, X, Calendar, Plus, CreditCard, Award, Settings as SettingsIcon, MapPin, Trash2 } from 'lucide-react';
import { PLATFORM_MP_CONFIG } from '../config/planLimits';

interface SaaSAdminProps {
  onLogout: () => void;
  currentUser: User;
  clients: SaaSClient[];
  onUpdateClients: (clients: SaaSClient[]) => void;
  onRegisterTenant: (data: Partial<SaaSClient>, creds: { username: string, password?: string }) => void;
  onToggleStatus: (id: string) => void;
  onDeleteTenant: (id: string) => void;
  onRenewLicense: (id: string, days: number) => void;
}

export const SaaSAdmin: React.FC<SaaSAdminProps> = ({
  onLogout,
  currentUser,
  clients,
  onUpdateClients,
  onRegisterTenant,
  onToggleStatus,
  onDeleteTenant,
  onRenewLicense
}) => {

  const runDebtAudit = () => {
    const today = new Date();
    let updatedCount = 0;

    const updatedClients = (clients || []).map(client => {
      const expiryDate = new Date(client.nextDueDate);
      if (expiryDate < today && client.status === 'ACTIVE') {
        updatedCount++;
        return { ...client, status: 'LOCKED' as const };
      }
      return client;
    });

    if (updatedCount > 0) {
      onUpdateClients(updatedClients);
      alert(`AUDITORÍA COMPLETADA:\n\nSe han bloqueado ${updatedCount} clientes por falta de pago / licencia vencida.`);
    } else {
      alert("AUDITORÍA COMPLETADA:\n\nNo se encontraron clientes con licencia vencida pendientes de bloqueo.");
    }
  };

  const [selectedClientForRenewal, setSelectedClientForRenewal] = useState<SaaSClient | null>(null);
  const [selectedClientForPlan, setSelectedClientForPlan] = useState<SaaSClient | null>(null);
  const [renewalDays, setRenewalDays] = useState(30);
  const [showConfig, setShowConfig] = useState(false);

  const mpConfigured = !!PLATFORM_MP_CONFIG.accessToken && !!PLATFORM_MP_CONFIG.publicKey;

  // New Client Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newClientData, setNewClientData] = useState({
    businessName: '',
    email: '',
    password: '',
    plan: 'PRO' as 'BASIC' | 'PRO' | 'ULTIMATE',
    address: '',
    cuit: ''
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegisterTenant(
      {
        businessName: newClientData.businessName,
        contactName: newClientData.email,
        pricingPlan: newClientData.plan,
        status: 'ACTIVE',
        paymentStatus: 'PAID', // Manual creation assumes paid or trial started
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
        address: newClientData.address,
        cuit: newClientData.cuit
      },
      { username: newClientData.email, password: newClientData.password }
    );
    setIsRegisterModalOpen(false);
    setNewClientData({ businessName: '', email: '', password: '', plan: 'PRO', address: '', cuit: '' });
  };

  const handleRenewClick = (client: SaaSClient) => {
    setSelectedClientForRenewal(client);
    setRenewalDays(30);
  };

  const confirmRenewal = () => {
    if (selectedClientForRenewal && renewalDays > 0) {
      onRenewLicense(selectedClientForRenewal.id, renewalDays);
      setSelectedClientForRenewal(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative">
      {/* Navbar */}
      <nav className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Gestión Now | Panel Owner</h1>
            <p className="text-xs text-slate-400">Administración Central SaaS</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={runDebtAudit}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors border border-red-500 shadow-red-900/20 shadow-lg"
            title="Bloqueará el acceso a todos los clientes cuya fecha de vencimiento haya pasado."
          >
            <ShieldAlert className="w-4 h-4" /> Bloquear Vencidos
          </button>
          <div className="h-8 w-px bg-slate-700 mx-2"></div>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors border border-emerald-500 shadow-emerald-900/20 shadow-lg"
          >
            <Plus className="w-4 h-4" /> Nuevo Cliente
          </button>
          <div className="h-8 w-px bg-slate-700 mx-2"></div>
          <button
            onClick={() => setShowConfig(true)}
            className={`${mpConfigured ? 'bg-slate-700' : 'bg-amber-600 animate-pulse'} hover:opacity-90 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all border border-slate-600 shadow-lg`}
          >
            <SettingsIcon className="w-4 h-4" /> Configuración MP
          </button>
          <div className="h-8 w-px bg-slate-700 mx-2"></div>
          <span className="text-sm text-slate-300">Hola, {currentUser.name}</span>
          <button onClick={onLogout} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Clientes</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">{(clients || []).length}</h3>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Activos</p>
                <h3 className="text-3xl font-bold text-emerald-600 mt-1">{(clients || []).filter(c => c.status === 'ACTIVE').length}</h3>
              </div>
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bloqueados</p>
                <h3 className="text-3xl font-bold text-red-600 mt-1">{(clients || []).filter(c => c.status === 'LOCKED').length}</h3>
              </div>
              <div className="bg-red-100 p-2 rounded-lg text-red-600">
                <Lock className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ingresos Pendientes</p>
                <h3 className="text-3xl font-bold text-orange-600 mt-1">${(clients || []).reduce((acc, c) => acc + (c.pendingAmount || 0), 0).toLocaleString()}</h3>
              </div>
              <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Client List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-lg">Directorio de Clientes (Tenants)</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar cliente..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
                <tr>
                  <th className="p-4">Negocio / Cliente</th>
                  <th className="p-4">Ubicación / Datos</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Vencimiento</th>
                  <th className="p-4 text-right">Deuda</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(clients || []).map(client => {
                  const daysRemaining = Math.ceil((new Date(client.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const isExpired = daysRemaining < 0;
                  const isNearExpiry = daysRemaining >= 0 && daysRemaining <= 5;

                  return (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{client.businessName}</div>
                        <div className="text-xs text-gray-500">{client.contactName} | {client.adminUsername}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-gray-700">
                          {client.address ? <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" /> {client.address}</div> : <span className="text-gray-400 italic">S/D</span>}
                          {client.cuit ? <div className="font-mono text-[10px] text-gray-500 mt-1">CUIT: {client.cuit}</div> : null}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">
                          {client.pricingPlan}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${client.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {client.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          {client.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold text-center w-fit
                                ${daysRemaining < 0 ? 'bg-red-100 text-red-700' :
                              daysRemaining <= 5 ? 'bg-orange-100 text-orange-700' :
                                'bg-blue-50 text-blue-700'}`}>
                            {daysRemaining < 0 ? `${Math.abs(daysRemaining)} días vencido` : `${daysRemaining} días restantes`}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            {new Date(client.nextDueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-bold text-gray-700">
                        ${client.pendingAmount?.toLocaleString() || '0'}
                      </td>
                      <td className="p-4 text-center space-x-2">
                        <button
                          onClick={() => handleRenewClick(client)}
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                          title="Registrar Pago / Renovar"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedClientForPlan(client)}
                          className="text-purple-600 hover:bg-purple-50 p-2 rounded-lg transition-colors"
                          title="Cambiar Plan de Precios"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onToggleStatus(client.id)}
                          className={`${client.status === 'ACTIVE' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'} p-2 rounded-lg transition-colors`}
                          title={client.status === 'ACTIVE' ? 'Bloquear Acceso' : 'Desbloquear Acceso'}
                        >
                          {client.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("¿Seguro que desea eliminar esta cuenta? Todo su contenido se perderá.")) {
                              onDeleteTenant(client.id);
                            }
                          }}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Eliminar Cuenta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PLAN MODAL */}
      {selectedClientForPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-purple-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                < Award className="w-5 h-5" /> Cambiar Plan
              </h3>
              <button onClick={() => setSelectedClientForPlan(null)} className="hover:bg-purple-700 p-1 rounded transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cliente</label>
                <div className="font-bold text-lg text-gray-800">{selectedClientForPlan.businessName}</div>
                <div className="text-sm text-gray-500">Plan Actual: <span className="font-bold text-purple-600">{selectedClientForPlan.pricingPlan}</span></div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {(['FREE', 'BASIC', 'PRO', 'ULTIMATE'] as const).map(plan => (
                  <button
                    key={plan}
                    onClick={() => {
                      onUpdateClients(clients.map(c => c.id === selectedClientForPlan.id ? { ...c, pricingPlan: plan } : c));
                      onRenewLicense(selectedClientForPlan.id, 0); // Trigger update without adding days
                      setSelectedClientForPlan(null);
                      alert(`Plan de "${selectedClientForPlan.businessName}" actualizado a ${plan}`);
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${selectedClientForPlan.pricingPlan === plan ? 'bg-purple-50 border-purple-500' : 'border-gray-100 hover:border-purple-200'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800">{plan}</span>
                      {selectedClientForPlan.pricingPlan === plan && <CheckCircle className="w-5 h-5 text-purple-600" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENEWAL MODAL */}
      {selectedClientForRenewal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <RefreshCw className="w-5 h-5" /> Renovar Licencia
              </h3>
              <button onClick={() => setSelectedClientForRenewal(null)} className="hover:bg-blue-700 p-1 rounded transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cliente</label>
                <div className="font-bold text-lg text-gray-800">{selectedClientForRenewal.businessName}</div>
                <div className="text-sm text-gray-500">Vencimiento Actual: {new Date(selectedClientForRenewal.nextDueDate).toLocaleDateString()}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Días a Renovar</label>
                <div className="flex gap-2">
                  {[30, 90, 365].map(days => (
                    <button
                      key={days}
                      onClick={() => setRenewalDays(days)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${renewalDays === days ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {days} días
                    </button>
                  ))}
                </div>
                <div className="mt-2 relative">
                  <input
                    type="number"
                    value={renewalDays}
                    onChange={e => setRenewalDays(parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg p-2 pl-10 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800"
                  />
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-gray-600">Nueva Fecha Vencimiento:</span>
                  <span className="font-bold text-blue-600">
                    {(() => {
                      const today = new Date();
                      const currentExpiry = new Date(selectedClientForRenewal.nextDueDate);
                      const baseDate = currentExpiry < today ? today : currentExpiry;
                      const newDate = new Date(baseDate);
                      newDate.setDate(newDate.getDate() + renewalDays);
                      return newDate.toLocaleDateString();
                    })()}
                  </span>
                </div>
              </div>

              <button
                onClick={confirmRenewal}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" /> Confirmar Renovación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER CLIENT MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <Plus className="w-5 h-5" /> Registrar Nuevo Cliente
              </h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="hover:bg-emerald-700 p-1 rounded transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Negocio</label>
                <input
                  type="text"
                  required
                  value={newClientData.businessName}
                  onChange={e => setNewClientData({ ...newClientData, businessName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Ej: Kiosco Pepe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Usuario Admin)</label>
                  <input
                    type="email"
                    required
                    value={newClientData.email}
                    onChange={e => setNewClientData({ ...newClientData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="cliente@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña Temporal</label>
                  <input
                    type="text"
                    required
                    value={newClientData.password}
                    onChange={e => setNewClientData({ ...newClientData, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Ej: Gestion2024!"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Plan Inicial</label>
                <select
                  value={newClientData.plan}
                  onChange={e => setNewClientData({ ...newClientData, plan: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="BASIC">Básico</option>
                  <option value="PRO">Profesional</option>
                  <option value="ULTIMATE">Ultimate</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección</label>
                  <input
                    type="text"
                    onChange={e => setNewClientData({ ...newClientData, address: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Av. Siempre Viva 123"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CUIT / DNI</label>
                  <input
                    type="text"
                    onChange={e => setNewClientData({ ...newClientData, cuit: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="20-12345678-9"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 text-sm text-emerald-800">
                <p>Se creará el cliente con 30 días de vigencia inicial y estado ACTIVO.</p>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" /> Crear Cliente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MP CONFIG STATUS MODAL */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" /> Configuración de Plataforma
              </h3>
              <button onClick={() => setShowConfig(false)} className="hover:bg-slate-700 p-1 rounded transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Mercado Pago Access Token</p>
                    <p className="font-mono text-sm mt-1">
                      {PLATFORM_MP_CONFIG.accessToken ? '••••••••' + PLATFORM_MP_CONFIG.accessToken.slice(-6) : <span className="text-red-500 font-sans">No configurado</span>}
                    </p>
                  </div>
                  {PLATFORM_MP_CONFIG.accessToken ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <ShieldAlert className="w-5 h-5 text-amber-500" />}
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Mercado Pago Public Key</p>
                    <p className="font-mono text-sm mt-1">
                      {PLATFORM_MP_CONFIG.publicKey ? PLATFORM_MP_CONFIG.publicKey.slice(0, 10) + '...' : <span className="text-red-500 font-sans">No configurado</span>}
                    </p>
                  </div>
                  {PLATFORM_MP_CONFIG.publicKey ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <ShieldAlert className="w-5 h-5 text-amber-500" />}
                </div>
              </div>

              {!mpConfigured && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-amber-800 flex gap-3">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <p>
                    Las credenciales no han sido detectadas en el sistema. Por favor, asegúrate de haberlas configurado en el archivo <strong>.env</strong> y haber reiniciado el sistema.
                  </p>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-700">
                <p className="font-bold mb-1 uppercase">¿Dónde encuentro mis credenciales?</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Ve a <a href="https://www.mercadopago.com.ar/developers/panel" target="_blank" rel="noopener noreferrer" className="underline font-bold">Mercado Pago Developers</a></li>
                  <li>Entra en <strong>Tus aplicaciones</strong></li>
                  <li>Selecciona tu app y ve a <strong>Credenciales</strong> en el menú</li>
                  <li>Copia el <strong>Access Token</strong> y la <strong>Public Key</strong> (usa las de <strong>Prueba</strong> primero)</li>
                </ol>
              </div>

              <button
                onClick={() => setShowConfig(false)}
                className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};