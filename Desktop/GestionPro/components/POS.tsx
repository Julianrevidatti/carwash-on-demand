import React, { useState, useEffect, useRef } from 'react';
import { Product, CartItem, Sale, Client, PaymentMethodConfig, CashSession, InventoryBatch, SystemSettings, Promotion, BulkProduct } from '../types';
import { getTotalStock } from '../services/inventoryService';
import { createPreference, checkPaymentStatus } from '../src/services/mercadoPago';
import { QRCodeSVG } from 'qrcode.react';
import { ShoppingCart, Trash2, CreditCard, QrCode, Plus, Minus, CheckCircle, User, Calculator, Lock, Loader2, Smartphone, AlertTriangle, Tag, ExternalLink, RefreshCw, Scale } from 'lucide-react';
import { useUserPermissions } from '../hooks/useUserPermissions';
import { PERMISSIONS } from '../config/permissions';
import { toast } from 'sonner';

interface POSProps {
  products: Product[];
  batches: InventoryBatch[];
  clients: Client[];
  paymentMethods: PaymentMethodConfig[];
  currentSession: CashSession | null;
  onCompleteSale: (sale: Sale) => void;
  onNavigateToCash: () => void;
  settings: SystemSettings;
  promotions: Promotion[];
  bulkProducts?: BulkProduct[];
}

export const POS: React.FC<POSProps> = ({
  products,
  batches,
  clients,
  paymentMethods,
  currentSession,
  onCompleteSale,
  onNavigateToCash,
  settings,
  promotions,
  bulkProducts = []
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(() => {
    // Try to find 'Efectivo' (case insensitive)
    const cashMethod = paymentMethods.find(pm => pm.name.toLowerCase() === 'efectivo' || pm.isCash);
    return cashMethod ? cashMethod.id : (paymentMethods[0]?.id || '');
  });

  // Watch for paymentMethods loading late (async from backend)
  useEffect(() => {
    if ((!selectedPaymentMethod || !paymentMethods.find(pm => pm.id === selectedPaymentMethod)) && paymentMethods.length > 0) {
      const cashMethod = paymentMethods.find(pm => pm.name.toLowerCase() === 'efectivo' || pm.isCash);
      setSelectedPaymentMethod(cashMethod ? cashMethod.id : paymentMethods[0].id);
    }
  }, [paymentMethods, selectedPaymentMethod]);

  const [mpQrUrl, setMpQrUrl] = useState<string | null>(null);
  const [mpExternalReference, setMpExternalReference] = useState<string | null>(null);
  const [mpError, setMpError] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [amountPaid, setAmountPaid] = useState<string>('');

  // Bulk Product State
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedBulkProduct, setSelectedBulkProduct] = useState<BulkProduct | null>(null);
  const [weightInput, setWeightInput] = useState('');

  // MP Modal State
  const [showMPModal, setShowMPModal] = useState(false);
  const [mpStep, setMpStep] = useState<'init' | 'generating' | 'ready' | 'approved' | 'error'>('init');

  const [cashGiven, setCashGiven] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { hasPermission } = useUserPermissions();
  const canProcessSale = hasPermission(PERMISSIONS.POS_PROCESS_SALE);

  // Session check is now handled by parent App component

  const addToCart = (product: Product) => {
    // 2. INVENTORY CHECK (Batches)
    const availableStock = getTotalStock(batches, product.id);
    const inCart = cart.find(c => c.id === product.id)?.quantity || 0;

    if (availableStock <= inCart) {
      alert("No hay stock suficiente disponible (consulte Lotes).");
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setSearchTerm('');
    setTimeout(() => searchInputRef.current?.focus(), 10);
  };

  const handleBulkClick = (product: BulkProduct) => {
    setSelectedBulkProduct(product);
    setWeightInput('');
    setShowWeightModal(true);
  };

  const addBulkToCart = () => {
    if (!selectedBulkProduct) return;
    const weight = parseFloat(weightInput);
    if (!weight || weight <= 0) {
      alert("Ingrese un peso válido.");
      return;
    }

    if (weight > selectedBulkProduct.stockKg) {
      alert(`Stock insuficiente. Disponible: ${selectedBulkProduct.stockKg.toFixed(3)} Kg`);
      return;
    }

    // Create a pseudo-Product for the cart
    const cartItem: CartItem = {
      id: selectedBulkProduct.id,
      name: `${selectedBulkProduct.name} (${weight} Kg)`,
      barcode: selectedBulkProduct.barcode || '',
      cost: selectedBulkProduct.costPerBulk / selectedBulkProduct.weightPerBulk * weight,
      profitMargin: 0,
      price: selectedBulkProduct.pricePerKg,
      supplierId: selectedBulkProduct.supplierId || '',
      isPack: false,
      isWeighted: true,
      quantity: weight
    };

    // Special handling for weighted items in cart:
    // If same item exists, we could merge weights, but separate lines might be clearer for "0.5kg" and "1kg" of same thing?
    // Let's merge for now to keep it simple, or treat as separate?
    // Standard POS usually merges if exactly same price/item.

    setCart(prev => {
      // Check if already in cart
      const existing = prev.find(i => i.id === selectedBulkProduct.id);
      if (existing) {
        return prev.map(i => i.id === selectedBulkProduct.id ? {
          ...i,
          quantity: i.quantity + weight,
          name: `${selectedBulkProduct.name} (${(i.quantity + weight).toFixed(3)} Kg)`
        } : i);
      }
      return [...prev, cartItem];
    });

    setShowWeightModal(false);
    setSelectedBulkProduct(null);
    setSearchTerm('');
    setTimeout(() => searchInputRef.current?.focus(), 10);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    // If it's a weighted item, maybe we don't allow simple +/- 1? 
    // Or we treat +/- 1 as +/- 1 Kg? Let's assume +/- 1 unit for normal, and block for weighted or use 0.1?
    // For simplicity, let's block quantity update for weighted items in this view, user should remove and re-add.
    if (item.isWeighted) {
      if (confirm("Para modificar la cantidad de un producto pesado, elimínelo y vuelva a agregarlo. ¿Desea eliminarlo?")) {
        removeFromCart(id);
      }
      return;
    }

    // Check stock for increment
    if (delta > 0) {
      const available = getTotalStock(batches, id);
      if (available <= item.quantity) {
        return; // blocked
      }
    }

    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // --- PROMOTION ENGINE ---
  const calculatePromoDiscount = (): { discount: number, appliedPromos: string[] } => {
    // Clone cart quantities to simulate deductions
    let currentCartMap: Record<string, number> = {};
    cart.forEach(item => {
      // Initialize map with quantities. For weighted, quantity IS weight.
      currentCartMap[item.id] = (currentCartMap[item.id] || 0) + item.quantity;
    });

    let totalDiscount = 0;
    let promoNames: string[] = [];

    // Sort promotions: Best deals first? Or Flexible first?
    // Let's sort by potential saving per unit to maximize benefit, or just price descending.
    const sortedPromos = [...promotions].sort((a, b) => b.promoPrice - a.promoPrice);

    for (const promo of sortedPromos) {
      if (!promo.active) continue;

      if (promo.type === 'flexible' && promo.quantityRequired) {
        // --- FLEXIBLE (Mix & Match) LOGIC ---
        // 1. Identify items in cart that match the pool
        const matchingItemIds = (promo.triggerProductIds || []).filter(pid => (currentCartMap[pid] || 0) > 0);

        // 2. Count total available quantity of these items
        let totalAvailable = matchingItemIds.reduce((sum, pid) => sum + currentCartMap[pid], 0);

        // 3. Calculate how many "combos" we can form
        const combosPossible = Math.floor(totalAvailable / promo.quantityRequired);

        if (combosPossible > 0) {
          // 4. Calculate Saving
          // We need to deduce the "most expensive" items first to maximize discount? 
          // Or just standard? Usually user benefits if we take expensive ones. 
          // But strict pricing means the pack price is Fixed.
          // Problem: If products have different prices, the "Regular Sum" varies.
          // Strategy: Take the most expensive items first into the combo to maximize the 'perceived' discount?
          // OR: Just take ANY items. Let's sort matching items by price descending.

          let itemsToDeduct = combosPossible * promo.quantityRequired;
          let regularPriceSum = 0;

          // Create a list of all individual units available, sorted by price desc
          const availableUnits: { id: string, price: number }[] = [];
          matchingItemIds.forEach(pid => {
            const product = products.find(p => p.id === pid);
            const qty = currentCartMap[pid];
            for (let i = 0; i < qty; i++) availableUnits.push({ id: pid, price: product?.price || 0 });
          });

          // Sort by price DESC used to maximize discount (removing most expensive from regular total)
          availableUnits.sort((a, b) => b.price - a.price);

          // Take the units that will form the combos
          const unitsUsed = availableUnits.slice(0, itemsToDeduct);

          // Calculate what these units WOULDA cost
          unitsUsed.forEach(u => regularPriceSum += u.price);

          // Deduct from cart map
          unitsUsed.forEach(u => {
            if (currentCartMap[u.id] > 0) currentCartMap[u.id]--;
          });

          // Discount = Valid Regular Price - (Combos * PromoPrice)
          const promoTotal = combosPossible * promo.promoPrice;
          totalDiscount += (regularPriceSum - promoTotal);

          promoNames.push(`${combosPossible}x ${promo.name} (Mix&Match)`);
        }

      } else if (promo.type === 'weighted' && promo.requirements) {
        // --- WEIGHTED LOGIC ---
        // 1. Check if all requirements are met
        // We need to track available weight for each required product because one product might participate in multiple promos
        // but efficiently we process priority based.
        // `currentCartMap` stores quantity (which is weight for bulk).
        // BUT `currentCartMap` was initialized skipping weighted items? 
        // We need to include weighted items in currentCartMap or a parallel structure.
        // Let's patch initialization first.

        // For weighted logic:
        // A promo might require: 0.1kg of A and 0.1kg of B.
        // If we have 0.5kg of A and 0.5kg of B, we have 5 combos?
        // Formula: Min(Available A / Req A, Available B / Req B)

        let possibleCombos = Infinity;

        // First pass: Calculate limit based on each requirement
        for (const req of promo.requirements) {
          const minWeight = Number(req.minWeight);
          const availableWeight = currentCartMap[req.productId] || 0;
          // If item not in cart or not enough weight for even 1 combo
          if (availableWeight < minWeight) {
            possibleCombos = 0;
            break;
          }
          const limit = Math.floor(availableWeight / minWeight);
          if (limit < possibleCombos) possibleCombos = limit;
        }

        if (possibleCombos === Infinity) possibleCombos = 0;

        if (possibleCombos > 0) {
          // Apply Discount
          // Total Price for this combo = PromoPrice
          // We need to subtract the Regular Price of the constituent parts.
          // Regular Price of Parts = Sum(ReqWeight * PricePerKg)

          let regularPricePerCombo = 0;
          promo.requirements.forEach(req => {
            const minWeight = Number(req.minWeight);
            const p = products.find(prod => prod.id === req.productId) || bulkProducts.find(prod => prod.id === req.productId); // Check bulkProducts too
            // In POS cart, item.price is pricePerKg for weighted.
            const cartItem = cart.find(i => i.id === req.productId);
            // Fallback to product list if not in cart (should be if availableWeight > 0)
            const pricePerKg = cartItem ? cartItem.price : ((p as any)?.price || (p as any)?.pricePerKg || 0);

            regularPricePerCombo += (minWeight * pricePerKg);

            // Deduct from availability using the total used weight
            currentCartMap[req.productId] -= (possibleCombos * minWeight);
          });

          const savingsPerCombo = regularPricePerCombo - promo.promoPrice;
          // Ensure savings is positive (otherwise promo is more expensive than regular)
          if (savingsPerCombo > 0) {
            totalDiscount += (savingsPerCombo * possibleCombos);
            promoNames.push(`${possibleCombos}x ${promo.name} (Pesable)`);
          }
        }

      } else {
        // --- STANDARD (Strict) LOGIC ---
        // 1. Aggregate Requirements
        const requirements: Record<string, number> = {};
        promo.triggerProductIds.forEach(pid => {
          requirements[pid] = (requirements[pid] || 0) + 1;
        });

        let applyCount = 0;
        while (true) {
          // 2. Check if cart has enough
          const canApply = Object.entries(requirements).every(([pid, requiredQty]) => {
            return (currentCartMap[pid] || 0) >= requiredQty;
          });

          if (!canApply) break;

          // 3. Deduct
          Object.entries(requirements).forEach(([pid, requiredQty]) => {
            currentCartMap[pid] -= requiredQty;
          });

          // 4. Calculate Saving
          const regularSum = promo.triggerProductIds.reduce((sum, pid) => {
            const p = products.find(prod => prod.id === pid);
            return sum + (p?.price || 0);
          }, 0);

          totalDiscount += (regularSum - promo.promoPrice);
          applyCount++;
        }

        if (applyCount > 0) {
          promoNames.push(`${applyCount}x ${promo.name}`);
        }
      }
    }

    return { discount: totalDiscount, appliedPromos: promoNames };
  };

  const selectedPaymentMethodConfig = paymentMethods.find(pm => pm.id === selectedPaymentMethod);

  // Subtotal calculation: For weighted items, price is per Kg, so price * quantity (weight) is correct.
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const { discount, appliedPromos } = calculatePromoDiscount();
  const totalAfterDiscount = subtotal - discount;

  const surchargePercent = selectedPaymentMethodConfig?.surchargePercent || 0;
  const surchargeAmount = totalAfterDiscount * (surchargePercent / 100);

  const total = totalAfterDiscount + surchargeAmount;

  const cashGivenNum = parseFloat(cashGiven) || 0;
  const changeDue = cashGivenNum - total;

  const handleGenerateMPQR = async () => {
    if (!settings.mpAccessToken) {
      alert("Error: No hay Access Token de Mercado Pago configurado en Ajustes.");
      return;
    }

    setIsGeneratingQr(true);
    try {
      const items = cart.map(item => ({
        title: item.name, // Changed from item.product.name to item.name
        quantity: item.isWeighted ? 1 : item.quantity, // For MP, maybe send 1 unit of "Product X (0.5kg)" with total price? Or send 0.5 quantity? MP supports float quantity? Let's send 1 unit with total calculated price to be safe.
        currency_id: 'ARS',
        unit_price: item.isWeighted ? (item.price * item.quantity) : item.price
      }));

      const externalReference = crypto.randomUUID();
      setMpExternalReference(externalReference);

      const initPoint = await createPreference(items, settings, externalReference);
      setMpQrUrl(initPoint);
    } catch (error: any) {
      alert("Error al generar QR de Mercado Pago: " + error.message);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleCompleteSale = async () => { // Renamed from handleCheckout to handleCompleteSale
    if (cart.length === 0) return;

    // Check Debt Limit for Current Account
    if (selectedPaymentMethodConfig?.isCurrentAccount) {
      if (!selectedClient) {
        alert("Debe seleccionar un cliente para cobrar en Cuenta Corriente.");
        return;
      }
      const currentDebt = selectedClient.currentAccountBalance || 0;
      const projectedDebt = currentDebt + total;

      if (projectedDebt > settings.maxClientDebt) {
        alert(`⛔ OPERACIÓN BLOQUEADA\n\nEl cliente excede el límite de crédito configurado.\n\nDeuda Actual: $${currentDebt.toFixed(2)}\nCompra Actual: $${total.toFixed(2)}\nProyectado: $${projectedDebt.toFixed(2)}\nLímite Máximo: $${settings.maxClientDebt.toFixed(2)}`);
        return;
      }
    }

    const isMPMethod = selectedPaymentMethodConfig?.name.toLowerCase().includes('mercado pago') || selectedPaymentMethodConfig?.name.toLowerCase().includes('mp');

    if (isMPMethod) {
      // Logic for ENABLED integration
      if (settings.enableMpIntegration) {
        if (!settings.mpAccessToken) {
          alert("Error: Mercado Pago está activado pero no configurado. Ingrese a Configuración > Integraciones.");
          return;
        }

        setShowMPModal(true);

        if (!mpQrUrl) {
          setMpStep('generating');
          try {
            const items = cart.map(item => ({
              title: item.name,
              quantity: item.isWeighted ? 1 : item.quantity,
              currency_id: 'ARS',
              unit_price: item.isWeighted ? (item.price * item.quantity) : item.price
            }));

            const externalReference = crypto.randomUUID();
            setMpExternalReference(externalReference);

            const initPoint = await createPreference(items, settings, externalReference);
            setMpQrUrl(initPoint);
            setMpStep('ready');
          } catch (error: any) {
            console.error("Error generating QR:", error);
            setMpError(error.message);
            setMpStep('error');
          }
        } else {
          setMpStep('ready');
        }
        return;
      }
      // Logic for DISABLED integration (Manual Record)
      // Falls through to finalizeSale()
    }

    await finalizeSale();
  };

  const finalizeSale = async () => {
    const sale: Sale = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      sessionId: currentSession.id,
      items: [...cart],
      subtotal,
      surcharge: surchargeAmount,
      total,
      discount,
      paymentMethodName: selectedPaymentMethodConfig?.name || 'Unknown',
      clientId: selectedClient?.id
    };

    try {
      await onCompleteSale(sale);
      // Only clear cart if sale completed successfully
      setCart([]);
      setShowMPModal(false);
      setCashGiven('');
      setMpStep('init');
      toast.success("¡Venta registrada con éxito!");
    } catch (error) {
      console.error("Error processing sale:", error);
      // Toast is likely handled by onCompleteSale (handleNewSale)
    }
  };

  // Poll for MP status logic (Real API)
  useEffect(() => {
    let interval: any;
    if (showMPModal && mpStep === 'ready' && mpExternalReference && settings.mpAccessToken) {
      interval = setInterval(async () => {
        setIsCheckingStatus(true);
        try {
          const token = settings.mpAccessToken || settings.mercadoPagoAccessToken || '';
          const isPaid = await checkPaymentStatus(mpExternalReference, token);
          if (isPaid) {
            setMpStep('approved');
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Polling error:", error);
        } finally {
          setIsCheckingStatus(false);
        }
      }, 5000); // Check every 5 seconds
    }
    return () => clearInterval(interval);
  }, [showMPModal, mpStep, mpExternalReference, settings]);

  // Auto-close on approval
  useEffect(() => {
    if (mpStep === 'approved') {
      const timer = setTimeout(() => finalizeSale(), 2000);
      return () => clearTimeout(timer);
    }
  }, [mpStep]);

  const filteredProducts = (products || []).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm));
  const filteredBulk = (bulkProducts || []).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode && p.barcode.includes(searchTerm)));

  // Scanner Handler (for barcode scanners sending Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const exactMatch = products.find(p => p.barcode === searchTerm);
      const exactBulkMatch = bulkProducts.find(p => p.barcode === searchTerm);

      if (exactMatch) {
        addToCart(exactMatch);
      } else if (exactBulkMatch) {
        handleBulkClick(exactBulkMatch);
      } else if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
      } else if (filteredBulk.length === 1) {
        handleBulkClick(filteredBulk[0]);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Product Selector */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Escanear código..."
          className="w-full p-4 rounded-xl border border-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pr-2 pb-4">
          {/* Regular Products */}
          {filteredProducts.map(p => {
            const stock = getTotalStock(batches, p.id);
            return (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between ${stock === 0 ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div>
                  <h4 className="font-semibold text-gray-800 line-clamp-2">{p.name}</h4>
                  <p className={`text-xs mb-2 ${stock < 5 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>Stock: {stock}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-lg font-bold text-blue-600">${p.price}</span>
                  <div className="bg-blue-50 p-2 rounded-full text-blue-600">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )
          })}

          {/* Bulk Products */}
          {filteredBulk.map(p => (
            <div
              key={p.id}
              onClick={() => handleBulkClick(p)}
              className={`bg-purple-50 p-4 rounded-xl shadow-sm border border-purple-100 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between ${p.stockKg <= 0.1 ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Scale className="w-3 h-3 text-purple-600" />
                  <span className="text-[10px] uppercase font-bold text-purple-600">Granel</span>
                </div>
                <h4 className="font-semibold text-gray-800 line-clamp-2">{p.name}</h4>
                <p className={`text-xs mb-2 ${p.stockKg < 1 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>Stock: {p.stockKg.toFixed(2)} Kg</p>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-lg font-bold text-purple-700">${p.pricePerKg}/kg</span>
                <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Checkout Sidebar */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col h-full overflow-hidden">
        <div className="p-3 border-b border-gray-100 bg-gray-50 rounded-t-xl flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <User className="w-5 h-5 text-blue-600" />
            <select
              className="bg-white border text-sm font-semibold text-gray-700 outline-none p-2 rounded-lg w-full shadow-sm focus:ring-2 focus:ring-blue-500"
              value={selectedClient?.id || ''}
              onChange={(e) => setSelectedClient(clients.find(c => c.id === e.target.value) || null)}
            >
              <option value="">Consumidor Final (Sin Cliente)</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.currentAccountBalance > 0 ? `(Deuda: $${c.currentAccountBalance})` : ''}
                </option>
              ))}
            </select>
          </div>
          {selectedClient?.currentAccountBalance !== undefined && selectedClient.currentAccountBalance > 0 && (
            <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold shrink-0">
              Deuda: ${selectedClient.currentAccountBalance}
            </span>
          )}
        </div>

        <div className="p-4 border-b border-gray-100 bg-white space-y-3 shrink-0">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-sm text-pink-600 font-bold">
                <span>Descuento Promo</span><span>-${discount.toFixed(2)}</span>
              </div>
            )}

            {surchargeAmount > 0 && (
              <div className="flex justify-between text-sm text-blue-600">
                <span>Recargo ({surchargePercent}%)</span><span>+${surchargeAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-dashed">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Método de Pago</label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map(pm => (
                  <button
                    key={pm.id}
                    onClick={() => {
                      setSelectedPaymentMethod(pm.id);
                      setMpQrUrl(null); // Reset QR if method changes
                    }}
                    className={`p-2 rounded-lg border flex items-center justify-center gap-2 font-medium text-sm transition-colors ${selectedPaymentMethod === pm.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    {pm.isCash && <Calculator className="w-3 h-3" />}
                    {(pm.name.toLowerCase().includes('mercado pago') || pm.name.toLowerCase().includes('mp')) && <QrCode className="w-3 h-3" />}
                    {!pm.isCash && !(pm.name.toLowerCase().includes('mercado pago') || pm.name.toLowerCase().includes('mp')) && <CreditCard className="w-3 h-3" />}
                    {pm.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mercado Pago QR Logic */}
          {(() => {
            const selectedConfig = paymentMethods.find(pm => pm.id === selectedPaymentMethod);
            const isMP = selectedConfig?.name.toLowerCase().includes('mercado pago') || selectedConfig?.name.toLowerCase().includes('mp');
            if (isMP) {
              return (
                <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200 text-center">
                  {!mpQrUrl ? (
                    <button
                      onClick={handleGenerateMPQR}
                      disabled={isGeneratingQr}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                    >
                      {isGeneratingQr ? <Loader2 className="animate-spin w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                      Generar QR
                    </button>
                  ) : (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                      <p className="text-xs font-bold text-gray-800 mb-2">Escanea para pagar</p>
                      <div className="bg-white p-2 rounded-lg shadow-md mb-2">
                        <QRCodeSVG value={mpQrUrl} size={120} />
                      </div>
                      <a href={mpQrUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mb-2">
                        Abrir link <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {selectedPaymentMethod === 'cash' ? 'Monto Recibido' : 'Monto a Confirmar'}
            </label>
            <div className="bg-gray-100 p-2 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-gray-500" />
                <input type="number" placeholder="0.00" className="bg-transparent w-20 outline-none border-b border-gray-300 focus:border-blue-500 text-sm" value={cashGiven} onChange={e => setCashGiven(e.target.value)} />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 block">Vuelto</span>
                <span className="font-bold text-sm bg-white px-2 rounded border border-gray-200">${changeDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCompleteSale}
            disabled={cart.length === 0 || !canProcessSale}
            className={`w-full py-3 rounded-xl font-bold text-lg shadow-md flex justify-center items-center gap-2 ${!canProcessSale
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
          >
            {!canProcessSale && <Lock className="w-5 h-5" />}
            {canProcessSale ? 'COBRAR' : 'SIN PERMISO'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">Carrito vacío</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800 line-clamp-1">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.isWeighted
                      ? `$${item.price}/kg x ${item.quantity.toFixed(3)} kg`
                      : `$${item.price} x ${item.quantity}`
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!item.isWeighted && (
                    <>
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-200 rounded"><Minus className="w-3 h-3" /></button>
                      <span className="font-bold text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-200 rounded"><Plus className="w-3 h-3" /></button>
                    </>
                  )}
                  {item.isWeighted && (
                    <span className="font-bold text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {item.quantity.toFixed(3)} Kg (${(item.price * item.quantity).toFixed(0)})
                    </span>
                  )}
                  <button onClick={() => removeFromCart(item.id)} className="ml-2 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))
          )}

          {/* Active Promotions Display */}
          {appliedPromos.length > 0 && (
            <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
              <p className="text-xs text-gray-500 font-bold uppercase mb-2">Promociones Aplicadas</p>
              {appliedPromos.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-pink-600 font-bold bg-pink-50 p-2 rounded">
                  <Tag className="w-3 h-3" /> {p}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mercado Pago Live Modal */}
      {showMPModal && (
        <div className="fixed inset-0 bg-blue-600/90 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden">

            {/* Header */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-blue-500">Mercado Pago</h3>
              <p className="text-2xl font-black text-gray-800">${total.toFixed(2)}</p>
            </div>

            {/* Steps */}
            {mpStep === 'generating' && (
              <div className="py-12 flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 text-sm">Creando orden en Mercado Pago...</p>
              </div>
            )}

            {mpStep === 'ready' && (
              <div className="space-y-4 animate-in zoom-in">
                <div className="w-56 h-56 bg-white border-2 border-blue-100 mx-auto rounded-xl flex items-center justify-center shadow-inner relative">
                  {/* Real QR */}
                  {mpQrUrl ? (
                    <QRCodeSVG value={mpQrUrl} size={190} />
                  ) : (
                    <QrCode className="w-48 h-48 text-gray-300" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                    <Smartphone className="w-32 h-32" />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Escaneá el código con la App.</p>
                  <p className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1 min-h-[20px]">
                    {isCheckingStatus ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                        <span className="text-blue-500 font-bold">Verificando pago...</span>
                      </>
                    ) : (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> Esperando confirmación de pago...
                      </>
                    )}
                  </p>

                  <button
                    onClick={async () => {
                      if (!mpExternalReference) return;
                      setIsCheckingStatus(true);
                      const token = settings.mpAccessToken || settings.mercadoPagoAccessToken || '';
                      const isPaid = await checkPaymentStatus(mpExternalReference, token);
                      setIsCheckingStatus(false);

                      if (isPaid) {
                        setMpStep('approved');
                      } else {
                        alert("El pago aún no se encuentra acreditado. Intente nuevamente en unos segundos.");
                      }
                    }}
                    disabled={isCheckingStatus}
                    className="mt-4 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    {isCheckingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Verificar Estado del Pago
                  </button>
                </div>
              </div>
            )}

            {mpStep === 'error' && (
              <div className="py-8 animate-in shake">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">Error al generar QR</h4>
                <p className="text-gray-500 text-sm mb-4">{mpError || "Ocurrió un error inesperado."}</p>
                <button
                  onClick={() => {
                    setMpStep('generating');
                    handleCompleteSale(); // Retry
                  }}
                  className="text-blue-600 font-bold hover:underline text-sm"
                >
                  Intentar nuevamente
                </button>
              </div>
            )}

            {mpStep === 'approved' && (
              <div className="py-8 animate-in bounce-in">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h4 className="text-2xl font-bold text-gray-800">¡Pago Aprobado!</h4>
                <p className="text-gray-500 text-sm">Imprimiendo ticket...</p>
              </div>
            )}

            <button
              onClick={() => setShowMPModal(false)}
              className="mt-8 text-sm text-gray-400 hover:text-red-500"
            >
              Cancelar Operación
            </button>
          </div>
        </div>
      )}

      {/* Bulk Weight Modal */}
      {showWeightModal && selectedBulkProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Ingresar Peso (Kg)</h3>
            <p className="text-sm text-gray-500 mb-4">Producto: <span className="font-bold">{selectedBulkProduct.name}</span></p>

            <div className="mb-4">
              <input
                type="number"
                autoFocus
                className="w-full text-3xl font-bold text-center border-b-2 border-blue-500 outline-none pb-2"
                placeholder="0.000"
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addBulkToCart(); }}
              />
              <p className="text-center text-xs text-gray-400 mt-1">Kilogramos</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowWeightModal(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={addBulkToCart} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Agregar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
