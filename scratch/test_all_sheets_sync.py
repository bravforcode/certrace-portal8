"""
Comprehensive Test Script: Verify all landing page forms payloads against Google Apps Script URL.
Simulates submissions for each tab in Certrace Main Google Sheet:
  1. Book a Demo (demo-form & demo-booking)
  2. Newsletter (footer)
  3. CBAM free engine lead (cn-calculator)
  4. Pricing Request (popup-form kind="pricing")
  5. Request a Feature (popup-form kind="feature")
  6. Report Issue (popup-form kind="issue")
  7. Create Account Request (waitlist-form)
  8. Careers (popup-form kind="careers")
"""

import urllib.request
import urllib.parse
import json
import datetime
import random
import string

SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzmtLgdrSopZUGpUG69LHjYNq30OHdgqUpdPXGmv-KX7GEarQm0d5gORGKe-010pQ4S/exec"

TS = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d_%H%M%S")
TAG = "".join(random.choices(string.ascii_lowercase, k=4))

def post_payload(tab_name: str, payload: dict) -> None:
    data = {"sheet": tab_name, **payload}
    encoded = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(
        SCRIPT_URL,
        data=encoded,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0"
        }
    )
    print(f"\n--- Testing Tab: [{tab_name}] ---")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8")
            try:
                res_json = json.loads(raw)
                print(f"Status: {resp.status} OK | Response: {json.dumps(res_json, ensure_ascii=False)}")
            except Exception:
                print(f"Status: {resp.status} OK | Response: {raw[:200]}")
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code} Error: {err[:200]}")
    except Exception as exc:
        print(f"Failed: {exc}")

if __name__ == "__main__":
    print(f"Testing Google Apps Script URL: {SCRIPT_URL}")
    print(f"Timestamp: {TS}, Tag: {TAG}")

    # 1. Book a Demo
    post_payload("Book a Demo", {
        "Status": "Confirming",
        "firstName": "Somchai",
        "lastName": "DemoTest",
        "email": f"somchai_demo_{TAG}@certrace.co",
        "countryCode": "+66",
        "phone": "0812345678",
        "company": "Thai Steel Products Co., Ltd.",
        "jobTitle": "Sustainability Manager",
        "sector": "Iron & Steel",
        "employees": "100-249",
        "bookingDate": "2026-09-10",
        "bookingTime": "14:00",
        "bookingTimeZone": "Asia/Bangkok",
        "bookingTimeZoneLabel": "Bangkok (GMT+7)",
        "bookingStartUtc": "2026-09-10T07:00:00.000Z",
        "type": "demo_lead",
        "source": "landing_test"
    })

    # 2. Newsletter
    post_payload("Newsletter", {
        "email": f"newsletter_{TAG}@certrace.co",
        "source": "footer_newsletter"
    })

    # 3. CBAM free engine lead
    post_payload("CBAM free engine lead", {
        "name": "Prasert Exporter",
        "email": f"prasert_{TAG}@certrace.co",
        "phone": "+66 898765432",
        "company": "Thai Aluminium Works",
        "role": "Export Director",
        "cn_count": "3",
        "products_count": "5",
        "sites_count": "2",
        "sectors": "Aluminium",
        "recommended_plan": "scale",
        "cn_codes": "7601.10.00, 7604.10.10, 7606.11.90",
        "source": "cn_calculator_engine"
    })

    # 4. Pricing Request
    post_payload("Pricing Request", {
        "name": "Nattaporn Quote",
        "email": f"nattaporn_{TAG}@certrace.co",
        "company": "Siam Cement Group",
        "role": "Procurement Lead",
        "cnCodes": "1-5 CN codes",
        "sites": "1-3 plants",
        "goods": "Cement",
        "timeline": "Immediate (filing this quarter)",
        "plan": "Scale",
        "volume": "1,000–5,000 tonnes/year",
        "notes": "Interested in automated CBAM certificate generation",
        "source": "pricing_request_popup"
    })

    # 5. Request a Feature
    post_payload("Request a Feature", {
        "name": "Anan Feature",
        "email": f"anan_{TAG}@certrace.co",
        "company": "Green Energy Solutions",
        "area": "Reporting & XML export",
        "summary": "Direct EU Registry XML export format",
        "detail": "Would like to export XML compatible with EU CBAM Declarant Portal directly.",
        "source": "feature_request_popup"
    })

    # 6. Report Issue
    post_payload("Report Issue", {
        "name": "Vichai BugReport",
        "email": f"vichai_{TAG}@certrace.co",
        "where": "CN Code Calculator",
        "severity": "Cosmetic only",
        "detail": "Font alignment on mobile screens slightly overflowing.",
        "source": "issue_report_popup"
    })

    # 7. Create Account Request
    post_payload("Create Account Request", {
        "firstName": "Kanya",
        "lastName": "WaitlistTest",
        "email": f"kanya_{TAG}@certrace.co",
        "countryCode": "+66",
        "phone": "0865432109",
        "company": "Bangkok Exporters Club",
        "jobTitle": "Head of Compliance",
        "source": "solutions_waitlist_form"
    })
