import React, { useState } from 'react';
import { User } from '../types';
import { Lock, User as UserIcon, Delete, ChevronLeft } from 'lucide-react';

interface OperatorLockScreenProps {
    users: User[];
    onUnlock: (user: User) => void;
}

export const OperatorLockScreen: React.FC<OperatorLockScreenProps> = ({ users, onUnlock }) => {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    console.log("OperatorLockScreen received users:", users);

    // Filter out system owner if needed, or include everyone. Only users with PINs can really use this efficiently.

    // Filter out system owner if needed, or include everyone. Only users with PINs can really use this efficiently.
    // Include all users. If no PIN, we might handle it or show them anyway.
    const validUsers = users || [];

    const handleNumClick = (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            setError(false);

            if (newPin.length === 4) {
                verifyPin(newPin);
            }
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError(false);
    };

    const verifyPin = (enteredPin: string) => {
        if (selectedUser && (selectedUser.pin === enteredPin || (!selectedUser.pin && enteredPin === '0000'))) {
            onUnlock(selectedUser);
        } else {
            setError(true);
            setTimeout(() => setPin(''), 500);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900 z-[9999] flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
            <div className="mb-10 text-center">
                <div className="bg-slate-800 p-4 rounded-full inline-flex mb-4 relative">
                    <Lock className="w-8 h-8 text-blue-400" />
                    {selectedUser && (
                        <button
                            onClick={() => { setSelectedUser(null); setPin(''); }}
                            className="absolute -left-16 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white flex items-center gap-1 text-xs"
                        >
                            <ChevronLeft className="w-4 h-4" /> Volver
                        </button>
                    )}
                </div>
                <h1 className="text-3xl font-bold mb-2">
                    {selectedUser ? `Hola, ${selectedUser.name}` : 'Sistema Bloqueado'}
                </h1>
                <p className="text-slate-400">
                    {selectedUser ? 'Ingresa tu PIN personal para continuar' : 'Selecciona tu usuario'}
                </p>
            </div>

            {!selectedUser ? (
                // User Selection Grid
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-2xl w-full px-4">
                    {validUsers.length === 0 && (
                        <div className="col-span-full text-center p-8 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                            <p className="text-slate-400 mb-2">No se encontraron usuarios.</p>
                            <p className="text-xs text-slate-500 mb-4">La lista de usuarios está vacía.</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Recargar Sistema
                            </button>
                        </div>
                    )}
                    {/* Emergency Fallback for Stuck Owner */}
                    {validUsers.length === 0 && (
                        <div className="absolute bottom-10 left-0 right-0 text-center">
                            <p className="text-slate-500 text-xs mb-2">¿Eres el dueño y estás bloqueado?</p>
                            <button
                                onClick={() => {
                                    // Bypass: assume the parent passed a way to handle this, or trigger a refresh.
                                    // Since we don't have direct access to 'currentUser' here unless passed in 'users'.
                                    // If 'users' is empty, we are stuck.
                                    // Force a reload as best effort.
                                    window.location.reload();
                                }}
                                className="text-white underline text-sm"
                            >
                                Forzar Recarga
                            </button>
                        </div>
                    )}
                    {validUsers.map(user => (
                        <button
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-6 rounded-2xl flex flex-col items-center gap-3 transition-all hover:scale-105 active:scale-95 group"
                        >
                            <div className="w-16 h-16 bg-slate-700 group-hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
                                <span className="text-xl font-bold text-slate-300 group-hover:text-white">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <span className="font-semibold text-lg">{user.name}</span>
                        </button>
                    ))}
                </div>
            ) : (
                // Keypad
                <div className="w-full max-w-xs animate-in slide-in-from-bottom-5">
                    {/* PIN Dots */}
                    <div className="flex justify-center gap-4 mb-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-full transition-all duration-300 ${pin.length >= i
                                    ? error ? 'bg-red-500 scale-125' : 'bg-blue-500 scale-110'
                                    : 'bg-slate-700'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Keys */}
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button
                                key={num}
                                onClick={() => handleNumClick(num.toString())}
                                className="h-20 bg-slate-800/50 hover:bg-slate-700 active:bg-slate-600 rounded-2xl text-2xl font-bold border border-slate-700 transition-all flex items-center justify-center"
                            >
                                {num}
                            </button>
                        ))}
                        <div className="h-20"></div> {/* Spacer */}
                        <button
                            onClick={() => handleNumClick('0')}
                            className="h-20 bg-slate-800/50 hover:bg-slate-700 active:bg-slate-600 rounded-2xl text-2xl font-bold border border-slate-700 transition-all flex items-center justify-center"
                        >
                            0
                        </button>
                        <button
                            onClick={handleDelete}
                            className="h-20 hover:text-red-400 active:scale-95 transition-all flex items-center justify-center rounded-2xl"
                        >
                            <Delete className="w-8 h-8" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
