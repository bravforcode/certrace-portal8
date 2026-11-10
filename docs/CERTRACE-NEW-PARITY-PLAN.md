# Match the current application to certrace-new

Investigation date: 27 October 2026. Latest local acceptance: 28 October 2026,
recorded in [the acceptance report](CERTRACE-NEW-PARITY-ACCEPTANCE.md). The user
reported deploying the compact schema migration. The frontend port has been
checked locally; its production rollout has not been performed here. Checkpoints
below retain the findings and remaining work as they stood at each earlier date.

## Outcome and assumptions

The deliverable is the current application, in `certrace-portal/` and `certrace-backend/`, with the appearance and user workflows of `certrace-new/certrace-portal/`, backed by durable server data. `certrace-new/` is a read-only reference throughout this project. Its source must be checked for changes before and after each implementation phase. Builds, tests and browser baselines for the reference run from an isolated copy.

Working assumptions:

- Keep the current Bun, Elysia, Prisma and PostgreSQL stack, same-origin `/backend` proxy, and Docker deployment.
- Preserve existing accounts, credentials, consent and all onboarding data. The user explicitly authorized resetting old report/verification inputs on 27 October 2026. Existing public service data and shared identities are retained where still used.
- Reference screens, navigation, text, layout, responsive behavior, states and interactions define the product target. Current authentication, server persistence, legal acceptance, conflict handling and evidence services supply the implementation underneath those screens.
- Match demonstrated behavior. Where a reference screen promises an operation that its code does not implement, list and implement the missing service. Calculation/data-integrity conflicts need explicit decisions and fixtures rather than silently selecting an answer.
- This investigation covers the portal and its supporting backend. The reference's archived business files and older deployment stack are outside the application migration.

`AGENTS.md` references a missing `refactor.md`. On 27 October 2026 the user explicitly authorized using the existing AGENTS.md rules and documented preservation/migration checks for this schema change.

## What the code shows

The current implementation is the authority for existing storage and backend behavior. The reference is the authority for the requested presentation and new workflows. `docs/database/DESIGN.md` and `reporting-3nf.sql` describe an earlier proposal; `schema.prisma`, the deployed migration sources and current services describe what exists now.

| Finding | Evidence and implication |
| --- | --- |
| The portal differences are extensive. | Excluding dependency, build and cache directories and lockfiles: current 498 files, reference 555; 335 shared files differ byte-for-byte, 166 exist only in the reference, and 109 only in current. These are raw differences, including formatting, documents and assets; they are not an estimate of implementation effort. |
| Route coverage has changed. | Current has 51 `page.tsx` files; reference has 52. They share 46 paths. Six paths are new and five current paths are absent from the reference. |
| Current persistence is already substantial. | `account-storage.ts` hydrates an in-memory working copy from the server, queues acknowledged writes and checks revisions. Reporting services validate concrete fields, consolidate shared identities, write sealed revisions and enforce database ownership. |
| The reference still uses browser stores broadly. | 76 non-test files under reference `lib/` mention `localStorage`. Some are harmless preferences; others contain workspaces, monthly inputs, precursor links, commercial prices, conversations and notifications. Replacing the current portal wholesale would bring those storage paths back. |
| The original schema is large and tied to form structure. | Before the first v2 migration, Prisma declared 466 models: 20 in `public`, 433 in `reporting`, and 13 in `masterdata`. The original generator checks describe 19 report stores, 422 concrete generated tables and 65 additional report sections. The replacement now has 37 models / 569 lines: 20 public, 13 shared-master and 4 reporting models. Existing APIs use the compact document adapter. |
| Reporting scope conflicts. | Current `verification-inputs.ts` models several processes/products inside an installation/year workspace. Reference `workspace.ts` presents one workspace per installation/product/year. Current fields cannot simply be dropped when porting the reference type. |
| Duplicate product workspaces are allowed. | Reference `existingForTriple` warns, and `workspace-duplicate.ts` explicitly permits rebaselining. A unique constraint on installation/product/year would change the requested behavior. Aggregating overlapping alternatives also needs a deliberate rule. |
| Cera is a local scripted assistant. | `lib/cera/engine.ts` uses authored knowledge, matching and account-data lookups. A general model chat service is not required to reproduce it. |
| Cera Smart Upload has limited file reading. | Its `readFile` accepts text-like formats, including CSV/TSV/JSON. The current app already has PDF reading and reviewed backend autofill, which should be connected to the same reference review flow. |
| Several reference controls lack server implementation. | Notification read IDs, Cera history and unit costs are browser records. “Add & invite” in `add-member-modal.tsx` calls `addTeamMember`, which writes browser storage; it does not send an invitation. |
| Business rules have changed, beyond styling. | The reference adds stock/shared-meter derivation, waste gases, scrap deliveries, PFC/potlines, composition, internal precursors, actual/default precursor selection, detailed report sets and a different carbon-cost model. These require contract and calculation work. |

Important source entry points:

- Current [repository map](../PROJECT.md), [backend composition](../certrace-backend/src/app.ts), [Prisma schema](../certrace-backend/prisma/schema.prisma), [implemented persistence](database/IMPLEMENTATION.md).
- Current [account storage](../certrace-portal/lib/account-storage.ts), [report validation](../certrace-backend/src/modules/reporting/storage.ts), [supplier exchanges](../certrace-backend/src/modules/reporting/exchanges.ts), [reviewed autofill](../certrace-backend/src/modules/evidence/autofill-service.ts).
- Reference [portal shell](../certrace-new/certrace-portal/components/portal-shell.tsx), [workspace model](../certrace-new/certrace-portal/lib/workspace.ts), [monthly data](../certrace-new/certrace-portal/lib/monthly-data.ts), [derived monthly inputs](../certrace-new/certrace-portal/lib/monthly-inputs.ts), [report set](../certrace-new/certrace-portal/lib/cbam/report-set.ts).
- Reference [internal precursors](../certrace-new/certrace-portal/lib/internal-precursors.ts), [shared meters](../certrace-new/certrace-portal/lib/shared-meter.ts), [workspace duplication](../certrace-new/certrace-portal/lib/workspace-duplicate.ts), [carbon cost](../certrace-new/certrace-portal/lib/cbam/carbon-cost-model.ts), [precursor basis](../certrace-new/certrace-portal/lib/cbam/precursor-basis.ts).

## Screen and workflow scope

| Area | Target behavior to bring across | Server integration |
| --- | --- | --- |
| Shared shell and account screens | Sidebar, Cera navigation/history, notification bell, headers, forms, dialogs, spacing, typography, onboarding and reference responsive states. | Keep session restoration, account hydration, legal renewal, suspension and plan state behind the reference presentation. |
| Dashboard | New panels, readiness/activity/risk summaries, sample-number switch and navigation to the relevant work. | Read the same account data as Verification, Supply Chain and notifications. Sample data remains clearly labeled and never persists as business inputs. |
| Verification list | Supplier → installation → product grouping, card/table views, pagination, filters, archives, draft strip, create/duplicate workflows. | Transactional workspace creation/duplication, stable IDs, archival and server-side persistence. |
| Installation pages | One-time identity/monitoring information, product reports and installation readiness. | Versioned installation/operator profiles shared by editable reports; historical outputs keep their versions. |
| Product report shell | Sticky identity, reference breadcrumbs/tabs, responsibility states, overview, MMD, monthly data, precursors, evidence, readiness and carbon-price workflow. | Product-specific view models over normalized installation/year data. |
| Monthly reporting | Reference form order, idle-month state, stock and meter allocation, fuels, electricity, measured emissions, CO₂ flows, heat/waste gas, scrap, composition and PFC inputs. | Typed drafts, acknowledged saves, validation, derivation, submission/revision and month-specific authorization. |
| Precursor reporting | Direct precursor UI, actual/default basis, unknown-origin path, verification details, own-site product links. | Scoped producer responses, immutable accepted versions, cycle checks, default provenance and internal-production dependencies. |
| Smart Links and public forms | Link lists, issuing/chasing/revising, and `/s`, `/w`, `/p`, `/self` behavior and language choices. | Existing token and file services adapted to the new fields; owner and supplier use the same canonical records. |
| Supply Chain | Plants, people, precursor concerns, filters and links to actions. | Derive from the same installations, requests, submissions and precursor data as the dashboard. |
| Notifications | Bell/page agreement, read state, grouped notices, preferences, message dialogs and deep links. | Derive work notices; store per-user reads/preferences and server account events. Reuse reminder delivery rather than adding another delivery system. |
| Cera | Popup/full-screen mode, suggestions, account lookups, saved conversations, language behavior and reviewed Smart Upload. | Keep deterministic replies where the reference is deterministic; store history and accepted actions by account/user. Reuse extraction services for supported documents. |
| Carbon & Cost | Charts, filters, projections, currency options, cost inputs and published/default comparisons. | Private commercial values, versioned rate inputs, consistent server calculation results. |
| Reports | Installation/year report set, completeness explanations, previews, PDFs/ZIP, evidence attachments and sign-off lifecycle. | Server validation, revision-bound outputs and file access; reproduce reference document contents/layouts with normalized data. |
| Team, billing and settings | Reference screens, seat/trial/cap states, contacts and stated invitation behavior. | Plan state remains server-authoritative. Persist the existing contact-roster actions without adding account switching or an invitation-acceptance flow. No payment checkout is implied by the reference's sales-contact flow. |
| Existing declarations/inbox/supplier routes | Reference behavior, including existing redirects and routes hidden from navigation. | Preserve existing links and stored history while bringing their presentation and data views into parity. |

New routes in the reference:

```text
/notifications
/supply-chain
/workspaces/[id]/carbon-price
/workspaces/installation/[iid]
/workspaces/installation/[iid]/products
/workspaces/installation/[iid]/readiness
```

Current-only routes need explicit compatibility handling:

```text
/monitor
/workspaces/installations/[installationId]
/workspaces/installations/[installationId]/periods/[year]
/workspaces/installations/[installationId]/profile
/workspaces/records
```

Map each old route after resolving its installation/year/product IDs. Preserve query parameters and anchors where meaningful. The records/import utility needs a retained access path if existing data still needs recovery; it should not become an unexplained broken URL. Reference tree routes already redirect to the direct precursor workflow; preserve that behavior.

## Data and contract changes

The current report validator rejects unknown fields. New reference objects cannot safely be posted to existing endpoints without extending or replacing their contracts. Silently accepting arbitrary JSON through the generic account-record API would bypass relational validation.

| Domain | Reference additions | Current information that must survive |
| --- | --- | --- |
| Installation | Operator name/registration/address, Registry ID and installation monitoring summary. | Shared organization and installation versions; existing setup/operator fields must map to those same identities. |
| Monthly fuel/electricity | Stock components, shared-meter data, electricity origin country and supplier installation. | Delivered quantity, process assignments, existing factor/evidence provenance and source units. |
| Month | Installation electricity total, non-CBAM output, measured emissions, CO₂ received/transferred, heat/waste-gas flows, electricity export, PFC, scrap, waste-gas rows, deliveries, composition and `notManufactured`. | Zero/no-fuel/no-electricity confirmations, activity notes, product output quantities and process-specific other flows. A zero-production confirmation is not automatically equivalent to an idle month. |
| Methodology | Instrument location/uncertainty, sampling plan, control-system details, PFC methodology and added aluminium sector parameters. | Existing multi-process input plan, explicit no-combustion answer and durable diagram file ID. |
| Precursor | Actual/default basis, unknown origin, reporting-period basis, other-installation sourcing, sector parameters and verifier details. | Consuming product/process links, used-versus-received quantities, extraction provenance, default source/year and verification coverage. |
| Product/workspace | Country override, route letters/template mappings and copy-to-year/site behavior. | Stable historical IDs, reporting periods and references from tokens, declarations and evidence. |
| Carbon price | Numeric rebates, legal basis and certifier. | Existing claim/evidence and explicit recorded-zero state. |
| New durable domains | Internal precursors, commercial unit costs, notification read state/events and Cera history. | Account ownership, per-user privacy and history/version semantics. |

Build a reviewed field mapping before migration: source path → target table/column → UI field → validation/derivation → public-link permission → migration rule. Existing user/onboarding fields must survive exactly. Old report inputs can be reset under the user’s explicit authorization; the new documents must support all reference fields and workflows.

The [compact schema guide](database/CERTRACE-V2-SCHEMA.md) describes the implemented replacement and preservation checks. The former 73-table draft is withdrawn. Users retain their existing rows; all onboarding history is reconstructed into revision documents with source copies. The current backend adapter is updated; the reference frontend/API field port remains separate.

## Backend approach

Extend the existing Elysia modules and typed client conventions. Keep HTTP validation/authentication in route modules and transactions/business operations in services. The following API names are proposed, not endpoints that exist today.

| Operation group | Existing foundation | Proposed change |
| --- | --- | --- |
| Identity and access | `auth`, `master-data`, current sessions/legal acceptance and account memberships. | Keep the existing authenticated account model and persist the reference contact roster. Do not add a new membership/invitation flow. |
| Product reports | `reporting`, `master-data`, current report projections. | Domain endpoints for list/detail/create/archive/duplicate, MMD, month drafts and transition commands; optimistic versions and idempotency on repeatable commands. |
| Supplier exchange | `links`, `files`, `reporting/exchanges`. | Keep token expiry/revocation and scoped saves. Allow the new monthly/precursor fields, pin submitted revisions, and prevent supplier writes to private commercial or unrelated account fields. |
| Calculations | `/api/v1/calculate`, Decimal arithmetic, unit validation and trace output. | Add adapters and unsupported terms for new inputs; unify stock/shared allocation/PFC/flows/internal precursor results. Return revision-bound results used by all analysis screens. |
| Evidence/Smart Upload | `files`, `evidence`, `/api/v1/evidence/autofill`. | Route Cera's review UI through existing upload/extract/review/apply operations. Add missing targets and scope handling. Apply only accepted values and retain source/file/page provenance. |
| Analysis | Existing portal aggregates and reference pure models. | Supply dashboard, Supply Chain, notices and Carbon & Cost with common facts. Do not maintain independent persisted copies of derived readiness/risk numbers. |
| Reports | Current report snapshots and file services. | Build/freeze an installation/year package from pinned revisions, generate the reference report set and bundle authorized evidence. |
| Notifications/Cera | Reminder jobs, delivery records, account events and reference deterministic logic. | Persist reads, preferences, conversations and action receipts. Keep reference local knowledge behavior; no new general chat model is necessary. |

Keep the current typed record projections only as a temporary compatibility interface for screens not yet migrated. Route them into the same canonical services. Once an account is migrated, reject legacy report writes that cannot be represented safely. Do not operate two independent writable sources of report data.

### Calculation conflicts to resolve with fixtures

1. **Multiple products and shared inputs:** product screens must consume allocations of a single measured source. Installation totals must not count both the whole meter and its product allocations.
2. **Internal precursors:** a source product's emissions are carried into the consuming product; that transfer is not a second installation emission source. Prevent cycles and pin the source calculation revision in final outputs.
3. **Rebaselining:** the reference allows multiple instances for the same triple. Preserve creation/warning behavior and retain periods/supersession. Overlapping alternatives need an inclusion decision before final aggregation; never silently sum them twice.
4. **Default/actual selection:** retain the reference's fallback and admissibility states, while preserving the current source provenance and coverage checks. An uploaded verification report is not sufficient by itself to mark actual data admissible.
5. **Financial calculations:** the reference's benchmark/free-allocation model differs from older widgets. Compare both on explicit fixtures, choose the target semantics and document all changed results. Keep simulations and official inputs distinguishable.
6. **Unknown, zero and idle:** preserve these as different states. Missing factors, unallocated shared inputs and incomplete evidence remain visible findings rather than fabricated zero values.
7. **Sign-off:** preserve and verify the reference's optional sign-off behavior and its existing fingerprint. Do not add approval gates or new signature semantics.

This investigation checks implementation, not regulatory correctness. Validation of the differing regulatory tables/formulas belongs in the calculation phase using their primary sources and recorded versions.

## Implementation sequence and exit gates

### 1. Freeze the reference and record the acceptance matrix

- Record a source hash manifest; maintain the source as read-only. Make a disposable reference copy with deterministic accounts, clock, locale, IDs and data.
- Inventory all 52 reference pages, redirects, menus/dialogs, loading/empty/error states, plan states and public-token states. Associate each with the supporting store and service.
- Capture browser baselines at agreed desktop/tablet/phone widths, including four-language coverage and long names. Use the same fixtures for the current app.
- Turn reference behaviors and current persistence/security requirements into a single acceptance matrix. Existing reference unit tests are useful evidence, but browser-only tests do not prove server persistence.

**Exit:** enumerated screens/actions and screenshot/flow baselines; no unchecked reference mutation. This is where the exact visual specification becomes measurable.

### 2. Finalize database contracts and rehearse the migration

- The user resolved the missing-guide requirement. Migration `202610270001_compact_reports` and the matching backend adapter replace typed form trees with JSONB revision documents.
- Preserve exact user/auth/consent/shared rows and onboarding history. Test typed/legacy overlap, pinned company versions, incomplete answers, null/empty/absent values and editing an older selected revision.
- Reset old typed report/verification inputs as authorized. Rehearse only in a disposable database, then back up production before the coordinated migration/backend deployment.

**Exit:** 37-model schema matches deployed SQL; preservation checks and backend tests pass; no reference files changed.

### 3. Build one complete workflow through UI, API and database

Use the reference installation → product report → methodology → month → evidence → submission path as the first implementation slice. Include one own-site report and one supplier-link report, then show the result on dashboard/readiness.

- Port its shared UI primitives, fonts, CSS, reference components and routes into the current app.
- Retain the current provider/session/save acknowledgement behavior while replacing each relevant reference storage function with the new domain services.
- Implement creation/duplication and month saves transactionally. Surface stale-version and failed-save states through the reference visual components.
- Reopen from a second clean browser and complete a public token submission. Confirm server-side data, access and files.

**Exit:** the reference workflow looks the same and persists correctly across browsers; it does not depend on a browser-local copy of business data.

### 4. Complete reporting inputs, precursor workflows and calculation parity

- Add all reference monthly/methodology fields, shared-meter allocation and internal precursors.
- Bring actual/default precursor UI, verifier metadata and scoped supplier answers across.
- Complete server derivations, default/rate catalogues and calculation adapters. Add invariant tests for multi-product/flow/PFC/internal-precursor scenarios and existing historical fixtures.
- Keep current-only input data addressable through mapped records and necessary editing/recovery surfaces. Do not destroy it to fit smaller reference types.

**Exit:** all required inputs survive reload, accepted edits propagate consistently, balances reconcile and result differences are explained by approved target rules.

### 5. Complete the remaining reference screens and actions

- Port Supply Chain, notifications, Cera, Carbon & Cost, reports, remaining account screens and reference language behavior.
- Connect private costs, the existing contact roster, notification reads and Cera actions/history to backend persistence.
- Generate reference report layouts and ZIP contents using pinned server data. Match sign-off, stale approval, trial/cap and completeness behavior.
- Add old-route compatibility, refresh/invalidation and archive handling; finish all missing cells in the acceptance matrix.

**Exit:** all reference screens and stated actions have completed integration and visual checks; every legacy URL has a deliberate behavior.

### 6. Cut over, reconcile and release

- Test migration and rollback on a restored backup; verify request/write handling during the cutover.
- Stop old backend writers for the compact schema cutover and deploy the matching backend before restarting traffic. Reference UI/API changes then use the same document storage.
- Verify login, onboarding answers, per-user access and new report saves. Old typed reports are intentionally reset; existing links to reset verification inputs must fail scope checks.
- Verify the production build and required repository checks, update `PROJECT.md` for the final structure, and deploy after the implementation is reviewable.
- Retain the onboarding source archive and production backup. Recovery after the destructive schema migration requires the previous database and backend together, with reconciliation of any later writes.

**Exit:** accepted visual/behavioral parity, durable data and a rehearsed recovery procedure. The schema migration retires the old form tables after onboarding preservation checks. Prove each ported verification workflow works with the compact storage and keep the onboarding source copies readable.

## Verification and definition of done

The work is complete only when all of these are satisfied:

- **Visual:** screenshot comparisons against the isolated reference for every inventoried page and meaningful dialog/state. Match fonts, glyphs, line wraps, spacing, colors, tables, charts, sticky behavior and mobile overflow. Mask only explicitly nondeterministic values; review all remaining differences. Do not use “close enough” to replace the requested parity.
- **Behavioral:** create, duplicate, edit, submit, return/revise, approve, archive, restore and download flows match the acceptance matrix, including public links and four languages where the reference offers them.
- **Persistence:** use separate browser contexts to prove saves and supplier submissions survive reload and another session. Business data must not require prior localStorage.
- **Database:** migrations pass fresh install and upgrade rehearsal; IDs, history, file bytes/hashes, zero/null semantics and selected calculations reconcile. Ambiguous migration rows fail with a useful report.
- **Isolation and concurrency:** wrong account, wrong month/node, revoked/expired token and unauthorized commercial-data requests fail; simultaneous saves, submit/edit races and repeated commands preserve consistency.
- **Reports:** generated PDF/ZIP contents and visual layout match the reference, while source revisions and evidence permissions are enforced. Signed historical packages remain reproducible.
- **Regression:** appropriate current and transferred reference tests pass without skipped tests being hidden; run typechecks, catalogue checks, frontend/backend tests, migration tests and local browser suites against the final implementation.
- **Reference protection:** its source manifest is unchanged. Runtime output for reference checks exists only in the disposable copy.

## Investigation verification

### Implementation checkpoint — 27 October 2026

The port is in progress, not ready for a parity sign-off. The reference source
manifest covers 748 files; its latest check found no changed or missing files.
No Prisma schema or SQL migration was changed during this frontend checkpoint.

Implemented in the current applications:

- Reference portal pages/components and domain models, with current cookie
  authentication and protected account/onboarding storage retained.
- Backend document contracts for reference fields, internal product transfers
  and private unit costs. Unit costs are account scoped; precursor references
  must stay in the same installation/year and cannot contain cycles.
- Account refresh on focus, reconnect and visible-page polling. Pending edits
  retain their original base revisions; late responses cannot overwrite newer
  acknowledged saves or repopulate a reset account.
- Asynchronous autosave acknowledgement for installation, monthly, methodology,
  carbon-price and direct store edits. Public monthly autosave waits for the
  supplier-link API. Shared Save buttons again wait for account persistence.
  Precursor request copying reports an API failure instead of falling back to
  a browser-only token and reporting success.
- Original evidence file transport retained alongside the reference checklist
  and report generation. Reviewed evidence metadata remains in the contract.
- Self-hosted reference Inter, Plex Devanagari and Noto Sans SC fonts, with
  licenses and Unicode subsets; the existing English/Thai fonts remain in use.

Current verification evidence:

| Check | Result and scope |
| --- | --- |
| Frontend unit suite | 896 passed; 0 failed, skipped, cancelled or todo. Includes nine account-storage tests covering refresh, conflicts, late responses and public-link isolation. |
| Typecheck and contract generation checks | Passed after the document contract and autosave changes. |
| Disposable database preservation rehearsal | Passed malformed-onboarding rollback, user/credential/consent preservation, onboarding history/read/edit, all 15 frozen reference contracts and the 37-model schema comparison. |
| Backend integration suite | 41 passed, 0 failed, 594 assertions. Includes new transfer-cycle/scope and private-cost isolation cases. |
| Lint | No errors; 76 warnings at the checkpoint run. These warnings still need review; this is not a clean-lint claim. |
| Local browser | Synthetic account signed in, created its own installation and a 2026 scrap-EAF billet report through the four-step wizard. Installation operator name persisted after reload. January production 4820.5 t, scrap 5100 t and Mn 0.4% persisted after acknowledgement and reload. No browser errors in that checked page. |
| Responsive spot check | Monthly page checked at desktop and phone breakpoints; phone document width did not exceed its viewport. This is a spot check, not comparison against the isolated reference baseline. |

Still required: complete the page/action baseline matrix and reference screenshot
comparisons, account/onboarding presentation parity, supplier/precursor submission
and revision journeys in independent sessions, file/download/report contents,
invitation semantics, Cera document intake, calculation/sign-off invariants, all
legacy-route behavior and remaining error/retry races. The copied
screens alone do not prove these gates. In particular, remaining action handlers
must be audited for callbacks that discard mutation promises or show success
before the server acknowledges them. The original definition of done above remains
the completion gate.

### Supplier submission/revision checkpoint — 27 October 2026

Monthly supplier forms now wait for API acknowledgement before showing submission
success or locking. Autosave and submit share a queue; a failed submit preserves
the editable draft. The API stamps the signed month and retains authorisation
history, rejects edits/resubmission while closed, and ignores forged review fields.
Edit requests are promoted to the owner's records without publishing draft figures.
The closed supplier form reads current owner decisions and polls for reopening.

Owner revision and edit-approval actions now reopen both copies in one database
transaction, based on the owner's current saved month and methodology. The page
flushes unsaved input buffers before sending a revision. Requested areas and notes
reach the supplier's reference overview and field highlights. The old client merge
of supplier snapshots into owner records was removed; account refresh reads the
server's canonical promoted data and cannot overwrite a newer owner correction.
Sending/copying monthly links waits for server/clipboard acknowledgement and no
longer falls back to a browser-only token. Invalid links show the reference invalid
state; connection failures offer a retry instead of leaving the page blank.

Evidence:

- Five monthly-link unit tests pass, including ordered draft/submit requests,
  failed-submit retry, server-confirmed locking, owner correction preservation and
  reopening with the revised baseline. All 896 frontend tests pass without skips.
- The database suite passes 41 tests / 594 assertions. The monthly lifecycle test
  covers closed-write rejection, server-stamped edit requests, rejection visibility,
  revision rollback, current owner corrections, second signatures/history, approval
  and workspace/month isolation. The preservation rehearsal still passes.
- A real local browser journey created a server link, filled methodology and meter
  fields, submitted January, and displayed it in the exporter account. An owner
  correction from 4820.5 to 4821.5 tonnes returned with a production revision note
  and editable highlighted field. Resubmission retained both signatures. A supplier
  edit request reached the owner after reload; approving it reopened the already
  open supplier tab without reload. This used only the disposable local database
  and synthetic account, not production. Separate unauthenticated access and
  ownership isolation are covered by the backend tests; separate browser profiles
  and the complete precursor journey remain to be checked.
- Production `next build` passes with normal lint/type checking in an isolated copy
  of the current applications. The lint warnings above remain. No source reference
  build artifacts were created. The 748-file reference manifest remains unchanged.

The browser proof image for the revision overview is
`/private/tmp/ceatrace-supplier-revision.png`. This is workflow evidence, not a
pixel comparison against the reference. There are still open gates in the full
acceptance matrix; this checkpoint is not a release or parity sign-off.

### Account flow checkpoint — 27 October 2026

The returning-user route now reproduces the reference's Welcome → Set up →
What you get → Free trial → dashboard screens. Email and Google share this
destination. Accounts without portal access resume `/onboarding`; completed
questionnaires redirect to confirmation. The confirmation restores the reference
heading, animation, progress strip and social layout, while incomplete accounts
retain their recovery link. Registration's existing versioned legal acceptance
is retained.

Profile changes queue outside React state updaters, merge into the current
account record, and await backend acknowledgement before advancing. Setup does
not change the access flag, reset notification preferences, erase an unlisted
currency, or restart a trial. The final screen reads real plan/trial state. Partial
questionnaires hydrate all existing answers, including older/custom options;
the reference four-language menu replaces the former two-language toggle.

A rendered comparison exposed a global font difference: self-hosted variables
on `:root` resolved the theme's label font differently from the reference's
next/font variables on `body`. The self-hosted variables now use that same body
scope. At 1280×900, the compared welcome heading, body and action have matching
vertical positions and heights; body/label computed font stacks match. This is
evidence for this screen, not a claim of complete visual parity.

Verification:

- All 897 frontend unit tests pass, without skips. The added profile test covers
  sequential patches, failed writes/retry, rehydration, preserved research data,
  duplicate custom answers, an unknown extra field and notification preferences.
- Type checking passes; lint reports 0 errors and the existing 76 warnings.
- A production `next build` passes with lint/type checking in the isolated
  `/private/tmp/ceatrace-setup-build-2a04288q` copy, including the final mobile
  banner adjustment. Its application source matches the current working tree.
- A local browser completed all four setup steps using the real disposable
  backend, reached the dashboard and reloaded the saved contact fields. A
  before/after API comparison found no change to previous profile fields or
  other account records.
- Another synthetic account resumed a partial questionnaire. After switching
  to Chinese at 390px width and completing the missing LINE ID, an API comparison
  confirmed all prior answers, duplicates, an old count band, custom referral,
  USD currency and the false account access flag were unchanged.
- Stopping the local backend caused an inline save error with edits retained.
  This exposed a mobile error banner covering the save button; the banner now
  reserves space in normal flow while staying sticky. Restarting the backend
  and retrying from the form persisted the edit and advanced to step 3.
- The reference manifest still matches all 748 tracked files. Production and
  `certrace-new` were not changed. The existing Playwright assertions were
  updated for the new sign-in destinations; that CLI suite was not run here.

Browser artifacts: `/private/tmp/ceatrace-setup-current-desktop.png`,
`/private/tmp/ceatrace-setup-reference-desktop.png`,
`/private/tmp/ceatrace-setup-mobile.png`, and
`/private/tmp/ceatrace-resumed-onboarding-mobile.png`.

Open gates still include all-route/responsive visual baselines, report downloads
and evidence packages, precursor journeys, Cera intake, invitation semantics,
calculation/sign-off invariants and cross-session races. The old
`e2e/production-journey.spec.ts` still assumes a localStorage bearer token and
needs conversion to the current cookie/session API before it can be a release
gate. Cross-tab account switching also needs explicit coverage: cookie identity
can change independently of another tab's in-memory session.

### Account isolation and report package checkpoint — 27 October 2026

Authenticated JSON requests, binary transfers and logout now carry the account
identity loaded by the tab. A mismatched cookie or bearer identity returns
`409 ACCOUNT_CHANGED`; the header checks consistency and never grants access.
Response handling also checks a session epoch after consuming the body, so a
late success, 401 or suspension response cannot affect a newer session.
Login/bootstrap can still discover the current cookie identity and hydrate its
records before publishing the new session.

Both package download screens now flush pending edits, refresh account records,
derive installation/year data again and recheck readiness. They assemble reports
and attachment references from that refreshed snapshot. Original evidence files
come from backend storage, including the diagram from the same final methodology
selected by the report (or its draft when no final version covers the period).
Missing referenced originals fail the export. Name-only legacy entries are
explicitly labelled without claiming their size caused the omission. Same-named
files receive distinct ZIP paths. Year-copy retains the diagram's stored file
reference when that carry option is selected. Inline legacy file URLs must be
`data:` URLs. PDF/ZIP downloads abort if the in-memory account changes during
generation. Internal sign-off waits for persistence before closing the form and
showing success; failed saves retain the entered name/title.

Verification:

- All 905 frontend tests pass, with no skips; workspace type checking and report
  contract checks pass. Production `next build`, with normal lint/type checking,
  passes in `/private/tmp/ceatrace-report-build-f45_eph6`. The existing 76 lint
  warnings remain; no new warning is retained.
- Backend preservation/integration evidence for the account guard is 42 passing
  tests and 612 assertions. The restarted disposable backend returned 409 for a
  stale account header and 200 for the matching identity.
- A real two-tab browser check signed into another synthetic account while the
  original tab held an edited setup form. Saving from that original tab failed
  visibly, retained the edit, and exposed retry/export-recovery controls. API reads
  confirmed the attempted edit was absent from both accounts and both original
  LINE IDs remained. Restoring the original login and original field value let
  the same form save and advance normally. Screenshot:
  `/private/tmp/ceatrace-account-switch-rejected.png`.
- Added report tests verify stored bytes, final-versus-draft diagram selection,
  same-name collision handling, missing originals, archived/other-year exclusion,
  URL validation, current readiness rejection and cancellation on account change.
- All 748 reference-manifest files still match. No production database or
  `certrace-new` source was changed.

This does not close the report acceptance gate: a complete ready-package browser
download, rendered PDF review, sign-off failure/retry browser check and stronger
signature invalidation for per-product/evidence changes remain. The full route,
responsive/language comparisons and other journey gates above remain open.

### Precursor supplier flow checkpoint — 27 October 2026

Precursor autosaves, uploads and submission now share a per-link queue. A late
draft cannot overtake submission; failed saves remain retryable. Resolution and
upload responses check the active public route before mutating its stores, and
submitting without the matching link session fails explicitly. The form seeds
its edit buffer once per token, exposes save errors with retry, and disables its
fields during submission. Missing/expired/revoked links retain the reference
invalid-link screen; transport errors have a separate retry state.

The backend commits precursor receipt flags and timestamps with accepted fields
and attachments. Later drafts remain in the token's draft records until another
submission. Exporter refresh uses canonical accepted records and applies the
existing admissibility rules to those rows; it no longer replays a supplier's
editable snapshot over an owner correction. Supplier input cannot change the
exporter's quantity ratio or contact fields. Resubmission replaces only evidence
belonging to the invited precursor, preserves unrelated attachments, clears a
removed report pointer and rejects reused unrelated evidence IDs atomically.

An explicit missing-report response now uses the optional JSON field
`supplierReportUnavailable`. An unverified draft is not such a response. A live
browser rehearsal exposed this distinction: inferring absence from the draft's
quality status erased newly entered figures on autosave. The explicit field and
regression assertion fix that case. This is a document-contract change; there is
no SQL migration or change to users/onboarding.

The same browser rehearsal exposed `Invalid Date` on every persisted date picker:
the backend returns ISO timestamps while the reference appended a second time
suffix. Shared Calendar/DatePicker now parse the written calendar date for both
formats, preserve its day independently of timezone, and reject invalid dates.

Verification:

- Frontend unit, type/contract, production-build and backend integration logs are
  under `/private/tmp/ceatrace-precursor-*.log`. The backend preservation rehearsal
  passes all 43 integration tests / 639 assertions. Its new precursor test covers
  unavailable reports, draft privacy, two versions, owner-field preservation,
  scoped attachment removal and rejection rollback.
- The final frontend suite passes 911 tests without skips. Type/contract checks
  and a production build with normal lint/type checks pass. The build copy at
  `/private/tmp/ceatrace-precursor-build-pwmircrn` matches all 926 application
  source files; the existing 76 lint warnings remain.
- The browser saved 1.42 direct SEE, reloaded it, and submitted. API checks found
  the owner's original 1.23 until submission, then 1.42 with one version. A later
  draft of 1.55 left the owner at 1.42; resubmission produced 1.55 and two versions.
  The owner's quantity stayed 100 throughout. The exporter page showed the
  accepted 1.55 and its actual-value state. This used the disposable local
  database, a synthetic supplier and an existing sample PDF, not production.
- The restored reporting dates render 1 Jan / 31 Dec 2026; opening the picker
  shows January 2026 with working day buttons. Proof images are
  `/private/tmp/ceatrace-precursor-resubmitted.png` and
  `/private/tmp/ceatrace-precursor-owner.png`.
- The 748 reference-manifest files remain unchanged.

Full responsive/language comparison, precursor upload failure/removal browser
journeys, all legacy supplier routes, report-package visual review, invitation
semantics, Cera intake and the remaining calculation/sign-off gates are still
open. This checkpoint is not full parity or a production release sign-off.

### Cera confirmation persistence checkpoint

Cera now waits for the current account's write queue or the public supplier's
draft save before marking an extraction applied, replying with success or
navigating to the filled form. The precursor page exposes an explicit draft-save
callback. Saving disables the extraction controls; failure keeps a retry button
and the server error visible. A retry saves the current draft without applying
the plan again, preserving operator corrections and avoiding duplicate process
rows and appended notes. Account and token changes reject stale confirmations.
Saved history marks interrupted confirmations for form review, preventing replay.

Verification on the disposable local stack:

- All 916 frontend tests pass without skips, including five new acknowledgement,
  retry, isolation and history tests. Workspace contract/type checks pass.
- The production build passes with normal lint/type validation and the existing
  76 lint warnings. Its copy matches the 642 files under portal `app`,
  `components`, `lib` and backend `src`. Logs: `/private/tmp/ceatrace-cera-*.log`.
- A browser upload of a synthetic February report proposed 4,321.5 tonnes,
  1,200 m³ natural gas and a note. Confirmation saved these to the backend;
  independent API reads and browser reload returned the same values. Screenshot:
  `/private/tmp/ceatrace-cera-saved-february.png`.
- All 748 reference-manifest files remain unchanged. No database migration,
  production write, or backend change was made in this checkpoint.

Remaining gates above stay open, including public-link upload browser journeys,
all-route responsive/language comparison, report-package visual review and team
invitation semantics. Cera still follows the reference's text/CSV reader and
directs PDF/photo intake to the form's Documents step.

### Scope correction: match reference behavior only

The user clarified that no new product features should be added beyond what
`certrace-new` does. The invitation-acceptance/account-switching extension was
removed, including its extra route, account selector, role restrictions,
backend membership service, additional table/migration, and extension tests.
The verified pre-extension Cera build supplied the narrow restoration baseline.
The extension was never deployed to production.

Team remains the reference's contact roster, shared with reviewer pickers.
Its existing Add/Remove actions persist through the current account record API
and wait for acknowledgement. The owner is the actual signed-in person rather
than a seeded example. No new invitation or account-selection journey is needed.
The proposed stronger sign-off fingerprint was investigated but not implemented;
reference sign-off behavior remains the target.

Validation after removing the extension: 917 frontend tests and 43 backend tests
pass without skips, including contact save/retry/deduplication and preservation
of personal onboarding. The schema preservation rehearsal, workspace type and
contract checks, lint (0 errors; 76 existing warnings) and production build pass.
The browser saved a synthetic roster contact and reloaded the same contact.
The schema is again 37 models / 569 lines with ten migrations. All 748 audited
reference files remain unchanged. No production changes were made.

Remaining work is verification and correction of reference flows: all-route
responsive/language comparison, existing supplier upload failure/removal flows,
legacy pages/redirects, and PDF/ZIP rendering/downloads from saved backend data.
No requirement in this plan authorizes adding a feature absent from the reference.

### Existing report export verification checkpoint

The existing report flow was checked with saved synthetic data, without adding
product behavior or changing the reference. For the same incomplete account
snapshot, current and isolated reference report models and hold reasons match.
All 12 rendered PDF pages match pixel-for-pixel except the evidence-index page:
the current index correctly says the backend-stored original travels in the ZIP,
where the browser-storage reference cannot retrieve that server file.

A separate synthetic account was prepared in the disposable local database with
complete current form values and a test attachment. Both applications calculate
`packageReady=true` with no holds from the records read back from PostgreSQL;
the three report models and precursor register are identical. The current browser
Reports screen shows one package ready and its existing Export package button
successfully downloads the ZIP. It contains five readable PDFs and 81 supporting
originals. The ZIP checksum check passes and every supporting file's SHA-256
matches the uploaded synthetic source. The reports are complete and remain
unsigned, matching the reference's optional sign-off behavior. The summary PDF
cover, tables and footer were visually inspected.

Artifacts and local test evidence:

- `/private/tmp/ceatrace-export-current` and `ceatrace-export-reference`: original
  snapshot models, PDFs and all-page render comparison.
- `/private/tmp/ceatrace-ready-current` and `ceatrace-ready-reference`: complete
  models rebuilt from saved account records.
- `/private/tmp/ceatrace-browser-export`: actual browser ZIP and extracted PDFs.
- `/private/tmp/ceatrace-report-package-ready.png`: current Reports screen.

This checkpoint adds verification evidence only. Application source, schema and
production data were not changed. Full all-route responsive/language review and
the existing public upload failure/removal and legacy-route journeys remain open.

### Existing monthly supplier attachment retry checkpoint

The existing public monthly form was tested against the disposable local API.
With that API stopped, attaching a synthetic PDF retained its browser copy and
showed the existing unsaved/retry warning. Restoring the API allowed the existing
automatic retry to upload the file and save the link slice. After reload, the
attachment remained visible, and a token-scoped download matched its original
SHA-256 byte-for-byte.

The browser check exposed a backend-connection gap: the footer's existing save
badge still displayed "All changes saved" while the link-level attachment save
had failed. The monthly page now feeds pending document changes and link-save
errors to that same badge. A revision counter prevents an earlier acknowledgement
from clearing the pending state of a newer document change. No new control or
product flow was added.

Removal was then tested while the local API was stopped. The existing Remove
action showed "Saving…", then the save-error text rather than a saved claim.
After restart, automatic retry removed the file reference from the server slice;
reload confirmed its absence. The upload and removal were never submitted as
new monthly emissions data. Original bytes and existing report history remain
under their existing retention behavior.

Validation: 917 frontend tests pass without skips; workspace contract/type
checks and lint pass (0 errors; 76 existing warnings). The production build is
validated in the isolated reference-only build copy. The failed-save screenshot
is `/private/tmp/ceatrace-supplier-save-failed.png`. Production and the reference
source are unchanged. Remaining public precursor, legacy-route and all-route
responsive/language checks are still open.

### Legacy self-supply and redirect checkpoint

The existing `/self/[token]` form still looked up declarations only in the demo
fixture array. A real account's saved declaration therefore resolved as invalid,
and the form could not load or save its existing answers through the backend.
The route now loads the owned declaration, preserves the reference's self-supply
presentation and opens the same supplier form with its server response. No new
screen, endpoint, table or migration was added. The existing link creation API
reuses the response for a self-supplied row under the account lock, renewing its
internal expiry on reopen while retaining answers. External supplier requests
retain their existing explicit create-link behavior.

Checks: 919 frontend tests and 44 backend tests pass without skips. Tests cover
owned/missing/external rows, concurrent self-supply opens, retention of saved
answers, expired-response reopen, month separation and rejection of another
account. Workspace contract/type checks, lint (0 errors; 76 existing warnings)
and a production build pass. The local browser opened a saved synthetic
self-supply declaration, entered an installation name and reloaded the same
answer. An independent API read confirmed a single response with that value.
Screenshot: `/private/tmp/ceatrace-self-supply-reloaded.png`.

Legacy redirects were checked against their reference destinations: Inbox to
Smart Links; declarations to workspaces; product tree to precursors; intake to
monthly data; old monthly URL to the current month editor. A delayed legacy
installation redirect in development was checked in the built local app and
reached the correct singular installation URL without a code change. The built
app also redirects evidence to installation/year readiness, readiness's
carbon-price anchor to the product Carbon price tab, and old tree-node URLs to
precursors. One development navigation timeout was followed by inspection of
the completed destination rather than restarting the preview.

Only synthetic local records were used. Production, reference sources, users
and onboarding in the real application database were not changed. Full
responsive/language comparison, remaining precursor upload browser journeys and
other legacy declaration actions remain open.

### Existing precursor summary attachment checkpoint — 28 October 2026

The reference's actual-value precursor form already includes an optional
operator summary report alongside the verification report. Its field key is
`precursor:<id>:summary`; the current connection still selected only the exact
`precursor:<id>` key. A browser upload appeared in the form but was absent from
the API response. The frontend now carries the reference's scoped suffix keys
through collection, file upload and hydration. Backend receipt preserves those
bindings and replaces/removes all attachments belonging to the invited producer,
while retaining unrelated evidence. Attachment-only edits also trigger the
existing draft save. A saved empty attachment list overrides the original request
snapshot on reopen, preventing removed files from returning.

Browser verification used the existing synthetic precursor link and disposable
local database. The summary attachment persisted after reload in its separate
slot; its token-scoped download matched the original PDF SHA-256. Removing that
summary with the local API stopped displayed the existing save-error message.
After restart, the existing Try again action saved the removal; an independent
API read retained the verification report, removed the summary and kept the two
previous submission versions. No submission was made by the browser test.

The frontend regression covers upload failure/retry, suffix scope isolation,
reopen in the correct slot and removal despite an older invitation snapshot.
Backend integration covers summary binding, stripping another producer's keys,
removal and preservation of unrelated evidence. No new product control, endpoint,
table or migration was added. Production and reference sources are unchanged.

Validation: 920 frontend tests and 44 backend tests (656 assertions) pass without
skips. The disposable schema preservation rehearsal, workspace contract/type
checks, lint (0 errors; 76 existing warnings) and production build pass. The
isolated build matches all 645 application source files; all 748 reference
manifest entries remain unchanged. Screenshot after saved removal and reload:
`/private/tmp/ceatrace-precursor-summary-removal-reloaded.png`. Full route,
responsive and language comparisons and other legacy actions remain open.

### Matched-data visual checkpoint — 28 October 2026

The isolated reference preview now has a test-only fixture loader in
`/private/tmp/ceatrace-parity-reference-yt0pymv0`, populated from the same synthetic
account records read from the disposable local backend. Its reference application
source remains unchanged; the loader and JSON snapshot exist only in that copy.
The production application does not contain this loader.

Captured 22 main pages at 1280×900 and 390×844 in both applications: Dashboard,
Verification, Smart Links, Supply Chain, Reports, Carbon & Cost, Notifications,
Team, Billing, Settings, Regulations, installation profile/products/readiness,
new report, product overview, Methodology, monthly overview, January editor,
precursors, carbon price and product settings. Dashboard also has matched Thai,
Chinese and Hindi phone captures, in addition to English. The resulting 47
page/viewport/language pairs include screenshots, rendered text, heading geometry
and document widths in `/private/tmp/ceatrace-visual-parity/matrix.json`.
Fonts and entry animations must finish before using a screenshot as final
evidence; early blurred/fallback-font captures were identified and replaced.
This is a main-page baseline, not a claim that every modal, state or route has
been checked in all four languages.

The comparison exposed three integration gaps, now corrected without new UI:

- The sidebar's default seat count was hardcoded to zero. Plan counters now
  read the same saved roster as Team, and the sidebar subscribes to that query.
  A local browser added a synthetic contact: both counters changed from 1/5 to
  2/5. Removing it returned both to 1/5. Unit checks cover owner inclusion,
  persisted contacts and freeing the removed contact's seat.
- Backend timestamps in the Methodology coverage banner wrapped the line and
  shifted every section down 60.75px. Displaying the written calendar dates
  restores the reference banner and all measured section positions.
- A precursor deadline appended a time to an already serialized timestamp,
  producing Invalid Date and NaN in Smart Links after refresh. It now uses the
  existing calendar-date parser. A regression verifies equal deadlines and
  countdown/state before and after a backend timestamp round trip.

Most matched-data page text is identical. Team and its seat counts intentionally
show the real synthetic owner/contacts instead of the reference's three fixture
people. The same 3px phone overflow on installation readiness is present in both
applications. No layout change was made for that reference behavior.

Validation: 921 frontend tests pass without skips, workspace contracts/type
checks pass, lint has 0 errors and 76 existing warnings, and production build
passes. The new compiled preview was also opened in the browser with the local
API rewrite configured at build time; it restores the synthetic account and
renders the phone Dashboard with its correct 1/5 count and no console errors.
The ordinary Docker API address remains the application's build default.
Development observation/navigation delays were inspected on the same tab rather
than interpreted as a stopped server. One compiled-preview failure was traced
to its local build using Docker's `backend:8000` address and corrected in that
temporary build's environment only.

All 645 application source files match the isolated build copy. All 748 reference
manifest entries remain unchanged. Production was not accessed or modified.
Remaining gates include auth/legacy-route visual states, all dialogs and error
states, wider route coverage in each language and remaining legacy supplier
actions; the full original parity goal remains open.

### Authentication layout and signup flow checkpoint — 28 October 2026

Sign-in, forgot-password, reset-password and registration were compared at
1280×900 and 390×844 against the isolated reference. Their headings and input
geometry match after font load. Registration initially still used the old
two-screen details/consent flow and a Continue button. It now uses the reference's
single form, combined checkbox and Create account button, which restores the
same layout at both breakpoints.

The existing backend consent contract remains authoritative: the combined
checkbox supplies both acceptance flags, and signup includes both current
version IDs. Public native legal-page links render those same versioned
documents; their destinations deliberately retain the current backend's public
pages rather than the reference demo's external unversioned pages. Optional
marketing remains false for this reference signup flow. Legal renewal and
existing acceptance history are unchanged. Google signup retains that same
consent metadata and asks for the checkbox before starting its existing redirect.

An isolated loopback-only fake API tested the compiled frontend's submit path.
Its documents explicitly state they are nonbinding fixtures, no real account is
created, and none of its API requests can reach the real backend. Completed
details leave Create account disabled until the checkbox is selected. The first
request deliberately returns LEGAL_VERSION_CHANGED: all typed details remain,
the checkbox clears and the action disables while version IDs reload. After
selecting the fixture checkbox again, the second request carries the new IDs,
both acceptance flags, marketing=false and the same names, and goes directly to
the existing onboarding organisation screen. The stored fixture profile retains
those names. The mapped error now explains that the policies changed and need
renewed agreement; its regression verifies that the email field is not blamed.

Evidence: `/private/tmp/ceatrace-visual-parity/access-matrix.json` contains eight
page/viewport pairs and their screenshots. The nonbinding fixture request trace
is `/private/tmp/ceatrace-signup-harness-results.json`; passwords are omitted.
The resulting onboarding screenshot is `signup-fixture-onboarding.png` in the
same visual folder. The fixture server is stopped after testing. The actual
backend's consent-version, rejection and history checks pass separately in the
fresh disposable database rehearsal. No real agreement was accepted through the
browser, and no production account or database was changed.

Validation: 922 frontend tests and 44 backend tests (656 assertions) pass without
skips. Contract/type checks, lint (0 errors; 76 existing warnings), production
build and schema/onboarding preservation rehearsal pass. The signup E2E spec was
updated to assert the single-page gate and both submitted version IDs; that CLI
browser suite was not run. Browser verification above used CUA and the fake API.

The initial legacy-page audit flagged `USER.name`, but this finding was
subsequently corrected: current `lib/data.ts` already resolves that property
from the saved profile and signed-in session. It does not use the reference's
constant demo identity. Other legacy-route views, dialogs, error states and
broader language coverage remain open. This checkpoint does not claim complete
frontend parity.

### Legacy declaration persistence and version-date checkpoint — 28 October 2026

The legacy CBAM mutation hooks returned after changing the in-memory store.
Activity and Methodology callbacks also discarded mutation promises, allowing
success toasts before the backend acknowledged the write. These mutations now
use the existing `persistReportChange` helper. Activity saves, Methodology
finalisation and evidence registration await their mutation before reporting
success. Existing account retry/export handling retains failed writes.

The existing `USER.name`/`ORG.name` getters already resolve real profile/session
identity. They are retained; the redundant session-only attribution helper
investigated during this checkpoint was removed. Historical names and account
profile/onboarding data are not migrated or rewritten.

A separate synthetic declaration in the disposable local database was used to
save annual production and a fuel row, reload them, finalise Methodology v1 and
upload/bind an evidence file. Independent API reads confirm quantity 100,
NCV 0.04, factor 0.056, saved provenance, boundary description and v1 author.
The attachment's original SHA-256 and its annual-production binding survive
reload. The protected profile/onboarding snapshot is unchanged. With the local
API stopped, an activity edit showed the existing failed-save notice, retained
its data and emitted no success toast. Restoring the API and pressing the
existing Retry action persisted the changed reference.

The comparison also exposed a real versioning mismatch: serialized timestamps made
Methodology report two period changes immediately after reload, even though the
written calendar dates were identical. `diffVersions` now compares the start/end
calendar dates. Regressions cover a serialization-only round trip producing no
change and a genuine end-day change remaining visible. After reload the screen
correctly says Matches version 1, as the reference does.

The isolated reference copy was configured with a local API rewrite to read the
same owned declaration; its CBAM browser stores were loaded from the saved
synthetic snapshot. Its repository source was not edited. Activity, Methodology,
evidence, dossier, declaration hierarchy and the existing Review & filing view
have desktop and phone captures. A cloned supplier's stale demo submitted flag
was corrected in the synthetic fixture to reflect its actual unsubmitted state;
no production logic was changed to imitate fabricated responses. These 12
view/viewport pairs are recorded in `/private/tmp/ceatrace-visual-parity/matrix.json`.

This checkpoint adds no screen, action, endpoint, table or migration. Remaining
gates include the public generic supplier-link browser journey, other dialogs
and error states, and broader language coverage. Full parity is still unproven.

Final validation: 924 frontend tests pass without skips; workspace contract/type
checks and production build pass; lint has 0 errors and the existing 76 warnings.
All 12 legacy comparison pairs have identical main text and no heading-geometry
difference above 1px. The final build copy matches all 646 application source
files in both directions, and all 748 reference manifest entries are unchanged.
Backend source and schema were not changed in this checkpoint. Browser proof
of the reloaded version is `/private/tmp/ceatrace-legacy-mmd-reloaded.png`; the
failed-save screenshot is `/private/tmp/ceatrace-legacy-save-failed.png`.

### Generic supplier persistence and receipt checkpoint — 28 October 2026

The generic public supplier flow was exercised with a separate synthetic external
supplier request. It exposed a blank exporter name because the public resolver
still read only the old account-record profile location. It now reads the current
versioned profile, retaining the legacy fallback and exposing only the company
name. API coverage verifies a company rename, account isolation and preservation
of the private profile fields.

The existing signing action previously displayed a submitted version while the
API was unavailable. It now awaits the authoritative receipt. Autosaves and
submission share an ordered mutation scope; the save badge acknowledges the
current buffer, and a pending submission disables the existing navigation.
Failure retains the signer details and acknowledgements. The supplier shell now
mounts the existing Toaster so its existing success/error messages are visible.
No new product action or screen is added.

The successful-save browser check revealed that Eden's default date revival
converted the string attestation date into a Date object, which then failed the
SupplierState validator. This also explains date-only values being normalized
to timestamps in earlier account round trips. The shared typed client now uses
`parseDate: false`, preserving the API's JSON strings. A regression reproduces
the previous failure and covers dated draft answers, a signed receipt and link
resolution after submission.

Revision autosaves also recreated the request object and reran initial-view
selection, sending the supplier back to Overview. Initial navigation now runs
once per token, and changing tokens creates a new provider. A browser revision
stays on Quality check after its save. The server's revision guard now carries
the questionnaire's regenerated total alongside an unlocked emissions component
when all component values match the permitted state. API coverage verifies the
new total and preserves other goods and locked inputs when changes are attempted.

With the disposable API stopped, the signing form displayed Submission failed,
retained its details, and produced no receipt. After restoring the API, the
synthetic request was submitted, reopened for a single-field correction, and
resubmitted as Version 2. Public and owner reads agree; direct emissions 0.65
and total 0.85 persist together, the original document SHA-256 matches, and the
profile/onboarding snapshot is unchanged. The receipt is captured in
`/private/tmp/ceatrace-generic-version-two.png`; the failed-submit notice is in
`/private/tmp/ceatrace-generic-submit-failed.png`.

The unchanged reference preview reads the same synthetic response through its
existing raw-JSON API client. Seventeen generic supplier screen/viewport pairs
(nine desktop and eight phone) have identical main text and matching heading
geometry within 1px. The phone receipt screenshots were also inspected visually.
This covers the landing, overview, questionnaire, document, sharing, team,
quality, review and receipt screens; it does not cover every dialog or state.
Results are in `/private/tmp/ceatrace-generic-comparison.json` and the combined
visual matrix.

Final checks: 925 frontend tests and 44 backend tests pass without skips (668
backend assertions). The fresh schema rehearsal preserves users, credentials,
consent, settings and all onboarding revisions, and matches the 37-model schema.
Workspace contract/type checks and the production build pass. Lint has 0 errors
and the existing 76 warnings. All 646 application source files match the isolated
build copy in both directions, and all 748 reference manifest entries are
unchanged. No schema migration or production data change is part of this
checkpoint.

Full parity remains unproven. Additional dialogs, error states, language coverage
and the final release audit remain open.

### Creation dialogs and wizard durability checkpoint — 28 October 2026

The supplier and installation popups called their synchronous working-copy
stores, showed the reference's green confirmation and closed while the backend
write was still pending. Both now use the existing `persistReportChange` helper
before confirming. Failed saves keep the dialog fields and offer the existing
Save action again. Installation reference validation excludes the record this
dialog has just queued, so retry does not mistake its own pending site for an
unrelated duplicate. The existing confirmation text, 760ms confirmation interval,
fields and successful return to the picker remain the reference's.

The wizard now waits for its first own-installation save before advancing from
Supplier, and waits for its draft before leaving. Pending transitions disable
their existing navigation controls. The final Create action recovers its button
after a failure, waits for the report, precursor backlink and draft removal, then
opens the existing destination. A wizard retains one generated report ID across
retries; `createWorkspace` can reuse that ID while preserving its creation time.
A regression checks that retry updates one report and a separate creation still
permits the reference's deliberate same-site/good/year rebaseline.

The real local browser supplier branch created Synthetic wizard supplier and
TH-WIZARD-01, selected billet / Scrap-EAF / 2026 / due day 15, saved a Step 4 draft,
resumed it through its Verification card, and created the report. Separate local
API outages tested supplier Save, installation Save, draft Close and final Create.
Each failed action retained its form or step; retry persisted exactly one supplier,
one correctly owned installation and one report (`ws-a400971b29f6dbbd`), with the
completed draft removed. The destination was the installation Overview, as in
the reference. Independent API reads confirm all choices and the unchanged
profile/onboarding snapshot. Evidence includes
`/private/tmp/ceatrace-created-report-installation.png`,
`/private/tmp/ceatrace-report-create-failed.png`,
`/private/tmp/ceatrace-wizard-draft-save-failed.png` and the two dialog failure
screenshots in `/private/tmp/ceatrace-{supplier,installation}-dialog-save-failed.png`.

A separate empty synthetic account tested the inline first-own-site branch.
With the local API stopped, Continue stayed on Supplier with all typed fields
and remained retryable. After restoration it saved exactly one TH-OWN-WIZARD
site and advanced to Country & good. The original profile values and onboarding
state are retained. Its partially completed wizard was saved as a separate draft.
The failed-step screenshot is `/private/tmp/ceatrace-own-installation-save-failed.png`.

The four popup/viewport comparisons (supplier and installation, desktop and phone)
have identical text, control values, enabled states and field positions within
1px. The final Schedule step also has desktop/phone comparison captures. The
comparison uses a snapshot taken before the synthetic installation was saved,
so the isolated reference's create dialog does not mistake that site for an
existing reference. These fixtures and the reference's browser storage are
disposable; repository `certrace-new` is unchanged.

This checkpoint changes no backend source, schema or migration. Frontend tests
now total 926 passing without skips. Workspace contract/type checks, lint
(0 errors, the existing 76 warnings) and production build pass. The previous
44-test backend preservation rehearsal still covers the unchanged backend.
Remaining release work includes additional report action dialogs, other error
states, broader language checks and a full cutover audit. This is not a claim of
complete frontend parity.

Final evidence: the two Schedule comparisons also have identical main text and
heading geometry within 1px, giving six creation dialog/step comparisons in this
checkpoint. All 646 application source files match the isolated build copy and
all 748 reference manifest entries are unchanged. After signing back into the
original synthetic exporter account, the saved installation Products page still
shows exactly one report; the reload proof is
`/private/tmp/ceatrace-created-report-reloaded.png`. The final type check ran
after the build completed, avoiding Next's generated-type directory being
replaced during the check, and passes.

### Duplicate, archive and restore checkpoint — 28 October 2026

The Duplicate dialog now waits for the existing account persistence helper before
announcing success and opening its copy. If saving fails, the dialog retains the
same queued copy and precursor IDs for retry, with its choices locked while that
copy is pending. The reference's year cap, same-year rebaseline warning, default
carry choices and copy rules are unchanged. Archive/restore menu actions now await
their existing mutations, and the shared card/table Restore helper announces
success through the mutation's success callback.

Real browser checks used only the disposable local account. Stopping its local
API made Duplicate, confirmed Archive and direct-card Restore fail visibly with
no success toast or navigation. Restoring the API and retrying each action worked.
The separate menu Restore path also worked. Exactly one copy was created
(`ws-488f5f64cd3f51e8`), and it is active after both restore paths. Independent API
checks confirm its copied methodology draft, precursor structure and carbon-price
inputs, with no copied monthly figures, final versions or evidence. Child records
remain identical through archive/restore. The source report and its original
records, account profile and onboarding snapshot are unchanged. Failure captures
are `/private/tmp/ceatrace-{duplicate,archive,restore}-save-failed.png`.

Sixteen desktop/phone pairs compare the menus, duplicate year-cap and rebaseline
states, copy choices, archived list and empty archive with the isolated reference.
Text, controls and geometry match within 1px. The active menu comparison uses the
same installation Products context and one-report fixture; comparing a second
copy instead adds a phone scrollbar and changes the menu anchor. Results are in
`/private/tmp/ceatrace-actions-comparison.json` and the existing visual matrix.

All 926 frontend tests pass without skips. Workspace contract/type checks pass
after the production build; the build passes. Lint has 0 errors and the existing
76 warnings. All 646 application source files match the isolated build copy in
both directions, and all 748 reference manifest entries are unchanged. No backend,
schema, migration or production data changes are part of this checkpoint.
Broader language/source fidelity and the final full-scope release audit remain
open; these checks do not establish complete frontend parity.

### Language fidelity and internal precursor save checkpoint — 28 October 2026

The language engine is byte-identical to the reference. All 20,408 reference
entries across nine dictionary modules retain their values. Thai, Chinese and
Hindi each add six translations for the existing backend-backed setup/save/plan
messages; they do not change reference wording. The dictionary audit is saved
at `/private/tmp/ceatrace-language-fidelity.json`.

Nine additional phone pairs cover methodology, the populated January editor and
direct precursors in Thai, Chinese and Hindi. Main text, buttons, heading positions
and main geometry match within 1px. An initial precursor empty-state difference
came from comparing the current account's additional duplicate report with the
reference's earlier one-report snapshot. Loading identical synthetic records into
the isolated reference resolves it. Results are in
`/private/tmp/ceatrace-language-comparison.json`; Hindi monthly captures were also
inspected visually. This expands the language evidence, not a claim that every
route/state has been rendered in every language.

The made-here precursor row was the remaining manual save badge: it announced a
successful save immediately after changing the working copy. The badge now reads
the existing account sync subscription, showing saving/error until acknowledgement
and recovering through the existing global Retry action. The reference's fields,
options, quantities, derivations and immediate editing behavior are unchanged.

With the disposable local API stopped, adding a row and entering 320 tonnes kept
the row editable and displayed the save error. Restarting that API and using Retry
persisted exactly one row (`ip-ffd5b821`) from `ws-cfc4767148e5f5e8` into the test
copy `ws-488f5f64cd3f51e8`. It survives reload with 320 tonnes. Independent API reads
confirm every prior account record is unchanged, including the source report,
profile and onboarding. Only the new internal-precursor store was added. Proof is
in `/private/tmp/ceatrace-internal-{save-failed,saved-reloaded}.png` and the checker
`/private/tmp/ceatrace-internal-browser-check.py`. The copy's new row deliberately
extends the earlier archive/restore fixture after that checkpoint.

The populated internal-precursor page and all six row controls match the isolated
reference at desktop and phone sizes, including the retained input value and
disabled add button. Comparison data is in
`/private/tmp/ceatrace-internal-controls-results.json`. All 926 frontend tests pass
without skips, workspace contract/type checks pass, lint retains 0 errors and the
existing 76 warnings, and the production build passes. All 748 reference manifest
entries remain unchanged. This checkpoint changes one UI component; no backend,
schema, migration or production data changes are included.

The consolidated route evidence currently has captures for 32 of the 52 reference
route patterns. Eleven other routes contain redirect logic; those need their
navigation evidence reconciled separately. The other nine without unified captures
are Suppliers list/detail, Terms/Privacy, onboarding Done/Setup and the public
monthly/precursor/self-supply forms. Some have workflow evidence in earlier
checkpoints, but that does not substitute for the missing visual comparison cells.
The inventory is `/private/tmp/ceatrace-route-coverage.json`. These named gaps, the
remaining meaningful dialogs/states and the final release audit remain open.

### Suppliers and published document layout checkpoint — 28 October 2026

The Suppliers directory and saved supplier detail have four desktop/phone
comparisons with matching main text, controls and heading geometry within 1px.
The reference normally seeds eight bundled demo companies into its directory;
the current backend-backed account deliberately does not turn those fixtures into
real suppliers. For the comparison only, the isolated reference's demo declaration
and directory input arrays are empty; its merge/rendering logic and UI are
unchanged. Reloading the same synthetic account snapshot gives the same one real
company and two precursor rows. The source repository reference remains unchanged.
Results are in `/private/tmp/ceatrace-supplier-directory-comparison.json`.

The public Terms/Privacy routes still used the old boxed consent-reader layout.
`components/legal-page.tsx` now uses the reference's logo/back header, 2xl reading
width, title, section typography, spacing and cross-document footer. It retains
the existing English/Thai choice and renders the actual published backend content,
version and publication date. It does not replace the hosted service's legal
documents with the reference's demonstration/local-browser clauses, publish a new
version, change signup consent or write acceptance records.

Browser-to-API comparisons confirm every rendered item in all 27 Terms sections
and nine Privacy sections is unchanged in English and Thai. Four desktop/phone
comparisons match the reference's header, title, Back link and reading-column
geometry. Document body text and length deliberately follow the current published
snapshots, and the retained language controls also differ from the reference's
English-only demo pages; these are not full-document pixel matches. Evidence is
in `/private/tmp/ceatrace-legal-{content,frame}-results.json` and legal captures in
the existing visual directory.

All 926 frontend tests pass without skips. Workspace contract/type checks pass;
lint retains 0 errors and 76 existing warnings; the production build passes.
This phase changes the legal page renderer only. The consolidated capture index
now covers 36 reference route patterns. The five other non-redirect routes without
unified visual captures are onboarding Done/Setup, `/p`, `/self` and `/w`. Eleven
redirect routes still need their earlier navigation evidence reconciled. Remaining
dialog/state checks and the final full-scope audit stay open.

### Returning-account setup and Done comparison — 28 October 2026

An active trial now uses the reference's welcome sentence. Paid/expired accounts
retain the existing accurate workspace wording. This is the only application
change in this checkpoint; it does not change plan state or start another trial.

The dedicated disposable account was prepared with complete synthetic research
answers, EUR currency and mixed notification preferences. The real browser changed
only its LINE ID in setup. With the local API stopped, Save and continue stayed
on the form with its error and retained entries. Restoring the API and retrying
advanced through What you get and the trial confirmation to the dashboard. Reload
then showed the new LINE ID. Independent API reads confirm the research arrays,
counts/referral answer, EUR currency, preferences, previous report/draft records,
account access and original trial start are unchanged. The original exporter
account's records are also unchanged. Checks and proof are in
`/private/tmp/ceatrace-check-onboarding-c.py`,
`/private/tmp/ceatrace-setup-details-save-failed.png` and
`/private/tmp/ceatrace-setup-details-reloaded.png`.

Ten desktop/phone comparisons cover Welcome, Set up, What you get, trial and Done.
Eight match text, all controls and measured geometry within 1px. The two trial
captures differ only in the existing backend expiry text: “ends 27 Nov 2026”
replaces the demo's promise of a fresh month today. The displayed date is derived
from the unchanged server trial start. The remaining text and measured controls
match. The temporary reference fixture suppresses only its authenticated
mark-onboarded call; all editing and view logic remains the reference's. A harness
hydration mismatch was corrected before refreshing all reference captures; the
fresh reference tab reports no console errors. Results are in
`/private/tmp/ceatrace-onboarding-comparison.json`.

All 926 frontend tests pass without skips, workspace contract/type checks pass,
lint retains 0 errors and 76 existing warnings, and the production build passes.
The unified index now has captures for 38 reference route patterns. Public `/p`,
`/self` and `/w` remain without unified visual captures; redirect reconciliation,
remaining meaningful states and the final release audit are still open. No backend,
schema, migration or production data changes are included.

### Public forms and final route reconciliation — 28 October 2026

The existing shared supplier save badge now starts idle until a mutation succeeds,
matching the reference. An actual self-supply edit showed Saving then Saved and
persisted. The original value was restored and independently checked; the same
single server response token was reused. Public monthly, precursor and self-supply
answers, evidence and accepted versions remain unchanged. Opening self-supply
renews its existing expiry, as the backend already specifies.

Twenty-eight desktop/phone public-form comparisons match text and measured
controls/geometry within 1px. The temporary reference copy adapts only synthetic
input data and calendar-only timestamps. Its existing local missing-token screen
is used for the Invalid comparison because its missing-server-token path renders
blank. The current app reports Invalid for the backend's missing token.

The four questionnaire screens and Google callback failure add ten matched
desktop/phone comparisons. Two questionnaire strings were restored to reference
copy. Completing a disposable questionnaire persisted every answer while retaining
its original profile fields, EUR currency, access flag and trial state. Confirmation
survives reload. The existing partial-questionnaire account was not overwritten.

The consolidated inventory distinguishes 43 screen patterns and nine pure
redirect patterns; all 52 reference patterns exist in the current app. The eight
retired-route components are byte-identical to the reference. Their nine cases,
including both readiness branches, pass real navigation in each preview. The
home route had incorrectly reused the returning-login destination; it now opens
the dashboard for an already-onboarded account, matching the reference. This is
verified in the final production build. The three retained installation aliases
also resolve correctly.

All 926 frontend tests pass without skips. Workspace types/catalogue, lint
(0 errors, 76 existing warnings) and the final production build pass. Its 646
application source files match the working tree. The 748-file reference manifest
is unchanged. The last passing backend/migration rehearsal remains applicable:
no backend, schema or test source changed after its 44 tests / 668 assertions.
The acceptance report records the concrete scope, intentional server-data
differences and checks that were not performed.

### Earlier planning baseline

Completed during the investigation on 27 October 2026:

| Check | Result |
| --- | --- |
| Current frontend unit suite, `bun run test:frontend` | 578 passed; 0 failed, skipped, cancelled or todo. |
| Current portal TypeScript, with incremental output disabled | Passed. |
| Current backend TypeScript, with incremental output disabled | Passed. |
| Current `db:report-catalogue` | Passed: report storage, master-data and autofill-reference checks. |
| Reference portal TypeScript in disposable copy | Passed. |
| Reference frontend unit suite in disposable copy with shared fixture directory | 859 passed; 0 failed, skipped, cancelled or todo. |
| Reference source manifest after investigation | 687 files checked; 0 added, removed or changed within the audited source scope. |

The first isolated reference test run lacked the repository-level golden fixture; restoring the correct directory layout in the disposable copy resolved that harness error. No reference source change was needed.

Not performed in this planning task: rendered browser/screenshot comparison, reference backend execution, backend database integration suite, migration execution/rehearsal, production database inspection or deployment. Consequently this is a code-grounded migration plan, not a claim that the two rendered applications or their databases are already equivalent.
