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
    
    # Bulk IDs
    req = urllib.request.Request(f"{url_base}/bulk_products?select=id,name", headers=headers)
    with urllib.request.urlopen(req) as response:
        bulks = json.loads(response.read().decode())
    bulk_ids = {b['id']: b['name'] for b in bulks}
    
    # Regular IDs
    req = urllib.request.Request(f"{url_base}/products?select=id,name", headers=headers)
    with urllib.request.urlopen(req) as response:
        products = json.loads(response.read().decode())
    product_ids = {p['id']: p['name'] for p in products}
    
    # Recent Sale Items
    thirty_days_ago = (datetime.now() - timedelta(days=5)).isoformat()
    date_query = urllib.parse.quote(f"gte.{thirty_days_ago}")
    url_sales = f"{url_base}/sale_items?select=product_id,name&limit=100"
    
    req = urllib.request.Request(url_sales, headers=headers)
    with urllib.request.urlopen(req) as response:
        sale_items = json.loads(response.read().decode())
        
    print("CHECKING RECENT SALE ITEMS MAPPING:")
    bulk_found = 0
    prod_found = 0
    not_found = 0
    
    for item in sale_items:
        pid = item.get('product_id')
        name = item.get('name', 'Unknown')
        
        if pid in bulk_ids:
            bulk_found += 1
            # print(f" [BULK] {name} (ID: {pid}) -> Matched '{bulk_ids[pid]}'")
        elif pid in product_ids:
            prod_found += 1
        else:
            not_found += 1
            print(f" [NOT FOUND] {name} (ID: {pid})")

    print(f"\nSummary:\n - Bulks Matched: {bulk_found}\n - Products Matched: {prod_found}\n - Not Found: {not_found}")

if __name__ == "__main__":
    run()
