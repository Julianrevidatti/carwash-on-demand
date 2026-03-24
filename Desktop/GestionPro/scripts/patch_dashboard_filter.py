import os

def hide_sin_proveedor():
    dashboard_path = 'components/DashboardV2.tsx'
    with open(dashboard_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Old code:
    # const supplierComparisonData = Array.from(supplierMap.entries())
    #    .map(([name, stats]) => ({ name, ...stats }))
    #    .sort((a, b) => b.current - a.current)
    #    .slice(0, 15); // Top 15 suppliers by current month sales

    old_block = """    const supplierComparisonData = Array.from(supplierMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.current - a.current)
        .slice(0, 15); // Top 15 suppliers by current month sales"""

    new_block = """    const supplierComparisonData = Array.from(supplierMap.entries())
        .filter(([name]) => name !== 'Sin Proveedor')
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.current - a.current)
        .slice(0, 15); // Top 15 suppliers by current month sales"""

    if old_block in content:
        content = content.replace(old_block, new_block)
        with open(dashboard_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Patched DashboardV2.tsx: filtered out 'Sin Proveedor' from chart")
    else:
        print("Could not find old_block in DashboardV2.tsx")

if __name__ == '__main__':
    hide_sin_proveedor()
