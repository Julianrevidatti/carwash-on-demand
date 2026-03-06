"""
Patch DataReports.tsx: Fix the per-supplier sidebar calculation.
Replace proportional discount distribution with exact promo detection.

Logic:
1. Start with list price for each supplier's items (Venta Bruta)
2. Detect which promotions matched (all triggerProductIds present in sale)
3. For each matched promo, calculate discount = sum(list prices of trigger items) - promoPrice
4. Attribute that discount ONLY to the suppliers whose products are in the promo
5. Venta Neta = Venta Bruta - supplier's promo discounts

Also fix the same logic in the Z report supplierBreakdown.
"""

filepath = r'c:\Users\54112\Desktop\GestionPro\components\DataReports.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# --- PATCH 1: Sidebar supplier summary (lines 496-539, 0-indexed 495-538) ---
new_sidebar = [
    "                   {/* Per-Supplier Summary when filtered */}\n",
    "                   {supplierFilter !== 'all' && (() => {\n",
    "                      const selSup = suppliers.find(s => s.id === supplierFilter);\n",
    "                      let sCost = 0;\n",
    "                      let sVentaBruta = 0;\n",
    "                      let sPromoDiscount = 0;\n",
    "                      filteredSales.forEach(sale => {\n",
    "                         const saleItems = sale.items || [];\n",
    "                         const saleItemIds = saleItems.map(i => i.id);\n",
    "\n",
    "                         // Step 1: Sum gross (list prices) for this supplier's items\n",
    "                         saleItems.forEach(item => {\n",
    "                            let isMatch = item.supplierId === supplierFilter;\n",
    "                            if (!isMatch) { const p = products.find(x => x.id === item.id); if (p && p.supplierId === supplierFilter) isMatch = true; }\n",
    "                            if (!isMatch) { const b = bulkProducts.find(x => x.id === item.id); if (b && b.supplierId === supplierFilter) isMatch = true; }\n",
    "                            if (isMatch) {\n",
    "                               sVentaBruta += item.price * item.quantity;\n",
    "                               sCost += (item.cost || 0) * item.quantity;\n",
    "                            }\n",
    "                         });\n",
    "\n",
    "                         // Step 2: Detect matched promos and attribute discount to supplier\n",
    "                         if ((sale.discount || 0) > 0 || sale.total < saleItems.reduce((s, i) => s + i.price * i.quantity, 0)) {\n",
    "                            promotions.forEach(promo => {\n",
    "                               if (!promo.active) return;\n",
    "                               const allTriggerPresent = promo.triggerProductIds.every(pid => saleItemIds.includes(pid));\n",
    "                               if (!allTriggerPresent) return;\n",
    "\n",
    "                               // Calculate promo discount: sum of trigger items' list prices - promoPrice\n",
    "                               const triggerListTotal = promo.triggerProductIds.reduce((sum, pid) => {\n",
    "                                  const item = saleItems.find(i => i.id === pid);\n",
    "                                  return sum + (item ? item.price : 0);\n",
    "                               }, 0);\n",
    "                               const promoDiscountAmount = Math.max(0, triggerListTotal - promo.promoPrice);\n",
    "\n",
    "                               if (promoDiscountAmount <= 0) return;\n",
    "\n",
    "                               // How much of this promo discount belongs to the selected supplier?\n",
    "                               let supplierShareInPromo = 0;\n",
    "                               let totalPromoGross = 0;\n",
    "                               promo.triggerProductIds.forEach(pid => {\n",
    "                                  const item = saleItems.find(i => i.id === pid);\n",
    "                                  const itemPrice = item ? item.price : 0;\n",
    "                                  totalPromoGross += itemPrice;\n",
    "\n",
    "                                  // Check if this trigger product belongs to the selected supplier\n",
    "                                  let belongsToSupplier = false;\n",
    "                                  if (item?.supplierId === supplierFilter) belongsToSupplier = true;\n",
    "                                  if (!belongsToSupplier) { const p = products.find(x => x.id === pid); if (p && p.supplierId === supplierFilter) belongsToSupplier = true; }\n",
    "                                  if (!belongsToSupplier) { const b = bulkProducts.find(x => x.id === pid); if (b && b.supplierId === supplierFilter) belongsToSupplier = true; }\n",
    "                                  if (belongsToSupplier) supplierShareInPromo += itemPrice;\n",
    "                               });\n",
    "\n",
    "                               // Supplier's portion of this promo's discount\n",
    "                               const supplierRatio = totalPromoGross > 0 ? supplierShareInPromo / totalPromoGross : 0;\n",
    "                               sPromoDiscount += promoDiscountAmount * supplierRatio;\n",
    "                            });\n",
    "                         }\n",
    "                      });\n",
    "\n",
    "                      const sVentaNeta = sVentaBruta - sPromoDiscount;\n",
    "                      return (\n",
    "                         <div className=\"mt-3 space-y-2\">\n",
    "                            <div className=\"bg-blue-50 px-3 py-2 rounded-lg border border-blue-100\">\n",
    "                               <p className=\"text-[10px] text-blue-600 font-bold uppercase\">Costo {selSup?.name}</p>\n",
    "                               <p className=\"text-lg font-bold text-blue-700\">${Math.round(sCost).toLocaleString('es-AR')}</p>\n",
    "                            </div>\n",
    "                            <div className=\"bg-green-50 px-3 py-2 rounded-lg border border-green-100\">\n",
    "                               <p className=\"text-[10px] text-green-600 font-bold uppercase\">Venta Bruta {selSup?.name}</p>\n",
    "                               <p className=\"text-lg font-bold text-green-700\">${Math.round(sVentaBruta).toLocaleString('es-AR')}</p>\n",
    "                            </div>\n",
    "                            {sPromoDiscount > 0 && (\n",
    "                               <div className=\"bg-red-50 px-3 py-2 rounded-lg border border-red-100\">\n",
    "                                  <p className=\"text-[10px] text-red-600 font-bold uppercase\">Desc. Promos {selSup?.name}</p>\n",
    "                                  <p className=\"text-lg font-bold text-red-600\">-${Math.round(sPromoDiscount).toLocaleString('es-AR')}</p>\n",
    "                               </div>\n",
    "                            )}\n",
    "                            <div className=\"bg-purple-50 px-3 py-2 rounded-lg border border-purple-100\">\n",
    "                               <p className=\"text-[10px] text-purple-600 font-bold uppercase\">Venta Neta {selSup?.name}</p>\n",
    "                               <p className=\"text-lg font-bold text-purple-700\">${Math.round(sVentaNeta).toLocaleString('es-AR')}</p>\n",
    "                            </div>\n",
    "                            <div className=\"bg-amber-50 px-3 py-2 rounded-lg border border-amber-100\">\n",
    "                               <p className=\"text-[10px] text-amber-600 font-bold uppercase\">Ganancia Neta {selSup?.name}</p>\n",
    "                               <p className=\"text-lg font-bold text-amber-700\">${Math.round(sVentaNeta - sCost).toLocaleString('es-AR')}</p>\n",
    "                            </div>\n",
    "                         </div>\n",
    "                      );\n",
    "                   })()}\n",
    "\n",
]

# Replace lines 496-540 (0-indexed 495-539)
new_lines = lines[:495] + new_sidebar + lines[540:]

with open(filepath, 'w', encoding='utf-8', newline='') as f:
    f.writelines(new_lines)

print(f"Done! Old: {len(lines)} lines, New: {len(new_lines)} lines")
