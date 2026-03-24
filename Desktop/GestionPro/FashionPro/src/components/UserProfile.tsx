import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Shield, Key, Lock, Check } from 'lucide-react';
import { toast } from 'sonner';
import { userDB } from '../services/dbService';

export const UserProfile: React.FC = () => {
    const currentUser = useStore(s => s.currentUser);
    const fetchSystemUsers = useStore(s => s.fetchSystemUsers);

    // Form fields
    const [name, setName] = useState(currentUser?.name || '');
    const [username, setUsername] = useState(currentUser?.username || '');

    // Password change
    const [changingPassword, setChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Security question
    const [securityQuestion, setSecurityQuestion] = useState(currentUser?.securityQuestion || '');
    const [securityAnswer, setSecurityAnswer] = useState(currentUser?.securityAnswer || '');

    // Common styles
    const cardStyle: React.CSSProperties = { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '20px' };
    const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#000000', fontSize: '14px', marginTop: '6px' };
    const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#000000', marginBottom: '4px' };

    const handleSaveProfile = async () => {
        if (!currentUser) return;
        try {
            // Re-fetch user to get current state from DB
            const dbUsers = await userDB.getAll();
            const dbUser = dbUsers.find((u: any) => u.id === currentUser.id);
            if (!dbUser) throw new Error('Usuario no encontrado');

            await userDB.update({
                id: currentUser.id,
                username: username,
                name: name,
                role: currentUser.role,
                pin: currentUser.pin,
                securityQuestion: securityQuestion,
                securityAnswer: securityAnswer
            });
            await fetchSystemUsers();

            // Reload the local session to update state (simplification of re-login)
            useStore.getState().setCurrentUser({
                ...currentUser,
                name,
                username,
                securityQuestion,
                securityAnswer
            });

            toast.success('Perfil actualizado correctamente');
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar perfil');
        }
    };

    const handleChangePassword = async () => {
        if (!currentUser) return;
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Todos los campos son obligatorios');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Las contraseñas nuevas no coinciden');
            return;
        }

        try {
            // Verify current password is correct by trying to "login" with it
            const isValid = await userDB.getByCredentials(currentUser.username, currentPassword);
            if (!isValid) {
                toast.error('La contraseña actual es incorrecta');
                return;
            }

            await userDB.updatePassword(currentUser.id, newPassword);
            toast.success('Contraseña cambiada exitosamente');
            setChangingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error(error);
            toast.error('Error al cambiar la contraseña');
        }
    };

    if (!currentUser) return null;

    return (
        <div style={{ maxWidth: '600px', margin: '0' }} className="animate-fadeIn">

            <div style={cardStyle}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#000000', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={18} style={{ color: '#6366f1' }} />
                    Datos Personales
                </h3>

                <div style={{ display: 'grid', gap: '16px' }}>
                    <div>
                        <label style={labelStyle}>Nombre Completo</label>
                        <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Tu nombre" />
                    </div>
                    <div>
                        <label style={labelStyle}>Nombre de Usuario (Login)</label>
                        <input value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} placeholder="Usuario" />
                    </div>
                </div>
            </div>

            <div style={cardStyle}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#000000', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Key size={18} style={{ color: '#10b981' }} />
                    Pregunta de Seguridad (Recuperación)
                </h3>
                <p style={{ fontSize: '13px', color: '#000000', marginBottom: '16px' }}>
                    Si olvidás tu contraseña, podrás recuperarla contestando esta pregunta secreta.
                </p>
                <div style={{ display: 'grid', gap: '16px' }}>
                    <div>
                        <label style={labelStyle}>Pregunta Secreta ("¿Nombre de mi primer mascota?")</label>
                        <input value={securityQuestion} onChange={e => setSecurityQuestion(e.target.value)} style={inputStyle} placeholder="Escribe una pregunta que solo vos sepas" />
                    </div>
                    <div>
                        <label style={labelStyle}>Respuesta Secreta</label>
                        <input value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)} style={inputStyle} placeholder="Firu" type="password" />
                    </div>
                </div>
            </div>

            <button onClick={handleSaveProfile}
                style={{ marginBottom: '24px', padding: '12px 20px', borderRadius: '10px', border: 'none', background: '#6366f1', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={18} /> Guardar Perfil y Seguridad
            </button>

            <div style={{ ...cardStyle, border: '1px solid #fee2e2' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#ef4444', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={18} />
                    Cambiar Contraseña
                </h3>

                {!changingPassword ? (
                    <button onClick={() => setChangingPassword(true)}
                        style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#000000', color: '#000000', fontWeight: '500', cursor: 'pointer' }}>
                        Modificar Contraseña Actual
                    </button>
                ) : (
                    <div style={{ display: 'grid', gap: '16px', background: '#fef2f2', padding: '16px', borderRadius: '10px', border: '1px dashed #fca5a5' }}>
                        <div>
                            <label style={labelStyle}>Contraseña Actual</label>
                            <input value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type="password" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Nueva Contraseña</label>
                            <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Confirmar Nueva Contraseña</label>
                            <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" style={inputStyle} />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                            <button onClick={handleChangePassword}
                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '500', cursor: 'pointer' }}>
                                Confirmar Cambio
                            </button>
                            <button onClick={() => { setChangingPassword(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#000000', color: '#000000', fontWeight: '500', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div style={{ paddingBottom: '300px' }}></div>
        </div>
    );
};
