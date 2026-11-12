/** Conservative extraction of labelled quantities from real PDF text.
 * No filename or PDF metadata can supply a measurement. Scans remain manual.
 */
import type { ExtractedField } from "./workspace-evidence";
import { loadPdfJs } from "./pdf-loader";

export type DocumentPage = { page: number; text: string };
export type DocumentReading = {
  subject:
    | "electricity_bill"
    | "electricity_meter"
    | "fuel_invoice"
    | "fuel_meter"
    | "production"
    | "unknown";
  month?: string;
  fuelType?: string;
  fields: ExtractedField[];
  summary: string;
  periodConflict: boolean;
};

const NUMBER = "([0-9]+(?:[ ,][0-9]{3})*(?:\\.[0-9]+)?)";
const quantity = (label: string, units: string) =>
  new RegExp(
    `(?:${label})[ \t:=()]{0,45}${NUMBER}\\s*(${units})(?![a-z])`,
    "i",
  );
const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export function readDocumentPages(pages: DocumentPage[]): DocumentReading {
  const text = pages.map((p) => p.text).join("\n");
  const electricity = /electricity|electrical energy|active energy|ไฟฟ้า/i.test(
    text,
  );
  const production =
    /production (?:record|report|output|log)|saleable output|tonnes produced|total production/i.test(
      text,
    );
  const fuelType = /natural gas/i.test(text)
    ? "natural_gas"
    : /diesel/i.test(text)
      ? "diesel"
      : undefined;
  const consumption =
    /fuel consumption|gas consumption|fuel consumed|gas consumed|meter log|consumption record/i.test(
      text,
    );
  const subject: DocumentReading["subject"] = electricity
    ? "electricity_bill"
    : production
      ? "production"
      : fuelType
        ? consumption
          ? "fuel_meter"
          : "fuel_invoice"
        : "unknown";
  // Only explicit reporting/billing/consumption periods determine a month.
  // Invoice issue dates never stand in for the measured interval.
  const periods = [
    ...text.matchAll(
      /(?:reporting|billing|consumption|production|metering)\s*(?:period|month)\s*[:\-]?\s*([^\n]{1,100})/gi,
    ),
  ].map((m) => m[1]);
  const months = new Set<string>();
  for (const period of periods) {
    for (const match of period.matchAll(
      /(20\d{2})[-/](0[1-9]|1[0-2])(?:[-/][0-3]\d)?/g,
    ))
      months.add(`${match[1]}-${match[2]}`);
    for (const match of period.matchAll(
      /(?:\d{1,2}\s+)?([a-z]+)\s+(20\d{2})/gi,
    )) {
      const index = MONTH_NAMES.findIndex(
        (name) =>
          name === match[1].toLowerCase() ||
          name.slice(0, 3) === match[1].toLowerCase(),
      );
      if (index >= 0)
        months.add(`${match[2]}-${String(index + 1).padStart(2, "0")}`);
    }
  }
  const candidates: ExtractedField[] = [];
  const rules = [
    {
      key: "electricity-consumed",
      when: electricity,
      re: quantity(
        "total (?:active )?(?:electricity|energy)(?: consumed| consumption)?|electricity consum(?:ed|ption)|active energy(?: consumed)?|energy consumed|consumption",
        "kWh|MWh",
      ),
    },
    {
      key: "production-tonnes",
      when: production,
      re: quantity(
        "total (?:saleable )?(?:production|output)|saleable output|production output|quantity produced|produced this month",
        "tonnes?|tons?|t|kg",
      ),
    },
    {
      key: "fuel-quantity",
      when: !!fuelType && consumption,
      re: quantity(
        "(?:total )?(?:natural gas|gas|diesel|fuel) consum(?:ed|ption)|(?:total )?consumption",
        "m³|m3|Nm3|litres?|liters?|L|kg|tonnes?|t|GJ",
      ),
    },
    {
      key: "fuel-delivered",
      when: !!fuelType && !consumption,
      re: quantity(
        "quantity delivered|delivered quantity|delivery quantity|net quantity|quantity",
        "m³|m3|litres?|liters?|L|kg|tonnes?|t|GJ",
      ),
    },
  ];
  for (const rule of rules) {
    if (!rule.when) continue;
    for (const page of pages) {
      const matches = [...page.text.matchAll(new RegExp(rule.re.source, "gi"))];
      for (const match of matches) {
        const unit = /^(?:ton|tonne)/i.test(match[2])
          ? "t"
          : /^(?:lit|L$)/i.test(match[2])
            ? "l"
            : match[2] === "m³"
              ? "m3"
              : match[2];
        candidates.push({
          key: rule.key,
          value: match[1].replace(/[ ,]/g, ""),
          unit,
          confidence: 0.9,
          accepted: false,
          page: page.page,
          excerpt: match[0],
        });
      }
    }
  }
  // Multiple differing totals for a key need a human; do not pick one at random.
  const fields: ExtractedField[] = [];
  for (const key of new Set(candidates.map((f) => f.key))) {
    const values = candidates.filter((f) => f.key === key);
    const unique = new Set(values.map((f) => `${f.value}|${f.unit}`));
    if (unique.size === 1) fields.push(values[0]);
  }
  return {
    subject,
    fuelType,
    month: months.size === 1 ? [...months][0] : undefined,
    periodConflict: months.size > 1,
    fields,
    summary:
      months.size > 1
        ? "The document covers more than one month. Attach it as evidence or use separate monthly meter records; its total will not be assigned to one month."
        : fields.length
          ? `${fields.length} labelled quantities read from the document. Check the period, source and values before filling the form.`
          : "No unambiguous labelled quantities found. You can attach the document and enter the values manually.",
  };
}

export async function readPdfPages(
  bytes: ArrayBuffer,
): Promise<DocumentPage[]> {
  const pdfjs = await loadPdfJs();
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes.slice(0)) });
  const pdf = await task.promise;
  try {
    if (pdf.numPages > 100)
      throw new Error(
        "This PDF has more than 100 pages. Upload the relevant pages for autofill.",
      );
    const pages: DocumentPage[] = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      let text = "";
      let lastY: number | undefined;
      for (const item of content.items) {
        if (!("str" in item)) continue;
        const y = Math.round(item.transform[5]);
        text += `${lastY != null && Math.abs(lastY - y) > 3 ? "\n" : " "}${item.str}`;
        if (item.hasEOL) text += "\n";
        lastY = y;
      }
      pages.push({ page: n, text });
      page.cleanup();
    }
    return pages;
  } finally {
    await task.destroy();
  }
}
