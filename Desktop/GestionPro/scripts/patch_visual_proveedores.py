import os
import re

def patch_inventory_column():
    inventory_path = 'components/InventoryV2.tsx'
    with open(inventory_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # The buggy block rendering rows in History:
    old_block = """                                    paginatedHistory.map(item => {
                                        const product = products.find(p => p.id === item.productId);
                                        const supplier = suppliers.find(s => s.id === product?.supplierId);
                                        const user = systemUsers.find(u => u.id === item.userId);"""

    new_block = """                                    paginatedHistory.map(item => {
                                        const product = products.find(p => p.id === item.productId);
                                        let supplierId = product?.supplierId;
                                        if (!product) {
                                            const bulk = bulkProducts.find(b => b.id === item.productId);
                                            supplierId = bulk?.supplierId;
                                        }
                                        const supplier = suppliers.find(s => s.id === supplierId);
                                        const user = systemUsers.find(u => u.id === item.userId);"""

    if old_block in content:
        content = content.replace(old_block, new_block)
        with open(inventory_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Patched InventoryV2.tsx history column rendering")
    else:
        print("Could not find block in InventoryV2.tsx. Maybe already patched?")

def patch_dashboard_charts():
    dashboard_path = 'components/DashboardV2.tsx'
    with open(dashboard_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Dashboard logic:
    old_block = """                    const product = safeProducts.find(p => p.id === item.id);
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

    new_block = """                    let supplierIdToUse = item.supplierId;
                    if (!supplierIdToUse) {
                        const product = safeProducts.find(p => p.id === item.id);
                        if (product && product.supplierId) {
                            supplierIdToUse = product.supplierId;
                        } else if (!product) {
                            const bulk = bulkProducts.find(b => b.id === item.id);
                            if (bulk && bulk.supplierId) {
                                supplierIdToUse = bulk.supplierId;
                            }
                        }
                    }

                    let supplierName = 'Sin Proveedor';
                    if (supplierIdToUse) {
                        const s = safeSuppliers.find(sup => sup.id === supplierIdToUse);
                        if (s) supplierName = s.name;
                    }"""

    if old_block in content:
        content = content.replace(old_block, new_block)
        with open(dashboard_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Patched DashboardV2.tsx supplierName resolution correctly using item.supplierId as priority")
    else:
        print("Could not find block in DashboardV2.tsx")

if __name__ == '__main__':
    patch_inventory_column()
    patch_dashboard_charts()
