import { describe, expect, it } from "vitest";

import { convertThbToEur, parseEcbThbEur, FALLBACK_THB_EUR_RATE } from "./fx";

/* A trimmed but structurally faithful ECB SDMX-JSON payload for
   D.THB.EUR.SP00.A?lastNObservations=1 — one daily observation. */
const ECB_FIXTURE = {
  dataSets: [
    {
      series: {
        "0:0:0:0:0": {
          observations: {
            "0": [39.153, 0, null, null, null],
          },
        },
      },
    },
  ],
  structure: {
    dimensions: {
      observation: [
        {
          id: "TIME_PERIOD",
          values: [{ id: "2026-06-30", name: "2026-06-30" }],
        },
      ],
    },
  },
};

describe("convertThbToEur", () => {
  it("divides THB by the ECB EUR/THB rate", () => {
    // 3920 THB at 39.20 THB/EUR = 100.00 EUR exactly.
    expect(convertThbToEur("3920", { thbPerEur: "39.20" })).toBe("100");
  });

  it("short-circuits a zero amount to '0'", () => {
    expect(convertThbToEur("0", { thbPerEur: "39.20" })).toBe("0");
  });

  it("rounds to cents with ROUND_HALF_EVEN", () => {
    // 100 / 39.20 = 2.55102... → 2.55 at 2 dp.
    expect(convertThbToEur("100", { thbPerEur: "39.20" })).toBe("2.55");
    // Exact half at the cent boundary rounds to even: 3.925 → 3.92.
    expect(convertThbToEur("3.925", { thbPerEur: "1" })).toBe("3.92");
  });

  it("rejects a non-positive rate", () => {
    expect(() => convertThbToEur("100", { thbPerEur: "0" })).toThrow();
  });
});

describe("parseEcbThbEur", () => {
  it("extracts the latest observation value and its date", () => {
    const rate = parseEcbThbEur(ECB_FIXTURE);
    expect(rate).not.toBeNull();
    expect(rate?.thbPerEur).toBe("39.153");
    expect(rate?.asOf).toBe("2026-06-30");
    expect(rate?.source).toBe("ecb");
    expect(rate?.stale).toBe(false);
  });

  it("returns null on a malformed payload", () => {
    expect(parseEcbThbEur({})).toBeNull();
    expect(parseEcbThbEur({ dataSets: [{ series: {} }] })).toBeNull();
    expect(parseEcbThbEur(null)).toBeNull();
  });

  it("keeps the fallback rate marked stale", () => {
    expect(FALLBACK_THB_EUR_RATE.stale).toBe(true);
    expect(FALLBACK_THB_EUR_RATE.source).toBe("fallback");
  });
});
