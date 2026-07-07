/* ════════════════════════════════════════════════════════════
   STAGE 4 — INTERNAL APPROVAL WORKFLOW

   A configurable sign-off chain for the DECLARATION as a whole — distinct from
   the per-submission approve/request-revision decision in lib/exporter-review.ts
   (that's "is this supplier's data acceptable"; this is "are we, as an
   organisation, ready to file"). Two chain templates ship: a single-step
   "small company" chain and a multi-step "enterprise" chain with a
   conditionally-required Legal step. Persisted per declaration in localStorage
   — the seam where a real workflow engine slots in.

   See docs/EXPORTER-PORTAL-REDESIGN.md §6.
   ════════════════════════════════════════════════════════════ */

import { REVIEWERS, EXPORTER } from "./exporter-review";

export type ChainTemplateId = "small" | "enterprise";
export type StepRole = "preparer" | "esg" | "compliance" | "legal" | "management";
export type StepStatus = "pending" | "approved" | "changes_requested" | "skipped";

export type ChainStep = {
  role: StepRole;
  label: string;
  status: StepStatus;
  conditional: boolean; // only required if triggered (e.g. a risk flag)
  actorName: string;
  actorTitle: string;
  at: number | null;
  comment: string;
};

export type ChainComment = { id: string; author: string; at: number; text: string };

export type ChainState = {
  declId: string;
  template: ChainTemplateId;
  started: boolean;
  steps: ChainStep[];
  comments: ChainComment[];
};

const actorFor = (role: StepRole): { name: string; title: string } => {
  if (role === "management") return { name: EXPORTER.contact, title: "Final sign-off · " + EXPORTER.role };
  if (role === "preparer") return { name: EXPORTER.contact, title: EXPORTER.role };
  const r = REVIEWERS.find((x) => x.id === role);
  return r ? { name: r.name, title: r.role } : { name: "Unassigned", title: role };
};

function buildSteps(template: ChainTemplateId): ChainStep[] {
  const roles: { role: StepRole; label: string; conditional?: boolean }[] =
    template === "small"
      ? [
          { role: "preparer", label: "Prepare" },
          { role: "management", label: "Approve" },
        ]
      : [
          { role: "esg", label: "ESG / Sustainability review" },
          { role: "compliance", label: "Compliance review" },
          { role: "legal", label: "Legal review", conditional: true },
          { role: "management", label: "Management sign-off" },
        ];
  return roles.map(({ role, label, conditional }) => {
    const actor = actorFor(role);
    return {
      role,
      label,
      status: role === "preparer" ? "approved" : "pending",
      conditional: Boolean(conditional),
      actorName: actor.name,
      actorTitle: actor.title,
      at: role === "preparer" ? Date.now() : null,
      comment: "",
    };
  });
}

const keyFor = (declId: string) => `certrace:chain:${declId}`;

export function loadChain(declId: string): ChainState {
  const empty: ChainState = { declId, template: "small", started: false, steps: [], comments: [] };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(keyFor(declId));
    if (!raw) return empty;
    return { ...empty, ...(JSON.parse(raw) as ChainState), declId };
  } catch {
    return empty;
  }
}

export function saveChain(state: ChainState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(state.declId), JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

/** Start (or restart with a different template) the chain for this declaration. */
export function startChain(declId: string, template: ChainTemplateId): ChainState {
  const next: ChainState = { declId, template, started: true, steps: buildSteps(template), comments: [] };
  saveChain(next);
  return next;
}

/** Steps that actually gate filing right now — skips a conditional step unless
    it was explicitly triggered (e.g. by a Stage-1 methodology flag). */
export function activeSteps(chain: ChainState, legalRequired: boolean): ChainStep[] {
  return chain.steps.filter((s) => !s.conditional || legalRequired || s.status !== "pending");
}

export function isChainComplete(chain: ChainState, legalRequired: boolean): boolean {
  if (!chain.started) return false;
  const steps = activeSteps(chain, legalRequired);
  return steps.length > 0 && steps.every((s) => s.status === "approved" || s.status === "skipped");
}

/** The step whose turn it currently is (first pending, honouring conditional skip). */
export function currentStep(chain: ChainState, legalRequired: boolean): ChainStep | null {
  const steps = activeSteps(chain, legalRequired);
  return steps.find((s) => s.status === "pending") ?? null;
}

function mutate(declId: string, fn: (c: ChainState) => ChainState): ChainState {
  const state = loadChain(declId);
  const next = fn(state);
  saveChain(next);
  return next;
}

export function approveStep(declId: string, role: StepRole, comment = ""): ChainState {
  return mutate(declId, (c) => ({
    ...c,
    steps: c.steps.map((s) => (s.role === role ? { ...s, status: "approved", at: Date.now(), comment } : s)),
  }));
}

export function requestChangesAtStep(declId: string, role: StepRole, comment: string): ChainState {
  return mutate(declId, (c) => ({
    ...c,
    steps: c.steps.map((s) => (s.role === role ? { ...s, status: "changes_requested", at: Date.now(), comment } : s)),
  }));
}

/** Skip a conditional step that was never triggered (e.g. Legal, when no risk
    flag exists) — recorded explicitly rather than silently omitted. */
export function skipStep(declId: string, role: StepRole): ChainState {
  return mutate(declId, (c) => ({
    ...c,
    steps: c.steps.map((s) => (s.role === role && s.conditional ? { ...s, status: "skipped", at: Date.now() } : s)),
  }));
}

export function addComment(declId: string, author: string, text: string): ChainState {
  return mutate(declId, (c) => ({
    ...c,
    comments: [...c.comments, { id: `${declId}-${c.comments.length}`, author, at: Date.now(), text }],
  }));
}

export const CHAIN_TEMPLATE_META: Record<ChainTemplateId, { label: string; description: string }> = {
  small: { label: "Small company", description: "One preparer, one approver — fast sign-off for a lean team." },
  enterprise: { label: "Enterprise", description: "ESG → Compliance → Legal (if flagged) → Management — full segregation of duties." },
};
