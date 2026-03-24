import urllib.request
import json
import urllib.parse

def run():
    url_base = "https://qeltuiqarfhymbhkdyan.supabase.co/rest/v1"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU"
    
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}"
    }
    
    # 1. Find 'paleta goggi' in bulk_products
    req = urllib.request.Request(f"{url_base}/bulk_products?select=id,name&name=eq.paleta%20goggi", headers=headers)
    with urllib.request.urlopen(req) as response:
        bulk = json.loads(response.read().decode())
    
    if not bulk:
        print("Bulk 'paleta goggi' not found in catalog")
    else:
        print(f"Catalog ID for 'paleta goggi': {bulk[0]['id']}")
        
    # 2. Find any sale item with name 'paleta goggi'
    req = urllib.request.Request(f"{url_base}/sale_items?select=product_id,name&name=ilike.*paleta%20goggi*", headers=headers)
    with urllib.request.urlopen(req) as response:
        sale_items = json.loads(response.read().decode())
        
    if not sale_items:
        print("No sale items found with name 'paleta goggi'")
    else:
        print(f"Found {len(sale_items)} sale items for 'paleta goggi'. Distinct IDs:")
        distinct_ids = set(si['product_id'] for si in sale_items)
        for d_id in distinct_ids:
            print(f" - ID in Sale: {d_id}")
            if bulk and d_id == bulk[0]['id']:
                print("   MATCHED!")
            else:
                print("   MISMATCH!")

if __name__ == "__main__":
    run()
