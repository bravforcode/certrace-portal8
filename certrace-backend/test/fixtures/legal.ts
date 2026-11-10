import { currentLegalDocuments } from "../../src/modules/auth/legal";
export async function legalVersionIds() {
  const documents = await currentLegalDocuments();
  return {
    termsVersionId: documents.find((d) => d.kind === "terms")!.id,
    privacyVersionId: documents.find((d) => d.kind === "privacy")!.id,
  };
}
