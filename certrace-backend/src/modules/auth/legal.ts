import { isIP } from "node:net";
import { db } from "../../lib/db";
import { fail } from "../../lib/errors";
import type { Prisma } from "../../generated/prisma/client";

export type LegalContent = Record<
  "en" | "th",
  { kind: string; text: string }[][]
>;
export type LegalConsentInput = {
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  termsVersionId?: string;
  privacyVersionId?: string;
};
export type AcceptanceContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

// Trust forwarded addresses only when the deployment explicitly identifies
// the number of trusted proxies. Walk from the server side, never the left.
export function acceptanceContext(
  request: Request,
  peerIp?: string,
  trustedHops = 0,
): AcceptanceContext {
  const forwarded =
    request.headers
      .get("x-forwarded-for")
      ?.split(",")
      .map((s) => s.trim()) ?? [];
  const candidate =
    Number.isInteger(trustedHops) && trustedHops > 0
      ? forwarded[forwarded.length - trustedHops]
      : peerIp;
  return {
    ipAddress: candidate && isIP(candidate) ? candidate : null,
    userAgent: request.headers.get("user-agent")?.slice(0, 2048) ?? null,
  };
}

export async function currentLegalDocuments(tx: Prisma.TransactionClient = db) {
  const documents = await tx.legal_document_versions.findMany({
    where: { is_current: true },
    orderBy: { kind: "asc" },
  });
  if (
    documents.length !== 2 ||
    !documents.some((d) => d.kind === "terms") ||
    !documents.some((d) => d.kind === "privacy")
  )
    fail(
      503,
      "LEGAL_DOCUMENTS_UNAVAILABLE",
      "Legal documents are temporarily unavailable. Please retry.",
    );
  return documents.map((d) => ({
    id: d.id,
    kind: d.kind as "terms" | "privacy",
    version: d.version,
    publishedAt: d.published_at.toISOString(),
    content: d.content as LegalContent,
  }));
}

export async function needsLegalConsent(userId: string) {
  const documents = await db.legal_document_versions.findMany({
    where: { is_current: true },
    select: { id: true },
  });
  if (documents.length !== 2)
    fail(
      503,
      "LEGAL_DOCUMENTS_UNAVAILABLE",
      "Legal documents are temporarily unavailable. Please retry.",
    );
  const count = await db.legal_acceptances.count({
    where: {
      user_id: userId,
      document_version_id: { in: documents.map((d) => d.id) },
    },
  });
  return count !== documents.length;
}

export async function recordLegalAcceptance(
  tx: Prisma.TransactionClient,
  userId: string,
  input: LegalConsentInput,
  context: AcceptanceContext,
  source: "registration" | "google_registration" | "renewal",
) {
  if (!input.termsAccepted || !input.privacyAccepted)
    fail(
      400,
      "LEGAL_CONSENT_REQUIRED",
      "Read and accept both legal documents to continue.",
    );
  // A publication waits until this acceptance commits; it cannot change the
  // current versions between validation and recording the user's decision.
  await tx.$queryRaw`SELECT id FROM public.legal_document_versions WHERE is_current FOR SHARE`;
  const documents = await currentLegalDocuments(tx);
  if (
    documents.some(
      (d) =>
        d.id !==
        (d.kind === "terms" ? input.termsVersionId : input.privacyVersionId),
    )
  )
    fail(
      409,
      "LEGAL_VERSION_CHANGED",
      "The legal documents have changed. Reload and review the latest versions.",
    );
  await tx.legal_acceptances.createMany({
    data: documents.map((d) => ({
      user_id: userId,
      document_version_id: d.id,
      ip_address: context.ipAddress,
      user_agent: context.userAgent,
      source,
    })),
    // Retrying must not replace the original timestamp or origin evidence.
    skipDuplicates: true,
  });
}
