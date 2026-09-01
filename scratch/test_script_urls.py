import urllib.request
import urllib.parse
import json

urls = {
    "url1_index_html": "https://script.google.com/macros/s/AKfycbwR4uqNpQbeKsaYEo2EsHSJywdEZwSbBNEYEDyPCMam0J0o8BytugkB1oPl5N8QdoXe/exec",
    "url2_nextjs_landing": "https://script.google.com/macros/s/AKfycbyg7GkOopgK_nZqZ8V25HIaGazawP39kphMHUpkVFnAA0mQKeB8_UxDqM2dxp4G3_ckKg/exec"
}

test_payload = {
    "firstName": "Somchai",
    "lastName": "Jaidee",
    "email": "somchai@thaimetal.co.th",
    "phone": "+66 812345678",
    "company": "Thai Metal Industry Co., Ltd.",
    "jobTitle": "Sustainability Department",
    "sector": "Metal & Steel",
    "employees": "100-249",
    "type": "demo_booking",
    "bookingDate": "2026-08-03",
    "bookingTime": "10:00 AM",
    "decisionMaker": "Yes, it's my call",
    "budget": "Approved",
    "timing": "1-3 months",
    "source": "Search engine"
}

print("=== Testing GET ===")
for name, url in urls.items():
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as res:
            print(f"[{name}] GET status: {res.status}, body: {res.read().decode('utf-8')[:300]}")
    except Exception as e:
        print(f"[{name}] GET error: {e}")

print("\n=== Testing POST (url-encoded) ===")
for name, url in urls.items():
    try:
        encoded = urllib.parse.urlencode(test_payload).encode('utf-8')
        req = urllib.request.Request(url, data=encoded, headers={"Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as res:
            print(f"[{name}] POST status: {res.status}, body: {res.read().decode('utf-8')[:300]}")
    except Exception as e:
        print(f"[{name}] POST error: {e}")

print("\n=== Testing POST (json text/plain) ===")
for name, url in urls.items():
    try:
        data_bytes = json.dumps(test_payload).encode('utf-8')
        req = urllib.request.Request(url, data=data_bytes, headers={"Content-Type": "text/plain;charset=utf-8", "User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as res:
            print(f"[{name}] POST status: {res.status}, body: {res.read().decode('utf-8')[:300]}")
    except Exception as e:
        print(f"[{name}] POST error: {e}")
