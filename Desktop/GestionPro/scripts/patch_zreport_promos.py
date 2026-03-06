"""
Patch DataReports.tsx: FIX for per-supplier sales calculation in Z-Report (Closed Sessions).

Replaces the block inside `getSessionDetails` that tries to calculate promo discounts 
by looping over active promos, which ignores quantities and creates mismatched Z-Reports.
We replace it with the exact logic used in the Sales Registry (sidebar summary).
"""

filepath = r'c:\Users\54112\Desktop\GestionPro\components\DataReports.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if '// STEP 2: Detect matched promos and subtract discount from the correct suppliers' in line:
        start_idx = i
        break

if start_idx:
    for i in range(start_idx, len(lines)):
        if '// ADD SURCHARGE TO BREAKDOWN' in lines[i]:
            end_idx = i
            break

print(f"Replacement block: lines {start_idx+1} to {end_idx+1}")

new_logic = [
    "               // STEP 2: Detect matched promos and subtract discount from the correct suppliers\n",
    "               const ticketGross = itemsResolved.reduce((sum, i) => sum + (i.price * i.quantity), 0);\n",
    "               const ticketNet = sale.total - (sale.surcharge || 0);\n",
    "               const ticketDiscount = Math.max(0, ticketGross - ticketNet);\n",
    "\n",
    "               if (ticketDiscount > 0) {\n",
    "                  // Get supplier gross totals for this ticket\n",
    "                  const ticketSupplierGross = new Map<string, number>();\n",
    "                  itemsResolved.forEach(item => {\n",
    "                     const itemGross = item.price * item.quantity;\n",
    "                     ticketSupplierGross.set(item.supplierName, (ticketSupplierGross.get(item.supplierName) || 0) + itemGross);\n",
    "                  });\n",
    "\n",
    "                  // Check which items are in promos\n",
    "                  const promoSupplierGross = new Map<string, number>();\n",
    "                  let totalPromoGross = 0;\n",
    "                  \n",
    "                  itemsResolved.forEach(item => {\n",
    "                     const inPromo = promotions.some(p => p.triggerProductIds.includes(item.id));\n",
    "                     if (inPromo) {\n",
    "                        const itemGross = item.price * item.quantity;\n",
    "                        promoSupplierGross.set(item.supplierName, (promoSupplierGross.get(item.supplierName) || 0) + itemGross);\n",
    "                        totalPromoGross += itemGross;\n",
    "                     }\n",
    "                  });\n",
    "\n",
    "                  // Attribute discount\n",
    "                  ticketSupplierGross.forEach((supplierGross, supName) => {\n",
    "                     let discountShare = 0;\n",
    "                     if (totalPromoGross > 0) {\n",
    "                        // Some items were in promo. If this supplier has promo items, they take their share.\n",
    "                        const supPromoGross = promoSupplierGross.get(supName) || 0;\n",
    "                        discountShare = ticketDiscount * (supPromoGross / totalPromoGross);\n",
    "                     } else {\n",
    "                        // No items match promos (manual discount). Split proportionally across all.\n",
    "                        discountShare = ticketDiscount * (supplierGross / ticketGross);\n",
    "                     }\n",
    "\n",
    "                     if (discountShare > 0) {\n",
    "                        const current = supplierMap.get(supName) || { gross: 0, cost: 0 };\n",
    "                        supplierMap.set(supName, { gross: current.gross - discountShare, cost: current.cost });\n",
    "                     }\n",
    "                  });\n",
    "               }\n",
    "\n"
]

if start_idx is not None and end_idx is not None:
    new_lines = lines[:start_idx] + new_logic + lines[end_idx:]
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        f.writelines(new_lines)
    print(f"Done! Old: {len(lines)} lines, New: {len(new_lines)} lines")
else:
    print("Could not find the target code block.")
