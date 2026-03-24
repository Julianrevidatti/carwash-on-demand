import React, { useState, useEffect, useRef } from 'react';
import { Product, CartItem, Sale, Client, PaymentMethodConfig, CashSession, InventoryBatch, SystemSettings, Promotion, BulkProduct } from '../types';
import { getTotalStock } from '../services/inventoryService';
import { createPreference, checkPaymentStatus } from '../src/services/mercadoPago';
import { QRCodeSVG } from 'qrcode.react';
import { ShoppingCart, Trash2, CreditCard, QrCode, Plus, Minus, CheckCircle, User, Calculator, Lock, Loader2, Smartphone, AlertTriangle, Tag, ExternalLink, RefreshCw, Scale, DollarSign, Printer, Zap } from 'lucide-react';
import { useUserPermissions } from '../hooks/useUserPermissions';
import { PERMISSIONS } from '../config/permissions';
import { toast } from 'sonner';
import { webPrintService } from '../src/services/webPrintService';
import { useStore } from '../src/store/useStore';

interface POSProps {
  clients: Client[];
  paymentMethods: PaymentMethodConfig[];
  currentSession: CashSession | null;
  onCompleteSale: (sale: Sale) => void;
  onNavigateToCash: () => void;
  settings: SystemSettings;
  promotions: Promotion[];
}


export const POSComponent: React.FC<POSProps> = ({
  clients,
  paymentMethods,
  currentSession,
  onCompleteSale,
  onNavigateToCash,
  settings,
  promotions
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
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);

  // Bulk Product State
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedBulkProduct, setSelectedBulkProduct] = useState<BulkProduct | null>(null);
  const [weightInput, setWeightInput] = useState('');

  // MP Modal State
  const [showMPModal, setShowMPModal] = useState(false);
  const [mpStep, setMpStep] = useState<'init' | 'generating' | 'ready' | 'approved' | 'error'>('init');

  const [cashGiven, setCashGiven] = useState<string>('');
  const [priceInput, setPriceInput] = useState<string>(''); // For price-to-weight conversion
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { hasPermission } = useUserPermissions();
  const currentTenant = useStore(state => state.currentTenant);
  const batchesFromStore = useStore(state => state.batches);
  const stockMap = useStore(state => state.stockMap); // O(1) Stock Access
  const productsFromStore = useStore(state => state.products);
  const bulkProductsFromStore = useStore(state => state.bulkProducts);
  const canProcessSale = hasPermission(PERMISSIONS.POS_ACCESS);




  // --- AUDIO FEEDBACK ---
  const playScanSound = () => {
    try {
      // Short high-pitched beep using AudioContext (no external file needed)
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.warn("Audio feedback failed:", e);
    }
  };

  // --- STICKY FOCUS ---
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isModalOpen = showWeightModal || showPaymentModal || showMPModal || showSuccessModal;
      
      // 1. If a modal is open, don't steal focus (usually handled by modal internal logic)
      if (isModalOpen || target.closest('.fixed')) return;

      // 2. If we click a different input (like Amount Paid), let the user type
      if (target.tagName === 'INPUT' && target !== searchInputRef.current) return;

      // 3. For any other click (labels, divs, or BUTTONS like payment methods), return to search
      // A small delay ensures that button onClick handlers execute first
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    };

    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, [showWeightModal, showPaymentModal, showMPModal, showSuccessModal]);

  const addToCart = (product: Product) => {
    // 2. INVENTORY CHECK (Batches) - Use optimized stockMap O(1)
    const availableStock = getTotalStock(batchesFromStore, product.id, stockMap);
    const inCart = cart.find(c => c.id === product.id)?.quantity || 0;

    if (availableStock <= inCart) {
      alert(`No hay stock suficiente disponible para ${product.name}.`);
      return;
    }



    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    playScanSound(); // Play sound on successful addition
    setSearchTerm('');
    setTimeout(() => searchInputRef.current?.focus(), 10);
  };

  const handleBulkClick = (product: BulkProduct) => {
    setSelectedBulkProduct(product);
    setWeightInput('');
    setPriceInput('');
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
    setPriceInput('');
    playScanSound(); // Play sound on weight added
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

    // Check stock for increment - Use optimized stockMap O(1)
    if (delta > 0) {
      const available = getTotalStock(batchesFromStore, id, stockMap);
      if (available <= item.quantity) {
        toast.warning("Stock máximo alcanzado");
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
            const product = productsFromStore.find(p => p.id === pid);

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
            const p = productsFromStore.find(prod => prod.id === req.productId) || bulkProductsFromStore.find(prod => prod.id === req.productId);
 // Check bulkProducts too
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
            const p = productsFromStore.find(prod => prod.id === pid);
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

    if (isProcessingSale) return;
    setIsProcessingSale(true);

    try {
      await finalizeSale();
    } finally {
      setIsProcessingSale(false);
    }
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
      
      // -- TICKET PRINTING (MODIFIED: Choice moved to modal) --
      // if (settings.autoPrintTicket) {
      //   toast.info("Imprimiendo ticket...", { duration: 2000 });
      //   webPrintService.printReceipt(sale, settings, currentTenant?.businessName || 'Mi Negocio');
      // }

      // Store sale data and show success modal
      setLastCompletedSale(sale);
      setShowSuccessModal(true);

      // Only clear cart if sale completed successfully
      setCart([]);
      setShowMPModal(false);
      setCashGiven('');
      setMpStep('init');
      
      // Reset to default payment method (Efectivo)
      const cashMethod = paymentMethods.find(pm => pm.name.toLowerCase() === 'efectivo' || pm.isCash);
      if (cashMethod) setSelectedPaymentMethod(cashMethod.id);
      // toast.success("¡Venta registrada con éxito!"); // Modal replaces toast
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

  const deferredSearchTerm = React.useDeferredValue(searchTerm);

  const filteredProducts = React.useMemo(() => {
    if (!productsFromStore) return [];
    if (!deferredSearchTerm) return [];
    const lowerSearch = deferredSearchTerm.toLowerCase();
    return productsFromStore.filter(p => p.name.toLowerCase().includes(lowerSearch) || p.barcode.includes(deferredSearchTerm));
  }, [productsFromStore, deferredSearchTerm]);


  const filteredBulk = React.useMemo(() => {
    if (!bulkProductsFromStore) return [];
    if (!deferredSearchTerm) return [];
    const lowerSearch = deferredSearchTerm.toLowerCase();
    return bulkProductsFromStore.filter(p => p.name.toLowerCase().includes(lowerSearch) || (p.barcode && p.barcode.includes(deferredSearchTerm)));
  }, [bulkProductsFromStore, deferredSearchTerm]);


  // We need to keep the exact match logic FAST on the original searchTerm, not the deferred one!
  // Because the Enter key fires on the current searchTerm immediately.

  // Scanner Handler (for barcode scanners sending Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const exactMatch = productsFromStore.find(p => p.barcode === searchTerm);
      const exactBulkMatch = bulkProductsFromStore.find(p => p.barcode === searchTerm);

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

  const layout = settings.posLayout || 'classic';
  
  const getLayoutClasses = () => {
    switch (layout) {
      case 'modern':
        return { container: 'lg:grid-cols-2', products: 'lg:col-span-1', cart: 'lg:col-span-1' };
      case 'checkout-focused':
        return { container: 'lg:grid-cols-5', products: 'lg:col-span-2', cart: 'lg:col-span-3' };
      case 'compact':
        return { container: 'lg:grid-cols-4', products: 'lg:col-span-1', cart: 'lg:col-span-3' };
      case 'classic':
      default:
        return { container: 'lg:grid-cols-3', products: 'lg:col-span-2', cart: 'lg:col-span-1' };
    }
  };

  const layoutClasses = getLayoutClasses();

  const isMinimalist = settings.posHideProductsByDefault && searchTerm.trim() === '';

  return (
    <div className={`grid grid-cols-1 ${isMinimalist ? 'lg:grid-cols-1 max-w-6xl mx-auto w-full' : layoutClasses.container} gap-2 xl:gap-4 2xl:gap-6 h-[calc(100vh-140px)]`}>
      {/* Product / Main Content Selector */}
      <div className={`${isMinimalist ? 'lg:col-span-1' : layoutClasses.products} ${settings.posReverseLayout ? 'lg:order-last' : 'lg:order-first'} flex flex-col gap-4 overflow-hidden`}>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar producto o escanear código..."
              className="w-full pl-10 pr-4 py-2.5 xl:py-4 rounded-xl border border-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 text-sm xl:text-base font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 xl:w-5 xl:h-5 text-gray-400" />
          </div>
          {isMinimalist && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 font-bold text-xs animate-pulse">
              <Zap className="w-3 h-3" /> Modo Minimalista Activo
            </div>
          )}
        </div>

        {isMinimalist ? (
          <div className="flex-1 flex flex-col lg:flex-row gap-4 xl:gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 pb-2">
            {/* Left/Main Area: Cart Content */}
            <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-600 p-1.5 rounded-lg">
                    <ShoppingCart className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800">Detalle del Ticket</h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{cart.length} Artículos</span>
                  {cart.length > 0 && (
                    <button 
                      onClick={() => { if(confirm('¿Vaciar carrito?')) setCart([]); }}
                      className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 bg-red-50 px-2 py-1 rounded"
                    >
                      <Trash2 className="w-3 h-3" /> Vaciar
                    </button>
                  )}
                </div>
              </div>

              {/* Cart Items List (Shared Logic) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-white">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border-2 border-dashed border-gray-100">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                    <p className="font-medium text-lg">El carrito está esperando...</p>
                    <p className="text-xs text-gray-400 max-w-[200px] text-center">Escaneá un producto o escribí en el buscador para comenzar la venta.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 xl:p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl transition-all group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-sm xl:text-base text-gray-800 truncate">{item.name}</p>
                          {item.isWeighted && <Scale className="w-3 h-3 text-purple-600" />}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-gray-600">
                            {item.isWeighted
                              ? `$${item.price}/kg x ${item.quantity.toFixed(3)} kg`
                              : `$${item.price} c/u`
                            }
                          </span>
                          {!item.isWeighted && <span className="font-bold text-gray-400">Total: ${(item.price * item.quantity).toFixed(2)}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 xl:gap-6 shrink-0 ml-4">
                        {!item.isWeighted && (
                          <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-0.5">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 xl:p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><Minus className="w-4 h-4" /></button>
                            <span className="font-black text-sm xl:text-lg min-w-[32px] text-center text-gray-800 px-1">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 xl:p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><Plus className="w-4 h-4" /></button>
                          </div>
                        )}
                        {item.isWeighted && (
                          <div className="bg-purple-600 text-white px-3 py-1.5 rounded-xl flex flex-col items-center">
                            <span className="text-[10px] uppercase font-bold opacity-80 leading-none mb-1">Total</span>
                            <span className="font-black text-sm xl:text-base leading-none">${(item.price * item.quantity).toFixed(0)}</span>
                          </div>
                        )}
                        <button onClick={() => removeFromCart(item.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
                
                {/* Active Promotions Display */}
                {appliedPromos.length > 0 && cart.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-dashed border-gray-200">
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-4">Ofertas Aplicadas</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {appliedPromos.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-4 text-lg xl:text-xl text-pink-600 font-black bg-pink-50 border-2 border-pink-100 p-5 rounded-3xl animate-in slide-in-from-left duration-500 shadow-sm shadow-pink-100/50">
                          <div className="p-2 bg-white rounded-xl shadow-sm border border-pink-100">
                            <Tag className="w-6 h-6" />
                          </div>
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right/Actions Area: Customer & Totals */}
            <div className="w-full lg:w-96 flex flex-col gap-4 overflow-y-auto pr-1 pb-4 shrink-0">
              {/* Client Selection (Minimalist Version) */}
              <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-bold text-gray-800">Cliente</h4>
                </div>
                <select
                  className="w-full bg-gray-50 border-2 border-gray-100 text-sm font-bold text-gray-700 outline-none p-3 rounded-xl focus:border-blue-500 focus:bg-white transition-all"
                  value={selectedClient?.id || ''}
                  onChange={(e) => setSelectedClient(clients.find(c => c.id === e.target.value) || null)}
                >
                  <option value="">Consumidor Final</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.currentAccountBalance > 0 ? `(Saldo: -$${c.currentAccountBalance})` : ''}
                    </option>
                  ))}
                </select>
                {selectedClient?.currentAccountBalance !== undefined && selectedClient.currentAccountBalance > 0 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-red-600">Deuda Pendiente:</span>
                    <span className="text-sm font-black text-red-700">${selectedClient.currentAccountBalance}</span>
                  </div>
                )}
              </div>

              {/* Totals & Payments (Minimalist Version) */}
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex-1 flex flex-col">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-pink-400 font-bold">
                      <span>Ahorro Promociones</span><span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  {surchargeAmount > 0 && (
                    <div className="flex justify-between text-sm text-blue-400">
                      <span>Recargo ({surchargePercent}%)</span><span>+${surchargeAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-slate-800 flex justify-between items-end">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">Total a Cobrar</span>
                    <span className="text-4xl font-black text-white">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Medio de Pago</label>
                    <div className="grid grid-cols-2 gap-2">
                      {paymentMethods.map(pm => (
                        <button
                          key={pm.id}
                          onClick={() => {
                            setSelectedPaymentMethod(pm.id);
                            setMpQrUrl(null);
                          }}
                          className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 ${selectedPaymentMethod === pm.id ? 'bg-white border-white text-slate-900 shadow-lg shadow-white/10' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                        >
                          {pm.isCash && <Calculator className="w-4 h-4" />}
                          {(pm.name.toLowerCase().includes('mercado pago') || pm.name.toLowerCase().includes('mp')) && <QrCode className="w-4 h-4" />}
                          {!pm.isCash && !(pm.name.toLowerCase().includes('mercado pago') || pm.name.toLowerCase().includes('mp')) && <CreditCard className="w-4 h-4" />}
                          <span className="text-[10px] font-black uppercase tracking-tight truncate w-full text-center">{pm.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* MP QR integration inside Minimalist Sidebar */}
                  {(() => {
                    const selectedConfig = paymentMethods.find(pm => pm.id === selectedPaymentMethod);
                    const isMP = selectedConfig?.name.toLowerCase().includes('mercado pago') || selectedConfig?.name.toLowerCase().includes('mp');
                    if (isMP) {
                      return (
                        <div className="p-3 bg-white rounded-2xl text-slate-900 animate-in fade-in zoom-in duration-300">
                          {!mpQrUrl ? (
                            <button
                              onClick={handleGenerateMPQR}
                              disabled={isGeneratingQr}
                              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                              {isGeneratingQr ? <Loader2 className="animate-spin w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                              Generar QR MP
                            </button>
                          ) : (
                            <div className="flex flex-col items-center">
                              <div className="p-2 bg-white rounded-lg mb-2">
                                <QRCodeSVG value={mpQrUrl} size={140} />
                              </div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase">Escanea con la App</p>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="mt-auto pt-4 space-y-4">
                    {/* Pay Recibe/Change Section */}
                    <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pago con</span>
                        <input 
                          type="number" 
                          placeholder="0.00" 
                          className="bg-transparent text-right font-black text-lg outline-none w-28 text-white focus:text-emerald-400 transition-colors" 
                          value={cashGiven} 
                          onChange={e => setCashGiven(e.target.value)} 
                        />
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-700 pt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vuelto</span>
                        <span className={`font-black text-lg ${changeDue >= 0 ? 'text-emerald-400' : 'text-slate-600'}`}>${changeDue.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleCompleteSale}
                      disabled={cart.length === 0 || !canProcessSale || isProcessingSale}
                      className={`w-full py-5 rounded-2xl font-black text-xl shadow-xl flex justify-center items-center gap-2 transform active:scale-95 transition-all ${
                        (!canProcessSale || cart.length === 0 || isProcessingSale)
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/20'
                        }`}
                    >
                      {!canProcessSale ? <Lock className="w-6 h-6" /> : (isProcessingSale ? <Loader2 className="w-6 h-6 animate-spin" /> : null)}
                      {canProcessSale ? (isProcessingSale ? 'COBRANDO...' : 'COBRAR') : 'BLOQUEADO'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 xl:gap-4 overflow-y-auto pr-2 pb-4">
            {/* Regular Products */}
            {(deferredSearchTerm === '' ? (productsFromStore || []) : filteredProducts).map(p => {
              const stock = getTotalStock(batchesFromStore, p.id, stockMap);

              return (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={`bg-white p-2.5 xl:p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between ${stock === 0 ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div>
                    <h4 className="font-semibold text-gray-800 text-xs xl:text-sm line-clamp-2">{p.name}</h4>
                    <p className={`text-[10px] xl:text-xs mb-1 xl:mb-2 ${stock < 5 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>Stock: {stock}</p>
                  </div>
                  <div className="flex justify-between items-center mt-1 xl:mt-2">
                    <span className="text-sm xl:text-lg font-bold text-blue-600">${p.price}</span>
                    <div className="bg-blue-50 p-1.5 xl:p-2 rounded-full text-blue-600">
                      <Plus className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Bulk Products */}
            {(deferredSearchTerm === '' ? (bulkProductsFromStore || []) : filteredBulk).map(p => {
              const stockKg = stockMap[p.id] !== undefined ? stockMap[p.id] : p.stockKg;
              return (
                <div
                  key={p.id}
                  onClick={() => handleBulkClick(p)}
                  className={`bg-purple-50 p-2.5 xl:p-4 rounded-xl shadow-sm border border-purple-100 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between ${stockKg <= 0.001 ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div>
                    <div className="flex items-center gap-1 mb-0.5 xl:mb-1">
                      <Scale className="w-2.5 h-2.5 xl:w-3 xl:h-3 text-purple-600" />
                      <span className="text-[9px] xl:text-[10px] uppercase font-bold text-purple-600">Granel</span>
                    </div>
                    <h4 className="font-semibold text-gray-800 text-xs xl:text-sm line-clamp-2">{p.name}</h4>
                    <p className={`text-[10px] xl:text-xs mb-1 xl:mb-2 ${stockKg < 1 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>Stock: {stockKg.toFixed(2)} Kg</p>
                  </div>
                  <div className="flex justify-between items-center mt-1 xl:mt-2">
                    <span className="text-sm xl:text-lg font-bold text-purple-700">${p.pricePerKg}/kg</span>
                    <div className="bg-purple-100 p-1.5 xl:p-2 rounded-full text-purple-600">
                      <Plus className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        )}
      </div>

      {/* Checkout Sidebar (Hidden in Minimalist mode when searchTerm is empty) */}
      {!isMinimalist && (
        <div className={`${layoutClasses.cart} ${settings.posReverseLayout ? 'lg:order-first' : 'lg:order-last'} bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col h-full overflow-hidden`}>

        <div className="p-1.5 xl:p-2 border-b border-gray-100 bg-gray-50 rounded-t-xl flex justify-between items-center shrink-0 order-first">
          <div className="flex items-center gap-1 xl:gap-2 flex-1">
            <User className="w-3.5 h-3.5 xl:w-5 xl:h-5 text-blue-600" />
            <select
              className="bg-white border text-[10px] xl:text-sm font-semibold text-gray-700 outline-none p-1 xl:p-2 rounded-lg w-full shadow-sm focus:ring-2 focus:ring-blue-500"
              value={selectedClient?.id || ''}
              onChange={(e) => setSelectedClient(clients.find(c => c.id === e.target.value) || null)}
            >
              <option value="">Consumidor Final</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.currentAccountBalance > 0 ? `(Deuda: $${c.currentAccountBalance})` : ''}
                </option>
              ))}
            </select>
          </div>
          {selectedClient?.currentAccountBalance !== undefined && selectedClient.currentAccountBalance > 0 && (
            <span className="ml-1 text-[8px] xl:text-xs bg-red-100 text-red-600 px-1 xl:px-2 py-0.5 xl:py-1 rounded font-bold shrink-0">
              Deuda: ${selectedClient.currentAccountBalance}
            </span>
          )}
        </div>

        <div className={`p-2 xl:p-4 border-b border-gray-100 bg-white space-y-1 xl:space-y-3 shrink-0 ${settings.posSidebarActions === 'bottom' ? 'order-last border-t' : 'order-1 border-b'}`}>
          <div className="space-y-0.5 xl:space-y-2">
            <div className="flex justify-between text-[10px] xl:text-sm text-gray-600">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-[10px] xl:text-sm text-pink-600 font-bold">
                <span>Descuento Promo</span><span>-${discount.toFixed(2)}</span>
              </div>
            )}

            {surchargeAmount > 0 && (
              <div className="flex justify-between text-[10px] xl:text-sm text-blue-600">
                <span>Recargo ({surchargePercent}%)</span><span>+${surchargeAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-base xl:text-xl font-bold text-gray-900 pt-0.5 xl:pt-2 border-t border-dashed">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>

            <div className="mt-1 xl:mt-4">
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5 xl:mb-1">Método de Pago</label>
              <div className="grid grid-cols-2 gap-1 xl:gap-2">
                {paymentMethods.map(pm => (
                  <button
                    key={pm.id}
                    onClick={() => {
                      setSelectedPaymentMethod(pm.id);
                      setMpQrUrl(null); // Reset QR if method changes
                    }}
                    className={`p-1 xl:p-2 rounded-lg border flex items-center justify-center gap-1.5 xl:gap-2 font-medium text-[10px] xl:text-sm transition-colors ${selectedPaymentMethod === pm.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    {pm.isCash && <Calculator className="w-3 h-3" />}
                    {(pm.name.toLowerCase().includes('mercado pago') || pm.name.toLowerCase().includes('mp')) && <QrCode className="w-3 h-3" />}
                    {!pm.isCash && !(pm.name.toLowerCase().includes('mercado pago') || pm.name.toLowerCase().includes('mp')) && <CreditCard className="w-3 h-3" />}
                    <span className="truncate">{pm.name}</span>
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
                <div className="mt-1 xl:mb-4 bg-gray-50 p-1.5 xl:p-3 rounded-xl border border-gray-200 text-center">
                  {!mpQrUrl ? (
                    <button
                      onClick={handleGenerateMPQR}
                      disabled={isGeneratingQr}
                      className="w-full bg-blue-600 text-white py-1.5 xl:py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-[10px] xl:text-sm"
                    >
                      {isGeneratingQr ? <Loader2 className="animate-spin w-3 h-3 xl:w-4 xl:h-4" /> : <QrCode className="w-3 h-3 xl:w-4 xl:h-4" />}
                      Generar QR
                    </button>
                  ) : (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                      <p className="text-[10px] font-bold text-gray-800 mb-1 xl:mb-2 text-center">Escanea con App</p>
                      <div className="bg-white p-1 rounded-lg shadow-md mb-1 xl:mb-2">
                        <QRCodeSVG value={mpQrUrl} size={layout === 'compact' ? 80 : 100} className="w-20 h-20 xl:w-28 xl:h-28" />
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          <div className="mt-1 xl:mb-4">
            <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
              {selectedPaymentMethod === 'cash' ? 'Monto Recibido' : 'Monto a Confirmar'}
            </label>
            <div className="bg-gray-100 p-1 xl:p-2 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-1.5 xl:gap-2">
                <Calculator className="w-3 h-3 xl:w-4 xl:h-4 text-gray-500" />
                <input type="number" placeholder="0.00" className="bg-transparent w-14 xl:w-20 outline-none border-b border-gray-300 focus:border-blue-500 text-[10px] xl:text-sm" value={cashGiven} onChange={e => setCashGiven(e.target.value)} />
              </div>
              <div className="text-right">
                <span className="text-[8px] xl:text-[10px] text-gray-500 block">Vuelto</span>
                <span className="font-bold text-[10px] xl:text-sm bg-white px-1 xl:px-2 rounded border border-gray-200">${changeDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCompleteSale}
            disabled={cart.length === 0 || !canProcessSale}
            className={`w-full py-1.5 xl:py-3 rounded-xl font-bold text-sm xl:text-lg shadow-md flex justify-center items-center gap-2 ${!canProcessSale
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
          >
            {!canProcessSale && <Lock className="w-4 h-4" />}
            {canProcessSale ? 'COBRAR' : 'SIN PERMISO'}
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto p-2 xl:p-4 space-y-2 xl:space-y-3 min-h-0 ${settings.posSidebarActions === 'bottom' ? 'order-1' : 'order-2'}`}>
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">Carrito vacío</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center p-1.5 xl:p-2 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[11px] xl:text-sm text-gray-800 truncate">{item.name}</p>
                  <p className="text-[9px] xl:text-xs text-gray-500">
                    {item.isWeighted
                      ? `$${item.price}/kg x ${item.quantity.toFixed(3)} kg`
                      : `$${item.price} x ${item.quantity}`
                    }
                  </p>
                </div>
                <div className="flex items-center gap-1 xl:gap-2 shrink-0">
                  {!item.isWeighted && (
                    <>
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-0.5 xl:p-1 hover:bg-gray-200 rounded text-gray-500"><Minus className="w-3 h-3" /></button>
                      <span className="font-bold text-[11px] xl:text-sm min-w-[12px] text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-0.5 xl:p-1 hover:bg-gray-200 rounded text-gray-500"><Plus className="w-3 h-3" /></button>
                    </>
                  )}
                  {item.isWeighted && (
                    <span className="font-bold text-[10px] xl:text-sm bg-purple-100 text-purple-700 px-1.5 xl:px-2 py-0.5 xl:py-1 rounded">
                      ${(item.price * item.quantity).toFixed(0)}
                    </span>
                  )}
                  <button onClick={() => removeFromCart(item.id)} className="ml-1 xl:ml-2 text-red-400 hover:text-red-700"><Trash2 className="w-3.5 h-3.5 xl:w-4 xl:h-4" /></button>
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
      )}

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
            <h3 className="text-lg font-bold text-gray-800 mb-2">Ingresar Cantidad</h3>
            <p className="text-sm text-gray-500 mb-6">Producto: <span className="font-bold">{selectedBulkProduct.name}</span></p>

            <div className="space-y-6">
              {/* Weight Input (Kg) */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Peso (Kg)</label>
                <div className="flex items-center gap-2 border-b-2 border-gray-100 focus-within:border-blue-500 transition-colors">
                  <Scale className="w-5 h-5 text-gray-300" />
                  <input
                    type="number"
                    autoFocus
                    className="flex-1 text-2xl font-bold outline-none py-2 bg-transparent"
                    placeholder="0.000"
                    value={weightInput}
                    onChange={e => {
                      setWeightInput(e.target.value);
                      if (e.target.value) {
                        const w = parseFloat(e.target.value);
                        setPriceInput((w * selectedBulkProduct.pricePerKg).toFixed(2));
                      } else {
                        setPriceInput('');
                      }
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') addBulkToCart(); }}
                  />
                  <span className="text-gray-400 font-bold">Kg</span>
                </div>
              </div>

              {/* Price Input ($) */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Monto ($)</label>
                <div className="flex items-center gap-2 border-b-2 border-gray-100 focus-within:border-purple-500 transition-colors">
                  <DollarSign className="w-5 h-5 text-gray-300" />
                  <input
                    type="number"
                    className="flex-1 text-2xl font-bold outline-none py-2 bg-transparent"
                    placeholder="0.00"
                    value={priceInput}
                    onChange={e => {
                      setPriceInput(e.target.value);
                      if (e.target.value) {
                        const p = parseFloat(e.target.value);
                        setWeightInput((p / selectedBulkProduct.pricePerKg).toFixed(3));
                      } else {
                        setWeightInput('');
                      }
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') addBulkToCart(); }}
                  />
                  <span className="text-gray-400 font-bold">$</span>
                </div>
              </div>

              {/* Calculation Insight */}
              {(weightInput || priceInput) && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-blue-600 font-bold">Resultado:</span>
                  </div>
                  <p className="text-lg font-black text-blue-900 leading-tight">
                    {parseFloat(weightInput || '0').toFixed(3)} Kg <span className="text-sm font-normal text-blue-700">≈ ${(parseFloat(weightInput || '0') * selectedBulkProduct.pricePerKg).toFixed(2)}</span>
                  </p>
                  <p className="text-[10px] text-blue-500 mt-1 uppercase font-bold tracking-wider">Precio por Kg: ${selectedBulkProduct.pricePerKg}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-8">
              <button onClick={() => setShowWeightModal(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={addBulkToCart} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Success Confirmation Modal */}
      {showSuccessModal && lastCompletedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-emerald-100">
            {/* Header Success */}
            <div className="bg-emerald-600 p-8 text-center text-white relative">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-1">¡Venta Confirmada!</h3>
                <p className="text-emerald-100 text-sm font-medium">La transacción se registró correctamente</p>
              </div>
            </div>

            {/* Sale Details */}
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Cobrado</span>
                  <span className="text-2xl font-black text-slate-800">${lastCompletedSale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-3">
                  <span className="text-slate-500">Método de Pago:</span>
                  <span className="font-bold text-slate-700">{lastCompletedSale.paymentMethodName}</span>
                </div>
              </div>

              {/* Items Summary (Scrollable) */}
              <div className="max-h-40 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {lastCompletedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm p-2 bg-slate-50/50 rounded-lg">
                    <span className="text-slate-600 truncate flex-1 mr-4">{item.name}</span>
                    <span className="font-bold text-slate-800 text-xs">x{item.quantity.toFixed(item.isWeighted ? 3 : 0)}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => {
                    webPrintService.printReceipt(lastCompletedSale, settings, currentTenant?.businessName || 'Mi Negocio');
                    toast.success("Enviando a impresora...");
                  }}
                  className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-lg shadow-slate-200"
                >
                  <Printer className="w-5 h-5" />
                  Imprimir Ticket
                </button>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-4 bg-white text-emerald-600 border-2 border-emerald-600 rounded-2xl font-bold hover:bg-emerald-50 transition-all"
                >
                  Nueva Venta
                </button>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">ID: {lastCompletedSale.id.split('-')[0]} · {new Date(lastCompletedSale.date).toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export const POS = React.memo(POSComponent);

