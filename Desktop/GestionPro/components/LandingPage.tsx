import React, { useState } from 'react';
import {
  AlertTriangle, HelpCircle, TrendingDown, Box, QrCode, Bot,
  Smartphone, FileText, Store, Lock, CreditCard, UserCog, EyeOff, ShieldCheck,
  Check, ArrowRight, Star, Shield, Zap, TrendingUp, Menu, X, Instagram, MessageCircle
} from 'lucide-react';

interface LandingPageProps {
  onGoToLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGoToLogin }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">

      {/* --- HEADER --- */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
            <div className="bg-blue-900 p-1.5 rounded-lg">
              <Store className="w-5 h-5 text-white" />
            </div>
            GestionNow
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Funcionalidades</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Precios</a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors">Opiniones</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onGoToLogin}
              className="bg-blue-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
            >
              Comenzar Ahora
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-slate-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 absolute w-full shadow-xl">
            <nav className="flex flex-col gap-4 text-sm font-medium text-slate-600">
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)}>Funcionalidades</a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Precios</a>
              <a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)}>Opiniones</a>
              <button
                onClick={onGoToLogin}
                className="bg-blue-900 text-white px-6 py-3 rounded-xl font-bold text-center"
              >
                Comenzar Ahora
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* --- HERO SECTION --- */}
      <section className="bg-[#0f172a] text-white pt-20 pb-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">

          <div className="text-left">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              NUEVO: ASISTENTE IA INCLUIDO
            </div>

            <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight tracking-tight">
              Tu Negocio, Bajo <br />
              <span className="text-emerald-400">Control Total</span>
            </h1>

            <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-lg">
              Deja el cuaderno y los sistemas lentos. Gestion Now te ayuda a controlar el stock, cobrar con Mercado Pago y evitar robos hormiga. Todo en un solo lugar.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button onClick={onGoToLogin} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                Comenzar Ahora <ArrowRight className="w-5 h-5" />
              </button>
              <button className="bg-transparent hover:bg-slate-800 text-white px-8 py-4 rounded-lg font-bold text-lg border border-slate-700 transition-all">
                Ver Demo en Vivo
              </button>
            </div>

            <div className="flex items-center gap-6 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" /> Cancela cuando quieras
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" /> 7 días gratis
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" /> Soporte 24/7
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Hero Image / Dashboard Mockup */}
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-800 relative group">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60 z-10"></div>
              {/* Placeholder for dashboard image - using a generic gradient div for now if no image */}
              <div className="aspect-video bg-slate-800 flex items-center justify-center relative">
                <div className="absolute bottom-6 right-6 bg-white text-slate-900 p-4 rounded-xl shadow-lg z-20 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-1000">
                  <div className="bg-emerald-100 p-2 rounded-full">
                    <Check className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Cierre de Caja</p>
                    <p className="text-xl font-black text-slate-900">+ $124,500 ARS</p>
                  </div>
                </div>
                {/* Abstract UI representation */}
                <div className="w-full h-full p-8 grid grid-cols-12 gap-4 opacity-50">
                  <div className="col-span-3 bg-slate-700 rounded-lg h-full"></div>
                  <div className="col-span-9 grid grid-rows-3 gap-4">
                    <div className="row-span-1 bg-slate-700 rounded-lg"></div>
                    <div className="row-span-2 bg-slate-700 rounded-lg grid grid-cols-3 gap-4 p-4">
                      <div className="bg-slate-600 rounded"></div>
                      <div className="bg-slate-600 rounded"></div>
                      <div className="bg-slate-600 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- PAIN POINTS SECTION --- */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">¿Te sientes identificado?</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Manejar un kiosco no debería ser un dolor de cabeza. Identificamos los problemas más comunes para darles una solución definitiva.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-6">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">¿Pierdes mercadería?</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                El "robo hormiga" y los productos vencidos pueden costarte hasta el 20% de tu ganancia mensual sin que te des cuenta.
              </p>
            </div>
            <div className="p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-6">
                <HelpCircle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">¿No sabes cuánto ganas?</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Si anotas en cuadernos o usas Excel, es imposible saber tu ganancia real descontando inflación y reposición.
              </p>
            </div>
            <div className="p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
                <TrendingDown className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">¿Cierres de caja eternos?</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Perder horas contando billetes al final del día y que los números no coincidan es frustrante y agotador.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-emerald-600 font-bold text-xs tracking-widest uppercase mb-2 block">Potencia tu Negocio</span>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">Todo lo que necesitas para crecer</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Gestion Now no es solo un sistema de ventas, es un socio tecnológico diseñado para aumentar tu rentabilidad.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-4 text-white">
                <Box className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Control de Stock Inteligente</h3>
              <p className="text-sm text-slate-500">Semáforo de vencimientos que le avisa antes de perder mercadería. Alertas automáticas de stock bajo.</p>
            </div>
            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center mb-4 text-white">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Integración Mercado Pago</h3>
              <p className="text-sm text-slate-500">Genera QRs dinámicos en la pantalla del cliente. El pago se impacta automáticamente en el sistema.</p>
            </div>
            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mb-4 text-white">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Asistente IA Integrado</h3>
              <p className="text-sm text-slate-500">Nuestra IA analiza tus ventas y te sugiere qué combos armar para vender los productos estancados.</p>
            </div>
            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center mb-4 text-white">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Seguridad Antirrobo</h3>
              <p className="text-sm text-slate-500">Registro detallado de cancelaciones de tickets y apertura de cajón. Audita acciones sospechosas.</p>
            </div>
            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mb-4 text-white">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Caja y Facturación</h3>
              <p className="text-sm text-slate-500">Cierre de caja asistido con conteo de billetes. Reportes claros de ganancia bruta y neta diaria.</p>
            </div>
            {/* Feature 6 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-4 text-white">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Control Remoto</h3>
              <p className="text-sm text-slate-500">Accede a las métricas de tu negocio desde tu celular en tiempo real, estés donde estés.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- NEW SECURITY & ROLES SECTION --- */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-900/50 border border-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-xs font-bold mb-6">
                <ShieldCheck className="w-3 h-3" />
                SEGURIDAD AVANZADA
              </div>
              <h2 className="text-3xl lg:text-4xl font-black mb-6">
                Tu Negocio, <br />
                <span className="text-blue-400">Tus Reglas</span>
              </h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                No todos los empleados necesitan ver tus ganancias o modificar el stock.
                Con nuestro sistema de roles granulares, tú decides exactamente qué puede hacer cada uno.
              </p>

              <div className="space-y-6">
                {/* Item 1 */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-slate-700">
                    <UserCog className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">Roles Personalizables</h4>
                    <p className="text-slate-400 text-sm">Crea perfiles como "Cajero", "Repositor" o "Gerente". Asigna permisos con un solo clic.</p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-slate-700">
                    <EyeOff className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">Protección de Rentabilidad</h4>
                    <p className="text-slate-400 text-sm">Oculta los costos reales y márgenes de ganancia. Evita que la información sensible salga de tu negocio.</p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-slate-700">
                    <Lock className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">Candado Digital</h4>
                    <p className="text-slate-400 text-sm">Bloquea funciones críticas: anular ventas, cambiar precios o eliminar productos sin autorización.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Representation */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl relative">
              <div className="absolute -top-4 -right-4 bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transform rotate-2">
                ¡Control Total!
              </div>

              {/* Fake UI: Settings Permissions */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white">JP</div>
                    <div>
                      <p className="font-bold text-white">Juan Pérez</p>
                      <p className="text-xs text-slate-400">Puesto: Cajero</p>
                    </div>
                  </div>
                  <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">Empleado</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-sm text-slate-300">Acceso a Caja (Cobrar)</span>
                    <div className="w-10 h-5 bg-emerald-500 rounded-full relative"><div className="w-3 h-3 bg-white rounded-full absolute right-1 top-1"></div></div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg opacity-75">
                    <span className="text-sm text-slate-300">Ver Costos y Márgenes</span>
                    <div className="w-10 h-5 bg-slate-600 rounded-full relative"><div className="w-3 h-3 bg-white rounded-full absolute left-1 top-1"></div></div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg opacity-75">
                    <span className="text-sm text-slate-300">Eliminar Productos</span>
                    <div className="w-10 h-5 bg-slate-600 rounded-full relative"><div className="w-3 h-3 bg-white rounded-full absolute left-1 top-1"></div></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* --- BUSINESS TYPES SECTION --- */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">Ideal para tu tipo de negocio</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              GestionNow se adapta perfectamente a las necesidades específicas de cada comercio local
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Kiosco */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 text-white">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Kioscos</h3>
              <p className="text-sm text-slate-600">Control de golosinas, bebidas, cigarrillos. Alertas de vencimiento y stock bajo.</p>
            </div>

            {/* Carnicería */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mb-4 text-white">
                <Box className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Carnicerías</h3>
              <p className="text-sm text-slate-600">Venta por peso, control de cortes, gestión de cámara frigorífica y proveedores.</p>
            </div>

            {/* Pollería */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-2xl border border-amber-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center mb-4 text-white">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Pollerías</h3>
              <p className="text-sm text-slate-600">Pesaje automático, control de productos frescos, gestión de pedidos y entregas.</p>
            </div>

            {/* Almacén */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-4 text-white">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Almacenes</h3>
              <p className="text-sm text-slate-600">Inventario amplio, múltiples categorías, control de fiados y cuentas corrientes.</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-slate-600 mb-6">
              <strong>También ideal para:</strong> Verdulerías, Panaderías, Despensas, Dietéticas, Perfumerías y más
            </p>
            <button onClick={onGoToLogin} className="bg-blue-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 transition-all shadow-lg">
              Comenzar Ahora Gratis
            </button>
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">Planes Transparentes</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Sin costos ocultos ni comisiones por venta. Elige el plan que se adapte a tu etapa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">

            {/* Plan Inicial */}
            <div className="border border-slate-200 rounded-3xl p-8 hover:shadow-xl transition-shadow bg-white h-full flex flex-col">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Inicial</h3>
              <p className="text-sm text-slate-500 mb-6">Para pequeños quioscos familiares.</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black text-slate-900">$9.999</span>
                <span className="text-slate-500">/mes</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" /> Ventas ilimitadas
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" /> Control de Stock básico
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" /> 1 Usuario
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" /> Reportes mensuales
                </li>
              </ul>
              <button onClick={onGoToLogin} className="w-full py-3 rounded-xl border-2 border-slate-200 font-bold text-slate-600 hover:border-blue-600 hover:text-blue-600 transition-colors">
                Suscribirse
              </button>
            </div>

            {/* Plan Profesional */}
            <div className="relative bg-[#0f172a] rounded-3xl p-8 shadow-2xl transform scale-105 border border-slate-800 z-10 h-full flex flex-col">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg shadow-emerald-500/20">
                Más Popular
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Profesional</h3>
              <p className="text-sm text-slate-400 mb-6">Para negocios en crecimiento.</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black text-white">$13.999</span>
                <span className="text-slate-400">/mes</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-white">
                  <div className="bg-emerald-500 rounded-full p-0.5"><Check className="w-3 h-3 text-white" /></div> Todo lo de Inicial
                </li>
                <li className="flex items-center gap-3 text-sm text-white">
                  <div className="bg-emerald-500 rounded-full p-0.5"><Check className="w-3 h-3 text-white" /></div> Integración Mercado Pago
                </li>
                <li className="flex items-center gap-3 text-sm text-white">
                  <div className="bg-emerald-500 rounded-full p-0.5"><Check className="w-3 h-3 text-white" /></div> Alertas de Vencimiento
                </li>
                <li className="flex items-center gap-3 text-sm text-white">
                  <div className="bg-emerald-500 rounded-full p-0.5"><Check className="w-3 h-3 text-white" /></div> 3 Usuarios + Auditoría
                </li>
              </ul>
              <button onClick={onGoToLogin} className="w-full py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-900/20">
                Comenzar Ahora
              </button>
            </div>

            {/* Plan Ultimate */}
            <div className="border border-slate-200 rounded-3xl p-8 hover:shadow-xl transition-shadow bg-white h-full flex flex-col">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Ultimate</h3>
              <p className="text-sm text-slate-500 mb-6">Para cadenas o grandes almacenes.</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black text-slate-900">$29.999</span>
                <span className="text-slate-500">/mes</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" /> Todo lo de Profesional
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" /> Asistente IA Full
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" /> Multisucursal
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" /> API para E-commerce
                </li>
              </ul>
              <button onClick={onGoToLogin} className="w-full py-3 rounded-xl border-2 border-slate-200 font-bold text-slate-600 hover:border-blue-600 hover:text-blue-600 transition-colors">
                Contactar Ventas
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section id="testimonials" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">Comerciantes que confían</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex text-yellow-400 mb-4">
                <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-slate-600 text-sm italic mb-6">
                "Antes perdía mucha plata con mercadería vencida. El sistema de alertas me salvó. Ahora sé exactamente qué vender primero."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
                  <img src="https://i.pravatar.cc/150?u=1" alt="User" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Carlos Méndez</p>
                  <p className="text-xs text-slate-500">Dueño de 'El Paso'</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex text-yellow-400 mb-4">
                <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-slate-600 text-sm italic mb-6">
                "La integración con Mercado Pago es un golazo. Ya no tengo que tipear el monto en el posnet, sale directo en pantalla y evito errores."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
                  <img src="https://i.pravatar.cc/150?u=2" alt="User" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Laura Gómez</p>
                  <p className="text-xs text-slate-500">Maxikiosco 'La Esquina'</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex text-yellow-400 mb-4">
                <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-slate-600 text-sm italic mb-6">
                "Lo mejor es la auditoría. Descubrí que un empleado me cancelaba tickets. Gestion Now se pagó solo el primer mes."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
                  <img src="https://i.pravatar.cc/150?u=3" alt="User" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Roberto Fernández</p>
                  <p className="text-xs text-slate-500">Drugstore 24hs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA FOOTER --- */}
      <section className="bg-blue-900 py-20 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <h2 className="text-4xl font-black mb-6">¿Listo para tener el control total?</h2>
          <p className="text-blue-100 mb-10 text-lg">Únete a más de 500 comercios que ya modernizaron su gestión.</p>
          <button
            onClick={onGoToLogin}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-5 rounded-xl font-bold text-xl shadow-xl shadow-blue-900/50 transition-transform hover:scale-105"
          >
            Obtener Gestion Now Ahora <ArrowRight className="inline-block ml-2 w-6 h-6" />
          </button>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="font-bold text-white text-xl mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-500" /> GestionNow
            </div>
            <p className="text-sm">El sistema operativo para el comercio moderno.</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Producto</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Funcionalidades</a></li>
              <li><a href="#" className="hover:text-white">Precios</a></li>
              <li><a href="#" className="hover:text-white">Integraciones</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Términos y Condiciones</a></li>
              <li><a href="#" className="hover:text-white">Privacidad</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm">
              <li>hola@gestionnow.site</li>
              <li>
                <a href="https://wa.me/5491136763357" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                  <MessageCircle className="w-4 h-4" /> +54 11 3676-3357
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/gestion.now/?hl=es-la" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Instagram className="w-4 h-4" /> Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-xs text-center">
          © {new Date().getFullYear()} Gestion Now. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};