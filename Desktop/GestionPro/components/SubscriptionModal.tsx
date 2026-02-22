import React, { useState } from 'react';
import { Lock, CreditCard, ShieldCheck, Loader2, CheckCircle } from 'lucide-react';
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

  const handleCheckout = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      console.log("Iniciando checkout de suscripción...", { selectedPlan, currentTenant });

      if (!currentTenant?.id) {
        throw new Error("No se pudo identificar el comercio (Tenant ID missing). Recarga la página.");
      }

      toast.info("Generando link de suscripción...");

      const reference = currentTenant?.id;
      setExternalReference(reference);

      const amount = selectedPlan === 'BASIC' ? 9999 : selectedPlan === 'PRO' ? 13999 : 29999;

      // Use the store's current user email or tenant contact name
      const userEmail = currentUser?.email || currentTenant?.contactName || "cliente@gestionpro.com";

      console.log("Enviando petición de suscripción:", {
        tenantId: currentTenant.id,
        plan: selectedPlan,
        amount,
        userEmail
      });

      const checkoutUrl = await createSubscriptionLink(
        currentTenant,
        selectedPlan as any, // Cast to any to handle FREE if it somehow reaches here, though it shouldn't
        amount,
        userEmail
      );

      if (!checkoutUrl) {
        throw new Error("No se pudo obtener el punto de inicio de pago.");
      }

      console.log("Redirigiendo a:", checkoutUrl);
      toast.success("Redirigiendo a Mercado Pago...");
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error("Subscription Error Details:", error);
      toast.error(`Error: ${error.message || "No se pudo iniciar el pago"}. Verifique su conexión.`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!externalReference || !selectedPlan) return;
    setLoading(true);
    try {
      toast.info("Verificando pago con Mercado Pago...");
      // For verification, we try to use the reference we have
      // In the new logic, we might need tenantId
      const tenantId = externalReference.includes('|') ? externalReference.split('|')[0] : externalReference;

      const success = await verifySubscriptionPayment(tenantId, selectedPlan);

      if (success) {
        toast.success("¡Pago confirmado! Cuenta activada.");
        // Modal will close automatically because isOpen will become false via global state update
        setTimeout(() => window.location.reload(), 1500); // Reload to clear locks
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
              onClick={handleCheckout}
              disabled={loading || !selectedPlan}
              className="w-full bg-[#009EE3] hover:bg-[#008ED6] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 mb-4 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CreditCard className="w-5 h-5" />
              )}
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