import { Database as SqlJsDatabase } from 'sql.js';

export function runMigrations(db: SqlJsDatabase): void {
  // Create migrations tracking table
  db.run(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const migrations: { name: string; sql: string }[] = [
    {
      name: '001_initial_schema',
      sql: `
        -- Users (local auth)
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'admin',
          pin TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- System Settings
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          alert_stock_min_default INTEGER NOT NULL DEFAULT 5,
          alert_days_before_expiration INTEGER NOT NULL DEFAULT 7,
          max_client_debt REAL NOT NULL DEFAULT 10000,
          dashboard_widgets TEXT DEFAULT '{}',
          business_name TEXT DEFAULT 'Mi Negocio',
          business_address TEXT,
          business_cuit TEXT,
          business_phone TEXT
        );

        -- Suppliers
        CREATE TABLE IF NOT EXISTS suppliers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          contact_info TEXT,
          visit_frequency TEXT
        );

        -- Products
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          barcode TEXT DEFAULT '',
          cost REAL NOT NULL DEFAULT 0,
          profit_margin REAL NOT NULL DEFAULT 0,
          price REAL NOT NULL DEFAULT 0,
          supplier_id TEXT,
          is_pack INTEGER NOT NULL DEFAULT 0,
          child_product_id TEXT,
          child_quantity INTEGER,
          is_weighted INTEGER DEFAULT 0,
          is_manual_price INTEGER DEFAULT 0,
          image_url TEXT,
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        );

        -- Bulk Products (weighted)
        CREATE TABLE IF NOT EXISTS bulk_products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          barcode TEXT,
          supplier_id TEXT,
          cost_per_bulk REAL NOT NULL DEFAULT 0,
          weight_per_bulk REAL NOT NULL DEFAULT 1,
          price_per_kg REAL NOT NULL DEFAULT 0,
          stock_kg REAL NOT NULL DEFAULT 0,
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        );

        -- Inventory Batches
        CREATE TABLE IF NOT EXISTS batches (
          id TEXT PRIMARY KEY,
          product_id TEXT NOT NULL,
          batch_number TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 0,
          original_quantity INTEGER,
          expiry_date TEXT NOT NULL,
          date_added TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (product_id) REFERENCES products(id)
        );

        -- Clients
        CREATE TABLE IF NOT EXISTS clients (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          dni TEXT DEFAULT '',
          phone TEXT,
          email TEXT,
          address TEXT,
          current_account_balance REAL NOT NULL DEFAULT 0,
          virtual_wallet_balance REAL NOT NULL DEFAULT 0
        );

        -- Payment Methods
        CREATE TABLE IF NOT EXISTS payment_methods (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          surcharge_percent REAL NOT NULL DEFAULT 0,
          is_cash INTEGER NOT NULL DEFAULT 0,
          is_current_account INTEGER NOT NULL DEFAULT 0
        );

        -- Cash Sessions
        CREATE TABLE IF NOT EXISTS cash_sessions (
          id TEXT PRIMARY KEY,
          start_time TEXT NOT NULL,
          end_time TEXT,
          initial_float REAL NOT NULL DEFAULT 0,
          final_declared_cash REAL,
          status TEXT NOT NULL DEFAULT 'OPEN',
          user_id TEXT NOT NULL,
          user_name TEXT
        );

        -- Sales
        CREATE TABLE IF NOT EXISTS sales (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          session_id TEXT NOT NULL,
          subtotal REAL NOT NULL DEFAULT 0,
          surcharge REAL NOT NULL DEFAULT 0,
          total REAL NOT NULL DEFAULT 0,
          payment_method_name TEXT NOT NULL,
          client_id TEXT,
          discount REAL DEFAULT 0,
          FOREIGN KEY (session_id) REFERENCES cash_sessions(id)
        );

        -- Sale Items
        CREATE TABLE IF NOT EXISTS sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          product_name TEXT NOT NULL,
          quantity REAL NOT NULL,
          price REAL NOT NULL,
          cost REAL NOT NULL DEFAULT 0,
          is_weighted INTEGER DEFAULT 0,
          FOREIGN KEY (sale_id) REFERENCES sales(id)
        );

        -- Cash Movements
        CREATE TABLE IF NOT EXISTS cash_movements (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          session_id TEXT,
          type TEXT NOT NULL,
          amount REAL NOT NULL,
          description TEXT NOT NULL
        );

        -- Promotions
        CREATE TABLE IF NOT EXISTS promotions (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          trigger_product_ids TEXT NOT NULL DEFAULT '[]',
          promo_price REAL NOT NULL DEFAULT 0,
          active INTEGER NOT NULL DEFAULT 1,
          type TEXT DEFAULT 'standard',
          quantity_required INTEGER,
          requirements TEXT,
          image_url TEXT
        );

        -- Stock Movements
        CREATE TABLE IF NOT EXISTS stock_movements (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          product_id TEXT NOT NULL,
          product_name TEXT NOT NULL,
          quantity REAL NOT NULL,
          reason TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'OUT',
          user_id TEXT
        );

        -- Operational Expenses
        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          category TEXT NOT NULL,
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          date TEXT NOT NULL,
          is_recurring INTEGER NOT NULL DEFAULT 0,
          frequency TEXT,
          status TEXT NOT NULL DEFAULT 'Pending'
        );
      `
    },
    {
      name: '002_default_data',
      sql: `
        -- Insert default settings
        INSERT OR IGNORE INTO settings (id, business_name) VALUES (1, 'Mi Negocio');

        -- Insert default admin user
        INSERT OR IGNORE INTO users (id, username, password_hash, name, role)
        VALUES ('default-admin', 'admin', 'admin123', 'Administrador', 'admin');

        -- Insert default payment methods
        INSERT OR IGNORE INTO payment_methods (id, name, surcharge_percent, is_cash, is_current_account)
        VALUES ('pm-cash', 'Efectivo', 0, 1, 0);
        INSERT OR IGNORE INTO payment_methods (id, name, surcharge_percent, is_cash, is_current_account)
        VALUES ('pm-debit', 'Débito', 0, 0, 0);
        INSERT OR IGNORE INTO payment_methods (id, name, surcharge_percent, is_cash, is_current_account)
        VALUES ('pm-credit', 'Crédito', 10, 0, 0);
        INSERT OR IGNORE INTO payment_methods (id, name, surcharge_percent, is_cash, is_current_account)
        VALUES ('pm-transfer', 'Transferencia', 0, 0, 0);
      `
    },
    {
      name: '003_add_user_security_questions',
      sql: `
        ALTER TABLE users ADD COLUMN security_answer TEXT;
      `
    },
    {
      name: '004_add_pos_layout_columns',
      sql: `
        ALTER TABLE settings ADD COLUMN pos_layout TEXT DEFAULT 'classic';
        ALTER TABLE settings ADD COLUMN pos_sidebar_actions TEXT DEFAULT 'bottom';
        ALTER TABLE settings ADD COLUMN pos_reverse_layout INTEGER DEFAULT 0;
      `
    }
  ];

  // Check which migrations have been applied
  const appliedResult = db.exec('SELECT name FROM _migrations');
  const applied: string[] = appliedResult.length > 0
    ? appliedResult[0].values.map((row: any) => row[0] as string)
    : [];

  for (const migration of migrations) {
    if (!applied.includes(migration.name)) {
      console.log(`🔄 Applying migration: ${migration.name}`);
      // sql.js needs to run each statement separately
      const statements = migration.sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const stmt of statements) {
        try {
          db.run(stmt);
        } catch (e: any) {
          console.error(`Migration statement error: ${e.message}`, stmt.substring(0, 80));
        }
      }

      db.run('INSERT INTO _migrations (name) VALUES (?)', [migration.name]);
      console.log(`✅ Migration applied: ${migration.name}`);
    }
  }
}
