/* ════════════════════════════════════════════════════════════
   INTERNATIONAL DIALLING CODES

   A telephone number on an installation record is quoted back by a buyer's
   declarant and by a verifier who may be in another country, so it has to
   carry its country. Typed free-hand it arrives as "038 123456", "+66 38 123
   456", "0066381234563" and "66-38-123456" — four spellings of one number,
   none of which can be dialled from Brussels without guessing which leading
   zero to drop.

   So the country code is PICKED and the subscriber number is typed. The two
   are stored joined ("+66 38 123 456"), because that is the one string every
   downstream document wants; the picker exists to make sure the "+66" is
   right, not to add a second field to the data model.

   Keyed by the ISO-3166 alpha-2 codes in lib/config.ts COUNTRIES, so the two
   lists cannot drift — `dialCodeFor` returns undefined for anything missing
   rather than inventing a prefix.
   ════════════════════════════════════════════════════════════ */

export const DIAL_CODES: Record<string, string> = {
  AF: "+93", AL: "+355", DZ: "+213", AD: "+376", AO: "+244", AG: "+1", AR: "+54", AM: "+374",
  AU: "+61", AT: "+43", AZ: "+994", BS: "+1", BH: "+973", BD: "+880", BB: "+1", BY: "+375",
  BE: "+32", BZ: "+501", BJ: "+229", BT: "+975", BO: "+591", BA: "+387", BW: "+267", BR: "+55",
  BN: "+673", BG: "+359", BF: "+226", BI: "+257", CV: "+238", KH: "+855", CM: "+237", CA: "+1",
  CF: "+236", TD: "+235", CL: "+56", CN: "+86", CO: "+57", KM: "+269", CG: "+242", CD: "+243",
  CR: "+506", CI: "+225", HR: "+385", CU: "+53", CY: "+357", CZ: "+420", DK: "+45", DJ: "+253",
  DM: "+1", DO: "+1", EC: "+593", EG: "+20", SV: "+503", GQ: "+240", ER: "+291", EE: "+372",
  SZ: "+268", ET: "+251", FJ: "+679", FI: "+358", FR: "+33", GA: "+241", GM: "+220", GE: "+995",
  DE: "+49", GH: "+233", GR: "+30", GD: "+1", GT: "+502", GN: "+224", GW: "+245", GY: "+592",
  HT: "+509", HN: "+504", HK: "+852", HU: "+36", IS: "+354", IN: "+91", ID: "+62", IR: "+98",
  IQ: "+964", IE: "+353", IL: "+972", IT: "+39", JM: "+1", JP: "+81", JO: "+962", KZ: "+7",
  KE: "+254", KI: "+686", KW: "+965", KG: "+996", LA: "+856", LV: "+371", LB: "+961", LS: "+266",
  LR: "+231", LY: "+218", LI: "+423", LT: "+370", LU: "+352", MO: "+853", MG: "+261", MW: "+265",
  MY: "+60", MV: "+960", ML: "+223", MT: "+356", MH: "+692", MR: "+222", MU: "+230", MX: "+52",
  FM: "+691", MD: "+373", MC: "+377", MN: "+976", ME: "+382", MA: "+212", MZ: "+258", MM: "+95",
  NA: "+264", NR: "+674", NP: "+977", NL: "+31", NZ: "+64", NI: "+505", NE: "+227", NG: "+234",
  KP: "+850", MK: "+389", NO: "+47", OM: "+968", PK: "+92", PW: "+680", PS: "+970", PA: "+507",
  PG: "+675", PY: "+595", PE: "+51", PH: "+63", PL: "+48", PT: "+351", QA: "+974", RO: "+40",
  RU: "+7", RW: "+250", KN: "+1", LC: "+1", VC: "+1", WS: "+685", SM: "+378", ST: "+239",
  SA: "+966", SN: "+221", RS: "+381", SC: "+248", SL: "+232", SG: "+65", SK: "+421", SI: "+386",
  SB: "+677", SO: "+252", ZA: "+27", KR: "+82", SS: "+211", ES: "+34", LK: "+94", SD: "+249",
  SR: "+597", SE: "+46", CH: "+41", SY: "+963", TW: "+886", TJ: "+992", TZ: "+255", TH: "+66",
  TL: "+670", TG: "+228", TO: "+676", TT: "+1", TN: "+216", TR: "+90", TM: "+993", TV: "+688",
  UG: "+256", UA: "+380", AE: "+971", GB: "+44", US: "+1", UY: "+598", UZ: "+998", VU: "+678",
  VA: "+39", VE: "+58", VN: "+84", YE: "+967", ZM: "+260", ZW: "+263",
};

export const dialCodeFor = (countryCode: string): string | undefined => DIAL_CODES[countryCode?.trim().toUpperCase()];

/** Split a stored "+66 38 123 456" back into the picker's two halves.

    Longest-prefix first, because "+1" is a prefix of nothing but "+7" is a
    prefix of "+7xx" in several numbering plans — matching short-first would
    strip the wrong number of digits and leave a subscriber number that cannot
    be dialled. A number stored without a "+" is treated as national: the
    prefix falls back to the installation's own country, which is what an
    operator typing "038 123 456" into a Thai site means. */
export function splitPhone(stored: string, fallbackCountry: string): { dial: string; number: string } {
  const raw = (stored ?? "").trim();
  const fallback = dialCodeFor(fallbackCountry) ?? "+66";
  if (!raw) return { dial: fallback, number: "" };
  if (!raw.startsWith("+")) return { dial: fallback, number: raw };

  const codes = [...new Set(Object.values(DIAL_CODES))].sort((a, b) => b.length - a.length);
  const compact = raw.replace(/[\s-]/g, "");
  const hit = codes.find((c) => compact.startsWith(c));
  if (!hit) return { dial: fallback, number: raw };
  return { dial: hit, number: raw.slice(raw.indexOf(hit) + hit.length).trim() };
}

export const joinPhone = (dial: string, number: string): string => (number.trim() ? `${dial} ${number.trim()}` : "");

/* ── Is the subscriber half actually a telephone number? ────────
   The picker guarantees the "+66" is real. Nothing guaranteed the rest: "12",
   "n/a" and "call the office" all stored happily, and the failure only
   surfaced weeks later when a verifier or a buyer's declarant tried to dial
   the contact on an installation record and found there was no number there.

   Separators are ignored — a person types "38 123 456", "38-123-456" or
   "(038) 123456" and all three mean the same subscriber. What is checked is
   what is left: DIGITS ONLY, and enough of them.

   The range comes from E.164: a full international number is at most 15
   digits including the 1–3 digit country code, so 14 is the ceiling for the
   part typed here. The floor is 6, which is short enough for the shortest
   real national numbers and long enough to reject a placeholder. */
export const MIN_SUBSCRIBER_DIGITS = 6;
export const MAX_SUBSCRIBER_DIGITS = 14;

export function isValidSubscriberNumber(number: string): boolean {
  const raw = (number ?? "").trim();
  if (!raw) return false;
  // Anything that is not a digit or a recognised separator — a letter, a
  // second "+" — is not a spelling of a number, it is a different answer.
  if (!/^[\d\s().-]+$/.test(raw)) return false;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= MIN_SUBSCRIBER_DIGITS && digits.length <= MAX_SUBSCRIBER_DIGITS;
}

/** The same test against a STORED "+66 38 123 456" — splits the dial code
    back off first, so the country code's own digits are not counted toward
    the subscriber length. */
export function isValidPhone(stored: string, fallbackCountry: string): boolean {
  return isValidSubscriberNumber(splitPhone(stored, fallbackCountry).number);
}
