import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { reportSpecs } from "../src/modules/reporting/catalogue";
import { bindings, versionColumn } from "../src/modules/master-data/definition";
import { profileSpec } from "../src/modules/master-data/profile-contract";
import type { Shape } from "../src/modules/reporting/shape";
const lines = [
  "# Implemented report columns",
  "",
  "Generated from the executable input catalogue. Input rows are in `reporting`; shared identities and immutable profiles are in `masterdata`. `f_*` holds a report-specific value; `p_*` distinguishes an absent field from an explicitly provided value. Parent foreign keys identify the account revision, workspace/scope and repeated row.",
  "",
  "| Input path | Table.column | Value type |",
  "|---|---|---|",
];
let fields = 0;
function walk(s: Shape, path: string) {
  if (s.fields)
    for (const [k, v] of Object.entries(s.fields)) {
      if (v.fields || v.item) walk(v, path + "." + k);
      else {
        const binding = bindings(s).find((b) => b.fields[k]);
        const location = binding
          ? `masterdata.${binding.fields[k]?.startsWith("@") ? binding.kind + "s.external_reference (identity projection)" : binding.kind + "_versions." + binding.fields[k]} (via ${s.table}.${binding.via ? "_installation_version_id → operator_version_id" : versionColumn(binding)})`
          : s.table === "workspace_profiles" && k === "year"
            ? "masterdata.annual_reports.reporting_year (via workspace identity)"
            : s.table + ".f_" + k;
        lines.push(
          `| ${path}.${k} | ${v.derived ? "enclosing workspace scope (foreign-key path)" : location} | ${v.kind === "artifact" ? "bytea (frozen output)" : v.kind === "decimalText" ? "numeric → form string" : v.kind === "number" ? "numeric" : v.kind} |`,
        );
        fields++;
      }
    }
  if (s.item) walk(s.item, path + (s.kind === "map" ? "[scope]" : "[]"));
  if (!s.fields && !s.item) {
    lines.push(`| ${path} | ${s.table}.f__value | ${s.kind} |`);
    fields++;
  }
}
for (const [k, s] of Object.entries({
  ...reportSpecs,
  "certrace:profile": profileSpec,
}))
  walk(s, k);
writeFileSync(
  resolve(import.meta.dir, "../../docs/database/IMPLEMENTED-COLUMNS.md"),
  lines.join("\n") + "\n",
);
console.log("Documented", fields, "concrete columns.");
