import React from 'react';
import { AlertTriangle, CreditCard, X } from 'lucide-react';

interface GraceWarningModalProps {
    daysRemaining: number;
    onClose: () => void;
    onGoToPayment: () => void;
}

export const GraceWarningModal: React.FC<GraceWarningModalProps> = ({
    daysRemaining,
    onClose,
    onGoToPayment
}) => {
    // Color scheme based on urgency
    const isUrgent = daysRemaining <= 2;
    const alertColor = isUrgent ? 'red' : 'orange';
    const bgGradient = isUrgent
        ? 'from-red-50 to-red-100'
        : 'from-orange-50 to-orange-100';
    const textColor = isUrgent ? 'text-red-600' : 'text-orange-600';
    const borderColor = isUrgent ? 'border-red-300' : 'border-orange-300';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className={`relative max-w-lg w-full mx-4 bg-gradient-to-br ${bgGradient} rounded-2xl shadow-2xl border-2 ${borderColor} animate-in zoom-in slide-in-from-bottom-4`}>
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Cerrar"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header with icon */}
                <div className="flex flex-col items-center pt-8 pb-4 px-6">
                    <div className={`w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg mb-4 ${isUrgent ? 'animate-pulse' : ''}`}>
                        <AlertTriangle className={`w-12 h-12 ${textColor}`} strokeWidth={2.5} />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
                        ⚠️ Tu Licencia Ha Vencido
                    </h2>

                    <div className="text-center">
                        <p className="text-lg text-gray-700">
                            Quedan <span className={`font-black text-3xl ${textColor}`}>{daysRemaining}</span> {daysRemaining === 1 ? 'día' : 'días'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            para realizar el pago antes del bloqueo total
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="px-6 pb-4">
                    <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${isUrgent ? 'bg-red-500' : 'bg-orange-500'}`}
                            style={{ width: `${(daysRemaining / 5) * 100}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-1">
                        {daysRemaining} de 5 días restantes
                    </p>
                </div>

                {/* Mercado Pago suggestion */}
                <div className="bg-white/80 mx-6 mb-4 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">💡</div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800 mb-1">
                                ¡Activa el Débito Automático!
                            </p>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Con Mercado Pago puedes configurar el débito automático y olvidarte de renovar manualmente cada mes.
                                <span className="font-medium text-blue-600"> ¡Es rápido y seguro!</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 px-6 pb-6">
                    <button
                        onClick={onGoToPayment}
                        className={`flex-1 ${isUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'} text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2`}
                    >
                        <CreditCard className="w-5 h-5" />
                        Activar Suscripción
                    </button>

                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white/80 hover:bg-white text-gray-700 font-semibold rounded-xl transition-all border border-gray-300"
                    >
                        Recordarme Después
                    </button>
                </div>

                {/* Footer note */}
                <div className="bg-gray-100/50 px-6 py-3 rounded-b-2xl">
                    <p className="text-xs text-center text-gray-500">
                        Al finalizar el período de gracia, el sistema se bloqueará automáticamente
                    </p>
                </div>
            </div>
        </div>
    );
};
