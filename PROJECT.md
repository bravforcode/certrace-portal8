# Certrace project structure

This document maps the applications and supporting files in this repository. The root [README](README.md) has the commands for running the system.

## At a glance

Certrace is a Bun workspace containing a Next.js customer portal and an Elysia API. The portal calls the API through the same-origin `/backend` rewrite. The API uses Prisma with PostgreSQL for account/report data and file metadata. Uploaded bytes can use private Cloudflare R2 storage; existing database files remain readable. Supplier links expose token-scoped forms without requiring a supplier account.

```text
Browser
  └─ Next.js portal (:3000)
       ├─ customer and supplier screens
       └─ /backend/* → Elysia API (:8000) → PostgreSQL (:5432)
```

## Repository map

```text
.
├── certrace-portal/              Next.js and React application
│   ├── app/                       App Router pages and layouts
│   ├── components/                Shared and feature-specific UI
│   ├── lib/                       Domain logic, stores, calculations, API client
│   │   ├── api/                   Typed backend client and session handling
│   │   └── cbam/                  CBAM calculations and report generation
│   ├── e2e/                       Playwright browser tests
│   ├── scripts/                   Build, validation, and fixture utilities
│   ├── public/                    Static assets and fonts
│   └── docs/                      Portal design and implementation notes
├── certrace-backend/             Bun and Elysia API
│   ├── src/index.ts              Server startup and shutdown
│   ├── src/app.ts                API composition and shared HTTP handling
│   ├── src/lib/                  Database, configuration, security, email
│   ├── src/modules/              Feature routes, services, and models
│   ├── prisma/                   Prisma schema and SQL migrations
│   ├── scripts/                  Schema generation and migration utilities
│   ├── test/                     API, calculation, and reporting tests
│   └── postman/                  Smart Link request collection
├── docs/                         CBAM requirements and database references
│   ├── database/                Data model, implemented columns, input mapping
│   └── fixtures/                Shared calculation fixture
├── docker/migrate/               Prisma migration image package and lockfile
├── scripts/                      Deployment and migration test scripts
├── .github/workflows/            Checks, migration tests, image publishing
├── .githooks/                    Opt-in pre-commit formatting and typecheck
├── .agents/skills/security-audit/ Project-local security audit agent skill
├── compose.yaml                  Local PostgreSQL, migration, API, portal stack
├── docker-compose-prod.yml       Published-image VPS stack
├── Caddyfile                     Production HTTPS proxy to frontend:3000
├── .env.example                  Local environment template
├── .env.production.example       Production environment template
├── package.json                  Workspace scripts and package membership
├── skills-lock.json              Project-local agent skill source lock
└── bun.lock                      Workspace dependency lockfile
```

Generated build output and installed dependencies, such as `node_modules/` and `.next/`, are omitted from this map.

## Portal

The route tree in `certrace-portal/app/` has four main areas:

| Area | Main paths | Purpose |
| --- | --- | --- |
| Account access | `/login`, `/register`, `/auth/google`, password reset, `/onboarding`, `/onboarding/done`, `/pending`, `/admin` | Sign-in, registration questions, readiness wait for returning users, and admin user management |
| Customer portal | `app/(portal)/` | Dashboard, declarations, suppliers, Smart Links, inbox, reports, billing, team, settings, and `/opportunities` (data-gap and reduction cards with a printable report) |
| Verification | `app/(portal)/workspaces/` | Installation profiles, reporting years, monthly data, precursors, evidence, and readiness |
| Supplier link forms | `/s/[token]`, `/w/[token]`, `/p/[token]` | General supplier, monthly, and precursor data requests |
| Self-supply | `/self/[token]` | The exporter enters data for its own installation |

`components/` holds reusable screens and controls. `lib/api/client.ts` infers API types from the backend `App`; `lib/account-storage.ts` hydrates a working copy from PostgreSQL and queues revision-checked saves. `lib/cbam/` contains the portal's calculation, validation, and report-output code. `next.config.ts` defines the `/backend` rewrite.

Company/report inputs and Cera history persist through the backend; their browser
working copy is in memory. Public supplier and precursor forms require server-issued
links and saved server state, and acknowledge server submission and file uploads.
Demo token fallbacks, simulated supplier submissions/revisions, device-local
supplier-account flags and their dashboard metrics have been removed. Browser
preferences remain local. Old browser records/files are read only by the explicit
recovery import; the demo account marker is excluded. Test-only fixtures can still
use isolated Web Storage without an API; production never enables that fallback.
Dashboard, Supply Chain and notifications show only account records; empty accounts
show setup actions instead of sample figures. The public sample document loaders
and bundled demo documents have been removed. Calculation and Cera test fixtures
remain under their test directories. Fictional declarations and suppliers were
removed from `lib/data.ts`; tests use a small fixture under `lib/__tests__/fixtures/`.
Settings now sends password changes to the backend and does not show fabricated
device sessions or a simulated email-change confirmation.

The workspace (`/workspace`) has Table, Flow and Factory views over one shared server
workbook per installation and year. It also has an import wizard for Excel or CSV,
a live panel (completeness, mass balance, embedded-emissions estimate), and the
factory map and CBAM what-if in `components/factory/`. The dashboard shows an
installation directory card per installation. Factory and opportunity data live in
records `certrace:factory:<installationId>` and `certrace:opportunities`.

The frontend parity port in the working tree adds installation pages under
`/workspaces/installation/[iid]`, Supply Chain, notifications, Cera, and the
reference Carbon & Cost screens. `AccountDataProvider` refreshes server records
on focus, reconnect and every 30 seconds while visible, preserving pending edits.
Shared save controls wait for backend acknowledgement. The public monthly form's
existing save badge also tracks pending document uploads/removals and their server
errors, so it cannot show saved while an attachment write has failed. Monthly supplier submission
and owner revision/approval use server-persisted state; reopening atomically carries
the owner’s current corrections back to the supplier. Closed links refresh review
decisions and require owner reopening before another submission. Fonts are self-hosted in
`public/fonts/`; `app/parity-fonts.css` adds Inter, Plex Devanagari and Noto Sans SC
with their license files. Font variables use the reference's body scope. Returning
accounts now enter the customer workspace directly on sign-in once ready;
new registrations enter the questionnaire before workspace approval.
The questionnaire waits for profile persistence, preserves research answers and
notification choices, and displays the existing server trial dates. Profile
patches are queued synchronously through `lib/profile-storage.ts` before callers
await the save. The local screen/flow checks and their limits are recorded in the
[parity acceptance report](docs/CERTRACE-NEW-PARITY-ACCEPTANCE.md).

Cera's ordinary questions use `lib/cera/ai-reply.ts` and authenticated
`POST /api/v1/cera/chat`. With a server-side `DEEPSEEK_API_KEY`, the backend uses
the Vercel AI SDK's direct DeepSeek provider with recent conversation text,
current account-owned report inputs, and the existing `knowledge-cbam.ts` and
`knowledge-platform.ts` reference entries. The backend image copies these shared
knowledge modules from the portal. The model defaults to `deepseek-flash` and can
be set with `CERTRACE_CERA_MODEL`. Without a key, the existing rule answer and
cards are preserved; provider/network failures visibly fall back. Public supplier
links keep their existing scoped workflows. Authenticated Cera document cards
accept PDF, PNG, JPEG, DOCX, PPTX, TXT, CSV, TSV, Markdown, JSON and XLSX. Smart
upload reads the source in memory without saving its bytes to R2 or PostgreSQL.
The backend reads selectable PDF text
directly when a page has enough text; otherwise it renders the page for DeepSeek
OCR 2 via Novita. At most 20 PDF pages are read. Direct PNG/JPEG uploads use OCR.
Text-bearing DOCX/PPTX files, UTF-8 text and spreadsheet cells are read directly;
image-only Office files must be exported as PDF. The Vercel AI SDK DeepSeek
provider maps cited values against the report autofill catalogue. PDF/image OCR
needs `NOVITA_API_KEY` and `DEEPSEEK_API_KEY`; text, Office and XLSX need only
the DeepSeek key. Without that key,
text/CSV retains its existing rule fill flow.
Only reviewed, selected proposals can reach the versioned report save endpoint.
When no month is selected, Smart upload maps monthly fields only if the document
text or filename identifies one clear month inside the report period.
Temporary Smart uploads do not create report evidence links; a source that must be
retained is attached separately through the report's normal R2-backed upload.
Chat cannot mutate records; resets and account changes cancel pending answers.

Cera's text/CSV fill confirmation uses `lib/cera/confirmed-fill.ts` to wait for
account or supplier-draft persistence before showing success. Failed saves can
be retried without applying the readings twice. Interrupted fills in saved chat
history require reviewing the form rather than replaying appended rows or notes.

Authenticated JSON and file requests bind to the account loaded by the tab;
the backend rejects a different cookie identity, and late responses cannot
clear or replace a newer session. Report exports share
`lib/cbam/download-package.ts`: save pending changes, refresh server records,
recheck readiness, then assemble the reports and original evidence files.
The package and its evidence index include the selected methodology's diagram;
copying methodology to another year retains its account-owned file reference.

Precursor links serialize autosaves and submission, preserve edit buffers across
query refreshes, and expose retryable save failures. Accepted precursor responses,
receipt timestamps and scoped evidence replacement are committed by the backend;
exporter pulls read those canonical records instead of replaying supplier drafts.
The existing verification-report and optional summary-report attachment slots
retain their separate bindings through upload, reload and submission. Attachment-only
edits trigger the same draft save; reopening uses the saved attachment list so
removed files do not return from the original request snapshot.
The optional `supplierReportUnavailable` JSON field distinguishes an explicit
missing-report response from an ordinary draft awaiting verification. Calendar
controls use `lib/calendar-date.ts` to display both date-only form values and
timestamp values returned by the backend without shifting their calendar day.

On the Team page, owners can add reviewer contacts or invite a member by email.
Reviewer contacts keep their existing IDs and carry no login rights. Invitations
reserve a plan seat until accepted, cancelled or expired. The emailed link opens
`/join` and requires sign-in with the invited address, current legal consent,
and admin readiness. The company's existing reports and files are opened under
the member's own authenticated session. Team includes a company selector for
users with multiple workspaces. Sidebar and billing count the owner, active
members and pending invitations. Smart Link precursor deadlines and the Methodology
coverage banner handle backend timestamps as calendar dates, preserving the
reference's displayed day and layout.

The existing legacy self-supply route (`/self/[token]`) resolves the signed-in
account's declaration through `lib/self-supply.ts`, then opens the same supplier
form with its persisted response. Self-supply opens reuse that response under the
account lock so reloads and concurrent tabs do not split the saved answers.
Normal externally sent supplier requests retain their existing link behavior.

Registration uses the reference's single form with its combined Terms/Privacy
checkbox and Create account action. It submits both current document version IDs
and acceptance flags to the existing backend, then opens `/onboarding`.
New users have `ready=false` until approved; the access reset migration also
marks all existing users unready. Unready users can answer the registration
questionnaire through a profile-only endpoint, which marks the questionnaire
complete after saving, but cannot enter the customer portal. Unready sign-ins
and blocked workspace visits open `/pending`; returning ready users go
straight to the workspace. A stale
version clears the checkbox and refreshes those IDs without discarding the typed
details. The published-document links open the existing public versioned pages.

`/admin` lists registered users and lets an admin change `ready`. The backend
checks the signed-in account's `is_admin` flag on every admin request and audits
readiness changes. Unready accounts can use sign-in, legal consent, status
checks, registration profile routes, and admin routes if they have the admin
role; customer workspace APIs reject them.
All accounts start with `is_admin=false`; a database operator grants the first
admin role. Profile and report data remain in their existing revisioned storage
and are not edited through this panel.

Legacy declaration activity, boundary, Methodology and evidence mutations use
the same acknowledged account persistence helper as the newer report pages.
Their save/finalise/upload callbacks wait before showing success. Methodology
version comparisons treat serialized period timestamps as calendar dates, so
reloading a just-finalised version does not invent reporting-period edits.

The generic public supplier form (`/s/[token]`) orders autosaves and submission,
waits for the server receipt, and keeps failed sign-offs on the signing screen.
Its existing toast messages render in the supplier shell. Revision autosaves
retain the active view and carry regenerated totals with the permitted inputs.
Public links read the exporter's company from the current versioned profile.
The typed API client preserves JSON date strings rather than reviving them as
`Date` objects, keeping dated supplier answers and attestations valid on reload.

Supplier and installation creation dialogs acknowledge account persistence before
showing the reference confirmation and closing. The product-report wizard waits
for a new own site or saved draft before advancing or leaving. Creation retries
reuse the wizard's report ID; precursor links and draft removal finish before
the existing destination opens. Independent creations retain the reference's
support for reports with the same site, product and year.

Report duplication waits for account persistence before opening the copy. A
failed save retains that copy's ID and choices for retry. Archive and restore
menus, and the card/table Restore action, show success only after the backend
acknowledges the change. These use the reference's existing controls and copy
rules; monthly figures, evidence and sign-offs still start new on duplication.
The "Made at this installation" precursor rows keep their immediate working-copy
updates, while their existing save badge follows account persistence, including
failed saves and the shared Retry action.

## Backend and database

`certrace-backend/src/app.ts` mounts these feature modules:

| Module | Responsibility |
| --- | --- |
| `auth` | Registration, sign-in, sessions, and account access |
| `team` | Invitations, membership checks and company selection |
| `admin` | Admin-only user listing and readiness changes |
| `declarations` | Exporter declarations |
| `links` | Supplier Smart Link creation and token-scoped state |
| `files` | Account and link-scoped uploads and downloads |
| `records` | Account-owned records and import compatibility |
| `reporting` | Validated JSON documents, immutable revisions, and projections |
| `master-data` | Shared company, installation, and product identities |
| `calculations` | Backend CBAM calculation endpoint |
| `reminders` | Reminder subjects and scheduled delivery endpoint |
| `evidence` | Evidence extraction and reviewed PDF report autofill |
| `cera` | Authenticated DeepSeek chat using current company records and Cera's shared knowledge; rule fallback without a key |

The executable database definition is `certrace-backend/prisma/schema.prisma` plus the committed migrations in `certrace-backend/prisma/migrations/`. Report inputs and onboarding are stored as JSONB revision documents in `reporting`; shared company, installation, and product facts use versioned `masterdata` records. The active schema contains 38 models. See the [compact schema guide](docs/database/CERTRACE-V2-SCHEMA.md) for current persistence. Older database implementation/column documents describe historical typed storage.

The reference-app parity work is documented in the [parity plan](docs/CERTRACE-NEW-PARITY-PLAN.md). Migration `202610270001_compact_reports` preserves users and onboarding (including history and legacy source copies), resets old typed report inputs, and removes the form tables. The reporting storage adapter supports the existing APIs on the new schema. The frontend parity port remains separate. `scripts/test-verification-schema.ts` rehearses preservation and all backend tests in a disposable PostgreSQL container; its fixtures live in `certrace-backend/test/fixtures/`. Historical migration decoders are retained there. The read-only protected-table audit is in `docs/database/certrace-v2-preservation-audit.sql`.

Keep all fifteen SQL migrations in order: nine historical migrations, the compact upgrade, the additive R2 file-location migration, the user readiness migration, the admin access migration, the access reset migration, and the additive team invitations migration. The obsolete SQL generators have been removed; `scripts/generate-report-storage.ts` now generates only document contracts and report metadata. Historical shape names still identify shared-master bindings, not physical form tables. `db:report-catalogue` checks those contracts and autofill reference data without rewriting migrations.

`src/modules/files/storage.ts` selects database or private R2 bytes while retaining
the existing account/token download checks. `CERTRACE_FILE_STORAGE=r2` requires
the backend's R2 endpoint, bucket and S3 credentials. File metadata stays in SQL;
old database files remain readable. `src/scripts/migrate-files-to-r2.ts` copies
existing files with a SHA-256 read-back check, retaining database copies until
`--clear-db-bytes` is explicitly requested. See [R2 setup and recovery](docs/R2-STORAGE.md).
R2-backed bytes require a separate bucket backup as well as the SQL backup.

Monthly evidence extraction runs only for supported bills, consumption logs and
production records. Diagrams, calibration certificates and other supporting
documents save as evidence without automatic reading. The Documents cards show
proposals for review before any monthly value changes. Public suppliers use
live-token-scoped `/api/v1/links/:token/evidence` routes; signed-in readers keep
the account routes. Both share the owner's extraction rate limit and require a
configured server-side Anthropic key. Original files are read as Blobs rather
than fetched through inline URLs, preserving the portal's existing CSP.

## Operations and checks

`compose.yaml` starts PostgreSQL, runs the one-shot migration service, and then starts the API and portal. `docker-compose-prod.yml` uses published images for the same service layout. The workflows in `.github/workflows/` run checks and migration tests before publishing images.

Production also runs `caddy`, mounting the root `Caddyfile` to proxy
`portal.certrace.co` to `frontend:3000` over HTTPS. Ports 80/443 are published;
`caddy_data` and `caddy_config` retain certificate and proxy state. VPS deployments
copy the production template as `docker-compose.yml`, matching the production
environment example's `COMPOSE_FILE` setting. Local Compose has no Caddy service.

Both Compose files load the root `.env` into the backend through optional
`env_file` (Compose 2.24+). API keys and additional backend settings are configured
there without adding Compose entries. Explicit environment overrides retain the
container database URL, service port, public origins and deployment defaults;
production still requires the database password, JWT secret and public URL.

### Scheduled jobs

Trial reminder emails (7 days and 1 day before the end, and an "ended" email) are
sent by `certrace-backend/src/modules/reminders/trial-emails.ts`, through
`POST /api/internal/jobs/trial-emails` in `reminders/index.ts`. The job needs
`Authorization: Bearer $CERTRACE_JOBS_TOKEN`; without that variable the endpoint
returns 404. Each reminder is claimed in `email_deliveries` before sending, so a
repeat run the same day does not send it twice.

Schedule one `POST` to that endpoint once a day. No cron is configured yet: neither
`compose.yaml` nor `.github/workflows/` runs it. Until a scheduler is added, trial
reminders are not sent. `POST /api/internal/jobs/send-reminders` is a separate job
guarded by the same token.

Run workspace checks from the repository root:

```bash
bun run typecheck
bun run test:frontend
bun run test:backend
bun run test:migrations
```

Backend integration and migration tests need PostgreSQL; portal browser tests are under `certrace-portal/e2e/`. The remaining files in `docs/` describe CBAM input requirements, current field references, and the report database design.

## Legal document versions and acceptance

The auth module serves the current bilingual Terms of Service and Privacy Policy
from `public.legal_document_versions` at `GET /api/auth/legal/documents`. Signup
binds its consent to these current snapshots; renewal, `/legal/terms` and
`/legal/privacy` render them with version numbers. `public.legal_acceptances` records each user's first acceptance
of each version, with server time, IP address when available, user agent, and
registration/Google/renewal source. Retries preserve the original evidence.
Historical generic audit events are retained but are not treated as versioned
acceptance; existing users must accept once after this migration.

The published Terms and Privacy pages use the reference's logo/back header,
reading width and document typography. Their English/Thai sections, version and
publication date still come from the published backend snapshots; the existing
document language choice is retained. Page styling does not rewrite legal content
or acceptance records.

To publish a revision, add a migration that, in one transaction, sets
`is_current=false` for the affected kind and inserts a new row with a new version,
complete `content` (`en` and `th` arrays of sections containing `{kind, text}`),
publication timestamp, and `is_current=true`. Never edit a published snapshot:
the database rejects changes to its identity, content, or timestamp. The unique
current-kind index permits only one current version per document. Existing
acceptances are retained and authenticated account endpoints require the current
versions. `GET /api/auth/me`, acceptance, login, and logout remain available so
users can review and accept. Public supplier-token routes remain independent.
The external marketing site's legal pages are maintained separately.

`CERTRACE_TRUSTED_PROXY_HOPS` defaults to `0`, recording the direct connection IP.
For a deployment behind trusted proxies, configure the number of entries counted
from the right of `X-Forwarded-For` to reach the client address. Only enable this
when the backend is reachable exclusively through that proxy chain and the edge
proxy overwrites untrusted forwarding headers or appends its observed peer IP.
Next.js rewrites alone preserve incoming forwarding headers and are not a
sanitizing edge. With no trusted chain, the recorded IP may be the portal proxy;
unknown or invalid addresses are stored as null rather than fabricated.
