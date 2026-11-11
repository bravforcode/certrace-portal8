import { jsonSchema, tool, type ToolSet } from "ai";
import catalogue from "../links/cbam-item-fields.json";

/**
 * Cera proposes actions; the server never executes them. The portal shows each
 * proposal and the user confirms it in the app before anything is saved.
 */
export type CeraAction =
  | {
      tool: "set_cbam_fields";
      installationId: string;
      year: number;
      values: Record<string, string | null>;
    }
  | {
      tool: "update_installation";
      installationId: string;
      changes: Record<string, string>;
    }
  | { tool: "request_upload"; purpose: string }
  | { tool: "open_page"; path: string };

export const MAX_CERA_ACTIONS = 5;
const MAX_VALUE_LENGTH = 2000;

const CBAM_FIELDS = catalogue.fields as { key: string; label: string; section: string; block?: number }[];
const CBAM_KEYS: readonly string[] = CBAM_FIELDS.map((f) => f.key);
// Processes 2-10 and precursors 2-20 repeat block 1 at a fixed row stride; naming all
// 457 keys would spend most of a free-tier token budget, so the model is told the rule.
const PROMPT_FIELDS = CBAM_FIELDS.filter((f) => !f.block || f.block === 1);
// A bare "Name" fits process P1, precursor PP1 and the verifier contact alike, so a repeated label carries its section.
const labelCount = new Map<string, number>();
for (const f of PROMPT_FIELDS) labelCount.set(f.label, (labelCount.get(f.label) ?? 0) + 1);
const promptLabel = (f: (typeof PROMPT_FIELDS)[number]) =>
  labelCount.get(f.label)! > 1 ? `${f.section}: ${f.label}` : f.label;

// Every key must exist on the Installation type in certrace-portal/lib/installations.ts.
const INSTALLATION_KEYS: readonly string[] = [
  "name",
  "nameLocal",
  "street",
  "economicActivity",
  "postcode",
  "poBox",
  "city",
  "country",
  "unlocode",
  "lat",
  "lng",
  "contactName",
  "contactEmail",
  "contactPhone",
  "operatorName",
  "operatorRegistrationNumber",
  "operatorAddress",
  "operatorStreet",
  "operatorCity",
  "operatorPostcode",
  "operatorCountry",
];

const PAGES: readonly string[] = [
  "/dashboard",
  "/workspace",
  "/convert",
  "/convert/eu-cbam",
  "/suppliers",
  "/reports",
  "/settings",
  "/carbon-cost",
  "/supply-chain",
];

const CBAM_SET = new Set(CBAM_KEYS);
const INSTALLATION_SET = new Set(INSTALLATION_KEYS);
const PAGE_SET = new Set(PAGES);

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const validInstallationId = (v: unknown): v is string =>
  typeof v === "string" && /^[A-Za-z0-9-]{1,64}$/.test(v);

const validYear = (v: unknown): v is number =>
  Number.isInteger(v) && (v as number) >= 2020 && (v as number) <= 2035;

const validValue = (v: unknown): v is string =>
  typeof v === "string" && v.length <= MAX_VALUE_LENGTH;

function safePath(p: unknown): string | undefined {
  if (typeof p !== "string" || p.length > 300) return undefined;
  const [pathname, query, ...extra] = p.split("?");
  if (extra.length > 0 || !PAGE_SET.has(pathname!)) return undefined;
  if (query !== undefined && !/^[A-Za-z0-9._~=&%-]{0,200}$/.test(query))
    return undefined;
  return p;
}

function setCbamFields(input: Record<string, unknown>): CeraAction | undefined {
  const { installationId, year } = input;
  if (!validInstallationId(installationId) || !validYear(year)) return undefined;
  // The tool sends `fields` as [{key, value}]; a `values` map is the older shape.
  const raw = input.fields ?? input.values;
  const entries: [string, unknown][] = Array.isArray(raw)
    ? raw.filter(isRecord).map((e) => [String(e.key), e.value])
    : isRecord(raw)
      ? Object.entries(raw)
      : [];
  const kept: Record<string, string | null> = {};
  for (const [key, value] of entries) {
    if (!CBAM_SET.has(key)) continue;
    if (value === null || validValue(value)) kept[key] = value as string | null;
  }
  if (Object.keys(kept).length === 0) return undefined;
  return { tool: "set_cbam_fields", installationId, year, values: kept };
}

function updateInstallation(
  input: Record<string, unknown>,
): CeraAction | undefined {
  const { installationId, changes } = input;
  if (!validInstallationId(installationId) || !isRecord(changes)) return undefined;
  const kept: Record<string, string> = {};
  for (const [key, value] of Object.entries(changes)) {
    if (INSTALLATION_SET.has(key) && validValue(value)) kept[key] = value;
  }
  if (Object.keys(kept).length === 0) return undefined;
  return { tool: "update_installation", installationId, changes: kept };
}

function requestUpload(input: Record<string, unknown>): CeraAction | undefined {
  const purpose =
    typeof input.purpose === "string" ? input.purpose.trim() : "";
  if (purpose.length < 1 || purpose.length > 300) return undefined;
  return { tool: "request_upload", purpose };
}

function openPage(input: Record<string, unknown>): CeraAction | undefined {
  const path = safePath(input.path);
  return path === undefined ? undefined : { tool: "open_page", path };
}

const PARSERS = new Map<
  string,
  (input: Record<string, unknown>) => CeraAction | undefined
>([
  ["set_cbam_fields", setCbamFields],
  ["update_installation", updateInstallation],
  ["request_upload", requestUpload],
  ["open_page", openPage],
]);

/**
 * Accepts raw tool calls (`{toolName|tool, input|args}`), drops anything
 * invalid or outside the allowlists, and caps the result.
 */
export function validateCeraActions(raw: unknown): CeraAction[] {
  if (!Array.isArray(raw)) return [];
  const out: CeraAction[] = [];
  for (const item of raw) {
    if (out.length >= MAX_CERA_ACTIONS) break;
    if (!isRecord(item)) continue;
    const name = item.toolName ?? item.tool;
    const input = item.input ?? item.args;
    if (typeof name !== "string" || !isRecord(input)) continue;
    const parse = PARSERS.get(name);
    const action = parse?.(input);
    if (action) out.push(action);
  }
  return out;
}

const schema = <T>(value: Record<string, unknown>) =>
  jsonSchema<T>({ additionalProperties: false, ...value } as never);

/** Tool definitions for generateText. No `execute`: the model only proposes. */
export const ceraTools = {
  set_cbam_fields: tool({
    description:
      "Propose setting CBAM template fields for one installation and reporting year. The user must confirm before anything is saved. Use null to clear a field.",
    inputSchema: schema<{
      installationId: string;
      year: number;
      fields: { key: string; value: string | null }[];
    }>({
      type: "object",
      properties: {
        installationId: { type: "string", maxLength: 64 },
        year: { type: "integer", minimum: 2020, maximum: 2035 },
        fields: {
          type: "array",
          minItems: 1,
          maxItems: 40,
          description: `One entry per field to set. key is the CBAM field key; the fields are ${PROMPT_FIELDS.map((f) => `${f.key} = ${promptLabel(f)}`).join("; ")}. Keys d-* are production process 1; process n (2-10) uses the same column with row + 65*(n-1), e.g. d-l16 becomes d-l81 for process 2. Keys e-* are purchased precursor 1; precursor n (2-20) uses row + 44*(n-1). In A_InstData, keys a-*83 are process P1 (P n uses row 82+n) and keys a-*102 are purchased precursor PP1 (PP n uses row 101+n).`,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              key: { type: "string", pattern: "^[a-e]-[a-z]{1,2}[0-9]{1,4}$" },
              value: { type: ["string", "null"] },
            },
            required: ["key", "value"],
          },
        },
      },
      required: ["installationId", "year", "fields"],
    }),
  }),
  update_installation: tool({
    description:
      "Propose changing details of one installation record. The user must confirm before anything is saved.",
    inputSchema: schema<{
      installationId: string;
      changes: Record<string, string>;
    }>({
      type: "object",
      properties: {
        installationId: { type: "string", maxLength: 64 },
        changes: {
          type: "object",
          properties: Object.fromEntries(
            INSTALLATION_KEYS.map((k) => [k, { type: "string" }]),
          ),
        },
      },
      required: ["installationId", "changes"],
    }),
  }),
  request_upload: tool({
    description:
      "Ask the user to upload a document in Smart upload for the given purpose. Nothing is uploaded by this call.",
    inputSchema: schema<{ purpose: string }>({
      type: "object",
      properties: { purpose: { type: "string", minLength: 1, maxLength: 300 } },
      required: ["purpose"],
    }),
  }),
  open_page: tool({
    description:
      `Propose opening one Certrace page for the user. path must be one of ${PAGES.join(", ")}, optionally followed by a query string.`,
    inputSchema: schema<{ path: string }>({
      type: "object",
      properties: { path: { type: "string", maxLength: 300 } },
      required: ["path"],
    }),
  }),
} satisfies ToolSet;
