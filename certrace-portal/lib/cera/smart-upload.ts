/* ════════════════════════════════════════════════════════════
   CERA'S SMART UPLOAD — read one file, say where it goes, ask only what is missing

   A person hands Cera ONE FILE. Three things then happen, in this order:

     1 · READ. Text, CSV and similar files are read in the browser. Anything else
         (a PDF, a photo) is accepted but not opened — Cera says so, and points to
         the month's Documents step, where documents are attached.
     2 · UNDERSTAND. What the file is about — which installation, which product,
         which month — and which readings it holds: production, fuels, electricity,
         process materials, notes. Every reading is kept with the line it came from.
     3 · PLACE, OR ASK. If the file says where everything goes, there is no
         question. If it does not — which of two product reports, which month, or
         what a column of bare numbers measures — Cera asks that one thing, with
         buttons, and asks the next only if it is still needed.

   Then the readings are shown laid out as the form they will go into, each with
   its numbered box and whether it is required, and ONLY what was found: Cera does
   not invent an empty field to look thorough. Nothing is written until the reader
   presses Fill in, and a month that has already been submitted is never touched.

   THE READING IS RULE-BASED, not a model: labelled values ("Natural gas: 182,400
   m3"), table rows ("Natural gas,182400,m3") and dated readings are recognised;
   prose that merely mentions a number is not guessed at. It gives the same answer
   twice, and shows the line behind every figure so a wrong reading is easy to see.
   A model can be put behind `analyzeText` later without changing the flow.
   ════════════════════════════════════════════════════════════ */

import { euStandardFor } from "../cbam/fuel-defaults";
import { CARBON_CONTENTS, STANDARD_MATERIALS } from "../cbam/process-factors";
import { markAiFilled } from "../ai-fill";
import { listInstallations, type Installation } from "../installations";
import {
  applyEuStandard,
  electricityFactorFor,
  emptyElectricitySource,
  emptyFuel,
  emptyMonth,
  emptyProcessEmissionEntry,
  FUEL_TYPES,
  fuelTypeLabel,
  getMonth,
  monthIssues,
  saveMonth,
  type FuelEntry,
  type MonthlyEntry,
  type ProcessEmissionEntry,
  type MonthlyFuelUnit,
} from "../monthly-data";
import {
  getWorkspace,
  listWorkspaces,
  monthNameLong,
  monthsOf,
  type VerificationWorkspace,
} from "../workspace";
import { emptyPfc, packFor } from "../cbam/sector-pack";
import type {
  ApplyPayload,
  CeraCard,
  CeraChoiceOption,
  ExtractedReading,
  ExtractionPlan,
  ReadingField,
  ReadingInput,
} from "./types";
import { dateLocaleFor, translate } from "../i18n";
import { pick, type CeraLang } from "./lang";
import { busiestSection, inFormOrder } from "./focus";

/* ── What a file can be ──────────────────────────────────────── */

const TEXT_NAME = /\.(txt|csv|tsv|md|markdown|json|log|text|dat)$/i;
const MAX_CHARS = 400_000;

export const isReadable = (file: { name: string; type?: string }): boolean =>
  TEXT_NAME.test(file.name) ||
  /^text\//.test(file.type ?? "") ||
  file.type === "application/json";

export async function readFile(
  file: File,
): Promise<{ readable: boolean; text: string }> {
  if (!isReadable(file)) return { readable: false, text: "" };
  try {
    return { readable: true, text: (await file.text()).slice(0, MAX_CHARS) };
  } catch {
    return { readable: false, text: "" };
  }
}

/* ── What was found ──────────────────────────────────────────── */

type Unit = MonthlyFuelUnit;

export type Fact =
  | { kind: "production"; tonnes: number; source: string }
  | {
      kind: "fuel";
      fuelType: string;
      label: string;
      quantity: number;
      unit: Unit;
      ncvMjPerUnit?: number;
      source: string;
    }
  | {
      kind: "electricity";
      mwh: number;
      sourceType:
        | "grid_default"
        | "ppa"
        | "self_generated"
        | "direct_technical_link";
      factor?: number;
      installation?: string;
      source: string;
    }
  | {
      kind: "process";
      materialId: string;
      label: string;
      method: "standard" | "mass_balance";
      quantityT: number;
      source: string;
    }
  | {
      kind: "scrap";
      material: "steel_scrap" | "iron_scrap" | "aluminium_scrap";
      tonnes: number;
      preConsumerT?: number;
      source: string;
    }
  | { kind: "pfc"; aem: number; source: string }
  | { kind: "notes"; text: string; source: string };

/** A column of readings with nothing to say what they measure. */
export type MeterLog = {
  rows: number;
  total: number;
  header: string;
  meterName?: string;
};

export type Analysis = {
  fileName: string;
  readable: boolean;
  /** the text that was read, kept so the reader's own description of it can be read together with it */
  raw?: string;
  facts: Fact[];
  meter?: MeterLog;
  context: {
    /** installations named in the file (by reference or by name) */
    installationIds: string[];
    /** CN codes found, digits only */
    cns: string[];
    /** the text, lower-cased — for matching product names */
    haystack: string;
    /** every month the file mentions, with how often, as YYYY-MM */
    months: Record<string, number>;
    /** a month the file states outright ("Reporting month: …") */
    statedMonth?: string;
  };
};

/* ── Numbers and units ───────────────────────────────────────── */

const UNIT_PATTERN =
  "(?:tonnes?|tons?|mt|kg|nm3|nm³|m3|m³|litres?|liters?|l|gj|mj|kwh|mwh|gwh|t)";
const QTY = new RegExp(
  `(-?\\d[\\d,]*(?:\\.\\d+)?)\\s*(${UNIT_PATTERN})(?![a-z0-9²³])`,
  "gi",
);

function num(raw: string): number | null {
  const cleaned = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw)
    ? raw.replace(/,/g, "")
    : raw.replace(/,/g, "");
  const v = Number(cleaned);
  return Number.isFinite(v) ? v : null;
}

type Qty = {
  value: number;
  unit: "t" | "kg" | "m3" | "l" | "GJ" | "MJ" | "kWh" | "MWh" | "GWh";
  index: number;
  end: number;
};

function unitOf(raw: string): Qty["unit"] {
  const u = raw.toLowerCase();
  if (/^(t|tonnes?|tons?|mt)$/.test(u)) return "t";
  if (u === "kg") return "kg";
  if (/^(m3|m³|nm3|nm³)$/.test(u)) return "m3";
  if (/^(l|litres?|liters?)$/.test(u)) return "l";
  if (u === "gj") return "GJ";
  if (u === "mj") return "MJ";
  if (u === "kwh") return "kWh";
  if (u === "mwh") return "MWh";
  return "GWh";
}

function quantities(line: string): Qty[] {
  const out: Qty[] = [];
  for (const m of line.matchAll(QTY)) {
    const value = num(m[1]);
    if (value == null) continue;
    out.push({
      value,
      unit: unitOf(m[2]),
      index: m.index ?? 0,
      end: (m.index ?? 0) + m[0].length,
    });
  }
  return out;
}

/* ── Months ──────────────────────────────────────────────────── */

const MONTH_WORDS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];
const ym = (y: number | string, m: number | string) =>
  `${y}-${String(m).padStart(2, "0")}`;

/** Every month a piece of text mentions, as YYYY-MM, with how often. */
export function monthsIn(text: string): Record<string, number> {
  const found: Record<string, number> = {};
  const add = (key: string) => (found[key] = (found[key] ?? 0) + 1);
  /* Each pattern takes its dates out of the text before the next looks, so
     14/03/2026 is one date and not also "03/2026". */
  let t = text.replace(/\u00a0/g, " ");
  const take = (re: RegExp, key: (m: RegExpMatchArray) => string) => {
    for (const m of t.matchAll(re)) add(key(m));
    t = t.replace(re, " ");
  };
  take(
    /\b(20\d{2})[-/.](0[1-9]|1[0-2])(?:[-/.](?:0[1-9]|[12]\d|3[01]))?\b/g,
    (m) => ym(m[1], m[2]),
  );
  take(
    /\b(?:0?[1-9]|[12]\d|3[01])[/.-](0?[1-9]|1[0-2])[/.-](20\d{2})\b/g,
    (m) => ym(m[2], m[1]),
  );
  take(/\b(0?[1-9]|1[0-2])[/-](20\d{2})\b/g, (m) => ym(m[2], m[1]));
  take(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+(20\d{2})\b/gi,
    (m) => ym(m[2], MONTH_WORDS.indexOf(m[1].toLowerCase()) + 1),
  );
  return found;
}

/* ── Fuels, materials, electricity: the words people use ─────── */

const FUEL_ALIASES: [RegExp, string][] = [
  [/\bnatural gas\b|\bpipeline gas\b|\bng\b|\bpng\b|\blng\b/, "natural_gas"],
  [/\bdiesel\b|\bhsd\b|\bgas oil\b|\bgasoil\b/, "diesel"],
  [/\bheavy fuel oil\b|\bfuel oil\b|\bhfo\b|\bbunker\b/, "fuel_oil_heavy"],
  [/\blpg\b|\bliquefied petroleum\b|\bpropane\b|\bbutane\b/, "lpg"],
  [/\bcoking coal\b|\bmetallurgical coal\b|\bmet coal\b/, "coking_coal"],
  [/\bpet ?coke\b|\bpetroleum coke\b/, "petroleum_coke"],
  [/\bcoke oven gas\b|\bcog\b/, "coke_oven_gas"],
  [/\bblast furnace gas\b|\bbfg\b/, "blast_furnace_gas"],
  [/\bcoke\b/, "coke"],
  [/\banthracite\b/, "anthracite"],
  [/\bsub-?bituminous\b/, "sub_bituminous_coal"],
  [/\blignite\b|\bbrown coal\b/, "lignite"],
  [
    /\bbituminous\b|\bsteam coal\b|\bthermal coal\b|\bcoal\b/,
    "bituminous_coal",
  ],
  [/\bkerosene\b/, "kerosene"],
  [/\bpetrol\b|\bgasoline\b/, "motor_gasoline"],
  [/\brefinery gas\b/, "refinery_gas"],
  [/\bwaste oil\b|\bused oil\b/, "waste_oil"],
  [/\btyres?\b|\btires?\b|\btyre[- ]derived\b/, "waste_tyres"],
  [/\bcharcoal\b/, "charcoal"],
  [/\bbiodiesel\b/, "biodiesel"],
  [/\bbiogas\b|\blandfill gas\b/, "other_biogas"],
  [
    /\bwood chips?\b|\bwood pellets?\b|\bwood waste\b|\bsawdust\b/,
    "wood_waste",
  ],
  [
    /\brice husk\b|\bbagasse\b|\bbiomass\b|\bagricultural residue\b|\bpalm kernel\b|\bempty fruit bunch\b/,
    "biomass",
  ],
];

const MATERIAL_ALIASES: [
  RegExp,
  { id: string; method: "standard" | "mass_balance" },
][] = [
  [
    /\blimestone\b|\bcalcite\b|\bcaco3\b|\bcalcium carbonate\b/,
    { id: "CaCO3", method: "standard" },
  ],
  [
    /\bmagnesite\b|\bmgco3\b|\bmagnesium carbonate\b/,
    { id: "MgCO3", method: "standard" },
  ],
  [
    /\bsoda ash\b|\bna2co3\b|\bsodium carbonate\b/,
    { id: "Na2CO3", method: "standard" },
  ],
  [/\bbarium carbonate\b|\bbaco3\b/, { id: "BaCO3", method: "standard" }],
  [
    /\bgraphite electrodes?\b|\bcarbon electrodes?\b|\belectrodes?\b/,
    { id: "eaf_carbon_electrodes", method: "mass_balance" },
  ],
  [
    /\bcharge carbon\b|\bcarbon injection\b|\bcarburi[sz]er\b/,
    { id: "eaf_charge_carbon", method: "mass_balance" },
  ],
  [
    /\bdri\b|\bdirect reduced iron\b|\bsponge iron\b/,
    { id: "dri", method: "mass_balance" },
  ],
  [/\bhbi\b|\bhot briquetted iron\b/, { id: "hbi", method: "mass_balance" }],
];

const materialLabel = (id: string) =>
  STANDARD_MATERIALS.find((m) => m.id === id)?.label ??
  CARBON_CONTENTS.find((c) => c.material === id)?.label ??
  id;

/* ── Reading the text ────────────────────────────────────────── */

/** CSV and TSV rows become "cell  cell  cell" lines, so a table row reads like a labelled value. */
function toLines(fileName: string, text: string): string[] {
  const table = /\.(csv|tsv)$/i.test(fileName);
  const out: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (!table) {
      out.push(line);
      continue;
    }
    const cells: string[] = [];
    let cur = "";
    let quoted = false;
    const sep =
      /\.tsv$/i.test(fileName) || (line.includes("\t") && !line.includes(","))
        ? "\t"
        : line.includes(";") && !line.includes(",")
          ? ";"
          : ",";
    for (const ch of line) {
      if (ch === '"') quoted = !quoted;
      else if (ch === sep && !quoted) {
        cells.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    cells.push(cur.trim());
    out.push(cells.filter((c) => c !== "").join("   "));
  }
  return out;
}

const NCV =
  /(?:ncv|net calorific value|calorific value|heating value|lhv)\D{0,24}?(\d+(?:\.\d+)?)\s*(mj\s*\/\s*(?:m3|m³|nm3|nm³|kg|t|l|litre|liter)|gj\s*\/\s*t)/i;

function ncvFor(line: string, unit: Unit): number | undefined {
  const m = line.match(NCV);
  if (!m) return undefined;
  const v = Number(m[1]);
  const per = m[2].toLowerCase().replace(/\s+/g, "");
  if (!Number.isFinite(v)) return undefined;
  if (per === "gj/t")
    return unit === "t" ? v * 1000 : unit === "kg" ? v : undefined;
  if (per === "mj/kg")
    return unit === "kg" ? v : unit === "t" ? v * 1000 : undefined;
  if (per === "mj/t") return unit === "t" ? v : undefined;
  if (/mj\/(m3|m³|nm3|nm³)/.test(per)) return unit === "m3" ? v : undefined;
  if (/mj\/(l|litre|liter)/.test(per)) return unit === "l" ? v : undefined;
  return undefined;
}

function factorFor(line: string): number | undefined {
  const m = line.match(
    /(?:emission factor|\bef\b)\D{0,24}?(\d+(?:\.\d+)?)\s*(t\s*co2e?\s*\/\s*mwh|kg\s*co2e?\s*\/\s*kwh)/i,
  );
  if (!m) return undefined;
  const v = Number(m[1]);
  return Number.isFinite(v) ? v : undefined;
}

const stripNumbers = (line: string) => line.replace(QTY, " ").toLowerCase();

export function analyzeText(
  fileName: string,
  text: string,
  scope: {
    installations: Installation[];
    workspaces: VerificationWorkspace[];
  } = { installations: listInstallations(), workspaces: listWorkspaces() },
): Analysis {
  const lines = toLines(fileName, text);
  const facts: Fact[] = [];
  const hay = text.toLowerCase();

  for (const line of lines) {
    const lower = line.toLowerCase();
    const qs = quantities(line);

    /* Notes: a line that says so. */
    const note = line.match(
      /^(?:notes?|remarks?|comments?|observations?)\s*[:\-–]\s*(.+)$/i,
    );
    if (note) {
      facts.push({ kind: "notes", text: note[1].trim(), source: line });
      continue;
    }

    /* Anode-effect minutes per cell-day (a primary smelter's PFC block): a number with no unit the quantity reader knows. */
    const aem = lower.match(
      /(?:anode[- ]effects?|\baem\b)[^0-9\n]{0,70}?(\d+(?:\.\d+)?)/,
    );
    if (
      aem &&
      /cell[- ]?day|\baem\b/.test(lower) &&
      !facts.some((f) => f.kind === "pfc")
    ) {
      facts.push({ kind: "pfc", aem: Number(aem[1]), source: line });
      continue;
    }
    if (qs.length === 0) continue;

    /* Scrap, and how much of it came from manufacturing. The pre-consumer figure may sit on the same line ("… 1,200 t (pre-consumer 300 t)")
       or on the line below it ("of which pre-consumer 300 t"). */
    const scrapLabel = stripNumbers(line);
    if (/pre[- ]?consumer/.test(scrapLabel) && !/\bscrap\b/.test(scrapLabel)) {
      const prior = [...facts]
        .reverse()
        .find((f): f is Extract<Fact, { kind: "scrap" }> => f.kind === "scrap");
      const q = qs.find((x) => x.unit === "t" || x.unit === "kg");
      if (prior && q && prior.preConsumerT == null) {
        prior.preConsumerT = q.unit === "kg" ? q.value / 1000 : q.value;
        continue;
      }
    }
    if (
      /\bscrap\b/.test(scrapLabel) &&
      !/(price|cost|rate|per tonne|\/t\b|ratio)/.test(scrapLabel)
    ) {
      const masses = qs
        .filter((x) => x.unit === "t" || x.unit === "kg")
        .map((x) => (x.unit === "kg" ? x.value / 1000 : x.value));
      if (masses.length > 0) {
        const material = /alumin/.test(scrapLabel)
          ? "aluminium_scrap"
          : /\biron\b|cast iron/.test(scrapLabel)
            ? "iron_scrap"
            : "steel_scrap";
        facts.push({
          kind: "scrap",
          material,
          tonnes: masses[0],
          preConsumerT:
            /pre[- ]?consumer/.test(scrapLabel) && masses.length > 1
              ? masses[1]
              : undefined,
          source: line,
        });
        continue;
      }
    }

    /* Electricity: an energy unit in kWh/MWh/GWh, and not heat. */
    const energy = qs.find(
      (q) => q.unit === "kWh" || q.unit === "MWh" || q.unit === "GWh",
    );
    if (energy && !/\b(heat|steam|thermal|hot water)\b/.test(lower)) {
      const mwh =
        energy.unit === "MWh"
          ? energy.value
          : energy.unit === "kWh"
            ? energy.value / 1000
            : energy.value * 1000;
      const sourceType =
        /\bppa\b|power purchase|\bsolar\b|\bwind\b|\bhydro\b/.test(lower)
          ? "ppa"
          : /self[- ]?generat|own generation|captive|cogeneration|co-generation|on-?site generation/.test(
                lower,
              )
            ? "self_generated"
            : /direct (technical )?link|direct line/.test(lower)
              ? "direct_technical_link"
              : "grid_default";
      const named = line.match(/\(([A-Z][^)]{3,60})\)/);
      facts.push({
        kind: "electricity",
        mwh: Math.round(mwh * 1e6) / 1e6,
        sourceType,
        factor: factorFor(line),
        installation:
          sourceType === "ppa" || sourceType === "direct_technical_link"
            ? named?.[1]?.trim()
            : undefined,
        source: line,
      });
      continue;
    }

    const label = stripNumbers(line);

    /* A process material. Checked before fuels: "petroleum coke" as an electrode
       substitute is rare, and a limestone line must never read as a fuel. */
    const mat = MATERIAL_ALIASES.find(([re]) => re.test(label));
    if (mat && !/\b(fuel|burn|burned|burnt|combust)/.test(label)) {
      const q = qs.find((x) => x.unit === "t" || x.unit === "kg");
      if (q) {
        facts.push({
          kind: "process",
          materialId: mat[1].id,
          label: materialLabel(mat[1].id),
          method: mat[1].method,
          quantityT: q.unit === "kg" ? q.value / 1000 : q.value,
          source: line,
        });
        continue;
      }
    }

    /* A fuel: a fuel word and a quantity in a unit a fuel is measured in. */
    const fuel = FUEL_ALIASES.find(([re]) => re.test(label));
    if (fuel) {
      const q = qs.find(
        (x) =>
          x.unit === "t" ||
          x.unit === "kg" ||
          x.unit === "m3" ||
          x.unit === "l" ||
          x.unit === "GJ" ||
          x.unit === "MJ",
      );
      if (q) {
        const unit = (q.unit === "MJ" ? "GJ" : q.unit) as Unit; // the find() above admits only these six
        const quantity = q.unit === "MJ" ? q.value / 1000 : q.value;
        const def = FUEL_TYPES.find((f) => f.id === fuel[1]);
        facts.push({
          kind: "fuel",
          fuelType: fuel[1],
          label: def?.label ?? fuel[1],
          quantity,
          unit,
          ncvMjPerUnit: unit === "GJ" ? undefined : ncvFor(line, unit),
          source: line,
        });
        continue;
      }
    }

    /* Production: a mass, on a line about making things. */
    if (
      /\b(produc|output|manufactur|made|throughput|yield)/.test(label) &&
      !/\b(consum|input|purchas|deliver|receiv|waste|scrap|reject|off-?spec)/.test(
        label,
      )
    ) {
      const q = qs.find((x) => x.unit === "t" || x.unit === "kg");
      if (q)
        facts.push({
          kind: "production",
          tonnes: q.unit === "kg" ? q.value / 1000 : q.value,
          source: line,
        });
    }
  }

  /* Production is one number a month. If a file gives several, the one on the
     line that says "total" wins; failing that, the first. */
  const prod = facts.filter(
    (f): f is Extract<Fact, { kind: "production" }> => f.kind === "production",
  );
  if (prod.length > 1) {
    const keep = prod.find((p) => /\btotal\b/i.test(p.source)) ?? prod[0];
    for (const p of prod) if (p !== keep) facts.splice(facts.indexOf(p), 1);
  }

  const meter = facts.length === 0 ? meterLogOf(fileName, text) : undefined;

  const ids = new Set<string>();
  for (const i of scope.installations) {
    if (
      (i.id && hay.includes(i.id.toLowerCase())) ||
      (i.name.trim().length > 3 && hay.includes(i.name.trim().toLowerCase()))
    )
      ids.add(i.id);
  }
  for (const w of scope.workspaces) {
    if (
      hay.includes(w.installationId.toLowerCase()) ||
      (w.installationName.trim().length > 3 &&
        hay.includes(w.installationName.trim().toLowerCase()))
    )
      ids.add(w.installationId);
  }
  const cns = [
    ...new Set(
      [...text.matchAll(/\b(\d{4})[\s.]?(\d{2})[\s.]?(\d{2})\b/g)].map(
        (m) => `${m[1]}${m[2]}${m[3]}`,
      ),
    ),
  ];

  const months = monthsIn(text);
  const stated = lines.find(
    (l) =>
      /\b(reporting )?(month|period)\b/i.test(l) &&
      Object.keys(monthsIn(l)).length === 1,
  );
  const statedMonth = stated ? Object.keys(monthsIn(stated))[0] : undefined;

  return {
    fileName,
    readable: true,
    raw: text,
    facts,
    meter,
    context: {
      installationIds: [...ids],
      cns,
      haystack: hay,
      months,
      statedMonth,
    },
  };
}

/* ── When the file does not say what it is ──────────────────────
   A meter export has no title, an invoice has none of the labels the reader looks for, a spreadsheet is named "final_v3.csv". The file's own
   name and layout are not what makes it standard — what is in it is, and the person who has it knows. So Cera asks them to say, in a sentence
   of their own, and reads the sentence together with the file: a labelled value in it ("natural gas 182,400 m³") is a reading, a month in it is
   the month, and a word like "electricity in kWh" says what a bare column measures. */

/** What a column of bare numbers measures, from how somebody describes it — or null if the words do not settle it. */
export function meterKindFromText(text: string): string | null {
  const t = text.toLowerCase();
  const electric = /\b(electric|electricity|power|grid|ppa)\b/.test(t);
  if (/\bmwh\b/.test(t) && !/\bkwh\b/.test(t)) return "electricity_mwh";
  if (/\bkwh\b/.test(t)) return "electricity_kwh";
  if (electric) return null; // electricity with no unit: the unit is still to be asked
  if (/\b(natural gas|lng|gas)\b|\bm3\b|m³/.test(t)) return "gas_m3";
  if (/\b(diesel|gas ?oil)\b|\b(litres?|liters?)\b/.test(t)) return "diesel_l";
  if (
    /\b(produc|output|manufactur|tonnes? of (product|steel|aluminium|goods)|throughput)/.test(
      t,
    )
  )
    return "production_t";
  return null;
}

/** The analysis again, with the reader's description read alongside the file. */
export function describeAnalysis(
  a: Analysis,
  description: string,
  scope?: {
    installations: Installation[];
    workspaces: VerificationWorkspace[];
  },
): { analysis: Analysis; meterKind?: string } {
  const d = description.trim();
  const merged = analyzeText(a.fileName, `${d}\n${a.raw ?? ""}`, scope);
  const analysis: Analysis = {
    ...merged,
    raw: a.raw,
    meter: merged.facts.length === 0 ? a.meter : undefined,
  };
  const kind =
    a.meter && merged.facts.length === 0 ? meterKindFromText(d) : null;
  return { analysis, meterKind: kind ?? undefined };
}

/** Dated readings in a table with no unit and no name — what a meter exports. */
function meterLogOf(fileName: string, text: string): MeterLog | undefined {
  if (!/\.(csv|tsv)$/i.test(fileName)) return undefined;
  const rows = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (rows.length < 6) return undefined;
  const sep = rows[0].includes("\t")
    ? "\t"
    : rows[0].includes(";") && !rows[0].includes(",")
      ? ";"
      : ",";
  const split = (l: string) =>
    l.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
  const header = split(rows[0]);
  const body = rows.slice(1).map(split);
  const dateCol = header.findIndex(
    (_, c) =>
      body.filter((r) => Object.keys(monthsIn(r[c] ?? "")).length === 1)
        .length >=
      body.length * 0.8,
  );
  if (dateCol < 0) return undefined;
  const valueCol = header.findIndex(
    (_, c) =>
      c !== dateCol &&
      body.filter(
        (r) => r[c] !== undefined && r[c] !== "" && num(r[c]) !== null,
      ).length >=
        body.length * 0.8,
  );
  if (valueCol < 0) return undefined;
  const total = body.reduce((a, r) => a + (num(r[valueCol] ?? "") ?? 0), 0);
  const meterName = text.match(
    /\b(?:meter|mtr|device|point)[\s#:-]*([A-Z0-9-]{3,})/i,
  )?.[0];
  return {
    rows: body.length,
    total: Math.round(total * 1e6) / 1e6,
    header: header[valueCol],
    meterName,
  };
}

export async function analyzeFile(file: File): Promise<Analysis> {
  const { readable, text } = await readFile(file);
  if (!readable)
    return {
      fileName: file.name,
      readable: false,
      facts: [],
      context: { installationIds: [], cns: [], haystack: "", months: {} },
    };
  return analyzeText(file.name, text);
}

/* ── Where it goes ───────────────────────────────────────────── */

export type Answers = {
  workspaceId?: string;
  /** narrowing the product report in steps, when there are many: the installation, then the reporting year, then the product */
  installationId?: string;
  year?: string;
  /** the reader has already described the file in their own words, so it is not asked for again */
  described?: boolean;
  month?: string;
  meterKind?: string;
  /** the month to use when the file does not say one — the supplier's link is about one month */
  fallbackMonth?: string;
  /** the one month this conversation may write to. A supplier's link is about a single month: a file that is plainly about another
      is turned back rather than placed, and one that says nothing is taken to be about this one. */
  lockedMonth?: string;
};

const label = (w: VerificationWorkspace) =>
  `${w.productName} · ${w.installationId} · ${w.year}`;
const significant = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(" ")
    .filter(
      (t) =>
        t.length > 3 && !["with", "from", "other", "than", "made"].includes(t),
    );

/** The product reports the file points at, strongest first. Several of equal
    strength means the file does not say. */
export function candidates(
  a: Analysis,
  workspaces: VerificationWorkspace[],
): VerificationWorkspace[] {
  if (workspaces.length === 0) return [];
  const scored = workspaces.map((w) => {
    let score = 0;
    if (a.context.installationIds.includes(w.installationId)) score += 3;
    const digits = w.cnCode.replace(/\D/g, "");
    if (digits.length === 8 && a.context.cns.includes(digits)) score += 4;
    const tokens = significant(w.productName);
    const hit = tokens.filter((t) => a.context.haystack.includes(t)).length;
    if (tokens.length >= 2 && hit / tokens.length >= 0.6) score += 2;
    return { w, score };
  });
  const top = Math.max(...scored.map((s) => s.score));
  if (top === 0) return workspaces.length === 1 ? workspaces : [];
  return scored.filter((s) => s.score === top).map((s) => s.w);
}

/** "March 2026", or "มีนาคม 2026" — Thai month names, the Gregorian year (a reporting year must not turn into 2569). */
export const monthLabel = (m: string, lang: CeraLang = "en") => {
  if (lang === "en") return monthNameLong(m);
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString(dateLocaleFor(lang), {
    month: "long",
    year: "numeric",
  });
};

/** The product's name in the language of the conversation. */
const nameIn = (lang: CeraLang, name: string) =>
  lang === "en" ? name : translate(lang, name);

function monthOptions(
  w: VerificationWorkspace,
  lang: CeraLang,
): CeraChoiceOption[] {
  return monthsOf(w).map((m) => {
    const status = getMonth(w.id, m)?.status;
    return {
      id: m,
      label: monthLabel(m, lang),
      hint:
        status === "submitted" || status === "reviewed"
          ? pick(lang, "Already submitted", "ส่งแล้ว", "已提交", "पहले ही जमा")
          : status === "draft"
            ? pick(lang, "In progress", "กำลังทำ", "进行中", "प्रगति में")
            : undefined,
    };
  });
}

const meterOptions = (lang: CeraLang): CeraChoiceOption[] => [
  {
    id: "electricity_kwh",
    label: pick(lang, "Electricity", "ไฟฟ้า", "电力", "बिजली"),
    hint: pick(
      lang,
      "the readings are in kWh",
      "ค่าที่อ่านได้เป็น kWh",
      "读数单位为 kWh",
      "रीडिंग kWh में हैं",
    ),
  },
  {
    id: "electricity_mwh",
    label: pick(lang, "Electricity", "ไฟฟ้า", "电力", "बिजली"),
    hint: pick(
      lang,
      "the readings are in MWh",
      "ค่าที่อ่านได้เป็น MWh",
      "读数单位为 MWh",
      "रीडिंग MWh में हैं",
    ),
  },
  {
    id: "gas_m3",
    label: pick(lang, "Natural gas", "ก๊าซธรรมชาติ", "天然气", "प्राकृतिक गैस"),
    hint: pick(
      lang,
      "the readings are in m³",
      "ค่าที่อ่านได้เป็น m³",
      "读数单位为 m³",
      "रीडिंग m³ में हैं",
    ),
  },
  {
    id: "diesel_l",
    label: pick(lang, "Diesel", "ดีเซล", "柴油", "डीज़ल"),
    hint: pick(
      lang,
      "the readings are in litres",
      "ค่าที่อ่านได้เป็นลิตร",
      "读数单位为升",
      "रीडिंग लीटर में हैं",
    ),
  },
  {
    id: "production_t",
    label: pick(lang, "Production", "การผลิต", "产量", "उत्पादन"),
    hint: pick(
      lang,
      "the readings are tonnes of product",
      "ค่าที่อ่านได้เป็นตันของผลิตภัณฑ์",
      "读数为产品吨数",
      "रीडिंग उत्पाद के टन हैं",
    ),
  },
  {
    id: "other",
    label: pick(lang, "Something else", "อย่างอื่น", "其他", "कुछ और"),
    hint: pick(
      lang,
      "it is not a monthly reading",
      "ไม่ใช่ค่าอ่านรายเดือน",
      "它不是月度读数",
      "यह मासिक रीडिंग नहीं है",
    ),
  },
];

export type Step =
  | {
      kind: "ask";
      text: string;
      card: Extract<
        CeraCard,
        { kind: "choice" }
      > /** the reader may type a description instead of picking */;
      describe?: boolean;
    }
  /** the file says nothing Cera can place: ask the reader to say, in a sentence, what it holds */
  | { kind: "describe"; text: string }
  | { kind: "plan"; text: string; plan: ExtractionPlan }
  | { kind: "stop"; text: string };

const choice = (
  id: string,
  question: string,
  options: CeraChoiceOption[],
): Extract<CeraCard, { kind: "choice" }> => ({
  kind: "choice",
  id,
  question,
  options,
});

export function nextStep(
  a: Analysis,
  ans: Answers = {},
  workspaces: VerificationWorkspace[] = listWorkspaces(),
  lang: CeraLang = "en",
): Step {
  const T = <V>(en: V, th: V, zh?: V, hi?: V): V => pick(lang, en, th, zh, hi);
  if (!a.readable) {
    return {
      kind: "stop",
      text: T(
        `I can't open ${a.fileName} yet — I read text and CSV files. For a PDF or a photo, attach it on the month's Documents step, on the slot it belongs to.`,
        `ฉันเปิด ${a.fileName} ไม่ได้ — ฉันอ่านไฟล์ข้อความและ CSV สำหรับ PDF หรือรูปถ่าย ให้แนบที่ขั้นเอกสารของเดือน ในช่องที่ตรงกัน`,
        `我暂时无法打开 ${a.fileName} — 我只能读取文本和 CSV 文件。PDF 或照片请在当月“文件”步骤中，上传到对应的文件项。`,
        `मैं अभी ${a.fileName} नहीं खोल सकती — मैं टेक्स्ट और CSV फ़ाइलें पढ़ती हूँ। PDF या फ़ोटो के लिए उसे महीने के दस्तावेज़ चरण में, उसकी अपनी जगह पर संलग्न करें।`,
      ),
    };
  }
  if (workspaces.length === 0) {
    return {
      kind: "stop",
      text: T(
        "You don't have a product report to put readings into yet. Create one from Verification → New product report, then give me the file again.",
        "คุณยังไม่มีรายงานผลิตภัณฑ์ให้ใส่ค่าที่อ่านได้ สร้างรายงานจากการทวนสอบ → รายงานผลิตภัณฑ์ใหม่ แล้วส่งไฟล์ให้ฉันอีกครั้ง",
        "您还没有可以填入读数的产品报告。请先在“核查 → 新建产品报告”中创建一份，然后再把文件发给我。",
        "अभी आपके पास रीडिंग डालने के लिए कोई उत्पाद रिपोर्ट नहीं है। सत्यापन → नई उत्पाद रिपोर्ट से एक बनाएँ, फिर फ़ाइल मुझे दोबारा दें।",
      ),
    };
  }

  /* 1 · A column of numbers: what does it measure? */
  let facts = a.facts;
  if (a.meter && facts.length === 0) {
    if (ans.meterKind === "other") {
      return {
        kind: "stop",
        text: T(
          "Then it isn't a monthly reading I can place. Attach it on the month's Documents step so it is kept with the evidence.",
          "ถ้าอย่างนั้นก็ไม่ใช่ค่ารายเดือนที่ฉันวางลงได้ แนบที่ขั้นเอกสารของเดือน เพื่อเก็บไว้กับหลักฐาน",
          "那它就不是我能填入的月度读数。请在当月“文件”步骤中上传，与证据一并保存。",
          "तब यह ऐसी मासिक रीडिंग नहीं जिसे मैं रख सकूँ। इसे महीने के दस्तावेज़ चरण में संलग्न करें ताकि यह साक्ष्य के साथ रहे।",
        ),
      };
    }
    if (!ans.meterKind) {
      const months = Object.keys(a.context.months);
      const span =
        months.length === 1
          ? T(
              ` for ${monthLabel(months[0])}`,
              ` ของ${monthLabel(months[0], lang)}`,
              `（${monthLabel(months[0], lang)}）`,
              ` (${monthLabel(months[0], lang)})`,
            )
          : "";
      const total = a.meter.total.toLocaleString("en-GB", {
        maximumFractionDigits: 3,
      });
      return {
        kind: "ask",
        text: T(
          `I found ${a.meter.rows} dated readings${span} adding up to ${total}, but nothing in the file says what the "${a.meter.header}" column measures or in what unit.${ans.described ? "" : " Pick one below — or describe the file in your own words and I'll read that with it."}`,
          `ฉันพบค่าที่อ่านได้ที่มีวันที่ ${a.meter.rows} รายการ${span} รวมได้ ${total} แต่ในไฟล์ไม่ได้บอกว่าคอลัมน์ "${a.meter.header}" วัดอะไรหรือใช้หน่วยอะไร${ans.described ? "" : " เลือกด้านล่าง หรืออธิบายไฟล์นี้ด้วยคำพูดของคุณ แล้วฉันจะอ่านร่วมกับไฟล์"}`,
          `我找到 ${a.meter.rows} 条带日期的读数${span}，合计 ${total}，但文件中没有说明“${a.meter.header}”这一列测量的是什么、用什么单位。${ans.described ? "" : "请在下方选择，或用您自己的话描述这个文件，我会结合起来阅读。"}`,
          `मुझे ${a.meter.rows} तारीख़ वाली रीडिंग${span} मिलीं जिनका योग ${total} है, पर फ़ाइल में कहीं नहीं लिखा कि “${a.meter.header}” कॉलम क्या मापता है या किस इकाई में।${ans.described ? "" : " नीचे से कोई चुनें — या फ़ाइल का वर्णन अपने शब्दों में करें और मैं उसे साथ पढ़ लूँगी।"}`,
        ),
        card: choice(
          "meter",
          T(
            `What does ${a.meter.meterName ?? "this meter"} measure?`,
            `${a.meter.meterName ?? "มิเตอร์นี้"} วัดอะไร`,
            `${a.meter.meterName ?? "这块仪表"}测量的是什么？`,
            `${a.meter.meterName ?? "यह मीटर"} क्या मापता है?`,
          ),
          meterOptions(lang),
        ),
        describe: !ans.described,
      };
    }
    const t = a.meter.total;
    const src = `${a.meter.rows} readings in "${a.meter.header}", total ${t}`;
    facts =
      ans.meterKind === "electricity_kwh"
        ? [
            {
              kind: "electricity",
              mwh: t / 1000,
              sourceType: "grid_default",
              source: src,
            },
          ]
        : ans.meterKind === "electricity_mwh"
          ? [
              {
                kind: "electricity",
                mwh: t,
                sourceType: "grid_default",
                source: src,
              },
            ]
          : ans.meterKind === "gas_m3"
            ? [
                {
                  kind: "fuel",
                  fuelType: "natural_gas",
                  label: "Natural gas",
                  quantity: t,
                  unit: "m3",
                  source: src,
                },
              ]
            : ans.meterKind === "diesel_l"
              ? [
                  {
                    kind: "fuel",
                    fuelType: "diesel",
                    label: "Diesel",
                    quantity: t,
                    unit: "l",
                    source: src,
                  },
                ]
              : [{ kind: "production", tonnes: t, source: src }];
  }

  if (facts.length === 0 && !ans.described) {
    return {
      kind: "describe",
      text: T(
        `I read ${a.fileName}, but nothing in it tells me what it is — I found no reading I recognise (production, a fuel, electricity or a process material, each with a quantity and a unit). Say in a sentence what the document contains and I'll read that with it — for example "March gas invoice: natural gas 182,400 m³" or "meter log, electricity in kWh, April 2026".`,
        `ฉันอ่าน ${a.fileName} แล้ว แต่ไม่มีอะไรในนั้นบอกว่าเป็นเอกสารอะไร — ฉันไม่พบค่าที่รู้จัก (การผลิต เชื้อเพลิง ไฟฟ้า หรือวัตถุดิบในกระบวนการ ที่มีปริมาณและหน่วย) บอกสั้น ๆ ว่าเอกสารนี้มีอะไร แล้วฉันจะอ่านร่วมกับไฟล์ เช่น "ใบแจ้งหนี้ก๊าซเดือนมีนาคม: natural gas 182,400 m³" หรือ "บันทึกมิเตอร์ ไฟฟ้า หน่วย kWh เมษายน 2026"`,
        `我读取了 ${a.fileName}，但其中没有任何内容说明它是什么文件 — 我没有找到可识别的读数（产量、燃料、电力或工艺材料，需带数量和单位）。请用一句话说明这份文件包含什么，我会结合起来阅读 — 例如“3 月燃气发票：natural gas 182,400 m³”或“电表记录，电力，单位 kWh，2026 年 4 月”。`,
        `मैंने ${a.fileName} पढ़ी, पर उसमें कुछ भी नहीं बताता कि वह क्या है — मुझे कोई पहचानी हुई रीडिंग नहीं मिली (उत्पादन, कोई ईंधन, बिजली या प्रक्रिया सामग्री, हर एक मात्रा और इकाई के साथ)। एक वाक्य में बताएँ कि दस्तावेज़ में क्या है और मैं उसे साथ पढ़ लूँगी — जैसे “मार्च का गैस चालान: natural gas 182,400 m³” या “मीटर लॉग, बिजली kWh में, अप्रैल 2026”।`,
      ),
    };
  }
  if (facts.length === 0) {
    return {
      kind: "stop",
      text: T(
        `I read ${a.fileName} but couldn't find a reading I can place — production, a fuel, electricity or a process material with a quantity and a unit. Labelled values work best, like "Natural gas: 182,400 m3" or "Electricity: 2,140 MWh". Try another file, or attach the document on the month's Documents step.`,
        `ฉันอ่าน ${a.fileName} แล้ว แต่ไม่พบค่าที่วางลงได้ — การผลิต เชื้อเพลิง ไฟฟ้า หรือวัตถุดิบในกระบวนการที่มีปริมาณและหน่วย ค่าที่มีป้ายชื่อใช้ได้ดีที่สุด เช่น "Natural gas: 182,400 m3" หรือ "Electricity: 2,140 MWh" ลองไฟล์อื่น หรือแนบเอกสารที่ขั้นเอกสารของเดือน`,
        `我读取了 ${a.fileName}，但没有找到可以填入的读数 — 产量、燃料、电力，或带有数量和单位的工艺材料。带标签的数值最容易识别，例如“Natural gas: 182,400 m3”或“Electricity: 2,140 MWh”。请换一个文件，或在当月“文件”步骤中上传该文件。`,
        `मैंने ${a.fileName} पढ़ी पर ऐसी कोई रीडिंग नहीं मिली जिसे मैं रख सकूँ — उत्पादन, कोई ईंधन, बिजली या प्रक्रिया सामग्री जिसके साथ मात्रा और इकाई हो। नामित मान सबसे अच्छे काम करते हैं, जैसे “Natural gas: 182,400 m3” या “Electricity: 2,140 MWh”। दूसरी फ़ाइल आज़माएँ, या दस्तावेज़ को महीने के दस्तावेज़ चरण में संलग्न करें।`,
      ),
    };
  }

  /* 2 · Which product report? — ONE QUESTION AT A TIME, NAMING WHAT IS BEING CHOSEN.
     With one installation and one year, the product is all there is to ask. With several, a list of product names alone is not an answer
     anybody can give ("Wire rod" is made at two plants, in two years), so the question narrows: which installation, then which reporting year,
     then which product — each asked only if more than one is left, and the installation and year named on every option. A file that says its
     year (every month it mentions is in one) skips that question. */
  let ws = ans.workspaceId
    ? workspaces.find((w) => w.id === ans.workspaceId)
    : undefined;
  if (!ws) {
    const c = candidates(a, workspaces);
    if (c.length === 1) ws = c[0];
    else {
      const strong = c.length > 1;
      let pool = strong ? c : workspaces;
      if (ans.installationId)
        pool = pool.filter((w) => w.installationId === ans.installationId);
      const fileYears = [
        ...new Set(Object.keys(a.context.months).map((m) => m.slice(0, 4))),
      ];
      const wanted =
        ans.year ??
        (fileYears.length === 1 &&
        pool.some((w) => String(w.year) === fileYears[0])
          ? fileYears[0]
          : undefined);
      if (wanted) pool = pool.filter((w) => String(w.year) === wanted);

      const installations = [
        ...new Map(pool.map((w) => [w.installationId, w])).values(),
      ];
      if (installations.length > 1) {
        const perInstallation = (id: string) =>
          pool.filter((w) => w.installationId === id).length;
        return {
          kind: "ask",
          text: strong
            ? T(
                `This file fits product reports at ${installations.length} installations equally well.`,
                `ไฟล์นี้เข้ากับรายงานผลิตภัณฑ์ของ ${installations.length} สถานประกอบการพอ ๆ กัน`,
                `该文件与 ${installations.length} 个设施的产品报告都同样吻合。`,
                `यह फ़ाइल ${installations.length} संयंत्रों की उत्पाद रिपोर्टों में समान रूप से बैठती है।`,
              )
            : T(
                "The file doesn't say which installation it comes from — no installation reference or name I could match.",
                "ไฟล์ไม่ได้บอกว่ามาจากสถานประกอบการไหน — ไม่มีรหัสอ้างอิงหรือชื่อที่ฉันจับคู่ได้",
                "文件没有说明来自哪个设施 — 没有可供我匹配的设施编号或名称。",
                "फ़ाइल में नहीं लिखा कि वह किस संयंत्र की है — कोई संयंत्र संदर्भ या नाम नहीं जिसे मैं मिला सकूँ।",
              ),
          card: choice(
            "installation",
            T(
              "Which installation is it for?",
              "ไฟล์นี้เป็นของสถานประกอบการไหน",
              "该文件属于哪个设施？",
              "यह किस संयंत्र के लिए है?",
            ),
            installations.map((w) => ({
              id: w.installationId,
              label: w.installationName || w.installationId,
              hint: `${w.installationId} · ${T(`${perInstallation(w.installationId)} product report${perInstallation(w.installationId) === 1 ? "" : "s"}`, `รายงานผลิตภัณฑ์ ${perInstallation(w.installationId)} ฉบับ`, `${perInstallation(w.installationId)} 份产品报告`, `${perInstallation(w.installationId)} उत्पाद रिपोर्ट`)}`,
            })),
          ),
        };
      }

      const years = [...new Set(pool.map((w) => w.year))].sort((x, y) => y - x);
      if (years.length > 1) {
        const where =
          installations[0]?.installationName ||
          installations[0]?.installationId ||
          "";
        return {
          kind: "ask",
          text: T(
            `${where ? `${where} has` : "There are"} product reports for more than one reporting year, and the file doesn't say which year it belongs to.`,
            `${where ? `${where} มี` : "มี"}รายงานผลิตภัณฑ์มากกว่าหนึ่งปีรายงาน และไฟล์ไม่ได้บอกว่าเป็นของปีไหน`,
            `${where ? `${where}有` : "有"}多个报告年度的产品报告，而文件没有说明属于哪一年。`,
            `${where ? `${where} में` : "यहाँ"} एक से अधिक रिपोर्टिंग वर्ष की उत्पाद रिपोर्टें हैं, और फ़ाइल नहीं बताती कि वह किस साल की है।`,
          ),
          card: choice(
            "year",
            T(
              "Which reporting year is it for?",
              "ไฟล์นี้เป็นของปีรายงานไหน",
              "该文件属于哪个报告年度？",
              "यह किस रिपोर्टिंग वर्ष के लिए है?",
            ),
            years.map((y) => {
              const n = pool.filter((w) => w.year === y).length;
              return {
                id: String(y),
                label: String(y),
                hint: T(
                  `${n} product report${n === 1 ? "" : "s"}`,
                  `รายงานผลิตภัณฑ์ ${n} ฉบับ`,
                  `${n} 份产品报告`,
                  `${n} उत्पाद रिपोर्ट`,
                ),
              };
            }),
          ),
        };
      }

      if (pool.length === 1) ws = pool[0];
      else {
        const options = (pool.length > 0 ? pool : workspaces).map((w) => ({
          id: w.id,
          label: nameIn(lang, w.productName),
          hint: `${w.cnCode ? `CN ${w.cnCode} · ` : ""}${w.installationName || w.installationId} · ${w.year}`,
        }));
        return {
          kind: "ask",
          text: strong
            ? T(
                `This file fits ${c.length} of your product reports equally well.`,
                `ไฟล์นี้เข้ากับรายงานผลิตภัณฑ์ของคุณ ${c.length} ฉบับพอ ๆ กัน`,
                `该文件与您的 ${c.length} 份产品报告都同样吻合。`,
                `यह फ़ाइल आपकी ${c.length} उत्पाद रिपोर्टों में समान रूप से बैठती है।`,
              )
            : T(
                "The file doesn't say which product it is about — no installation reference, CN code or product name I could match.",
                "ไฟล์ไม่ได้บอกว่าเกี่ยวกับผลิตภัณฑ์ไหน — ไม่มีรหัสอ้างอิงโรงงาน รหัส CN หรือชื่อผลิตภัณฑ์ที่ฉันจับคู่ได้",
                "文件没有说明涉及哪种产品 — 没有可供我匹配的设施编号、CN 编码或产品名称。",
                "फ़ाइल नहीं बताती कि वह किस माल के बारे में है — कोई संयंत्र संदर्भ, CN कोड या माल का नाम नहीं जिसे मैं मिला सकूँ।",
              ),
          card: choice(
            "workspace",
            T(
              "Which product report is it for?",
              "ไฟล์นี้เป็นของรายงานผลิตภัณฑ์ฉบับไหน",
              "该文件属于哪份产品报告？",
              "यह किस उत्पाद रिपोर्ट के लिए है?",
            ),
            options,
          ),
        };
      }
    }
  }

  /* 3 · Which month? */
  let month = ans.month;
  if (ans.lockedMonth) {
    const stated = Object.keys(a.context.months);
    if (stated.length > 0 && !stated.includes(ans.lockedMonth)) {
      const other = stated.length === 1 ? monthLabel(stated[0], lang) : "";
      return {
        kind: "stop",
        text: T(
          `This link is for ${monthLabel(ans.lockedMonth)}, but the file is about ${stated.length === 1 ? monthLabel(stated[0]) : "other months"}. Send the document for ${monthLabel(ans.lockedMonth)}.`,
          `ลิงก์นี้เป็นของ${monthLabel(ans.lockedMonth, lang)} แต่ไฟล์เป็นของ${stated.length === 1 ? other : "เดือนอื่น"} กรุณาส่งเอกสารของ${monthLabel(ans.lockedMonth, lang)}`,
          `此链接对应${monthLabel(ans.lockedMonth, lang)}，但文件涉及的是${stated.length === 1 ? other : "其他月份"}。请发送${monthLabel(ans.lockedMonth, lang)}的文件。`,
          `यह लिंक ${monthLabel(ans.lockedMonth, lang)} के लिए है, पर फ़ाइल ${stated.length === 1 ? other : "अन्य महीनों"} के बारे में है। ${monthLabel(ans.lockedMonth, lang)} का दस्तावेज़ भेजें।`,
        ),
      };
    }
    month = ans.lockedMonth;
  }
  if (!month) {
    const here = Object.keys(a.context.months).filter((m) =>
      m.startsWith(`${ws!.year}-`),
    );
    const only =
      a.context.statedMonth && a.context.statedMonth.startsWith(`${ws.year}-`)
        ? a.context.statedMonth
        : here.length === 1
          ? here[0]
          : undefined;
    if (only && monthsOf(ws).includes(only)) month = only;
  }
  if (
    !month &&
    ans.fallbackMonth &&
    Object.keys(a.context.months).length === 0 &&
    monthsOf(ws).includes(ans.fallbackMonth)
  )
    month = ans.fallbackMonth;
  if (!month) {
    const mentioned = Object.keys(a.context.months);
    return {
      kind: "ask",
      text:
        mentioned.length > 1
          ? T(
              `The file mentions ${mentioned.length} different months, so I can't tell which one it is for.`,
              `ไฟล์กล่าวถึง ${mentioned.length} เดือนที่ต่างกัน จึงบอกไม่ได้ว่าเป็นของเดือนไหน`,
              `文件提到了 ${mentioned.length} 个不同的月份，我无法判断它属于哪一个。`,
              `फ़ाइल में ${mentioned.length} अलग-अलग महीने आए हैं, इसलिए मैं नहीं बता सकती कि वह किसके लिए है।`,
            )
          : mentioned.length === 1
            ? T(
                `The file mentions ${monthLabel(mentioned[0])}, but ${label(ws)} covers ${ws.year}.`,
                `ไฟล์กล่าวถึง${monthLabel(mentioned[0], lang)} แต่ ${nameIn(lang, ws.productName)} ครอบคลุมปี ${ws.year}`,
                `文件提到${monthLabel(mentioned[0], lang)}，但${nameIn(lang, ws.productName)}涵盖的是 ${ws.year} 年。`,
                `फ़ाइल में ${monthLabel(mentioned[0], lang)} का ज़िक्र है, पर ${nameIn(lang, ws.productName)} ${ws.year} को कवर करती है।`,
              )
            : T(
                "The file doesn't say which month it covers.",
                "ไฟล์ไม่ได้บอกว่าครอบคลุมเดือนไหน",
                "文件没有说明涵盖哪个月份。",
                "फ़ाइल नहीं बताती कि वह किस महीने को कवर करती है।",
              ),
      card: choice(
        "month",
        T(
          "Which month should I fill in?",
          "ควรกรอกเดือนไหน",
          "应该填写哪个月份？",
          "मैं कौन-सा महीना भरूँ?",
        ),
        monthOptions(ws, lang),
      ),
    };
  }

  const existing = getMonth(ws.id, month);
  if (
    existing &&
    (existing.status === "submitted" || existing.status === "reviewed")
  ) {
    return {
      kind: "stop",
      text: T(
        `${monthLabel(month)} for ${ws.productName} is already ${existing.status === "reviewed" ? "reviewed" : "submitted"}, so I won't change it. If something in it is wrong, reopen it first — on the month's screen, or by asking for an edit — and give me the file again.`,
        `${monthLabel(month, lang)} ของ ${nameIn(lang, ws.productName)} ${existing.status === "reviewed" ? "ตรวจสอบแล้ว" : "ส่งแล้ว"} ฉันจึงไม่แก้ ถ้ามีอะไรในนั้นผิด ให้เปิดเดือนนั้นใหม่ก่อน — ที่หน้าจอของเดือน หรือขอแก้ไข — แล้วส่งไฟล์ให้ฉันอีกครั้ง`,
        `${nameIn(lang, ws.productName)}的${monthLabel(month, lang)}已${existing.status === "reviewed" ? "审核" : "提交"}，因此我不会改动。如果其中有错误，请先重新开放该月份 — 在该月份页面或申请修改 — 然后再把文件发给我。`,
        `${nameIn(lang, ws.productName)} का ${monthLabel(month, lang)} पहले ही ${existing.status === "reviewed" ? "समीक्षित" : "जमा"} है, इसलिए मैं इसे नहीं बदलूँगी। अगर इसमें कुछ गलत है तो पहले इसे फिर खोलें — महीने की स्क्रीन पर, या संपादन माँगकर — और फ़ाइल मुझे दोबारा दें।`,
      ),
    };
  }

  return { kind: "plan", text: "", plan: buildPlan(a, facts, ws, month, lang) };
}

/* ── The plan: readings laid out as the form they go into ─────── */

const UNIT_TEXT: Record<Unit, string> = {
  m3: "m³",
  kg: "kg",
  t: "t",
  l: "litres",
  GJ: "GJ",
};

const UNIT_CHOICES: { id: Unit; label: string }[] = (
  Object.keys(UNIT_TEXT) as Unit[]
).map((u) => ({ id: u, label: UNIT_TEXT[u] }));
const FUEL_CHOICES = FUEL_TYPES.map((f) => ({ id: f.id, label: f.label }));
const SOURCE_CHOICES = [
  { id: "grid_default", label: "Grid" },
  { id: "ppa", label: "Power purchase agreement" },
  { id: "self_generated", label: "Self-generated" },
  { id: "direct_technical_link", label: "Direct technical link" },
];
const METHOD_CHOICES = [
  { id: "standard", label: "Standard method" },
  { id: "mass_balance", label: "Mass balance" },
];

/** The materials the form offers for a method — the standard factors, or the carbon contents of a mass balance. */
export const materialChoices = (
  method: string,
): { id: string; label: string }[] =>
  method === "mass_balance"
    ? CARBON_CONTENTS.map((c) => ({ id: c.material, label: c.label }))
    : STANDARD_MATERIALS.map((m) => ({ id: m.id, label: m.label }));

const NUMBER: ReadingInput = { kind: "number" };
const SCRAP_NAME = {
  steel_scrap: "Steel scrap",
  iron_scrap: "Iron scrap",
  aluminium_scrap: "Aluminium scrap",
} as const;

function buildPlan(
  a: Analysis,
  facts: Fact[],
  ws: VerificationWorkspace,
  month: string,
  lang: CeraLang = "en",
): ExtractionPlan {
  const readings: ExtractedReading[] = [];
  const payload: ApplyPayload = { fuels: [], electricity: [], process: [] };
  let n = 0;
  const id = () => `r${++n}`;
  let fuelNo = 0;
  let sourceNo = 0;
  let entryNo = 0;
  let scrapNo = 0;

  /** One reading, with what it needs to be edited and undone. */
  const put = (
    r: Omit<ExtractedReading, "found" | "included" | "edited">,
    extra?: { unitId?: string },
  ) =>
    readings.push({
      ...r,
      ...(extra?.unitId
        ? { unitId: extra.unitId, unitOptions: UNIT_CHOICES }
        : {}),
      found: { raw: r.raw, unitId: extra?.unitId },
      included: true,
    });

  for (const f of facts) {
    if (f.kind === "production") {
      const rid = id();
      put({
        id: rid,
        field: "production",
        input: NUMBER,
        raw: String(f.tonnes),
        section: "production",
        label: "Produced this month",
        tag: "13 · 34(a)",
        need: "required",
        value: fmt(f.tonnes),
        unit: "t",
        source: f.source,
      });
      payload.productionTonnes = f.tonnes;
    } else if (f.kind === "fuel") {
      fuelNo += 1;
      const group = `fuel${fuelNo}`;
      const ids = {
        type: id(),
        qty: id(),
        ncv: f.ncvMjPerUnit != null ? id() : undefined,
      };
      put({
        id: ids.type,
        field: "fuelType",
        input: { kind: "select", options: FUEL_CHOICES },
        raw: f.fuelType,
        section: "fuel",
        group,
        groupLabel: `Fuel ${fuelNo}`,
        label: "Fuel",
        tag: "16(a)",
        need: "required",
        value: f.label,
        source: f.source,
      });
      put(
        {
          id: ids.qty,
          field: "fuelQty",
          input: NUMBER,
          raw: String(f.quantity),
          section: "fuel",
          group,
          label: "Quantity",
          tag: "16(a)",
          need: "required",
          value: fmt(f.quantity),
          unit: UNIT_TEXT[f.unit],
          source: f.source,
        },
        { unitId: f.unit },
      );
      if (ids.ncv)
        put({
          id: ids.ncv,
          field: "fuelNcv",
          input: NUMBER,
          raw: String(f.ncvMjPerUnit),
          section: "fuel",
          group,
          label: "Calorific value",
          tag: "16(a)",
          need: "required",
          value: fmt(f.ncvMjPerUnit!),
          unit: `MJ/${UNIT_TEXT[f.unit]}`,
          source: f.source,
        });
      payload.fuels.push({
        fuelType: f.fuelType,
        quantity: f.quantity,
        unit: f.unit,
        ncvMjPerUnit: f.ncvMjPerUnit,
        readingIds: [ids.type, ids.qty, ...(ids.ncv ? [ids.ncv] : [])],
      });
    } else if (f.kind === "electricity") {
      sourceNo += 1;
      const group = `src${sourceNo}`;
      const ids = {
        from: id(),
        mwh: id(),
        factor: f.factor != null ? id() : undefined,
        inst: f.installation ? id() : undefined,
      };
      put({
        id: ids.from,
        field: "elecFrom",
        input: { kind: "select", options: SOURCE_CHOICES },
        raw: f.sourceType,
        section: "electricity",
        group,
        groupLabel: `Source ${sourceNo}`,
        label: "Where it comes from",
        tag: "12",
        need: "required",
        value: SOURCE_LABEL[f.sourceType],
        source: f.source,
      });
      put({
        id: ids.mwh,
        field: "elecMwh",
        input: NUMBER,
        raw: String(f.mwh),
        section: "electricity",
        group,
        label: "Consumed",
        tag: "10 · 12",
        need: "required",
        value: fmt(f.mwh),
        unit: "MWh",
        source: f.source,
      });
      if (ids.factor)
        put({
          id: ids.factor,
          field: "elecFactor",
          input: NUMBER,
          raw: String(f.factor),
          section: "electricity",
          group,
          label: "Emission factor",
          tag: f.sourceType === "ppa" ? "12 · 33" : "12 · 32",
          need: "required",
          value: fmt(f.factor!),
          unit: "tCO₂/MWh",
          source: f.source,
        });
      if (ids.inst)
        put({
          id: ids.inst,
          field: "elecInst",
          input: { kind: "text" },
          raw: f.installation!,
          section: "electricity",
          group,
          label: "Installation it comes from",
          tag: "11",
          need: "optional",
          value: f.installation!,
          source: f.source,
        });
      payload.electricity.push({
        sourceType: f.sourceType,
        mwh: f.mwh,
        factorTco2PerMwh: f.factor,
        supplierInstallation: f.installation,
        readingIds: [
          ids.from,
          ids.mwh,
          ...(ids.factor ? [ids.factor] : []),
          ...(ids.inst ? [ids.inst] : []),
        ],
      });
    } else if (f.kind === "process") {
      entryNo += 1;
      const group = `proc${entryNo}`;
      const ids = { method: id(), material: id(), qty: id() };
      put({
        id: ids.method,
        field: "procMethod",
        input: { kind: "select", options: METHOD_CHOICES },
        raw: f.method,
        section: "process",
        group,
        groupLabel: `Entry ${entryNo}`,
        label: "Method",
        tag: "16(a)",
        need: "required",
        value: f.method === "standard" ? "Standard method" : "Mass balance",
        source: f.source,
      });
      put({
        id: ids.material,
        field: "procMaterial",
        input: { kind: "select", options: materialChoices(f.method) },
        raw: f.materialId,
        section: "process",
        group,
        label: "Material",
        tag: "16(a)",
        need: "required",
        value: f.label,
        source: f.source,
      });
      put({
        id: ids.qty,
        field: "procQty",
        input: NUMBER,
        raw: String(f.quantityT),
        section: "process",
        group,
        label: "Quantity",
        tag: "16(a)",
        need: "required",
        value: fmt(f.quantityT),
        unit: "t",
        source: f.source,
      });
      payload.process.push({
        materialId: f.materialId,
        method: f.method,
        quantityT: f.quantityT,
        readingIds: [ids.method, ids.material, ids.qty],
      });
    } else if (f.kind === "scrap") {
      scrapNo += 1;
      const group = `scrap${scrapNo}`;
      const ids = {
        tonnes: id(),
        pre: f.preConsumerT != null ? id() : undefined,
      };
      put({
        id: ids.tonnes,
        field: "scrapTonnes",
        input: NUMBER,
        raw: String(f.tonnes),
        section: "scrap",
        group,
        groupLabel: SCRAP_NAME[f.material],
        label: "Scrap melted",
        tag: "35",
        need: "optional",
        value: fmt(f.tonnes),
        unit: "t",
        source: f.source,
      });
      if (ids.pre)
        put({
          id: ids.pre,
          field: "scrapPre",
          input: NUMBER,
          raw: String(f.preConsumerT),
          section: "scrap",
          group,
          label: "of which pre-consumer",
          tag: "35",
          need: "optional",
          value: fmt(f.preConsumerT!),
          unit: "t",
          source: f.source,
        });
      (payload.scrap ??= []).push({
        material: f.material,
        tonnes: f.tonnes,
        preConsumerT: f.preConsumerT,
        readingIds: [ids.tonnes, ...(ids.pre ? [ids.pre] : [])],
      });
    } else if (f.kind === "pfc") {
      const rid = id();
      put({
        id: rid,
        field: "pfcAem",
        input: NUMBER,
        raw: String(f.aem),
        section: "pfc",
        label: "Anode-effect minutes per cell-day",
        tag: "16(a)",
        need: "required",
        value: fmt(f.aem),
        unit: "min",
        source: f.source,
      });
      payload.pfcAem = { aem: f.aem, readingId: rid };
    } else {
      const rid = id();
      put({
        id: rid,
        field: "notes",
        input: { kind: "textarea" },
        raw: f.text,
        section: "notes",
        label: "What was missing or estimated, and anything unusual",
        tag: "16(e)",
        need: "optional",
        value: f.text,
        source: f.source,
      });
      payload.notes = payload.notes ? `${payload.notes}\n${f.text}` : f.text;
      payload.notesReadingId = rid;
    }
  }

  return {
    fileName: a.fileName,
    documentKind: kindOf(facts, a, lang),
    workspaceId: ws.id,
    workspaceLabel: `${nameIn(lang, ws.productName)} · ${ws.installationId}`,
    month,
    monthLabel: monthLabel(month, lang),
    lang,
    readings,
    payload,
  };
}

/* ── Changing what was found ─────────────────────────────────── */

/** A typed number, or null when it is not one. Commas are thousands marks. */
export function parseNumber(raw: string): number | null {
  const t = raw.trim().replace(/,/g, "");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** The choices a select reading offers right now — a material's list follows the method chosen beside it. */
export function readingOptions(
  plan: ExtractionPlan,
  r: ExtractedReading,
): { id: string; label: string }[] {
  if (r.field === "procMaterial") {
    const method =
      plan.readings.find((x) => x.group === r.group && x.field === "procMethod")
        ?.raw ?? "standard";
    return materialChoices(method);
  }
  return r.input.kind === "select" ? r.input.options : [];
}

/** The reader's change to one reading, applied: the value is re-shown the way the form shows it, the unit beside a
    quantity follows, a different method clears a material that method does not have, and the reading knows whether
    it still says what the file said. Pure — the plan comes back new. */
export function editReading(
  plan: ExtractionPlan,
  readingId: string,
  patch: { raw?: string; unitId?: string },
): ExtractionPlan {
  let readings = plan.readings.map((r) =>
    r.id === readingId
      ? {
          ...r,
          ...(patch.raw !== undefined ? { raw: patch.raw } : {}),
          ...(patch.unitId !== undefined ? { unitId: patch.unitId } : {}),
        }
      : r,
  );
  const changed = readings.find((r) => r.id === readingId);
  if (!changed) return plan;

  // A different method may not have the material that was there: ask again rather than keep a mismatch.
  if (changed.field === "procMethod") {
    const choices = materialChoices(changed.raw).map((c) => c.id);
    readings = readings.map((r) =>
      r.group === changed.group &&
      r.field === "procMaterial" &&
      !choices.includes(r.raw)
        ? { ...r, raw: "" }
        : r,
    );
  }

  const unitOf = (group?: string) =>
    readings.find((r) => r.group === group && r.field === "fuelQty")?.unitId as
      | Unit
      | undefined;
  readings = readings.map((r) => {
    let value = r.value;
    let unit = r.unit;
    if (r.input.kind === "number") {
      const num = parseNumber(r.raw);
      value = num == null ? r.raw : fmt(num);
    } else if (r.input.kind === "select") {
      value =
        readingOptions({ ...plan, readings }, r).find((o) => o.id === r.raw)
          ?.label ?? "—";
    } else {
      value = r.raw;
    }
    if (r.field === "fuelQty" && r.unitId) unit = UNIT_TEXT[r.unitId as Unit];
    if (r.field === "fuelNcv") unit = `MJ/${UNIT_TEXT[unitOf(r.group) ?? "t"]}`;
    return {
      ...r,
      value,
      unit,
      edited:
        r.raw !== r.found.raw || (r.unitId ?? "") !== (r.found.unitId ?? ""),
    };
  });
  return { ...plan, readings };
}

/** What stops the plan being applied: a figure that is not a number, or a choice left empty. Only readings that are
    still ticked count — an unticked row is not going in, so it cannot be wrong. */
export function planProblems(plan: ExtractionPlan): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of plan.readings) {
    if (!r.included) continue;
    if (r.input.kind === "number") {
      const n = parseNumber(r.raw);
      if (n == null)
        out[r.id] =
          r.raw.trim() === "" ? "Enter a number." : "That is not a number.";
      else if (n < 0) out[r.id] = "It cannot be negative.";
      else if (r.field === "fuelNcv" && n === 0)
        out[r.id] = "It has to be more than 0.";
    } else if (
      r.input.kind === "select" &&
      !readingOptions(plan, r).some((o) => o.id === r.raw)
    ) {
      out[r.id] = "Choose one.";
    } else if (
      r.format === "date" &&
      !/^\d{4}-\d{2}-\d{2}$/.test(r.raw.trim())
    ) {
      out[r.id] = "Write the date as 2025-12-31.";
    } else if (
      r.field === "precursor" &&
      r.input.kind === "text" &&
      r.raw.trim() === ""
    ) {
      out[r.id] = "Enter a value.";
    }
  }
  return out;
}

/** The plan's payload with the reader's changes in it — what is actually written. */
export function resolvePayload(plan: ExtractionPlan): ApplyPayload {
  const by = new Map(plan.readings.map((r) => [r.id, r]));
  const pick = (ids: string[], field: ReadingField) =>
    ids.map((i) => by.get(i)).find((r) => r?.field === field);
  const num = (r?: ExtractedReading) =>
    r ? (parseNumber(r.raw) ?? 0) : undefined;
  const p = plan.payload;
  const prod = plan.readings.find((r) => r.field === "production");
  const notes = p.notesReadingId
    ? by.get(p.notesReadingId)?.raw.trim()
    : undefined;

  return {
    ...p,
    productionTonnes: prod ? num(prod) : p.productionTonnes,
    fuels: p.fuels.map((f) => {
      const type = pick(f.readingIds, "fuelType");
      const qty = pick(f.readingIds, "fuelQty");
      const ncv = pick(f.readingIds, "fuelNcv");
      return {
        ...f,
        fuelType: type?.raw ?? f.fuelType,
        quantity: num(qty) ?? f.quantity,
        unit: (qty?.unitId as Unit | undefined) ?? f.unit,
        ncvMjPerUnit: ncv ? num(ncv) : undefined,
      };
    }),
    electricity: p.electricity.map((e) => {
      const from = pick(e.readingIds, "elecFrom");
      const mwh = pick(e.readingIds, "elecMwh");
      const factor = pick(e.readingIds, "elecFactor");
      const inst = pick(e.readingIds, "elecInst")?.raw.trim();
      return {
        ...e,
        sourceType:
          (from?.raw as ApplyPayload["electricity"][number]["sourceType"]) ??
          e.sourceType,
        mwh: num(mwh) ?? e.mwh,
        factorTco2PerMwh: factor ? num(factor) : undefined,
        supplierInstallation: inst || undefined,
      };
    }),
    process: p.process.map((pr) => {
      const method = pick(pr.readingIds, "procMethod");
      const material = pick(pr.readingIds, "procMaterial");
      const qty = pick(pr.readingIds, "procQty");
      return {
        ...pr,
        method: (method?.raw as "standard" | "mass_balance") ?? pr.method,
        materialId: material?.raw ?? pr.materialId,
        quantityT: num(qty) ?? pr.quantityT,
      };
    }),
    scrap: p.scrap?.map((sc) => {
      const t = pick(sc.readingIds, "scrapTonnes");
      const pre = pick(sc.readingIds, "scrapPre");
      return {
        ...sc,
        tonnes: num(t) ?? sc.tonnes,
        preConsumerT: pre ? num(pre) : undefined,
      };
    }),
    pfcAem: p.pfcAem
      ? { ...p.pfcAem, aem: num(by.get(p.pfcAem.readingId)) ?? p.pfcAem.aem }
      : undefined,
    notes: notes || undefined,
  };
}

const SOURCE_LABEL = {
  grid_default: "Grid",
  ppa: "Power purchase agreement",
  self_generated: "Self-generated",
  direct_technical_link: "Direct technical link",
} as const;

const fmt = (v: number) =>
  v.toLocaleString("en-GB", { maximumFractionDigits: 4 });

function kindOf(facts: Fact[], a: Analysis, lang: CeraLang = "en"): string {
  const kinds = new Set(facts.map((f) => f.kind));
  if (a.meter && facts.length === 1)
    return pick(lang, "meter log", "บันทึกมิเตอร์", "仪表记录", "मीटर लॉग");
  if (
    kinds.has("production") &&
    (kinds.has("fuel") || kinds.has("electricity"))
  )
    return pick(
      lang,
      "monthly operations report",
      "รายงานการดำเนินงานรายเดือน",
      "月度运营报告",
      "मासिक संचालन रिपोर्ट",
    );
  if (kinds.size === 1 && kinds.has("fuel"))
    return pick(lang, "fuel record", "บันทึกเชื้อเพลิง", "燃料记录", "ईंधन रिकॉर्ड");
  if (kinds.size === 1 && kinds.has("electricity"))
    return pick(
      lang,
      "electricity record",
      "บันทึกไฟฟ้า",
      "电力记录",
      "बिजली रिकॉर्ड",
    );
  if (kinds.size === 1 && kinds.has("production"))
    return pick(
      lang,
      "production record",
      "บันทึกการผลิต",
      "产量记录",
      "उत्पादन रिकॉर्ड",
    );
  return pick(lang, "plant record", "บันทึกของโรงงาน", "工厂记录", "प्लांट रिकॉर्ड");
}

/* ── Applying it ─────────────────────────────────────────────── */

export type Applied = {
  ok: boolean;
  message: string;
  missing: string[];
  /** the part of the month's form that took the most of what was written — where "open it" should lead */
  focus?: ExtractedReading["section"];
  /** every part of the form that took something, in the order the form shows them — one button each, so the reader can check them */
  sections: ExtractedReading["section"][];
};

const SECTION_NAME: Record<ExtractedReading["section"], string> = {
  production: "Production",
  fuel: "Fuels burned",
  electricity: "Electricity",
  process: "Process emissions",
  scrap: "Scrap",
  pfc: "PFC from anode effects",
  notes: "Gaps, estimates and notes",
  p_operator: "Operator and installation of origin",
  p_period: "Reporting period",
  p_emissions: "Specific embedded emissions",
  p_verifier: "The verifier and the verification statement",
};

/** A part of the month's form, named in the language of the conversation. */
export const sectionName = (
  lang: CeraLang,
  section: ExtractedReading["section"],
): string =>
  lang === "en"
    ? SECTION_NAME[section]
    : translate(lang, SECTION_NAME[section]);

/** Write what the reader kept ticked into the month. The month is never
    replaced: production and notes are set, fuels and electricity sources are
    matched to rows that are already there (same fuel, same source type) or
    added, and anything the form already holds that the file does not mention is
    left as it was. A submitted month is refused — see `nextStep`. */
export function applyPlan(plan: ExtractionPlan): Applied {
  const keep = new Set(
    plan.readings.filter((r) => r.included).map((r) => r.id),
  );
  const kept = (ids: string[]) => ids.every((i) => keep.has(i));
  const anyKept = (ids: string[]) => ids.some((i) => keep.has(i));

  const base =
    getMonth(plan.workspaceId, plan.month) ??
    emptyMonth(plan.workspaceId, plan.month);
  if (base.status === "submitted" || base.status === "reviewed") {
    return {
      ok: false,
      message: pick(
        plan.lang ?? "en",
        `${plan.monthLabel} is already submitted, so nothing was changed.`,
        `${plan.monthLabel} ส่งแล้ว จึงไม่มีอะไรถูกเปลี่ยน`,
        `${plan.monthLabel}已提交，因此没有做任何更改。`,
        `${plan.monthLabel} पहले ही जमा है, इसलिए कुछ नहीं बदला गया।`,
      ),
      missing: [],
      sections: [],
    };
  }
  let entry: MonthlyEntry = { ...base, status: "draft" };
  const scope = `ws:${plan.workspaceId}`;
  const marks: [string, unknown][] = [];
  const src = `Cera · ${plan.fileName}`;
  // The parts of the form that actually took something — what the buttons after "confirm" lead to.
  const wrote = new Set<ExtractedReading["section"]>();

  const p = resolvePayload(plan); // the figures as the reader left them, not as the file had them
  const prodReading = plan.readings.find((r) => r.section === "production");
  if (p.productionTonnes != null && prodReading && keep.has(prodReading.id)) {
    entry = { ...entry, productionTonnes: p.productionTonnes };
    marks.push([`${plan.month}:production`, p.productionTonnes]);
    wrote.add("production");
  }

  for (const f of p.fuels) {
    if (!anyKept(f.readingIds)) continue;
    const row =
      entry.fuels.find((x) => x.fuelType === f.fuelType) ?? emptyFuel();
    const isNew = !entry.fuels.some((x) => x.id === row.id);
    // A quantity read from a file replaces however the row found it before — a stock change or a shared meter would write over it.
    let next: FuelEntry = {
      ...row,
      fuelType: f.fuelType,
      unit: f.unit,
      quantity: f.quantity,
      stock: undefined,
      shared: undefined,
    };
    if (f.ncvMjPerUnit != null && f.unit !== "GJ") {
      // The plant's own calorific value, not the EU table's: it is a supplier figure, with the factor from the table.
      next = {
        ...next,
        factorSource: "supplier_specific",
        ncvMjPerUnit: f.ncvMjPerUnit,
        efTco2PerGj:
          euStandardFor(f.fuelType, f.unit)?.efTco2PerGj ?? next.efTco2PerGj,
      };
    } else {
      next = applyEuStandard({ ...next, factorSource: "eu_standard" });
    }
    entry = {
      ...entry,
      fuels: isNew
        ? [...entry.fuels, next]
        : entry.fuels.map((x) => (x.id === row.id ? next : x)),
    };
    marks.push([`${plan.month}:fuel:${next.id}`, f.quantity]);
    wrote.add("fuel");
  }

  for (const e of p.electricity) {
    if (!anyKept(e.readingIds)) continue;
    const sources = entry.electricitySources ?? [];
    const row = sources.find(
      (x) =>
        x.sourceType === e.sourceType && (x.mwh === 0 || sources.length === 1),
    ) ?? { ...emptyElectricitySource(), sourceType: e.sourceType };
    const next = {
      ...row,
      sourceType: e.sourceType,
      mwh: e.mwh,
      factorTco2PerMwh:
        e.sourceType === "grid_default"
          ? electricityFactorFor("grid_default")
          : (e.factorTco2PerMwh ?? row.factorTco2PerMwh ?? null),
      supplierInstallation: e.supplierInstallation ?? row.supplierInstallation,
      shared: undefined,
    };
    const exists = sources.some((x) => x.id === row.id);
    entry = {
      ...entry,
      electricitySources: exists
        ? sources.map((x) => (x.id === row.id ? next : x))
        : [...sources, next],
    };
    marks.push([`${plan.month}:elec:${next.id}`, e.mwh]);
    wrote.add("electricity");
  }

  for (const pr of p.process) {
    if (!kept(pr.readingIds)) continue;
    const base2 = emptyProcessEmissionEntry();
    const row =
      pr.method === "standard"
        ? {
            id: base2.id,
            method: "standard" as const,
            materialId: pr.materialId,
            quantityT: pr.quantityT,
            conversionFactor: 1,
          }
        : {
            id: base2.id,
            method: "mass_balance" as const,
            materialId: pr.materialId,
            quantityT: pr.quantityT,
          };
    entry = {
      ...entry,
      processEmissionEntries: [...(entry.processEmissionEntries ?? []), row],
    };
    wrote.add("process");
  }

  /* Scrap: aluminium has a block of its own; steel's is a row of the carbon balance, found by the route's own guided row. */
  const ws = getWorkspace(plan.workspaceId);
  const pack = ws ? packFor(ws) : null;
  for (const sc of p.scrap ?? []) {
    if (!kept(sc.readingIds.slice(0, 1))) continue;
    const pre =
      sc.readingIds[1] && keep.has(sc.readingIds[1])
        ? sc.preConsumerT
        : undefined;
    // The file's figure stands in for any deliveries listed for this scrap: they would write over it.
    entry = {
      ...entry,
      scrapDeliveries: (entry.scrapDeliveries ?? []).filter(
        (d) => d.material !== sc.material,
      ),
    };
    if (sc.material === "aluminium_scrap") {
      entry = {
        ...entry,
        scrap: { ...entry.scrap, tonnes: sc.tonnes, preConsumerT: pre },
      };
    } else {
      const specKey =
        pack?.materials.find((m) => m.scrap && m.materialId === sc.material)
          ?.key ?? sc.material;
      const rows = entry.processEmissionEntries ?? [];
      const at = rows.findIndex(
        (e) => e.method === "mass_balance" && e.specKey === specKey,
      );
      const row = {
        ...(at >= 0
          ? rows[at]
          : {
              id: emptyProcessEmissionEntry().id,
              method: "mass_balance" as const,
              specKey,
              materialId: sc.material,
            }),
        quantityT: sc.tonnes,
        preConsumerT: pre,
      } as ProcessEmissionEntry;
      entry = {
        ...entry,
        processEmissionEntries:
          at >= 0 ? rows.map((e, i) => (i === at ? row : e)) : [...rows, row],
      };
    }
    wrote.add("scrap");
  }
  if (p.pfcAem && keep.has(p.pfcAem.readingId) && pack?.pfc) {
    entry = {
      ...entry,
      pfc: {
        ...(entry.pfc ?? emptyPfc(pack.pfcTechnologies)),
        method: "slope",
        aem: p.pfcAem.aem,
      },
    };
    wrote.add("pfc");
  }

  if (p.notes && p.notesReadingId && keep.has(p.notesReadingId)) {
    entry = {
      ...entry,
      notes: entry.notes?.trim()
        ? `${entry.notes.trim()}\n${p.notes}`
        : p.notes,
    };
    wrote.add("notes");
  }

  const saved = saveMonth(entry);
  for (const [key, value] of marks) markAiFilled(scope, key, value, src);

  const lang = plan.lang ?? "en";
  const missing = monthIssues(saved)
    .filter((i) => i.severity === "error")
    .map((i) => i.message.split(/[.—]/)[0].trim())
    // In Thai, an issue with no Thai for it is left out rather than shown half in English.
    .map((m) => (lang === "en" ? m : translate(lang, m)))
    .filter((m) => lang === "en" || !/[A-Za-z]{4,}/.test(m));
  return {
    ok: true,
    message: pick(
      lang,
      `Filled in ${plan.monthLabel}.`,
      `ใส่ข้อมูล ${plan.monthLabel} แล้ว`,
      `已填入${plan.monthLabel}。`,
      `${plan.monthLabel} भर दिया गया।`,
    ),
    missing: [...new Set(missing)].slice(0, 4),
    focus: busiestSection(plan.readings),
    sections: inFormOrder(wrote),
  };
}

export const fuelName = (id: string) => fuelTypeLabel(id);
