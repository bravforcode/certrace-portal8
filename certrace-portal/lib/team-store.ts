import { accountStorage, companyDirectory } from "./account-storage";
import { loadSession } from "./api/session";
/* ════════════════════════════════════════════════════════════
   TEAM STORE — one registry of people who can be asked to check things.

   People added through the "Add person" popup — from a submission's reviewer
   picker, the report sign-off step, or the Team page — persist through
   accountStorage in PostgreSQL and appear in all three places.

   Assignments themselves live elsewhere:
     · per-submission reviewers  → lib/exporter-review.ts  (review.reviewers)
     · report sign-offs          → lib/exporter-review.ts  (state.signoffs)
   This module only answers "who exists" — the seam where a real members API
   would slot in.
   ════════════════════════════════════════════════════════════ */

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string; // display position, e.g. "ESG / Sustainability"
  dept: string;
  kind: "internal" | "external";
  builtin?: boolean; // legacy imported row
};

/* New contacts are Members. Saved legacy positions remain on existing records
   so reviewer and sign-off references still resolve. */

const KEY = "certrace:team-members";

function loadAdded(): TeamMember[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = accountStorage.getItem(KEY);
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
    accountStorage.setItem(KEY, JSON.stringify(members));
  } catch {
    /* ignore quota */
  }
}

/** Members saved for this account. */
export function loadTeam(): TeamMember[] {
  const user = loadSession()?.user;
  const members = loadAdded();
  const directory = companyDirectory();
  if (directory) {
    // Keep the saved contact's ID so old reviewer assignments still resolve.
    const profile = JSON.parse(
      accountStorage.getItem("certrace:profile") ?? "null",
    );
    const ownerName =
      directory.isOwner &&
      [profile?.firstName, profile?.lastName].filter(Boolean).join(" ");
    const active = directory.members.map((person) => {
      const contact = members.find(
        (m) => m.email.toLowerCase() === person.email.toLowerCase(),
      );
      return {
        ...contact,
        id: person.role === "Owner" ? person.id : (contact?.id ?? person.id),
        name:
          person.role === "Owner" && ownerName
            ? ownerName
            : person.name === person.email && contact?.name
              ? contact.name
              : person.name,
        email: person.email,
        role: person.role,
        dept: contact?.dept ?? "",
        kind: contact?.kind ?? ("internal" as const),
        builtin: true,
      };
    });
    return [
      ...active,
      ...members.filter(
        (m) =>
          !active.some((p) => p.email.toLowerCase() === m.email.toLowerCase()),
      ),
    ];
  }
  if (!user) return members;
  const profile =
    JSON.parse(accountStorage.getItem("certrace:profile") ?? "null") ?? {};
  const name =
    [profile.firstName ?? user.firstName, profile.lastName ?? user.lastName]
      .filter(Boolean)
      .join(" ") || user.email;
  return [
    {
      id: user.id,
      name,
      email: user.email,
      role: "Owner",
      dept: "",
      kind: "internal",
      builtin: true,
    },
    ...members.filter(
      (m) => m.email.toLowerCase() !== user.email.toLowerCase(),
    ),
  ];
}

export function getTeamMember(id: string): TeamMember | undefined {
  return loadTeam().find((m) => m.id === id);
}

/** Add (or return the existing) member — deduped by email so inviting the
    same person twice from different pages never forks their identity. */
export function addTeamMember(input: {
  name: string;
  email: string;
}): TeamMember {
  const email = input.email.trim().toLowerCase();
  const existing = loadTeam().find((m) => m.email.toLowerCase() === email);
  if (existing) return existing;
  const member: TeamMember = {
    id: `tm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: input.name.trim(),
    email: input.email.trim(),
    role: "Member",
    dept: "Operations",
    kind: "internal",
  };
  saveAdded([...loadAdded(), member]);
  return member;
}

export function removeTeamMember(id: string): void {
  saveAdded(loadAdded().filter((m) => m.id !== id));
}
