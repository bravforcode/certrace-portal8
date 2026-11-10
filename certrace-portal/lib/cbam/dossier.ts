/* ════════════════════════════════════════════════════════════
   THE VERIFICATION DOSSIER (gap G10)

   Not a data dump. A dossier ordered by the SEVEN ASSERTIONS a verifier
   actually works through (spec §2), so they read it top to bottom and can
   answer each one without emailing the exporter a single question. That is
   the definition of "passes easily", and it is the only design target this
   module has.

     1 Completeness      — every source in the boundary is included
     2 Accuracy          — the number recomputes from raw data
     3 Consistency       — same method year over year
     4 Traceability      — every figure links to a document
     5 Conservativeness  — gaps are not filled optimistically
     6 Segregation       — preparer ≠ approver
     7 Precursor integrity — upstream data is real

   Nothing here computes anything. The dossier ASSEMBLES what the rest of
   lib/cbam/ has already produced, and its only judgement is whether each
   assertion is currently answerable — which is exactly what the readiness
   score measures, viewed from the verifier's side of the table instead of
   the exporter's.

   Commercial data never enters it. The verifier audience sees provenance and
   attestations; supplier cost, carbon-price spend and certificate exposure
   stay on the exporter's side of the line (lib/supplier-records.ts
   SECTION_ACCESS). A dossier that leaks a supplier's cost base is a dossier
   suppliers stop filling in.
   ════════════════════════════════════════════════════════════ */

import type { RuleId, Readiness, Finding } from "./validate";

export type AssertionId =
  | "completeness"
  | "accuracy"
  | "consistency"
  | "traceability"
  | "conservativeness"
  | "segregation"
  | "precursor_integrity";

export const ASSERTIONS: AssertionId[] = [
  "completeness",
  "accuracy",
  "consistency",
  "traceability",
  "conservativeness",
  "segregation",
  "precursor_integrity",
];

export const ASSERTION_TITLE: Record<AssertionId, string> = {
  completeness: "Completeness",
  accuracy: "Accuracy",
  consistency: "Consistency",
  traceability: "Traceability",
  conservativeness: "Conservativeness",
  segregation: "Segregation of duties",
  precursor_integrity: "Precursor integrity",
};

/** What the verifier is testing, in their words. */
export const ASSERTION_QUESTION: Record<AssertionId, string> = {
  completeness: "Are all emission sources inside the boundary included?",
  accuracy: "Does the number recompute from raw data?",
  consistency: "Is the method the same as last year?",
  traceability: "Does every figure link to a document?",
  conservativeness: "Are the gaps filled without favouring the operator?",
  segregation: "Did someone other than the preparer approve this?",
  precursor_integrity: "Is the upstream data real?",
};

/** What the exporter is expected to have put in front of them. */
export const ASSERTION_EVIDENCE: Record<AssertionId, string> = {
  completeness:
    "Boundary description with every production step explicitly included or excluded, plus the process flow diagram.",
  accuracy:
    "The activity dataset — fuel, electricity and process materials — and the frozen calculation that turns it into tCO₂e/t.",
  consistency:
    "The MMD, versioned, with a change list against the prior version.",
  traceability:
    "The evidence pack: one document per input, and the reverse lookup from any document to the figures resting on it.",
  conservativeness:
    "The data-gap register: what was missing, how it was estimated, and why the estimate cannot flatter the operator.",
  segregation:
    "The sign-off record, with the preparer and the approver named and distinct.",
  precursor_integrity:
    "The precursor tree with each tier's source and supplier attestation, and scrap zero-rated.",
};

/** Which validation rules speak to which assertion. One rule can serve more
    than one — V10's evidence coverage is both traceability and, where the
    missing document is a meter log, accuracy. */
export const ASSERTION_RULES: Record<AssertionId, RuleId[]> = {
  completeness: ["V3", "V11"],
  accuracy: ["V1", "V2", "V5"],
  consistency: ["V15"],
  traceability: ["V10"],
  conservativeness: ["V12", "V4"],
  segregation: ["V13"],
  precursor_integrity: ["V6", "V7", "V8", "V9", "V14", "V16"],
};

export type AssertionSection = {
  id: AssertionId;
  title: string;
  question: string;
  expectedEvidence: string;
  /** worst status across the rules that serve this assertion */
  status: "answered" | "qualified" | "unanswered";
  findings: Finding[];
  /** in-portal routes the verifier's read-only view opens for this assertion */
  links: { label: string; path: string }[];
};

export type Dossier = {
  declarationId: string;
  readiness: Readiness;
  sections: AssertionSection[];
  /** true when every assertion is answerable without a follow-up question */
  selfContained: boolean;
};

export type DossierContext = {
  /** Is there a finalised MMD? Consistency is the assertion that depends on
      the DOCUMENT existing at all, not just on the rules passing: with no
      finalised version there is nothing to compare this year's method
      against, so the question cannot be answered however clean the data is. */
  mmdFinalised: boolean;
  /** Is the calculation frozen? Accuracy is testable against live inputs, but
      only a frozen snapshot proves the number a verifier is shown is the one
      that was approved. */
  frozen: boolean;
};

export function buildDossier(
  declarationId: string,
  readinessResult: Readiness,
  context?: DossierContext,
): Dossier {
  const byId = new Map(readinessResult.rules.map((r) => [r.id, r]));

  const sections: AssertionSection[] = ASSERTIONS.map((id) => {
    const rules = ASSERTION_RULES[id]
      .map((rid) => byId.get(rid))
      .filter(Boolean) as NonNullable<ReturnType<typeof byId.get>>[];
    const findings = [...rules.flatMap((r) => r.findings)];

    /* Two assertions rest on an artefact existing, not only on rules passing.
       Reporting them green while the artefact is missing would be the exact
       flattery this whole build exists to remove. */
    let missingArtefact = false;
    if (context && id === "consistency" && !context.mmdFinalised) {
      missingArtefact = true;
      findings.push({
        id: "V15",
        severity: "error",
        message:
          "No Monitoring Methodology Documentation has been finalised. A verifier asks for it before testing any figure, and without a prior version there is nothing to demonstrate consistency against.",
        field: "mmd",
      });
    }
    if (context && id === "accuracy" && !context.frozen) {
      missingArtefact = true;
      findings.push({
        id: "V13",
        severity: "warn",
        message:
          "The calculation has not been frozen. The figures recompute, but nothing yet proves that what a verifier is shown is what was approved.",
        field: "freeze",
      });
    }

    const status: AssertionSection["status"] =
      rules.some((r) => r.status === "fail") ||
      (missingArtefact && findings.some((x) => x.severity === "error"))
        ? "unanswered"
        : rules.some((r) => r.status === "warn") || missingArtefact
          ? "qualified"
          : "answered";
    const links = Array.from(
      new Map(rules.map((r) => [r.screen.path, r.screen])).values(),
    );
    return {
      id,
      title: ASSERTION_TITLE[id],
      question: ASSERTION_QUESTION[id],
      expectedEvidence: ASSERTION_EVIDENCE[id],
      status,
      findings,
      links,
    };
  });

  return {
    declarationId,
    readiness: readinessResult,
    sections,
    selfContained: sections.every((s) => s.status === "answered"),
  };
}

/* ── The verifier's read-only view ──────────────────────────────
   A share token, resolved against the same access policy the buyer-facing
   package uses. The verifier audience is never cut out of provenance,
   attestation or the derivation — that is enforced in
   lib/supplier-records.ts via `alwaysSharedWith` — and never sees commercial
   data, which is enforced by simply not assembling it here.

   ⚠️ MVP: this token is an encoding, not authentication. Production verifier
   links must be server-issued, signed, expiring and revocable — the same
   caveat that applies to Smart Links (see docs/SECURITY.md). */
export const VERIFIER_HIDDEN_SECTIONS = [
  "cost",
  "carbon-price-spend",
  "certificate-exposure",
] as const;

export function verifierShareToken(declarationId: string): string {
  const raw = `verify|${declarationId}`;
  if (typeof btoa !== "undefined")
    return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return Buffer.from(raw, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeVerifierToken(token: string): string | null {
  try {
    const padded = token.replace(/-/g, "+").replace(/_/g, "/");
    const raw =
      typeof atob !== "undefined"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    return raw.startsWith("verify|") ? raw.slice(7) : null;
  } catch {
    return null;
  }
}
