/* Persistence for declarations created via the wizard.

   Frontend-only MVP: the static DECLARATIONS array in lib/data.ts is re-imported
   fresh on every server render, so it can't grow at runtime. New declarations
   live in localStorage instead — the same seam drafts already use (lib/drafts.ts). */

import type { Declaration } from "./data";

const KEY = "certrace:created-declarations";

export function loadCreatedDeclarations(): Declaration[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Declaration[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function getCreatedDeclaration(id: string): Declaration | null {
  return loadCreatedDeclarations().find((d) => d.id === id) ?? null;
}

export function saveCreatedDeclaration(declaration: Declaration): void {
  if (typeof window === "undefined") return;
  const all = loadCreatedDeclarations().filter((d) => d.id !== declaration.id);
  all.unshift(declaration);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore quota / serialization errors — the redirect still lands on a live id */
  }
}

export const newDeclarationId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? `decl-${crypto.randomUUID()}` : `decl-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/* ── Deletion ─────────────────────────────────────────────────
   Wizard-created declarations are removed from their own store; the static
   demo fixtures can't shrink at runtime, so their ids go on a hidden list the
   declarations index filters against. */
const HIDDEN_KEY = "certrace:hidden-declarations";

export function loadHiddenDeclarationIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HIDDEN_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as string[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function deleteDeclaration(id: string): void {
  if (typeof window === "undefined") return;
  const created = loadCreatedDeclarations();
  if (created.some((d) => d.id === id)) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(created.filter((d) => d.id !== id)));
    } catch {
      /* ignore quota */
    }
    return;
  }
  const hidden = loadHiddenDeclarationIds();
  if (!hidden.includes(id)) {
    try {
      window.localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden, id]));
    } catch {
      /* ignore quota */
    }
  }
}
