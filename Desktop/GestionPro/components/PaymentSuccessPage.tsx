import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader2, XCircle, ArrowRight } from 'lucide-react';
import { useStore } from '../src/store/useStore';
import { toast } from 'sonner';

interface PaymentSuccessPageProps {
    onGoHome: () => void;
}

export const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({ onGoHome }) => {
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [countdown, setCountdown] = useState(5);

    const verifySubscriptionPayment = useStore(state => state.verifySubscriptionPayment);
    const currentTenant = useStore(state => state.currentTenant);

    // Get parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const planParam = urlParams.get('plan') || 'PRO'; // BASIC, PRO, ULTIMATE
    const tenantIdFromUrl = urlParams.get('tenant_id') || '';
    const paymentStatus = urlParams.get('status'); // approved, pending, rejected

    // Get tenant_id from URL or localStorage (fallback)
    const tenantId = tenantIdFromUrl ||
        localStorage.getItem('pending_subscription_tenant') ||
        currentTenant?.id || '';

    useEffect(() => {
        const verifyPayment = async () => {
            // If we have a tenant_id, verify the subscription
            if (tenantId) {
                try {
                    const success = await verifySubscriptionPayment(tenantId, planParam as any);

                    if (success) {
                        setStatus('success');
                        toast.success('¡Suscripción activada con éxito!');
                        // Clear localStorage
                        localStorage.removeItem('pending_subscription_tenant');
                        localStorage.removeItem('pending_subscription_plan');
                    } else {
                        setStatus('error');
                        toast.error('No se pudo verificar el pago. Contacta a soporte.');
                    }
                } catch (error) {
                    console.error('Error verifying payment:', error);
                    setStatus('error');
                }
            } else if (paymentStatus === 'pending') {
                setStatus('verifying');
                toast.info('Pago pendiente de confirmación. Te notificaremos cuando se apruebe.');
            } else {
                setStatus('error');
            }
        };

        verifyPayment();
    }, [paymentStatus, tenantId, planParam, verifySubscriptionPayment]);

    // Countdown for auto-redirect
    useEffect(() => {
        if (status === 'success' && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (status === 'success' && countdown === 0) {
            onGoHome();
        }
    }, [status, countdown, onGoHome]);

    const getPlanName = () => {
        const plans: any = {
            'BASIC': 'Plan Básico',
            'PRO': 'Plan PRO',
            'ULTIMATE': 'Plan Ultimate'
        };
        return plans[planParam] || 'Plan PRO';
    };

    const getPlanPrice = () => {
        const prices: any = {
            'BASIC': '$9.999',
            'PRO': '$13.999',
            'ULTIMATE': '$29.999'
        };
        return prices[planParam] || '$13.999';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Success State */}
                {status === 'success' && (
                    <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-green-100 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200 animate-bounce">
                            <CheckCircle className="w-14 h-14 text-white" />
                        </div>

                        <h1 className="text-3xl font-black text-slate-900 mb-3">
                            ¡Pago Confirmado!
                        </h1>

                        <p className="text-slate-600 mb-6 leading-relaxed">
                            Tu suscripción al <strong className="text-blue-600">{getPlanName()}</strong> ha sido activada exitosamente.
                        </p>

                        <div className="bg-blue-50 rounded-2xl p-6 mb-6 border border-blue-100">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-slate-600 text-sm">Plan</span>
                                <span className="font-bold text-slate-900">{getPlanName()}</span>
                            </div>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-slate-600 text-sm">Precio</span>
                                <span className="font-bold text-slate-900">{getPlanPrice()}/mes</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 text-sm">Próximo cargo</span>
                                <span className="font-bold text-slate-900">
                                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR')}
                                </span>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-4 mb-6">
                            <p className="text-sm font-medium">
                                Redirigiendo en {countdown} segundos...
                            </p>
                        </div>

                        <button
                            onClick={onGoHome}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            Ir al Dashboard
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Verifying State */}
                {status === 'verifying' && (
                    <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-yellow-100">
                        <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-200">
                            <Loader2 className="w-14 h-14 text-white animate-spin" />
                        </div>

                        <h1 className="text-3xl font-black text-slate-900 mb-3">
                            Verificando Pago...
                        </h1>

                        <p className="text-slate-600 mb-6 leading-relaxed">
                            Estamos confirmando tu pago con Mercado Pago. Esto puede tomar unos momentos.
                        </p>

                        <div className="flex items-center justify-center gap-2 text-yellow-600 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Procesando...</span>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {status === 'error' && (
                    <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-red-100">
                        <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-200">
                            <XCircle className="w-14 h-14 text-white" />
                        </div>

                        <h1 className="text-3xl font-black text-slate-900 mb-3">
                            Hubo un Problema
                        </h1>

                        <p className="text-slate-600 mb-6 leading-relaxed">
                            No pudimos confirmar tu pago. Si realizaste el pago, espera unos minutos e intenta verificar nuevamente.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg"
                            >
                                Reintentar Verificación
                            </button>

                            <button
                                onClick={onGoHome}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-4 rounded-xl transition-all"
                            >
                                Volver al Inicio
                            </button>
                        </div>

                        <p className="text-xs text-slate-400 mt-6">
                            Si el problema persiste, contacta a soporte con el código: <br />
                            <code className="bg-slate-100 px-2 py-1 rounded text-slate-700">{tenantId}</code>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
