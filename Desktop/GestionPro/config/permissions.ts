export const PERMISSIONS = {
    // POS & SALES
    POS_ACCESS: 'pos.access',
    POS_PROCESS_SALE: 'pos.process_sale',
    POS_APPLY_DISCOUNT: 'pos.apply_discount',
    POS_CLOSE_CASH: 'pos.close_cash', // "Z Cierre"
    POS_VIEW_CASH_FLOW: 'pos.view_cash_flow', // See current session totals

    // CATALOG & INVENTORY
    CATALOG_VIEW: 'catalog.view',
    CATALOG_MANAGE: 'catalog.manage', // Add/Edit/Delete products
    CATALOG_VIEW_COST: 'catalog.view_cost', // See Cost/Margin columns
    INVENTORY_MANAGE: 'inventory.manage', // Stock In/Out
    PROMOTIONS_MANAGE: 'promotions.manage', // Create/Delete Promotions

    // BUSINESS MANAGEMENT
    DASHBOARD_VIEW: 'dashboard.view', // Access Dashboard
    REPORTS_VIEW: 'reports.view', // Access BI
    CLIENTS_MANAGE: 'clients.manage',
    SUPPLIERS_MANAGE: 'suppliers.manage',
    EXPENSES_MANAGE: 'expenses.manage', // Add Expenses
    STOCK_ENTRY: 'stock.entry', // Specific for "Cargar Stock"


    // DASHBOARD DETAIL
    DASH_SALES: 'dashboard.sales',
    DASH_PROFIT: 'dashboard.profit', // "Neto Real" & "Ganancia"
    DASH_STOCK: 'dashboard.stock', // Alerts & Planner
    DASH_EXPENSES: 'dashboard.expenses',
    DASH_CLIENTS: 'dashboard.clients', // Debt & Capital

    ADMIN_ACCESS: 'admin.access', // General Admin Access
    ADMIN_MANAGE_USERS: 'admin.manage_users', // Create/Delete Users
    ADMIN_SETTINGS: 'admin.settings', // System Config
};

export const PERMISSIONS_GROUPS = {
    'Punto de Venta': [
        { key: PERMISSIONS.POS_ACCESS, label: 'Acceso al POS' },
        { key: PERMISSIONS.POS_PROCESS_SALE, label: 'Procesar Ventas' },
        { key: PERMISSIONS.POS_APPLY_DISCOUNT, label: 'Aplicar Descuentos' },
        { key: PERMISSIONS.POS_CLOSE_CASH, label: 'Cerrar Caja (Z)' },
        { key: PERMISSIONS.POS_VIEW_CASH_FLOW, label: 'Ver Flujo de Caja (Movimientos)' },
    ],
    'Catálogo e Inventario': [
        { key: PERMISSIONS.CATALOG_VIEW, label: 'Ver Productos' },
        { key: PERMISSIONS.CATALOG_MANAGE, label: 'Crear/Editar Productos' },
        { key: PERMISSIONS.CATALOG_VIEW_COST, label: 'Ver Costos y Márgenes' },
        { key: PERMISSIONS.CATALOG_VIEW_COST, label: 'Ver Costos y Márgenes' },
        { key: PERMISSIONS.INVENTORY_MANAGE, label: 'Ajustar Stock (Total)' },
        { key: PERMISSIONS.STOCK_ENTRY, label: 'Cargar Stock (Entrada)' }, // Added granular
    ],
    'Gestión': [
        { key: PERMISSIONS.REPORTS_VIEW, label: 'Ver Reportes y Gráficos' },
        { key: PERMISSIONS.CLIENTS_MANAGE, label: 'Gestionar Clientes' },
        { key: PERMISSIONS.SUPPLIERS_MANAGE, label: 'Gestionar Proveedores' },
    ],
    'Finanzas y Operaciones': [
        { key: PERMISSIONS.EXPENSES_MANAGE, label: 'Registrar Gastos/Egresos' },
        { key: PERMISSIONS.POS_CLOSE_CASH, label: 'Cerrar Caja (Z)' }, // Moved/Duplicated for visibility? No, keep in POS.
        // Actually, let's keep Cash Closing in POS or move it here? User said "hacer egresos".
    ],
    'Dashboard (Vistas)': [
        { key: PERMISSIONS.DASH_SALES, label: 'Ver Ventas (Diarias/Mensuales)' },
        { key: PERMISSIONS.DASH_PROFIT, label: 'Ver Ganancias y Márgenes' },
        { key: PERMISSIONS.DASH_STOCK, label: 'Ver Alertas de Stock' },
        { key: PERMISSIONS.DASH_EXPENSES, label: 'Ver Gastos en Panel' },
        { key: PERMISSIONS.DASH_CLIENTS, label: 'Ver Deuda/Capital' },
    ],
    'Administración': [
        { key: PERMISSIONS.ADMIN_MANAGE_USERS, label: 'Gestionar Usuarios' },
        { key: PERMISSIONS.ADMIN_SETTINGS, label: 'Configuración del Sistema' },
    ]
};

export const ROLE_TEMPLATES = {
    ADMIN: {
        label: 'Administrador (Total)',
        permissions: Object.values(PERMISSIONS)
    },
    MANAGER: {
        label: 'Encargado / Gerente',
        permissions: [
            PERMISSIONS.POS_ACCESS, PERMISSIONS.POS_PROCESS_SALE, PERMISSIONS.POS_APPLY_DISCOUNT, PERMISSIONS.POS_CLOSE_CASH, PERMISSIONS.POS_VIEW_CASH_FLOW,
            PERMISSIONS.CATALOG_VIEW, PERMISSIONS.CATALOG_MANAGE, PERMISSIONS.CATALOG_VIEW_COST, PERMISSIONS.INVENTORY_MANAGE,
            PERMISSIONS.REPORTS_VIEW, PERMISSIONS.CLIENTS_MANAGE, PERMISSIONS.SUPPLIERS_MANAGE
        ]
    },
    CASHIER: {
        label: 'Cajero Estándar',
        permissions: [
            PERMISSIONS.POS_ACCESS, PERMISSIONS.POS_PROCESS_SALE,
            PERMISSIONS.CATALOG_VIEW, PERMISSIONS.CLIENTS_MANAGE
        ]
    },
    STOCKIST: {
        label: 'Repositor',
        permissions: [
            PERMISSIONS.CATALOG_VIEW, PERMISSIONS.INVENTORY_MANAGE
        ]
    }
};
