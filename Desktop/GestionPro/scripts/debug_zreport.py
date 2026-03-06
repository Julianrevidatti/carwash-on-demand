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

def get_session():
    # Filter sessions starting with 4d4f4776
    res = requests.get(f"{SUPABASE_URL}/rest/v1/cash_sessions?id=ilike.4d4f4776%", headers=headers)
    return res.json()

def get_sales(session_id):
    res = requests.get(f"{SUPABASE_URL}/rest/v1/sales?session_id=eq.{session_id}", headers=headers)
    return res.json()

def get_promotions():
    res = requests.get(f"{SUPABASE_URL}/rest/v1/promotions", headers=headers)
    return res.json()

sessions = get_session()
if not sessions:
    print("Session not found")
    sys.exit(1)

session = sessions[0]
print(f"Session: {session['id']}, Total Ventas (UI): 226605")

sales = get_sales(session['id'])
promotions = get_promotions()

print(f"Loaded {len(sales)} sales and {len(promotions)} promotions")

# Let's perform the same exact logic that DataReports.tsx / patch_zreport_promos.py does on these sales
# and see what happens to Tregar.

supplier_map = {} # name -> {'gross': 0, 'cost': 0}

for sale in sales:
    sale_items = json.loads(sale.get('items', '[]'))
    if isinstance(sale_items, str):
        try:
            sale_items = json.loads(sale_items)
        except:
            sale_items = []
            
    # Resolve supplier for each item 
    items_resolved = []
    
    for item in sale_items:
        # In python we might not have 'products', 'bulkProducts', 'suppliers' locally
        # but let's assume item['supplierName'] was resolved if possible, or we just group by it if it has it.
        # Actually, if we don't have access to suppliers here, we can't fully emulate it unless we fetch them all.
        pass

# Instead of fully emulating, let's just dump the sale items for this session to see the raw data.
tregar_items = []
total_tregar_list_price = 0
total_ticket_discount_for_tregar = 0

for sale in sales:
    sale_items = json.loads(sale.get('items', '[]'))
    if isinstance(sale_items, str):
        try:
            sale_items = json.loads(sale_items)
        except:
            pass

    has_tregar = False
    for item in sale_items:
        if 'tregar' in item.get('name', '').lower() or 'tregar' in str(item.get('supplierId', '')).lower():
            has_tregar = True
            break
            
    if has_tregar:
        ticket_gross = sum(i.get('price', 0) * i.get('quantity', 1) for i in sale_items)
        ticket_net = sale.get('total', 0) - sale.get('surcharge', 0)
        ticket_discount = max(0, ticket_gross - ticket_net)
        
        # Calculate tregar's gross for this ticket
        tregar_gross = sum(i.get('price', 0) * i.get('quantity', 1) for i in sale_items if 'tregar' in i.get('name', '').lower() or 'tregar' in str(i.get('supplierId', '')).lower())
        
        print(f"Sale {sale['id']} - Total: {sale['total']}, Discount: {sale.get('discount', 0)}, Surcharge: {sale.get('surcharge', 0)}")
        print(f"  Ticket Gross: {ticket_gross}, Ticket Net: {ticket_net}, Calc Discount: {ticket_discount}")
        print(f"  Tregar Gross: {tregar_gross}")
        
        # Are there any promos?
        promo_gross = 0
        for i in sale_items:
            # We don't have exact promo check here, but let's assume if it is discounted
            pass
            
        tregar_items.append({
            "sale_id": sale['id'],
            "items": sale_items,
            "ticket_gross": ticket_gross,
            "ticket_net": ticket_net,
            "ticket_discount": ticket_discount,
            "tregar_gross": tregar_gross
        })
        
        total_tregar_list_price += tregar_gross

print(f"Total Tregar Gross in session: {total_tregar_list_price}")
