/* ════════════════════════════════════════════════════════════
   DECLARATIONS — the signed-in account's own, from the backend

   This store used to be localStorage (a created-list plus a hidden-ids list
   layered over the demo fixtures). Declarations now live on the server,
   scoped to the signed-in account — so this module is
   the one seam the screens read and write them through, and the localStorage
   layers are gone: what the API returns IS the estate.

   ════════════════════════════════════════════════════════════ */

import type { Declaration } from "./data";
import {
  getDeclaration as apiGet,
  listDeclarations as apiList,
  removeDeclaration as apiRemove,
  updateDeclaration as apiSave,
  isApiError,
} from "./api";

/** Every declaration the signed-in account owns, newest change first. */
export function listMyDeclarations(): Promise<Declaration[]> {
  return apiList();
}

/** One owned declaration, or null when it does not exist (or is not theirs —
    the server answers 404 for both, deliberately). */
export async function getMyDeclaration(
  id: string,
): Promise<Declaration | null> {
  try {
    return await apiGet(id);
  } catch (cause) {
    if (isApiError(cause) && cause.status === 404) return null;
    throw cause;
  }
}

/** Create or overwrite, whole. PUT is an upsert on the server — the id is
    minted here in the client — so one call serves both the wizard's create
    and every later edit, including offline retries. */
export function saveDeclaration(
  declaration: Declaration,
): Promise<Declaration> {
  return apiSave(declaration);
}

/** Idempotent: deleting what is already gone succeeds on the server. */
export function deleteDeclaration(id: string): Promise<void> {
  return apiRemove(id);
}

export const newDeclarationId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? `decl-${crypto.randomUUID()}`
    : `decl-${Date.now()}-${Math.random().toString(36).slice(2)}`;
