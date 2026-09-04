/* Lead capture — posts the demo form and the booking to the Apps Script web
   app that writes the sheet (source in apps-script/lead-capture.gs).

   One module rather than a fetch in each component: the endpoint was
   previously pasted into both, which is how the two drifted apart and how the
   whole sync came to be dropped in one edit without anyone noticing.

   Fire and forget by design. `no-cors` means the response is opaque and
   nothing here can read whether the write succeeded, so a failed post must
   never block or break the booking flow the visitor is in the middle of —
   errors go to the console and the UI carries on. Delivery is confirmed from
   the Apps Script Executions log, not from the browser. */

import { canonicalZone, detectZone } from "./timezones";

export const SHEET_SYNC_URL =
  "https://script.google.com/macros/s/AKfycbw1a_Oib5RIaBbSXLjURY4BGU3HP4GT62YuiRn-sE-TXs6bpY989MA-w5vB5RkC-DAe/exec";

/**
 * The visitor's zone, plus whether it was actually read or fell back.
 *
 * `detectZone` answers Asia/Bangkok both for a Bangkok visitor and for a
 * browser that told us nothing, and those two must not look alike in the
 * sheet — the second is a default, not a location. Comparing against the raw
 * reading is what separates them.
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
  // getTimezoneOffset counts minutes WEST of UTC, so Bangkok reports -420.
  const minutes = -at.getTimezoneOffset();
  const pad = (n: number) => String(n).padStart(2, "0");
  const abs = Math.abs(minutes);
  return `UTC${minutes < 0 ? "-" : "+"}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/**
 * Where and when the lead is, in their terms.
 *
 * A UTC timestamp alone cannot say whether a submission at 03:00 was the
 * middle of someone's night or the middle of their workday, and outreach runs
 * on knowing that. Mirrors the `leadLocale` block in the static landing pages
 * so a lead is described the same way whichever page they arrived through.
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
 *
 * Never via toISOString(): the booking day is local midnight, and for any
 * device ahead of UTC that instant is still the previous date in UTC — a
 * Bangkok visitor booking the 20th would be filed as the 19th.
 */
export function calendarDayString(day: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

/** Post a record. Never throws, never returns anything worth awaiting. */
export function postToSheet(fields: Record<string, string>): void {
  if (typeof window === "undefined" || !SHEET_SYNC_URL) return;

  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    body.append(key, value ?? "");
  }

  fetch(SHEET_SYNC_URL, { method: "POST", body, mode: "no-cors" }).catch(() => {
    /* Opaque either way — the visitor's flow must not depend on this. */
  });
}
