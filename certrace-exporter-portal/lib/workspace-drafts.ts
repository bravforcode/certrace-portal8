/* ════════════════════════════════════════════════════════════
   DRAFTS FOR THE NEW-WORKSPACE FLOW

   Creating a workspace is now four steps rather than one dialog, and four
   steps is long enough that somebody will be interrupted in the middle of it.
   Closing the flow used to throw the answers away; it now writes a draft, and
   the verification dashboard surfaces it at the top with a Draft chip so the
   half-finished one is the first thing they see rather than something they
   have to remember.

   Same shape and same seam as lib/drafts.ts, which does this for declarations.
   ════════════════════════════════════════════════════════════ */

export type WorkspaceWizardSnapshot = {
  /** installation reference chosen or typed */
  installationId: string;
  installationName: string;
  /** true when the exporter ticked "this installation is us" */
  isSelf: boolean;
  /** which of the two supplier answers has been given — "" until one is picked,
      because neither is a safe default and pre-selecting one is how an exporter
      files a supplier's plant under their own name */
  supplierChoice: "" | "self" | "other";
  /** the SupplierCompany the installation belongs to, when it is a third
      party's. Empty for the exporter's own sites — they are the company. */
  supplierId?: string;
  productId: string;
  route: string;
  year: number;
  /** last date the month's data may be sent, as a day of the FOLLOWING month */
  dueDay?: number;
  /* Legacy, and read-only. Drafts saved before the schedule became a single
     deadline carry these two; the flow converts them (requestDay +
     dueAfterDays) rather than dropping a half-finished setup on the floor. */
  requestDay?: number;
  dueAfterDays?: number;
  step: number;
};

export type WorkspaceDraft = {
  id: string;
  updatedAt: number;
  snapshot: WorkspaceWizardSnapshot;
  /** denormalised so the dashboard renders a draft card without rehydrating */
  display: {
    installationName: string;
    productName: string;
    year: number;
    step: number;
    stepCount: number;
  };
};

const KEY = "certrace:workspace-drafts";

export const draftId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? `wsd-${crypto.randomUUID().slice(0, 8)}`
    : `wsd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function loadWorkspaceDrafts(): WorkspaceDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as WorkspaceDraft[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch {
    return [];
  }
}

function writeAll(all: WorkspaceDraft[]): WorkspaceDraft[] {
  if (typeof window === "undefined") return all;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore quota */
  }
  return all;
}

export const getWorkspaceDraft = (id: string): WorkspaceDraft | null => loadWorkspaceDrafts().find((d) => d.id === id) ?? null;

export function saveWorkspaceDraft(draft: WorkspaceDraft): WorkspaceDraft {
  const next = [{ ...draft, updatedAt: Date.now() }, ...loadWorkspaceDrafts().filter((d) => d.id !== draft.id)];
  writeAll(next);
  return next[0];
}

export function deleteWorkspaceDraft(id: string): WorkspaceDraft[] {
  return writeAll(loadWorkspaceDrafts().filter((d) => d.id !== id));
}

/** An untouched flow is not a draft. Without this, opening the New workspace
    screen and pressing Escape leaves a card behind on the dashboard, which
    reads as a bug rather than as a saved answer. */
export const isWorthSaving = (s: WorkspaceWizardSnapshot): boolean =>
  Boolean(s.installationId.trim() || s.installationName.trim() || s.productId || s.route);
