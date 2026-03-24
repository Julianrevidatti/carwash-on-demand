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
    
    thirty_days_ago = (datetime.now() - timedelta(days=3)).isoformat()
    date_query = urllib.parse.quote(f"gte.{thirty_days_ago}")
    
    url_sales = f"{url_base}/sales?select=id,date,total,items,sale_items(product_id,quantity,price,name)&date={date_query}&limit=50"
    
    req = urllib.request.Request(url_sales, headers=headers)
    with urllib.request.urlopen(req) as response:
        sales = json.loads(response.read().decode())
        
    for sale in sales:
        items = sale.get('items', [])
        sale_items = sale.get('sale_items', [])
        
        # Check if sale has a bulk item
        has_bulk = False
        for i in sale_items:
            if 'Kg' in i.get('name', '') or '(Granel)' in i.get('name', ''):
                has_bulk = True
        
        if has_bulk:
            print(f"SALE {sale.get('id')} - DATE: {sale.get('date')}")
            print(f"  sale_items (relation):")
            for si in sale_items:
                print(f"    - product_id: {si.get('product_id')}, name: {si.get('name')}")
            
            print(f"  items (JSON array stored in sales table directly):")
            if items:
                for i in items:
                    print(f"    - id: {i.get('id')}, name: {i.get('name')}, isWeighted: {i.get('isWeighted')}")
            else:
                print("    [NO JSON ITEMS FIELD]")
            print("-" * 50)
            break

if __name__ == "__main__":
    run()
