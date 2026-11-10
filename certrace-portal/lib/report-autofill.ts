import type { AutofillRunView } from "@certrace/backend/src/modules/evidence/autofill-types";
import { request } from "./api";
export type {
  AutofillRunView,
  Proposal,
} from "@certrace/backend/src/modules/evidence/autofill-types";
export function startAutofillFromDocument(
  workspaceId: string,
  file: File,
  month: string,
) {
  const contentType = (
    {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      txt: "text/plain",
      log: "text/plain",
      csv: "text/csv",
      tsv: "text/tab-separated-values",
      md: "text/markdown",
      markdown: "text/markdown",
      json: "application/json",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    } as Record<string, string>
  )[file.name.split(".").at(-1)?.toLowerCase() ?? ""];
  if (!contentType)
    throw Error("This document type cannot be read for report autofill.");
  const query = new URLSearchParams({ workspaceId, filename: file.name });
  if (month) query.set("month", month);
  return request<AutofillRunView>(
    `/api/v1/evidence/autofill/runs/document?${query}`,
    {
      method: "POST",
      rawBody: file,
      contentType,
      timeoutMs: 60_000,
    },
  );
}
