import { t } from "elysia";
const email = t.String({ format: "email", maxLength: 320 });
const password = t.String({ minLength: 8, maxLength: 1024 });
const locale = t.Optional(t.String({ maxLength: 16 }));
export const AuthModel = {
  register: t.Object({
    email,
    password,
    termsAccepted: t.Boolean(),
    privacyAccepted: t.Boolean(),
    marketingOptIn: t.Boolean(),
    termsVersionId: t.String({ format: "uuid" }),
    privacyVersionId: t.String({ format: "uuid" }),
    firstName: t.Optional(t.String({ maxLength: 200 })),
    lastName: t.Optional(t.String({ maxLength: 200 })),
    companyName: t.Optional(t.String({ maxLength: 200 })),
  }),
  legal: t.Object({
    termsAccepted: t.Boolean(),
    privacyAccepted: t.Boolean(),
    termsVersionId: t.String({ format: "uuid" }),
    privacyVersionId: t.String({ format: "uuid" }),
  }),
  login: t.Object({
    email,
    password: t.String({ minLength: 1, maxLength: 1024 }),
  }),
  google: t.Object({
    idToken: t.String({ minLength: 20, maxLength: 8192 }),
    nonce: t.String({ minLength: 16, maxLength: 256 }),
    termsAccepted: t.Optional(t.Boolean()),
    privacyAccepted: t.Optional(t.Boolean()),
    marketingOptIn: t.Optional(t.Boolean()),
    termsVersionId: t.Optional(t.String({ format: "uuid" })),
    privacyVersionId: t.Optional(t.String({ format: "uuid" })),
  }),
  refresh: t.Optional(
    t.Object({ refreshToken: t.Optional(t.String({ minLength: 16 })) }),
  ),
  forgot: t.Object({ email, locale }),
  reset: t.Object({
    email,
    reset_token: t.String({ minLength: 4, maxLength: 128 }),
    new_password: password,
    locale,
  }),
  change: t.Object({
    email: t.Optional(email),
    current_password: t.String({ minLength: 1, maxLength: 1024 }),
    new_password: password,
    locale,
  }),
  user: t.Object({
    id: t.String(),
    email,
    onboarded: t.Boolean(),
    ready: t.Boolean(),
    legalConsentRequired: t.Optional(t.Boolean()),
    firstName: t.Optional(t.String()),
    lastName: t.Optional(t.String()),
    companyName: t.Optional(t.String()),
    planId: t.Optional(t.String()),
    trialStartedAt: t.Optional(t.String()),
    googleLinked: t.Optional(t.Boolean()),
  }),
};
export type RegisterInput = typeof AuthModel.register.static;
