import requests
import json

SUPABASE_URL = "https://qeltuiqarfhymbhkdyan.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU"
headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}
SESSION_ID = "4d4f4776-a262-4aa6-bdbb-cbac38067c44"

sales = requests.get(f"{SUPABASE_URL}/rest/v1/sales?session_id=eq.{SESSION_ID}&select=*,items:sale_items(*)", headers=headers).json()
promotions = requests.get(f"{SUPABASE_URL}/rest/v1/promotions?is_active=eq.true", headers=headers).json()
products = requests.get(f"{SUPABASE_URL}/rest/v1/products", headers=headers).json()
suppliers = requests.get(f"{SUPABASE_URL}/rest/v1/suppliers", headers=headers).json()

sup_dict = {s['id']: s['name'] for s in suppliers}
prod_sup = {p['id']: p.get('supplier_id') for p in products}
prod_price = {p['id']: p.get('price', 0) for p in products}

# supplierMap: supplierName -> {gross, cost}
supplierMap = {}

for sale in sales:
    sale_items = sale.get('items', [])
    if isinstance(sale_items, str):
        try: sale_items = json.loads(sale_items)
        except: continue

    # STEP 1: Resolve supplier for each item
    itemsResolved = []
    for item in sale_items:
        supplierName = 'Desconocido'
        if item.get('supplierId') in sup_dict:
            supplierName = sup_dict[item['supplierId']]
        if supplierName == 'Desconocido':
            pid = item.get('product_id') or item.get('productId') or item.get('id')
            if pid in prod_sup and prod_sup[pid] in sup_dict:
                supplierName = sup_dict[prod_sup[pid]]
        itemsResolved.append({**item, 'supplierName': supplierName})

    # Add gross per supplier
    for item in itemsResolved:
        sn = item['supplierName']
        ig = item.get('price', 0) * item.get('quantity', 1)
        ic = (item.get('cost', 0) or 0) * item.get('quantity', 1)
        if sn not in supplierMap:
            supplierMap[sn] = {'gross': 0, 'cost': 0}
        supplierMap[sn]['gross'] += ig
        supplierMap[sn]['cost'] += ic

    # STEP 2: POS Promo Engine (per ticket)
    # Build cart map
    cartMap = {}
    for item in itemsResolved:
        pid = item.get('product_id') or item.get('productId') or item.get('id')
        cartMap[pid] = cartMap.get(pid, 0) + item.get('quantity', 1)

    # Build pid -> supplier map
    pidToSup = {}
    for item in itemsResolved:
        pid = item.get('product_id') or item.get('productId') or item.get('id')
        pidToSup[pid] = item['supplierName']

    # Run promo engine
    supplierPromoDiscount = {}
    sortedPromos = sorted([p for p in promotions if p.get('active') or p.get('is_active')], 
                          key=lambda p: p.get('promo_price') or p.get('promoPrice') or 0, reverse=True)

    for promo in sortedPromos:
        trig = promo.get('triggerProductIds') or promo.get('trigger_product_ids') or []
        if isinstance(trig, str):
            try: trig = json.loads(trig)
            except: trig = []
        reqs = promo.get('requirements') or []
        if isinstance(reqs, str):
            try: reqs = json.loads(reqs)
            except: reqs = []

        promoPrice = promo.get('promo_price') or promo.get('promoPrice') or 0
        promoType = promo.get('type') or 'standard'
        qtyReq = promo.get('quantity_required') or promo.get('quantityRequired') or 0

        if promoType == 'flexible' and qtyReq and qtyReq > 0:
            matchingPids = [pid for pid in trig if cartMap.get(pid, 0) > 0]
            totalAvailable = sum(cartMap.get(pid, 0) for pid in matchingPids)
            combosPossible = totalAvailable // qtyReq

            if combosPossible > 0:
                availableUnits = []
                for pid in matchingPids:
                    price = prod_price.get(pid, 0)
                    qty = cartMap.get(pid, 0)
                    for _ in range(int(qty)):
                        availableUnits.append({'id': pid, 'price': price})
                availableUnits.sort(key=lambda u: u['price'], reverse=True)

                unitsUsed = availableUnits[:combosPossible * qtyReq]
                regularPriceSum = sum(u['price'] for u in unitsUsed)

                for u in unitsUsed:
                    if cartMap.get(u['id'], 0) > 0:
                        cartMap[u['id']] -= 1

                discount = regularPriceSum - (combosPossible * promoPrice)
                if discount > 0:
                    supName = pidToSup.get(unitsUsed[0]['id'], 'Desconocido')
                    supplierPromoDiscount[supName] = supplierPromoDiscount.get(supName, 0) + discount
                    if supName == 'TREGAR BCO':
                        print(f"    [FLEX] Ticket {sale['id'][:8]}: {promo.get('name')} x{combosPossible} = ${discount:.2f} descuento (regular=${regularPriceSum} - promo={combosPossible * promoPrice})")

        elif promoType == 'weighted' and reqs and len(reqs) > 0:
            possibleCombos = float('inf')
            for req in reqs:
                minWeight = float(req.get('minWeight', 0))
                pid = req.get('productId') or req.get('product_id')
                avail = cartMap.get(pid, 0)
                if avail < minWeight:
                    possibleCombos = 0
                    break
                limit = int(avail // minWeight)
                if limit < possibleCombos:
                    possibleCombos = limit
            if possibleCombos == float('inf'):
                possibleCombos = 0

            if possibleCombos > 0:
                regularPricePerCombo = 0
                for req in reqs:
                    minWeight = float(req.get('minWeight', 0))
                    pid = req.get('productId') or req.get('product_id')
                    pricePerKg = prod_price.get(pid, 0)
                    regularPricePerCombo += (minWeight * pricePerKg)
                    cartMap[pid] -= (possibleCombos * minWeight)

                savings = regularPricePerCombo - promoPrice
                if savings > 0:
                    firstPid = reqs[0].get('productId') or reqs[0].get('product_id')
                    supName = pidToSup.get(firstPid, 'Desconocido')
                    supplierPromoDiscount[supName] = supplierPromoDiscount.get(supName, 0) + (savings * possibleCombos)
                    if supName == 'TREGAR BCO':
                        print(f"    [WEIGHT] Ticket {sale['id'][:8]}: {promo.get('name')} x{possibleCombos} = ${savings * possibleCombos:.2f} descuento")

        else:
            # STANDARD
            requirements = {}
            for pid in trig:
                requirements[pid] = requirements.get(pid, 0) + 1

            applyCount = 0
            while True:
                canApply = all(cartMap.get(pid, 0) >= req for pid, req in requirements.items())
                if not canApply:
                    break
                for pid, req in requirements.items():
                    cartMap[pid] -= req

                regularSum = sum(prod_price.get(pid, 0) for pid in trig)
                discount = regularSum - promoPrice
                if discount > 0:
                    supName = pidToSup.get(trig[0], 'Desconocido')
                    supplierPromoDiscount[supName] = supplierPromoDiscount.get(supName, 0) + discount
                    if supName == 'TREGAR BCO':
                        print(f"    [STD] Ticket {sale['id'][:8]}: {promo.get('name')} x1 = ${discount:.2f} descuento")
                applyCount += 1

    # Cap: promo discounts cannot exceed the actual ticket discount
    ticketGross = sum(i.get('price', 0) * i.get('quantity', 1) for i in itemsResolved)
    ticketNet = sale.get('total', 0) - (sale.get('surcharge', 0) or 0)
    actualTicketDiscount = max(0, ticketGross - ticketNet)
    
    totalDetected = sum(supplierPromoDiscount.values())
    scaleFactor = (actualTicketDiscount / totalDetected) if totalDetected > actualTicketDiscount and totalDetected > 0 else 1
    
    # Apply promo discounts (capped)
    for supName, discount in supplierPromoDiscount.items():
        capped = discount * scaleFactor
        if supName not in supplierMap:
            supplierMap[supName] = {'gross': 0, 'cost': 0}
        supplierMap[supName]['gross'] -= capped
        if supName == 'TREGAR BCO' and capped > 0:
            print(f"  [DEBUG] Ticket {sale['id'][:8]}: Tregar absorbe ${capped:.2f} de promo (cap={scaleFactor:.4f})")

# Surcharges
for sale in sales:
    surcharge = sale.get('surcharge', 0) or 0
    if surcharge > 0:
        sn = 'Recargos / Intereses'
        if sn not in supplierMap:
            supplierMap[sn] = {'gross': 0, 'cost': 0}
        supplierMap[sn]['gross'] += surcharge

# Print results
print("=" * 60)
print("Z-REPORT SIMULACION CON MOTOR POS (SIN REPARTO PROPORCIONAL)")
print("=" * 60)
for sn, data in sorted(supplierMap.items(), key=lambda x: -x[1]['gross']):
    print(f"  {sn:40s} Neto: ${data['gross']:>12,.2f}")
print("=" * 60)
total = sum(d['gross'] for d in supplierMap.values())
print(f"  {'TOTAL':40s}       ${total:>12,.2f}")
