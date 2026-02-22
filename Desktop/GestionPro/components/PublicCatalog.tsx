import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { ShoppingCart, Phone, MapPin, Clock, Search, X, Plus, Minus, Trash2, Tag, Percent } from 'lucide-react';
import { Toaster, toast } from 'sonner';

// Tweak this to match your DB types
interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    originalPrice?: number; // New field for comparison
    image_url?: string;
    category: string;
    stock?: number;
    isPromo?: boolean; // Flag to identify promos
    promoType?: 'standard' | 'flexible' | 'weighted';
}

interface CartItem extends Product {
    quantity: number;
}

interface TenantInfo {
    business_name: string;
    contact_name: string;
    whatsapp_number?: string; // New field from DB
    address?: string; // New field from DB
    is_open?: boolean; // New field from DB trigger
}

interface Promotion {
    id: string;
    name: string;
    triggerProductIds: string[];
    promoPrice: number;
    active: boolean;
    type?: 'standard' | 'flexible' | 'weighted';
    quantityRequired?: number;
    requirements?: { productId: string; minWeight: number }[];
}

export const PublicCatalog = ({ tenantId }: { tenantId: string }) => {
    const [tenant, setTenant] = useState<TenantInfo | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deliveryMode, setDeliveryMode] = useState<'pickup' | 'delivery'>('pickup');
    const [address, setAddress] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');

    useEffect(() => {
        fetchCatalogData();
    }, [tenantId]);

    const fetchCatalogData = async () => {
        try {
            setLoading(true);
            // 1. Fetch Tenant Info
            const { data: tenantData, error: tenantError } = await supabase
                .from('tenants')
                .select('business_name, contact_name, whatsapp_number, is_open, address')
                .eq('id', tenantId)
                .single();

            if (tenantError) throw tenantError;
            setTenant(tenantData);

            // 2. Fetch Products
            // Note: RLS must allow this.
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('id, name, price, image_url, category, stock')
                .eq('tenant_id', tenantId)
                .eq('is_active', true);

            if (productsError) throw productsError;

            // 3. Fetch Promotions
            const { data: promotionsData, error: promosError } = await supabase
                .from('promotions')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('active', true);

            if (promosError) {
                console.error("Error fetching promotions:", promosError);
            }

            const rawProducts: Product[] = productsData || [];

            // Map DB snake_case to CamelCase manually to avoid crashes
            const rawPromos = (promotionsData || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                triggerProductIds: p.trigger_product_ids || [],
                promoPrice: p.promo_price,
                active: p.active,
                type: p.type,
                quantityRequired: p.quantity_required,
                requirements: p.requirements
            }));

            // 4. Process Promotions into Product-like objects
            const promoProducts: Product[] = rawPromos.map(promo => {
                let originalPrice = 0;

                // Calculate Original Price based on type
                if (promo.type === 'flexible' && promo.quantityRequired) {
                    // Estimate: Average price of pool * quantity
                    const pool = promo.triggerProductIds.map(pid => rawProducts.find(p => p.id === pid)?.price || 0);
                    const avgPrice = pool.length > 0 ? pool.reduce((a, b) => a + b, 0) / pool.length : 0;
                    originalPrice = avgPrice * promo.quantityRequired;
                } else if (promo.type === 'standard' || !promo.type) {
                    // Standard: Sum of all items
                    originalPrice = promo.triggerProductIds.reduce((sum, pid) => {
                        const p = rawProducts.find(prod => prod.id === pid);
                        return sum + (p?.price || 0);
                    }, 0);
                }
                // Weighted promos are hard to estimate properly without weight input, leaving originalPrice 0 or handling differently.

                return {
                    id: promo.id,
                    name: promo.name,
                    description: '¡Oferta Especial!', // Could detail items here
                    price: promo.promoPrice,
                    originalPrice: originalPrice > promo.promoPrice ? originalPrice : undefined,
                    category: 'Ofertas',
                    isPromo: true,
                    promoType: promo.type,
                    // Use a placeholder image or null
                    image_url: undefined
                };
            });

            // Combine Products and Promos. 
            // Optional: Put Promos first?
            setProducts([...promoProducts, ...rawProducts]);

        } catch (error) {
            console.error("Error loading catalog:", error);
            toast.error("No se pudo cargar el catálogo.");
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        toast.success("Agregado al carrito");
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQ = item.quantity + delta;
                return newQ > 0 ? { ...item, quantity: newQ } : item;
            }
            return item;
        }));
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleCheckout = () => {
        if (!tenant) return;

        // Construct WhatsApp Message
        let message = `Hola *${tenant.business_name}*! \nQuiero realizar el siguiente pedido:\n\n`;

        cart.forEach(item => {
            message += `- ${item.quantity}x ${item.name} ($${item.price * item.quantity})`;
            if (item.isPromo) message += ` (PROMO)`;
            message += `\n`;
        });

        message += `\n*TOTAL: $${total}*\n`;
        message += `\nModo: *${deliveryMode === 'delivery' ? 'Envio a Domicilio' : 'Retiro por Local'}*`;

        if (deliveryMode === 'delivery' && address) {
            message += `\nDireccion: ${address}`;
        }

        // Include Business Address if available
        if (tenant.address) {
            message += `\n\n*Ubicacion del Local:*\n${tenant.address}`;
        }


        // Encoder for URL
        const encodedMessage = encodeURIComponent(message);

        // Use custom number if available
        let phone = "";
        if (tenant.whatsapp_number) {
            phone = tenant.whatsapp_number.replace(/\D/g, '');
        } else {
            // Fallback
            const cleanContact = tenant.contact_name?.replace(/\D/g, '') || "";
            if (!tenant.contact_name?.includes('@') && cleanContact.length > 6) {
                phone = "549" + cleanContact;
            }
        }

        if (!phone) {
            toast.error("El comercio no ha configurado un número de WhatsApp.");
            return;
        }

        window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    };

    const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category || 'Varios')))];

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando catálogo...</div>;

    if (!tenant) return <div className="min-h-screen flex items-center justify-center text-red-500">Tienda no encontrada</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans">
            <Toaster position="top-center" />

            {/* HEADER */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
                    <div>
                        <h1 className="font-bold text-lg text-slate-800">{tenant.business_name}</h1>
                        <div className={`flex items-center gap-1 text-xs font-medium ${tenant.is_open ? 'text-green-600' : 'text-red-600'}`}>
                            <span className={`w-2 h-2 rounded-full ${tenant.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            {tenant.is_open ? 'Abierto ahora' : 'Cerrado'}
                        </div>
                    </div>

                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="relative p-2 text-slate-700 hover:bg-slate-100 rounded-full"
                    >
                        <ShoppingCart className="w-6 h-6" />
                        {cart.length > 0 && (
                            <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                {cart.reduce((a, b) => a + b.quantity, 0)}
                            </span>
                        )}
                    </button>
                </div>

                {/* SEARCH & FILTERS */}
                <div className="max-w-md mx-auto px-4 pb-3 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* PRODUCT GRID */}
            {filteredProducts.length > 0 ? (
                <div className="max-w-md mx-auto p-4 grid grid-cols-2 gap-4">
                    {filteredProducts.map(product => (
                        <div key={product.id} className={`bg-white rounded-xl overflow-hidden shadow-sm border flex flex-col ${product.isPromo ? 'border-pink-200 ring-1 ring-pink-100' : 'border-slate-100'}`}>
                            <div className="aspect-square bg-slate-200 relative">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center ${product.isPromo ? 'bg-pink-50 text-pink-300' : 'text-slate-400'}`}>
                                        {product.isPromo ? <Tag className="w-10 h-10" /> : <span className="text-4xl">📷</span>}
                                    </div>
                                )}

                                {/* PROMO BADGE */}
                                {product.isPromo && (
                                    <div className="absolute top-2 right-2 bg-pink-600 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                                        <Percent className="w-3 h-3" /> OFERTA
                                    </div>
                                )}
                            </div>
                            <div className="p-3 flex-1 flex flex-col">
                                <h3 className="font-bold text-sm text-slate-800 line-clamp-2 mb-1">{product.name}</h3>
                                {product.description && <p className="text-xs text-slate-500 line-clamp-2 mb-2 flex-1">{product.description}</p>}
                                <div className="mt-auto flex items-center justify-between">
                                    <div className="flex flex-col">
                                        {product.originalPrice && (
                                            <span className="text-[10px] text-slate-400 line-through font-medium">${product.originalPrice.toFixed(0)}</span>
                                        )}
                                        <span className={`font-bold ${product.isPromo ? 'text-pink-600' : 'text-blue-600'}`}>${product.price}</span>
                                    </div>
                                    <button
                                        onClick={() => addToCart(product)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-full ${product.isPromo ? 'bg-pink-100 text-pink-600 hover:bg-pink-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-slate-500 mb-4">No se encontraron productos</p>
                </div>
            )}

            {/* CART MODAL (Full screen on mobile) */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-200">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center shadow-sm">
                        <h2 className="font-bold text-lg">Tu Pedido</h2>
                        <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-500">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
                                <p>Tu carrito está vacío</p>
                                <button
                                    onClick={() => setIsCartOpen(false)}
                                    className="mt-4 text-blue-600 font-medium"
                                >
                                    Volver al catálogo
                                </button>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="flex gap-4 items-center bg-slate-50 p-3 rounded-lg">
                                    <div className="w-12 h-12 bg-white rounded-md border border-slate-200 overflow-hidden flex-shrink-0">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <span className="text-xs">📷</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm text-slate-800 line-clamp-1">
                                            {item.name}
                                            {item.isPromo && <span className="ml-2 text-[10px] bg-pink-100 text-pink-700 px-1 rounded border border-pink-200">PROMO</span>}
                                        </h4>
                                        <p className="text-xs text-blue-600 font-bold">${item.price * item.quantity}</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-400 hover:text-red-500">
                                            {item.quantity === 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                        </button>
                                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-slate-600 hover:text-blue-600">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-4">
                            {/* Delivery Toggle */}
                            <div className="flex p-1 bg-slate-200 rounded-lg">
                                <button
                                    onClick={() => setDeliveryMode('pickup')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${deliveryMode === 'pickup' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                                >
                                    Retiro por Local
                                </button>
                                <button
                                    onClick={() => setDeliveryMode('delivery')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${deliveryMode === 'delivery' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                                >
                                    Envío a Domicilio
                                </button>
                            </div>

                            {deliveryMode === 'delivery' && (
                                <input
                                    type="text"
                                    placeholder="Dirección de entrega..."
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                                />
                            )}

                            <div className="flex justify-between items-center text-lg font-bold">
                                <span>Total</span>
                                <span>${total}</span>
                            </div>

                            <button
                                onClick={handleCheckout}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 active:scale-[0.98] transition-transform"
                            >
                                <Phone className="w-5 h-5" />
                                Pedir por WhatsApp
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
