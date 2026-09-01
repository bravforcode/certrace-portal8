import urllib.request
import urllib.parse
import json
import datetime

url = "https://script.google.com/macros/s/AKfycbwR4uqNpQbeKsaYEo2EsHSJywdEZwSbBNEYEDyPCMam0J0o8BytugkB1oPl5N8QdoXe/exec"

test_sheets = ["Sheet1", "Sheet 1", "Waitlist", "Leads", "Responses", "Form Responses 1", "certrace", "Customer", "Sheet"]

for s_name in test_sheets:
    data = {
        "sheet": s_name,
        "sheetName": s_name,
        "email": f"test_{s_name.lower()}@certrace.co",
        "source": "landing_page_test",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "type": "waitlist_test",
        "firstName": "Test",
        "lastName": "User",
        "company": "Certrace Test Co"
    }
    encoded_data = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(url, data=encoded_data, headers={"Content-Type": "application/x-www-form-urlencoded"})

    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode("utf-8")
            print(f"Sheet parameter: '{s_name}' -> Response: {html.strip()}")
    except Exception as e:
        print(f"Sheet parameter: '{s_name}' -> Error: {e}")

