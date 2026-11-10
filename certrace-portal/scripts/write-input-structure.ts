import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { INPUT_REFERENCE_GROUPS } from "../lib/verification-input-references";

const destination = fileURLToPath(
  new URL("../../docs/CBAM-NUMBERED-INPUT-STRUCTURE.md", import.meta.url),
);
const entries = INPUT_REFERENCE_GROUPS.flatMap((group) => [...group.entries]);
if (new Set(entries.map((entry) => entry.id)).size !== entries.length)
  throw new Error("Duplicate input reference");

const lines = [
  "# Numbered input structure",
  "",
  "These are Certrace input references, not EU paragraph numbers. The same reference appears beside the corresponding web field in English and Thai. Repeated products, processes, sources and months reuse the same field reference.",
  "",
  "**(partial)** means the input or basic calculation exists but a stated capability still needs implementation. Blank existing inputs are shown in red in the web UI. All former missing input topics now have forms; specialised calculations still have explicit blockers. Applicability still depends on the goods, source and method. Once means update when facts change; monthly is the collection cadence, while the report dataset is annual.",
  "",
  "General uploads and sample documents are in Readiness. Producer reports remain in Precursor sources, and method-specific uploads remain beside their fields. One installation and year share one reporting dataset across all processes and products. OER and OSER outputs reuse that dataset; the electricity addendum is conditional. Supporting documents are a package, and the independent verification report is issued by the verifier.",
  "",
  "Section 2.6 lists calculated draft results, not values to type. Transfer adjustments, composition-specific attribution, complex-good SEFA and full Article 14 source-combination attribution remain partial and block final readiness. Dataset downloads are JSON review records, not finished EU report forms. Document disclosure controls filter export metadata; server-enforced access permissions are not implemented. The carbon-price fields at 2.7.13–2.7.17 preserve additional existing inputs and do not replace OSER specific embedded free allocation. OER item 35 still requires checking the applicable sector parameters in Annex IV section 2.",
  "",
  "Generated from `certrace-portal/lib/verification-input-references.ts`. To refresh: `npx tsx scripts/write-input-structure.ts` from `certrace-portal`.",
  "",
  "```text",
  "COMPANY / OPERATOR",
];
for (const group of INPUT_REFERENCE_GROUPS) {
  if (group.id === "1") lines.push("│", "├── INSTALLATION A — Factory A");
  if (group.id === "2.0")
    lines.push("│   │", "│   └── 2. Reporting period — e.g. 2026");
  const branch =
    group.id === "0" ? "├──" : group.id === "1" ? "│   ├──" : "│       ├──";
  const child =
    group.id === "0" ? "│   " : group.id === "1" ? "│   │   " : "│       │   ";
  lines.push(`${branch} ${group.id}. ${group.title}`);
  group.entries.forEach((entry, index) =>
    lines.push(
      `${child}${index === group.entries.length - 1 ? "└──" : "├──"} ${entry.id} ${entry.label} [${entry.cadence}] (${entry.tab}${String(entry.status) === "missing" ? "; planned" : ""})${String(entry.status) === "missing" ? " (missing)" : String(entry.status) === "partial" ? " (partial)" : ""}`,
    ),
  );
}
lines.push(
  "│",
  "├── Other reporting years — repeat 2.0–2.7",
  "│",
  "└── INSTALLATION B — its own profile and reporting years",
  "```",
  "",
  "For output-template mappings and applicability detail, see [the report input specification](CBAM-REPORT-INPUT-STRUCTURE.md) and [the OER/OSER/addendum requirements](CBAM-OER-INPUT-REQUIREMENTS.md).",
  "",
);
const document = lines.join("\n");
if (process.argv.includes("--check")) {
  if (readFileSync(destination, "utf8") !== document)
    throw new Error("Numbered structure is out of date");
} else writeFileSync(destination, document);
const readmePath = fileURLToPath(new URL("../../README.md", import.meta.url));
const start = "<!-- numbered-input-locations:start -->";
const end = "<!-- numbered-input-locations:end -->";
const locationSection = [
  start,
  "## Verification inputs — where in the web",
  "",
  "Open **Verification → installation → reporting year**. The existing tabs remain Setup, Monthly data, Precursor sources and Readiness.",
  "",
  "New records are collapsible topics with numbered fields, English/Thai labels, an explicit applicability choice and a Save topic button. Conditional topics need a reason when marked not applicable. Red fields mean unanswered/invalid inputs. Company facts are shared across the operator’s installations; year, month and precursor records are scoped separately.",
  "",
  "General files and sample documents: **Readiness → Upload documents**. Elsewhere, choose an already uploaded document. Producer verification reports remain beside each precursor; original installation diagrams can also be uploaded in Monitoring method and downloaded again.",
  "",
  "Annual calculations use submitted/reviewed months, existing fuel and material calculations, CEMS integration and explicit process/product allocation. They show draft results and blocking findings. Local dataset versions retain OER/OSER/addendum review data as JSON. These are not final EU report templates or independent verification reports.",
  "",
  "**Still partial:** specialised heat/waste-gas/CO₂ attribution, composition-specific intensities, complete Article 14 source/period allocation, complex-good SEFA and server-enforced document permissions. Simple-good SEFA uses the recorded, cited benchmark × CBAM factor × CSCF; benchmark applicability is not automatically certified. Do not use a blocked draft as a completed filing.",
  "",
  "Storage follows the current portal: browser localStorage for records/versions and IndexedDB for original files. This is not cross-device storage or a tamper-proof audit log. Declaring a document internal filters its metadata from the review export; it does not create backend access control.",
  "",
  "[Full numbered structure, frequency and implementation status](docs/CBAM-NUMBERED-INPUT-STRUCTURE.md). Numbers are Certrace references, not EU paragraph numbers. Authoritative scope: [2025/2547](https://eur-lex.europa.eu/eli/reg_impl/2025/2547/oj); free-allocation formula: [2025/2620, Annex equations 2–4](https://eur-lex.europa.eu/eli/reg_impl/2025/2620/oj).",
  "",
  "<details>",
  "<summary>Every input/result: where is it in the web?</summary>",
  "",
  "| Reference | Input / result | Where in the web | Status |",
  "| --- | --- | --- | --- |",
  ...entries.map((e) => `| ${e.id} | ${e.label} | ${e.tab} | ${e.status} |`),
  "",
  "</details>",
  "",
  "Refresh this table and the structure: `cd certrace-portal && npx tsx scripts/write-input-structure.ts`. Check without writing with `--check`.",
  end,
].join("\n");
const originalReadme = readFileSync(readmePath, "utf8");
const from = originalReadme.indexOf(start),
  to = originalReadme.indexOf(end);
const updatedReadme =
  from >= 0 && to >= from
    ? originalReadme.slice(0, from) +
      locationSection +
      originalReadme.slice(to + end.length)
    : originalReadme.trimEnd() + "\n\n" + locationSection + "\n";
if (process.argv.includes("--check")) {
  if (updatedReadme !== originalReadme)
    throw new Error("README input locations are out of date");
} else writeFileSync(readmePath, updatedReadme);
console.log(
  `${entries.length} references; ${entries.filter((e) => String(e.status) === "available").length} available; ${entries.filter((e) => String(e.status) === "partial").length} partial.`,
);
