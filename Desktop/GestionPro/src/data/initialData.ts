import { Product, InventoryBatch, Supplier, Client, PaymentMethodConfig, SystemSettings, Promotion } from '../../types';

export const INITIAL_PRODUCTS: Product[] = [
    { id: '1', name: 'Coca Cola 500ml', barcode: '7791234567890', cost: 500, profitMargin: 30, price: 650, supplierId: '1', isPack: false },
    { id: '2', name: 'Galletitas Oreo', barcode: '7622300332543', cost: 800, profitMargin: 40, price: 1120, supplierId: '1', isPack: false },
    { id: '3', name: 'Agua Mineral 1L', barcode: '7790000000001', cost: 300, profitMargin: 100, price: 600, supplierId: '2', isPack: false },
    { id: '4', name: 'Pack Coca Cola 500ml x6', barcode: '7791234567899', cost: 3000, profitMargin: 20, price: 3600, supplierId: '1', isPack: true, childProductId: '1', childQuantity: 6 },
];

export const INITIAL_BATCHES: InventoryBatch[] = [
    { id: '1', productId: '1', batchNumber: 'L-001', quantity: 50, expiryDate: '2025-12-31', dateAdded: new Date().toISOString() },
    { id: '2', productId: '2', batchNumber: 'L-002', quantity: 30, expiryDate: '2025-10-20', dateAdded: new Date().toISOString() },
    { id: '3', productId: '3', batchNumber: 'L-003', quantity: 100, expiryDate: '2026-01-01', dateAdded: new Date().toISOString() },
    { id: '4', productId: '4', batchNumber: 'L-004', quantity: 10, expiryDate: '2025-12-31', dateAdded: new Date().toISOString() },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
    { id: '1', name: 'Distribuidora Norte', contactInfo: '11-1234-5678', visitFrequency: 'Lunes' },
    { id: '2', name: 'Aguas Argentinas', contactInfo: '11-8765-4321', visitFrequency: 'Jueves' },
];

export const INITIAL_CLIENTS: Client[] = [
    { id: '1', name: 'Consumidor Final', dni: '00000000', currentAccountBalance: 0, virtualWalletBalance: 0 },
    { id: '2', name: 'Juan Perez', dni: '20123456', currentAccountBalance: 0, virtualWalletBalance: 0 },
];

export const INITIAL_PAYMENT_METHODS: PaymentMethodConfig[] = [
    { id: 'b9a1a6b0-7164-4805-8833-289b4cf7f287', name: 'Efectivo', surchargePercent: 0, isCash: true, isCurrentAccount: false },
    { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Débito', surchargePercent: 0, isCash: false, isCurrentAccount: false },
    { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Crédito', surchargePercent: 10, isCash: false, isCurrentAccount: false },
    { id: '26de6217-1936-4537-8025-05e808bcc38a', name: 'Mercado Pago', surchargePercent: 0, isCash: false, isCurrentAccount: false },
    { id: '7986708b-1504-4371-8933-2f0808f0417b', name: 'Cuenta Corriente', surchargePercent: 0, isCash: false, isCurrentAccount: true },
];

export const INITIAL_SETTINGS: SystemSettings = {
    alertStockMinDefault: 5,
    alertDaysBeforeExpiration: 7,
    maxClientDebt: 10000,
    subscriptionStatus: 'ACTIVE',
    mercadoPagoAccessToken: '',
    mercadoPagoUserId: '',
    dashboardWidgets: {
        dailySales: true,
        monthlySales: true,
        netProfit: true,
        topProducts: true,
        lowStock: true,
        pendingRestocks: true,
        monthlyExpenses: true,
        smartPromo: true,
        businessCapital: true,
        salesEvolution: true,
        categoryDistribution: true
    }
};

export const INITIAL_PROMOTIONS: Promotion[] = [
    { id: '1', name: 'Combo Coca + Oreo', triggerProductIds: ['1', '2'], promoPrice: 1500, active: true }
];
