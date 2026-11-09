/* ════════════════════════════════════════════════════════════
   SUPPLY CHAIN — SAMPLE NUMBERS

   A made-up supply chain for the same fictional steel and aluminium exporter as
   lib/cbam/carbon-cost-sample.ts, so the tab can be seen with people and
   suppliers on it before one has been invited. Never written to a store; the
   same health functions read it as read the account's own.

   Built to show every state on purpose — a plant that is complete, one on track,
   one with a late month, one nobody has a contact for, one not yet asked — and
   a precursor that is verified, one on a default value carrying a quarter of the
   emissions, one whose report fails its checks, one overdue.

   Dates are taken from `now`, so "invited 21 days ago" stays true whenever the
   sample is opened.
   ════════════════════════════════════════════════════════════ */

import type { Contact, DataBasis, LinkPhase, MonthCell, PlantFacts, PlantMonth, PrecursorFacts } from "./supply-chain-model";

const DAY = 86_400_000;

/** One letter per month of the year: D answered on time · A answered late · L late · W waiting inside its deadline · S ready to send · R month not over. */
function months(workspaceId: string, year: number, pattern: string): PlantMonth[] {
  return pattern.split("").map((ch, i) => {
    const m = i + 1;
    const due = new Date(year, m, 15, 23, 59, 59);
    const cell: MonthCell = ch === "D" || ch === "A" ? "done" : ch === "L" ? "late" : ch === "W" ? "waiting" : ch === "S" ? "send" : "later";
    const sent = cell === "later" || cell === "send" ? null : new Date(due.getTime() - 16 * DAY).toISOString();
    const answered = ch === "D" ? new Date(due.getTime() - 4 * DAY).toISOString() : ch === "A" ? new Date(due.getTime() + 7 * DAY).toISOString() : null;
    return { workspaceId, year, month: `${year}-${String(m).padStart(2, "0")}`, cell, due: due.toISOString(), sentAt: sent, answeredAt: answered };
  });
}

type PlantSpec = {
  id: string;
  name: string;
  company: string;
  own: boolean;
  country: string;
  contact: Contact | null;
  products: string[];
  readiness: number;
  /** one pattern per product report */
  patterns: { year: number; p: string }[];
};

const PLANTS: PlantSpec[] = [
  { id: "TH-RAYONG-01", name: "Rayong Steel Works", company: "", own: true, country: "TH", contact: null, products: ["Steel billet", "Reinforcing bar"], readiness: 78, patterns: [{ year: 2026, p: "DDDDDDDDDRRR" }, { year: 2026, p: "DDDDDDDDAWRR" }] },
  { id: "TH-CHONBURI-01", name: "Chonburi Rolling Mill", company: "", own: true, country: "TH", contact: null, products: ["Hot-rolled coil", "Galvanised sheet"], readiness: 64, patterns: [{ year: 2026, p: "DDDDDDDDAWRR" }, { year: 2026, p: "DDDDDADDSSRR" }] },
  {
    id: "TH-SAMUTPRAKAN-01",
    name: "Samut Prakan Aluminium",
    company: "Eastern Aluminium Co.",
    own: false,
    country: "TH",
    contact: { name: "Somchai Prasert", email: "somchai@easternal.example", phone: "+66 2 555 0142" },
    products: ["Aluminium sheet"],
    readiness: 71,
    patterns: [{ year: 2026, p: "DDDADDDLWSRR" }],
  },
  {
    id: "TH-SARABURI-02",
    name: "Saraburi Alloy Works",
    company: "Saraburi Alloys Ltd.",
    own: false,
    country: "TH",
    contact: { name: "Nattaya Wong", email: "nattaya@sballoys.example", phone: "+66 36 441 090" },
    products: ["Ferro-manganese"],
    readiness: 38,
    patterns: [{ year: 2026, p: "DDADLLLLRRRR" }],
  },
  { id: "TH-LAEMCHABANG-03", name: "Laem Chabang Coating", company: "LC Coating Co.", own: false, country: "TH", contact: null, products: ["Pre-painted sheet"], readiness: 22, patterns: [{ year: 2026, p: "ADLLLWRRRRRR" }] },
  {
    id: "TH-AYUTTHAYA-04",
    name: "Ayutthaya Wire Mill",
    company: "Ayutthaya Wire Co.",
    own: false,
    country: "TH",
    contact: { name: "Prasit Chai", email: "prasit@ayuwire.example", phone: "" },
    products: ["Wire rod"],
    readiness: 0,
    patterns: [{ year: 2026, p: "SSSSSSSSSRRR" }],
  },
  {
    id: "TH-RAYONG-05",
    name: "Rayong Pelletising",
    company: "Eastern Pellets PLC",
    own: false,
    country: "TH",
    contact: { name: "Wipada Rattana", email: "wipada@eastpellets.example", phone: "+66 38 600 311" },
    products: ["Iron ore pellets"],
    readiness: 100,
    patterns: [{ year: 2025, p: "DDDDDDDDDDDD" }],
  },
];

export function samplePlants(): PlantFacts[] {
  return PLANTS.map((s) => {
    const ms = s.patterns.flatMap((x, i) => months(`sample-${s.id}-${i}`, x.year, x.p));
    return {
      id: s.id,
      name: s.name,
      company: s.company,
      own: s.own,
      country: s.country,
      contact: s.contact,
      products: s.products,
      years: [...new Set(s.patterns.map((x) => x.year))].sort((a, b) => b - a),
      readinessPct: s.readiness,
      months: ms,
      reportIds: s.patterns.map((_, i) => `sample-${s.id}-${i}`),
    };
  });
}

type PrecursorSpec = {
  company: string;
  installation: string;
  country: string;
  product: string;
  cn: string;
  feeds: string;
  year: number;
  tier: number;
  contact: Contact | null;
  phase: LinkPhase;
  /** days ago the invitation went out / was opened / was answered */
  sentAgo?: number;
  openedAgo?: number;
  submittedAgo?: number;
  basis: DataBasis;
  checks: [boolean, boolean, boolean, boolean] | null;
  completeness: number;
  see: number | null;
  def: number | null;
  contribution: number | null;
};

const PRECURSORS: PrecursorSpec[] = [
  { company: "Siam DRI Co.", installation: "Siam DRI Plant 1", country: "TH", product: "Direct reduced iron", cn: "7203 10 00", feeds: "Hot-rolled coil", year: 2026, tier: 1, contact: { name: "Kittipong S.", email: "kittipong@siamdri.example", phone: "" }, phase: "submitted", sentAgo: 62, openedAgo: 60, submittedAgo: 41, basis: "verified", checks: [true, true, true, true], completeness: 100, see: 1.18, def: 1.74, contribution: 0.38 },
  { company: "Map Ta Phut Pig Iron", installation: "MTP Blast Furnace 2", country: "TH", product: "Pig iron", cn: "7201 10 11", feeds: "Hot-rolled coil", year: 2026, tier: 1, contact: { name: "Anong D.", email: "anong@mtppig.example", phone: "" }, phase: "submitted", sentAgo: 55, openedAgo: 50, submittedAgo: 33, basis: "unverified", checks: null, completeness: 88, see: 1.62, def: 1.9, contribution: 0.22 },
  { company: "Vina Ferro Alloys", installation: "Hai Phong Smelter", country: "VN", product: "Ferro-manganese", cn: "7202 11 00", feeds: "Galvanised sheet", year: 2026, tier: 2, contact: { name: "Nguyen Van An", email: "an@vinaferro.example", phone: "" }, phase: "sent", sentAgo: 21, basis: "default", checks: null, completeness: 12, see: null, def: 2.4, contribution: 0.18 },
  { company: "Pacific Zinc Coating", installation: "Kaohsiung Zinc Line", country: "TW", product: "Zinc coating", cn: "7901 11 00", feeds: "Galvanised sheet", year: 2026, tier: 1, contact: null, phase: "not_sent", basis: "default", checks: null, completeness: 0, see: null, def: 1.5, contribution: 0.31 },
  { company: "Chiang Mai Graphite", installation: "CM Electrode Plant", country: "TH", product: "Graphite electrodes", cn: "8545 11 00", feeds: "Steel billet", year: 2026, tier: 1, contact: { name: "Suda K.", email: "suda@cmgraphite.example", phone: "" }, phase: "submitted", sentAgo: 48, openedAgo: 44, submittedAgo: 29, basis: "verified", checks: [true, false, true, true], completeness: 94, see: 0.9, def: 1.2, contribution: 0.08 },
  { company: "Rayong Flux & Lime", installation: "Rayong Lime Kiln", country: "TH", product: "Quicklime", cn: "2522 10 00", feeds: "Steel billet", year: 2026, tier: 1, contact: { name: "Thanawat R.", email: "thanawat@rylime.example", phone: "" }, phase: "opened", sentAgo: 6, openedAgo: 4, basis: "unverified", checks: null, completeness: 46, see: 0.95, def: 1.1, contribution: 0.06 },
  { company: "Korat Alloy Powders", installation: "Korat Atomiser", country: "TH", product: "Alloy powder", cn: "7205 21 00", feeds: "Reinforcing bar", year: 2025, tier: 1, contact: { name: "Pimchanok L.", email: "pimchanok@koratpowder.example", phone: "" }, phase: "sent", sentAgo: 140, basis: "default", checks: null, completeness: 8, see: null, def: 1.6, contribution: 0.12 },
  { company: "Bangkok Scrap Pre-processing", installation: "Bang Phli Shredder", country: "TH", product: "Pre-consumer steel scrap", cn: "7204 49 00", feeds: "Steel billet", year: 2026, tier: 1, contact: { name: "Wichai T.", email: "wichai@bkkscrap.example", phone: "" }, phase: "submitted", sentAgo: 70, openedAgo: 70, submittedAgo: 52, basis: "verified", checks: [true, true, true, true], completeness: 100, see: 0.05, def: 0.12, contribution: 0.03 },
  { company: "Korea Aluminium Sheet", installation: "Ulsan Rolling", country: "KR", product: "Aluminium ingot", cn: "7601 20 20", feeds: "Aluminium sheet", year: 2026, tier: 1, contact: { name: "Park Jiho", email: "jiho@kras.example", phone: "" }, phase: "opened", sentAgo: 19, openedAgo: 17, basis: "unverified", checks: null, completeness: 58, see: 2.4, def: 2.9, contribution: 0.44 },
  { company: "Laos Bauxite Export", installation: "Savannakhet Refinery", country: "LA", product: "Alumina", cn: "2818 20 00", feeds: "Aluminium sheet", year: 2026, tier: 2, contact: { name: "Khamla S.", email: "khamla@laosbx.example", phone: "" }, phase: "sent", sentAgo: 14, basis: "default", checks: null, completeness: 10, see: null, def: 0.8, contribution: 0.21 },
];

export function samplePrecursors(now: Date = new Date()): PrecursorFacts[] {
  const ago = (d?: number) => (d == null ? null : new Date(now.getTime() - d * DAY).toISOString());
  return PRECURSORS.map((s, i) => ({
    id: `sample-pre-${i}`,
    workspaceId: `sample-ws-${s.feeds}`,
    company: s.company,
    installation: s.installation,
    country: s.country,
    product: s.product,
    cnCode: s.cn,
    feeds: s.feeds,
    year: s.year,
    tier: s.tier,
    contact: s.contact,
    phase: s.phase,
    sentAt: ago(s.sentAgo),
    openedAt: ago(s.openedAgo),
    submittedAt: ago(s.submittedAgo),
    due: `${s.year}-12-31`,
    basis: s.basis,
    checks: s.checks ? { accreditation: s.checks[0], scope: s.checks[1], period: s.checks[2], file: s.checks[3] } : null,
    completenessPct: s.completeness,
    seeSupplier: s.see,
    seeDefault: s.def,
    contribution: s.contribution,
  }));
}
