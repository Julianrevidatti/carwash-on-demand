import React from 'react';
import { X, Check } from 'lucide-react';
import { PLAN_LIMITS, PricingPlan } from '../config/planLimits';

interface PlanSelectionModalProps {
    currentPlan: string;
    isCurrentPlanExpired?: boolean;
    onClose: () => void;
    onSelectPlan: (plan: PricingPlan) => void;
}

export const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({ currentPlan, isCurrentPlanExpired = false, onClose, onSelectPlan }) => {
    // Filter out FREE plan for selection, or keep it if downgrading is allowed. 
    // User asked for "los tres planes" (BASIC, PRO, ULTIMATE usually)
    const availablePlans: PricingPlan[] = ['BASIC', 'PRO', 'ULTIMATE'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Elige tu Plan</h2>
                        <p className="text-gray-500">Mejora tu suscripción y desbloquea más potencia para tu negocio</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Plans Grid */}
                <div className="p-6 bg-gray-50 flex-1 overflow-y-auto">
                    <div className="grid md:grid-cols-3 gap-6">
                        {availablePlans.map((planKey) => {
                            // @ts-ignore
                            const plan = PLAN_LIMITS[planKey];
                            const isCurrent = currentPlan === planKey;
                            const showRenew = isCurrent && isCurrentPlanExpired;

                            return (
                                <div
                                    key={planKey}
                                    className={`
                    relative flex flex-col p-6 rounded-xl border-2 transition-all duration-200 bg-white
                    ${isCurrent
                                            ? 'border-blue-500 shadow-blue-100 ring-4 ring-blue-50 z-10'
                                            : 'border-transparent shadow-sm hover:border-blue-200 hover:shadow-md hover:-translate-y-1'
                                        }
                  `}
                                >
                                    {isCurrent && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                            Plan Actual
                                        </div>
                                    )}

                                    <div className="mb-4 text-center">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">{plan.label}</h3>
                                        <div className="flex items-center justify-center gap-1">
                                            <span className="text-3xl font-black text-gray-900">
                                                ${plan.monthlyPrice.toLocaleString('es-AR')}
                                            </span>
                                            <span className="text-gray-500 text-sm">/mes</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-3 mb-8 border-t border-gray-100 pt-6">
                                        <FeatureRow label={`${plan.maxUsers === 999 ? 'Usuarios Ilimitados' : `${plan.maxUsers} Usuarios`}`} active={true} />
                                        <FeatureRow label={`${plan.maxProducts === 999999 ? 'Productos Ilimitados' : `Hasta ${plan.maxProducts.toLocaleString()} Productos`}`} active={true} />
                                        <FeatureRow label="Reportes Avanzados" active={plan.canAccessReports} />
                                        <FeatureRow label="Planificador de Compras" active={plan.canAccessOrderPlanner} />
                                        <FeatureRow label="Módulo de Promociones" active={plan.canAccessPromotions} />
                                        <FeatureRow
                                            label={
                                                plan.supportLevel === 'dedicated' ? 'Soporte Dedicado 24/7' :
                                                    plan.supportLevel === 'priority' ? 'Soporte Prioritario' :
                                                        'Soporte Comunitario'
                                            }
                                            active={true}
                                            highlight={plan.supportLevel === 'dedicated'}
                                        />
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (!isCurrent || showRenew) {
                                                onSelectPlan(planKey);
                                            }
                                        }}
                                        disabled={isCurrent && !showRenew}
                                        className={`
                      w-full py-3 rounded-lg font-bold transition-all text-sm uppercase tracking-wide
                      ${isCurrent && !showRenew
                                                ? 'bg-gray-100 text-gray-400 cursor-default'
                                                : showRenew
                                                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-200 animate-pulse'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-blue-200'
                                            }
                    `}
                                    >
                                        {isCurrent ? (showRenew ? 'Renovar Ahora' : 'Plan Actual') : 'Seleccionar Plan'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component for features
const FeatureRow = ({ label, active = true, highlight = false }: { label: string, active?: boolean, highlight?: boolean }) => (
    <div className={`flex items-start gap-3 ${!active ? 'opacity-40 grayscale' : ''}`}>
        <div className={`
        shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center
        ${active
                ? (highlight ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-50 text-blue-600')
                : 'bg-gray-100 text-gray-400'
            }
    `}>
            {active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
        </div>
        <span className={`text-sm leading-tight ${highlight ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{label}</span>
    </div>
);
