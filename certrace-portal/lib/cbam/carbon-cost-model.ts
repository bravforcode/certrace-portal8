/* ════════════════════════════════════════════════════════════
   CARBON & COST — THE MODEL BEHIND THE TAB

   One row per product report (installation × good × reporting year). Everything
   on the tab is a sum, a split or a comparison of those rows, so the arithmetic
   lives here once and the screen only draws it.

   ── TWO PRICES FOR THE SAME TONNE ──────────────────────────────
   WITH YOUR DATA     the figures the plant measured (direct + electricity where
                      it counts + what the precursors carry, a precursor on a
                      default value included at its default),
                      less the free allocation an EU producer of the good gets:
                          chargeable = SEE − CBAM factor × BM*   (BM* = Column A)
   ON THE EU DEFAULT  what the importer must assume when nobody gives them a real
                      figure — the Annex I value for the good and country, with
                      the year's mark-up, less the same kind of offset:
                          chargeable = default − CBAM factor × BM   (BM = Column B)
   Both are then × tonnes shipped to the EU × the certificate price.

   This is the statutory shape (Reg. 2023/956 Art. 31 as amended by 2025/2083,
   IR 2025/2620 and 2025/2621), the same one the CN rate panel prints per tonne
   (lib/cbam/eu-rates.ts). It is NOT the flat "2.5 % payable" shortcut the
   older cost-avoidance widget uses: for a Thai scrap-EAF good the benchmark is
   a few hundredths of a tonne, so almost all of the emissions are payable from
   day one — the 2.5 % is the free-allocation phase-out, not the share of the
   emissions you pay for.

   ── WHAT IS DELIBERATELY NOT DONE ──────────────────────────────
   · The cross-sectoral correction factor (CSCF) is not in the regulations this
     was built from; it is taken as 1 and the page says so.
   · The free allocation of a bought-in precursor is not netted off (the good's
     own benchmark only), so a complex good's cost is slightly high, never low.
   · A carbon price paid at home is shown as CLAIMED and never subtracted — see
     lib/carbon-price.ts for why.
   · A figure with nothing behind it is null, never zero: a good with no
     production has no intensity, and a year before 2026 has no certificates.
   ════════════════════════════════════════════════════════════ */

import { cbamFactor, rateSheet } from "./eu-rates";

export type Currency = "THB" | "EUR" | "CNY" | "INR";
export const CURRENCIES: Currency[] = ["THB", "EUR", "CNY", "INR"];
/** the two a carbon price paid at home can be recorded in */
export type HomeCurrency = "THB" | "EUR";
/** how many of each currency one euro buys */
export type Rates = Record<Currency, number>;
export type CostReason =
  | "official"
  | "partial_year"
  | "unverified_data"
  | "no_data";

/** What a plant burned — kept as the entered quantity so the exporter's own price per unit can be applied. */
export type FuelUse = {
  key: string;
  fuelType: string;
  other?: string;
  unit: string;
  quantity: number;
};

/** The exporter's own prices. Private to the exporter: none of it travels to a plant or precursor link. */
export type CostInputs = {
  /** what the good sells for, ฿ per tonne */
  priceThbPerTonne?: number;
  /** what one piece weighs, kg — turns every per-tonne figure into a per-piece one */
  pieceKg?: number;
  /** ฿ per kWh of electricity bought */
  electricityThbPerKwh?: number;
  /** ฿ per one `unit` of a fuel, keyed by `FuelUse.key` */
  fuelThbPerUnit?: Record<string, number>;
};

export type HomeCarbonPrice = {
  amountPerTonne: number;
  currency: HomeCurrency;
  sharePct: number | null;
  rebatePerTonne: number;
};

export type CostMonth = {
  month: string;
  tonnes: number;
  directT: number;
  indirectT: number;
  precursorT: number;
};

export type CostFacts = {
  id: string;
  installationId: string;
  installationName: string;
  productId: string;
  productName: string;
  cnCode: string;
  year: number;
  country: string;
  /** the CBAM route letter of the plant's production route (E scrap-EAF, L secondary aluminium…) */
  routeLetter?: string;
  /** does electricity enter the chargeable figure for this good? (Annex II: not for steel and aluminium) */
  indirectCounted: boolean;
  /** tonnes made in the months that count */
  tonnes: number;
  monthsCounted: number;
  /** tCO₂e carried by those tonnes */
  directT: number;
  indirectT: number;
  precursorT: number;
  /** the part of `precursorT` that rests on a published default, 0–1 */
  precursorDefaultShare: number;
  months: CostMonth[];
  reason: CostReason;
  /** tonnes shipped to the EU in the year, when the exporter has said — null = not entered */
  euTonnes: number | null;
  energy: { fuels: FuelUse[]; electricityKwh: number };
  inputs: CostInputs | null;
  homePrice: HomeCarbonPrice | null;
};

export type CostEnv = {
  /** the certificate price for a year, EUR per tCO₂e, with the period it was published for */
  certificatePrice: (
    year: number,
  ) => { eurPerTonne: number; label: string } | null;
  eurToThb: number;
  /** every currency the pages can show, per euro (THB is the same figure as `eurToThb`) */
  rates: Rates;
};

const finite = (v: number | null | undefined): number | null =>
  v != null && Number.isFinite(v) ? v : null;
const MONTHS = 12;

export type EnergyCost = {
  fuelThb: number | null;
  electricityThb: number | null;
  /** only when every fuel and the electricity that was used has a price */
  totalThb: number | null;
  /** what the prices given so far add up to, when some are still missing */
  partialThb: number;
  missing: string[];
  perTonneThb: number | null;
};

export type PricedRow = {
  facts: CostFacts;
  /** tonnes produced, carried to a full year when asked */
  tonnes: number;
  /** the share of the year that is measured, 0–1 */
  monthsShare: number;
  projected: boolean;
  directT: number;
  indirectT: number;
  precursorT: number;
  precursorDefaultT: number;
  embeddedT: number | null;
  /** tCO₂e per tonne of good */
  see: {
    direct: number;
    indirect: number;
    precursor: number;
    total: number;
    chargeable: number;
  } | null;
  /** the EU default for the good and country, tCO₂e/t with the year's mark-up */
  defaultValue: number | null;
  defaultMarkup: number | null;
  defaultUsedOther: boolean;
  /** how far below the default the chargeable figure sits, %. Positive = better. */
  gapPct: number | null;
  verdict: "below" | "level" | "above" | null;
  cbamFactor: number | null;
  benchmarkActual: number | null;
  benchmarkDefault: number | null;
  /** chargeable tCO₂e per tonne of good after the free allocation */
  chargeableActualPerT: number | null;
  chargeableDefaultPerT: number | null;
  price: { eurPerTonne: number; label: string } | null;
  /** the tonnes the certificate bill is on */
  costTonnes: number;
  costBasis: "eu" | "produced";
  costActualEur: number | null;
  costDefaultEur: number | null;
  /** default − actual. Positive = the plant's own data is cheaper. */
  savingEur: number | null;
  savingPct: number | null;
  claimedEur: number | null;
  energy: EnergyCost;
  /** why the cost is not a number, when it is not */
  costNote: "before_2026" | "no_price" | "no_production" | "no_default" | null;
};

export function energyCostOf(f: CostFacts): EnergyCost {
  const prices = f.inputs?.fuelThbPerUnit ?? {};
  const missing: string[] = [];
  let fuel = 0;
  let fuelUsed = false;
  for (const u of f.energy.fuels) {
    if (!(u.quantity > 0)) continue;
    fuelUsed = true;
    const p = prices[u.key];
    if (p == null || !Number.isFinite(p) || p < 0) missing.push(u.key);
    else fuel += u.quantity * p;
  }
  const elecUsed = f.energy.electricityKwh > 0;
  const ep = f.inputs?.electricityThbPerKwh;
  const elecPriced = ep != null && Number.isFinite(ep) && ep >= 0;
  if (elecUsed && !elecPriced) missing.push("electricity");
  const electricity = elecUsed && elecPriced ? f.energy.electricityKwh * ep : 0;
  const used = fuelUsed || elecUsed;
  const totalThb = used && missing.length === 0 ? fuel + electricity : null;
  return {
    fuelThb:
      fuelUsed &&
      !f.energy.fuels.some((u) => u.quantity > 0 && missing.includes(u.key))
        ? fuel
        : null,
    electricityThb: elecUsed && elecPriced ? electricity : null,
    totalThb,
    partialThb: fuel + electricity,
    missing,
    perTonneThb: totalThb != null && f.tonnes > 0 ? totalThb / f.tonnes : null,
  };
}

export function priceFacts(
  f: CostFacts,
  env: CostEnv,
  project = false,
): PricedRow {
  const projected = project && f.monthsCounted > 0 && f.monthsCounted < MONTHS;
  const scale = projected ? MONTHS / f.monthsCounted : 1;
  const tonnes = f.tonnes * scale;
  const directT = f.directT * scale;
  const indirectT = f.indirectT * scale;
  const precursorT = f.precursorT * scale;
  const hasProduction = f.tonnes > 0 && f.monthsCounted > 0;

  const see = hasProduction
    ? (() => {
        const direct = f.directT / f.tonnes;
        const indirect = f.indirectT / f.tonnes;
        const precursor = f.precursorT / f.tonnes;
        const total = direct + indirect + precursor;
        const chargeable =
          direct + precursor + (f.indirectCounted ? indirect : 0);
        return [direct, indirect, precursor, total, chargeable].every(
          Number.isFinite,
        )
          ? { direct, indirect, precursor, total, chargeable }
          : null;
      })()
    : null;

  const inDefinitivePeriod = f.year >= 2026;
  const factor = inDefinitivePeriod ? cbamFactor(f.year) : null;
  const sheetDefault =
    inDefinitivePeriod && f.cnCode
      ? rateSheet({ cn: f.cnCode, country: f.country, year: f.year })
      : null;
  const sheetActual =
    inDefinitivePeriod && f.cnCode
      ? rateSheet({
          cn: f.cnCode,
          country: f.country,
          year: f.year,
          routeLetter: f.routeLetter,
        })
      : null;

  const defaultValue = finite(sheetDefault?.defaultValue);
  const benchmarkDefault = finite(sheetDefault?.benchmark.default);
  const benchmarkActual = finite(sheetActual?.benchmark.process);
  const freeDefault = sheetDefault?.freeAllocation ?? 0;
  const freeActual =
    factor != null && benchmarkActual != null ? factor * benchmarkActual : 0;

  const chargeableDefaultPerT =
    defaultValue != null ? Math.max(0, defaultValue - freeDefault) : null;
  const chargeableActualPerT = see
    ? Math.max(0, see.chargeable - freeActual)
    : null;

  const gapPct =
    see && defaultValue != null && defaultValue > 0
      ? ((defaultValue - see.chargeable) / defaultValue) * 100
      : null;
  const verdict =
    gapPct == null
      ? null
      : Math.abs(gapPct) < 2
        ? "level"
        : gapPct > 0
          ? "below"
          : "above";

  const price = factor != null ? env.certificatePrice(f.year) : null;
  const useEu = f.euTonnes != null && f.euTonnes > 0;
  const costTonnes = useEu ? (f.euTonnes as number) : tonnes;

  const costNote: PricedRow["costNote"] = !inDefinitivePeriod
    ? "before_2026"
    : !see
      ? "no_production"
      : defaultValue == null
        ? "no_default"
        : !price
          ? "no_price"
          : null;

  const costActualEur =
    costNote === null && chargeableActualPerT != null && price
      ? chargeableActualPerT * costTonnes * price.eurPerTonne
      : null;
  const costDefaultEur =
    costNote === null && chargeableDefaultPerT != null && price
      ? chargeableDefaultPerT * costTonnes * price.eurPerTonne
      : null;
  const savingEur =
    costActualEur != null && costDefaultEur != null
      ? costDefaultEur - costActualEur
      : null;
  const savingPct =
    savingEur != null && costDefaultEur != null && costDefaultEur > 0
      ? (savingEur / costDefaultEur) * 100
      : null;

  /* A claimed home carbon price, in euros, up to what the certificates would cost. Never subtracted from anything above. */
  let claimedEur: number | null = null;
  const hp = f.homePrice;
  if (
    hp &&
    hp.amountPerTonne > 0 &&
    hp.sharePct != null &&
    costActualEur != null &&
    see
  ) {
    const net = Math.max(0, hp.amountPerTonne - Math.max(0, hp.rebatePerTonne));
    const perTonne = hp.currency === "THB" ? net / env.eurToThb : net;
    claimedEur = Math.min(
      costActualEur,
      perTonne * (hp.sharePct / 100) * see.chargeable * costTonnes,
    );
  }

  return {
    facts: f,
    tonnes,
    monthsShare: f.monthsCounted / MONTHS,
    projected,
    directT,
    indirectT,
    precursorT,
    precursorDefaultT: precursorT * f.precursorDefaultShare,
    embeddedT: hasProduction ? directT + indirectT + precursorT : null,
    see,
    defaultValue,
    defaultMarkup: finite(sheetDefault?.markup),
    defaultUsedOther: Boolean(sheetDefault?.lookup.usedOther),
    gapPct,
    verdict,
    cbamFactor: factor,
    benchmarkActual,
    benchmarkDefault,
    chargeableActualPerT,
    chargeableDefaultPerT,
    price,
    costTonnes,
    costBasis: useEu ? "eu" : "produced",
    costActualEur,
    costDefaultEur,
    savingEur,
    savingPct,
    claimedEur,
    energy: energyCostOf(f),
    costNote,
  };
}

/* ── Totals, and the three ways to group them ───────────────────── */

export type Totals = {
  rows: number;
  tonnes: number;
  embeddedT: number | null;
  directT: number;
  indirectT: number;
  precursorT: number;
  precursorDefaultT: number;
  /** what the certificate bill is raised on, before free allocation: direct + precursor (+ electricity where it counts) */
  chargeableT: number | null;
  /** the same production read at the EU default, and your figure for only those rows — so the two compare like with like */
  comparableDefaultT: number | null;
  comparableChargeableT: number | null;
  /** rows whose cost is a number */
  pricedRows: number;
  costActualEur: number | null;
  costDefaultEur: number | null;
  savingEur: number | null;
  savingPct: number | null;
  /** rows whose cost assumes all production went to the EU because no volume was entered */
  assumedRows: number;
  claimedEur: number | null;
  /** tCO₂e per tonne — only when the rows all make the same good; blended per-tonne figures across goods mean nothing */
  seePerT: number | null;
  defaultPerT: number | null;
  gapPct: number | null;
  months: number;
  monthsPossible: number;
  official: number;
};

const sumOrNull = (xs: (number | null)[]): number | null => {
  const ok = xs.filter((x): x is number => x != null);
  return ok.length === 0 ? null : ok.reduce((a, b) => a + b, 0);
};

export function totalsOf(rows: PricedRow[]): Totals {
  const priced = rows.filter(
    (r) => r.costActualEur != null && r.costDefaultEur != null,
  );
  const costActualEur = sumOrNull(priced.map((r) => r.costActualEur));
  const costDefaultEur = sumOrNull(priced.map((r) => r.costDefaultEur));
  const savingEur =
    costActualEur != null && costDefaultEur != null
      ? costDefaultEur - costActualEur
      : null;
  const withData = rows.filter((r) => r.embeddedT != null);
  const sameGood = new Set(rows.map((r) => r.facts.productId)).size === 1;
  const tonnesOfSame = withData.reduce((a, r) => a + r.tonnes, 0);
  const seePerT =
    sameGood && tonnesOfSame > 0
      ? withData.reduce((a, r) => a + (r.see?.chargeable ?? 0) * r.tonnes, 0) /
        tonnesOfSame
      : null;
  const defTonnes = withData
    .filter((r) => r.defaultValue != null)
    .reduce((a, r) => a + r.tonnes, 0);
  const defaultPerT =
    sameGood && defTonnes > 0
      ? withData
          .filter((r) => r.defaultValue != null)
          .reduce((a, r) => a + (r.defaultValue ?? 0) * r.tonnes, 0) / defTonnes
      : null;
  const compDef = sumOrNull(
    withData.map((r) =>
      r.defaultValue != null ? r.defaultValue * r.tonnes : null,
    ),
  );
  const compCh = sumOrNull(
    withData.map((r) =>
      r.defaultValue != null && r.see ? r.see.chargeable * r.tonnes : null,
    ),
  );
  const gapPct =
    compDef != null && compCh != null && compDef > 0
      ? ((compDef - compCh) / compDef) * 100
      : null;
  return {
    rows: rows.length,
    tonnes: rows.reduce((a, r) => a + r.tonnes, 0),
    embeddedT: sumOrNull(rows.map((r) => r.embeddedT)),
    directT: rows.reduce(
      (a, r) => a + (r.embeddedT != null ? r.directT : 0),
      0,
    ),
    indirectT: rows.reduce(
      (a, r) => a + (r.embeddedT != null ? r.indirectT : 0),
      0,
    ),
    precursorT: rows.reduce(
      (a, r) => a + (r.embeddedT != null ? r.precursorT : 0),
      0,
    ),
    precursorDefaultT: rows.reduce(
      (a, r) => a + (r.embeddedT != null ? r.precursorDefaultT : 0),
      0,
    ),
    chargeableT: sumOrNull(
      withData.map((r) => (r.see ? r.see.chargeable * r.tonnes : null)),
    ),
    comparableDefaultT: sumOrNull(
      withData.map((r) =>
        r.defaultValue != null ? r.defaultValue * r.tonnes : null,
      ),
    ),
    comparableChargeableT: sumOrNull(
      withData.map((r) =>
        r.defaultValue != null && r.see ? r.see.chargeable * r.tonnes : null,
      ),
    ),
    pricedRows: priced.length,
    costActualEur,
    costDefaultEur,
    savingEur,
    savingPct:
      savingEur != null && costDefaultEur != null && costDefaultEur > 0
        ? (savingEur / costDefaultEur) * 100
        : null,
    assumedRows: priced.filter((r) => r.costBasis === "produced").length,
    claimedEur: sumOrNull(rows.map((r) => r.claimedEur)),
    seePerT,
    defaultPerT,
    gapPct,
    months: rows.reduce((a, r) => a + r.facts.monthsCounted, 0),
    monthsPossible: rows.length * MONTHS,
    official: rows.filter((r) => r.facts.reason === "official").length,
  };
}

export type Dim = "installation" | "product" | "year";
export const DIMS: Dim[] = ["installation", "product", "year"];

export type Group = {
  key: string;
  dim: Dim;
  label: string;
  /** a second line that is a proper noun or a number, never a phrase */
  hint: string | null;
  rows: PricedRow[];
  totals: Totals;
  children: Group[];
};

const keyOf = (
  r: PricedRow,
  dim: Dim,
): { key: string; label: string; hint: string | null } => {
  const f = r.facts;
  if (dim === "installation")
    return { key: f.installationId, label: f.installationName, hint: null };
  if (dim === "year")
    return { key: String(f.year), label: String(f.year), hint: null };
  return {
    key: f.productId,
    label: f.productName,
    hint: f.cnCode ? `CN ${f.cnCode}` : null,
  };
};

export function groupRows(
  rows: PricedRow[],
  dim: Dim,
  then: Dim | null = null,
): Group[] {
  const map = new Map<string, Group>();
  for (const r of rows) {
    const k = keyOf(r, dim);
    const g = map.get(k.key) ?? {
      key: k.key,
      dim,
      label: k.label,
      hint: k.hint,
      rows: [],
      totals: totalsOf([]),
      children: [],
    };
    g.rows.push(r);
    map.set(k.key, g);
  }
  const out = [...map.values()].map((g) => ({
    ...g,
    totals: totalsOf(g.rows),
    children: then && then !== dim ? groupRows(g.rows, then, null) : [],
  }));
  return out.sort(
    (a, b) =>
      (b.totals.costDefaultEur ?? b.totals.embeddedT ?? 0) -
        (a.totals.costDefaultEur ?? a.totals.embeddedT ?? 0) ||
      a.label.localeCompare(b.label),
  );
}

/* ── The months, drawn ───────────────────────────────────────────── */

export type MonthPoint = {
  month: string;
  tonnes: number;
  /** everything reported: direct + electricity + precursors */
  actualT: number;
  /** what the certificate bill is raised on: electricity only where it counts */
  chargeableT: number;
  defaultT: number;
  directT: number;
  indirectT: number;
  precursorT: number;
  projected: boolean;
};

/** Embedded tCO₂e month by month across the rows, with the EU default for the same tonnes beside it. The default is compared with the
    CHARGEABLE figure, not the whole embedded one: for steel and aluminium the electricity is reported but not charged, and the Annex I
    default has no electricity in it either. A good with no default on file is drawn at its own figure on both lines so the two stay about
    the same goods. With the full-year estimate on, the months with nothing in
    them are carried at the plant's average month and marked `projected`. */
export function monthlySeries(rows: PricedRow[]): MonthPoint[] {
  const by = new Map<string, MonthPoint>();
  const touch = (month: string, projected: boolean): MonthPoint => {
    const cur = by.get(month) ?? {
      month,
      tonnes: 0,
      actualT: 0,
      chargeableT: 0,
      defaultT: 0,
      directT: 0,
      indirectT: 0,
      precursorT: 0,
      projected,
    };
    if (!projected) cur.projected = false;
    by.set(month, cur);
    return cur;
  };
  for (const r of rows) {
    if (!r.see) continue;
    const dv = r.defaultValue;
    for (const m of r.facts.months) {
      if (!(m.tonnes > 0)) continue;
      const p = touch(m.month, false);
      const total = m.directT + m.indirectT + m.precursorT;
      const charge =
        m.directT + m.precursorT + (r.facts.indirectCounted ? m.indirectT : 0);
      p.tonnes += m.tonnes;
      p.directT += m.directT;
      p.indirectT += m.indirectT;
      p.precursorT += m.precursorT;
      p.actualT += total;
      p.chargeableT += charge;
      p.defaultT += dv != null ? dv * m.tonnes : charge;
    }
    if (r.projected) {
      const have = new Set(
        r.facts.months.filter((m) => m.tonnes > 0).map((m) => m.month),
      );
      const avg = r.facts.tonnes / r.facts.monthsCounted;
      for (let i = 1; i <= MONTHS; i += 1) {
        const month = `${r.facts.year}-${String(i).padStart(2, "0")}`;
        if (have.has(month)) continue;
        const p = touch(month, true);
        const total = avg * (r.see.direct + r.see.indirect + r.see.precursor);
        const charge = avg * r.see.chargeable;
        p.tonnes += avg;
        p.directT += avg * r.see.direct;
        p.indirectT += avg * r.see.indirect;
        p.precursorT += avg * r.see.precursor;
        p.actualT += total;
        p.chargeableT += charge;
        p.defaultT += dv != null ? dv * avg : charge;
      }
    }
  }
  return [...by.values()].sort((a, b) => a.month.localeCompare(b.month));
}

/* ── Per unit ────────────────────────────────────────────────────── */

export type UnitCosts = {
  /** ฿ per tonne of good, or per piece when the piece weight is known */
  energyThb: number | null;
  carbonThb: number | null;
  carbonDefaultThb: number | null;
  priceThb: number | null;
  energyPctOfPrice: number | null;
  carbonPctOfPrice: number | null;
  carbonDefaultPctOfPrice: number | null;
  /** what is left of the price after energy and carbon — not profit: every other cost is still in it */
  restThb: number | null;
};

export function unitCostsOf(
  r: PricedRow,
  env: CostEnv,
  unit: "tonne" | "piece",
): UnitCosts | null {
  const kg = r.facts.inputs?.pieceKg;
  const per = unit === "piece" ? (kg != null && kg > 0 ? kg / 1000 : null) : 1;
  if (per == null) return null;
  const toThb = (eurPerT: number | null) =>
    eurPerT == null ? null : eurPerT * env.eurToThb * per;
  const price = r.price?.eurPerTonne ?? null;
  const energy =
    r.energy.perTonneThb != null ? r.energy.perTonneThb * per : null;
  const carbon =
    price != null && r.chargeableActualPerT != null
      ? toThb(r.chargeableActualPerT * price)
      : null;
  const carbonDefault =
    price != null && r.chargeableDefaultPerT != null
      ? toThb(r.chargeableDefaultPerT * price)
      : null;
  const sell = r.facts.inputs?.priceThbPerTonne;
  const priceThb = sell != null && sell > 0 ? sell * per : null;
  const pct = (x: number | null) =>
    x != null && priceThb != null ? (x / priceThb) * 100 : null;
  return {
    energyThb: energy,
    carbonThb: carbon,
    carbonDefaultThb: carbonDefault,
    priceThb,
    energyPctOfPrice: pct(energy),
    carbonPctOfPrice: pct(carbon),
    carbonDefaultPctOfPrice: pct(carbonDefault),
    restThb:
      priceThb != null && energy != null && carbon != null
        ? priceThb - energy - carbon
        : null,
  };
}

/* ── Money ───────────────────────────────────────────────────────── */
export const toCurrency = (
  eur: number,
  currency: Currency,
  env: Pick<CostEnv, "rates">,
): number => eur * env.rates[currency];
