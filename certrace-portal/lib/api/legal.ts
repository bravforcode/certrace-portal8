"use client";
import * as React from "react";
import { api, result } from "./client";

export async function legalDocuments() {
  return result(api(false).api.auth.legal.documents.get());
}
export type LegalDocuments = Awaited<ReturnType<typeof legalDocuments>>;
export function legalVersionIds(documents: LegalDocuments) {
  return {
    termsVersionId: documents.find((d) => d.kind === "terms")!.id,
    privacyVersionId: documents.find((d) => d.kind === "privacy")!.id,
  };
}
export function useLegalDocuments() {
  const [documents, setDocuments] = React.useState<LegalDocuments | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const reload = React.useCallback(async () => {
    setDocuments(null);
    setError(null);
    try {
      setDocuments(await legalDocuments());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load legal documents.",
      );
    }
  }, []);
  React.useEffect(() => {
    void reload();
  }, [reload]);
  return { documents, error, reload };
}
