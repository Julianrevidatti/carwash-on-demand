"""
Patch DataReports.tsx: Rewrite the per-supplier sidebar calculation
to exactly replicate the POS.tsx calculatePromoDiscount logic.

The key insight: we replicate the SAME promo matching from POS.tsx,
then attribute the discount to the supplier whose items are in the promo.
No proportional distribution - subtract directly.
"""

filepath = r'c:\Users\54112\Desktop\GestionPro\components\DataReports.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the sidebar summary block. Search for the marker comment.
start_idx = None
end_idx = None
for i, line in enumerate(lines):
    if '{/* Per-Supplier Summary when filtered */}' in line:
        start_idx = i
    if start_idx is not None and i > start_idx and '})()}' in line:
        end_idx = i + 1
        break

if start_idx is None or end_idx is None:
    # Try finding by the supplierFilter check
    for i, line in enumerate(lines):
        if "supplierFilter !== 'all' && (() =>" in line and i > 480:
            start_idx = i - 1  # include the comment line before
            break
    if start_idx:
        for i in range(start_idx, len(lines)):
            if '})()}' in lines[i]:
                end_idx = i + 1
                break

print(f"Sidebar block: lines {start_idx+1} to {end_idx}")

new_sidebar = [
    "                   {/* Per-Supplier Summary when filtered */}\n",
    "                   {supplierFilter !== 'all' && (() => {\n",
    "                      const selSup = suppliers.find(s => s.id === supplierFilter);\n",
    "                      let sCost = 0;\n",
    "                      let sVentaBruta = 0;\n",
    "                      let sPromoDiscount = 0;\n",
    "\n",
    "                      // Helper: check if an item belongs to the selected supplier\n",
    "                      const isSupplierItem = (itemId: string, itemSupplierId?: string) => {\n",
    "                         if (itemSupplierId === supplierFilter) return true;\n",
    "                         const p = products.find(x => x.id === itemId);\n",
    "                         if (p && p.supplierId === supplierFilter) return true;\n",
    "                         const b = bulkProducts.find(x => x.id === itemId);\n",
    "                         if (b && b.supplierId === supplierFilter) return true;\n",
    "                         return false;\n",
    "                      };\n",
    "\n",
    "                      filteredSales.forEach(sale => {\n",
    "                         const saleItems = sale.items || [];\n",
    "\n",
    "                         // Step 1: Sum gross (list prices) for this supplier's items\n",
    "                         saleItems.forEach(item => {\n",
    "                            if (isSupplierItem(item.id, item.supplierId)) {\n",
    "                               sVentaBruta += item.price * item.quantity;\n",
    "                               sCost += (item.cost || 0) * item.quantity;\n",
    "                            }\n",
    "                         });\n",
    "\n",
    "                         // Step 2: Replicate POS promo engine to find exact discounts\n",
    "                         // Clone cart quantities to simulate deductions (same as POS)\n",
    "                         const cartMap: Record<string, number> = {};\n",
    "                         saleItems.forEach(item => {\n",
    "                            cartMap[item.id] = (cartMap[item.id] || 0) + item.quantity;\n",
    "                         });\n",
    "\n",
    "                         const sortedPromos = [...promotions].sort((a, b) => b.promoPrice - a.promoPrice);\n",
    "\n",
    "                         for (const promo of sortedPromos) {\n",
    "                            if (!promo.active) continue;\n",
    "\n",
    "                            if (promo.type === 'flexible' && promo.quantityRequired) {\n",
    "                               // FLEXIBLE: N items from the pool\n",
    "                               const matchingIds = (promo.triggerProductIds || []).filter(pid => (cartMap[pid] || 0) > 0);\n",
    "                               let totalAvailable = matchingIds.reduce((sum, pid) => sum + cartMap[pid], 0);\n",
    "                               const combos = Math.floor(totalAvailable / promo.quantityRequired);\n",
    "\n",
    "                               if (combos > 0) {\n",
    "                                  // Build units list sorted by price desc (same as POS)\n",
    "                                  const units: { id: string, price: number }[] = [];\n",
    "                                  matchingIds.forEach(pid => {\n",
    "                                     const saleItem = saleItems.find(i => i.id === pid);\n",
    "                                     const qty = cartMap[pid];\n",
    "                                     for (let i = 0; i < qty; i++) units.push({ id: pid, price: saleItem?.price || 0 });\n",
    "                                  });\n",
    "                                  units.sort((a, b) => b.price - a.price);\n",
    "\n",
    "                                  const used = units.slice(0, combos * promo.quantityRequired);\n",
    "                                  const regularSum = used.reduce((s, u) => s + u.price, 0);\n",
    "                                  const promoTotal = combos * promo.promoPrice;\n",
    "                                  const discount = regularSum - promoTotal;\n",
    "\n",
    "                                  // Deduct from cart\n",
    "                                  used.forEach(u => { if (cartMap[u.id] > 0) cartMap[u.id]--; });\n",
    "\n",
    "                                  // Attribute: how much of this discount belongs to selected supplier?\n",
    "                                  const supplierRegular = used.filter(u => isSupplierItem(u.id)).reduce((s, u) => s + u.price, 0);\n",
    "                                  if (supplierRegular > 0 && regularSum > 0) {\n",
    "                                     sPromoDiscount += discount * (supplierRegular / regularSum);\n",
    "                                  }\n",
    "                               }\n",
    "\n",
    "                            } else {\n",
    "                               // STANDARD: all trigger products must be present\n",
    "                               const allPresent = promo.triggerProductIds.every(pid => (cartMap[pid] || 0) > 0);\n",
    "                               if (!allPresent) continue;\n",
    "\n",
    "                               const regularSum = promo.triggerProductIds.reduce((sum, pid) => {\n",
    "                                  const saleItem = saleItems.find(i => i.id === pid);\n",
    "                                  return sum + (saleItem?.price || 0);\n",
    "                               }, 0);\n",
    "                               const discount = Math.max(0, regularSum - promo.promoPrice);\n",
    "\n",
    "                               // Deduct from cart\n",
    "                               promo.triggerProductIds.forEach(pid => { if (cartMap[pid] > 0) cartMap[pid]--; });\n",
    "\n",
    "                               if (discount > 0) {\n",
    "                                  // Attribute: how much belongs to selected supplier?\n",
    "                                  const supplierRegular = promo.triggerProductIds.reduce((sum, pid) => {\n",
    "                                     if (isSupplierItem(pid)) {\n",
    "                                        const saleItem = saleItems.find(i => i.id === pid);\n",
    "                                        return sum + (saleItem?.price || 0);\n",
    "                                     }\n",
    "                                     return sum;\n",
    "                                  }, 0);\n",
    "                                  if (supplierRegular > 0 && regularSum > 0) {\n",
    "                                     sPromoDiscount += discount * (supplierRegular / regularSum);\n",
    "                                  }\n",
    "                               }\n",
    "                            }\n",
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

new_lines = lines[:start_idx] + new_sidebar + lines[end_idx:]

with open(filepath, 'w', encoding='utf-8', newline='') as f:
    f.writelines(new_lines)

print(f"Done! Old: {len(lines)} lines, New: {len(new_lines)} lines")
print(f"Replaced lines {start_idx+1}-{end_idx} with {len(new_sidebar)} new lines")
