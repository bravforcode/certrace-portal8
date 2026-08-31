/* ════════════════════════════════════════════════════════════
   DECLARATIONS — the exporter's reporting jobs

   Mirrors §2 of docs/API-CONTRACT.md.

   The wire type is the portal's own `Declaration` (lib/data.ts), sent and
   returned whole. The backend stores it as jsonb and only breaks out the few
   columns it needs to sort and filter by, so the two sides cannot drift into
   different ideas of what a declaration contains — there is only one
   definition, and it lives here.

   `id` is minted client-side (`newDeclarationId()`) and sent with the create,
   because the wizard redirects to the new declaration's page the instant the
   user clicks — it cannot wait for a server-assigned id to know where to go.
   ════════════════════════════════════════════════════════════ */

import type { Declaration } from "../data";
import { request } from "./http";

export async function listDeclarations(): Promise<Declaration[]> {
  const result = await request<{ declarations: Declaration[] }>("/api/v1/declarations");
  return result.declarations ?? [];
}

export function getDeclaration(id: string): Promise<Declaration> {
  return request<Declaration>(`/api/v1/declarations/${encodeURIComponent(id)}`);
}

export function createDeclaration(declaration: Declaration): Promise<Declaration> {
  return request<Declaration>("/api/v1/declarations", {
    method: "POST",
    body: declaration,
  });
}

export function updateDeclaration(declaration: Declaration): Promise<Declaration> {
  return request<Declaration>(`/api/v1/declarations/${encodeURIComponent(declaration.id)}`, {
    method: "PUT",
    body: declaration,
  });
}

export function removeDeclaration(id: string): Promise<void> {
  return request<void>(`/api/v1/declarations/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
