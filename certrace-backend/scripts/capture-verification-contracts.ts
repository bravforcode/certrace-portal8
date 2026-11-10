/** Explicit read-only capture of current/reference TypeScript contracts.
 * Run only when intentionally updating the reviewed v2 contract snapshot.
 */
import ts from "typescript";
import { resolve } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const base = resolve(import.meta.dir, "../..");
const definitions = [
  ["installation", "installations", "Installation"],
  ["supplier_company", "supplier-companies", "SupplierCompany"],
  ["workspace", "workspace", "VerificationWorkspace"],
  ["methodology", "workspace-mmd", "WorkspaceMmdContent"],
  ["methodology_publication", "workspace-mmd", "WorkspaceMmdVersion"],
  ["month", "monthly-data", "MonthlyEntry"],
  ["precursor", "precursor-suppliers", "PrecursorSupplier"],
  ["evidence", "workspace-evidence", "EvidenceItem"],
  ["carbon_price", "carbon-price", "CarbonPriceRecord"],
  ["unit_cost", "unit-costs", "UnitCostRecord"],
  ["internal_precursor", "internal-precursors", "InternalPrecursor"],
  ["workspace_draft", "workspace-drafts", "WorkspaceDraft"],
  ["monthly_request", "monthly-requests", "MonthlyRequest"],
  ["month_submission", "month-submission", "MonthSubmission"],
  ["pack_signoff", "pack-signoff", "PackSignOff"],
] as const;
const roots = ["certrace-portal", "certrace-new/certrace-portal"];
const files = roots.flatMap((root) =>
  definitions.map(([, file]) => `${base}/${root}/lib/${file}.ts`),
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

function merge(a: Shape, b: Shape): Shape {
  if (a.kind !== b.kind) throw Error(`Incompatible kinds ${a.kind}/${b.kind}`);
  const out: Shape = { ...a, ...b };
  if (a.optional || b.optional) out.optional = true;
  if (a.nullable || b.nullable) out.nullable = true;
  if (a.enum && b.enum) out.enum = [...new Set([...a.enum, ...b.enum])];
  else delete out.enum;
  if (a.fields || b.fields) {
    out.fields = {};
    for (const key of new Set([
      ...Object.keys(a.fields ?? {}),
      ...Object.keys(b.fields ?? {}),
    ])) {
      const x = a.fields?.[key],
        y = b.fields?.[key];
      out.fields[key] = x && y ? merge(x, y) : { ...(x ?? y)!, optional: true };
    }
  }
  if (a.item && b.item) out.item = merge(a.item, b.item);
  return out;
}
const contracts: Record<string, unknown> = {};
for (const [kind, file, name] of definitions) {
  const entries = roots.map((root) => {
    const sf = program.getSourceFile(`${base}/${root}/lib/${file}.ts`);
    if (!sf) return null;
    const symbol = checker
      .getExportsOfModule(checker.getSymbolAtLocation(sf)!)
      .find((s) => s.name === name);
    if (!symbol) throw Error(`Missing ${root}/${file}:${name}`);
    return {
      shape: shape(checker.getDeclaredTypeOfSymbol(symbol)),
      source: `${root}/lib/${file}.ts`,
      type: name,
    };
  });
  const reference = entries[1];
  if (!reference) throw Error(`Missing reference ${kind}`);
  const current = entries[0];
  const target = current
    ? merge(current.shape, reference.shape)
    : reference.shape;
  contracts[kind] = { reference, current, target };
}
const hashes = Object.fromEntries(
  program
    .getSourceFiles()
    .filter(
      (f) =>
        f.fileName.startsWith(base + "/") &&
        !f.fileName.includes("node_modules") &&
        !f.isDeclarationFile,
    )
    .map((f) => [
      f.fileName.slice(base.length + 1),
      createHash("sha256").update(f.text).digest("hex"),
    ]),
);
writeFileSync(
  `${base}/certrace-backend/test/fixtures/verification-contracts.json`,
  JSON.stringify({ version: 1, contracts, sourceHashes: hashes }, null, 2) +
    "\n",
);
console.log("Captured", Object.keys(contracts).length, "domain contracts");
