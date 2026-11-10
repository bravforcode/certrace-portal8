/** Complete metadata for a fictional independently verified precursor report. */
export function verifiedReport(
  periodStart = "2026-01-01",
  periodEnd = "2026-12-31",
) {
  return {
    verificationReportFileId: "ev-1",
    reportingPeriodStart: periodStart,
    reportingPeriodEnd: periodEnd,
    verificationCoverageStart: periodStart,
    verificationCoverageEnd: periodEnd,
    verifierName: "Example verifier",
    verifierAccreditationNumber: "EX-123",
    verifierAccreditationIssuingCountry: "TH",
    verifierAccreditationExpiryDate: "2030-01-01",
    verificationReportIssueDate: periodEnd,
    verificationSectoralScope: "Iron and steel",
  };
}
