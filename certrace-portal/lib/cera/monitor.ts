/* ════════════════════════════════════════════════════════════
   CERA MISSING-DATA MONITOR — which CBAM fields the account has not answered yet

   Pure: the same inputs the Convert page uses (installation, sheets, cells) go in, and the
   requirement rules decide what is complete. Nothing here re-implements those rules; it
   only lists the required template fields of the requirements that are not complete.
   ════════════════════════════════════════════════════════════ */

import type { Standard } from "../convert-standards";
import { liveRequirements, readiness } from "../convert/requirements";
import { cbamCellKey, cbamFieldsFor } from "../cbam/template-fields";
import type { Installation } from "../installations";
import type { Sheet } from "../workspace-sheets";
import { pick, type CeraLang } from "./lang";

export type MissingField = {
  /** "field": one CBAM template cell. "requirement": a requirement with no CBAM cell of its own (carbon price), listed so it is not silently open. */
  kind: "field" | "requirement";
  /** bare CBAM field id, e.g. "a-i9" (the id Cera's set_cbam_fields action uses); the requirement id for kind "requirement" */
  id: string;
  label: string;
  /** the form heading of a field; empty for a requirement */
  section: string;
  /** the requirement the entry belongs to, e.g. "goods" */
  requirement: string;
  /** where the user fills the requirement; null without an installation */
  href: string | null;
};

export type MissingData = {
  fields: MissingField[];
  /** requirements that are not complete */
  incompleteRequirements: number;
  /** share of requirements complete, 0–100 */
  readiness: number;
};

export type MissingContext = {
  installation: Installation | null;
  sheets: Sheet[];
  cells: Record<string, string>;
};

export function missingData(std: Standard, ctx: MissingContext): MissingData {
  const reqs = liveRequirements(std, ctx);
  const open = reqs.filter((r) => r.state !== "complete");
  const fields = open.flatMap((r): MissingField[] => {
    const cells = cbamFieldsFor(r.id);
    if (cells.length === 0)
      return [{ kind: "requirement", id: r.id, label: r.title, section: "", requirement: r.id, href: r.href }];
    return cells
      .filter((f) => !f.optional && !(ctx.cells[cbamCellKey(f)] ?? "").trim())
      .map((f) => ({ kind: "field", id: f.id, label: f.label, section: f.section, requirement: r.id, href: r.href }));
  });
  return { fields, incompleteRequirements: open.length, readiness: readiness(reqs) };
}

/** Cera's chat takes a prompt of at most 4000 characters; the list stays well under that. */
export const FILL_REQUEST_BUDGET = 3000;

/** The words of the fill message, in each language Cera answers in. Cera replies in the language it is sent. */
const FILL_WORDS = {
  en: {
    head: (name: string, id: string, year: number) =>
      `Fill the CBAM fields below for installation "${name}" (installationId ${id}), year ${year}. Use only data that is already in this account. Propose each value as a confirmable action; say which fields you could not fill.`,
    open: (titles: string) => `Also still open in Convert, with no cell to set here: ${titles}.`,
    fields: "Fields:",
    more: (n: number) => `…and ${n} more; ask again after these are done.`,
  },
  th: {
    head: (name: string, id: string, year: number) =>
      `กรอกช่อง CBAM ด้านล่างสำหรับโรงงาน "${name}" (installationId ${id}) ปี ${year} ใช้เฉพาะข้อมูลที่มีอยู่ในบัญชีนี้แล้ว เสนอค่าแต่ละช่องเป็นการกระทำที่ยืนยันได้ และบอกช่องที่กรอกไม่ได้`,
    open: (titles: string) => `ยังค้างอยู่ใน Convert และไม่มีช่องให้กรอกที่นี่: ${titles}`,
    fields: "ช่อง:",
    more: (n: number) => `…และอีก ${n} รายการ ถามอีกครั้งเมื่อกรอกรายการเหล่านี้เสร็จ`,
  },
  zh: {
    head: (name: string, id: string, year: number) =>
      `请为设施"${name}"（installationId ${id}）${year} 年填写下列 CBAM 字段。只使用账户中已有的数据。将每个值作为可确认的操作提出，并说明无法填写的字段。`,
    open: (titles: string) => `在 Convert 中仍待处理，但此处没有可填写的单元格：${titles}。`,
    fields: "字段：",
    more: (n: number) => `…还有 ${n} 项；待这些完成后请再次询问。`,
  },
  hi: {
    head: (name: string, id: string, year: number) =>
      `संयंत्र "${name}" (installationId ${id}), वर्ष ${year} के लिए नीचे दिए CBAM फ़ील्ड भरें। केवल इस खाते में पहले से मौजूद डेटा का उपयोग करें। हर मान को पुष्टि योग्य कार्रवाई के रूप में सुझाएँ, और बताएँ कि कौन से फ़ील्ड नहीं भर सके।`,
    open: (titles: string) => `Convert में अभी भी खुला है, और यहाँ भरने के लिए कोई सेल नहीं है: ${titles}।`,
    fields: "फ़ील्ड:",
    more: (n: number) => `…और ${n} बाकी; इन्हें पूरा करने के बाद फिर पूछें।`,
  },
};

/** The message "Ask Cera to fill" sends, in the UI language. Lists as many fields as the budget allows and says how many are left out.
    Requirements with no cell of their own are named, not asked for, so the message matches what the badge counts. */
export function fillRequest(
  installation: { id: string; name: string },
  year: number,
  missing: MissingField[],
  lang: CeraLang = "en",
  budget = FILL_REQUEST_BUDGET,
): string {
  const w = pick(lang, FILL_WORDS.en, FILL_WORDS.th, FILL_WORDS.zh, FILL_WORDS.hi);
  const cells = missing.filter((m) => m.kind === "field");
  const openTitles = missing.filter((m) => m.kind === "requirement").map((m) => m.label);
  const parts = [w.head(installation.name, installation.id, year)];
  if (openTitles.length) parts.push(w.open(openTitles.join("; ")));
  let used = parts.join("\n").length + w.fields.length + 2;
  const lines: string[] = [];
  for (const f of cells) {
    const line = `${f.id}: ${f.section} · ${f.label}`;
    if (used + line.length + 1 > budget) break;
    lines.push(line);
    used += line.length + 1;
  }
  if (lines.length) parts.push(w.fields, ...lines);
  const rest = cells.length - lines.length;
  if (rest > 0) parts.push(w.more(rest));
  return parts.join("\n");
}
