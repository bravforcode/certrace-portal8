/** Compile portal input types into JSON document validators and report metadata.
 * Historical shape names remain stable for shared-master bindings; no SQL is generated.
 */
import ts from "typescript";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { REPORT_SECTIONS as sections } from "../../certrace-portal/lib/report-input-schema";
const root = resolve(import.meta.dir, "../..");
const checkOnly = process.argv.includes("--check");
function emit(path: string, content: string) {
  if (checkOnly) {
    if (readFileSync(path, "utf8") !== content)
      throw Error("Generated report contract is stale: " + path);
  } else writeFileSync(path, content);
}
const sources = [
  [
    "internal-precursors",
    "internal-precursors",
    "InternalPrecursor",
    "mapArray",
  ],
  ["unit-costs", "unit-costs", "UnitCostRecord", "map"],
  ["workspaces", "workspace", "VerificationWorkspace", "array"],
  ["installations", "installations", "Installation", "array"],
  ["supplier-companies", "supplier-companies", "SupplierCompany", "array"],
  ["workspace-drafts", "workspace-drafts", "WorkspaceDraft", "array"],
  ["workspace-mmd-draft", "workspace-mmd", "WorkspaceMmdContent", "map"],
  [
    "workspace-mmd-versions",
    "workspace-mmd",
    "WorkspaceMmdVersion",
    "mapArray",
  ],
  ["monthly-data", "monthly-data", "MonthlyEntry", "mapArray"],
  [
    "precursor-suppliers",
    "precursor-suppliers",
    "PrecursorSupplier",
    "mapArray",
  ],
  ["workspace-evidence", "workspace-evidence", "EvidenceItem", "mapArray"],
  ["pack-signoff", "pack-signoff", "PackSignOff", "map"],
  ["carbon-price", "carbon-price", "CarbonPriceRecord", "map"],
  ["reporting-periods", "reporting-periods", "ReportingPeriod", "array"],
  ["annual-production", "annual-production", "ProductionRecord", "map"],
  ["monthly-requests", "monthly-requests", "MonthlyRequest", "mapArray"],
  ["month-submissions", "month-submission", "MonthSubmission", "mapMap"],
  [
    "precursor-versions",
    "precursor-versions",
    "StoredPrecursorVersion",
    "mapArray",
  ],
] as const;
const files = sources.map((x) =>
  resolve(root, `certrace-portal/lib/${x[1]}.ts`),
);
const program = ts.createProgram(files, {
  target: ts.ScriptTarget.ES2022,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  module: ts.ModuleKind.ESNext,
  strict: true,
  skipLibCheck: true,
});
const checker = program.getTypeChecker();
type Shape = {
  kind: string;
  arrayElement?: boolean;
  scopeKey?: boolean;
  derived?: "workspace";
  nullable?: boolean;
  optional?: boolean;
  enum?: (string | number | boolean)[];
  fields?: Record<string, Shape>;
  item?: Shape;
  table?: string;
  min?: number;
  max?: number;
  format?: string;
};
function shape(type: ts.Type, depth = 0): Shape {
  if (depth > 20)
    throw Error("Recursive input type " + checker.typeToString(type));
  let parts = type.isUnion() ? type.types : [type];
  const optional = parts.some((x) => x.flags & ts.TypeFlags.Undefined),
    nullable = parts.some((x) => x.flags & ts.TypeFlags.Null);
  parts = parts.filter(
    (x) => !(x.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null)),
  );
  const flags = {
    ...(optional ? { optional: true } : {}),
    ...(nullable ? { nullable: true } : {}),
  };
  if (parts.every((x) => x.flags & ts.TypeFlags.StringLike))
    return {
      kind: "string",
      ...flags,
      ...(parts.every((x) => x.isStringLiteral())
        ? { enum: parts.map((x) => (x as ts.StringLiteralType).value) }
        : {}),
    };
  if (parts.every((x) => x.flags & ts.TypeFlags.NumberLike))
    return { kind: "number", ...flags };
  if (parts.every((x) => x.flags & ts.TypeFlags.BooleanLike))
    return { kind: "boolean", ...flags };
  if (parts.length === 1 && checker.isArrayType(parts[0]!))
    return {
      kind: "array",
      item: shape(
        checker.getTypeArguments(parts[0] as ts.TypeReference)[0]!,
        depth + 1,
      ),
      ...flags,
    };
  if (parts.length === 1) {
    const index = parts[0]!.getStringIndexType();
    if (index) return { kind: "map", item: shape(index, depth + 1), ...flags };
  }
  if (
    parts.every(
      (x) => x.flags & (ts.TypeFlags.Object | ts.TypeFlags.Intersection),
    )
  ) {
    const fields: Record<string, Shape> = {};
    const names = new Set(
      parts.flatMap((x) => x.getProperties().map((p) => p.name)),
    );
    for (const name of names) {
      const props = parts
        .map((x) => x.getProperty(name))
        .filter((x): x is ts.Symbol => !!x);
      const types = props.map((x) =>
        checker.getTypeOfSymbolAtLocation(
          x,
          x.valueDeclaration ?? x.declarations![0]!,
        ),
      );
      const variants = types.map((x) => shape(x, depth + 1));
      let field = variants[0]!;
      if (variants.some((v) => v.kind !== field.kind))
        throw Error("Mixed field " + name);
      if (variants.every((v) => v.enum))
        field = {
          ...field,
          enum: [...new Set(variants.flatMap((v) => v.enum!))],
        };
      fields[name] = {
        ...field,
        ...(props.length < parts.length || variants.some((v) => v.optional)
          ? { optional: true }
          : {}),
        ...(variants.some((v) => v.nullable) ? { nullable: true } : {}),
      };
    }
    return { kind: "object", fields, ...flags };
  }
  throw Error("Unsupported input type: " + checker.typeToString(type));
}
const specs: Record<string, Shape> = {};
for (const [key, file, name, container] of sources) {
  const sf = program.getSourceFile(
    resolve(root, `certrace-portal/lib/${file}.ts`),
  )!;
  const symbol = checker
    .getExportsOfModule(checker.getSymbolAtLocation(sf)!)
    .find((s) => s.name === name);
  if (!symbol) throw Error("Missing " + file + ":" + name);
  let item = shape(checker.getDeclaredTypeOfSymbol(symbol));
  // Actual uploaded evidence also carries this server-issued file identity.
  if (key === "workspace-evidence")
    item.fields!.serverFileId = { kind: "string", optional: true };
  if (container === "mapArray") item = { kind: "array", item };
  if (container === "mapMap") item = { kind: "map", item };
  specs["certrace:" + key] = {
    kind: container === "array" ? "array" : "map",
    item,
  };
}
specs["certrace:final-report-snapshot"] = {
  kind: "map",
  item: {
    kind: "object",
    fields: {
      workspaceId: { kind: "string" },
      fingerprint: { kind: "string" },
      signedAt: { kind: "string" },
      doc: { kind: "artifact" },
    },
  },
};
specs["certrace:report-snapshots:*"] = {
  kind: "array",
  item: {
    kind: "object",
    fields: {
      version: { kind: "number" },
      createdAt: { kind: "string" },
      reason: { kind: "string" },
      fingerprint: { kind: "string" },
      dataset: { kind: "artifact" },
    },
  },
};
const answers: Record<string, Shape> = {};
for (const section of sections) {
  const fields: Record<string, Shape> = {};
  for (const f of section.fields) {
    if (fields[f.key]) throw Error(`Duplicate field ${section.id}.${f.key}`);
    fields[f.key] = {
      kind: f.kind === "number" ? "decimalText" : "string",
      optional: true,
      ...(f.kind === "number"
        ? { min: f.min ?? 0, ...(f.max === undefined ? {} : { max: f.max }) }
        : {}),
      ...(f.kind === "select"
        ? { enum: ["", ...f.options!.map((x) => x.value)] }
        : {}),
      ...([
        "date",
        "month",
        "datetime-local",
        "process",
        "product",
        "evidence",
        "source",
      ].includes(f.kind)
        ? { format: f.kind }
        : {}),
    };
  }
  answers[section.id] = {
    kind: "object",
    optional: true,
    fields: {
      applicability: { kind: "string", enum: ["yes", "no", ""] },
      reason: { kind: "string" },
      updatedAt: { kind: "string", optional: true },
      rows: {
        kind: "array",
        item: {
          kind: "object",
          fields: {
            id: { kind: "string" },
            values: { kind: "object", fields },
          },
        },
      },
    },
  };
}
specs["certrace:report-inputs:v1"] = {
  kind: "map",
  item: { kind: "object", fields: answers },
};
function constrain(s: Shape, field = "") {
  if (s.kind === "number") {
    if (/(?:Pct|SharePct)$/.test(field)) {
      s.min = 0;
      s.max = 100;
    } else if (/(?:Fraction|oxidationFactor|conversionFactor)$/.test(field)) {
      s.min = 0;
      s.max = 1;
    } else if (field === "latitude") {
      s.min = -90;
      s.max = 90;
    } else if (field === "longitude") {
      s.min = -180;
      s.max = 180;
    } else if (!["quantityT"].includes(field)) s.min = 0;
  }
  if (s.fields) for (const [k, v] of Object.entries(s.fields)) constrain(v, k);
  if (s.item) constrain(s.item, field);
}
for (const s of Object.values(specs)) constrain(s);
// A workspace ID belongs to the enclosing scope, not to every monthly/source row.
for (const [key, s] of Object.entries(specs))
  if (
    s.kind === "map" &&
    ![
      "certrace:report-inputs:v1",
      "certrace:precursor-versions",
      "certrace:annual-production",
    ].includes(key)
  ) {
    s.item!.scopeKey = true;
    const derive = (node: Shape) => {
      if (node.fields) {
        if (node.fields.workspaceId)
          node.fields.workspaceId.derived = "workspace";
        for (const child of Object.values(node.fields)) derive(child);
      }
      if (node.item) derive(node.item);
    };
    derive(s.item!);
  }

const aliases: Record<string, string> = {
  workspaces_rows: "workspace_profiles",
  installations_rows: "installation_profiles",
  supplier_companies_rows: "supplier_company_profiles",
  workspace_mmd_draft_rows: "monitoring_plans",
  workspace_mmd_draft_rows_input_plan: "operator_reporting_plans",
  workspace_mmd_draft_rows_input_plan_processes_rows: "production_processes",
  workspace_mmd_draft_rows_input_plan_processes_rows_products_rows:
    "report_goods",
  workspace_mmd_draft_rows_input_plan_processes_rows_routes_rows:
    "process_routes",
  workspace_mmd_draft_rows_input_plan_processes_rows_steps_rows:
    "process_steps",
  workspace_mmd_draft_rows_data_gaps_rows: "data_gaps",
  workspace_mmd_draft_rows_fuel_instruments_rows: "fuel_instruments",
  workspace_mmd_draft_rows_electricity_instruments_rows:
    "electricity_instruments",
  workspace_mmd_draft_rows_sector_parameters: "steel_parameters",
  monthly_data_rows_rows: "report_months",
  monthly_data_rows_rows_output_quantities_rows: "production_outputs",
  monthly_data_rows_rows_other_flows_rows: "transfer_readings",
  monthly_data_rows_rows_fuels_rows: "fuel_readings",
  monthly_data_rows_rows_process_emission_entries_rows: "material_readings",
  monthly_data_rows_rows_electricity_sources_rows: "electricity_readings",
  precursor_suppliers_rows_rows: "precursor_sources",
  workspace_evidence_rows_rows: "evidence_items",
  pack_signoff_rows: "report_signoffs",
  carbon_price_rows: "carbon_price_claims",
};
function name(path: string) {
  const clean = path
    .replace(/^certrace:/, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase();
  return (
    aliases[clean] ??
    (clean.length <= 58
      ? clean
      : clean.slice(0, 49) +
        "_" +
        createHash("sha256").update(clean).digest("hex").slice(0, 8))
  );
}
function assign(s: Shape, path: string) {
  s.table = name(path);
  if (s.kind === "object")
    for (const [k, f] of Object.entries(s.fields!)) {
      if (["object", "array", "map"].includes(f.kind))
        assign(f, path + "_" + k);
    }
  else if (s.item) {
    if (s.kind === "array") s.item.arrayElement = true;
    assign(s.item, path + "_rows");
  }
}
for (const [k, s] of Object.entries(specs)) assign(s, k);
function type(s: Shape): string {
  let out =
    s.kind === "object"
      ? "{ " +
        Object.entries(s.fields!)
          .map(
            ([k, v]) =>
              JSON.stringify(k) + (v.optional ? "?" : "") + ": " + type(v),
          )
          .join("; ") +
        " }"
      : s.kind === "array"
        ? `Array<${type(s.item!)}>`
        : s.kind === "map"
          ? `Record<string, ${type(s.item!)}>`
          : s.enum
            ? s.enum.map((x) => JSON.stringify(x)).join(" | ")
            : s.kind === "decimalText"
              ? "string"
              : s.kind === "artifact"
                ? "Json"
                : s.kind;
  return out + (s.nullable ? " | null" : "");
}
emit(
  resolve(root, "certrace-portal/lib/report-storage-keys.ts"),
  `// Generated by the report storage catalogue compiler.\nexport const REPORT_STORAGE_KEYS = new Set(${JSON.stringify([...Object.keys(specs), "certrace:profile"])});\nexport const isReportStorageKey = (key: string) => REPORT_STORAGE_KEYS.has(key) || key.startsWith('certrace:report-snapshots:');\n`,
);
const out = resolve(root, "certrace-backend/src/modules/reporting");
emit(
  out + "/catalogue.ts",
  `// Generated from the concrete portal input types; regenerate with db:report-catalogue.\nimport type { Shape } from './shape';\nimport type { Json } from '../../lib/json';\nexport const reportSpecs: Record<string, Shape> = ${JSON.stringify(specs, null, 2)};\nexport interface ReportStoreValues {\n${Object.entries(
    specs,
  )
    .map(([k, s]) => ` ${JSON.stringify(k)}: ${type(s)};`)
    .join("\n")}\n}\nexport type ReportStoreKey = keyof ReportStoreValues;\n`,
);
emit(
  out + "/sections.ts",
  `// Generated report section metadata (no values).\nexport const sections = ${JSON.stringify(sections, null, 2)} as const;\n`,
);
console.log(
  `${Object.keys(specs).length} document contracts; ${sections.length} report sections`,
);
