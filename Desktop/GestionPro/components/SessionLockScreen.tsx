import React from 'react';
import { Lock } from 'lucide-react';

interface SessionLockScreenProps {
    onNavigateToCash: () => void;
}

export const SessionLockScreen: React.FC<SessionLockScreenProps> = ({ onNavigateToCash }) => {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-gray-100 p-6 rounded-full">
                <Lock className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Caja Cerrada</h2>
            <p className="text-gray-500 max-w-xs">No se pueden realizar ventas sin un turno activo. Por favor abra la caja.</p>
            <button
                onClick={onNavigateToCash}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
                Ir a Apertura de Caja
            </button>
        </div>
    );
};
