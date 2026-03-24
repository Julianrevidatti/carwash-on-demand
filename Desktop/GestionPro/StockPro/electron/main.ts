import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, getDatabase, saveDatabase } from './database/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 700,
        title: 'StockPro - Control de Stock y Ventas',
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true
        },
        autoHideMenuBar: true,
        show: false
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
        mainWindow?.webContents.openDevTools();
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Initialize
app.whenReady().then(async () => {
    await initDatabase();
    setupIpcHandlers();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Save database before quit
app.on('before-quit', () => {
    try {
        saveDatabase();
        console.log('💾 Database saved on quit');
    } catch (e) {
        console.error('Error saving database on quit:', e);
    }
});

// ============================================================
// IPC HANDLERS - Bridge between renderer and sql.js
// ============================================================
function setupIpcHandlers() {
    // Query: returns array of objects
    ipcMain.handle('db:query', (_event, sql: string, params?: any[]) => {
        try {
            const db = getDatabase();

            if (params && params.length > 0) {
                // Use prepared statement for parameterized queries
                const stmt = db.prepare(sql);
                stmt.bind(params);
                const rows: any[] = [];
                while (stmt.step()) {
                    const row = stmt.getAsObject();
                    rows.push(row);
                }
                stmt.free();
                return rows;
            } else {
                // No params — use exec for simple queries
                const result = db.exec(sql);
                if (result.length === 0) return [];
                const columns = result[0].columns;
                return result[0].values.map((row: any[]) => {
                    const obj: any = {};
                    columns.forEach((col: string, i: number) => {
                        obj[col] = row[i];
                    });
                    return obj;
                });
            }
        } catch (error: any) {
            console.error('DB Query Error:', error.message, sql);
            throw error;
        }
    });

    // Run: executes a statement (INSERT, UPDATE, DELETE)
    ipcMain.handle('db:run', (_event, sql: string, params?: any[]) => {
        try {
            const db = getDatabase();
            db.run(sql, params);
            saveDatabase(); // Persist after every write
            return { changes: db.getRowsModified() };
        } catch (error: any) {
            console.error('DB Run Error:', error.message, sql);
            throw error;
        }
    });

    // Get: returns a single row as object
    ipcMain.handle('db:get', (_event, sql: string, params?: any[]) => {
        try {
            const db = getDatabase();
            console.log('🔍 DB:GET sql:', sql);
            console.log('🔍 DB:GET params:', JSON.stringify(params));

            if (params && params.length > 0) {
                const stmt = db.prepare(sql);
                stmt.bind(params);
                let result = null;
                if (stmt.step()) {
                    result = stmt.getAsObject();
                }
                stmt.free();
                console.log('🔍 DB:GET result:', JSON.stringify(result));
                return result;
            } else {
                const execResult = db.exec(sql);
                if (execResult.length === 0 || execResult[0].values.length === 0) return null;
                const columns = execResult[0].columns;
                const row = execResult[0].values[0];
                const obj: any = {};
                columns.forEach((col: string, i: number) => {
                    obj[col] = row[i];
                });
                console.log('🔍 DB:GET result:', JSON.stringify(obj));
                return obj;
            }
        } catch (error: any) {
            console.error('DB Get Error:', error.message, sql);
            throw error;
        }
    });

    // Transaction: run multiple operations atomically
    ipcMain.handle('db:transaction', (_event, operations: { sql: string; params?: any[] }[]) => {
        const db = getDatabase();
        try {
            db.run('BEGIN TRANSACTION');
            for (const op of operations) {
                db.run(op.sql, op.params);
            }
            db.run('COMMIT');
            saveDatabase();
            return { success: true };
        } catch (error: any) {
            db.run('ROLLBACK');
            console.error('DB Transaction Error:', error.message);
            throw error;
        }
    });

    // App info
    ipcMain.handle('app:getVersion', () => app.getVersion());
    ipcMain.handle('app:getPath', (_event, name: string) => app.getPath(name as any));

    // ============================================================
    // PRINTER HANDLERS
    // ============================================================

    // Get available printers
    ipcMain.handle('printer:getPrinters', () => {
        if (!mainWindow) return [];
        return mainWindow.webContents.getPrintersAsync();
    });

    // Print receipt via hidden BrowserWindow
    ipcMain.handle('printer:print', async (_event, receiptHtml: string, printerName?: string) => {
        return new Promise((resolve, reject) => {
            const printWindow = new BrowserWindow({
                width: 302,  // ~80mm at 96dpi
                height: 800,
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });

            printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(receiptHtml)}`);

            printWindow.webContents.on('did-finish-load', () => {
                const printOptions: any = {
                    silent: true,
                    printBackground: true,
                    margins: { marginType: 'none' },
                    pageSize: { width: 80000, height: 297000 } // microns: 80mm x ~297mm
                };

                if (printerName) {
                    printOptions.deviceName = printerName;
                }

                printWindow.webContents.print(printOptions, (success, failureReason) => {
                    printWindow.close();
                    if (success) {
                        resolve({ success: true });
                    } else {
                        console.error('Print failed:', failureReason);
                        resolve({ success: false, error: failureReason });
                    }
                });
            });

            // Timeout safety
            setTimeout(() => {
                if (!printWindow.isDestroyed()) {
                    printWindow.close();
                    resolve({ success: false, error: 'Print timeout' });
                }
            }, 10000);
        });
    });
}
