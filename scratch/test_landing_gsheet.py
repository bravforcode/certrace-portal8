"""
Test: Landing page → Google Sheets sync
Tests both payloads the landing page actually sends:
  1. demo_lead   — fires when the contact form is submitted (before booking)
  2. demo_booking — fires when the user confirms a time slot

Apps Script URL taken from demo-form.tsx and demo-booking.tsx (same URL).
"""

import urllib.request
import urllib.parse
import datetime
import json
import random
import string

# ------------------------------------------------------------------
# Apps Script endpoint (from demo-form.tsx line 391)
# ------------------------------------------------------------------
SCRIPT_URL = (
    "https://script.google.com/macros/s/"
    "AKfycbyg7GkOopgK_nZqZ8V25HIaGazawP39kphMHUpkVFnAA0mQKeB8_UxDqM2dxp4G3_ckKg"
    "/exec"
)

TS = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d_%H%M%S")
TAG = "".join(random.choices(string.ascii_lowercase, k=4))
TEST_EMAIL = f"test_{TS}_{TAG}@certrace.co"

print(f"Test email: {TEST_EMAIL}")
print(f"Script URL: {SCRIPT_URL[:60]}...\n")


def post_form(label: str, fields: dict) -> None:
    """Send an application/x-www-form-urlencoded POST and print result."""
    body = urllib.parse.urlencode(fields).encode("utf-8")
    req = urllib.request.Request(
        SCRIPT_URL,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8")
            try:
                parsed = json.loads(raw)
                print(f"[{label}] OK  Response: {json.dumps(parsed, ensure_ascii=False)}")
            except json.JSONDecodeError:
                print(f"[{label}] OK  Response: {raw.strip()[:300]}")
    except urllib.error.HTTPError as e:
        body_err = e.read().decode("utf-8", errors="replace")
        print(f"[{label}] FAIL  HTTP {e.code}: {body_err[:300]}")
    except Exception as exc:
        print(f"[{label}] FAIL  Error: {exc}")


# ------------------------------------------------------------------
# 1. demo_lead  — mirrors demo-form.tsx onSubmit handler
# ------------------------------------------------------------------
lead_payload = {
    "firstName": "Test",
    "lastName": "Landing",
    "email": TEST_EMAIL,
    "countryCode": "+66",
    "phone": "812345678",
    "company": "Certrace Test Co",
    "jobTitle": "HR Director",
    "sector": "Technology",
    "employees": "50-99",
    "type": "demo_lead",
}
post_form("demo_lead (form submit)", lead_payload)

# ------------------------------------------------------------------
# 2. demo_booking — mirrors demo-booking.tsx confirm() handler
# ------------------------------------------------------------------
today = datetime.date.today()
days_ahead = 1
while (today + datetime.timedelta(days=days_ahead)).weekday() >= 5:
    days_ahead += 1
booking_date = (today + datetime.timedelta(days=days_ahead)).isoformat()

booking_payload = {
    "firstName": "Test",
    "lastName": "Landing",
    "email": TEST_EMAIL,
    "countryCode": "+66",
    "phone": "812345678",
    "company": "Certrace Test Co",
    "jobTitle": "HR Director",
    "sector": "Technology",
    "employees": "50-99",
    "bookingDate": booking_date,
    "bookingTime": "10:00",
    "decision": "I'm the decision maker",
    "budget": "We have a confirmed budget",
    "timing": "Within 3 months",
    "source": "Google Search",
    "context": "automated test from script",
    "type": "demo_booking",
}
post_form("demo_booking (slot confirm)", booking_payload)

print("\nDone. Check your Google Sheet for the new rows.")
print(f"Look for email: {TEST_EMAIL}")
