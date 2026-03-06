import React, { useState } from 'react';
import { Lock, CreditCard, ShieldCheck, Loader2, CheckCircle, ShieldAlert } from 'lucide-react';
import { PricingPlan } from '../config/planLimits';
import { createSubscriptionLink } from '../src/services/preApprovalService';
import { toast } from 'sonner';
import { useStore } from '../src/store/useStore';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>('PRO');
  const [loading, setLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [externalReference, setExternalReference] = useState<string | null>(null);

  // MP Email step state
  const [showEmailStep, setShowEmailStep] = useState(false);
  const [mpEmailInput, setMpEmailInput] = useState('');

  const verifySubscriptionPayment = useStore(state => state.verifySubscriptionPayment);
  const currentUser = useStore(state => state.currentUser);
  const currentTenant = useStore(state => state.currentTenant);

  // Determine if it's a paid plan expiration (Grace Period Ended) or Trial Expiration
  const isPaidPlan = currentTenant?.pricingPlan && currentTenant.pricingPlan !== 'FREE';
  const modalTitle = checkingPayment
    ? '¡Esperando Pago!'
    : (isPaidPlan ? '¡Periodo de Gracia Finalizado!' : '¡Periodo de Prueba Finalizado!');

  const modalDescription = checkingPayment
    ? 'Si ya realizaste el pago, presiona el botón para verificar y activar tu cuenta.'
    : (isPaidPlan
      ? 'Tu periodo de gracia de 5 días ha terminado. Renueva tu suscripción para recuperar el acceso inmediato.'
      : 'Tu prueba gratuita de 7 días ha expirado. Suscríbete para continuar y no perder tus datos.');

  if (!isOpen) return null;

  const handleProceedToEmail = () => {
    if (!selectedPlan) return;
    setMpEmailInput(currentUser?.email || currentTenant?.contactName || '');
    setShowEmailStep(true);
  };

  const handleConfirmAndPay = async () => {
    if (!selectedPlan) return;
    if (!mpEmailInput || !mpEmailInput.includes('@')) {
      toast.error("Ingresá un email válido.");
      return;
    }

    setLoading(true);
    try {
      if (!currentTenant?.id) {
        throw new Error("No se pudo identificar el comercio. Recarga la página.");
      }

      toast.info("Generando link de suscripción...");

      const reference = currentTenant.id;
      setExternalReference(reference);

      const amount = selectedPlan === 'BASIC' ? 9999 : selectedPlan === 'PRO' ? 13999 : 29999;

      const checkoutUrl = await createSubscriptionLink(
        currentTenant,
        selectedPlan as any,
        amount,
        mpEmailInput.trim()
      );

      if (!checkoutUrl) {
        throw new Error("No se pudo obtener el punto de inicio de pago.");
      }

      toast.success("Redirigiendo a Mercado Pago...");
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error("Subscription Error Details:", error);
      toast.error(`Error: ${error.message || "No se pudo iniciar el pago"}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!externalReference || !selectedPlan) return;
    setLoading(true);
    try {
      toast.info("Verificando pago con Mercado Pago...");
      const tenantId = externalReference.includes('|') ? externalReference.split('|')[0] : externalReference;

      const success = await verifySubscriptionPayment(tenantId, selectedPlan);

      if (success) {
        toast.success("¡Pago confirmado! Cuenta activada.");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error("No encontramos ningún pago aprobado. Si acabas de pagar, espera unos segundos e intenta de nuevo.");
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      toast.error("Error al verificar el pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-500">

      {/* EMAIL CONFIRMATION MODAL (overlay on top) */}
      {showEmailStep && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-blue-100 animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-[#009EE3] to-[#0077B6] p-5 text-white text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black">Confirmar Email de Pago</h3>
              <p className="text-sm text-white/80 mt-1">
                Plan {selectedPlan === 'BASIC' ? 'Básico' : selectedPlan === 'PRO' ? 'PRO' : 'Ultimate'}
                {' · $'}
                {selectedPlan === 'BASIC' ? '9.999' : selectedPlan === 'PRO' ? '13.999' : '29.999'}
                /mes
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Email de tu cuenta de Mercado Pago
                </label>
                <input
                  type="email"
                  value={mpEmailInput}
                  onChange={(e) => setMpEmailInput(e.target.value)}
                  placeholder="tuemail@ejemplo.com"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[#009EE3] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-slate-800 font-medium"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmAndPay()}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>Importante:</strong> Ingresá el email con el que iniciás sesión en Mercado Pago. Si es diferente al del sistema, no hay problema.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowEmailStep(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  disabled={loading}
                >
                  Volver
                </button>
                <button
                  onClick={handleConfirmAndPay}
                  disabled={loading || !mpEmailInput.includes('@')}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-[#009EE3] hover:bg-[#008AD6] transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Ir a Pagar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN MODAL */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-center p-8 relative border-2 border-red-100">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-red-500" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 mb-2">
          {modalTitle}
        </h2>

        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          {modalDescription}
        </p>

        {!checkingPayment ? (
          <>
            <div className="grid grid-cols-1 gap-3 mb-6 text-left">
              {/* BASIC */}
              <div
                onClick={() => setSelectedPlan('BASIC')}
                className={`border rounded-xl p-3 relative cursor-pointer transition-all ${selectedPlan === 'BASIC' ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-600' : 'bg-slate-50 border-slate-200 opacity-70 hover:opacity-100'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 text-sm">Plan Básico</span>
                  <span className="font-black text-slate-900">$9.999<span className="text-[10px] font-medium text-slate-500">/mes</span></span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Ideal Kioscos pequeños. Hasta 200 prod.</p>
              </div>

              {/* PRO */}
              <div
                onClick={() => setSelectedPlan('PRO')}
                className={`border-2 rounded-xl p-3 relative shadow-sm cursor-pointer transition-all ${selectedPlan === 'PRO' ? 'bg-blue-50 border-blue-600' : 'bg-white border-slate-200 opacity-70 hover:opacity-100'}`}
              >
                <div className="absolute -top-2 right-2 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">POPULAR</div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-800 text-sm">Plan PRO</span>
                  <span className="font-black text-blue-900">$13.999<span className="text-[10px] font-medium text-blue-600/70">/mes</span></span>
                </div>
                <p className="text-[10px] text-blue-600/80 mt-1">Con <strong>Planner de Pedidos</strong> + <strong>Gestor de Promociones</strong>. Hasta 750 prod.</p>
              </div>

              {/* ULTIMATE */}
              <div
                onClick={() => setSelectedPlan('ULTIMATE')}
                className={`border rounded-xl p-3 relative cursor-pointer transition-all ${selectedPlan === 'ULTIMATE' ? 'bg-purple-50 border-purple-600 ring-1 ring-purple-600' : 'bg-slate-50 border-slate-200 opacity-70 hover:opacity-100'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-purple-800 text-sm">Ultimate</span>
                  <span className="font-black text-purple-900">$29.999<span className="text-[10px] font-medium text-purple-600/70">/mes</span></span>
                </div>
                <p className="text-[10px] text-purple-600/80 mt-1">Ilimitado + Soporte VIP + Gestor de Usuarios con roles.</p>
              </div>
            </div>

            <button
              onClick={handleProceedToEmail}
              disabled={loading || !selectedPlan}
              className="w-full bg-[#009EE3] hover:bg-[#008ED6] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 mb-4 disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5" />
              Activar Débito Automático
            </button>
            <p className="text-[9px] text-slate-400 mb-2">Al continuar, autorizas el cobro mensual automático en tu tarjeta.</p>
          </>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              Verificar y Activar Mi Cuenta
            </button>
            <button
              onClick={() => setCheckingPayment(false)}
              className="text-sm text-slate-400 hover:text-slate-600 font-medium"
            >
              Regresar a selección de planes
            </button>
          </div>
        )}

        <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Sistema Bloqueado por Seguridad
        </p>
      </div>
    </div>
  );
};