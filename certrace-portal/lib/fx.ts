import { decimal, decimalToString } from "./mrv";

export type ThbEurRate = {
  thbPerEur: string;
  asOf: string;
  source: "ecb" | "cache" | "fallback";
  stale: boolean;
};

export const FALLBACK_THB_EUR_RATE: ThbEurRate = {
  thbPerEur: "39.20",
  asOf: "2026-06-30",
  source: "fallback",
  stale: true,
};

const ECB_URL =
  "https://data-api.ecb.europa.eu/service/data/EXR/D.THB.EUR.SP00.A?lastNObservations=1&format=jsondata";
const CACHE_KEY = "certrace:fx:thb-eur";

/** Parse the ECB SDMX-JSON payload down to the single latest observation.
    The value lives at series "0:0:0:0:0" → observations → "<idx>" → [value];
    the observation date is the corresponding entry in the time dimension. */
export function parseEcbThbEur(json: unknown): ThbEurRate | null {
  try {
    const root = json as {
      dataSets?: Array<{ series?: Record<string, { observations?: Record<string, Array<number | null>> }> }>;
      structure?: { dimensions?: { observation?: Array<{ id?: string; values?: Array<{ id?: string }> }> } };
    };
    const series = root.dataSets?.[0]?.series;
    if (!series) return null;
    const firstSeries = Object.values(series)[0];
    const observations = firstSeries?.observations;
    if (!observations) return null;

    // lastNObservations=1 returns one entry, but read the highest index defensively.
    const indices = Object.keys(observations)
      .map((k) => Number(k))
      .filter((n) => Number.isInteger(n));
    if (indices.length === 0) return null;
    const lastIdx = Math.max(...indices);
    const rawValue = observations[String(lastIdx)]?.[0];
    if (rawValue === null || rawValue === undefined) return null;

    const timeDim = root.structure?.dimensions?.observation?.find((d) => d.id === "TIME_PERIOD");
    const asOf = timeDim?.values?.[lastIdx]?.id ?? timeDim?.values?.[0]?.id;
    if (!asOf) return null;

    // Round-trips through decimal so the stored string is canonical.
    const thbPerEur = decimalToString(decimal(String(rawValue)));
    return { thbPerEur, asOf, source: "ecb", stale: false };
  } catch {
    return null;
  }
}

function readCache(): ThbEurRate | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ThbEurRate;
    if (typeof parsed.thbPerEur === "string" && typeof parsed.asOf === "string") {
      return { ...parsed, source: "cache" };
    }
    return null;
  } catch {
    return null;
  }
}

function writeCache(rate: ThbEurRate): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(rate));
  } catch {
    /* ignore quota/serialization errors — cache is best-effort */
  }
}

const today = () => new Date().toISOString().slice(0, 10);

/** Fetch the latest ECB EUR/THB reference rate.
    Returns the cache if it already holds today's fetch, otherwise fetches; on any
    failure returns the last cached rate, or the hardcoded fallback (marked stale).
    Callers get `asOf` + `source`/`stale` so the UI can show freshness honestly. */
export async function fetchEcbThbEur(): Promise<ThbEurRate> {
  const cached = readCache();
  // We refetch at most once per calendar day; the ECB rate is daily anyway.
  if (cached && cached.asOf === today()) return cached;

  try {
    const res = await fetch(ECB_URL, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`ECB responded ${res.status}`);
    const parsed = parseEcbThbEur(await res.json());
    if (!parsed) throw new Error("Unparseable ECB payload");
    writeCache(parsed);
    return parsed;
  } catch {
    return cached ?? FALLBACK_THB_EUR_RATE;
  }
}

/** Convert a THB amount to EUR using an ECB EUR/THB rate (THB per 1 EUR).
    Exact decimal division, rounded to 2 dp (cents) with the library's
    ROUND_HALF_EVEN. A zero amount short-circuits to "0". */
export function convertThbToEur(amountTHB: string, rate: Pick<ThbEurRate, "thbPerEur">): string {
  const amount = decimal(amountTHB);
  if (amount.isZero()) return "0";
  const perEur = decimal(rate.thbPerEur);
  if (!perEur.greaterThan(0)) {
    throw new Error("THB/EUR rate must be greater than zero");
  }
  return decimalToString(amount.dividedBy(perEur).toDecimalPlaces(2));
}
