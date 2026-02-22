
import React, { useState, useEffect } from 'react';
import { CashSession, Sale, PaymentMethodConfig } from '../types';
import { useStore } from '../src/store/useStore';
import { Lock, Unlock, DollarSign, Save, X, Banknote, Coins, Calculator, ArrowRight, AlertTriangle, RefreshCw, Clock } from 'lucide-react';

interface CashControlProps {
  currentSession: CashSession | null;
  onOpenSession: (float: number) => void;
  onCloseSession: (finalCash: number) => void;
  todaySales: Sale[];
  paymentMethods: PaymentMethodConfig[];
  cashMovements?: any[];
  sessions?: CashSession[];
}

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

export const CashControl: React.FC<CashControlProps> = ({ currentSession, onOpenSession, onCloseSession, todaySales, paymentMethods, sessions = [] }) => {
  const [floatInput, setFloatInput] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  // Closing Modal State
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [withdrawalAmount, setWithdrawalAmount] = useState('');

  // Z-Report Calculation
  const salesThisSession = todaySales.filter(s => s.sessionId === currentSession?.id);
  const totalRevenue = salesThisSession.reduce((acc, s) => acc + s.total, 0);

  // Breakdown by Method
  const breakdown = paymentMethods.map(pm => {
    const total = salesThisSession
      .filter(s => s.paymentMethodName === pm.name)
      .reduce((acc, s) => acc + s.total, 0);
    return { name: pm.name, total, isCash: pm.isCash };
    return { name: pm.name, total, isCash: pm.isCash };
  });

  // Calculate Unclassified/Unknown
  const classifiedTotal = breakdown.reduce((acc, b) => acc + b.total, 0);
  const unclassifiedTotal = totalRevenue - classifiedTotal;

  if (unclassifiedTotal > 0) {
    breakdown.push({ name: 'Otros / Desconocido', total: unclassifiedTotal, isCash: false });
  }

  const cashSales = breakdown.find(b => b.isCash)?.total || 0;
  const expectedCashInDrawer = (currentSession?.initialFloat || 0) + cashSales;

  // Real-time Audit Calculation
  const totalCounted = DENOMINATIONS.reduce((acc, d) => {
    const count = parseInt(counts[d.value] || '0');
    return acc + (count * d.value);
  }, 0);

  const difference = totalCounted - expectedCashInDrawer;
  const withdrawal = parseFloat(withdrawalAmount) || 0;
  const remainingCash = totalCounted - withdrawal;

  const handleCountChange = (value: number, qty: string) => {
    setCounts(prev => ({ ...prev, [value]: qty }));
  };

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    // Slight delay to ensure modal closes visually before parent updates state
    setTimeout(() => {
      onCloseSession(totalCounted);
    }, 100);
  };

  // Robust check for active session
  const isSessionActive = currentSession && currentSession.status === 'OPEN' && currentSession.startTime;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4">
      {!isSessionActive ? (
        <div className="flex items-center justify-center h-[calc(100vh-300px)] animate-in fade-in">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Caja Cerrada</h2>
            <p className="text-gray-500 mb-8">Debe abrir un turno de caja para comenzar a operar el POS.</p>

            <div className="text-left mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Fondo Inicial (Cambio)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold text-gray-900 bg-white"
                  placeholder="0.00"
                  value={floatInput}
                  onChange={e => setFloatInput(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <button
              onClick={() => onOpenSession(parseFloat(floatInput) || 0)}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Unlock className="w-5 h-5" /> ABRIR CAJA
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Session Header */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Control de Turno</h2>
              <p className="text-green-600 font-medium flex items-center gap-2">
                <Unlock className="w-4 h-4" /> Turno Abierto: {new Date(currentSession.startTime).toLocaleTimeString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Fondo Inicial</p>
              <p className="text-xl font-bold text-gray-800">${(currentSession?.initialFloat || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* --- ORPHANED SALES RECOVERY (EMERGENCY FIX) --- */}
          {(() => {
            const today = new Date().toDateString();
            const orphans = todaySales.filter(s => {
              const sDate = new Date(s.date).toDateString();
              const isToday = sDate === today;
              const isNotCurrentSession = s.sessionId !== currentSession.id;
              // Only consider orphans if they are NOT clearly assigned to another OPEN session?
              // For simplicity: If it's today and not this session, let's offer to claim it.
              // But if we have multiple sessions today?
              // The user said: "She reopened the box... previous box data missing".
              // So valid previous sessions might exist in history?
              // Check if the session ID of the sale exists in the 'sessions' list?
              // If the sale has a session ID that is NOT in the sessions list, or is 'unknown', it's definitely an orphan.
              // Or if the user explicitely wants to merge ALL today's sales to this new box.
              // Let's assume ANY sale from today that is NOT in this session is a candidate, 
              // but we should display them carefully.
              // Better heuristic: Sales from today where sessionId == 'unknown' OR sessionId is not found in known sessions list.
              // RELAXED LOGIC (Updated): Show ALL sales from today that are not in this session.
              const sessionExists = sessions.some(sess => sess.id === s.sessionId);
              return isToday && isNotCurrentSession;
            });

            if (orphans.length > 0) {
              return (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex justify-between items-center shadow-sm animate-in fade-in">
                  <div>
                    <h3 className="font-bold text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Ventas de Hoy en Otras Cajas ({orphans.length})
                    </h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Detectamos ventas de hoy (${orphans.reduce((acc, s) => acc + s.total, 0).toLocaleString()}) que no están en esta sesión.
                      <br />
                      <span className="text-xs opacity-80">(Pueden ser de la caja anterior mal cerrada).</span>
                    </p>
                  </div>
                  <button
                    onClick={() => useStore.getState().recoverOrphanedSales(currentSession.id, orphans)}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-700 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Traer Todas a esta Caja
                  </button>
                </div>
              );
            }
            return null;
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Z-Report Preview */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-500" /> Resumen Parcial (Turno Abierto)
              </h3>
              <div className="bg-blue-50 text-blue-700 text-xs p-2 rounded mb-3 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>La caja sigue <strong>abierta</strong>. Para cerrar el turno, use el botón rojo abajo.</span>
              </div>
              <div className="space-y-3">
                {breakdown.map(b => (
                  <div key={b.name} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{b.name}</span>
                    <span className="font-bold text-gray-800">${b.total.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between items-center text-lg font-bold text-blue-600">
                  <span>Total Ventas</span>
                  <span>${totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Closing Action */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-500 flex flex-col justify-center">
              <h3 className="font-bold text-red-600 mb-2">Cierre de Caja</h3>
              <p className="text-sm text-gray-500 mb-6">
                Al cerrar la caja, se debe realizar el arqueo físico de billetes.
              </p>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between font-bold text-gray-800">
                  <span>Esperado en Cajón (Teórico):</span>
                  <span>${expectedCashInDrawer.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Fondo Inicial + Ventas Efectivo</p>
              </div>

              <button
                onClick={() => setShowCloseModal(true)}
                className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-100"
              >
                <Save className="w-5 h-5" /> INICIAR ARQUEO Y CIERRE
              </button>
            </div>
          </div>

          {/* --- ARQUEO MODAL --- */}
          {showCloseModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-red-500 p-4 flex justify-between items-center text-white shrink-0">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Lock className="w-5 h-5" /> Cerrar Caja
                  </h3>
                  <button onClick={() => setShowCloseModal(false)} className="hover:bg-red-600 p-1 rounded transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                  {/* Denomination Grid */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                    <h4 className="text-blue-800 font-bold text-sm mb-3 flex justify-between items-center">
                      Conteo de Dinero en Caja (Arqueo)
                      <Calculator className="w-4 h-4" />
                    </h4>
                    <div className="grid grid-cols-4 gap-3">
                      {DENOMINATIONS.map(d => (
                        <div key={d.value} className="flex flex-col items-center">
                          <label className="flex items-center gap-1 text-xs font-bold text-gray-600 mb-1">
                            {d.type === 'bill' ? <Banknote className="w-3 h-3" /> : <Coins className="w-3 h-3" />}
                            {d.value}
                          </label>
                          <input
                            type="number"
                            placeholder="0"
                            className="w-full p-2 text-center border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-900 bg-white"
                            value={counts[d.value] || ''}
                            onChange={e => handleCountChange(d.value, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calculations Summary */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Efectivo Arqueado:</span>
                      <div className="bg-white border px-3 py-1 rounded-lg font-bold text-gray-800 w-32 text-right">
                        {totalCounted.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Efectivo Calculado:</span>
                      <div className="bg-white border px-3 py-1 rounded-lg font-bold text-gray-500 w-32 text-right">
                        {expectedCashInDrawer.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Diferencia:</span>
                      <div className={`border px-3 py-1 rounded-lg font-bold w-32 text-right ${difference < 0 ? 'bg-red-100 text-red-600 border-red-200' : difference > 0 ? 'bg-green-100 text-green-600 border-green-200' : 'bg-gray-100 text-gray-600'}`}>
                        {difference.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-800 font-bold">Monto a Retirar:</span>
                      <input
                        type="number"
                        className="border border-gray-300 px-3 py-1 rounded-lg font-bold text-gray-800 w-32 text-right focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={withdrawalAmount}
                        onChange={e => setWithdrawalAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                      <span className="text-sm font-bold text-gray-500 uppercase">Saldo que quedará en caja:</span>
                      <div className="bg-blue-100 border border-blue-200 px-3 py-1 rounded-lg font-bold text-blue-800 w-32 text-right">
                        {remainingCash.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
                  <button
                    onClick={handleConfirmClose}
                    className="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                  >
                    Confirmar Cierre
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
