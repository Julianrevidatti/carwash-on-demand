import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
    DollarSign, ShoppingCart, TrendingUp, Package,
    AlertTriangle, ArrowUpRight, ArrowDownRight, Receipt
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899'];

export const Dashboard: React.FC = () => {
    const sales = useStore(s => s.sales);
    const products = useStore(s => s.products);
    const batches = useStore(s => s.batches);
    const settings = useStore(s => s.settings);
    const suppliers = useStore(s => s.suppliers); // Added for planner

    // Planner states
    const [plannerSupplierFilter, setPlannerSupplierFilter] = useState('');
    const [daysToCover, setDaysToCover] = useState(7);

    // Today's summary
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.date.startsWith(today));
    const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);
    const todayCount = todaySales.length;

    // This month's summary
    const monthStr = new Date().toISOString().slice(0, 7);
    const monthSales = sales.filter(s => s.date.startsWith(monthStr));
    const monthTotal = monthSales.reduce((sum, s) => sum + s.total, 0);

    // Profit estimates
    const todayProfit = todaySales.reduce((sum, sale) => {
        return sum + (sale.items || []).reduce((itemSum, item) => {
            const product = products.find(p => p.id === item.id);
            return itemSum + (item.price - (product?.cost || 0)) * item.quantity;
        }, 0);
    }, 0);

    const monthProfit = monthSales.reduce((sum, sale) => {
        return sum + (sale.items || []).reduce((itemSum, item) => {
            const product = products.find(p => p.id === item.id);
            return itemSum + (item.price - (product?.cost || 0)) * item.quantity;
        }, 0);
    }, 0);

    const averageTicket = monthSales.length > 0 ? monthTotal / monthSales.length : 0;

    // Top products today
    const productSalesMap: Record<string, { name: string; qty: number; total: number }> = {};
    todaySales.forEach(sale => {
        (sale.items || []).forEach(item => {
            if (!productSalesMap[item.id]) {
                productSalesMap[item.id] = { name: item.name, qty: 0, total: 0 };
            }
            productSalesMap[item.id].qty += item.quantity;
            productSalesMap[item.id].total += item.price * item.quantity;
        });
    });
    const topProducts = Object.values(productSalesMap).sort((a, b) => b.total - a.total).slice(0, 5);

    // Payment methods (this month)
    const paymentMap: Record<string, number> = {};
    monthSales.forEach(sale => {
        paymentMap[sale.paymentMethodName] = (paymentMap[sale.paymentMethodName] || 0) + sale.total;
    });
    const paymentData = Object.entries(paymentMap)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Sales evolution (last 7 days)
    const salesData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const daySales = sales.filter(s => s.date.startsWith(dateStr));
        return {
            date: d.toLocaleDateString('es-AR', { weekday: 'short' }),
            total: daySales.reduce((sum, s) => sum + s.total, 0)
        };
    });

    // Stock indicators
    const lowStock = products.filter(p => {
        const stock = batches.filter(b => b.productId === p.id).reduce((s, b) => s + b.quantity, 0);
        return stock <= (settings.alertStockMinDefault || 5) && stock > 0;
    });

    const outOfStock = products.filter(p => {
        const stock = batches.filter(b => b.productId === p.id).reduce((s, b) => s + b.quantity, 0);
        return stock === 0;
    });

    // --- RESTOCKING INSIGHTS (Planner de Pedidos) ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSales = sales.filter(s => new Date(s.date) >= thirtyDaysAgo);

    let actualDaysForAds = 30;
    if (recentSales.length > 0) {
        const saleDates = recentSales.map(s => new Date(s.date).getTime());
        const earliestSale = new Date(Math.min(...saleDates));
        const daysSinceEarliestSale = Math.ceil((new Date().getTime() - earliestSale.getTime()) / (1000 * 60 * 60 * 24));
        actualDaysForAds = Math.max(1, Math.min(30, daysSinceEarliestSale));
    }

    const productVelocity = new Map<string, number>();
    recentSales.forEach(s => {
        s.items.forEach(item => {
            productVelocity.set(item.id, (productVelocity.get(item.id) || 0) + item.quantity);
        });
    });

    const SAFETY_MARGIN = 1.2;
    const restockingRecommendations = products.map(p => {
        const totalSoldPeriod = productVelocity.get(p.id) || 0;
        const ads = totalSoldPeriod / actualDaysForAds;
        const currentStock = batches
            .filter(b => b.productId === p.id)
            .reduce((sum, b) => sum + b.quantity, 0);

        const daysCoverage = ads > 0 ? currentStock / ads : 999;
        const baseNeed = ads * daysToCover;
        const adjustedNeed = currentStock === 0 ? baseNeed * SAFETY_MARGIN : baseNeed;

        return {
            ...p,
            currentStock,
            ads,
            daysCoverage,
            suggestedRestock: ads > 0 && daysCoverage < daysToCover ? Math.ceil(adjustedNeed - currentStock) : 0
        };
    })
        .filter(p => p.daysCoverage < daysToCover && p.ads > 0)
        .filter(p => plannerSupplierFilter ? p.supplierId === plannerSupplierFilter : true)
        .sort((a, b) => a.daysCoverage - b.daysCoverage)
        .slice(0, 50);

    const handleCopyOrder = () => {
        if (restockingRecommendations.length === 0) return;
        const date = new Date().toLocaleDateString('es-AR');
        let text = `*PEDIDO DE REPOSICIÓN - ${date}*\n\n`;
        restockingRecommendations.forEach(item => {
            text += `• ${item.name}: ${item.suggestedRestock} un.\n`;
        });
        navigator.clipboard.writeText(text);
        alert("¡Pedido copiado! Listo para pegar en WhatsApp.");
    };

    const StatCard: React.FC<{
        title: string;
        value: string;
        subtitle?: string;
        icon: React.ReactNode;
        color: string;
        trend?: 'up' | 'down';
    }> = ({ title, value, subtitle, icon, color, trend }) => (
        <div className="animate-fadeIn" style={{
            background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
            border: '1px solid #000000',
            borderRadius: '16px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: `${color}08`,
                filter: 'blur(20px)'
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `${color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color
                }}>
                    {icon}
                </div>
                {trend && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: trend === 'up' ? '#22c55e' : '#ef4444',
                        fontSize: '12px',
                        fontWeight: '500'
                    }}>
                        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </div>
                )}
            </div>

            <p style={{ color: '#000000', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
                {title}
            </p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#000000', letterSpacing: '-0.5px' }}>
                {value}
            </p>
            {subtitle && (
                <p style={{ color: '#000000', fontSize: '12px', marginTop: '4px' }}>
                    {subtitle}
                </p>
            )}
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#000000' }}>
                    Buenos {new Date().getHours() < 12 ? 'días' : new Date().getHours() < 19 ? 'tardes' : 'noches'} 👋
                </h1>
                <p style={{ color: '#000000', fontSize: '14px', marginTop: '4px' }}>
                    Resumen de tu negocio — {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
            </div>

            {/* KPI Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <StatCard
                    title="Ventas Hoy"
                    value={`$${todayTotal.toLocaleString('es-AR')}`}
                    subtitle={`${todayCount} transacciones`}
                    icon={<DollarSign size={22} />}
                    color="#6366f1"
                    trend="up"
                />
                <StatCard
                    title="Ganancia Hoy"
                    value={`$${todayProfit.toLocaleString('es-AR')}`}
                    subtitle="Margen bruto hoy"
                    icon={<TrendingUp size={22} />}
                    color="#22c55e"
                />
                <StatCard
                    title="Ventas del Mes"
                    value={`$${monthTotal.toLocaleString('es-AR')}`}
                    subtitle={`${monthSales.length} ventas`}
                    icon={<ShoppingCart size={22} />}
                    color="#f59e0b"
                />
                <StatCard
                    title="Ganancia del Mes"
                    value={`$${monthProfit.toLocaleString('es-AR')}`}
                    subtitle="Margen bruto mensual"
                    icon={<TrendingUp size={22} />}
                    color="#8b5cf6"
                />
                <StatCard
                    title="Ticket Promedio"
                    value={`$${Math.round(averageTicket).toLocaleString('es-AR')}`}
                    subtitle="Promedio por venta"
                    icon={<Receipt size={22} />}
                    color="#06b6d4"
                />
                <StatCard
                    title="Stock Crítico"
                    value={`${lowStock.length}`}
                    subtitle="Productos por agotar"
                    icon={<Package size={22} />}
                    color="#ef4444"
                />
            </div>

            {/* Bottom Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Top Products */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #000000',
                    padding: '20px'
                }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#000000', marginBottom: '16px' }}>
                        🏆 Top Productos Hoy
                    </h3>
                    {topProducts.length === 0 ? (
                        <p style={{ color: '#000000', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                            Sin ventas hoy
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {topProducts.map((p, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px 12px',
                                    background: 'rgba(248, 250, 252, 0.5)',
                                    borderRadius: '10px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '6px',
                                            background: i === 0 ? '#6366f1' : '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            color: i === 0 ? 'white' : '#475569'
                                        }}>
                                            {i + 1}
                                        </span>
                                        <span style={{ fontSize: '13px', color: '#000000' }} className="truncate">
                                            {p.name}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#22c55e' }}>
                                        ${p.total.toLocaleString('es-AR')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Low Stock Alerts */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #000000',
                    padding: '20px'
                }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#000000', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={16} color="#f59e0b" />
                        Stock Bajo
                    </h3>
                    {lowStock.length === 0 ? (
                        <p style={{ color: '#000000', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                            ✅ Todos los productos con stock suficiente
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px', overflowY: 'auto' }}>
                            {lowStock.slice(0, 8).map(p => {
                                const stock = batches
                                    .filter(b => b.productId === p.id)
                                    .reduce((sum, b) => sum + b.quantity, 0);
                                return (
                                    <div key={p.id} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px 12px',
                                        background: 'rgba(245, 158, 11, 0.05)',
                                        border: '1px solid rgba(245, 158, 11, 0.1)',
                                        borderRadius: '8px'
                                    }}>
                                        <span style={{ fontSize: '13px', color: '#000000' }} className="truncate">
                                            {p.name}
                                        </span>
                                        <span style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: stock <= 2 ? '#ef4444' : '#f59e0b',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            background: stock <= 2 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'
                                        }}>
                                            {stock} uds
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* PLANNER DE PEDIDOS POR PROVEEDORES */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #000000',
                    padding: '20px',
                    gridColumn: '1 / -1' // Span full width
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#000000', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShoppingCart size={16} color="#f97316" /> Planificación de Pedidos (IA)
                            </h3>
                            <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>Sugerencias basadas en el historial de ventas de los últimos 30 días.</p>
                        </div>
                        {restockingRecommendations.length > 0 && (
                            <button onClick={handleCopyOrder} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', border: '1px solid #bbf7d0', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                                <Receipt size={14} /> Copiar Pedido
                            </button>
                        )}
                    </div>

                    {/* Controles del Planner */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 min-content' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Filtrar Proveedor</label>
                            <select
                                value={plannerSupplierFilter}
                                onChange={(e) => setPlannerSupplierFilter(e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', color: '#000000', background: '#ffffff' }}
                            >
                                <option value="">Todos los Proveedores</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: '1 1 min-content' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Días a Cubrir (Frecuencia)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="number" min="1" max="365"
                                    value={daysToCover}
                                    onChange={(e) => setDaysToCover(Number(e.target.value) || 7)}
                                    style={{ width: '80px', padding: '8px', textAlign: 'center', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', color: '#1d4ed8', background: '#ffffff' }}
                                />
                                <span style={{ fontSize: '13px', color: '#475569' }}>días de stock</span>
                            </div>
                        </div>
                        <div style={{ flex: '2 1 200px', alignSelf: 'flex-end', fontSize: '11px', color: '#64748b' }}>
                            La IA está calculando tu pedido óptimo para los próximos {daysToCover} días basado en tu promedio de ventas diarias.
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Producto</th>
                                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Stock</th>
                                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Cobertura</th>
                                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '800', color: '#ea580c', textTransform: 'uppercase', textAlign: 'right' }}>Pedir</th>
                                </tr>
                            </thead>
                            <tbody>
                                {restockingRecommendations.length > 0 ? (
                                    restockingRecommendations.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                                            <td style={{ padding: '12px 8px', fontSize: '13px', fontWeight: '500', color: '#000000' }}>{item.name}</td>
                                            <td style={{ padding: '12px 8px', fontSize: '13px', color: '#000000', textAlign: 'center' }}>{item.currentStock}</td>
                                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                                <span style={{ fontSize: '11px', fontWeight: '700', color: item.daysCoverage < 3 ? '#dc2626' : '#d97706' }}>
                                                    {item.daysCoverage < 1 ? '< 1 día' : `${Math.round(item.daysCoverage)} días`}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                                <span style={{ display: 'inline-block', background: '#ffedd5', color: '#c2410c', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: '1px solid #fed7aa' }}>
                                                    {item.suggestedRestock} un.
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '32px 8px', textAlign: 'center', fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
                                            No hay productos que necesiten reposición urgente según tu configuración.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sales Evolution Chart */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #000000',
                    padding: '20px',
                    gridColumn: '1 / -1' // Span full width
                }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#000000', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={16} color="#6366f1" />
                        Evolución de Ventas (Últimos 7 días)
                    </h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" vertical={false} />
                                <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                <Tooltip
                                    contentStyle={{ background: '#f8fafc', border: '1px solid #000000', borderRadius: '8px', color: '#000000' }}
                                    itemStyle={{ color: '#818cf8', fontWeight: '600' }}
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']}
                                />
                                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Methods Distribution */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #000000',
                    padding: '20px',
                    gridColumn: '1 / -1' // Span full width
                }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#000000', marginBottom: '20px' }}>
                        📊 Distribución por Medio de Pago (Mes Actual)
                    </h3>
                    <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {paymentData.length === 0 ? (
                            <p style={{ color: '#000000', fontSize: '13px' }}>Sin datos suficientes</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={paymentData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {paymentData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: '#f8fafc', border: '1px solid #000000', borderRadius: '8px', color: '#000000' }}
                                        itemStyle={{ color: '#000000', fontWeight: '600' }}
                                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total']}
                                    />
                                    <Legend
                                        verticalAlign="bottom" height={36}
                                        formatter={(value, entry: any) => <span style={{ color: '#000000', fontSize: '13px', fontWeight: '500' }}>{value} ({((entry.payload.value / monthTotal) * 100).toFixed(1)}%)</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
