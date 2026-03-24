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
    
    # Get bulk products
    req = urllib.request.Request(f"{url_base}/bulk_products?select=id,name,supplier_id", headers=headers)
    with urllib.request.urlopen(req) as response:
        bulks = json.loads(response.read().decode())
        
    # Get suppliers
    req = urllib.request.Request(f"{url_base}/suppliers?select=id,name", headers=headers)
    with urllib.request.urlopen(req) as response:
        suppliers = json.loads(response.read().decode())
        
    fiambres_sup = next((s for s in suppliers if 'fiambre' in s['name'].lower() or 'fiam' in s['name'].lower()), None)
    if not fiambres_sup:
        print("No fiambres supplier found")
        return
        
    print(f"Fiambres Supplier: {fiambres_sup['name']} ({fiambres_sup['id']})")
    
    fiambres_bulks = [b for b in bulks if b.get('supplier_id') == fiambres_sup['id']]
    print(f"Found {len(fiambres_bulks)} bulk products assigned to fiambres:")
    for b in fiambres_bulks:
        print(f" - {b['name']}")
        
    fiambres_ids = [b['id'] for b in fiambres_bulks]
    
    # Get last 30 days sales
    thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
    # url encode the date
    date_query = urllib.parse.quote(f"gte.{thirty_days_ago}")
    url_sales = f"{url_base}/sales?select=id,date,total,sale_items(product_id,quantity,price,name)&date={date_query}"
    
    req = urllib.request.Request(url_sales, headers=headers)
    with urllib.request.urlopen(req) as response:
        sales = json.loads(response.read().decode())
        
    print(f"Total Sales in last 30 days: {len(sales)}")
    
    total_rev = 0
    total_rev_all = 0
    for sale in sales:
        total_rev_all += sale.get('total', 0)
        items = sale.get('sale_items', [])
        for item in items:
            if item.get('product_id') in fiambres_ids:
                amt = item.get('quantity', 0) * item.get('price', 0)
                total_rev += amt
                
    print(f"TOTAL REVENUE FOR SYSTEM (Last 30 days): ${total_rev_all}")
    print(f"TOTAL REVENUE FOR FIAMBRES GRANELES: ${total_rev}")
    if total_rev_all > 0:
        print(f"Percentage: {total_rev / total_rev_all * 100:.2f}%")

if __name__ == "__main__":
    run()
