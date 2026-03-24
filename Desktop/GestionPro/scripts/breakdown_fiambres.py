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
    
    # 1. Fiambres Bulk IDs
    req = urllib.request.Request(f"{url_base}/bulk_products?select=id,name,supplier_id", headers=headers)
    with urllib.request.urlopen(req) as response:
        bulks = json.loads(response.read().decode())
    
    req = urllib.request.Request(f"{url_base}/suppliers?select=id,name", headers=headers)
    with urllib.request.urlopen(req) as response:
        suppliers = json.loads(response.read().decode())
    
    fiambres_sup = next((s for s in suppliers if 'fiambre' in s['name'].lower()), None)
    fiambres_ids = [b['id'] for b in bulks if b.get('supplier_id') == fiambres_sup['id']]
    
    # 2. Daily revenue for these IDs
    thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
    date_query = urllib.parse.quote(f"gte.{thirty_days_ago}")
    url_sales = f"{url_base}/sales?select=date,total,sale_items(product_id,quantity,price)&date={date_query}"
    
    req = urllib.request.Request(url_sales, headers=headers)
    with urllib.request.urlopen(req) as response:
        sales = json.loads(response.read().decode())
        
    daily_bulk = {}
    daily_reg = {}
    
    # Also need regular products for fiambres to compare
    req = urllib.request.Request(f"{url_base}/products?select=id,supplier_id", headers=headers)
    with urllib.request.urlopen(req) as response:
        prods = json.loads(response.read().decode())
    fiambres_reg_ids = [p['id'] for p in prods if p.get('supplier_id') == fiambres_sup['id']]

    for s in sales:
        d = s['date'][:10] # YYYY-MM-DD
        items = s.get('sale_items', [])
        for i in items:
            pid = i.get('product_id')
            amt = (i.get('quantity', 0) * i.get('price', 0))
            if pid in fiambres_ids:
                daily_bulk[d] = daily_bulk.get(d, 0) + amt
            elif pid in fiambres_reg_ids:
                daily_reg[d] = daily_reg.get(d, 0) + amt
                
    print("DAILY FIAMBRES REVENUE:")
    all_dates = sorted(set(list(daily_bulk.keys()) + list(daily_reg.keys())))
    for date in all_dates:
        b_amt = daily_bulk.get(date, 0)
        r_amt = daily_reg.get(date, 0)
        print(f" {date} -> Bulk: ${b_amt:10.2f} | Reg: ${r_amt:10.2f}")

if __name__ == "__main__":
    run()
