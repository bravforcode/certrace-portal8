import type { Declaration } from "../data";
import { api, result } from "./client";
import { decode, jsonDocument } from "./decode";
import { isDeclaration } from "./validators.js";
export async function listDeclarations(): Promise<Declaration[]> {
  return (await result(api().api.v1.declarations.get())).declarations.map(
    (value) => decode(value, isDeclaration),
  );
}
export async function getDeclaration(id: string): Promise<Declaration> {
  return decode(
    await result(
      api()
        .api.v1.declarations({ declaration_id: encodeURIComponent(id) })
        .get(),
    ),
    isDeclaration,
  );
}
export async function createDeclaration(
  value: Declaration,
): Promise<Declaration> {
  return decode(
    await result(
      api().api.v1.declarations.post({ ...jsonDocument(value), id: value.id }),
    ),
    isDeclaration,
  );
}
export async function updateDeclaration(
  value: Declaration,
): Promise<Declaration> {
  return decode(
    await result(
      api()
        .api.v1.declarations({ declaration_id: encodeURIComponent(value.id) })
        .put(jsonDocument(value)),
    ),
    isDeclaration,
  );
}
export async function removeDeclaration(id: string): Promise<void> {
  await result(
    api()
      .api.v1.declarations({ declaration_id: encodeURIComponent(id) })
      .delete(),
  );
}
