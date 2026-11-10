import { randomInt } from "node:crypto";
import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import { db } from "../../lib/db";
import { config, SESSION_COOKIE, SESSION_SECONDS } from "../../lib/config";
import { fail } from "../../lib/errors";
import { hash, token, verifyPassword, rateLimit } from "../../lib/security";
import { sendEmail } from "../../lib/email";
import { syncRegistrationSheet } from "../../lib/registration-sheet";
import type { users } from "../../generated/prisma/client";
import type { RegisterInput } from "./model";
import {
  needsLegalConsent,
  recordLegalAcceptance,
  type LegalConsentInput,
  type AcceptanceContext,
} from "./legal";
export const publicUser = async (u: users) => ({
  legalConsentRequired: await needsLegalConsent(u.id),
  id: u.id,
  email: u.email,
  onboarded: u.onboarded,
  ready: u.ready,
  firstName: u.first_name ?? undefined,
  lastName: u.last_name ?? undefined,
  companyName: u.company_name ?? undefined,
  planId: u.plan_id,
  trialStartedAt: u.trial_started_at.toISOString(),
  approvedAt: u.approved_at?.toISOString() ?? null,
  locale: u.locale === "th" ? ("th" as const) : ("en" as const),
  googleLinked: Boolean(u.google_sub),
});
const normalize = (email: string) => email.trim().toLowerCase();
const unauthorized = () =>
  fail(401, "INVALID_CREDENTIALS", "The email or password is incorrect.");
export function active(u: users | null): users {
  if (!u || u.status === "ANONYMISED") return unauthorized();
  if (u.status === "SUSPENDED")
    fail(
      403,
      "ACCOUNT_SUSPENDED",
      "This account has been suspended. Please contact support.",
    );
  return u;
}
export const byEmail = (email: string) =>
  db.users.findFirst({
    where: { email: { equals: normalize(email), mode: "insensitive" } },
  });
export const cookieToken = (request: Request) =>
  request.headers
    .get("cookie")
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
function checkedAccount(request: Request, user: users | null): users {
  const account = active(user);
  const expected = request.headers.get("x-certrace-account");
  if (expected && expected !== account.id)
    fail(
      409,
      "ACCOUNT_CHANGED",
      "The signed-in account changed in another tab. Save a copy of any unsaved changes, then reload or sign back into the original account.",
    );
  return account;
}
export async function currentAccount(request: Request) {
  const credential = cookieToken(request);
  if (credential) {
    const session = await db.refresh_tokens.findUnique({
      where: { token_hash: hash(credential) },
      include: { users: true },
    });
    if (session && !session.used && session.expires_at > new Date())
      return checkedAccount(request, session.users);
  }
  const bearer = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (bearer && config.jwtSecret) {
    try {
      const { payload } = await jwtVerify(
        bearer,
        new TextEncoder().encode(config.jwtSecret),
        { algorithms: ["HS256"] },
      );
      if (typeof payload.sub === "string" && typeof payload.jti === "string") {
        const session = await db.refresh_tokens.findUnique({
          where: { id: payload.jti },
          include: { users: true },
        });
        if (
          session &&
          session.user_id === payload.sub &&
          !session.used &&
          session.expires_at > new Date()
        )
          return checkedAccount(request, session.users);
      }
    } catch (e) {
      if (
        e instanceof Error &&
        "status" in e &&
        (e.status === 403 || e.status === 409)
      )
        throw e;
    }
  }
  return fail(401, "UNAUTHORIZED", "Please sign in.");
}
export async function session(user: users) {
  active(user);
  const refreshToken = token();
  const refreshSession = await db.refresh_tokens.create({
    data: {
      user_id: user.id,
      token_hash: hash(refreshToken),
      expires_at: new Date(Date.now() + SESSION_SECONDS * 1000),
    },
  });
  const accessToken = config.jwtSecret
    ? await new SignJWT({ email: user.email })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(user.id)
        .setJti(refreshSession.id)
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(new TextEncoder().encode(config.jwtSecret))
    : "";
  return { user: await publicUser(user), accessToken, refreshToken };
}
export async function register(
  input: RegisterInput,
  context: AcceptanceContext = { ipAddress: null, userAgent: null },
) {
  if (!input.termsAccepted || !input.privacyAccepted)
    fail(
      400,
      "LEGAL_CONSENT_REQUIRED",
      "Accept both legal documents to create an account.",
    );
  await rateLimit(`register:${normalize(input.email)}`, 5, 3600);
  if (await byEmail(input.email))
    fail(409, "EMAIL_TAKEN", "An account with this email already exists.");
  try {
    const user = await db.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          email: normalize(input.email),
          password_hash: await Bun.password.hash(input.password),
          first_name: input.firstName,
          last_name: input.lastName,
          company_name: input.companyName,
          locale: input.locale ?? "en",
        },
      });
      await recordLegalAcceptance(tx, user.id, input, context, "registration");
      await tx.account_audit_events.create({
        data: {
          user_id: user.id,
          event: "REGISTRATION_CONSENT",
          actor: "USER",
          details: {
            termsAccepted: true,
            privacyAccepted: true,
            marketingOptIn: input.marketingOptIn,
            termsUrl: "/legal/terms",
            privacyUrl: "/legal/privacy",
            termsVersionId: input.termsVersionId,
            privacyVersionId: input.privacyVersionId,
          },
        },
      });
      return user;
    });
    void syncRegistrationSheet(user);
    return user;
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002")
      fail(409, "EMAIL_TAKEN", "An account with this email already exists.");
    throw e;
  }
}
const dummyHash = await Bun.password.hash(token());
export async function login(email: string, password: string) {
  await rateLimit(`login:${normalize(email)}`, 10);
  const user = await byEmail(email);
  const valid = await verifyPassword(
    password,
    user?.password_hash ?? dummyHash,
  );
  if (!valid || !user) return unauthorized();
  return active(user);
}
export async function refresh(credential: string | undefined) {
  if (!credential) return unauthorized();
  const old = await db.refresh_tokens.findUnique({
    where: { token_hash: hash(credential) },
    include: { users: true },
  });
  if (!old || old.used || old.expires_at <= new Date()) return unauthorized();
  active(old.users);
  const used = await db.refresh_tokens.updateMany({
    where: { id: old.id, used: false, expires_at: { gt: new Date() } },
    data: { used: true },
  });
  if (!used.count) return unauthorized();
  return session(old.users);
}
export async function logout(credential: string | undefined) {
  if (credential)
    await db.refresh_tokens.updateMany({
      where: { token_hash: hash(credential) },
      data: { used: true },
    });
  return { success: true, message: "Signed out." };
}
export async function changePassword(
  user: users,
  current: string,
  password: string,
) {
  await rateLimit(`password:${user.id}`, 5);
  if (!(await verifyPassword(current, user.password_hash)))
    return fail(400, "INVALID_CREDENTIALS", "Current password is incorrect.");
  await db.$transaction([
    db.users.update({
      where: { id: user.id },
      data: {
        password_hash: await Bun.password.hash(password),
        updated_at: new Date(),
      },
    }),
    db.refresh_tokens.updateMany({
      where: { user_id: user.id },
      data: { used: true },
    }),
  ]);
  await sendEmail(
    user.email,
    "Certrace password changed",
    "Your password was changed. Contact support if you did not make this change.",
  );
  return {
    ...(await session(user)),
    success: true,
    message: "Password changed.",
  };
}
export async function forgotPassword(email: string, locale?: string) {
  await rateLimit(`forgot:${normalize(email)}`, 3, 900);
  const user = await byEmail(email);
  if (user && user.status === "ACTIVE") {
    const code = String(randomInt(100000, 1000000));
    await db.$transaction([
      db.password_resets.updateMany({
        where: { email: normalize(email), used: false },
        data: { used: true },
      }),
      db.password_resets.create({
        data: {
          email: normalize(email),
          token: hash(code),
          expires_at: new Date(Date.now() + 900000),
        },
      }),
    ]);
    await sendEmail(
      user.email,
      locale?.startsWith("th")
        ? "รหัสรีเซ็ตรหัสผ่าน Certrace"
        : "Reset your Certrace password",
      `Your verification code is ${code}. It expires in 15 minutes.`,
    );
  }
  return {
    success: true,
    message: "If an account exists, a verification code has been sent.",
  };
}
export async function resetPassword(
  email: string,
  code: string,
  password: string,
) {
  await rateLimit(`reset:${normalize(email)}`, 10, 900);
  const digest = await Bun.password.hash(password);
  const ok = await db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      { id: string; token: string; attempts: number }[]
    >`SELECT id,token,attempts FROM password_resets WHERE email=${normalize(email)} AND used=false AND expires_at>now() ORDER BY created_at DESC LIMIT 1 FOR UPDATE`;
    const row = rows[0];
    if (!row) return false;
    if (row.attempts >= 5 || row.token !== hash(code)) {
      await tx.password_resets.update({
        where: { id: row.id },
        data: { attempts: { increment: 1 }, used: row.attempts >= 4 },
      });
      return false;
    }
    const user = await tx.users.findFirst({
      where: {
        email: { equals: normalize(email), mode: "insensitive" },
        status: "ACTIVE",
      },
    });
    if (!user) return false;
    await tx.password_resets.update({
      where: { id: row.id },
      data: { used: true },
    });
    await tx.users.update({
      where: { id: user.id },
      data: { password_hash: digest, updated_at: new Date() },
    });
    await tx.refresh_tokens.updateMany({
      where: { user_id: user.id },
      data: { used: true },
    });
    return true;
  });
  if (!ok)
    fail(
      400,
      "INVALID_RESET_TOKEN",
      "That verification code is invalid or expired.",
    );
  return { success: true, message: "Password reset. Please sign in." };
}
const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);
export async function google(
  idToken: string,
  nonce: string,
  existing?: users,
  consent?: LegalConsentInput & { marketingOptIn?: boolean },
  context: AcceptanceContext = { ipAddress: null, userAgent: null },
) {
  if (!config.googleClientId)
    fail(503, "GOOGLE_UNAVAILABLE", "Google sign in is not configured.");
  let identity;
  try {
    identity = (
      await jwtVerify(idToken, googleKeys, {
        audience: config.googleClientId,
        issuer: ["https://accounts.google.com", "accounts.google.com"],
        algorithms: ["RS256"],
      })
    ).payload;
  } catch {
    return fail(
      401,
      "INVALID_GOOGLE_TOKEN",
      "Google identity could not be verified.",
    );
  }
  if (
    identity.nonce !== nonce ||
    identity.email_verified !== true ||
    typeof identity.email !== "string" ||
    !identity.sub
  )
    fail(401, "INVALID_GOOGLE_TOKEN", "Google identity could not be verified.");
  return accountForVerifiedGoogleIdentity(
    {
      sub: identity.sub,
      email: identity.email,
      given_name: identity.given_name,
      family_name: identity.family_name,
    },
    existing,
    consent,
    context,
  );
}
/** The signed Google subject identifies the account; email only checks an explicit link. */
export async function accountForVerifiedGoogleIdentity(
  identity: {
    sub: string;
    email: string;
    given_name?: unknown;
    family_name?: unknown;
  },
  existing?: users,
  consent?: LegalConsentInput & { marketingOptIn?: boolean },
  context: AcceptanceContext = { ipAddress: null, userAgent: null },
) {
  const linked = await db.users.findUnique({
    where: { google_sub: identity.sub },
  });
  if (linked) {
    if (existing && existing.id !== linked.id)
      fail(
        409,
        "GOOGLE_ACCOUNT_CONFLICT",
        "This Google account is already connected.",
      );
    return active(linked);
  }
  if (existing) {
    if (
      existing.google_sub ||
      normalize(existing.email) !== normalize(identity.email)
    )
      fail(
        409,
        "GOOGLE_ACCOUNT_CONFLICT",
        "Use the Google account with your Certrace email.",
      );
    return db.users.update({
      where: { id: existing.id },
      data: { google_sub: identity.sub },
    });
  }
  if (await byEmail(identity.email))
    fail(
      409,
      "GOOGLE_LINK_REQUIRED",
      "Sign in with your Certrace password, then connect Google in Settings.",
    );
  if (!consent?.termsAccepted || !consent.privacyAccepted)
    fail(
      400,
      "LEGAL_CONSENT_REQUIRED",
      "Review both legal documents before creating an account.",
    );
  const googleEmail = identity.email;
  const user = await db.$transaction(async (tx) => {
    const user = await tx.users.create({
      data: {
        email: normalize(googleEmail),
        google_sub: identity.sub,
        password_hash: await Bun.password.hash(token()),
        first_name:
          typeof identity.given_name === "string"
            ? identity.given_name
            : undefined,
        last_name:
          typeof identity.family_name === "string"
            ? identity.family_name
            : undefined,
      },
    });
    await recordLegalAcceptance(
      tx,
      user.id,
      consent,
      context,
      "google_registration",
    );
    await tx.account_audit_events.create({
      data: {
        user_id: user.id,
        event: "REGISTRATION_CONSENT",
        actor: "USER",
        details: {
          termsAccepted: true,
          privacyAccepted: true,
          marketingOptIn: consent.marketingOptIn === true,
          termsUrl: "/legal/terms",
          privacyUrl: "/legal/privacy",
          termsVersionId: consent.termsVersionId,
          privacyVersionId: consent.privacyVersionId,
        },
      },
    });
    return user;
  });
  void syncRegistrationSheet(user);
  return user;
}
