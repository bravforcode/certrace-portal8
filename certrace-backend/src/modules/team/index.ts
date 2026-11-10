import { Elysia, t } from "elysia";
import { db } from "../../lib/db";
import { fail } from "../../lib/errors";
import { authenticated } from "../auth/plugin";
import { companySession, requireOwner } from "./workspace";
import { invitationPreview, acceptInvitation, invite, remove } from "./service";
const secret = t.Object({
  token: t.String({ pattern: "^[A-Za-z0-9_-]{43}$" }),
});
const id = t.Object({ id: t.String({ format: "uuid" }) });
export const team = new Elysia({ prefix: "/api/v1/team" })
  .post("/preview", ({ body }) => invitationPreview(body.token), {
    body: secret,
  })
  .use(authenticated)
  .post(
    "/accept",
    ({ account, body }) => acceptInvitation(account, body.token),
    { body: secret },
  )
  .use(companySession)
  .post(
    "/invitations",
    ({ account, company, body }) => invite(account, company, body.email),
    {
      body: t.Object({ email: t.String({ format: "email", maxLength: 320 }) }),
    },
  )
  .post(
    "/invitations/:id/resend",
    async ({ account, company, params }) => {
      requireOwner(account.id, company.id);
      const invitation = await db.team_invitations.findFirst({
        where: { id: params.id, account_id: company.id },
      });
      if (!invitation) fail(404, "INVITE_CLOSED", "Invitation not found.");
      return invite(account, company, invitation.email, invitation.id);
    },
    { params: id },
  )
  .delete(
    "/invitations/:id",
    ({ account, company, params }) =>
      remove(account, company, params.id, "invitation"),
    { params: id },
  )
  .delete(
    "/members/:id",
    ({ account, company, params }) =>
      remove(account, company, params.id, "member"),
    { params: id },
  );
