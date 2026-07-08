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

/* Positions offered when adding a person — each maps to a department. */
export const POSITION_OPTIONS: { value: string; dept: string; kind: "internal" | "external" }[] = [
  { value: "ESG / Sustainability", dept: "Sustainability", kind: "internal" },
  { value: "Compliance", dept: "Compliance", kind: "internal" },
  { value: "Legal counsel", dept: "Legal", kind: "external" },
  { value: "Finance", dept: "Finance", kind: "internal" },
  { value: "Management", dept: "Management", kind: "internal" },
  { value: "Verifier / auditor", dept: "Assurance", kind: "external" },
];

const SEED_EMAILS: Record<string, string> = {
  esg: "ananya@siamsteel.co.th",
  compliance: "wasawat@siamsteel.co.th",
  legal: "krit@kritlegal.co.th",
  verifier: "audit@tuv-sud.example",
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
