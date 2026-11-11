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
  /** The template asks for it but marks it optional (e.g. P.O. Box, Fax). */
  optional?: true;
};

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
export const cbamCellKey = (field: Pick<CbamField, "id">) => `${CBAM_SHEET_ID}:0:${field.id}`;

type FieldOpts = { unit?: string; options?: readonly string[]; optional?: true };

const field = (
  sheet: CbamTemplateSheet,
  cell: string,
  label: string,
  section: string,
  item: CbamItemId,
  kind: CbamField["kind"],
  opts: FieldOpts = {},
): CbamField => ({ id: cbamFieldId(sheet, cell), sheet, cell, label, section, item, kind, ...opts });

// Option lists, copied from the template's named ranges (Parameters_Constants). Values are kept
// exactly as the workbook validation stores them, including the trailing space in "Calcined clays ".
const TRUE_FALSE = ["1", "0"] as const; // CONST_TrueFalse: the template stores 1 and 0
const AD_UNIT = ["t", "1000Nm3"] as const; // CONST_torkNm3
const EF_UNIT = ["tCO2/TJ", "tCO2/t", "tCO2/1000Nm3"] as const; // CONST_tCO2pTJOrtCO2pt
const MONITORING = ["Combustion", "Process emissions", "Mass Balance"] as const; // CONST_MonitoringApproach
const MEAS_DEFAULT_UNKNOWN = ["Measured", "Default", "Unknown"] as const; // CONST_MeasDefaultUnknown
const ELEC_SOURCE = ["D.4(a)", "D.4(b)", "D.4.1", "D.4.2", "D.4.3.1", "D.4.3.2", "Mix"] as const; // CONST_ElecSource
const DATA_QUALITY = [
  "Mostly measurements & analyses",
  "Mostly measurements & national standard factors for e.g. the emission factor",
  "Mostly measurements & sector-specific standard factors for e.g. the emission factor",
  "Mostly measurements & international standard factors for e.g. the emission factor",
  "Mostly default values provided by the European Commission",
] as const; // CONST_DataQuality
const DATA_JUSTIFICATION = ["Unreasonable costs for more accurate monitoring", "Data gaps", "Other"] as const; // CONST_DataQualityJustification
const DATA_VERIFICATION = ["Third-party verification", "Internal audits", "Four eyes principle", "None"] as const; // CONST_DataVerification
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

export const CBAM_FIELDS: readonly CbamField[] = [
  // Installation: reporting period, installation, authorised representative, operator
  field("A_InstData", "I9", "Reporting period start", "Reporting period", "installation", "date"),
  field("A_InstData", "L9", "Reporting period end", "Reporting period", "installation", "date"),
  field("A_InstData", "I19", "Name of the installation", "Installation", "installation", "text", { optional: true }),
  field("A_InstData", "I20", "Name of the installation (English name)", "Installation", "installation", "text"),
  field("A_InstData", "I21", "Street, number", "Installation", "installation", "text"),
  field("A_InstData", "I22", "Economic activity", "Installation", "installation", "text"),
  field("A_InstData", "I23", "Post code", "Installation", "installation", "text"),
  field("A_InstData", "I24", "P.O. Box", "Installation", "installation", "text", { optional: true }),
  field("A_InstData", "I25", "City", "Installation", "installation", "text"),
  field("A_InstData", "I26", "Country", "Installation", "installation", "text"),
  field("A_InstData", "I27", "UNLOCODE", "Installation", "installation", "text"),
  field("A_InstData", "I28", "Coordinates of the main emission source (latitude)", "Installation", "installation", "text"),
  field("A_InstData", "I29", "Coordinates of the main emission source (longitude)", "Installation", "installation", "text"),
  field("A_InstData", "I30", "Name of authorised representative", "Authorised representative", "installation", "text"),
  field("A_InstData", "I31", "Email", "Authorised representative", "installation", "text"),
  field("A_InstData", "I32", "Telephone", "Authorised representative", "installation", "text"),
  field("A_InstData", "I37", "Company name", "Operator", "installation", "text"),
  field("A_InstData", "I38", "Street, number", "Operator", "installation", "text"),
  field("A_InstData", "I39", "City", "Operator", "installation", "text"),
  field("A_InstData", "I40", "Postcode / ZIP", "Operator", "installation", "text"),
  field("A_InstData", "I41", "Country", "Operator", "installation", "text"),

  // Verification
  field("A_InstData", "I45", "Name", "Verifier", "verification", "text"),
  field("A_InstData", "I46", "Email address", "Verifier", "verification", "text"),
  field("A_InstData", "I47", "Telephone number", "Verifier", "verification", "text"),
  field("A_InstData", "I48", "Fax", "Verifier", "verification", "text", { optional: true }),
  field("A_InstData", "I51", "Accreditation Member State", "Verifier", "verification", "text"),
  field("A_InstData", "I52", "Name of the national accreditation body", "Verifier", "verification", "text"),
  field("A_InstData", "I53", "Registration number issued by the accreditation body", "Verifier", "verification", "text"),

  // Goods: first aggregated goods row, routes 1-2; first precursor row
  field("A_InstData", "E62", "Aggregated goods category", "Goods", "goods", "select", { options: GOODS }),
  field("A_InstData", "I62", "Route 1", "Goods", "goods", "text"),
  field("A_InstData", "J62", "Route 2", "Goods", "goods", "text"),
  field("A_InstData", "E102", "Production process", "Precursor routes", "goods", "select", { options: GOODS }),
  field("A_InstData", "F102", "Country code", "Precursor routes", "goods", "text"),
  field("A_InstData", "G102", "Route 1", "Precursor routes", "goods", "text"),

  // Direct emissions: first source stream (row 17) and the fuel and GHG balance
  field("B_EmInst", "D17", "Method", "Source streams", "direct", "select", { options: MONITORING }),
  field("B_EmInst", "E17", "Source stream name", "Source streams", "direct", "text"),
  field("B_EmInst", "F17", "Activity data (AD)", "Source streams", "direct", "text"),
  field("B_EmInst", "G17", "AD unit", "Source streams", "direct", "select", { options: AD_UNIT }),
  field("B_EmInst", "H17", "Net calorific value (NCV)", "Source streams", "direct", "number"),
  field("B_EmInst", "J17", "Emission factor (EF)", "Source streams", "direct", "number"),
  field("B_EmInst", "K17", "EF unit", "Source streams", "direct", "select", { options: EF_UNIT }),
  field("B_EmInst", "L17", "Carbon content", "Source streams", "direct", "number"),
  field("B_EmInst", "N17", "Oxidation factor (OxF)", "Source streams", "direct", "number"),
  field("B_EmInst", "P17", "Conversion factor (ConvF)", "Source streams", "direct", "number"),
  field("B_EmInst", "R17", "Biomass content (BioC)", "Source streams", "direct", "number"),
  field("C_Emissions&Energy", "H16", "Total fuel input", "Fuel and GHG balance", "direct", "number", { unit: "TJ" }),
  field("C_Emissions&Energy", "I16", "Direct fuel for CBAM goods", "Fuel and GHG balance", "direct", "number", { unit: "TJ" }),
  field("C_Emissions&Energy", "J16", "Fuel for electricity", "Fuel and GHG balance", "direct", "number", { unit: "TJ" }),
  field("C_Emissions&Energy", "K16", "Direct fuel for non-CBAM goods", "Fuel and GHG balance", "direct", "number", { unit: "TJ" }),
  field("C_Emissions&Energy", "H26", "Total CO2 emissions", "Fuel and GHG balance", "direct", "number", { unit: "tCO2e" }),
  field("C_Emissions&Energy", "I26", "Biomass emissions", "Fuel and GHG balance", "direct", "number", { unit: "tCO2e" }),
  field("C_Emissions&Energy", "J26", "Total N2O emissions", "Fuel and GHG balance", "direct", "number", { unit: "tCO2e" }),
  field("C_Emissions&Energy", "K26", "Total PFC emissions", "Fuel and GHG balance", "direct", "number", { unit: "tCO2e" }),
  field("C_Emissions&Energy", "M26", "Total indirect emissions", "Fuel and GHG balance", "direct", "number", { unit: "tCO2e" }),

  // Monitoring: data quality
  field("C_Emissions&Energy", "H40", "General information on data quality", "Data quality", "monitoring", "select", { options: DATA_QUALITY }),
  field("C_Emissions&Energy", "H41", "Justification for use of default values (if relevant)", "Data quality", "monitoring", "select", { options: DATA_JUSTIFICATION }),
  field("C_Emissions&Energy", "H42", "Information on quality assurance", "Data quality", "monitoring", "select", { options: DATA_VERIFICATION }),

  // Indirect emissions: electricity, first production process
  field("D_Processes", "L65", "Electricity consumption", "Production process 1", "indirect", "number", { unit: "MWh" }),
  field("D_Processes", "L66", "Emission factor of the electricity", "Production process 1", "indirect", "number", { unit: "tCO2/MWh" }),
  field("D_Processes", "L67", "Source of the emission factor", "Production process 1", "indirect", "select", { options: ELEC_SOURCE }),
  field("D_Processes", "L71", "Amounts exported", "Production process 1", "indirect", "number", { unit: "MWh" }),
  field("D_Processes", "L72", "Emission factor of the exported electricity", "Production process 1", "indirect", "number", { unit: "tCO2/MWh" }),

  // Communication: first production process
  field("D_Processes", "L16", "Amounts, route no. 1", "Production process 1", "communication", "number"),
  field("D_Processes", "L27", "Produced for the market", "Production process 1", "communication", "number"),
  field("D_Processes", "L32", "Consumed in other production processes, item 1", "Production process 1", "communication", "number"),
  field("D_Processes", "L41", "Consumed for non-CBAM goods within the installation", "Production process 1", "communication", "number"),
  field("D_Processes", "K50", "Measurable heat applicable", "Production process 1", "communication", "select", { options: TRUE_FALSE }),
  field("D_Processes", "L50", "Waste gases applicable", "Production process 1", "communication", "select", { options: TRUE_FALSE }),
  field("D_Processes", "L54", "Directly attributable emissions (DirEm*)", "Production process 1", "communication", "number", { unit: "tCO2e" }),
  field("D_Processes", "L57", "Net measurable heat, imported", "Production process 1", "communication", "number", { unit: "TJ" }),
  field("D_Processes", "M57", "Net measurable heat, exported", "Production process 1", "communication", "number", { unit: "TJ" }),
  field("D_Processes", "L58", "Emission factor for net measurable heat, imported", "Production process 1", "communication", "number", { unit: "tCO2/TJ" }),
  field("D_Processes", "M58", "Emission factor for net measurable heat, exported", "Production process 1", "communication", "number", { unit: "tCO2/TJ" }),
  field("D_Processes", "L61", "Waste gas, imported", "Production process 1", "communication", "number", { unit: "TJ" }),
  field("D_Processes", "M61", "Waste gas, exported", "Production process 1", "communication", "number", { unit: "TJ" }),
  field("D_Processes", "L62", "Emission factor for waste gas, imported", "Production process 1", "communication", "number", { unit: "tCO2/TJ" }),
  field("D_Processes", "M62", "Emission factor for waste gas, exported", "Production process 1", "communication", "number", { unit: "tCO2/TJ" }),

  // Precursors: first purchased precursor
  field("E_PurchPrec", "L17", "Total purchased levels, route no. 1", "Purchased precursor 1", "precursors", "number"),
  field("E_PurchPrec", "L28", "Consumed in production processes, item 1", "Purchased precursor 1", "precursors", "number"),
  field("E_PurchPrec", "L38", "Consumed for other purposes (sold or non-CBAM goods)", "Purchased precursor 1", "precursors", "number"),
  field("E_PurchPrec", "L49", "Specific embedded direct emissions (SEE direct), value", "Purchased precursor 1", "precursors", "number"),
  field("E_PurchPrec", "M49", "Specific embedded direct emissions (SEE direct), source", "Purchased precursor 1", "precursors", "select", { options: MEAS_DEFAULT_UNKNOWN }),
  field("E_PurchPrec", "L50", "Specific electricity consumption (SEE indirect), value", "Purchased precursor 1", "precursors", "number"),
  field("E_PurchPrec", "M50", "Specific electricity consumption (SEE indirect), source", "Purchased precursor 1", "precursors", "select", { options: MEAS_DEFAULT_UNKNOWN }),
  field("E_PurchPrec", "L51", "Electricity emission factor (SEE indirect), value", "Purchased precursor 1", "precursors", "number"),
  field("E_PurchPrec", "M51", "Electricity emission factor (SEE indirect), source", "Purchased precursor 1", "precursors", "select", { options: ELEC_SOURCE }),
  field("E_PurchPrec", "K54", "Justification for use of default values", "Purchased precursor 1", "precursors", "select", { options: DATA_JUSTIFICATION }),
];

export const cbamFieldsFor = (item: string): CbamField[] =>
  CBAM_FIELDS.filter((f) => f.item === item);

/** Required fields filled / required fields, for one item or for all of them. */
export function cbamProgress(cells: Record<string, string>, item?: string) {
  const fields = (item ? cbamFieldsFor(item) : [...CBAM_FIELDS]).filter((f) => !f.optional);
  const filled = fields.filter((f) => (cells[cbamCellKey(f)] ?? "").trim() !== "").length;
  return { filled, total: fields.length };
}
