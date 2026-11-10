import { describe, test, expect } from "bun:test";
import {
  buildCatalogue,
  at,
  humanSectionFields,
} from "../src/modules/evidence/autofill-catalogue";
import {
  normalizeValue,
  validateMapping,
} from "../src/modules/evidence/autofill-validation";
import {
  autofillFailure,
  prepareChanges,
} from "../src/modules/evidence/autofill-service";
import { ApiError } from "../src/lib/errors";
import {
  compactFields,
  mapDocument,
} from "../src/modules/evidence/autofill-provider";
import { sections } from "../src/modules/reporting/sections";
import type { StoredReport } from "../src/modules/reporting/service";
import type { Json } from "../src/lib/json";
import type {
  FieldTarget,
  Proposal,
} from "../src/modules/evidence/autofill-types";
import { fixture } from "./fixtures/autofill";
const field: FieldTarget = {
  id: "energy",
  key: "x",
  path: ["mwh"],
  label: "Electricity",
  context: "month:2026-03",
  kind: "number",
  unit: "MWh",
  min: 0,
  current: null,
};
function result(target: FieldTarget, value: Proposal["value"]) {
  return {
    proposals: [
      {
        id: crypto.randomUUID(),
        target,
        value,
        original: String(value),
        sourceUnit: target.unit ?? "",
        page: 1,
        quote: String(value),
        explanation: "",
        warnings: [],
        blocked: false,
      },
    ],
    unresolved: [],
    needsVision: [],
    model: "test",
    inputTokens: 0,
    outputTokens: 0,
  };
}
function fakeRun(
  records: StoredReport[],
  target: FieldTarget,
  value: Proposal["value"],
) {
  const c = buildCatalogue(records, "ws", "2026-03");
  return {
    workspace_id: "ws",
    payload: {
      filename: "test.pdf",
      fileHash: "hash",
      month: "2026-03",
      records,
      seeds: Object.fromEntries(c.seeds),
    },
    result: result(target, value),
  };
}
describe("report autofill catalogue and application", () => {
  test("failed readings identify the provider stage without leaking error details", () => {
    expect(
      autofillFailure(
        new ApiError(503, "OCR_AUTH", "Novita rejected the OCR API key."),
        "reading",
      ),
    ).toBe(
      "Document reading or mapping failed. Please retry or contact support.",
    );
    expect(autofillFailure({ statusCode: 401 }, "mapping")).toContain(
      "contact support",
    );
    expect(autofillFailure({ statusCode: 429 }, "mapping")).toContain("busy");
    expect(autofillFailure({ statusCode: 400 }, "mapping")).toContain(
      "contact support",
    );
    expect(
      autofillFailure(new Error("private document text"), "mapping"),
    ).not.toContain("private document text");
  });
  test("the DeepSeek SDK maps Thai OCR to a cited report field without applying it", async () => {
    const prior = process.env.DEEPSEEK_API_KEY;
    process.env.DEEPSEEK_API_KEY = "test-key";
    try {
      const output = await mapDocument(
        [{ page: 1, text: "ใช้ไฟฟ้า 120 kWh" }],
        [field],
        { workspace: "ws", month: "2026-03" },
        (async (url, init) => {
          expect(String(url)).toBe("https://api.deepseek.com/chat/completions");
          expect(new Headers(init?.headers).get("authorization")).toBe(
            "Bearer test-key",
          );
          const body = JSON.parse(String(init?.body));
          expect(body.model).toBe("deepseek-flash");
          expect(JSON.stringify(body.messages)).toContain("ใช้ไฟฟ้า 120 kWh");
          return Response.json({
            id: "mapping-test",
            created: 1,
            model: body.model,
            choices: [
              {
                index: 0,
                message: {
                  role: "assistant",
                  content: JSON.stringify({
                    proposals: [
                      {
                        targetId: "f0",
                        value: 120,
                        original: "120",
                        sourceUnit: "kWh",
                        page: 1,
                        quote: "ใช้ไฟฟ้า 120 kWh",
                        explanation: "Electricity consumed",
                      },
                    ],
                    unresolved: [],
                    needsVision: [],
                  }),
                },
                finish_reason: "stop",
              },
            ],
            usage: {
              prompt_tokens: 100,
              completion_tokens: 50,
              total_tokens: 150,
            },
          });
        }) as typeof fetch,
      );
      expect(output.proposals).toHaveLength(1);
      expect(output.proposals[0]?.value).toBe(0.12);
      expect(output.proposals[0]?.blocked).toBe(false);
      expect(output.inputTokens).toBe(100);
    } finally {
      if (prior === undefined) delete process.env.DEEPSEEK_API_KEY;
      else process.env.DEEPSEEK_API_KEY = prior;
    }
  });
  test("a unique OCR line repairs a model's split quote and number-with-unit", async () => {
    const prior = process.env.DEEPSEEK_API_KEY;
    process.env.DEEPSEEK_API_KEY = "test-key";
    const target = {
      ...field,
      id: "production",
      path: ["productionTonnes"],
      unit: "t",
    };
    const line = "| Finished product produced | 4,820.5 t |";
    const fakeFetch = (async (_url, _init) =>
      Response.json({
        id: "mapping-quote-test",
        created: 1,
        model: "deepseek-flash",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify({
                proposals: [
                  {
                    targetId: "f0",
                    value: 4820.5,
                    original: "4,820.5 t",
                    sourceUnit: "t",
                    page: 1,
                    quote: "Finished product produced ... 4,820.5 t",
                    explanation: "Finished product output",
                  },
                ],
                unresolved: [],
                needsVision: [],
              }),
            },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      })) as typeof fetch;
    try {
      const unique = await mapDocument(
        [{ page: 1, text: line }],
        [target],
        {},
        fakeFetch,
      );
      expect(unique.proposals[0]).toMatchObject({
        blocked: false,
        original: "4,820.5",
        quote: line,
        value: 4820.5,
      });
      const ambiguous = await mapDocument(
        [{ page: 1, text: `${line}\n${line}` }],
        [target],
        {},
        fakeFetch,
      );
      expect(ambiguous.proposals[0]?.blocked).toBe(true);
    } finally {
      if (prior === undefined) delete process.env.DEEPSEEK_API_KEY;
      else process.env.DEEPSEEK_API_KEY = prior;
    }
  });
  test("covers every additional report field except explicit human actions", () => {
    const c = buildCatalogue(fixture(), "ws", "2026-03");
    for (const section of sections)
      for (const f of section.fields) {
        if (humanSectionFields.has(`${section.id}.${f.key}`)) continue;
        expect(
          c.targets.some(
            (t) =>
              t.key === "certrace:report-inputs:v1" &&
              t.path[1] === section.id &&
              t.path.at(-1) === f.key,
          ),
        ).toBe(true);
      }
    expect(
      c.targets.some((t) => t.path.at(-1) === "operatorRegistration"),
    ).toBe(true);
    expect(
      c.targets.some(
        (t) => t.path.at(-1) === "productId" && t.options?.includes("g1"),
      ),
    ).toBe(true);
    expect(c.targets.some((t) => t.path.at(-1) === "internalSignoff")).toBe(
      false,
    );
    expect(c.targets.some((t) => t.context === "ws:month:2026-03")).toBe(true);
  });
  test("compact prompt retains every target and is less than half the full target size", () => {
    const targets = buildCatalogue(fixture(), "ws", "2026-03").targets;
    const compact = compactFields(targets);
    expect(
      compact.groups
        .flatMap((g) => g.fields)
        .map((r) => r[0])
        .sort(),
    ).toEqual(targets.map((_, i) => `f${i}`).sort());
    expect(JSON.stringify(compact).length).toBeLessThan(
      JSON.stringify(targets).length / 2,
    );
  });
  test("a missing monitoring plan materializes only accepted input ancestors", () => {
    const records = fixture().filter(
      (r) => r.key !== "certrace:workspace-mmd-draft",
    );
    const target = buildCatalogue(records, "ws").targets.find(
      (t) => t.path.at(-1) === "operatorRegistration",
    )!;
    const run = fakeRun(records, target, "ABC");
    const { changes } = prepareChanges(run, records, [
      { id: run.result.proposals[0]!.id },
    ]);
    expect(
      at(changes[0]!.value, ["ws", "inputPlan", "operatorRegistration"]),
    ).toBe("ABC");
    expect(at(changes[0]!.value, ["ws", "inputPlan", "processes"])).toEqual([]);
  });
  test("excludes other workspaces and rejects wrong periods", () => {
    expect(() => buildCatalogue(fixture(), "foreign")).toThrow();
    expect(() => buildCatalogue(fixture(), "ws", "2025-03")).toThrow();
    expect(
      buildCatalogue(fixture(), "ws").targets.some(
        (t) => t.key === "certrace:monthly-data",
      ),
    ).toBe(false);
  });
  test("applying one company field does not create unrelated sections or template rows", () => {
    const records = fixture();
    const c = buildCatalogue(records, "ws", "2026-03");
    const target = c.targets.find(
      (t) => t.path[1] === "0.5" && t.path.at(-1) === "email",
    )!;
    const run = fakeRun(records, target, "account@example.com");
    const { changes } = prepareChanges(run, records, [
      { id: run.result.proposals[0]!.id },
    ]);
    expect(changes).toHaveLength(1);
    const store = changes[0]!.value as Record<string, Json>;
    expect(Object.keys(store)).toEqual(["company:self"]);
    expect(Object.keys(store["company:self"] as object)).toEqual(["0.5"]);
    expect(at(store, target.path)).toBe("account@example.com");
  });
  test("new monthly input creates a draft and not invented fuel rows", () => {
    const records = fixture();
    const target = buildCatalogue(records, "ws", "2026-03").targets.find(
      (t) => t.path.at(-1) === "productionTonnes",
    )!;
    const run = fakeRun(records, target, 125);
    const { changes } = prepareChanges(run, records, [
      { id: run.result.proposals[0]!.id },
    ]);
    expect(at(changes[0]!.value, ["ws", 0, "productionTonnes"])).toBe(125);
    expect(at(changes[0]!.value, ["ws", 0, "fuels"])).toEqual([]);
    expect(at(changes[0]!.value, ["ws", 0, "status"])).toBe("draft");
  });
  test("stale and blocked proposals cannot be applied", () => {
    const records = fixture();
    const target = buildCatalogue(records, "ws").targets.find(
      (t) => t.path.at(-1) === "operatorRegistration",
    )!;
    const run = fakeRun(records, target, "ABC");
    const stale = records.map((r) => ({ ...r, revision: r.revision + 1 }));
    expect(() =>
      prepareChanges(run, stale, [{ id: run.result.proposals[0]!.id }]),
    ).toThrow("changed");
    run.result.proposals[0]!.blocked = true;
    expect(() =>
      prepareChanges(run, records, [{ id: run.result.proposals[0]!.id }]),
    ).toThrow();
  });
});
describe("evidence and unit validation", () => {
  test("converts known dimensions and refuses missing or incompatible units", () => {
    expect(normalizeValue(field, 120000, "kWh")).toBe(120);
    expect(() => normalizeValue(field, 120000, "")).toThrow();
    expect(() => normalizeValue(field, 120, "litres")).toThrow();
    expect(() => normalizeValue(field, "1,25", "MWh")).toThrow();
    expect(() => normalizeValue(field, -1, "MWh")).toThrow();
  });
  test("unknown fields are discarded and invented citations are blocked", () => {
    const mapping = {
      proposals: [
        {
          targetId: "energy",
          value: 120000,
          original: "120,000",
          sourceUnit: "kWh",
          page: 1,
          quote: "Consumption 120,000 kWh",
        },
        { targetId: "__proto__", value: 1 },
      ],
      unresolved: [],
      needsVision: [2, 99],
    };
    const out = validateMapping(
      mapping,
      [field],
      [
        { page: 1, text: "Actual consumption 100 kWh" },
        { page: 2, text: "broken table" },
      ],
    );
    expect(out.proposals).toHaveLength(1);
    expect(out.proposals[0]!.blocked).toBe(true);
    expect(out.needsVision).toEqual([2]);
  });
  test("invented source units, list items and existing unit changes are blocked", () => {
    const numeric = {
      targetId: "energy",
      value: 120,
      original: "120",
      sourceUnit: "kWh",
      page: 1,
      quote: "Consumption 120 MWh",
    };
    expect(
      validateMapping(
        { proposals: [numeric] },
        [field],
        [{ page: 1, text: numeric.quote }],
      ).proposals[0]!.blocked,
    ).toBe(true);
    const list = { ...field, id: "list", kind: "string[]", unit: undefined };
    expect(
      validateMapping(
        {
          proposals: [
            {
              ...numeric,
              targetId: "list",
              value: ["made up"],
              original: "120",
              sourceUnit: "",
            },
          ],
        },
        [list],
        [{ page: 1, text: numeric.quote }],
      ).proposals[0]!.blocked,
    ).toBe(true);
    const unitField = {
      ...field,
      id: "unit",
      kind: "string",
      path: ["unit"],
      current: "kg",
      unit: undefined,
    };
    expect(
      validateMapping(
        {
          proposals: [
            {
              targetId: "unit",
              value: "t",
              original: "t",
              sourceUnit: "",
              page: 1,
              quote: "Unit: t",
            },
          ],
        },
        [unitField],
        [{ page: 1, text: "Unit: t" }],
      ).proposals[0]!.blocked,
    ).toBe(true);
  });
  test("valid supported numeric fact stays a review proposal", () => {
    const out = validateMapping(
      {
        proposals: [
          {
            targetId: "energy",
            value: 120000,
            original: "120,000",
            sourceUnit: "kWh",
            page: 1,
            quote: "Consumption 120,000 kWh",
          },
        ],
      },
      [field],
      [{ page: 1, text: "Consumption 120,000 kWh" }],
    );
    expect(out.proposals[0]!.value).toBe(120);
    expect(out.proposals[0]!.blocked).toBe(false);
  });
});
