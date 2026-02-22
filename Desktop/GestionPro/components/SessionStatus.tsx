import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Tablet, RefreshCw, CheckCircle, XCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { sessionManager } from '../src/lib/sessionManager';

interface SessionStatusProps {
    isCompact?: boolean;
}

export const SessionStatus: React.FC<SessionStatusProps> = ({ isCompact = false }) => {
    const [sessionValid, setSessionValid] = useState<boolean>(false);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

    // Check session status periodically
    useEffect(() => {
        const checkSession = async () => {
            const valid = await sessionManager.verifySession();
            setSessionValid(valid);
            setLastRefresh(new Date());
        };

        checkSession();
        const interval = setInterval(checkSession, 60000); // Check every minute

        return () => clearInterval(interval);
    }, []);

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        const success = await sessionManager.forceRefresh();
        setSessionValid(success);
        setLastRefresh(new Date());
        setIsRefreshing(false);
    };

    const getTimeSinceRefresh = () => {
        const seconds = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h`;
    };

    if (isCompact) {
        return (
            <div className="flex items-center gap-2">
                {sessionValid ? (
                    <div className="flex items-center gap-1 text-green-600">
                        <Wifi className="w-4 h-4" />
                        <span className="text-xs font-medium">Conectado</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-red-600">
                        <WifiOff className="w-4 h-4" />
                        <span className="text-xs font-medium">Desconectado</span>
                    </div>
                )}
                <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Refrescar sesión"
                >
                    <RefreshCw className={`w-3 h-3 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-blue-600" />
                    Estado de Sesión
                </h3>
                <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="text-sm font-medium">Refrescar</span>
                </button>
            </div>

            <div className="space-y-3">
                {/* Session Status */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        {sessionValid ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                            <p className="text-sm font-medium text-gray-800">
                                {sessionValid ? 'Sesión Activa' : 'Sesión Inactiva'}
                            </p>
                            <p className="text-xs text-gray-500">
                                {sessionValid
                                    ? 'Tu sesión está sincronizada en todos tus dispositivos'
                                    : 'Intenta refrescar la sesión'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Last Refresh */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="text-sm font-medium text-gray-800">Última Actualización</p>
                            <p className="text-xs text-gray-500">
                                Hace {getTimeSinceRefresh()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Multi-Device Info */}
                <div className="border-t border-gray-200 pt-3 mt-3">
                    <p className="text-xs text-gray-600 mb-2 font-medium">Acceso Multi-Dispositivo Habilitado</p>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-xs text-blue-700">
                            <Monitor className="w-3 h-3" />
                            PC
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-xs text-blue-700">
                            <Smartphone className="w-3 h-3" />
                            Móvil
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-xs text-blue-700">
                            <Tablet className="w-3 h-3" />
                            Tablet
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Puedes acceder a tu cuenta desde cualquier dispositivo.
                        Tu sesión se sincroniza automáticamente cada 45 minutos.
                    </p>
                </div>

                {/* Auto-Refresh Toggle */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        <span className="text-sm font-medium text-gray-800">
                            Actualización Automática
                        </span>
                    </div>
                    <span className="text-xs text-gray-600">
                        {autoRefreshEnabled ? 'Activa' : 'Inactiva'}
                    </span>
                </div>
            </div>
        </div>
    );
};
