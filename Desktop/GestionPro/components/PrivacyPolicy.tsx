import React from 'react';

export const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 p-8 md:p-16">
            <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200">
                <h1 className="text-3xl font-bold mb-6 text-slate-900">Política de Privacidad</h1>
                <p className="text-sm text-gray-500 mb-8">Última actualización: {new Date().toLocaleDateString()}</p>

                <div className="space-y-6 text-gray-700 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-slate-800">1. Información que recopilamos</h2>
                        <p>Recopilamos la información que usted nos proporciona directamente al registrarse en Gestión Now, incluyendo su nombre, dirección de correo electrónico, nombre del negocio y datos facturación. Si utiliza Google para iniciar sesión, obtenemos su información de perfil básica de Google.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-slate-800">2. Uso de la información</h2>
                        <p>Utilizamos la información recopilada para proporcionar, mantener y mejorar nuestros servicios, procesar transacciones, enviar notificaciones técnicas, actualizaciones, alertas de seguridad y mensajes de soporte.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-slate-800">3. Compartir información</h2>
                        <p>No compartimos su información personal con terceros excepto para fines operativos esenciales (tales como el procesamiento de pagos mediante MercadoPago o la gestión de infraestructura técnica) con los debidos resguardos de confidencialidad.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-slate-800">4. Retención y seguridad</h2>
                        <p>Retenemos la información mientras su cuenta esté activa. Hemos implementado rutinas de seguridad en bases de datos para salvaguardar sus activos digitales ante pérdidas o hurtos, restringiendo accesos a roles autorizados dentro del ecosistema de la plataforma.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-slate-800">5. Derechos del Usuario</h2>
                        <p>Usted tiene derecho a acceder, corregir o eliminar su información personal. Puede gestionar la cuenta desde el panel de Gestión Now o contactándonos para solicitar la eliminación permanente de sus datos.</p>
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
