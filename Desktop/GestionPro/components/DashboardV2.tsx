import React, { useState } from 'react';
import { Sale, Product, InventoryBatch, Client, User, SaaSClient, Supplier, SystemSettings, BulkProduct } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Users, Zap, AlertTriangle, Wallet, BarChart3, Receipt, Calendar, Clock, PieChart as PieChartIcon, Coins, Lock, Plus, ArrowDown } from 'lucide-react';
import { getTotalStock } from '../services/inventoryService';
import { usePlanPermissions } from '../hooks/usePlanPermissions';
import { useUserPermissions } from '../hooks/useUserPermissions'; // Added
import { PERMISSIONS } from '../config/permissions'; // Added
import { useStore } from '../src/store/useStore';

interface DashboardProps {
    sales: Sale[];
    products: Product[];
    batches: InventoryBatch[];
    clients: Client[];
    onNavigate: (tab: any) => void;
    currentUser?: User | null;
    saasClients?: SaaSClient[];
    suppliers?: Supplier[];
    settings: SystemSettings;
    bulkProducts?: BulkProduct[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

export const DashboardV2: React.FC<DashboardProps> = ({ sales, products, batches, clients, onNavigate, currentUser, saasClients = [], suppliers = [], settings, bulkProducts = [] }) => {
    const { canAccessOrderPlanner } = usePlanPermissions();
    const { hasPermission } = useUserPermissions(); // Added

    // --- TRIAL STATUS CHECK ---
    const isSysAdmin = currentUser?.role === 'sysadmin';
    const currentTenant = currentUser ? saasClients.find(c => c.id === currentUser.id) : null;

    // Show banner if:
    // 1. User is NOT SysAdmin
    // 2. AND (Tenant is missing OR Tenant status is PENDING)
    // This ensures new users see the banner even if the tenant record hasn't fully synced yet.
    const isTrialMode = !isSysAdmin && (!currentTenant || currentTenant.paymentStatus !== 'PAID');

    // Calculate days remaining in trial if applicable
    let trialDaysRemaining = 7; // Default to 7 if tenant missing
    if (currentTenant) {
        const today = new Date();
        const dueDate = new Date(currentTenant.nextDueDate);
        const diffTime = dueDate.getTime() - today.getTime();
        trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    if (!sales || !products || !batches || !clients) {
        return <div className="p-8 text-center text-gray-500">Cargando datos del tablero...</div>;
    }

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // --- FILTERS ---
    const [plannerSupplierFilter, setPlannerSupplierFilter] = useState('');
    const [daysToCover, setDaysToCover] = useState(7); // Default 7 days coverage
    const safeSales = Array.isArray(sales) ? sales : [];

    const safeProducts = Array.isArray(products) ? products : [];
    const safeClients = Array.isArray(clients) ? clients : [];
    const safeBatches = Array.isArray(batches) ? batches : [];
    const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];

    const todaySales = safeSales.filter(s => {
        const d = new Date(s.date);
        return d.toDateString() === today.toDateString();
    });

    const monthlySales = safeSales.filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // --- EXPENSES (NET PROFIT CALC) ---
    const expenses = useStore((state) => state.expenses);

    const safeExpenses = Array.isArray(expenses) ? expenses : [];

    const monthlyExpenses = safeExpenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const totalExpenses = monthlyExpenses.reduce((acc, e) => acc + e.amount, 0);

    // --- KPI CALCULATIONS ---

    // 1. Today
    const revenueToday = todaySales.reduce((acc, s) => acc + s.total, 0);
    const costToday = todaySales.reduce((acc, s) => {
        const items = Array.isArray(s.items) ? s.items : [];
        const saleCost = items.reduce((iAcc, item) => iAcc + (item.cost * item.quantity), 0);
        return acc + saleCost;
    }, 0);
    const profitToday = revenueToday - costToday;

    // 2. Monthly
    const revenueMonth = monthlySales.reduce((acc, s) => acc + s.total, 0);
    const costMonth = monthlySales.reduce((acc, s) => {
        const items = Array.isArray(s.items) ? s.items : [];
        const saleCost = items.reduce((iAcc, item) => iAcc + (item.cost * item.quantity), 0);

        // OUTLIER PROTECTION: Ignore sales with cost > 50,000,000 (likely data error)
        if (Math.abs(saleCost) > 50000000) {
            console.warn("DASHBOARD: Ignored sale with abnormal cost:", s, saleCost);
            return acc;
        }

        return acc + saleCost;
    }, 0);

    // DEBUGGING: Log financial components to console
    console.log('--- DASHBOARD FINANCIALS ---');
    console.log('Revenue Month:', revenueMonth);
    console.log('Cost Month:', costMonth);
    console.log('Profit Month:', revenueMonth - costMonth);
    console.log('Total Expenses:', totalExpenses);
    console.log('Net Profit (Calc):', (revenueMonth - costMonth) - totalExpenses);
    console.log('----------------------------');
    const profitMonth = revenueMonth - costMonth;
    const netProfit = profitMonth - totalExpenses;

    // --- NEW FINANCIAL METRICS ---
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    const lastMonthSales = safeSales.filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });

    const revenueLastMonth = lastMonthSales.reduce((acc, s) => acc + s.total, 0);

    // Projection
    const dayOfMonth = today.getDate();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const projectedRevenue = dayOfMonth > 0 ? (revenueMonth / dayOfMonth) * daysInCurrentMonth : 0;

    // Comparison vs Last Month (Growth)
    const projectedGrowth = revenueLastMonth > 0 ? ((projectedRevenue - revenueLastMonth) / revenueLastMonth) * 100 : 0;

    // Average Ticket (Monthly)
    const averageTicket = monthlySales.length > 0 ? revenueMonth / monthlySales.length : 0;

    // Debt Calculation
    const totalClientDebt = safeClients.reduce((acc, c) => acc + c.currentAccountBalance, 0);

    // Low Stock Calculation
    const lowStockCount = safeProducts.filter(p => getTotalStock(safeBatches, p.id) < 5).length;

    // --- BI METRICS ---

    // 1. Capital Valuation
    let capitalCost = 0;
    let capitalRetail = 0;

    safeBatches.forEach(batch => {
        const product = safeProducts.find(p => p.id === batch.productId);
        if (product && batch.quantity > 0) {
            capitalCost += batch.quantity * product.cost;
            capitalRetail += batch.quantity * product.price;
        }
    });

    // Add Bulk Products to Capital
    bulkProducts.forEach(bulk => {
        if (bulk.stockKg > 0) {
            // Cost is per bulk bag (e.g. 10kg bag costs $5000 -> cost per kg = 500)
            // But costPerBulk is the cost of the BAG. weightPerBulk is the KG of the BAG.
            const costPerKg = bulk.costPerBulk / bulk.weightPerBulk;

            capitalCost += bulk.stockKg * costPerKg;
            capitalRetail += bulk.stockKg * bulk.pricePerKg;
        }
    });

    // 2. Sales by Supplier (Global -> Changed to Monthly Comparison)
    // We need: [{ name: 'Supplier', current: 100, last: 80 }]
    const supplierMap = new Map<string, { current: number, last: number }>();

    // Helper to process sales for supplier stats
    const processSupplierSales = (salesList: Sale[], type: 'current' | 'last') => {
        salesList.forEach(sale => {
            if (Array.isArray(sale.items)) {
                sale.items.forEach(item => {
                    const product = safeProducts.find(p => p.id === item.id);
                    // Use 'Sin Proveedor' if no supplierId, or find name if exists
                    let supplierName = 'Sin Proveedor';
                    if (product && product.supplierId) {
                        const s = safeSuppliers.find(sup => sup.id === product.supplierId);
                        if (s) supplierName = s.name;
                    }

                    const currentStats = supplierMap.get(supplierName) || { current: 0, last: 0 };
                    const amount = item.price * item.quantity;

                    if (type === 'current') currentStats.current += amount;
                    else currentStats.last += amount;

                    supplierMap.set(supplierName, currentStats);
                });
            }
        });
    };

    processSupplierSales(monthlySales, 'current');
    processSupplierSales(lastMonthSales, 'last');

    const supplierComparisonData = Array.from(supplierMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.current - a.current)
        .slice(0, 5); // Top 5 suppliers by current month sales

    // Keep the old global data for compatibility if needed, or just use this new one.
    // The old pie chart used 'salesBySupplierData' (global). 
    // We will replace the pie chart with this comparison bar chart.

    // 3. Sales by Product (Pie Chart Data)
    const productSalesMap = new Map<string, number>();
    safeSales.forEach(sale => {
        if (Array.isArray(sale.items)) {
            sale.items.forEach(item => {
                productSalesMap.set(item.name, (productSalesMap.get(item.name) || 0) + item.quantity);
            });
        }
    });

    const topProducts = Array.from(productSalesMap.entries())
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

    // For Pie Chart, maybe limit to top 5 and group others
    const top5Products = topProducts.slice(0, 5);
    const otherProductsCount = topProducts.slice(5).reduce((acc, curr) => acc + curr.quantity, 0);
    const salesByProductPieData = top5Products.map(p => ({ name: p.name, value: p.quantity }));
    if (otherProductsCount > 0) {
        salesByProductPieData.push({ name: 'Otros', value: otherProductsCount });
    }

    // --- RESTOCKING INSIGHTS ---
    // 1. Calculate Average Daily Sales (ADS) based on ACTUAL days with sales data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSales = safeSales.filter(s => new Date(s.date) >= thirtyDaysAgo);

    // Determine actual number of days to use for ADS calculation
    // Use the earliest sale date in the period, or 30 days, whichever is smaller
    let actualDaysForAds = 30;
    if (recentSales.length > 0) {
        const saleDates = recentSales.map(s => new Date(s.date).getTime());
        const earliestSale = new Date(Math.min(...saleDates));
        const daysSinceEarliestSale = Math.ceil((today.getTime() - earliestSale.getTime()) / (1000 * 60 * 60 * 24));
        // Use minimum of 30 days or days since earliest sale, but at least 1 day
        actualDaysForAds = Math.max(1, Math.min(30, daysSinceEarliestSale));
    }

    const productVelocity = new Map<string, number>(); // productId -> totalQuantitySold

    recentSales.forEach(s => {
        if (Array.isArray(s.items)) {
            s.items.forEach(item => {
                productVelocity.set(item.id, (productVelocity.get(item.id) || 0) + item.quantity);
            });
        }
    });

    const SAFETY_MARGIN = 1.2; // 20% extra for products at 0 stock

    const restockingRecommendations = safeProducts.map(p => {
        const totalSoldPeriod = productVelocity.get(p.id) || 0;
        // Use actual days for ADS, not fixed 30
        const ads = totalSoldPeriod / actualDaysForAds;
        const currentStock = getTotalStock(safeBatches, p.id);
        // If ads is 0, coverage is infinite. If ads > 0, coverage = stock / ads
        const daysCoverage = ads > 0 ? currentStock / ads : 999;

        // Apply safety margin ONLY when stock is 0 to prevent lost sales
        const baseNeed = ads * daysToCover;
        const adjustedNeed = currentStock === 0 ? baseNeed * SAFETY_MARGIN : baseNeed;

        return {
            ...p,
            currentStock,
            ads,
            daysCoverage,
            // 20% buffer only for products at 0 stock
            suggestedRestock: ads > 0 && daysCoverage < daysToCover ? Math.ceil(adjustedNeed - currentStock) : 0
        };
    })
        .filter(p => p.daysCoverage < daysToCover && p.ads > 0) // Only show items running out in < covered days
        .filter(p => plannerSupplierFilter ? p.supplierId === plannerSupplierFilter : true) // Filter by supplier
        .sort((a, b) => a.daysCoverage - b.daysCoverage) // Most urgent first
        .slice(0, 50); // Show more items if needed, capped at 50 for performance


    // --- CHARTS DATA ---

    // 2. Sales by Hour (Global)
    const salesByHour = new Array(24).fill(0).map((_, i) => ({ hour: `${i}:00`, total: 0 }));
    safeSales.forEach(sale => {
        const hour = new Date(sale.date).getHours();
        salesByHour[hour].total += sale.total;
    });

    // 3. Daily Evolution (Monthly)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyEvolutionData = new Array(daysInMonth).fill(0).map((_, i) => ({
        day: i + 1,
        sales: 0,
        profit: 0
    }));

    monthlySales.forEach(s => {
        const day = new Date(s.date).getDate();
        dailyEvolutionData[day - 1].sales += s.total;

        const items = Array.isArray(s.items) ? s.items : [];
        const saleCost = items.reduce((iAcc, item) => iAcc + (item.cost * item.quantity), 0);
        dailyEvolutionData[day - 1].profit += (s.total - saleCost);
    });
    // Limit chart to current day to avoid empty flat lines for future dates
    const currentDayOfMonth = today.getDate();
    const chartEvolutionData = dailyEvolutionData.slice(0, currentDayOfMonth);

    // --- NEW: MONTH COMPARISON CHART DATA ---
    const daysInLastMonth = new Date(currentYear, lastMonth + 1, 0).getDate();
    const maxDays = Math.max(daysInMonth, daysInLastMonth);

    // Create base array for comparison
    const monthComparisonData = new Array(maxDays).fill(0).map((_, i) => ({
        day: i + 1,
        current: 0,
        last: 0
    }));

    // Fill Current Month Data
    monthlySales.forEach(s => {
        const day = new Date(s.date).getDate();
        if (monthComparisonData[day - 1]) {
            monthComparisonData[day - 1].current += s.total;
        }
    });

    // Fill Last Month Data
    lastMonthSales.forEach(s => {
        const day = new Date(s.date).getDate();
        if (monthComparisonData[day - 1]) {
            monthComparisonData[day - 1].last += s.total;
        }
    });

    // Determine slice for current month line (to avoid dropping to 0 for future days)
    // But for LAST month we want to show all days.
    // The chart will show both lines. 
    // We want the 'current' line to stop at today's date, but 'last' line to continue.
    // Recharts handles nulls for disconnected lines, but simple way is to use the full array 
    // and just not plot 0s? No, 0 is valid.
    // We can map 'current' to null for future days.

    const chartComparisonData = monthComparisonData.map(d => ({
        ...d,
        current: d.day > currentDayOfMonth ? null : d.current
    }));

    // --- DEAD STOCK ANALYSIS ---
    const deadStock = safeProducts.filter(p => {
        const sold = productVelocity.get(p.id) || 0;
        const stock = getTotalStock(safeBatches, p.id);
        return sold === 0 && stock > 0;
    }).sort((a, b) => (b.cost * getTotalStock(safeBatches, b.id)) - (a.cost * getTotalStock(safeBatches, a.id)))
        .slice(0, 5);

    // --- SMART PROMO RECOMMENDER (The "Best Sellers Combo") ---
    // Logic: Pair Top Seller + Second Top Seller (High Velocity Combo)
    let promoRecommendation = null;
    if (productVelocity.size >= 2) {
        // Sort products by sales volume
        const sortedSales = Array.from(productVelocity.entries())
            .sort((a, b) => b[1] - a[1]); // Descending order: [ [id, qty], [id, qty] ]

        const top1Id = sortedSales[0][0];
        const top2Id = sortedSales[1][0];

        const bestSeller = safeProducts.find(p => p.id === top1Id);
        const secondBest = safeProducts.find(p => p.id === top2Id);

        if (bestSeller && secondBest) {
            promoRecommendation = {
                anchor: bestSeller,
                target: secondBest,
                reason: `Tus clientes aman estos productos. ¡Crea un 'Combo Estrella' con "${bestSeller.name}" y "${secondBest.name}" para aumentar el ticket promedio!`
            };
        }
    }

    const handleCopyOrder = () => {
        if (restockingRecommendations.length === 0) return;

        const date = new Date().toLocaleDateString('es-ES');
        let text = `*PEDIDO DE REPOSICIÓN - ${date}*\n\n`;
        restockingRecommendations.forEach(item => {
            text += `• ${item.name}: ${item.suggestedRestock} un.\n`;
        });
        text += `\nGenerado por GestionNow`;

        navigator.clipboard.writeText(text);
        // toast.success("Pedido copiado al portapapeles");
        alert("¡Pedido copiado! Listo para pegar en WhatsApp.");
    };

    // --- WIDGET VISIBILITY HELPERS (UPDATED) ---
    const showWidget = (key: keyof NonNullable<typeof settings.dashboardWidgets>, permission?: string) => {
        const isEnabledInSettings = settings.dashboardWidgets?.[key] ?? true;
        const hasUserPermission = permission ? hasPermission(permission) : true;
        return isEnabledInSettings && hasUserPermission;
    };

    // --- HELPERS ---
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Panel de Control</h2>
                    <p className="text-gray-500 text-sm">Resumen operativo • {today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3">
                    <button onClick={() => onNavigate('pos')} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors font-bold flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" /> Nueva Venta
                    </button>
                </div>
            </div>

            {/* TRIAL BANNER */}
            {isTrialMode && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-xl shadow-lg flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Prueba Gratis ({trialDaysRemaining} {trialDaysRemaining === 1 ? 'Día' : 'Días'})</h3>
                            <p className="text-sm text-white/90">
                                Tienes {trialDaysRemaining} {trialDaysRemaining === 1 ? 'día' : 'días'} restantes. ¡Suscríbete para desbloquear todas las funciones!
                            </p>
                        </div>
                    </div>
                    <button className="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-50 transition-colors shadow-sm">
                        Suscribirse Ahora
                    </button>
                </div>
            )}

            {/* WELCOME / TUTORIAL (ONLY FOR NEW USERS WITH 0 PRODUCTS) */}
            {safeProducts.length === 0 && (
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-xl p-6 shadow-xl animate-in slide-in-from-top-6 duration-700 relative overflow-hidden">
                    {/* Decorativo */}
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Zap className="w-48 h-48 text-white" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            🚀 ¡Bienvenido a GestionPro!
                        </h2>
                        <p className="text-blue-100 text-lg mb-6 max-w-2xl">
                            Estás a un paso de tomar el control total de tu negocio. Para comenzar a operar, necesitamos configurar tu inventario.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                                <span className="bg-white text-blue-600 w-8 h-8 flex items-center justify-center rounded-full font-bold mb-3">1</span>
                                <h3 className="font-bold text-lg mb-1">Carga Productos</h3>
                                <p className="text-sm text-blue-100">Agrega tu primer producto al inventario para poder venderlo.</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                                <span className="bg-white/20 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold mb-3">2</span>
                                <h3 className="font-bold text-lg mb-1">Abre Caja</h3>
                                <p className="text-sm text-blue-100">Inicia una sesión de caja para registrar movimientos de dinero.</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                                <span className="bg-white/20 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold mb-3">3</span>
                                <h3 className="font-bold text-lg mb-1">Empieza a Vender</h3>
                                <p className="text-sm text-blue-100">¡Listo! Usa el Punto de Venta (POS) para facturar.</p>
                            </div>
                        </div>

                        <button
                            onClick={() => onNavigate('inventory')}
                            className="bg-white text-blue-700 px-8 py-3 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg flex items-center gap-2 group"
                        >
                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Cargar Primer Producto
                        </button>
                    </div>
                </div>
            )}

            {/* SMART PROMO INSIGHT */}
            {showWidget('smartPromo') && promoRecommendation && (
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-1 shadow-lg animate-in slide-in-from-top-4 duration-700">
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-6 text-white">
                        <div className="flex items-start gap-4">
                            <div className="bg-white/20 p-3 rounded-xl hidden md:block">
                                <Zap className="w-8 h-8 text-yellow-300" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-yellow-300 flex items-center gap-2">
                                    <Zap className="w-5 h-5 md:hidden" /> Oportunidad Detectada: "Combo Estrella"
                                </h3>
                                <p className="text-indigo-100 text-sm mt-1 max-w-2xl">
                                    {promoRecommendation.reason}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white/10 p-3 rounded-lg border border-white/10">
                            <div className="text-center">
                                <p className="text-xs text-indigo-200 uppercase font-bold">Top #1</p>
                                <p className="font-bold">{promoRecommendation.anchor.name}</p>
                            </div>
                            <div className="text-2xl font-black text-yellow-400">+</div>
                            <div className="text-center">
                                <p className="text-xs text-indigo-200 uppercase font-bold">Top #2</p>
                                <p className="font-bold text-yellow-300">{promoRecommendation.target.name}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Sales Today */}
                {showWidget('dailySales', PERMISSIONS.DASH_SALES) && (
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <DollarSign className="w-16 h-16 text-emerald-600" />
                        </div>
                        <div className="flex items-center space-x-2 text-emerald-600 mb-1">
                            <TrendingUp className="w-5 h-5" />
                            <h3 className="font-semibold text-sm uppercase tracking-wide">Ventas Hoy</h3>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{formatCurrency(revenueToday)}</p>
                        <p className="text-xs text-gray-400 mt-1">{todaySales.length} operaciones</p>
                    </div>
                )}

                {/* Net Profit (Real) - FIXED NESTING */}
                {showWidget('netProfit', PERMISSIONS.DASH_PROFIT) && (
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <DollarSign className="w-16 h-16 text-emerald-600" />
                        </div>
                        <div className="flex items-center space-x-2 text-emerald-600 mb-1">
                            <DollarSign className="w-5 h-5" />
                            <h3 className="font-semibold text-sm uppercase tracking-wide">Neto Real (Mes)</h3>
                        </div>
                        <p className={`text-2xl font-black ${netProfit >= 0 ? 'text-gray-900' : 'text-red-500'}`}>{formatCurrency(netProfit)}</p>
                        <p className="text-xs text-gray-400 mt-1">Ganancia - Gastos</p>
                    </div>
                )}

                {/* Profit Today */}
                {showWidget('netProfit') && (
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap className="w-16 h-16 text-emerald-600" />
                        </div>
                        <div className="flex items-center space-x-2 text-emerald-600 mb-1">
                            <Zap className="w-5 h-5" />
                            <h3 className="font-semibold text-sm uppercase tracking-wide">Ganancia Hoy</h3>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{formatCurrency(profitToday)}</p>
                        <p className="text-xs text-gray-400 mt-1">Margen Real</p>
                    </div>
                )}


                {/* Sales Month */}
                {showWidget('monthlySales', PERMISSIONS.DASH_SALES) && (
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <Calendar className="w-16 h-16 text-blue-600" />
                        </div>
                        <div className="flex items-center space-x-2 text-blue-600 mb-1">
                            <Calendar className="w-5 h-5" />
                            <h3 className="font-semibold text-sm uppercase tracking-wide">Ventas del Mes</h3>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{formatCurrency(revenueMonth)}</p>

                        <div className="mt-3 flex flex-col gap-1.5 text-xs border-t border-gray-100 pt-2">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Proyección Cierre:</span>
                                <span className="font-bold text-gray-700">{formatCurrency(Math.round(projectedRevenue))}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">vs Mes Anterior:</span>
                                <span className={`font-bold ${projectedGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {projectedGrowth > 0 ? '↑' : '↓'} {Math.abs(projectedGrowth).toFixed(1)}% (Est.)
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Ticket Promedio:</span>
                                <span className="font-bold text-blue-600">{formatCurrency(Math.round(averageTicket))}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profit Month */}
                {showWidget('monthlySales', PERMISSIONS.DASH_PROFIT) && ( // Reusing 'monthlySales' setting but requiring PROFIT permission
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <Zap className="w-16 h-16 text-purple-600" />
                        </div>
                        <div className="flex items-center space-x-2 text-purple-600 mb-1">
                            <Zap className="w-5 h-5" />
                            <h3 className="font-semibold text-sm uppercase tracking-wide">Ganancia Bruta (Mes)</h3>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{formatCurrency(profitMonth)}</p>
                        <p className="text-xs text-gray-400 mt-1">Margen Neto Real</p>
                    </div>
                )}

                {/* Debt Card */}
                {showWidget('businessCapital', PERMISSIONS.DASH_CLIENTS) && (
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <Wallet className="w-16 h-16 text-orange-600" />
                        </div>
                        <div className="flex items-center space-x-2 text-orange-600 mb-1">
                            <Users className="w-5 h-5" />
                            <h3 className="font-semibold text-sm uppercase tracking-wide">Deuda Clientes</h3>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{formatCurrency(totalClientDebt)}</p>
                        <p className="text-xs text-gray-400 mt-1">Saldo en Cta. Cte.</p>
                    </div>
                )}

                {/* Low Stock Card */}
                {showWidget('lowStock', PERMISSIONS.DASH_STOCK) && (
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <AlertTriangle className="w-16 h-16 text-red-600" />
                        </div>
                        <div className="flex items-center space-x-2 text-red-600 mb-1">
                            <AlertTriangle className="w-5 h-5" />
                            <h3 className="font-semibold text-sm uppercase tracking-wide">Stock Crítico</h3>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{lowStockCount}</p>
                        <p className="text-xs text-gray-400 mt-1">Productos por agotar</p>
                    </div>
                )}

                {/* Expenses Card (NEW) */}
                {showWidget('monthlyExpenses', PERMISSIONS.DASH_EXPENSES) && (
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <ArrowDown className="w-16 h-16 text-red-600" />
                        </div>
                        <div className="flex items-center space-x-2 text-red-600 mb-1">
                            <ArrowDown className="w-5 h-5" />
                            <h3 className="font-semibold text-sm uppercase tracking-wide">Gastos del Mes</h3>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{formatCurrency(totalExpenses)}</p>
                        <p className="text-xs text-gray-400 mt-1">Gastos Operativos</p>
                    </div>
                )}
            </div>

            {/* BI SECTION: CAPITAL & PIE CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Capital Valuation */}
                {showWidget('businessCapital', PERMISSIONS.DASH_PROFIT) && ( // Capital is highly sensitive, gated by Profit/Capital permission
                    <div className="lg:col-span-1 bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-lg text-white relative overflow-hidden flex flex-col justify-between h-full">
                        <div className="absolute right-0 top-0 p-4 opacity-10"><Coins className="w-24 h-24" /></div>
                        <div className="relative z-10">
                            <h3 className="text-gray-300 font-medium text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Coins className="w-4 h-4" /> Capital del Negocio
                            </h3>

                            <div className="mb-4">
                                <p className="text-xs text-gray-400 uppercase">Valor en Stock (Costo)</p>
                                <p className="text-3xl font-black tracking-tight">{formatCurrency(capitalCost)}</p>
                            </div>

                            {/* Supplier Breakdown - Middle Space */}
                            <div className="flex-1 overflow-y-auto my-2 space-y-2 pr-1">
                                {Object.entries(
                                    safeBatches.reduce((acc, batch) => {
                                        const product = safeProducts.find(p => p.id === batch.productId);
                                        if (product && product.supplierId) {
                                            const cost = (product.cost || 0) * batch.quantity;
                                            acc[product.supplierId] = (acc[product.supplierId] || 0) + cost;
                                        }
                                        return acc;
                                    }, {} as Record<string, number>)
                                )
                                    .map(([supplierId, totalCost]: [string, number]) => {
                                        const supplier = safeSuppliers.find(s => s.id === supplierId);
                                        return { name: supplier?.name || 'Desconocido', totalCost };
                                    })
                                    .sort((a, b) => b.totalCost - a.totalCost)
                                    .slice(0, 3)
                                    .map((supplier, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400 truncate max-w-[120px]" title={supplier.name}>
                                                {supplier.name}
                                            </span>
                                            <span className="font-bold text-gray-200">
                                                {formatCurrency(Math.round(supplier.totalCost))}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-700 relative z-10">
                            <p className="text-xs text-gray-400 uppercase">Valor en Stock (Venta)</p>
                            <p className="text-2xl font-bold text-green-400">{formatCurrency(capitalRetail)}</p>
                            <p className="text-xs text-gray-500 mt-1">Ganancia Potencial: {formatCurrency(capitalRetail - capitalCost)}</p>
                        </div>
                    </div>
                )}

                {/* Sales by Supplier Comparison Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-gray-500" /> Proveedores (Mes vs Mes)
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={supplierComparisonData} layout="vertical" margin={{ left: 0, right: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    formatter={(value: number) => [formatCurrency(value), '']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '10px' }} />
                                <Bar dataKey="current" name="Este Mes" fill="#3b82f6" barSize={8} radius={[0, 4, 4, 0]} />
                                <Bar dataKey="last" name="Mes Pasado" fill="#9ca3af" barSize={8} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sales by Product Pie Chart */}
                {showWidget('categoryDistribution', PERMISSIONS.DASH_SALES) && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-gray-500" /> Top Productos (Unidades)
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={salesByProductPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {salesByProductPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* MONTHLY EVOLUTION CHART */}
            {
                showWidget('salesEvolution') && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-gray-500" /> Evolución de Ventas (Este Mes)
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartEvolutionData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="day" label={{ value: 'Día', position: 'insideBottomRight', offset: -5 }} fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                    <Tooltip
                                        formatter={(value: number) => [formatCurrency(value), '']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="sales" name="Ventas" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="profit" name="Ganancia" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )
            }

            {/* MONTH COMPARISON CHART (NEW) */}
            {
                showWidget('salesEvolution') && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-gray-500" /> Comparativa: Este Mes vs Mes Pasado
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartComparisonData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="day" label={{ value: 'Día', position: 'insideBottomRight', offset: -5 }} fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                    <Tooltip
                                        formatter={(value: number) => [value ? formatCurrency(value) : '$0', '']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                    <Line type="monotone" dataKey="current" name="Este Mes" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls={false} />
                                    <Line type="monotone" dataKey="last" name="Mes Pasado" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )
            }

            {/* RESTOCKING INSIGHTS SECTION - PLAN LOCKED */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {!canAccessOrderPlanner ? (
                    <div className="lg:col-span-3 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-xl shadow-lg border border-slate-700 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80')] opacity-10 blur-sm group-hover:blur-0 transition-all duration-700 bg-cover bg-center" />
                        <div className="relative z-10 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
                                <Lock className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Planner de Pedidos Inteligente</h3>
                            <p className="text-slate-300 max-w-lg mb-8">
                                Automatiza tus compras con sugerencias basadas en IA sobre tus ventas reales.
                                Disponible exclusivamente en el Plan PRO.
                            </p>
                            <button className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-orange-500/25 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Actualizar a PRO ahora
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ORIGINAL CONTENT UNLOCKED */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <ShoppingCart className="w-5 h-5 text-orange-600" /> Planificación de Compras
                                    </h3>
                                    <p className="text-sm text-gray-500">Sugerencias basadas en ventas de los últimos 30 días.</p>
                                </div>
                                {restockingRecommendations.length > 0 && (
                                    <button
                                        onClick={handleCopyOrder}
                                        className="text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-bold border border-green-200 hover:bg-green-100 transition-colors flex items-center gap-2"
                                    >
                                        <Receipt className="w-4 h-4" /> Copiar Pedido
                                    </button>
                                )}
                            </div>

                            {/* Controls Container */}
                            <div className="mb-6 flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
                                {/* Supplier Filter */}
                                <div className="w-full md:w-1/3">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Filtrar Proveedor</label>
                                    <select
                                        value={plannerSupplierFilter}
                                        onChange={(e) => setPlannerSupplierFilter(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="">Todos los Proveedores</option>
                                        {safeSuppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Days to Cover Input */}
                                <div className="w-full md:w-1/3">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                                        Frecuencia de Visita / Cobertura
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            max="365"
                                            value={daysToCover}
                                            onChange={(e) => setDaysToCover(Number(e.target.value) || 7)}
                                            className="w-20 p-2 border border-blue-200 rounded-lg text-sm font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                        />
                                        <span className="text-sm text-gray-600">días de stock</span>
                                    </div>
                                </div>

                                <div className="text-xs text-gray-400 md:ml-auto max-w-xs">
                                    Calculando pedido para cubrir <strong>{daysToCover} días</strong> basado en la venta promedio diaria (ADS) de los últimos 30 días.
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-xs font-semibold text-gray-500 border-b border-gray-100">
                                            <th className="py-3 px-2">Producto</th>
                                            <th className="py-3 px-2 text-center">Stock</th>
                                            <th className="py-3 px-2 text-center">Cobertura Actual</th>
                                            <th className="py-3 px-2 text-right text-orange-600 font-extrabold text-sm">CANT. A PEDIR</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {restockingRecommendations.length > 0 ? (
                                            restockingRecommendations.map((item, idx) => (
                                                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-3 px-2 font-medium text-gray-800">{item.name}</td>
                                                    <td className="py-3 px-2 text-center">{item.currentStock}</td>
                                                    <td className="py-3 px-2 text-center">
                                                        <span className={`text-xs font-bold ${item.daysCoverage < 3 ? 'text-red-600' : 'text-amber-600'}`}>
                                                            {item.daysCoverage < 1 ? '< 1 día' : `${Math.round(item.daysCoverage)} días`}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-2 text-right">
                                                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold text-sm border border-orange-200 shadow-sm">
                                                            {item.suggestedRestock} un.
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-gray-400 italic">
                                                    Sin alertas de stock.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* DEAD STOCK WARNING */}
                        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" /> Stock Inmovilizado
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">Productos con stock pero SIN ventas en 30 días.</p>

                            <div className="space-y-3">
                                {deadStock.length > 0 ? (
                                    deadStock.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                                            <div>
                                                <p className="font-medium text-sm text-gray-700">{item.name}</p>
                                                <p className="text-xs text-gray-400">{item.supplierId ? 'Con Proveedor' : 'Sin Proveedor'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm text-gray-800">{getTotalStock(safeBatches, item.id)} un.</p>
                                                <p className="text-xs text-red-400">Inmóvil</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        ¡Excelente! Todo tu inventario se mueve.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* SECONDARY CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales By Hour Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-gray-500" /> Horarios Pico (Histórico)
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesByHour}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="hour" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top 10 Products Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-gray-500" /> Top 10 Productos Más Vendidos
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} layout="vertical" margin={{ left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: '#4b5563' }} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="quantity" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div >
    );
};
