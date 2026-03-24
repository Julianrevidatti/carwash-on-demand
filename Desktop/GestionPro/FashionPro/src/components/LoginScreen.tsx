import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Package, AlertCircle } from 'lucide-react';
import { userDB } from '../services/dbService';
import { toast } from 'sonner';

interface LoginScreenProps {
    onLogin: (username: string, password: string) => Promise<boolean>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Recovery State
    const [isRecovering, setIsRecovering] = useState(false);
    const [recoveryStep, setRecoveryStep] = useState<1 | 2 | 3>(1); // 1: Username, 2: Question, 3: New Password
    const [recoveryUser, setRecoveryUser] = useState<any>(null);
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRecoveryFlow = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (recoveryStep === 1) {
                if (!username) { setError('Ingresá tu usuario primero'); return; }
                const users = await userDB.getAll();
                const user = users.find((u: any) => u.username === username);
                if (!user) { setError('Usuario no encontrado'); return; }
                if (!user.securityQuestion) {
                    setError('Ese usuario no configuró su pregunta de seguridad. Pedile al Administrador que resetee tu clave.');
                    return;
                }
                setRecoveryUser(user);
                setRecoveryStep(2);
            } else if (recoveryStep === 2) {
                if (!securityAnswer) { setError('Ingresá la respuesta'); return; }
                if (securityAnswer.trim().toLowerCase() !== recoveryUser.securityAnswer?.trim().toLowerCase()) {
                    setError('Respuesta incorrecta');
                    return;
                }
                setRecoveryStep(3);
            } else if (recoveryStep === 3) {
                if (!newPassword || newPassword !== confirmPassword) {
                    setError('Las contraseñas no coinciden');
                    return;
                }
                await userDB.updatePassword(recoveryUser.id, newPassword);
                toast.success('¡Contraseña recuperada exitosamente! Ya podés ingresar.');
                resetRecovery();
            }
        } catch (err: any) {
            setError('Error: ' + err.message);
        }
    };

    const resetRecovery = () => {
        setIsRecovering(false);
        setRecoveryStep(1);
        setRecoveryUser(null);
        setSecurityAnswer('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await onLogin(username, password);
            if (!success) {
                setError('Usuario o contraseña incorrectos');
            }
        } catch (err: any) {
            setError('Error: ' + (err.message || 'Desconocido'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
            padding: '20px'
        }}>
            <div className="animate-fadeIn" style={{
                width: '100%',
                maxWidth: '420px',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                padding: '48px 40px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 100px rgba(99, 102, 241, 0.1)'
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)'
                    }}>
                        <Package size={36} color="white" />
                    </div>
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #0f172a, #6366f1)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.5px'
                    }}>
                        FashionPro
                    </h1>
                    <p style={{ color: '#000000', fontSize: '14px', marginTop: '4px' }}>
                        Control de Stock y Ventas
                    </p>
                </div>

                {isRecovering ? (
                    <form onSubmit={handleRecoveryFlow}>
                        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                            <AlertCircle size={32} color="#6366f1" style={{ margin: '0 auto 12px' }} />
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#000000', marginBottom: '8px' }}>Recuperar Contraseña</h3>
                        </div>

                        {recoveryStep === 1 && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#000000', marginBottom: '6px' }}>
                                    Paso 1: ¿Cuál es tu usuario?
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="admin"
                                    style={{
                                        width: '100%', padding: '12px 14px', background: 'rgba(248, 250, 252, 0.6)',
                                        border: '1px solid #000000', borderRadius: '12px', color: '#000000', fontSize: '15px'
                                    }}
                                />
                            </div>
                        )}

                        {recoveryStep === 2 && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#6366f1', marginBottom: '6px' }}>
                                    {recoveryUser?.securityQuestion}
                                </label>
                                <input
                                    type="password"
                                    value={securityAnswer}
                                    onChange={(e) => setSecurityAnswer(e.target.value)}
                                    placeholder="Respuesta secreta..."
                                    style={{
                                        width: '100%', padding: '12px 14px', background: 'rgba(248, 250, 252, 0.6)',
                                        border: '1px solid #000000', borderRadius: '12px', color: '#000000', fontSize: '15px'
                                    }}
                                />
                            </div>
                        )}

                        {recoveryStep === 3 && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#000000', marginBottom: '6px' }}>Nueva Contraseña</label>
                                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '12px 14px', background: 'rgba(248, 250, 252, 0.6)', border: '1px solid #000000', borderRadius: '12px', color: '#000000', fontSize: '15px', marginBottom: '12px' }} />
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#000000', marginBottom: '6px' }}>Confirmar Contraseña</label>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '12px 14px', background: 'rgba(248, 250, 252, 0.6)', border: '1px solid #000000', borderRadius: '12px', color: '#000000', fontSize: '15px' }} />
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', color: '#ef4444', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="submit" style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
                                Continuar
                            </button>
                            <button type="button" onClick={resetRecovery} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid #6366f1', borderRadius: '12px', color: '#6366f1', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* Username */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#000000', marginBottom: '6px' }}>
                                Usuario
                            </label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#000000' }} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="admin"
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px 12px 42px',
                                        background: 'rgba(248, 250, 252, 0.6)',
                                        border: '1px solid #000000',
                                        borderRadius: '12px',
                                        color: '#000000',
                                        fontSize: '15px',
                                        transition: 'all 0.2s'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#000000', marginBottom: '6px' }}>
                                Contraseña
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#000000' }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '12px 42px 12px 42px',
                                        background: 'rgba(248, 250, 252, 0.6)',
                                        border: '1px solid #000000',
                                        borderRadius: '12px',
                                        color: '#000000',
                                        fontSize: '15px',
                                        transition: 'all 0.2s'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#000000',
                                        padding: '4px'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div style={{
                                padding: '10px 14px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '10px',
                                color: '#ef4444',
                                fontSize: '13px',
                                marginBottom: '16px',
                                textAlign: 'center'
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !username || !password}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: loading ? '#4f46e5' : 'linear-gradient(135deg, #6366f1, #7c3aed)',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '15px',
                                fontWeight: '600',
                                cursor: loading ? 'wait' : 'pointer',
                                opacity: (!username || !password) ? 0.5 : 1,
                                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                                transition: 'all 0.2s',
                                marginBottom: '16px'
                            }}
                        >
                            {loading ? 'Ingresando...' : 'Ingresar'}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setError(''); setIsRecovering(true); }}
                            style={{
                                width: '100%',
                                background: 'none',
                                border: 'none',
                                color: '#6366f1',
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </form>
                )}

                {/* Default credentials hint */}
                <div style={{
                    marginTop: '24px',
                    padding: '12px',
                    background: 'rgba(99, 102, 241, 0.05)',
                    borderRadius: '10px',
                    border: '1px solid rgba(99, 102, 241, 0.1)',
                    textAlign: 'center'
                }}>
                    <p style={{ color: '#000000', fontSize: '12px' }}>
                        Credenciales por defecto: <strong style={{ color: '#000000' }}>admin / admin123</strong>
                    </p>
                </div>

                {/* Version */}
                <p style={{ textAlign: 'center', color: '#000000', fontSize: '11px', marginTop: '20px' }}>
                    FashionPro v1.0.0 — Software de Gestión Comercial
                </p>
            </div>
        </div>
    );
};
