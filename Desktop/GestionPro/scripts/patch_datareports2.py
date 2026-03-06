"""
Patch DataReports.tsx: Add per-supplier Costo and Venta Neta summary
boxes directly below the supplier filter dropdown in the sidebar.
"""
import os

filepath = r'c:\Users\54112\Desktop\GestionPro\components\DataReports.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# After line 471 (0-indexed 470) which is </select> closing </div>
# We insert the summary boxes before line 472 (the Buscar Item section)

summary_block = [
    "\n",
    "                   {/* Per-Supplier Summary when filtered */}\n",
    "                   {supplierFilter !== 'all' && (() => {\n",
    "                      const selSup = suppliers.find(s => s.id === supplierFilter);\n",
    "                      let sCost = 0;\n",
    "                      let sVentaBruta = 0;\n",
    "                      let sVentaNeta = 0;\n",
    "                      filteredSales.forEach(sale => {\n",
    "                         const saleGross = (sale.items || []).reduce((sum, i) => sum + (i.price * i.quantity), 0);\n",
    "                         const saleNet = sale.total - (sale.surcharge || 0);\n",
    "                         (sale.items || []).forEach(item => {\n",
    "                            let isMatch = item.supplierId === supplierFilter;\n",
    "                            if (!isMatch) { const p = products.find(x => x.id === item.id); if (p && p.supplierId === supplierFilter) isMatch = true; }\n",
    "                            if (!isMatch) { const b = bulkProducts.find(x => x.id === item.id); if (b && b.supplierId === supplierFilter) isMatch = true; }\n",
    "                            if (isMatch) {\n",
    "                               const ig = item.price * item.quantity;\n",
    "                               const ratio = saleGross > 0 ? ig / saleGross : 0;\n",
    "                               sVentaBruta += ig;\n",
    "                               sVentaNeta += saleNet * ratio;\n",
    "                               sCost += (item.cost || 0) * item.quantity;\n",
    "                            }\n",
    "                         });\n",
    "                      });\n",
    "                      return (\n",
    '                         <div className="mt-3 space-y-2">\n',
    '                            <div className="bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">\n',
    '                               <p className="text-[10px] text-blue-600 font-bold uppercase">Costo {selSup?.name}</p>\n',
    "                               <p className=\"text-lg font-bold text-blue-700\">${Math.round(sCost).toLocaleString('es-AR')}</p>\n",
    "                            </div>\n",
    '                            <div className="bg-green-50 px-3 py-2 rounded-lg border border-green-100">\n',
    '                               <p className="text-[10px] text-green-600 font-bold uppercase">Venta Bruta {selSup?.name}</p>\n',
    "                               <p className=\"text-lg font-bold text-green-700\">${Math.round(sVentaBruta).toLocaleString('es-AR')}</p>\n",
    "                            </div>\n",
    '                            <div className="bg-purple-50 px-3 py-2 rounded-lg border border-purple-100">\n',
    '                               <p className="text-[10px] text-purple-600 font-bold uppercase">Venta Neta {selSup?.name}</p>\n',
    "                               <p className=\"text-lg font-bold text-purple-700\">${Math.round(sVentaNeta).toLocaleString('es-AR')}</p>\n",
    '                               <p className="text-[9px] text-purple-400">(Promos descontadas proporcionalmente)</p>\n',
    "                            </div>\n",
    '                            <div className="bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">\n',
    '                               <p className="text-[10px] text-amber-600 font-bold uppercase">Ganancia Neta {selSup?.name}</p>\n',
    "                               <p className=\"text-lg font-bold text-amber-700\">${Math.round(sVentaNeta - sCost).toLocaleString('es-AR')}</p>\n",
    "                            </div>\n",
    "                         </div>\n",
    "                      );\n",
    "                   })()}\n",
    "\n",
]

# Insert after line 471 (0-indexed 470), before line 472 (0-indexed 471)
new_lines = lines[:471] + summary_block + lines[471:]

with open(filepath, 'w', encoding='utf-8', newline='') as f:
    f.writelines(new_lines)

print(f"Done! Patched {filepath}")
print(f"Old file had {len(lines)} lines, new file has {len(new_lines)} lines")
