import React from 'react';

export const TermsOfService: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 p-8 md:p-16">
            <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200">
                <h1 className="text-3xl font-bold mb-6 text-slate-900">Términos y Condiciones de Uso</h1>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-8">
                    <p className="text-blue-800 font-medium text-sm">
                        Última actualización: {new Date().toLocaleDateString()}
                    </p>
                    <p className="text-blue-900 font-bold mt-1">
                        Bienvenido a Gestión Now. Al registrarte o usar nuestro servicio, aceptas los siguientes términos.
                    </p>
                </div>

                <div className="space-y-6 text-gray-700 leading-relaxed">
                    <section>
                        <h4 className="font-bold text-slate-900 mb-2 text-lg">1. Aceptación de los Términos</h4>
                        <p>Al acceder y utilizar el software Gestión Now ("el Servicio"), usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de los términos, no podrá utilizar el Servicio.</p>
                    </section>

                    <section>
                        <h4 className="font-bold text-slate-900 mb-2 text-lg">2. Periodo de Prueba y Suscripciones</h4>
                        <p className="mb-2"><strong>2.1 Prueba Gratuita:</strong> Ofrecemos un periodo de prueba gratuito de 7 días. No se requiere tarjeta de crédito para registrarse. Al finalizar el periodo, deberá suscribirse a un plan pago para continuar accediendo a sus datos.</p>
                        <p className="mb-2"><strong>2.2 Pagos:</strong> El servicio se factura mensualmente o anualmente por adelantado. Los pagos no son reembolsables.</p>
                        <p><strong>2.3 Falta de Pago:</strong> Nos reservamos el derecho de bloquear el acceso a su cuenta tras finalizar un periodo de gracia (típicamente de 5 días) posterior a la fecha de vencimiento de su factura impaga.</p>
                    </section>

                    <section>
                        <h4 className="font-bold text-slate-900 mb-2 text-lg">3. Uso del Servicio y de las APIs Integradas</h4>
                        <p>Usted es responsable de mantener la seguridad de su cuenta y contraseña. Gestión Now no se hace responsable de ninguna pérdida o daño derivado de su incumplimiento de esta obligación de seguridad. Así mismo, al usar integraciones de terceros autorizadas mediante OAuth, se responsabiliza del uso que se la dé a estas desde su cuenta.</p>
                    </section>

                    <section>
                        <h4 className="font-bold text-slate-900 mb-2 text-lg">4. Cancelación y Terminación</h4>
                        <p>Puede cancelar su suscripción en cualquier momento de forma manual o comunicándose al soporte. La cancelación del servicio se hará efectiva al final del periodo de facturación actual.</p>
                    </section>

                    <section>
                        <h4 className="font-bold text-slate-900 mb-2 text-lg">5. Limitación de Responsabilidad</h4>
                        <p>En ningún caso Gestión Now ni sus directores, empleados, socios o proveedores serán responsables de daños indirectos, incidentales, o punitivos (incluyendo sin limitación a pérdida de información, beneficios comerciales u otras operaciones intangibles).</p>
                    </section>
                </div>

                <div className="mt-12 pt-6 border-t border-gray-200 text-center">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="text-blue-600 font-medium hover:text-blue-800 transition-colors"
                    >
                        ← Volver al inicio
                    </button>
                </div>
            </div>
        </div>
    );
};
