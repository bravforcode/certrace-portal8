import urllib.request
import urllib.parse
import json

url = "https://script.google.com/macros/s/AKfycbwR4uqNpQbeKsaYEo2EsHSJywdEZwSbBNEYEDyPCMam0J0o8BytugkB1oPl5N8QdoXe/exec"

test_sheets = [
    "Sheet1", "Sheet 1", "Waitlist", "Leads", "Responses", "Form Responses 1",
    "certrace", "Customer", "Sheet", "Book Demo Customer List", "Customer List",
    "Book Demo", "Demo Bookings", "Bookings", "Sheet1", "ชีต1", "Demo Leads", "Leads"
]

for s_name in test_sheets:
    data = {
        "sheet": s_name,
        "sheetName": s_name,
        "email": "somchai@thaimetal.co.th",
        "firstName": "Somchai",
        "lastName": "Jaidee",
        "company": "Thai Metal Industry Co., Ltd.",
        "type": "demo_lead"
    }
    encoded_data = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(url, data=encoded_data, headers={"Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Mozilla/5.0"})

    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode("utf-8")
            print(f"sheet='{s_name}' -> {html.strip()}")
    except Exception as e:
        print(f"sheet='{s_name}' -> Error: {e}")
