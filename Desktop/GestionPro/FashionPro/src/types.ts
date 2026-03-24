
export interface PaymentMethodConfig {
    id: string;
    name: string;
    surchargePercent: number;
    isCash: boolean;
    isCurrentAccount: boolean;
}

export enum MovementType {
    SALE = 'Venta',
    DEPOSIT = 'Entrada Manual',
    WITHDRAWAL = 'Salida/Gasto'
}

export type UserRole = 'admin' | 'employee' | 'custom';

export interface User {
    id: string;
    username: string;
    password?: string;
    name: string;
    role: UserRole;
    permissions?: string[];
    pin?: string;
    securityQuestion?: string;
    securityAnswer?: string;
}

export interface SystemSettings {
    alertStockMinDefault: number;
    alertDaysBeforeExpiration: number;
    maxClientDebt: number;
    businessName?: string;
    businessAddress?: string;
    businessCuit?: string;
    businessPhone?: string;
    dashboardWidgets?: {
        dailySales: boolean;
        monthlySales: boolean;
        netProfit: boolean;
        topProducts: boolean;
        lowStock: boolean;
        pendingRestocks: boolean;
        monthlyExpenses: boolean;
        smartPromo: boolean;
        businessCapital: boolean;
        salesEvolution: boolean;
        categoryDistribution: boolean;
    };
    posLayout?: 'classic' | 'modern' | 'checkout-focused' | 'compact';
    posSidebarActions?: 'top' | 'bottom';
    posReverseLayout?: boolean;
}

export interface Client {
    id: string;
    name: string;
    dni: string;
    phone?: string;
    email?: string;
    address?: string;
    currentAccountBalance: number;
    virtualWalletBalance: number;
}

export interface Product {
    id: string;
    name: string;
    barcode: string;
    cost: number;
    profitMargin: number;
    price: number;
    supplierId: string;
    isPack: boolean;
    childProductId?: string;
    childQuantity?: number;
    isWeighted?: boolean;
    isManualPrice?: boolean;
    image_url?: string;
    size?: string;
    color?: string;
    season?: string;
    brand?: string;
}

export interface BulkProduct {
    id: string;
    name: string;
    barcode?: string;
    supplierId?: string;
    costPerBulk: number;
    weightPerBulk: number;
    pricePerKg: number;
    stockKg: number;
}

export interface InventoryBatch {
    id: string;
    productId: string;
    batchNumber: string;
    quantity: number;
    originalQuantity?: number;
    expiryDate: string;
    dateAdded: string;
}

export interface Supplier {
    id: string;
    name: string;
    contactInfo?: string;
    visitFrequency?: string;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface Sale {
    id: string;
    date: string;
    sessionId: string;
    items: CartItem[];
    subtotal: number;
    surcharge: number;
    total: number;
    paymentMethodName: string;
    clientId?: string;
    discount?: number;
}

export interface CashSession {
    id: string;
    startTime: string;
    endTime?: string;
    initialFloat: number;
    finalDeclaredCash?: number;
    status: 'OPEN' | 'CLOSED';
    userId: string;
    userName?: string;
}

export interface CashMovement {
    id: string;
    date: string;
    sessionId?: string;
    type: MovementType;
    amount: number;
    description: string;
}

export interface Promotion {
    id: string;
    name: string;
    triggerProductIds: string[];
    promoPrice: number;
    active: boolean;
    type?: 'standard' | 'flexible' | 'weighted';
    quantityRequired?: number;
    requirements?: {
        productId: string;
        minWeight: number;
    }[];
    imageUrl?: string;
}

export interface StockMovement {
    id: string;
    date: string;
    productId: string;
    productName: string;
    quantity: number;
    reason: string;
    type: 'OUT' | 'IN';
    userId?: string;
}

export interface OperationalExpense {
    id: string;
    category: 'Rent' | 'Utilities' | 'Salaries' | 'Taxes' | 'Marketing' | 'Other';
    description: string;
    amount: number;
    date: string;
    isRecurring: boolean;
    frequency?: 'Monthly' | 'Weekly' | 'Bi-weekly';
    status: 'Paid' | 'Pending';
}
