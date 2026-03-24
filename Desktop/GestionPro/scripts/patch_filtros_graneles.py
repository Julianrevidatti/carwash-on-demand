import os
import re

def patch_dashboard():
    dashboard_path = 'components/DashboardV2.tsx'
    with open(dashboard_path, 'r', encoding='utf-8') as f:
        content = f.read()

    old_block = """                    const product = safeProducts.find(p => p.id === item.id);
                    // Use 'Sin Proveedor' if no supplierId, or find name if exists
                    let supplierName = 'Sin Proveedor';
                    if (product && product.supplierId) {
                        const s = safeSuppliers.find(sup => sup.id === product.supplierId);
                        if (s) supplierName = s.name;
                    }"""

    new_block = """                    const product = safeProducts.find(p => p.id === item.id);
                    // Use 'Sin Proveedor' if no supplierId, or find name if exists
                    let supplierName = 'Sin Proveedor';
                    if (product && product.supplierId) {
                        const s = safeSuppliers.find(sup => sup.id === product.supplierId);
                        if (s) supplierName = s.name;
                    } else if (!product) {
                        const bulk = bulkProducts.find(b => b.id === item.id);
                        if (bulk && bulk.supplierId) {
                            const s = safeSuppliers.find(sup => sup.id === bulk.supplierId);
                            if (s) supplierName = s.name;
                        }
                    }"""

    if old_block in content:
        content = content.replace(old_block, new_block)
        with open(dashboard_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Patched DashboardV2.tsx supplier resolution")
    else:
        print("Could not find block in DashboardV2.tsx")

def patch_inventory():
    inventory_path = 'components/InventoryV2.tsx'
    with open(inventory_path, 'r', encoding='utf-8') as f:
        content = f.read()

    old_filter = """        let matchesSupplier = true;
        if (historySupplierFilter) {
            const product = products.find(p => p.id === item.productId);
            matchesSupplier = product?.supplierId === historySupplierFilter;
        }"""
        
    new_filter = """        let matchesSupplier = true;
        if (historySupplierFilter) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                matchesSupplier = product.supplierId === historySupplierFilter;
            } else {
                const bulk = bulkProducts.find(b => b.id === item.productId);
                matchesSupplier = bulk ? bulk.supplierId === historySupplierFilter : false;
            }
        }"""

    if old_filter in content:
        content = content.replace(old_filter, new_filter)
        print("Patched InventoryV2.tsx matchesSupplier")
    else:
        print("Could not find old_filter in InventoryV2.tsx")

    old_total_cost = """                                            ${filteredHistory.reduce((sum, item) => {
                                                const product = products.find(p => p.id === item.productId);
                                                return sum + (item.quantity * (product?.cost || 0));
                                            }, 0).toLocaleString()}"""
                                            
    new_total_cost = """                                            ${filteredHistory.reduce((sum, item) => {
                                                const product = products.find(p => p.id === item.productId);
                                                if (product) {
                                                    return sum + (item.quantity * (product.cost || 0));
                                                }
                                                const bulk = bulkProducts.find(b => b.id === item.productId);
                                                if (bulk) {
                                                    const costPerKg = bulk.weightPerBulk > 0 ? bulk.costPerBulk / bulk.weightPerBulk : 0;
                                                    return sum + (item.quantity * costPerKg);
                                                }
                                                return sum;
                                            }, 0).toLocaleString()}"""

    if old_total_cost in content:
        content = content.replace(old_total_cost, new_total_cost)
        print("Patched InventoryV2.tsx total cost calculation")
    else:
        print("Could not find old_total_cost in InventoryV2.tsx")

    with open(inventory_path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    patch_dashboard()
    patch_inventory()
