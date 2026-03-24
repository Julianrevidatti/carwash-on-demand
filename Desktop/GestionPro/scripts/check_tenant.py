import urllib.request
import json
import urllib.error

url = "https://qeltuiqarfhymbhkdyan.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU"

headers = {"apikey": key, "Authorization": f"Bearer {key}"}

req = urllib.request.Request(f"{url}/rest/v1/tenants?contact_name=eq.gemabebidas00%40gmail.com&select=*", headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        print("Tenants query:")
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}:")
    print(e.read().decode('utf-8'))
except Exception as e:
    print("Error querying tenants:", e)
