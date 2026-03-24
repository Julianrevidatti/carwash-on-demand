const { contextBridge, ipcRenderer } = require('electron');

console.log('🚀 Preload script starting...');

try {

    // Expose protected methods that allow the renderer process to use
    // the ipcRenderer without exposing the entire object
    contextBridge.exposeInMainWorld('electronAPI', {
        // Database operations
        db: {
            query: (sql: string, params?: any[]) => ipcRenderer.invoke('db:query', sql, params),
            run: (sql: string, params?: any[]) => ipcRenderer.invoke('db:run', sql, params),
            get: (sql: string, params?: any[]) => ipcRenderer.invoke('db:get', sql, params),
            transaction: (operations: { sql: string; params?: any[] }[]) =>
                ipcRenderer.invoke('db:transaction', operations)
        },

        // App info
        app: {
            getVersion: () => ipcRenderer.invoke('app:getVersion'),
            getPath: (name: string) => ipcRenderer.invoke('app:getPath', name)
        },

        // Printer
        printer: {
            getPrinters: () => ipcRenderer.invoke('printer:getPrinters'),
            print: (html: string, printerName?: string) =>
                ipcRenderer.invoke('printer:print', html, printerName)
        }
    });

    console.log('✅ Preload script loaded correctly, electronAPI exposed.');
} catch (error) {
    console.error('❌ Preload script error:', error);
}

module.exports = {};
