export type RequestRoute =
  | { kind: "invite" }
  | { kind: "ask-owner" }
  | { kind: "supplier"; href: "/suppliers?add=1" };

// Same-company people edit the workbook as team editors; outside suppliers
// fill in a Smart Link form. Only the owner can invite, so an editor is sent
// back to the owner.
export function requestRoute(
  answer: "internal" | "external",
  ctx: { isOwner: boolean },
): RequestRoute {
  if (answer === "external")
    return { kind: "supplier", href: "/suppliers?add=1" };
  return ctx.isOwner ? { kind: "invite" } : { kind: "ask-owner" };
}
