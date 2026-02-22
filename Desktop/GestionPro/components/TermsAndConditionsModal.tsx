import React from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';

interface TermsAndConditionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5" /> Términos y Condiciones de Uso
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto text-sm text-slate-600 space-y-4 leading-relaxed custom-scrollbar">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4">
                        <p className="text-blue-800 font-medium text-xs">
                            Última actualización: {new Date().toLocaleDateString()}
                        </p>
                        <p className="text-blue-900 font-bold mt-1">
                            Bienvenido a GestionPro. Al registrarte, aceptas los siguientes términos.
                        </p>
                    </div>

                    <section>
                        <h4 className="font-bold text-slate-900 mb-2">1. Aceptación de los Términos</h4>
                        <p>Al acceder y utilizar el software GestionPro ("el Servicio"), usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de los términos, no podrá utilizar el Servicio.</p>
                    </section>

                    <section>
                        <h4 className="font-bold text-slate-900 mb-2">2. Periodo de Prueba y Suscripciones</h4>
                        <p><strong>2.1 Prueba Gratuita:</strong> Ofrecemos un periodo de prueba gratuito de 7 días. No se requiere tarjeta de crédito para registrarse. Al finalizar el periodo, deberá suscribirse a un plan pago para continuar accediendo a sus datos.</p>
                        <p><strong>2.2 Pagos:</strong> El servicio se factura mensualmente por adelantado. Los pagos no son reembolsables.</p>
                        <p><strong>2.3 Falta de Pago:</strong> Nos reservamos el derecho de bloquear el acceso a su cuenta 5 días después de la fecha de vencimiento de su factura impaga.</p>
                    </section>

                    <section>
                        <h4 className="font-bold text-slate-900 mb-2">3. Uso del Servicio</h4>
                        <p>Usted es responsable de mantener la seguridad de su cuenta y contraseña. GestionPro no se hace responsable de ninguna pérdida o daño derivado de su incumplimiento de esta obligación de seguridad.</p>
                    </section>

                    <section>
                        <h4 className="font-bold text-slate-900 mb-2">4. Cancelación y Terminación</h4>
                        <p>Puede cancelar su suscripción en cualquier momento. La cancelación se hará efectiva al final del periodo de facturación actual.</p>
                    </section>

                    <section>
                        <h4 className="font-bold text-slate-900 mb-2">5. Limitación de Responsabilidad</h4>
                        <p>En ningún caso GestionPro, ni sus directores, empleados, socios, agentes, proveedores o afiliados, serán responsables de daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo sin limitación, pérdida de beneficios, datos, uso, buena voluntad, u otras pérdidas intangibles.</p>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
                    >
                        <ShieldCheck className="w-4 h-4" /> Entendido, cerrar
                    </button>
                </div>

            </div>
        </div>
    );
};
