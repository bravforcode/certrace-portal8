import { Elysia } from "elysia";
import { AuthModel } from "./model";
import * as Auth from "./service";
import { authenticated } from "./plugin";
import { config, SESSION_COOKIE, SESSION_SECONDS } from "../../lib/config";
import { db } from "../../lib/db";
import { notify } from "../../lib/notify";
import { fail } from "../../lib/errors";
import {
  acceptanceContext,
  currentLegalDocuments,
  recordLegalAcceptance,
} from "./legal";
import { listReports, saveReportBatch } from "../reporting/service";
import { reportBatch } from "../reporting/model";
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: config.secureCookie,
  path: "/",
  maxAge: SESSION_SECONDS,
};
export const auth = new Elysia({ prefix: "/api/auth" })
  .get("/legal/documents", () => currentLegalDocuments())
  .post(
    "/register",
    async ({ body, cookie, set, request, server }) => {
      const result = await Auth.session(
        await Auth.register(
          body,
          acceptanceContext(
            request,
            server?.requestIP(request)?.address,
            config.trustedProxyHops,
          ),
        ),
      );
      cookie[SESSION_COOKIE]!.set({
        ...cookieOptions,
        value: result.refreshToken,
      });
      set.status = 201;
      return result;
    },
    { body: AuthModel.register },
  )
  .post(
    "/login",
    async ({ body, cookie }) => {
      const result = await Auth.session(
        await Auth.login(body.email, body.password),
      );
      cookie[SESSION_COOKIE]!.set({
        ...cookieOptions,
        value: result.refreshToken,
      });
      return result;
    },
    { body: AuthModel.login },
  )
  .post(
    "/google",
    async ({ body, cookie, request, server }) => {
      const result = await Auth.session(
        await Auth.google(
          body.idToken,
          body.nonce,
          undefined,
          {
            termsAccepted: body.termsAccepted,
            privacyAccepted: body.privacyAccepted,
            marketingOptIn: body.marketingOptIn,
            termsVersionId: body.termsVersionId,
            privacyVersionId: body.privacyVersionId,
          },
          acceptanceContext(
            request,
            server?.requestIP(request)?.address,
            config.trustedProxyHops,
          ),
        ),
      );
      cookie[SESSION_COOKIE]!.set({
        ...cookieOptions,
        value: result.refreshToken,
      });
      return result;
    },
    { body: AuthModel.google },
  )
  .post(
    "/refresh",
    async ({ body, request, cookie }) => {
      const result = await Auth.refresh(
        body?.refreshToken ?? Auth.cookieToken(request),
      );
      cookie[SESSION_COOKIE]!.set({
        ...cookieOptions,
        value: result.refreshToken,
      });
      return result;
    },
    { body: AuthModel.refresh },
  )
  .post(
    "/logout",
    async ({ body, request, cookie }) => {
      // An old tab must not sign out the account another tab just opened.
      if (request.headers.has("x-certrace-account"))
        await Auth.currentAccount(request);
      const result = await Auth.logout(
        body?.refreshToken ?? Auth.cookieToken(request),
      );
      cookie[SESSION_COOKIE]!.set({ ...cookieOptions, value: "", maxAge: 0 });
      return result;
    },
    { body: AuthModel.refresh },
  )
  .post(
    "/forgot-password",
    ({ body }) => Auth.forgotPassword(body.email, body.locale),
    { body: AuthModel.forgot },
  )
  .post(
    "/reset-password",
    ({ body }) =>
      Auth.resetPassword(body.email, body.reset_token, body.new_password),
    { body: AuthModel.reset },
  )
  .use(authenticated)
  .get("/me", async ({ account }) => ({ user: await Auth.publicUser(account) }))
  .get("/onboarding/records", async ({ account }) => ({
    records: (await listReports(account.id)).filter(
      (record) => record.key === "certrace:profile",
    ),
  }))
  .post(
    "/onboarding/records",
    async ({ account, body }) => {
      if (
        body.records.length !== 1 ||
        body.records[0]?.key !== "certrace:profile"
      )
        fail(
          403,
          "ACCOUNT_NOT_READY",
          "Only onboarding answers can be saved here.",
        );
      const result = await saveReportBatch(account.id, body.records);
      return {
        records: result.records.filter(
          (record) => record.key === "certrace:profile",
        ),
      };
    },
    { body: reportBatch },
  )
  .post(
    "/legal/accept",
    async ({ account, body, request, server }) => {
      await db.$transaction((tx) =>
        recordLegalAcceptance(
          tx,
          account.id,
          body,
          acceptanceContext(
            request,
            server?.requestIP(request)?.address,
            config.trustedProxyHops,
          ),
          "renewal",
        ),
      );
      return { user: await Auth.publicUser(account) };
    },
    { body: AuthModel.legal },
  )
  .post("/onboarded", async ({ account }) => {
    const vars = { company: account.company_name ?? "" };
    // The customer's mail goes first: if delivery fails, onboarding is not marked
    // done, so the step can be retried. The once guard means a retry sends nothing.
    // Legacy accounts already onboarded get no new mail.
    // Accepted trade-off: if the customer mail sends and the users update below
    // then fails, the admins are not re-notified, because the retry's once guard
    // returns false. The customer mail is not lost.
    // Accepted trade-off: with concurrent onboarding requests, the winner of the
    // once insert owns the admin fan-out. If that request then fails before the
    // fan-out, the admins get no mail for this signup.
    const first =
      !account.onboarded &&
      (await notify(account, "application_received", vars, true));
    const user = await db.users.update({
      where: { id: account.id },
      data: { onboarded: true },
    });
    if (first) {
      const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
      const admins = await db.users.findMany({
        where: { is_admin: true, status: "ACTIVE" },
      });
      for (const admin of admins)
        await notify(admin, "admin_new_signup", {
          ...vars,
          name,
          email: user.email,
        }).catch((e: unknown) =>
          // Log only the error code: the message can carry the recipient address.
          console.error(
            "admin signup email failed",
            (e as { code?: string } | undefined)?.code,
          ),
        );
    }
    return { user: await Auth.publicUser(user) };
  })
  .post(
    "/google/link",
    async ({ account, body }) => ({
      user: await Auth.publicUser(
        await Auth.google(body.idToken, body.nonce, account),
      ),
    }),
    { body: AuthModel.google },
  )
  .post(
    "/change-password",
    async ({ account, body, cookie }) => {
      const result = await Auth.changePassword(
        account,
        body.current_password,
        body.new_password,
      );
      cookie[SESSION_COOKIE]!.set({
        ...cookieOptions,
        value: result.refreshToken,
      });
      return result;
    },
    { body: AuthModel.change },
  );
