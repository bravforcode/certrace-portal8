import { selectCompany, restoreCompanyPreference } from "../company-session";
import type { AuthModel } from "@certrace/backend/src/modules/auth/model";
import { api, result } from "./client";
import {
  clearSession,
  loadSession,
  saveSession,
  type Session,
} from "./session";
export type AuthUser = typeof AuthModel.user.static;
export type RegisterInput = typeof AuthModel.register.static;
export type LoginInput = typeof AuthModel.login.static;
export type EmailLocale = "en" | "th";
export async function signedIn(response: { user: AuthUser }): Promise<Session> {
  restoreCompanyPreference(response.user.id);
  const session = { accessToken: "cookie", user: response.user };
  const { hydrateAccount } = await import("../account-storage");
  if (!response.user.legalConsentRequired) {
    try {
      await hydrateAccount(response.user.id, !response.user.ready);
    } catch (error) {
      // A policy may be published between sign-in and account hydration.
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "LEGAL_CONSENT_REQUIRED"
      )
        session.user = { ...session.user, legalConsentRequired: true };
      else if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "COMPANY_ACCESS" &&
        !loadSession()
      ) {
        // A fresh tab may remember a seat the owner has since revoked.
        selectCompany(response.user.id, response.user.id);
        await hydrateAccount(response.user.id, !response.user.ready);
      } else throw error;
    }
  }
  saveSession(session);
  return session;
}
export async function register(input: RegisterInput) {
  return signedIn(await result(api().api.auth.register.post(input)));
}
export async function login(input: LoginInput) {
  return signedIn(await result(api().api.auth.login.post(input)));
}
export async function me() {
  return (await result(api().api.auth.me.get())).user;
}
export async function restoreSession() {
  // Bootstrap discovers the cookie identity; all subsequent data reads bind to it.
  return signedIn(await result(api(true, null).api.auth.me.get()));
}
export async function markOnboarded() {
  const { user } = await result(api().api.auth.onboarded.post());
  const current = loadSession();
  if (current) saveSession({ ...current, user });
}
export function logout(): void {
  void (async () => {
    const { flushAccount, resetAccount } = await import("../account-storage");
    await flushAccount();
    await result(api().api.auth.logout.post({}));
    resetAccount();
    clearSession();
  })().catch((error) => {
    window.dispatchEvent(
      new CustomEvent("certrace:save-error", {
        detail:
          error instanceof Error
            ? error.message
            : "Sign out failed. Please retry.",
      }),
    );
  });
}
export type PasswordResetRequestInput = { email: string; locale?: EmailLocale };
export async function requestPasswordReset(input: PasswordResetRequestInput) {
  return (await result(api(false).api.auth["forgot-password"].post(input)))
    .message;
}
export type PasswordResetInput = {
  email: string;
  code: string;
  newPassword: string;
  locale?: EmailLocale;
};
export async function resetPassword(input: PasswordResetInput) {
  return (
    await result(
      api(false).api.auth["reset-password"].post({
        email: input.email,
        reset_token: input.code,
        new_password: input.newPassword,
        locale: input.locale,
      }),
    )
  ).message;
}
export type ChangePasswordInput = {
  email: string;
  currentPassword: string;
  newPassword: string;
  locale?: EmailLocale;
};
export async function changePassword(input: ChangePasswordInput) {
  const response = await result(
    api().api.auth["change-password"].post({
      email: input.email,
      current_password: input.currentPassword,
      new_password: input.newPassword,
      locale: input.locale,
    }),
  );
  saveSession({ accessToken: "cookie", user: response.user });
  return response.message;
}
