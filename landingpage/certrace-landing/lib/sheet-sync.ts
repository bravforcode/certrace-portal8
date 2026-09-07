/* Lead capture & multi-tab sync — posts all landing-page forms to the
   Google Apps Script web app (source in apps-script/lead-capture.gs).

   Routes form submissions to specific tabs in the Google Sheet:
     - "Book a Demo"            · Demo inquiries & booking slots
     - "Newsletter"             · Footer email subscriptions
     - "CBAM free engine lead"  · CN code engine calculation results
     - "Pricing Request"        · Custom quote requests
     - "Request a Feature"      · Feature recommendations
     - "Report Issue"           · Issue reports & bugs
     - "Create Account Request" · Waitlist requests
     - "Careers"                · Talent & career applications

   Fire and forget by design. `no-cors` means the response is opaque and
   nothing here can read whether the write succeeded, so a failed post must
   never block or break the visitor experience — errors go to the console and
   the UI carries on. Delivery is confirmed from the Apps Script Executions log.
*/

import { canonicalZone, detectZone } from "./timezones";

export const SHEET_SYNC_URL =
  process.env.NEXT_PUBLIC_SHEET_SYNC_URL ||
  "https://script.google.com/macros/s/AKfycbzmtLgdrSopZUGpUG69LHjYNq30OHdgqUpdPXGmv-KX7GEarQm0d5gORGKe-010pQ4S/exec";

/**
 * The visitor's zone, plus whether it was actually read or fell back.
 */
function zoneWithSource(): { id: string; detected: boolean } {
  let raw = "";
  try {
    raw = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    raw = "";
  }
  const id = detectZone();
  return { id, detected: Boolean(raw) && (raw === id || canonicalZone(raw) === id) };
}

/** UTC offset as people write it, measured from the device: "UTC+07:00". */
function utcOffset(at: Date): string {
  const minutes = -at.getTimezoneOffset();
  const pad = (n: number) => String(n).padStart(2, "0");
  const abs = Math.abs(minutes);
  return `UTC${minutes < 0 ? "-" : "+"}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/**
 * Where and when the lead is, in their terms.
 */
export function leadLocaleFields(now: Date = new Date()): Record<string, string> {
  const zone = zoneWithSource();
  let localTime = "";
  try {
    localTime = now.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    localTime = now.toString();
  }

  return {
    timestamp: now.toISOString(),
    timezone: zone.id,
    zone_source: zone.detected ? "detected" : "fallback",
    utc_offset: utcOffset(now),
    local_time: localTime,
  };
}

/**
 * A floating calendar date as YYYY-MM-DD, read from its own Y/M/D fields.
 */
export function calendarDayString(day: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

/**
 * Post a record to Google Sheets.
 * If targetSheet is given, routes the record into that sheet tab.
 * Automatically attaches locale context (timestamp, timezone, local_time, utc_offset)
 * if not already included.
 */
export function postToSheet(
  fields: Record<string, unknown>,
  targetSheet?: string,
): void {
  if (typeof window === "undefined" || !SHEET_SYNC_URL) return;

  const locale = leadLocaleFields();
  const payload: Record<string, string> = {
    ...locale,
  };

  if (targetSheet) {
    payload.sheet = targetSheet;
  }

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      payload[key] = String(value);
    }
  }

  if ((!targetSheet || targetSheet === "Book a Demo") && !payload.Status) {
    payload.Status = "Confirming";
  }

  const body = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    body.append(key, value);
  }

  fetch(SHEET_SYNC_URL, { method: "POST", body, mode: "no-cors" }).catch((err) => {
    console.warn("Google Sheets sync post failed (non-blocking):", err);
  });
}

/* ── Typed Sync Helpers ─────────────────────────────────────── */

export function syncNewsletter(email: string, source = "footer_newsletter"): void {
  postToSheet({ email: email.trim().toLowerCase(), source }, "Newsletter");
}

export function syncCbamEngineLead(data: {
  name: string;
  email: string;
  phone: string;
  company: string;
  role?: string;
  cnCount?: number;
  productsCount?: number;
  sitesCount?: number;
  sectors?: string;
  recommendedPlan?: string;
  cnCodes?: string;
}): void {
  postToSheet(
    {
      name: data.name,
      email: data.email.trim().toLowerCase(),
      phone: data.phone,
      company: data.company,
      role: data.role || "",
      cn_count: data.cnCount ?? "",
      products_count: data.productsCount ?? "",
      sites_count: data.sitesCount ?? "",
      sectors: data.sectors || "",
      recommended_plan: data.recommendedPlan || "",
      cn_codes: data.cnCodes || "",
      source: "cn_calculator_engine",
    },
    "CBAM free engine lead",
  );
}

export function syncPricingRequest(values: Record<string, string>, context?: string): void {
  postToSheet(
    {
      ...values,
      context: context || values.context || "",
      source: "pricing_request_popup",
    },
    "Pricing Request",
  );
}

export function syncFeatureRequest(values: Record<string, string>): void {
  postToSheet(
    {
      ...values,
      source: "feature_request_popup",
    },
    "Request a Feature",
  );
}

export function syncIssueReport(values: Record<string, string>): void {
  postToSheet(
    {
      ...values,
      source: "issue_report_popup",
    },
    "Report Issue",
  );
}

export function syncCareers(values: Record<string, string>): void {
  postToSheet(
    {
      ...values,
      source: "careers_popup",
    },
    "Careers",
  );
}

export function syncWaitlist(values: {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phone: string;
  company: string;
  jobTitle: string;
}): void {
  postToSheet(
    {
      ...values,
      source: "solutions_waitlist_form",
    },
    "Create Account Request",
  );
}
