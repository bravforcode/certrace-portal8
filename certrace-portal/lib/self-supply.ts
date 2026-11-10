import { decodeToken, buildRequestFrom } from "./supplier";
import { getMyDeclaration } from "./declarations-store";
import { createSmartLink, resolveLink } from "./api/links";
import { assertSessionUnchanged, sessionEpoch } from "./api/session";

/** Resolve the reference's self-supply route against the owned declaration. */
export async function resolveSelfSupply(token: string) {
  const epoch = sessionEpoch();
  const decoded = decodeToken(token);
  if (!decoded) return null;
  const declaration = await getMyDeclaration(decoded.declId);
  if (!declaration) return null;
  const supplier = declaration.suppliers.find(
    (s) => s.id === decoded.supplierId,
  );
  if (!supplier) return null;
  assertSessionUnchanged(epoch);
  if (!supplier.selfSupplied)
    return {
      req: buildRequestFrom(token, declaration, supplier, decoded.month),
    };
  const link = await createSmartLink(declaration.id, {
    supplierId: supplier.id,
    month: decoded.month,
  });
  assertSessionUnchanged(epoch);
  const resolved = await resolveLink(link.token);
  assertSessionUnchanged(epoch);
  return {
    req: buildRequestFrom(link.token, declaration, supplier, decoded.month),
    initialState: resolved.state,
  };
}
