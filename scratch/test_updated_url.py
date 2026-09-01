import urllib.request
import urllib.parse
import json

url = "https://script.google.com/macros/s/AKfycbyg7GkOopgK_nZqZ8V25HIaGazawP39kphMHUpkVFnAA0mQKeB8_UxDqM2dxp4G3_ckKg/exec"

test_data = {
    "firstName": "Somchai",
    "lastName": "Jaidee",
    "email": "somchai@thaimetal.co.th",
    "phone": "+66 812345678",
    "company": "Thai Metal Industry Co., Ltd.",
    "jobTitle": "Sustainability Department",
    "sector": "Metal & Steel",
    "employees": "100-249",
    "bookingDate": "2026-08-03",
    "bookingTime": "10:00 AM",
    "decision": "Yes, it's my call",
    "budget": "Approved",
    "timing": "1-3 months",
    "source": "Search engine",
    "context": "Direct test from AI agent",
    "type": "demo_booking"
}

encoded_data = urllib.parse.urlencode(test_data).encode("utf-8")
req = urllib.request.Request(
    url,
    data=encoded_data,
    headers={
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0"
    }
)

try:
    print("Sending POST request to Google Apps Script...")
    with urllib.request.urlopen(req) as response:
        html = response.read().decode("utf-8")
        print("Response HTTP Code:", response.status)
        print("Response Body:", html)
except Exception as e:
    print("Error during test:", e)
