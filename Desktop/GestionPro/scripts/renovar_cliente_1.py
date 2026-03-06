import os
import json
import base64
import urllib.request
import urllib.error

# Definicion de funcion para peticiones HTTP
def supabase_request(method, endpoint, headers, data=None):
    url = f"{supabase_url}/rest/v1/{endpoint}"
    req = urllib.request.Request(url, method=method, headers=headers)
    if data:
        req.data = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode('utf-8')
            return json.loads(res_data) if res_data else None
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code} - {e.reason}")
        err_msg = e.read().decode('utf-8')
        print(f"Detalle: {err_msg}")
        return None

try:
    with open(".env", "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("VITE_SUPABASE_URL="):
                supabase_url = line.strip().split("=", 1)[1]
            elif line.startswith("VITE_SUPABASE_ANON_KEY="):
                supabase_key = line.strip().split("=", 1)[1]
except Exception as e:
    print(f"Error reading .env file: {e}")
    exit(1)

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

import urllib.parse

# Parametros del script
target_email = "fmurtagh1981+2@gmail.com"

print(f"Iniciando renovacion de suscripcion para: {target_email}...\n")

# 1. Buscar al tenant
encoded_email = urllib.parse.quote(target_email)
query = f"contact_name=eq.{encoded_email}"
tenants = supabase_request("GET", f"tenants?{query}&select=*", headers)

if not tenants:
    print("No se encontró ningún tenant con ese email.")
    exit(1)

tenant = tenants[0]
print(f"Tenant encontrado:")
print(f"ID: {tenant['id']}")
print(f"Negocio: {tenant['business_name']}")
print(f"Plan actual: {tenant['pricing_plan']}")
print(f"Vencimiento: {tenant['next_due_date']}")
print(f"Status: {tenant['status']}")
print(f"Payment Status actual: {tenant['payment_status']}")

# 2. Sumar 30 dias a su next_due_date actual de manera segura
import datetime

current_due_str = tenant.get('next_due_date')
if current_due_str:
    # Handle the 'Z' or '+00:00' timezone formatting
    clean_date_str = current_due_str.replace('Z', '+00:00')
    current_due = datetime.datetime.fromisoformat(clean_date_str)
else:
    current_due = datetime.datetime.now(datetime.timezone.utc)

nueva_fecha = current_due + datetime.timedelta(days=30)
nueva_fecha_iso = nueva_fecha.isoformat()

update_data = {
    "payment_status": "PAID",   # IMPORTANTE: TODO EN MAYUSCULAS (Trampa detectada en DashboardV2.tsx)
    "status": "ACTIVE",
    "pricing_plan": "PRO",      # El usuario mencionó: Kiosco LA MARQUESA, Plan PRO.
    "next_due_date": nueva_fecha_iso
}

print("\nActualizando registro en Supabase...")
# Para method PATCH usamos eq para update.
query_update = f"id=eq.{tenant['id']}"
result = supabase_request("PATCH", f"tenants?{query_update}", headers, data=update_data)

if result:
    print(f"\n¡Éxito! Suscripción actualizada para {target_email}.")
    updated = result[0]
    print(f"Nuevo Payment Status: {updated['payment_status']}")
    print(f"Status: {updated['status']}")
    print(f"Vencimiento configurado a: {updated['next_due_date']}")
else:
    print("\nFallo al intentar actualizar el tenant.")
