import { create } from 'zustand';
import {
    Product, BulkProduct, InventoryBatch, Supplier, Client,
    Sale, CashSession, CashMovement, Promotion, StockMovement,
    OperationalExpense, SystemSettings, PaymentMethodConfig, User
} from '../types';
import {
    productDB, batchDB, supplierDB, clientDB, saleDB,
    sessionDB, cashMovementDB, paymentMethodDB, promotionDB,
    stockMovementDB, expenseDB, bulkProductDB, settingsDB, userDB
} from '../services/dbService';

interface StoreState {
    // Auth
    currentUser: User | null;
    systemUsers: User[];
    activeOperator: User | null;
    setCurrentUser: (user: User | null) => void;
    setActiveOperator: (user: User | null) => void;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    fetchSystemUsers: () => Promise<void>;
    addSystemUser: (user: User) => Promise<void>;
    updateSystemUser: (user: User) => Promise<void>;
    deleteSystemUser: (id: string) => Promise<void>;

    // Products
    products: Product[];
    fetchProducts: () => Promise<void>;
    addProduct: (product: Product) => Promise<void>;
    updateProduct: (product: Product) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    massUpdatePrices: (supplierId: string, percentage: number) => Promise<void>;

    // Bulk Products
    bulkProducts: BulkProduct[];
    fetchBulkProducts: () => Promise<void>;
    addBulkProduct: (product: BulkProduct) => Promise<void>;
    updateBulkProduct: (product: BulkProduct) => Promise<void>;
    deleteBulkProduct: (id: string) => Promise<void>;
    deductBulkStock: (id: string, kg: number) => Promise<void>;

    // Batches
    batches: InventoryBatch[];
    fetchBatches: () => Promise<void>;
    addBatch: (batch: InventoryBatch) => Promise<void>;
    updateBatches: (batches: InventoryBatch[]) => void;
    setBatches: (batches: InventoryBatch[]) => void;

    // Suppliers
    suppliers: Supplier[];
    fetchSuppliers: () => Promise<void>;
    addSupplier: (supplier: Supplier) => Promise<void>;
    updateSupplier: (supplier: Supplier) => Promise<void>;
    deleteSupplier: (id: string) => Promise<void>;
    transferProducts: (fromId: string, toId: string) => Promise<void>;

    // Clients
    clients: Client[];
    fetchClients: () => Promise<void>;
    addClient: (client: Client) => Promise<void>;
    updateClient: (client: Client) => Promise<void>;

    // Sales
    sales: Sale[];
    fetchSales: () => Promise<void>;
    addSale: (sale: Sale) => Promise<void>;
    deleteSale: (id: string) => Promise<void>;
    updateSalePaymentMethod: (saleId: string, method: string) => void;

    // Sessions
    sessions: CashSession[];
    currentSession: CashSession | null;
    fetchSessions: () => Promise<void>;
    openSession: (session: CashSession) => Promise<void>;
    closeSession: (id: string, finalCash: number, endTime: string) => Promise<void>;

    // Cash Movements
    cashMovements: CashMovement[];
    fetchCashMovements: () => Promise<void>;
    addCashMovement: (movement: CashMovement) => Promise<void>;

    // Payment Methods
    paymentMethods: PaymentMethodConfig[];
    fetchPaymentMethods: () => Promise<void>;
    updatePaymentMethods: (methods: PaymentMethodConfig[]) => Promise<void>;

    // Promotions
    promotions: Promotion[];
    fetchPromotions: () => Promise<void>;
    addPromotion: (promo: Promotion) => Promise<void>;
    deletePromotion: (id: string) => Promise<void>;

    // Stock Movements
    stockMovements: StockMovement[];
    fetchStockMovements: () => Promise<void>;
    addStockMovement: (movement: StockMovement) => Promise<void>;

    // Expenses
    expenses: OperationalExpense[];
    fetchExpenses: () => Promise<void>;
    setExpenses: (expenses: OperationalExpense[]) => void;

    // Settings
    settings: SystemSettings;
    fetchSettings: () => Promise<void>;
    updateSettings: (settings: Partial<SystemSettings>) => Promise<void>;

    // Data Loading
    loadAllData: () => Promise<void>;
}

const DEFAULT_SETTINGS: SystemSettings = {
    alertStockMinDefault: 5,
    alertDaysBeforeExpiration: 7,
    maxClientDebt: 10000,
    businessName: 'Mi Negocio',
    dashboardWidgets: {
        dailySales: true,
        monthlySales: true,
        netProfit: true,
        topProducts: true,
        lowStock: true,
        pendingRestocks: true,
        monthlyExpenses: true,
        smartPromo: false,
        businessCapital: true,
        salesEvolution: true,
        categoryDistribution: true
    },
    posLayout: 'classic',
    posSidebarActions: 'bottom',
    posReverseLayout: false
};

export const useStore = create<StoreState>()((set, get) => ({
    // ============================================================
    // AUTH
    // ============================================================
    currentUser: null,
    systemUsers: [],
    activeOperator: null,

    setCurrentUser: (user) => set({ currentUser: user }),
    setActiveOperator: (user) => set({ activeOperator: user }),

    login: async (username: string, password: string) => {
        const user = await userDB.getByCredentials(username, password);
        if (user) {
            set({ currentUser: user as User });
            return true;
        }
        return false;
    },

    logout: () => set({ currentUser: null, activeOperator: null }),

    fetchSystemUsers: async () => {
        const users = await userDB.getAll();
        set({ systemUsers: users as User[] });
    },

    addSystemUser: async (user) => {
        await userDB.insert(user);
        get().fetchSystemUsers();
    },

    updateSystemUser: async (user) => {
        await userDB.update(user);
        get().fetchSystemUsers();
    },

    deleteSystemUser: async (id) => {
        await userDB.delete(id);
        get().fetchSystemUsers();
    },

    // ============================================================
    // PRODUCTS
    // ============================================================
    products: [],

    fetchProducts: async () => {
        const products = await productDB.getAll();
        const batches = await batchDB.getAll();
        const bulkProducts = await bulkProductDB.getAll();
        set({ products: products as Product[], batches: batches as InventoryBatch[], bulkProducts: bulkProducts as BulkProduct[] });
    },

    addProduct: async (product) => {
        await productDB.insert(product);
        set(s => ({ products: [...s.products, product] }));
    },

    updateProduct: async (product) => {
        await productDB.update(product);
        set(s => ({ products: s.products.map(p => p.id === product.id ? product : p) }));
    },

    deleteProduct: async (id) => {
        await productDB.delete(id);
        set(s => ({ products: s.products.filter(p => p.id !== id) }));
    },

    massUpdatePrices: async (supplierId, percentage) => {
        const products = get().products.filter(p => p.supplierId === supplierId && !p.isManualPrice);
        for (const p of products) {
            const newCost = p.cost * (1 + percentage / 100);
            const newPrice = newCost * (1 + p.profitMargin / 100);
            const updated = { ...p, cost: newCost, price: newPrice };
            await productDB.update(updated);
        }
        get().fetchProducts();
    },

    // ============================================================
    // BULK PRODUCTS
    // ============================================================
    bulkProducts: [],

    fetchBulkProducts: async () => {
        const products = await bulkProductDB.getAll();
        set({ bulkProducts: products as BulkProduct[] });
    },

    addBulkProduct: async (product) => {
        await bulkProductDB.insert(product);
        set(s => ({ bulkProducts: [...s.bulkProducts, product] }));
    },

    updateBulkProduct: async (product) => {
        await bulkProductDB.update(product);
        set(s => ({ bulkProducts: s.bulkProducts.map(p => p.id === product.id ? product : p) }));
    },

    deleteBulkProduct: async (id) => {
        await bulkProductDB.delete(id);
        set(s => ({ bulkProducts: s.bulkProducts.filter(p => p.id !== id) }));
    },

    deductBulkStock: async (id, kg) => {
        const product = get().bulkProducts.find(p => p.id === id);
        if (product) {
            const updated = { ...product, stockKg: Math.max(0, product.stockKg - kg) };
            await bulkProductDB.update(updated);
            set(s => ({ bulkProducts: s.bulkProducts.map(p => p.id === id ? updated : p) }));
        }
    },

    // ============================================================
    // BATCHES
    // ============================================================
    batches: [],

    fetchBatches: async () => {
        const batches = await batchDB.getAll();
        set({ batches: batches as InventoryBatch[] });
    },

    addBatch: async (batch) => {
        await batchDB.insert(batch);
        set(s => ({ batches: [...s.batches, batch] }));
    },

    updateBatches: (batches) => set({ batches }),
    setBatches: (batches) => set({ batches }),

    // ============================================================
    // SUPPLIERS
    // ============================================================
    suppliers: [],

    fetchSuppliers: async () => {
        const suppliers = await supplierDB.getAll();
        set({ suppliers: suppliers as Supplier[] });
    },

    addSupplier: async (supplier) => {
        await supplierDB.insert(supplier);
        set(s => ({ suppliers: [...s.suppliers, supplier] }));
    },

    updateSupplier: async (supplier) => {
        await supplierDB.update(supplier);
        set(s => ({ suppliers: s.suppliers.map(s2 => s2.id === supplier.id ? supplier : s2) }));
    },

    deleteSupplier: async (id) => {
        await supplierDB.delete(id);
        set(s => ({ suppliers: s.suppliers.filter(s2 => s2.id !== id) }));
    },

    transferProducts: async (fromId, toId) => {
        const products = get().products.filter(p => p.supplierId === fromId);
        for (const p of products) {
            await productDB.update({ ...p, supplierId: toId });
        }
        get().fetchProducts();
    },

    // ============================================================
    // CLIENTS
    // ============================================================
    clients: [],

    fetchClients: async () => {
        const clients = await clientDB.getAll();
        set({ clients: clients as Client[] });
    },

    addClient: async (client) => {
        await clientDB.insert(client);
        set(s => ({ clients: [...s.clients, client] }));
    },

    updateClient: async (client) => {
        await clientDB.update(client);
        set(s => ({ clients: s.clients.map(c => c.id === client.id ? client : c) }));
    },

    // ============================================================
    // SALES
    // ============================================================
    sales: [],

    fetchSales: async () => {
        const sales = await saleDB.getAll();
        set({ sales: sales as Sale[] });
    },

    addSale: async (sale) => {
        await saleDB.insert(sale);
        // Deduct stock from batches
        for (const item of sale.items) {
            if (item.isWeighted) {
                // Deduct from bulk products
                const bulkProduct = get().bulkProducts.find(bp => bp.id === item.id);
                if (bulkProduct) {
                    await get().deductBulkStock(item.id, item.quantity);
                }
            } else {
                // Deduct from regular batches (FIFO)
                let remaining = item.quantity;
                const productBatches = get().batches
                    .filter(b => b.productId === item.id && b.quantity > 0)
                    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

                for (const batch of productBatches) {
                    if (remaining <= 0) break;
                    const deduct = Math.min(batch.quantity, remaining);
                    const updated = { ...batch, quantity: batch.quantity - deduct };
                    await batchDB.update(updated);
                    remaining -= deduct;
                }
            }
        }
        set(s => ({ sales: [sale, ...s.sales] }));
        get().fetchBatches();
    },

    deleteSale: async (id) => {
        await saleDB.delete(id);
        set(s => ({ sales: s.sales.filter(sale => sale.id !== id) }));
    },

    updateSalePaymentMethod: (saleId, method) => {
        set(s => ({
            sales: s.sales.map(sale =>
                sale.id === saleId ? { ...sale, paymentMethodName: method } : sale
            )
        }));
    },

    // ============================================================
    // SESSIONS
    // ============================================================
    sessions: [],
    currentSession: null,

    fetchSessions: async () => {
        const sessions = await sessionDB.getAll();
        const open = sessions.find((s: any) => s.status === 'OPEN');
        set({ sessions: sessions as CashSession[], currentSession: (open as CashSession) || null });
    },

    openSession: async (session) => {
        await sessionDB.insert(session);
        set(s => ({ sessions: [session, ...s.sessions], currentSession: session }));
    },

    closeSession: async (id, finalCash, endTime) => {
        await sessionDB.close(id, finalCash, endTime);
        set(s => ({
            sessions: s.sessions.map(sess =>
                sess.id === id ? { ...sess, endTime, finalDeclaredCash: finalCash, status: 'CLOSED' as const } : sess
            ),
            currentSession: null
        }));
    },

    // ============================================================
    // CASH MOVEMENTS
    // ============================================================
    cashMovements: [],

    fetchCashMovements: async () => {
        const movements = await cashMovementDB.getAll();
        set({ cashMovements: movements as CashMovement[] });
    },

    addCashMovement: async (movement) => {
        await cashMovementDB.insert(movement);
        set(s => ({ cashMovements: [movement, ...s.cashMovements] }));
    },

    // ============================================================
    // PAYMENT METHODS
    // ============================================================
    paymentMethods: [],

    fetchPaymentMethods: async () => {
        const methods = await paymentMethodDB.getAll();
        set({ paymentMethods: methods as PaymentMethodConfig[] });
    },

    updatePaymentMethods: async (methods) => {
        await paymentMethodDB.replaceAll(methods);
        set({ paymentMethods: methods });
    },

    // ============================================================
    // PROMOTIONS
    // ============================================================
    promotions: [],

    fetchPromotions: async () => {
        const promos = await promotionDB.getAll();
        set({ promotions: promos as Promotion[] });
    },

    addPromotion: async (promo) => {
        await promotionDB.insert(promo);
        set(s => ({ promotions: [...s.promotions, promo] }));
    },

    deletePromotion: async (id) => {
        await promotionDB.delete(id);
        set(s => ({ promotions: s.promotions.filter(p => p.id !== id) }));
    },

    // ============================================================
    // STOCK MOVEMENTS
    // ============================================================
    stockMovements: [],

    fetchStockMovements: async () => {
        const movements = await stockMovementDB.getAll();
        set({ stockMovements: movements as StockMovement[] });
    },

    addStockMovement: async (movement) => {
        await stockMovementDB.insert(movement);
        set(s => ({ stockMovements: [movement, ...s.stockMovements] }));
    },

    // ============================================================
    // EXPENSES
    // ============================================================
    expenses: [],

    fetchExpenses: async () => {
        const expenses = await expenseDB.getAll();
        set({ expenses: expenses as OperationalExpense[] });
    },

    setExpenses: (expenses) => set({ expenses }),

    // ============================================================
    // SETTINGS
    // ============================================================
    settings: DEFAULT_SETTINGS,

    fetchSettings: async () => {
        const settings = await settingsDB.get();
        if (settings) {
            set({ settings: { ...DEFAULT_SETTINGS, ...settings } as SystemSettings });
        }
    },

    updateSettings: async (newSettings) => {
        const merged = { ...get().settings, ...newSettings };
        await settingsDB.update(merged);
        set({ settings: merged });
    },

    // ============================================================
    // LOAD ALL DATA
    // ============================================================
    loadAllData: async () => {
        await Promise.all([
            get().fetchProducts(),
            get().fetchSuppliers(),
            get().fetchClients(),
            get().fetchSales(),
            get().fetchSessions(),
            get().fetchCashMovements(),
            get().fetchPaymentMethods(),
            get().fetchPromotions(),
            get().fetchStockMovements(),
            get().fetchExpenses(),
            get().fetchSettings(),
            get().fetchSystemUsers()
        ]);
    }
}));
