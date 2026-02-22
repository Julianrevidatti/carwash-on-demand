import React, { useState } from 'react';
import { X, ArrowRight, Check, LayoutDashboard, Package, ShoppingCart, DollarSign } from 'lucide-react';

interface OnboardingTourProps {
    onComplete: () => void;
    onSkip: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete, onSkip }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "¡Bienvenido a GestionNow!",
            description: "Vamos a configurar tu negocio en unos simples pasos. Este sistema te ayudará a controlar tu stock, ventas y caja de forma fácil.",
            icon: <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4"><span className="text-3xl">👋</span></div>,
            highlight: null
        },
        {
            title: "Tu Panel de Control",
            description: "Aquí verás un resumen de tus ventas diarias, productos más vendidos y alertas de stock bajo.",
            icon: <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4"><LayoutDashboard className="w-8 h-8 text-indigo-600" /></div>,
            highlight: "dashboard-tab"
        },
        {
            title: "Carga tus Productos",
            description: "Ve a la sección 'Productos' para agregar tu mercadería. Puedes escanear códigos de barras o cargarlos manualmente.",
            icon: <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4"><Package className="w-8 h-8 text-emerald-600" /></div>,
            highlight: "products-tab"
        },
        {
            title: "Realiza Ventas",
            description: "En el 'Punto de Venta' podrás cobrar a tus clientes de forma rápida. ¡Recuerda abrir la caja primero!",
            icon: <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4"><ShoppingCart className="w-8 h-8 text-orange-600" /></div>,
            highlight: "pos-tab"
        },
        {
            title: "Controla tu Dinero",
            description: "En 'Caja' podrás ver todos los movimientos, realizar retiros y cerrar el turno al final del día.",
            icon: <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"><DollarSign className="w-8 h-8 text-green-600" /></div>,
            highlight: "cash-tab"
        }
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative animate-in fade-in zoom-in duration-300">

                {/* Progress Bar */}
                <div className="h-1 bg-gray-100 w-full">
                    <div
                        className="h-full bg-blue-600 transition-all duration-300 ease-out"
                        style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                </div>

                <button
                    onClick={onSkip}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 text-center">
                    <div className="flex justify-center">
                        {steps[step].icon}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        {steps[step].title}
                    </h2>

                    <p className="text-gray-500 mb-8 leading-relaxed">
                        {steps[step].description}
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleNext}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                        >
                            {step === steps.length - 1 ? (
                                <>Comenzar a Usar <Check className="w-5 h-5" /></>
                            ) : (
                                <>Siguiente <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>

                        {step < steps.length - 1 && (
                            <button
                                onClick={onSkip}
                                className="text-sm text-gray-400 hover:text-gray-600 font-medium py-2"
                            >
                                Omitir tutorial
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t border-gray-100">
                    Paso {step + 1} de {steps.length}
                </div>
            </div>
        </div>
    );
};
