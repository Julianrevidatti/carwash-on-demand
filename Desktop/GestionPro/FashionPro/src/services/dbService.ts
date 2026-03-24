// Database Service - Frontend bridge to SQLite via Electron IPC
// All database calls go through window.electronAPI.db

declare global {
    interface Window {
        electronAPI?: any;
    }
}

const db = () => window.electronAPI.db;

// Helper to check if running in Electron
export const isElectron = (): boolean => {
    return typeof window !== 'undefined' && !!window.electronAPI;
};

// ============================================================
// PRODUCTS
// ============================================================
export const productDB = {
    getAll: async () => {
        const rows = await db().query(
            'SELECT * FROM products ORDER BY name'
        );
        return rows.map(mapProduct);
    },

    insert: async (p: any) => {
        await db().run(
            `INSERT INTO products (id, name, barcode, cost, profit_margin, price, supplier_id, is_pack, child_product_id, child_quantity, is_weighted, is_manual_price, image_url, size, color, season, brand)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [p.id, p.name, p.barcode || '', p.cost, p.profitMargin, p.price, p.supplierId || null, p.isPack ? 1 : 0, p.childProductId || null, p.childQuantity || null, p.isWeighted ? 1 : 0, p.isManualPrice ? 1 : 0, p.image_url || null, p.size || null, p.color || null, p.season || null, p.brand || null]
        );
    },

    update: async (p: any) => {
        await db().run(
            `UPDATE products SET name=?, barcode=?, cost=?, profit_margin=?, price=?, supplier_id=?, is_pack=?, child_product_id=?, child_quantity=?, is_weighted=?, is_manual_price=?, image_url=?, size=?, color=?, season=?, brand=? WHERE id=?`,
            [p.name, p.barcode || '', p.cost, p.profitMargin, p.price, p.supplierId || null, p.isPack ? 1 : 0, p.childProductId || null, p.childQuantity || null, p.isWeighted ? 1 : 0, p.isManualPrice ? 1 : 0, p.image_url || null, p.size || null, p.color || null, p.season || null, p.brand || null, p.id]
        );
    },

    delete: async (id: string) => {
        await db().run('DELETE FROM products WHERE id = ?', [id]);
    }
};

// ============================================================
// BATCHES
// ============================================================
export const batchDB = {
    getAll: async () => {
        const rows = await db().query('SELECT * FROM batches ORDER BY expiry_date');
        return rows.map(mapBatch);
    },

    insert: async (b: any) => {
        await db().run(
            `INSERT INTO batches (id, product_id, batch_number, quantity, original_quantity, expiry_date, date_added)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [b.id, b.productId, b.batchNumber, b.quantity, b.originalQuantity || b.quantity, b.expiryDate, b.dateAdded || new Date().toISOString()]
        );
    },

    update: async (b: any) => {
        await db().run(
            'UPDATE batches SET quantity=?, original_quantity=? WHERE id=?',
            [b.quantity, b.originalQuantity || b.quantity, b.id]
        );
    },

    delete: async (id: string) => {
        await db().run('DELETE FROM batches WHERE id = ?', [id]);
    }
};

// ============================================================
// SUPPLIERS
// ============================================================
export const supplierDB = {
    getAll: async () => {
        const rows = await db().query('SELECT * FROM suppliers ORDER BY name');
        return rows.map(mapSupplier);
    },

    insert: async (s: any) => {
        await db().run(
            'INSERT INTO suppliers (id, name, contact_info, visit_frequency) VALUES (?, ?, ?, ?)',
            [s.id, s.name, s.contactInfo || null, s.visitFrequency || null]
        );
    },

    update: async (s: any) => {
        await db().run(
            'UPDATE suppliers SET name=?, contact_info=?, visit_frequency=? WHERE id=?',
            [s.name, s.contactInfo || null, s.visitFrequency || null, s.id]
        );
    },

    delete: async (id: string) => {
        await db().run('DELETE FROM suppliers WHERE id = ?', [id]);
    }
};

// ============================================================
// CLIENTS
// ============================================================
export const clientDB = {
    getAll: async () => {
        const rows = await db().query('SELECT * FROM clients ORDER BY name');
        return rows.map(mapClient);
    },

    insert: async (c: any) => {
        await db().run(
            'INSERT INTO clients (id, name, dni, phone, email, address, current_account_balance, virtual_wallet_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [c.id, c.name, c.dni || '', c.phone || null, c.email || null, c.address || null, c.currentAccountBalance || 0, c.virtualWalletBalance || 0]
        );
    },

    update: async (c: any) => {
        await db().run(
            'UPDATE clients SET name=?, dni=?, phone=?, email=?, address=?, current_account_balance=?, virtual_wallet_balance=? WHERE id=?',
            [c.name, c.dni || '', c.phone || null, c.email || null, c.address || null, c.currentAccountBalance || 0, c.virtualWalletBalance || 0, c.id]
        );
    },

    delete: async (id: string) => {
        await db().run('DELETE FROM clients WHERE id = ?', [id]);
    }
};

// ============================================================
// SALES
// ============================================================
export const saleDB = {
    getAll: async () => {
        const sales = await db().query('SELECT * FROM sales ORDER BY date DESC');
        const items = await db().query('SELECT * FROM sale_items');
        return sales.map((s: any) => ({
            id: s.id,
            date: s.date,
            sessionId: s.session_id,
            subtotal: s.subtotal,
            surcharge: s.surcharge,
            total: s.total,
            paymentMethodName: s.payment_method_name,
            clientId: s.client_id,
            discount: s.discount || 0,
            items: items.filter((i: any) => i.sale_id === s.id).map((i: any) => ({
                id: i.product_id,
                name: i.product_name,
                quantity: i.quantity,
                price: i.price,
                cost: i.cost,
                barcode: '',
                profitMargin: 0,
                supplierId: '',
                isPack: false,
                isWeighted: !!i.is_weighted
            }))
        }));
    },

    insert: async (sale: any) => {
        const ops: { sql: string; params: any[] }[] = [
            {
                sql: `INSERT INTO sales (id, date, session_id, subtotal, surcharge, total, payment_method_name, client_id, discount)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                params: [sale.id, sale.date, sale.sessionId, sale.subtotal, sale.surcharge, sale.total, sale.paymentMethodName, sale.clientId || null, sale.discount || 0]
            }
        ];

        for (const item of sale.items) {
            ops.push({
                sql: `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price, cost, is_weighted)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
                params: [sale.id, item.id, item.name, item.quantity, item.price, item.cost || 0, item.isWeighted ? 1 : 0]
            });
        }

        await db().transaction(ops);
    },

    delete: async (id: string) => {
        await db().transaction([
            { sql: 'DELETE FROM sale_items WHERE sale_id = ?', params: [id] },
            { sql: 'DELETE FROM sales WHERE id = ?', params: [id] }
        ]);
    }
};

// ============================================================
// CASH SESSIONS
// ============================================================
export const sessionDB = {
    getAll: async () => {
        const rows = await db().query('SELECT * FROM cash_sessions ORDER BY start_time DESC');
        return rows.map(mapSession);
    },

    insert: async (s: any) => {
        await db().run(
            'INSERT INTO cash_sessions (id, start_time, initial_float, status, user_id, user_name) VALUES (?, ?, ?, ?, ?, ?)',
            [s.id, s.startTime, s.initialFloat, s.status, s.userId, s.userName || null]
        );
    },

    close: async (id: string, finalCash: number, endTime: string) => {
        await db().run(
            'UPDATE cash_sessions SET end_time=?, final_declared_cash=?, status=? WHERE id=?',
            [endTime, finalCash, 'CLOSED', id]
        );
    }
};

// ============================================================
// CASH MOVEMENTS
// ============================================================
export const cashMovementDB = {
    getAll: async () => {
        const rows = await db().query('SELECT * FROM cash_movements ORDER BY date DESC');
        return rows.map((r: any) => ({
            id: r.id,
            date: r.date,
            sessionId: r.session_id,
            type: r.type,
            amount: r.amount,
            description: r.description
        }));
    },

    insert: async (m: any) => {
        await db().run(
            'INSERT INTO cash_movements (id, date, session_id, type, amount, description) VALUES (?, ?, ?, ?, ?, ?)',
            [m.id, m.date, m.sessionId || null, m.type, m.amount, m.description]
        );
    }
};

// ============================================================
// PAYMENT METHODS
// ============================================================
export const paymentMethodDB = {
    getAll: async () => {
        const rows = await db().query('SELECT * FROM payment_methods');
        return rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            surchargePercent: r.surcharge_percent,
            isCash: !!r.is_cash,
            isCurrentAccount: !!r.is_current_account
        }));
    },

    replaceAll: async (methods: any[]) => {
        const ops: { sql: string; params: any[] }[] = [
            { sql: 'DELETE FROM payment_methods', params: [] }
        ];
        for (const m of methods) {
            ops.push({
                sql: 'INSERT INTO payment_methods (id, name, surcharge_percent, is_cash, is_current_account) VALUES (?, ?, ?, ?, ?)',
                params: [m.id, m.name, m.surchargePercent, m.isCash ? 1 : 0, m.isCurrentAccount ? 1 : 0]
            });
        }
        await db().transaction(ops);
    }
};

// ============================================================
// PROMOTIONS
// ============================================================
export const promotionDB = {
    getAll: async () => {
        const rows = await db().query('SELECT * FROM promotions');
        return rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            triggerProductIds: JSON.parse(r.trigger_product_ids || '[]'),
            promoPrice: r.promo_price,
            active: !!r.active,
            type: r.type || 'standard',
            quantityRequired: r.quantity_required,
            requirements: r.requirements ? JSON.parse(r.requirements) : undefined,
            imageUrl: r.image_url
        }));
    },

    insert: async (p: any) => {
        await db().run(
            'INSERT INTO promotions (id, name, trigger_product_ids, promo_price, active, type, quantity_required, requirements, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [p.id, p.name, JSON.stringify(p.triggerProductIds), p.promoPrice, p.active ? 1 : 0, p.type || 'standard', p.quantityRequired || null, p.requirements ? JSON.stringify(p.requirements) : null, p.imageUrl || null]
        );
    },

    update: async (p: any) => {
        await db().run(
            'UPDATE promotions SET name=?, trigger_product_ids=?, promo_price=?, active=?, type=?, quantity_required=?, requirements=?, image_url=? WHERE id=?',
            [p.name, JSON.stringify(p.triggerProductIds), p.promoPrice, p.active ? 1 : 0, p.type || 'standard', p.quantityRequired || null, p.requirements ? JSON.stringify(p.requirements) : null, p.imageUrl || null, p.id]
        );
    },

    delete: async (id: string) => {
        await db().run('DELETE FROM promotions WHERE id = ?', [id]);
    }
};

// ============================================================
// STOCK MOVEMENTS
// ============================================================
export const stockMovementDB = {
    getAll: async () => {
        const rows = await db().query('SELECT * FROM stock_movements ORDER BY date DESC');
        return rows.map((r: any) => ({
            id: r.id,
            date: r.date,
            productId: r.product_id,
            productName: r.product_name,
            quantity: r.quantity,
            reason: r.reason,
            type: r.type,
            userId: r.user_id
        }));
    },

    insert: async (m: any) => {
        await db().run(
            'INSERT INTO stock_movements (id, date, product_id, product_name, quantity, reason, type, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [m.id, m.date, m.productId, m.productName, m.quantity, m.reason, m.type, m.userId || null]
        );
    }
};

// ============================================================
// EXPENSES
// ============================================================
export const expenseDB = {
    getAll: async () => {
        const rows = await db().query('SELECT * FROM expenses ORDER BY date DESC');
        return rows.map((r: any) => ({
            id: r.id,
            category: r.category,
            description: r.description,
            amount: r.amount,
            date: r.date,
            isRecurring: !!r.is_recurring,
            frequency: r.frequency,
            status: r.status
        }));
    },

    insert: async (e: any) => {
        await db().run(
            'INSERT INTO expenses (id, category, description, amount, date, is_recurring, frequency, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [e.id, e.category, e.description, e.amount, e.date, e.isRecurring ? 1 : 0, e.frequency || null, e.status]
        );
    },

    update: async (e: any) => {
        await db().run(
            'UPDATE expenses SET category=?, description=?, amount=?, date=?, is_recurring=?, frequency=?, status=? WHERE id=?',
            [e.category, e.description, e.amount, e.date, e.isRecurring ? 1 : 0, e.frequency || null, e.status, e.id]
        );
    },

    delete: async (id: string) => {
        await db().run('DELETE FROM expenses WHERE id = ?', [id]);
    }
};

// ============================================================
// BULK PRODUCTS
// ============================================================
export const bulkProductDB = {
    getAll: async () => {
        const rows = await db().query('SELECT * FROM bulk_products ORDER BY name');
        return rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            barcode: r.barcode,
            supplierId: r.supplier_id,
            costPerBulk: r.cost_per_bulk,
            weightPerBulk: r.weight_per_bulk,
            pricePerKg: r.price_per_kg,
            stockKg: r.stock_kg
        }));
    },

    insert: async (b: any) => {
        await db().run(
            'INSERT INTO bulk_products (id, name, barcode, supplier_id, cost_per_bulk, weight_per_bulk, price_per_kg, stock_kg) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [b.id, b.name, b.barcode || null, b.supplierId || null, b.costPerBulk, b.weightPerBulk, b.pricePerKg, b.stockKg]
        );
    },

    update: async (b: any) => {
        await db().run(
            'UPDATE bulk_products SET name=?, barcode=?, supplier_id=?, cost_per_bulk=?, weight_per_bulk=?, price_per_kg=?, stock_kg=? WHERE id=?',
            [b.name, b.barcode || null, b.supplierId || null, b.costPerBulk, b.weightPerBulk, b.pricePerKg, b.stockKg, b.id]
        );
    },

    delete: async (id: string) => {
        await db().run('DELETE FROM bulk_products WHERE id = ?', [id]);
    }
};

// ============================================================
// SETTINGS
// ============================================================
export const settingsDB = {
    get: async () => {
        const row: any = await db().get('SELECT * FROM settings WHERE id = 1');
        if (!row) return null;
        return {
            alertStockMinDefault: row.alert_stock_min_default,
            alertDaysBeforeExpiration: row.alert_days_before_expiration,
            maxClientDebt: row.max_client_debt,
            businessName: row.business_name,
            businessAddress: row.business_address,
            businessCuit: row.business_cuit,
            businessPhone: row.business_phone,
            dashboardWidgets: row.dashboard_widgets ? JSON.parse(row.dashboard_widgets) : undefined,
            posLayout: row.pos_layout,
            posSidebarActions: row.pos_sidebar_actions,
            posReverseLayout: !!row.pos_reverse_layout
        };
    },

    update: async (s: any) => {
        await db().run(
            `UPDATE settings SET alert_stock_min_default=?, alert_days_before_expiration=?, max_client_debt=?, business_name=?, business_address=?, business_cuit=?, business_phone=?, dashboard_widgets=?, pos_layout=?, pos_sidebar_actions=?, pos_reverse_layout=? WHERE id=1`,
            [s.alertStockMinDefault, s.alertDaysBeforeExpiration, s.maxClientDebt, s.businessName || 'Mi Negocio', s.businessAddress || null, s.businessCuit || null, s.businessPhone || null, s.dashboardWidgets ? JSON.stringify(s.dashboardWidgets) : '{}', s.posLayout || 'classic', s.posSidebarActions || 'bottom', s.posReverseLayout ? 1 : 0]
        );
    }
};

// ============================================================
// USERS (Local Auth)
// ============================================================
export const userDB = {
    getAll: async () => {
        const rows = await db().query('SELECT * FROM users');
        return rows.map((r: any) => ({
            id: r.id,
            username: r.username,
            name: r.name,
            role: r.role,
            pin: r.pin,
            passwordHash: r.password_hash,
            securityQuestion: r.security_question,
            securityAnswer: r.security_answer
        }));
    },

    getByCredentials: async (username: string, password: string) => {
        const row: any = await db().get(
            'SELECT * FROM users WHERE username = ? AND password_hash = ?',
            [username, password]
        );
        if (!row) return null;
        return {
            id: row.id,
            username: row.username,
            name: row.name,
            role: row.role,
            pin: row.pin,
            passwordHash: row.password_hash,
            securityQuestion: row.security_question,
            securityAnswer: row.security_answer
        };
    },

    insert: async (u: any) => {
        await db().run(
            'INSERT INTO users (id, username, password_hash, name, role, pin, security_question, security_answer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [u.id, u.username, u.password || 'admin123', u.name, u.role || 'employee', u.pin || null, u.securityQuestion || null, u.securityAnswer || null]
        );
    },

    update: async (u: any) => {
        await db().run(
            'UPDATE users SET username=?, name=?, role=?, pin=?, security_question=?, security_answer=? WHERE id=?',
            [u.username, u.name, u.role, u.pin || null, u.securityQuestion || null, u.securityAnswer || null, u.id]
        );
    },

    updatePassword: async (id: string, password: string) => {
        await db().run('UPDATE users SET password_hash=? WHERE id=?', [password, id]);
    },

    delete: async (id: string) => {
        await db().run('DELETE FROM users WHERE id = ?', [id]);
    }
};

// ============================================================
// MAPPERS (snake_case DB → camelCase App)
// ============================================================
function mapProduct(r: any) {
    return {
        id: r.id,
        name: r.name,
        barcode: r.barcode || '',
        cost: r.cost,
        profitMargin: r.profit_margin,
        price: r.price,
        supplierId: r.supplier_id || '',
        isPack: !!r.is_pack,
        childProductId: r.child_product_id,
        childQuantity: r.child_quantity,
        isWeighted: !!r.is_weighted,
        isManualPrice: !!r.is_manual_price,
        image_url: r.image_url,
        size: r.size,
        color: r.color,
        season: r.season,
        brand: r.brand
    };
}

function mapBatch(r: any) {
    return {
        id: r.id,
        productId: r.product_id,
        batchNumber: r.batch_number,
        quantity: r.quantity,
        originalQuantity: r.original_quantity,
        expiryDate: r.expiry_date,
        dateAdded: r.date_added
    };
}

function mapSupplier(r: any) {
    return {
        id: r.id,
        name: r.name,
        contactInfo: r.contact_info,
        visitFrequency: r.visit_frequency
    };
}

function mapClient(r: any) {
    return {
        id: r.id,
        name: r.name,
        dni: r.dni || '',
        phone: r.phone,
        email: r.email,
        address: r.address,
        currentAccountBalance: r.current_account_balance || 0,
        virtualWalletBalance: r.virtual_wallet_balance || 0
    };
}

function mapSession(r: any) {
    return {
        id: r.id,
        startTime: r.start_time,
        endTime: r.end_time,
        initialFloat: r.initial_float,
        finalDeclaredCash: r.final_declared_cash,
        status: r.status,
        userId: r.user_id,
        userName: r.user_name
    };
}
