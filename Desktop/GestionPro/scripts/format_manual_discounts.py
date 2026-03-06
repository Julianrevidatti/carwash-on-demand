import requests
import json
import copy

SUPABASE_URL = "https://qeltuiqarfhymbhkdyan.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU"

headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}
SESSION_ID = "4d4f4776-a262-4aa6-bdbb-cbac38067c44"

# Fetch Data
session_sales = requests.get(f"{SUPABASE_URL}/rest/v1/sales?session_id=eq.{SESSION_ID}&select=*,items:sale_items(*)", headers=headers).json()
promotions = requests.get(f"{SUPABASE_URL}/rest/v1/promotions", headers=headers).json()

output = ""
for sale in session_sales:
    sale_items = sale.get('items', [])
    if isinstance(sale_items, str):
        try: sale_items = json.loads(sale_items)
        except: continue
        
    ticketGross = sum(i.get('price',0) * i.get('quantity',1) for i in sale_items)
    ticketNet = sale.get('total',0) - sale.get('surcharge',0)
    ticketDiscount = max(0, ticketGross - ticketNet)
    
    # Calculate Expected Promotional Discount (very roughly)
    expected_promo_discount = 0
    totalPromoGross = 0
    
    for item in sale_items:
        iid = item.get('product_id') or item.get('productId') or item.get('id')
        inPromo = False
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
            
    # When ticketDiscount differs from common promotion thresholds, or promo_gross is 0 and there's a discount
    # Tregar promos give discounts like $600, $900, $1500, etc.
    
    if ticketDiscount > 0 and totalPromoGross == 0:
        # 100% Manual generic discount
        output += f"- Ticket ID `{sale['id']}`: Descuento manual de ${ticketDiscount:.2f} repartido proporcionalmente.\n"

with open(r"c:\Users\54112\.gemini\antigravity\brain\82dfac3e-8732-45ae-b87f-6407ddd5975d\manual_discounts.md", "w") as f:
    f.write(output)
print("Finished")
