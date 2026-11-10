import { accountStorage } from "./account-storage";
import {
  REPORT_SECTIONS,
  type ReportArea,
  type ReportSection,
} from "./report-input-schema";
import type { VerificationWorkspace } from "./workspace";
import type { InputReferenceId } from "./verification-input-references";
export type ReportRow = { id: string; values: Record<string, string> };
export type ReportAnswer = {
  applicability: "yes" | "no" | "";
  reason: string;
  rows: ReportRow[];
  updatedAt?: string;
};
export type ReportInputs = Record<string, Record<string, ReportAnswer>>;
export const blankAnswer = (): ReportAnswer => ({
  applicability: "",
  reason: "",
  rows: [],
});
const KEY = "certrace:report-inputs:v1";
export function readReportInputs(): ReportInputs {
  if (typeof window === "undefined") return {};
  const raw = accountStorage.getItem(KEY);
  if (!raw) return {};
  // Do not silently replace damaged data with an empty record on the next save.
  const data = JSON.parse(raw);
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error("Invalid report input store");
  return data;
}
export function reportScope(
  ws: VerificationWorkspace,
  id: string,
  context = "annual",
): string {
  if (id.startsWith("0."))
    return `company:${ws.selfSupplied !== false ? "self" : (ws.supplierId ?? ws.id)}`;
  return `${ws.id}:${context}`;
}
export function reportAnswer(
  data: ReportInputs,
  ws: VerificationWorkspace,
  id: string,
  context = "annual",
): ReportAnswer {
  return data[reportScope(ws, id, context)]?.[id] ?? blankAnswer();
}
export function saveReportAnswer(
  ws: VerificationWorkspace,
  id: InputReferenceId,
  context: string,
  answer: ReportAnswer,
) {
  const data = readReportInputs();
  const scope = reportScope(ws, id, context);
  data[scope] = {
    ...data[scope],
    [id]: { ...answer, updatedAt: new Date().toISOString() },
  };
  accountStorage.setItem(KEY, JSON.stringify(data));
}
export function reportRows(
  data: ReportInputs,
  ws: VerificationWorkspace,
  id: string,
  context = "annual",
): Record<string, string>[] {
  const a = reportAnswer(data, ws, id, context);
  return a.applicability === "yes" ? a.rows.map((r) => r.values) : [];
}
export function answerIssues(
  section: ReportSection,
  answer: ReportAnswer,
): string[] {
  if (!answer.applicability) return ["Choose whether this applies"];
  if (answer.applicability === "no")
    return answer.reason.trim() ? [] : ["Explain why this does not apply"];
  if (!answer.rows.length) return ["Add a record"];
  const errors: string[] = [];
  for (const [i, row] of answer.rows.entries()) {
    for (const field of section.fields) {
      const v = row.values[field.key]?.trim() ?? "";
      if (!v && !field.optional) errors.push(`${i + 1}: ${field.label}`);
      if (!v) continue;
      if (
        field.kind === "number" &&
        (!Number.isFinite(Number(v)) ||
          Number(v) < (field.min ?? 0) ||
          (field.max != null && Number(v) > field.max))
      )
        errors.push(`${i + 1}: ${field.label} — invalid number`);
      if (field.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
        errors.push(`${i + 1}: ${field.label} — invalid email`);
      if (
        field.kind === "date" &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)))
      )
        errors.push(`${i + 1}: ${field.label} — invalid date`);
      if (field.kind === "select" && !field.options?.some((o) => o.value === v))
        errors.push(`${i + 1}: ${field.label} — invalid selection`);
    }
    const v = row.values;
    if (v.start && v.end && v.end < v.start)
      errors.push(`${i + 1}: End must follow start`);
    if (
      section.id === "2.4.27" &&
      v.origin === "internal" &&
      !v.producingProcess
    )
      errors.push(`${i + 1}: Select internal producing process`);
  }
  return errors;
}
export function reportAreaIssues(
  data: ReportInputs,
  ws: VerificationWorkspace,
  area: ReportArea,
  context = "annual",
) {
  return REPORT_SECTIONS.filter((s) => s.area === area).flatMap((section) =>
    answerIssues(section, reportAnswer(data, ws, section.id, context)).map(
      (message) => ({ id: section.id, message }),
    ),
  );
}
export function reportInputHref(
  ws: VerificationWorkspace,
  id: string,
  context = "annual",
): string {
  const section = REPORT_SECTIONS.find((s) => s.id === id);
  const base = `/workspaces/${ws.id}`;
  const area =
    section?.area ??
    (id.startsWith("0.") || id.startsWith("1.") || id.startsWith("2.1.")
      ? "setup"
      : id.startsWith("2.2.") || id.startsWith("2.0.")
        ? "method"
        : id.startsWith("2.3.")
          ? "monthly"
          : id.startsWith("2.4.")
            ? "precursor"
            : "report");
  const page =
    area === "setup"
      ? ""
      : area === "method"
        ? "/mmd"
        : area === "monthly"
          ? context.startsWith("month:")
            ? `/monthly/${context.replace("month:", "")}`
            : "/monthly"
          : area === "precursor"
            ? "/precursors"
            : "/readiness";
  const query = context.startsWith("precursor:")
    ? `?source=${encodeURIComponent(context.slice(10))}`
    : "";
  return `${base}${page}${query}${section ? `#input-${id}` : ""}`;
}
