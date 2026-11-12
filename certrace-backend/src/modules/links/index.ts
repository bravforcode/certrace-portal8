import { Elysia } from "elysia";
import { companySession } from "../team/workspace";
import { ownedDeclaration } from "../declarations/service";
import { db } from "../../lib/db";
import { token } from "../../lib/security";
import { config } from "../../lib/config";
import { array, object, type JsonObject } from "../../lib/json";
import { LinkModel } from "./model";
import * as Links from "./service";
import * as ItemLinks from "./item-service";
import { reopenExchange } from "../reporting/exchanges";
import { lockOwner } from "../reporting/service";
export const publicLinks = new Elysia({ prefix: "/api/v1/links" })
  .get("/:token", ({ params }) => Links.resolve(params.token))
  .put(
    "/:token/state",
    ({ params, body }) => Links.save(params.token, body.state),
    { body: LinkModel.save },
  )
  .post(
    "/:token/submit",
    ({ params, body }) => Links.save(params.token, body.state, body),
    { body: LinkModel.submit },
  );
export const links = new Elysia({ prefix: "/api/v1/declarations" })
  .use(companySession)
  .post(
    "/:declaration_id/links",
    async ({ company, params, body, set }) => {
      const declaration = await ownedDeclaration(
        company.id,
        params.declaration_id,
      );
      const data = {
        token: token(),
        user_id: company.id,
        declaration_id: params.declaration_id,
        supplier_id: body.supplierId,
        month: body.month,
        expires_at: new Date(
          Date.now() + (body.expiresInDays ?? 90) * 86400000,
        ),
      };
      const selfSupplied = array(object(declaration.doc).suppliers).some(
        (s) =>
          object(s).id === body.supplierId && object(s).selfSupplied === true,
      );
      // The existing self-supply form must reopen the same saved response.
      // Normal supplier requests retain their explicit create-link behavior.
      const row = selfSupplied
        ? await db.$transaction(async (tx) => {
            await lockOwner(tx, company.id);
            const existing = await tx.smart_links.findFirst({
              where: {
                user_id: company.id,
                declaration_id: params.declaration_id,
                supplier_id: body.supplierId,
                month: body.month ?? null,
                revoked_at: null,
              },
              orderBy: { created_at: "desc" },
            });
            return existing
              ? await tx.smart_links.update({
                  where: { token: existing.token },
                  data: { expires_at: data.expires_at },
                })
              : await tx.smart_links.create({ data });
          })
        : await db.smart_links.create({ data });
      set.status = 201;
      return {
        token: row.token,
        url: `${config.appUrl}/s/${row.token}`,
        expiresAt: +row.expires_at,
      };
    },
    { body: LinkModel.create },
  )
  .get("/:declaration_id/links", async ({ company, params }) => {
    await ownedDeclaration(company.id, params.declaration_id);
    return {
      links: (
        await db.smart_links.findMany({
          where: { user_id: company.id, declaration_id: params.declaration_id },
          orderBy: { created_at: "desc" },
        })
      ).map((r) => ({
        token: r.token,
        url: `${config.appUrl}/s/${r.token}`,
        supplierId: r.supplier_id,
        month: r.month,
        expiresAt: +r.expires_at,
        revokedAt: r.revoked_at ? +r.revoked_at : null,
        createdAt: +r.created_at,
      })),
    };
  })
  .get("/:declaration_id/submissions", async ({ company, params }) => {
    await ownedDeclaration(company.id, params.declaration_id);
    return {
      submissions: (
        await db.smart_links.findMany({
          where: { user_id: company.id, declaration_id: params.declaration_id },
          orderBy: { created_at: "desc" },
        })
      ).map(Links.summary),
    };
  })
  .get("/:declaration_id/submissions/:token", async ({ company, params }) => {
    const link = await Links.ownedLink(
      company.id,
      params.declaration_id,
      params.token,
    );
    return {
      token: link.token,
      supplierId: link.supplier_id,
      state: await Links.readState(link),
    };
  })
  .post(
    "/:declaration_id/links/:token/revision",
    async ({ account, company, params, body }) =>
      db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT token FROM smart_links WHERE token=${params.token} FOR UPDATE`;
        const link = await Links.ownedLink(
          company.id,
          params.declaration_id,
          params.token,
          tx,
        );
        const state: JsonObject = {
          ...Links.emptyState(link.token),
          ...object(link.state),
          status: "revision_requested",
          unlocked: body.unlocked ?? [],
          unlockedDocs: body.unlockedDocs ?? [],
          revisionNote: body.note ?? "",
          updatedAt: Date.now(),
        };
        const declaration = await tx.portal_declarations.findUniqueOrThrow({
          where: {
            user_id_id: { user_id: company.id, id: params.declaration_id },
          },
        });
        const doc = object(declaration.doc),
          invitation = object(doc.supplierView);
        if (doc.kind === "workspace" && object(invitation.workspace).id) {
          // Replace the supplier draft with the owner's edited month when the
          // owner deliberately requests a revision, including the review note.
          await reopenExchange(tx, link, doc, body, account.email);
        }
        state.events = [
          ...array(state.events),
          {
            id: crypto.randomUUID(),
            at: Date.now(),
            kind: "revision_requested",
            text: body.note ?? "Revision requested",
          },
        ];
        await tx.smart_links.update({
          where: { token: link.token },
          data: { state },
        });
        return state;
      }),
    { body: LinkModel.revision },
  )
  .post("/:declaration_id/links/:token/revoke", async ({ company, params }) => {
    const link = await Links.ownedLink(
      company.id,
      params.declaration_id,
      params.token,
    );
    const row = await db.smart_links.update({
      where: { token: link.token },
      data: { revoked_at: link.revoked_at ?? new Date() },
    });
    return { token: row.token, revokedAt: +row.revoked_at! };
  });

// Smart Links scoped to one checklist item. Public routes resolve by token only; the
// item key, installation and year all come from the stored link, never from the request.
export const publicItemLinks = new Elysia({ prefix: "/api/v1/item-links" })
  .get("/:token", ({ params }) => ItemLinks.resolveItemLink(params.token))
  .post(
    "/:token/submit",
    ({ params, body }) => ItemLinks.submitItemLink(params.token, body.values),
    { body: LinkModel.itemSubmit },
  );

export const itemLinks = new Elysia({ prefix: "/api/v1" })
  .use(companySession)
  .post(
    "/item-links",
    async ({ company, account, body, set }) => {
      set.status = 201;
      return ItemLinks.createItemLink(company.id, account.id, body);
    },
    { body: LinkModel.itemCreate },
  );
