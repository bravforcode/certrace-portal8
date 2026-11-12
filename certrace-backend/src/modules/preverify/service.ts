import { db } from "../../lib/db";
import { fail, missing } from "../../lib/errors";
import type { preverifications } from "../../generated/prisma/client";
import { catalogueCells, decideStatus, runChecks, type Finding, type Status } from "./checks";
import { aiReview } from "./review";

export type Key = { installationId: string; year: number; standardId: "cbam" };
export type Decision = "approved" | "changes_requested";

const workbookKey = (companyId: string, { installationId, year }: Pick<Key, "installationId" | "year">) => ({
  company_id_installation_id_year: { company_id: companyId, installation_id: installationId, year },
});
const submissionScope = (companyId: string, { installationId, year, standardId }: Key) => ({
  company_id: companyId,
  installation_id: installationId,
  year,
  standard_id: standardId,
});

// The customer view. reviewedBy is an internal reviewer id, so only the admin view carries it.
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
});

type WithCompany = preverifications & { company: { email: string; company_name: string | null } };
const adminView = (r: WithCompany) => ({
  ...view(r),
  reviewedBy: r.reviewed_by,
  companyId: r.company_id,
  companyName: r.company.company_name,
  companyEmail: r.company.email,
});

export async function submit(companyId: string, actorId: string, key: Key) {
  const wb = await db.workbooks.findUnique({ where: workbookKey(companyId, key) });
  const cells = catalogueCells(wb?.cells);
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
  try {
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
  } catch (e) {
    // Two concurrent submits both pass the check above; the partial unique index lets only one row in.
    if ((e as { code?: string }).code === "P2002")
      fail(409, "ALREADY_IN_REVIEW", "This workbook is already waiting for the Certrace team. Change the data to submit again.");
    throw e;
  }
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
    where: workbookKey(row.company_id, { installationId: row.installation_id, year: row.year }),
    select: { cells: true, revision: true },
  });
  return {
    ...adminView(row),
    cells: catalogueCells(wb?.cells),
    currentRevision: wb?.revision ?? 0,
  };
}

export async function decide(id: string, reviewerId: string, decision: Decision, note: string) {
  const row = await db.preverifications.findUnique({ where: { id } });
  if (!row) return missing("PREVERIFICATION_NOT_FOUND");
  if (row.status !== "team_review")
    fail(409, "NOT_IN_REVIEW", "Only a submission waiting for team review can be decided.");
  // The customer changed the workbook after the AI check, so this review is about data that is no longer there.
  const wb = await db.workbooks.findUnique({
    where: workbookKey(row.company_id, { installationId: row.installation_id, year: row.year }),
    select: { revision: true },
  });
  if ((wb?.revision ?? 0) !== row.workbook_revision)
    fail(409, "STALE_SUBMISSION", "The workbook changed after the AI check. The customer must submit again.");
  const text = note.trim();
  if (decision === "changes_requested" && !text)
    fail(422, "NOTE_REQUIRED", "Write what the customer should change before requesting changes.");

  const updated = await db.$transaction(async (tx) => {
    // The status check sits in the WHERE clause so two reviewers cannot both decide the same submission.
    const { count } = await tx.preverifications.updateMany({
      where: { id, status: "team_review" },
      data: { status: decision, reviewed_by: reviewerId, reviewed_at: new Date(), team_note: text },
    });
    if (count === 0) fail(409, "NOT_IN_REVIEW", "Only a submission waiting for team review can be decided.");
    await tx.account_audit_events.create({
      data: {
        user_id: row.company_id,
        event: `preverification.${decision}`,
        actor: "ADMIN",
        details: {
          preverificationId: id,
          adminUserId: reviewerId,
          installationId: row.installation_id,
          year: row.year,
          standardId: row.standard_id,
          workbookRevision: row.workbook_revision,
        },
      },
    });
    return tx.preverifications.findUniqueOrThrow({ where: { id } });
  });
  return view(updated);
}
