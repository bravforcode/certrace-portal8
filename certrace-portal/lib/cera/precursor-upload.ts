/* ════════════════════════════════════════════════════════════
   CERA ON A PRECURSOR'S OWN LINK — reading what stands behind an emissions figure

   A precursor's operator is not asked for a month of fuel and electricity. They are asked for ONE answer for a reporting period — who they are,
   the installation, the period, the specific embedded emissions — and for the verification behind it: the verifier, the accreditation number, its
   body, country and expiry, the scope, the date the statement was issued, whether it concludes with reasonable assurance. The documents they
   have are not a monthly report: a verification statement, a summary emissions report, a CBAM communication, an accreditation certificate.

   So this is its own reader, over the same field registry the form is drawn from (lib/cbam/precursor-fields.ts). It looks for a LABEL beside a
   VALUE — "Accreditation number: TH-ACC-001", "Reporting period: 1 January 2025 – 31 December 2025" — for each field the operator is asked,
   keeps the line each came from, and lays what it found out as the form's own groups, so it can be checked and changed before anything is
   written. A date it cannot read is left out rather than guessed; a number must be a number.

   Like the month's smart upload this is rule-based, and reads text, CSV and similar. A verification report is usually a PDF: Cera says so and
   points to the Documents block, where it is attached as the evidence it is — the facts it states are what the form asks for, and the report
   itself is never "read" into a figure (see app/p/[token]/page.tsx on why the PDF is not the validation).
   ════════════════════════════════════════════════════════════ */

import { actualFields, fieldStatuses, writeField, ACCREDITATION_SECTORS, type PrecursorField } from "../cbam/precursor-fields";
import { COUNTRIES } from "../config";
import type { PrecursorSupplier } from "../precursor-suppliers";
import { pick, type CeraLang } from "./lang";
import { parseNumber, readFile } from "./smart-upload";
import type { ApplyPayload, ExtractedReading, ExtractionPlan, ReadingInput } from "./types";

/* ── Reading values ──────────────────────────────────────────── */

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

const iso = (y: number, m: number, d: number): string | null => {
  if (!(y >= 1990 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

/** Every calendar date in a piece of text, in the order written, as YYYY-MM-DD. Day first for a numeric date — this is an EU document. */
export function datesIn(text: string): string[] {
  const found: { at: number; iso: string }[] = [];
  const take = (re: RegExp, build: (m: RegExpExecArray) => string | null) => {
    for (const m of text.matchAll(re)) {
      const v = build(m as RegExpExecArray);
      if (v && !found.some((f) => f.at === m.index)) found.push({ at: m.index ?? 0, iso: v });
    }
  };
  take(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g, (m) => iso(+m[1], +m[2], +m[3]));
  take(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/g, (m) => iso(+m[3], +m[2], +m[1]));
  take(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})\b/g, (m) => (MONTHS[m[2].toLowerCase()] ? iso(+m[3], MONTHS[m[2].toLowerCase()], +m[1]) : null));
  take(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/g, (m) => (MONTHS[m[1].toLowerCase()] ? iso(+m[3], MONTHS[m[1].toLowerCase()], +m[2]) : null));
  return found.sort((a, b) => a.at - b.at).map((f) => f.iso);
}

/** The first number in a value, with thousands commas understood. */
function firstNumber(value: string): number | null {
  const m = value.match(/-?\d[\d,]*(?:\.\d+)?/);
  return m ? parseNumber(m[0]) : null;
}

const norm = (s: string) => s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/* ── Label → value pairs ─────────────────────────────────────── */

export type Pair = { label: string; value: string; line: string };

/** "Label: value", "Label = value", "Label ....... value", "Label<TAB>value", and a two-column CSV row. */
export function pairsIn(fileName: string, text: string): Pair[] {
  const out: Pair[] = [];
  const csv = /\.(csv|tsv)$/i.test(fileName);
  for (const raw of text.split(/\r?\n|;\s+(?=[A-Za-z])/)) {
    const line = raw.replace(/^[\s\-*•·]+/, "").trim();
    if (!line) continue;
    /* A colon, an equals sign or a tab is the surest mark of a label; dots, a wide gap or a spaced dash are only tried when there is none —
       "SEE - direct: 1.84" is a label with a dash in it, not the label "SEE". */
    const strong = /\s*(?::|=|\t)\s*/.exec(line);
    const loose = strong ? null : /\s*(?:\.{3,}| {2,}| [–—-] )\s*/.exec(line);
    const hit = strong ?? loose;
    let sep = hit ? hit.index : -1;
    let cut = hit ? hit[0].length : 0;
    if (sep < 0 && csv) {
      sep = line.indexOf(",");
      cut = 1;
    }
    if (sep <= 0) continue;
    const label = line.slice(0, sep).trim();
    const value = line.slice(sep + cut).replace(/^"|"$/g, "").trim();
    if (label.length < 3 || label.length > 90 || !value) continue;
    out.push({ label, value, line });
  }
  return out;
}

/* ── What each field is called in the documents ─────────────────── */

const ALIASES: [key: string, label: RegExp][] = [
  ["verifierAccreditationNumber", /accreditation\s*(number|no\b|certificate|id\b|ref)/],
  ["verifierAccreditationBody", /accreditation body|accrediting body|accredited by|national accreditation/],
  ["verifierAccreditationIssuingCountry", /(country of (the )?accreditation|accreditation.*country|accreditation body.*country)/],
  ["verifierAccreditationExpiryDate", /accreditation.*(valid until|valid to|expir|validity|valid through)/],
  ["verificationSectoralScope", /(scope of accreditation|sectoral scope|accreditation scope|accredited scope|\bscope\b)/],
  ["verifierReasonableAssurance", /reasonable assurance|assurance level|conclusion/],
  ["verificationReportIssueDate", /(statement|report|verification).*(issue|issued)|issue date|date issued|date of issue|issued on/],
  ["verifierLeadAuditor", /lead auditor/],
  ["verifierAddress", /verifier.*address|address.*verifier/],
  ["verifierName", /(name of (the )?verifier|verifier('s)?( name)?$|^verifier\b|verification body|verified by|verifying body)/],
  ["specificEmbeddedIndirectTco2PerT", /indirect.*(embedded|emission|see)|see[ _-]?indirect|specific indirect/],
  ["specificEmbeddedDirectTco2PerT", /direct.*(embedded|emission|see)|see[ _-]?direct|specific direct/],
  ["unlocode", /un\/?locode|locode/],
  ["latitude", /^latitude|^lat\.?$/],
  ["longitude", /^longitude|^long\.?$|^lon\.?$/],
  ["installationUniqueId", /(installation|registry|cbam).*(identifier|reference|id\b|number)|unique (id|identifier)/],
  ["installationName", /(name of (the )?installation|installation( name)?|plant( name)?|site( name)?)$/],
  ["name", /(name of (the )?operator|operator( name)?|company( name)?|legal entity)$/],
  ["fullAddress", /(full )?address( of the installation)?$|installation address|site address/],
];

const PERIOD = /reporting period|period covered|period of (production|verification)|verification period|period$/;

/* ── What was found ──────────────────────────────────────────── */

export type PrecursorFinding = { key: string; raw: string; source: string };

export type PrecursorAnalysis = {
  fileName: string;
  readable: boolean;
  /** the text read, kept so the reader's description can be read with it */
  raw?: string;
  findings: PrecursorFinding[];
};

/** The sections of the form a registry group belongs to. Only these groups are read — what the exporter fills in is not in a precursor's papers. */
const SECTION_OF: Partial<Record<PrecursorField["group"], ExtractedReading["section"]>> = {
  installation: "p_operator",
  period: "p_period",
  emissions: "p_emissions",
  verifier: "p_verifier",
};

const fieldsFor = (row: PrecursorSupplier): PrecursorField[] => actualFields(row).filter((f) => f.owner === "precursor" && f.input !== "file" && SECTION_OF[f.group]);

/** A value as the form stores it, or null when it cannot be read as the kind of answer the field takes. */
function valueFor(field: PrecursorField, value: string): string | null {
  switch (field.input) {
    case "date": {
      const d = datesIn(value);
      return d[0] ?? null;
    }
    case "number": {
      const n = firstNumber(value);
      return n == null || n < 0 ? null : String(n);
    }
    case "country": {
      const v = norm(value);
      const hit = COUNTRIES.find((c) => c.code.toLowerCase() === v || norm(c.name) === v) ?? COUNTRIES.find((c) => v.length > 3 && (v.includes(norm(c.name)) || norm(c.name).includes(v)));
      return hit?.code ?? null;
    }
    case "select": {
      const v = norm(value);
      const hit = (field.options ?? ACCREDITATION_SECTORS.map((s) => ({ value: s, label: s }))).find((o) => norm(o.value) === v || norm(o.label) === v || v.includes(norm(o.value)));
      return hit?.value ?? null;
    }
    case "yesno": {
      const v = norm(value);
      if (/^(yes|y|true|concluded|reasonable assurance)/.test(v) || /no material|without (material )?(misstatement|qualification)|unqualified/.test(v)) return "yes";
      if (/^(no|n|false|limited|qualified|adverse)/.test(v)) return "no";
      return null;
    }
    default: {
      const t = value.replace(/\s+/g, " ").trim();
      return t.length > 0 && t.length <= 240 ? t : null;
    }
  }
}

export function analyzePrecursorText(fileName: string, text: string, row: PrecursorSupplier): PrecursorAnalysis {
  const asked = fieldsFor(row);
  const pairs = pairsIn(fileName, text);
  const used = new Set<Pair>();
  const findings: PrecursorFinding[] = [];

  /* The reporting period is one line with two dates, or two lines with one each. */
  const start = asked.find((f) => f.key === "reportingPeriodStart");
  const end = asked.find((f) => f.key === "reportingPeriodEnd");
  if (start && end) {
    for (const p of pairs) {
      if (!PERIOD.test(norm(p.label)) || used.has(p)) continue;
      const d = datesIn(p.value);
      if (d.length >= 2) {
        findings.push({ key: start.key, raw: d[0], source: p.line }, { key: end.key, raw: d[1], source: p.line });
        used.add(p);
        break;
      }
    }
    if (!findings.some((f) => f.key === start.key)) {
      const from = pairs.find((p) => !used.has(p) && /(period|reporting).*(from|start|begin)|^(from|start date|period start)/.test(norm(p.label)) && datesIn(p.value).length > 0);
      const to = pairs.find((p) => !used.has(p) && /(period|reporting).*(to\b|end)|^(to|end date|period end)/.test(norm(p.label)) && datesIn(p.value).length > 0);
      if (from) findings.push({ key: start.key, raw: datesIn(from.value)[0], source: from.line });
      if (to) findings.push({ key: end.key, raw: datesIn(to.value)[0], source: to.line });
    }
  }

  for (const [key, re] of ALIASES) {
    const field = asked.find((f) => f.key === key);
    if (!field || findings.some((f) => f.key === key)) continue;
    for (const p of pairs) {
      if (used.has(p) || !re.test(norm(p.label))) continue;
      const v = valueFor(field, p.value);
      if (v == null) continue;
      findings.push({ key, raw: v, source: p.line });
      used.add(p);
      break;
    }
  }
  return { fileName, readable: true, raw: text, findings };
}

export async function analyzePrecursorFile(file: File, row: PrecursorSupplier): Promise<PrecursorAnalysis> {
  const { readable, text } = await readFile(file);
  if (!readable) return { fileName: file.name, readable: false, findings: [] };
  return analyzePrecursorText(file.name, text, row);
}

/** The analysis again with the reader's own words read beside the file — "Verifier: SGS Thailand; accreditation number TH-ACC-001". */
export function describePrecursor(a: PrecursorAnalysis, description: string, row: PrecursorSupplier): PrecursorAnalysis {
  const merged = analyzePrecursorText(a.fileName, `${description.replace(/[;,]\s+(?=[A-Za-z][^:;,]{2,40}\s*[:=])/g, "\n")}\n${a.raw ?? ""}`, row);
  return { ...merged, raw: a.raw };
}

/* ── The plan: what was found, laid out as the form's own groups ── */

export type PrecursorStep =
  | { kind: "stop"; text: string }
  | { kind: "describe"; text: string }
  | { kind: "plan"; text: string; plan: ExtractionPlan };

const TEXT: ReadingInput = { kind: "text" };
const NUMBER: ReadingInput = { kind: "number" };

function inputFor(field: PrecursorField): ReadingInput {
  if (field.input === "number") return NUMBER;
  if (field.input === "country") return { kind: "select", options: COUNTRIES.map((c) => ({ id: c.code, label: c.name })) };
  if (field.input === "select") return { kind: "select", options: (field.options ?? ACCREDITATION_SECTORS.map((s) => ({ value: s, label: s }))).map((o) => ({ id: o.value, label: o.label })) };
  if (field.input === "yesno") return { kind: "select", options: [{ id: "yes", label: "Yes" }, { id: "no", label: "No" }] };
  return TEXT;
}

/** How a stored value is shown beside its field. */
function shown(field: PrecursorField, input: ReadingInput, raw: string): string {
  if (input.kind === "select") return input.options.find((o) => o.id === raw)?.label ?? raw;
  if (input.kind === "number") {
    const n = parseNumber(raw);
    return n == null ? raw : n.toLocaleString("en-GB", { maximumFractionDigits: 5 });
  }
  return raw;
}

export function precursorStep(a: PrecursorAnalysis, row: PrecursorSupplier, workspaceId: string, lang: CeraLang = "en", described = false): PrecursorStep {
  const T = <V,>(en: V, th: V, zh?: V, hi?: V): V => pick(lang, en, th, zh, hi);
  if (!a.readable) {
    return {
      kind: "stop",
      text: T(
        `I can't open ${a.fileName} — I read text and CSV files. A verification report is usually a PDF: attach it in Documents below, where it is kept as the evidence behind your figure. The facts it states are what this form asks for, so type them in — or put them in a text file as "Verifier: …", "Accreditation number: …", "Reporting period: …" and give me that.`,
        `ฉันเปิด ${a.fileName} ไม่ได้ — ฉันอ่านไฟล์ข้อความและ CSV รายงานการทวนสอบมักเป็น PDF ให้แนบที่ส่วนเอกสารด้านล่าง ซึ่งเก็บไว้เป็นหลักฐานของตัวเลขของคุณ ข้อเท็จจริงที่รายงานระบุคือสิ่งที่แบบฟอร์มนี้ถาม จึงกรอกลงไปได้ — หรือเขียนเป็นไฟล์ข้อความ เช่น "Verifier: …" "Accreditation number: …" "Reporting period: …" แล้วส่งให้ฉัน`,
        `我无法打开 ${a.fileName} — 我只能读取文本和 CSV 文件。核查报告通常是 PDF：请在下方“文件”中上传，它会作为您数据的证据保存。报告中陈述的事实正是本表单要填写的内容，请直接填写 — 或者把它们写成文本文件，如“Verifier: …”“Accreditation number: …”“Reporting period: …”再发给我。`,
        `मैं ${a.fileName} नहीं खोल सकती — मैं टेक्स्ट और CSV फ़ाइलें पढ़ती हूँ। सत्यापन रिपोर्ट आम तौर पर PDF होती है: उसे नीचे दस्तावेज़ों में संलग्न करें, जहाँ वह आपके आँकड़े के पीछे के साक्ष्य के रूप में रहती है। उसमें लिखे तथ्य ही वे हैं जो यह फ़ॉर्म माँगता है, इसलिए उन्हें दर्ज करें — या उन्हें “Verifier: …”, “Accreditation number: …”, “Reporting period: …” के रूप में टेक्स्ट फ़ाइल में रखकर मुझे दें।`,
      ),
    };
  }
  if (a.findings.length === 0) {
    if (!described) {
      return {
        kind: "describe",
        text: T(
          `I read ${a.fileName}, but found none of the facts this form asks for beside a label I recognise — the verifier and its accreditation, the reporting period, the specific embedded emissions, the installation. Tell me what is in it as labelled lines, for example "Verifier: SGS Thailand; Accreditation number: TH-ACC-001; Reporting period: 1 January 2025 – 31 December 2025; Direct SEE: 1.84", and I'll read that with the file.`,
          `ฉันอ่าน ${a.fileName} แล้ว แต่ไม่พบข้อเท็จจริงที่แบบฟอร์มนี้ถามข้างป้ายชื่อที่ฉันรู้จัก — ผู้ทวนสอบและการรับรอง ช่วงเวลารายงาน ค่าการปล่อยแฝงจำเพาะ สถานประกอบการ บอกฉันว่าในไฟล์มีอะไรเป็นบรรทัดที่มีป้ายชื่อ เช่น "Verifier: SGS Thailand; Accreditation number: TH-ACC-001; Reporting period: 1 January 2025 – 31 December 2025; Direct SEE: 1.84" แล้วฉันจะอ่านร่วมกับไฟล์`,
          `我读取了 ${a.fileName}，但没有在可识别的标签旁找到本表单所需的事实 — 核查机构及其认可、报告期、特定隐含排放、设施。请把文件内容写成带标签的行告诉我，例如“Verifier: SGS Thailand; Accreditation number: TH-ACC-001; Reporting period: 1 January 2025 – 31 December 2025; Direct SEE: 1.84”，我会结合文件一起阅读。`,
          `मैंने ${a.fileName} पढ़ी, पर मेरी पहचानी हुई किसी लेबल के पास वे तथ्य नहीं मिले जो यह फ़ॉर्म माँगता है — सत्यापनकर्ता और उसकी मान्यता, रिपोर्टिंग अवधि, विशिष्ट अंतर्निहित उत्सर्जन, संयंत्र। मुझे लेबल वाली पंक्तियों में बताएँ कि उसमें क्या है, जैसे “Verifier: SGS Thailand; Accreditation number: TH-ACC-001; Reporting period: 1 January 2025 – 31 December 2025; Direct SEE: 1.84”, और मैं उसे फ़ाइल के साथ पढ़ लूँगी।`,
        ),
      };
    }
    return {
      kind: "stop",
      text: T(
        "I still couldn't find a fact I can place. Type the answers into the form directly, and attach the verification report in Documents below.",
        "ฉันยังหาข้อเท็จจริงที่วางลงได้ไม่พบ กรอกคำตอบลงในแบบฟอร์มโดยตรง และแนบรายงานการทวนสอบที่ส่วนเอกสารด้านล่าง",
        "我仍然没有找到可以填入的事实。请直接在表单中填写，并在下方“文件”中上传核查报告。",
        "मुझे अब भी ऐसा कोई तथ्य नहीं मिला जिसे मैं रख सकूँ। उत्तर सीधे फ़ॉर्म में दर्ज करें, और सत्यापन रिपोर्ट नीचे दस्तावेज़ों में संलग्न करें।",
      ),
    };
  }

  const fields = fieldsFor(row);
  let n = 0;
  const readings: ExtractedReading[] = [];
  for (const f of a.findings) {
    const field = fields.find((x) => x.key === f.key);
    if (!field) continue;
    const input = inputFor(field);
    const value = shown(field, input, f.raw);
    readings.push({
      id: `pr-${++n}`,
      field: "precursor",
      target: f.key,
      format: field.input === "date" ? "date" : undefined,
      input,
      raw: f.raw,
      found: { raw: f.raw },
      section: SECTION_OF[field.group]!,
      label: field.label,
      tag: field.tag,
      need: field.need,
      value,
      unit: field.unit,
      source: f.source,
      included: true,
    });
  }
  const payload: ApplyPayload = { fuels: [], electricity: [], process: [] };
  const who = row.precursorName || row.installationName || row.name || T("this precursor", "วัตถุดิบตั้งต้นนี้", "该前体", "यह पूर्ववर्ती सामग्री");
  const plan: ExtractionPlan = {
    fileName: a.fileName,
    documentKind: T("verification and emissions statement", "ข้อมูลการทวนสอบและการปล่อย", "核查与排放说明", "सत्यापन और उत्सर्जन वक्तव्य"),
    workspaceId,
    workspaceLabel: who,
    month: "",
    monthLabel: T("Precursor data", "ข้อมูลวัตถุดิบตั้งต้น", "前体数据", "पूर्ववर्ती सामग्री डेटा"),
    lang,
    readings,
    payload,
    precursor: { nodeId: row.id },
  };
  return {
    kind: "plan",
    text: "",
    plan,
  };
}

/* ── Applying it ─────────────────────────────────────────────── */

export type PrecursorApplied = {
  ok: boolean;
  row: PrecursorSupplier;
  /** the parts of the form that took something, in the order the form shows them */
  sections: ExtractedReading["section"][];
  /** the labels of what the form still needs after this, required only */
  missing: string[];
};

const ORDER: ExtractedReading["section"][] = ["p_operator", "p_period", "p_emissions", "p_verifier"];

/** Write what the reader kept ticked into the precursor's row. Pure: the page sets its draft from `row`, and saves it the way it saves anything typed. */
export function applyPrecursorPlan(plan: ExtractionPlan, row: PrecursorSupplier): PrecursorApplied {
  let next = row;
  const wrote = new Set<ExtractedReading["section"]>();
  for (const r of plan.readings) {
    if (!r.included || !r.target) continue;
    const value: unknown = r.input.kind === "number" ? parseNumber(r.raw) : r.input.kind === "select" || r.input.kind === "text" ? r.raw.trim() : r.raw;
    if (value == null || value === "") continue;
    next = writeField(next, r.target, value);
    wrote.add(r.section);
  }
  const attached = { report: Boolean(next.verificationReportFileId) };
  const missing = fieldStatuses(next, attached, "precursor")
    .filter((s) => s.field.need === "required" && !s.answered)
    .map((s) => s.field.label);
  return { ok: wrote.size > 0, row: next, sections: ORDER.filter((s) => wrote.has(s)), missing };
}

