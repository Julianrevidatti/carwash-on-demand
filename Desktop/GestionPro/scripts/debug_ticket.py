import requests, json
SUPABASE_URL = 'https://qeltuiqarfhymbhkdyan.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU'
h = {'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}

# Check ticket 6f0c2108
sales = requests.get(f'{SUPABASE_URL}/rest/v1/sales?session_id=eq.4d4f4776-a262-4aa6-bdbb-cbac38067c44&select=*,items:sale_items(*)', headers=h).json()

# Find ticket 6f0c2108
for s in sales:
    if s['id'].startswith('6f0c2108'):
        print(f'Ticket total: {s["total"]}, Surcharge: {s.get("surcharge",0)}')
        gross = 0
        for i in s.get('items',[]):
            g = i['price'] * i['quantity']
            gross += g
            print(f'  {i["quantity"]}x {i["name"]} @ {i["price"]} = {g} (pid: {i.get("product_id","?")})')
        net = s['total'] - (s.get('surcharge',0) or 0)
        print(f'Gross: {gross}, Net: {net}, Actual Discount: {gross - net}')
        print()

# Also check what "Queso Saborizado X2" promo contains
promos = requests.get(f'{SUPABASE_URL}/rest/v1/promotions', headers=h).json()
for p in promos:
    if 'Queso' in (p.get('name') or ''):
        print(f"Promo: {p['name']}, Price: {p.get('promo_price')}, Type: {p.get('type')}, Active: {p.get('is_active')}")
        trigs = p.get('trigger_product_ids') or []
        if isinstance(trigs, str): trigs = json.loads(trigs)
        for tid in trigs:
            for prod in requests.get(f'{SUPABASE_URL}/rest/v1/products?id=eq.{tid}&select=name,price', headers=h).json():
                print(f'  -> {prod["name"]} @ ${prod["price"]}')
