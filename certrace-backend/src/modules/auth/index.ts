import { Elysia } from "elysia";
import { AuthModel } from "./model";
import * as Auth from "./service";
import { authenticated } from "./plugin";
import { config, SESSION_COOKIE, SESSION_SECONDS } from "../../lib/config";
import { db } from "../../lib/db";
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
    return {
      user: await Auth.publicUser(
        await db.users.update({
          where: { id: account.id },
          data: { onboarded: true },
        }),
      ),
    };
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
