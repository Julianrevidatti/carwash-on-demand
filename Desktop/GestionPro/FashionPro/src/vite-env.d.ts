/// <reference types="vite/client" />

interface ElectronAPI {
    db: {
        query: (sql: string, params?: any[]) => Promise<any[]>;
        run: (sql: string, params?: any[]) => Promise<any>;
        get: (sql: string, params?: any[]) => Promise<any>;
        transaction: (operations: { sql: string; params?: any[] }[]) => Promise<{ success: boolean }>;
    };
    app: {
        getVersion: () => Promise<string>;
        getPath: (name: string) => Promise<string>;
    };
    printer: {
        getPrinters: () => Promise<any[]>;
        print: (html: string, printerName?: string) => Promise<{ success: boolean; error?: string }>;
    };
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
