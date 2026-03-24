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
    
    # Suppliers
    req = urllib.request.Request(f"{url_base}/suppliers?select=id,name", headers=headers)
    with urllib.request.urlopen(req) as response:
        suppliers = json.loads(response.read().decode())
    
    fiambres_sup = next((s for s in suppliers if 'fiambre' in s['name'].lower()), None)
    if not fiambres_sup:
        print("No fiambres supplier")
        return
        
    # Products
    req = urllib.request.Request(f"{url_base}/products?select=id,name,supplier_id", headers=headers)
    with urllib.request.urlopen(req) as response:
        products = json.loads(response.read().decode())
        
    fiambres_prods = [p for p in products if p.get('supplier_id') == fiambres_sup['id']]
    print(f"Found {len(fiambres_prods)} regular products for fiambres:")
    for p in fiambres_prods:
        print(f" - {p['name']}")
        
    # Last 30 days revenue for these regular prods
    fiambres_prod_ids = [p['id'] for p in fiambres_prods]
    
    thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
    date_query = urllib.parse.quote(f"gte.{thirty_days_ago}")
    url_sales = f"{url_base}/sales?select=sale_items(product_id,quantity,price)&date={date_query}"
    
    req = urllib.request.Request(url_sales, headers=headers)
    with urllib.request.urlopen(req) as response:
        sales = json.loads(response.read().decode())
        
    revenue_reg = 0
    for s in sales:
        items = s.get('sale_items', [])
        for i in items:
            if i.get('product_id') in fiambres_prod_ids:
                revenue_reg += (i.get('quantity', 0) * i.get('price', 0))
                
    print(f"TOTAL REVENUE FOR REGULAR PRODUCTS (fiambres): ${revenue_reg}")

if __name__ == "__main__":
    run()
