
import React, { useState, useMemo } from 'react';
import { Sale, User, CashSession, PaymentMethodConfig, CashMovement, MovementType, Product, Supplier, BulkProduct, Promotion } from '../types';
import { Filter, FileText, Layers, BarChart as ChartIcon, CheckCircle, User as UserIcon, CreditCard, Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp, Printer, ShoppingCart, Clock, X, Eye, Trash2, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DataReportsProps {
   sales: Sale[];
   users: User[];
   sessions: CashSession[];
   paymentMethods?: PaymentMethodConfig[];
   cashMovements?: CashMovement[];
   currentSessionId?: string | null;
   products?: Product[];
   bulkProducts?: BulkProduct[];
   suppliers?: Supplier[];
   onUpdateSalePaymentMethod?: (saleId: string, newMethod: string) => Promise<void>;
   onDeleteSale?: (saleId: string) => Promise<void>;
   promotions?: Promotion[];
}

type Tab = 'sales' | 'sessions' | 'monthly';
type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all';

const TicketModal = ({ sale, onClose, promotions = [] }: { sale: Sale; onClose: () => void; promotions?: Promotion[] }) => {
   // Calculate the "real" subtotal from the items list to ensure consistency
   // Fallback: If no items (legacy data), use total as subtotal so it looks consistent (Subtotal 3000 -> Total 3000)
   const calculatedSubtotal = sale.items.length > 0
      ? sale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      : (sale.total - (sale.surcharge || 0)); // Remove surcharge if present to get approximate subtotal

   // Calculate what the total implies the discount should be
   // Total = Subtotal - Discount + Surcharge
   const netTotal = sale.total - (sale.surcharge || 0);
   const impliedDiscount = calculatedSubtotal - netTotal;

   // Use the larger of the recorded discount or the implied discount
   const effectiveDiscount = Math.max((sale.discount || 0), impliedDiscount);

   // Floating point safety check
   const finalDiscount = effectiveDiscount > 0.01 ? effectiveDiscount : 0;

   return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
         <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-blue-600" /> Ticket de Venta
               </h3>
               <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
               </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
               <div className="text-center space-y-1 pb-4 border-b border-dashed border-gray-300">
                  <p className="text-sm text-gray-500">{new Date(sale.date).toLocaleString()}</p>
                  <p className="text-xs text-gray-400 font-mono">ID: {sale.id.slice(0, 8)}</p>
               </div>

               <div className="space-y-3">
                  {sale.items.length === 0 ? (
                     <div className="text-center py-8 text-gray-400 italic border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                        <p>Detalle de items no disponible</p>
                        <p className="text-xs mt-1">(Venta histórica sin registro detallado)</p>
                     </div>
                  ) : (
                     sale.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm group">
                           <div className="pr-4">
                              <p className="font-medium text-gray-800">{item.name}</p>
                              <p className="text-xs text-gray-500">
                                 {item.quantity} x ${item.price.toLocaleString()}
                              </p>
                           </div>
                           <div className="font-mono font-bold text-gray-900">
                              ${(item.price * item.quantity).toLocaleString()}
                           </div>
                        </div>
                     ))
                  )}
               </div>

               <div className="pt-4 border-t border-dashed border-gray-300 space-y-2">
                  <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Subtotal</span>
                     <span className="font-medium">${calculatedSubtotal.toLocaleString()}</span>
                  </div>
                  {finalDiscount > 0 && (() => {
                     // Identify which promos matched this sale's items
                     const saleItemIds = sale.items.map(i => i.id);
                     const matchedPromos = promotions.filter(p =>
                        p.triggerProductIds.every(pid => saleItemIds.includes(pid))
                     );
                     return (
                        <div className="space-y-1">
                           {matchedPromos.length > 0 ? (
                              matchedPromos.map(p => (
                                 <div key={p.id} className="flex justify-between text-sm text-green-600">
                                    <span className="flex items-center gap-1">
                                       <span className="bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded">PROMO</span>
                                       {p.name}
                                    </span>
                                 </div>
                              ))
                           ) : (
                              <div className="flex justify-between text-sm text-green-600">
                                 <span>Descuento</span>
                              </div>
                           )}
                           <div className="flex justify-between text-sm text-green-600 font-bold">
                              <span>Total Descuento</span>
                              <span>-${finalDiscount.toLocaleString()}</span>
                           </div>
                        </div>
                     );
                  })()}
                  {(sale.surcharge || 0) > 0 && (
                     <div className="flex justify-between text-sm text-blue-600">
                        <span>Recargo</span>
                        <span>+${(sale.surcharge || 0).toLocaleString()}</span>
                     </div>
                  )}
                  <div className="flex justify-between text-xl font-black text-gray-900 pt-2 border-t border-gray-100">
                     <span>Total</span>
                     <span>${sale.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2">
                     <span className="text-gray-500 font-medium">Medio de Pago</span>
                     <span className="font-bold text-gray-800">{sale.paymentMethodName}</span>
                  </div>
               </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
               <button onClick={onClose} className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors">
                  Cerrar
               </button>
               <button onClick={() => window.print()} className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" /> Imprimir
               </button>
            </div>
         </div>
      </div>
   );
};

export const DataReports: React.FC<DataReportsProps> = ({
   sales,
   users,
   sessions,
   paymentMethods = [],
   cashMovements = [],
   currentSessionId,
   products = [],
   bulkProducts = [],
   suppliers = [],
   onUpdateSalePaymentMethod,
   onDeleteSale,
   promotions = []
}) => {
   const [activeTab, setActiveTab] = useState<Tab>('sales');

   // LAZY LOAD HEAVY HISTORY
   const hasFetchedFullHistory = React.useRef(false);

   React.useEffect(() => {
      if (!hasFetchedFullHistory.current && (activeTab === 'sessions' || activeTab === 'monthly')) {
         import('../src/store/useStore').then(({ useStore }) => {
            useStore.getState().fetchSales();
            hasFetchedFullHistory.current = true;
         });
      }
   }, [activeTab]);

   // Sales Filter State
   const [dateFilter, setDateFilter] = useState<DateFilter>('today');

   React.useEffect(() => {
      if (!hasFetchedFullHistory.current && (dateFilter === 'month' || dateFilter === 'all')) {
         import('../src/store/useStore').then(({ useStore }) => {
            useStore.getState().fetchSales();
            hasFetchedFullHistory.current = true;
         });
      }
   }, [dateFilter]);

   const [paymentFilter, setPaymentFilter] = useState<string>('all');
   const [supplierFilter, setSupplierFilter] = useState<string>('all');
   const [searchTerm, setSearchTerm] = useState('');

   // Selected Session for Master-Detail View
   const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

   // Selected Sale for Ticket View
   const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

   // --- 1. SALES FILTERING ---
   const filteredSales = useMemo(() => {
      // If a session is active, ONLY show sales for that session in the "Sales" tab
      // The user requested: "registro de ventas ... debe estar solo cuando esta abierta la caja"
      // REVISION: This blocks seeing "Today's" history if a new session starts.
      // We should rely on Date Filters instead.
      let baseSales = sales;
      // if (currentSessionId) {
      //    baseSales = sales.filter(s => s.sessionId === currentSessionId);
      // }

      return (baseSales || []).filter(sale => {
         const saleDate = new Date(sale.date);
         const today = new Date();

         let dateMatch = true;
         // If we are filtering by session, date filter might be redundant but harmless, 
         // or we might want to disable date filters. 
         // For now, we keep them but they apply to the session's sales.
         if (dateFilter === 'today') {
            dateMatch = saleDate.toDateString() === today.toDateString();
         } else if (dateFilter === 'yesterday') {
            const yest = new Date(today);
            yest.setDate(yest.getDate() - 1);
            dateMatch = saleDate.toDateString() === yest.toDateString();
         } else if (dateFilter === 'week') {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            dateMatch = saleDate >= weekAgo;
         } else if (dateFilter === 'month') {
            dateMatch = saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear();
         }

         const paymentMatch = paymentFilter === 'all' || sale.paymentMethodName === paymentFilter;
         const contentMatch = searchTerm === '' || sale.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

         let supplierMatch = true;
         if (supplierFilter !== 'all') {
            supplierMatch = sale.items.some(item => {
               // Check snapshot supplierId
               if (item.supplierId === supplierFilter) return true;

               // Fallback to current product/bulk mapping
               const product = products.find(p => p.id === item.id);
               if (product && product.supplierId === supplierFilter) return true;

               const bulk = bulkProducts.find(b => b.id === item.id);
               if (bulk && bulk.supplierId === supplierFilter) return true;

               return false;
            });
         }

         return dateMatch && paymentMatch && contentMatch && supplierMatch;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
   }, [sales, dateFilter, paymentFilter, supplierFilter, searchTerm, currentSessionId, products, bulkProducts]);

   // --- 2. MONTHLY AGGREGATION (ADVANCED) ---
   const monthlyStats = useMemo(() => {
      const stats: Record<string, {
         name: string,
         sortKey: number,
         income: number,
         expenses: number,
         salesCount: number,
         net: number
      }> = {};

      // 1. Process Sales (Income)
      sales.forEach(sale => {
         const d = new Date(sale.date);
         const key = `${d.getFullYear()} -${d.getMonth()} `; // "2023-10"
         const name = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

         if (!stats[key]) stats[key] = { name, sortKey: d.getTime(), income: 0, expenses: 0, salesCount: 0, net: 0 };

         stats[key].income += sale.total;
         stats[key].salesCount += 1;
      });

      // 2. Process Cash Movements (Expenses & Manual Deposits)
      cashMovements.forEach(mov => {
         const d = new Date(mov.date);
         const key = `${d.getFullYear()} -${d.getMonth()} `;
         const name = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

         if (!stats[key]) stats[key] = { name, sortKey: d.getTime(), income: 0, expenses: 0, salesCount: 0, net: 0 };

         if (mov.type === MovementType.WITHDRAWAL) {
            stats[key].expenses += mov.amount;
         } else if (mov.type === MovementType.DEPOSIT) {
            stats[key].income += mov.amount;
         }
      });

      // 3. Calculate Net & Format
      return Object.values(stats)
         .map(s => ({ ...s, net: s.income - s.expenses }))
         .sort((a, b) => a.sortKey - b.sortKey);

   }, [sales, cashMovements]);

   // --- 3. SESSION DETAILS LOGIC ---
   const getSessionDetails = (sessionId: string) => {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return null;

      const sessionSales = (sales || []).filter(s => s.sessionId === sessionId);
      const sessionMovements = (cashMovements || []).filter(m => m.sessionId === sessionId);
      const totalRevenue = sessionSales.reduce((acc, s) => acc + s.total, 0);

      // Breakdown by payment method
      const breakdown = paymentMethods.map(pm => {
         const amount = sessionSales
            .filter(s => s.paymentMethodName === pm.name)
            .reduce((acc, s) => acc + s.total, 0);
         return { name: pm.name, amount, isCash: pm.isCash };
      });

      // Calculate Unclassified
      const classifiedTotal = breakdown.reduce((acc, b) => acc + b.amount, 0);
      const unclassifiedTotal = totalRevenue - classifiedTotal;

      if (unclassifiedTotal > 0) {
         breakdown.push({ name: 'Otros / Desconocido', amount: unclassifiedTotal, isCash: false });
      }

      const cashSales = breakdown.find(b => b.isCash)?.amount || 0;
      const deposits = sessionMovements.filter(m => m.type === MovementType.DEPOSIT).reduce((acc, m) => acc + m.amount, 0);
      const withdrawals = sessionMovements.filter(m => m.type === MovementType.WITHDRAWAL).reduce((acc, m) => acc + m.amount, 0);

      const expectedCash = session.initialFloat + cashSales + deposits - withdrawals;
      const declaredCash = session.finalDeclaredCash || 0;
      const difference = declaredCash - expectedCash;

      const user = users.find(u => u.id === session.userId);

      return {
         session,
         user,
         totalRevenue,
         breakdown,
         expectedCash,
         declaredCash,
         difference,
         salesCount: sessionSales.length,
         movements: sessionMovements,
         sales: sessionSales, // Return full list of sales
         supplierBreakdown: (() => {
            const supplierMap = new Map<string, { gross: number, cost: number }>();

            sessionSales.forEach(sale => {
               const saleItems = sale.items || [];
               const saleItemIds = saleItems.map(i => i.id);

               // STEP 1: Resolve supplier for each item and add gross (list price)
               const itemsResolved = saleItems.map(item => {
                  let supplierName = 'Desconocido';
                  if (item.supplierId) {
                     const supplier = suppliers.find(s => s.id === item.supplierId);
                     if (supplier) supplierName = supplier.name;
                  }
                  if (supplierName === 'Desconocido') {
                     const product = products.find(p => p.id === item.id);
                     const bulk = bulkProducts.find(p => p.id === item.id);
                     const foundId = product?.supplierId || bulk?.supplierId;
                     if (foundId) {
                        const supplier = suppliers.find(s => s.id === foundId);
                        if (supplier) supplierName = supplier.name;
                     }
                  }
                  return { ...item, supplierName };
               });

               // Add gross (list price) per supplier
               itemsResolved.forEach(item => {
                  const itemGross = item.price * item.quantity;
                  const itemCost = (item.cost || 0) * item.quantity;
                  const current = supplierMap.get(item.supplierName) || { gross: 0, cost: 0 };
                  supplierMap.set(item.supplierName, {
                     gross: current.gross + itemGross,
                     cost: current.cost + itemCost
                  });
               });

               // STEP 2: Detect exact promotions (like POS engine) and subtract their exact discount from the correct supplier
               // Build a cart map from the ticket items (product_id -> quantity)
               const cartMap: Record<string, number> = {};
               itemsResolved.forEach(item => {
                  const pid = (item as any).productId || (item as any).product_id || item.id;
                  cartMap[pid] = (cartMap[pid] || 0) + item.quantity;
               });

               // Build a map of product_id -> supplierName for attribution
               const pidToSupplier: Record<string, string> = {};
               itemsResolved.forEach(item => {
                  const pid = (item as any).productId || (item as any).product_id || item.id;
                  pidToSupplier[pid] = item.supplierName;
               });

               // Run the POS promo engine in reverse to detect exact discounts
               const supplierPromoDiscount = new Map<string, number>();

               const sortedPromos = [...promotions].filter(p => p.active).sort((a, b) => (b.promoPrice || 0) - (a.promoPrice || 0));

               for (const promo of sortedPromos) {
                  let triggers = promo.triggerProductIds || (promo as any).trigger_product_ids || [];
                  if (typeof triggers === 'string') { try { triggers = JSON.parse(triggers) } catch (e) { triggers = [] } }

                  let reqs = promo.requirements || [];
                  if (typeof reqs === 'string') { try { reqs = JSON.parse(reqs) } catch (e) { reqs = [] } }

                  const promoPrice = promo.promoPrice || (promo as any).promo_price || 0;
                  const promoType = promo.type || (promo as any).type || 'standard';
                  const qtyReq = promo.quantityRequired || (promo as any).quantity_required || 0;

                  if (promoType === 'flexible' && qtyReq > 0) {
                     // FLEXIBLE (Mix & Match): any combination of triggerProductIds
                     const matchingPids = (triggers as string[]).filter((pid: string) => (cartMap[pid] || 0) > 0);
                     let totalAvailable = matchingPids.reduce((sum: number, pid: string) => sum + (cartMap[pid] || 0), 0);
                     const combosPossible = Math.floor(totalAvailable / qtyReq);

                     if (combosPossible > 0) {
                        // Build units sorted by price desc (most expensive first)
                        const availableUnits: { id: string, price: number }[] = [];
                        matchingPids.forEach((pid: string) => {
                           const product = products.find(p => p.id === pid) || bulkProducts.find((p: any) => p.id === pid);
                           const qty = cartMap[pid] || 0;
                           for (let i = 0; i < qty; i++) availableUnits.push({ id: pid, price: (product as any)?.price || 0 });
                        });
                        availableUnits.sort((a, b) => b.price - a.price);

                        const unitsUsed = availableUnits.slice(0, combosPossible * qtyReq);
                        const regularPriceSum = unitsUsed.reduce((sum, u) => sum + u.price, 0);

                        // Deduct from cart map
                        unitsUsed.forEach(u => { if (cartMap[u.id] > 0) cartMap[u.id]--; });

                        const discount = regularPriceSum - (combosPossible * promoPrice);
                        if (discount > 0) {
                           // Attribute to the supplier of the first triggered product
                           const supName = pidToSupplier[unitsUsed[0]?.id] || 'Desconocido';
                           supplierPromoDiscount.set(supName, (supplierPromoDiscount.get(supName) || 0) + discount);
                        }
                     }

                  } else if (promoType === 'weighted' && Array.isArray(reqs) && reqs.length > 0) {
                     // WEIGHTED: check requirements with minWeight
                     let possibleCombos = Infinity;
                     for (const req of reqs as any[]) {
                        const minWeight = Number(req.minWeight || 0);
                        const pid = req.productId || req.product_id;
                        const availableWeight = cartMap[pid] || 0;
                        if (availableWeight < minWeight) { possibleCombos = 0; break; }
                        const limit = Math.floor(availableWeight / minWeight);
                        if (limit < possibleCombos) possibleCombos = limit;
                     }
                     if (possibleCombos === Infinity) possibleCombos = 0;

                     if (possibleCombos > 0) {
                        let regularPricePerCombo = 0;
                        const reqArray = reqs as any[];
                        reqArray.forEach((req: any) => {
                           const minWeight = Number(req.minWeight || 0);
                           const pid = req.productId || req.product_id;
                           const product = products.find(p => p.id === pid) || bulkProducts.find((p: any) => p.id === pid);
                           const pricePerKg = (product as any)?.price || (product as any)?.pricePerKg || 0;
                           regularPricePerCombo += (minWeight * pricePerKg);
                           cartMap[pid] -= (possibleCombos * minWeight);
                        });

                        const savingsPerCombo = regularPricePerCombo - promoPrice;
                        if (savingsPerCombo > 0) {
                           const firstPid = (reqArray[0] as any)?.productId || (reqArray[0] as any)?.product_id;
                           const supName = pidToSupplier[firstPid] || 'Desconocido';
                           supplierPromoDiscount.set(supName, (supplierPromoDiscount.get(supName) || 0) + (savingsPerCombo * possibleCombos));
                        }
                     }

                  } else {
                     // STANDARD (Strict): exact product ID matching
                     const requirements: Record<string, number> = {};
                     (triggers as string[]).forEach((pid: string) => {
                        requirements[pid] = (requirements[pid] || 0) + 1;
                     });

                     let applyCount = 0;
                     while (true) {
                        const canApply = Object.entries(requirements).every(([pid, required]) => (cartMap[pid] || 0) >= required);
                        if (!canApply) break;

                        Object.entries(requirements).forEach(([pid, required]) => { cartMap[pid] -= required; });

                        const regularSum = (triggers as string[]).reduce((sum: number, pid: string) => {
                           const p = products.find(prod => prod.id === pid) || bulkProducts.find((prod: any) => prod.id === pid);
                           return sum + ((p as any)?.price || 0);
                        }, 0);

                        const discount = regularSum - promoPrice;
                        if (discount > 0) {
                           const supName = pidToSupplier[(triggers as string[])[0]] || 'Desconocido';
                           supplierPromoDiscount.set(supName, (supplierPromoDiscount.get(supName) || 0) + discount);
                        }
                        applyCount++;
                     }
                  }
               }

               // Apply the exact promo discounts to the supplier map, capped to actual ticket discount
               const ticketGross = itemsResolved.reduce((sum, i) => sum + (i.price * i.quantity), 0);
               const ticketNet = sale.total - (sale.surcharge || 0);
               const actualTicketDiscount = Math.max(0, ticketGross - ticketNet);

               // Sum all detected promo discounts
               let totalDetectedDiscount = 0;
               supplierPromoDiscount.forEach(d => totalDetectedDiscount += d);

               if (actualTicketDiscount > 0) {
                  if (totalDetectedDiscount > 0) {
                     if (totalDetectedDiscount >= actualTicketDiscount) {
                        // Cap: if engine detected more than actual, scale down proportionally
                        const scaleFactor = actualTicketDiscount / totalDetectedDiscount;
                        supplierPromoDiscount.forEach((discount, supName) => {
                           const cappedDiscount = discount * scaleFactor;
                           const current = supplierMap.get(supName) || { gross: 0, cost: 0 };
                           supplierMap.set(supName, { gross: current.gross - cappedDiscount, cost: current.cost });
                        });
                     } else {
                        // totalDetectedDiscount < actualTicketDiscount
                        // Distribute the remainder ONLY among the suppliers who already had a promo detected (Option B)
                        const remainder = actualTicketDiscount - totalDetectedDiscount;
                        supplierPromoDiscount.forEach((discount, supName) => {
                           const ratio = discount / totalDetectedDiscount;
                           const shareOfRemainder = remainder * ratio;
                           const totalDiscountToApply = discount + shareOfRemainder;
                           const current = supplierMap.get(supName) || { gross: 0, cost: 0 };
                           supplierMap.set(supName, { gross: current.gross - totalDiscountToApply, cost: current.cost });
                        });
                     }
                  } else {
                     // totalDetectedDiscount === 0 but actualTicketDiscount > 0 (Orphaned/Manual discount)
                     // Option B: Attribute to a special category so the Z-report math adds up perfectly without penalizing innocents.
                     const orphanName = 'Descuentos Huérfanos / Promos Borradas';
                     const current = supplierMap.get(orphanName) || { gross: 0, cost: 0 };
                     supplierMap.set(orphanName, { gross: current.gross - actualTicketDiscount, cost: current.cost });
                  }
               }

               // ADD SURCHARGE TO BREAKDOWN
               if ((sale.surcharge || 0) > 0) {
                  const surchargeName = 'Recargos / Intereses';
                  const currentSurcharge = supplierMap.get(surchargeName) || { gross: 0, cost: 0 };
                  supplierMap.set(surchargeName, {
                     gross: currentSurcharge.gross + (sale.surcharge || 0),
                     cost: currentSurcharge.cost
                  });
               }
            });

            const result = Array.from(supplierMap.entries())
               .map(([name, data]) => ({
                  name,
                  gross: data.gross,
                  cost: data.cost,
                  profit: data.gross - data.cost
               }));

            return result.sort((a, b) => b.gross - a.gross);
         })()
      };
   };

   const selectedSessionData = selectedSessionId ? getSessionDetails(selectedSessionId) : null;

   const handlePrint = () => {
      window.print();
   };

   return (
      <div className="h-[calc(100vh-140px)] flex flex-col gap-6">

         {/* Top Tabs (Hidden when printing) */}
         <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-fit flex gap-1 print:hidden">
            <button
               onClick={() => setActiveTab('sales')}
               className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'sales' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'} `}
            >
               <FileText className="w-4 h-4" /> Registro de Ventas
            </button>
            <button
               onClick={() => setActiveTab('sessions')}
               className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'sessions' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'} `}
            >
               <Layers className="w-4 h-4" /> Cajas Cerradas (Histórico Z)
            </button>
            <button
               onClick={() => setActiveTab('monthly')}
               className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'monthly' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'} `}
            >
               <ChartIcon className="w-4 h-4" /> Balance Mensual
            </button>
         </div>

         {/* --- TAB: SALES --- */}
         {activeTab === 'sales' && (
            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
               {/* Filters Sidebar */}
               <div className="w-full lg:w-64 bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-6 shrink-0 h-fit">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                     <Filter className="w-4 h-4" /> Filtros
                  </h3>

                  <div className="grid grid-cols-2 gap-2">
                     {(['today', 'yesterday', 'week', 'month', 'all'] as DateFilter[]).map(f => (
                        <button
                           key={f}
                           onClick={() => setDateFilter(f)}
                           className={`px-2 py-2 text-xs font-bold rounded-lg border capitalize transition-colors ${dateFilter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} `}
                        >
                           {f === 'today' ? 'Hoy' : f === 'yesterday' ? 'Ayer' : f === 'week' ? 'Semana' : f === 'month' ? 'Mes' : 'Todo'}
                        </button>
                     ))}
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-500 uppercase">Medio de Pago</label>
                     <select
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 text-gray-900"
                        value={paymentFilter}
                        onChange={e => setPaymentFilter(e.target.value)}
                     >
                        <option value="all">Todos</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Mercado Pago">Mercado Pago</option>
                        <option value="Débito">Débito</option>
                     </select>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-500 uppercase">Filtrar por Proveedor</label>
                     <select
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 text-gray-900"
                        value={supplierFilter}
                        onChange={e => setSupplierFilter(e.target.value)}
                     >
                        <option value="all">Todos los Proveedores</option>
                        {suppliers.map(s => (
                           <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                     </select>
                  </div>

                  {/* Per-Supplier Summary when filtered */}
                  {supplierFilter !== 'all' && (() => {
                     const selSup = suppliers.find(s => s.id === supplierFilter);
                     let sCost = 0;
                     let sVentaBruta = 0;
                     let sPromoDiscount = 0;

                     // Helper: check if an item belongs to the selected supplier
                     const isSupplierItem = (itemId: string, itemSupplierId?: string) => {
                        if (itemSupplierId === supplierFilter) return true;
                        const p = products.find(x => x.id === itemId);
                        if (p && p.supplierId === supplierFilter) return true;
                        const b = bulkProducts.find(x => x.id === itemId);
                        if (b && b.supplierId === supplierFilter) return true;
                        return false;
                     };

                     filteredSales.forEach(sale => {
                        const saleItems = sale.items || [];
                        const ticketGross = saleItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                        const ticketNet = sale.total - (sale.surcharge || 0);
                        const actualTicketDiscount = Math.max(0, ticketGross - ticketNet);

                        let supplierGross = 0;
                        saleItems.forEach(item => {
                           if (isSupplierItem(item.id, item.supplierId)) {
                              supplierGross += item.price * item.quantity;
                              sCost += (item.cost || 0) * item.quantity;
                           }
                        });
                        sVentaBruta += supplierGross;

                        if (actualTicketDiscount > 0 && supplierGross > 0) {
                           const cartMap: Record<string, number> = {};
                           const pidToSupplier: Record<string, string> = {};
                           saleItems.forEach(item => {
                              const pid = (item as any).productId || (item as any).product_id || item.id;
                              cartMap[pid] = (cartMap[pid] || 0) + item.quantity;
                              // resolve supplier for pid
                              let itemSup = 'Desconocido';
                              if (item.supplierId) itemSup = item.supplierId;
                              else {
                                 const p = products.find(x => x.id === pid);
                                 if (p && p.supplierId) itemSup = p.supplierId;
                                 else {
                                    const b = bulkProducts.find(x => x.id === pid);
                                    if (b && b.supplierId) itemSup = b.supplierId;
                                 }
                              }
                              pidToSupplier[pid] = itemSup;
                           });

                           const supplierPromoDiscount = new Map<string, number>();
                           const sortedPromos = [...promotions].filter(p => p.active).sort((a, b) => (b.promoPrice || 0) - (a.promoPrice || 0));

                           for (const promo of sortedPromos) {
                              let triggers = promo.triggerProductIds || (promo as any).trigger_product_ids || [];
                              if (typeof triggers === 'string') { try { triggers = JSON.parse(triggers) } catch (e) { triggers = [] } }

                              let reqs = promo.requirements || [];
                              if (typeof reqs === 'string') { try { reqs = JSON.parse(reqs) } catch (e) { reqs = [] } }

                              const promoPrice = promo.promoPrice || (promo as any).promo_price || 0;
                              const promoType = promo.type || (promo as any).type || 'standard';
                              const qtyReq = promo.quantityRequired || (promo as any).quantity_required || 0;

                              if (promoType === 'flexible' && qtyReq > 0) {
                                 const matchingPids = (triggers as string[]).filter(pid => (cartMap[pid] || 0) > 0);
                                 let totalAvailable = matchingPids.reduce((sum, pid) => sum + (cartMap[pid] || 0), 0);
                                 const combosPossible = Math.floor(totalAvailable / qtyReq);

                                 if (combosPossible > 0) {
                                    const availableUnits: { id: string, price: number }[] = [];
                                    matchingPids.forEach(pid => {
                                       const product = products.find(p => p.id === pid) || bulkProducts.find((p: any) => p.id === pid);
                                       const qty = cartMap[pid] || 0;
                                       for (let i = 0; i < qty; i++) availableUnits.push({ id: pid, price: (product as any)?.price || 0 });
                                    });
                                    availableUnits.sort((a, b) => b.price - a.price);

                                    const unitsUsed = availableUnits.slice(0, combosPossible * qtyReq);
                                    const regularPriceSum = unitsUsed.reduce((sum, u) => sum + u.price, 0);
                                    unitsUsed.forEach(u => { if (cartMap[u.id] > 0) cartMap[u.id]--; });

                                    const discount = regularPriceSum - (combosPossible * promoPrice);
                                    if (discount > 0) {
                                       const supId = pidToSupplier[unitsUsed[0]?.id] || 'Desconocido';
                                       supplierPromoDiscount.set(supId, (supplierPromoDiscount.get(supId) || 0) + discount);
                                    }
                                 }
                              } else if (promoType === 'weighted' && Array.isArray(reqs) && reqs.length > 0) {
                                 let possibleCombos = Infinity;
                                 for (const req of reqs as any[]) {
                                    const minWeight = Number(req.minWeight || 0);
                                    const pid = req.productId || req.product_id;
                                    const availableWeight = cartMap[pid] || 0;
                                    if (availableWeight < minWeight) { possibleCombos = 0; break; }
                                    const limit = Math.floor(availableWeight / minWeight);
                                    if (limit < possibleCombos) possibleCombos = limit;
                                 }
                                 if (possibleCombos === Infinity) possibleCombos = 0;

                                 if (possibleCombos > 0) {
                                    let regularPricePerCombo = 0;
                                    reqs.forEach((req: any) => {
                                       const minWeight = Number(req.minWeight || 0);
                                       const pid = req.productId || req.product_id;
                                       const product = products.find(p => p.id === pid) || bulkProducts.find((p: any) => p.id === pid);
                                       const pricePerKg = (product as any)?.price || (product as any)?.pricePerKg || 0;
                                       regularPricePerCombo += (minWeight * pricePerKg);
                                       cartMap[pid] -= (possibleCombos * minWeight);
                                    });
                                    const savingsPerCombo = regularPricePerCombo - promoPrice;
                                    if (savingsPerCombo > 0) {
                                       const firstPid = (reqs[0] as any)?.productId || (reqs[0] as any)?.product_id;
                                       const supId = pidToSupplier[firstPid] || 'Desconocido';
                                       supplierPromoDiscount.set(supId, (supplierPromoDiscount.get(supId) || 0) + (savingsPerCombo * possibleCombos));
                                    }
                                 }
                              } else {
                                 const requirements: Record<string, number> = {};
                                 (triggers as string[]).forEach((pid: string) => {
                                    requirements[pid] = (requirements[pid] || 0) + 1;
                                 });
                                 while (true) {
                                    const canApply = Object.entries(requirements).every(([pid, req]) => (cartMap[pid] || 0) >= req);
                                    if (!canApply) break;
                                    Object.entries(requirements).forEach(([pid, req]) => { cartMap[pid] -= req; });
                                    const regularSum = (triggers as string[]).reduce((sum, pid) => {
                                       const p = products.find(prod => prod.id === pid) || bulkProducts.find((prod: any) => prod.id === pid);
                                       return sum + ((p as any)?.price || 0);
                                    }, 0);
                                    const discount = regularSum - promoPrice;
                                    if (discount > 0) {
                                       const supId = pidToSupplier[(triggers as string[])[0]] || 'Desconocido';
                                       supplierPromoDiscount.set(supId, (supplierPromoDiscount.get(supId) || 0) + discount);
                                    }
                                 }
                              }
                           }

                           let totalDetectedDiscount = 0;
                           supplierPromoDiscount.forEach(d => totalDetectedDiscount += d);

                           // Attribute to selected supplier
                           const baseDetectedForSupplier = supplierPromoDiscount.get(supplierFilter) || 0;
                           let finalSupplierDiscount = baseDetectedForSupplier;

                           if (totalDetectedDiscount > 0 && totalDetectedDiscount < actualTicketDiscount) {
                              // Distribute remainder ONLY among suppliers who had a promo detected (Option B)
                              const remainder = actualTicketDiscount - totalDetectedDiscount;
                              const ratio = baseDetectedForSupplier / totalDetectedDiscount;
                              finalSupplierDiscount += remainder * ratio;
                           } else if (totalDetectedDiscount > actualTicketDiscount) {
                              // Cap if engine overcalculated
                              const scaleFactor = actualTicketDiscount / totalDetectedDiscount;
                              finalSupplierDiscount = baseDetectedForSupplier * scaleFactor;
                           }
                           // NOTE: If totalDetectedDiscount === 0, it's an orphaned discount. Option B: We don't deduct it from any supplier.

                           sPromoDiscount += finalSupplierDiscount;
                        }
                     });

                     const sVentaNeta = sVentaBruta - sPromoDiscount;
                     return (
                        <div className="mt-3 space-y-2">
                           <div className="bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                              <p className="text-[10px] text-blue-600 font-bold uppercase">Costo {selSup?.name}</p>
                              <p className="text-lg font-bold text-blue-700">${Math.round(sCost).toLocaleString('es-AR')}</p>
                           </div>
                           <div className="bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                              <p className="text-[10px] text-green-600 font-bold uppercase">Venta Bruta {selSup?.name}</p>
                              <p className="text-lg font-bold text-green-700">${Math.round(sVentaBruta).toLocaleString('es-AR')}</p>
                           </div>
                           {sPromoDiscount > 0 && (
                              <div className="bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                                 <p className="text-[10px] text-red-600 font-bold uppercase">Desc. Promos {selSup?.name}</p>
                                 <p className="text-lg font-bold text-red-600">-${Math.round(sPromoDiscount).toLocaleString('es-AR')}</p>
                              </div>
                           )}
                           <div className="bg-purple-50 px-3 py-2 rounded-lg border border-purple-100">
                              <p className="text-[10px] text-purple-600 font-bold uppercase">Venta Neta {selSup?.name}</p>
                              <p className="text-lg font-bold text-purple-700">${Math.round(sVentaNeta).toLocaleString('es-AR')}</p>
                           </div>
                           <div className="bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                              <p className="text-[10px] text-amber-600 font-bold uppercase">Ganancia Neta {selSup?.name}</p>
                              <p className="text-lg font-bold text-amber-700">${Math.round(sVentaNeta - sCost).toLocaleString('es-AR')}</p>
                           </div>
                        </div>
                     );
                  })()}





                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-500 uppercase">Buscar Item</label>
                     <input
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="Ej: Coca Cola"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                     />
                  </div>
               </div>

               {/* Table */}
               <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                     <span className="font-bold text-gray-700">{filteredSales.length} Operaciones</span>
                     <span className="font-black text-xl text-blue-600">Total: ${filteredSales.reduce((acc, s) => acc + s.total, 0).toLocaleString()}</span>
                  </div>
                  <div className="flex-1 overflow-auto">
                     <table className="w-full text-sm text-left">
                        <thead className="bg-white text-gray-500 sticky top-0 border-b">
                           <tr>
                              <th className="p-3">Fecha/Hora</th>
                              <th className="p-3">Detalle</th>
                              <th className="p-3">Pago</th>
                              <th className="p-3 text-right">Total</th>
                              <th className="p-3 text-center">Acciones</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {filteredSales.map(sale => (
                              <tr
                                 key={sale.id}
                                 className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                              >
                                 <td className="p-3">
                                    <div className="font-bold text-gray-800">{new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    <div className="text-xs text-gray-400">{new Date(sale.date).toLocaleDateString()}</div>
                                 </td>
                                 <td className="p-3 text-gray-600 max-w-xs truncate">{sale.items.map(i => i.name).join(', ')}</td>
                                 <td className="p-3">
                                    <div className="group relative flex items-center">
                                       <select
                                          className="appearance-none bg-transparent border border-transparent text-xs font-medium text-gray-700 cursor-pointer focus:ring-0 focus:border-blue-300 pr-6 py-1 pl-2 hover:bg-gray-100 hover:border-gray-300 rounded transition-all"
                                          value={sale.paymentMethodName}
                                          onChange={(e) => {
                                             if (onUpdateSalePaymentMethod) {
                                                onUpdateSalePaymentMethod(sale.id, e.target.value);
                                             }
                                          }}
                                          disabled={!onUpdateSalePaymentMethod}
                                       >
                                          {paymentMethods.map(pm => (
                                             <option key={pm.name} value={pm.name}>{pm.name}</option>
                                          ))}
                                          {!paymentMethods.some(pm => pm.name === sale.paymentMethodName) && (
                                             <option value={sale.paymentMethodName}>{sale.paymentMethodName}</option>
                                          )}
                                       </select>
                                       <div className="pointer-events-none absolute right-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <ArrowDownCircle className="w-3 h-3" />
                                       </div>
                                    </div>
                                 </td>
                                 <td className="p-3 text-right font-bold text-gray-900">${Math.round(sale.total).toLocaleString('es-AR')}</td>
                                 <td className="p-3">
                                    <div className="flex items-center justify-center gap-2">
                                       <button
                                          onClick={() => setSelectedSale(sale)}
                                          className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
                                          title="Ver Ticket"
                                       >
                                          <Eye size={18} />
                                       </button>
                                       {onDeleteSale && (
                                          <button
                                             onClick={() => {
                                                if (window.confirm("¿Seguro que deseas eliminar esta venta?\n\n⚠️ ESTA ACCIÓN NO SE PUEDE DESHACER.\n\n👉 Se devolverá el stock de todos los productos.\n👉 Se descontará el dinero de la caja.")) {
                                                   onDeleteSale(sale.id);
                                                }
                                             }}
                                             className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                             title="Eliminar Venta (Devolver Stock)"
                                          >
                                             <Trash2 size={18} />
                                          </button>
                                       )}
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}

         {/* --- TAB: CLOSED SESSIONS (MASTER-DETAIL) --- */}
         {activeTab === 'sessions' && (
            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
               {/* LEFT: LIST OF SESSIONS (Hidden on print) */}
               <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col print:hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                     <h3 className="font-bold text-gray-700">Historial de Turnos</h3>
                     <p className="text-xs text-gray-500">Seleccione un cierre para ver el detalle</p>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                     {(sessions || []).filter(s => s.status === 'CLOSED').map(session => (
                        <div
                           key={session.id}
                           onClick={() => setSelectedSessionId(session.id)}
                           className={`p-4 border-b border-gray-100 cursor-pointer transition-colors flex justify-between items-center ${selectedSessionId === session.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'} `}
                        >
                           <div>
                              <p className="font-bold text-gray-800">{new Date(session.startTime).toLocaleDateString()}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                 <Clock className="w-3 h-3" />
                                 {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                 {session.endTime ? new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '??'}
                              </p>
                           </div>
                           <div className="text-right">
                              <p className="text-xs text-gray-400">Declarado</p>
                              <p className="font-bold text-gray-900">${session.finalDeclaredCash?.toLocaleString()}</p>
                           </div>
                        </div>
                     ))}
                     {(sessions || []).filter(s => s.status === 'CLOSED').length === 0 && (
                        <p className="p-8 text-center text-gray-400 text-sm">No hay cierres de caja registrados.</p>
                     )}
                  </div>
               </div>

               {/* RIGHT: DETAILED RECEIPT VIEW */}
               <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col print:border-none print:shadow-none">
                  {selectedSessionData ? (
                     <div className="flex-1 flex flex-col h-full overflow-hidden print:h-auto print:overflow-visible">
                        {/* Receipt Header */}
                        <div className="p-6 border-b border-gray-100 bg-blue-600 text-white flex justify-between items-center print:bg-white print:text-black print:border-b-2 print:border-black print:p-0 print:mb-6">
                           <div>
                              <h2 className="text-xl font-bold flex items-center gap-2 print:text-2xl">
                                 <CheckCircle className="w-5 h-5 print:hidden" /> Reporte de Cierre (Z)
                              </h2>
                              <p className="text-blue-100 text-sm opacity-90 print:text-gray-600 print:text-xs">ID: #{selectedSessionData.session.id.slice(0, 8)}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-medium opacity-80 print:text-gray-600 print:uppercase print:text-xs">Cajero Responsable</p>
                              <p className="font-bold flex items-center gap-1 justify-end print:text-lg">
                                 <UserIcon className="w-4 h-4 print:hidden" /> {selectedSessionData.user?.name || 'Desconocido'}
                              </p>
                              <p className="hidden print:block text-xs text-gray-500 mt-1">
                                 {new Date().toLocaleString()}
                              </p>
                           </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar print:overflow-visible">
                           {/* Financial Summary */}
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2 print:mb-6">
                              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 print:bg-transparent print:border print:border-gray-300 print:rounded-none">
                                 <p className="text-xs text-gray-500 font-bold uppercase print:text-black">Fondo Inicial</p>
                                 <p className="text-xl font-bold text-gray-800 print:text-lg">${selectedSessionData.session.initialFloat.toLocaleString()}</p>
                              </div>
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 print:bg-transparent print:border print:border-gray-300 print:rounded-none">
                                 <p className="text-xs text-blue-600 font-bold uppercase print:text-black">Total Ventas</p>
                                 <p className="text-xl font-bold text-blue-800 print:text-black print:text-lg">${selectedSessionData.totalRevenue.toLocaleString()}</p>
                              </div>
                              <div className="bg-green-50 p-3 rounded-lg border border-green-100 print:bg-transparent print:border print:border-gray-300 print:rounded-none">
                                 <p className="text-xs text-green-600 font-bold uppercase print:text-black">Efectivo Real</p>
                                 <p className="text-xl font-bold text-green-800 print:text-black print:text-lg">${selectedSessionData.declaredCash.toLocaleString()}</p>
                              </div>
                              <div className={`p-3 rounded-lg border ${selectedSessionData.difference === 0 ? 'bg-gray-50 border-gray-100' : selectedSessionData.difference < 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'} print:bg-transparent print:border print:border-gray-300 print:rounded-none`}>
                                 <p className="text-xs text-gray-500 font-bold uppercase print:text-black">Diferencia</p>
                                 <p className={`text-xl font-bold ${selectedSessionData.difference < 0 ? 'text-red-600' : selectedSessionData.difference > 0 ? 'text-green-600' : 'text-gray-400'} print:text-black print:text-lg`}>
                                    {selectedSessionData.difference === 0 ? 'Perfecto' : `$${selectedSessionData.difference.toLocaleString()} `}
                                 </p>
                              </div>
                           </div>

                           {/* Breakdown Table */}
                           <div className="print:mb-6">
                              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2 print:text-black print:border-black print:mb-1">
                                 <CreditCard className="w-4 h-4 text-gray-500 print:hidden" /> Desglose por Medio de Pago
                              </h4>
                              <table className="w-full text-sm">
                                 <tbody>
                                    {selectedSessionData.breakdown.map(b => (
                                       <tr key={b.name} className="border-b border-gray-50 last:border-0 print:border-gray-300">
                                          <td className="py-2 text-gray-600 print:text-black">{b.name}</td>
                                          <td className="py-2 text-right font-bold text-gray-800 print:text-black">${b.amount.toLocaleString()}</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>

                           {/* Breakdown by Supplier */}
                           <div className="print:mb-6">
                              <h4 className="font-bold text-gray-800 mb-3 flex items-center justify-between border-b pb-2 print:text-black print:border-black print:mb-1">
                                 <div className="flex items-center gap-2">
                                    <UserIcon className="w-4 h-4 text-gray-500 print:hidden" /> Desglose por Proveedor
                                 </div>
                                 <div className="text-[10px] text-gray-400 font-medium normal-case flex items-center gap-1 print:hidden">
                                    <AlertTriangle className="w-3 h-3" /> Bruto = Precio Lista | Neto = Recaudado (con promos)
                                 </div>
                              </h4>
                              <table className="w-full text-sm">
                                 <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold text-left print:bg-transparent print:text-black print:border-b print:border-black">
                                    <tr>
                                       <th className="py-2 pl-2">Proveedor / Ajuste</th>
                                       <th className="py-2 text-right">Venta ($)</th>
                                       <th className="py-2 text-right">Costo Total ($)</th>
                                       <th className="py-2 text-right pr-2">Ganancia ($)</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {selectedSessionData.supplierBreakdown.map(b => (
                                       <tr key={b.name} className="border-b border-gray-50 last:border-0 print:border-gray-300">
                                          <td className="py-2 pl-2 text-gray-600 font-medium print:text-black">{b.name}</td>
                                          <td className={`py-2 text-right font-mono ${b.gross < 0 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                             ${Math.round(b.gross).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                          </td>
                                          <td className="py-2 text-right text-gray-400 font-mono">${Math.round(b.cost).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
                                          <td className={`py-2 text-right pr-2 font-bold ${b.profit >= 0 ? 'text-green-600' : 'text-red-500'} `}>
                                             ${Math.round(b.profit).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                          </td>
                                       </tr>
                                    ))}
                                    {selectedSessionData.supplierBreakdown.length === 0 && (
                                       <tr><td colSpan={4} className="text-center text-gray-400 py-2">No hay ventas unitarias</td></tr>
                                    )}
                                 </tbody>
                              </table>
                           </div>



                           {/* Cash Flow Details */}
                           {(selectedSessionData.movements.length > 0) && (
                              <div>
                                 <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
                                    <Wallet className="w-4 h-4 text-gray-500" /> Movimientos de Efectivo Manuales
                                 </h4>
                                 <ul className="space-y-2">
                                    {selectedSessionData.movements.map(m => (
                                       <li key={m.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded print:bg-transparent print:border-b">
                                          <span className="text-gray-600">{m.description}</span>
                                          <span className={`font-bold ${m.type === 'Venta' ? 'text-gray-800' : m.type === 'Entrada Manual' ? 'text-blue-600' : 'text-red-600'} `}>
                                             {m.type === 'Salida/Gasto' ? '-' : '+'}${m.amount.toLocaleString()}
                                          </span>
                                       </li>
                                    ))}
                                 </ul>
                              </div>
                           )}

                           {/* NEW SECTION: Detailed Sales Transaction List */}
                           <div className="mt-6 pt-6 border-t border-gray-200">
                              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
                                 <ShoppingCart className="w-4 h-4 text-gray-500" /> Detalle de Transacciones (Tickets)
                              </h4>
                              <table className="w-full text-sm text-left">
                                 <thead className="text-gray-500 font-bold border-b border-gray-200">
                                    <tr>
                                       <th className="py-2">Hora</th>
                                       <th className="py-2">Items</th>
                                       <th className="py-2">Pago</th>
                                       <th className="py-2 text-right">Total</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-100">
                                    {selectedSessionData.sales.map(sale => (
                                       <tr key={sale.id} className="print:break-inside-avoid">
                                          <td className="py-2 align-top text-gray-600 font-mono text-xs">
                                             {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </td>
                                          <td className="py-2 align-top text-gray-800">
                                             <div className="truncate max-w-[200px] print:max-w-none print:whitespace-normal">
                                                {sale.items.map(i => `${i.quantity}x ${i.name} `).join(', ')}
                                             </div>
                                          </td>
                                          <td className="py-2 align-top text-xs text-gray-500">{sale.paymentMethodName}</td>
                                          <td className="py-2 align-top text-right font-bold text-gray-900">${sale.total.toLocaleString()}</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </div>

                        {/* Footer Action */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end print:hidden">
                           <button
                              onClick={handlePrint}
                              className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-900 transition-colors shadow-lg"
                           >
                              <Printer className="w-4 h-4" /> Imprimir Reporte
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Layers className="w-16 h-16 mb-4 opacity-20" />
                        <p>Seleccione un turno del menú izquierdo</p>
                        <p className="text-sm">para ver el detalle del cierre.</p>
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* --- TAB: MONTHLY BALANCE (ADVANCED) --- */}
         {activeTab === 'monthly' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
               {/* Chart Section */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                  <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                     <TrendingUp className="w-5 h-5 text-indigo-600" /> Ingresos vs Egresos (Comparativa)
                  </h3>
                  <div className="flex-1 min-h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis dataKey="name" fontSize={12} />
                           <YAxis fontSize={12} tickFormatter={val => `$${val / 1000} k`} />
                           <Tooltip
                              formatter={(value: number) => `$${value.toLocaleString()} `}
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                           />
                           <Legend />
                           <Bar dataKey="income" name="Ingresos" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                           <Bar dataKey="expenses" name="Gastos/Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               {/* Detailed Table Section */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                     <FileText className="w-5 h-5 text-gray-500" /> Detalle Operativo Mensual
                  </h3>
                  <div className="flex-1 overflow-auto">
                     <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 sticky top-0 border-b">
                           <tr>
                              <th className="p-3">Mes</th>
                              <th className="p-3 text-center">Ventas</th>
                              <th className="p-3 text-right">Ingresos</th>
                              <th className="p-3 text-right">Gastos</th>
                              <th className="p-3 text-right">Balance Neto</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {monthlyStats.length === 0 && (
                              <tr>
                                 <td colSpan={5} className="p-8 text-center text-gray-400">
                                    No hay suficientes datos para generar el reporte.
                                 </td>
                              </tr>
                           )}
                           {monthlyStats.map(d => (
                              <div key={d.name} style={{ display: 'contents' }}>
                                 <tr className="hover:bg-gray-50">
                                    <td className="p-3 font-bold text-gray-700 capitalize">{d.name}</td>
                                    <td className="p-3 text-center text-gray-500">{d.salesCount} ops</td>
                                    <td className="p-3 text-right font-medium text-blue-600">
                                       <div className="flex items-center justify-end gap-1">
                                          <ArrowUpCircle className="w-3 h-3" /> ${d.income.toLocaleString()}
                                       </div>
                                    </td>
                                    <td className="p-3 text-right font-medium text-red-500">
                                       <div className="flex items-center justify-end gap-1">
                                          <ArrowDownCircle className="w-3 h-3" /> ${d.expenses.toLocaleString()}
                                       </div>
                                    </td>
                                    <td className={`p-3 text-right font-black ${d.net >= 0 ? 'text-green-600' : 'text-red-600'} `}>
                                       ${d.net.toLocaleString()}
                                    </td>
                                 </tr>
                              </div>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}

         {/* Ticket Modal */}
         {selectedSale && (
            <TicketModal sale={selectedSale} onClose={() => setSelectedSale(null)} promotions={promotions} />
         )}
      </div>
   );
};

