# certrace-portal8 production design

Date: 2026-11-10. Input: `docs/PORTAL8-INVENTORY.md` (current state, gap list
G1–G15) and the old-portal audit. Plan:
`docs/superpowers/plans/2026-11-10-portal8-production-plan.md`.

## Goal

Make portal8 a production replacement for portal.certrace.co: every screen the
user named runs on the Elysia backend and PostgreSQL, with the old site's
sign-up/approval/trial flow, complete transactional email, recorded cookie and
legal consent, a shared server-side workspace workbook, and a factory energy
simulator on the dashboard.

## Decisions

| ID | Decision | Reason |
| --- | --- | --- |
| D1 | Tab colour: **red** = required cells missing, **amber** = rows waiting for review, **green** = complete, **grey** = untouched. | The user asked for red/green. Amber already means "review" in `chrome.tsx`, so it stays for that meaning only. `chrome.tsx` STATE_TONE keeps its meaning for workspace cards; the tab dot uses the new `sheetStatus`. |
| D2 | The 30-day trial starts when an admin first approves the account (`users.approved_at`). `trial_started_at` is set at that moment, once. | Days spent waiting for approval must not consume the trial. |
| D3 | Remove `CERTRACE_MASTER_PASSWORD` login. Support access uses the admin console. | A shared universal password is an account takeover path (G1). |
| D4 | Trial enforcement is server-side: after 30 days on plan `trial`, write routes return `403 TRIAL_ENDED`; reads, auth, billing and settings stay open. | The client-side check alone can be bypassed (G2). |
| D5 | Workspace workbook is stored in a new table `workbooks` (company_id, installation_id, year, meta jsonb, cells jsonb, revision, updated_by, updated_at), unique on (company_id, installation_id, year), behind a new `workbooks` module that uses `companySession`, so team editors share it. | `account-storage.ts` hydrates every account record into memory and resolves conflicts per whole record; a workbook edited by several people at once needs per-cell merges on the server. Uploaded files reuse `PUT /api/v1/account/files/:id`. |
| D6 | Sync: `PATCH /api/v1/workbooks/:installationId/:year/cells` sends only changed cells; the server merges them under `SELECT … FOR UPDATE` and bumps `revision`. Clients poll `GET …?since=<revision>` every 10 s while visible (TanStack Query `refetchInterval`); an unchanged revision returns `{ changed: false }`. | Shared editing without websockets and without whole-record conflicts. Same-cell edits are last-writer-wins; the cell shows who changed it last. |
| D7 | The **Installation** sheet is a key/value view of the scoped `Installation` record. Its edits call `saveInstallation`; it is not duplicated in the workbook. | One source of truth for CBAM template fields i–xiv. |
| D8 | Installation scope: `/workspace` and `/convert` own a page-level switcher stored in the URL (`?installation=<id>`), defaulting to the stored active installation. All other pages read across every installation. The global switcher in `portal-shell` is removed. | User request: those two pages work on one installation; the rest aggregate. |
| D9 | OEM fill-in: each installation gets `role: "own" | "oem"`. On Convert, a requirement whose `fix` is `"fill-in"` opens the scoped installation's workbook sheet that feeds it. For an OEM installation the fill-in fields are that OEM's installation data, entered by the account (an OEM producing for the exporter), not by a supplier link. | Matches the user's rule: OEM fill-in = the OEM's installation data. |
| D10 | Same-company people are **team editors** (edit the workbook); outside precursor suppliers get **smart-link forms**. The Smart Links "new link" flow asks first: "Is this person in your company?" Yes routes to the team invite; No continues to the precursor link. `add-member-modal.tsx` calls the real invite API. | User rule. Both back ends already exist. |
| D11 | Flow diagram: inline SVG built from the workbook (products → steps → materials/energy → outputs), no new dependency. It is two-way: adding a node or edge in the diagram writes workbook rows through an ordered save queue; a save that fails skips the saves that depend on it (MEASUR diagram sync). | `components/insight/charts.tsx` already draws inline SVG. Customers who think in pictures can build the baseline from the diagram. |
| D12 | Factory simulator = factory map + CBAM what-if, not an energy model. The map is the flow diagram coloured by sheet status, with gap badges per node; the what-if compares the CBAM cost of the current estimate against EU default values and against reduction scenarios. MEASUR's energy formulas are not used. | The user's product is CBAM embedded emissions, not utility reduction; only MEASUR's flow (directory, steps, live results, diagram sync, opportunities) carries over (`docs/MEASUR-FLOW-REFERENCE.md`). |
| D13 | Cookie consent is stored server-side: table `cookie_consents` (anonymous visitor id or user id, choices, policy version, timestamp). A banner appears until a choice is recorded. Necessary cookies are always on; analytics and marketing default off. | PDPA/GDPR evidence of consent (G7). |
| D14 | Email is required in production: with `NODE_ENV=production`, delivery must be `resend` or `smtp` with that mode's settings, or startup fails. Templates live in `lib/email-templates.ts`, bilingual TH/EN. | Fail loud (G4). |
| D15 | First admin: `bun scripts/grant-admin.ts <email>` sets `is_admin=true`, run on the server. | No public bootstrap endpoint. |
| D16 | Data Explorer import: a wizard imports an Excel (.xlsx) or CSV file into one workbook sheet in steps: pick file, pick header row, map columns, preview, import. Limits 5 MB, 5000 rows, 2000 cells per patch. `.xlsx` is read in the browser with `DecompressionStream`, no new dependency. | Customers already keep this data in Excel; MEASUR's log-tool flow. |
| D17 | Live panel beside Workspace: completeness per sheet, a mass balance (inputs vs outputs in tonnes) and an embedded-emissions estimate with unknown-origin defaults for precursors. Recomputed on every edit. | MEASUR's results panel; the customer sees the effect of each entry at once. |
| D18 | Factory profile per installation, stored in record `certrace:factory:<installationId>`: processes, emission sources and equipment, meters/data sources, production. No energy calculations. | MEASUR inventories; CBAM needs the source list and monitoring method per installation. |
| D19 | Opportunities: data-gap and reduction opportunities as cards (impact = share of cost from default mark-ups), stored in `certrace:opportunities`, with a summary card and a printable report. Gap cards close automatically when the gap they came from is filled. | MEASUR Treasure Hunt; turns gaps into a to-do list with a cost reason. |
| D20 | Email delivery also supports SMTP through `nodemailer` (`CERTRACE_EMAIL_DELIVERY=smtp`, `CERTRACE_SMTP_HOST/PORT/USER/PASSWORD`). This is the only new runtime dependency. | Some customers and hosts require their own mail relay. |
| D21 | Convert stays open with incomplete data; Export and Submit are disabled until readiness is 100 %, and the button tooltip lists the incomplete requirements. | MEASUR keeps Assessment locked until the baseline is valid; here browsing stays open and only the output is locked. |

## Sign-up flow (old-site parity)

1. `/register`: email, password, accept Terms + Privacy (+ optional marketing).
2. `/onboarding`: name, job title, company, phone/LINE, sector, company scale, needs. **New fields:** company tax ID (13 digits, TH), company website, country, number of employees band, primary export market(s), whether they make goods themselves or through an OEM.
3. `/onboarding/setup`: first installation (own site). **New:** factory basics (main energy sources, boiler/furnace count, annual production band). Detailed process, source and meter data comes later in the factory profile.
4. `POST /api/auth/onboarded`: sends the customer "We received your application" email and an "approval needed" email to every admin.
5. `/pending`: waiting page (polls `/api/auth/me` every 30 s).
6. Admin approves in `/admin`: `ready=true`, `approved_at=now`, `trial_started_at=now`, "Your account is approved, 30-day trial started" email.
7. Trial reminder emails at 7 days and 1 day left, and an "ended" email, sent by the existing reminders job runner.

## Email catalogue

| Key | Trigger | To |
| --- | --- | --- |
| `application_received` | onboarding completed | customer |
| `admin_new_signup` | onboarding completed | admins |
| `account_approved` | admin approves | customer |
| `account_rejected` | admin rejects (sets status SUSPENDED with reason) | customer |
| `trial_ending` (7 d, 1 d) | daily job | customer |
| `trial_ended` | daily job | customer |
| `password_reset_code` | forgot password | customer (exists; keep) |
| `password_changed` | change/reset password | customer (exists for change; add for reset) |
| `team_invite` | invite | invitee (exists) |
| `legal_updated` | new legal version published | all active users |

## Workbook sheet status

`sheetStatus(sheet, required)`:
- `untouched` (grey): no non-empty cell.
- `missing` (red): a row has values but a required column is empty, or a cell flag is `missing`.
- `review` (amber): no missing, but a row status is `review` or a cell flag is `warn`.
- `complete` (green): every non-empty row has all required columns.

Required columns per sheet live next to the sheet definitions.

## Factory data (new, per installation, D18)

Four groups in record `certrace:factory:<installationId>`:
- Processes: name, CBAM process step, production route, inside the installation boundary (yes/no), note.
- Emission sources and equipment: name, kind, the process it belongs to, fuel or material, tag.
- Meters and data sources: name, what it measures, the source it covers, owner, reading frequency, evidence, calibrated until.
- Production: tonnes per product per month.

Gaps (no process, process without source, source without meter, meter without owner, expired calibration, months without production) drive the factory progress bar and the opportunities list. No energy calculations.

## Simulator outputs (D12)

- Factory map: the workbook flow diagram coloured by sheet status, with a gap badge per node; clicking a node opens the sheet or factory group that fills it.
- CBAM what-if: current estimate vs EU default values vs reduction scenarios, shown as CBAM cost in the chosen currency; indirect emissions count only for goods where CBAM charges them.
- Opportunities (D19): data-gap and reduction cards with impact, status and a printable report.

## Out of scope

Billing payments, the reference app's carbon-cost model rewrite, websockets, dark mode, replacing all ~1076 hex literals.

## Risks

- Workbook record grows with many edits: 5 MB cap. Mitigation: store only non-empty cells; warn at 4 MB.
- The live-panel estimate and the what-if use unknown-origin defaults for precursors; label them "estimate" and name the default source.
- Changing trial start affects existing users: migration sets `approved_at = updated_at` for already-ready users and leaves their `trial_started_at`.
