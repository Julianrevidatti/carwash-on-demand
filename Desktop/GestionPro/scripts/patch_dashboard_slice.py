import os

def expand_dashboard_suppliers():
    dashboard_path = 'components/DashboardV2.tsx'
    with open(dashboard_path, 'r', encoding='utf-8') as f:
        content = f.read()

    old_slice = ".slice(0, 5); // Top 5 suppliers by current month sales"
    new_slice = ".slice(0, 15); // Top 15 suppliers by current month sales"

    if old_slice in content:
        content = content.replace(old_slice, new_slice)
        with open(dashboard_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Patched DashboardV2.tsx: expanded top suppliers to 15")
    else:
        print("Could not find old_slice in DashboardV2.tsx. Maybe already patched?")

if __name__ == '__main__':
    expand_dashboard_suppliers()
