# Report Lock, Pre-check, Verifier Handoff and Archive Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Status (2026-11-12): Phases 1-2 are code-level and ready to run. Phases 3-5 have interfaces, files and acceptance tests; their code steps are written when the phase starts, because they depend on Phase 1 types.** Facts in "Research facts" carry a source, a date and a confidence tag. Anything tagged `UNCONFIRMED` must not appear in UI, contracts or sales copy until checked against a primary source.

**Goal:** Let a customer lock a report into an immutable version (with a per-plan limit on official reports), run an automatic pre-check, hand a package to an accredited partner verifier, and keep prior-year data as a searchable archive and baseline.

**Architecture:** Add a `report_versions` layer on top of the per-installation/per-year `workbooks` row. A lock copies cells + meta (+ evidence references) into an immutable row with a SHA-256 content hash. Pre-check is deterministic rules first; the model only explains. Verifier handoff reuses the token-scoped link pattern (Smart Links) and the existing `lib/export/verification-export.ts` package.

**Tech Stack:** Bun workspace, Next.js 15 portal, Elysia + Prisma 7 + PostgreSQL backend, private R2 for file bytes, `certrace-backend/src/modules/cera/provider.ts` (DeepSeek, Groq fallback).

**Spec:** `C:\Users\menum\Downloads\carbon-strategy-report.md` (strategy report) + "Decisions" and "Research facts" below.

## Global Constraints

- Never label anything "verified" or "pre-verified" in UI, exports or emails unless an accredited verifier issued it. AI output is called "AI pre-check".
- Caps are advisory except for a NEW unit of commitment (matches `certrace-portal/lib/plan.ts`). A new official locked report is that commitment moment. Existing locked versions stay downloadable at any quota state.
- Re-downloading a locked version never counts against the quota. Drafts (DRAFT watermark) never count.
- Locked versions are immutable. Editing after lock creates version N+1.
- Code answers deterministic questions (completeness, units, mass balance, year-on-year). The model only reads evidence and explains.
- Migrations: raw SQL in `BEGIN; ... COMMIT;` under `certrace-backend/prisma/migrations/<yyyymmddNNNN>_<name>/migration.sql` (latest is `202611110005_item_links`; use `202611120001_report_versions`). New audit events extend `account_audit_events_event_check` (see `202610170001_registration_consent` for the drop/add pattern).
- After changing a portal stored type: `bun scripts/generate-report-storage.ts` in `certrace-backend`, then restart backend (see `.wolf/cerebrum.md`).
- Backend tests: `bun test test/<file>.test.ts` in `certrace-backend`, using `account, call, cleanup, editorOf` from `test/helpers.ts`; call `afterAll(cleanup)`.
- Commits: short `feat:`/`fix:`/`docs:` style, no co-author line (AGENTS.md rule 13). Commit only when the owner asks.
- Backend errors use `fail(status, "CODE", "plain message")` from `src/lib/errors`.

---

## Research facts (closing the gaps)

| # | Fact | Source, date | Confidence | Plan consequence |
| --- | --- | --- | --- | --- |
| R1 | CBAM actual emissions must be verified by an independent verifier **accredited by an EU/EEA national accreditation body**. Verifier gives reasonable assurance, visits the installation, issues **one verification report per installation**. Non-EU verifiers may apply to any NAB that offers the service. | EC "Verification of CBAM emissions" page, state of play 9 Nov 2026 | High (official) | Handoff package is per installation. Partner must be on the EC accredited list. A Thai firm is eligible only after accreditation. |
| R2 | Timeline: first CBAM accreditations around Sept 2026; first verification activity (document review, site visit) from Sept 2026; verifiers can issue first reports Jan 2027; operators share reports with declarants (via CBAM Registry / operator portal); declarants finalise the 2026 declaration by Sept 2027. | Same EC page | High | Verifier handoff (Phase 5) has a real demand window **Q1-Q3 2027**. Phases 1-3 should ship before Q1 2027. |
| R3 | Governing acts: Implementing Reg. (EU) 2025/2546 (verification principles), Delegated Reg. (EU) 2025/2551 (accreditation and verification), Implementing Reg. (EU) 2025/2547 (calculation methods). | Same EC page | High | Pre-check rules cite these three acts. Read the primary texts before writing rule messages (Task 7 step 0). |
| R4 | Site visit to every installation producing CBAM goods in the 2026 reporting period. | climease.com (secondary) | Medium | The T1 consultant visit does not replace the verifier's visit. Say so in the UI. |
| R5 | CBAM verification price: market estimate **EUR 5,000-50,000 per installation** (simple single-product EUR 5-12k; multi-product EUR 15-30k; large cement EUR 20-40k; fertilizer/N2O EUR 30-50k). **The Commission publishes no fee figures**; the numbers come from provider estimates. Re-checked 12 Nov 2026: same range, still one secondary source. | cbamguide.com (secondary); EC verification page (confirms accreditation only, no fees) | Low-Medium. **Cannot be confirmed from any primary source; it never will be.** Treat as a planning range until written quotes arrive. | Planning range only. Real price comes from partner quotes (Task 13). Never show it to customers as a Certrace price. |
| R6 | **CONFIRMED (primary).** Reg. (EU) 2023/956 Art. 7(5)-(6), consolidated text of 20 Oct 2025 (EUR-Lex): the authorised CBAM declarant keeps the Annex V records, **including the verifier's report**, until the end of the **fourth year after the year in which the CBAM declaration has been or should have been submitted**. Example: 2026 declaration due Sept 2027, so keep until end of 2031. **Scope caveat:** the article binds the EU *authorised declarant* (importer), not the Thai operator. Declarants will still ask operators for the records, so Thai customers need the same horizon. | EUR-Lex eli/reg/2023/956/2025-10-20 | High | Product default for CBAM locked versions and their evidence: keep at least until end of (declaration year + 4). Do not tell a Thai operator the law binds them directly. |
| R7 | Thai **CFO**: needs a TGO-registered external verifier. Verifier fee roughly **THB 30,000-100,000+**, paid to the verifier; **TGO filing fee: none (ienergyguru)**; certificate valid 1 year; TGO review 1-2 months. TGO's own post confirms the filing set starts with "(1) the organisation's GHG emission and removal report" (rest of list not retrievable). A second source (capsolar.co.th, 2026) says TGO and each verifier set their own fee and timing and tells buyers to get real quotes; it gives no figures. TGO's own pages (thaicarbonlabel.tgo.or.th, tver.tgo.or.th) block automated fetching, so fee, verifier roster and full document list could **not** be verified here. | ienergyguru.com 30 Jan 2026; TGO Facebook post (partial); capsolar.co.th; TGO site (not fetchable) | Low-Medium, `UNCONFIRMED` | Owner action (cheap, 1 phone call or email to TGO): confirm the fee, the current filing set and the verifier roster at tver.tgo.or.th. CFO package stays a hypothesis (report, verification statement, application, presentation) until then. |
| R8 | **Thai Climate Change Act is still a bill.** Kasikorn Research (1 Sep 2026) expects promulgation about **Q3 2027** and carbon pricing (TH ETS + carbon tax) around **2029-2030**. TH ETS runs in 3 phases (reporting, quota allocation, tightening), each at least 2 years. Carbon tax assumed THB 200/tCO2e. A public-hearing impact analysis was posted on parliament.go.th on 30 Sep 2026. | Kasikorn Research, 1 Sep 2026; parliament.go.th file dated 30 Sep 2026 | Medium (analyst forecast) | The law is not the near-term driver; **CBAM is**. Do not build a TH ETS module now. The archive and locked history are the asset that the future "reporting phase" will need. Re-check status each quarter. |
| R9 | Thai **designated factories and buildings** must submit an energy management report **by 31 March each year**, checked and certified by an energy auditor licensed by DEDE (e.g. the 2025 report was due 31 Mar 2026). Reports are filed through DEDE's online e-service. | DEDE notice (dede.go.th PDF) and DEDE e-service news | Medium-High | The energy module has a real yearly deadline. Quarter close should feed the 31 March report. It also gives T1 "consultant review" a regulatory hook. |
| R10 | "CBAM pre-verification" is an existing service name sold by accredited verifiers (SCS Global describes it for non-EU operators). | scsglobalservices.com blog | Medium | **Our feature must not be called "pre-verification".** Name: "AI pre-check". The partner's own pre-verification is the T2-lite product we can resell or refer. |
| R11 | Competitors (Sphera, Persefoni) sell enterprise supplier-data and CBAM calculation. Pricing not public. Neither is positioned at Thai SME exporters with local consultant visits. | sphera.com, persefoni.com | Medium | Differentiator stays: Thai-language workflow + consultant visits + locked history + verifier handoff. Do not compete on calculation features alone. |
| R12 | PDPA (B.E. 2562) applies to a foreign company processing data of people in Thailand, a processor has defined duties (s.40), and personal data may be kept only as long as necessary. There is **no single statutory retention number** for emission records. | PDPC and DPO-service articles | Medium | Retention is a policy decision (Task 5), not a constant. Company emission data is mostly not personal data; contact names and emails are. |

Confirmation pass, 12 Nov 2026: R6 (CBAM retention) is now confirmed from the primary text. R5 can never be confirmed from a primary source (the Commission publishes no fees). R7 stays unconfirmed because TGO's site cannot be fetched; it needs one contact with TGO. Code unknowns are settled in Task 1 step 0.

Still open (owner or counsel): Thai Accounting Act retention for supporting documents; TGO current verifier roster, fee and full filing list (R7); whether DeepSeek/Groq are acceptable processors for customer data (see Task 8).

---

## Decisions (answers to the open questions)

| Question | Decision | Why |
| --- | --- | --- |
| Will customers enter data here permanently, or elsewhere? | **Hybrid.** Platform is the system of record for the report, its evidence and its history. Data arrives from outside: Excel/CSV import (exists), Smart Links (exists), Cera document upload (exists), later API/ERP. | Factory data lives in Excel, ERP, bills and meters. Retention comes from history, evidence and locked reports, not from typing. Validate with 5 pilot customers: share of months filled by import vs manual entry. |
| Quarterly report | A quarter close is a frozen snapshot of year-to-date data, tied to the consultant visit. Feeds the DEDE 31 March report (R9) and the CBAM annual file. | Fits the 4 visits in the package. Needs a scheduler (none runs today). |
| Lock + limit | Lock = immutable version with hash and timestamp. Official annual locks are limited per plan. Quarter closes are free (they cost no verifier work) but each re-lock of the same scope creates a version. Drafts carry a DRAFT watermark and are free. | Limit what costs money or commitment, not what frustrates. |
| AI check, then send to verifier | Two steps. AI pre-check on demand. Sending is a deliberate customer click with a consent screen, expiring link and audit event. No auto-send. | Customer consents to sharing data. Avoids a false "verified" claim. |
| AI pre-check vs human | Three tiers. **T0** AI pre-check (all plans). **T1** Certrace consultant review inside the quarterly visits, starting from the AI findings. **T2** accredited partner verifier (formal, partner-priced). | Human gets findings first, so review is faster. Only T2 may say "verified". |
| Price of pre-verification | **Do not set a price yet.** Planning ranges only (R5, R7). Get written quotes from 2-3 partners, then price = partner quote + coordination fee (or referral fee). T0 is included in the annual plan. | No reliable market price exists. A made-up number would anchor sales. |
| Prior-year data | Keep as archive and baseline. Allow upload into a past year, flagged "historical, unverified" until evidence is attached. | Year-on-year is the strongest anomaly rule and the base for energy-saving to carbon-reduction claims. |
| Which standard after CBAM | **CFO / ISO 14064-1 engine is a separate dependent plan**, scheduled after Phase 3. | Law is a bill (R8); CBAM has a hard 2027 window (R2). |

**Owner decision (12 Nov 2026): quota stays as below until the owner revisits it; implement exactly this.** Official annual locks per year: Starter 1, Standard 4, Enterprise unlimited (`null`); trial 0 (draft only); a paid add-on later. The numbers live in one place per side (`certrace-portal/lib/config.ts` and `certrace-backend/src/modules/report-versions/plans.ts`, kept equal by a test), so changing them later is a two-line edit. Task 2's "ship with null behind a flag" fallback is no longer needed.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `certrace-backend/prisma/migrations/202611120001_report_versions/migration.sql` | tables `report_versions`, later `precheck_runs`, `verifier_handoffs`, immutability trigger, audit event additions |
| `certrace-backend/prisma/schema.prisma` | Prisma models for the same tables |
| `certrace-backend/src/modules/report-versions/{index,model,service,hash}.ts` (new) | lock, list, fetch, quota check, canonical hash |
| `certrace-backend/src/modules/precheck/` (new) | rules runner, AI explain step, run history |
| `certrace-backend/src/modules/verifier-handoff/` (new) | token link, revoke, audit, consent record |
| `certrace-backend/src/modules/reminders/` | quarterly reminder job (extend) |
| `certrace-portal/lib/plan.ts`, `lib/config.ts` | `reportsPerYear` cap and derived usage |
| `certrace-portal/lib/export/verification-export.ts`, `verifier-scope.ts` | handoff package + AI pre-check summary sheet |
| `certrace-portal/app/(portal)/reports/page.tsx` | version list, lock dialog, quota strip |
| `certrace-portal/app/(portal)/workspace/page.tsx` | quarter close, history import entry |
| `certrace-portal/app/(portal)/archive/page.tsx` (new) | per-year archive |
| `certrace-portal/app/v/[token]/` (new) | public verifier view, read-only |
| `.github/workflows/jobs.yml` or compose service | scheduler (Task 11) |

---

## Phase 1: Lock, versions and report quota

### Task 1: Report version table and lock endpoint

**Files:**
- Create: `certrace-backend/prisma/migrations/202611120001_report_versions/migration.sql`
- Modify: `certrace-backend/prisma/schema.prisma` (add model `report_versions`)
- Create: `certrace-backend/src/modules/report-versions/hash.ts`, `model.ts`, `service.ts`, `index.ts`
- Modify: `certrace-backend/src/app.ts` (import and `.use(reportVersions)` next to `.use(workbooks)`, line ~127)
- Test: `certrace-backend/test/report-versions.test.ts`

**Interfaces:**
- Produces: `canonicalHash(value: unknown): string` in `hash.ts`. Sorted-key JSON, SHA-256 hex.
- Produces: `POST /api/v1/report-versions` body `{ installationId: string, year: number, standard: "cbam"|"iso14067"|"tgo-cfp"|"cfo"|"iso14064-1"|"energy", kind: "quarter"|"annual", quarter?: 1|2|3|4 }` returns `{ id, version, contentHash, lockedAt }`.
- Produces: `GET /api/v1/report-versions?installationId&year` returns `{ versions: { id, standard, kind, quarter, version, contentHash, lockedAt, lockedBy }[] }`; `GET /api/v1/report-versions/:id` returns the full immutable `snapshot`.
- Table: `report_versions(id uuid pk, company_id uuid fk users, installation_id text, year int, standard text, kind text, quarter smallint null, version int, content_hash text, snapshot jsonb, locked_by uuid fk users, locked_at timestamptz)`; unique `(company_id, installation_id, year, standard, kind, coalesce(quarter,0), version)`.

- [x] **Step 0: Two unknowns, settled by reading the code (12 Nov 2026).**
  - **Required fields: yes, the backend can check them.** `src/modules/links/cbam-item-fields.json` has 457 fields, each with the full cell key (`"cell": "cbam:0:a-i9"`), and `optional?: boolean` (`item-fields.ts:14`). 373 are `optional: true`, so the rest are required. Rule: a field without `optional` must have a non-empty value at `cells[field.cell]`. The `lock` readiness gate uses this list (CBAM standard only; other standards fall back to "at least one non-empty cell" until they have a field list). No portal logic is duplicated.
  - **Evidence files are NOT in workbook cells.** They live in the company's stored account record `workspace_evidence` (tables `reporting.workspace_evidence_rows` -> `reporting.evidence_items`, migration `202610160005`). Each item carries `f_id`, `f_month`, `f_sourceType`, `f_fileName`, `f_fileHash`, `f_serverFileId`, `f_boundTo`. File bytes are in private R2 / `uploaded_files` (sha256 + storage_key). So a lock must copy evidence **references** (`id, month, sourceType, fileName, fileHash, serverFileId`), never bytes, into `snapshot.evidence`. The file hash already exists, which is what makes the lock tamper-evident.
  - **Still to verify when coding (not yet read):** which backend function loads a company's `workspace_evidence` record (`grep -rn "workspace_evidence\|loadRecord" src/modules/{records,reporting}`), and whether evidence items can be scoped to one installation/year. `f_boundTo` is free text (a supplier, shipment or year), not a key. Until scoping is proven, snapshot **all** evidence items of the company that match the locked year's months, and add a test fixture. Record the answer in one comment at the top of `service.ts`.
- [ ] **Step 1: Write the failing tests** (`test/report-versions.test.ts`):

```ts
import { afterAll, describe, expect, test } from "bun:test";
import { account, call, cleanup } from "./helpers";
afterAll(cleanup);

const wb = "/api/v1/workbooks/inst-1/2026";
const lock = (cookie: string, over = {}) =>
  call("/api/v1/report-versions", "POST",
    { installationId: "inst-1", year: 2026, standard: "cbam", kind: "annual", ...over }, cookie);

describe("report versions", () => {
  test("lock freezes cells; later edits do not change the snapshot", async () => {
    const a = await account();
    await call(wb + "/cells", "PATCH", { cells: { "cbam:0:a-i9": "100" } }, a.cookie);
    const v1 = await (await lock(a.cookie)).json();
    await call(wb + "/cells", "PATCH", { cells: { "cbam:0:a-i9": "999" } }, a.cookie);
    const got = await (await call(`/api/v1/report-versions/${v1.id}`, "GET", undefined, a.cookie)).json();
    expect(got.snapshot.cells["cbam:0:a-i9"]).toBe("100");
  });

  test("second lock of same scope is version 2; version 1 untouched", async () => {
    const a = await account();
    await call(wb + "/cells", "PATCH", { cells: { "cbam:0:a-i9": "1" } }, a.cookie);
    const v1 = await (await lock(a.cookie)).json();
    await call(wb + "/cells", "PATCH", { cells: { "cbam:0:a-i9": "2" } }, a.cookie);
    const v2 = await (await lock(a.cookie)).json();
    expect(v1.version).toBe(1);
    expect(v2.version).toBe(2);
    expect(v2.contentHash).not.toBe(v1.contentHash);
  });

  test("same content gives the same hash (hash is deterministic)", async () => {
    const a = await account();
    await call(wb + "/cells", "PATCH", { cells: { "cbam:0:a-i9": "5", "cbam:0:a-i10": "6" } }, a.cookie);
    const v1 = await (await lock(a.cookie)).json();
    const v2 = await (await lock(a.cookie)).json();
    expect(v2.contentHash).toBe(v1.contentHash);
  });

  test("another company cannot read the version", async () => {
    const a = await account();
    const b = await account();
    await call(wb + "/cells", "PATCH", { cells: { "cbam:0:a-i9": "1" } }, a.cookie);
    const v = await (await lock(a.cookie)).json();
    const r = await call(`/api/v1/report-versions/${v.id}`, "GET", undefined, b.cookie);
    expect(r.status).toBe(404);
  });

  test("empty workbook is refused", async () => {
    const a = await account();
    const r = await lock(a.cookie);
    expect(r.status).toBe(422);
    expect((await r.json()).code).toBe("READINESS_FAILED");
  });

  test("database rejects UPDATE on a locked row", async () => {
    const a = await account();
    await call(wb + "/cells", "PATCH", { cells: { "cbam:0:a-i9": "1" } }, a.cookie);
    const v = await (await lock(a.cookie)).json();
    const { db } = await import("../src/lib/db");
    expect(db.$executeRaw`UPDATE report_versions SET content_hash = 'x' WHERE id = ${v.id}::uuid`).rejects.toThrow();
  });
});
```

  If `await expect(...).rejects` hangs in bun 1.3.14 (see cerebrum), use try/catch and assert the thrown error instead.
- [ ] **Step 2: Run, expect FAIL** (404 on route). `cd certrace-backend && bun test test/report-versions.test.ts`
- [ ] **Step 3: Migration** `202611120001_report_versions/migration.sql`:

```sql
BEGIN;
CREATE TABLE public.report_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  installation_id text NOT NULL CHECK (installation_id ~ '^[A-Za-z0-9_-]{1,64}$'),
  year integer NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  standard text NOT NULL CHECK (standard IN ('cbam','iso14067','tgo-cfp','cfo','iso14064-1','energy')),
  kind text NOT NULL CHECK (kind IN ('quarter','annual')),
  quarter smallint CHECK (quarter BETWEEN 1 AND 4),
  version integer NOT NULL CHECK (version >= 1),
  content_hash text NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  snapshot jsonb NOT NULL,
  locked_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  locked_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind = 'quarter') = (quarter IS NOT NULL))
);
CREATE UNIQUE INDEX report_versions_scope_version
  ON public.report_versions (company_id, installation_id, year, standard, kind, COALESCE(quarter, 0), version);

CREATE FUNCTION public.protect_report_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'report_versions rows are immutable';
END $$;
CREATE TRIGGER report_versions_no_update BEFORE UPDATE ON public.report_versions
  FOR EACH ROW EXECUTE FUNCTION public.protect_report_version();
COMMIT;
```

  `ON DELETE CASCADE` on `company_id` is intentional (account anonymise/delete cascades); the trigger blocks UPDATE only, so account deletion still works. DELETE of a single version by app code is simply never offered.
- [ ] **Step 4: Prisma model** in `schema.prisma` mirroring the table (name `report_versions`, `snapshot Json`, `@@unique` omitted because the unique index uses `COALESCE`; query by raw SQL for `max(version)`). Run `bunx prisma generate` in `certrace-backend`.
- [ ] **Step 5: `hash.ts`**:

```ts
import { createHash } from "node:crypto";
const sort = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(sort)
  : v && typeof v === "object"
    ? Object.fromEntries(Object.entries(v as object).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, x]) => [k, sort(x)]))
    : v;
export const canonicalHash = (v: unknown) =>
  createHash("sha256").update(JSON.stringify(sort(v))).digest("hex");
```

- [ ] **Step 6: `service.ts` lock**, in one transaction, taking a row lock so two locks cannot race to the same version:

```ts
import { db } from "../../lib/db";
import { fail } from "../../lib/errors";
import { canonicalHash } from "./hash";

export async function lock(companyId: string, actorId: string, b: {
  installationId: string; year: number; standard: string; kind: "quarter" | "annual"; quarter?: number;
}) {
  if ((b.kind === "quarter") !== (b.quarter !== undefined))
    fail(422, "BAD_SCOPE", "A quarter lock needs a quarter; an annual lock must not have one.");
  return db.$transaction(async (tx) => {
    const [wb] = await tx.$queryRaw<{ meta: unknown; cells: Record<string, string>; revision: number }[]>`
      SELECT meta, cells, revision FROM workbooks
      WHERE company_id = ${companyId}::uuid AND installation_id = ${b.installationId} AND year = ${b.year} FOR SHARE`;
    if (!wb || Object.values(wb.cells).every((v) => !String(v).trim()))
      fail(422, "READINESS_FAILED", "Fill in the report before locking it.");
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${companyId + b.installationId + b.year + b.standard + b.kind + (b.quarter ?? 0)}))`;
    const [{ next }] = await tx.$queryRaw<{ next: number }[]>`
      SELECT COALESCE(MAX(version), 0) + 1 AS next FROM report_versions
      WHERE company_id = ${companyId}::uuid AND installation_id = ${b.installationId} AND year = ${b.year}
        AND standard = ${b.standard} AND kind = ${b.kind} AND COALESCE(quarter, 0) = ${b.quarter ?? 0}`;
    const snapshot = { cells: wb.cells, meta: wb.meta, workbookRevision: wb.revision };
    const contentHash = canonicalHash(snapshot);
    const [row] = await tx.$queryRaw<{ id: string; locked_at: Date }[]>`
      INSERT INTO report_versions (company_id, installation_id, year, standard, kind, quarter, version, content_hash, snapshot, locked_by)
      VALUES (${companyId}::uuid, ${b.installationId}, ${b.year}, ${b.standard}, ${b.kind}, ${b.quarter ?? null},
              ${next}, ${contentHash}, ${JSON.stringify(snapshot)}::jsonb, ${actorId}::uuid)
      RETURNING id, locked_at`;
    return { id: row!.id, version: next, contentHash, lockedAt: row!.locked_at.toISOString() };
  });
}
```

  Add `list(companyId, installationId, year)` and `read(companyId, id)` (404 `NOT_FOUND` when `company_id` differs). Note: the identical-content-twice test expects the same hash, and `workbookRevision` is in the snapshot, so it matches only when the revision is unchanged; that is what the test does.
- [ ] **Step 6b: Readiness gate and evidence refs (from Step 0).** Add `readiness.ts`:

```ts
import fields from "../links/cbam-item-fields.json";
type Field = { cell: string; optional?: boolean };
const all = (fields as { items?: Field[] }).items ?? (fields as unknown as Field[]);
export function missingRequired(standard: string, cells: Record<string, string>): string[] {
  if (standard !== "cbam") return Object.values(cells).some((v) => String(v).trim()) ? [] : ["*"];
  return all.filter((f) => !f.optional && !String(cells[f.cell] ?? "").trim()).map((f) => f.cell);
}
```

  Check the JSON's top-level shape first (it has keys `items`, `precursors`, `monitoring`, `verification`; the field arrays may sit under those, so flatten whichever hold objects with a `cell`). In `lock`, replace the "all cells empty" test with `missingRequired(...)`; on a non-empty result `fail(422, "READINESS_FAILED", ...)` and return the first 20 missing cells in the message. **Test (add to Step 1):** a CBAM lock with one required cell empty returns 422 listing it; a lock with all required cells filled and optional ones empty succeeds. Update the earlier tests' fixtures: they must fill every required CBAM cell (build the fixture from the same JSON, `Object.fromEntries(all.filter(f => !f.optional).map(f => [f.cell, "1"]))`), or use `standard: "iso14067"` where only "one non-empty cell" is required.
  Evidence: add `evidenceRefs(companyId)` that reads the company's `workspace_evidence` record (function found in Step 0) and returns `{ id, month, sourceType, fileName, fileHash, serverFileId }[]`; set `snapshot = { cells, meta, workbookRevision, evidence }`. Test: after locking, deleting the evidence item from the live record does not change `snapshot.evidence`.
- [ ] **Step 7: `model.ts` and `index.ts`**: Elysia module `new Elysia({ prefix: "/api/v1/report-versions" }).use(companySession)` with `t.Object` body validation (same style as `src/modules/workbooks/index.ts`); `quarter: t.Optional(t.Integer({ minimum: 1, maximum: 4 }))`. Mount in `app.ts`.
- [ ] **Step 8: Run tests, expect PASS.** `bun test test/report-versions.test.ts`; then `bun test` (full backend suite) to check nothing else broke.
- [ ] **Step 9: Audit event.** Add `REPORT_LOCKED` to `account_audit_events_event_check` in the same migration (drop and re-add the constraint with the full prior list plus the new value; copy the list from the latest migration that touched it) and insert an audit row inside `lock`. Test: one audit row per lock.
- [ ] **Step 10: Commit** (only when the owner asks): `feat: add immutable report versions`.

### Task 2: Per-plan quota for official locked reports

**Files:**
- Modify: `certrace-portal/lib/config.ts` (add `reportsPerYear: number | null` per tier; `null` = unlimited), `certrace-portal/lib/plan.ts` (derived usage `reportsUsed(year)`, `reportsCap()`; follow the existing "measures are derived, never stored" rule)
- Modify: `certrace-backend/src/modules/report-versions/service.ts` (server-side check; the server is the source of truth, the portal only displays)
- Create: `certrace-backend/src/modules/report-versions/plans.ts` exporting `REPORTS_PER_YEAR: Record<planId, number | null>`; add a test that asserts it matches `certrace-portal/lib/config.ts` so the two cannot drift
- Test: `certrace-backend/test/report-versions-quota.test.ts`, `certrace-portal/lib/__tests__/plan.test.ts`

**Interfaces:**
- Consumes: Task 1 `lock`.
- Produces: `fail(402, "REPORT_QUOTA", "Your plan allows N official reports for <year>. Contact sales to add more.")` when a NEW annual lock would exceed the cap; `GET /api/v1/report-versions/usage?year` returns `{ used, cap }`.

- [ ] **Step 1: Failing tests.** (a) `kind:"quarter"` locks never count. (b) With cap 1, the first annual lock succeeds and a second annual lock of a **different** scope returns 402 `REPORT_QUOTA`. (c) Re-locking the same scope (version 2) counts as a new official lock (decision above) and returns 402 at cap. (d) `GET /:id` for an existing version still returns 200 at cap. (e) `null` cap never refuses. Use a test helper that sets the account's plan id (see `test/team-seat-limits.test.ts` for how plans are set in tests).
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement** the count inside the lock transaction, after the advisory lock, so two concurrent locks cannot both slip under the cap:

```ts
if (b.kind === "annual" && cap !== null) {
  const [{ n }] = await tx.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*) AS n FROM report_versions
    WHERE company_id = ${companyId}::uuid AND year = ${b.year} AND kind = 'annual'`;
  if (Number(n) >= cap) fail(402, "REPORT_QUOTA", `Your plan allows ${cap} official report${cap === 1 ? "" : "s"} for ${b.year}. Contact sales to add more.`);
}
```

  The advisory lock key must therefore be per company+year (not per scope) for annual locks; use `hashtext(companyId + year)` for the quota critical section.
- [ ] **Step 4: Portal.** `reportsUsed`/`reportsCap` read from `GET /usage` (cache like other plan reads). Billing page shows a usage strip; prices stay "quoted, not listed" (see the billing page comment).
- [ ] **Step 5: Run backend + portal tests, expect PASS.**
- [ ] **Step 6: Commit** (on request): `feat: report quota per plan`.

Caps are decided for now (see Decisions): Starter 1 / Standard 4 / Enterprise `null` / trial 0. Implement exactly those; no feature flag.

### Task 3: Reports page UI

**Files:** Modify `certrace-portal/app/(portal)/reports/page.tsx`; create `components/reports/version-list.tsx`, `components/reports/lock-dialog.tsx`; copy keys in `lib/i18n.ts` (th/zh/hi dictionaries load lazily, add keys to all three).
- [ ] Failing test first for the pure helper `lockSummary(used, cap, kind)` in `lib/reports/lock-summary.ts` (returns the sentence shown in the dialog, e.g. "Uses 1 of 4 official reports for 2026" or "Quarter close, not counted").
- [ ] Lock dialog states plainly: what freezes, that it uses 1 of N official reports (annual only), that edits afterwards create a new version, and the hash/time.
- [ ] Draft export button always available, DRAFT watermark.
- [ ] Version list: version, who, when, hash (first 8 chars), download, "Send to verifier" (disabled until Phase 5).
- [ ] When `REPORT_QUOTA` returns, show the plan page link and `CONTACT_SALES_URL`; never lose the user's work.
- [ ] Verify in the browser at mobile (375) and desktop widths per project rules.

---

## Phase 2: Archive and prior-year data

### Task 4: Prior-year import and "historical" flag

**Files:** Modify the import wizard under `certrace-portal/app/(portal)/workspace/` and `lib/workbook/`; `workbooks.meta` gets `{ source: "historical", verified: false }` (meta is free-form jsonb, so no migration; confirm against `src/modules/workbooks/model.ts` meta schema first, extend it if it is a closed object).
- [ ] Failing test: importing into a year earlier than the current year sets `meta.source = "historical"`; attaching one evidence file clears nothing (only an accredited verifier statement would set `verified: true`, and that is manual by a Certrace admin).
- [ ] "Historical, unverified" badge until evidence is attached; the badge never reads "verified".
- [ ] Remember column mapping per customer (stored in the account records, so run `generate-report-storage.ts` if a stored type changes) so the next import skips mapping.
- [ ] Preview diff before commit: new / changed / unchanged cell counts.

### Task 5: Archive view, retention and export

**Files:** New `certrace-portal/app/(portal)/archive/page.tsx`; backend list endpoint over `report_versions` and `workbooks` grouped by year.
- [ ] Per year: locked versions, evidence files, who locked, when. Download everything for a year as one package (reuse `lib/cbam/download-package.ts`).
- [x] **Step 1 (research gate, done 12 Nov 2026):** CBAM clause confirmed (R6): declarant keeps records and the verifier report until the end of the fourth year after the declaration year. Product rule: for a locked CBAM version, never delete the version or its evidence references/files before **31 Dec of (declaration year + 4)**; the declaration year for reporting year Y is Y+1, so reporting year 2026 means keep to 31 Dec 2031. UI may state this number with the note "EU importers must keep these records for this long; ask them what they need." Other standards and the period after account closure remain an owner/counsel decision (Thai Accounting Act not checked); proposal: 7 years after closure.
- [ ] Data-subject rights (PDPA): account deletion/anonymise must handle `report_versions` (already `ON DELETE CASCADE`; contact names inside snapshots are the only personal data, keep them out of the snapshot by storing user ids, not names).
- [ ] Backup: R2 bytes need their own backup and lifecycle (see `docs/R2-STORAGE.md`); locked versions point at file ids, so evidence files referenced by a locked version must be exempt from any cleanup job.

### Task 6: Baseline hook

**Files:** `certrace-backend/src/modules/report-versions/baseline.ts`
- [ ] `priorYearTotals(companyId, installationId, year): Promise<Record<string, number> | null>` reads the latest locked annual version of `year-1`, else the workbook cells of `year-1` flagged historical. One function; precheck year-on-year and the future energy module both call it.

---

## Phase 3: AI pre-check

### Task 7: Deterministic rules runner

**Files:** Create `certrace-backend/src/modules/precheck/rules/{completeness,units,massbalance,yoy,defaults,evidence}.ts`, `runner.ts`, `model.ts`, `index.ts`; table `precheck_runs(id, company_id, report_version_id null, scope jsonb, score, findings jsonb, ruleset_version, created_at)` in migration `202611120002_precheck_runs`.
**Interfaces:** `runPrecheck(scope: { cells; meta; prior: Record<string, number> | null }): { score: number; findings: { ruleId: string; severity: "blocker"|"warn"|"info"; cell?: string; message: string }[] }`. Pure function, no I/O, so it is unit-testable without a database.
- [ ] **Step 0:** read Implementing Reg. 2025/2546 and 2025/2547 (R3) and write the list of rules with the article each comes from into `rules/README.md`. A rule without a source is `info` only.
- [ ] One failing test per rule using `test/fixtures` (calculation fixture) as the good case and a single-field mutation as the bad case. Example: completeness: blank required cell yields `blocker`; units: kWh value 1000x the prior year yields `warn`; yoy: deviation over 30% yields `warn` (threshold in one constant, owner tunable).
- [ ] Severity vocabulary is fixed; the score is `100 - 25*blockers - 5*warns` floored at 0, shown only as "AI pre-check score", never "readiness for verification".
- [ ] Endpoint `POST /api/v1/precheck` body `{ reportVersionId } | { installationId, year, standard }`; runs on a locked version or on live data (live runs are marked `draft`).

### Task 8: Model step for explanation (with a data-handling gate)

**Files:** `certrace-backend/src/modules/precheck/explain.ts` using `cera/provider.ts`.
- [ ] **Data gate first.** The explain step sends cell values and evidence text to an external model provider (DeepSeek, Groq; `provider.ts` picks one). Before enabling: (a) confirm with the owner/counsel that the provider terms are acceptable for customer production data; (b) add a per-company switch `precheck_ai_enabled` (default **off** until the customer accepts a short consent, audit-logged); (c) redact contact names, emails and phone numbers from anything sent. With the switch off, the deterministic rules still run and each finding keeps its fixed message.
- [ ] The model explains deterministic findings only. It cannot add, remove or re-rank them; it may add `info` items labelled "AI suggestion". Enforce in code: after the call, drop any returned finding whose `ruleId` was not produced by the rules runner except those typed `info` with `ruleId = "ai"`.
- [ ] Record `model`, `promptVersion`, `createdAt` on each run. Disclaimer text in every output: "AI pre-check. Not a verification."
- [ ] Rate limit and cost cap per plan (reuse the evidence extraction rate limit from `src/modules/evidence`).
- [ ] Failure mode: provider down or key missing returns the deterministic result with `aiStatus: "unavailable"`. Never fail the whole pre-check.
- [ ] Test with the fake provider used in `test/cera-provider.test.ts` (inject a stub that tries to add a blocker; assert it is dropped).

### Task 9: Pre-check UI and package sheet

**Files:** `certrace-portal/components/reports/precheck-panel.tsx`; extend `lib/export/verification-export.ts` with an "AI pre-check" summary sheet.
- [ ] Panel groups findings by severity, each with the cell link (jump to the cell in the workspace), and a "Fix with Cera" action that uses the existing Cera action card flow (`lib/cera/actions.ts`: server never writes; the card applies only on Confirm).
- [ ] Export sheet carries run id, ruleset version, model name, timestamp and the disclaimer. Failing test: the sheet title never contains "verified".

---

## Phase 4: Quarterly cycle and scheduler

### Task 10: Quarter close
**Files:** reuse Task 1 with `kind: "quarter"`; `certrace-portal/app/(portal)/workspace/page.tsx` adds "Close Q1..Q4" using year-to-date cells.
- [ ] Failing test: closing Q2 stores a snapshot; a Q2 re-close makes version 2; Q-closes never touch quota (Task 2 test (a)).
- [ ] Quarter close view lists changes since the previous quarter's snapshot (cell diff). This is the agenda for the consultant visit.
- [ ] The Q4/annual close is the input for the DEDE 31 March energy report (R9) when `standard = "energy"`.

### Task 11: Scheduler and reminders
**Files:** `certrace-backend/src/modules/reminders/` (extend), plus a real scheduler. The jobs endpoint `POST /api/internal/jobs/send-reminders` (Bearer `CERTRACE_JOBS_TOKEN`, `?dry_run`) already exists, but **nothing calls it**, so trial emails and reminders do not send today.
- [ ] Decide where the backend runs, then pick the scheduler: the repo has `compose.yaml` and `docker-compose-prod.yml`. If production is Compose on one host, add a small `cron` service (`curlimages/curl` looping daily) calling the endpoint on the internal network. If hosting is elsewhere, use a GitHub Actions `schedule` workflow (`cron: "0 1 * * *"`, UTC) with the token in repo secrets. Note: Actions schedules can be delayed and are disabled after 60 days of repo inactivity; keep a monitoring check (the job returns a count; alert if no run in 36 hours).
- [ ] Failing test: `Reminders.run(true)` (dry run) returns a quarter-end reminder for a company whose quarter ends in 14 days or 3 days and none otherwise; consultant visit date stored per quarter in `reminder_subjects`.
- [ ] The endpoint must stay idempotent (a double fire the same day sends once). Test this.

---

## Phase 5: Verifier handoff (needs a signed partner first, except the manual path)

### Task 12: Token link and read-only verifier view
**Files:** `certrace-backend/src/modules/verifier-handoff/`, `certrace-portal/app/v/[token]/page.tsx`; table `verifier_handoffs(id, report_version_id, partner, token_hash, expires_at, revoked_at, consent jsonb, created_by, created_at)` in migration `202611120003_verifier_handoffs`. Follow `src/modules/links` (`item_links`, migration `202611110005`) for token hashing and public-route patterns.
- [ ] Store only `token_hash` (SHA-256), show the raw token once. Failing tests: expired token 410; revoked token 410; wrong token 404; link to a version of another company impossible.
- [ ] The link opens a **locked version** only, never live data. Read-only view + download of the package (`verification-export`) for that version.
- [ ] Consent screen before creation lists exactly what is shared (version id, hash, evidence file count, AI pre-check summary yes/no) and records the acceptor and time in `consent`.
- [ ] Audit events on create, open, revoke (extend the check constraint, same pattern as Task 1 step 9).
- [ ] Start manual: Certrace emails the link to the partner. No partner API until a partner signs.
- [ ] UI text: "Package for verifier review". It must not say "verified". Include the partner's own accreditation number field (free text, owner filled) so the customer can see who they are sending to; check it against the EC accredited list (R1) before first use.

### Task 13: Pricing and partner commercial terms (owner work, not code)
- [ ] Shortlist from the EC accredited-verifier list (published on the EC verification page, R1) for CBAM, and the TGO verifier list for CFO. Ask 2-3 firms each for a written quote for a typical Thai exporter (one installation, one product group).
- [ ] Planning ranges only (R5, R7): CBAM EUR 5,000-50,000 per installation (no primary source exists); CFO THB 30,000-100,000+ (single source). Replace with quotes. Also ask TGO directly for the CFO fee, filing set and verifier roster (R7).
- [ ] Choose the model: referral fee, resale at cost + coordination fee, or customer pays partner directly. Hypothesis to test: pass-through at cost plus a fixed coordination fee, because it keeps Certrace out of the assurance relationship (independence matters for the verifier, R1).
- [ ] Price shown through the quoted-pricing flow (`CONTACT_SALES_URL`), not as a public list price, consistent with the billing page.
- [ ] Independence check: a verifier cannot be the same entity that prepared the data. If Certrace consultants (T1) prepare data, T2 must be a different organisation. Write this into the partner agreement.

---

## Cross-cutting gaps (each has an owner and a task)

| Gap | Where handled |
| --- | --- |
| Reminders and trial emails never send (no scheduler) | Task 11 |
| AI sends customer data to third-party model | Task 8 data gate |
| Retention number unknown | Task 5 step 1, R6, R12 |
| Quota numbers and prices undecided | Decisions hypotheses, Task 2 flag, Task 13 |
| Partner roster unknown | Task 13 |
| CFO / ISO 14064-1 / CFP engines, energy-to-carbon module | Separate plans (see below) |
| Law timing risk (R8) | Re-check quarterly; no TH ETS build now |
| Independence of T1 vs T2 | Task 13 last step |
| Mixed quota semantics on re-lock | Decisions (re-lock counts); test (c) in Task 2 |

## Follow-on plans (not in this file)

1. CFO / ISO 14064-1 calculation engine and TGO package (after Phase 3; R7 filing set).
2. Energy module: baseline from `priorYearTotals`, DEDE 31 March report export (R9), energy-saving to carbon-reduction link.
3. Product carbon footprint (ISO 14067 / TGO CFP) engine.

## Order and why

1. Phase 1: lock and versions are the base for archive, pre-check, quarter close and handoff.
2. Task 11 (scheduler) can run in parallel with Phase 1: it is independent and unblocks emails now.
3. Phase 2: archive is cheap and feeds baselines.
4. Phase 3: pre-check gains value from the archive (year-on-year). Target: live before Jan 2027 (R2).
5. Phase 4 quarter close: reuses Task 1, needs Task 11.
6. Phase 5: manual path can ship with Phase 3; partner API only after a signed partner. Demand window Q1-Q3 2027 (R2).

## Self-review

- Spec coverage: quarterly report (Task 10-11), update prior-year files (Task 4), where customers enter data (Decisions), lock + limit (Phase 1), AI check (Phase 3), pre-verifier package + partner connect (Phase 5), pricing and AI + human (Decisions, Task 13), prior-year storage (Phase 2).
- Placeholder scan: no TBD steps. Task 1 step 0 is now settled (required flag exists; evidence lives in the account record), with one residual read (the evidence loader function). Task 7 step 0 (read Reg. 2025/2546 and 2025/2547) is still open.
- Type consistency: `standard` enum identical in the SQL check, the Elysia body and the Interfaces block (`cbam|iso14067|tgo-cfp|cfo|iso14064-1|energy`); `kind` is `quarter|annual`; error codes `READINESS_FAILED`, `BAD_SCOPE`, `REPORT_QUOTA`; table names `report_versions`, `precheck_runs`, `verifier_handoffs`.
- Known weak spots: SQL and service code in Task 1 are written from the reading of `workbooks/service.ts` and the `workbooks` migration; they have **not been run**. Run Task 1 step 2 first and fix mismatches (for example the Prisma client name for the new model, or the helper `account()` return shape) before moving on. R6 is confirmed (primary). R5 cannot be confirmed (no primary source). R7 needs one contact with TGO. The CBAM tests in Task 1 need fixtures that fill every required field (Step 6b), which makes them longer than the sketch shown in Step 1.
