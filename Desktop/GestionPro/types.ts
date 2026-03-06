
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

// Updated Role to include System Admin (SaaS Owner)
export type UserRole = 'sysadmin' | 'admin' | 'employee' | 'custom';

export interface User {
  id: string;
  username: string; // Added for login
  password?: string; // Added for mock auth management
  name: string;
  role: UserRole;
  permissions?: string[]; // Granular permissions
  email?: string; // Added for notifications and payment linkage
  pin?: string; // Access PIN for Operator Mode
  subscriptionExpiry: string; // ISO Date
  pricingPlan?: 'FREE' | 'BASIC' | 'PRO' | 'ULTIMATE';
  status?: 'ACTIVE' | 'LOCKED' | 'PENDING';
}

// New Interface for the "Super Admin" SaaS Panel
export interface SaaSClient {
  id: string;
  businessName: string;
  contactName: string;
  lastLogin: string;
  status: 'ACTIVE' | 'LOCKED' | 'PENDING';
  paymentStatus: 'PAID' | 'PENDING' | 'CANCELLED';
  pendingAmount: number;
  pricingPlan: 'FREE' | 'BASIC' | 'PRO' | 'ULTIMATE';
  paymentMethod: string; // e.g. "Transfer", "Credit Card"
  nextDueDate: string;
  lastPaymentDate?: string; // Added for subscription tracking
  adminUsername: string;
  userId?: string; // Linked to Clerk User ID
  mpPreapprovalId?: string; // Link to active Mercado Pago subscription
  whatsappNumber?: string; // CUSTOM WHATSAPP NUMBER FOR CATALOG
  address?: string; // Business Address
  cuit?: string; // Tax ID
  createdAt?: string;
  gracePeriodStart?: string; // ISO timestamp when grace period started (NULL while license valid)
  enableCatalog?: boolean; // Toggle for digital catalog visibility
}

export interface SystemSettings {
  alertStockMinDefault: number;
  alertDaysBeforeExpiration: number;
  maxClientDebt: number;
  subscriptionStatus: 'ACTIVE' | 'WARNING' | 'LOCKED';
  // Mercado Pago Integration
  mercadoPagoAccessToken?: string;
  mercadoPagoUserId?: string;
  mpAccessToken?: string;
  mpPublicKey?: string;
  enableMpIntegration?: boolean;

  // Dashboard Configuration
  dashboardWidgets?: {
    dailySales: boolean;
    monthlySales: boolean;
    netProfit: boolean;
    topProducts: boolean;
    lowStock: boolean;
    pendingRestocks: boolean;
    monthlyExpenses: boolean; // New Widget
    smartPromo: boolean; // Smart Algo
    businessCapital: boolean; // KPI Card
    salesEvolution: boolean; // Main Chart
    categoryDistribution: boolean; // Pie Chart
  };
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

// 1. SEPARATION OF CONCERNS: CATALOG
export interface Product {
  id: string;
  name: string;
  barcode: string;
  cost: number;
  profitMargin: number;
  price: number;
  supplierId: string;
  // Stock is now derived from Batches, but kept here for UI caching if needed
  // However, true logic uses InventoryBatch
  isPack: boolean;
  childProductId?: string; // For pack breaking
  childQuantity?: number;
  isWeighted?: boolean; // Flag for bulk products
  isManualPrice?: boolean; // NEW: Flag to prevent recalculation
  image_url?: string; // URL of the product image
}

export interface BulkProduct {
  id: string;
  name: string;
  barcode?: string;
  supplierId?: string; // Added to match database and slice usage
  costPerBulk: number;
  weightPerBulk: number; // in KG
  pricePerKg: number;
  stockKg: number;
}

// 2. INVENTORY (PHYSICAL STOCK)
export interface InventoryBatch {
  id: string;
  productId: string;
  batchNumber: string;
  quantity: number;
  originalQuantity?: number; // Quantity when first created
  expiryDate: string; // YYYY-MM-DD
  dateAdded: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactInfo?: string; // Phone or Email
  visitFrequency?: string; // e.g., "Mondays"
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  date: string;
  sessionId: string; // Linked to Cash Session
  items: CartItem[];
  subtotal: number;
  surcharge: number;
  total: number;
  paymentMethodName: string;
  clientId?: string;
  discount?: number; // Added for promotions
}

// 3. MANDATORY CASH CONTROL
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
  sessionId?: string; // Optional: If null, it's a "Global/Monthly" movement
  type: MovementType;
  amount: number;
  description: string;
}

export interface Promotion {
  id: string;
  name: string;
  triggerProductIds: string[]; // IDs of products required (e.g. [A, B])
  promoPrice: number; // The fixed price for the combo
  active: boolean;
  type?: 'standard' | 'flexible' | 'weighted'; // standard = strict combo, flexible = mix & match, weighted = weight based
  quantityRequired?: number; // For flexible promos (e.g. "Buy 4 of these")
  requirements?: {
    productId: string;
    minWeight: number;
  }[];
  imageUrl?: string; // NEW: Promotion image for catalog
}

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
  type: 'OUT' | 'IN'; // For now only OUT is requested, but good to have IN
  userId?: string;
}

export interface OperationalExpense {
  id: string;
  category: 'Rent' | 'Utilities' | 'Salaries' | 'Taxes' | 'Marketing' | 'Other';
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  isRecurring: boolean;
  frequency?: 'Monthly' | 'Weekly' | 'Bi-weekly';
  status: 'Paid' | 'Pending';
}
