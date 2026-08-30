/* Time zones for the booking dialog.

   Two jobs. First, print a zone the way a person would say it — the browser
   hands back an IANA identifier ("Asia/Bangkok"), which is a database key, not
   a place: it names an administrative region rather than a city, spells spaces
   as underscores, and means nothing to a visitor. Every label here is
   "City, Country (GMT+7)".

   Second, let a visitor override the detected zone. Someone in Bangkok booking
   a call for a colleague in Hamburg needs to pick times in *their* day, so the
   selected zone is the one the slot grid is expressed in — not a decoration on
   top of a fixed set of hours.

   Offsets are never stored. Half of these zones move twice a year, so a
   hardcoded "+1" would be wrong for a third of the year; each label computes
   its offset from the date it is being shown for.

   City and country names stay in English on every language of the site. They
   are geographic identifiers rather than prose, the platform gives no
   localized city names to read them from (`Intl.DisplayNames` covers regions
   and languages, not cities), and a hand-kept table in five languages would
   drift the first time a row was added. The copy around the control is
   translated. */

export type TimeZoneRegion =
  | "asiaPacific"
  | "europe"
  | "middleEastAfrica"
  | "americas";

export type TimeZoneOption = {
  /* IANA identifier */
  id: string;
  city: string;
  /* Omitted for city-states, where "Singapore, Singapore" reads as a typo. */
  country?: string;
  region: TimeZoneRegion;
};

export const TIME_ZONE_REGIONS: TimeZoneRegion[] = [
  "asiaPacific",
  "europe",
  "middleEastAfrica",
  "americas",
];

/* Weighted towards the two ends of the trade this product sits in: the
   exporting markets in Asia, and the EU buyers asking them for carbon data.
   Anything not listed still works — a detected zone that isn't here is added
   to the list at runtime (see `withDetectedZone`). */
export const TIME_ZONES: TimeZoneOption[] = [
  /* Asia-Pacific */
  { id: "Asia/Bangkok", city: "Bangkok", country: "Thailand", region: "asiaPacific" },
  { id: "Asia/Ho_Chi_Minh", city: "Ho Chi Minh City", country: "Vietnam", region: "asiaPacific" },
  { id: "Asia/Phnom_Penh", city: "Phnom Penh", country: "Cambodia", region: "asiaPacific" },
  { id: "Asia/Vientiane", city: "Vientiane", country: "Laos", region: "asiaPacific" },
  { id: "Asia/Yangon", city: "Yangon", country: "Myanmar", region: "asiaPacific" },
  { id: "Asia/Jakarta", city: "Jakarta", country: "Indonesia", region: "asiaPacific" },
  { id: "Asia/Kuala_Lumpur", city: "Kuala Lumpur", country: "Malaysia", region: "asiaPacific" },
  { id: "Asia/Singapore", city: "Singapore", region: "asiaPacific" },
  { id: "Asia/Manila", city: "Manila", country: "Philippines", region: "asiaPacific" },
  { id: "Asia/Dhaka", city: "Dhaka", country: "Bangladesh", region: "asiaPacific" },
  { id: "Asia/Kolkata", city: "New Delhi", country: "India", region: "asiaPacific" },
  { id: "Asia/Karachi", city: "Karachi", country: "Pakistan", region: "asiaPacific" },
  { id: "Asia/Colombo", city: "Colombo", country: "Sri Lanka", region: "asiaPacific" },
  { id: "Asia/Kathmandu", city: "Kathmandu", country: "Nepal", region: "asiaPacific" },
  { id: "Asia/Shanghai", city: "Shanghai", country: "China", region: "asiaPacific" },
  { id: "Asia/Hong_Kong", city: "Hong Kong", region: "asiaPacific" },
  { id: "Asia/Taipei", city: "Taipei", country: "Taiwan", region: "asiaPacific" },
  { id: "Asia/Seoul", city: "Seoul", country: "South Korea", region: "asiaPacific" },
  { id: "Asia/Tokyo", city: "Tokyo", country: "Japan", region: "asiaPacific" },
  { id: "Australia/Perth", city: "Perth", country: "Australia", region: "asiaPacific" },
  { id: "Australia/Sydney", city: "Sydney", country: "Australia", region: "asiaPacific" },
  { id: "Pacific/Auckland", city: "Auckland", country: "New Zealand", region: "asiaPacific" },

  /* Europe */
  { id: "Europe/Lisbon", city: "Lisbon", country: "Portugal", region: "europe" },
  { id: "Europe/Dublin", city: "Dublin", country: "Ireland", region: "europe" },
  { id: "Europe/London", city: "London", country: "United Kingdom", region: "europe" },
  { id: "Europe/Madrid", city: "Madrid", country: "Spain", region: "europe" },
  { id: "Europe/Paris", city: "Paris", country: "France", region: "europe" },
  { id: "Europe/Brussels", city: "Brussels", country: "Belgium", region: "europe" },
  { id: "Europe/Amsterdam", city: "Amsterdam", country: "Netherlands", region: "europe" },
  { id: "Europe/Berlin", city: "Berlin", country: "Germany", region: "europe" },
  { id: "Europe/Zurich", city: "Zurich", country: "Switzerland", region: "europe" },
  { id: "Europe/Vienna", city: "Vienna", country: "Austria", region: "europe" },
  { id: "Europe/Rome", city: "Rome", country: "Italy", region: "europe" },
  { id: "Europe/Copenhagen", city: "Copenhagen", country: "Denmark", region: "europe" },
  { id: "Europe/Oslo", city: "Oslo", country: "Norway", region: "europe" },
  { id: "Europe/Stockholm", city: "Stockholm", country: "Sweden", region: "europe" },
  { id: "Europe/Helsinki", city: "Helsinki", country: "Finland", region: "europe" },
  { id: "Europe/Warsaw", city: "Warsaw", country: "Poland", region: "europe" },
  { id: "Europe/Prague", city: "Prague", country: "Czechia", region: "europe" },
  { id: "Europe/Budapest", city: "Budapest", country: "Hungary", region: "europe" },
  { id: "Europe/Bucharest", city: "Bucharest", country: "Romania", region: "europe" },
  { id: "Europe/Sofia", city: "Sofia", country: "Bulgaria", region: "europe" },
  { id: "Europe/Athens", city: "Athens", country: "Greece", region: "europe" },
  { id: "Europe/Istanbul", city: "Istanbul", country: "Türkiye", region: "europe" },
  { id: "Europe/Kyiv", city: "Kyiv", country: "Ukraine", region: "europe" },

  /* Middle East & Africa */
  { id: "Asia/Jerusalem", city: "Tel Aviv", country: "Israel", region: "middleEastAfrica" },
  { id: "Asia/Dubai", city: "Dubai", country: "United Arab Emirates", region: "middleEastAfrica" },
  { id: "Asia/Riyadh", city: "Riyadh", country: "Saudi Arabia", region: "middleEastAfrica" },
  { id: "Asia/Qatar", city: "Doha", country: "Qatar", region: "middleEastAfrica" },
  { id: "Africa/Cairo", city: "Cairo", country: "Egypt", region: "middleEastAfrica" },
  { id: "Africa/Casablanca", city: "Casablanca", country: "Morocco", region: "middleEastAfrica" },
  { id: "Africa/Lagos", city: "Lagos", country: "Nigeria", region: "middleEastAfrica" },
  { id: "Africa/Nairobi", city: "Nairobi", country: "Kenya", region: "middleEastAfrica" },
  { id: "Africa/Johannesburg", city: "Johannesburg", country: "South Africa", region: "middleEastAfrica" },

  /* Americas */
  { id: "America/Sao_Paulo", city: "São Paulo", country: "Brazil", region: "americas" },
  { id: "America/Argentina/Buenos_Aires", city: "Buenos Aires", country: "Argentina", region: "americas" },
  { id: "America/Santiago", city: "Santiago", country: "Chile", region: "americas" },
  { id: "America/Lima", city: "Lima", country: "Peru", region: "americas" },
  { id: "America/Bogota", city: "Bogotá", country: "Colombia", region: "americas" },
  { id: "America/New_York", city: "New York", country: "United States", region: "americas" },
  { id: "America/Toronto", city: "Toronto", country: "Canada", region: "americas" },
  { id: "America/Mexico_City", city: "Mexico City", country: "Mexico", region: "americas" },
  { id: "America/Chicago", city: "Chicago", country: "United States", region: "americas" },
  { id: "America/Denver", city: "Denver", country: "United States", region: "americas" },
  { id: "America/Los_Angeles", city: "Los Angeles", country: "United States", region: "americas" },
  { id: "America/Vancouver", city: "Vancouver", country: "Canada", region: "americas" },
];

const FALLBACK_ZONE = "Asia/Bangkok";

/* Browsers do not all report the current name for a zone. Chromium answers
   `Asia/Calcutta` for India, not `Asia/Kolkata` — the IANA database keeps the
   old names as links forever, and the ICU build decides which one comes back.
   Left unmapped, an Indian visitor's zone misses the table and prints as
   "Calcutta", which is both the wrong city name and a fifty-year-old one.

   Only zones that resolve to a row in TIME_ZONES are listed; anything else can
   fall through to the generic handling. */
const ZONE_ALIASES: Record<string, string> = {
  "Asia/Calcutta": "Asia/Kolkata",
  "Asia/Saigon": "Asia/Ho_Chi_Minh",
  "Asia/Rangoon": "Asia/Yangon",
  "Asia/Katmandu": "Asia/Kathmandu",
  "Asia/Dacca": "Asia/Dhaka",
  "Asia/Chongqing": "Asia/Shanghai",
  "Asia/Chungking": "Asia/Shanghai",
  "Asia/Harbin": "Asia/Shanghai",
  "Asia/Tel_Aviv": "Asia/Jerusalem",
  "Asia/Istanbul": "Europe/Istanbul",
  "Europe/Kiev": "Europe/Kyiv",
  "Europe/Uzhgorod": "Europe/Kyiv",
  "Europe/Zaporozhye": "Europe/Kyiv",
  "Europe/Belfast": "Europe/London",
  "America/Buenos_Aires": "America/Argentina/Buenos_Aires",
  "Australia/Canberra": "Australia/Sydney",
  "Australia/NSW": "Australia/Sydney",
  "Australia/ACT": "Australia/Sydney",
  "Australia/West": "Australia/Perth",
  /* Country- and region-style links, still emitted by some environments. */
  GB: "Europe/London",
  Eire: "Europe/Dublin",
  Poland: "Europe/Warsaw",
  Portugal: "Europe/Lisbon",
  Turkey: "Europe/Istanbul",
  Egypt: "Africa/Cairo",
  Israel: "Asia/Jerusalem",
  Japan: "Asia/Tokyo",
  Singapore: "Asia/Singapore",
  Hongkong: "Asia/Hong_Kong",
  PRC: "Asia/Shanghai",
  ROC: "Asia/Taipei",
  ROK: "Asia/Seoul",
  NZ: "Pacific/Auckland",
  "US/Eastern": "America/New_York",
  "US/Central": "America/Chicago",
  "US/Mountain": "America/Denver",
  "US/Pacific": "America/Los_Angeles",
  "Canada/Eastern": "America/Toronto",
  "Canada/Pacific": "America/Vancouver",
  "Mexico/General": "America/Mexico_City",
  "Brazil/East": "America/Sao_Paulo",
};

/* The name this zone is listed under, if it is one of ours under an older
   name. Everything downstream works in canonical ids. */
export function canonicalZone(id: string): string {
  return ZONE_ALIASES[id] ?? id;
}

/* Every zone the visitor's browser might report is in the IANA database, but
   not necessarily in the list above, and a stale browser can report a zone the
   runtime itself won't accept. Anything that doesn't format is not a zone. */
export function isValidZone(id: string): boolean {
  if (!id) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: id }).format();
    return true;
  } catch {
    return false;
  }
}

export function detectZone(): string {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!detected) return FALLBACK_ZONE;
    /* Canonicalise first, then validate: the modern name is the one the table
       is keyed on, and both names point at the same rules either way. */
    const canonical = canonicalZone(detected);
    if (isValidZone(canonical)) return canonical;
    if (isValidZone(detected)) return detected;
  } catch {
    /* falls through */
  }
  return FALLBACK_ZONE;
}

/* The calendar fields a zone is showing at a given instant. Everything else in
   this file is built on top of this one call. */
function zonedParts(zone: string, at: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    /* `hour12: false` renders midnight as 24 in some ICU versions. */
    hour: read("hour") % 24,
    minute: read("minute"),
    second: read("second"),
  };
}

/* Minutes east of UTC, for this zone, at this instant.

   Derived by asking the zone what time it is and comparing that reading to the
   same fields read as UTC — which is exact for every zone and offset, and does
   not depend on `timeZoneName: "longOffset"` being implemented. */
export function offsetMinutes(zone: string, at: Date): number {
  const p = zonedParts(zone, at);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  /* Drop sub-second precision on both sides so the difference lands on a whole
     minute — offsets have been whole minutes since 1972. */
  return Math.round((asUTC - Math.floor(at.getTime() / 1000) * 1000) / 60000);
}

/* "GMT+7", "GMT-3:30", "GMT" */
export function formatOffset(minutes: number): string {
  if (minutes === 0) return "GMT";
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `GMT${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

/* Last resort for a zone that isn't in the table: "Asia/Ho_Chi_Minh" reads a
   good deal better as "Ho Chi Minh". */
function cityFromId(id: string): string {
  const tail = id.split("/").pop() ?? id;
  return tail.replace(/_/g, " ");
}

export function findZone(id: string): TimeZoneOption | undefined {
  const canonical = canonicalZone(id);
  return TIME_ZONES.find((z) => z.id === canonical);
}

/* "Bangkok, Thailand" */
export function zonePlace(id: string): string {
  const known = findZone(id);
  if (!known) return cityFromId(id);
  return known.country ? `${known.city}, ${known.country}` : known.city;
}

/* "Bangkok, Thailand (GMT+7)" — the string stored on a booking and shown back
   on the confirmation. `at` matters: the same zone reads GMT+1 in January and
   GMT+2 in July, and the label should describe the day being booked. */
export function zoneLabel(id: string, at: Date = new Date()): string {
  return `${zonePlace(id)} (${formatOffset(offsetMinutes(id, at))})`;
}

/* The list to render, with the detected zone folded in if the table doesn't
   already carry it — a visitor in a city we didn't list still sees their own
   zone selected rather than being silently moved to Bangkok. */
export function withDetectedZone(detected: string): TimeZoneOption[] {
  if (!detected || findZone(detected)) return TIME_ZONES;
  if (!isValidZone(detected)) return TIME_ZONES;

  const prefix = detected.split("/")[0];
  const region: TimeZoneRegion =
    prefix === "Europe"
      ? "europe"
      : prefix === "America"
        ? "americas"
        : prefix === "Africa"
          ? "middleEastAfrica"
          : "asiaPacific";

  return [...TIME_ZONES, { id: detected, city: cityFromId(detected), region }];
}

/* The instant at which a wall-clock time occurs in a zone — the inverse of
   `zonedParts`, and what turns "09:30 on the 14th, in Berlin" into something
   comparable with `Date.now()`.

   Two passes: the first guess reads the offset at the UTC instant with those
   same fields, which is off by an hour if the zone changed offset between the
   guess and the answer; re-reading the offset at the corrected instant settles
   it. (An hour that a spring-forward skips has no exact answer — it lands on
   the hour after, which is the conventional resolution.) */
export function wallTimeInstant(
  zone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): number {
  const target = Date.UTC(year, month, day, hour, minute);
  const firstPass = target - offsetMinutes(zone, new Date(target)) * 60000;
  const settled = target - offsetMinutes(zone, new Date(firstPass)) * 60000;
  return settled;
}

/* The zone's current calendar date, as a floating local-midnight Date.

   The day strip and the availability seed both work in calendar days rather
   than instants, so a day is carried as a plain Date whose Y/M/D are the ones
   the *selected zone* is showing. Its own local offset is never read. */
export function calendarDayInZone(zone: string, at: Date): Date {
  const p = zonedParts(zone, at);
  return new Date(p.year, p.month - 1, p.day);
}
