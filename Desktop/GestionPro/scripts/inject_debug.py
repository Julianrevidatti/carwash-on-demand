import os

def run():
    path = "components/DashboardV2.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
        
    debug_banner = """
    // --- DEBUG BANNER ---
    const fiambresDebugSum = monthlySales.reduce((acc, sale) => {
        if (!Array.isArray(sale.items)) return acc;
        return acc + sale.items.reduce((iAcc, item) => {
            const bulk = bulkProducts.find(b => b.id === item.id);
            if (bulk && bulk.supplierId) {
                const sup = safeSuppliers.find(s => s.id === bulk.supplierId);
                if (sup && sup.name.toLowerCase().includes('fiambre')) {
                    return iAcc + (item.price * item.quantity);
                }
            }
            return iAcc;
        }, 0);
    }, 0);
    const fiambresTotalString = "SUMA BULK FIAMBRES REACT: $" + fiambresDebugSum;

    // --- END DEBUG BANNER ---
"""

    if "DEBUG BANNER" in content:
        print("Already injected")
        return
        
    # Inject right before return
    replace_str = "return ("
    new_str = debug_banner + "\n    return ("
    
    if replace_str in content:
        content = content.replace(replace_str, new_str)
        
        # Inject visually
        visual_str = "return (\n        <div className=\"space-y-6\">\n"
        new_visual = "return (\n        <div className=\"space-y-6\">\n            <div className=\"bg-red-500 text-white font-bold p-4 rounded-lg\">{fiambresTotalString}</div>\n"
        content = content.replace(visual_str, new_visual)
        
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Injected debug banner in DashboardV2.tsx")
    else:
        print("Could not find return statement in DashboardV2.tsx")

if __name__ == "__main__":
    run()
