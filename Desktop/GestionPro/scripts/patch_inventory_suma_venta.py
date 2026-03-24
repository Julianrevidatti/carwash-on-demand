import os
import re

def patch_inventory_suma_venta():
    inventory_path = 'components/InventoryV2.tsx'
    with open(inventory_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # We want to replace the `Suma Venta` calculation block:
    # it currently looks like:
    #                                     <div className="bg-green-50 px-2 py-1 rounded border border-green-100 mt-1">
    #                                         <p className="text-[10px] text-green-600 font-bold uppercase">Suma Venta</p>
    #                                         <p className="text-sm font-bold text-green-700">
    #                                             ${filteredHistory.reduce((sum, item) => {
    #                                                 const product = products.find(p => p.id === item.productId);
    #                                                 return sum + (item.quantity * (product?.price || 0));
    #                                             }, 0).toLocaleString()}
    #                                         </p>
    #                                     </div>

    old_block = """                                        <p className="text-sm font-bold text-green-700">
                                            ${filteredHistory.reduce((sum, item) => {
                                                const product = products.find(p => p.id === item.productId);
                                                return sum + (item.quantity * (product?.price || 0));
                                            }, 0).toLocaleString()}
                                        </p>"""

    new_block = """                                        <p className="text-sm font-bold text-green-700">
                                            ${filteredHistory.reduce((sum, item) => {
                                                const product = products.find(p => p.id === item.productId);
                                                if (product) return sum + (item.quantity * (product.price || 0));
                                                const bulk = bulkProducts.find(b => b.id === item.productId);
                                                if (bulk) return sum + (item.quantity * (bulk.pricePerKg || 0));
                                                return sum;
                                            }, 0).toLocaleString()}
                                        </p>"""

    if old_block in content:
        content = content.replace(old_block, new_block)
        with open(inventory_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Patched InventoryV2.tsx: fixed Suma Venta to include bulk products")
    else:
        print("Could not find old_block pattern in InventoryV2.tsx")

if __name__ == '__main__':
    patch_inventory_suma_venta()
