import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { CartItem, Sale } from '../types';
import {
    Search, Plus, Minus, Trash2, ShoppingCart,
    CreditCard, Banknote, X, Check, Printer
} from 'lucide-react';
import { toast } from 'sonner';
import { printService } from '../services/printService';

export const POS: React.FC = () => {
    const products = useStore(s => s.products);
    const batches = useStore(s => s.batches);
    const paymentMethods = useStore(s => s.paymentMethods);
    const currentSession = useStore(s => s.currentSession);
    const currentUser = useStore(s => s.currentUser);
    const addSale = useStore(s => s.addSale);
    const promotions = useStore(s => s.promotions);
    const bulkProducts = useStore(s => s.bulkProducts);

    const settings = useStore(s => s.settings);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState('');
    const [selectedPayment, setSelectedPayment] = useState('');
    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    // Focus search on mount
    useEffect(() => {
        searchRef.current?.focus();
    }, []);

    // Products with stock info
    const productsWithStock = useMemo(() => {
        return products.map(p => {
            const stock = batches
                .filter(b => b.productId === p.id)
                .reduce((sum, b) => sum + b.quantity, 0);
            return { ...p, stock };
        });
    }, [products, batches]);

    // Filtered products
    const filteredProducts = useMemo(() => {
        if (!search.trim()) return productsWithStock.slice(0, 30);
        const q = search.toLowerCase();
        return productsWithStock.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.barcode.includes(q)
        );
    }, [productsWithStock, search]);

    // Cart calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const selectedMethod = paymentMethods.find(m => m.id === selectedPayment);
    const surcharge = selectedMethod ? subtotal * (selectedMethod.surchargePercent / 100) : 0;
    const total = subtotal + surcharge;

    // Add product to cart
    const addToCart = (product: typeof productsWithStock[0]) => {
        if (product.stock <= 0) {
            toast.error('Sin stock disponible');
            return;
        }

        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            if (existing.quantity >= product.stock) {
                toast.warning('Stock máximo alcanzado');
                return;
            }
            setCart(cart.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    // Handle barcode scan (Enter key in search)
    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && search.trim()) {
            const product = productsWithStock.find(p =>
                p.barcode === search.trim() || p.name.toLowerCase() === search.toLowerCase()
            );
            if (product) {
                addToCart(product);
                setSearch('');
            } else {
                toast.error('Producto no encontrado');
            }
        }
    };

    // Process sale
    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('El carrito está vacío');
            return;
        }
        if (!selectedPayment) {
            toast.error('Selecciona un método de pago');
            return;
        }
        if (!currentSession) {
            toast.error('Debes abrir una sesión de caja primero');
            return;
        }

        const sale: Sale = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            sessionId: currentSession.id,
            items: cart,
            subtotal,
            surcharge,
            total,
            paymentMethodName: selectedMethod?.name || 'Efectivo'
        };

        try {
            await addSale(sale);
            setLastSale(sale);
            setCart([]);
            setSelectedPayment('');
            setSearch('');
            searchRef.current?.focus();
            toast.success(`Venta registrada: $${total.toLocaleString('es-AR')}`);

            // Auto-print if enabled
            if (printService.getAutoPrint()) {
                handlePrintReceipt(sale);
            }
        } catch (error) {
            toast.error('Error al procesar la venta');
        }
    };

    // Print receipt
    const handlePrintReceipt = async (sale: Sale) => {
        setIsPrinting(true);
        try {
            const success = await printService.printReceipt(
                sale,
                settings.businessName || 'StockPro',
                (settings as any).businessAddress,
                (settings as any).businessPhone
            );
            if (success) {
                toast.success('Ticket impreso');
            } else {
                toast.error('Error al imprimir. Verificar impresora.');
            }
        } catch {
            toast.error('Error de impresión');
        } finally {
            setIsPrinting(false);
        }
    };

    // No session warning
    if (!currentSession) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '16px',
                color: '#000000',
                padding: '40px'
            }}>
                <ShoppingCart size={48} style={{ opacity: 0.3 }} />
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#000000' }}>
                    Sesión de Caja Cerrada
                </h2>
                <p style={{ fontSize: '14px', textAlign: 'center', maxWidth: '400px' }}>
                    Para empezar a vender, primero abrí una sesión de caja desde la sección <strong style={{ color: '#6366f1' }}>Caja</strong>.
                </p>
            </div>
        );
    }

    const getLayoutProportions = () => {
        switch (settings.posLayout) {
            case 'modern': return { grid: '1', side: '1' };
            case 'checkout-focused': return { grid: '4', side: '6' };
            case 'compact': return { grid: '1', side: '3' };
            case 'classic':
            default: return { grid: '2', side: '1' };
        }
    };

    const proportions = getLayoutProportions();

    const SidebarActions = (
        <div style={{
            borderTop: settings.posSidebarActions === 'top' ? 'none' : '1px solid #ffffff',
            borderBottom: settings.posSidebarActions === 'top' ? '1px solid #ffffff' : 'none',
            padding: '16px',
            order: settings.posSidebarActions === 'top' ? -1 : 1
        }}>
            {/* Payment Methods */}
            <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '12px', color: '#000000', marginBottom: '8px', fontWeight: '500' }}>
                    Método de Pago
                </p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {paymentMethods.map(m => (
                        <button
                            key={m.id}
                            onClick={() => setSelectedPayment(m.id)}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '8px',
                                border: `1px solid ${selectedPayment === m.id ? '#6366f1' : '#ffffff'}`,
                                background: selectedPayment === m.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                color: selectedPayment === m.id ? '#818cf8' : '#475569',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            {m.isCash ? <Banknote size={14} /> : <CreditCard size={14} />}
                            {m.name}
                            {m.surchargePercent > 0 && (
                                <span style={{ color: '#f59e0b', fontSize: '10px' }}>
                                    +{m.surchargePercent}%
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Totals */}
            <div style={{
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '12px',
                marginBottom: '12px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#000000' }}>Subtotal</span>
                    <span style={{ fontSize: '13px', color: '#000000' }}>${subtotal.toLocaleString('es-AR')}</span>
                </div>
                {surcharge > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', color: '#f59e0b' }}>Recargo</span>
                        <span style={{ fontSize: '13px', color: '#f59e0b' }}>+${surcharge.toLocaleString('es-AR')}</span>
                    </div>
                )}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid #ffffff'
                }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#000000' }}>Total</span>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: '#6366f1' }}>
                        ${total.toLocaleString('es-AR')}
                    </span>
                </div>
            </div>

            {/* Checkout Button */}
            <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || !selectedPayment}
                style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: (cart.length === 0 || !selectedPayment)
                        ? '#ffffff'
                        : 'linear-gradient(135deg, #6366f1, #7c3aed)',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: (cart.length === 0 || !selectedPayment) ? 'not-allowed' : 'pointer',
                    opacity: (cart.length === 0 || !selectedPayment) ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: (cart.length > 0 && selectedPayment) ? '0 4px 15px rgba(99, 102, 241, 0.3)' : 'none'
                }}
            >
                <Check size={18} />
                Cobrar ${total.toLocaleString('es-AR')}
            </button>

            {/* Print Last Ticket */}
            {lastSale && cart.length === 0 && (
                <button
                    onClick={() => handlePrintReceipt(lastSale)}
                    disabled={isPrinting}
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid #000000',
                        background: 'transparent',
                        color: '#000000',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '8px'
                    }}
                >
                    <Printer size={14} />
                    {isPrinting ? 'Imprimiendo...' : 'Imprimir Último Ticket'}
                </button>
            )}
        </div>
    );

    return (
        <div style={{
            display: 'flex',
            height: '100%',
            gap: '0',
            background: '#f8fafc'
        }}>
            {/* Left: Product Grid */}
            <div style={{
                flex: proportions.grid,
                display: 'flex',
                flexDirection: 'column',
                borderRight: settings.posReverseLayout ? 'none' : '1px solid #ffffff',
                borderLeft: settings.posReverseLayout ? '1px solid #ffffff' : 'none',
                order: settings.posReverseLayout ? 2 : 1
            }}>
                {/* Search Bar */}
                <div style={{
                    padding: '16px',
                    borderBottom: '1px solid #ffffff',
                    background: '#ffffff'
                }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{
                            position: 'absolute',
                            left: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#000000'
                        }} />
                        <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Buscar producto o escanear código de barras..."
                            style={{
                                width: '100%',
                                padding: '12px 14px 12px 42px',
                                background: '#f8fafc',
                                border: '1px solid #000000',
                                borderRadius: '12px',
                                color: '#000000',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                </div>

                {/* Product Grid */}
                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '16px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '10px',
                    alignContent: 'start'
                }}>
                    {filteredProducts.map(product => (
                        <button
                            key={product.id}
                            onClick={() => addToCart(product)}
                            disabled={product.stock <= 0}
                            style={{
                                padding: '14px 12px',
                                background: product.stock <= 0 ? 'rgba(255, 255, 255, 0.4)' : '#ffffff',
                                border: '1px solid #000000',
                                borderRadius: '12px',
                                cursor: product.stock <= 0 ? 'not-allowed' : 'pointer',
                                opacity: product.stock <= 0 ? 0.5 : 1,
                                textAlign: 'left',
                                transition: 'all 0.15s ease',
                                color: '#000000'
                            }}
                            onMouseEnter={(e) => {
                                if (product.stock > 0) {
                                    e.currentTarget.style.borderColor = '#6366f1';
                                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#ffffff';
                                e.currentTarget.style.background = product.stock <= 0 ? 'rgba(255, 255, 255, 0.4)' : '#ffffff';
                            }}
                        >
                            <p style={{
                                fontSize: '13px',
                                fontWeight: '500',
                                marginBottom: '6px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {product.name}
                            </p>
                            <p style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#6366f1',
                                marginBottom: '4px'
                            }}>
                                ${product.price.toLocaleString('es-AR')}
                            </p>
                            <p style={{
                                fontSize: '11px',
                                color: product.stock <= 3 ? '#f59e0b' : '#475569'
                            }}>
                                Stock: {product.stock}
                            </p>
                        </button>
                    ))}

                    {filteredProducts.length === 0 && (
                        <div style={{
                            gridColumn: '1/-1',
                            textAlign: 'center',
                            padding: '40px',
                            color: '#000000'
                        }}>
                            No se encontraron productos
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Cart */}
            <div style={{
                flex: proportions.side,
                display: 'flex',
                flexDirection: 'column',
                background: '#ffffff',
                order: settings.posReverseLayout ? 1 : 2
            }}>
                {/* Cart Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ShoppingCart size={18} color="#6366f1" />
                        <span style={{ fontWeight: '600', fontSize: '15px' }}>
                            Carrito ({cart.length})
                        </span>
                    </div>
                    {cart.length > 0 && (
                        <button
                            onClick={() => setCart([])}
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '8px',
                                color: '#ef4444',
                                padding: '6px 10px',
                                fontSize: '12px',
                                fontWeight: '500'
                            }}
                        >
                            Limpiar
                        </button>
                    )}
                </div>

                {/* Cart Items */}
                <div style={{ flex: 1, overflow: 'auto', padding: '12px', order: 0 }}>
                    {cart.length === 0 ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '200px',
                            color: '#000000',
                            fontSize: '13px'
                        }}>
                            <ShoppingCart size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                            Agregá productos al carrito
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {cart.map(item => (
                                <div key={item.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 12px',
                                    background: '#f8fafc',
                                    borderRadius: '10px',
                                    border: '1px solid #000000'
                                }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: '13px', fontWeight: '500', color: '#000000' }} className="truncate">
                                            {item.name}
                                        </p>
                                        <p style={{ fontSize: '12px', color: '#000000' }}>
                                            ${item.price.toLocaleString('es-AR')} c/u
                                        </p>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: '#ffffff',
                                        borderRadius: '8px',
                                        padding: '4px'
                                    }}>
                                        <button
                                            onClick={() => {
                                                if (item.quantity <= 1) {
                                                    setCart(cart.filter(c => c.id !== item.id));
                                                } else {
                                                    setCart(cart.map(c =>
                                                        c.id === item.id ? { ...c, quantity: c.quantity - 1 } : c
                                                    ));
                                                }
                                            }}
                                            style={{
                                                width: '26px',
                                                height: '26px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: '#ffffff',
                                                color: '#000000',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Minus size={12} />
                                        </button>
                                        <span style={{ fontSize: '14px', fontWeight: '600', minWidth: '24px', textAlign: 'center' }}>
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => {
                                                setCart(cart.map(c =>
                                                    c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
                                                ));
                                            }}
                                            style={{
                                                width: '26px',
                                                height: '26px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: '#ffffff',
                                                color: '#000000',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>

                                    {/* Item Total */}
                                    <span style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#6366f1',
                                        minWidth: '70px',
                                        textAlign: 'right'
                                    }}>
                                        ${(item.price * item.quantity).toLocaleString('es-AR')}
                                    </span>

                                    {/* Remove */}
                                    <button
                                        onClick={() => setCart(cart.filter(c => c.id !== item.id))}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#000000',
                                            cursor: 'pointer',
                                            padding: '4px'
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {SidebarActions}
            </div>
        </div>
    );
};
