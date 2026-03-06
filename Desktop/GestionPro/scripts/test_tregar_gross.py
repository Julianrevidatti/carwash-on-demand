import copy
import json
import requests
import sys

SUPABASE_URL = "https://qeltuiqarfhymbhkdyan.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

sessions_response = requests.get(f"{SUPABASE_URL}/rest/v1/cash_sessions?id=eq.4d4f4776-a262-4aa6-bdbb-cbac38067c44", headers=headers)
sessions = sessions_response.json()
session = sessions[0]

sales = requests.get(f"{SUPABASE_URL}/rest/v1/sales?session_id=eq.{session['id']}&select=*,items:sale_items(*)", headers=headers).json()
products = requests.get(f"{SUPABASE_URL}/rest/v1/products", headers=headers).json()
suppliers = requests.get(f"{SUPABASE_URL}/rest/v1/suppliers", headers=headers).json()
promotions = requests.get(f"{SUPABASE_URL}/rest/v1/promotions", headers=headers).json()

sup_dict = {s['id']: s['name'] for s in suppliers}
prod_sup = {p['id']: p.get('supplier_id') for p in products}

tregar_gross_list = 0
tregar_items_sold = []
ilolay_gross_list = 0
ilolay_items_sold = []

for sale in sales:
    sale_items = sale.get('items', [])
    if isinstance(sale_items, str):
        try:
            sale_items = json.loads(sale_items)
        except:
            continue
            
    for item in sale_items:
        supplierName = 'Desconocido'
        if item.get('supplierId'):
            if item['supplierId'] in sup_dict:
                supplierName = sup_dict[item['supplierId']]
        if supplierName == 'Desconocido':
            pid = item.get('product_id') or item.get('productId') or item.get('id')
            if pid in prod_sup and prod_sup[pid] in sup_dict:
                supplierName = sup_dict[prod_sup[pid]]
                
        if supplierName == 'TREGAR BCO':
            qty = item.get('quantity', 1)
            price = item.get('price', 0)
            cost = item.get('cost', 0)
            tregar_gross_list += (price * qty)
            tregar_items_sold.append(f"{qty}x {item.get('name')} @ ${price}")
            
        if 'tito bebidas' in supplierName.lower():
            qty = item.get('quantity', 1)
            price = item.get('price', 0)
            ilolay_gross_list += (price * qty)
            ilolay_items_sold.append(f"{qty}x {item.get('name')} @ ${price}")

print(f"\nABSOLUTE TOTAL TREGAR GROSS (LIST PRICE): {tregar_gross_list}")
print(f"ABSOLUTE TOTAL TITO BEBIDAS GROSS (LIST PRICE): {ilolay_gross_list}")
print("Tito Bebidas Items sold:")
for line in ilolay_items_sold:
    pass

print("\n--- ACTIVE PROMOS THAT MIGHT AFFECT TITO ---")
tregar_pids = set()
for item in sales:
    for i in json.loads(item.get('items', '[]')) if isinstance(item.get('items'), str) else item.get('items', []):
        pid = i.get('product_id') or i.get('productId') or i.get('id')
        supplierName = 'Desconocido'
        if i.get('supplierId') in sup_dict: supplierName = sup_dict[i['supplierId']]
        elif pid in prod_sup and prod_sup[pid] in sup_dict: supplierName = sup_dict[prod_sup[pid]]
        if supplierName.lower() == 'tito bebidas': tregar_pids.add(pid)

for p in promotions:
    trig = p.get('triggerProductIds') or p.get('trigger_product_ids') or []
    if isinstance(trig, str):
        try: trig = json.loads(trig)
        except: trig = []
        
    reqs = p.get('requirements') or []
    if isinstance(reqs, str):
        try: reqs = json.loads(reqs)
        except: reqs = []
        
    hits_tregar = any(pid in trig for pid in tregar_pids) or any((r.get('productId') in tregar_pids or r.get('product_id') in tregar_pids) for r in reqs if isinstance(r, dict))
    
    if hits_tregar:
        print(f"Promo: {p.get('name')} | Raw: {p}")
