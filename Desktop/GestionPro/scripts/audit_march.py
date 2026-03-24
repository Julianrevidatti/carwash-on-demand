import urllib.request
import json
import urllib.parse
from datetime import datetime

def run():
    url_base = "https://qeltuiqarfhymbhkdyan.supabase.co/rest/v1"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU"
    
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}"
    }
    
    # Get March Sales items
    date_query = urllib.parse.quote("gte.2026-03-01")
    url_sales = f"{url_base}/sales?select=sale_items(product_id,quantity,price,name)&date={date_query}"
    
    req = urllib.request.Request(url_sales, headers=headers)
    with urllib.request.urlopen(req) as response:
        sales = json.loads(response.read().decode())
        
    # Get all product IDs and bulk product IDs
    req = urllib.request.Request(f"{url_base}/products?select=id,name", headers=headers)
    with urllib.request.urlopen(req) as response:
        products = {p['id']: p['name'] for p in json.loads(response.read().decode())}
        
    req = urllib.request.Request(f"{url_base}/bulk_products?select=id,name", headers=headers)
    with urllib.request.urlopen(req) as response:
        bulks = {b['id']: b['name'] for b in json.loads(response.read().decode())}
        
    print("AUDITING MARCH SALES MAPPING:")
    results = {}
    
    for s in sales:
        items = s.get('sale_items', [])
        for i in items:
            pid = i.get('product_id')
            name = i.get('name', '???')
            amt = i.get('quantity', 0) * i.get('price', 0)
            
            mapping = 'Sin Proveedor'
            if pid in products: mapping = 'Regular'
            elif pid in bulks: mapping = 'Bulk'
            
            results[mapping] = results.get(mapping, 0) + amt
            if mapping == 'Sin Proveedor':
                # print(f" - UNMAPPED: {name} (ID: {pid}) Amt: {amt}")
                pass
                
    print("\nSummary for March:")
    for m, a in results.items():
        print(f" - {m}: ${a:10.2f}")

if __name__ == "__main__":
    run()
