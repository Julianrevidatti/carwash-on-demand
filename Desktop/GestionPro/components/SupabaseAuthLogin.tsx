import React, { useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { Loader2, Mail, Lock, LogIn, UserPlus, ArrowRight, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { TermsAndConditionsModal } from './TermsAndConditionsModal';

export const SupabaseAuthLogin: React.FC = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<{ title: string; message: string } | null>(null);

    // Terms & Conditions Logic
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (isSignUp && password !== confirmPassword) {
            const errorData = {
                title: 'Las contraseñas no coinciden',
                message: 'Por favor verifica que ambas contraseñas sean iguales.'
            };
            setError(errorData);
            toast.error(errorData.title, {
                description: errorData.message
            });
            return;
            return;
        }

        if (isSignUp && !acceptedTerms) {
            toast.error("Debes aceptar los Términos y Condiciones", {
                description: "Por favor marca la casilla para continuar."
            });
            return;
        }

        setLoading(true);

        try {
            if (isForgotPassword) {
                // Password reset
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                });

                if (error) throw error;

                toast.success('Email enviado', {
                    description: 'Revisa tu correo para resetear tu contraseña.'
                });
                setIsForgotPassword(false);
            } else if (isSignUp) {
                // Sign up
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    }
                });

                if (error) throw error;

                toast.success('¡Cuenta creada!', {
                    description: 'Revisa tu email para verificar su cuenta. Tienes 7 días de prueba gratis.'
                });
            } else {
                // Sign in
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                toast.success('¡Bienvenido de nuevo!', {
                    description: 'Has iniciado sesión correctamente.'
                });
            }
        } catch (err: any) {
            console.error('Auth error:', err);

            let errorTitle = 'Error de autenticación';
            let errorMessage = err.message || 'Ocurrió un error inesperado.';

            // Mensajes específicos
            if (err.message?.includes('Invalid login credentials')) {
                errorTitle = 'Credenciales inválidas';
                errorMessage = 'El email o la contraseña son incorrectos.';
            } else if (err.message?.includes('Email not confirmed')) {
                errorTitle = 'Email no verificado';
                errorMessage = 'Por favor verifica tu email antes de iniciar sesión.';
            } else if (err.message?.includes('User already registered')) {
                errorTitle = 'Email ya registrado';
                errorMessage = 'Ya existe una cuenta con este email.';
            } else if (err.message?.includes('Password should be at least')) {
                errorTitle = 'Contraseña muy corta';
                errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
            }

            setError({ title: errorTitle, message: errorMessage });
            toast.error(errorTitle, {
                description: errorMessage,
                duration: 5000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                }
            });

            if (error) throw error;
        } catch (err: any) {
            console.error('Google login error:', err);
            toast.error('Error con Google', {
                description: err.message || 'No se pudo iniciar sesión con Google.'
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden">
            <TermsAndConditionsModal
                isOpen={showTermsModal}
                onClose={() => setShowTermsModal(false)}
            />
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                            <LogIn className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {isForgotPassword ? 'Recuperar Contraseña' : isSignUp ? 'Prueba Gratis 7 Días' : 'Bienvenido'}
                        </h1>
                        <p className="text-slate-400">
                            {isForgotPassword
                                ? 'Te enviaremos un link para resetear tu contraseña'
                                : isSignUp
                                    ? 'Registra tu negocio en GestionPro'
                                    : 'Inicia sesión en tu cuenta'
                            }
                        </p>
                    </div>

                    {/* Google Login */}
                    {!isForgotPassword && (
                        <div className="mb-6">
                            <button
                                onClick={handleGoogleLogin}
                                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continuar con Google
                            </button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-700"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-[#0f172a] text-slate-500">O continúa con email</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-start gap-3">
                                <div className="bg-red-500/20 p-1.5 rounded-full mt-0.5 flex-shrink-0">
                                    <AlertTriangle className="w-4 h-4 text-red-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-red-200 font-bold text-sm mb-1">{error.title}</h4>
                                    <p className="text-red-300/80 text-xs leading-relaxed">{error.message}</p>
                                </div>
                                <button
                                    onClick={() => setError(null)}
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                    type="button"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="tu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        {!isForgotPassword && (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Contraseña</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                        )}

                        {isSignUp && !isForgotPassword && (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirmar Contraseña</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                        )}

                        {!isForgotPassword && (
                            <div className="flex items-center justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsForgotPassword(true)}
                                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        )}

                        {isSignUp && !isForgotPassword && (
                            <div className="flex items-start gap-3 p-3 bg-slate-900/30 rounded-lg border border-slate-700/50">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-slate-800"
                                />
                                <label htmlFor="terms" className="text-sm text-slate-300 select-none">
                                    He leído y acepto los <button type="button" onClick={() => setShowTermsModal(true)} className="text-blue-400 hover:text-blue-300 underline font-medium">Términos y Condiciones</button> del servicio.
                                    <span className="block text-xs text-slate-500 mt-1">Es obligatorio para registrarse.</span>
                                </label>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    {isForgotPassword ? (
                                        <>
                                            Enviar Link
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    ) : isSignUp ? (
                                        <>
                                            <UserPlus className="w-5 h-5" />
                                            Crear Cuenta
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="w-5 h-5" />
                                            Iniciar Sesión
                                        </>
                                    )}
                                </>
                            )}
                        </button>
                    </form>

                    {!isForgotPassword && (
                        <div className="mt-6 text-center">
                            <p className="text-slate-400 text-sm">
                                {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                                <button
                                    onClick={() => {
                                        setIsSignUp(!isSignUp);
                                        setError(null);
                                    }}
                                    className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                >
                                    {isSignUp ? 'Inicia sesión' : 'Regístrate'}
                                </button>
                            </p>
                        </div>
                    )}

                    {isForgotPassword && (
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => {
                                    setIsForgotPassword(false);
                                    setError(null);
                                }}
                                className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
                                type="button"
                            >
                                ← Volver al inicio de sesión
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-slate-500 text-sm mt-6">
                    Powered by Supabase Auth
                </p>
            </div>
        </div>
    );
};
