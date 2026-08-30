# Certrace — Post-Submission Compliance Architecture

**Scope:** everything that happens after a supplier clicks Submit on the SmartLink. The supplier experience (AI assistant, validation, unit conversion, guidance) is out of scope and unchanged. This document redesigns the exporter side: `Executive Summary`, `Audit Package`, `Report` as they exist today are replaced by a compliance operating system built around one principle — **collect once, generate everything.**

Grounded in the CBAM Definitive Period (from 1 Jan 2026), not the transitional-period rules the original pages were implicitly built around, and in how enterprise ESG/GRC platforms (Workiva, Persefoni, AuditBoard) and the COSO ICSR guidance structure controls over non-financial data. Sources are listed at the end.

---

## 0. The one correction that changes everything

The brief frames the goal as "generate regulator-ready CBAM declarations... submitted to the EU CBAM Portal." That's not how CBAM's legal structure works, and designing around the wrong actor produces the wrong outputs.

**The exporter is never the CBAM declarant.** Under the definitive regime, only an EU-established importer (or its indirect customs representative) can hold **Authorised CBAM Declarant** status, and only that party files the annual CBAM declaration and surrenders certificates in the CBAM Registry. The non-EU exporter/producer has no login to the CBAM Portal and no legal standing to file anything there.

What the exporter *can* do — and what Certrace should be judged against — is defined by Annex IV of the Implementing Regulation and by a registry module that already exists:

- **The CBAM Communication Template** — the Commission's own Annex IV-aligned format for an installation operator to transmit embedded-emissions data to a declarant. This is the real "regulator-ready" artifact on the exporter side, not a generic PDF.
- **The O3CI Portal** (Operators of Third-Country Installations, live in the CBAM Registry since Jan 2025) — lets a non-EU operator self-register an installation, upload emissions data in the Registry's standard schema once, and share it with *any* declarant who has the operator's EORI reference, via a "Search in Third-Country Installations" lookup. This is the closest thing to a direct government submission a producer/exporter gets, and it already eliminates "email the buyer a PDF."

So Stage 5 (§7) and the government-submission workflow (§8) are built around feeding **both** of these — not a fictional "Certrace submits to the EU" button. Everything else in this document (engine, intelligence, workspace, approval) exists to make sure what lands in those two channels is correct, verified, and defensible.

Other definitive-period facts that shape the architecture:

| Fact | Why it matters here |
|---|---|
| Declaration is **annual**, due 30 Sept of the following year (first: 30 Sept 2027 for 2026 imports) | The Workspace must support continuous, rolling data collection across a year, with a filing deadline the Overview tracks — not a per-shipment "done" state |
| **50-tonne/year mass threshold** for the buyer's obligation | The engine must be able to say "this buyer relationship may not need a declaration this year" rather than always assuming compliance work is required |
| Default values carry a **+10%/+20%/+30% markup** (2026/2027/2028+) to push toward actual data | The Intelligence layer's business-impact estimate must model this, or exposure numbers will be wrong from day one |
| **Complex goods cap default-value use at 20%** of embedded emissions — 80%+ must be actual, verified data | The engine must enforce this cap per product and flag violations, not just record a number |
| Actual-value declarations require **EN ISO 14065-accredited third-party verification**; 2026 requires a physical site visit | The engine must gate "actual" methodology on a valid verification record, or silently downgrade to default + markup |
| Carbon price already paid in the origin country is **deductible** — actual price if verified, a published default reference otherwise | This is a real number in the business-impact estimate, not a footnote |
| **CBAM certificate price** ≈ EU ETS auction average (quarterly avg 2026, weekly from 2027); sales open 1 Feb 2027 | Needed to translate tCO₂e into an estimated €-cost exposure, which is what actually earns trust from a CFO |

---

## 1. End-to-end workflow after submission

```
Supplier submits (SmartLink, e-signed)
        │
        ▼
 STAGE 0 — Freeze          immutable version, content-hashed, triggers the pipeline
        │
        ▼
 STAGE 1 — Compliance Engine     deterministic: validate → standardize → calculate → map → link evidence
        │
        ▼
 STAGE 2 — Compliance Intelligence   AI: trust score, change narrative, business impact, risk flags
        │
        ▼
 STAGE 3 — Compliance Workspace      humans work here: review, discuss, decide
        │
        ├──► revision needed ──► back to supplier SmartLink (only the flagged fields unlock) ──► resubmit ──► Stage 0 again, new version
        │
        ▼
 STAGE 4 — Internal Approval Workflow   configurable chain, e-signed, version-locked on completion
        │
        ▼
 STAGE 5 — Compliance Output Engine     fan-out: 9 output types generated from ONE approved dataset
        │
        ▼
 Buyer & Authority Handoff    O3CI feed · Communication Template · buyer-specific report · API export
        │
        ▼
 Archive (immutable, retained for the statutory period)
```

Nothing here is a "page you visit to download a PDF." It's a pipeline with one human-facing control surface (the Workspace) and one irreversible action (approval → filing), matching how regulated financial-close and GRC systems are built — not how a reporting dashboard is built.

---

## 2. System architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  SUPPLIER SIDE (unchanged)         SmartLink · AI assistant · e-sign │
└──────────────────────────────────┬────────────────────────────────--┘
                                    │  submit event
                                    ▼
┌───────────────────────────────────────────────────────────────────┐
│  IMMUTABLE VERSION STORE                                           │
│  every submission, engine run, approval, and output is a version  │
│  — nothing is ever overwritten, only superseded                    │
└───────────────────────────────────────────────────────────────────┘
     │                    │                     │                │
     ▼                    ▼                     ▼                ▼
┌──────────┐     ┌──────────────────┐  ┌────────────────┐  ┌───────────┐
│ STAGE 1  │────▶│ STAGE 2           │─▶│ STAGE 3        │─▶│ STAGE 4   │
│ Compliance│     │ Compliance        │  │ Compliance     │  │ Internal  │
│ Engine    │     │ Intelligence (AI) │  │ Workspace      │  │ Approval  │
│(deterministic)  │ (advisory only)   │  │ (humans act)   │  │ (config'd)│
└──────────┘     └──────────────────┘  └────────────────┘  └─────┬─────┘
                                                                  │ approved
                                                                  ▼
                                                        ┌───────────────────┐
                                                        │ STAGE 5           │
                                                        │ Compliance Output │
                                                        │ Engine (fan-out)  │
                                                        └─────────┬─────────┘
                                                                  ▼
                                          O3CI feed · Communication Template · Buyer report
                                          Audit package · ERP export · API export · Archive
     │                                                                            │
     └────────────────────────  AUDIT TRAIL (hash-chained event log)  ◄───────────┘
                                  every stage writes here; nothing is exempt
```

Two spines run underneath every stage: the **immutable version store** (§16) and the **audit trail** (§15). Neither is a feature of one page — they are infrastructure every other stage depends on.

---

## 3. Stage 1 — Compliance Engine (deterministic)

Not another AI layer. A pure, replayable function of `(frozen submission, methodology config, factor set version) → compliance dataset`. Same inputs always produce the same outputs — required for something a verifier or authority might need to reproduce years later.

| # | Responsibility | Detail |
|---|---|---|
| 1 | **Freeze & hash** | Snapshot the supplier's values + documents + signature at submit time; content-hash the bundle so any later dispute over "what was actually submitted" is settled by the hash, not by memory |
| 2 | **Schema validation** | Structural conformance to the current CBAM data model — CN code validity against the live Commission CN list, unit conformance, every Annex IV-mandatory field present. This is stricter and later than the supplier-side AI check, which only validates what the supplier *can* self-correct |
| 3 | **Unit standardization** | Normalize every quantity to tonnes, every emissions figure to tCO₂e/tonne, every currency reference for carbon-price-paid to EUR |
| 4 | **Methodology routing** | Per product and per precursor, determine default-value vs actual-value path; enforce the **20%-of-emissions cap** on default values for complex goods and flag any product that violates it |
| 5 | **Embedded emissions calculation** | SEE = direct + indirect (electricity) + attributed precursor emissions, computed per the official formula and per declared process route (e.g., BF-BOF vs EAF), not a flat multiplier |
| 6 | **Free-allocation offset** | Apply the EU ETS free-allocation phase-out factor applicable to the product/period, so the dataset carries a *net* CBAM exposure, not just gross emissions |
| 7 | **Carbon-price-paid deduction** | Actual verified origin-country price if available; otherwise the Commission's published default reference (from 2027) |
| 8 | **Verification gating** | "Actual" methodology is only valid if evidence includes a verification statement from an EN ISO 14065-accredited body with a visit type/date inside the monitoring period. Missing or stale verification silently fails the field back to default + markup, and the engine records *why* |
| 9 | **Evidence linkage graph** | Map every numeric field to its supporting document(s); flag orphan numbers (no linked evidence) and orphan documents (uploaded, never referenced) — this graph *is* what makes the audit package defensible later |
| 10 | **Cross-period delta** | Statistical comparison of this period's per-tonne intensity to the same supplier's prior periods — a structural fact, handed to Stage 2 to interpret, not itself an opinion |
| 11 | **Official schema mapping** | Transform the internal dataset into the three real target shapes: the Annex IV Communication Template, the O3CI installation/emissions payload, and a Registry-aligned XML — once, centrally, not per-output |
| 12 | **Declarability check** | Apply the 50-tonne mass threshold so the system can say a given buyer relationship may be out of scope this year, instead of assuming every declaration is mandatory |
| 13 | **Immutable versioning** | Every re-run after a revision produces version N+1 with a machine-generated diff against N — never an overwrite |
| 14 | **Compliance dataset assembly** | The single source of truth: an addressable structure (supplier → product → emissions component → evidence), not a document. Every downstream stage reads *this*, never the raw supplier form again |
| 15 | **Audit event emission** | Every step above writes its own audit-trail event, distinct from and prior to any human action |

**Code seam:** this formalizes and extends what `lib/exporter-review.ts` (`resolveSubmission`, `emissionsFor`) and `lib/ai-check.ts` already do informally. Today those functions blend "supplier-side quality check" outputs with exporter-facing math; Stage 1 should own methodology/verification/threshold logic that the supplier-side check has no business making.

---

## 4. Stage 2 — Compliance Intelligence (AI, advisory only)

This layer never re-runs supplier validation and never produces a number that appears in a filed output — it produces judgment, always attributable and overridable by a human.

| # | Capability | What it answers | Output is always... |
|---|---|---|---|
| 1 | **Trust score** | "Can this declaration be trusted?" — synthesizes verification coverage, evidence completeness, anomaly count, cross-period consistency into one explainable score with visible contributing factors (never a black box) | advisory |
| 2 | **Change narrative** | "What changed vs the last period?" — auto-drafted: product-mix shift, supplier swap, emissions-intensity delta, new precursor route | advisory, editable |
| 3 | **Business impact translation** | "What does this cost us?" — converts tCO₂e into an estimated CBAM certificate exposure range, net of free allocation and carbon-price-paid, using the current ETS-proxy price | advisory, ranged not exact |
| 4 | **Anomaly & benchmark flags** | Emissions intensity unusual vs *this supplier's own* history or published sector defaults (never against other tenants' confidential data) | advisory |
| 5 | **Weak-evidence detection** | Where an "actual" claim rests on thin documentation (e.g. a mill cert with no matching verification statement) | advisory, links to the evidence graph from Stage 1 |
| 6 | **Approval recommendation** | A recommendation with stated rationale and confidence — never an auto-approve action | advisory, cannot advance workflow state by itself |
| 7 | **Assumption ledger** | Every default value, extrapolation, or unverified figure the engine had to fall back on, so a reviewer knows what's measured vs estimated | advisory, always visible next to the number it qualifies |
| 8 | **Reviewer routing suggestion** | "Route to Legal — customs classification changed"; "Route to ESG — new supplier, no history" | advisory |
| 9 | **Grounded Q&A** | A reviewer can ask "why is this supplier's per-tonne emissions 18% higher than last period?" — answered against the frozen compliance dataset with citations to the exact field/document, not a free chat | advisory, always cited |

The hard rule for this whole document: **anything that could appear as a number in a filed output must come from Stage 1 (deterministic, reproducible). Anything that is an opinion, narrative, or recommendation is Stage 2 (AI, advisory, always overridable).** See §13 for the full split.

---

## 5. Stage 3 — Compliance Workspace

Not pages. Sections of one workspace per declaration, each earning its place because it removes a real manual step.

| Section | Purpose | Displays | Actions | Primary role | Why it exists |
|---|---|---|---|---|---|
| **Overview** (new, replaces landing on the Submissions tab) | Control tower — status at a glance | Lifecycle bar, trust score, filing-deadline countdown, approval-chain progress, outstanding suppliers | Jump to any other section | Everyone with access | Compliance teams open a status dashboard first, not a data table — matches how AuditBoard/Workiva land |
| **Submissions & Evidence** (kept, extended) | Per-supplier frozen data + what backs it | Submitted values grouped like the questionnaire, evidence-linkage status per figure, verification status | Open a submission, request revision, remind a laggard | Preparer | Same job as today's "Submissions" tab, now shows evidence linkage instead of just raw values |
| **Compliance Intelligence** (new, split out of Executive Summary) | The AI judgment layer | Trust score breakdown, change narrative, business impact estimate, weak-evidence list, assumption ledger | Ask a grounded question, accept/override a recommendation | ESG reviewer, Compliance officer | Today's "Executive Summary" conflated AI narrative with the actual math — this section is judgment only |
| **Emissions & Methodology** (new, split out of Executive Summary) | The actual regulatory math | Direct/indirect/precursor breakdown, default-vs-actual mix per product, 20%-cap status, free-allocation offset, carbon-price-paid deduction | None (read-only; corrections happen via revision request) | Compliance officer | This is the number a verifier or authority will actually interrogate — it needs to stand alone, not be buried in a narrative page |
| **Review & Approval** (new, promoted from a per-supplier control) | Where the decision happens | The configured approval chain, per-step status, threaded comments, e-signatures | Approve, request revision, comment, delegate, escalate | Whoever's turn it is in the chain (§6) | Approval today lives ad hoc inside each supplier's detail view; it needs to be a declaration-level, auditable workflow |
| **Output Center** (replaces Audit Package's "download ZIP") | Generate and manage every output | All 9 output types (§7) with status and version history | Generate, regenerate, download, share | Preparer, Compliance officer | One button today produces one PDF; the real need is nine distinct, purpose-built artifacts |
| **Buyer & Authority Handoff** (new, split out of "file") | The actual regulatory/commercial dispatch | O3CI feed status, Communication Template dispatch log, buyer acknowledgement tracking | Push to O3CI, send Communication Template, mark buyer-acknowledged | Preparer, Compliance officer | "Filing" is a distinct, irreversible workflow action with its own audit trail — not a side effect of downloading a package |
| **Audit Trail & Version History** (new, promoted from inline `events`/`versions`) | Full defensibility | Unified timeline across engine runs, AI runs, human decisions, output generation, dispatch; per-field diffs across versions | Export the trail, filter by actor/kind | Compliance officer, Legal, external auditor (read-only) | Currently scattered per-supplier; an auditor needs one timeline, not eight |
| **Declaration Settings** (new, admin-scoped) | Configuration | Approval-chain template, recipients, factor-set/period, materiality thresholds | Edit config (before Stage 0 freeze only) | Admin | Keeps configuration out of the working sections everyone else uses |

---

## 6. Stage 4 — Internal Approval Workflow

Configurable per organization, not hard-coded to one chain.

**Small company**
```
Preparer  ──►  Approve  ──►  Filed
```

**Enterprise** (each step configurable on/off, sequential or with conditional branches)
```
Preparer ──► ESG review ──► Compliance review ──┬──► Legal (conditional: risk flag or anomaly) ──► Management sign-off ──► Filed
                                                 └──► (skip Legal if no flag) ─────────────────────► Management sign-off ──► Filed
```

| Capability | Detail |
|---|---|
| **Configurable chain** | Stored per org as a template: ordered steps, each with a required role, sequential or parallel, and an optional trigger condition (e.g. "only if Compliance Intelligence trust score < 80" or "only if an anomaly was flagged") |
| **Comments** | Threaded per Workspace section, not just per approval step, so discussion stays attached to the number it's about |
| **Approvals** | Each step is approve / request-revision, never a silent no-op; skipped steps are logged as skipped, not omitted |
| **Assignments** | A step can be assigned to a role (any qualified person) or a named individual; delegation/out-of-office reassignment is a logged action, not an account-sharing workaround |
| **Revision requests** | Writes back to the *supplier's* store (already built — `requestRevision` in `lib/exporter-review.ts`) unlocking exactly the flagged fields/docs; a resubmission re-enters at Stage 0 as a new version, and the approval chain resets only for the steps affected by what changed |
| **Notifications** | Each step change notifies the next assignee and the preparer; deadline-aware escalation if a step sits idle past an SLA |
| **Audit history** | Every step transition, comment, and e-signature is an audit event (§15) |
| **Electronic sign-off** | Reuses the same e-sign primitive already built for the supplier side — identity-bound, timestamped, tied to the exact dataset version being approved |
| **Version locking** | The moment the final step completes, the compliance dataset version is locked; no further edits are possible without a new revision cycle starting a new version |

---

## 7. Stage 5 — Compliance Output Engine

One approved compliance dataset, fanned out into every artifact someone actually needs. Nothing here is invented for its own sake — each row replaces a real manual process (see final column).

| Output | Audience | Contents | Source | Format | Generated | Editable | Versioned | Replaces |
|---|---|---|---|---|---|---|---|---|
| **CBAM Communication Template** | Buyer's declarant / their compliance team | Installation ID, per-good CN code, process route, direct/indirect/precursor emissions, methodology flag, verification reference — Annex IV field set | Stage 1 dataset | XLSX (official template) + XML mirroring the Registry schema | On approval | No (regenerate, don't edit) | Yes | Ad-hoc spreadsheets exporters currently hand-build per buyer |
| **O3CI Registry feed** | CBAM Registry (via the operator's own account, or API once available) | Installation profile + emissions dataset in the Registry's standardized schema | Stage 1 dataset | Structured file today (JSON/XML aligned to the Registry spec); direct API when Certrace integrates | On approval | No | Yes | Manually re-entering the same data into the Registry's own form |
| **Executive Summary** | Exporter management, non-technical stakeholders | Trust score, change narrative, business-impact estimate, approval status | Stage 2 (Intelligence) | PDF + in-app | On demand, snapshotted at filing | No | Yes | Today's generic "Executive Summary" page — kept, but now genuinely a summary of judgment, not a mix of judgment and math |
| **Audit & Evidence Package** | Verifiers, internal/external auditors, authorities on request | Full compliance dataset + linked evidence files + calculation trace + approval-chain history + audit trail, with a manifest of content hashes | Everything | Structured ZIP/PDF bundle | On filing (frozen) | No | Yes, immutable per filed version | Today's "Audit Package" — kept, but now actually traceable field-by-field instead of a static PDF |
| **Buyer-specific report** | The specific EU buyer/importer | Subset of the dataset scoped to that buyer's shipments/products, in their preferred layout | Stage 1 dataset, filtered | PDF/XLSX | Per filing or on demand | Presentation only (branding/columns) | Yes | The manual "email a report to the buyer" step the brief calls out explicitly |
| **Board/ESG rollup** | Executives, board, annual sustainability report authors | Portfolio-level emissions trend, cost exposure, supplier risk heatmap across all declarations/buyers/periods | Cross-declaration rollup | PDF/deck | Quarterly or on demand | Commentary layer only | Yes | Manually assembling a CBAM section for the annual sustainability report |
| **ERP/Finance export** | Finance, procurement, supplier scorecarding | Per-supplier/per-shipment emissions + estimated CBAM cost line items | Stage 1 + Stage 2 | CSV / SAP-Oracle-ready fields | On filing | No | Yes | Manual re-keying of exposure numbers into budgeting |
| **API export** | Buyer's own compliance software (Persefoni, Workiva, SAP Sustainability, etc.) or their customs broker | Same dataset via REST, with a webhook on new version | Stage 1 dataset | JSON API | Real-time on approval | No | Yes, API returns a version pointer | Zero-duplicated-work handoff — the buyer's system never re-keys anything |
| **Submission archive** | Compliance/legal, future auditors | Every version of everything, immutable, hash-manifested | All | Sealed archive | Continuous, automatic | Never | Is the version store itself | Statute-of-limitations-safe retention (CBAM/ETS-style multi-year requirements) |

---

## 8. Government & buyer submission workflow

Per §0, "submit to the government" means feeding the two channels that actually exist for a non-EU exporter:

1. **O3CI push** — the exporter's verified installation + emissions data is uploaded into the CBAM Registry's third-country-installations module (self-service today; API when Certrace integrates directly). Any declarant holding the exporter's EORI reference can then pull it in without another file changing hands.
2. **Communication Template dispatch** — for buyers/declarants not using O3CI, Certrace generates and sends the Annex IV-aligned Communication Template directly, tracked as a dispatch event with a read/acknowledgement receipt, not a fire-and-forget email attachment.

Both paths converge on a **buyer acknowledgement loop**, tracked as its own status distinct from "generated" and "approved":

```
Approved (internal)  ──►  Dispatched (O3CI push and/or Communication Template sent)  ──►  Acknowledged by buyer/declarant
```

"Filed with the authority" is not something Certrace can claim on the exporter's behalf — the true end state visible in the Workspace is **Acknowledged**, with a clear note on which declarant confirmed receipt and when. This is a deliberate, honest boundary: it's also exactly the boundary a real compliance officer would insist on before trusting the tool.

---

## 9. Data lifecycle

```
Draft (supplier, mutable)
   │ submit + e-sign
   ▼
Frozen submission (immutable, content-hashed) ── Version 1
   │ Stage 1 engine run
   ▼
Compliance dataset (derived, deterministic, re-derivable from the frozen submission + config)
   │ Stage 2 intelligence run (non-authoritative overlay)
   ▼
Under review (Workspace) ──► revision requested ──► supplier unlocks flagged fields ──► resubmit ──► Version 2 (loop)
   │ all approval steps complete
   ▼
Approved & version-locked
   │ Stage 5 fan-out
   ▼
Outputs generated, each stamped with the exact dataset version it was built from
   │ dispatch
   ▼
Acknowledged by buyer/declarant
   │
   ▼
Archived — immutable, queryable, retained for the statutory period (multi-year, CBAM/ETS-aligned)
   │ (if a later correction is needed)
   ▼
Superseded-but-retained — old version never deleted, new version created and linked
```

Nothing is ever deleted or overwritten after Stage 0. A "correction" is always a new version with a recorded reason, never an edit to history.

---

## 10. Roles & permissions

| Role | Can view | Can act | Cannot |
|---|---|---|---|
| **Preparer** (exporter analyst) | Everything in the declaration | Resolve flags, request supplier revision, advance their own workflow step, generate outputs | Give final sign-off if the chain reserves it for a higher role; edit a frozen dataset |
| **ESG / Sustainability reviewer** | Everything | Comment, approve their chain step | Edit the dataset |
| **Compliance officer** | Everything + methodology/factor-set config | Approve their step, document a methodology override with justification | Silently bypass the verification-gating rule (any override is itself an audited action) |
| **Legal counsel** | Outputs + evidence relevant to liability | Approve their step, request a legal hold/redaction | Edit the dataset |
| **Management / executive** | Executive Summary + approval-chain status | Final e-signature | Edit anything upstream |
| **Admin** | Org config | Configure users, approval-chain templates, integrations | Approve a declaration (segregation of duties), unless separately assigned a reviewer role |
| **Buyer** (external, scoped) | Their buyer-specific report + API feed only | Acknowledge receipt | See internal comments, other buyers' data, or unapproved drafts |
| **Verifier** (external, scoped) | Evidence + methodology for the goods they verify | Attach a verification statement/certificate | Approve internal workflow steps |
| **System (Compliance Engine / Intelligence)** | Full read/derive access | Write only to its own versioned outputs | Ever "approve" anything — its outputs are deterministic facts or advisory judgment, never a workflow decision |

---

## 11. Screen-by-screen UX flow (old → new)

| Today | Becomes | Why |
|---|---|---|
| Lands on "Submissions" tab | Lands on **Overview** (control tower) | A compliance team needs status first, raw data second |
| "Submissions" tab | **Submissions & Evidence** | Same job, now shows evidence linkage and verification status per figure, not just raw values |
| "Executive Summary" tab (one generate button, mixes narrative + numbers) | **Compliance Intelligence** (judgment) + **Emissions & Methodology** (math), as two sections | The brief is explicit that intelligence must not repeat validation and must be judgment, not numbers — the current page conflates both |
| "Audit Package" tab (one ZIP download) | **Output Center** (generate/manage 9 output types) + **Buyer & Authority Handoff** (dispatch/acknowledgement) + **Audit Trail & Version History** (timeline) | "Download ZIP → Done" collapses three distinct actions with three distinct audiences into one button; each now has its own home |
| Reviewer assignment buried inside each supplier's detail view | **Review & Approval**, declaration-level, configurable chain | Approval is usually a declaration-level decision, not a per-supplier afterthought |
| Global `/reports` list (flat) | Kept as the cross-declaration index, filterable by output type, buyer, and status | Nine output types need more than one flat list to stay usable |

---

## 12. Backend processing flow

Event-driven; each stage is a consumer of the previous stage's completion event, so re-running any stage never requires re-triggering the others by hand.

| Trigger event | Consumer | Produces | Idempotency key |
|---|---|---|---|
| `supplier.submitted` | Freeze job | Immutable frozen submission (Version N) | `(declId, supplierId, version)` |
| `submission.frozen` | Compliance Engine job | Compliance dataset (Stage 1 output) | `(declId, supplierId, version)` |
| `dataset.computed` | Intelligence job | Trust score, narrative, impact estimate, flags (Stage 2 output) | `(declId, supplierId, datasetVersion)` |
| `intelligence.ready` | Notify assigned reviewers | Workspace unlocks Review & Approval for this submission | — |
| `approval.step_completed` (human) | Workflow engine | Advances chain, or triggers revision loop back to `supplier.unlocked` | `(declId, stepId)` |
| `approval.chain_completed` | Version lock | Dataset frozen at declaration level, no further edits without new cycle | `(declId, approvedVersion)` |
| `declaration.approved` | Output Engine (fan-out) | All 9 outputs, each stamped with `approvedVersion` | `(declId, approvedVersion, outputType)` |
| `output.generated` | Dispatch job | O3CI push, Communication Template send, buyer notification, ERP/API export | `(declId, outputType, recipient)` |
| every event above | Audit logger | One event appended to the hash-chained trail | event id itself |

---

## 13. AI vs deterministic responsibility split

**Rule:** anything that could appear as a number in a filed output must be deterministic and reproducible (Stage 1). Anything that is an opinion, narrative, or recommendation is AI and always advisory, always overridable (Stage 2).

| Deterministic (Compliance Engine) | AI (Compliance Intelligence) |
|---|---|
| Schema/unit validation | Trust score narrative |
| Embedded emissions calculation | "What changed" summary |
| 20%-cap enforcement | Business-impact estimate (range, not a filed figure) |
| Verification gating | Anomaly/benchmark flags |
| Free-allocation & carbon-price-paid math | Weak-evidence detection |
| Official schema mapping | Approval recommendation |
| Threshold/declarability check | Assumption ledger commentary |
| Versioning & hashing | Reviewer-routing suggestion |
| Audit event emission (facts) | Grounded Q&A (always cited back to Stage 1 data) |

---

## 14. Report generation pipeline

Every output in §7 is a **template + data-binding spec + renderer**, not a hand-laid-out page:

```
Compliance dataset (approved, versioned)
   │
   ▼
Data-binding spec (per output type: which fields, which scope — e.g. "this buyer's shipments only")
   │
   ▼
Template (Annex IV layout / Executive Summary layout / Audit bundle manifest / ...)
   │
   ▼
Renderer (XLSX / PDF / XML / JSON / CSV)
   │
   ▼
Artifact — content-hashed, stamped "generated from dataset version N", stored immutably
```

Regenerating an output never overwrites the previous artifact — it creates output-version N+1, so "what did we actually send the buyer in March" is always answerable.

---

## 15. Audit trail architecture

Extends the event pattern already in `lib/supplier-store.ts` (`AuditEvent`) from per-supplier to per-declaration, and adds tamper-evidence:

- **Append-only event log**, one unified timeline per declaration, with supplier-scoped sub-timelines rolling up into it (today these are scattered per-supplier only).
- Each event: `{ id, at, actor (role + id, or "system"), kind, before/after refs, text }`.
- **Hash-chained**: each event stores the hash of the previous event plus its own payload, so any retroactive edit to history is detectable, not just discouraged by convention.
- Every stage — engine run, intelligence run, human decision, output generation, dispatch — writes here. No stage is exempt, including the "system" actor.
- Exportable as its own artifact (feeds the Audit & Evidence Package in §7) and viewable read-only by external auditors/verifiers without exposing internal comments.

---

## 16. Version control architecture

Three version axes, each with full provenance back to the one before it:

1. **Submission version** — already exists (`Version 1, 2, …` per supplier). Bumped on every supplier resubmission.
2. **Compliance dataset version** — derived 1:1 whenever any input submission version changes; a re-run of Stage 1. Never edited directly.
3. **Output version** — generated whenever the dataset version changes, or on explicit regenerate. Each artifact references the exact dataset version *and* the exact input submission versions it was built from.

This provenance chain is what makes "reproduce exactly what was filed three years ago" possible for an audit — the engine is a pure function, so replaying it against the same recorded inputs and factor-set version reproduces the same artifact byte-for-byte.

---

## 17. Future scalability beyond CBAM

The regulation-as-config pattern already exists (`REGULATIONS`, `JURISDICTIONS` in `lib/config.ts`) — this architecture is regulation-agnostic as long as Stage 1's methodology and schema-mapping steps are pluggable per regulation:

- **CBAM module** (this document) ships first.
- **EUDR, CSRD, UK CBAM, Scope 3** become additional Stage 1 engine modules — different methodology, different official schema, different verification rules — reusing the same Workspace, Approval workflow, and Output Engine shell unchanged.
- "Collect once → generate everything" then applies **across regulations**, not just across output types: a supplier's product-level emissions data collected once can feed a CBAM Communication Template, an EUDR due-diligence statement, and a CSRD Scope 3 disclosure line, all from the same frozen submission.

---

## 18. Migration — what happens to today's pages

| Existing page | Verdict | Detail |
|---|---|---|
| Executive Summary | **Split, not kept** | Content survives, divided by responsibility into Compliance Intelligence (judgment) and Emissions & Methodology (math) — the current single page conflates the two in a way the brief explicitly rejects |
| Audit Package | **Split, not kept** | "Generate package," "file with recipients," and "view history" are three different actions with three different audiences; they become Output Center, Buyer & Authority Handoff, and Audit Trail & Version History respectively |
| Reports (global list) | **Kept, restructured** | Stays as the cross-declaration index; gains filtering by output type/buyer/status now that there are 9 output types instead of 1 PDF |
| Reviewer assignment (inline, per-supplier) | **Promoted** | Becomes the declaration-level Review & Approval section with a configurable chain, instead of a per-supplier afterthought |
| "File" action | **Replaced** | Becomes the Buyer & Authority Handoff workflow (§8), with Acknowledged as the real end state instead of an unqualified "Filed" |

---

### Sources consulted

- [CBAM Registry and Reporting — European Commission](https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-registry-and-reporting_en)
- [Carbon Border Adjustment Mechanism — European Commission](https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en)
- [CBAM Authorised Declarant: what importers need to know — CarbonChain](https://www.carbonchain.com/blog/cbam-authorised-declarant-what-importers-need-to-know-before-the-march-28-application-opening)
- [How to register on the CBAM registry (Jan 2026) — Master Sustainability](https://www.mastersustainability.today/knowledge/how-to-register-on-the-cbam-registry-a-practical-guide)
- [CBAM Verification Requirements 2026 — EnCarbonSys](https://encarbonsys.com/cbam-blog/cbam-verification-requirements-2026.html)
- [Verification under CBAM — carboneer](https://carboneer.earth/en/2026/03/verification-under-cbam-key-learnings-and-guidance-for-effective-preparation-part-1/)
- [European Commission publishes 'default values' for CBAM — EY](https://www.ey.com/en_gl/technical/tax-alerts/european-commission-publishes--default-values--for-cbam-transiti)
- [How the EU's New Default Emissions Values Under CBAM Impact US Exporters — O'Melveny](https://www.omm.com/insights/alerts-publications/how-the-eu-s-new-default-emissions-values-under-cbam-impact-us-exporters-what-you-need-to-know-for-2026/)
- [Understanding CBAM and its implications — KPMG](https://kpmg.com/ie/en/insights/deal-advisory/understanding-cbam.html)
- [EC launches draft on CBAM carbon credit deductions — EUROMETAL](https://eurometal.net/ec-launches-draft-on-cbam-carbon-credit-deductions/)
- [A new CBAM portal for installation operators outside the EU — UABIO](https://uabio.org/en/news/17152/)
- [CBAM Registry access open for non-EU installation operators — EEAS](https://www.eeas.europa.eu/delegations/kazakhstan/cbam-registry-access-open-non-eu-installation-operators_en)
- [EU CBAM: a guide for importers and third-country producers — Ashurst](https://www.ashurst.com/en/insights/eu-cbam-a-guide-for-importers-and-third-country-producers/)
- [CBAM enters the definitive period: key regulatory updates — carboneer](https://carboneer.earth/en/2025/12/cbam-definitive-period-scope-extension/)
- [ESG Software & Reporting Platform — Workiva](https://www.workiva.com/solutions/esg-reporting)
- [How to Leverage SOX Internal Controls for ESG Reporting — Citrin Cooperman](https://www.citrincooperman.com/In-Focus-Resource-Center/How-to-Leverage-SOX-Internal-Controls-for-Successful-ESG-Reporting)
- [Internal Controls for Reliable ESG Reporting](https://corpstage.com/internal-controls-for-esg-reporting/)
