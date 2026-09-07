"use client";

/* Shared form primitives.

   The demo form and the waitlist form ask for the same things — name, a
   professional email, a phone number with its country code, company, job
   title — so the country table, the consumer-mailbox blocklist, the DS input
   classes and the two tiny field chrome components live here rather than being
   maintained twice. A change to the blocklist or the input spec has to land in
   one place or the two forms drift apart.

   Both forms are frontend-only: nothing here transmits or stores anything. */

/* Country calling codes. The standalone Country select is gone — the dial code
   below already carries where the company is, and asking twice on a five-field
   form was the kind of friction that loses a booking. ISO code is the option
   value — several countries share a dial code (+1, +7), so the dial code alone
   can't identify a row. Thailand leads the list and is the default: it's the
   primary market.

   `len` is the number of digits a national number has in that country, used to
   tell "typed it wrong" apart from "still typing". Ranges where a country runs
   several number lengths; anything not listed falls back to DEFAULT_LEN. */
export const DEFAULT_LEN: [number, number] = [6, 14];

/**
 * Strips non-digits and removes duplicate country dial code prefix if typed/pasted
 * into the national number input (e.g. "+66 81 234 5678" -> "812345678").
 */
export function cleanNationalDigits(phone: string, dial: string, maxLen?: number): string {
  let digits = phone.replace(/\D/g, "");
  const dialDigits = dial.replace(/\D/g, "");
  if (dialDigits && digits.startsWith(dialDigits) && (!maxLen || digits.length > maxLen)) {
    digits = digits.slice(dialDigits.length);
  }
  return digits;
}

export const DIAL_CODES: {
  iso: string;
  name: string;
  dial: string;
  len?: [number, number];
}[] = [
  { iso: "TH", name: "Thailand", dial: "+66", len: [8, 10] },
  { iso: "AE", name: "United Arab Emirates", dial: "+971", len: [8, 10] },
  { iso: "AR", name: "Argentina", dial: "+54", len: [10, 11] },
  { iso: "AT", name: "Austria", dial: "+43", len: [10, 13] },
  { iso: "AU", name: "Australia", dial: "+61", len: [9, 10] },
  { iso: "BD", name: "Bangladesh", dial: "+880", len: [10, 10] },
  { iso: "BE", name: "Belgium", dial: "+32", len: [8, 9] },
  { iso: "BG", name: "Bulgaria", dial: "+359", len: [8, 9] },
  { iso: "BR", name: "Brazil", dial: "+55", len: [10, 11] },
  { iso: "CA", name: "Canada", dial: "+1", len: [10, 10] },
  { iso: "CH", name: "Switzerland", dial: "+41", len: [9, 9] },
  { iso: "CL", name: "Chile", dial: "+56", len: [9, 9] },
  { iso: "CN", name: "China", dial: "+86", len: [11, 11] },
  { iso: "CY", name: "Cyprus", dial: "+357", len: [8, 8] },
  { iso: "CZ", name: "Czechia", dial: "+420", len: [9, 9] },
  { iso: "DE", name: "Germany", dial: "+49", len: [10, 11] },
  { iso: "DK", name: "Denmark", dial: "+45", len: [8, 8] },
  { iso: "EE", name: "Estonia", dial: "+372", len: [7, 8] },
  { iso: "EG", name: "Egypt", dial: "+20", len: [10, 10] },
  { iso: "ES", name: "Spain", dial: "+34", len: [9, 9] },
  { iso: "FI", name: "Finland", dial: "+358", len: [9, 10] },
  { iso: "FR", name: "France", dial: "+33", len: [9, 10] },
  { iso: "GB", name: "United Kingdom", dial: "+44", len: [10, 11] },
  { iso: "GR", name: "Greece", dial: "+30", len: [10, 10] },
  { iso: "HK", name: "Hong Kong", dial: "+852", len: [8, 8] },
  { iso: "HR", name: "Croatia", dial: "+385", len: [8, 9] },
  { iso: "HU", name: "Hungary", dial: "+36", len: [8, 9] },
  { iso: "ID", name: "Indonesia", dial: "+62", len: [9, 12] },
  { iso: "IE", name: "Ireland", dial: "+353", len: [9, 9] },
  { iso: "IL", name: "Israel", dial: "+972", len: [9, 9] },
  { iso: "IN", name: "India", dial: "+91", len: [10, 10] },
  { iso: "IT", name: "Italy", dial: "+39", len: [9, 10] },
  { iso: "JP", name: "Japan", dial: "+81", len: [10, 10] },
  { iso: "KH", name: "Cambodia", dial: "+855", len: [8, 9] },
  { iso: "KR", name: "South Korea", dial: "+82", len: [9, 10] },
  { iso: "KW", name: "Kuwait", dial: "+965", len: [8, 8] },
  { iso: "LA", name: "Laos", dial: "+856", len: [8, 10] },
  { iso: "LK", name: "Sri Lanka", dial: "+94", len: [9, 9] },
  { iso: "LT", name: "Lithuania", dial: "+370", len: [8, 8] },
  { iso: "LU", name: "Luxembourg", dial: "+352", len: [9, 9] },
  { iso: "LV", name: "Latvia", dial: "+371", len: [8, 8] },
  { iso: "MA", name: "Morocco", dial: "+212", len: [9, 9] },
  { iso: "MM", name: "Myanmar", dial: "+95", len: [8, 10] },
  { iso: "MT", name: "Malta", dial: "+356", len: [8, 8] },
  { iso: "MX", name: "Mexico", dial: "+52", len: [10, 10] },
  { iso: "MY", name: "Malaysia", dial: "+60", len: [9, 10] },
  { iso: "NG", name: "Nigeria", dial: "+234", len: [10, 10] },
  { iso: "NL", name: "Netherlands", dial: "+31", len: [9, 9] },
  { iso: "NO", name: "Norway", dial: "+47", len: [8, 8] },
  { iso: "NZ", name: "New Zealand", dial: "+64", len: [8, 10] },
  { iso: "PH", name: "Philippines", dial: "+63", len: [10, 10] },
  { iso: "PK", name: "Pakistan", dial: "+92", len: [10, 10] },
  { iso: "PL", name: "Poland", dial: "+48", len: [9, 9] },
  { iso: "PT", name: "Portugal", dial: "+351", len: [9, 9] },
  { iso: "QA", name: "Qatar", dial: "+974", len: [8, 8] },
  { iso: "RO", name: "Romania", dial: "+40", len: [9, 9] },
  { iso: "SA", name: "Saudi Arabia", dial: "+966", len: [9, 9] },
  { iso: "SE", name: "Sweden", dial: "+46", len: [7, 10] },
  { iso: "SG", name: "Singapore", dial: "+65", len: [8, 8] },
  { iso: "SI", name: "Slovenia", dial: "+386", len: [8, 8] },
  { iso: "SK", name: "Slovakia", dial: "+421", len: [9, 9] },
  { iso: "TR", name: "Turkey", dial: "+90", len: [10, 10] },
  { iso: "TW", name: "Taiwan", dial: "+886", len: [9, 9] },
  { iso: "UA", name: "Ukraine", dial: "+380", len: [9, 9] },
  { iso: "US", name: "United States", dial: "+1", len: [10, 10] },
  { iso: "VN", name: "Vietnam", dial: "+84", len: [9, 10] },
  { iso: "ZA", name: "South Africa", dial: "+27", len: [9, 9] },
];

/* Consumer mailbox providers. The field asks for a professional email, so a
   personal address is rejected rather than quietly accepted — a demo request
   from someone's private inbox has no company behind it to qualify. */
export const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.co.th",
  "yahoo.co.jp",
  "ymail.com",
  "rocketmail.com",
  "hotmail.com",
  "hotmail.co.uk",
  "hotmail.co.th",
  "outlook.com",
  "outlook.co.th",
  "live.com",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "gmx.com",
  "gmx.net",
  "gmx.de",
  "mail.com",
  "mail.ru",
  "yandex.com",
  "yandex.ru",
  "zoho.com",
  "fastmail.com",
  "hushmail.com",
  "tutanota.com",
  "qq.com",
  "163.com",
  "126.com",
  "sina.com",
  "naver.com",
  "daum.net",
  "hanmail.net",
  "rediffmail.com",
  "thaimail.com",
  "sanook.com",
  "windowslive.com",
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "trashmail.com",
]);

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/* Matches the DS `.m-select`/`.m-input` spec exactly: white fill, 1px
   10%-black border, 10px radius, 12px text, 9px/12px padding, 35%-ink
   placeholder, border darkens to 25% on focus (no ring, no glow). */
export const inputBase =
  "w-full bg-white border rounded-[10px] px-3 py-[9px] text-xs text-[#111] placeholder:text-black/35 focus:outline-none transition-colors";
export const inputOk = "border-black/10 focus:border-black/25";
/* `err-text` is the DS status token from globals.css (@theme --color-err-text).
   Use the token, not a raw hex: an arbitrary hex carrying an opacity modifier
   compiled to no rule at all here, so the invalid state silently rendered with
   the normal border. */
export const inputBad = "border-err-text/45 focus:border-err-text/70";
/* DS §Label: 11px, .1em tracking, uppercase, 55% ink, weight 500. */
export const labelClass =
  "block text-[11px] tracking-widest uppercase text-black/55 font-medium mb-1.5";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-[11px] leading-snug text-err-text">{message}</p>
  );
}

export function SelectChevron({ inset = "right-3" }: { inset?: string }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`pointer-events-none absolute ${inset} top-1/2 -translate-y-1/2 text-black/35`}
    >
      <path d="M2 3.5 5 6.5 8 3.5" />
    </svg>
  );
}
