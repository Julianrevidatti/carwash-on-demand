import json
import requests
import sys
import copy

SUPABASE_URL = "https://qeltuiqarfhymbhkdyan.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

sessions_response = requests.get(f"{SUPABASE_URL}/rest/v1/cash_sessions?id=eq.4d4f4776-a262-4aa6-bdbb-cbac38067c44", headers=headers)
if not sessions_response.ok:
    print("Error fetching sessions:", sessions_response.text)
    sys.exit(1)
sessions = sessions_response.json()
if not sessions or type(sessions) is dict:
    print("Unexpected response:", sessions)
    sys.exit(1)
session = sessions[0]
print(f"Testing Session {session['id']}")

sales = requests.get(f"{SUPABASE_URL}/rest/v1/sales?session_id=eq.{session['id']}&select=*,items:sale_items(*)", headers=headers).json()
promotions = requests.get(f"{SUPABASE_URL}/rest/v1/promotions", headers=headers).json()
products = requests.get(f"{SUPABASE_URL}/rest/v1/products", headers=headers).json()
suppliers = requests.get(f"{SUPABASE_URL}/rest/v1/suppliers", headers=headers).json()

print(f"Loaded {len(sales)} sales, {len(promotions)} promos, {len(products)} products, {len(suppliers)} suppliers")

# supplier map: id -> name
sup_dict = {s['id']: s['name'] for s in suppliers}
# product map: id -> supplierId
prod_sup = {p['id']: p.get('supplier_id') for p in products}

supplierMap = {} # name -> {gross, cost}

for sale in sales:
    sale_items = sale.get('items', [])
    if isinstance(sale_items, str):
        try:
            sale_items = json.loads(sale_items)
        except:
            continue
            
    itemsResolved = []
    for item in sale_items:
        supplierName = 'Desconocido'
        if item.get('supplierId'):
            if item['supplierId'] in sup_dict:
                supplierName = sup_dict[item['supplierId']]
        if supplierName == 'Desconocido':
            pid = item.get('product_id') or item.get('productId') or item.get('id')
            if pid in prod_sup and prod_sup[pid] in sup_dict:
                supplierName = sup_dict[prod_sup[pid]]
        
        if not itemsResolved: print("First item sample:", item, " -> resolved to", supplierName, "pid:", pid)
        if 'tregar' in item.get('name', '').lower() and supplierName != 'TREGAR BCO':
            print(f"!!! MISMATCH: {item.get('name')} mapped to {supplierName}")
        i2 = copy.deepcopy(item)
        i2['supplierName'] = supplierName
        itemsResolved.append(i2)
        
    # Step 1 add gross
    for item in itemsResolved:
        ig = item.get('price',0) * item.get('quantity',1)
        ic = item.get('cost',0) * item.get('quantity',1)
        sn = item['supplierName']
        if sn not in supplierMap:
            supplierMap[sn] = {'gross': 0, 'cost': 0}
        supplierMap[sn]['gross'] += ig
        supplierMap[sn]['cost'] += ic
        
    # Print Tregar initial gross before step 2
    tregar_initial_gross = supplierMap.get('TREGAR BCO', {}).get('gross', 0)
    print(f"DEBUG: Tregar initial gross before step 2 is {tregar_initial_gross}")

    # Step 2 detect matched promos
    ticketGross = sum(i.get('price',0) * i.get('quantity',1) for i in itemsResolved)
    ticketNet = sale.get('total',0) - sale.get('surcharge',0)
    ticketDiscount = max(0, ticketGross - ticketNet)
    
    if ticketDiscount > 0:
        ticketSupplierGross = {}
        for item in itemsResolved:
            sn = item['supplierName']
            ig = item.get('price',0) * item.get('quantity',1)
            ticketSupplierGross[sn] = ticketSupplierGross.get(sn, 0) + ig
            
        promoSupplierGross = {}
        totalPromoGross = 0
        
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
                sn = item['supplierName']
                ig = item.get('price',0) * item.get('quantity',1)
                promoSupplierGross[sn] = promoSupplierGross.get(sn, 0) + ig
                totalPromoGross += ig
                
        # Attribute discount
        for supName, supplierGross in ticketSupplierGross.items():
            discountShare = 0
            if totalPromoGross > 0:
                supPromoGross = promoSupplierGross.get(supName, 0)
                discountShare = ticketDiscount * (supPromoGross / totalPromoGross)
                if supName == 'TREGAR BCO' and discountShare > 0:
                    print(f"  [Tregar] Absorbs {discountShare:.2f} (PROMO) because promo gross {supPromoGross} / {totalPromoGross} of ticketDiscount {ticketDiscount}")
            else:
                discountShare = ticketDiscount * (supplierGross / ticketGross)
                if supName == 'TREGAR BCO' and discountShare > 0:
                    print(f"  [Tregar] Absorbs {discountShare:.2f} (GENERAL) because ticket gross {supplierGross} / {ticketGross} of ticketDiscount {ticketDiscount}")
                
            if discountShare > 0:
                supplierMap[supName]['gross'] -= discountShare

# Recargos
for sale in sales:
    if sale.get('surcharge', 0) > 0:
        sn = 'Recargos / Intereses'
        if sn not in supplierMap:
            supplierMap[sn] = {'gross': 0, 'cost': 0}
        supplierMap[sn]['gross'] += sale['surcharge']

print("\n--- FINAL Z-REPORT BREAKDOWN ---")
for k, v in supplierMap.items():
    if k == 'TREGAR BCO':
        print(f"*{k}: Net = {v['gross']:.2f}, Cost = {v['cost']}, Profit = {v['gross'] - v['cost']:.2f}*")
        print(f"  Original Gross before discounts: {(v['gross'] + 82300 - v['gross']):.2f} (Assuming 82300 based on previous js output)")
