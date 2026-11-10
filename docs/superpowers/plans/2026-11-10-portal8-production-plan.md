# certrace-portal8 Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Subagents run on model `haiku` (user instruction, 2026-11-10).

**Goal:** Turn certrace-portal8 into the production replacement for portal.certrace.co: old-site sign-up/approval/30-day-trial flow with full email, recorded cookie consent, a shared server-side workspace workbook with tab status colours, an Installation tab and a flow diagram, team-vs-smart-link routing, installation-scoped Convert/Workspace with OEM fill-in, a two-way flow diagram, Excel/CSV import and a live panel in Workspace, and a factory profile, factory map, CBAM what-if and opportunities list on the dashboard. MEASUR (ORNL-AMO) informs the user flow only; none of its energy formulas are used.

**Architecture:** Keep the existing Bun + Elysia + Prisma + PostgreSQL backend and the Next.js portal behind the same-origin `/backend` proxy. New server state goes into three small tables (`email_deliveries`, `cookie_consents`, `workbooks`) and two columns on `users`; everything else reuses revision-checked account records, `companySession` tenancy and the existing files, links and team modules. Calculations (sheet status, flow diagram, import mapping, mass balance, emissions estimate, factory gaps, CBAM what-if, opportunities) are pure TypeScript functions with fixture tests; factory profiles reuse the shared account-record store.

**Tech Stack:** Bun 1.3.10, Elysia 1.4.30, Prisma 7.10 (`@prisma/adapter-pg`), PostgreSQL 18, Next.js 15, React 19, TanStack Query, Tailwind v4, Eden treaty client, `bun:test` (backend), `node --test` (portal unit), Playwright (e2e).

**Spec:** `docs/superpowers/specs/2026-11-10-portal8-production-design.md` (decisions D1–D21). Current-state map: `docs/PORTAL8-INVENTORY.md` (gaps G1–G15).

## Global Constraints

- Work inside `C:\Certrace\certrace-portal8`. Read `AGENTS.md` and `PROJECT.md` first. `refactor.md` is missing; the user authorised following AGENTS.md rules without it (see `docs/CERTRACE-NEW-PARITY-PLAN.md`).
- Package manager: `bun@1.3.10` only. No new runtime dependencies except `nodemailer` in `certrace-backend` (D20, SMTP delivery). No diagram/chart library.
- Commits: `feat:`, `add:`, `fix:`, `del:`, `docs:`, `chore:` prefix, one line, **no co-author line** (AGENTS.md rule 13 overrides the session default).
- Errors: `fail(status, code, message)` from `certrace-backend/src/lib/errors.ts`; body `{ detail: { code, message } }`.
- Migrations: new folder `certrace-backend/prisma/migrations/YYYYMMDDHHMM_snake_name/migration.sql`, raw SQL wrapped in `BEGIN;` … `COMMIT;`. Next free numbers start at `202611110001`. Update `prisma/schema.prisma` in the same task and run `bun run db:generate`.
- New audit event names must be added to the `account_audit_events_event_check` constraint (copy the full current list from `202611060001_team_invitations/migration.sql` and append).
- Company-scoped routes use `companySession` (`team/workspace.ts`); owner-only actions call `requireOwner(account.id, company.id)`.
- Backend tests: `bun:test`, `app.handle(new Request(...))` through a `call()` helper, accounts created through `/api/auth/register` with `legalVersionIds()` from `test/fixtures/legal.ts`, cleaned up in `afterAll`.
- Portal unit tests: `certrace-portal/lib/**/__tests__/*.test.ts`, `node:test` + `node:assert/strict`.
- Design tokens only from `certrace-portal/app/globals.css` and primitives from `certrace-portal/components/ui.tsx` (`Card`, `Button`, `Chip`, `StatusDot`, `Modal`, `Field`, `PageHeader`, `Progress`). Status colours: ok `#16a34a`, warn `#b45309`, err `#dc2626`, muted `#c7c5be`. Light mode only. Thai strings go in the existing `lib/i18n-th*.ts` files next to their English source.
- Tab status colours (D1): red = missing, amber = review, green = complete, grey = untouched.
- Trial length: 30 days from first admin approval (D2).
- Secrets never in code or compose defaults. Never log email bodies containing codes in `resend` or `smtp` mode.
- Verification before every commit: the task's tests, then `bun run typecheck` and `bun run lint` from the repo root.

## File Structure

### Backend (`certrace-backend/`)

| Path | Responsibility | Task |
| --- | --- | --- |
| `src/lib/config.ts` (modify) | add `assertProductionConfig()` | 1 |
| `src/index.ts` (modify) | call `assertProductionConfig()` at start | 1 |
| `compose.yaml` (repo root, modify) | required secrets, no fallbacks | 1 |
| `src/modules/auth/service.ts` (modify) | drop master password; locale at register; reset email | 2, 3, 7 |
| `prisma/migrations/202611110001_account_lifecycle/migration.sql` | `users.approved_at`, `users.locale`, `email_deliveries`, audit events | 3 |
| `src/lib/email-templates.ts` | bilingual subject/text/action per email kind | 3 |
| `src/lib/notify.ts` | `notify(user, kind, vars, once?)` with `email_deliveries` idempotency | 3 |
| `src/modules/admin/index.ts` (modify) | approve sets trial; reject; extend trial | 3, 4 |
| `scripts/grant-admin.ts` | grant `is_admin` from the server shell | 4 |
| `src/modules/auth/trial.ts` | `TRIAL_DAYS`, `trialEndsAt`, `trialEnded` | 5 |
| `src/modules/team/workspace.ts` (modify) | block writes after trial | 5 |
| `src/modules/reminders/trial-emails.ts` | daily trial reminder job | 6 |
| `src/modules/reminders/index.ts` (modify) | `/api/internal/jobs/trial-emails` | 6 |
| `prisma/migrations/202611110002_cookie_consents/migration.sql` | consent table | 8 |
| `src/modules/consent/index.ts` | `POST /api/v1/consent/cookies` | 8 |
| `scripts/notify-legal-update.ts` | email all active users about new legal versions | 9 |
| `src/modules/reporting/shape.ts`, `storage.ts` (modify) | `maxLength`, `pattern` on string shapes | 10 |
| `src/modules/master-data/profile-contract.ts` (modify) | limits + new onboarding fields | 10 |
| `prisma/migrations/202611110003_workbooks/migration.sql` | workbook table | 11 |
| `src/modules/workbooks/{index,service,model}.ts` | workbook read / cell patch / meta | 11 |
| `src/lib/email.ts` (modify), `package.json` | SMTP delivery via nodemailer | 1 |
| `src/modules/team/records.ts` (modify) | share `certrace:factory:` and `certrace:opportunities` records | 22 |
| `src/app.ts` (modify) | mount `consent`, `workbooks` | 8, 11 |

### Portal (`certrace-portal/`)

| Path | Responsibility | Task |
| --- | --- | --- |
| `lib/api/errors.ts`, `lib/api/client.ts` (modify) | `TRIAL_ENDED` handling | 5 |
| `app/admin/page.tsx`, `lib/api/admin.ts` (modify) | reject, extend trial buttons | 4 |
| `app/pending/page.tsx` (modify) | poll `/me`, redirect when ready | 7 |
| `components/cookie-banner.tsx`, `lib/api/consent.ts`, `lib/cookie-consent.ts` | banner + record | 8 |
| `app/layout.tsx` (modify) | mount banner | 8 |
| `app/(portal)/settings/page.tsx` (modify) | `CookieModal` posts consent | 8 |
| `lib/profile.tsx`, onboarding pages (modify) | new fields + client validation | 10 |
| `lib/workbook/status.ts` | `sheetStatus`, `REQUIRED`, `missingCells`, `statusTooltip`, `SHEET_ORDER` | 12 |
| `lib/workspace-sheets.ts` (modify) | drop sample rows, add Installation sheet id | 13, 14 |
| `lib/api/workbooks.ts`, `lib/workbook/use-workbook.ts` | server workbook hook with polling + cell queue | 13 |
| `lib/workspace-store.ts` (delete after migration) | replaced by `use-workbook.ts` | 13 |
| `components/workspace/spreadsheet.tsx` (modify) | tab dots, server cells, last-editor tooltip | 13 |
| `components/workspace/installation-sheet.tsx` | key/value Installation tab | 14 |
| `lib/workbook/flow.ts`, `components/workspace/flow-diagram.tsx` | flow model + SVG | 15 |
| `lib/workbook/flow-edit.ts`, `lib/workbook/sync-queue.ts` | diagram edits to cell patches, ordered save queue | 16 |
| `lib/workbook/xlsx.ts`, `lib/workbook/import.ts`, `components/workspace/import-wizard.tsx` | Excel/CSV import with header row and column mapping | 17 |
| `lib/workbook/balance.ts`, `lib/workbook/estimate.ts`, `components/workspace/live-panel.tsx` | completeness, mass balance, emissions estimate | 18 |
| `lib/scoped-installation.ts`, `components/scoped-installation-switcher.tsx` | `?installation=` scope | 19 |
| `components/portal-shell.tsx` (modify) | remove global switcher | 19 |
| `lib/installations.ts` (modify) | `oem` flag | 20 |
| `lib/convert/requirements.ts` | requirement state from workbook + installation | 20 |
| `lib/convert-mock.ts` → `lib/convert-standards.ts` (rename, strip sample state) | static standard catalogue | 20 |
| `app/(portal)/convert/**` (modify) | scoped switcher, live requirements, fill-in links | 20 |
| `app/(portal)/smart-links/page.tsx`, `components/add-member-modal.tsx` (modify) | company-or-outside question; real invite | 21 |
| `lib/factory/profile.ts`, `lib/factory/store.ts`, `components/factory/factory-profile.tsx` | factory profile per installation | 22 |
| `lib/factory/map.ts`, `components/factory/{installation-directory,factory-map}.tsx` | installation directory and factory map | 23 |
| `lib/factory/what-if.ts`, `components/factory/what-if.tsx` | CBAM cost what-if | 24 |
| `lib/factory/opportunities.ts`, `lib/factory/opportunity-store.ts`, `app/(portal)/opportunities/page.tsx` | opportunities list and report | 25 |
| `app/(portal)/dashboard/page.tsx` (modify) | directory, map, what-if and opportunity summary cards | 23–25 |
| `e2e/production-flows.spec.ts`, `e2e/fixtures/materials.csv` | end-to-end flows | 26 |

---

## Phase 0 — Environment

### Task 1: Local stack and fail-closed configuration

**Files:**
- Modify: `compose.yaml`
- Modify: `certrace-backend/src/lib/config.ts`
- Modify: `certrace-backend/src/index.ts`
- Create: `certrace-backend/test/config.test.ts`
- Create: `.env.example` (repo root) if absent; otherwise modify
- Modify: `certrace-backend/src/lib/email.ts` (SMTP mode)
- Modify: `certrace-backend/package.json`, `bun.lock` (add `nodemailer`, dev `@types/nodemailer`)
- Create: `certrace-backend/test/email-smtp.test.ts`

**Interfaces:**
- Produces: `assertProductionConfig(env = process.env): void` — throws `Error` listing every missing setting when `NODE_ENV === "production"`.
- Produces: `sendEmail(to, subject, text, idempotencyKey?, action?)` (existing signature) gains `CERTRACE_EMAIL_DELIVERY=smtp`, sending through nodemailer with `CERTRACE_SMTP_HOST`, `CERTRACE_SMTP_PORT`, `CERTRACE_SMTP_USER`, `CERTRACE_SMTP_PASSWORD` and `CERTRACE_EMAIL_SENDER` (D20). Idempotency stays in `email_deliveries` (Task 3); SMTP has no idempotency header.

- [ ] **Step 1: Install tooling and start the database**

Port 5432 belongs to an unrelated container (`sanso-dev-postgres-1`); certrace uses 55432.

```bash
powershell -c "irm bun.sh/install.ps1 | iex"
bun --version
bun install
docker compose up -d db
```

Expected: `bun --version` prints `1.3.10` (if it prints newer, run `bun upgrade --version 1.3.10`), compose shows `db` healthy on `55432`.

- [ ] **Step 2: Migrate and baseline the tests**

```bash
bun run db:migrate
bun run db:generate
CERTRACE_JWT_SECRET=local-development-change-before-deployment bun run test:backend
bun run --cwd certrace-portal test:unit
```

Expected: both suites PASS. Record failing test names in the task report before changing code; do not fix unrelated failures here.

- [ ] **Step 3: Write the failing test**

`certrace-backend/test/config.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { assertProductionConfig } from "../src/lib/config";

// Production must refuse to start with secrets or email missing, because a
// silent default (empty JWT secret, email "off") locks customers out of
// password reset and approval mail without any visible error.
describe("assertProductionConfig", () => {
  const complete = {
    NODE_ENV: "production",
    CERTRACE_JWT_SECRET: "x".repeat(48),
    DATABASE_URL: "postgresql://u:p@db:5432/certrace",
    CERTRACE_EMAIL_DELIVERY: "resend",
    RESEND_API_KEY: "re_test",
    CERTRACE_EMAIL_SENDER: "Certrace <no-reply@certrace.co>",
    CERTRACE_APP_BASE_URL: "https://portal.certrace.co",
  };
  test("accepts a complete production environment", () => {
    expect(() => assertProductionConfig(complete)).not.toThrow();
  });
  test("ignores non-production environments", () => {
    expect(() => assertProductionConfig({ NODE_ENV: "development" })).not.toThrow();
  });
  test("lists every missing or unsafe setting", () => {
    expect(() =>
      assertProductionConfig({
        ...complete,
        CERTRACE_JWT_SECRET: "short",
        CERTRACE_EMAIL_DELIVERY: "off",
        CERTRACE_MASTER_PASSWORD: "anything",
      }),
    ).toThrow(
      /CERTRACE_JWT_SECRET.*CERTRACE_EMAIL_DELIVERY.*CERTRACE_MASTER_PASSWORD/s,
    );
  });
  test("accepts a complete SMTP environment", () => {
    const { RESEND_API_KEY: _unused, ...rest } = complete;
    expect(() =>
      assertProductionConfig({
        ...rest,
        CERTRACE_EMAIL_DELIVERY: "smtp",
        CERTRACE_SMTP_HOST: "smtp.example.com",
        CERTRACE_SMTP_PORT: "587",
        CERTRACE_SMTP_USER: "mailer",
        CERTRACE_SMTP_PASSWORD: "secret",
      }),
    ).not.toThrow();
  });
  test("SMTP mode names each missing SMTP setting", () => {
    expect(() =>
      assertProductionConfig({ ...complete, CERTRACE_EMAIL_DELIVERY: "smtp" }),
    ).toThrow(/CERTRACE_SMTP_HOST.*CERTRACE_SMTP_PASSWORD/s);
  });
});
```

`certrace-backend/test/email-smtp.test.ts`:

```ts
import { afterAll, describe, expect, mock, test } from "bun:test";

const sent: Record<string, unknown>[] = [];
let transport: Record<string, unknown> | undefined;
let relayDown = false;
mock.module("nodemailer", () => ({
  default: {
    createTransport: (options: Record<string, unknown>) => {
      transport = options;
      return {
        sendMail: async (message: Record<string, unknown>) => {
          if (relayDown) throw new Error("connection refused");
          sent.push(message);
        },
      };
    },
  },
}));
const { sendEmail } = await import("../src/lib/email");

const saved = { ...process.env };
afterAll(() => {
  process.env = saved;
});

// Customers whose mail policy blocks third-party senders still need approval,
// trial and reset mail, so SMTP must deliver the same text and escaped HTML
// as Resend, and a relay failure must surface instead of passing silently.
describe("sendEmail in smtp mode", () => {
  Object.assign(process.env, {
    CERTRACE_EMAIL_DELIVERY: "smtp",
    CERTRACE_SMTP_HOST: "smtp.example.com",
    CERTRACE_SMTP_PORT: "465",
    CERTRACE_SMTP_USER: "mailer",
    CERTRACE_SMTP_PASSWORD: "secret",
    CERTRACE_EMAIL_SENDER: "Certrace <no-reply@certrace.co>",
  });
  test("sends through the configured relay with escaped HTML", async () => {
    await sendEmail("a@example.com", "Code", "<b>123456</b>", undefined, {
      label: "Open",
      url: "https://portal.certrace.co/?a=1&b=2",
    });
    expect(transport).toMatchObject({ host: "smtp.example.com", port: 465, secure: true });
    expect(sent[0]).toMatchObject({ to: "a@example.com", subject: "Code", text: "<b>123456</b>" });
    expect(String(sent[0].html)).toContain("&lt;b&gt;123456&lt;/b&gt;");
    expect(String(sent[0].html)).toContain("a=1&amp;b=2");
  });
  test("a relay error becomes EMAIL_UNAVAILABLE", async () => {
    relayDown = true;
    await expect(sendEmail("a@example.com", "Code", "x")).rejects.toMatchObject({
      code: "EMAIL_UNAVAILABLE",
    });
  });
});
```

Check `ApiError` in `src/lib/errors.ts` exposes `code`; if it nests it, match that shape (`fail(status, code, message)` throws `ApiError`).

- [ ] **Step 4: Run it to verify it fails**

Run: `cd certrace-backend && CERTRACE_JWT_SECRET=local-development-change-before-deployment bun test test/config.test.ts test/email-smtp.test.ts`
Expected: FAIL — `assertProductionConfig` is not exported, and `nodemailer` cannot be resolved.

- [ ] **Step 5: Implement**

Append to `certrace-backend/src/lib/config.ts`:

```ts
export function assertProductionConfig(
  env: Record<string, string | undefined> = process.env,
) {
  if (env.NODE_ENV !== "production") return;
  const problems: string[] = [];
  if ((env.CERTRACE_JWT_SECRET ?? "").length < 32)
    problems.push("CERTRACE_JWT_SECRET must be at least 32 characters");
  if (!env.DATABASE_URL) problems.push("DATABASE_URL is required");
  const mode = env.CERTRACE_EMAIL_DELIVERY;
  if (mode === "resend") {
    if (!env.RESEND_API_KEY || !env.CERTRACE_EMAIL_SENDER)
      problems.push("RESEND_API_KEY and CERTRACE_EMAIL_SENDER are required");
  } else if (mode === "smtp") {
    const missing = [
      "CERTRACE_SMTP_HOST",
      "CERTRACE_SMTP_PORT",
      "CERTRACE_SMTP_USER",
      "CERTRACE_SMTP_PASSWORD",
      "CERTRACE_EMAIL_SENDER",
    ].filter((k) => !env[k]);
    if (missing.length) problems.push(`${missing.join(", ")} required for smtp`);
  } else problems.push("CERTRACE_EMAIL_DELIVERY must be resend or smtp");
  if (!env.CERTRACE_APP_BASE_URL?.startsWith("https://"))
    problems.push("CERTRACE_APP_BASE_URL must be an https URL");
  if (env.CERTRACE_MASTER_PASSWORD)
    problems.push("CERTRACE_MASTER_PASSWORD is no longer supported; remove it");
  if (problems.length)
    throw new Error("Unsafe production configuration:\n- " + problems.join("\n- "));
}
```

In `certrace-backend/src/index.ts`, first statement after imports:

```ts
import { assertProductionConfig } from "./lib/config";
assertProductionConfig();
```

SMTP delivery. Install (the one runtime dependency this plan adds, D20):

```bash
cd certrace-backend
bun add nodemailer
bun add -d @types/nodemailer
```

In `certrace-backend/src/lib/email.ts`, build the HTML once and add the `smtp` branch before the Resend call. Keep the existing `escape` helper, the `console` and `off` modes and the Resend branch unchanged apart from using `html`:

```ts
import nodemailer from "nodemailer";

// inside sendEmail, after the "off" early return:
  const from = process.env.CERTRACE_EMAIL_SENDER;
  const html =
    `<p>${escape(text).replace(/\n/g, "<br>")}</p>` +
    (action ? `<p><a href="${escape(action.url)}">${escape(action.label)}</a></p>` : "");
  if (mode === "smtp") {
    const host = process.env.CERTRACE_SMTP_HOST;
    const port = Number(process.env.CERTRACE_SMTP_PORT ?? 587);
    if (!host || !from) fail(503, "EMAIL_UNAVAILABLE", "Email delivery is not configured.");
    try {
      await nodemailer
        .createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user: process.env.CERTRACE_SMTP_USER, pass: process.env.CERTRACE_SMTP_PASSWORD },
          connectionTimeout: 15000,
        })
        .sendMail({ from, to, subject, text, html });
    } catch {
      fail(503, "EMAIL_UNAVAILABLE", "The email could not be delivered. Please retry.");
    }
    return;
  }
  // Resend branch: `const key = process.env.RESEND_API_KEY`; body uses `html`.
```

Never log `text` or the caught error message in `smtp` mode (it may contain the recipient and codes).

In `compose.yaml`, replace every `${VAR:-fallback}` for `POSTGRES_PASSWORD`, `CERTRACE_JWT_SECRET` and the `DATABASE_URL` password with the required form `${VAR:?set VAR in .env}`, and set `CERTRACE_EMAIL_DELIVERY: ${CERTRACE_EMAIL_DELIVERY:-console}` for the local profile. Add the same names (no values) to `.env.example`:

```dotenv
POSTGRES_PASSWORD=
CERTRACE_JWT_SECRET=
CERTRACE_EMAIL_DELIVERY=console
RESEND_API_KEY=
CERTRACE_EMAIL_SENDER=
# CERTRACE_EMAIL_DELIVERY=smtp uses these instead of RESEND_API_KEY
CERTRACE_SMTP_HOST=
CERTRACE_SMTP_PORT=587
CERTRACE_SMTP_USER=
CERTRACE_SMTP_PASSWORD=
CERTRACE_APP_BASE_URL=http://localhost:3000
CERTRACE_JOBS_TOKEN=
```

- [ ] **Step 6: Run the test and the compose check**

Run: `bun test test/config.test.ts test/email-smtp.test.ts` (PASS) and `docker compose config >/dev/null` with a local `.env` containing the required values (exit 0); without `.env` it must fail naming the variable.

- [ ] **Step 7: Commit**

```bash
git add compose.yaml .env.example bun.lock certrace-backend/package.json certrace-backend/src/lib/config.ts certrace-backend/src/lib/email.ts certrace-backend/src/index.ts certrace-backend/test/config.test.ts certrace-backend/test/email-smtp.test.ts
git commit -m "fix: fail closed on unsafe production configuration, add smtp delivery"
```

---

## Phase 1 — Account lifecycle (old-site parity)

### Task 2: Remove the master password login

**Files:**
- Modify: `certrace-backend/src/modules/auth/service.ts:182-197`
- Modify: `certrace-backend/src/lib/config.ts` (delete `masterPassword`)
- Test: `certrace-backend/test/lifecycle.test.ts` (create; shared by Tasks 2–7)

**Interfaces:**
- Produces: `test/helpers.ts` with `call`, `account`, `cleanup` used by every new backend test file.

- [ ] **Step 1: Create the shared test helper**

`certrace-backend/test/helpers.ts` (same behaviour as the private helpers in `api.test.ts`, which stays untouched):

```ts
import { expect } from "bun:test";
import { app } from "../src/app";
import { db } from "../src/lib/db";
import { legalVersionIds } from "./fixtures/legal";

export const created: string[] = [];

export async function call(
  path: string,
  method = "GET",
  body?: unknown,
  cookie?: string,
  headers: Record<string, string> = {},
) {
  return app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...(cookie ? { cookie, origin: "http://localhost:3000" } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}

export async function account(ready = true, extra: Record<string, unknown> = {}) {
  const email = `test-${crypto.randomUUID()}@example.invalid`;
  const r = await call("/api/auth/register", "POST", {
    email,
    password: "test-password-123",
    ...(await legalVersionIds()),
    termsAccepted: true,
    privacyAccepted: true,
    marketingOptIn: false,
    ...extra,
  });
  expect(r.status).toBe(201);
  const body = await r.json();
  created.push(body.user.id);
  if (ready)
    await db.users.update({
      where: { id: body.user.id },
      data: { ready: true, approved_at: new Date() },
    });
  return {
    cookie: r.headers.get("set-cookie")!.split(";")[0]!,
    email,
    ...body,
  };
}

export async function admin() {
  const a = await account(true);
  await db.users.update({ where: { id: a.user.id }, data: { is_admin: true } });
  return a;
}

export async function cleanup() {
  await db.users.deleteMany({ where: { id: { in: created } } });
  await db.$disconnect();
}
```

Note: `approved_at` exists only after Task 3. Until then write `data: { ready: true }`; Task 3 Step 6 adds `approved_at`.

- [ ] **Step 2: Write the failing test**

`certrace-backend/test/lifecycle.test.ts`:

```ts
import { afterAll, describe, expect, test } from "bun:test";
import { account, call, cleanup } from "./helpers";

afterAll(cleanup);

describe("login", () => {
  // A universal password lets anyone who learns it sign in as any customer.
  test("CERTRACE_MASTER_PASSWORD no longer signs in to another account", async () => {
    const a = await account();
    process.env.CERTRACE_MASTER_PASSWORD = "universal-password-1";
    const r = await call("/api/auth/login", "POST", {
      email: a.email,
      password: "universal-password-1",
    });
    delete process.env.CERTRACE_MASTER_PASSWORD;
    expect(r.status).toBe(401);
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `cd certrace-backend && CERTRACE_MASTER_PASSWORD=universal-password-1 CERTRACE_JWT_SECRET=local-development-change-before-deployment bun test test/lifecycle.test.ts`
Expected: FAIL — status 200 (config reads the env at import, so the variable is set on the command line).

- [ ] **Step 4: Implement**

In `auth/service.ts` `login()`, delete the `masterPassword`/`masterValid` lines so the guard reads:

```ts
  if (!valid || !user) return unauthorized();
```

Delete `masterPassword` from `config.ts`. Run `grep -rn masterPassword certrace-backend/src` — expect no matches.

- [ ] **Step 5: Run tests**

Same command as Step 3: PASS. Then full `bun run test:backend`: PASS.

- [ ] **Step 6: Commit**

```bash
git add certrace-backend/src certrace-backend/test/helpers.ts certrace-backend/test/lifecycle.test.ts
git commit -m "del: remove master password login"
```

### Task 3: Approval flow, trial start at approval, transactional email

**Files:**
- Create: `certrace-backend/prisma/migrations/202611110001_account_lifecycle/migration.sql`
- Modify: `certrace-backend/prisma/schema.prisma` (`users`, new `email_deliveries`)
- Create: `certrace-backend/src/lib/email-templates.ts`
- Create: `certrace-backend/src/lib/notify.ts`
- Modify: `certrace-backend/src/modules/auth/index.ts` (`/onboarded`), `auth/service.ts` (`register` locale, `publicUser`), `auth/model.ts` (`register.locale`)
- Modify: `certrace-backend/src/modules/admin/index.ts` (`/users/:id/ready`)
- Test: `certrace-backend/test/lifecycle.test.ts`, `certrace-backend/test/email-templates.test.ts`

**Interfaces:**
- Produces:
  - `type EmailKind = "application_received" | "admin_new_signup" | "account_approved" | "account_rejected" | "trial_ending_7" | "trial_ending_1" | "trial_ended" | "password_changed" | "legal_updated"`
  - `renderEmail(kind: EmailKind, locale: "th" | "en", vars: Record<string, string>): { subject: string; text: string; action?: { label: string; url: string } }`
  - `notify(user: { id: string; email: string; locale: string }, kind: EmailKind, vars?: Record<string, string>, once?: boolean): Promise<boolean>` — returns `false` when `once` and already sent.
  - `publicUser` adds `approvedAt: string | null`, `locale: "th" | "en"`.

- [ ] **Step 1: Migration**

`202611110001_account_lifecycle/migration.sql` (replace `<CURRENT LIST>` with the exact quoted list from `202611060001_team_invitations/migration.sql`):

```sql
BEGIN;
ALTER TABLE users ADD COLUMN approved_at timestamptz;
ALTER TABLE users ADD COLUMN locale text NOT NULL DEFAULT 'en'
  CHECK (locale IN ('en','th'));
-- Accounts approved before this change keep their trial clock.
UPDATE users SET approved_at = updated_at WHERE ready AND approved_at IS NULL;

CREATE TABLE email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind)
);

ALTER TABLE account_audit_events DROP CONSTRAINT account_audit_events_event_check;
ALTER TABLE account_audit_events ADD CONSTRAINT account_audit_events_event_check
  CHECK (event IN (<CURRENT LIST>, 'ADMIN_REJECTED', 'ADMIN_TRIAL_EXTENDED'));
COMMIT;
```

Check `users` has `updated_at` in `schema.prisma`; if the column is named differently, use that name. Check `account_audit_events` constraint name with `\d account_audit_events` in psql before writing the DROP line.

`schema.prisma` — in `model users` add:

```prisma
  approved_at       DateTime?          @db.Timestamptz(6)
  locale            String             @default("en")
  email_deliveries  email_deliveries[]
```

and the model (in the same `@@schema` as `users`):

```prisma
model email_deliveries {
  id      String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id String   @db.Uuid
  kind    String
  sent_at DateTime @default(now()) @db.Timestamptz(6)
  users   users    @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([user_id, kind])
  @@schema("public")
}
```

Run `bun run db:migrate && bun run db:generate`.

- [ ] **Step 2: Write template tests (fail)**

`certrace-backend/test/email-templates.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { renderEmail, EMAIL_KINDS } from "../src/lib/email-templates";

// Every customer-facing email must exist in Thai and English and must carry
// the link the customer needs next; a missing locale silently sends English
// to a Thai factory that cannot act on it.
describe("renderEmail", () => {
  for (const kind of EMAIL_KINDS)
    for (const locale of ["th", "en"] as const)
      test(`${kind} ${locale} has subject and body`, () => {
        const m = renderEmail(kind, locale, {
          name: "Somchai",
          company: "ACME",
          days: "7",
          email: "a@b.co",
          reason: "duplicate",
        });
        expect(m.subject.length).toBeGreaterThan(5);
        expect(m.text.length).toBeGreaterThan(20);
        expect(m.text).not.toContain("{");
      });
  test("approval links to the portal sign-in", () => {
    expect(renderEmail("account_approved", "en", { name: "A" }).action?.url).toMatch(/\/login$/);
  });
});
```

Run: `bun test test/email-templates.test.ts` — FAIL (module missing).

- [ ] **Step 3: Implement templates**

`certrace-backend/src/lib/email-templates.ts`:

```ts
import { config } from "./config";

export const EMAIL_KINDS = [
  "application_received",
  "admin_new_signup",
  "account_approved",
  "account_rejected",
  "trial_ending_7",
  "trial_ending_1",
  "trial_ended",
  "password_changed",
  "legal_updated",
] as const;
export type EmailKind = (typeof EMAIL_KINDS)[number];
type Copy = { subject: string; text: string; label?: string; path?: string };

const T: Record<EmailKind, Record<"en" | "th", Copy>> = {
  application_received: {
    en: {
      subject: "We received your Certrace application",
      text: "Hi {name},\n\nThanks for registering {company}. Our team reviews every new account, usually within one business day. We will email you as soon as your account is approved, and your 30-day free trial starts then.",
    },
    th: {
      subject: "Certrace ได้รับใบสมัครของคุณแล้ว",
      text: "สวัสดีคุณ {name}\n\nขอบคุณที่ลงทะเบียน {company} ทีมงานจะตรวจสอบบัญชีใหม่ทุกบัญชี โดยปกติภายใน 1 วันทำการ เราจะส่งอีเมลแจ้งทันทีเมื่อบัญชีได้รับการอนุมัติ และช่วงทดลองใช้ฟรี 30 วันจะเริ่มนับจากวันนั้น",
    },
  },
  admin_new_signup: {
    en: {
      subject: "New Certrace sign-up waiting for approval",
      text: "{name} ({email}) from {company} finished onboarding and is waiting for approval.",
      label: "Open admin",
      path: "/admin",
    },
    th: {
      subject: "มีผู้สมัคร Certrace ใหม่รออนุมัติ",
      text: "{name} ({email}) จาก {company} กรอกข้อมูลครบแล้วและกำลังรออนุมัติ",
      label: "เปิดหน้าแอดมิน",
      path: "/admin",
    },
  },
  account_approved: {
    en: {
      subject: "Your Certrace account is approved",
      text: "Hi {name},\n\nYour account is approved. Your 30-day free trial starts today.",
      label: "Sign in",
      path: "/login",
    },
    th: {
      subject: "บัญชี Certrace ของคุณได้รับการอนุมัติแล้ว",
      text: "สวัสดีคุณ {name}\n\nบัญชีของคุณได้รับการอนุมัติแล้ว ช่วงทดลองใช้ฟรี 30 วันเริ่มวันนี้",
      label: "เข้าสู่ระบบ",
      path: "/login",
    },
  },
  account_rejected: {
    en: {
      subject: "About your Certrace application",
      text: "Hi {name},\n\nWe could not approve your account. Reason: {reason}\n\nReply to this email if you think this is a mistake.",
    },
    th: {
      subject: "เกี่ยวกับใบสมัคร Certrace ของคุณ",
      text: "สวัสดีคุณ {name}\n\nเราไม่สามารถอนุมัติบัญชีของคุณได้ เหตุผล: {reason}\n\nหากคิดว่าเกิดข้อผิดพลาด ตอบกลับอีเมลนี้ได้เลย",
    },
  },
  trial_ending_7: {
    en: {
      subject: "Your Certrace trial ends in {days} days",
      text: "Hi {name},\n\nYour free trial ends in {days} days. Choose a plan to keep editing your workspaces.",
      label: "Choose a plan",
      path: "/billing",
    },
    th: {
      subject: "ช่วงทดลองใช้ Certrace เหลืออีก {days} วัน",
      text: "สวัสดีคุณ {name}\n\nช่วงทดลองใช้ฟรีจะหมดในอีก {days} วัน เลือกแพ็กเกจเพื่อแก้ไขข้อมูลต่อได้",
      label: "เลือกแพ็กเกจ",
      path: "/billing",
    },
  },
  trial_ending_1: {
    en: {
      subject: "Your Certrace trial ends tomorrow",
      text: "Hi {name},\n\nYour free trial ends tomorrow. Your data stays safe; editing pauses until you choose a plan.",
      label: "Choose a plan",
      path: "/billing",
    },
    th: {
      subject: "ช่วงทดลองใช้ Certrace หมดพรุ่งนี้",
      text: "สวัสดีคุณ {name}\n\nช่วงทดลองใช้ฟรีหมดพรุ่งนี้ ข้อมูลของคุณยังอยู่ครบ แต่จะแก้ไขไม่ได้จนกว่าจะเลือกแพ็กเกจ",
      label: "เลือกแพ็กเกจ",
      path: "/billing",
    },
  },
  trial_ended: {
    en: {
      subject: "Your Certrace trial has ended",
      text: "Hi {name},\n\nYour free trial has ended. You can still sign in and read your data. Choose a plan to edit again.",
      label: "Choose a plan",
      path: "/billing",
    },
    th: {
      subject: "ช่วงทดลองใช้ Certrace สิ้นสุดแล้ว",
      text: "สวัสดีคุณ {name}\n\nช่วงทดลองใช้ฟรีสิ้นสุดแล้ว คุณยังเข้าสู่ระบบและดูข้อมูลได้ เลือกแพ็กเกจเพื่อแก้ไขต่อ",
      label: "เลือกแพ็กเกจ",
      path: "/billing",
    },
  },
  password_changed: {
    en: {
      subject: "Your Certrace password was changed",
      text: "Hi {name},\n\nThe password for {email} was just changed. If this was not you, reset it now and contact support.",
      label: "Reset password",
      path: "/forgot-password",
    },
    th: {
      subject: "รหัสผ่าน Certrace ของคุณถูกเปลี่ยน",
      text: "สวัสดีคุณ {name}\n\nรหัสผ่านของ {email} เพิ่งถูกเปลี่ยน หากไม่ใช่คุณ ให้รีเซ็ตรหัสผ่านทันทีและติดต่อฝ่ายสนับสนุน",
      label: "รีเซ็ตรหัสผ่าน",
      path: "/forgot-password",
    },
  },
  legal_updated: {
    en: {
      subject: "We updated the Certrace Terms and Privacy Policy",
      text: "Hi {name},\n\nWe updated our Terms of Service and Privacy Policy. You will be asked to accept them the next time you sign in.",
      label: "Read the Terms",
      path: "/legal/terms",
    },
    th: {
      subject: "Certrace ปรับปรุงข้อกำหนดและนโยบายความเป็นส่วนตัว",
      text: "สวัสดีคุณ {name}\n\nเราปรับปรุงข้อกำหนดการใช้บริการและนโยบายความเป็นส่วนตัว ระบบจะให้คุณยอมรับเมื่อเข้าสู่ระบบครั้งถัดไป",
      label: "อ่านข้อกำหนด",
      path: "/legal/terms",
    },
  },
};

const fill = (s: string, vars: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");

export function renderEmail(
  kind: EmailKind,
  locale: "th" | "en",
  vars: Record<string, string>,
) {
  const c = T[kind][locale];
  return {
    subject: fill(c.subject, vars),
    text: fill(c.text, vars),
    ...(c.label && c.path
      ? { action: { label: c.label, url: config.appUrl.replace(/\/$/, "") + c.path } }
      : {}),
  };
}
```

Run Step 2 test: PASS.

- [ ] **Step 4: Implement `notify`**

`certrace-backend/src/lib/notify.ts`:

```ts
import { db } from "./db";
import { sendEmail } from "./email";
import { Prisma } from "../generated/prisma/client";
import { renderEmail, type EmailKind } from "./email-templates";

type Recipient = { id: string; email: string; locale: string; first_name?: string | null };

/** Sends one templated email. With `once`, a (user, kind) pair is sent at most
    once: the delivery row is inserted first, so two job runs cannot both send. */
export async function notify(
  user: Recipient,
  kind: EmailKind,
  vars: Record<string, string> = {},
  once = false,
): Promise<boolean> {
  if (once) {
    try {
      await db.email_deliveries.create({ data: { user_id: user.id, kind } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
        return false;
      throw e;
    }
  }
  const m = renderEmail(kind, user.locale === "th" ? "th" : "en", {
    name: user.first_name ?? "",
    email: user.email,
    ...vars,
  });
  try {
    await sendEmail(user.email, m.subject, m.text, once ? `${kind}:${user.id}` : undefined, m.action);
  } catch (e) {
    if (once)
      await db.email_deliveries.deleteMany({ where: { user_id: user.id, kind } });
    throw e;
  }
  return true;
}
```

- [ ] **Step 5: Write lifecycle tests (fail)**

Append to `test/lifecycle.test.ts`:

```ts
import { db } from "../src/lib/db";
import { admin } from "./helpers";

describe("approval", () => {
  // The trial must not run while the customer waits for us.
  test("first approval starts the 30-day trial and records approved_at", async () => {
    const a = await account(false);
    await db.users.update({
      where: { id: a.user.id },
      data: { trial_started_at: new Date("2020-01-01") },
    });
    const boss = await admin();
    const r = await call(`/api/admin/users/${a.user.id}/ready`, "PUT", { ready: true }, boss.cookie);
    expect(r.status).toBe(200);
    const u = await db.users.findUniqueOrThrow({ where: { id: a.user.id } });
    expect(u.approved_at).not.toBeNull();
    expect(Date.now() - u.trial_started_at.getTime()).toBeLessThan(60_000);
  });

  test("re-approving after a revoke keeps the original trial start", async () => {
    const a = await account(false);
    const boss = await admin();
    await call(`/api/admin/users/${a.user.id}/ready`, "PUT", { ready: true }, boss.cookie);
    const first = await db.users.findUniqueOrThrow({ where: { id: a.user.id } });
    await call(`/api/admin/users/${a.user.id}/ready`, "PUT", { ready: false }, boss.cookie);
    await call(`/api/admin/users/${a.user.id}/ready`, "PUT", { ready: true }, boss.cookie);
    const again = await db.users.findUniqueOrThrow({ where: { id: a.user.id } });
    expect(again.trial_started_at.toISOString()).toBe(first.trial_started_at.toISOString());
  });

  test("register stores the locale for later emails", async () => {
    const a = await account(false, { locale: "th" });
    expect(a.user.locale).toBe("th");
  });
});
```

Run: `bun test test/lifecycle.test.ts` — FAIL.

- [ ] **Step 6: Implement**

1. `auth/model.ts` `register` body: add `locale: t.Optional(t.Union([t.Literal("en"), t.Literal("th")]))`.
2. `auth/service.ts` `register(...)`: pass `locale: input.locale ?? "en"` into `db.users.create` data. `publicUser`: add

```ts
  approvedAt: u.approved_at?.toISOString() ?? null,
  locale: u.locale === "th" ? "th" : "en",
```

3. `auth/index.ts` `/onboarded`:

```ts
  .post("/onboarded", async ({ account }) => {
    const user = await db.users.update({
      where: { id: account.id },
      data: { onboarded: true },
    });
    if (!account.onboarded) {
      const vars = { company: user.company_name ?? "" };
      await notify(user, "application_received", vars, true);
      const admins = await db.users.findMany({ where: { is_admin: true, status: "ACTIVE" } });
      const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
      for (const a of admins)
        await notify(a, "admin_new_signup", { ...vars, name, email: user.email });
    }
    return { user: await Auth.publicUser(user) };
  })
```

Import `notify` from `../../lib/notify`. With delivery `off` (tests) `sendEmail` returns immediately.

4. `admin/index.ts` `/users/:id/ready` transaction, replace the update with:

```ts
        const approving = body.ready && !previous.approved_at;
        const updated = await tx.users.update({
          where: { id: params.id },
          data: {
            ready: body.ready,
            updated_at: new Date(),
            ...(approving ? { approved_at: new Date(), trial_started_at: new Date() } : {}),
          },
        });
```

After the transaction (outside it, so a mail failure does not roll back approval):

```ts
      if (body.ready && user.approved_at && Date.now() - user.approved_at.getTime() < 60_000)
        await notify(user, "account_approved", {}, true).catch((e) => console.error(e));
```

Add `approved_at: true, locale: true` to `userSelect` is not needed for `notify` because the transaction returns the full row; keep `view()` unchanged except adding `approvedAt: user.approved_at?.toISOString() ?? null` (add `approved_at: true` to `userSelect`).

5. In `test/helpers.ts`, set `approved_at: new Date()` in `account(ready=true)` now that the column exists.

- [ ] **Step 7: Run tests**

`bun test test/lifecycle.test.ts test/email-templates.test.ts` PASS; `bun run test:backend` PASS; `bun run --cwd certrace-portal api:check` — if it reports the client contract changed, run `bun run --cwd certrace-portal api:generate` and include the generated file.

- [ ] **Step 8: Commit**

```bash
git add certrace-backend certrace-portal/lib/api
git commit -m "feat: start trial at approval and send lifecycle emails"
```

### Task 4: Admin reject, extend trial, first-admin script

**Files:**
- Modify: `certrace-backend/src/modules/admin/index.ts`
- Create: `certrace-backend/scripts/grant-admin.ts`
- Modify: `certrace-portal/lib/api/admin.ts`, `certrace-portal/app/admin/page.tsx`
- Test: `certrace-backend/test/lifecycle.test.ts`

**Interfaces:**
- Consumes: `notify` (Task 3), audit events `ADMIN_REJECTED`, `ADMIN_TRIAL_EXTENDED` (Task 3 migration).
- Produces: `POST /api/admin/users/:id/reject {reason: string(3..500)}`, `POST /api/admin/users/:id/extend-trial {days: 1..90}`; portal `rejectAdminUser(id, reason)`, `extendAdminTrial(id, days)`.

- [ ] **Step 1: Failing tests**

```ts
describe("admin actions", () => {
  test("reject suspends the account with the reason and emails the customer", async () => {
    const a = await account(false);
    const boss = await admin();
    const r = await call(`/api/admin/users/${a.user.id}/reject`, "POST", { reason: "Duplicate company" }, boss.cookie);
    expect(r.status).toBe(200);
    const u = await db.users.findUniqueOrThrow({ where: { id: a.user.id } });
    expect(u.status).toBe("SUSPENDED");
    expect(u.suspension_reason).toBe("Duplicate company");
    expect(u.ready).toBe(false);
  });
  test("extend-trial moves the trial start forward by the given days", async () => {
    const a = await account(true);
    const before = (await db.users.findUniqueOrThrow({ where: { id: a.user.id } })).trial_started_at;
    const boss = await admin();
    await call(`/api/admin/users/${a.user.id}/extend-trial`, "POST", { days: 14 }, boss.cookie);
    const after = (await db.users.findUniqueOrThrow({ where: { id: a.user.id } })).trial_started_at;
    expect(after.getTime() - before.getTime()).toBe(14 * 86_400_000);
  });
  test("non-admins cannot reject", async () => {
    const a = await account(false);
    const b = await account(true);
    const r = await call(`/api/admin/users/${a.user.id}/reject`, "POST", { reason: "nope" }, b.cookie);
    expect(r.status).toBe(403);
  });
});
```

Run: FAIL (404).

- [ ] **Step 2: Implement routes**

Append to the `admin` chain in `admin/index.ts`:

```ts
  .post(
    "/users/:id/reject",
    async ({ account, params, body }) => {
      requireAdmin(account);
      const user = await db.$transaction(async (tx) => {
        const u = await tx.users.update({
          where: { id: params.id },
          data: {
            ready: false,
            status: "SUSPENDED",
            suspended_at: new Date(),
            suspension_reason: body.reason,
            updated_at: new Date(),
          },
        }).catch(() => missing());
        await tx.account_audit_events.create({
          data: {
            user_id: params.id,
            event: "ADMIN_REJECTED",
            actor: "ADMIN",
            details: { adminUserId: account.id, reason: body.reason },
          },
        });
        return u;
      });
      await notify(user, "account_rejected", { reason: body.reason }).catch((e) => console.error(e));
      return { user: view(user) };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({ reason: t.String({ minLength: 3, maxLength: 500 }) }),
      detail: { hide: true },
    },
  )
  .post(
    "/users/:id/extend-trial",
    async ({ account, params, body }) => {
      requireAdmin(account);
      const user = await db.$transaction(async (tx) => {
        const prev = (await tx.users.findUnique({ where: { id: params.id } })) ?? missing();
        const u = await tx.users.update({
          where: { id: params.id },
          data: {
            trial_started_at: new Date(prev.trial_started_at.getTime() + body.days * 86_400_000),
            updated_at: new Date(),
          },
        });
        await tx.account_audit_events.create({
          data: {
            user_id: params.id,
            event: "ADMIN_TRIAL_EXTENDED",
            actor: "ADMIN",
            details: { adminUserId: account.id, days: body.days },
          },
        });
        return u;
      });
      return { user: view(user) };
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({ days: t.Integer({ minimum: 1, maximum: 90 }) }),
      detail: { hide: true },
    },
  );
```

Check the `actor` column's allowed values in `schema.prisma`/migrations; `"ADMIN"` is already used by `ADMIN_READY_CHANGED`. Check `missing()` returns `never` (it is used that way at line 84).

- [ ] **Step 3: grant-admin script**

`certrace-backend/scripts/grant-admin.ts`:

```ts
import { db } from "../src/lib/db";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: bun scripts/grant-admin.ts <email>");
  process.exit(1);
}
const updated = await db.users.updateMany({
  where: { email: { equals: email, mode: "insensitive" }, status: "ACTIVE" },
  data: { is_admin: true, ready: true },
});
console.log(updated.count ? `Granted admin to ${email}` : `No active user ${email}`);
await db.$disconnect();
process.exit(updated.count ? 0 : 1);
```

Manual check: `bun scripts/grant-admin.ts nobody@example.invalid` exits 1.

- [ ] **Step 4: Portal admin actions**

`lib/api/admin.ts` append:

```ts
export async function rejectAdminUser(id: string, reason: string) {
  return result(api().api.admin.users({ id }).reject.post({ reason }));
}
export async function extendAdminTrial(id: string, days: number) {
  return result(api().api.admin.users({ id })["extend-trial"].post({ days }));
}
```

In `app/admin/page.tsx`, each user row gets two `Button` (variant matching the existing ready toggle): "Reject" opens a `Modal` with a `Field` textarea (min 3 chars) and calls `rejectAdminUser`; "+14 days" calls `extendAdminTrial(id, 14)`. After either, invalidate the same TanStack query key the ready toggle invalidates. Show `approvedAt` (date) in the row next to `registeredAt`.

- [ ] **Step 5: Run tests**

`bun test test/lifecycle.test.ts` PASS; `bun run typecheck` PASS.

- [ ] **Step 6: Commit**

```bash
git add certrace-backend certrace-portal/lib/api/admin.ts certrace-portal/app/admin/page.tsx
git commit -m "feat: admin reject, trial extension and grant-admin script"
```

### Task 5: Enforce the trial on the server

**Files:**
- Create: `certrace-backend/src/modules/auth/trial.ts`
- Modify: `certrace-backend/src/modules/team/workspace.ts`
- Modify: `certrace-portal/lib/api/client.ts`, `certrace-portal/lib/api/session.ts` (add `markTrialEnded`), `certrace-portal/components/account-lock.tsx`
- Test: `certrace-backend/test/lifecycle.test.ts`, `certrace-backend/test/trial.test.ts`

**Interfaces:**
- Produces: `TRIAL_DAYS = 30`; `trialEndsAt(u: { trial_started_at: Date }): Date`; `trialEnded(u: { plan_id: string; trial_started_at: Date }, now?: Date): boolean`. Error `403 TRIAL_ENDED` on non-GET company routes.

- [ ] **Step 1: Unit test (fail)**

`test/trial.test.ts`:

```ts
import { expect, test } from "bun:test";
import { trialEnded, trialEndsAt } from "../src/modules/auth/trial";

const start = new Date("2026-11-01T00:00:00Z");
test("trial lasts exactly 30 days", () => {
  expect(trialEndsAt({ trial_started_at: start }).toISOString()).toBe("2026-12-01T00:00:00.000Z");
});
test("ended only on plan trial after the end instant", () => {
  const u = { plan_id: "trial", trial_started_at: start };
  expect(trialEnded(u, new Date("2026-11-30T23:59:59Z"))).toBe(false);
  expect(trialEnded(u, new Date("2026-12-01T00:00:00Z"))).toBe(true);
  expect(trialEnded({ ...u, plan_id: "standard" }, new Date("2030-01-01"))).toBe(false);
});
```

- [ ] **Step 2: Implement**

`auth/trial.ts`:

```ts
export const TRIAL_DAYS = 30;
export const trialEndsAt = (u: { trial_started_at: Date }) =>
  new Date(u.trial_started_at.getTime() + TRIAL_DAYS * 86_400_000);
export const trialEnded = (
  u: { plan_id: string; trial_started_at: Date },
  now = new Date(),
) => u.plan_id === "trial" && now >= trialEndsAt(u);
```

In `team/workspace.ts` `companySession`, compute the company first, then:

```ts
    const company = /* existing resolution: account or owner */;
    if (!["GET", "HEAD"].includes(request.method) && trialEnded(company))
      fail(403, "TRIAL_ENDED", "Your free trial has ended. Choose a plan to keep editing.");
    return { account, company };
```

Restructure the two `return` statements into one variable so both paths are checked. Editors of a paid company are not blocked by their own trial.

- [ ] **Step 3: Integration test (fail before Step 2, pass after)**

```ts
describe("trial enforcement", () => {
  // Reading stays open so a customer can always export what they entered.
  test("after 30 days writes return TRIAL_ENDED but reads work", async () => {
    const a = await account(true);
    await db.users.update({
      where: { id: a.user.id },
      data: { trial_started_at: new Date(Date.now() - 31 * 86_400_000) },
    });
    const put = await call(
      "/api/v1/account/records/certrace%3Anotification-prefs",
      "PUT",
      { value: { product: true }, revision: 0 },
      a.cookie,
      { "X-Certrace-Account": a.user.id },
    );
    expect(put.status).toBe(403);
    expect((await put.json()).detail.code).toBe("TRIAL_ENDED");
    const get = await call("/api/v1/account/records", "GET", undefined, a.cookie, {
      "X-Certrace-Account": a.user.id,
    });
    expect(get.status).toBe(200);
  });
});
```

Confirm the records module uses `companySession` (`grep -n companySession certrace-backend/src/modules/records/index.ts`). If it uses `authenticated` instead, add the same check there through a shared `assertTrialWritable(request, company)` helper exported from `trial.ts` rather than duplicating it.

- [ ] **Step 4: Portal handling**

In `lib/api/session.ts` add, following `markAccountNotReady`:

```ts
const TRIAL_EVENT = "certrace:trial-ended";
export function markTrialEnded() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(TRIAL_EVENT));
}
export const onTrialEnded = (fn: () => void) => {
  window.addEventListener(TRIAL_EVENT, fn);
  return () => window.removeEventListener(TRIAL_EVENT, fn);
};
```

In `lib/api/client.ts` `result()`: `if (scope?.auth && failure.code === "TRIAL_ENDED") markTrialEnded();`. In `components/account-lock.tsx`, subscribe with `onTrialEnded` and show the existing locked state (it already renders for client-side `trialEnded`). Add a unit test in `lib/__tests__/api-client.test.ts` asserting a `403 TRIAL_ENDED` response dispatches `certrace:trial-ended`, following the file's existing fetch-stub pattern.

- [ ] **Step 5: Run tests**

`bun test test/trial.test.ts test/lifecycle.test.ts`; `bun run --cwd certrace-portal test:unit`. All PASS.

- [ ] **Step 6: Commit**

```bash
git add certrace-backend certrace-portal/lib/api certrace-portal/components/account-lock.tsx
git commit -m "feat: enforce trial end on the server"
```

### Task 6: Trial reminder email job

**Files:**
- Create: `certrace-backend/src/modules/reminders/trial-emails.ts`
- Modify: `certrace-backend/src/modules/reminders/index.ts`
- Test: `certrace-backend/test/trial.test.ts`

**Interfaces:**
- Consumes: `notify(..., once=true)`, `trialEndsAt`.
- Produces: `runTrialEmails(now?: Date, dryRun?: boolean): Promise<{ sent: { userId: string; kind: string }[] }>`; route `POST /api/internal/jobs/trial-emails` (Bearer `CERTRACE_JOBS_TOKEN`).

- [ ] **Step 1: Failing test**

```ts
import { runTrialEmails } from "../src/modules/reminders/trial-emails";
import { account, cleanup } from "./helpers";
import { db } from "../src/lib/db";
import { afterAll, describe } from "bun:test";
afterAll(cleanup);

describe("trial emails", () => {
  // Each reminder goes out once, even when the daily job runs twice.
  test("sends 7-day reminder once and ended notice after the end", async () => {
    const a = await account(true);
    const now = new Date();
    await db.users.update({
      where: { id: a.user.id },
      data: { trial_started_at: new Date(now.getTime() - 23.5 * 86_400_000) },
    });
    const first = await runTrialEmails(now);
    expect(first.sent).toContainEqual({ userId: a.user.id, kind: "trial_ending_7" });
    const second = await runTrialEmails(now);
    expect(second.sent.find((s) => s.userId === a.user.id)).toBeUndefined();
    await db.users.update({
      where: { id: a.user.id },
      data: { trial_started_at: new Date(now.getTime() - 31 * 86_400_000) },
    });
    const ended = await runTrialEmails(now);
    expect(ended.sent).toContainEqual({ userId: a.user.id, kind: "trial_ended" });
  });
});
```

- [ ] **Step 2: Implement**

`reminders/trial-emails.ts`:

```ts
import { db } from "../../lib/db";
import { notify } from "../../lib/notify";
import { trialEndsAt } from "../auth/trial";

const DAY = 86_400_000;

export async function runTrialEmails(now = new Date(), dryRun = false) {
  const users = await db.users.findMany({
    where: { plan_id: "trial", ready: true, status: "ACTIVE", approved_at: { not: null } },
  });
  const sent: { userId: string; kind: string }[] = [];
  for (const u of users) {
    const left = (trialEndsAt(u).getTime() - now.getTime()) / DAY;
    const kind =
      left <= 0 ? "trial_ended" : left <= 1 ? "trial_ending_1" : left <= 7 ? "trial_ending_7" : null;
    if (!kind) continue;
    if (dryRun) {
      sent.push({ userId: u.id, kind });
      continue;
    }
    if (await notify(u, kind, { days: String(Math.max(1, Math.ceil(left))) }, true))
      sent.push({ userId: u.id, kind });
  }
  return { sent };
}
```

In `reminders/index.ts`, extract the Bearer check into `function requireJobsToken(authorization?: string)` and add a second route to `jobs`:

```ts
  .post(
    "/trial-emails",
    ({ headers, query }) => {
      requireJobsToken(headers.authorization);
      return runTrialEmails(new Date(), query.dry_run ?? false);
    },
    { query: t.Object({ dry_run: t.Optional(t.BooleanString()) }), detail: { hide: true } },
  )
```

- [ ] **Step 3: Schedule**

Add to `docs/` deployment notes (or the existing cron/systemd file used for `send-reminders` — find it with `grep -rn send-reminders --include=*.{yaml,yml,sh,md,timer} .`) a daily 02:00 UTC call:

```bash
curl -fsS -X POST -H "Authorization: Bearer $CERTRACE_JOBS_TOKEN" https://portal.certrace.co/backend/api/internal/jobs/trial-emails
```

- [ ] **Step 4: Run tests and commit**

`bun test test/trial.test.ts` PASS.

```bash
git add certrace-backend docs
git commit -m "feat: daily trial reminder emails"
```

### Task 7: Password-reset email, pending page polling

**Files:**
- Modify: `certrace-backend/src/modules/auth/service.ts` (`resetPassword`)
- Modify: `certrace-portal/app/pending/page.tsx`
- Test: `certrace-backend/test/lifecycle.test.ts`

**Interfaces:**
- Consumes: `notify(user, "password_changed")`.

- [ ] **Step 1: Failing test**

Use console delivery and capture `console.info`:

```ts
describe("password reset", () => {
  // A reset is a takeover signal; the owner must hear about it.
  test("successful reset sends password_changed", async () => {
    const a = await account(true);
    const prev = process.env.CERTRACE_EMAIL_DELIVERY;
    process.env.CERTRACE_EMAIL_DELIVERY = "console";
    const seen: { subject: string; text: string }[] = [];
    const orig = console.info;
    console.info = (m: { subject: string; text: string }) => void seen.push(m);
    await call("/api/auth/forgot-password", "POST", { email: a.email });
    const code = seen.at(-1)!.text.match(/\d{6}/)![0];
    const r = await call("/api/auth/reset-password", "POST", {
      email: a.email,
      reset_token: code,
      new_password: "another-password-456",
    });
    console.info = orig;
    process.env.CERTRACE_EMAIL_DELIVERY = prev;
    expect(r.status).toBe(200);
    expect(seen.some((m) => /password was changed/i.test(m.subject))).toBe(true);
  });
});
```

- [ ] **Step 2: Implement**

At the end of a successful `resetPassword(...)` (after the transaction that updates the hash), add:

```ts
  await notify(user, "password_changed").catch((e) => console.error(e));
```

using the user row the function already loads. Do not change the response shape.

- [ ] **Step 3: Pending page polling**

In `app/pending/page.tsx`, add a TanStack Query on the existing `/me` fetcher (`lib/api/auth.ts`, find the function the page or session uses for `/api/auth/me`) with `refetchInterval: 30_000` and `refetchIntervalInBackground: false`; when `data.user.ready` becomes true, `router.replace("/dashboard")`. Show the line "We'll email you at {email} when your account is approved." under the existing heading (Thai in the i18n file: "เราจะส่งอีเมลแจ้งไปที่ {email} เมื่อบัญชีได้รับการอนุมัติ").

- [ ] **Step 4: Run tests and commit**

`bun test test/lifecycle.test.ts` PASS; `bun run typecheck` PASS.

```bash
git add certrace-backend certrace-portal/app/pending
git commit -m "feat: password-changed email and pending page refresh"
```

### Task 8: Cookie consent recorded on the server

**Files:**
- Create: `certrace-backend/prisma/migrations/202611110002_cookie_consents/migration.sql`
- Modify: `certrace-backend/prisma/schema.prisma`
- Create: `certrace-backend/src/modules/consent/index.ts`
- Modify: `certrace-backend/src/app.ts`
- Create: `certrace-portal/lib/cookie-consent.ts`, `certrace-portal/lib/api/consent.ts`, `certrace-portal/components/cookie-banner.tsx`
- Modify: `certrace-portal/app/layout.tsx`, `certrace-portal/app/(portal)/settings/page.tsx` (`CookieModal` ≈ lines 1188–1250)
- Test: `certrace-backend/test/consent.test.ts`, `certrace-portal/lib/__tests__/cookie-consent.test.ts`

**Interfaces:**
- Produces: `POST /api/v1/consent/cookies` body `{ visitorId: uuid, analytics: boolean, marketing: boolean, policyVersion: string }` → `201 { id }`. Optional session cookie links `user_id`.
- Portal: `type CookieChoice = { analytics: boolean; marketing: boolean; decidedAt: string; policyVersion: string }`; `readChoice(): CookieChoice | null`; `saveChoice(c: Omit<CookieChoice, "decidedAt">): Promise<void>`; `COOKIE_POLICY_VERSION = "2026-11-10"`.

- [ ] **Step 1: Migration + schema**

```sql
BEGIN;
CREATE TABLE cookie_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  necessary boolean NOT NULL DEFAULT true,
  analytics boolean NOT NULL,
  marketing boolean NOT NULL,
  policy_version text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cookie_consents_visitor ON cookie_consents (visitor_id, created_at DESC);
COMMIT;
```

Prisma model `cookie_consents` with the same columns, `users? @relation(onDelete: SetNull)`, `@@index([visitor_id, created_at(sort: Desc)])`, `@@schema("public")`; add `cookie_consents cookie_consents[]` to `users`.

- [ ] **Step 2: Failing backend test**

`test/consent.test.ts`:

```ts
import { afterAll, expect, test } from "bun:test";
import { account, call, cleanup } from "./helpers";
import { db } from "../src/lib/db";
afterAll(cleanup);

// Consent is evidence under PDPA/GDPR: every choice is appended, never overwritten.
test("anonymous and signed-in choices are both recorded", async () => {
  const visitorId = crypto.randomUUID();
  const anon = await call("/api/v1/consent/cookies", "POST",
    { visitorId, analytics: false, marketing: false, policyVersion: "2026-11-10" },
    undefined, { origin: "http://localhost:3000" });
  expect(anon.status).toBe(201);
  const a = await account();
  const signed = await call("/api/v1/consent/cookies", "POST",
    { visitorId, analytics: true, marketing: false, policyVersion: "2026-11-10" }, a.cookie);
  expect(signed.status).toBe(201);
  const rows = await db.cookie_consents.findMany({ where: { visitor_id: visitorId }, orderBy: { created_at: "asc" } });
  expect(rows.map((r) => [r.analytics, r.user_id])).toEqual([[false, null], [true, a.user.id]]);
  await db.cookie_consents.deleteMany({ where: { visitor_id: visitorId } });
});
```

- [ ] **Step 3: Implement module**

`src/modules/consent/index.ts`:

```ts
import { Elysia, t } from "elysia";
import { db } from "../../lib/db";
import { rateLimit } from "../../lib/security";
import { currentAccount } from "../auth/service";

export const consent = new Elysia({ prefix: "/api/v1/consent" }).post(
  "/cookies",
  async ({ body, request, set }) => {
    await rateLimit(`cookie-consent:${body.visitorId}`, 20, 3600);
    const user = await currentAccount(request).catch(() => null);
    const row = await db.cookie_consents.create({
      data: {
        visitor_id: body.visitorId,
        user_id: user?.id ?? null,
        analytics: body.analytics,
        marketing: body.marketing,
        policy_version: body.policyVersion,
        user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
      },
    });
    set.status = 201;
    return { id: row.id };
  },
  {
    body: t.Object({
      visitorId: t.String({ format: "uuid" }),
      analytics: t.Boolean(),
      marketing: t.Boolean(),
      policyVersion: t.String({ minLength: 1, maxLength: 40 }),
    }),
  },
);
```

Check `currentAccount` throws on missing session (it is used by `authenticatedUser`); the `.catch` makes the route public. Mount in `app.ts` with `.use(consent)` next to `publicLinks`.

- [ ] **Step 4: Portal consent library (TDD)**

`lib/__tests__/cookie-consent.test.ts`: install the `MemoryStorage` stub on `globalThis.window`/`localStorage` as `api-client.test.ts` does, stub `fetch` to record the body, then assert: `readChoice()` is `null` initially; after `await saveChoice({ analytics: false, marketing: false, policyVersion: COOKIE_POLICY_VERSION })`, `readChoice()` returns that choice and the fetch body contains the same `visitorId` across two saves; a stored choice with an older `policyVersion` makes `readChoice()` return `null` (banner shows again after a policy change).

`lib/cookie-consent.ts`:

```ts
import { recordCookieConsent } from "./api/consent";

export const COOKIE_POLICY_VERSION = "2026-11-10";
const KEY = "certrace:cookie-prefs";
const VISITOR = "certrace:visitor-id";
export type CookieChoice = {
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
  policyVersion: string;
};

function visitorId(): string {
  let id = localStorage.getItem(VISITOR);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR, id);
  }
  return id;
}

export function readChoice(): CookieChoice | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) ?? "null") as CookieChoice | null;
    return c?.policyVersion === COOKIE_POLICY_VERSION ? c : null;
  } catch {
    return null;
  }
}

export async function saveChoice(c: Omit<CookieChoice, "decidedAt">) {
  const choice = { ...c, decidedAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(choice));
  } catch {
    /* storage blocked: the server record still holds the choice */
  }
  await recordCookieConsent({ visitorId: visitorId(), ...c });
  window.dispatchEvent(new CustomEvent("certrace:cookie-prefs"));
}
```

Add `"certrace:visitor-id"` to `browserOnly` in `lib/account-storage.ts:287-305` (`certrace:cookie-prefs` is already there).

`lib/api/consent.ts`:

```ts
import { api, result } from "./client";
export const recordCookieConsent = (body: {
  visitorId: string; analytics: boolean; marketing: boolean; policyVersion: string;
}) => result(api(false).api.v1.consent.cookies.post(body));
```

Use `api(false)` so the call works before sign-in; the browser still sends the session cookie only when `credentials: "include"`, so for signed-in linking call `api()` when `loadSession()` exists. Implement: `api(Boolean(loadSession()))`.

- [ ] **Step 5: Banner**

`components/cookie-banner.tsx` (client component): renders nothing when `readChoice()` is non-null (read in `useEffect` to avoid hydration mismatch). Otherwise a fixed bottom `Card` (max-width 640px, 16px gutter on mobile) with text "We use necessary cookies to keep you signed in. With your permission we also use analytics cookies to improve Certrace." and a link to `/legal/privacy`, and three `Button`s: "Reject optional" (saves `{analytics:false, marketing:false}`), "Customise" (opens the same toggles `CookieModal` uses), "Accept all". Reject and Accept have equal visual weight (consent law requires refusing to be as easy as accepting). Thai copy in the i18n file. Mount `<CookieBanner />` once in `app/layout.tsx` body.

Move `CookieModal` out of `settings/page.tsx` into `components/cookie-modal.tsx` so the banner and Settings share it; its Save calls `saveChoice`.

- [ ] **Step 6: Run tests and commit**

`bun test test/consent.test.ts`; `bun run --cwd certrace-portal test:unit`; `bun run typecheck`. All PASS.

```bash
git add certrace-backend certrace-portal
git commit -m "feat: record cookie consent with banner"
```

### Task 9: Legal update notice

**Files:**
- Create: `certrace-backend/scripts/notify-legal-update.ts`

**Interfaces:**
- Consumes: `notify(user, "legal_updated", {}, false)`.

- [ ] **Step 1: Implement**

```ts
import { db } from "../src/lib/db";
import { notify } from "../src/lib/notify";

// Run after publishing new rows in the legal versions table. Users are asked to
// accept on next sign-in by needsLegalConsent(); this only tells them why.
const dry = process.argv.includes("--dry-run");
const users = await db.users.findMany({ where: { status: "ACTIVE" } });
let sent = 0;
for (const u of users) {
  if (!dry) await notify(u, "legal_updated").catch((e) => console.error(u.id, e));
  sent++;
}
console.log(`${dry ? "Would send" : "Sent"} ${sent} legal update emails`);
await db.$disconnect();
```

Resend rate limits apply; if more than 1 000 users exist, add `await Bun.sleep(600)` inside the loop (stays under 2 requests/second).

- [ ] **Step 2: Verify and commit**

`bun scripts/notify-legal-update.ts --dry-run` prints a count and exits 0.

```bash
git add certrace-backend/scripts/notify-legal-update.ts
git commit -m "add: legal update notice script"
```

### Task 10: Onboarding validation and new company fields

**Files:**
- Modify: `certrace-backend/src/modules/reporting/shape.ts`, `reporting/storage.ts:91`
- Modify: `certrace-backend/src/modules/master-data/profile-contract.ts`
- Modify: `certrace-portal/lib/profile.tsx`, `certrace-portal/app/onboarding/page.tsx`, `certrace-portal/app/onboarding/setup/page.tsx`
- Test: `certrace-backend/test/profile-contract.test.ts`, `certrace-portal/lib/__tests__/profile.test.ts` (create or extend)

**Interfaces:**
- Produces: `Shape.maxLength?: number`, `Shape.pattern?: string`. New profile fields (all optional strings unless noted): `taxId` (13 digits), `website` (https URL), `country` (ISO-3166 alpha-2), `employeeBand` (`"1-49"|"50-199"|"200-999"|"1000+"`), `exportMarkets: string[]` (ISO alpha-2 or `"EU"`), `productionModel` (`"own"|"oem"|"both"`), `energySources: string[]` (`"electricity"|"natural-gas"|"oil"|"lpg"|"coal"|"biomass"|"steam-purchased"`), `boilerCount`, `furnaceCount` (decimal text 0..999), `annualProductionBand` (`"<1k"|"1k-10k"|"10k-100k"|">100k"` tonnes).

Why these fields: tax ID and country identify the legal entity for CBAM and invoicing; export markets decide which standard Convert shows first; production model decides whether OEM installations appear (Task 20); energy sources and equipment counts seed the factory profile (Task 22) so it is not empty on first visit.

- [ ] **Step 1: Failing test**

`test/profile-contract.test.ts`:

```ts
import { expect, test } from "bun:test";
import { validateStore } from "../src/modules/reporting/storage";

const ok = { firstName: "Somchai", companyName: "ACME", taxId: "0105561234567", phone: "+66 38 123 456" };
test("valid profile passes", () => {
  expect(() => validateStore("certrace:profile", ok)).not.toThrow();
});
// Unbounded text fields let one request store megabytes in a profile shown in admin lists.
test("rejects over-long names and malformed tax ids", () => {
  expect(() => validateStore("certrace:profile", { ...ok, firstName: "x".repeat(121) })).toThrow();
  expect(() => validateStore("certrace:profile", { ...ok, taxId: "12345" })).toThrow();
  expect(() => validateStore("certrace:profile", { ...ok, productionModel: "other" })).toThrow();
});
```

- [ ] **Step 2: Implement**

`shape.ts`: add `maxLength?: number; pattern?: string;` to `Shape`.

`storage.ts` after the `1000000` check:

```ts
    if (typeof value === "string" && s.maxLength !== undefined && value.length > s.maxLength)
      bad(path, `must be at most ${s.maxLength} characters`);
    if (typeof value === "string" && s.pattern && value !== "" && !new RegExp(s.pattern).test(value))
      bad(path, "invalid format");
```

`profile-contract.ts`: replace the single loop with explicit limits:

```ts
const str = (maxLength: number, pattern?: string): Shape => ({
  kind: "string", optional: true, maxLength, ...(pattern ? { pattern } : {}),
});
const fields: Record<string, Shape> = {
  firstName: str(120), lastName: str(120), jobTitle: str(120), companyName: str(200),
  sector: str(60), installationId: str(32), jurisdiction: str(8), currency: str(3, "^[A-Z]{3}$"),
  unit: str(16), cbamProductCount: str(20), supplierCount: str(20), installationCount: str(20),
  customerCount: str(20), hearAbout: str(200), phone: str(32, "^\\+?[0-9 ()-]{6,32}$"),
  lineId: str(40), taxId: str(13, "^\\d{13}$"), website: str(200, "^https?://"),
  country: str(2, "^[A-Z]{2}$"), boilerCount: str(3, "^\\d{1,3}$"), furnaceCount: str(3, "^\\d{1,3}$"),
  employeeBand: { kind: "string", optional: true, enum: ["1-49", "50-199", "200-999", "1000+"] },
  productionModel: { kind: "string", optional: true, enum: ["own", "oem", "both"] },
  annualProductionBand: { kind: "string", optional: true, enum: ["<1k", "1k-10k", "10k-100k", ">100k"] },
};
fields.onboarded = { kind: "boolean", optional: true };
for (const key of ["goalAchieve", "currentManagement", "biggestChallenge", "exportMarkets", "energySources"])
  fields[key] = {
    kind: "array",
    optional: true,
    table: "profile_" + key.toLowerCase(),
    item: { kind: "string", table: "profile_" + key.toLowerCase() + "_items", arrayElement: true, maxLength: 60 },
  };
```

Extend `ProfileValues` with the new keys. Check whether `profileSpec` table names feed a generated catalogue (`bun run --cwd certrace-backend db:report-catalogue`); if the check fails, run the generator without `--check` and commit its output.

- [ ] **Step 3: Portal fields**

`lib/profile.tsx`: add the same optional keys to `Profile`. On `/onboarding` add a "Company" group: tax ID (`inputMode="numeric"`, 13 digits, error "Tax ID is 13 digits"), website, country (select, default `TH`), employee band (segmented), export markets (multi-select chips, default `EU`), production model (radio: "We make it ourselves" / "An OEM makes it for us" / "Both"). On `/onboarding/setup` add "Factory basics": energy sources (multi-select), boiler count, furnace count, annual production band. Reuse `Field`. Client checks mirror the server patterns; the server stays authoritative.

- [ ] **Step 4: Run tests and commit**

`bun test test/profile-contract.test.ts`; `bun run --cwd certrace-portal test:unit`; `bun run typecheck`. PASS.

```bash
git add certrace-backend certrace-portal
git commit -m "feat: validate onboarding fields and collect company and factory basics"
```

---

## Phase 2 — Shared workspace workbook

### Task 11: `workbooks` table and API

**Files:**
- Create: `certrace-backend/prisma/migrations/202611110003_workbooks/migration.sql`
- Modify: `certrace-backend/prisma/schema.prisma`
- Create: `certrace-backend/src/modules/workbooks/model.ts`, `service.ts`, `index.ts`
- Modify: `certrace-backend/src/app.ts` (`.use(workbooks)`)
- Modify: `certrace-backend/test/helpers.ts` (add `editorOf`)
- Test: `certrace-backend/test/workbooks.test.ts`

**Interfaces:**
- Consumes: `companySession` (`team/workspace.ts`) — resolves `{ account, company }`; editors send `X-Certrace-Company: <ownerId>` and must have an `account_members` row with role `editor`. The trial check from Task 5 already applies.
- Produces (all under `/api/v1/workbooks`, company-scoped):
  - `GET /:installationId` → `{ years: { year: number; meta: WorkbookMeta; revision: number; updatedAt: string }[] }`
  - `GET /:installationId/:year?since=<n>` → `{ changed: false, revision }` when `since === revision`, else `{ changed: true, revision, meta, cells, editors, updatedAt }`. Missing row → `revision: 0`, empty objects.
  - `PATCH /:installationId/:year/cells` body `{ cells: Record<CellKey, string | null> }` (1..2000 entries; `null` or `""` deletes) → same shape as a changed GET.
  - `PUT /:installationId/:year/meta` body `{ meta: WorkbookMeta }` → same shape.
  - `type CellKey = "<sheetId>:<row>:<colKey>"` matching `^[a-z0-9-]{1,32}:\d{1,5}:[a-z0-9_-]{1,40}$`.
  - `type WorkbookMeta = { status?: "empty" | "setup" | "ready" | "confirmed"; files?: { id: string; name: string; size: number; type: string }[]; confirmedAt?: string; copiedFrom?: number; blank?: boolean; revealed?: boolean }`.
  - `editors: Record<CellKey, { by: string; at: string }>` — last writer per cell (D6).
  - Errors: `422 INVALID_CELL_KEY`, `413 WORKBOOK_TOO_LARGE` (serialized cells + editors > 5 000 000 chars).

Before writing `WorkbookMeta`, open `certrace-portal/lib/workspace-store.ts` and copy the `status` union and the `files` item shape exactly from `WorkspaceYear`; the values above are what the inventory recorded. If they differ, the store's version wins and both the server model and `lib/api/workbooks.ts` use it.

- [ ] **Step 1: Migration + schema**

```sql
BEGIN;
CREATE TABLE workbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  installation_id text NOT NULL CHECK (installation_id ~ '^[A-Za-z0-9_-]{1,64}$'),
  year integer NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  cells jsonb NOT NULL DEFAULT '{}'::jsonb,
  editors jsonb NOT NULL DEFAULT '{}'::jsonb,
  revision integer NOT NULL DEFAULT 0,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, installation_id, year)
);
COMMIT;
```

```prisma
model workbooks {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  company_id      String   @db.Uuid
  installation_id String
  year            Int
  meta            Json     @default("{}")
  cells           Json     @default("{}")
  editors         Json     @default("{}")
  revision        Int      @default(0)
  updated_by      String?  @db.Uuid
  updated_at      DateTime @default(now()) @db.Timestamptz(6)
  company         users    @relation("workbook_company", fields: [company_id], references: [id], onDelete: Cascade)
  editor          users?   @relation("workbook_editor", fields: [updated_by], references: [id], onDelete: SetNull)

  @@unique([company_id, installation_id, year])
  @@schema("public")
}
```

In `model users` add `workbooks workbooks[] @relation("workbook_company")` and `workbooks_edited workbooks[] @relation("workbook_editor")`. Run `bun run db:migrate && bun run db:generate`.

- [ ] **Step 2: `editorOf` helper**

Append to `test/helpers.ts` (same rows `team/service.ts` writes on accept: `accounts` upsert at line ~116, `account_members` create at line ~244):

```ts
/** Makes `member` an editor of `owner`'s company, the state team accept leaves. */
export async function editorOf(
  owner: { user: { id: string } },
  member: { user: { id: string } },
) {
  await db.accounts.upsert({
    where: { id: owner.user.id },
    create: { id: owner.user.id },
    update: {},
  });
  await db.account_members.create({
    data: { account_id: owner.user.id, user_id: member.user.id, role: "editor" },
  });
  return { "X-Certrace-Company": owner.user.id };
}
```

- [ ] **Step 3: Failing tests**

`test/workbooks.test.ts`:

```ts
import { afterAll, describe, expect, test } from "bun:test";
import { account, call, cleanup, editorOf } from "./helpers";
afterAll(cleanup);

const base = "/api/v1/workbooks/inst-1/2026";
const patch = (cookie: string, cells: Record<string, string | null>, h = {}) =>
  call(base + "/cells", "PATCH", { cells }, cookie, h);

describe("workbooks", () => {
  // Two people in one factory edit different cells at the same time; neither edit may be lost.
  test("owner and editor edits merge cell by cell", async () => {
    const owner = await account();
    const member = await account();
    const h = await editorOf(owner, member);
    expect((await patch(owner.cookie, { "products:0:item": "Steel wire" })).status).toBe(200);
    expect((await patch(member.cookie, { "products:0:qty": "1200" }, h)).status).toBe(200);
    const wb = await (await call(base, "GET", undefined, owner.cookie)).json();
    expect(wb.cells).toEqual({ "products:0:item": "Steel wire", "products:0:qty": "1200" });
    expect(wb.revision).toBe(2);
    expect(wb.editors["products:0:qty"].by).toBe(member.user.id);
  });

  test("concurrent patches both land", async () => {
    const a = await account();
    await Promise.all(
      Array.from({ length: 10 }, (_, i) => patch(a.cookie, { [`steps:${i}:step`]: `S${i}` })),
    );
    const wb = await (await call(base, "GET", undefined, a.cookie)).json();
    expect(Object.keys(wb.cells)).toHaveLength(10);
    expect(wb.revision).toBe(10);
  });

  test("null deletes a cell", async () => {
    const a = await account();
    await patch(a.cookie, { "energy:1:item": "LPG" });
    const r = await (await patch(a.cookie, { "energy:1:item": null })).json();
    expect(r.cells).toEqual({});
  });

  // Polling every 10 s must cost almost nothing when nobody typed.
  test("since=current revision returns changed:false", async () => {
    const a = await account();
    await patch(a.cookie, { "steps:0:step": "Drawing" });
    const r = await (await call(base + "?since=1", "GET", undefined, a.cookie)).json();
    expect(r).toEqual({ changed: false, revision: 1 });
  });

  test("another company cannot read the workbook", async () => {
    const a = await account();
    const b = await account();
    await patch(a.cookie, { "steps:0:step": "Secret" });
    const r = await call(base, "GET", undefined, b.cookie, { "X-Certrace-Company": a.user.id });
    expect(r.status).toBe(403);
    const own = await (await call(base, "GET", undefined, b.cookie)).json();
    expect(own.cells).toEqual({});
  });

  test("rejects malformed cell keys", async () => {
    const a = await account();
    const r = await patch(a.cookie, { "../etc:0:x": "1" });
    expect(r.status).toBe(422);
    expect((await r.json()).detail.code).toBe("INVALID_CELL_KEY");
  });

  test("year list carries meta without cells", async () => {
    const a = await account();
    await call(base + "/meta", "PUT", { meta: { status: "ready" } }, a.cookie);
    const r = await (await call("/api/v1/workbooks/inst-1", "GET", undefined, a.cookie)).json();
    expect(r.years).toHaveLength(1);
    expect(r.years[0]).toMatchObject({ year: 2026, meta: { status: "ready" } });
    expect(r.years[0].cells).toBeUndefined();
  });
});
```

Run: `cd certrace-backend && bun test test/workbooks.test.ts` — FAIL (404).

- [ ] **Step 4: Model**

`src/modules/workbooks/model.ts`:

```ts
import { t } from "elysia";

export const CELL_KEY = /^[a-z0-9-]{1,32}:\d{1,5}:[a-z0-9_-]{1,40}$/;
export const MAX_CHARS = 5_000_000;

const installationId = t.String({ pattern: "^[A-Za-z0-9_-]{1,64}$" });
export const listParams = t.Object({ installationId });
export const params = t.Object({
  installationId,
  year: t.Numeric({ minimum: 2000, maximum: 2100 }),
});
export const meta = t.Object(
  {
    status: t.Optional(
      t.Union([t.Literal("empty"), t.Literal("setup"), t.Literal("ready"), t.Literal("confirmed")]),
    ),
    files: t.Optional(
      t.Array(
        t.Object({
          id: t.String({ maxLength: 64 }),
          name: t.String({ maxLength: 255 }),
          size: t.Integer({ minimum: 0 }),
          type: t.String({ maxLength: 120 }),
        }),
        { maxItems: 200 },
      ),
    ),
    confirmedAt: t.Optional(t.String({ format: "date-time" })),
    copiedFrom: t.Optional(t.Integer({ minimum: 2000, maximum: 2100 })),
    blank: t.Optional(t.Boolean()),
    revealed: t.Optional(t.Boolean()),
  },
  { additionalProperties: false },
);
export const cellsBody = t.Object({
  cells: t.Record(t.String(), t.Union([t.String({ maxLength: 10_000 }), t.Null()]), {
    minProperties: 1,
    maxProperties: 2000,
  }),
});
```

- [ ] **Step 5: Service**

`src/modules/workbooks/service.ts`:

```ts
import { db } from "../../lib/db";
import { fail } from "../../lib/errors";
import { CELL_KEY, MAX_CHARS } from "./model";

type Cells = Record<string, string>;
type Editors = Record<string, { by: string; at: string }>;
type Row = { meta: unknown; cells: Cells; editors: Editors; revision: number; updated_at: Date };

const view = (r: Row | null) => ({
  changed: true as const,
  revision: r?.revision ?? 0,
  meta: (r?.meta ?? {}) as Record<string, unknown>,
  cells: r?.cells ?? {},
  editors: r?.editors ?? {},
  updatedAt: (r?.updated_at ?? new Date(0)).toISOString(),
});

const where = (companyId: string, installationId: string, year: number) => ({
  company_id_installation_id_year: { company_id: companyId, installation_id: installationId, year },
});

export async function list(companyId: string, installationId: string) {
  const rows = await db.workbooks.findMany({
    where: { company_id: companyId, installation_id: installationId },
    select: { year: true, meta: true, revision: true, updated_at: true },
    orderBy: { year: "desc" },
  });
  return {
    years: rows.map((r) => ({
      year: r.year,
      meta: r.meta,
      revision: r.revision,
      updatedAt: r.updated_at.toISOString(),
    })),
  };
}

export async function read(companyId: string, installationId: string, year: number, since?: number) {
  const r = (await db.workbooks.findUnique({ where: where(companyId, installationId, year) })) as Row | null;
  const revision = r?.revision ?? 0;
  if (since !== undefined && since === revision) return { changed: false as const, revision };
  return view(r);
}

/** Locks the row so concurrent patches apply one after another and none is lost. */
async function mutate(
  companyId: string,
  installationId: string,
  year: number,
  actorId: string,
  change: (row: Row) => Partial<Pick<Row, "meta" | "cells" | "editors">>,
) {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`INSERT INTO workbooks (company_id, installation_id, year)
      VALUES (${companyId}::uuid, ${installationId}, ${year}) ON CONFLICT DO NOTHING`;
    const [row] = await tx.$queryRaw<Row[]>`SELECT meta, cells, editors, revision, updated_at
      FROM workbooks WHERE company_id = ${companyId}::uuid AND installation_id = ${installationId}
      AND year = ${year} FOR UPDATE`;
    const next = { ...row!, ...change(row!) };
    if (JSON.stringify(next.cells).length + JSON.stringify(next.editors).length > MAX_CHARS)
      fail(413, "WORKBOOK_TOO_LARGE", "This workbook is too large. Remove unused rows or split the year.");
    const saved = await tx.workbooks.update({
      where: where(companyId, installationId, year),
      data: {
        meta: next.meta as object,
        cells: next.cells,
        editors: next.editors,
        revision: { increment: 1 },
        updated_by: actorId,
        updated_at: new Date(),
      },
    });
    return view(saved as unknown as Row);
  });
}

export function patchCells(
  companyId: string,
  installationId: string,
  year: number,
  actorId: string,
  patch: Record<string, string | null>,
) {
  for (const key of Object.keys(patch))
    if (!CELL_KEY.test(key)) fail(422, "INVALID_CELL_KEY", `Invalid cell ${key.slice(0, 80)}`);
  return mutate(companyId, installationId, year, actorId, (row) => {
    const cells = { ...row.cells };
    const editors = { ...row.editors };
    const at = new Date().toISOString();
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") {
        delete cells[key];
        delete editors[key];
      } else {
        cells[key] = value;
        editors[key] = { by: actorId, at };
      }
    }
    return { cells, editors };
  });
}

export const putMeta = (
  companyId: string,
  installationId: string,
  year: number,
  actorId: string,
  meta: Record<string, unknown>,
) => mutate(companyId, installationId, year, actorId, () => ({ meta }));
```

The installation id is not checked against the installations record: every row is already partitioned by `company_id`, so a wrong id only creates an empty workbook inside the caller's own company.

- [ ] **Step 6: Routes**

`src/modules/workbooks/index.ts`:

```ts
import { Elysia, t } from "elysia";
import { companySession } from "../team/workspace";
import * as M from "./model";
import * as S from "./service";

export const workbooks = new Elysia({ prefix: "/api/v1/workbooks" })
  .use(companySession)
  .get("/:installationId", ({ company, params }) => S.list(company.id, params.installationId), {
    params: M.listParams,
  })
  .get(
    "/:installationId/:year",
    ({ company, params, query }) =>
      S.read(company.id, params.installationId, params.year, query.since),
    { params: M.params, query: t.Object({ since: t.Optional(t.Numeric({ minimum: 0 })) }) },
  )
  .patch(
    "/:installationId/:year/cells",
    ({ company, account, params, body }) =>
      S.patchCells(company.id, params.installationId, params.year, account.id, body.cells),
    { params: M.params, body: M.cellsBody },
  )
  .put(
    "/:installationId/:year/meta",
    ({ company, account, params, body }) =>
      S.putMeta(company.id, params.installationId, params.year, account.id, body.meta),
    { params: M.params, body: t.Object({ meta: M.meta }) },
  );
```

Mount in `app.ts` with `.use(workbooks)` next to `.use(files)`. CORS already allows `PATCH` and `X-Certrace-Company`.

- [ ] **Step 7: Run tests**

`bun test test/workbooks.test.ts` PASS; `bun run test:backend` PASS; `bun run --cwd certrace-portal api:generate` then `api:check` exit 0.

- [ ] **Step 8: Commit**

```bash
git add certrace-backend certrace-portal/lib/api
git commit -m "feat: shared workbook storage with per-cell merge"
```

### Task 12: Sheet status (tab colours)

**Files:**
- Create: `certrace-portal/lib/workbook/status.ts`
- Test: `certrace-portal/lib/workbook/__tests__/status.test.ts`

**Interfaces:**
- Consumes: `Sheet`, `SheetRow` from `lib/workspace-sheets.ts` (`RowStatus = "review" | "confirmed" | "missing" | "empty"`, `CellFlag = "warn" | "missing"`).
- Produces:
  - `type SheetStatus = "untouched" | "missing" | "review" | "complete"`
  - `REQUIRED: Record<string, string[]>` — required column keys per sheet id.
  - `sheetStatus(sheet: Sheet, required?: string[]): SheetStatus`
  - `STATUS_TONE: Record<SheetStatus, string>`, `STATUS_LABEL: Record<SheetStatus, string>`.
  - `startedRow(row: SheetRow): boolean` — a row with a non-meta value.
  - `missingCells(sheet: Sheet, required?: string[]): { row: number; cols: string[] }[]` — 0-based row index, missing required col keys (plus flagged `missing` cols), started rows only.
  - `statusTooltip(sheet: Sheet, required?: string[]): string` — e.g. `Missing data — row 2: Qty, Unit`, col labels, at most 5 rows then `+N more`.
  - `SHEET_ORDER: string[]` — tab order following the material flow (MEASUR baseline steps).

- [ ] **Step 1: Failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { sheetStatus } from "../status";
import type { Sheet } from "../../workspace-sheets";

const sheet = (rows: Sheet["rows"]): Sheet => ({
  id: "materials",
  code: "03",
  name: "Raw materials",
  cols: [],
  rows,
});
const req = ["item", "qty", "unit"];

// The tab colour is the customer's to-do list: red must mean "something is
// missing here", never just "you have not looked yet".
test("no values is untouched", () => {
  assert.equal(sheetStatus(sheet([{ cells: {}, status: "empty" }]), req), "untouched");
});
test("a started row without a required column is missing", () => {
  assert.equal(
    sheetStatus(sheet([{ cells: { item: "Wire rod", qty: "10" }, status: "confirmed" }]), req),
    "missing",
  );
});
test("a missing flag is missing even when columns are filled", () => {
  const row = {
    cells: { item: "a", qty: "1", unit: "t" },
    status: "confirmed" as const,
    flags: { qty: "missing" as const },
  };
  assert.equal(sheetStatus(sheet([row]), req), "missing");
});
test("review rows or warn flags give review", () => {
  assert.equal(
    sheetStatus(sheet([{ cells: { item: "a", qty: "1", unit: "t" }, status: "review" }]), req),
    "review",
  );
  const warn = {
    cells: { item: "a", qty: "1", unit: "t" },
    status: "confirmed" as const,
    flags: { qty: "warn" as const },
  };
  assert.equal(sheetStatus(sheet([warn]), req), "review");
});
test("all started rows complete is complete; blank rows are ignored", () => {
  const rows = [
    { cells: { item: "a", qty: "1", unit: "t" }, status: "confirmed" as const },
    { cells: {}, status: "empty" as const },
  ];
  assert.equal(sheetStatus(sheet(rows), req), "complete");
});
test("a status cell alone does not start a row", () => {
  assert.equal(sheetStatus(sheet([{ cells: { status: "review" }, status: "empty" }]), req), "untouched");
});
```

Append to the same test file (the tooltip is how the customer learns *which* cell turned the tab red, like MEASUR's setup-step badge tooltip):

```ts
import { missingCells, statusTooltip, SHEET_ORDER } from "../status";

const labelled = (rows: Sheet["rows"]): Sheet => ({
  ...sheet(rows),
  cols: [
    { key: "item", label: "Item", kind: "text", width: "1fr" },
    { key: "qty", label: "Qty", kind: "number", width: "80px" },
    { key: "unit", label: "Unit", kind: "unit", width: "80px" },
  ],
});

test("missingCells lists required and flagged gaps per started row", () => {
  const s = labelled([
    { cells: {}, status: "empty" },
    { cells: { item: "Wire rod" }, status: "confirmed" },
    { cells: { item: "a", qty: "1", unit: "t" }, status: "confirmed", flags: { qty: "missing" } },
  ]);
  assert.deepEqual(missingCells(s, req), [
    { row: 1, cols: ["qty", "unit"] },
    { row: 2, cols: ["qty"] },
  ]);
});
test("statusTooltip names rows (1-based) and column labels", () => {
  const s = labelled([{ cells: { item: "Wire rod" }, status: "confirmed" }]);
  assert.equal(statusTooltip(s, req), "Missing data — row 1: Qty, Unit");
});
test("statusTooltip caps the list at 5 rows", () => {
  const rows = Array.from({ length: 7 }, () => ({ cells: { item: "x" }, status: "confirmed" as const }));
  assert.match(statusTooltip(labelled(rows), req), /row 5: Qty, Unit; \+2 more$/);
});
test("statusTooltip for other states is the plain label", () => {
  assert.equal(statusTooltip(labelled([{ cells: {}, status: "empty" }]), req), "Not started");
});
test("SHEET_ORDER follows the material flow", () => {
  assert.deepEqual(SHEET_ORDER.slice(0, 4), ["installation", "products", "steps", "materials"]);
  assert.equal(SHEET_ORDER.at(-1), "documents");
});
```

Run: `bun run --cwd certrace-portal test:unit` — FAIL (module missing).

- [ ] **Step 2: Implement**

`lib/workbook/status.ts`:

```ts
import type { Sheet } from "../workspace-sheets";

export type SheetStatus = "untouched" | "missing" | "review" | "complete";

// Required column keys per sheet id; keys come from buildSheets() in workspace-sheets.ts.
export const REQUIRED: Record<string, string[]> = {
  products: ["cn", "item", "qty", "unit"],
  steps: ["step", "what"],
  materials: ["step", "item", "qty", "unit"],
  flow: ["from", "to", "item"],
  energy: ["step", "item", "qty", "unit"],
  output: ["step", "item", "qty", "unit"],
  transport: ["route", "mode", "qty"],
  evidence: ["item", "covers"],
};

// Columns that describe a row rather than hold data; filling only these does not start a row.
const META_COLS = new Set(["status", "source", "method"]);
const filled = (v: string | undefined) => v !== undefined && v.trim() !== "";

export function sheetStatus(sheet: Sheet, required = REQUIRED[sheet.id] ?? []): SheetStatus {
  const started = sheet.rows.filter((r) =>
    Object.entries(r.cells).some(([k, v]) => !META_COLS.has(k) && filled(v)),
  );
  if (!started.length) return "untouched";
  const flags = started.flatMap((r) => Object.values(r.flags ?? {}));
  if (
    flags.includes("missing") ||
    started.some((r) => r.status === "missing" || required.some((k) => !filled(r.cells[k])))
  )
    return "missing";
  if (flags.includes("warn") || started.some((r) => r.status === "review")) return "review";
  return "complete";
}

export const STATUS_TONE: Record<SheetStatus, string> = {
  untouched: "#c7c5be",
  missing: "#dc2626",
  review: "#b45309",
  complete: "#16a34a",
};
export const STATUS_LABEL: Record<SheetStatus, string> = {
  untouched: "Not started",
  missing: "Missing data",
  review: "Needs review",
  complete: "Complete",
};
```

Add to `lib/workbook/status.ts` (import `SheetRow` too). Refactor `sheetStatus` to use `startedRow` so both rules stay identical:

```ts
export const startedRow = (r: SheetRow) =>
  Object.entries(r.cells).some(([k, v]) => !META_COLS.has(k) && filled(v));

export function missingCells(sheet: Sheet, required = REQUIRED[sheet.id] ?? []) {
  const out: { row: number; cols: string[] }[] = [];
  sheet.rows.forEach((r, row) => {
    if (!startedRow(r)) return;
    const flagged = Object.entries(r.flags ?? {}).filter(([, f]) => f === "missing").map(([k]) => k);
    const cols = [...new Set([...required.filter((k) => !filled(r.cells[k])), ...flagged])];
    if (cols.length) out.push({ row, cols });
  });
  return out;
}

export function statusTooltip(sheet: Sheet, required = REQUIRED[sheet.id] ?? []) {
  const status = sheetStatus(sheet, required);
  if (status !== "missing") return STATUS_LABEL[status];
  const label = (k: string) => sheet.cols.find((c) => c.key === k)?.label ?? k;
  const gaps = missingCells(sheet, required);
  const shown = gaps.slice(0, 5).map((g) => `row ${g.row + 1}: ${g.cols.map(label).join(", ")}`);
  const more = gaps.length > 5 ? `; +${gaps.length - 5} more` : "";
  return `${STATUS_LABEL.missing} — ${shown.join("; ")}${more}`;
}

// Tab order follows the material flow, like MEASUR's numbered baseline steps.
export const SHEET_ORDER = [
  "installation", "products", "steps", "materials", "energy",
  "flow", "output", "transport", "evidence", "documents",
];
```

A started row whose `status` is `missing` but has no gap columns still makes the tab red; `statusTooltip` then lists no rows, so fall back to `Missing data — marked missing` when `gaps` is empty.

Thai labels in the workspace i18n file: "ยังไม่เริ่ม", "ข้อมูลยังไม่ครบ", "รอตรวจ", "ครบแล้ว".

- [ ] **Step 3: Run and commit**

`bun run --cwd certrace-portal test:unit` PASS.

```bash
git add certrace-portal/lib/workbook
git commit -m "feat: workbook sheet status rules"
```

### Task 13: Workspace on the server workbook, tab colour dots

**Files:**
- Create: `certrace-portal/lib/api/workbooks.ts`, `certrace-portal/lib/workbook/cells.ts`, `certrace-portal/lib/workbook/use-workbook.ts`
- Modify: `certrace-portal/lib/workspace-sheets.ts` (drop sample rows)
- Modify: `certrace-portal/components/workspace/spreadsheet.tsx` and every `useWorkspaceYears` caller (`grep -rln useWorkspaceYears certrace-portal/app certrace-portal/components`)
- Modify: `certrace-portal/lib/account-storage.ts` (remove `certrace:workspace-years` from `browserOnly`)
- Delete: `certrace-portal/lib/workspace-store.ts`
- Test: `certrace-portal/lib/workbook/__tests__/cells.test.ts`

**Interfaces:**
- Consumes: Task 11 API; Task 12 `sheetStatus`, `STATUS_TONE`, `STATUS_LABEL`.
- Produces:
  - `lib/api/workbooks.ts`: `WorkbookMeta`, `Workbook`, `listWorkbooks(iid)`, `getWorkbook(iid, year, since?)`, `patchWorkbookCells(iid, year, cells)`, `putWorkbookMeta(iid, year, meta)`.
  - `lib/workbook/cells.ts`: `cellKey(sheetId: string, row: number, col: string): string`; `rowsUsed(cells: Record<string,string>, sheetId: string): number`; `sheetsFromCells(cells: Record<string,string>, files: WorkspaceFile[]): Sheet[]`.
  - `lib/workbook/use-workbook.ts`:
    - `useWorkbookYears(installationId: string | null)` → `{ loaded, years, get(year), confirm(year), copy(from, to), startBlank(year), markReady(year), markRevealed(year) }` — the same method names as the old `useWorkspaceYears`, so callers change the import and pass the installation id.
    - `useWorkbook(installationId: string | null, year: number)` → `{ loaded, sheets: Sheet[], cells, editors, revision, saveEdit(key: string, value: string), pending: number }`.

Behaviour of `use-workbook.ts`:
- Polling: `useQuery({ queryKey: ["workbook", iid, year], queryFn, refetchInterval: 10_000, refetchIntervalInBackground: false, enabled: Boolean(iid) })`. `queryFn` sends `since` = cached revision and returns the cached value when the server answers `changed: false`.
- Edits: `saveEdit` writes into a pending map (`useRef<Record<string, string | null>>`, empty string stored as `null`), re-renders, and resets a 600 ms timer. When the timer fires, it sends the whole map in one `patchWorkbookCells`, clears the keys it sent, and stores the response in the query cache (`queryClient.setQueryData`). On failure the keys stay pending and the existing save-error toast shows; the next edit or poll retries.
- Displayed cells = server cells with pending keys applied on top, so a poll never hides a value still being saved.
- `copy(from, to)`: read `from`, send its cells to `to` in chunks of 2000 keys, then `putWorkbookMeta(iid, to, { status: "ready", copiedFrom: from })`.
- `markReady(year)` = `putWorkbookMeta(iid, year, { ...meta, status: "ready" })`; keep the `SETUP_MS` animation timing the old store used.
- Uploaded files still go to `PUT /api/v1/account/files/:id`; only their list lives in `meta.files`.

- [ ] **Step 1: Failing test**

`lib/workbook/__tests__/cells.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { cellKey, rowsUsed, sheetsFromCells } from "../cells";
import { BLANK_ROWS } from "../../workspace-sheets";

test("cellKey matches the server pattern", () => {
  assert.equal(cellKey("materials", 3, "qty"), "materials:3:qty");
});
// Customers must never see invented sample rows mixed with their own data.
test("sheets come only from cells, padded to BLANK_ROWS", () => {
  const sheets = sheetsFromCells({ "materials:2:item": "Wire rod", "materials:2:qty": "10" }, []);
  const m = sheets.find((s) => s.id === "materials")!;
  assert.equal(m.rows.length, BLANK_ROWS);
  assert.deepEqual(m.rows[2]!.cells, { item: "Wire rod", qty: "10" });
  assert.equal(m.rows[2]!.status, "confirmed");
  assert.equal(m.rows[0]!.status, "empty");
  for (const s of sheets)
    if (s.id !== "documents" && s.id !== "materials")
      assert.ok(s.rows.every((r) => Object.keys(r.cells).length === 0), s.id);
});
test("rows grow past BLANK_ROWS when data needs it", () => {
  assert.equal(rowsUsed({ "steps:45:step": "x" }, "steps"), 46);
  const s = sheetsFromCells({ "steps:45:step": "x" }, []).find((x) => x.id === "steps")!;
  assert.equal(s.rows.length, 51);
});
test("a status cell sets the row status", () => {
  const s = sheetsFromCells({ "energy:0:item": "LPG", "energy:0:status": "review" }, []).find(
    (x) => x.id === "energy",
  )!;
  assert.equal(s.rows[0]!.status, "review");
});
```

Run: `bun run --cwd certrace-portal test:unit` — FAIL.

- [ ] **Step 2: Strip sample data**

In `lib/workspace-sheets.ts`: delete `sampleSheets` and every `r({...})` sample row; `buildSheets(files, blank)` returns the sheet structure (ids, codes, names, cols) with `BLANK_ROWS` empty rows, and the documents sheet rows from `files` as today. Keep `issuesOf`, `letter`, `PRODUCTION_DIAGRAM_ID`, `BLANK_ROWS`, `NO_FILE`. If `WorkspaceFile` is declared in `workspace-store.ts`, move the type here now.

- [ ] **Step 3: Implement `cells.ts`**

```ts
import { buildSheets, BLANK_ROWS, type RowStatus, type Sheet, type WorkspaceFile } from "../workspace-sheets";

export const cellKey = (sheetId: string, row: number, col: string) => `${sheetId}:${row}:${col}`;

export function rowsUsed(cells: Record<string, string>, sheetId: string) {
  let max = -1;
  for (const key of Object.keys(cells)) {
    const [s, r] = key.split(":");
    if (s === sheetId) max = Math.max(max, Number(r));
  }
  return max + 1;
}

const ROW_STATUS = new Set<string>(["review", "confirmed", "missing"]);

/** Server cells are the only data source. Five spare rows below the last used
    row leave room to type without an "add row" button. */
export function sheetsFromCells(cells: Record<string, string>, files: WorkspaceFile[]): Sheet[] {
  return buildSheets(files, true).map((sheet) => {
    if (sheet.id === "documents") return sheet;
    const used = rowsUsed(cells, sheet.id);
    const count = Math.max(BLANK_ROWS, used ? used + 5 : 0);
    const rows = Array.from({ length: count }, (_, i) => {
      const own: Record<string, string> = {};
      for (const col of sheet.cols) {
        const v = cells[cellKey(sheet.id, i, col.key)];
        if (v !== undefined) own[col.key] = v;
      }
      const hasData = Object.keys(own).some((k) => k !== "status");
      const status: RowStatus = ROW_STATUS.has(own.status ?? "")
        ? (own.status as RowStatus)
        : hasData
          ? "confirmed"
          : "empty";
      return { cells: own, status };
    });
    return { ...sheet, rows };
  });
}
```

Run the test: PASS.

- [ ] **Step 4: API client**

`lib/api/workbooks.ts`:

```ts
import { api, result } from "./client";

export type WorkbookMeta = {
  status?: "empty" | "setup" | "ready" | "confirmed";
  files?: { id: string; name: string; size: number; type: string }[];
  confirmedAt?: string;
  copiedFrom?: number;
  blank?: boolean;
  revealed?: boolean;
};
export type Workbook = {
  changed: true;
  revision: number;
  meta: WorkbookMeta;
  cells: Record<string, string>;
  editors: Record<string, { by: string; at: string }>;
  updatedAt: string;
};

const wb = (iid: string) => api().api.v1.workbooks({ installationId: iid });
export const listWorkbooks = (iid: string) => result(wb(iid).get());
export const getWorkbook = (iid: string, year: number, since?: number) =>
  result(wb(iid)({ year }).get({ query: since === undefined ? {} : { since } }));
export const patchWorkbookCells = (iid: string, year: number, cells: Record<string, string | null>) =>
  result(wb(iid)({ year }).cells.patch({ cells }));
export const putWorkbookMeta = (iid: string, year: number, meta: WorkbookMeta) =>
  result(wb(iid)({ year }).meta.put({ meta }));
```

`bun run typecheck` reports a wrong Eden path at once; fix the call chain to the regenerated client, not the server. The company header is added by `api()` the same way it is for records (check `lib/api/client.ts` for `X-Certrace-Company`); no extra code here.

- [ ] **Step 5: Hooks**

Implement `lib/workbook/use-workbook.ts` exactly as the behaviour list above describes. Use `useQueryClient()` from TanStack Query, the toast helper the old store used for save errors, and `sheetsFromCells(displayedCells, meta.files ?? [])` for `sheets`.

- [ ] **Step 6: Spreadsheet UI**

In `components/workspace/spreadsheet.tsx`:
- Data comes from `useWorkbook(installationId, year)`; cell commit calls `saveEdit(cellKey(sheet.id, row, col.key), value)`.
- Tabs render in `SHEET_ORDER` (Task 12); ids not in the list go after, in their `buildSheets` order.
- Each sheet tab starts with an 8 px circle, `background: STATUS_TONE[sheetStatus(sheet)]`, `role="img"`, `aria-label` = `STATUS_LABEL[...]`. The tab's `title` = `statusTooltip(sheet)` so hovering a red tab names the rows and columns still missing. The active tab keeps its current underline.
- Cell `title` shows "Edited by {name} · {relative time}" from `editors[key]`; names come from the team member query used on `/team`, falling back to "a teammate".
- Toolbar shows "Saving…" while `pending > 0`, else "Saved".

`components/workspace/chrome.tsx` `STATE_TONE` stays for workspace cards (D1).

Move every `useWorkspaceYears` caller to `useWorkbookYears(installationId)`. Until Task 19 lands, pass `active?.id ?? null` from `useActiveInstallation()`. Delete `lib/workspace-store.ts` and the `certrace:workspace-years` line in `account-storage.ts`. Old browser data under that key was mock data and is not migrated.

- [ ] **Step 7: Verify**

`bun run --cwd certrace-portal test:unit`, `bun run typecheck`, `bun run lint` PASS. Manual: `bun run dev` from the repo root, sign in as the owner and as an editor of the same company in two browsers, type in different cells of one sheet, confirm each sees the other's value within 10 s, and the tab dot turns red when a row is started and green when its required columns are filled.

- [ ] **Step 8: Commit**

```bash
git add certrace-portal
git commit -m "feat: workspace reads and writes the shared server workbook"
```

### Task 14: Installation tab

**Files:**
- Create: `certrace-portal/components/workspace/installation-sheet.tsx`
- Modify: `certrace-portal/lib/workspace-sheets.ts` (add sheet `{ id: "installation", code: "00A", name: "Installation", cols: [] }` right after documents)
- Modify: `certrace-portal/lib/workbook/status.ts`, `certrace-portal/components/workspace/spreadsheet.tsx`
- Test: `certrace-portal/lib/workbook/__tests__/status.test.ts`

**Interfaces:**
- Consumes: `Installation`, `saveInstallation`, `missingFields` from `lib/installations.ts`.
- Produces: `installationSheetStatus(inst: Installation | null): SheetStatus` — `untouched` when null or no template field filled; `missing` when `missingFields(inst).length > 0`; else `complete`.

- [ ] **Step 1: Failing test**

Append to `status.test.ts`:

```ts
import { installationSheetStatus } from "../status";
import { missingFields, type Installation } from "../../installations";

// The tab reads the same record as Settings, so its colour must agree with the
// "complete" badge shown there.
test("installation tab status follows missingFields", () => {
  assert.equal(installationSheetStatus(null), "untouched");
  const partial = { id: "i1", self: true, name: "Rayong plant" } as unknown as Installation;
  assert.equal(installationSheetStatus(partial), "missing");
  const full = { ...partial } as Record<string, unknown>;
  for (const f of missingFields(partial)) full[f] = "x";
  assert.equal(installationSheetStatus(full as unknown as Installation), "complete");
});
```

If `missingFields` returns labels rather than keys, change the loop to use the key list it iterates (export that list from `installations.ts` as `REQUIRED_INSTALLATION_FIELDS`).

- [ ] **Step 2: Implement status**

Append to `status.ts`:

```ts
import { missingFields, type Installation } from "../installations";

const NOT_TEMPLATE = new Set(["id", "self", "supplierId", "role"]);

export function installationSheetStatus(inst: Installation | null): SheetStatus {
  if (!inst) return "untouched";
  const any = Object.entries(inst).some(
    ([k, v]) => !NOT_TEMPLATE.has(k) && typeof v === "string" && v.trim() !== "",
  );
  if (!any) return "untouched";
  return missingFields(inst).length ? "missing" : "complete";
}
```

- [ ] **Step 3: Installation tab UI**

`installation-sheet.tsx` (client component, props `{ installation: Installation | null }`):
- Header note: "This tab edits the installation record. Changes also show in Settings → Installations." (Thai: "แท็บนี้แก้ข้อมูล installation โดยตรง การแก้ไขจะแสดงใน Settings → Installations ด้วย").
- Two-column grid, label | input, using the spreadsheet's row height, border colour and font. One row per CBAM template field i–xiv. Import the label list the installation settings form already uses; do not retype labels.
- Required fields that are empty get a 2 px `#dc2626` left border.
- Edits debounce 600 ms and call `saveInstallation({ ...installation, [field]: value })`.
- When `installation` is null: "Choose an installation above to fill in its details."

In `spreadsheet.tsx`, when the active tab is `installation`, render `<InstallationSheet installation={scoped} />` instead of the grid, and its tab dot uses `installationSheetStatus(scoped)`.

- [ ] **Step 4: Run and commit**

Unit tests, typecheck, lint PASS.

```bash
git add certrace-portal
git commit -m "feat: installation tab in the workspace workbook"
```

### Task 15: Production flow diagram

**Files:**
- Create: `certrace-portal/lib/workbook/flow.ts`
- Create: `certrace-portal/components/workspace/flow-diagram.tsx`
- Modify: `certrace-portal/components/workspace/spreadsheet.tsx` (view toggle "Table | Flow")
- Test: `certrace-portal/lib/workbook/__tests__/flow.test.ts`

**Interfaces:**
- Consumes: `Sheet[]` from `useWorkbook` (Task 13). Column keys: steps `step, what, input, output`; materials/energy/output `step, item, qty, unit`; products `cn, item, qty, unit`; flow `from, to, item`.
- Produces:
  - `type FlowNode = { id: string; kind: "material" | "energy" | "step" | "output" | "product"; label: string; detail?: string; x: number; y: number }`
  - `type FlowEdge = { from: string; to: string; label?: string }`
  - `buildFlow(sheets: Sheet[]): { nodes: FlowNode[]; edges: FlowEdge[]; width: number; height: number }`

Layout rule (so the picture reads like the factory floor, left to right): steps sit on one row in the order of the Steps sheet; each step's raw materials stack above it, its energy sources below it, its outputs to the right of the last step; products sit at the far right. Rows that name a step that does not exist attach to a node "Unassigned step" so nothing entered disappears. Edges: material→step, energy→step, step→next step (or the explicit Flow sheet edges when that sheet has rows), last step→output, output→product when names match.

- [ ] **Step 1: Failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildFlow } from "../flow";
import type { Sheet } from "../../workspace-sheets";

const s = (id: string, rows: Record<string, string>[]): Sheet => ({
  id,
  code: "",
  name: id,
  cols: [],
  rows: rows.map((cells) => ({ cells, status: "confirmed" as const })),
});
const sheets = [
  s("steps", [{ step: "Drawing" }, { step: "Annealing" }]),
  s("materials", [{ step: "Drawing", item: "Wire rod", qty: "1000", unit: "t" }]),
  s("energy", [{ step: "Annealing", item: "Natural gas", qty: "50", unit: "GJ" }, { step: "Plating", item: "Electricity" }]),
  s("output", [{ step: "Annealing", item: "Steel wire" }]),
  s("products", [{ cn: "7217", item: "Steel wire" }]),
  s("flow", []),
];

// The diagram replaces reading the sheets, so every entered row must appear.
test("every row becomes a node and steps chain left to right", () => {
  const f = buildFlow(sheets);
  const labels = f.nodes.map((n) => n.label);
  for (const l of ["Drawing", "Annealing", "Wire rod", "Natural gas", "Electricity", "Steel wire", "Unassigned step"])
    assert.ok(labels.includes(l), l);
  const drawing = f.nodes.find((n) => n.label === "Drawing")!;
  const annealing = f.nodes.find((n) => n.label === "Annealing")!;
  assert.ok(drawing.x < annealing.x);
  assert.ok(f.edges.some((e) => e.from === drawing.id && e.to === annealing.id));
  const rod = f.nodes.find((n) => n.label === "Wire rod")!;
  assert.ok(rod.y < drawing.y, "materials above");
  const gas = f.nodes.find((n) => n.label === "Natural gas")!;
  assert.ok(gas.y > annealing.y, "energy below");
  assert.equal(rod.detail, "1000 t");
});
test("explicit Flow rows replace the default chain", () => {
  const withFlow = sheets.map((x) => (x.id === "flow" ? s("flow", [{ from: "Annealing", to: "Drawing", item: "Scrap" }]) : x));
  const f = buildFlow(withFlow);
  const id = (l: string) => f.nodes.find((n) => n.label === l)!.id;
  assert.ok(f.edges.some((e) => e.from === id("Annealing") && e.to === id("Drawing") && e.label === "Scrap"));
  assert.ok(!f.edges.some((e) => e.from === id("Drawing") && e.to === id("Annealing")));
});
test("empty workbook gives an empty diagram", () => {
  assert.equal(buildFlow([]).nodes.length, 0);
});
```

- [ ] **Step 2: Implement `flow.ts`**

```ts
import type { Sheet } from "../workspace-sheets";

export type FlowNode = {
  id: string;
  kind: "material" | "energy" | "step" | "output" | "product";
  label: string;
  detail?: string;
  x: number;
  y: number;
};
export type FlowEdge = { from: string; to: string; label?: string };

const COL = 220; // horizontal gap between steps
const ROW = 64; // vertical gap between stacked inputs
const NODE_W = 168;
const NODE_H = 44;
export const FLOW_NODE = { w: NODE_W, h: NODE_H };

const rowsOf = (sheets: Sheet[], id: string) =>
  (sheets.find((s) => s.id === id)?.rows ?? [])
    .map((r) => r.cells)
    .filter((c) => Object.entries(c).some(([k, v]) => k !== "status" && v?.trim()));
const detail = (c: Record<string, string>) =>
  [c.qty, c.unit].filter(Boolean).join(" ") || undefined;

export function buildFlow(sheets: Sheet[]) {
  const stepNames = rowsOf(sheets, "steps").map((c) => c.step?.trim()).filter(Boolean) as string[];
  const materials = rowsOf(sheets, "materials");
  const energy = rowsOf(sheets, "energy");
  const outputs = rowsOf(sheets, "output");
  const products = rowsOf(sheets, "products");
  const flows = rowsOf(sheets, "flow");

  const steps = [...new Set(stepNames)];
  const known = new Set(steps);
  const orphan = [...materials, ...energy, ...outputs].some((c) => !known.has(c.step?.trim() ?? ""));
  if (orphan) steps.push("Unassigned step");
  const stepOf = (c: Record<string, string>) =>
    known.has(c.step?.trim() ?? "") ? c.step!.trim() : "Unassigned step";

  const maxAbove = Math.max(0, ...steps.map((st) => materials.filter((c) => stepOf(c) === st).length));
  const baseY = 24 + maxAbove * ROW;
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const stepId = (st: string) => `step:${steps.indexOf(st)}`;

  steps.forEach((st, i) => {
    const x = 24 + i * COL;
    nodes.push({ id: stepId(st), kind: "step", label: st, x, y: baseY });
    materials.filter((c) => stepOf(c) === st).forEach((c, k) => {
      const id = `material:${i}:${k}`;
      nodes.push({ id, kind: "material", label: c.item || "Material", detail: detail(c), x, y: baseY - (k + 1) * ROW });
      edges.push({ from: id, to: stepId(st) });
    });
    energy.filter((c) => stepOf(c) === st).forEach((c, k) => {
      const id = `energy:${i}:${k}`;
      nodes.push({ id, kind: "energy", label: c.item || "Energy", detail: detail(c), x, y: baseY + (k + 1) * ROW });
      edges.push({ from: id, to: stepId(st) });
    });
  });

  if (flows.length)
    for (const c of flows) {
      const a = steps.includes(c.from ?? "") ? stepId(c.from!) : null;
      const b = steps.includes(c.to ?? "") ? stepId(c.to!) : null;
      if (a && b) edges.push({ from: a, to: b, label: c.item || undefined });
    }
  else
    for (let i = 0; i + 1 < steps.length; i++)
      if (steps[i + 1] !== "Unassigned step") edges.push({ from: stepId(steps[i]!), to: stepId(steps[i + 1]!) });

  const outX = 24 + steps.length * COL;
  outputs.forEach((c, k) => {
    const id = `output:${k}`;
    nodes.push({ id, kind: "output", label: c.item || "Output", detail: detail(c), x: outX, y: baseY + k * ROW });
    edges.push({ from: stepId(stepOf(c)), to: id });
  });
  products.forEach((c, k) => {
    const id = `product:${k}`;
    nodes.push({ id, kind: "product", label: c.item || c.cn || "Product", detail: c.cn, x: outX + COL, y: baseY + k * ROW });
    const out = outputs.findIndex((o) => o.item && o.item === c.item);
    if (out >= 0) edges.push({ from: `output:${out}`, to: id });
  });

  const width = nodes.length ? Math.max(...nodes.map((n) => n.x)) + NODE_W + 24 : 0;
  const height = nodes.length ? Math.max(...nodes.map((n) => n.y)) + NODE_H + 24 : 0;
  return { nodes, edges, width, height };
}
```

Run the test: PASS.

- [ ] **Step 3: SVG component**

`flow-diagram.tsx` (props `{ sheets: Sheet[]; onOpenSheet(sheetId: string): void }`):
- `const f = useMemo(() => buildFlow(sheets), [sheets])`. Empty: show "Add steps in sheet 02 to see your production flow." with a button that calls `onOpenSheet("steps")`.
- Wrap the `<svg viewBox={`0 0 ${f.width} ${f.height}`} width={f.width}>` in a horizontally scrollable `div` (diagram scrolls; the page does not).
- Edges: `<path>` from the source node's edge to the target's, a cubic curve (`M x1 y1 C mx y1, mx y2, x2 y2`), stroke `#c7c5be`, 1.5 px, arrow marker; label text at the midpoint, 11 px.
- Nodes: `<rect rx=8>` 168×44 with fill by kind — step `#ffffff` with 1.5 px `#1f2937` stroke, material `#eff6ff`, energy `#fff7ed`, output `#f0fdf4`, product `#f5f3ff` (all with 1 px `#e5e7eb` stroke); label 13 px weight 600 truncated with `<title>` holding the full text; detail 11 px muted.
- Clicking a node calls `onOpenSheet` with the node's source sheet (material→`materials`, energy→`energy`, step→`steps`, output→`output`, product→`products`). Nodes are `<g role="button" tabIndex={0}>` and handle Enter/Space.
- A legend row above the diagram with the five kinds.

If these fills are not tokens in `globals.css`, add them there as `--flow-step`, `--flow-material`, `--flow-energy`, `--flow-output`, `--flow-product` and use `var(...)`.

In `spreadsheet.tsx`, add a segmented control "Table | Flow" in the toolbar; Flow renders `<FlowDiagram sheets={sheets} onOpenSheet={(id) => { setView("table"); setActiveSheet(id); }} />`. Remember the choice in the URL (`?view=flow`).

- [ ] **Step 4: Run and commit**

Unit tests, typecheck, lint PASS. Manual: the diagram for a workbook with 3 steps fits without overlap and scrolls sideways on a 375 px viewport.

```bash
git add certrace-portal
git commit -m "feat: production flow diagram from the workbook"
```

### Task 16: Two-way flow diagram (edit the diagram, the workbook follows)

MEASUR keeps its process diagram and its assessment in step: a diagram save rewrites the assessment's components, an assessment edit refreshes the diagram, components that exist on one side but not the other are added when the assessment opens, and writes run one at a time so a sync that depends on a failed write is skipped (see `docs/MEASUR-FLOW-REFERENCE.md` §5). Certrace takes the same behaviour but uses one source of truth: the diagram is always drawn from the workbook cells (Task 15), and every diagram edit is turned into a cell patch. The table and the diagram cannot drift, because there is nothing to sync except the cells.

**Files:**
- Create: `certrace-portal/lib/workbook/flow-edit.ts`
- Create: `certrace-portal/lib/workbook/sync-queue.ts`
- Modify: `certrace-portal/lib/workbook/use-workbook.ts` (add `savePatch`)
- Modify: `certrace-portal/components/workspace/flow-diagram.tsx` (edit toolbar, selection, missing-step banner, `nodeTone`/`nodeBadge` props used by Task 23)
- Test: `certrace-portal/lib/workbook/__tests__/flow-edit.test.ts`, `certrace-portal/lib/workbook/__tests__/sync-queue.test.ts`

**Interfaces:**
- Consumes: `cellKey`, `rowsUsed` (Task 13, keys `"<sheetId>:<row>:<colKey>"`, rows 0-based, `rowsUsed` = index of the next free row); `buildFlow`, `FlowNode`, `FlowEdge` (Task 15); `patchWorkbookCells` (Task 13).
- Produces:
  - `type CellPatch = Record<string, string | null>` (exported from `flow-edit.ts`; `null` clears a cell)
  - `type FlowAction =`
    `| { kind: "add-step"; name: string; what?: string }`
    `| { kind: "add-input"; sheet: "materials" | "energy"; step: string; item: string; qty?: string; unit?: string }`
    `| { kind: "add-output"; step: string; item: string; qty?: string; unit?: string }`
    `| { kind: "connect"; from: string; to: string; item?: string }`
    `| { kind: "disconnect"; from: string; to: string }`
    `| { kind: "rename-step"; from: string; to: string }`
  - `flowActionToCells(action: FlowAction, cells: Record<string, string>): CellPatch` — throws `Error` with a user-readable message for a duplicate or unknown step.
  - `stepNames(cells: Record<string, string>): string[]` — Steps sheet order.
  - `missingSteps(cells: Record<string, string>): string[]` — step names used in materials, energy, output or flow rows that the Steps sheet does not list.
  - `type SyncResult = "saved" | "skipped" | "failed"`; `createSyncQueue(send: (patch: CellPatch) => Promise<void>): { enqueue(patch: CellPatch): Promise<SyncResult>; size(): number }`
  - `useWorkbook(...)` gains `savePatch(patch: CellPatch): Promise<SyncResult>`.
  - `FlowDiagram` props: `{ sheets: Sheet[]; cells: Record<string, string>; editable?: boolean; savePatch?: (p: CellPatch) => Promise<SyncResult>; nodeTone?: Record<string, string>; nodeBadge?: Record<string, string>; onSelect?: (node: FlowNode | null) => void }`.

Rules:
- Step names compare trimmed and case-insensitively; the stored value keeps what the user typed.
- `add-step` appends a Steps row (`step`, `what`). A name that already exists throws `A step named "<name>" already exists.`
- `add-input` / `add-output` append a row to `materials`/`energy`/`output` with `step`, `item`, optional `qty`, `unit`, and `status = "review"` so the tab turns amber until a person confirms the numbers. The step must exist, otherwise throw `Add the step "<step>" first.`
- `connect` adds a Flow row (`from`, `to`, `item`). If the Flow sheet is empty, the patch first writes the default chain (step *i* → step *i+1*, in Steps order). Task 15 replaces the default chain with explicit Flow rows as soon as one exists, so without this the first manual link would delete every implied link. An edge that already exists returns `{}`.
- `disconnect` clears every cell of each Flow row whose `from`/`to` match.
- `rename-step` rewrites the name in `steps.step`, `materials.step`, `energy.step`, `output.step`, `flow.from` and `flow.to`. Renaming to an existing name throws.
- Sync queue: one patch at a time, in the order requested. When a send fails, that call resolves `"failed"` and every patch already waiting behind it resolves `"skipped"`, because those patches were computed from cells that assumed the failed write had landed. The next `enqueue` after that runs normally. An empty patch resolves `"saved"` without a request.

- [ ] **Step 1: Failing tests**

`lib/workbook/__tests__/flow-edit.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { flowActionToCells, missingSteps, stepNames } from "../flow-edit";

const base: Record<string, string> = {
  "steps:0:step": "Drawing",
  "steps:1:step": "Annealing",
  "materials:0:step": "Drawing",
  "materials:0:item": "Wire rod",
  "energy:0:step": "Packing",
  "energy:0:item": "Electricity",
};

test("stepNames keeps Steps sheet order", () => {
  assert.deepEqual(stepNames(base), ["Drawing", "Annealing"]);
});
// MEASUR adds the components the diagram lacks when the assessment opens; here the
// diagram offers to add steps that rows already name.
test("missingSteps lists names used by rows but absent from Steps", () => {
  assert.deepEqual(missingSteps(base), ["Packing"]);
});
test("add-step appends the next free Steps row", () => {
  assert.deepEqual(flowActionToCells({ kind: "add-step", name: "Coating" }, base), {
    "steps:2:step": "Coating",
  });
});
test("add-step rejects a duplicate name, ignoring case and spaces", () => {
  assert.throws(() => flowActionToCells({ kind: "add-step", name: " drawing " }, base), /already exists/);
});
test("add-input writes a review row on the chosen sheet", () => {
  assert.deepEqual(
    flowActionToCells({ kind: "add-input", sheet: "materials", step: "Annealing", item: "Zinc", qty: "2", unit: "t" }, base),
    {
      "materials:1:step": "Annealing",
      "materials:1:item": "Zinc",
      "materials:1:qty": "2",
      "materials:1:unit": "t",
      "materials:1:status": "review",
    },
  );
});
test("add-input needs an existing step", () => {
  assert.throws(
    () => flowActionToCells({ kind: "add-output", step: "Nowhere", item: "Scrap" }, base),
    /Add the step "Nowhere" first/,
  );
});
// The first explicit link would otherwise wipe the implied chain (Task 15 rule).
test("first connect seeds the default chain, then adds the new edge", () => {
  const cells = { ...base, "steps:2:step": "Coating" };
  assert.deepEqual(flowActionToCells({ kind: "connect", from: "Drawing", to: "Coating", item: "Wire" }, cells), {
    "flow:0:from": "Drawing",
    "flow:0:to": "Annealing",
    "flow:1:from": "Annealing",
    "flow:1:to": "Coating",
    "flow:2:from": "Drawing",
    "flow:2:to": "Coating",
    "flow:2:item": "Wire",
  });
});
test("connect is idempotent for an existing edge", () => {
  const cells = { ...base, "flow:0:from": "Drawing", "flow:0:to": "Annealing" };
  assert.deepEqual(flowActionToCells({ kind: "connect", from: "drawing", to: "ANNEALING" }, cells), {});
});
test("disconnect clears the whole matching Flow row", () => {
  const cells = { ...base, "flow:0:from": "Drawing", "flow:0:to": "Annealing", "flow:0:item": "Wire" };
  assert.deepEqual(flowActionToCells({ kind: "disconnect", from: "Drawing", to: "Annealing" }, cells), {
    "flow:0:from": null,
    "flow:0:to": null,
    "flow:0:item": null,
  });
});
test("rename-step rewrites every reference", () => {
  const cells = { ...base, "flow:0:from": "Drawing", "flow:0:to": "Annealing" };
  assert.deepEqual(flowActionToCells({ kind: "rename-step", from: "Drawing", to: "Wire drawing" }, cells), {
    "steps:0:step": "Wire drawing",
    "materials:0:step": "Wire drawing",
    "flow:0:from": "Wire drawing",
  });
});
test("rename-step refuses to merge two steps", () => {
  assert.throws(() => flowActionToCells({ kind: "rename-step", from: "Drawing", to: "annealing" }, base), /already exists/);
});
```

`lib/workbook/__tests__/sync-queue.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { createSyncQueue } from "../sync-queue";

test("patches run one at a time in order; after a failure, waiting patches are skipped", async () => {
  const sent: string[] = [];
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const q = createSyncQueue(async (p) => {
    const k = Object.keys(p)[0]!;
    sent.push(k);
    if (k === "a") await gate;
    if (k === "b") throw new Error("network");
  });
  const results = Promise.all([q.enqueue({ a: "1" }), q.enqueue({ b: "1" }), q.enqueue({ c: "1" })]);
  assert.equal(q.size(), 2);
  release();
  assert.deepEqual(await results, ["saved", "failed", "skipped"]);
  assert.deepEqual(sent, ["a", "b"]);
  assert.equal(await q.enqueue({ d: "1" }), "saved");
});
test("an empty patch saves without a request", async () => {
  let calls = 0;
  const q = createSyncQueue(async () => void calls++);
  assert.equal(await q.enqueue({}), "saved");
  assert.equal(calls, 0);
});
```

Run: `bun run --cwd certrace-portal test:unit` — FAIL (modules missing).

- [ ] **Step 2: Implement `sync-queue.ts`**

```ts
import type { CellPatch } from "./flow-edit";

export type SyncResult = "saved" | "skipped" | "failed";

export function createSyncQueue(send: (patch: CellPatch) => Promise<void>) {
  const waiting: { patch: CellPatch; done: (r: SyncResult) => void }[] = [];
  let running = false;
  async function drain() {
    if (running) return;
    running = true;
    while (waiting.length) {
      const job = waiting.shift()!;
      if (!Object.keys(job.patch).length) {
        job.done("saved");
        continue;
      }
      try {
        await send(job.patch);
        job.done("saved");
      } catch {
        job.done("failed");
        // Built on cells that assumed the failed write landed; never send them.
        for (const later of waiting.splice(0)) later.done("skipped");
      }
    }
    running = false;
  }
  return {
    enqueue: (patch: CellPatch) =>
      new Promise<SyncResult>((done) => {
        waiting.push({ patch, done });
        void drain();
      }),
    size: () => waiting.length,
  };
}
```

- [ ] **Step 3: Implement `flow-edit.ts`**

```ts
import { cellKey, rowsUsed } from "./cells";

export type CellPatch = Record<string, string | null>;
export type FlowAction =
  | { kind: "add-step"; name: string; what?: string }
  | { kind: "add-input"; sheet: "materials" | "energy"; step: string; item: string; qty?: string; unit?: string }
  | { kind: "add-output"; step: string; item: string; qty?: string; unit?: string }
  | { kind: "connect"; from: string; to: string; item?: string }
  | { kind: "disconnect"; from: string; to: string }
  | { kind: "rename-step"; from: string; to: string };

const norm = (s: string | undefined) => (s ?? "").trim().toLowerCase();
const same = (a: string | undefined, b: string | undefined) => norm(a) !== "" && norm(a) === norm(b);

// Every cell that names a step, by sheet and column.
const STEP_REFS: [string, string][] = [
  ["steps", "step"],
  ["materials", "step"],
  ["energy", "step"],
  ["output", "step"],
  ["flow", "from"],
  ["flow", "to"],
];

function column(cells: Record<string, string>, sheet: string, col: string) {
  const out: { row: number; value: string }[] = [];
  for (let row = 0; row < rowsUsed(cells, sheet); row++) {
    const value = cells[cellKey(sheet, row, col)];
    if (value?.trim()) out.push({ row, value });
  }
  return out;
}

export const stepNames = (cells: Record<string, string>) => column(cells, "steps", "step").map((c) => c.value.trim());

export function missingSteps(cells: Record<string, string>) {
  const known = new Set(stepNames(cells).map(norm));
  const seen = new Map<string, string>();
  for (const [sheet, col] of STEP_REFS.slice(1))
    for (const { value } of column(cells, sheet, col))
      if (!known.has(norm(value)) && !seen.has(norm(value))) seen.set(norm(value), value.trim());
  return [...seen.values()];
}

function row(sheet: string, index: number, values: Record<string, string | undefined>): CellPatch {
  const patch: CellPatch = {};
  for (const [col, v] of Object.entries(values)) if (v?.trim()) patch[cellKey(sheet, index, col)] = v.trim();
  return patch;
}

function requireStep(cells: Record<string, string>, step: string) {
  if (!stepNames(cells).some((s) => same(s, step))) throw new Error(`Add the step "${step.trim()}" first.`);
}
function refuseDuplicate(cells: Record<string, string>, name: string) {
  if (stepNames(cells).some((s) => same(s, name))) throw new Error(`A step named "${name.trim()}" already exists.`);
}

export function flowActionToCells(action: FlowAction, cells: Record<string, string>): CellPatch {
  switch (action.kind) {
    case "add-step":
      refuseDuplicate(cells, action.name);
      return row("steps", rowsUsed(cells, "steps"), { step: action.name, what: action.what });
    case "add-input":
    case "add-output": {
      requireStep(cells, action.step);
      const sheet = action.kind === "add-output" ? "output" : action.sheet;
      const { step, item, qty, unit } = action;
      return row(sheet, rowsUsed(cells, sheet), { step, item, qty, unit, status: "review" });
    }
    case "connect": {
      requireStep(cells, action.from);
      requireStep(cells, action.to);
      const edges = column(cells, "flow", "from").map(({ row: r, value }) => ({
        from: value,
        to: cells[cellKey("flow", r, "to")],
      }));
      if (edges.some((e) => same(e.from, action.from) && same(e.to, action.to))) return {};
      const patch: CellPatch = {};
      let next = rowsUsed(cells, "flow");
      if (!edges.length) {
        const order = stepNames(cells);
        for (let i = 0; i + 1 < order.length; i++)
          Object.assign(patch, row("flow", next++, { from: order[i], to: order[i + 1] }));
        if (edges.length === 0 && order.some((s, i) => same(s, action.from) && same(order[i + 1], action.to)))
          return patch;
      }
      return Object.assign(patch, row("flow", next, { from: action.from, to: action.to, item: action.item }));
    }
    case "disconnect": {
      const patch: CellPatch = {};
      for (const { row: r, value } of column(cells, "flow", "from"))
        if (same(value, action.from) && same(cells[cellKey("flow", r, "to")], action.to))
          for (const key of Object.keys(cells)) if (key.startsWith(`flow:${r}:`)) patch[key] = null;
      return patch;
    }
    case "rename-step": {
      requireStep(cells, action.from);
      if (!same(action.from, action.to)) refuseDuplicate(cells, action.to);
      const patch: CellPatch = {};
      for (const [sheet, col] of STEP_REFS)
        for (const { row: r, value } of column(cells, sheet, col))
          if (same(value, action.from)) patch[cellKey(sheet, r, col)] = action.to.trim();
      return patch;
    }
  }
}
```

The early `return patch` in `connect` covers the case where the requested edge is already part of the default chain: the chain is written once and the edge is not duplicated.

Run: `bun run --cwd certrace-portal test:unit` — PASS.

- [ ] **Step 4: `savePatch` in `use-workbook.ts`**

- Move the debounce timer's body into `const flush = async () => { … }` (same code as Task 13: send the pending map, clear the sent keys, `setQueryData`). The timer now calls `flush()`.
- Add, once per hook instance:

```ts
const queue = useRef(
  createSyncQueue(async (patch) => {
    await flush(); // typed edits first, so a diagram patch never overtakes them
    const next = await patchWorkbookCells(iid!, year, patch);
    queryClient.setQueryData(["workbook", iid, year], next);
  }),
).current;
const savePatch = (patch: CellPatch) => queue.enqueue(patch);
```

- Return `savePatch` with the other fields. On `"failed"` the caller shows a toast; the server cells are unchanged, so nothing has to be rolled back.

- [ ] **Step 5: Edit mode in `flow-diagram.tsx`**

- Above the SVG, when `editable`, show a toolbar of `Button`s: "Add step", "Add material", "Add energy", "Add output", "Link steps". With a step node selected, also show "Rename step" and "Unlink" (when an edge is selected).
- Each button opens a `Modal` with `Field` inputs:
  - Add step: Name, What happens here.
  - Add material / energy / output: Step (a select of `stepNames(cells)`, preselected with the selected node), Item, Quantity, Unit.
  - Link steps: From, To (selects), Item.
  - Rename: New name.
- Submit: `const patch = flowActionToCells(action, cells)` inside `try`; show a thrown message under the form and keep the modal open. Otherwise `await savePatch(patch)`. Toasts: `"saved"` → close the modal, no toast; `"failed"` → "Not saved. Nothing changed; try again."; `"skipped"` → "Skipped because an earlier change did not save."
- Nodes and edges are focusable: `<g role="button" tabIndex={0} aria-label={label} onClick onKeyDown(Enter|Space)>`. The selected node gets a 2 px `var(--ink)` outline. `onSelect` fires with the node or `null`.
- When `missingSteps(cells).length > 0`, show a warn banner above the diagram: "Rows name steps that are not in the Steps sheet: Packing, Plating." with the button "Add these steps", which enqueues one `add-step` patch per name in that order.
- `nodeTone[node.id]` overrides the node fill and `nodeBadge[node.id]` draws a small label under the node (Task 23 uses both; the workspace passes neither).
- In the workspace (`spreadsheet.tsx` Flow view) pass `editable`, `cells` and `savePatch` from `useWorkbook`.

Thai strings: "เพิ่มขั้นตอน", "เพิ่มวัตถุดิบ", "เพิ่มพลังงาน", "เพิ่มผลผลิต", "เชื่อมขั้นตอน", "เปลี่ยนชื่อขั้นตอน", "ยกเลิกการเชื่อม", "ยังไม่บันทึก ไม่มีอะไรเปลี่ยน ลองอีกครั้ง", "ข้ามไป เพราะการแก้ไขก่อนหน้ายังไม่ได้บันทึก", "มีแถวที่อ้างถึงขั้นตอนที่ยังไม่อยู่ในชีต Steps:", "เพิ่มขั้นตอนเหล่านี้".

- [ ] **Step 6: Verify and commit**

Unit tests, `bun run typecheck`, `bun run lint` PASS. Manual: in two browsers on the same installation, add a step and a material in the diagram of one; the other sees the new rows in the Steps and Materials tabs within 10 s, and the Materials tab dot turns amber (rows are `review`). Stop the backend, add a step, confirm the "Not saved" toast and that the table shows no ghost row.

```bash
git add certrace-portal
git commit -m "feat: edit the flow diagram and write workbook rows"
```

### Task 17: Import an existing Excel or CSV file into a sheet

This follows MEASUR's Data Explorer steps: import the file, choose the header row, map the columns, preview, then import (`docs/MEASUR-FLOW-REFERENCE.md` §8). Factories already keep their numbers in Excel; retyping them is where wrong values come from.

**Files:**
- Create: `certrace-portal/lib/workbook/xlsx.ts` (read `.xlsx` with the browser's own `DecompressionStream`; no dependency)
- Create: `certrace-portal/lib/workbook/import.ts`
- Create: `certrace-portal/components/workspace/import-wizard.tsx`
- Modify: `certrace-portal/components/workspace/spreadsheet.tsx` (toolbar button "Import from file")
- Test: `certrace-portal/lib/workbook/__tests__/import.test.ts`, `certrace-portal/lib/workbook/__tests__/xlsx.test.ts`

**Interfaces:**
- Consumes: `cellKey`, `rowsUsed` (Task 13); `CellPatch`, `savePatch` (Task 16); `Sheet["cols"]` items `{ key: string; label: string }` from `lib/workspace-sheets.ts`.
- Produces:
  - `readZip(buf: ArrayBuffer): Promise<Map<string, Uint8Array>>`
  - `readXlsx(buf: ArrayBuffer): Promise<{ name: string; rows: string[][] }[]>`
  - `parseCsv(text: string): string[][]`
  - `detectHeaderRow(rows: string[][]): number`
  - `suggestMapping(header: string[], cols: { key: string; label: string }[]): (string | null)[]` — one target column key (or `null` = skip) per source column.
  - `buildImport(rows: string[][], headerRow: number, mapping: (string | null)[], sheetId: string, cells: Record<string, string>): { patches: CellPatch[]; added: number; skipped: number }`
  - `IMPORT_LIMITS = { bytes: 5_000_000, rows: 5000, keysPerPatch: 2000 }`

Rules:
- Accept `.csv` and `.xlsx` only, at most 5 MB, and stop with a message beyond 5000 data rows. `.xls` (old binary) gets the message "Save the file as .xlsx or .csv first."
- CSV: RFC 4180 quoting, CRLF or LF, delimiter detected from the first line (`,`, `;` or tab, whichever occurs most outside quotes). A leading UTF-8 BOM is dropped.
- XLSX: read `xl/workbook.xml` for sheet names, `xl/_rels/workbook.xml.rels` for their files, `xl/sharedStrings.xml` for text, and each worksheet's `<c r="B3" t="s|str|inlineStr|b|n">`. Formulas use their cached `<v>`. Dates stay as the serial number the cell holds; the preview shows them as they are, so the user sees what will be stored.
- Header detection: the first of the first 20 rows that has at least two non-empty cells and where non-numeric cells outnumber numeric ones.
- Mapping suggestion: normalise both sides (lower case, letters and digits only) and compare against the column key, its label and these synonyms: `qty` ← quantity, amount, volume, ปริมาณ, จำนวน; `unit` ← uom, units, หน่วย; `item` ← material, name, description, product, รายการ, วัตถุดิบ; `step` ← process, stage, ขั้นตอน, กระบวนการ; `cn` ← cn code, hs, hs code, พิกัด; `source` ← file, document, เอกสาร. A target key is suggested once; later matches get `null`.
- Values are trimmed. In `qty` a comma thousands separator is removed (`"1,234.5"` → `"1234.5"`); any other text is kept as typed so the tab status flags it.
- Rows whose mapped cells are all empty are skipped and counted.
- Imported rows start at `rowsUsed(cells, sheetId)` and get `status = "review"`: the sheet turns amber, and a person confirms the numbers.
- Patches are cut on row boundaries at no more than 2000 keys each and sent through `savePatch` one after another. If one fails, the rest are skipped (Task 16 queue) and the wizard reports "Imported N of M rows. The rest were not saved."

- [ ] **Step 1: Failing tests**

`lib/workbook/__tests__/import.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildImport, detectHeaderRow, parseCsv, suggestMapping } from "../import";

test("parseCsv handles quotes, CRLF, BOM and semicolons", () => {
  assert.deepEqual(parseCsv('﻿a;"b;c"\r\n1;"say ""hi"""\r\n'), [["a", "b;c"], ["1", 'say "hi"']]);
});
test("parseCsv keeps empty trailing cells", () => {
  assert.deepEqual(parseCsv("a,b,\n1,,\n"), [["a", "b", ""], ["1", "", ""]]);
});
test("detectHeaderRow skips a title row", () => {
  const rows = [["Plant energy 2026"], ["Process", "Material", "Quantity", "Unit"], ["Drawing", "Wire rod", "1200", "t"]];
  assert.equal(detectHeaderRow(rows), 1);
});
test("suggestMapping uses keys, labels and Thai synonyms once each", () => {
  const cols = [
    { key: "step", label: "Step" },
    { key: "item", label: "Item" },
    { key: "qty", label: "Quantity" },
    { key: "unit", label: "Unit" },
  ];
  assert.deepEqual(suggestMapping(["ขั้นตอน", "Material", "Amount", "หน่วย", "Notes", "Name"], cols), [
    "step", "item", "qty", "unit", null, null,
  ]);
});
test("buildImport appends review rows, skips blanks and cleans quantities", () => {
  const rows = [["Process", "Material", "Qty"], ["Drawing", "Wire rod", "1,234.5"], ["", "", ""], ["Annealing", "Gas", "abc"]];
  const out = buildImport(rows, 0, ["step", "item", "qty"], "materials", { "materials:0:item": "Existing" });
  assert.equal(out.added, 2);
  assert.equal(out.skipped, 1);
  assert.deepEqual(out.patches, [
    {
      "materials:1:step": "Drawing",
      "materials:1:item": "Wire rod",
      "materials:1:qty": "1234.5",
      "materials:1:status": "review",
      "materials:2:step": "Annealing",
      "materials:2:item": "Gas",
      "materials:2:qty": "abc",
      "materials:2:status": "review",
    },
  ]);
});
test("buildImport splits patches on row boundaries", () => {
  const rows = [["Item"], ...Array.from({ length: 1500 }, (_, i) => [`m${i}`])];
  const { patches } = buildImport(rows, 0, ["item"], "materials", {});
  assert.ok(patches.length >= 2);
  for (const p of patches) assert.ok(Object.keys(p).length <= 2000);
  assert.equal(patches.reduce((n, p) => n + Object.keys(p).length, 0), 3000);
});
```

`lib/workbook/__tests__/xlsx.test.ts` builds a stored (uncompressed) zip by hand, so the test needs no fixture file. It also covers the deflate path through `CompressionStream`, which Node ≥ 18 provides:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { readXlsx, readZip } from "../xlsx";

async function deflate(bytes: Uint8Array) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
// Minimal zip writer: local headers + central directory + end record. CRC is left 0;
// readZip does not check it (the browser already verified the download).
async function zip(files: Record<string, string>, compress = false) {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const raw = enc.encode(text);
    const data = compress ? await deflate(raw) : raw;
    const n = enc.encode(name);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(8, compress ? 8 : 0, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, raw.length, true);
    local.setUint16(26, n.length, true);
    parts.push(new Uint8Array(local.buffer), n, data);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(10, compress ? 8 : 0, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, raw.length, true);
    cd.setUint16(28, n.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), n);
    offset += 30 + n.length + data.length;
  }
  const cdSize = central.reduce((a, b) => a + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, Object.keys(files).length, true);
  end.setUint16(10, Object.keys(files).length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)]).arrayBuffer();
}

const book = {
  "xl/workbook.xml": '<workbook><sheets><sheet name="Energy &amp; fuel" sheetId="1" r:id="rId1"/></sheets></workbook>',
  "xl/_rels/workbook.xml.rels": '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
  "xl/sharedStrings.xml": "<sst><si><t>Item</t></si><si><r><t>Natural </t></r><r><t>gas</t></r></si></sst>",
  "xl/worksheets/sheet1.xml":
    '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="inlineStr"><is><t>Qty</t></is></c></row>' +
    '<row r="2"><c r="A2" t="s"><v>1</v></c><c r="C2"><f>B2*2</f><v>420</v></c></row></sheetData></worksheet>',
};

test("readZip reads stored and deflated entries", async () => {
  for (const compress of [false, true]) {
    const files = await readZip(await zip({ "a.txt": "hello" }, compress));
    assert.equal(new TextDecoder().decode(files.get("a.txt")), "hello");
  }
});
test("readXlsx returns named sheets with shared, inline and formula values", async () => {
  const [sheet] = await readXlsx(await zip(book, true));
  assert.equal(sheet!.name, "Energy & fuel");
  assert.deepEqual(sheet!.rows, [["Item", "", "Qty"], ["Natural gas", "", "420"]]);
});
```

Run: `bun run --cwd certrace-portal test:unit` — FAIL.

- [ ] **Step 2: Implement `xlsx.ts`**

```ts
const u16 = (b: Uint8Array, o: number) => b[o]! | (b[o + 1]! << 8);
const u32 = (b: Uint8Array, o: number) => (u16(b, o) | (u16(b, o + 2) << 16)) >>> 0;

async function inflate(data: Uint8Array) {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function readZip(buf: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const b = new Uint8Array(buf);
  let end = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--)
    if (u32(b, i) === 0x06054b50) { end = i; break; }
  if (end < 0) throw new Error("This file is not a valid .xlsx workbook.");
  const count = u16(b, end + 10);
  let p = u32(b, end + 16);
  const out = new Map<string, Uint8Array>();
  for (let n = 0; n < count; n++) {
    if (u32(b, p) !== 0x02014b50) throw new Error("This file is not a valid .xlsx workbook.");
    const method = u16(b, p + 10), size = u32(b, p + 20);
    const nameLen = u16(b, p + 28), extra = u16(b, p + 30), comment = u16(b, p + 32);
    const local = u32(b, p + 42);
    const name = new TextDecoder().decode(b.subarray(p + 46, p + 46 + nameLen));
    const start = local + 30 + u16(b, local + 26) + u16(b, local + 28);
    const data = b.subarray(start, start + size);
    if (method === 0) out.set(name, data);
    else if (method === 8) out.set(name, await inflate(data));
    else throw new Error("This workbook uses a compression the portal cannot read.");
    p += 46 + nameLen + extra + comment;
  }
  return out;
}

const ENTITY: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) =>
    e[0] === "#" ? String.fromCodePoint(parseInt(e.slice(e[1] === "x" ? 2 : 1), e[1] === "x" ? 16 : 10)) : (ENTITY[e] ?? m),
  );
const texts = (xml: string) => [...xml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => decode(m[1]!)).join("");
const colIndex = (ref: string) => [...ref.replace(/\d+$/, "")].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;

export async function readXlsx(buf: ArrayBuffer) {
  const files = await readZip(buf);
  const text = (path: string) => (files.has(path) ? new TextDecoder().decode(files.get(path)) : "");
  const shared = [...text("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => texts(m[1]!));
  const rels = new Map(
    [...text("xl/_rels/workbook.xml.rels").matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)].map((m) => [m[1]!, m[2]!]),
  );
  return [...text("xl/workbook.xml").matchAll(/<sheet [^>]*name="([^"]*)"[^>]*r:id="([^"]+)"/g)].map((m) => {
    const target = rels.get(m[2]!) ?? "";
    const xml = text(target.startsWith("/") ? target.slice(1) : `xl/${target}`);
    const rows: string[][] = [];
    for (const r of xml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
      const line: string[] = [];
      for (const c of r[2]!.matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = /r="([A-Z]+\d+)"/.exec(c[1]!)?.[1];
        if (!ref) continue;
        const type = /t="(\w+)"/.exec(c[1]!)?.[1];
        const body = c[2] ?? "";
        const v = decode(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "");
        line[colIndex(ref)] = type === "s" ? (shared[Number(v)] ?? "") : type === "inlineStr" ? texts(body) : v;
      }
      rows[Number(r[1]) - 1] = Array.from(line, (x) => x ?? "");
    }
    const width = Math.max(0, ...rows.map((x) => x?.length ?? 0));
    return { name: decode(m[1]!), rows: Array.from(rows, (x) => Array.from({ length: width }, (_, i) => x?.[i] ?? "")) };
  });
}
```

- [ ] **Step 3: Implement `import.ts`**

```ts
import { cellKey, rowsUsed } from "./cells";
import type { CellPatch } from "./flow-edit";

export const IMPORT_LIMITS = { bytes: 5_000_000, rows: 5000, keysPerPatch: 2000 };

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const first = src.split(/\r?\n/, 1)[0] ?? "";
  const count = (d: string) => first.replace(/"[^"]*"/g, "").split(d).length - 1;
  const delim = [",", ";", "\t"].reduce((a, d) => (count(d) > count(a) ? d : a), ",");
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const isNumber = (s: string) => /^-?[\d,]*\.?\d+$/.test(s.trim());
export function detectHeaderRow(rows: string[][]) {
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const cells = rows[i]!.filter((c) => c.trim());
    const numeric = cells.filter(isNumber).length;
    if (cells.length >= 2 && cells.length - numeric > numeric) return i;
  }
  return 0;
}

const SYNONYMS: Record<string, string[]> = {
  qty: ["quantity", "amount", "volume", "ปริมาณ", "จำนวน"],
  unit: ["uom", "units", "หน่วย"],
  item: ["material", "name", "description", "product", "รายการ", "วัตถุดิบ"],
  step: ["process", "stage", "ขั้นตอน", "กระบวนการ"],
  cn: ["cn code", "hs", "hs code", "พิกัด"],
  source: ["file", "document", "เอกสาร"],
};
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

export function suggestMapping(header: string[], cols: { key: string; label: string }[]) {
  const used = new Set<string>();
  return header.map((h) => {
    const n = norm(h);
    const hit = cols.find(
      (c) => !used.has(c.key) && n && [c.key, c.label, ...(SYNONYMS[c.key] ?? [])].some((x) => norm(x) === n),
    );
    if (!hit) return null;
    used.add(hit.key);
    return hit.key;
  });
}

const cleanQty = (v: string) => (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(v) ? v.replace(/,/g, "") : v);

export function buildImport(
  rows: string[][],
  headerRow: number,
  mapping: (string | null)[],
  sheetId: string,
  cells: Record<string, string>,
) {
  const patches: CellPatch[] = [];
  let current: CellPatch = {};
  let next = rowsUsed(cells, sheetId), added = 0, skipped = 0;
  for (const source of rows.slice(headerRow + 1, headerRow + 1 + IMPORT_LIMITS.rows)) {
    const values: CellPatch = {};
    mapping.forEach((key, i) => {
      const v = (source[i] ?? "").trim();
      if (key && v) values[cellKey(sheetId, next, key)] = key === "qty" ? cleanQty(v) : v;
    });
    if (!Object.keys(values).length) { skipped++; continue; }
    values[cellKey(sheetId, next, "status")] = "review";
    if (Object.keys(current).length + Object.keys(values).length > IMPORT_LIMITS.keysPerPatch) {
      patches.push(current);
      current = {};
    }
    Object.assign(current, values);
    next++;
    added++;
  }
  if (Object.keys(current).length) patches.push(current);
  return { patches, added, skipped };
}
```

Run: `bun run --cwd certrace-portal test:unit` — PASS.

- [ ] **Step 4: Wizard UI**

`import-wizard.tsx` (props `{ sheet: Sheet; cells: Record<string, string>; savePatch: (p: CellPatch) => Promise<SyncResult>; onClose(): void }`), a `Modal` with a numbered step strip (1 File · 2 Header row · 3 Columns · 4 Preview), the same pattern as MEASUR's setup tabs:
1. File: `<input type="file" accept=".csv,.xlsx">`. Over 5 MB, `.xls`, or a read error shows the message from the rules. A workbook with several sheets shows a select of sheet names. Next stays disabled until a file has been read (MEASUR Data Exploration, observed at runtime). The footer has Back, Next and "Start over", which clears the file and returns to step 1. Steps already completed in the strip are clickable; later ones are not.
2. Header row: the first 15 rows in a table with a radio per row, preselected with `detectHeaderRow`.
3. Columns: one row per source column: its header, three sample values, and a select of the target sheet's columns plus "Skip". Prefilled with `suggestMapping`. Two source columns on the same target show the error "Each sheet column can be used once" and disable Next.
4. Preview: the first 20 mapped rows using the sheet's column labels, plus "N rows will be added · M empty rows skipped · Imported rows are marked Needs review". Over 5000 data rows: "Only the first 5000 rows will be imported."
5. Import: send `patches` in order through `savePatch`, showing "Importing… x / y". Stop at the first non-`"saved"` result and show "Imported N of M rows. The rest were not saved." Otherwise close and toast "Imported N rows into <sheet name>".

`spreadsheet.tsx`: an "Import from file" button in the toolbar for the active sheet (not for Installation and Documents).

Thai strings: "นำเข้าจากไฟล์", "เลือกแถวหัวตาราง", "จับคู่คอลัมน์", "ตัวอย่างก่อนนำเข้า", "ข้าม", "แต่ละคอลัมน์ของชีตใช้ได้ครั้งเดียว", "แถวที่นำเข้าจะถูกทำเครื่องหมายว่ารอตรวจ", "บันทึกไฟล์เป็น .xlsx หรือ .csv ก่อน".

- [ ] **Step 5: Verify and commit**

Unit tests, typecheck, lint PASS. Manual: export a sheet from Excel as `.xlsx` and as `.csv` (Thai headers), import each into Materials, confirm the rows, the amber tab and that the other browser sees them.

```bash
git add certrace-portal
git commit -m "feat: import Excel or CSV into a workbook sheet"
```

### Task 18: Live panel beside the workspace — completeness, mass balance, emissions estimate

MEASUR shows a results panel next to the form that updates while the user types (`docs/MEASUR-FLOW-REFERENCE.md` §4). For CBAM, three numbers are useful while typing: what is still missing, whether each step's inputs and outputs balance, and roughly how much embedded emission the data adds up to. The estimate reuses the portal's own CBAM factor tables, so it uses the same numbers the declaration engine uses.

**Files:**
- Create: `certrace-portal/lib/workbook/balance.ts`
- Create: `certrace-portal/lib/workbook/estimate.ts`
- Create: `certrace-portal/components/workspace/live-panel.tsx`
- Modify: `certrace-portal/lib/workspace-sheets.ts` (optional `cn` column on the Materials sheet, after `item`)
- Modify: `certrace-portal/components/workspace/spreadsheet.tsx` (panel on the right, collapsible; below the table under 1024 px)
- Test: `certrace-portal/lib/workbook/__tests__/balance.test.ts`, `certrace-portal/lib/workbook/__tests__/estimate.test.ts`

**Interfaces:**
- Consumes: `Sheet` (Task 13); `SHEET_ORDER`, `sheetStatus`, `missingCells`, `STATUS_TONE`, `STATUS_LABEL` (Task 12); `euStandardFor(fuelTypeId, unit)` and `MonthlyFuelUnit` (`lib/cbam/fuel-defaults.ts`, `lib/monthly-data.ts`); `gridFactorFor(country)` (`lib/cbam/electricity-grid-factors.ts`); `defaultFor(cn, country, year)` (`lib/cbam/precursor-basis.ts`).
- Produces:
  - `toTonnes(qty: string, unit: string): number | null`
  - `type StepBalance = { step: string; inT: number; outT: number; diffPct: number | null; ok: boolean; ignored: number }`
  - `massBalance(sheets: Sheet[], tolerance?: number): StepBalance[]` (default tolerance 0.05)
  - `type PrecursorLine = { key: string; item: string; cn: string; tonnes: number; defaultSee: number; step: string }`
  - `type EmissionEstimate = { productionT: number; directT: number; indirectT: number; precursorT: number; totalT: number; perTonne: number | null; byStep: Record<string, { directT: number; indirectT: number; precursorT: number }>; precursors: PrecursorLine[]; unmatched: string[] }`
  - `estimateEmissions(sheets: Sheet[], ctx: { country: string; year: number }): EmissionEstimate`
  - `matchFuel(item: string, unit: string): string | "electricity" | null`

Rules:
- Mass units: `t`, `ton`, `tons`, `tonne`, `tonnes`, `mt` = 1 t; `kg` = 0.001 t; `g` = 0.000001 t. Any other unit is not mass and is counted in `ignored`. Quantities accept a comma thousands separator.
- Balance per step, in Steps order, then any step only rows name: `inT` = Materials rows of the step, `outT` = Output rows of the step (products, by-products and waste all belong in Output). `diffPct = (inT − outT) / inT`, or `null` when `inT = 0`. `ok` = `|diffPct| ≤ tolerance`, or `outT = 0` when `inT = 0`.
- Fuel matching on the Energy item text (first match wins): natural gas / `ng` / ก๊าซธรรมชาติ → `natural_gas`; LPG / ก๊าซหุงต้ม → `lpg`; diesel / ดีเซล → `diesel`; fuel oil / bunker / น้ำมันเตา → `fuel_oil_heavy`; coke → `coke`; coal / ถ่านหิน → `anthracite_bituminous`; biomass / ชีวมวล → `biomass`. Electricity / ไฟฟ้า, or a unit of `kwh`/`mwh`, → `"electricity"`.
- Fuel tCO₂ = qty × `ncvMjPerUnit` / 1000 × `efTco2PerGj`, with the unit mapped onto a `MONTHLY_FUEL_UNITS` member (lower-case; `m³` → `m3`, `litre`/`liter`/`l` → the litre member, `gj` → `GJ`). A unit with no member, or `ncvMjPerUnit === null`, is listed in `unmatched`.
- Electricity tCO₂ = MWh (`kWh / 1000`) × `gridFactorFor(country)?.value`. `null` means the factor is not published yet; the row goes to `unmatched` as "Electricity: no EU grid default for <country> yet".
- Precursors: Materials rows with a `cn` value: `tonnes × defaultFor(cn, undefined, year).total`. `country` is `undefined`, so `defaultFor` returns the unknown-origin default (`source: "unknown_origin"`); the panel says so. These are the lines the what-if (Task 24) lets the user replace with actual values.
- `productionT` = Products rows in tonnes. `perTonne = totalT / productionT`, or `null` when production is 0.
- Process emissions (carbon content × 44/12) need a carbon fraction the workbook does not hold; the panel says "Process emissions not included".
- The panel always carries the badge "Estimate" and the line "EU default factors. Not a declaration figure."

- [ ] **Step 1: Failing tests**

`balance.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { massBalance, toTonnes } from "../balance";
import type { Sheet } from "../../workspace-sheets";

const s = (id: string, rows: Record<string, string>[]): Sheet => ({
  id, code: "", name: id, cols: [],
  rows: rows.map((cells) => ({ cells, status: "confirmed" as const })),
});

test("toTonnes converts mass units and rejects others", () => {
  assert.equal(toTonnes("1,500", "kg"), 1.5);
  assert.equal(toTonnes("2", "Tonnes"), 2);
  assert.equal(toTonnes("10", "MWh"), null);
  assert.equal(toTonnes("abc", "t"), null);
});
test("a step balances within tolerance and flags beyond it", () => {
  const sheets = [
    s("steps", [{ step: "Drawing" }, { step: "Annealing" }]),
    s("materials", [
      { step: "Drawing", item: "Wire rod", qty: "100", unit: "t" },
      { step: "Annealing", item: "Wire", qty: "100", unit: "t" },
      { step: "Annealing", item: "Gas", qty: "50", unit: "MWh" },
    ]),
    s("output", [
      { step: "Drawing", item: "Wire", qty: "97", unit: "t" },
      { step: "Annealing", item: "Wire", qty: "80", unit: "t" },
    ]),
  ];
  const [drawing, annealing] = massBalance(sheets);
  assert.deepEqual(drawing, { step: "Drawing", inT: 100, outT: 97, diffPct: 0.03, ok: true, ignored: 0 });
  assert.equal(annealing!.ok, false);
  assert.equal(annealing!.ignored, 1);
});
```

`estimate.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { estimateEmissions, matchFuel } from "../estimate";
import { euStandardFor } from "../../cbam/fuel-defaults";
import { defaultFor } from "../../cbam/precursor-basis";
import type { Sheet } from "../../workspace-sheets";

const s = (id: string, rows: Record<string, string>[]): Sheet => ({
  id, code: "", name: id, cols: [],
  rows: rows.map((cells) => ({ cells, status: "confirmed" as const })),
});

test("matchFuel reads English and Thai labels", () => {
  assert.equal(matchFuel("ก๊าซธรรมชาติ (NG)", "m3"), "natural_gas");
  assert.equal(matchFuel("Grid power", "kWh"), "electricity");
  assert.equal(matchFuel("Steam from neighbour", "t"), null);
});
// The estimate must equal the portal's own factor tables, not a second copy of them.
test("estimate uses the CBAM factor tables and splits by step", () => {
  const sheets = [
    s("steps", [{ step: "Annealing" }]),
    s("products", [{ cn: "72172000", item: "Wire", qty: "1000", unit: "t" }]),
    s("energy", [
      { step: "Annealing", item: "Natural gas", qty: "1000", unit: "GJ" },
      { step: "Annealing", item: "Mystery fuel", qty: "5", unit: "t" },
    ]),
    s("materials", [{ step: "Annealing", item: "Wire rod", cn: "72139110", qty: "1020", unit: "t" }]),
  ];
  const e = estimateEmissions(sheets, { country: "TH", year: 2026 });
  const gas = euStandardFor("natural_gas", "GJ")!;
  const rod = defaultFor("72139110", undefined, 2026)!;
  assert.ok(Math.abs(e.directT - 1000 * gas.efTco2PerGj) < 1e-9);
  assert.ok(Math.abs(e.precursorT - 1020 * rod.total) < 1e-9);
  assert.equal(e.productionT, 1000);
  assert.ok(Math.abs(e.perTonne! - e.totalT / 1000) < 1e-12);
  assert.deepEqual(e.unmatched, ["Mystery fuel (5 t)"]);
  assert.equal(e.byStep.Annealing!.precursorT, e.precursorT);
  assert.equal(e.precursors[0]!.defaultSee, rod.total);
});
```

`euStandardFor("natural_gas", "GJ")` returns `ncvMjPerUnit = null` because GJ is already energy (see `kgPerUnit`). `estimate.ts` therefore treats a `GJ` quantity as energy directly: `GJ × efTco2PerGj`. The test above covers that path.

Run: FAIL.

- [ ] **Step 2: Implement `balance.ts`**

```ts
import type { Sheet } from "../workspace-sheets";

const MASS: Record<string, number> = { t: 1, ton: 1, tons: 1, tonne: 1, tonnes: 1, mt: 1, kg: 0.001, g: 0.000001 };
export function toTonnes(qty: string, unit: string): number | null {
  const factor = MASS[(unit ?? "").trim().toLowerCase()];
  const n = Number((qty ?? "").replace(/,/g, "").trim());
  return factor === undefined || !qty?.trim() || !Number.isFinite(n) ? null : n * factor;
}

export type StepBalance = { step: string; inT: number; outT: number; diffPct: number | null; ok: boolean; ignored: number };

const rowsOf = (sheets: Sheet[], id: string) => sheets.find((x) => x.id === id)?.rows.map((r) => r.cells) ?? [];
const key = (s: string | undefined) => (s ?? "").trim().toLowerCase();

export function massBalance(sheets: Sheet[], tolerance = 0.05): StepBalance[] {
  const order = new Map<string, string>();
  for (const id of ["steps", "materials", "output"])
    for (const c of rowsOf(sheets, id)) if (c.step?.trim() && !order.has(key(c.step))) order.set(key(c.step), c.step.trim());
  return [...order].map(([k, step]) => {
    let inT = 0, outT = 0, ignored = 0;
    for (const [id, add] of [["materials", (t: number) => (inT += t)], ["output", (t: number) => (outT += t)]] as const)
      for (const c of rowsOf(sheets, id)) {
        if (key(c.step) !== k || !c.qty?.trim()) continue;
        const t = toTonnes(c.qty, c.unit ?? "");
        if (t === null) ignored++;
        else add(t);
      }
    const diffPct = inT > 0 ? Math.round(((inT - outT) / inT) * 1e9) / 1e9 : null;
    return { step, inT, outT, diffPct, ok: diffPct === null ? outT === 0 : Math.abs(diffPct) <= tolerance, ignored };
  });
}
```

- [ ] **Step 3: Implement `estimate.ts`**

```ts
import type { Sheet } from "../workspace-sheets";
import { euStandardFor } from "../cbam/fuel-defaults";
import { gridFactorFor } from "../cbam/electricity-grid-factors";
import { defaultFor } from "../cbam/precursor-basis";
import { MONTHLY_FUEL_UNITS, type MonthlyFuelUnit } from "../monthly-data";
import { toTonnes } from "./balance";

const FUELS: [RegExp, string][] = [
  [/natural gas|\bng\b|ก๊าซธรรมชาติ/i, "natural_gas"],
  [/lpg|ก๊าซหุงต้ม/i, "lpg"],
  [/diesel|ดีเซล/i, "diesel"],
  [/fuel oil|bunker|น้ำมันเตา/i, "fuel_oil_heavy"],
  [/coke/i, "coke"],
  [/coal|ถ่านหิน/i, "anthracite_bituminous"],
  [/biomass|ชีวมวล/i, "biomass"],
];
export function matchFuel(item: string, unit: string): string | "electricity" | null {
  if (/electric|ไฟฟ้า|grid power/i.test(item) || /^(k|m)wh$/i.test(unit.trim())) return "electricity";
  return FUELS.find(([re]) => re.test(item))?.[1] ?? null;
}

const UNIT_ALIAS: Record<string, string> = { "m³": "m3", litre: "l", liter: "l", litres: "l", liters: "l", gj: "GJ" };
function fuelUnit(unit: string): MonthlyFuelUnit | null {
  const u = unit.trim();
  const wanted = UNIT_ALIAS[u.toLowerCase()] ?? u;
  return MONTHLY_FUEL_UNITS.find((m) => m.toLowerCase() === wanted.toLowerCase()) ?? null;
}

export type PrecursorLine = { key: string; item: string; cn: string; tonnes: number; defaultSee: number; step: string };
export type EmissionEstimate = {
  productionT: number; directT: number; indirectT: number; precursorT: number; totalT: number; perTonne: number | null;
  byStep: Record<string, { directT: number; indirectT: number; precursorT: number }>;
  precursors: PrecursorLine[]; unmatched: string[];
};

const num = (v: string | undefined) => Number((v ?? "").replace(/,/g, "").trim());

export function estimateEmissions(sheets: Sheet[], ctx: { country: string; year: number }): EmissionEstimate {
  const rows = (id: string) => sheets.find((x) => x.id === id)?.rows ?? [];
  const e: EmissionEstimate = { productionT: 0, directT: 0, indirectT: 0, precursorT: 0, totalT: 0, perTonne: null, byStep: {}, precursors: [], unmatched: [] };
  const bucket = (step: string | undefined) =>
    (e.byStep[(step ?? "").trim() || "Unassigned step"] ??= { directT: 0, indirectT: 0, precursorT: 0 });

  for (const { cells: c } of rows("products")) e.productionT += toTonnes(c.qty ?? "", c.unit ?? "") ?? 0;

  for (const { cells: c } of rows("energy")) {
    if (!c.item?.trim() || !c.qty?.trim()) continue;
    const label = `${c.item.trim()} (${c.qty.trim()} ${(c.unit ?? "").trim()})`.replace(" )", ")");
    const qty = num(c.qty), fuel = matchFuel(c.item, c.unit ?? "");
    if (!Number.isFinite(qty) || !fuel) { e.unmatched.push(label); continue; }
    if (fuel === "electricity") {
      const factor = gridFactorFor(ctx.country)?.value ?? null;
      if (factor === null) { e.unmatched.push(`Electricity: no EU grid default for ${ctx.country} yet`); continue; }
      const mwh = /^kwh$/i.test((c.unit ?? "").trim()) ? qty / 1000 : qty;
      const t = mwh * factor;
      e.indirectT += t;
      bucket(c.step).indirectT += t;
      continue;
    }
    const unit = fuelUnit(c.unit ?? "");
    const std = unit ? euStandardFor(fuel, unit) : null;
    const gj = !std ? null : unit === "GJ" ? qty : std.ncvMjPerUnit === null ? null : (qty * std.ncvMjPerUnit) / 1000;
    if (gj === null || !std) { e.unmatched.push(label); continue; }
    const t = gj * std.efTco2PerGj;
    e.directT += t;
    bucket(c.step).directT += t;
  }

  rows("materials").forEach(({ cells: c }, i) => {
    if (!c.cn?.trim()) return;
    const tonnes = toTonnes(c.qty ?? "", c.unit ?? "");
    const d = defaultFor(c.cn, undefined, ctx.year);
    if (tonnes === null || !d) { e.unmatched.push(`${c.item ?? c.cn} (CN ${c.cn})`); return; }
    const t = tonnes * d.total;
    e.precursorT += t;
    bucket(c.step).precursorT += t;
    e.precursors.push({ key: `materials:${i}`, item: (c.item ?? "").trim(), cn: c.cn.trim(), tonnes, defaultSee: d.total, step: (c.step ?? "").trim() });
  });

  e.totalT = e.directT + e.indirectT + e.precursorT;
  e.perTonne = e.productionT > 0 ? e.totalT / e.productionT : null;
  return e;
}
```

`MONTHLY_FUEL_UNITS` is `FuelUnit[]` = `"m3" | "kg" | "t" | "l" | "GJ"` (`lib/cbam/units.ts`), so the aliases map onto `l`, `m3` and `GJ`.

Run: PASS.

- [ ] **Step 4: Materials `cn` column and the panel**

`workspace-sheets.ts`: Materials `cols` becomes `[col("step", …), col("item", …), col("cn", "CN code (precursor)", "text", W.step), qty, unit, method, source, status]`. It is not in `REQUIRED.materials`. Old cells keep their keys, so no migration.

`live-panel.tsx` (props `{ sheets: Sheet[]; country: string; year: number; onOpenSheet(id: string): void }`), three `Card`s, each memoised on `sheets`:
1. **Completeness**: one line per sheet in `SHEET_ORDER`: status dot, name, "x rows missing data" (count of `missingCells` rows) or the status label. Clicking a line calls `onOpenSheet`. Header: "n of m sheets complete" with `Progress`.
2. **Mass balance**: table Step · In (t) · Out (t) · Difference. Rows that are not `ok` use the warn colour and the text "Inputs and outputs differ by x %; check losses, scrap or units." A tolerance select (2 %, 5 %, 10 %; default 5 %) is remembered in `localStorage` under `certrace:balance-tolerance`, wrapped in `try/catch`. When any row has `ignored > 0`, add "n rows use non-mass units and are not counted."
3. **Embedded emissions (estimate)**: total tCO₂e, per tonne (or "Add product quantities to see per tonne"), a stacked bar Direct / Indirect / Precursors (three tones from the existing chart palette in `components/insight/kit`), and the lists `unmatched` ("Not counted: …") and "Precursors use the EU default for unknown origin". Footer: "EU default factors. Not a declaration figure. Process emissions not included."

`spreadsheet.tsx`: a grid with the table and a 320 px panel at ≥ 1024 px; under 1024 px the panel sits below the table. A "Hide panel" toggle is remembered the same way under `certrace:live-panel`. Country comes from the scoped installation's `country` field (`lib/installations.ts`), year from the open workbook.

Thai strings: "ความครบถ้วน", "สมดุลมวล", "การปล่อยที่ฝังอยู่ (ประมาณการ)", "ประมาณการ", "ใช้ค่าตั้งต้นของ EU ไม่ใช่ตัวเลขสำหรับยื่น", "ไม่ได้นับ:", "ปัจจัยนำเข้าและผลผลิตต่างกัน x % ตรวจสอบของเสีย เศษ หรือหน่วย".

- [ ] **Step 5: Verify and commit**

Unit tests, typecheck, lint PASS. Manual: type an Annealing input of 100 t and an output of 80 t and watch the balance row turn warn without a reload. Add a Materials row with CN `72139110` and watch the precursor bar grow. At 375 px the panel stacks under the table with no horizontal page scroll.

```bash
git add certrace-portal
git commit -m "feat: live completeness, mass balance and emissions panel in workspace"
```

## Phase 3 — Installation scope, OEM fill-in, team routing

### Task 19: Page-level installation switch on Workspace and Convert

**Files:**
- Create: `certrace-portal/lib/scoped-installation.ts`, `certrace-portal/components/scoped-installation-switcher.tsx`
- Modify: `certrace-portal/components/portal-shell.tsx` (remove `InstallationSwitcher`)
- Delete: `certrace-portal/components/installation-switcher.tsx` (after the shell no longer imports it)
- Modify: `app/(portal)/workspace/**`, `app/(portal)/workspaces/page.tsx`, `app/(portal)/workspaces/new/page.tsx`, `app/(portal)/convert/page.tsx`, `app/(portal)/convert/[id]/page.tsx`
- Modify: `app/(portal)/trace/page.tsx` (aggregate), `app/(portal)/settings/page.tsx` (keep its own installation list; only drop the active-installation dependency if it is used for scope)
- Test: `certrace-portal/lib/__tests__/scoped-installation.test.ts`

**Interfaces:**
- Consumes: `useActiveInstallation()` → `{ options: InstallationChoice[], active, loading, setActive }`; `InstallationChoice = { id, name, self, supplierId? }`.
- Produces:
  - `resolveScoped(options: InstallationChoice[], urlId: string | null, storedId: string | null): InstallationChoice | null` — URL id if it is in `options`; else stored id if in `options`; else the `self` installation; else the first; else null.
  - `useScopedInstallation()` → `{ options, scoped: InstallationChoice | null, loading, setScoped(id: string): void }`. `setScoped` replaces `?installation=` in the URL (`router.replace`, `scroll: false`) and calls `setActive(id)` so the next visit defaults to it.
  - `<ScopedInstallationSwitcher />` — a `select`-style dropdown in the page header showing the installation name and a role chip (Task 20).

- [ ] **Step 1: Failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { resolveScoped } from "../scoped-installation";

const opts = [
  { id: "sup", name: "Supplier", self: false, supplierId: "s1" },
  { id: "own", name: "Rayong", self: true },
  { id: "oem", name: "OEM plant", self: false },
];
// A shared link must open the same installation for every teammate.
test("URL wins over stored choice", () => {
  assert.equal(resolveScoped(opts, "oem", "sup")?.id, "oem");
});
test("unknown URL id falls back to stored, then self, then first", () => {
  assert.equal(resolveScoped(opts, "gone", "sup")?.id, "sup");
  assert.equal(resolveScoped(opts, null, "gone")?.id, "own");
  assert.equal(resolveScoped([opts[0]!], null, null)?.id, "sup");
  assert.equal(resolveScoped([], "x", "y"), null);
});
```

- [ ] **Step 2: Implement**

`lib/scoped-installation.ts`:

```ts
"use client";
import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useActiveInstallation, type InstallationChoice } from "./active-installation";

export function resolveScoped(
  options: InstallationChoice[],
  urlId: string | null,
  storedId: string | null,
): InstallationChoice | null {
  const find = (id: string | null) => (id ? options.find((o) => o.id === id) : undefined);
  return find(urlId) ?? find(storedId) ?? options.find((o) => o.self) ?? options[0] ?? null;
}

export function useScopedInstallation() {
  const { options, active, loading, setActive } = useActiveInstallation();
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const scoped = useMemo(
    () => resolveScoped(options, params.get("installation"), active?.id ?? null),
    [options, params, active],
  );
  const setScoped = useCallback(
    (id: string) => {
      const next = new URLSearchParams(params);
      next.set("installation", id);
      router.replace(`${path}?${next}`, { scroll: false });
      setActive(id);
    },
    [params, path, router, setActive],
  );
  return { options, scoped, loading, setScoped };
}
```

Because the test imports `resolveScoped` under `node:test`, keep it free of React: if the `"use client"` module with Next imports fails to load in the test resolver, move `resolveScoped` into `lib/scoped-installation-core.ts` and re-export it.

Pages using `useSearchParams` need a `<Suspense>` boundary in Next 15; wrap each page's client body in `<Suspense fallback={null}>`.

- [ ] **Step 3: Wire pages**

- Workspace and Convert pages (all routes listed under Files) call `useScopedInstallation()` and pass `scoped?.id ?? null` to `useWorkbookYears` / `useWorkbook` and to Convert (Task 20). Render `<ScopedInstallationSwitcher />` at the right end of the `PageHeader`.
- Links between them keep the scope: every `href` from Workspace to Convert or back appends `?installation=${scoped.id}`.
- `portal-shell.tsx`: remove the global switcher and its import; delete `components/installation-switcher.tsx`.
- Aggregate pages: run `grep -rln "useActiveInstallation" certrace-portal/app`. Every match outside `workspace*` and `convert` must stop filtering by `active` and read across all installations (`options` from `useActiveInstallation()` or the installations list it is built from). For `trace/page.tsx`, show every installation's data with an installation column or group header.

- [ ] **Step 4: Run and commit**

Unit tests, typecheck, lint PASS. Manual: switch installation on Workspace, copy the URL to a second browser signed in as a teammate, same installation opens; Dashboard and Trace show totals across installations.

```bash
git add certrace-portal
git commit -m "feat: installation switch scoped to workspace and convert"
```

### Task 20: OEM installations and live Convert requirements

**Files:**
- Modify: `certrace-portal/lib/installations.ts` (`role` field, `installationRole`)
- Rename: `certrace-portal/lib/convert-mock.ts` → `certrace-portal/lib/convert-standards.ts` (catalogue only: drop `state`, `progress`, `REPORTS`)
- Create: `certrace-portal/lib/convert/requirements.ts`
- Modify: `app/(portal)/convert/page.tsx`, `app/(portal)/convert/[id]/page.tsx`, the installation form in `app/(portal)/settings/page.tsx` and `app/onboarding/setup/page.tsx` (role radio)
- Test: `certrace-portal/lib/convert/__tests__/requirements.test.ts`

**Interfaces:**
- Consumes: `sheetStatus`, `installationSheetStatus` (Tasks 12, 14); `useWorkbook` (Task 13); `useScopedInstallation` (Task 19); `listDeclarations()` from `lib/api/declarations.ts`.
- Produces:
  - `Installation.role?: "own" | "oem" | "supplier"`; `installationRole(i: Installation): "own" | "oem" | "supplier"` = `i.role ?? (i.supplierId ? "supplier" : "own")`.
  - `REQUIREMENT_SOURCES: Record<string, { sheets: string[]; installation?: true; fix: "fill-in" | "smart-link" }>`
  - `liveRequirements(std: Standard, ctx: { installation: Installation | null; sheets: Sheet[] }): LiveRequirement[]` where `LiveRequirement = Requirement & { state: RequirementState; progress: number; href: string | null; fix: "fill-in" | "smart-link" }`
  - `readiness(reqs: LiveRequirement[]): number` (0–100, share complete).

Rules (D9):
- Requirement state from its sources: all `complete` → `complete`; any source `untouched` and none started → `missing`; otherwise `in-progress`. `progress` = complete sources / sources × 100.
- Fix routing by installation role: `own` keeps the catalogue's fix; `oem` turns every `smart-link` fix into `fill-in`, because the account types in the OEM plant's own installation data; `supplier` turns every `fill-in` into `smart-link`, because that data comes from the supplier's form.
- `fill-in` href: `/workspace?installation=<id>&sheet=<first source sheet>` (or `&sheet=installation` when `installation: true`). `smart-link` href: `/smart-links?installation=<id>&request=<requirement id>`.

Source table for the EU CBAM catalogue (the only standard with requirements today; other standards are `status: "soon"` with none):

| Requirement id | Sources | Catalogue fix |
| --- | --- | --- |
| `installation` | installation record | fill-in |
| `goods` | `products` | fill-in |
| `direct` | `energy`, `materials` | fill-in |
| `indirect` | `energy` | fill-in |
| `precursors` | `materials` | smart-link |
| `carbon-price` | `evidence` | fill-in |
| `monitoring` | `steps`, `evidence` | fill-in |
| `communication` | `output`, `products` | smart-link |
| `verification` | `evidence` | fill-in |

- [ ] **Step 1: Failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { liveRequirements, readiness, REQUIREMENT_SOURCES } from "../requirements";
import { STANDARDS, getStandard } from "../../convert-standards";
import type { Sheet } from "../../workspace-sheets";

const sheet = (id: string, rows: Record<string, string>[]): Sheet => ({
  id, code: "", name: id, cols: [],
  rows: rows.map((cells) => ({ cells, status: "confirmed" as const })),
});
const eu = getStandard("eu-cbam")!;

test("every catalogue requirement has a source", () => {
  for (const s of STANDARDS) for (const r of s.requirements) assert.ok(REQUIREMENT_SOURCES[r.id], r.id);
});
test("goods is complete when products rows have all required columns", () => {
  const reqs = liveRequirements(eu, {
    installation: null,
    sheets: [sheet("products", [{ cn: "7217", item: "Wire", qty: "1", unit: "t" }])],
  });
  assert.equal(reqs.find((r) => r.id === "goods")!.state, "complete");
  assert.equal(reqs.find((r) => r.id === "direct")!.state, "missing");
});
// For an OEM plant the exporter types the data in; sending a supplier form would go nowhere.
test("OEM turns smart-link fixes into fill-in links", () => {
  const oem = { id: "p2", name: "OEM", self: false, role: "oem" } as never;
  const r = liveRequirements(eu, { installation: oem, sheets: [] }).find((x) => x.id === "precursors")!;
  assert.equal(r.fix, "fill-in");
  assert.equal(r.href, "/workspace?installation=p2&sheet=materials");
});
test("supplier installations route fill-in to smart links", () => {
  const sup = { id: "p3", name: "Mill", self: false, supplierId: "s1" } as never;
  const r = liveRequirements(eu, { installation: sup, sheets: [] }).find((x) => x.id === "goods")!;
  assert.equal(r.fix, "smart-link");
  assert.equal(r.href, "/smart-links?installation=p3&request=goods");
});
test("readiness is the share of complete requirements", () => {
  const reqs = liveRequirements(eu, { installation: null, sheets: [] });
  assert.equal(readiness(reqs), 0);
});
```

- [ ] **Step 2: Implement**

`lib/installations.ts`: add `role?: "own" | "oem" | "supplier"` to `Installation` and:

```ts
export const installationRole = (i: Pick<Installation, "role" | "supplierId">) =>
  i.role ?? (i.supplierId ? "supplier" : "own");
```

If the installation record goes through a backend shape (check `grep -rn "supplierId" certrace-backend/src`), add `role: { kind: "string", optional: true, enum: ["own", "oem", "supplier"] }` to that shape in the same commit.

`lib/convert-standards.ts`: copy `convert-mock.ts`, remove `state`, `progress` from `Requirement`, remove the `readiness` export and `REPORTS`/`ConvertedReport`. Update imports (`grep -rln convert-mock certrace-portal`), then delete `convert-mock.ts`.

`lib/convert/requirements.ts`:

```ts
import type { Installation } from "../installations";
import { installationRole } from "../installations";
import type { Requirement, RequirementState, Standard } from "../convert-standards";
import type { Sheet } from "../workspace-sheets";
import { installationSheetStatus, sheetStatus, type SheetStatus } from "../workbook/status";

type Fix = "fill-in" | "smart-link";
export const REQUIREMENT_SOURCES: Record<string, { sheets: string[]; installation?: true; fix: Fix }> = {
  installation: { sheets: [], installation: true, fix: "fill-in" },
  goods: { sheets: ["products"], fix: "fill-in" },
  direct: { sheets: ["energy", "materials"], fix: "fill-in" },
  indirect: { sheets: ["energy"], fix: "fill-in" },
  precursors: { sheets: ["materials"], fix: "smart-link" },
  "carbon-price": { sheets: ["evidence"], fix: "fill-in" },
  monitoring: { sheets: ["steps", "evidence"], fix: "fill-in" },
  communication: { sheets: ["output", "products"], fix: "smart-link" },
  verification: { sheets: ["evidence"], fix: "fill-in" },
};

export type LiveRequirement = Requirement & {
  state: RequirementState;
  progress: number;
  href: string | null;
  fix: Fix;
};

function stateOf(statuses: SheetStatus[]): { state: RequirementState; progress: number } {
  const done = statuses.filter((s) => s === "complete").length;
  const progress = statuses.length ? Math.round((done / statuses.length) * 100) : 0;
  if (statuses.length && done === statuses.length) return { state: "complete", progress };
  if (statuses.every((s) => s === "untouched")) return { state: "missing", progress };
  return { state: "in-progress", progress };
}

export function liveRequirements(
  std: Standard,
  ctx: { installation: Installation | null; sheets: Sheet[] },
): LiveRequirement[] {
  const role = ctx.installation ? installationRole(ctx.installation) : "own";
  const byId = new Map(ctx.sheets.map((s) => [s.id, s]));
  return std.requirements.map((req) => {
    const src = REQUIREMENT_SOURCES[req.id] ?? { sheets: [], fix: "fill-in" as Fix };
    const statuses: SheetStatus[] = [
      ...(src.installation ? [installationSheetStatus(ctx.installation)] : []),
      ...src.sheets.map((id) => {
        const s = byId.get(id);
        return s ? sheetStatus(s) : "untouched";
      }),
    ];
    const fix: Fix =
      role === "oem" ? "fill-in" : role === "supplier" ? "smart-link" : src.fix;
    const iid = ctx.installation?.id;
    const sheet = src.installation ? "installation" : src.sheets[0];
    const href = !iid
      ? null
      : fix === "fill-in"
        ? `/workspace?installation=${iid}&sheet=${sheet}`
        : `/smart-links?installation=${iid}&request=${req.id}`;
    return { ...req, ...stateOf(statuses), fix, href };
  });
}

export const readiness = (reqs: LiveRequirement[]) =>
  reqs.length ? Math.round((reqs.filter((r) => r.state === "complete").length / reqs.length) * 100) : 0;
```

Run the test: PASS.

- [ ] **Step 3: Convert UI**

- `convert/page.tsx` and `convert/[id]/page.tsx`: get `scoped` from `useScopedInstallation()`, the full `Installation` record for it from the installations list, the latest workbook year for it (`useWorkbookYears(scoped.id).years[0]`), its `sheets` from `useWorkbook`, then `liveRequirements(standard, { installation, sheets })`. Replace every use of the old mock `state`/`progress`/`readiness`.
- Each requirement row's button: "Fill in" or "Request via Smart Link" from `fix`, `href` from the function; disabled with the hint "Choose an installation" when `href` is null.
- Show the installation role chip next to the switcher: Own plant / OEM plant / Supplier.
- The converted-reports list uses `listDeclarations()` instead of `REPORTS`; map each `Declaration` to the existing row component's props (title, period, status, updated date). If a field the row shows has no counterpart on `Declaration`, drop it from the row.
- Workspace honours `?sheet=<id>` on load by opening that tab.

- [ ] **Step 4: Role in forms**

Add a radio group to the installation form in Settings and in `/onboarding/setup`: "We run this plant" (`own`), "An OEM runs it for us — we enter its data" (`oem`), "A supplier — they fill in a form" (`supplier`). Default `own` for the first installation. The onboarding answer `productionModel = "oem"` (Task 10) preselects `oem` for the next new installation.

- [ ] **Step 5: Export gate (D21)**

Convert stays open while data is incomplete, like MEASUR's Assessment tab only after the baseline is valid, but here only the output is locked. In the Convert workspace footer, the Export and Submit buttons get `disabled={readiness(reqs) < 100}`. When disabled, the button `title` reads `Complete first: ` plus the names of every requirement whose state is not complete, joined by `, `; each name links to its fill-in target from Step 3. Add a test to `lib/convert/__tests__/requirements.test.ts`:

```ts
// Export must never ship a declaration built on missing data, but customers
// must still be able to browse Convert to see what is missing.
test("readiness is 100 only when every requirement is complete", () => {
  const reqs = [
    { id: "a", state: "complete" },
    { id: "b", state: "missing" },
  ] as Parameters<typeof readiness>[0];
  assert.ok(readiness(reqs) < 100);
  assert.equal(readiness(reqs.slice(0, 1)), 100);
});
```

Match the requirement object shape to the type Step 2 defines; only `state` matters here.

- [ ] **Step 6: Run and commit**

Unit tests, typecheck, lint PASS.

```bash
git add certrace-portal certrace-backend
git commit -m "feat: live convert requirements with OEM fill-in routing"
```

### Task 21: Team member or Smart Link — one entry point

**Files:**
- Create: `certrace-portal/lib/api/team.ts`
- Create: `certrace-portal/components/request-data-modal.tsx`
- Modify: `certrace-portal/components/company-team.tsx:78-90` (use `sendInvite`)
- Modify: `certrace-portal/components/add-member-modal.tsx` (optional "Invite to the portal" checkbox that calls `sendInvite`)
- Modify: `certrace-portal/app/(portal)/smart-links/page.tsx:162-165` (header action)
- Modify: `certrace-portal/app/(portal)/suppliers/page.tsx` (honour `?add=1`)
- Test: `certrace-portal/lib/__tests__/request-route.test.ts`

**Interfaces:**
- Consumes: backend `POST /api/v1/team/invitations { email }` → `{ delivered: boolean, ... }` (exists, owner only via `companySession`); `api()` and `result()` from `lib/api`.
- Produces:
  - `sendInvite(email: string): Promise<{ delivered: boolean }>`
  - `requestRoute(answer: "internal" | "external", ctx: { isOwner: boolean }): { kind: "invite" } | { kind: "ask-owner" } | { kind: "supplier"; href: "/suppliers?add=1" }`
  - `<RequestDataModal open onClose />`

Rule (D10): people inside the company edit the workbook as team editors; people outside fill in a Smart Link form. Only the owner can invite, so an editor who answers "internal" is told to ask the owner.

- [ ] **Step 1: Failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { requestRoute } from "../request-route";

// Same-company staff must never receive a supplier form: they would type the
// data twice and the workbook would not show it.
test("internal person goes to the team invite", () => {
  assert.deepEqual(requestRoute("internal", { isOwner: true }), { kind: "invite" });
});
test("editors cannot invite, so they are told to ask the owner", () => {
  assert.deepEqual(requestRoute("internal", { isOwner: false }), { kind: "ask-owner" });
});
test("outside supplier goes to the precursor link flow", () => {
  assert.deepEqual(requestRoute("external", { isOwner: false }), { kind: "supplier", href: "/suppliers?add=1" });
});
```

- [ ] **Step 2: Implement**

`lib/request-route.ts`:

```ts
export type RequestRoute =
  | { kind: "invite" }
  | { kind: "ask-owner" }
  | { kind: "supplier"; href: "/suppliers?add=1" };

export function requestRoute(
  answer: "internal" | "external",
  ctx: { isOwner: boolean },
): RequestRoute {
  if (answer === "external") return { kind: "supplier", href: "/suppliers?add=1" };
  return ctx.isOwner ? { kind: "invite" } : { kind: "ask-owner" };
}
```

`lib/api/team.ts`:

```ts
import { api, result } from "./index";

export const sendInvite = (email: string) =>
  result(api().api.v1.team.invitations.post({ email: email.trim().toLowerCase() }));
```

Check `lib/api/index.ts` exports `api` and `result` under these names (`grep -n "export" certrace-portal/lib/api/index.ts`); `company-team.tsx` already uses them.

Replace the inline call in `company-team.tsx` with `await sendInvite(email)`.

`components/request-data-modal.tsx` uses `Modal`, `Button`, `Field`, `inputClass` from `@/components/ui`:
1. Step "who": title "Who should provide this data?", two large radio cards — "Someone in our company (factory, engineering, accounting)" → `internal`; "An outside supplier of precursors or materials" → `external`. Body line under each: "They get a portal login and edit the workspace with you" / "They get a secure form link; no login".
2. On Next: `const r = requestRoute(answer, { isOwner })` where `isOwner` comes from `companyDirectory().isOwner` (`lib/account-storage.ts`).
   - `invite`: show an email field and "Send invitation"; on submit `await sendInvite(email)`; flash "Invitation sent to …" or "Invitation saved. Check delivery before asking them to join." when `delivered` is false; close.
   - `ask-owner`: text "Only the company owner can add team members. Ask them to invite this person from Team." and a Close button.
   - `supplier`: `router.push(r.href)`.
3. Errors from `sendInvite` show `errorMessage(err)` from `lib/api/errors.ts` (check the exported name) under the field.

Smart Links page: pass `actions={<Button onClick={() => setRequestOpen(true)}><Plus size={15} strokeWidth={1.5} /> {t("Request data")}</Button>}` to `PageHeader` (check `PageHeader`'s prop name for the right-side slot in `components/ui`), and render `<RequestDataModal open={requestOpen} onClose={() => setRequestOpen(false)} />`.

Suppliers page: read `useSearchParams().get("add") === "1"` on mount and open the existing "Add supplier" form; wrap the client body in `<Suspense fallback={null}>`.

`add-member-modal.tsx`: add a checkbox "Also invite them to sign in and edit the workspace" (default off). When checked and the current user is owner, call `sendInvite(email)` after `addTeamMember`; show the result line.

Add Thai strings for every new English string to `lib/i18n-th.ts`.

- [ ] **Step 3: Run and commit**

Unit tests, typecheck, lint PASS. Manual: as owner, Request data → internal → invite arrives (dev mail log); as editor, internal → "ask the owner"; external → suppliers add form opens.

```bash
git add certrace-portal
git commit -m "feat: route internal people to team invite and suppliers to smart links"
```

## Phase 4 — Factory profile, factory map, CBAM what-if, opportunities

MEASUR's flow, carried over without its energy formulas (`docs/MEASUR-FLOW-REFERENCE.md`): inventories become the factory profile (Task 22), the directory dashboard becomes installation cards with a live factory map (Task 23), "modify conditions" becomes a CBAM cost what-if (Task 24), and Treasure Hunt becomes an opportunity list with a report (Task 25). Every number comes from `lib/cbam/*` or the workbook. Nothing in this phase models boilers, furnaces or energy losses.

### Task 22: Factory profile per installation (processes, emission sources, meters, production)

MEASUR keeps equipment inventories apart from assessments. Certrace needs the same register for CBAM monitoring: which processes sit inside the installation boundary, which emission source belongs to which process, what measures each source and who owns the number, and how much was produced each month. Verifiers ask for exactly this list; today it lives in nobody's system.

**Files:**
- Create: `certrace-portal/lib/factory/profile.ts`
- Create: `certrace-portal/lib/factory/store.ts`
- Create: `certrace-portal/components/factory/factory-profile.tsx`
- Modify: `certrace-backend/src/modules/team/records.ts` (`sharedRecord` shares `certrace:factory:`)
- Modify: `certrace-portal/components/workspace/spreadsheet.tsx` (view toggle "Table | Flow | Factory")
- Test: `certrace-portal/lib/factory/__tests__/profile.test.ts`; backend: add a case to the file that tests `sharedRecord` (`grep -rln sharedRecord certrace-backend/test`)

**Interfaces:**
- Consumes: `accountStorage`, `flushAccount` (`lib/account-storage.ts`); `ProcessStep`, `PROCESS_STEPS`, `PROCESS_STEP_LABEL`, `PROCESS_STEP_HINT` (`lib/cbam/boundary.ts`); `stepNames(cells)` (Task 16); `useScopedInstallation` (Task 19) for the installation in Workspace.
- Produces:
  - `type ProcessRow = { id: string; name: string; step: ProcessStep | "other"; route: string; inBoundary: boolean; note: string }`
  - `type SourceKind = "combustion" | "process" | "electricity" | "other"`
  - `type SourceRow = { id: string; name: string; kind: SourceKind; processId: string; fuel: string; tag: string }`
  - `type MeterFrequency = "continuous" | "daily" | "weekly" | "monthly" | "per-delivery" | "annual"`
  - `type MeterRow = { id: string; name: string; measures: string; sourceId: string; owner: string; frequency: MeterFrequency; evidence: string; calibratedUntil: string }` (`calibratedUntil` is `""` or `YYYY-MM-DD`)
  - `type ProductionRow = { month: string; product: string; tonnes: number }` (`month` = `YYYY-MM`)
  - `type FactoryProfile = { version: 1; processes: ProcessRow[]; sources: SourceRow[]; meters: MeterRow[]; production: ProductionRow[]; updatedAt: string }`
  - `PROFILE_LIMITS = { processes: 50, sources: 200, meters: 200, production: 600, text: 120 }`
  - `emptyProfile(): FactoryProfile`
  - `validateProfile(data: unknown): { ok: true; data: FactoryProfile } | { ok: false; errors: string[] }` — each message starts with a field path, e.g. `"sources.2.processId: pick the process this source belongs to"`.
  - `type FactoryGap = { key: string; group: "processes" | "sources" | "meters" | "production"; message: string; refId?: string }`
  - `factoryGaps(p: FactoryProfile, year: number, today?: string): FactoryGap[]`
  - `factoryProgress(p: FactoryProfile, year: number): { done: number; total: number; pct: number }`
  - `productionMismatch(p: FactoryProfile, year: number, workbookTonnes: number): number | null` — relative difference between the profile's yearly production and the workbook Products total, `null` when either is 0.
  - `processesFromSteps(p: FactoryProfile, names: string[]): FactoryProfile` — adds a `ProcessRow` (`step: "other"`, `inBoundary: true`) for each name not already present (trimmed, case-insensitive).
  - `factoryKey(installationId: string) = "certrace:factory:" + installationId`
  - `readFactory(installationId: string): FactoryProfile` (stored value when valid, else `emptyProfile()`); `saveFactory(installationId: string, p: FactoryProfile): Promise<void>`

Gap rules (`factoryGaps`, in this order; `key` is stable so Task 25 can track it):
1. No process: `processes:none` "Add the processes inside the installation boundary."
2. Each in-boundary process with no source: `processes:<id>:no-source` "<name> has no emission source."
3. Each source with no meter whose `sourceId` points at it: `sources:<id>:no-meter` "<name> has no meter or data source."
4. Each meter with no owner: `meters:<id>:owner` "Who reads <name>?"
5. Each meter with `calibratedUntil` set and earlier than `today` (default: today's date): `meters:<id>:calibration` "<name> calibration expired on <date>."
6. Each month of `year` with no production row: one gap `production:<year>` "Production missing for: Jan, Mar …" listing the month names in order.

`factoryProgress`: `total` = the number of checks that could produce a gap (1 + in-boundary processes + sources + 2 × meters + 12), `done = total − gaps counted per check` (the production gap counts once per missing month).

- [ ] **Step 1: Failing tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyProfile, factoryGaps, factoryKey, factoryProgress, processesFromSteps, productionMismatch, validateProfile,
  type FactoryProfile,
} from "../profile";

const months = (year: number, n: number) =>
  Array.from({ length: n }, (_, i) => ({ month: `${year}-${String(i + 1).padStart(2, "0")}`, product: "Wire", tonnes: 100 }));

const full: FactoryProfile = {
  version: 1,
  processes: [{ id: "p1", name: "Annealing", step: "other", route: "", inBoundary: true, note: "" }],
  sources: [{ id: "s1", name: "Annealing furnace burner", kind: "combustion", processId: "p1", fuel: "Natural gas", tag: "F-01" }],
  meters: [{ id: "m1", name: "Gas meter GM-1", measures: "Natural gas m3", sourceId: "s1", owner: "Utility team", frequency: "monthly", evidence: "PTT invoice", calibratedUntil: "2027-06-30" }],
  production: months(2026, 12),
  updatedAt: "",
};

test("factory key is per installation", () => {
  assert.equal(factoryKey("inst-1"), "certrace:factory:inst-1");
});
test("a complete profile has no gaps and 100 % progress", () => {
  assert.deepEqual(factoryGaps(full, 2026, "2026-11-11"), []);
  assert.equal(factoryProgress(full, 2026).pct, 100);
});
test("gaps follow the monitoring chain process, source, meter, production", () => {
  const p: FactoryProfile = {
    ...full,
    sources: [...full.sources, { id: "s2", name: "Pickling acid", kind: "process", processId: "p1", fuel: "", tag: "" }],
    meters: [{ ...full.meters[0]!, owner: "", calibratedUntil: "2026-01-31" }],
    production: months(2026, 10).filter((r) => r.month !== "2026-03"),
  };
  assert.deepEqual(
    factoryGaps(p, 2026, "2026-11-11").map((g) => g.key),
    ["sources:s2:no-meter", "meters:m1:owner", "meters:m1:calibration", "production:2026"],
  );
  assert.match(factoryGaps(p, 2026, "2026-11-11").at(-1)!.message, /Mar, Nov, Dec/);
});
test("an empty profile asks for processes first", () => {
  assert.equal(factoryGaps(emptyProfile(), 2026)[0]!.key, "processes:none");
});
test("validation rejects a source that points at no process", () => {
  const bad = validateProfile({ ...full, sources: [{ ...full.sources[0]!, processId: "missing" }] });
  assert.equal(bad.ok, false);
  assert.match((bad as { errors: string[] }).errors.join(), /^sources\.0\.processId/);
});
test("validation rejects a bad month and negative tonnes", () => {
  const bad = validateProfile({ ...full, production: [{ month: "2026-13", product: "Wire", tonnes: -1 }] });
  assert.equal(bad.ok, false);
  assert.equal((bad as { errors: string[] }).errors.length, 2);
});
test("production mismatch compares the year total with the workbook", () => {
  assert.equal(productionMismatch(full, 2026, 1000), 0.2);
  assert.equal(productionMismatch(emptyProfile(), 2026, 1000), null);
});
test("processesFromSteps adds only new names", () => {
  const next = processesFromSteps(full, ["annealing", "Drawing"]);
  assert.deepEqual(next.processes.map((p) => p.name), ["Annealing", "Drawing"]);
});
```

Backend, in the `sharedRecord` test file:

```ts
// Team editors must see the same factory profile and opportunity list as the owner.
test("factory and opportunity records are shared with the company", () => {
  expect(sharedRecord("certrace:factory:abc")).toBe(true);
  expect(sharedRecord("certrace:opportunities")).toBe(true);
});
```

Run: `bun run --cwd certrace-portal test:unit` and `bun test --cwd certrace-backend` — FAIL.

- [ ] **Step 2: Implement `records.ts`**

Add `key.startsWith("certrace:factory:") || key === "certrace:opportunities" ||` to `sharedRecord`. (Task 25 uses the second key; sharing both here keeps one backend change.)

- [ ] **Step 3: Implement `profile.ts`**

```ts
import { PROCESS_STEPS, type ProcessStep } from "../cbam/boundary";

export type ProcessRow = { id: string; name: string; step: ProcessStep | "other"; route: string; inBoundary: boolean; note: string };
export type SourceKind = "combustion" | "process" | "electricity" | "other";
export type SourceRow = { id: string; name: string; kind: SourceKind; processId: string; fuel: string; tag: string };
export type MeterFrequency = "continuous" | "daily" | "weekly" | "monthly" | "per-delivery" | "annual";
export type MeterRow = { id: string; name: string; measures: string; sourceId: string; owner: string; frequency: MeterFrequency; evidence: string; calibratedUntil: string };
export type ProductionRow = { month: string; product: string; tonnes: number };
export type FactoryProfile = { version: 1; processes: ProcessRow[]; sources: SourceRow[]; meters: MeterRow[]; production: ProductionRow[]; updatedAt: string };
export type FactoryGap = { key: string; group: "processes" | "sources" | "meters" | "production"; message: string; refId?: string };

export const PROFILE_LIMITS = { processes: 50, sources: 200, meters: 200, production: 600, text: 120 };
const KINDS: SourceKind[] = ["combustion", "process", "electricity", "other"];
const FREQUENCIES: MeterFrequency[] = ["continuous", "daily", "weekly", "monthly", "per-delivery", "annual"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const emptyProfile = (): FactoryProfile => ({ version: 1, processes: [], sources: [], meters: [], production: [], updatedAt: "" });
export const factoryKey = (installationId: string) => `certrace:factory:${installationId}`;
const norm = (s: string) => s.trim().toLowerCase();

export function validateProfile(data: unknown): { ok: true; data: FactoryProfile } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const d = data as Partial<FactoryProfile> | null;
  if (!d || typeof d !== "object" || d.version !== 1) return { ok: false, errors: ["version: unsupported factory profile"] };
  const list = <T,>(name: keyof typeof PROFILE_LIMITS, v: unknown): T[] => {
    if (!Array.isArray(v)) { errors.push(`${name}: must be a list`); return []; }
    if (v.length > PROFILE_LIMITS[name]) errors.push(`${name}: at most ${PROFILE_LIMITS[name]} rows`);
    return v as T[];
  };
  const text = (path: string, v: unknown, required = false) => {
    if (typeof v !== "string") return errors.push(`${path}: must be text`);
    if (required && !v.trim()) return errors.push(`${path}: required`);
    if (v.length > PROFILE_LIMITS.text) errors.push(`${path}: at most ${PROFILE_LIMITS.text} characters`);
  };
  const processes = list<ProcessRow>("processes", d.processes);
  const sources = list<SourceRow>("sources", d.sources);
  const meters = list<MeterRow>("meters", d.meters);
  const production = list<ProductionRow>("production", d.production);
  const processIds = new Set(processes.map((p) => p.id));
  const sourceIds = new Set(sources.map((s) => s.id));
  processes.forEach((p, i) => {
    text(`processes.${i}.name`, p.name, true);
    if (p.step !== "other" && !PROCESS_STEPS.includes(p.step)) errors.push(`processes.${i}.step: unknown process step`);
    text(`processes.${i}.route`, p.route);
    text(`processes.${i}.note`, p.note);
    if (typeof p.inBoundary !== "boolean") errors.push(`processes.${i}.inBoundary: must be yes or no`);
  });
  sources.forEach((s, i) => {
    text(`sources.${i}.name`, s.name, true);
    if (!KINDS.includes(s.kind)) errors.push(`sources.${i}.kind: unknown source type`);
    if (!processIds.has(s.processId)) errors.push(`sources.${i}.processId: pick the process this source belongs to`);
    text(`sources.${i}.fuel`, s.fuel);
    text(`sources.${i}.tag`, s.tag);
  });
  meters.forEach((m, i) => {
    text(`meters.${i}.name`, m.name, true);
    text(`meters.${i}.measures`, m.measures);
    if (!sourceIds.has(m.sourceId)) errors.push(`meters.${i}.sourceId: pick the source this meter measures`);
    text(`meters.${i}.owner`, m.owner);
    if (!FREQUENCIES.includes(m.frequency)) errors.push(`meters.${i}.frequency: unknown frequency`);
    text(`meters.${i}.evidence`, m.evidence);
    if (m.calibratedUntil !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(m.calibratedUntil ?? ""))
      errors.push(`meters.${i}.calibratedUntil: use a date`);
  });
  production.forEach((r, i) => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(r.month ?? "")) errors.push(`production.${i}.month: use YYYY-MM`);
    text(`production.${i}.product`, r.product, true);
    if (typeof r.tonnes !== "number" || !Number.isFinite(r.tonnes) || r.tonnes < 0)
      errors.push(`production.${i}.tonnes: must be 0 or more`);
  });
  return errors.length ? { ok: false, errors } : { ok: true, data: { ...(d as FactoryProfile), updatedAt: String(d.updatedAt ?? "") } };
}

const missingMonths = (p: FactoryProfile, year: number) =>
  MONTH_NAMES.filter((_, i) => !p.production.some((r) => r.month === `${year}-${String(i + 1).padStart(2, "0")}`));

export function factoryGaps(p: FactoryProfile, year: number, today = new Date().toISOString().slice(0, 10)): FactoryGap[] {
  const gaps: FactoryGap[] = [];
  if (!p.processes.length) gaps.push({ key: "processes:none", group: "processes", message: "Add the processes inside the installation boundary." });
  for (const proc of p.processes.filter((x) => x.inBoundary))
    if (!p.sources.some((s) => s.processId === proc.id))
      gaps.push({ key: `processes:${proc.id}:no-source`, group: "processes", message: `${proc.name} has no emission source.`, refId: proc.id });
  for (const s of p.sources)
    if (!p.meters.some((m) => m.sourceId === s.id))
      gaps.push({ key: `sources:${s.id}:no-meter`, group: "sources", message: `${s.name} has no meter or data source.`, refId: s.id });
  for (const m of p.meters) {
    if (!m.owner.trim()) gaps.push({ key: `meters:${m.id}:owner`, group: "meters", message: `Who reads ${m.name}?`, refId: m.id });
    if (m.calibratedUntil && m.calibratedUntil < today)
      gaps.push({ key: `meters:${m.id}:calibration`, group: "meters", message: `${m.name} calibration expired on ${m.calibratedUntil}.`, refId: m.id });
  }
  const missing = missingMonths(p, year);
  if (missing.length) gaps.push({ key: `production:${year}`, group: "production", message: `Production missing for: ${missing.join(", ")}` });
  return gaps;
}

export function factoryProgress(p: FactoryProfile, year: number) {
  const total = 1 + p.processes.filter((x) => x.inBoundary).length + p.sources.length + 2 * p.meters.length + 12;
  const gaps = factoryGaps(p, year);
  const missed = gaps.filter((g) => g.group !== "production").length + missingMonths(p, year).length;
  const done = total - missed;
  return { done, total, pct: Math.round((done / total) * 100) };
}

export function productionMismatch(p: FactoryProfile, year: number, workbookTonnes: number) {
  const profileT = p.production.filter((r) => r.month.startsWith(`${year}-`)).reduce((a, r) => a + r.tonnes, 0);
  if (!profileT || !workbookTonnes) return null;
  return Math.round((Math.abs(profileT - workbookTonnes) / workbookTonnes) * 1e9) / 1e9;
}

export function processesFromSteps(p: FactoryProfile, names: string[]): FactoryProfile {
  const known = new Set(p.processes.map((x) => norm(x.name)));
  const added: ProcessRow[] = [];
  for (const name of names)
    if (name.trim() && !known.has(norm(name))) {
      known.add(norm(name));
      added.push({ id: crypto.randomUUID(), name: name.trim(), step: "other", route: "", inBoundary: true, note: "" });
    }
  return added.length ? { ...p, processes: [...p.processes, ...added] } : p;
}
```

In `full` the 12-month production totals 1200 t, so `productionMismatch(full, 2026, 1000)` = 0.2, as tested. `processesFromSteps` uses the global `crypto.randomUUID()`, which Node ≥ 19 and every supported browser provide.

- [ ] **Step 4: Implement `store.ts`**

```ts
import { accountStorage, flushAccount } from "../account-storage";
import { emptyProfile, factoryKey, validateProfile, type FactoryProfile } from "./profile";

export function readFactory(installationId: string): FactoryProfile {
  try {
    const raw = accountStorage.getItem(factoryKey(installationId));
    const parsed = raw ? validateProfile(JSON.parse(raw)) : null;
    return parsed?.ok ? parsed.data : emptyProfile();
  } catch {
    return emptyProfile();
  }
}

export async function saveFactory(installationId: string, p: FactoryProfile) {
  const checked = validateProfile(p);
  if (!checked.ok) throw new Error(checked.errors.join("; "));
  accountStorage.setItem(factoryKey(installationId), JSON.stringify({ ...checked.data, updatedAt: new Date().toISOString() }));
  await flushAccount();
}
```


`accountStorage.getItem/setItem` and `flushAccount()` are the existing exports of `lib/account-storage.ts`.


Run: unit tests and backend tests — PASS.

- [ ] **Step 5: `factory-profile.tsx` and the Workspace view**

Props `{ installationId: string; year: number; cells: Record<string, string> }`. Layout, MEASUR inventory style (one table per register, each row editable in place):
- A `Segmented` with four tabs: **Processes · Emission sources · Meters and data · Production**. Each tab label carries a status dot: green when that group has no gap, amber otherwise.
- Above the tabs: `Progress` with `factoryProgress(...)` ("x of y checks done") and the gap list (`factoryGaps`), each gap a button that switches to its tab and focuses the row with `refId`.
- Processes table: Name · Process step (select of `PROCESS_STEPS` with `PROCESS_STEP_LABEL`, plus "Other"; the option's `title` is `PROCESS_STEP_HINT`) · Route · Inside boundary (checkbox) · Note. Toolbar button "Import steps from workbook" calls `processesFromSteps(profile, stepNames(cells))`.
- Emission sources: Name · Type (combustion, process, electricity, other) · Process (select of processes) · Fuel or material · Tag.
- Meters and data: Name · What it measures · Source (select) · Owner · Frequency · Evidence · Calibrated until (date input).
- Production: Month (`<input type="month">`) · Product · Tonnes; toolbar button "Add the 12 months of <year>" adds empty rows for the missing months with tonnes 0, and a hint under the table when `productionMismatch` > 0.05: "Production here differs from the Products sheet by x %."
- Save: one "Save factory profile" button, disabled while saving. Validation messages map to cells by their path prefix (`sources.2.processId`) and show under the cell. On success flash "Factory profile saved". On error keep the edits on screen.
- Deleting a process that sources point at asks "Delete <name> and its n sources?"; deleting a source with meters asks the same.
- Each table has an empty state explaining what belongs there, e.g. Meters: "Add every meter, invoice or log the numbers come from: gas meter, electricity bill, weighbridge."

`spreadsheet.tsx`: the view toggle from Task 15 becomes "Table | Flow | Factory". Factory renders `FactoryProfile` for the scoped installation.

Thai strings: "โปรไฟล์โรงงาน", "กระบวนการ", "แหล่งปล่อย", "มิเตอร์และแหล่งข้อมูล", "การผลิต", "อยู่ในขอบเขต", "นำเข้าขั้นตอนจากเวิร์กบุ๊ก", "ใครเป็นผู้อ่านค่า", "หมดอายุการสอบเทียบ", "ยังไม่มีข้อมูลการผลิตเดือน:", "บันทึกโปรไฟล์โรงงาน".

- [ ] **Step 6: Verify and commit**

Unit tests, backend tests, typecheck, lint PASS. Manual: owner fills one process, source and meter; a team editor sees them after reload; an expired calibration date turns the Meters dot amber.

```bash
git add certrace-portal certrace-backend
git commit -m "feat: factory profile per installation with monitoring gaps"
```

### Task 23: Installation directory and factory map on the dashboard

MEASUR opens on a directory: each folder shows its assessments, diagrams and inventories as cards. Certrace's folders are installations. The simulator the user asked for is a factory map: the flow diagram from Task 15 coloured by data status and annotated with the estimated tCO₂e per step, so one look shows where the factory's emissions and its missing data sit.

**Files:**
- Create: `certrace-portal/lib/factory/map.ts`
- Create: `certrace-portal/components/factory/installation-directory.tsx`
- Create: `certrace-portal/components/factory/factory-map.tsx`
- Modify: `certrace-portal/app/(portal)/dashboard/page.tsx` (directory section above the existing panels; map below it)
- Test: `certrace-portal/lib/factory/__tests__/map.test.ts`

**Interfaces:**
- Consumes: `buildFlow`, `FlowNode`, `FlowEdge` (Task 15); `FlowDiagram` with `nodeTone`, `nodeBadge`, `onSelect` (Task 16); `useWorkbook(iid, year)` and `useWorkbookYears(iid)` (Task 13); `sheetStatus`, `STATUS_TONE`, `STATUS_LABEL` (Task 12); `estimateEmissions`, `EmissionEstimate` (Task 18); `massBalance` (Task 18); `readFactory`, `factoryProgress`, `factoryGaps` (Task 22); `useActiveInstallation().options` (Task 19, all installations: the dashboard is an aggregate page, D8); `Installation.country` (`lib/installations.ts`).
- Produces:
  - `type MapStatus = "ok" | "warn" | "err" | "muted"`
  - `type MapNode = FlowNode & { status: MapStatus; tCO2e: number | null; gaps: string[] }`
  - `buildFactoryMap(sheets: Sheet[], estimate: EmissionEstimate, balance: StepBalance[]): { nodes: MapNode[]; edges: FlowEdge[]; width: number; height: number; tone: Record<string, string>; badge: Record<string, string> }`

Map rules:
- Start from `buildFlow(sheets)`.
- Step node: `tCO2e` = `estimate.byStep[label]` direct + indirect + precursor (`null` when the step has no entry). `gaps` = missing-cell messages of rows that name this step (from `missingCells` on materials, energy, output) plus the mass-balance message when that step is not `ok`. Status: `err` when any row of the step is missing required data (`missingCells`, Task 12), `warn` when only the balance fails or a row is `review`, `ok` when it has rows and no gap, `muted` when no row names it.
- Material, energy, output and product nodes take the status of the sheet row they come from: `err` missing required data, `warn` `review`, `ok` otherwise.
- `tone[id]` = the status colour from Global Constraints (`ok #16a34a`, `warn #b45309`, `err #dc2626`, `muted #c7c5be`). `badge[id]` = `"<n> t CO₂e"` rounded to 1 decimal for steps with a value; nothing otherwise.

- [ ] **Step 1: Failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildFactoryMap } from "../map";
import { massBalance } from "../../workbook/balance";
import type { EmissionEstimate } from "../../workbook/estimate";
import type { Sheet } from "../../workspace-sheets";

const s = (id: string, rows: { cells: Record<string, string>; status?: "confirmed" | "review" }[]): Sheet => ({
  id, code: "", name: id, cols: [],
  rows: rows.map((r) => ({ cells: r.cells, status: r.status ?? "confirmed" })),
});
const estimate: EmissionEstimate = {
  productionT: 0, directT: 12.34, indirectT: 0, precursorT: 0, totalT: 12.34, perTonne: null,
  byStep: { Annealing: { directT: 12.34, indirectT: 0, precursorT: 0 } }, precursors: [], unmatched: [],
};

test("steps carry status colour and tCO2e badge", () => {
  const sheets = [
    s("steps", [{ cells: { step: "Drawing" } }, { cells: { step: "Annealing" } }]),
    s("materials", [
      { cells: { step: "Drawing", item: "Wire rod", qty: "100", unit: "t", method: "Measured", source: "Weighbridge", status: "confirmed" } },
      { cells: { step: "Annealing", item: "Wire", qty: "100", unit: "t", method: "Measured", source: "Log", status: "confirmed" } },
    ]),
    s("output", [
      { cells: { step: "Drawing", item: "Wire", qty: "99", unit: "t", method: "Measured", source: "Log", status: "confirmed" } },
      { cells: { step: "Annealing", item: "Wire", qty: "70", unit: "t", method: "Measured", source: "Log", status: "confirmed" } },
    ]),
  ];
  const map = buildFactoryMap(sheets, estimate, massBalance(sheets));
  const drawing = map.nodes.find((n) => n.kind === "step" && n.label === "Drawing")!;
  const annealing = map.nodes.find((n) => n.kind === "step" && n.label === "Annealing")!;
  assert.equal(drawing.status, "ok");
  assert.equal(drawing.tCO2e, null);
  assert.equal(annealing.status, "warn");
  assert.equal(annealing.tCO2e, 12.34);
  assert.equal(map.badge[annealing.id], "12.3 t CO₂e");
  assert.equal(map.tone[annealing.id], "#b45309");
  assert.match(annealing.gaps.join(), /differ/);
});
test("a step that only rows name is muted until it has data", () => {
  const map = buildFactoryMap([s("steps", [{ cells: { step: "Packing" } }])], { ...estimate, byStep: {} }, []);
  assert.equal(map.nodes.find((n) => n.label === "Packing")!.status, "muted");
});
```

The rows fill every column of `REQUIRED.materials` and `REQUIRED.output` from Task 12 (`step, item, qty, unit`), so they count as complete.

Run: FAIL.

- [ ] **Step 2: Implement `map.ts`**

```ts
import { buildFlow, type FlowEdge, type FlowNode } from "../workbook/flow";
import { missingCells } from "../workbook/status";
import type { EmissionEstimate } from "../workbook/estimate";
import type { StepBalance } from "../workbook/balance";
import type { Sheet } from "../workspace-sheets";

export type MapStatus = "ok" | "warn" | "err" | "muted";
export type MapNode = FlowNode & { status: MapStatus; tCO2e: number | null; gaps: string[] };
const TONE: Record<MapStatus, string> = { ok: "#16a34a", warn: "#b45309", err: "#dc2626", muted: "#c7c5be" };
const key = (s: string | undefined) => (s ?? "").trim().toLowerCase();

export function buildFactoryMap(sheets: Sheet[], estimate: EmissionEstimate, balance: StepBalance[]) {
  const flow = buildFlow(sheets);
  const rowsFor = new Map<string, { missing: string[]; review: boolean }>();
  const itemStatus = new Map<string, MapStatus>();
  for (const id of ["materials", "energy", "output", "products"]) {
    const sheet = sheets.find((x) => x.id === id);
    if (!sheet) continue;
    const missing = new Map(missingCells(sheet).map((m) => [m.row, m.cols]));
    sheet.rows.forEach((r, i) => {
      const cols = missing.get(i) ?? [];
      const review = r.status === "review" || r.cells.status === "review";
      const status: MapStatus = cols.length ? "err" : review ? "warn" : "ok";
      const item = key(r.cells.item);
      if (item) itemStatus.set(`${id}:${item}`, worst(itemStatus.get(`${id}:${item}`), status));
      if (id === "products") return;
      const step = key(r.cells.step);
      const entry = rowsFor.get(step) ?? { missing: [], review: false };
      if (cols.length) entry.missing.push(`${sheet.name} row ${i + 1}: ${cols.join(", ")} missing`);
      entry.review ||= review;
      rowsFor.set(step, entry);
    });
  }
  const balanceOf = new Map(balance.map((b) => [key(b.step), b]));
  const tone: Record<string, string> = {};
  const badge: Record<string, string> = {};
  const nodes: MapNode[] = flow.nodes.map((n) => {
    let status: MapStatus;
    let tCO2e: number | null = null;
    const gaps: string[] = [];
    if (n.kind === "step") {
      const rows = rowsFor.get(key(n.label));
      const b = balanceOf.get(key(n.label));
      const e = estimate.byStep[n.label];
      tCO2e = e ? e.directT + e.indirectT + e.precursorT : null;
      if (rows) gaps.push(...rows.missing);
      if (b && !b.ok && b.diffPct !== null)
        gaps.push(`Inputs and outputs differ by ${Math.round(Math.abs(b.diffPct) * 100)} %`);
      status = !rows ? "muted" : rows.missing.length ? "err" : gaps.length || rows.review ? "warn" : "ok";
      if (tCO2e !== null) badge[n.id] = `${tCO2e.toFixed(1)} t CO₂e`;
    } else {
      const sheet = n.kind === "material" ? "materials" : n.kind === "product" ? "products" : n.kind;
      status = itemStatus.get(`${sheet}:${key(n.label)}`) ?? "muted";
    }
    tone[n.id] = TONE[status];
    return { ...n, status, tCO2e, gaps };
  });
  return { nodes, edges: flow.edges, width: flow.width, height: flow.height, tone, badge };
}

const RANK: MapStatus[] = ["muted", "ok", "warn", "err"];
const worst = (a: MapStatus | undefined, b: MapStatus) => (a && RANK.indexOf(a) > RANK.indexOf(b) ? a : b);
```

`missingCells` is in `lib/workbook/status.ts` (Task 12); `buildFlow` in `lib/workbook/flow.ts` (Task 15); `FlowNode.kind` = `material | energy | step | output | product`.

Run: PASS.

- [ ] **Step 3: Directory UI**

`installation-directory.tsx` (props `{ year: number }`): a responsive grid of cards, one per installation in `useActiveInstallation().options`:
- Header: name, country, and a role chip ("Own site" for `self`, "OEM / supplier site" otherwise).
- Workbook years from `useWorkbookYears(id)`: one pill per year coloured by the worst sheet status of that year (open the workbook only for the selected year; other years show the pill grey with the year label).
- Factory profile: `factoryProgress(readFactory(id), year)` as a small `Progress` with "x of y checks".
- Links: "Open workspace" (`/workspace?installation=<id>`), "Factory profile" (`/workspace?installation=<id>&view=factory`), "Show on map" (selects this installation in the map below).
- Empty state when there are no installations: "Add your first installation" linking to Settings.
- Above the grid, a one-line summary for all installations: "N installations · M with factory checks complete". M counts the installations where `factoryProgress` returns done === total. This follows the folder Summary table on MEASUR's directory dashboard, observed at runtime.

`spreadsheet.tsx` reads `view=factory|flow|table` from the query string so the links open the right view.

- [ ] **Step 4: Map UI**

`factory-map.tsx` (props `{ installationId: string; year: number }`):
- `const { sheets, cells } = useWorkbook(installationId, year)`; `estimate = estimateEmissions(sheets, { country, year })`; `balance = massBalance(sheets)`; `map = buildFactoryMap(...)`, all memoised on `sheets`.
- Header: installation select (all installations), year select, legend of the four status colours with `STATUS_LABEL` text, and the estimate total with the "Estimate" badge.
- Body: `<FlowDiagram sheets={sheets} cells={cells} nodeTone={map.tone} nodeBadge={map.badge} onSelect={setSelected} />` (read-only: no `editable`).
- Side panel for the selected node: label, kind, status, tCO₂e and its share of the installation total, the `gaps` list, and a link "Fix in workspace" to `/workspace?installation=<id>&sheet=<sheet>`.
- An empty workbook shows "No workbook for <year> yet" with a link to open the workspace.

Dashboard page: directory first, then the map with the first installation selected, then the existing panels.

Thai strings: "สถานที่ผลิต", "ไซต์ของเรา", "ไซต์ OEM / ซัพพลายเออร์", "เปิดเวิร์กสเปซ", "แสดงบนแผนผัง", "แผนผังโรงงาน", "ไปแก้ในเวิร์กสเปซ", "ยังไม่มีเวิร์กบุ๊กปี".

- [ ] **Step 5: Verify and commit**

Unit tests, typecheck, lint PASS. Manual: two installations show two cards; a step with a missing quantity is red on the map and its panel names the row; at 375 px the cards stack and the map scrolls inside its own frame, not the page.

```bash
git add certrace-portal
git commit -m "feat: installation directory and status-coloured factory map on dashboard"
```

### Task 24: CBAM cost what-if

MEASUR's "modify conditions" compares a baseline with a changed scenario side by side. For a CBAM exporter the questions are about money: what happens to the certificate cost if production changes, more goes to the EU, the certificate price moves, or a supplier sends actual precursor data instead of the default. The what-if answers those with the declaration engine's own functions.

**Files:**
- Create: `certrace-portal/lib/factory/what-if.ts`
- Create: `certrace-portal/components/factory/what-if-panel.tsx`
- Modify: `certrace-portal/app/(portal)/dashboard/page.tsx` (panel under the map, same installation)
- Test: `certrace-portal/lib/factory/__tests__/what-if.test.ts`

**Interfaces:**
- Consumes: `EmissionEstimate`, `PrecursorLine` (Task 18); `GoodsCategory`, `indirectIsChargeable` (`lib/cbam/engine.ts`); `defaultFor` (`lib/cbam/precursor-basis.ts`); `Currency`, `CURRENCIES`, `toCurrency` (`lib/cbam/carbon-cost-model.ts`); `saveOpportunity` (Task 25, wired in Task 25 Step 4).
- Produces:
  - `type WhatIfInput = { productionT: number; exportedT: number; priceEur: number; category: GoodsCategory; productCn: string; year: number; precursorActual: Record<string, number> }` (`precursorActual[line.key]` = supplier's actual SEE in tCO₂e/t)
  - `type WhatIfResult = { perTonne: number; chargeablePerTonne: number; certificatesT: number; costEur: number; defaultPerTonne: number | null; defaultCostEur: number | null; savingVsDefaultEur: number | null }`
  - `whatIf(e: EmissionEstimate, input: WhatIfInput): WhatIfResult`
  - `compareWhatIf(e: EmissionEstimate, base: WhatIfInput, next: WhatIfInput): { base: WhatIfResult; next: WhatIfResult; deltaEur: number; deltaT: number }`

Rules:
- Direct and indirect emissions per tonne stay at the estimate's intensity (`directT / productionT`, `indirectT / productionT`); changing production scales them.
- Precursor emissions per tonne = Σ over `e.precursors` of (`tonnes / e.productionT`) × (`precursorActual[key]` when given, else `defaultSee`).
- `chargeablePerTonne` = direct + precursor + (indirect only when `indirectIsChargeable(category)`).
- `certificatesT = chargeablePerTonne × exportedT`; `costEur = certificatesT × priceEur`.
- Default comparison: `defaultFor(productCn, undefined, year)?.total` (mark-up already included) × `exportedT` × `priceEur`. `defaultPerTonne`/`defaultCostEur`/`savingVsDefaultEur` are `null` when there is no default for the CN. `defaultExposure` is not used here: it adds the mark-up again.
- `e.productionT = 0` means no intensity: every value is 0 and the panel says "Add product quantities in the Products sheet first."
- Exported tonnes are clamped to production.
- The panel states what the figure leaves out: "Gross cost before free allocation and any carbon price paid in the country of origin."

- [ ] **Step 1: Failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { compareWhatIf, whatIf, type WhatIfInput } from "../what-if";
import { defaultFor } from "../../cbam/precursor-basis";
import type { EmissionEstimate } from "../../workbook/estimate";

const e: EmissionEstimate = {
  productionT: 1000, directT: 200, indirectT: 300, precursorT: 1800, totalT: 2300, perTonne: 2.3,
  byStep: {}, unmatched: [],
  precursors: [{ key: "materials:0", item: "Wire rod", cn: "72139110", tonnes: 1000, defaultSee: 1.8, step: "Drawing" }],
};
const base: WhatIfInput = {
  productionT: 1000, exportedT: 500, priceEur: 80, category: "Iron & Steel", productCn: "72172000", year: 2026, precursorActual: {},
};

test("steel ignores indirect emissions and prices exported tonnes", () => {
  const r = whatIf(e, base);
  assert.equal(r.chargeablePerTonne, 0.2 + 1.8);
  assert.equal(r.certificatesT, 1000);
  assert.equal(r.costEur, 80_000);
});
test("cement counts indirect emissions (INDIRECT_CHARGEABLE.Cement = true)", () => {
  assert.equal(whatIf(e, { ...base, category: "Cement" }).chargeablePerTonne, 0.2 + 0.3 + 1.8);
});
test("a supplier's actual precursor value replaces the default", () => {
  const { deltaEur, next } = compareWhatIf(e, base, { ...base, precursorActual: { "materials:0": 0.9 } });
  assert.equal(next.chargeablePerTonne, 0.2 + 0.9);
  assert.equal(deltaEur, -36_000);
});
test("default comparison uses the CN default total once", () => {
  const d = defaultFor("72172000", undefined, 2026)!;
  const r = whatIf(e, base);
  assert.equal(r.defaultCostEur, d.total * 500 * 80);
  assert.equal(r.savingVsDefaultEur, d.total * 500 * 80 - r.costEur);
});
test("no production means no intensity", () => {
  assert.equal(whatIf({ ...e, productionT: 0 }, base).costEur, 0);
});
```

Floating-point note: if `0.2 + 1.8` comparisons fail on rounding, compare with `Math.abs(a - b) < 1e-9`. Keep the expected values written as sums so a reader sees where they come from.


Run: FAIL.

- [ ] **Step 2: Implement `what-if.ts`**

```ts
import { indirectIsChargeable, type GoodsCategory } from "../cbam/engine";
import { defaultFor } from "../cbam/precursor-basis";
import type { EmissionEstimate } from "../workbook/estimate";

export type WhatIfInput = {
  productionT: number; exportedT: number; priceEur: number; category: GoodsCategory; productCn: string; year: number;
  precursorActual: Record<string, number>;
};
export type WhatIfResult = {
  perTonne: number; chargeablePerTonne: number; certificatesT: number; costEur: number;
  defaultPerTonne: number | null; defaultCostEur: number | null; savingVsDefaultEur: number | null;
};

export function whatIf(e: EmissionEstimate, input: WhatIfInput): WhatIfResult {
  const zero = { perTonne: 0, chargeablePerTonne: 0, certificatesT: 0, costEur: 0, defaultPerTonne: null, defaultCostEur: null, savingVsDefaultEur: null };
  if (e.productionT <= 0) return zero;
  const direct = e.directT / e.productionT;
  const indirect = e.indirectT / e.productionT;
  const precursor = e.precursors.reduce(
    (sum, p) => sum + (p.tonnes / e.productionT) * (input.precursorActual[p.key] ?? p.defaultSee),
    0,
  );
  const chargeablePerTonne = direct + precursor + (indirectIsChargeable(input.category) ? indirect : 0);
  const exportedT = Math.max(0, Math.min(input.exportedT, input.productionT));
  const certificatesT = chargeablePerTonne * exportedT;
  const costEur = certificatesT * input.priceEur;
  const d = input.productCn ? defaultFor(input.productCn, undefined, input.year) : null;
  const defaultCostEur = d ? d.total * exportedT * input.priceEur : null;
  return {
    perTonne: direct + indirect + precursor,
    chargeablePerTonne, certificatesT, costEur,
    defaultPerTonne: d?.total ?? null,
    defaultCostEur,
    savingVsDefaultEur: defaultCostEur === null ? null : defaultCostEur - costEur,
  };
}

export function compareWhatIf(e: EmissionEstimate, base: WhatIfInput, next: WhatIfInput) {
  const a = whatIf(e, base), b = whatIf(e, next);
  return { base: a, next: b, deltaEur: b.costEur - a.costEur, deltaT: b.certificatesT - a.certificatesT };
}
```

Run: PASS.

- [ ] **Step 3: Panel**

`what-if-panel.tsx` (props `{ installationId: string; year: number; estimate: EmissionEstimate; productCn: string; category: GoodsCategory }`). Product CN and category come from the first Products row and its CN's goods category (use the existing CN→category lookup in `lib/cbam`; `grep -rn "GoodsCategory" certrace-portal/lib/cbam --include=*.ts | grep -i "cn"` finds it).
- Two columns, **Today** and **Scenario**, each a read-only result card; the inputs edit only the scenario:
  - Production (t/year), prefilled with `estimate.productionT`.
  - Exported to the EU (t/year), prefilled with production.
  - Certificate price (EUR/t CO₂), prefilled with the price the cost page already uses (`priceFacts` in `lib/cbam/carbon-cost-model.ts`); when none is available, 80 with the hint "Typical EU ETS price; replace with your own".
  - Per precursor line: item, CN, default SEE and an input "Supplier actual (t CO₂e/t)". Blank uses the default.
- Result cards: chargeable t CO₂e per tonne, certificates (t CO₂e), cost, and "vs default values" (saving or extra). Amounts show in the currency the user picked on the cost page (`CURRENCIES` select, `toCurrency(eur, currency, { rates })`, rates from the same source as the cost page) with EUR in small text below.
- Difference row: "Scenario changes cost by ±x" in `ok` colour when lower, `err` when higher.
- Footer: "Estimate from EU default factors. Gross cost before free allocation and any carbon price paid in the country of origin."
- Button "Save as opportunity" (enabled when the scenario saves money) creates a Task 25 opportunity: `source: "what-if"`, title "Scenario saves x per year", detail listing the changed inputs, `impactEur = −deltaEur`, `impactT = −deltaT`.

Thai strings: "จำลองต้นทุน CBAM", "ปัจจุบัน", "สถานการณ์จำลอง", "ส่งออกไป EU", "ราคาใบรับรอง", "ค่าจริงจากซัพพลายเออร์", "เทียบกับค่าตั้งต้น", "บันทึกเป็นโอกาส", "ต้นทุนรวมก่อนหักการจัดสรรฟรีและราคาคาร์บอนที่จ่ายในประเทศต้นทาง".

- [ ] **Step 4: Verify and commit**

Unit tests, typecheck, lint PASS. Manual: entering a supplier actual lower than the default lowers the scenario cost and enables "Save as opportunity".

```bash
git add certrace-portal
git commit -m "feat: CBAM cost what-if on the dashboard"
```

### Task 25: Opportunities list and report

MEASUR's Treasure Hunt turns findings into opportunity cards, collects them in a chest with filters and a summary, and prints a report. In Certrace an opportunity is either a data gap that forces default values (each one costs money, because defaults carry a mark-up) or a saved what-if scenario. The list gives the team one place to assign and close them.

**Files:**
- Create: `certrace-portal/lib/factory/opportunities.ts`
- Create: `certrace-portal/lib/factory/opportunity-store.ts`
- Create: `certrace-portal/app/(portal)/opportunities/page.tsx`
- Create: `certrace-portal/components/factory/opportunity-summary.tsx`
- Modify: `certrace-portal/app/(portal)/dashboard/page.tsx` (summary card), the portal navigation (add "Opportunities"; `grep -rn "\"/dashboard\"" certrace-portal/components` finds the nav list), `components/factory/what-if-panel.tsx` (Save button)
- Test: `certrace-portal/lib/factory/__tests__/opportunities.test.ts`

**Interfaces:**
- Consumes: `EmissionEstimate`, `PrecursorLine` (Task 18); `FactoryGap`, `factoryGaps`, `readFactory` (Task 22); `sheetStatus` (Task 12); `defaultFor` → `PrecursorDefault.markup` (`lib/cbam/precursor-basis.ts`); `useTeam()` → `TeamMember[]` (`lib/team-query.ts`); `accountStorage`, `flushAccount`; `sharedRecord` already shares `certrace:opportunities` (Task 22 Step 2).
- Produces:
  - `type OpportunityStatus = "open" | "in-progress" | "done" | "dismissed"`
  - `type Opportunity = { id: string; key: string; installationId: string; source: "data-gap" | "what-if"; title: string; detail: string; impactEur: number | null; impactT: number | null; assignee: string; status: OpportunityStatus; due: string; href: string; createdAt: string; updatedAt: string }` (`assignee` = `TeamMember.id` or `""`; `due` = `""` or `YYYY-MM-DD`)
  - `type Derived = Omit<Opportunity, "id" | "assignee" | "status" | "due" | "createdAt" | "updatedAt">`
  - `gapOpportunities(installationId: string, e: EmissionEstimate, ctx: { year: number; exportedT: number; priceEur: number; factoryGaps: FactoryGap[]; emptySheets: string[] }): Derived[]`
  - `mergeOpportunities(derived: Derived[], stored: Opportunity[], now: string): Opportunity[]`
  - `summarize(list: Opportunity[]): { open: number; inProgress: number; done: number; impactEur: number; impactT: number }`
  - `OPPORTUNITIES_KEY = "certrace:opportunities"`; `readOpportunities(): Opportunity[]`; `saveOpportunities(list: Opportunity[]): Promise<void>`; `saveOpportunity(o: Derived): Promise<void>` (adds or updates by `key`)

Rules:
- Precursor on default values: one opportunity per `e.precursors` line, key `precursor:<installationId>:<line.key>`, title "Get actual emissions for <item> (CN <cn>)", href to the Smart Links request for that installation. `impactEur` = the mark-up part of the default only, which is the least the company saves by replacing it: `defaultSee × markup / (1 + markup) × tonnes × exportedT / productionT × priceEur`. `impactT` = the same without `priceEur`. `markup` comes from `defaultFor(cn, undefined, year)`; 0 or missing makes impact `null` ("Saving depends on the supplier's value").
- Factory gaps: one per `FactoryGap`, key `factory:<installationId>:<gap.key>`, no money impact, href `/workspace?installation=<id>&view=factory`.
- Empty sheets: one per sheet id in `emptySheets`, key `sheet:<installationId>:<id>`, title "Fill in the <sheet name> sheet", href `/workspace?installation=<id>&sheet=<id>`.
- Merge: a derived item keeps the stored `id`, `assignee`, `status`, `due`, `createdAt` of the stored item with the same `key`, and takes the fresh title, detail and impact. A stored data-gap item whose key is no longer derived (the gap was fixed) becomes `status: "done"` with `updatedAt = now`, unless it was `dismissed`. `what-if` items are kept as stored. New items get `id = crypto.randomUUID()`, `status: "open"`.
- Sort: open and in-progress first, then by `impactEur` descending (null last), then title.
- Limit: 500 stored items; when saving more, drop the oldest `done`/`dismissed` items first.

- [ ] **Step 1: Failing tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { gapOpportunities, mergeOpportunities, summarize, type Opportunity } from "../opportunities";
import { defaultFor } from "../../cbam/precursor-basis";
import type { EmissionEstimate } from "../../workbook/estimate";

const e: EmissionEstimate = {
  productionT: 1000, directT: 0, indirectT: 0, precursorT: 0, totalT: 0, perTonne: null, byStep: {}, unmatched: [],
  precursors: [{ key: "materials:0", item: "Wire rod", cn: "72139110", tonnes: 1020, defaultSee: 0, step: "Drawing" }],
};
const ctx = { year: 2026, exportedT: 500, priceEur: 80, factoryGaps: [{ key: "processes:none", group: "processes" as const, message: "Add the processes inside the installation boundary." }], emptySheets: ["transport"] };

test("precursor impact counts only the default mark-up", () => {
  const d = defaultFor("72139110", undefined, 2026)!;
  const line = { ...e.precursors[0]!, defaultSee: d.total };
  const [first] = gapOpportunities("i1", { ...e, precursors: [line] }, ctx);
  const expected = d.total * (d.markup / (1 + d.markup)) * 1020 * (500 / 1000) * 80;
  assert.equal(first!.key, "precursor:i1:materials:0");
  assert.ok(d.markup > 0 ? Math.abs(first!.impactEur! - expected) < 1e-6 : first!.impactEur === null);
});
test("factory gaps and empty sheets become cards without money impact", () => {
  const keys = gapOpportunities("i1", { ...e, precursors: [] }, ctx).map((o) => [o.key, o.impactEur]);
  assert.deepEqual(keys, [["factory:i1:processes:none", null], ["sheet:i1:transport", null]]);
});
test("merge keeps assignment, closes fixed gaps, keeps what-if items", () => {
  const stored: Opportunity[] = [
    { id: "a", key: "sheet:i1:transport", installationId: "i1", source: "data-gap", title: "old", detail: "", impactEur: null, impactT: null, assignee: "u1", status: "in-progress", due: "2026-12-01", href: "", createdAt: "t0", updatedAt: "t0" },
    { id: "b", key: "sheet:i1:evidence", installationId: "i1", source: "data-gap", title: "Fill in Evidence", detail: "", impactEur: null, impactT: null, assignee: "", status: "open", due: "", href: "", createdAt: "t0", updatedAt: "t0" },
    { id: "c", key: "what-if:1", installationId: "i1", source: "what-if", title: "Scenario", detail: "", impactEur: 100, impactT: 1, assignee: "", status: "open", due: "", href: "", createdAt: "t0", updatedAt: "t0" },
  ];
  const merged = mergeOpportunities(gapOpportunities("i1", { ...e, precursors: [] }, { ...ctx, factoryGaps: [] }), stored, "t1");
  const byKey = Object.fromEntries(merged.map((o) => [o.key, o]));
  assert.equal(byKey["sheet:i1:transport"]!.assignee, "u1");
  assert.equal(byKey["sheet:i1:transport"]!.title, "Fill in the Transport sheet");
  assert.equal(byKey["sheet:i1:evidence"]!.status, "done");
  assert.equal(byKey["what-if:1"]!.status, "open");
});
test("summary counts statuses and open impact", () => {
  const s = summarize([
    { status: "open", impactEur: 10, impactT: 1 }, { status: "in-progress", impactEur: null, impactT: null }, { status: "done", impactEur: 99, impactT: 9 },
  ] as Opportunity[]);
  assert.deepEqual(s, { open: 1, inProgress: 1, done: 1, impactEur: 10, impactT: 1 });
});
```

The sheet title uses the display name from `buildSheets([], true)` in `lib/workspace-sheets.ts` (the Transport sheet is named "Transport").

Run: FAIL.

- [ ] **Step 2: Implement `opportunities.ts`**

```ts
import { defaultFor } from "../cbam/precursor-basis";
import type { EmissionEstimate } from "../workbook/estimate";
import type { FactoryGap } from "./profile";
import { buildSheets } from "../workspace-sheets";

export type OpportunityStatus = "open" | "in-progress" | "done" | "dismissed";
export type Opportunity = {
  id: string; key: string; installationId: string; source: "data-gap" | "what-if"; title: string; detail: string;
  impactEur: number | null; impactT: number | null; assignee: string; status: OpportunityStatus; due: string; href: string;
  createdAt: string; updatedAt: string;
};
export type Derived = Omit<Opportunity, "id" | "assignee" | "status" | "due" | "createdAt" | "updatedAt">;

const SHEET_NAMES = new Map(buildSheets([], true).map((s) => [s.id, s.name]));
const sheetName = (id: string) => SHEET_NAMES.get(id) ?? id;

export function gapOpportunities(
  installationId: string,
  e: EmissionEstimate,
  ctx: { year: number; exportedT: number; priceEur: number; factoryGaps: FactoryGap[]; emptySheets: string[] },
): Derived[] {
  const share = e.productionT > 0 ? Math.min(ctx.exportedT, e.productionT) / e.productionT : 0;
  const out: Derived[] = e.precursors.map((p) => {
    const markup = defaultFor(p.cn, undefined, ctx.year)?.markup ?? 0;
    const impactT = markup > 0 ? p.defaultSee * (markup / (1 + markup)) * p.tonnes * share : null;
    return {
      key: `precursor:${installationId}:${p.key}`, installationId, source: "data-gap",
      title: `Get actual emissions for ${p.item || p.cn} (CN ${p.cn})`,
      detail: impactT === null
        ? "Saving depends on the supplier's value."
        : "Default values include a mark-up. Replacing them with the supplier's actual value removes at least that part.",
      impactT, impactEur: impactT === null ? null : impactT * ctx.priceEur,
      href: `/smart-links?installation=${encodeURIComponent(installationId)}`,
    };
  });
  for (const g of ctx.factoryGaps)
    out.push({
      key: `factory:${installationId}:${g.key}`, installationId, source: "data-gap", title: g.message, detail: "Factory profile",
      impactEur: null, impactT: null, href: `/workspace?installation=${encodeURIComponent(installationId)}&view=factory`,
    });
  for (const id of ctx.emptySheets)
    out.push({
      key: `sheet:${installationId}:${id}`, installationId, source: "data-gap", title: `Fill in the ${sheetName(id)} sheet`, detail: "Workspace",
      impactEur: null, impactT: null, href: `/workspace?installation=${encodeURIComponent(installationId)}&sheet=${id}`,
    });
  return out;
}

const ACTIVE: OpportunityStatus[] = ["open", "in-progress"];
export function mergeOpportunities(derived: Derived[], stored: Opportunity[], now: string): Opportunity[] {
  const byKey = new Map(stored.map((o) => [o.key, o]));
  const fresh = new Set(derived.map((d) => d.key));
  const out: Opportunity[] = derived.map((d) => {
    const old = byKey.get(d.key);
    return old
      ? { ...old, ...d, updatedAt: old.title === d.title && old.impactEur === d.impactEur ? old.updatedAt : now }
      : { ...d, id: crypto.randomUUID(), assignee: "", status: "open", due: "", createdAt: now, updatedAt: now };
  });
  for (const o of stored) {
    if (fresh.has(o.key)) continue;
    const derivedHere = derived.some((d) => d.installationId === o.installationId);
    out.push(o.source === "data-gap" && derivedHere && ACTIVE.includes(o.status) ? { ...o, status: "done", updatedAt: now } : o);
  }
  return out.sort(
    (a, b) =>
      Number(!ACTIVE.includes(a.status)) - Number(!ACTIVE.includes(b.status)) ||
      (b.impactEur ?? -Infinity) - (a.impactEur ?? -Infinity) ||
      a.title.localeCompare(b.title),
  );
}

export function summarize(list: Opportunity[]) {
  const open = list.filter((o) => ACTIVE.includes(o.status));
  return {
    open: list.filter((o) => o.status === "open").length,
    inProgress: list.filter((o) => o.status === "in-progress").length,
    done: list.filter((o) => o.status === "done").length,
    impactEur: open.reduce((a, o) => a + (o.impactEur ?? 0), 0),
    impactT: open.reduce((a, o) => a + (o.impactT ?? 0), 0),
  };
}
```

`derivedHere` limits auto-closing to installations whose gaps were recomputed in this call, so opening the dashboard for one installation never closes another installation's items. The "fixed gap closes" test passes because `derived` holds an item for `i1`. The Smart Links page is `app/(portal)/smart-links/page.tsx`.

- [ ] **Step 3: Implement `opportunity-store.ts`**

```ts
import { accountStorage, flushAccount } from "../account-storage";
import type { Derived, Opportunity } from "./opportunities";

export const OPPORTUNITIES_KEY = "certrace:opportunities";
const LIMIT = 500;

export function readOpportunities(): Opportunity[] {
  try {
    const v = JSON.parse(accountStorage.getItem(OPPORTUNITIES_KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export async function saveOpportunities(list: Opportunity[]) {
  let kept = list;
  if (kept.length > LIMIT) {
    const closed = kept.filter((o) => o.status === "done" || o.status === "dismissed").sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    const drop = new Set(closed.slice(0, kept.length - LIMIT).map((o) => o.id));
    kept = kept.filter((o) => !drop.has(o.id)).slice(0, LIMIT);
  }
  accountStorage.setItem(OPPORTUNITIES_KEY, JSON.stringify(kept));
  await flushAccount();
}

export async function saveOpportunity(d: Derived) {
  const now = new Date().toISOString();
  const list = readOpportunities();
  const i = list.findIndex((o) => o.key === d.key);
  if (i >= 0) list[i] = { ...list[i]!, ...d, updatedAt: now };
  else list.push({ ...d, id: crypto.randomUUID(), assignee: "", status: "open", due: "", createdAt: now, updatedAt: now });
  await saveOpportunities(list);
}
```

Run: PASS.

- [ ] **Step 4: Page, summary card, report**

`/opportunities` page:
- On load, for each installation: workbook of the selected year, `estimateEmissions`, `factoryGaps(readFactory(id), year)`, empty sheets (`sheetStatus` = `"untouched"` for sheets in `SHEET_ORDER` other than Installation), then `mergeOpportunities` over all derived items and the stored list; save when the merged list differs from the stored one.
- Exported tonnes and price: the what-if values when the user has run one (keep the last scenario per installation in component state passed through the URL, `?exported=&price=`), else production and the cost page price.
- Filters: installation, status, source, assignee; search by title.
- Table/cards: title, installation, impact (currency from the cost page selector; "—" when null), assignee select (`useTeam()` internal members, plus "Unassigned"), status select, due date, and a link "Open" (`href`).
- Header summary (`summarize`): open, in progress, done, and "Open items worth at least x / y t CO₂e".
- "Print report" calls `window.print()`. A print stylesheet (`@media print` in the page module CSS) hides navigation and filters and prints: company name, date, summary, then the open items grouped by installation, then the done items.

`opportunity-summary.tsx` on the dashboard: the four summary numbers and the top three open items, with a link to `/opportunities`.

`what-if-panel.tsx`: "Save as opportunity" calls `saveOpportunity({ key: "what-if:" + crypto.randomUUID(), installationId, source: "what-if", title, detail, impactEur: -deltaEur, impactT: -deltaT, href: "/dashboard" })` and toasts "Saved to Opportunities".

Navigation: add "Opportunities" (Thai "โอกาสปรับปรุง") after Dashboard.

Thai strings: "โอกาสปรับปรุง", "ขอค่าการปล่อยจริงของ", "ค่าตั้งต้นมีส่วนบวกเพิ่ม", "ผู้รับผิดชอบ", "ยังไม่มอบหมาย", "เปิดอยู่", "กำลังทำ", "เสร็จแล้ว", "ไม่ทำ", "กำหนดเสร็จ", "พิมพ์รายงาน", "รายการที่เปิดอยู่มีมูลค่าอย่างน้อย".

- [ ] **Step 5: Verify and commit**

Unit tests, backend tests, typecheck, lint, build PASS. Manual: a precursor on default appears with an impact; assigning it to a team member survives reload and shows for the editor; filling the Transport sheet closes its card on the next load; the print preview shows only the report.

```bash
git add certrace-portal
git commit -m "feat: opportunities list from data gaps and what-if scenarios, with print report"
```

## Phase 5 — Verification and records

### Task 26: End-to-end flows, docs, final checks

**Files:**
- Create: `certrace-portal/e2e/production-flows.spec.ts`
- Modify: `docs/PORTAL8-INVENTORY.md` (mark G1–G15 closed with the task that closed each), project `PROJECT.md` if present, `.wolf/anatomy.md`, `.wolf/cerebrum.md`

**Interfaces:**
- Consumes: everything above; backend running with `CERTRACE_EMAIL_DELIVERY=console` so tests read codes and links from the mail log (Task 1).

- [ ] **Step 1: Write the e2e spec**

Scenarios (one `test()` each; seed users through the API helpers in `certrace-backend/test/helpers.ts` from Task 2 where the UI is not the subject):
1. Register → onboarding with the new fields → setup → `/pending`; admin approves in `/admin`; the customer's `/pending` page moves to `/dashboard` within 35 s; trial banner shows 30 days.
2. Forgot password → code from the mail log → new password → old password fails, new one works; a "password changed" mail is logged.
3. Cookie banner: first visit shows it; "Necessary only" hides it and survives reload; `POST /api/v1/consent/cookies` was called once.
4. Workbook sync: owner and an editor (two browser contexts) open the same `/workspace?installation=…`; editor types a cell; owner sees it within 12 s; the tab dot turns from grey to red (row with a missing required column) and to green after the column is filled; hovering the red tab shows "Missing data — row 1: …".
5. Installation tab edits persist to the installation record (visible in Settings).
6. Flow diagram editing: owner adds a step and a material in the Flow view; the editor's Steps and Materials tabs show the rows within 12 s and Materials is amber (review). With the backend stopped, adding a step shows "Not saved" and no row appears.
7. Import: upload a fixture CSV (`e2e/fixtures/materials.csv`, Thai headers, 3 rows and one blank row) into Materials; the wizard suggests the mapping; after import 3 rows are added with status review.
8. Live panel: entering an Annealing input of 100 t and output of 80 t shows the balance warning without reload; adding a CN to a material grows the precursor estimate.
9. Smart Links → Request data → internal (owner) sends an invitation; external opens the supplier add form.
10. Convert on an OEM installation shows "Fill in" for precursors and the link opens the materials sheet of that installation. Export is disabled while readiness < 100 % and its tooltip lists the incomplete requirements; it enables when all are met.
11. Factory: fill one process, source and meter in the Factory view; the dashboard directory card shows the progress; the map colours the step with a missing quantity red; the what-if with a supplier actual below the default saves an opportunity that appears on `/opportunities`, can be assigned to the editor, and survives reload.
12. Trial ended (set `trial_started_at` 31 days back via the helper): a write returns `TRIAL_ENDED` and the UI shows the upgrade screen; reads still work.

Fixture `e2e/fixtures/materials.csv`:

```csv
ขั้นตอน,วัตถุดิบ,ปริมาณ,หน่วย
Drawing,Wire rod,"1,200",t
Annealing,Zinc,12,t
,,,
Annealing,Natural gas,5000,m3
```

- [ ] **Step 2: Full checks**

```bash
cd certrace-backend && bun test && bun run typecheck
cd ../certrace-portal && npm run test:unit && npx tsc --noEmit && npm run lint && npm run build
npm run test:e2e -- e2e/production-flows.spec.ts
```

Expected: all exit 0. Record any failure in `.wolf/buglog.json` with the fix.

- [ ] **Step 3: Docs**

- Inventory: change each gap row G1–G15 to "Closed by Task N" or "Open: reason".
- `.wolf/anatomy.md`: add the new files (workbooks module, `lib/workbook/*` including `flow-edit`, `sync-queue`, `xlsx`, `import`, `balance`, `estimate`; `lib/factory/*`; `lib/convert/requirements.ts`; the new components and `/opportunities`).
- `.wolf/cerebrum.md`: decisions D1–D21 in one line each, and the do-not-repeat items (no master password, trial checked on the server, workbook never in account records, diagram edits are cell patches, no energy-loss models, what-if never adds the default mark-up twice).

- [ ] **Step 4: Commit**

```bash
git add -A certrace-portal certrace-backend docs .wolf
git commit -m "test: production flow e2e and closing docs"
```

---

## Spec coverage

| Spec item | Task |
| --- | --- |
| D1 tab colours | 12, 13 |
| D2 trial from approval | 3, 5 |
| D3 no master password | 2 |
| D4 server trial enforcement | 5 |
| D5, D6 workbook table and sync | 11, 13 |
| D7 Installation sheet | 14 |
| D8 installation scope | 19 |
| D9 OEM fill-in | 20 |
| D10 team vs smart link | 21 |
| D11 two-way flow diagram | 15, 16 |
| D12 factory map and CBAM what-if (MEASUR flow, no energy formulas) | 23, 24 |
| D13 cookie consent | 8 |
| D14 email required in production (Resend or SMTP) | 1, 3 |
| D15 grant admin | 4 |
| D16 Excel/CSV import | 17 |
| D17 live panel | 18 |
| D18 factory profile | 22 |
| D19 opportunities and report | 25 |
| D20 SMTP delivery | 1 |
| D21 Convert open, export gated | 20 |
| Sign-up flow steps 1–7 | 3, 4, 5, 6, 7, 10 |
| Email catalogue | 3, 4, 6, 7, 9 (reset code and team invite exist) |
| Sheet order and missing-data tooltip | 12, 13 |
| Factory data fields | 22 |
| Simulator outputs (map, what-if) | 23, 24 |
| End-to-end and records | 26 |
