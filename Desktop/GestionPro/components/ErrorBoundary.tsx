import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 border border-red-100">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <AlertTriangle className="w-8 h-8" />
                            <h1 className="text-2xl font-bold">Algo salió mal</h1>
                        </div>
                        <p className="text-gray-600 mb-4">
                            La aplicación ha encontrado un error inesperado.
                        </p>
                        <div className="bg-gray-100 p-4 rounded text-xs font-mono overflow-auto max-h-48 mb-6">
                            <p className="font-bold text-red-800">{this.state.error?.toString()}</p>
                            <p className="text-gray-500 mt-2 whitespace-pre-wrap">
                                {this.state.errorInfo?.componentStack}
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                        >
                            Recargar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
