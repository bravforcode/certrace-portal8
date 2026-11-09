/* ════════════════════════════════════════════════════════════
   THE CN CATALOGUE — every good in CBAM scope, at 8-digit CN level

   THE BIG SET IS 570 CODES, NOT 67. The catalogue used to hold one hand-picked
   code per heading. That was never the list an exporter's customs declaration
   is written against, and nine of its 67 codes (7216 33 00, 7219 34 00,
   7318 15 90, 7606 11 00 and others) are not 8-digit CN codes at all — the CN
   splits those headings one level further down.

   The authoritative list is the benchmark table in Commission Implementing
   Regulation (EU) 2025/2620, point 5.3. It carries one row for every CN code
   the CBAM free-allocation adjustment applies to, which is every good in
   Annex I of Regulation (EU) 2023/956 (as amended by 2025/2083) apart from
   electricity (CN 2716 00 00 — it earns no free allocation, is measured in
   MWh rather than tonnes, and Thailand is not among the countries Annex III
   lists). It is generated into ./data/cn-catalogue.ts by
   cbam-regulatory-kb/scripts/gen_portal_data.py, never typed by hand:

       Iron & steel   478        Fertilisers   27        Hydrogen   1
       Aluminium       58        Cement         6        ———————  570

   What each row carries beyond the code is what the CN code LEADS TO: the
   default emission value for the country (Implementing Regulation 2025/2621),
   the production routes the EU recognises for it, and the benchmark the free
   allocation is computed from (2025/2620). See ./eu-rates.ts and ./routes.ts.

   LEGACY IDS. Workspaces already saved name a product by the old catalogue ids
   ("hrc", "rebar", …). Where a legacy code is a real CN code, the new row
   keeps the legacy id and its friendly name, so nothing saved is orphaned.
   Where it is not (the nine above), the old entry survives in LEGACY_ONLY so
   the saved workspace still resolves — it is simply not offered to new ones.
   ════════════════════════════════════════════════════════════ */

import type { CatalogProduct, ProductCategory } from "../config";
import { CN_ROWS, type CnRow } from "./data/cn-catalogue";

export { CN_ROWS };
export type { CnRow };

/* ── Headings: what each 4-digit heading is, and where it sits in the picker ──
   Titles follow the CN heading text (shortened) — the picker's "Heading"
   filter reads them, and a product's `name` is its heading title, so the CN
   code on the row is what tells two codes under one heading apart and the
   full official description sits beneath it. */
type HeadingInfo = { title: string; group: string };

const HEADINGS: Record<string, HeadingInfo> = {
  // ── Cement ──
  "2507": { title: "Kaolinic clay (calcined)", group: "Calcined clay & clinker" },
  "2523": { title: "Cement", group: "Cement" },
  // ── Hydrogen ──
  "2804": { title: "Hydrogen", group: "Hydrogen" },
  // ── Fertilisers ──
  "2808": { title: "Nitric acid; sulphonitric acids", group: "Nitric acid & ammonia" },
  "2814": { title: "Ammonia", group: "Nitric acid & ammonia" },
  "2834": { title: "Potassium nitrate", group: "Nitrogenous fertilisers" },
  "3102": { title: "Mineral or chemical fertilisers, nitrogenous", group: "Nitrogenous fertilisers" },
  "3105": { title: "Mineral or chemical fertilisers, mixed (N, P, K)", group: "Mixed fertilisers" },
  // ── Iron & steel · primary inputs ──
  "2601": { title: "Iron ore, agglomerated (sinter, pellets)", group: "Primary inputs" },
  "7201": { title: "Pig iron and spiegeleisen", group: "Primary inputs" },
  "7202": { title: "Ferro-alloys (Fe-Mn, Fe-Cr, Fe-Ni)", group: "Primary inputs" },
  "7203": { title: "Direct reduced iron (DRI / HBI)", group: "Primary inputs" },
  "7205": { title: "Granules and powders of iron or steel", group: "Primary inputs" },
  // ── semi-finished ──
  "7206": { title: "Ingots and primary forms of iron or non-alloy steel", group: "Semi-finished" },
  "7207": { title: "Semi-finished products of iron or non-alloy steel", group: "Semi-finished" },
  // ── flat products ──
  "7208": { title: "Flat-rolled, ≥ 600 mm, hot-rolled, uncoated", group: "Flat products" },
  "7209": { title: "Flat-rolled, ≥ 600 mm, cold-rolled, uncoated", group: "Flat products" },
  "7210": { title: "Flat-rolled, ≥ 600 mm, clad, plated or coated", group: "Flat products" },
  "7211": { title: "Flat-rolled, < 600 mm, uncoated", group: "Flat products" },
  "7212": { title: "Flat-rolled, < 600 mm, clad, plated or coated", group: "Flat products" },
  // ── long products ──
  "7213": { title: "Wire rod, hot-rolled, in coils", group: "Long products" },
  "7214": { title: "Other bars and rods, hot-worked", group: "Long products" },
  "7215": { title: "Other bars and rods", group: "Long products" },
  "7216": { title: "Angles, shapes and sections", group: "Long products" },
  "7217": { title: "Wire of iron or non-alloy steel", group: "Long products" },
  // ── stainless & alloy ──
  "7218": { title: "Stainless steel — ingots and semi-finished", group: "Stainless & alloy" },
  "7219": { title: "Stainless steel — flat-rolled, ≥ 600 mm", group: "Stainless & alloy" },
  "7220": { title: "Stainless steel — flat-rolled, < 600 mm", group: "Stainless & alloy" },
  "7221": { title: "Stainless steel — wire rod", group: "Stainless & alloy" },
  "7222": { title: "Stainless steel — other bars, angles, sections", group: "Stainless & alloy" },
  "7223": { title: "Stainless steel — wire", group: "Stainless & alloy" },
  "7224": { title: "Other alloy steel — ingots and semi-finished", group: "Stainless & alloy" },
  "7225": { title: "Other alloy steel — flat-rolled, ≥ 600 mm", group: "Stainless & alloy" },
  "7226": { title: "Other alloy steel — flat-rolled, < 600 mm", group: "Stainless & alloy" },
  "7227": { title: "Other alloy steel — wire rod", group: "Stainless & alloy" },
  "7228": { title: "Other alloy steel — bars, angles, sections", group: "Stainless & alloy" },
  "7229": { title: "Other alloy steel — wire", group: "Stainless & alloy" },
  // ── tubes & pipes ──
  "7303": { title: "Tubes and pipes of cast iron", group: "Tubes & pipes" },
  "7304": { title: "Seamless tubes, pipes and hollow profiles", group: "Tubes & pipes" },
  "7305": { title: "Large-diameter welded tubes (> 406.4 mm)", group: "Tubes & pipes" },
  "7306": { title: "Other tubes, pipes and hollow profiles", group: "Tubes & pipes" },
  "7307": { title: "Tube or pipe fittings", group: "Tubes & pipes" },
  // ── articles ──
  "7301": { title: "Sheet piling and welded sections", group: "Articles" },
  "7302": { title: "Railway and tramway track material", group: "Articles" },
  "7308": { title: "Structures and parts of structures", group: "Articles" },
  "7309": { title: "Reservoirs, tanks, vats (> 300 l)", group: "Articles" },
  "7310": { title: "Tanks, casks, drums, cans (≤ 300 l)", group: "Articles" },
  "7311": { title: "Containers for compressed or liquefied gas", group: "Articles" },
  "7318": { title: "Screws, bolts, nuts, rivets, washers", group: "Articles" },
  "7326": { title: "Other articles of iron or steel", group: "Articles" },
  // ── Aluminium ──
  "7601": { title: "Unwrought aluminium", group: "Unwrought" },
  "7603": { title: "Aluminium powders and flakes", group: "Unwrought" },
  "7604": { title: "Aluminium bars, rods and profiles", group: "Wrought products" },
  "7605": { title: "Aluminium wire", group: "Wrought products" },
  "7606": { title: "Aluminium plates, sheets, strip (> 0.2 mm)", group: "Wrought products" },
  "7607": { title: "Aluminium foil (≤ 0.2 mm)", group: "Wrought products" },
  "7608": { title: "Aluminium tubes and pipes", group: "Wrought products" },
  "7609": { title: "Aluminium tube or pipe fittings", group: "Articles" },
  "7610": { title: "Aluminium structures and parts", group: "Articles" },
  "7611": { title: "Aluminium reservoirs and tanks (> 300 l)", group: "Articles" },
  "7612": { title: "Aluminium casks, drums, cans (≤ 300 l)", group: "Articles" },
  "7613": { title: "Aluminium containers for gas", group: "Articles" },
  "7614": { title: "Aluminium stranded wire and cables", group: "Articles" },
  "7616": { title: "Other articles of aluminium", group: "Articles" },
};

export const headingInfo = (heading: string): HeadingInfo | undefined => HEADINGS[heading];

/** Groups of each sector, in the order the picker lists them. */
export const GROUPS_BY_SECTOR: Record<ProductCategory, string[]> = {
  "Iron & Steel": ["Primary inputs", "Semi-finished", "Flat products", "Long products", "Stainless & alloy", "Tubes & pipes", "Articles"],
  Aluminium: ["Unwrought", "Wrought products", "Articles"],
  Cement: ["Calcined clay & clinker", "Cement"],
  Fertilisers: ["Nitric acid & ammonia", "Nitrogenous fertilisers", "Mixed fertilisers"],
  Hydrogen: ["Hydrogen"],
};

/** Groups whose goods have no CBAM precursor of their own in scope — the
    Precursors tab is "not applicable" for them. Everything else is complex. */
export const PRIMARY_GROUPS_ALL = new Set(["Primary inputs", "Unwrought", "Calcined clay & clinker", "Hydrogen", "Nitric acid & ammonia"]);

/* ── The legacy catalogue ─────────────────────────────────────── */
type Legacy = { id: string; name: string; category: "Iron & Steel" | "Aluminium"; group: string; cnCode: string; hsCode: string; keywords: string[] };

const L = (id: string, name: string, category: Legacy["category"], group: string, cnCode: string, keywords: string[]): Legacy => ({
  id,
  name,
  category,
  group,
  cnCode,
  hsCode: cnCode.replace(/\D/g, "").slice(0, 4),
  keywords,
});

const LEGACY: Legacy[] = [
  L("ironore", "Iron ore, agglomerated (sinter / pellets)", "Iron & Steel", "Primary inputs", "2601 12 00", ["ore", "sinter", "pellet", "precursor"]),
  L("pigiron", "Pig iron, non-alloy", "Iron & Steel", "Primary inputs", "7201 10 90", ["pig", "iron", "primary"]),
  L("pigiron-alloy", "Pig iron, alloy / spiegeleisen", "Iron & Steel", "Primary inputs", "7201 50 90", ["pig", "spiegeleisen", "alloy"]),
  L("femn", "Ferro-manganese", "Iron & Steel", "Primary inputs", "7202 11 80", ["ferro", "manganese", "alloy"]),
  L("fecr", "Ferro-chromium", "Iron & Steel", "Primary inputs", "7202 41 10", ["ferro", "chromium", "alloy"]),
  L("feni", "Ferro-nickel", "Iron & Steel", "Primary inputs", "7202 60 00", ["ferro", "nickel", "alloy"]),
  L("dri", "Direct reduced iron (DRI / HBI)", "Iron & Steel", "Primary inputs", "7203 10 00", ["dri", "hbi", "sponge", "reduced"]),
  L("granules", "Iron granules & powders", "Iron & Steel", "Primary inputs", "7205 10 00", ["granule", "powder"]),
  L("ingot", "Ingots, non-alloy steel", "Iron & Steel", "Semi-finished", "7206 10 00", ["ingot", "semi"]),
  L("billet", "Billets (semi-finished)", "Iron & Steel", "Semi-finished", "7207 11 90", ["billet", "semi"]),
  L("slab", "Slabs (semi-finished)", "Iron & Steel", "Semi-finished", "7207 12 10", ["slab", "semi"]),
  L("hrc", "Hot-rolled coil", "Iron & Steel", "Flat products", "7208 39 00", ["hrc", "coil", "flat", "hot rolled"]),
  L("hrplate", "Hot-rolled plate (heavy)", "Iron & Steel", "Flat products", "7208 51 20", ["plate", "flat", "heavy"]),
  L("crc", "Cold-rolled coil", "Iron & Steel", "Flat products", "7209 18 99", ["crc", "coil", "flat", "cold rolled"]),
  L("galv", "Hot-dip galvanised sheet", "Iron & Steel", "Flat products", "7210 49 00", ["galvanised", "galvanized", "zinc", "coated", "sheet"]),
  L("prepaint", "Pre-painted / colour-coated sheet", "Iron & Steel", "Flat products", "7210 70 80", ["painted", "coated", "colour", "color"]),
  L("tinplate", "Tinplate (tin-coated sheet)", "Iron & Steel", "Flat products", "7210 12 20", ["tinplate", "tin", "coated"]),
  L("narrowstrip", "Narrow strip (< 600 mm)", "Iron & Steel", "Flat products", "7211 23 30", ["strip", "narrow"]),
  L("narrowstrip-coated", "Narrow strip, coated / plated (< 600 mm)", "Iron & Steel", "Flat products", "7212 30 00", ["strip", "narrow", "coated", "plated", "zinc"]),
  L("wirerod", "Wire rod (in coils)", "Iron & Steel", "Long products", "7213 91 10", ["wire", "rod", "long"]),
  L("rebar", "Reinforcing bar (rebar)", "Iron & Steel", "Long products", "7214 20 00", ["rebar", "bar", "reinforcing"]),
  L("merchantbar", "Merchant bar", "Iron & Steel", "Long products", "7215 50 19", ["merchant", "bar"]),
  L("section", "Sections (H / I-beams)", "Iron & Steel", "Long products", "7216 33 00", ["beam", "section", "structural", "h-beam", "i-beam"]),
  L("angle", "Angles (L-sections)", "Iron & Steel", "Long products", "7216 21 00", ["angle", "l-section"]),
  L("wire", "Steel wire", "Iron & Steel", "Long products", "7217 10 90", ["wire", "drawn"]),
  L("ss-semi", "Stainless steel, ingots & semi-finished", "Iron & Steel", "Stainless & alloy", "7218 10 00", ["stainless", "ingot", "semi", "inox"]),
  L("ss-flat", "Stainless flat-rolled (≥ 600 mm)", "Iron & Steel", "Stainless & alloy", "7219 34 00", ["stainless", "flat", "inox"]),
  L("ss-flat-narrow", "Stainless flat-rolled (< 600 mm)", "Iron & Steel", "Stainless & alloy", "7220 20 00", ["stainless", "flat", "narrow", "inox"]),
  L("ss-wirerod", "Stainless wire rod", "Iron & Steel", "Stainless & alloy", "7221 00 10", ["stainless", "wire", "rod", "inox"]),
  L("ss-bar", "Stainless bars & rods", "Iron & Steel", "Stainless & alloy", "7222 20 00", ["stainless", "bar"]),
  L("ss-wire", "Stainless wire", "Iron & Steel", "Stainless & alloy", "7223 00 19", ["stainless", "wire", "inox"]),
  L("alloy-semi", "Other alloy steel, ingots & semi-finished", "Iron & Steel", "Stainless & alloy", "7224 10 90", ["alloy", "ingot", "semi"]),
  L("alloy-flat", "Other alloy steel, flat-rolled", "Iron & Steel", "Stainless & alloy", "7225 40 00", ["alloy", "flat"]),
  L("alloy-flat-narrow", "Other alloy steel, flat-rolled (< 600 mm)", "Iron & Steel", "Stainless & alloy", "7226 92 00", ["alloy", "flat", "narrow"]),
  L("alloy-wirerod", "Other alloy steel, wire rod", "Iron & Steel", "Stainless & alloy", "7227 90 95", ["alloy", "wire", "rod"]),
  L("alloy-bar", "Other alloy steel, bars", "Iron & Steel", "Stainless & alloy", "7228 30 00", ["alloy", "bar"]),
  L("alloy-wire", "Other alloy steel, wire", "Iron & Steel", "Stainless & alloy", "7229 90 90", ["alloy", "wire"]),
  L("castironpipe", "Cast-iron tubes & pipes", "Iron & Steel", "Tubes & pipes", "7303 00 90", ["pipe", "tube", "cast iron"]),
  L("seamless", "Seamless tubes & pipes", "Iron & Steel", "Tubes & pipes", "7304 39 88", ["pipe", "tube", "seamless"]),
  L("linepipe", "Welded large-diameter line pipe", "Iron & Steel", "Tubes & pipes", "7305 11 00", ["line", "pipe", "welded", "large"]),
  L("weldtube", "Welded tubes & pipes", "Iron & Steel", "Tubes & pipes", "7306 30 80", ["welded", "tube", "pipe"]),
  L("fittings", "Tube & pipe fittings", "Iron & Steel", "Tubes & pipes", "7307 19 10", ["fitting", "flange", "elbow"]),
  L("sheetpiling", "Sheet piling", "Iron & Steel", "Articles", "7301 10 00", ["sheet", "piling"]),
  L("rails", "Railway rails", "Iron & Steel", "Articles", "7302 10 22", ["rail", "railway", "track"]),
  L("structures", "Structures (towers, bridges, frames)", "Iron & Steel", "Articles", "7308 90 98", ["structure", "tower", "bridge", "frame"]),
  L("scaffolding", "Scaffolding & props", "Iron & Steel", "Articles", "7308 40 00", ["scaffolding", "prop"]),
  L("tanks", "Reservoirs & tanks (> 300 L)", "Iron & Steel", "Articles", "7309 00 90", ["tank", "reservoir"]),
  L("drums", "Casks, drums & cans (≤ 300 L)", "Iron & Steel", "Articles", "7310 10 00", ["drum", "cask", "can"]),
  L("gascylinders", "Gas containers (cylinders)", "Iron & Steel", "Articles", "7311 00 99", ["gas", "cylinder", "container"]),
  L("fasteners", "Screws, bolts & nuts", "Iron & Steel", "Articles", "7318 15 90", ["bolt", "screw", "nut", "fastener"]),
  L("articles", "Other articles of iron or steel", "Iron & Steel", "Articles", "7326 90 98", ["article", "other"]),
  L("al-unwrought", "Unwrought aluminium, not alloyed", "Aluminium", "Unwrought", "7601 10 90", ["unwrought", "ingot", "primary"]),
  L("al-unwrought-alloy", "Unwrought aluminium alloys", "Aluminium", "Unwrought", "7601 20 80", ["unwrought", "alloy", "ingot"]),
  L("al-powder", "Aluminium powders & flakes", "Aluminium", "Unwrought", "7603 10 00", ["powder", "flake"]),
  L("al-bar", "Aluminium bars & rods", "Aluminium", "Wrought products", "7604 29 10", ["bar", "rod"]),
  L("al-profile", "Aluminium profiles (hollow)", "Aluminium", "Wrought products", "7604 21 00", ["profile", "extrusion", "hollow"]),
  L("al-wire", "Aluminium wire", "Aluminium", "Wrought products", "7605 11 00", ["wire"]),
  L("al-plate", "Aluminium plate / sheet / strip", "Aluminium", "Wrought products", "7606 11 00", ["plate", "sheet", "strip"]),
  L("al-foil", "Aluminium foil", "Aluminium", "Wrought products", "7607 11 00", ["foil"]),
  L("al-tube", "Aluminium tubes & pipes", "Aluminium", "Wrought products", "7608 10 00", ["tube", "pipe"]),
  L("al-fittings", "Aluminium tube / pipe fittings", "Aluminium", "Articles", "7609 00 00", ["fitting"]),
  L("al-structures", "Aluminium structures (frames, doors)", "Aluminium", "Articles", "7610 90 90", ["structure", "frame", "door", "window"]),
  L("al-reservoir", "Aluminium reservoirs (> 300 L)", "Aluminium", "Articles", "7611 00 00", ["reservoir", "tank"]),
  L("al-casks", "Aluminium casks & drums (≤ 300 L)", "Aluminium", "Articles", "7612 90 20", ["cask", "drum"]),
  L("al-gas", "Aluminium gas containers", "Aluminium", "Articles", "7613 00 00", ["gas", "container"]),
  L("al-cable", "Aluminium stranded wire & cables", "Aluminium", "Articles", "7614 10 00", ["cable", "stranded", "wire"]),
  L("al-articles", "Other articles of aluminium", "Aluminium", "Articles", "7616 99 90", ["article", "other"]),
];

const legacyByCn = new Map(LEGACY.map((l) => [l.cnCode, l]));
const digits = (cn: string) => cn.replace(/\D/g, "");

/* ── Keywords ───────────────────────────────────────────────────
   Searched by the picker alongside name, description and CN. Words from the
   heading title and from the description's first clause, so "coil", "stainless"
   and "galvanised" find rows whose heading says none of them. */
const STOP = new Set(["of", "or", "and", "the", "in", "to", "for", "with", "than", "other", "not", "from", "by", "on", "an", "a", "excl", "whether"]);
function keywordsFrom(...texts: string[]): string[] {
  const out = new Set<string>();
  for (const t of texts) {
    for (const w of t.toLowerCase().split(/[^a-z0-9]+/)) if (w.length > 2 && !STOP.has(w)) out.add(w);
  }
  return [...out];
}

/** The description without the trailing "(excl. …)" boilerplate, for the
    one-line form on a row. The full text is kept on `description`. */
export function shortDescription(description: string, max = 140): string {
  const base = description.replace(/\s*\((?:excl|excluding)\.?[^)]*\)?\s*$/i, "").trim();
  return base.length > max ? `${base.slice(0, max - 1).trimEnd()}…` : base;
}

export type CnProduct = CatalogProduct & {
  /** the 4-digit heading, "7208" */
  heading: string;
  /** the heading's own title — what `name` is for new codes */
  headingTitle: string;
  /** the full official CN description */
  description: string;
  /** true when the id is one an older workspace may still refer to */
  legacyId?: boolean;
};

function build(row: CnRow): CnProduct {
  const d = digits(row.cn);
  const heading = d.slice(0, 4);
  const info = HEADINGS[heading] ?? { title: heading, group: "Articles" };
  const legacy = legacyByCn.get(row.cn);
  return {
    id: legacy ? legacy.id : `cn${d}`,
    name: legacy ? legacy.name : info.title,
    category: row.sector,
    group: legacy ? legacy.group : info.group,
    cnCode: row.cn,
    hsCode: heading,
    keywords: legacy ? [...new Set([...legacy.keywords, ...keywordsFrom(info.title)])] : keywordsFrom(info.title, row.description.slice(0, 160)),
    heading,
    headingTitle: info.title,
    description: row.description,
    legacyId: legacy ? true : undefined,
  };
}

/** All 570, in CN order. */
export const FULL_CATALOGUE: CnProduct[] = CN_ROWS.map(build);

/** Old entries whose code is not an 8-digit CN code. Resolvable by id, never
    offered — see the header. */
export const LEGACY_ONLY: CnProduct[] = LEGACY.filter((l) => !CN_ROWS.some((r) => r.cn === l.cnCode)).map((l) => ({
  id: l.id,
  name: l.name,
  category: l.category,
  group: l.group,
  cnCode: l.cnCode,
  hsCode: l.hsCode,
  keywords: l.keywords,
  heading: l.hsCode,
  headingTitle: HEADINGS[l.hsCode]?.title ?? l.hsCode,
  description: l.name,
  legacyId: true,
}));

const byCn = new Map(FULL_CATALOGUE.map((p) => [digits(p.cnCode), p]));
const byId = new Map([...FULL_CATALOGUE, ...LEGACY_ONLY].map((p) => [p.id, p]));

export const cnProductById = (id: string): CnProduct | undefined => byId.get(id);
export const cnProductByCode = (cn: string): CnProduct | undefined => byCn.get(digits(cn));
export const cnRowFor = (cn: string): CnRow | undefined => CN_ROWS.find((r) => digits(r.cn) === digits(cn));

/** Which headings a sector has, for the picker's Heading filter. */
export function headingsFor(sector?: ProductCategory, group?: string): { heading: string; title: string }[] {
  const seen = new Map<string, string>();
  for (const p of FULL_CATALOGUE) {
    if (sector && p.category !== sector) continue;
    if (group && p.group !== group) continue;
    if (!seen.has(p.heading)) seen.set(p.heading, p.headingTitle);
  }
  return [...seen].map(([heading, title]) => ({ heading, title }));
}
