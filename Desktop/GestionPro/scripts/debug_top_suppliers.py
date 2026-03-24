import urllib.request
import json
import urllib.parse
from datetime import datetime, timedelta

def run():
    url_base = "https://qeltuiqarfhymbhkdyan.supabase.co/rest/v1"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU"
    
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}"
    }
    
    req = urllib.request.Request(f"{url_base}/bulk_products?select=id,name,supplier_id", headers=headers)
    with urllib.request.urlopen(req) as response:
        bulks = json.loads(response.read().decode())
        
    req = urllib.request.Request(f"{url_base}/products?select=id,name,supplier_id", headers=headers)
    with urllib.request.urlopen(req) as response:
        products = json.loads(response.read().decode())
        
    req = urllib.request.Request(f"{url_base}/suppliers?select=id,name", headers=headers)
    with urllib.request.urlopen(req) as response:
        suppliers = json.loads(response.read().decode())
        
    supplier_map = {s['id']: s['name'] for s in suppliers}
    
    # Map product ID to supplier name
    item_to_supplier = {}
    for p in products:
        item_to_supplier[p['id']] = supplier_map.get(p.get('supplier_id'), 'Sin Proveedor')
    for b in bulks:
        item_to_supplier[b['id']] = supplier_map.get(b.get('supplier_id'), 'Sin Proveedor')
        
    # Get last 30 days sales
    thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
    date_query = urllib.parse.quote(f"gte.{thirty_days_ago}")
    url_sales = f"{url_base}/sales?select=id,date,total,sale_items(product_id,quantity,price,name)&date={date_query}"
    
    req = urllib.request.Request(url_sales, headers=headers)
    with urllib.request.urlopen(req) as response:
        sales = json.loads(response.read().decode())
        
    revenue_by_supplier = {}
    
    for sale in sales:
        items = sale.get('sale_items', [])
        for item in items:
            p_id = item.get('product_id')
            sup_name = item_to_supplier.get(p_id, 'Sin Proveedor')
            amt = item.get('quantity', 0) * item.get('price', 0)
            revenue_by_supplier[sup_name] = revenue_by_supplier.get(sup_name, 0) + amt
            
    # Sort
    sorted_sups = sorted(revenue_by_supplier.items(), key=lambda x: x[1], reverse=True)
    
    print(f"--- TOP SUPPLIERS (LAST 30 DAYS) ---")
    for name, rev in sorted_sups[:20]:
        print(f"{name}: ${rev:.2f}")

if __name__ == "__main__":
    run()
