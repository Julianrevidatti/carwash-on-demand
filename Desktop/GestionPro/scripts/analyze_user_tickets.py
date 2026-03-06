import requests
import json
import sys

SUPABASE_URL = "https://qeltuiqarfhymbhkdyan.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# The partial IDs from the user's image
user_ticket_data = [
    ("79b29aa1", 3400),
    ("79b29aa1", 2400),
    ("bbbb2be6", 2200),
    ("742ce11e", 3800),
    ("c9bae103", 3800),
    ("7ec480b5", 3800),
    ("fc3ed96e", 3800),
    ("6f0c2108", 2400),
    ("6f0c2108", 2000),
    ("6f0c2108", 2200),
    ("84980f61", 3400),
    ("8c969782", 20400),
    ("80d862f6", 3800),
    ("45ae6aa0", 2800),
    ("4d6c0eb0", 3800),
    ("3a556793", 2200)
]

print("Fetching products and suppliers...")
products = requests.get(f"{SUPABASE_URL}/rest/v1/products", headers=headers).json()
suppliers = requests.get(f"{SUPABASE_URL}/rest/v1/suppliers", headers=headers).json()
promotions = requests.get(f"{SUPABASE_URL}/rest/v1/promotions", headers=headers).json()
sup_dict = {s['id']: s['name'] for s in suppliers}
prod_sup = {p['id']: p.get('supplier_id') for p in products}

# Group requests by unique partial ID
partial_ids = list(set([t[0] for t in user_ticket_data]))

SESSION_ID = "4d4f4776-a262-4aa6-bdbb-cbac38067c44"
print(f"Fetching all sales for session {SESSION_ID}...")
res = requests.get(f"{SUPABASE_URL}/rest/v1/sales?session_id=eq.{SESSION_ID}&select=*,items:sale_items(*)", headers=headers)
if res.ok:
    session_sales = res.json()
else:
    print(f"Failed to fetch: {res.text}")
    sys.exit(1)

all_sales = []
for sale in session_sales:
    if any(sale['id'].startswith(pid) for pid in partial_ids):
        all_sales.append(sale)

print(f"\nFound {len(all_sales)} full sales matching those IDs.")

# Analyze what's in these tickets
print("\n--- ANALISIS DE TICKETS DEL USUARIO ---")
tregar_total_net = 0

for sale in all_sales:
    sale_items = sale.get('items', [])
    if isinstance(sale_items, str):
        try: sale_items = json.loads(sale_items)
        except: pass
        
    itemsResolved = []
    for item in sale_items:
        supplierName = 'Desconocido'
        if item.get('supplierId') in sup_dict:
            supplierName = sup_dict[item['supplierId']]
        if supplierName == 'Desconocido':
            product_id = item.get('product_id') or item.get('productId') or item.get('id')
            if product_id in prod_sup and prod_sup[product_id] in sup_dict:
                supplierName = sup_dict[prod_sup[product_id]]
                
        i2 = dict(item)
        i2['supplierName'] = supplierName
        itemsResolved.append(i2)
        
    ticketGross = sum(i.get('price',0) * i.get('quantity',1) for i in itemsResolved)
    ticketNet = sale.get('total',0) - sale.get('surcharge',0)
    ticketDiscount = max(0, ticketGross - ticketNet)
    
    totalPromoGross = 0
    tregar_ticket_gross = 0
    
    for item in itemsResolved:
        inPromo = False
        iid = item.get('product_id') or item.get('productId') or item.get('id')
        for p in promotions:
            trig = p.get('triggerProductIds') or p.get('trigger_product_ids') or []
            if isinstance(trig, str):
                try: trig = json.loads(trig)
                except: trig = []
            reqs = p.get('requirements') or []
            if isinstance(reqs, str):
                try: reqs = json.loads(reqs)
                except: reqs = []
            
            inTrig = iid in trig
            inReq = any(r.get('productId') == iid or r.get('product_id') == iid for r in reqs if isinstance(r, dict))
            if inTrig or inReq:
                inPromo = True
                break
        
        if inPromo:
            totalPromoGross += (item.get('price',0) * item.get('quantity',1))
            item['inPromo'] = True
            
        if item['supplierName'] == 'TREGAR BCO':
            tregar_ticket_gross += (item.get('price',0) * item.get('quantity',1))
            
    tregar_absorbed = 0
    if ticketDiscount > 0:
        if totalPromoGross > 0:
            supPromoGross = sum((i.get('price',0) * i.get('quantity',1)) for i in itemsResolved if i.get('inPromo') and i['supplierName'] == 'TREGAR BCO')
            if ticketDiscount <= totalPromoGross:
                tregar_absorbed = ticketDiscount * (supPromoGross / totalPromoGross) if totalPromoGross else 0
            else:
                promo_portion = totalPromoGross * (supPromoGross / totalPromoGross) if totalPromoGross else 0
                generic_portion = (ticketDiscount - totalPromoGross) * (tregar_ticket_gross / ticketGross) if ticketGross else 0
                tregar_absorbed = promo_portion + generic_portion
        else:
            tregar_absorbed = ticketDiscount * (tregar_ticket_gross / ticketGross) if ticketGross else 0
            
    tregar_ticket_net = tregar_ticket_gross - tregar_absorbed
    if tregar_ticket_net > 0:
        tregar_total_net += tregar_ticket_net
        print(f"Ticket {sale['id'][:8]}... -> Tregar Bruto: ${tregar_ticket_gross} | Tregar Absorbió: ${tregar_absorbed:.2f} | Tregar NETO FINAL: ${tregar_ticket_net:.2f}")
        
print(f"\nTOTAL NETO DE TREGAR EN ESTOS TICKETS EXACTOS: ${tregar_total_net:.2f}")
