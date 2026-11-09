/* ════════════════════════════════════════════════════════════
   KEEPING UP WITH THE RULES

   CBAM is still being written: the law changed in 2025, four sets of detailed
   rules arrived in December, and the first review of the numbers is due at the
   end of 2027. This is the digest Cera gives when asked what's new — what has
   happened, and what is coming — kept as dated entries so it can be split
   around today and so anything new can be flagged to the reader once.

   IT IS THE RULES AS CERTRACE HAS THEM, not a live feed, and the card says so
   with its date. When the rules move, the entry is added here and the reader is
   told in the same place they ask.
   ════════════════════════════════════════════════════════════ */

import type { UpdateItem } from "./types";

/** The date these entries were last checked against the rules. */
export const UPDATES_AS_OF = "2026-10-26";

export const UPDATES: UpdateItem[] = [
  {
    id: "simplification-2025",
    date: "2025-10-17",
    title: "CBAM simplified and strengthened",
    body: "The EU replaced the €150-per-consignment exemption with a 50-tonne-a-year threshold, moved the declaration and surrender deadline to 30 September, pushed certificate sales back to 1 February 2027, made it clearer who must be an authorised declarant, and tightened verification. About 99% of emissions stay in scope.",
  },
  {
    id: "verification-rules-2025",
    date: "2025-12-22",
    title: "Verification rules published",
    body: "Verifiers work to a 5% materiality threshold, make a physical site visit in the first verified year and can only go virtual afterwards if nothing significant has changed, and report through the Commission's e-template in the CBAM Registry.",
  },
  {
    id: "calculation-rules-2025",
    date: "2025-12-22",
    title: "Rules for calculating embedded emissions published",
    body: "A new 35-item operator's emissions report, rules for attributing emissions between goods, treatment of heat, waste gases and CO₂ transfers, and standard factors for fuels and process materials. The monitoring plan and the report are in English; records are kept six years.",
  },
  {
    id: "benchmarks-2025",
    date: "2025-12-22",
    title: "Free-allocation benchmarks for 2026–2030 published",
    body: "The offset deducted from the bill starts at 97.5% of an EU producer's free allocation in 2026 and falls each year to zero in 2034. The benchmarks are estimates until the final EU numbers arrive; updated ones apply from 1 January 2027.",
  },
  {
    id: "default-values-2025",
    date: "2025-12-31",
    title: "Default values published for 115 countries",
    body: "Per country and CN code, with a mark-up of 10% in 2026, 20% in 2027 and 30% from 2028 (1% for fertilisers). A precursor of unknown origin takes the highest country default for its CN code. Unlisted countries use the 'other countries' row.",
  },
  {
    id: "definitive-2026",
    date: "2026-01-01",
    title: "The definitive CBAM period began",
    body: "Only authorised declarants can import covered goods. Embedded emissions for 2026 imports are declared in 2027 — on verified actual values where you have them, on default values where you don't.",
  },
  {
    id: "thai-briefing-2026",
    date: "2026-02-26",
    title: "Thai industry briefing on the default-value gap",
    body: "Thai industry set out why Thailand's scrap-route defaults leave Thai steel with a higher net cost than some competitors, and two paths: negotiating adjusted values, and building the country's own ability to report real emissions — a shared digital monitoring system, a recognised carbon price and incentives for decarbonisation.",
  },
  {
    id: "verifiers-2026",
    date: "2026-09-01",
    source: "European Commission — procedure announced 28 August 2026",
    title: "Verifiers can register in the CBAM Registry",
    body: "Accredited verifiers can now register, which is the earliest an actual value can be verified through the Registry. Line up your verifier early — first-year verification includes a physical site visit.",
  },
  {
    id: "verifier-resources-2026",
    date: "2026-09-28",
    source: "European Commission",
    title: "Guidance and training videos for verifiers published",
    body: "Accreditation guidance, how verifiers get access to the Registry, and videos on applying to be a registered verifier and on handling a collaboration request from a third-country installation operator — the step where your verifier is linked to your installation in the Registry.",
  },
  {
    id: "de-minimis-2026",
    date: "2026-09-30",
    source: "European Commission",
    title: "The 50-tonne threshold stays: assessment published",
    body: "The Commission found the 50-tonne-a-year threshold exempts 0.87% of embedded emissions (1 April 2025 to 31 March 2026), under the 1% limit, so it is not lowered. A change of more than 15 tonnes would need a delegated act.",
  },
  {
    id: "price-q3-2026",
    date: "2026-10-05",
    source: "European Commission — figure as reported by customs authorities and trade press",
    title: "Q3 2026 certificate price published: €82.32",
    body: "Up from €75.28 in the second quarter (published 6 July 2026) and €75.36 in the first (7 April 2026). It is the weighted average of EU emissions-trading auction prices and applies to goods imported in the third quarter. The Q4 price is due on 4 January 2027.",
  },
  {
    id: "verifiers-accredited-2026",
    date: "2026-10-13",
    source: "National accreditation bodies; European Commission state of play of 21 October 2026",
    title: "First CBAM verifiers accredited — the Commission's list is not out yet",
    body: "EmiCert (Greece, ESYD, announced 23 September), Bureau Veritas Italia, RINA Services and SGS ICS Italia (Italy, Accredia, decision of 28 September, announced 6 October) and Intertek Certification AB (Sweden, Swedac, 13 October). The Commission says its list of accredited verifiers 'will be published' on its verification page — it was not there at 21 October. A verifier outside the EU, including in Thailand, applies to any national accreditation body that offers CBAM accreditation; none based outside the EU was documented as accredited yet.",
  },
  {
    id: "thai-climate-act-2026",
    date: "2026-10-15",
    source: "Eksiam Legal (updated 15 October 2026); Nishimura & Asahi (15 January 2026); ICAP",
    title: "Thailand's Climate Change Act is still a draft",
    body: "The Cabinet approved the draft on 2 December 2025 and the Council of State began reviewing it on 5 May 2026. It has not been passed or published in the Royal Gazette. The draft adds a carbon tax on listed goods, with rates set later, and a mandatory emissions trading system; enactment is expected around 2027 and an emissions-trading pilot not before about 2029. Until it passes, a Thai plant's only carbon price is the one inside the oil excise.",
  },
  {
    id: "thai-carbon-price-2026",
    date: "2026-10-26",
    source: "Excise Department notice (Government Gazette, 22 April 2025) and Cabinet decision of 21 January 2025, as reported by EY, HLB Thailand and Enviliance; checked 26 October 2026",
    title: "Thailand's carbon price is still THB 200 a tonne",
    body: "Thailand's only carbon price in force is the THB 200 per tonne of CO₂e built into the excise on petrol and gasohol, kerosene, jet fuel, diesel and biodiesel, LPG and fuel oil, set by the Excise Department's notice of 22 April 2025. Pump prices did not change, and raising it needs Cabinet approval; no change had been announced by 26 October 2026. Whether the EU accepts it as a carbon price paid has not been confirmed, so Certrace records it as a claim and never subtracts it.",
  },
  {
    id: "qa-update-2026",
    date: "2026-10-15",
    source: "European Commission — CBAM news page, 15 October 2026",
    title: "The Commission published an updated CBAM questions-and-answers document",
    body: "It covers the most common questions on CBAM, and comes with a factsheet of 30 September on how certificates work — the annual declaration and the surrender. The Commission's factsheet on actual versus default values, from 23 June, is the one to read before you decide whether to have your figures verified: for an actual value, the producer in the third country has to supply verified data on the total embedded emissions.",
  },
  {
    id: "downstream-extension-2026",
    date: "2026-10-20",
    source: "Council and Parliament positions; first trilogue as reported by law firms and trade press",
    title: "Downstream extension: first trilogue held, no deal yet",
    body: "The Commission proposed on 17 December 2025 to bring about 180 steel- and aluminium-intensive goods — screws, bolts, wire, tubes — into CBAM. The Council agreed its position on 12 June 2026 (about 200 products) and Parliament on 15 September 2026 (a much wider list). The first trilogue on 20 October ended without agreement. It is still a proposal: nothing applies yet.",
  },
  {
    id: "downstream-trilogue-2-2026",
    date: "2026-11-30",
    source: "Provisional date, as reported",
    title: "Second trilogue on the downstream extension (provisional)",
    body: "The next round on which goods join CBAM and on the anti-circumvention rules. If you make wire, screws, tubes or similar from steel or aluminium, this decides whether you will be asked for emissions data.",
  },
  {
    id: "verification-reports-2027",
    date: "2027-01-01",
    source: "European Commission timeline — 'January 2027'",
    title: "Accredited verifiers can issue their first verification reports",
    body: "The Commission's timeline puts the first verification reports in the Registry in January 2027, ahead of the declaration for 2026 imports in September 2027.",
  },
  {
    id: "price-q4-2026",
    date: "2027-01-04",
    source: "European Commission — published schedule",
    title: "Q4 2026 certificate price due; weekly prices from 2027",
    body: "The fourth and last quarterly price for 2026 imports. From 2027 the price is calculated and published every week instead of every quarter.",
  },
  {
    id: "mark-up-2027",
    date: "2027-01-01",
    title: "Mark-up rises to 20%; quarterly holding starts; updated benchmarks apply",
    body: "Default values go up by a further 10 points of mark-up. Declarants must hold certificates for at least half of year-to-date embedded emissions at the end of each quarter. Updated final benchmarks apply to goods imported from this date. The UK's own CBAM also starts.",
  },
  {
    id: "certificate-sales-2027",
    date: "2027-02-01",
    title: "EU countries begin selling CBAM certificates",
    body: "Certificates become available on a common platform. For 2026 imports the price is the quarterly average of EU emissions-trading auction prices.",
  },
  {
    id: "alternative-data-2027",
    date: "2027-06-30",
    title: "Deadline for alternative values for the 2027 import year",
    body: "Countries can submit official data for an alternative electricity emission factor or a regional adaptation of default values by 30 June of the import year.",
  },
  {
    id: "first-declaration-2027",
    date: "2027-09-30",
    title: "First CBAM declaration and surrender",
    body: "For 2026 imports. Your buyer's declaration is built from the data you give them — so verified reports and complete operator reports need to be with them well before this date.",
  },
  {
    id: "review-2027",
    date: "2027-12-31",
    title: "Commission review of default values and mark-ups due",
    body: "The first review of the default values and mark-ups is due by the end of 2027, with a report before 1 January 2028 and every two years after. The figures in Certrace can change after it.",
  },
  {
    id: "mark-up-2028",
    date: "2028-01-01",
    title: "Mark-up reaches 30%",
    body: "Default values carry a 30% mark-up from 2028 (still 1% for fertilisers) — the gap between a default and a verified figure is widest from here on.",
  },
  {
    id: "uk-registration-2028",
    date: "2028-01-31",
    title: "UK CBAM registration deadline",
    body: "UK importers above £50,000 of covered imports a year register by 31 January 2028; the first UK return and payment follow on 31 May 2028.",
  },
];

/* ── What the reader has already seen ───────────────────────────
   Kept per browser. Opening the digest marks everything in it as seen, which is
   what lets the Cera button stop flagging it. */
const PREF_KEY = "certrace:cera-updates";

type Prefs = { notify: boolean; seen: string[] };

function readPrefs(): Prefs {
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    if (!raw) return { notify: true, seen: [] };
    const p = JSON.parse(raw) as Partial<Prefs>;
    return { notify: p.notify !== false, seen: Array.isArray(p.seen) ? p.seen.filter((x): x is string => typeof x === "string") : [] };
  } catch {
    return { notify: true, seen: [] };
  }
}

export const UPDATES_EVENT = "certrace:cera-updates";

function writePrefs(p: Prefs): void {
  try {
    window.localStorage.setItem(PREF_KEY, JSON.stringify(p));
  } catch {
    /* storage blocked — the flag just comes back next time */
  }
  // The button in the top bar listens, so its flag clears the moment the digest is opened.
  window.dispatchEvent(new Event(UPDATES_EVENT));
}

export const notifyAboutUpdates = (): boolean => (typeof window === "undefined" ? false : readPrefs().notify);

export function setNotifyAboutUpdates(on: boolean): void {
  if (typeof window === "undefined") return;
  writePrefs({ ...readPrefs(), notify: on });
}

/** The split the digest shows: what has already taken effect (newest first,
    recent ones only) and what is coming (soonest first). */
export function splitUpdates(today: Date = new Date()): { inForce: UpdateItem[]; upcoming: UpdateItem[] } {
  const iso = today.toISOString().slice(0, 10);
  const past = UPDATES.filter((u) => u.date <= iso).sort((a, b) => b.date.localeCompare(a.date));
  const future = UPDATES.filter((u) => u.date > iso).sort((a, b) => a.date.localeCompare(b.date));
  return { inForce: past, upcoming: future };
}

/** Updates that took effect in the last 60 days and have not been opened yet. */
export function unseenUpdates(today: Date = new Date()): UpdateItem[] {
  if (typeof window === "undefined") return [];
  const prefs = readPrefs();
  if (!prefs.notify) return [];
  const iso = today.toISOString().slice(0, 10);
  const since = new Date(today.getTime() - 60 * 86400000).toISOString().slice(0, 10);
  return UPDATES.filter((u) => u.date <= iso && u.date >= since && !prefs.seen.includes(u.id));
}

/** The ids of the entries the reader has already opened, for a screen that wants to say which are new. */
export function seenUpdateIds(): string[] {
  return typeof window === "undefined" ? [] : readPrefs().seen;
}

export function markUpdatesSeen(ids: string[]): void {
  if (typeof window === "undefined") return;
  const prefs = readPrefs();
  writePrefs({ ...prefs, seen: [...new Set([...prefs.seen, ...ids])] });
}
