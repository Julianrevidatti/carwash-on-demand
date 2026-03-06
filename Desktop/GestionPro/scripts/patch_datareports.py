"""
Patch DataReports.tsx: Replace the Total header bar (lines 486-489)
with an enhanced version that shows per-supplier Cost and Venta Neta
when filtering by a specific supplier.
"""
import os

filepath = r'c:\Users\54112\Desktop\GestionPro\components\DataReports.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The original lines 486-489 (0-indexed: 485-488):
# 486:                   <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
# 487:                      <span className="font-bold text-gray-700">{filteredSales.length} Operaciones</span>
# 488:                      <span className="font-black text-xl text-blue-600">Total: ${filteredSales.reduce(...)}</span>
# 489:                   </div>

new_block = [
    '                   <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-wrap gap-2">\n',
    '                      <span className="font-bold text-gray-700">{filteredSales.length} Operaciones</span>\n',
    '                      <div className="flex items-center gap-3 flex-wrap">\n',
    "                         {supplierFilter !== 'all' && (() => {\n",
    "                            const selectedSupplier = suppliers.find(s => s.id === supplierFilter);\n",
    "                            let sCost = 0;\n",
    "                            let sVenta = 0;\n",
    "                            filteredSales.forEach(sale => {\n",
    "                               const saleGross = (sale.items || []).reduce((sum, i) => sum + (i.price * i.quantity), 0);\n",
    "                               const saleNet = sale.total - (sale.surcharge || 0);\n",
    "                               (sale.items || []).forEach(item => {\n",
    "                                  let match = item.supplierId === supplierFilter;\n",
    "                                  if (!match) { const p = products.find(x => x.id === item.id); if (p && p.supplierId === supplierFilter) match = true; }\n",
    "                                  if (!match) { const b = bulkProducts.find(x => x.id === item.id); if (b && b.supplierId === supplierFilter) match = true; }\n",
    "                                  if (match) {\n",
    "                                     const itemGross = item.price * item.quantity;\n",
    "                                     const ratio = saleGross > 0 ? itemGross / saleGross : 0;\n",
    "                                     sVenta += saleNet * ratio;\n",
    "                                     sCost += (item.cost || 0) * item.quantity;\n",
    "                                  }\n",
    "                               });\n",
    "                            });\n",
    "                            return (\n",
    "                               <>\n",
    '                                  <div className="bg-blue-50 px-3 py-1 rounded border border-blue-100 text-right">\n',
    '                                     <p className="text-[9px] text-blue-600 font-bold uppercase">Costo {selectedSupplier?.name}</p>\n',
    "                                     <p className=\"text-sm font-bold text-blue-700\">${Math.round(sCost).toLocaleString('es-AR')}</p>\n",
    "                                  </div>\n",
    '                                  <div className="bg-green-50 px-3 py-1 rounded border border-green-100 text-right">\n',
    '                                     <p className="text-[9px] text-green-600 font-bold uppercase">Venta Neta {selectedSupplier?.name}</p>\n',
    "                                     <p className=\"text-sm font-bold text-green-700\">${Math.round(sVenta).toLocaleString('es-AR')}</p>\n",
    "                                  </div>\n",
    "                               </>\n",
    "                            );\n",
    "                         })()}\n",
    '                         <span className="font-black text-xl text-blue-600">Total: ${filteredSales.reduce((acc, s) => acc + s.total, 0).toLocaleString()}</span>\n',
    "                      </div>\n",
    "                   </div>\n",
]

# Replace lines 486-489 (0-indexed 485-488)
new_lines = lines[:485] + new_block + lines[489:]

with open(filepath, 'w', encoding='utf-8', newline='') as f:
    f.writelines(new_lines)

print(f"Done! Patched {filepath}")
print(f"Old file had {len(lines)} lines, new file has {len(new_lines)} lines")
