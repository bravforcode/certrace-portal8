# CBAM input experience design

**Purpose:** Make it easy for an exporter to collect the installation and annual data needed for OER and OSER, while letting the final-good operator and external precursor producers provide the facts only they know. The [EU-based input inventory](/Users/kanamafu/Documents/ceatrace/docs/CBAM-OER-INPUT-REQUIREMENTS.md) remains the field and applicability reference. This document designs the collection experience; its screen names, statuses and review rules are Certrace product choices.

## The experience in one sentence

**Set up the installation once → request data from the right party → collect monthly measurements by form or PDF → review extracted values against their source → resolve gaps → prepare the annual reports.**

Do not ask the user to navigate seven regulatory sections every month. Retain the agreed Company → Installation → Reporting Period → 2.1–2.7 data structure underneath, but present five short work areas:

```text
Company
└── Installation A
    └── Reporting year 2026
        ├── 1. Setup             ← profile + 2.1 production + 2.2 method
        ├── 2. Months            ← 2.3 readings + monthly precursor use
        ├── 3. Precursor sources ← 2.4 producer requests and reports
        ├── 4. Documents         ← 2.5 uploads, source links and review
        └── 5. Review & reports  ← 2.6 checks + 2.7 OER/OSER/addendum
```

Every field still knows its installation, year, process, route, product/CN code, month or source period, provider and evidence. A user sees only fields applicable to the selected good, method and real physical flows.

## Screen 1 — Setup, entered once and revised when something changes

Ask for **actual installation operator**, installation identity/location, reporting year, and production structure. Reuse saved profiles in later years; ask the user to confirm changes and their effective dates. A process builder should be a readable tree, with an **Add process**, **Add route**, **Add product**, **Add step** and **Add precursor** action. In the EAF example, show EAF steelmaking and hot rolling as physical steps while prompting the operator to confirm whether crude steel and 7208 hot rolling have separate regulatory process boundaries or an eligible Article 4(9) joint process.

For each product, show its selected **exact CN code**, required functional unit and expected monthly output unit. Let the operator select monitoring methods, meters, factors, allocation basis and applicable benchmark from guided options, with a short explanation and an **Other/describe** path. Store one versioned monitoring plan. Each month asks only **“Did the process, meter or method change?”**; a Yes response opens the affected fields and records the effective date. Existing diagrams and standing certificates remain linked.

### Quick setup card

```text
Installation: Factory A                      Year: 2026
Operator: [Select / add legal operator]      [Import prior year]

Production processes
1  Hot-rolled steel (CN 7208 …)             [Edit]
   Route: EAF-based chain · 5 steps · 2 precursor sources
   Monthly output unit: tonnes

Monitoring plan: Draft · Updated 12 Jan     [Review method]
```

## Screen 2 — Months, the main recurring task

Show twelve month cards in a grid, with **Not started / Draft / Awaiting operator / Needs review / Complete / Genuine zero activity**. Each card shows output, fuel, electricity, precursor use, document coverage and unresolved issues. These are product statuses; “Complete” means the required applicable inputs were reviewed, not that an independent verifier has issued an opinion.

Opening a month shows a short, repeatable form. Save drafts automatically. Start with setup from the last month **without copying measured quantities**. Let the user switch between **Type values** and **Upload records** at any point; both write into the same draft after review.

```text
JANUARY 2026 · FACTORY A                    Draft · saved just now
Method unchanged this month? [Yes ▾]       [Upload PDF / image / CSV]

1. Production       [Add output row]        7208 product · tonnes · route
2. Fuels & materials[Add stream]            amount · unit · method parameters
3. Electricity      [Add source]            consumed · generated/exported if relevant
4. Precursors used  [Add use row]           source · process · tonnes actually used
5. Other flows      [Show applicable]       heat / waste gas / CO₂ / CEMS / PFC

Evidence: 4 linked · 1 needs review         [Review source documents]
Issues: 2                                 [See what is missing]
```

The form asks **zero / not applicable / unknown or missing** distinctly. It does not require positive production, fuel or electricity for every month. When receipts differ from consumption, show a simple optional balance: **opening stock + received − closing stock − transferred/returned = used**, with the operator confirming the quantity actually consumed, including losses. A supplier invoice or goods-received note fills **received**, not **used**. Require a process/source link for every used precursor.

Fuel inputs follow the selected method. For example, a suitable quantity-based EF need not force an NCV field; an energy-based calculation does. Conditional flows appear only if setup says they exist or an uploaded source reveals them. Sector composition can be entered monthly if it varies, or imported from batch/lot evidence and rolled up using the applicable method.

## Screen 3 — Precursor sources, a request to the producer

Show each relevant precursor as a card, separate from monthly consumption:

```text
Pig iron · CN 7201 [exact code pending]
Used by: EAF process                      Source: external
2026 use: 100 t from monthly use rows      Producer data: Awaiting response
[Send producer request] [Upload verification report] [Use official default]
```

**Exporter/final-good operator:** identifies the material and CN code, source if known, and amount actually used in each process/month. A trader exporter obtains actual-use amounts from the final-good operator. **External precursor producer:** supplies its producing installation/location, route, production period, applicable sector parameters, specific direct/indirect emissions and verification report. Send a scoped supplier link or export a request packet; never give the producer access to the buyer's other installation data. A reseller may forward the request, but the recorded producing site must be the real installation.

Offer two clearly labelled emissions bases: **Verified actual data** and **Applicable official default**. If eligible actual data is missing or the report does not cover the production period, guide the user to the applicable official default and preserve its source/version. The supplier intensity is associated with the **producer's reporting period**, not copied into twelve monthly boxes. Reuse it for monthly quantities that belong to that eligible source and period. Keep different producer sites/years separate for weighting.

## Screen 4 — Upload and review, from anywhere

Allow drag/drop of one PDF or a batch from the workspace header, a month card, a precursor card or Documents. Where the user starts gives a *suggested* target but does not lock it. Accept PDFs and images first; CSV/Excel imports are a later structured-data path. Save every file with an installation/year, uploader, checksum and status before extraction starts. A file that cannot be read stays available for manual entry.

### Document-to-field examples

| Document | Suggest, after reading | Do not assume |
|---|---|---|
| ERP output or production log | Product/CN where stated, process/route where identifiable, output quantity, unit, period | That dispatched/sold quantity equals production or that one file covers all goods |
| Fuel meter log | Fuel/stream, measured consumption, unit, interval and meter ID | That an invoice delivery equals fuel burned |
| Fuel invoice/delivery note | Delivered quantity, fuel, supplier and dates | Monthly consumption without a stock/usage balance |
| Electricity bill or meter log | Active electricity quantity, unit, source and covered dates | An actual generator factor or eligibility from a PPA alone |
| Precursor goods-received note | Material/CN, supplier, quantity **received**, date | Quantity **used** in production |
| Precursor producer's verified report | Producing installation, covered period, route, direct/indirect intensity and verifier details | That an unrelated seller produced it, or that actual data is eligible before coverage/scope checks |
| Calibration or laboratory report | Instrument/factor, effective period, value and unit | A new monthly quantity when the document only supports a standing method |

After extraction, show a **single review queue**. Group proposals by target month/process/source, including files covering several months. The user confirms the document type and covered interval first. For each proposed value show **document page/highlight → extracted value/unit → destination field/current value → action**. Actions: **Accept**, **Edit then accept**, **Reject**, **Keep as evidence only**. Show low confidence, missing units, interval mismatch, duplicate documents and conflicts with existing accepted values prominently. Never silently replace an accepted measurement. A single action may accept multiple *non-conflicting, fully visible* values; disputed or low-confidence values require individual review.

```text
gas-invoice-jan.pdf · page 2                 January · Fuel delivery
Found: 8,240 m³ natural gas                 Destination: Received gas
Current: 8,150 m³                           Conflict: figures differ
[View page] [Accept] [Edit] [Reject] [Evidence only]

This document shows delivery. Monthly fuel BURNED remains open.
```

Accepted values retain the original text, source page, unit conversion, target field, document/checksum, person and time of acceptance, and subsequent edits. If a document is deleted or superseded, show all dependent fields and require review before treating them as supported. Store files and extraction jobs in the application backend for production use. The current browser-only extraction path and local inline-file limit are not suitable as the only production evidence store.

### Special cases

- A bill spanning two calendar months is **not automatically split 50/50**. Ask for meter-period readings or an explicit allocation method before writing month values.
- A PDF with several products, processes, suppliers or years must create separate proposals, each with its own target; unresolved targets stay in the queue.
- A verified supplier report can support many monthly uses of that source but must be checked against the producer reporting period and verifier accreditation/scope before actual data is accepted.
- Scans with unreadable text fall back to manual entry with the file linked as evidence; extraction confidence never establishes legal eligibility by itself.
- The user can upload a document before a process or supplier exists. Keep it in an **Unassigned documents** queue and offer to create/link the missing record.

## Screen 5 — Review and reports

Use a checklist built from the selected goods, methods and actual flows. Show **Missing input**, **Missing/unclear evidence**, **Conflict**, **Needs operator confirmation**, **Ready for verifier** as distinct states, with a direct link to fix each issue. Show annual totals and OER/OSER previews calculated from accepted monthly data and standing supplier records. Do not ask users to type annual totals already derivable from their records.

The operator confirms applicable actual-value claims, benchmark/method selection and evidence submitted to the verifier. The independent verification report remains a separate verifier-supplied document. Show a declarant-specific addendum work area **only** for imported electricity using actual values; collect declarant EORI, attributable import quantity/intervals, applicable criteria evidence and assertions, then track its verifier handover separately.

## What the existing code can contribute

| Existing component | Use in this design | Change needed |
|---|---|---|
| [Shared month steps](/Users/kanamafu/Documents/ceatrace/certrace-portal/components/supplier/month-steps.tsx:852) | One form already shared by exporter/operator views | Reorganise into shorter applicable cards and add per-process/product/source rows. |
| [Monthly entry model](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/monthly-data.ts:531) | Production, fuels, process materials, electricity and status | Add installation/process/CN quantities and conditional flows; valid zero/no-activity handling. |
| [Precursor month field](/Users/kanamafu/Documents/ceatrace/certrace-portal/components/supplier/month-steps.tsx:1368) | Repeated precursor quantity and source list | Separate **received** from **used** and link use to the receiving process. |
| [Smart upload prototype](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/smart-intake.ts:1) | Batch upload, document classification, target suggestion and review UI | Its detection currently reads mock-PDF metadata or filenames; replace with real content extraction and structured targets. |
| [Evidence extraction](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/workspace-evidence.ts:1) | Real PDF/image proposal and explicit accept/edit/reject | Unify with Smart upload; current accepted-field writer handles only electricity consumption. Expand mappings and source-page provenance. |
| [Evidence store](/Users/kanamafu/Documents/ceatrace/certrace-portal/lib/workspace-evidence.ts:124) | Month/annual links and reviewed status | Production-grade file storage and shared annual installation ownership. |

### Build order

1. Define the annual installation/process/product/source records, with explicit role ownership and source periods.
2. Fix the monthly form's **precursor received versus used** field, zero/no-activity states and process-linked output rows.
3. Unify upload/review around one document queue; add real PDF extraction with page evidence and review before write.
4. Add conditional measurement forms and supplier requests; preserve official-default selection when supplier actual data is ineligible.
5. Connect readiness and OER/OSER/addendum previews to the same accepted data and evidence trail.

The [official regulation](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2547) sets the underlying monitoring/reporting requirements. The five-screen presentation, document queue and automation above are the proposed product design.

## Implemented in Verification

### Current input structure — newly collected fields

`(news)` means this Verification flow collects the field in addition to the previous form. It matches the red **New input** markers in the UI. It does not mean every field is required for every installation. Existing fields below have no marker. This is an inventory of the current input screens, not a claim that every field in the EU input inventory has been implemented.

```text
COMPANY
└── INSTALLATION A — Factory A
    ├── 1. Installation Profile
    │   └── Installation identity, address, location, contact, product and site details
    │
    └── 2. Reporting Period — 2026
        ├── 2.1 Production Structure — Setup (once per year, update when changed)
        │   ├── Actual operator legal name (news)
        │   ├── Operator registration number (news)
        │   ├── Operator address in English (news)
        │   ├── CBAM Registry installation ID, if assigned (news)
        │   └── Repeatable production process (news)
        │       ├── Process name (news)
        │       ├── Production route(s) / technology per process (news)
        │       ├── Ordered production steps (news)
        │       ├── Repeatable product: name, exact CN code, description,
        │       │   output unit and benchmark/method reference (news)
        │       ├── Relevant precursor source linked to the process (news)
        │       └── Other inputs / source streams linked to the process (news)
        │
        ├── 2.2 Monitoring Methodology — Setup
        │   ├── Existing methods, meters, boundaries, factors and diagram
        │   ├── Explicit no-combustion confirmation, where true (news)
        │   └── Applicable additional-flow selection (news): electricity
        │       generation/export, heat/CHP, waste gas, CO₂ transfer/storage,
        │       CEMS/N₂O or aluminium PFC
        │
        ├── 2.3 Installation Monitoring Data — Each month
        │   ├── Existing production total, fuel burned, process material
        │   │   and electricity readings
        │   ├── Per-process/product output quantity and route, shown when
        │   │   the setup contains multiple products (news)
        │   ├── Selected other-flow quantity, unit, process, counterparty
        │   │   and measurement/calculation reference (news)
        │   ├── No output / no fuel / no electricity confirmations (news)
        │   ├── Reason for zero output, when confirmed (news)
        │   └── Fuel quantity delivered, kept separate from fuel burned
        │       when an uploaded delivery record provides it (news)
        │
        ├── 2.4 Precursor Data and Emissions
        │   ├── Existing precursor source/producer details and emissions data
        │   └── Quantity actually used each month, including losses (news);
        │       older received quantities remain visible for confirmation
        │
        ├── 2.5 Supporting Evidence
        │   ├── Existing document uploads and evidence links
        │   └── Reviewed PDF extraction proposals with source page/excerpt,
        │       target field and accepted value (news)
        │
        ├── 2.6 Emissions Calculation and Validation
        │   ├── Existing calculated results
        │   └── Input-readiness checks for the added setup, monthly and
        │       precursor-use fields (news; no extra value to type)
        │
        └── 2.7 Reporting and Verification
            ├── OER, OSER and applicable addendum use the collected data
            └── Independent Verification Report comes from the verifier

INSTALLATION B — its own profile, periods and the same input pattern
```

#### Deleted or replaced prompts from the old input flow

`(deleted)` marks an old **prompt or assumption** removed from the new Verification collection path because it would ask for the wrong quantity or impose a universal requirement where the [regulation](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R2547) calls for the applicable activity. It does **not** mean that historical records are erased or that evidence can never be needed.

```text
2.2 Monitoring Methodology
└── “Choose at least one fuel” for every installation (deleted)
    → List fuels actually burned, or confirm no combustion.

2.3 Installation Monitoring Data — each month
├── “Production must be greater than zero” in every month (deleted)
│   → Confirm a genuine zero and give its reason when the site has no output.
├── “Electricity must be greater than zero” in every month (deleted)
│   → Confirm no electricity consumption when that is the true activity.
└── “Fuel delivered on an invoice = fuel burned” (deleted)
    → Preserve delivered quantity separately; enter or establish actual use.

2.4 Precursor Data and Emissions — each month
└── “Precursors received this month” as the required emissions quantity (deleted)
    → Enter precursor quantity actually used in the receiving process.
      Receipts and stock movements may still support the use calculation.
```

These are corrections to the *collection rule*, not a statement that fuel, electricity, production, receipts or stock evidence are never relevant. The old positive-quantity gates and mandatory fuel choice would make a true zero month appear incomplete. The old precursor field asked for receipts even though Annex II E and Annex III B use the quantity consumed; Annex IV 1.1(18)–(21) reports precursors used. Existing receipt values remain visible for confirmation instead of being converted silently. Method-dependent factors such as NCV remain applicable where the chosen calculation uses them, so they are **not** marked deleted.

The repeatable process/product rows supplement the existing product workspace. Their extra monthly output records are stored separately and are not yet part of the existing report calculation engine. The imported-electricity declarant addendum does not have a dedicated new input form in this implementation.

- Workspace cards now open input Readiness. Navigation exposes Setup, Monthly data, Precursor sources and Documents.
- Readiness offers upload in place, links to the next missing area, and shows monthly input progress. Completion here is input collection, not a verification opinion. Existing annual review/report controls remain collapsed below it.
- Setup stores operator identity, repeatable processes, routes, ordered steps, products/CN codes, precursor links and optional flows in the existing methodology draft. Installation identity continues using the shared installation record.
- Monthly entry collapses standing identity/methodology, supports explicit zero activity and additional process/product outputs and selected flow measurements. Extra process/flow records are input records; they do not extend the existing report calculation engine in this change.
- Precursor quantities now explicitly mean **used**. Older receipt quantities remain preserved and require confirmation instead of silently changing meaning.
- Smart upload reads **real PDF text locally** using PDF.js. Supported proposals: labelled production output, electricity consumed, natural gas/diesel consumption and deliveries. Units are checked; kg→t and kWh→MWh conversions are applied after review. Delivery quantities stay separate from combustion quantities.
- Proposals show page/excerpt and existing values. Ambiguous totals, multiple-month totals, mismatched periods, duplicate files, locked months, unsupported units, ambiguous source rows and unapproved overwrites do not fill fields. Scans/images and unrecognised layouts remain manual evidence.
- Pending reviews survive reloads. Originals are stored in IndexedDB, with evidence links and accepted-field provenance. This uses the application's existing browser-local storage model; it is not cloud backup or cross-device file storage.
- The installation/year redesign does not migrate the existing product workspace model. Extra process records belong to the current workspace's annual draft. Report generation and a full installation-year backend migration remain outside this implementation.

### Verification

- New unit coverage exercises actual-text extraction, period ambiguity, duplicate totals, units, overwrites, locked months, electricity source selection, deliveries vs consumption, zero production and selected flow completeness.
- Browser coverage uploads generated PDFs without mock metadata, restores a pending review after reload, confirms real store updates, checks overwrite protection and setup persistence, and checks mobile overflow.
