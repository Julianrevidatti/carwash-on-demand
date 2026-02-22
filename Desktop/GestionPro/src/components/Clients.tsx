
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Client, MovementType } from '../../types';
import { Plus, Search, Edit2, Trash2, Phone, Mail, MapPin, Wallet, History, ArrowDownLeft, ArrowUpRight, Save, X, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

// Helper interface for movements history
interface ClientMovement {
    id: string;
    type: 'DEBT' | 'PAYMENT' | 'ADJUSTMENT';
    amount: number;
    description: string;
    date: string;
    sale_id?: string;
}

export const Clients: React.FC = () => {
    const { clients, addClient, updateClient } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);
    const [historyMovements, setHistoryMovements] = useState<ClientMovement[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Movement Modal State
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [movementType, setMovementType] = useState<'PAYMENT' | 'DEBT'>('PAYMENT');
    const [movementAmount, setMovementAmount] = useState('');
    const [movementDescription, setMovementDescription] = useState('');

    // Form State
    const [formData, setFormData] = useState<Partial<Client>>({
        name: '',
        dni: '',
        phone: '',
        email: '',
        address: '',
        currentAccountBalance: 0
    });

    const filteredClients = useMemo(() => {
        return (clients || []).filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.dni?.includes(searchTerm)
        );
    }, [clients, searchTerm]);

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setFormData(client);
        setIsModalOpen(true);
    };

    const handleDelete = async (clientId: string) => {
        if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
            // Ideally implement delete logic in store
            toast.info('Funcionalidad de eliminar pendiente de implementar en store');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingClient) {
                // Update
                const updated = { ...editingClient, ...formData };

                const { error } = await supabase
                    .from('clients')
                    .update({
                        name: updated.name,
                        dni: updated.dni,
                        phone: updated.phone || null,
                        email: updated.email || null,
                        address: updated.address || null
                    })
                    .eq('id', updated.id);

                if (error) throw error;

                updateClient(updated as Client);
                toast.success('Cliente actualizado');
            } else {
                // Create
                const newClient = {
                    id: crypto.randomUUID(),
                    ...formData,
                    currentAccountBalance: 0,
                    virtualWalletBalance: 0,
                    tenant_id: useStore.getState().currentTenant?.id
                };

                await addClient(newClient as Client);
                toast.success('Cliente creado exitosamente');
            }
            setIsModalOpen(false);
            setEditingClient(null);
            setFormData({});
        } catch (error: any) {
            toast.error('Error al guardar cliente', { description: error.message });
        }
    };

    const loadHistory = async (client: Client) => {
        setSelectedClientForHistory(client);
        setIsHistoryOpen(true);
        setLoadingHistory(true);

        const { data } = await supabase
            .from('client_movements')
            .select('*')
            .eq('client_id', client.id)
            .order('date', { ascending: false });

        setHistoryMovements(data || []);
        setLoadingHistory(false);
    };

    const handleRegisterMovement = async () => {
        const amount = parseFloat(movementAmount);
        if (!selectedClientForHistory || !amount || amount <= 0) return;

        try {
            const client = selectedClientForHistory;

            let newBalance = client.currentAccountBalance || 0;
            if (movementType === 'PAYMENT') {
                newBalance -= amount;
            } else {
                newBalance += amount; // 'DEBT' increases balance (more debt)
            }

            // 1. Update Client Balance
            const { error: updateError } = await supabase
                .from('clients')
                .update({ current_account_balance: newBalance })
                .eq('id', client.id);

            if (updateError) throw updateError;

            // 2. Register Movement
            const { error: moveError } = await supabase.from('client_movements').insert([{
                tenant_id: useStore.getState().currentTenant?.id,
                client_id: client.id,
                type: movementType, // 'PAYMENT' or 'DEBT'
                amount: amount,
                description: movementDescription || (movementType === 'PAYMENT' ? 'Pago a cuenta' : 'Ajuste / Nueva Deuda'),
                user_id: useStore.getState().currentUser?.id
            }]);

            if (moveError) throw moveError;

            // 3. Register as Cash Income in Session (Only for PAYMENTS)
            const currentSession = useStore.getState().currentSession;
            if (currentSession && movementType === 'PAYMENT') {
                useStore.getState().addCashMovement({
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    sessionId: currentSession.id,
                    type: MovementType.DEPOSIT,
                    amount: amount,
                    description: `Pago Cta. Cte. - ${client.name}`
                });
            }

            // Update Local State
            updateClient({ ...client, currentAccountBalance: newBalance });

            toast.success(movementType === 'PAYMENT' ? `Pago de $${amount} registrado` : `Deuda de $${amount} agregada`);
            setIsMovementModalOpen(false);
            setMovementAmount('');
            setMovementDescription('');
            // Reload history
            loadHistory({ ...client, currentAccountBalance: newBalance }); // Optimistic update for history view

        } catch (error: any) {
            console.error(error);
            toast.error('Error al registrar movimiento');
        }
    };

    const openMovementModal = (client: Client, type: 'PAYMENT' | 'DEBT') => {
        setSelectedClientForHistory(client);
        setMovementType(type);
        setMovementAmount('');
        setMovementDescription('');
        setIsMovementModalOpen(true);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Clientes y Cuentas Corrientes</h1>
                    <p className="text-gray-500 mt-1">Gestiona deudas, pagos e historial de clientes.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingClient(null);
                        setFormData({});
                        setIsModalOpen(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 font-bold flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Nuevo Cliente
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o DNI..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredClients.map(client => (
                    <div key={client.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{client.name}</h3>
                                    {client.dni && <p className="text-sm text-gray-500">DNI: {client.dni}</p>}
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-xs font-bold ${client.currentAccountBalance > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {client.currentAccountBalance > 0 ? 'Con Deuda' : 'Al Día'}
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                {client.phone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Phone className="w-4 h-4 text-gray-400" /> {client.phone}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Wallet className="w-4 h-4 text-blue-500" />
                                    <span>Saldo Cta. Cte.:</span>
                                    <span className={client.currentAccountBalance > 0 ? 'text-red-600 font-bold' : 'text-gray-600'}>
                                        ${client.currentAccountBalance?.toLocaleString() || '0'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => loadHistory(client)}
                                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <History className="w-4 h-4" /> Historial
                                </button>
                                <button
                                    onClick={() => handleEdit(client)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 border-t border-gray-100 divide-x divide-gray-100">
                            <button
                                onClick={() => openMovementModal(client, 'DEBT')}
                                className="p-3 text-center text-red-600 font-bold text-xs hover:bg-red-50 transition-colors uppercase"
                            >
                                + Agregar Deuda
                            </button>
                            <button
                                onClick={() => openMovementModal(client, 'PAYMENT')}
                                className="p-3 text-center text-green-600 font-bold text-xs hover:bg-green-50 transition-colors uppercase"
                            >
                                Registrar Pago
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- MODAL CLIENTE --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                <input autoFocus required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Juan Pérez" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">DNI / CUIT</label>
                                    <input type="text" value={formData.dni} onChange={e => setFormData({ ...formData, dni: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                    <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                                <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 font-bold hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL HISTORIAL Y PAGOS --- */}
            {isHistoryOpen && selectedClientForHistory && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedClientForHistory.name}</h2>
                                <p className="text-sm text-gray-500">Historial de Movimientos</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Saldo Actual</p>
                                    <p className={`text-xl font-black ${selectedClientForHistory.currentAccountBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        ${selectedClientForHistory.currentAccountBalance?.toLocaleString()}
                                    </p>
                                </div>
                                <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-gray-200 rounded-full">
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                                        <tr>
                                            <th className="p-4 font-bold">Fecha</th>
                                            <th className="p-4 font-bold">Descripción</th>
                                            <th className="p-4 font-bold text-center">Tipo</th>
                                            <th className="p-4 font-bold text-right">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loadingHistory ? (
                                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">Cargando movimientos...</td></tr>
                                        ) : historyMovements.length === 0 ? (
                                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">No hay movimientos registrados.</td></tr>
                                        ) : (
                                            historyMovements.map((mov) => (
                                                <tr key={mov.id}>
                                                    <td className="p-4 text-gray-600">{new Date(mov.date).toLocaleString()}</td>
                                                    <td className="p-4 font-medium text-gray-900">{mov.description}</td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${mov.type === 'DEBT' ? 'bg-red-100 text-red-700' :
                                                                mov.type === 'PAYMENT' ? 'bg-green-100 text-green-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {mov.type === 'DEBT' ? 'Deuda' : mov.type === 'PAYMENT' ? 'Pago' : 'Ajuste'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right font-bold text-gray-800">
                                                        {mov.type === 'PAYMENT' ? '-' : ''}${mov.amount.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-4 border-t bg-white flex justify-end gap-3">
                            <button
                                onClick={() => openMovementModal(selectedClientForHistory, 'DEBT')}
                                className="bg-white text-red-600 border border-red-200 px-6 py-3 rounded-xl font-bold hover:bg-red-50 transition-colors"
                            >
                                + Agregar Deuda / Corrección
                            </button>
                            <button
                                onClick={() => openMovementModal(selectedClientForHistory, 'PAYMENT')}
                                className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg flex items-center gap-2"
                            >
                                <DollarSign className="w-5 h-5" /> Registrar Pago
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MOVEMENT MODAL (Payment or Debt) --- */}
            {isMovementModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">
                                {movementType === 'PAYMENT' ? 'Registrar Pago' : 'Agregar Deuda / Corrección'}
                            </h3>
                            <button onClick={() => setIsMovementModalOpen(false)}><X className="text-gray-400 w-5 h-5" /></button>
                        </div>

                        {/* Type Selector */}
                        <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                            <button
                                onClick={() => setMovementType('PAYMENT')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${movementType === 'PAYMENT' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Registrar Pago
                            </button>
                            <button
                                onClick={() => setMovementType('DEBT')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${movementType === 'DEBT' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Agregar Deuda
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-1">Monto</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        autoFocus
                                        type="number"
                                        value={movementAmount}
                                        onChange={e => setMovementAmount(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-3 text-xl font-black bg-gray-50 rounded-xl border-2 focus:outline-none ${movementType === 'PAYMENT'
                                                ? 'text-green-700 border-transparent focus:border-green-500'
                                                : 'text-red-700 border-transparent focus:border-red-500'
                                            }`}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-1">Descripción / Nota</label>
                                <input
                                    type="text"
                                    value={movementDescription}
                                    onChange={e => setMovementDescription(e.target.value)}
                                    placeholder={movementType === 'PAYMENT' ? 'Ej: Entrega parcial' : 'Ej: Error de cobro, Fiado'}
                                    className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {movementType === 'PAYMENT' && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 text-xs rounded-lg">
                                    <Wallet className="w-4 h-4" />
                                    Se registrará un ingreso en la caja actual.
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setIsMovementModalOpen(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl">Cancelar</button>
                                <button
                                    onClick={handleRegisterMovement}
                                    className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition-colors ${movementType === 'PAYMENT' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    Confirmar {movementType === 'PAYMENT' ? 'Pago' : 'Deuda'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
