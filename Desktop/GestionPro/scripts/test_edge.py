import urllib.request
import json
import urllib.error

url = 'https://qeltuiqarfhymbhkdyan.supabase.co/functions/v1/create-tenant-user'
headers = {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU',
    'Content-Type': 'application/json'
}

data = {
    'email': 'agent_test_multi1@gmail.com',
    'password': 'Password123!',
    'businessName': 'Multi Test 1'
}

req = urllib.request.Request(url, method='POST', headers=headers, data=json.dumps(data).encode('utf-8'))

try:
    with urllib.request.urlopen(req) as response:
        print("Success:")
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}:")
    print(e.read().decode('utf-8'))
except Exception as e:
    print("Other Error:", e)

# Test duplicate
data2 = {
    'email': 'agent_test_multi2@gmail.com',
    'password': 'Password123!',
    'businessName': 'Multi Test 1'
}

req2 = urllib.request.Request(url, method='POST', headers=headers, data=json.dumps(data2).encode('utf-8'))

try:
    with urllib.request.urlopen(req2) as response:
        print("Success 2:")
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}:")
    print(e.read().decode('utf-8'))
except Exception as e:
    print("Other Error:", e)

