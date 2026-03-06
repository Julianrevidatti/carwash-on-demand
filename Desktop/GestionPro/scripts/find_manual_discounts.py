import requests
import copy
import json
import sys

SUPABASE_URL = "https://qeltuiqarfhymbhkdyan.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU"
headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}
SESSION_ID = "4d4f4776-a262-4aa6-bdbb-cbac38067c44"

sales = requests.get(f"{SUPABASE_URL}/rest/v1/sales?session_id=eq.{SESSION_ID}&select=*,items:sale_items(*)", headers=headers).json()
promotions = requests.get(f"{SUPABASE_URL}/rest/v1/promotions", headers=headers).json()
products = requests.get(f"{SUPABASE_URL}/rest/v1/products", headers=headers).json()
suppliers = requests.get(f"{SUPABASE_URL}/rest/v1/suppliers", headers=headers).json()

sup_dict = {s['id']: s['name'] for s in suppliers}
prod_sup = {p['id']: p.get('supplier_id') for p in products}

tregar_total_absorbed = 0

for sale in sales:
    sale_items = sale.get('items', [])
    if isinstance(sale_items, str):
        try: sale_items = json.loads(sale_items)
        except: continue
        
    itemsResolved = []
    for item in sale_items:
        supplierName = 'Desconocido'
        if item.get('supplierId') in sup_dict:
            supplierName = sup_dict[item['supplierId']]
        if supplierName == 'Desconocido':
            pid = item.get('product_id') or item.get('productId') or item.get('id')
            if pid in prod_sup and prod_sup[pid] in sup_dict:
                supplierName = sup_dict[prod_sup[pid]]
        
        i2 = copy.deepcopy(item)
        i2['supplierName'] = supplierName
        itemsResolved.append(i2)
        
    ticketGross = sum(i.get('price',0) * i.get('quantity',1) for i in itemsResolved)
    ticketNet = sale.get('total',0) - sale.get('surcharge',0)
    ticketDiscount = max(0, ticketGross - ticketNet)
    
    if ticketDiscount > 0:
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
                totalPromoGross += (item.get('price',0) * item.get('quantity',1))
                item['inPromo'] = True
                
        ticket_suppliers = {}
        for item in itemsResolved:
            sn = item['supplierName']
            ticket_suppliers[sn] = ticket_suppliers.get(sn, 0) + (item.get('price',0) * item.get('quantity',1))
            
        tregar_absorbed = 0
        for sup, gross in ticket_suppliers.items():
            if totalPromoGross > 0:
                supPromoGross = sum((i.get('price',0) * i.get('quantity',1)) for i in itemsResolved if i.get('inPromo') and i['supplierName'] == sup)
                if ticketDiscount <= totalPromoGross:
                    absorbed = ticketDiscount * (supPromoGross / totalPromoGross) if totalPromoGross else 0
                else:
                    promo_portion = totalPromoGross * (supPromoGross / totalPromoGross) if totalPromoGross else 0
                    generic_portion = (ticketDiscount - totalPromoGross) * (gross / ticketGross) if ticketGross else 0
                    if sup == 'TREGAR BCO' and generic_portion > 0:
                        print(f"--- TICKET {sale['id']} (Hora: {sale['date']}) ---")
                        print(f"   Monto bruto real (Suma del precio unitario): ${ticketGross}")
                        print(f"   Monto pagado en cobro: ${ticketNet}")
                        print(f"   Diferencia / Faltante Total: ${ticketDiscount}")
                        print(f"   Descuento cubierto por Promos: ${totalPromoGross}")
                        print(f"   >>> SOBREPASO / GÉNERICO: ${(ticketDiscount - totalPromoGross):.2f}")
                        print(f"   Porción del sobrepaso genérico que asume Tregar: ${generic_portion:.2f}")
                        print(f"   Productos del ticket:")
                        for i in itemsResolved:
                            print(f"      - {i.get('quantity')}x {i.get('name')} @ ${i.get('price')} = ${i.get('quantity',1)*i.get('price',0)} ({i.get('supplierName')})")
                        print("-" * 50)
                        tregar_total_absorbed += generic_portion
            else:
                absorbed = ticketDiscount * (gross / ticketGross) if ticketGross else 0
                
            if sup == 'TREGAR BCO':
                tregar_absorbed = absorbed

print(f"\nTOTAL QUE TREGAR ABSORBIO POR DIFERENCIAS EN COBROS MANUALES: ${tregar_total_absorbed:.2f}")
