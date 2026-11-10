/* ════════════════════════════════════════════════════════════
   CARBON & COST — SAMPLE NUMBERS

   Test-only figures for a fictional steel and aluminium exporter. They go
   through the same pricing as real rows; the plant readings, volumes and
   prices are made up.

   Deterministic (seeded), so a screenshot, a test and a reload all agree.
   ════════════════════════════════════════════════════════════ */

import type { CostFacts, CostMonth, FuelUse } from "../../carbon-cost-model";

/** Small seeded generator — the same sequence for the same seed, every time. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Spec = {
  id: string;
  inst: [string, string];
  productId: string;
  name: string;
  cn: string;
  letter: string;
  indirectCounted: boolean;
  /** tonnes made in a month */
  monthly: number;
  direct: number;
  indirect: number;
  precursor: number;
  precursorDefaultShare: number;
  kwhPerT: number;
  fuels: { fuelType: string; unit: string; perT: number; thbPerUnit: number }[];
  thbElectricity: number;
  sellThbPerT: number;
  pieceKg?: number;
  home?: { amountPerTonne: number; sharePct: number };
  /** per year: how many months are in, and the tonnes shipped to the EU (null = not entered) */
  years: Record<number, { months: number; eu: number | null }>;
};

const SPECS: Spec[] = [
  {
    id: "billet",
    inst: ["TH-RAYONG-01", "Rayong Steel Works"],
    productId: "billet",
    name: "Steel billet",
    cn: "7207 11 11",
    letter: "E",
    indirectCounted: false,
    monthly: 2150,
    direct: 0.22,
    indirect: 0.26,
    precursor: 0,
    precursorDefaultShare: 0,
    kwhPerT: 520,
    fuels: [
      { fuelType: "natural_gas", unit: "m3", perT: 9, thbPerUnit: 17.8 },
      { fuelType: "coke", unit: "t", perT: 0.012, thbPerUnit: 11200 },
    ],
    thbElectricity: 4.15,
    sellThbPerT: 21500,
    pieceKg: 796,
    years: { 2026: { months: 9, eu: 8600 }, 2027: { months: 3, eu: 3100 } },
  },
  {
    id: "rebar",
    inst: ["TH-RAYONG-01", "Rayong Steel Works"],
    productId: "rebar",
    name: "Reinforcing bar",
    cn: "7214 20 00",
    letter: "E",
    indirectCounted: false,
    monthly: 1380,
    direct: 0.31,
    indirect: 0.29,
    precursor: 0.18,
    precursorDefaultShare: 0,
    kwhPerT: 95,
    fuels: [
      { fuelType: "natural_gas", unit: "m3", perT: 28, thbPerUnit: 17.8 },
    ],
    thbElectricity: 4.15,
    sellThbPerT: 23800,
    pieceKg: 10.65,
    years: { 2026: { months: 10, eu: 7000 } },
  },
  {
    id: "hrc",
    inst: ["TH-CHONBURI-01", "Chonburi Rolling Mill"],
    productId: "hrc",
    name: "Hot-rolled coil",
    cn: "7208 39 00",
    letter: "E",
    indirectCounted: false,
    monthly: 1150,
    direct: 0.38,
    indirect: 0.31,
    precursor: 0.52,
    precursorDefaultShare: 0.34,
    kwhPerT: 75,
    fuels: [
      { fuelType: "natural_gas", unit: "m3", perT: 34, thbPerUnit: 17.8 },
    ],
    thbElectricity: 4.05,
    sellThbPerT: 19900,
    pieceKg: 18000,
    years: { 2026: { months: 10, eu: null }, 2027: { months: 3, eu: 5200 } },
  },
  {
    id: "galv",
    inst: ["TH-CHONBURI-01", "Chonburi Rolling Mill"],
    productId: "galv",
    name: "Galvanised sheet",
    cn: "7210 49 00",
    letter: "E",
    indirectCounted: false,
    monthly: 940,
    direct: 0.74,
    indirect: 0.27,
    precursor: 0.61,
    precursorDefaultShare: 0.22,
    kwhPerT: 120,
    fuels: [
      { fuelType: "natural_gas", unit: "m3", perT: 30, thbPerUnit: 17.8 },
      { fuelType: "lpg", unit: "kg", perT: 4.5, thbPerUnit: 29 },
    ],
    thbElectricity: 4.05,
    sellThbPerT: 27400,
    pieceKg: 7.85,
    years: { 2026: { months: 10, eu: 4500 }, 2027: { months: 2, eu: 900 } },
  },
  {
    id: "al-sheet",
    inst: ["TH-SAMUTPRAKAN-01", "Samut Prakan Aluminium"],
    productId: "al-sheet",
    name: "Aluminium sheet",
    cn: "7606 12 00",
    letter: "L",
    indirectCounted: false,
    monthly: 520,
    direct: 0.36,
    indirect: 0.62,
    precursor: 0.2,
    precursorDefaultShare: 0.12,
    kwhPerT: 700,
    fuels: [
      { fuelType: "natural_gas", unit: "m3", perT: 120, thbPerUnit: 17.8 },
    ],
    thbElectricity: 4.3,
    sellThbPerT: 92000,
    pieceKg: 12.06,
    home: { amountPerTonne: 200, sharePct: 18 },
    years: { 2026: { months: 10, eu: 2100 }, 2027: { months: 0, eu: null } },
  },
];

function monthsOf(year: number, n: number): string[] {
  return Array.from(
    { length: n },
    (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`,
  );
}

export function sampleCostFacts(): CostFacts[] {
  const out: CostFacts[] = [];
  let seed = 11;
  for (const s of SPECS) {
    for (const [y, cfg] of Object.entries(s.years)) {
      const year = Number(y);
      const rand = rng((seed += 7));
      const months: CostMonth[] = monthsOf(year, cfg.months).map((month) => {
        const tonnes = Math.round(s.monthly * (0.86 + rand() * 0.28));
        const wob = () => 0.93 + rand() * 0.14;
        return {
          month,
          tonnes,
          directT: tonnes * s.direct * wob(),
          indirectT: tonnes * s.indirect * wob(),
          precursorT: tonnes * s.precursor * wob(),
        };
      });
      const tonnes = months.reduce((a, m) => a + m.tonnes, 0);
      const fuels: FuelUse[] = s.fuels.map((f) => ({
        key: `${f.fuelType}|${f.unit}`,
        fuelType: f.fuelType,
        unit: f.unit,
        quantity: Math.round(f.perT * tonnes * 100) / 100,
      }));
      out.push({
        id: `sample-${s.id}-${year}`,
        installationId: s.inst[0],
        installationName: s.inst[1],
        productId: s.productId,
        productName: s.name,
        cnCode: s.cn,
        year,
        country: "TH",
        routeLetter: s.letter,
        indirectCounted: s.indirectCounted,
        tonnes,
        monthsCounted: cfg.months,
        directT: months.reduce((a, m) => a + m.directT, 0),
        indirectT: months.reduce((a, m) => a + m.indirectT, 0),
        precursorT: months.reduce((a, m) => a + m.precursorT, 0),
        precursorDefaultShare: s.precursorDefaultShare,
        months,
        reason:
          cfg.months === 0
            ? "no_data"
            : cfg.months >= 12
              ? "official"
              : "partial_year",
        euTonnes: cfg.eu,
        energy: { fuels, electricityKwh: s.kwhPerT * tonnes },
        inputs: {
          priceThbPerTonne: s.sellThbPerT,
          pieceKg: s.pieceKg,
          electricityThbPerKwh: s.thbElectricity,
          fuelThbPerUnit: Object.fromEntries(
            s.fuels.map((f) => [`${f.fuelType}|${f.unit}`, f.thbPerUnit]),
          ),
        },
        homePrice:
          s.home && year === 2026
            ? {
                amountPerTonne: s.home.amountPerTonne,
                currency: "THB",
                sharePct: s.home.sharePct,
                rebatePerTonne: 0,
              }
            : null,
      });
    }
  }
  return out;
}
