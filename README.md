# Certrace

Next.js/React frontend, Elysia on Bun, Prisma 7, and PostgreSQL 18.

## Run with Docker

```bash
docker compose up --build -d
```

This starts three persistent services (`database`, `backend`, `frontend`) and a one-shot `migrate` container. After PostgreSQL is healthy, `migrate` runs `prisma migrate deploy`, then exits successfully before either application starts. Open http://localhost:3000. API documentation is at http://localhost:8000/docs; the frontend uses the same-origin `/backend` proxy. PostgreSQL stores its data in the named `database` volume, which survives container restarts and `docker compose down`.

Defaults are for local development. Copy `.env.example` to `.env` to configure ports, credentials, Google sign-in, email, and optional document extraction. For HTTPS deployments set `APP_BASE_URL` to the public frontend origin and `COOKIE_SECURE=true`. Set unique database/JWT secrets before deployment. Do not use `docker compose down -v` on a database whose data you need.

Docker Compose 2.24+ is required. Both Compose files load the root `.env` into the
backend with `env_file`, so API keys and new backend settings only need an entry
in `.env`. The remaining `environment` entries retain container addresses, ports,
required production credentials and deployment defaults. The frontend and migration
services receive only their explicitly configured variables. After changing `.env`,
run `docker compose up -d backend` to recreate the backend with the updated values;
an image rebuild is unnecessary for environment-only changes.

Set `CERTRACE_MASTER_PASSWORD` in the root `.env` to allow sign-in to any
existing active account using its email and that password. Leave it empty to disable
this access. Account readiness rules still apply. Use a long random value and keep
it out of the frontend environment.

## Deploy published images on a VPS

For the compact-schema upgrade (`202610270001_compact_reports`), follow the
[coordinated migration/backend rollout](docs/database/CERTRACE-V2-SCHEMA.md#production-deployment):
stop the old application, take a backup, migrate, then start the matching release.
This upgrade preserves users and onboarding but intentionally resets old typed
report inputs and removes their form tables.

Pushing to `origin/main` runs Biome formatting, ESLint, TypeScript and generated
contract checks, frontend unit tests, backend PostgreSQL integration tests, and
both migration test jobs in parallel. Only after all checks pass does it build and publish `migrate`,
`backend`, and `frontend` images to `ghcr.io/mikaoverdose/ceatrace`. Images support
AMD64 for the DigitalOcean VPS, with one native build per service and cached Docker layers.
Wait for the **Publish application images** workflow to succeed.

Copy `docker-compose-prod.yml` to the VPS as `docker-compose.yml`, place
`Caddyfile` beside it, and copy `.env.production.example` as `.env`. Set your
secrets and `APP_BASE_URL=https://portal.certrace.co`. The example's `COMPOSE_FILE`
selects `docker-compose.yml`, so deployment is:

```bash
docker compose pull
docker compose up -d
```

Compose automatically runs `migrate` after PostgreSQL is healthy; the backend and
frontend start after it succeeds. The VPS needs no source checkout, Bun, build
step, or deploy script. Existing data stays in the named database volume. Commit
new SQL migrations alongside schema changes and retain production backups.

The production `caddy` service mounts your `Caddyfile` and proxies
`portal.certrace.co` to `frontend:3000`. It publishes HTTP/HTTPS on ports 80/443
and retains certificates and state in `caddy_data` and `caddy_config`. Keep those
existing volume names when updating a custom VPS Compose file. For another domain,
update both `Caddyfile` and `APP_BASE_URL`; point its DNS at the VPS and allow ports
80/443. Local `compose.yaml` continues to serve the portal directly on port 3000.

To start the proxy or reload an edited Caddyfile:

```bash
docker compose up -d caddy
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

For private Cloudflare R2 uploads, follow [R2 setup and file migration](docs/R2-STORAGE.md).
Existing database files stay readable. After enabling R2, back up the bucket as
well as PostgreSQL; a SQL dump alone does not contain new uploaded file bytes.

If port 3000 is occupied:

```bash
FRONTEND_PORT=3001 APP_BASE_URL=http://localhost:3001 docker compose up -d
```

## Develop without rebuilding containers

Requires Bun 1.3.10+, Node.js 22.18+, and Docker:

```bash
bun install --frozen-lockfile
docker compose up -d database
bun run db:generate
bun run db:migrate
CERTRACE_JWT_SECRET=local-development-change-before-deployment bun run --cwd certrace-backend dev
# In another terminal:
BACKEND_INTERNAL_URL=http://localhost:8000 bun run --cwd certrace-portal dev
```

The default local database URL is `postgresql://certrace:certrace-local@localhost:55432/certrace`. Override `DATABASE_URL` when using different credentials. Run the application with Bun or Docker Compose; no Python runtime is required.

## Admin user management

After deploying migrations, register or identify the account that should administer users. A database operator must grant its admin role once:

```sql
SELECT id, email FROM public.users WHERE email = 'admin@example.com';
UPDATE public.users SET is_admin = true, updated_at = now() WHERE id = '<verified-user-id>';
```

Sign in with that account and open `/admin`. The page lists registered users, supports search and pagination, and lets the admin switch each user's access to the customer workspace. New accounts have `is_admin=false`; the admin API checks this flag on every request. Migration `202610290003_reset_user_readiness` marks every existing account unready when deployed. New registrations can answer onboarding questions before approval; unready sign-ins and blocked workspace visits open `/onboarding/done`; returning ready users enter the workspace directly. The page shows account identity and status but does not edit passwords, legal consent, profile answers, or report data.

## Cera chat with DeepSeek

Set these in the root `.env` for Docker Compose, or in `certrace-backend/.env`
when running the backend directly:

```dotenv
DEEPSEEK_API_KEY=your-deepseek-api-key
CERTRACE_CERA_MODEL=deepseek-flash
NOVITA_API_KEY=your-novita-api-key
CERTRACE_OCR_MODEL=deepseek/deepseek-ocr-2
CERTRACE_AUTOFILL_MODEL=deepseek-flash
```

Rebuild or deploy the updated backend, then restart it (`docker compose up -d backend`
for Compose). Open
**Cera Intelligence** and ask about your company, installations, suppliers or
reports. The backend uses the Vercel AI SDK's direct DeepSeek provider. The model
is configurable; the default is `deepseek-flash`.

The API key stays on the server. With a key, Cera sends recent chat text, a bounded
selection of the signed-in account's current saved company/report inputs, and its
existing CBAM/platform knowledge to DeepSeek. The rule-engine reference answer can
reflect the tab's working copy; the company record context uses saved inputs.
Ordinary chat never sends document bytes. Supplier link tokens and credentials are excluded.
Replies are read-only.
Supplier-facing public links continue to use the scoped rule-based assistant.

For report autofill, send Cera a PDF, PNG, JPEG, DOCX, PPTX, TXT, CSV, TSV,
Markdown, JSON or XLSX file. Smart upload starts a new Cera chat with a file
chooser and accepts up to 10 files for one product report. Choose that report.
Cera detects one clear reporting month in each document or filename; select a
month yourself if it is missing or ambiguous. A selected month applies to the
whole batch. Cera reads the files in order, with a review and apply
step for each before reading the next. The selected files carry into the review
card without a second picker. The backend reads each original in memory without
saving its bytes to R2 or PostgreSQL. It reads
selectable PDF text directly when a page has enough text; otherwise it renders
that page and sends the image to DeepSeek OCR 2 through Novita. It reads up to
the first 20 PDF pages. Uploaded PNG/JPEG images also use OCR. Text-bearing
DOCX/PPTX files, UTF-8 text and spreadsheet cells are read directly. Export
image-only Office files as PDF for OCR. The same DeepSeek key as chat proposes
values against the report's allowed fields.
Every proposed value cites source text and remains unapplied until the user
selects and confirms it. The backend rejects unsupported fields, stale reports,
unmatched quotes and invalid units. PDF/image OCR needs `NOVITA_API_KEY` and
`DEEPSEEK_API_KEY`; direct text, Office and XLSX mapping need only the DeepSeek
key. Without it, text/CSV smart upload
retains its existing rule-based flow. Supplier-facing links remain scoped to
their existing rule-based fill flow. `ANTHROPIC_API_KEY` is only
for the separate legacy evidence extraction on monthly attachments.
Smart upload does not attach the original as report evidence. Use the report's
normal document upload to keep a source file in R2 when it must be retained.

Leave `DEEPSEEK_API_KEY` empty to retain Cera's existing rule-based answers.
If DeepSeek fails, times out or reaches the chat rate limit, Cera labels the
fallback and shows its rule-based answer. Chat allows 30 AI requests per account
per hour, up to 4,000 characters per question and 12 recent messages. Large account
contexts may be partial; ask about a specific report or period for more detail.

Focused checks: `bun test certrace-backend/test/cera.test.ts` and the Cera tests
included in `bun run test:frontend`. Backend integration tests require a migrated
PostgreSQL database. The local browser regression is
`certrace-portal/e2e/cera-chat.spec.ts` and expects a backend without a DeepSeek key;
AI replies in that test are stubbed, so it makes no paid provider calls.

## Registration Google Sheet

The backend sends a `Pending` row to the `Registrations` tab when an account is created. Completing the questionnaire updates that row to `Completed` with the answers. It posts to the same Google Apps Script endpoint used by the landing page. PostgreSQL remains the source of truth.

The `Registrations` tab uses these 19 columns:

```text
user_id,registered_at,email,first_name,last_name,company_name,question_status,sector,job_title,goals,current_management,biggest_challenges,cbam_product_count,supplier_count,installation_count,customer_count,heard_about,phone,line_id
```

Set the landing page's endpoint in the backend environment or Compose `.env`:

```text
CERTRACE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbyPdRpxCS8PaLklVLW4ga6UC097xz_NLZo5CkfhSj2HuOhvX_3c_dP6XTBsUsw9z-uA/exec
```

The Apps Script deployment must allow `Registrations` in `FORM_TABS`, include it in `UPSERT_TABS`, and define the 19-column `TAB_SCHEMAS.Registrations` schema. Update the existing script and deploy a new version before using this backend change; the old deployment rejects this tab. Multiple choice answers are joined with ` | `. The export never includes passwords or session tokens. Apps Script errors are logged by the backend and do not block account creation or saving answers.

To send an account that registered before this change, run this once on the VPS after updating both deployments:

```bash
docker compose -f docker-compose-prod.yml exec backend bun src/scripts/backfill-registration-sheet.ts user@example.com
```

## Architecture and data

- `certrace-backend/src/modules/` contains feature controllers, services and validation models following [Elysia best practices](https://elysiajs.com/essential/best-practice.html).
- `certrace-backend/prisma/` contains the PostgreSQL schema and migration history. The legacy Python implementation has been removed. Its schema history is preserved in the Prisma SQL baseline, and captured calculation outputs remain as regression fixtures.
- `certrace-portal/lib/api/client.ts` uses Eden types inferred from the backend `App`. Domain documents also pass generated runtime validators. Run `bun run --cwd certrace-portal api:generate` after changing document types.
- Domain records (workspaces, installations, suppliers, months, profiles, team records, evidence metadata, drafts, report inputs/snapshots, and notification settings) persist in account-owned PostgreSQL records. Plan and trial dates live on user rows. Original document bytes persist in PostgreSQL file tables. Changes are queued with revision checks, visible failures, retry and recovery download.
- Session credentials use an HttpOnly cookie. Only browser preferences and a cached suspension notice retain local storage; account records require the PostgreSQL-backed API. Public supplier links have isolated working copies backed by their link endpoints.
- Existing browser records can be imported after signing in. Import requires choosing the destination account, preserves existing server records, and removes only confirmed imported browser records. Old IndexedDB originals are uploaded first and retained locally as a recovery copy. Open the same browser/origin that holds the old data.

## Checks

### Formatting

Biome is the shared formatter for backend/frontend JavaScript, TypeScript, JSX,
JSON and CSS (including Tailwind directives). Run from the repository root:

```bash
bun run format        # Apply formatting
bun run format:check  # Check formatting without changing files
```

Enable the repository's pre-commit hook once per clone:

```bash
git config core.hooksPath .githooks
```

The hook runs `bun run format` and `bun run typecheck` before each commit. If
formatting changes files, stage those changes before committing them.

To format one file, use `bunx biome format --write path/to/file.ts`. The existing
ESLint command handles frontend linting. Biome linting and import actions are
disabled. Generated code, Prisma schema/migrations, lockfiles, public assets and
data fixtures are excluded. The exact Biome version is pinned in `package.json`
and `bun.lock`; editors can use the Biome extension with the root `biome.json`.

### Application checks

Pull requests run the code and migration checks too. Tests use an isolated
PostgreSQL database in CI; production credentials are not needed. A local commit
starts no GitHub workflow until it is pushed. Existing ESLint warnings are
reported; lint errors, formatting differences or failed tests block publishing.

```bash
bun run typecheck
bun run --cwd certrace-portal lint
bun run --cwd certrace-portal api:check
bun run --cwd certrace-portal test:unit
CERTRACE_JWT_SECRET=local-development-change-before-deployment bun run test:backend
# With the Compose application running:
E2E_BASE_URL=http://localhost:3000 bun run --cwd certrace-portal test:e2e --project=local database-persistence.spec.ts
```

Backend integration tests require the local PostgreSQL service. They create and remove their own synthetic users. The backend test suite is `certrace-backend/test/` and includes comparisons against captured outputs from the previous implementation.

## Verification references

- [Numbered input structure and web locations](docs/CBAM-NUMBERED-INPUT-STRUCTURE.md)
- [Report input structure](docs/CBAM-REPORT-INPUT-STRUCTURE.md)
- [OER and OSER requirements](docs/CBAM-OER-INPUT-REQUIREMENTS.md)

The copied historical project notes in `docs/` describe the old combined repository and may mention the separate landing page.

<!-- numbered-input-locations:start -->
## Verification inputs — where in the web

Open **Verification → installation → reporting year**. The tabs include Setup, Monitoring method, Monthly data, Precursor sources and Readiness.

New records are collapsible topics with numbered fields, English/Thai labels, an explicit applicability choice and a Save topic button. Every topic needs a reason when marked not applicable. Red fields mean unanswered/invalid inputs. Company facts are shared across the operator’s installations; year, month and precursor records are scoped separately.

General files: **Readiness → Upload documents**. Elsewhere, choose an already uploaded document. Producer verification reports remain beside each precursor; original installation diagrams can also be uploaded in Monitoring method and downloaded again.

Annual calculations use submitted/reviewed months, existing fuel and material calculations, CEMS integration and explicit process/product allocation. They show draft results and blocking findings. Local dataset versions retain OER/OSER/addendum review data as JSON. These are not final EU report templates or independent verification reports.

**Still partial:** specialised heat/waste-gas/CO₂ attribution, composition-specific intensities, complete Article 14 source/period allocation, complex-good SEFA and server-enforced document permissions. Simple-good SEFA uses the recorded, cited benchmark × CBAM factor × CSCF; benchmark applicability is not automatically certified. Do not use a blocked draft as a completed filing.

Records and versions now persist in account-owned PostgreSQL JSONB records; retained original files use the configured database or R2 storage. These records are editable and are not a tamper-proof audit log. Internal document labels control export filtering; they do not create separate permissions between members of one account.

[Full numbered structure, frequency and implementation status](docs/CBAM-NUMBERED-INPUT-STRUCTURE.md). Numbers are Certrace references, not EU paragraph numbers. Authoritative scope: [2025/2547](https://eur-lex.europa.eu/eli/reg_impl/2025/2547/oj); free-allocation formula: [2025/2620, Annex equations 2–4](https://eur-lex.europa.eu/eli/reg_impl/2025/2620/oj).

<details>
<summary>Every input/result: where is it in the web?</summary>

| Reference | Input / result | Where in the web | Status |
| --- | --- | --- | --- |
| 0.1 | Operator legal name | Setup | available |
| 0.2 | Operator registration number | Setup | available |
| 0.3 | Operator legal address in English | Setup | available |
| 0.4 | Country of establishment | Setup → Additional annual setup | available |
| 0.5 | Company contact name, email and phone | Setup → Additional annual setup | available |
| 0.6 | Person responsible for monitoring/reporting | Setup → Additional annual setup | available |
| 0.7 | Operator-to-installation and exporter-to-operator relationship | Setup → Additional annual setup | available |
| 1.1 | Installation name in English | Installation profile | available |
| 1.2 | Installation local name | Installation profile | available |
| 1.3 | Installation reference | Installation profile | available |
| 1.4 | Street and number | Installation profile | available |
| 1.5 | Post code | Installation profile | available |
| 1.6 | P.O. Box | Installation profile | available |
| 1.7 | City | Installation profile | available |
| 1.8 | Country | Installation profile | available |
| 1.9 | UN/LOCODE | Installation profile | available |
| 1.10 | Main emissions source latitude | Installation profile | available |
| 1.11 | Main emissions source longitude | Installation profile | available |
| 1.12 | Economic activity | Installation profile | available |
| 1.13 | Authorised representative name | Installation profile | available |
| 1.14 | Contact email | Installation profile | available |
| 1.15 | Telephone | Installation profile | available |
| 1.16 | Other goods: name | Installation profile | available |
| 1.17 | Other goods: description | Installation profile | available |
| 1.18 | CBAM Registry installation ID, if assigned | Setup | available |
| 1.19 | Whether the installation operated in the reporting year | Setup → Additional annual setup | available |
| 1.20 | New-installation status and actual monitoring duration in months | Setup → Additional annual setup | available |
| 2.0.1 | Reporting year | Installation → Reporting periods | available |
| 2.0.2 | Monitoring period start | Setup → Monitoring method | available |
| 2.0.3 | Monitoring period end | Setup → Monitoring method | available |
| 2.0.4 | Effective dates of process, route and boundary changes | Setup → Monitoring method → Monitoring details | available |
| 2.0.5 | Control-system changes and effective dates | Setup → Monitoring method → Monitoring details | available |
| 2.1.1 | Production process name | Setup | available |
| 2.1.2 | Production routes / technology | Setup | available |
| 2.1.3 | Production steps in order | Setup | available |
| 2.1.4 | Product name | Setup | available |
| 2.1.5 | Exact product CN code | Setup | available |
| 2.1.6 | Product description | Setup | available |
| 2.1.7 | Product output / functional unit | Setup | available |
| 2.1.8 | Applicable benchmark / method reference | Setup | available |
| 2.1.9 | Other inputs / source streams | Setup | available |
| 2.1.10 | Additional monitored flow types | Setup | available |
| 2.1.11 | CBAM or non-CBAM process classification | Setup → Additional annual setup | available |
| 2.1.12 | Product simple/complex classification and emissions boundary | Setup → Additional annual setup | available |
| 2.1.13 | Product-to-route and equipment links | Setup → Additional annual setup | available |
| 2.1.14 | Same-process joint-production treatment | Setup → Additional annual setup | available |
| 2.1.15 | Main reducing agent | Monthly data → month → Installation & monitoring method | available |
| 2.1.16 | Steel mill identification number | Monthly data → month → Installation & monitoring method | available |
| 2.1.17 | Manganese composition (%) | Monthly data → month → Installation & monitoring method | available |
| 2.1.18 | Chromium composition (%) | Monthly data → month → Installation & monitoring method | available |
| 2.1.19 | Nickel composition (%) | Monthly data → month → Installation & monitoring method | available |
| 2.1.20 | Other alloying elements (%) | Monthly data → month → Installation & monitoring method | available |
| 2.1.21 | Other materials (%) | Monthly data → month → Installation & monitoring method | available |
| 2.1.22 | Carbon composition (%) | Monthly data → month → Installation & monitoring method | available |
| 2.1.23 | Tonnes scrap per tonne steel | Monthly data → month → Installation & monitoring method | available |
| 2.1.24 | Pre-consumer scrap (%) | Monthly data → month → Installation & monitoring method | available |
| 2.1.25 | Sector parameters stored separately for every good/composition | Setup → Additional annual setup | available |
| 2.1.26 | Additional applicable Annex IV section 2 sector parameters | Setup → Additional annual setup | available |
| 2.2.1 | Boundary description | Setup → Monitoring method | available |
| 2.2.2 | Processes inside the boundary, in order | Setup → Monitoring method | available |
| 2.2.3 | Excluded process | Setup → Monitoring method | available |
| 2.2.4 | Ground for exclusion | Setup → Monitoring method | available |
| 2.2.5 | Exclusion explanation | Setup → Monitoring method | available |
| 2.2.6 | Direct emissions method | Setup → Monitoring method | available |
| 2.2.7 | Fuel types / other fuel description | Setup → Monitoring method | available |
| 2.2.8 | Confirmation no fuel is burned inside the boundary | Setup → Monitoring method | available |
| 2.2.9 | Electricity supply type / other supply description | Setup → Monitoring method | available |
| 2.2.10 | Electricity metering point | Setup → Monitoring method | available |
| 2.2.11 | Instrument parameter measured | Setup → Monitoring method | available |
| 2.2.12 | Instrument make, model and tag | Setup → Monitoring method | available |
| 2.2.13 | Reading frequency / other frequency description | Setup → Monitoring method | available |
| 2.2.14 | Last calibration date | Setup → Monitoring method | available |
| 2.2.15 | CEMS calibration reference | Setup → Monitoring method | available |
| 2.2.16 | CEMS measurement point location | Setup → Monitoring method | available |
| 2.2.17 | Confirmation own-generation fuel is included | Setup → Monitoring method | available |
| 2.2.18 | Data gap start | Setup → Monitoring method | available |
| 2.2.19 | Data gap end | Setup → Monitoring method | available |
| 2.2.20 | Data gap reason | Setup → Monitoring method | available |
| 2.2.21 | Estimation method | Setup → Monitoring method | available |
| 2.2.22 | Estimated share | Setup → Monitoring method | available |
| 2.2.23 | Gap reviewer | Setup → Monitoring method | available |
| 2.2.24 | Gap review date | Setup → Monitoring method | available |
| 2.2.25 | Quality assurance method | Setup → Monitoring method | available |
| 2.2.26 | Quality assurance reviewer | Setup → Monitoring method | available |
| 2.2.27 | Quality assurance review frequency | Setup → Monitoring method | available |
| 2.2.28 | Installation diagram original file | Setup → Monitoring method → Installation diagram | available |
| 2.2.29 | Monitoring plan version/effective date record | Setup → Monitoring method → Monitoring details | available |
| 2.2.30 | Source streams linked to individual processes | Setup → Monitoring method → Monitoring details | available |
| 2.2.31 | Calculation formula, factor provenance, sampling/lab method | Setup → Monitoring method → Monitoring details | available |
| 2.2.32 | Instrument uncertainty and complete calibration history | Setup → Monitoring method → Monitoring details | available |
| 2.2.33 | CEMS greenhouse gases and monitored source identities | Setup → Monitoring method → Monitoring details | available |
| 2.2.34 | Zero-rated fuel qualification method | Setup → Monitoring method → Monitoring details | available |
| 2.2.35 | Heat, waste-gas and CO2 transfer/allocation methods | Setup → Monitoring method → Monitoring details | available |
| 2.2.36 | Indirect electricity actual/default method and eligibility basis | Setup → Monitoring method → Monitoring details | available |
| 2.2.37 | Own-generation CHP/separate and fossil/renewable classification | Setup → Monitoring method → Monitoring details | available |
| 2.2.38 | Direct/indirect allocation method by process | Setup → Monitoring method → Monitoring details | available |
| 2.2.39 | Specific embedded free-allocation method by good | Setup → Monitoring method → Monitoring details | available |
| 2.3.1 | Production quantity for the original product | Monthly data → month | available |
| 2.3.2 | Output quantity by process/product | Monthly data → month | available |
| 2.3.3 | Production route for the output | Monthly data → month | available |
| 2.3.4 | Confirmation no output this month | Monthly data → month | available |
| 2.3.5 | Reason for zero production | Monthly data → month | available |
| 2.3.6 | Confirmation no fuel burned | Monthly data → month | available |
| 2.3.7 | Confirmation no electricity consumed | Monthly data → month | available |
| 2.3.8 | Fuel type | Monthly data → month | available |
| 2.3.9 | Fuel quantity actually burned | Monthly data → month | available |
| 2.3.10 | Fuel quantity unit | Monthly data → month | available |
| 2.3.11 | Net calorific value | Monthly data → month | available |
| 2.3.12 | Fuel emission factor | Monthly data → month | available |
| 2.3.13 | Fuel factor source | Monthly data → month | available |
| 2.3.14 | Biomass fraction | Monthly data → month | available |
| 2.3.15 | Fuel used for own electricity generation | Monthly data → month | available |
| 2.3.16 | Electricity source type | Monthly data → month | available |
| 2.3.17 | Electricity consumed per source (MWh) | Monthly data → month | available |
| 2.3.18 | Electricity emission factor per source | Monthly data → month | available |
| 2.3.19 | Process-emissions method | Monthly data → month | available |
| 2.3.20 | Process-emissions material | Monthly data → month | available |
| 2.3.21 | Process-emissions material quantity | Monthly data → month | available |
| 2.3.22 | Process-emissions conversion factor | Monthly data → month | available |
| 2.3.23 | Monthly notes | Monthly data → month | available |
| 2.3.24 | Other monitored flow quantity | Monthly data → month | available |
| 2.3.25 | Other monitored flow unit | Monthly data → month | available |
| 2.3.26 | Other monitored flow production process | Monthly data → month | available |
| 2.3.27 | Other flow source / receiving installation | Monthly data → month | available |
| 2.3.28 | Other flow measurement / calculation reference | Monthly data → month | available |
| 2.3.29 | Non-CBAM goods output per process | Monthly data → month → Additional monthly readings | available |
| 2.3.30 | Output split across multiple routes for one good | Monthly data → month → Additional monthly readings | available |
| 2.3.31 | Physical tonnes and conversion to a different functional unit | Monthly data → month → Additional monthly readings | available |
| 2.3.32 | Stock movements, receipts, returns, waste and off-spec output | Monthly data → month → Additional monthly readings | available |
| 2.3.33 | Fuel/material source-stream and consuming-process links | Monthly data → month → Additional monthly readings | available |
| 2.3.34 | Variable carbon content and oxidation factor by stream | Monthly data → month → Additional monthly readings | available |
| 2.3.35 | CEMS readings by source/gas, intervals, flow and concentration | Monthly data → month → Additional monthly readings | available |
| 2.3.36 | Electricity supplier installation and country per source | Monthly data → month → Additional monthly readings | available |
| 2.3.37 | Electricity consumption by production process and relevant good | Monthly data → month → Additional monthly readings | available |
| 2.3.38 | On-site electricity produced, used and exported separately | Monthly data → month → Additional monthly readings | available |
| 2.3.39 | Gross generation, own use, net generation and CHP efficiencies | Monthly data → month → Additional monthly readings | available |
| 2.3.40 | PPA identity, contract and factor evidence | Monthly data → month → Additional monthly readings | available |
| 2.3.41 | Heat and waste-gas import/production/use/export separately per process | Monthly data → month → Additional monthly readings | available |
| 2.3.42 | Heat factors and their sources | Monthly data → month → Additional monthly readings | available |
| 2.3.43 | CO2 captured/received/transferred: quantity, purpose and recipient contact | Monthly data → month → Additional monthly readings | available |
| 2.3.44 | Data gaps linked to affected source readings | Monthly data → month → Additional monthly readings | available |
| 2.3.45 | Other-method emissions and supporting activity data | Monthly data → month → Additional monthly readings | available |
| 2.4.1 | CBAM precursor catalogue selection | Precursor sources | available |
| 2.4.2 | Precursor name | Precursor sources | available |
| 2.4.3 | Exact precursor CN code | Precursor sources | available |
| 2.4.4 | Country of production | Precursor sources | available |
| 2.4.5 | Producer legal name | Precursor sources | available |
| 2.4.6 | Producing installation | Precursor sources | available |
| 2.4.7 | Producer Registry installation ID, if assigned | Precursor sources | available |
| 2.4.8 | Producer production route / technology | Precursor sources | available |
| 2.4.9 | Producer reporting period start | Precursor sources | available |
| 2.4.10 | Producer reporting period end | Precursor sources | available |
| 2.4.11 | Products using this precursor, grouped by process | Precursor sources | available |
| 2.4.12 | Emissions basis: producer report or official EU default | Precursor sources | available |
| 2.4.13 | Published EU default and source reference | Precursor sources | available |
| 2.4.14 | Producer verification report file | Precursor sources | available |
| 2.4.15 | Verified direct specific emissions | Precursor sources | available |
| 2.4.16 | Verified indirect specific emissions, if applicable | Precursor sources | available |
| 2.4.17 | Total specific emissions | Precursor sources | available |
| 2.4.18 | Verification coverage start | Precursor sources | available |
| 2.4.19 | Verification coverage end | Precursor sources | available |
| 2.4.20 | Verifier name | Precursor sources | available |
| 2.4.21 | Accreditation number | Precursor sources | available |
| 2.4.22 | Accreditation issuing country | Precursor sources | available |
| 2.4.23 | Verification sectoral scope | Precursor sources | available |
| 2.4.24 | Verification report issue date | Precursor sources | available |
| 2.4.25 | Accreditation expiry date | Precursor sources | available |
| 2.4.26 | Tonnes actually used by month and consuming process | Precursor sources | available |
| 2.4.27 | Internal/external production status and internal producing process | Precursor sources → source → Source records and review | available |
| 2.4.28 | Internal precursor produced/used by installation and consuming process | Precursor sources → source → Source records and review | available |
| 2.4.29 | Same-process exclusion treatment | Precursor sources → source → Source records and review | available |
| 2.4.30 | Producer period basis: default period or actual production time | Precursor sources → source → Source records and review | available |
| 2.4.31 | Source/period quantities and Article 14 combination/subset method | Precursor sources → source → Source records and review | available |
| 2.4.32 | Supplier distinct from producer, source location and receipts | Precursor sources → source → Source records and review | available |
| 2.4.33 | Precursor category / complex-good status | Precursor sources → source → Source records and review | available |
| 2.4.34 | Upstream references retained from the producer report | Precursor sources → source → Source records and review | available |
| 2.5.1 | Original document file | Readiness → Upload documents | available |
| 2.5.2 | Document type | Readiness → Upload documents | available |
| 2.5.3 | Month covered / annual scope | Readiness → Upload documents | available |
| 2.5.4 | Linked evidence checklist row | Readiness → Upload documents | available |
| 2.5.5 | Review extracted values and units before accepting | Readiness → Upload documents | available |
| 2.5.6 | Confirm replacement of previously entered values | Readiness → Upload documents | available |
| 2.5.7 | Document owner, issue date, version and expiry controls | Readiness → Evidence register and sharing | available |
| 2.5.8 | Document disclosure choice (server access enforcement not implemented) | Readiness → Evidence register and sharing | partial |
| 2.5.9 | Evidence actually sent to the verifier, date and report version | Readiness → Evidence register and sharing | available |
| 2.5.10 | Precursor report accreditation/validity review decision | Precursor sources → source → Source records and review | available |
| 2.5.11 | Stored original installation diagram linked to the monitoring plan | Setup → Monitoring method → Monitoring details / Installation diagram | available |
| 2.6.1 | Installation and individual-process direct emissions totals | Readiness → Annual calculations and checks | partial |
| 2.6.2 | Applicable installation/process indirect emissions | Readiness → Annual calculations and checks | partial |
| 2.6.3 | Process activity levels and attributed emissions | Readiness → Annual calculations and checks | partial |
| 2.6.4 | Specific direct emissions per good, composition and functional unit | Readiness → Annual calculations and checks | partial |
| 2.6.5 | Specific indirect emissions per applicable good | Readiness → Annual calculations and checks | partial |
| 2.6.6 | Default-value share and actual/default indirect shares | Readiness → Annual calculations and checks | available |
| 2.6.7 | Combined electricity factor and actual/PPA factor result | Readiness → Annual calculations and checks | available |
| 2.6.8 | Heat, waste-gas and electricity balances by process | Readiness → Annual calculations and checks | available |
| 2.6.9 | Combined precursor intensities across sources/periods | Readiness → Annual calculations and checks | partial |
| 2.6.10 | Specific embedded free allocation per good | Readiness → Annual calculations and checks | partial |
| 2.6.11 | Five largest goods, fuels, process materials and CEMS sources | Readiness → Annual calculations and checks | available |
| 2.6.12 | Allocation, route totals, units and double-counting checks | Readiness → Annual calculations and checks | partial |
| 2.6.13 | Precursor use year and annual quantity derived from monthly use | Precursor sources | available |
| 2.6.14 | Data-quality statement: fully monitored or default values used | Readiness → Annual calculations and checks | available |
| 2.7.1 | Operator sign-off name | Readiness | available |
| 2.7.2 | Operator sign-off job title | Readiness | available |
| 2.7.3 | Actual indirect-electricity criteria confirmation | Readiness → Annual report review | available |
| 2.7.4 | Imported-electricity direct-connection / emissions criteria confirmation | Readiness → Annual report review | available |
| 2.7.5 | Declarant name and EORI, for the conditional electricity addendum | Readiness → Annual report review | available |
| 2.7.6 | Addendum actual-value criteria and evidence-submission confirmation | Readiness → Annual report review | available |
| 2.7.7 | Eligible electricity imported by that declarant from the installation | Readiness → Annual report review | available |
| 2.7.8 | Applicable addenda sent to the verifier | Readiness → Annual report review | available |
| 2.7.9 | OER final dataset/report review (review dataset; finished EU report layout not implemented) | Readiness → Annual report review | available |
| 2.7.10 | OSER final dataset/report review, benchmark/method confirmation (review dataset; finished EU report layout not implemented) | Readiness → Annual report review | available |
| 2.7.11 | Dedicated verifier-report attachment and findings workflow | Readiness → Annual report review | available |
| 2.7.12 | Annual submissions, correction history and report versions | Readiness → Annual report review / Dataset versions | available |
| 2.7.13 | Carbon price paid per tonne CO2e (additional existing input) | Readiness | available |
| 2.7.14 | Carbon-price instrument (additional existing input) | Readiness | available |
| 2.7.15 | Share of emissions covered by carbon price (additional existing input) | Readiness | available |
| 2.7.16 | Rebates/free allocation against carbon-price claim (additional existing input) | Readiness | available |
| 2.7.17 | Carbon-price receipt (additional existing input) | Readiness | available |

</details>

Refresh this table and the structure: `cd certrace-portal && npx tsx scripts/write-input-structure.ts`. Check without writing with `--check`.
<!-- numbered-input-locations:end -->
