/* Persistence for declarations created via the wizard.

   Frontend-only MVP: the static DECLARATIONS array in lib/data.ts is re-imported
   fresh on every server render, so it can't grow at runtime. New declarations
   live in localStorage instead — the same seam drafts already use (lib/drafts.ts). */

import type { Declaration } from "./data";

const KEY = "certrace:v2:created-declarations";
const LEGACY_KEY = "certrace:created-declarations";
const QUARANTINE_KEY = "certrace:legacy_unverified:created-declarations";

type DeclarationEnvelope = {
  schemaVersion: 2;
  dataClassification: "readiness_demo";
  records: Declaration[];
};

function quarantineLegacyDeclarations(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (raw === null) return;
    window.localStorage.removeItem(LEGACY_KEY);
    if (window.localStorage.getItem(QUARANTINE_KEY) === null) {
      window.localStorage.setItem(
        QUARANTINE_KEY,
        JSON.stringify({ classification: "legacy_unverified", quarantinedAt: Date.now(), originalKey: LEGACY_KEY, discardedBytes: raw.length, reason: "Unversioned record discarded; payload not retained." }),
      );
    }
  } catch {
    // Never load an unversioned declaration when quarantine cannot complete.
  }
}

export function loadCreatedDeclarations(): Declaration[] {
  if (typeof window === "undefined") return [];
  quarantineLegacyDeclarations();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const envelope = JSON.parse(raw) as DeclarationEnvelope;
    if (envelope.schemaVersion !== 2 || envelope.dataClassification !== "readiness_demo" || !Array.isArray(envelope.records)) {
      window.localStorage.removeItem(KEY);
      window.localStorage.setItem(
        QUARANTINE_KEY,
        JSON.stringify({ classification: "legacy_unverified", quarantinedAt: Date.now(), originalKey: KEY, discardedBytes: raw.length, reason: "Invalid schema record discarded; payload not retained." }),
      );
      return [];
    }
    return envelope.records;
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
    const envelope: DeclarationEnvelope = { schemaVersion: 2, dataClassification: "readiness_demo", records: all };
    window.localStorage.setItem(KEY, JSON.stringify(envelope));
  } catch {
    throw new Error("Local declaration save failed. The declaration was not created.");
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
      const envelope: DeclarationEnvelope = {
        schemaVersion: 2,
        dataClassification: "readiness_demo",
        records: created.filter((d) => d.id !== id),
      };
      window.localStorage.setItem(KEY, JSON.stringify(envelope));
    } catch {
      throw new Error("Local declaration delete failed.");
    }
    return;
  }
  const hidden = loadHiddenDeclarationIds();
  if (!hidden.includes(id)) {
    try {
      window.localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden, id]));
    } catch {
      throw new Error("Local declaration visibility update failed.");
    }
  }
}
