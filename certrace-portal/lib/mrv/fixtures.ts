/**
 * Calculation fixtures validate deterministic implementation behaviour. They
 * are not verified operator data and must not be presented as regulatory
 * verification. Certrace's ESG compliance specialist must approve fixture
 * provenance and expected values before any future verified-output claim.
 */
export const CALCULATION_FIXTURE_REVIEW = {
  status: "PENDING_ESG_SPECIALIST_REVIEW",
  mayBeLabelledVerified: false,
  notice: "Calculation fixture only — pending Certrace ESG compliance specialist approval",
} as const;
