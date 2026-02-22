
import React, { useState, useMemo } from 'react';
import { CashMovement, MovementType, Sale } from '../types';
import { Archive, ArrowDownCircle, ArrowUpCircle, Calendar, DollarSign, Wallet, Building2, Layers, AlertTriangle } from 'lucide-react';

interface CashFlowProps {
  movements: CashMovement[];
  sales: Sale[];
  onAddMovement: (movement: CashMovement) => void;
  currentSessionId?: string | null; // Optional now
}

type Filter = 'today' | 'week' | 'month';
type ViewMode = 'shift' | 'global';

export const CashFlow: React.FC<CashFlowProps> = ({ movements = [], sales = [], onAddMovement, currentSessionId }) => {
  const [viewMode, setViewMode] = useState<ViewMode>(currentSessionId ? 'shift' : 'global');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<MovementType>(MovementType.DEPOSIT);
  const [filter, setFilter] = useState<Filter>('today');

  // Safety checks
  const safeMovements = Array.isArray(movements) ? movements : [];
  const safeSales = Array.isArray(sales) ? sales : [];

  // Filter Logic Helpers
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  const isSameWeek = (d: Date) => {
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
    return d >= firstDay;
  };

  const isSameMonth = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();

  const filterDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (filter === 'today') return isSameDay(d, today);
    if (filter === 'week') return isSameWeek(d);
    if (filter === 'month') return isSameMonth(d, today);
    return true;
  };

  // --- DATA PROCESSING ---

  // 1. Shift View Data (Only current session)
  const shiftSales = safeSales.filter(s => s.sessionId === currentSessionId && s.paymentMethodName === 'Efectivo');
  const shiftMovements = safeMovements.filter(m => m.sessionId === currentSessionId);

  const totalSalesCash = shiftSales.reduce((acc, s) => acc + s.total, 0);
  const totalShiftDeposits = shiftMovements.filter(m => m.type === MovementType.DEPOSIT).reduce((acc, m) => acc + m.amount, 0);
  const totalShiftWithdrawals = shiftMovements.filter(m => m.type === MovementType.WITHDRAWAL).reduce((acc, m) => acc + m.amount, 0);
  const shiftBalance = totalSalesCash + totalShiftDeposits - totalShiftWithdrawals;

  // 2. Global View Data (Monthly / All Time, excluding session logic for display filtering by date)
  const globalMovements = safeMovements.filter(m => !m.sessionId); // Only global movements
  // Note: For "Monthly Balance" we usually want to see everything (Sales + Global Movs), 
  // but to keep it simple as "Treasury", we focus on the Movements and maybe aggregated sales.

  const filteredGlobalMovements = globalMovements.filter(m => filterDate(m.date));

  // Calculate Global Balance (All time or Monthly based on business logic, here we do Monthly for the card)
  const monthlyGlobalDeposits = safeMovements.filter(m => isSameMonth(new Date(m.date), new Date()) && m.type === MovementType.DEPOSIT).reduce((acc, m) => acc + m.amount, 0);
  const monthlyGlobalWithdrawals = safeMovements.filter(m => isSameMonth(new Date(m.date), new Date()) && m.type === MovementType.WITHDRAWAL).reduce((acc, m) => acc + m.amount, 0);
  const monthlyTotalSales = safeSales.filter(s => isSameMonth(new Date(s.date), new Date())).reduce((acc, s) => acc + s.total, 0);

  const globalBalance = (monthlyTotalSales + monthlyGlobalDeposits) - monthlyGlobalWithdrawals;

  // Active Data based on View Mode
  const activeMovements = viewMode === 'shift' ? shiftMovements : filteredGlobalMovements;

  const handleAddMovement = () => {
    if (!amount || !desc) return;

    // Logic: If in Shift mode, require session. If Global, sessionId is undefined.
    const targetSessionId = viewMode === 'shift' ? currentSessionId : undefined;

    if (viewMode === 'shift' && !targetSessionId) {
      alert("No hay un turno abierto para registrar movimientos de caja chica.");
      return;
    }

    const mov: CashMovement = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      sessionId: targetSessionId, // undefined if global
      type,
      amount: parseFloat(amount),
      description: desc
    };
    onAddMovement(mov);
    setAmount('');
    setDesc('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">

      {/* HEADER TABS */}
      <div className="lg:col-span-3 flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setViewMode('shift')}
          disabled={!currentSessionId}
          className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${viewMode === 'shift' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-100'} ${!currentSessionId ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Wallet className="w-4 h-4" /> Caja del Turno (Diaria)
        </button>
        <button
          onClick={() => setViewMode('global')}
          className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${viewMode === 'global' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
        >
          <Building2 className="w-4 h-4" /> Caja Mensual / Tesorería
        </button>
      </div>

      {/* LEFT COLUMN: LIVE STATS & ENTRY FORM */}
      <div className="lg:col-span-2 space-y-6">

        {/* Live Balance Card */}
        {viewMode === 'shift' ? (
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 p-8 opacity-10"><Wallet className="w-32 h-32" /></div>
            <div className="relative z-10">
              <h2 className="text-blue-200 font-medium text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Balance Teórico (Turno Actual)
              </h2>
              <div className="text-5xl font-black tracking-tight mb-6">
                ${shiftBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-white/20 pt-4">
                <div><p className="text-blue-200 text-xs">Ventas (Efvo)</p><p className="text-xl font-bold">+${totalSalesCash.toLocaleString()}</p></div>
                <div><p className="text-blue-200 text-xs">Entradas</p><p className="text-xl font-bold">+${totalShiftDeposits.toLocaleString()}</p></div>
                <div><p className="text-red-300 text-xs">Salidas</p><p className="text-xl font-bold text-red-200">-${totalShiftWithdrawals.toLocaleString()}</p></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-indigo-700 to-purple-800 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 p-8 opacity-10"><Building2 className="w-32 h-32" /></div>
            <div className="relative z-10">
              <h2 className="text-indigo-200 font-medium text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Balance Global (Este Mes)
              </h2>
              <div className={`text-5xl font-black tracking-tight mb-6 ${globalBalance < 0 ? 'text-red-300' : 'text-white'}`}>
                ${globalBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-white/20 pt-4">
                <div><p className="text-indigo-200 text-xs">Ventas Totales</p><p className="text-xl font-bold">+${monthlyTotalSales.toLocaleString()}</p></div>
                <div><p className="text-indigo-200 text-xs">Ingresos Extra</p><p className="text-xl font-bold">+${monthlyGlobalDeposits.toLocaleString()}</p></div>
                <div><p className="text-red-300 text-xs">Gastos/Pagos</p><p className="text-xl font-bold text-red-200">-${monthlyGlobalWithdrawals.toLocaleString()}</p></div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Entry Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <Archive className="w-5 h-5 text-gray-500" />
              {viewMode === 'shift' ? 'Registrar en Caja Chica' : 'Registrar en Tesorería Global'}
            </h3>
            {viewMode === 'global' && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold">Modo Administrativo</span>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {/* Type Selection */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setType(MovementType.DEPOSIT)}
                className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${type === MovementType.DEPOSIT ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <ArrowUpCircle className="w-4 h-4" /> Entrada
              </button>
              <button
                onClick={() => setType(MovementType.WITHDRAWAL)}
                className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${type === MovementType.WITHDRAWAL ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <ArrowDownCircle className="w-4 h-4" /> Salida / Pago
              </button>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Monto</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="$0.00"
                  className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg text-gray-900"
                />
              </div>
              <div className="flex-[2]">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Concepto</label>
                <input
                  type="text"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder={viewMode === 'shift' ? "Ej: Cambio inicial, Retiro de efectivo" : "Ej: Pago Proveedor Coca-Cola, Alquiler"}
                  className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                />
              </div>
            </div>

            <button
              onClick={handleAddMovement}
              className={`w-full py-3 rounded-lg font-bold text-white transition-colors shadow-lg flex items-center justify-center gap-2 ${type === MovementType.DEPOSIT ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
            >
              {type === MovementType.DEPOSIT ? 'CONFIRMAR INGRESO' : 'CONFIRMAR PAGO/RETIRO'}
            </button>

            {viewMode === 'global' && type === MovementType.WITHDRAWAL && (
              <p className="text-xs text-orange-600 flex items-center gap-1 justify-center">
                <AlertTriangle className="w-3 h-3" />
                Nota: Este movimiento NO afectará el arqueo de la caja diaria actual.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: HISTORY */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit flex flex-col max-h-[600px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-800">Historial {viewMode === 'global' ? 'Global' : 'Turno'}</h3>
          {viewMode === 'global' && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['today', 'week', 'month'] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all ${filter === f ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                >
                  {f === 'today' ? 'Hoy' : f === 'week' ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          {activeMovements.length === 0 && <p className="text-gray-400 text-sm text-center py-10">Sin movimientos registrados.</p>}

          {[...activeMovements].reverse().map(mov => (
            <div key={mov.id} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 group hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <div className="flex items-start gap-3">
                <div className={`mt-1 p-2 rounded-full ${mov.type === MovementType.DEPOSIT ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                  {mov.type === MovementType.DEPOSIT ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{mov.description}</p>
                  <p className="text-xs text-gray-400">{new Date(mov.date).toLocaleDateString()} {new Date(mov.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <span className={`font-bold ${mov.type === MovementType.DEPOSIT ? 'text-blue-600' : 'text-red-600'}`}>
                {mov.type === MovementType.DEPOSIT ? '+' : '-'}${mov.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
