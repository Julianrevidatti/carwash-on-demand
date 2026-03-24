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
        
    req = urllib.request.Request(f"{url_base}/products?select=id,name", headers=headers)
    with urllib.request.urlopen(req) as response:
        products = json.loads(response.read().decode())
        
    bulk_ids = {b['id'] for b in bulks}
    product_ids = {p['id'] for p in products}
    
    intersection = bulk_ids.intersection(product_ids)
    
    print(f"Total Bulk Products: {len(bulk_ids)}")
    print(f"Total Regular Products: {len(product_ids)}")
    print(f"Number of Collisions: {len(intersection)}")
    
    if len(intersection) > 0:
        print("COLLISION DETECTED!")
        for coll_id in intersection:
            prod = next(p for p in products if p['id'] == coll_id)
            bulk = next(b for b in bulks if b['id'] == coll_id)
            print(f"- ID: {coll_id} -> Product Name: '{prod['name']}', Bulk Name: '{bulk['name']}'")

if __name__ == "__main__":
    run()
