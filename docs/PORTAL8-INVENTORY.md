# certrace-portal8 inventory

Recorded 2026-11-10 so later sessions do not re-read the codebase. Covers what
each route does, whether its data is real (server) or mock (browser/static),
the backend surface, the design system, and the gaps against the old portal
(`portal.certrace.co`, audited in
`C:\Certrace\.claude\worktrees\cbam-missing-data-gap-1f251f\docs\portal_audit_2026-11-10.md`).

Re-verify any line below before relying on it after 2026-11-10.

## 1. Repository shape

| Part | Stack | Notes |
| --- | --- | --- |
| root | Bun workspace, `bun@1.3.10` | `AGENTS.md` (13 rules), `PROJECT.md` repo map, `compose.yaml` |
| `certrace-portal/` | Next.js 15, React 19, TanStack Query, Tailwind v4, lucide-react | Unit tests `node --test`, e2e Playwright |
| `certrace-backend/` | Elysia 1.4.30, Prisma 7.10 + `@prisma/adapter-pg`, PostgreSQL 18 | `bun test test` needs a migrated DB |

- Same-origin proxy: portal rewrites `/backend/*` to API `:8000`.
- Error body: `{ detail: { code, message } }`, raised with `fail(status, code, message)` from `src/lib/errors.ts`.
- CSRF: `app.ts` checks `Origin` on cookie-authenticated writes.
- Session: cookie `certrace_session` (7 days) plus `refresh_tokens` table.
- Tenancy: company id = owner user id. `account_members` (role `owner|editor`). Header `X-Certrace-Company` selects company (`team/workspace.ts` `companySession`).
- Saves are revision-checked: `account_records.revision`, `409 REVISION_CONFLICT`. Keys starting `certrace:` only; report keys route to `reporting.records`/`record_heads`.
- Migrations: `prisma/migrations/YYYYMMDDHHMM_name/migration.sql`, raw SQL in `BEGIN; … COMMIT;`. Latest: `202611060001_team_invitations`. New audit events must extend the `account_audit_events_event_check` constraint.
- Commits (AGENTS.md rule 13): `feat:|add:|fix:|del:|docs:|chore:`, no co-author line.

### Local environment status (2026-11-10)

- `bun` not installed, no `node_modules`, no certrace containers running.
- `compose.yaml` expects Postgres 18 on `55432`. Port 5432 is held by an unrelated `sanso-dev-postgres-1` (pg16).
- `compose.yaml` has hardcoded fallback `POSTGRES_PASSWORD` and JWT secret; must fail closed in production.

### Commands

```bash
bun install
docker compose up -d db
bun run db:migrate
bun run db:generate
bun run format:check
bun run lint
bun run typecheck
CERTRACE_JWT_SECRET=local-development-change-before-deployment bun run test:backend
bun run --cwd certrace-portal test:unit
bun run --cwd certrace-portal api:check
E2E_BASE_URL=http://localhost:3000 bun run --cwd certrace-portal test:e2e --project=local <spec>
```

## 2. Routes (`certrace-portal/app`)

Legend: **REAL** = server-backed; **MOCK** = static/sample data; **LOCAL** = browser `localStorage` only; **MIXED**.

### Public / auth

| Route | Purpose | Data |
| --- | --- | --- |
| `/login` | email+password, Google | REAL |
| `/register` | account + legal consent | REAL |
| `/auth/google` | Google callback | REAL |
| `/forgot-password`, `/reset-password` | 6-digit code, 15 min | REAL (email silently no-ops when delivery `off`) |
| `/onboarding`, `/onboarding/setup`, `/onboarding/done` | company/profile questions, writes `certrace:profile` | REAL; "done" promises an email that is never sent |
| `/pending` | waiting for admin approval | REAL (`ready=false` gate) |
| `/join` | accept team invitation | REAL |
| `/legal/terms`, `/legal/privacy` | static copy of `lib/legal-documents.json` | STATIC; versions in DB |
| `/admin` | list users, approve (`ready`, starts trial), reject with reason, extend trial | REAL (Task 3, 4) |
| `/s/[token]`, `/w/[token]`, `/p/[token]`, `/self/[token]` | smart links: generic, monthly 6-step, precursor, self | REAL (90-day expiry, 512 KB state cap) |

### Portal `(portal)/…`

| Route | Purpose | Data |
| --- | --- | --- |
| `dashboard` | KPIs, panels (`components/home/panels.tsx`, `lib/cbam/dashboard-data.ts`) | MIXED: account data real, FX/carbon prices seeded in `lib/cbam/cost-exposure.ts`; `components/dashboard/*` orphaned |
| `workspace` | Excel-style workbook with Table, Flow and Factory views (`components/workspace/spreadsheet.tsx`) | REAL: shared server workbook per installation and year (see §4) |
| `workspaces`, `workspaces/new`, `workspaces/[id]/…` (intake, monthly, months, evidence, mmd, precursors, readiness, settings, tree, carbon-price) | verification workspaces | REAL via account records/reporting |
| `workspaces/installation(s)/…` | installation profile, periods, products, readiness | REAL (`lib/installations.ts`) |
| `workspaces/records` | record browser | REAL |
| `convert`, `convert/[id]` | standard picker + conversion workspace, live requirements with OEM fill-in (`lib/convert/requirements.ts`) | REAL (Task 20). `lib/convert-mock.ts` is gone. |
| `opportunities` | data-gap and reduction cards, summary, printable report | REAL: `certrace:opportunities` (Task 25) |
| `declarations/[id]/…` | declarations, activity, evidence, mmd, verification | REAL |
| `smart-links` | create/revoke links | REAL |
| `suppliers`, `suppliers/[id]`, `supply-chain` | supplier companies + installations | REAL |
| `team` | invite (owner only), members | REAL, except `add-member-modal.tsx` writes local only |
| `reports`, `regulations`, `monitor`, `trace`, `inbox`, `notifications` | reports, regulation feed, monitoring | MIXED (notification read ids local) |
| `carbon-cost` | cost exposure | MIXED (seeded prices) |
| `billing` | plan cards | client-side plan state |
| `settings` | Organisation, Profile, Notifications, Privacy & security | REAL except cookie consent (`CookieModal`, settings/page.tsx ≈1188–1250, localStorage only) |

## 3. Backend modules (`certrace-backend/src/modules`)

| Module | Key routes / functions | Notes |
| --- | --- | --- |
| `auth` | register, login, google, refresh, logout, forgot/reset, change-password, `/me`, `/legal/accept`, `/onboarding/records`, `/onboarded` | No master password (removed, Task 2; config rejects `CERTRACE_MASTER_PASSWORD`). Trial starts at approval (`approved_at`, Task 3). |
| `auth/plugin.ts` | `authenticatedUser` gates `LEGAL_CONSENT_REQUIRED`, `ACCOUNT_NOT_READY` (allowlist: me, legal/accept, onboarding/records, onboarded, `/api/admin/*`) | Trial enforced on the server: writes return `TRIAL_ENDED` (Task 5) |
| `admin` | `GET /api/admin/users`, approve, reject, trial extension | `requireAdmin` = `users.is_admin`; first admin via `bun scripts/grant-admin.ts <email>` (Task 4) |
| `records` | `GET/PUT /api/v1/account/records/:key`, `POST /import` | `save(userId,key,value,revision,actorId,prefix)` |
| `reporting` | report batch save, sealed revisions | |
| `team` | invite (owner, trial block, seat caps imported from `certrace-portal/lib/team-seat-limits`), accept (role `editor`), remove | `records.ts`: shared keys, personal prefix `member:<companyId>:` |
| `links` | smart links create/resolve/submit/revoke | table `smart_links` |
| `files`, `evidence` | DB or R2 storage | |
| `calculations`, `cera`, `declarations`, `master-data`, `reminders` | calc engine, assistant, declarations, catalogues, reminder jobs | |
| `lib/email.ts` | `sendEmail(to, subject, text, idempotencyKey?, action?)`; modes `off|console|resend|smtp` | Production fails at startup unless delivery is `resend` or `smtp` (Task 1). Templates in `lib/email-templates.ts`. |

### Data model highlights (`prisma/schema.prisma`)

- `users`: id, email, password_hash, first/last name, company_name, onboarded, **ready (default false)**, is_admin, google_sub, status (`ACTIVE|SUSPENDED|ANONYMISED`), suspended_at, suspension_reason, anonymised_at, plan_id (`trial`), **trial_started_at default now()**.
- `accounts` (id = owner user id), `account_members`, `team_invitations`, `account_records`, `account_audit_events`, `smart_links`, `password_resets`, `refresh_tokens`, `reporting.records`, `reporting.record_heads`.

## 4. Workspace Excel (server-backed)

- Storage: table `workbooks`, one row per (company, installation, year), cells saved as per-cell patches with a revision (Tasks 11, 13). Team editors share it.
- Tabs: the Installation sheet is a key/value view of the installation record (Task 14). Tab dot colour from `lib/workbook/status.ts` (Task 12): red missing, amber review, green complete, grey untouched.
- Views: Table, Flow (`components/workspace/flow-diagram.tsx`, two-way edits through `lib/workbook/flow-edit.ts` and `sync-queue.ts`; Tasks 15, 16) and Factory (`view=factory`, Task 23).
- Import: `components/workspace/import-wizard.tsx` with `lib/workbook/import.ts` and `xlsx.ts` (`.xlsx` read with `DecompressionStream`; Task 17).
- Live panel: `components/workspace/live-panel.tsx` with `lib/workbook/balance.ts` and `estimate.ts` (Task 18).
- Sync: `lib/workbook/use-workbook.ts` polls on a revision (Task 13).
- `lib/workspace-sheets.ts` still holds the sample sheet definitions, with `issuesOf(s)` for rows with status `review|missing`. Required columns sit next to them.

## 5. Installations and active installation

- `lib/installations.ts`: `Installation` (CBAM template fields i–xiv: name, nameLocal, self, supplierId, street, economicActivity, postcode, poBox, city, country, unlocode, lat, lng, contactName/Email/Phone, …) — account-backed. Helpers `listInstallations`, `ownInstallations`, `missingFields`, `isInstallationComplete`.
- `lib/active-installation.ts`: active installation in localStorage `certrace:active-installation`. `/workspace` and `/convert` have their own switcher in the URL (`?installation=`); the global switcher was removed (Task 19).
- Each installation has `role: own | oem` (Task 20). OEM fill-in on Convert opens that installation's sheet.
- Factory profile per installation in record `certrace:factory:<installationId>` (Task 22).

## 6. Onboarding profile (`lib/profile.tsx`)

Collected today: firstName, lastName, jobTitle, companyName, sector, installationId, jurisdiction, currency, unit (`tCO₂e`), goalAchieve[], currentManagement[], biggestChallenge[], cbamProductCount, supplierCount, installationCount, customerCount, hearAbout, phone, lineId.

Backend `profile-contract.ts` checks format and length: for example tax ID is 13 digits, and employee and production bands are fixed sets (Task 10).

## 7. Design system

- Tokens in `certrace-portal/app/globals.css` `@theme`. Light mode only.
- Colours: ok `#16a34a`/`#10b981` (chip bg `#ecfdf5`, fg `#047857`), warn `#b45309` (chip `#fffbeb`), err `#dc2626` (chip `#fef2f2`), info `#2563eb`, muted `#c7c5be`, canvas `#f5f4f0`, ink `#111`.
- Fonts: IBM Plex Sans 300 (display), Geist (UI), Geist Mono (numbers), Courier Prime (pixel eyebrows).
- Primitives `components/ui.tsx`: `StatusDot`, `Card`, `Button`, `Chip(tone)`, `Progress`, `Modal`, `PageHeader`, `Field`. `Tone = "ok"|"info"|"warn"|"err"|"muted"`.
- Workspace state tones `components/workspace/chrome.tsx:45-52`: complete=ok, incomplete=warn (amber), blocked=err (red). `StateChip` duplicated in `chrome.tsx:63` and `supply-chain/overview.tsx:44`.
- ~1076 hardcoded hex literals outside tokens.
- No diagram library. Inline SVG precedent: `components/insight/charts.tsx`.

## 8. Old portal parity (portal.certrace.co)

- Sidebar: Dashboard, Verification, Smart Links, Supply Chain, Reports, Carbon & Cost, Team & seats, Plan & billing, Settings.
- Trial badge "Free trial N d left", 30 days. Team: Owner/Member; suppliers never take a seat. Plans Starter/Standard/Enterprise.
- Flow: register → company info → wait for approval → email → use.

## 9. Gap list (input to the plan)

| # | Gap | Severity | Status |
| --- | --- | --- | --- |
| G1 | Master password universal login | security, high | Closed by Task 2 |
| G2 | Trial enforced client-side only; starts at registration | high | Closed by Task 3 (start at approval) and Task 5 (server `TRIAL_ENDED`) |
| G3 | No welcome / approved / trial-reminder / trial-expired emails; admin not notified of new signups | high | Closed by Tasks 3, 4, 6, 7, 9 |
| G4 | Email delivery defaults off; forgot-password silently no-ops | high | Closed by Task 1 |
| G5 | No first-admin bootstrap; no suspend/extend-trial admin actions | medium | Closed by Task 4 |
| G6 | Onboarding validation presence-only | medium | Closed by Task 10 |
| G7 | Cookie consent local only, no banner, no record | medium (PDPA/GDPR) | Closed by Task 8 |
| G8 | Workspace Excel local + mock; no tab status, no Installation tab, no sharing | high | Closed by Tasks 11, 12, 13, 14, 17 |
| G9 | Convert mock; no OEM fill-in | high | Closed by Task 20 |
| G10 | Active installation global; user wants scoped switch on Convert + Workspace only | medium | Closed by Task 19 |
| G11 | No factory (equipment/energy) data; no simulator | feature | Closed by Tasks 22, 23, 24 |
| G12 | No flow diagram of the workspace | feature | Closed by Tasks 15, 16 |
| G13 | Team vs smart-link routing not explained in UI; `add-member-modal` local only | medium | Closed by Task 21 |
| G14 | Cross-package import of team-seat-limits | low | Open: still imported from `certrace-portal/lib/team-seat-limits` in `certrace-backend/src/modules/team/service.ts`; no task covered it |
| G15 | compose fallback secrets | security, high | Closed by Task 1 (`compose.yaml` uses `:?` for the database password and JWT secret) |

## 10. MEASUR reference (process models to port)

Source: ORNL-AMO/MEASUR-Tools-Suite (UT-Battelle permissive licence, not MIT). Re-implement formulas in TypeScript; do not copy C++. Fixtures (verified with a scratch port):

- Excess air from O₂ (fraction): `EA = 8.52381·o2 / (2 − 9.52381·o2)`.
- Siegert stack loss: `qA = (Ts − Ta)·(A2/(21 − O2) + B)`, natural gas A2 0.66 B 0.009; oil 0.68/0.007; LPG 0.63/0.008; efficiency `100 − qA`. Ts 200, Ta 25: O₂ 3 → 7.9917; O₂ 4 → 8.3691; O₂ 6 → 9.2750.
- Exhaust fixed excess air: `cp = 0.017828518 + 2.556e-6·Ta`, `AC = −1.078913827`, `avail% = (95 − 0.025·Te) − (AC + cp·Te)·(EA/100) + (AC + cp·Ta)·(1 + EA/100)`. EA 65, Ta 300, Te 550 → 82.727942398 %.
- Wall loss (°F, ft², Btu/h): `Q = (h·A·ΔT + A·ε·σ·((Ts+459.67)⁴ − (Ta+459.67)⁴))·cf`, `h = fshape·(1/24)^0.2·ΔT^0.266·(1/Tbar)^0.181·√(1 + 1.277·v)`, `σ = 1.713441e-9`, `Tbar = (Ts+Ta)/2` (°F, not Rankine). A 500, Ta 80, Ts 225, v 10, ε 0.9, shape 1.394 → 404487.5888.
- Opening radiation: `Q = ε·σ·A·((Tin+460)⁴ − (Tamb+460)⁴)·F·t/100`. D 12 in, ε 0.95, Tamb 75, Tin 1600, F 0.70 → 16042.3989.
- Boiler balance: `Mfw = Ms/(1 − BD/100)`, `Eboiler = Esteam + Ebd − Efw`, `Efuel = Eboiler/(η/100)`.
- MEASUR has no Sankey for PHAST; build our own.

## 11. Features added in portal8 production

- `/opportunities`: data-gap and reduction cards with impact, status and assignment, a summary card and a printable report (`app/(portal)/opportunities/page.tsx`, `lib/factory/opportunities*.ts`). Gap cards close when the gap is filled. Nav entry in `portal-shell.tsx`.
- Workspace Flow view: two-way diagram of products, steps, materials and outputs (Tasks 15, 16).
- Workspace Factory view: factory map coloured by sheet status with gap badges (`components/factory/factory-map.tsx`, `lib/factory/map.ts`) (Task 23).
- Import wizard: Excel or CSV into one sheet, with header row, column mapping and preview (Task 17).
- Live panel: per-sheet completeness, mass balance and embedded-emissions estimate, recomputed on each edit (Task 18).
- Dashboard installation directory: one card per installation with factory progress (`components/factory/installation-directory.tsx`, `lib/factory/directory.ts`) (Task 23).
- CBAM what-if: current estimate against EU default values and reduction scenarios (`components/factory/what-if-panel.tsx`, `lib/factory/what-if.ts`) (Task 24). No energy formulas.

## 12. Known gaps

- Smart link `?installation` is not supported.
- Opportunities use `exportedT = productionT`.
- zh and hi fall back to English for new keys.
- Thai wording needs native review.
- `?year=` is not written back to the URL.
- Seat roles are not exposed in the portal.
- Ferro-alloys `DIRECT_ONLY` is keyed by category, but Annex II of Regulation (EU) 2023/956 is CN-level (7202 1x/4x/60 are direct-only; other 7202 codes are indirect). Not verified against the official text.
- G14 (cross-package import of team-seat-limits) is still open.
