import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { fileURLToPath } from 'url';
import { runMigrations } from './migrations';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: SqlJsDatabase;
let dbPath: string;

export async function initDatabase(): Promise<void> {
    dbPath = path.join(app.getPath('userData'), 'stockpro.db');
    console.log('📦 Database path:', dbPath);

    // Load WASM binary directly (fetch doesn't work in Electron main process)
    let wasmPath: string;
    if (app.isPackaged) {
        wasmPath = path.join(process.resourcesPath, 'sql-wasm.wasm');
    } else {
        wasmPath = path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
    }
    console.log('📦 WASM path:', wasmPath);
    const wasmBinary = fs.readFileSync(wasmPath);

    const SQL = await initSqlJs({
        wasmBinary
    });

    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
        console.log('✅ Loaded existing database');
    } else {
        db = new SQL.Database();
        console.log('✅ Created new database');
    }

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Run migrations
    runMigrations(db);

    // Save after migrations
    saveDatabase();

    console.log('✅ Database initialized successfully');
}

export function getDatabase(): SqlJsDatabase {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

export function saveDatabase(): void {
    if (!db || !dbPath) return;
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
}
