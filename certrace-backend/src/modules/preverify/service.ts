import { db } from "../../lib/db";
import { fail, missing } from "../../lib/errors";
import type { preverifications } from "../../generated/prisma/client";
import { decideStatus, runChecks, type Finding, type Status } from "./checks";
import { aiReview } from "./review";

export type Key = { installationId: string; year: number; standardId: string };
export type Decision = "approved" | "changes_requested";

const workbookKey = (companyId: string, { installationId, year }: Key) => ({
  company_id_installation_id_year: { company_id: companyId, installation_id: installationId, year },
});
const submissionScope = (companyId: string, { installationId, year, standardId }: Key) => ({
  company_id: companyId,
  installation_id: installationId,
  year,
  standard_id: standardId,
});

/** Only the cells of the standard being checked, e.g. `cbam:0:a-i9`. Other standards stay out of the review. */
const cellsOf = (raw: unknown, standardId: string) =>
  Object.fromEntries(
    Object.entries((raw ?? {}) as Record<string, unknown>).filter(
      (entry): entry is [string, string] => entry[0].startsWith(`${standardId}:`) && typeof entry[1] === "string",
    ),
  );

export const view = (r: preverifications) => ({
  id: r.id,
  installationId: r.installation_id,
  year: r.year,
  standardId: r.standard_id,
  status: r.status as Status | Decision,
  workbookRevision: r.workbook_revision,
  aiFindings: r.ai_findings as Finding[],
  aiSummary: r.ai_summary,
  aiModel: r.ai_model,
  teamNote: r.team_note,
  submittedAt: r.submitted_at.toISOString(),
  reviewedAt: r.reviewed_at?.toISOString() ?? null,
  reviewedBy: r.reviewed_by,
});

type WithCompany = preverifications & { company: { email: string; company_name: string | null } };
const adminView = (r: WithCompany) => ({
  ...view(r),
  companyId: r.company_id,
  companyName: r.company.company_name,
  companyEmail: r.company.email,
});

export async function submit(companyId: string, actorId: string, key: Key) {
  const wb = await db.workbooks.findUnique({ where: workbookKey(companyId, key) });
  const cells = cellsOf(wb?.cells, key.standardId);
  if (!Object.values(cells).some((v) => v.trim()))
    fail(422, "EMPTY_WORKBOOK", "Fill in the CBAM requirements before you submit for pre-verification.");

  const revision = wb?.revision ?? 0;
  const latest = await db.preverifications.findFirst({
    where: submissionScope(companyId, key),
    orderBy: { submitted_at: "desc" },
  });
  if (latest?.status === "team_review" && latest.workbook_revision === revision)
    fail(409, "ALREADY_IN_REVIEW", "This workbook is already waiting for the Certrace team. Change the data to submit again.");

  // The server reads the workbook itself, so client-sent cells are never trusted.
  const checks = runChecks(cells);
  const ai = await aiReview(cells, checks);
  const findings = [...checks, ...ai.findings];
  const row = await db.preverifications.create({
    data: {
      ...submissionScope(companyId, key),
      status: decideStatus(findings),
      workbook_revision: revision,
      ai_findings: findings as object[],
      ai_summary: ai.summary,
      ai_model: ai.model,
      submitted_by: actorId,
    },
  });
  return view(row);
}

export async function latest(companyId: string, key: Key) {
  const [row, wb] = await Promise.all([
    db.preverifications.findFirst({ where: submissionScope(companyId, key), orderBy: { submitted_at: "desc" } }),
    db.workbooks.findUnique({ where: workbookKey(companyId, key), select: { revision: true } }),
  ]);
  return { latest: row ? view(row) : null, currentRevision: wb?.revision ?? 0 };
}

export async function adminList(status: Status | Decision) {
  const rows = await db.preverifications.findMany({
    where: { status },
    orderBy: { submitted_at: "desc" },
    take: 100,
    include: { company: { select: { email: true, company_name: true } } },
  });
  return { items: rows.map(adminView) };
}

export async function adminGet(id: string) {
  const row = await db.preverifications.findUnique({
    where: { id },
    include: { company: { select: { email: true, company_name: true } } },
  });
  if (!row) return missing("PREVERIFICATION_NOT_FOUND");
  const wb = await db.workbooks.findUnique({
    where: workbookKey(row.company_id, { installationId: row.installation_id, year: row.year, standardId: row.standard_id }),
    select: { cells: true, revision: true },
  });
  return {
    ...adminView(row),
    cells: cellsOf(wb?.cells, row.standard_id),
    currentRevision: wb?.revision ?? 0,
  };
}

export async function decide(id: string, reviewerId: string, decision: Decision, note: string) {
  const text = note.trim();
  if (decision === "changes_requested" && !text)
    fail(422, "NOTE_REQUIRED", "Write what the customer should change before requesting changes.");
  // The status check sits in the WHERE clause so two reviewers cannot both decide the same submission.
  const { count } = await db.preverifications.updateMany({
    where: { id, status: "team_review" },
    data: { status: decision, reviewed_by: reviewerId, reviewed_at: new Date(), team_note: text },
  });
  if (count === 0) {
    const exists = await db.preverifications.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return missing("PREVERIFICATION_NOT_FOUND");
    fail(409, "NOT_IN_REVIEW", "Only a submission waiting for team review can be decided.");
  }
  return view((await db.preverifications.findUnique({ where: { id } }))!);
}
