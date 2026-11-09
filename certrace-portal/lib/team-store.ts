/* ════════════════════════════════════════════════════════════
   TEAM STORE — one registry of people who can be asked to check things.

   The four seeded reviewers (ESG, Compliance, Legal, Verifier) come from the
   demo fixtures; anyone added through the "Add person" popup — from a
   submission's reviewer picker, the report sign-off step, or the Team page —
   persists here in localStorage and immediately shows up in all three places.

   Assignments themselves live elsewhere:
     · per-submission reviewers  → lib/exporter-review.ts  (review.reviewers)
     · report sign-offs          → lib/exporter-review.ts  (state.signoffs)
   This module only answers "who exists" — the seam where a real members API
   would slot in.
   ════════════════════════════════════════════════════════════ */

import { REVIEWERS } from "./exporter-review";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string; // display position, e.g. "ESG / Sustainability"
  dept: string;
  kind: "internal" | "external";
  builtin?: boolean; // seeded fixture — cannot be removed
};

/* ── The roles you can hand somebody ────────────────────────────
   THE ACCOUNT HAS EXACTLY THREE ROLES: Owner, Member, and Legal /
   compliance. Two of them can be given to somebody new, and those two are
   what this list is.

   IT USED TO OFFER FIVE JOB TITLES — ESG / Sustainability, Compliance, Legal
   counsel, Finance, Management — and that was a list of DEPARTMENTS wearing
   the clothes of a permission model. Four of the five resolved to the same
   seat role ("member"), so an exporter who carefully picked "Finance" for
   their accountant and "Management" for their MD gave both of them precisely
   the same access, and the Team page then described the account in terms of
   three roles the picker had never mentioned. A control that appears to
   decide something and does not is worse than no control: it is a decision
   the reader believes they have made.

   So the picker now offers the roles that actually exist, named exactly as
   the Team page names them, and each carries the one sentence that says what
   it can do.

   NO VERIFIER. Certrace has no verifier portal in this build: nothing an
   invited verifier is granted is reachable by them. Offering the role creates
   a seat that describes access which does not exist, and an exporter who
   invites their accredited body here would reasonably believe the body had
   been given something. It comes back when there is a portal behind it. */
export const POSITION_OPTIONS: { value: string; dept: string; kind: "internal" | "external"; hint: string }[] = [
  { value: "Member", dept: "Operations", kind: "internal", hint: "builds product reports and fills months in" },
  { value: "Legal / compliance", dept: "Legal", kind: "internal", hint: "reviews and signs off before it leaves" },
];

/** The role a seat is granted when nothing else is chosen. */
export const DEFAULT_POSITION = POSITION_OPTIONS[0].value;

const SEED_EMAILS: Record<string, string> = {
  esg: "ananya@siamsteel.co.th",
  compliance: "wasawat@siamsteel.co.th",
  legal: "krit@kritlegal.co.th",
  verifier: "verification@tuv-sud.example",
};

const SEED: TeamMember[] = REVIEWERS.map((r) => ({
  id: r.id,
  name: r.name,
  email: SEED_EMAILS[r.id] ?? "",
  role: r.role,
  dept: r.dept,
  kind: r.id === "legal" || r.id === "verifier" ? "external" : "internal",
  builtin: true,
}));

const KEY = "certrace:team-members";

function loadAdded(): TeamMember[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as TeamMember[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveAdded(members: TeamMember[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(members));
  } catch {
    /* ignore quota */
  }
}

/** Everyone — seeded reviewers first, then people added at runtime. */
export function loadTeam(): TeamMember[] {
  return [...SEED, ...loadAdded()];
}

export function getTeamMember(id: string): TeamMember | undefined {
  return loadTeam().find((m) => m.id === id);
}

/** Add (or return the existing) member — deduped by email so inviting the
    same person twice from different pages never forks their identity. */
export function addTeamMember(input: { name: string; email: string; role: string }): TeamMember {
  const email = input.email.trim().toLowerCase();
  const existing = loadTeam().find((m) => m.email.toLowerCase() === email);
  if (existing) return existing;
  const pos = POSITION_OPTIONS.find((p) => p.value === input.role);
  const member: TeamMember = {
    id: `tm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: input.name.trim(),
    email: input.email.trim(),
    role: input.role,
    dept: pos?.dept ?? "Compliance",
    kind: pos?.kind ?? "internal",
  };
  saveAdded([...loadAdded(), member]);
  return member;
}

export function removeTeamMember(id: string): void {
  saveAdded(loadAdded().filter((m) => m.id !== id));
}
