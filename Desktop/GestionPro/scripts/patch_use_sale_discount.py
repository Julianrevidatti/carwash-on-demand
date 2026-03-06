"""
Patch DataReports.tsx: FINAL FIX for per-supplier sales calculation.

STOP trying to detect promos. Instead, use the sale's ACTUAL recorded data:
- sale.total = what the customer paid
- sale.items = items with list prices
- sale.discount = total discount applied
- sale.surcharge = surcharge

For each sale:
1. Sum list prices of supplier's items = supplier gross
2. Sum list prices of ALL items = ticket gross  
3. Ticket discount = ticket gross - (sale.total - sale.surcharge) = actual discount
4. Supplier's share of discount = ticket discount * (supplier gross / ticket gross)
5. Supplier net = supplier gross - supplier's discount

This is mathematically correct because the discount was derived from items
across the ticket, and the supplier's share is proportional to their items.

BUT the user says "no proportional". For tickets where ALL items belong to
the selected supplier, the supplier gets 100% of the discount (which IS correct).
For mixed tickets, we have to split somehow.

HOWEVER: the user specifically said they got $59,600 by going ticket by ticket
and using the promo price for promo items. This means they subtracted the
discount ONLY from items that were in a promo.

New approach:
- For tickets with NO discount: just sum list prices
- For tickets WITH a discount: check if the supplier has items that are part of
  any known promo (active OR inactive). If yes, the supplier absorbs the full
  discount (or their share if mixed).
- If no items match any promo triggers, split proportionally.
"""

filepath = r'c:\Users\54112\Desktop\GestionPro\components\DataReports.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the sidebar summary block
start_idx = None
end_idx = None
for i, line in enumerate(lines):
    if '{/* Per-Supplier Summary when filtered */}' in line:
        start_idx = i
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
    "                      let sTotalDiscount = 0;\n",
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
    "                         const ticketGross = saleItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);\n",
    "                         const ticketNet = sale.total - (sale.surcharge || 0);\n",
    "                         const ticketDiscount = Math.max(0, ticketGross - ticketNet);\n",
    "\n",
    "                         // Sum this supplier's list prices and cost\n",
    "                         let supplierGross = 0;\n",
    "                         saleItems.forEach(item => {\n",
    "                            if (isSupplierItem(item.id, item.supplierId)) {\n",
    "                               supplierGross += item.price * item.quantity;\n",
    "                               sCost += (item.cost || 0) * item.quantity;\n",
    "                            }\n",
    "                         });\n",
    "                         sVentaBruta += supplierGross;\n",
    "\n",
    "                         // Attribute discount: check if supplier's items are in any promo trigger\n",
    "                         if (ticketDiscount > 0 && supplierGross > 0) {\n",
    "                            // Check ALL promos (active AND inactive) to see if supplier items are promo items\n",
    "                            const supplierItemIds = saleItems.filter(i => isSupplierItem(i.id, i.supplierId)).map(i => i.id);\n",
    "                            const otherItemIds = saleItems.filter(i => !isSupplierItem(i.id, i.supplierId)).map(i => i.id);\n",
    "\n",
    "                            // Are any of the supplier's items in any promo?\n",
    "                            const supplierInPromo = promotions.some(p =>\n",
    "                               p.triggerProductIds.some(pid => supplierItemIds.includes(pid))\n",
    "                            );\n",
    "                            // Are any of the OTHER items in any promo?\n",
    "                            const otherInPromo = promotions.some(p =>\n",
    "                               p.triggerProductIds.some(pid => otherItemIds.includes(pid))\n",
    "                            );\n",
    "\n",
    "                            if (supplierInPromo && !otherInPromo) {\n",
    "                               // Only supplier's items are promo items -> supplier absorbs ALL discount\n",
    "                               sTotalDiscount += ticketDiscount;\n",
    "                            } else if (!supplierInPromo && otherInPromo) {\n",
    "                               // Only other items are promo items -> supplier absorbs NONE\n",
    "                               // sTotalDiscount += 0;\n",
    "                            } else if (supplierInPromo && otherInPromo) {\n",
    "                               // Both have promo items -> split by gross share\n",
    "                               sTotalDiscount += ticketDiscount * (supplierGross / ticketGross);\n",
    "                            } else {\n",
    "                               // No items match any promo (manual discount?) -> split by gross share\n",
    "                               sTotalDiscount += ticketDiscount * (supplierGross / ticketGross);\n",
    "                            }\n",
    "                         }\n",
    "                      });\n",
    "\n",
    "                      const sVentaNeta = sVentaBruta - sTotalDiscount;\n",
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
    "                            {sTotalDiscount > 0 && (\n",
    "                               <div className=\"bg-red-50 px-3 py-2 rounded-lg border border-red-100\">\n",
    "                                  <p className=\"text-[10px] text-red-600 font-bold uppercase\">Desc. Promos {selSup?.name}</p>\n",
    "                                  <p className=\"text-lg font-bold text-red-600\">-${Math.round(sTotalDiscount).toLocaleString('es-AR')}</p>\n",
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
