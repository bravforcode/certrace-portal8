/* The input cells of the EU CBAM Communication template for installations (2024-12-13),
   the reference the Convert fill-in form and the workbook's CBAM tab are built from.

   Every answer lives in the workbook sheet `cbam`, on row 0, under the column `id`
   (`<sheet letter>-<cell>`, e.g. `a-i20` for A_InstData!I20). The id is the template
   cell itself, so an answer maps back to the EU file without a lookup table and two
   fields can never share a key. Keys must match the backend CELL_KEY pattern
   (`[a-z0-9_-]{1,40}` for the column). */

export const CBAM_SHEET_ID = "cbam";

export type CbamTemplateSheet =
  | "A_InstData"
  | "B_EmInst"
  | "C_Emissions&Energy"
  | "D_Processes"
  | "E_PurchPrec";

/** The Convert requirement ids (lib/convert/requirements.ts REQUIREMENT_SOURCES). */
export type CbamItemId =
  | "installation"
  | "goods"
  | "direct"
  | "indirect"
  | "precursors"
  | "carbon-price"
  | "monitoring"
  | "communication"
  | "verification";

export type CbamField = {
  /** `<sheet letter>-<cell>` lowercased, e.g. "a-i20", "d-l65". */
  id: string;
  sheet: CbamTemplateSheet;
  /** Template cell address, e.g. "I20". */
  cell: string;
  label: string;
  /** Heading in the form and the CBAM tab, e.g. "Installation", "Production process 1". */
  section: string;
  item: CbamItemId;
  kind: "text" | "number" | "date" | "select";
  unit?: string;
  options?: readonly string[];
  /** What the form shows for an option whose stored value is a code (TrueFalse stores "1"/"0"). */
  optionLabels?: Readonly<Record<string, string>>;
  /** The template asks for it but marks it optional (e.g. P.O. Box, Fax). */
  optional?: true;
  /** Which production process (1-10) or purchased precursor (1-20) a repeated field belongs to. */
  block?: number;
  group?: CbamBlockGroup;
  /** A row of the A_InstData lists that declares the process or precursor; an answer opens its block. */
  declares?: true;
};

export type CbamBlockGroup = "process" | "precursor";

/** The label shown for a stored option value. Stored values keep the template's spelling
    (trailing space included); only what the reader sees is tidied. */
export const cbamOptionLabel = (
  field: Pick<CbamField, "optionLabels">,
  value: string,
) => field.optionLabels?.[value] ?? value.trim();

const LETTER: Record<CbamTemplateSheet, string> = {
  A_InstData: "a",
  B_EmInst: "b",
  "C_Emissions&Energy": "c",
  D_Processes: "d",
  E_PurchPrec: "e",
};

export const cbamFieldId = (sheet: CbamTemplateSheet, cell: string) =>
  `${LETTER[sheet]}-${cell.toLowerCase()}`;

/** Workbook cell key of a field's answer. */
export const cbamCellKey = (field: Pick<CbamField, "id">) =>
  `${CBAM_SHEET_ID}:0:${field.id}`;

type FieldOpts = Pick<
  CbamField,
  "unit" | "options" | "optionLabels" | "optional"
>;

const field = (
  sheet: CbamTemplateSheet,
  cell: string,
  label: string,
  section: string,
  item: CbamItemId,
  kind: CbamField["kind"],
  opts: FieldOpts = {},
): CbamField => ({
  id: cbamFieldId(sheet, cell),
  sheet,
  cell,
  label,
  section,
  item,
  kind,
  ...opts,
});

// Option lists, copied from the template's named ranges (Parameters_Constants). Values are kept
// exactly as the workbook validation stores them, including the trailing space in "Calcined clays ".
const TRUE_FALSE = ["1", "0"] as const; // CONST_TrueFalse: the template stores 1 and 0
const TRUE_FALSE_LABELS = { "1": "Yes", "0": "No" } as const;
const AD_UNIT = ["t", "1000Nm3"] as const; // CONST_torkNm3
const EF_UNIT = ["tCO2/TJ", "tCO2/t", "tCO2/1000Nm3"] as const; // CONST_tCO2pTJOrtCO2pt
const MONITORING = ["Combustion", "Process emissions", "Mass Balance"] as const; // CONST_MonitoringApproach
const MEAS_DEFAULT_UNKNOWN = ["Measured", "Default", "Unknown"] as const; // CONST_MeasDefaultUnknown
const ELEC_SOURCE = [
  "D.4(a)",
  "D.4(b)",
  "D.4.1",
  "D.4.2",
  "D.4.3.1",
  "D.4.3.2",
  "Mix",
] as const; // CONST_ElecSource
const DATA_QUALITY = [
  "Mostly measurements & analyses",
  "Mostly measurements & national standard factors for e.g. the emission factor",
  "Mostly measurements & sector-specific standard factors for e.g. the emission factor",
  "Mostly measurements & international standard factors for e.g. the emission factor",
  "Mostly default values provided by the European Commission",
] as const; // CONST_DataQuality
const DATA_JUSTIFICATION = [
  "Unreasonable costs for more accurate monitoring",
  "Data gaps",
  "Other",
] as const; // CONST_DataQualityJustification
const DATA_VERIFICATION = [
  "Third-party verification",
  "Internal audits",
  "Four eyes principle",
  "None",
] as const; // CONST_DataVerification
const GOODS = [
  "Cement",
  "Cement clinker",
  "Calcined clays ",
  "Aluminous cement",
  "Iron or steel products",
  "Crude steel",
  "Direct reduced iron",
  "Pig iron",
  "Alloys (FeMn, FeCr, FeNi)",
  "Sintered Ore",
  "Hydrogen",
  "Ammonia",
  "Nitric acid",
  "Urea",
  "Mixed fertilisers",
  "Aluminium products",
  "Unwrought aluminium",
  "Electricity (export to EU)",
] as const; // CONST_LIST_Goods

// A_InstData lists production processes P1-P10 on rows 83-92 (part b) and purchased precursors
// PP1-PP20 on rows 102-121. Sheet D repeats its block every 65 rows per process, and sheet E
// every 44 rows per precursor (checked against the v2.1.1 file). Each list below is block 1;
// `blocks` derives the rest. Only block 1 is required: most installations have one.
const PROCESSES = 10;
const PRECURSORS = 20;
const D_STRIDE = 65;
const E_STRIDE = 44;

type BlockField = [
  cell: string,
  label: string,
  kind: CbamField["kind"],
  opts?: FieldOpts,
];
type BlockSpec = {
  group: CbamBlockGroup;
  count: number;
  stride: number;
  declares?: true;
};

const PROCESS_LIST: BlockSpec = {
  group: "process",
  count: PROCESSES,
  stride: 1,
  declares: true,
};
const PRECURSOR_LIST: BlockSpec = {
  group: "precursor",
  count: PRECURSORS,
  stride: 1,
  declares: true,
};
const PROCESS_SHEET: BlockSpec = {
  group: "process",
  count: PROCESSES,
  stride: D_STRIDE,
};
const PRECURSOR_SHEET: BlockSpec = {
  group: "precursor",
  count: PRECURSORS,
  stride: E_STRIDE,
};

const blocks = (
  sheet: CbamTemplateSheet,
  base: string,
  item: CbamItemId,
  { group, count, stride, declares }: BlockSpec,
  list: readonly BlockField[],
): CbamField[] =>
  Array.from({ length: count }, (_, i) =>
    list.map(([cell, label, kind, opts = {}]) => {
      const [, col, row] = /^([A-Z]+)(\d+)$/.exec(cell)!;
      return {
        ...field(
          sheet,
          `${col}${Number(row) + stride * i}`,
          label,
          `${base} ${i + 1}`,
          item,
          kind,
          opts,
        ),
        block: i + 1,
        group,
        ...(declares ? { declares } : {}),
        ...(i > 0 ? { optional: true as const } : {}),
      };
    }),
  ).flat();

const A_PROCESS: readonly BlockField[] = [
  ["E83", "Aggregated goods category", "select", { options: GOODS }],
  [
    "F83",
    "Included goods category",
    "select",
    { options: GOODS, optional: true },
  ],
  ["L83", "Name", "text"],
];

const A_PRECURSOR: readonly BlockField[] = [
  ["E102", "Production process", "select", { options: GOODS }],
  ["F102", "Country code", "text"],
  ["G102", "Route 1", "text"],
  ["L102", "Name", "text"],
];

const D_INDIRECT: readonly BlockField[] = [
  ["L65", "Electricity consumption", "number", { unit: "MWh" }],
  ["L66", "Emission factor of the electricity", "number", { unit: "tCO2/MWh" }],
  ["L67", "Source of the emission factor", "select", { options: ELEC_SOURCE }],
  ["L71", "Amounts exported", "number", { unit: "MWh" }],
  [
    "L72",
    "Emission factor of the exported electricity",
    "number",
    { unit: "tCO2/MWh" },
  ],
];

const D_COMMUNICATION: readonly BlockField[] = [
  ["L16", "Amounts, route no. 1", "number"],
  ["L27", "Produced for the market", "number"],
  ["L32", "Consumed in other production processes, item 1", "number"],
  ["L41", "Consumed for non-CBAM goods within the installation", "number"],
  [
    "K50",
    "Measurable heat applicable",
    "select",
    { options: TRUE_FALSE, optionLabels: TRUE_FALSE_LABELS },
  ],
  [
    "L50",
    "Waste gases applicable",
    "select",
    { options: TRUE_FALSE, optionLabels: TRUE_FALSE_LABELS },
  ],
  [
    "L54",
    "Directly attributable emissions (DirEm*)",
    "number",
    { unit: "tCO2e" },
  ],
  ["L57", "Net measurable heat, imported", "number", { unit: "TJ" }],
  ["M57", "Net measurable heat, exported", "number", { unit: "TJ" }],
  [
    "L58",
    "Emission factor for net measurable heat, imported",
    "number",
    { unit: "tCO2/TJ" },
  ],
  [
    "M58",
    "Emission factor for net measurable heat, exported",
    "number",
    { unit: "tCO2/TJ" },
  ],
  ["L61", "Waste gas, imported", "number", { unit: "TJ" }],
  ["M61", "Waste gas, exported", "number", { unit: "TJ" }],
  [
    "L62",
    "Emission factor for waste gas, imported",
    "number",
    { unit: "tCO2/TJ" },
  ],
  [
    "M62",
    "Emission factor for waste gas, exported",
    "number",
    { unit: "tCO2/TJ" },
  ],
];

const E_PRECURSOR: readonly BlockField[] = [
  ["L17", "Total purchased levels, route no. 1", "number"],
  ["L28", "Consumed in production processes, item 1", "number"],
  ["L38", "Consumed for other purposes (sold or non-CBAM goods)", "number"],
  ["L49", "Specific embedded direct emissions (SEE direct), value", "number"],
  [
    "M49",
    "Specific embedded direct emissions (SEE direct), source",
    "select",
    { options: MEAS_DEFAULT_UNKNOWN },
  ],
  ["L50", "Specific electricity consumption (SEE indirect), value", "number"],
  [
    "M50",
    "Specific electricity consumption (SEE indirect), source",
    "select",
    { options: MEAS_DEFAULT_UNKNOWN },
  ],
  ["L51", "Electricity emission factor (SEE indirect), value", "number"],
  [
    "M51",
    "Electricity emission factor (SEE indirect), source",
    "select",
    { options: ELEC_SOURCE },
  ],
  [
    "K54",
    "Justification for use of default values",
    "select",
    { options: DATA_JUSTIFICATION },
  ],
];

export const CBAM_FIELDS: readonly CbamField[] = [
  // Installation: reporting period, installation, authorised representative, operator
  field(
    "A_InstData",
    "I9",
    "Reporting period start",
    "Reporting period",
    "installation",
    "date",
  ),
  field(
    "A_InstData",
    "L9",
    "Reporting period end",
    "Reporting period",
    "installation",
    "date",
  ),
  field(
    "A_InstData",
    "I19",
    "Name of the installation",
    "Installation",
    "installation",
    "text",
    { optional: true },
  ),
  field(
    "A_InstData",
    "I20",
    "Name of the installation (English name)",
    "Installation",
    "installation",
    "text",
  ),
  field(
    "A_InstData",
    "I21",
    "Street, number",
    "Installation",
    "installation",
    "text",
  ),
  field(
    "A_InstData",
    "I22",
    "Economic activity",
    "Installation",
    "installation",
    "text",
  ),
  field(
    "A_InstData",
    "I23",
    "Post code",
    "Installation",
    "installation",
    "text",
  ),
  field(
    "A_InstData",
    "I24",
    "P.O. Box",
    "Installation",
    "installation",
    "text",
    { optional: true },
  ),
  field("A_InstData", "I25", "City", "Installation", "installation", "text"),
  field("A_InstData", "I26", "Country", "Installation", "installation", "text"),
  field(
    "A_InstData",
    "I27",
    "UNLOCODE",
    "Installation",
    "installation",
    "text",
  ),
  field(
    "A_InstData",
    "I28",
    "Coordinates of the main emission source (latitude)",
    "Installation",
    "installation",
    "text",
  ),
  field(
    "A_InstData",
    "I29",
    "Coordinates of the main emission source (longitude)",
    "Installation",
    "installation",
    "text",
  ),
  field(
    "A_InstData",
    "I30",
    "Name of authorised representative",
    "Authorised representative",
    "installation",
    "text",
  ),
  field(
    "A_InstData",
    "I31",
    "Email",
    "Authorised representative",
    "installation",
    "text",
  ),
  field(
    "A_InstData",
    "I32",
    "Telephone",
    "Authorised representative",
    "installation",
    "text",
  ),
  field(
    "A_InstData",
    "I37",
    "Company name",
    "Operator",
    "installation",
    "text",
  ),
  field(
    "A_InstData",
    "I38",
    "Street, number",
    "Operator",
    "installation",
    "text",
  ),
  field("A_InstData", "I39", "City", "Operator", "installation", "text"),
  field(
    "A_InstData",
    "I40",
    "Postcode / ZIP",
    "Operator",
    "installation",
    "text",
  ),
  field("A_InstData", "I41", "Country", "Operator", "installation", "text"),

  // Verification
  field("A_InstData", "I45", "Name", "Verifier", "verification", "text"),
  field(
    "A_InstData",
    "I46",
    "Email address",
    "Verifier",
    "verification",
    "text",
  ),
  field(
    "A_InstData",
    "I47",
    "Telephone number",
    "Verifier",
    "verification",
    "text",
  ),
  field("A_InstData", "I48", "Fax", "Verifier", "verification", "text", {
    optional: true,
  }),
  field(
    "A_InstData",
    "I51",
    "Accreditation Member State",
    "Verifier",
    "verification",
    "text",
  ),
  field(
    "A_InstData",
    "I52",
    "Name of the national accreditation body",
    "Verifier",
    "verification",
    "text",
  ),
  field(
    "A_InstData",
    "I53",
    "Registration number issued by the accreditation body",
    "Verifier",
    "verification",
    "text",
  ),

  // Goods: first aggregated goods row, routes 1-2; the production processes and purchased
  // precursors the installation declares
  field(
    "A_InstData",
    "E62",
    "Aggregated goods category",
    "Goods",
    "goods",
    "select",
    { options: GOODS },
  ),
  field("A_InstData", "I62", "Route 1", "Goods", "goods", "text"),
  field("A_InstData", "J62", "Route 2", "Goods", "goods", "text"),
  ...blocks(
    "A_InstData",
    "Production process",
    "goods",
    PROCESS_LIST,
    A_PROCESS,
  ),
  ...blocks(
    "A_InstData",
    "Purchased precursor",
    "goods",
    PRECURSOR_LIST,
    A_PRECURSOR,
  ),

  // Direct emissions: first source stream (row 17) and the fuel and GHG balance
  field("B_EmInst", "D17", "Method", "Source streams", "direct", "select", {
    options: MONITORING,
  }),
  field(
    "B_EmInst",
    "E17",
    "Source stream name",
    "Source streams",
    "direct",
    "text",
  ),
  field(
    "B_EmInst",
    "F17",
    "Activity data (AD)",
    "Source streams",
    "direct",
    "text",
  ),
  field("B_EmInst", "G17", "AD unit", "Source streams", "direct", "select", {
    options: AD_UNIT,
  }),
  field(
    "B_EmInst",
    "H17",
    "Net calorific value (NCV)",
    "Source streams",
    "direct",
    "number",
  ),
  field(
    "B_EmInst",
    "J17",
    "Emission factor (EF)",
    "Source streams",
    "direct",
    "number",
  ),
  field("B_EmInst", "K17", "EF unit", "Source streams", "direct", "select", {
    options: EF_UNIT,
  }),
  field(
    "B_EmInst",
    "L17",
    "Carbon content",
    "Source streams",
    "direct",
    "number",
  ),
  field(
    "B_EmInst",
    "N17",
    "Oxidation factor (OxF)",
    "Source streams",
    "direct",
    "number",
  ),
  field(
    "B_EmInst",
    "P17",
    "Conversion factor (ConvF)",
    "Source streams",
    "direct",
    "number",
  ),
  field(
    "B_EmInst",
    "R17",
    "Biomass content (BioC)",
    "Source streams",
    "direct",
    "number",
  ),
  field(
    "C_Emissions&Energy",
    "H16",
    "Total fuel input",
    "Fuel and GHG balance",
    "direct",
    "number",
    { unit: "TJ" },
  ),
  field(
    "C_Emissions&Energy",
    "I16",
    "Direct fuel for CBAM goods",
    "Fuel and GHG balance",
    "direct",
    "number",
    { unit: "TJ" },
  ),
  field(
    "C_Emissions&Energy",
    "J16",
    "Fuel for electricity",
    "Fuel and GHG balance",
    "direct",
    "number",
    { unit: "TJ" },
  ),
  field(
    "C_Emissions&Energy",
    "K16",
    "Direct fuel for non-CBAM goods",
    "Fuel and GHG balance",
    "direct",
    "number",
    { unit: "TJ" },
  ),
  field(
    "C_Emissions&Energy",
    "H26",
    "Total CO2 emissions",
    "Fuel and GHG balance",
    "direct",
    "number",
    { unit: "tCO2e" },
  ),
  field(
    "C_Emissions&Energy",
    "I26",
    "Biomass emissions",
    "Fuel and GHG balance",
    "direct",
    "number",
    { unit: "tCO2e" },
  ),
  field(
    "C_Emissions&Energy",
    "J26",
    "Total N2O emissions",
    "Fuel and GHG balance",
    "direct",
    "number",
    { unit: "tCO2e" },
  ),
  field(
    "C_Emissions&Energy",
    "K26",
    "Total PFC emissions",
    "Fuel and GHG balance",
    "direct",
    "number",
    { unit: "tCO2e" },
  ),
  field(
    "C_Emissions&Energy",
    "M26",
    "Total indirect emissions",
    "Fuel and GHG balance",
    "direct",
    "number",
    { unit: "tCO2e" },
  ),

  // Monitoring: data quality
  field(
    "C_Emissions&Energy",
    "H40",
    "General information on data quality",
    "Data quality",
    "monitoring",
    "select",
    { options: DATA_QUALITY },
  ),
  field(
    "C_Emissions&Energy",
    "H41",
    "Justification for use of default values (if relevant)",
    "Data quality",
    "monitoring",
    "select",
    { options: DATA_JUSTIFICATION },
  ),
  field(
    "C_Emissions&Energy",
    "H42",
    "Information on quality assurance",
    "Data quality",
    "monitoring",
    "select",
    { options: DATA_VERIFICATION },
  ),

  // Indirect emissions (electricity) and communication: production processes 1-10
  ...blocks(
    "D_Processes",
    "Production process",
    "indirect",
    PROCESS_SHEET,
    D_INDIRECT,
  ),
  ...blocks(
    "D_Processes",
    "Production process",
    "communication",
    PROCESS_SHEET,
    D_COMMUNICATION,
  ),

  // Precursors: purchased precursors 1-20
  ...blocks(
    "E_PurchPrec",
    "Purchased precursor",
    "precursors",
    PRECURSOR_SHEET,
    E_PRECURSOR,
  ),
];

export const cbamFieldsFor = (item: string): CbamField[] =>
  CBAM_FIELDS.filter((f) => f.item === item);

type BlockRef = { block?: number; group?: CbamBlockGroup; declares?: true };
const blockKey = (group: CbamBlockGroup | undefined, block: number) =>
  `${group}:${block}`;

/** `process:n` / `precursor:m` for each process and precursor the A_InstData lists declare in `cells`. */
export function declaredBlocks(cells: Record<string, string>): string[] {
  return [
    ...new Set(
      CBAM_FIELDS.filter(
        (f) => f.declares && (cells[cbamCellKey(f)] ?? "").trim() !== "",
      ).map((f) => blockKey(f.group, f.block!)),
    ),
  ];
}

/** The fields a form shows. Block 1 always, and any block that already holds an answer.
    In sheets D and E, once A_InstData declares processes (or precursors), exactly the declared
    ones; before that, and in the A_InstData lists themselves, the next empty block after one
    with an answer, so a single-process installation never scrolls past nine empty processes. */
export function visibleBlocks<F extends BlockRef>(
  fields: readonly F[],
  answered: (f: F) => boolean,
  declared: readonly string[] = [],
): F[] {
  const open = new Set([
    ...declared,
    ...fields
      .filter((f) => f.block && answered(f))
      .map((f) => blockKey(f.group, f.block!)),
  ]);
  const listed = new Set(declared.map((k) => k.split(":")[0]));
  return fields.filter((f) => {
    if (!f.block || f.block === 1 || open.has(blockKey(f.group, f.block)))
      return true;
    const followsDeclarations = !f.declares && listed.has(f.group!);
    return !followsDeclarations && open.has(blockKey(f.group, f.block - 1));
  });
}

/** Required fields filled / required fields, for one item or for all of them. */
export function cbamProgress(cells: Record<string, string>, item?: string) {
  const fields = (item ? cbamFieldsFor(item) : [...CBAM_FIELDS]).filter(
    (f) => !f.optional,
  );
  const filled = fields.filter(
    (f) => (cells[cbamCellKey(f)] ?? "").trim() !== "",
  ).length;
  return { filled, total: fields.length };
}

/** "Section · Label" for a CBAM cell key (`cbam:0:<id>` or the bare id); the bare id when the catalogue does not know it. */
export const cbamCellLabel = (key: string): string => {
  const id = key.replace(/^cbam:0:/, "");
  const f = CBAM_FIELDS.find((x) => x.id === id);
  return f ? `${f.section} · ${f.label}` : id;
};
