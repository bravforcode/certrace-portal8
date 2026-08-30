# Preparing for Verification — build notes

Built from `Certrace_Verification_Workspace_Spec-1.docx` (Part 2, prompts A1–A8),
on top of the Part 1 `lib/cbam/` engine rather than beside it.

## The organising idea

Everything hangs off a **VerificationWorkspace** — one per
(installation × product category × reporting year). "Billets · Plant A · 2026"
is one workspace. Seven tabs: Overview, MMD, Monthly Data, Precursors,
Shipments, Evidence, Readiness.

A **declaration** is what gets FILED. A **workspace** is what gets VERIFIED.
One workspace can feed several declarations (`declarationIds`).

## What was added

| Module | Prompt | What it owns |
|---|---|---|
| `lib/workspace.ts` | A1 | The workspace type, its store, production routes, installations, grouping |
| `lib/monthly-data.ts` | A2 | `MonthlyEntry`, `FuelEntry`, CRUD, `monthsForWorkspace`, `annualProductionFor`, month validation, copy-from-previous |
| `lib/workspace-see.ts` | A2/A6 | Formulas **M1–M10**, and the `formula → substitution → result` workings |
| `lib/monthly-requests.ts` | A3 | Per-month Smart Link series, `createMonthlySeries`, `seriesStatus`, the supplier × month grid |
| `lib/workspace-evidence.ts` | A4 | `EvidenceItem`, `ExtractionResult`, AI extraction, coverage (per month and per year) |
| `lib/workspace-mmd.ts` | A5 | The one-page MMD, the Siam Steel worked example, finalise/version |
| `lib/precursor-suppliers.ts` | A6 | Nested precursor suppliers, `effectiveSee`, `weakestOrigin`, `defaultValueShare` |
| `lib/carbon-price.ts` | §2.6 | Carbon price as a **claimed** deduction, never auto-applied |
| `lib/readiness.ts` | A8 | `TabReadiness`, `workspaceReadiness`, materiality self-check |
| `lib/verifier-pack.ts` | A8 | The print-optimised handover document |

Routes under `app/(portal)/workspaces/`, components under `components/workspace/`.
Nav entry "Verification" sits directly below Declarations.

## Load-bearing invariants (don't undo these)

1. **`P_annual = Σ(MonthlyEntry.production)`.** There is no setter and no field
   to type an annual total into. `setAnnualProductionQuantity` exists only as a
   deprecated no-op so older imports keep resolving.
2. **A missing month makes the annual figure incomplete, not smaller.**
   `annualProductionFor` returns `complete` and `missingMonths` alongside the
   tonnage; a caller that reads only `tonnes` is the bug that shape prevents.
3. **Aggregate numerator and denominator separately, divide once.**
   `indicativeMonthlySEE` exists for trend display only and is labelled as such
   everywhere it renders.
4. **NCV is required whenever the fuel unit is not GJ.** It blocks submission.
   Stored in MJ/unit (§2.2), converted once in `fuelGJ`, then handed to Part 1's
   `toGJ`, which owns the refusal to substitute a value.
5. **Scrap forces SEE to 0 at any depth** — enforced in `saveSupplier`, at the
   store layer, so no screen or import can write a non-zero figure onto it.
6. **The Annex II sector rule stays in one map** (`INDIRECT_CHARGEABLE` in
   `lib/cbam/engine.ts`). `workspace-see.ts` reads it; there is still no
   `if (steel)` anywhere.
7. **AI extraction proposes, never writes.** Accept / Edit / Reject per field;
   below 0.8 confidence renders as `needs_review`; an unreviewed extraction does
   not count toward evidence coverage.
8. **Carbon price is a CLAIMED deduction.** Recorded with its instrument and
   evidence, carried into the pack, never subtracted from a liability figure.
9. **Nothing auto-assigns.** Unassigned shipments are candidates with a bulk
   action — overlapping workspaces would otherwise silently absorb each other's
   rows.
10. **A green tab means a verifier would find nothing missing.** `percentComplete`
    is display-only and never a gate.

## Deviations from the spec, and why

| Spec says | Built | Why |
|---|---|---|
| `lib/evidence.ts`, `lib/mmd.ts` at top level | `lib/workspace-evidence.ts`, `lib/workspace-mmd.ts` | Part 1's equivalents live in `lib/cbam/` at declaration scope and still serve filings with no workspace. These are the workspace-scoped layer; the QA vocabulary is imported from `lib/cbam/mmd.ts` rather than re-declared. |
| Fuel units `m3 \| kg \| t \| GJ` | plus `l` (litres) | §2.2 lists diesel and fuel oil as fuels this screen must accept, and both are invoiced in litres in Thailand. Dropping the unit would push a conversion outside the portal — the invisible assumption `lib/cbam/units.ts` exists to prevent. |
| `/workspaces/[id]/months/[month]` | `/monthly/[month]`, with `/months/[month]` redirecting | Tabs are nested routes so readiness deep links are real addresses. The spec's literal path resolves rather than 404s. |
| "Every field carries a Show example toggle" | One toggle per MMD card | The example text is written per section (boundary, period, measurement…), so one toggle covers that card's fields with the sample it belongs to. |
| A1: six tabs render "not built yet" | All seven built | A1–A8 were run in sequence; the placeholders were transient. |
| A1 acceptance: a new workspace shows "all seven dots grey/amber" | MMD's dot is **red** | The spec contradicts itself here. §4's per-tab table is normative and says MMD is *blocked* when no final MMD exists; A1's acceptance line was written for the stage where the MMD tab was still a placeholder. §4 wins — a verifier genuinely cannot start without an approved methodology, so amber would understate it. |

## Open questions the spec flagged, and where they landed

- **Carbon price treatment.** Recorded as *claimed*, never auto-applied
  (`CARBON_PRICE_CLAIMED_NOTE`). This is the commercial position the spec asked
  to confirm — it is one constant to change if the position moves.
- **AI extraction is client-side with the file as base64.** Off until a key is
  entered; the key lives in `localStorage` on that device only and is never
  bundled or committed. The Evidence tab states plainly that a backend proxy is
  the production answer. `next.config.ts` stubs `node:fs`/`node:path` out of the
  client bundle — the SDK's on-disk credential path is unreachable in a browser.
- **Fiscal-year reporters.** `monthsOf()` is Jan–Dec, as §6 assumes. It reads
  from `year` so it cannot drift from `periodStart`/`periodEnd`.
- **localStorage quota.** `saveEvidence` retries without the bytes rather than
  losing the record, and tells the caller. This is the forcing function for a
  real backend, exactly as §6 predicted.

## Tests

`npm test` — 65 tests. `lib/__tests__/monthly.test.ts` pins the worked example
end to end through the real stores (an in-memory `localStorage`), including:

- M2 → 471.2 GJ, 26.43 tCO₂; M1 → 10,500 t; M4 → 0.0345; M6 → 0.2250
- M7 → 1.02 t/t; M8 → 0.0734; M9 → 0.3329; M10 → 0.1079; shipment 45.2 t → 4.877
- A6: billet ← pig iron gives `effectiveSee` 1.615 and contribution 1.6473
- A6: a cycle raises; scrap contributes 0; default_value breaches the 20% cap
- A2: removing an NCV blocks submission; a missing month is incomplete not smaller;
  copy-from-previous clones setup but not quantities
- A8: the pack renders M4 as `(317.2 + 45.0) tCO₂ / 10,500 t = 0.0345 tCO₂e/t`,
  and deleting March turns monthly amber and stamps the pack DRAFT

---

# Revision — 2026-08-12

Two changes: a review pass over the verification tab (29 items), and a
structural move putting the workspace underneath the declaration.

## The declaration is now a hierarchy

`Buyer → annual report → verification workspace`, in
`lib/declaration-reports.ts` + `components/declaration-hierarchy.tsx`.

A declaration **fans out into one report per supplier × product**. Three
suppliers making two products each is six reports, six methodologies, six sets
of twelve months. That was previously invisible, and it is the fact that
governs the whole year's work, so it is now the shape of the screen.

`/declarations/[id]` opens on **Reports** (the dispatch board: who owes what,
one button to chase them) with the full five-step flow behind a
**Review & filing** tab. The old workflow is untouched — it is simply no longer
the first thing an exporter sees in January, when "step 1 of 5: classification"
is the wrong question.

Three rules the model enforces:

- **Workspaces are created lazily.** Opening a report creates it. Eager
  creation would orphan a workspace on every edit to the request spec.
- **A workspace is matched on `installation × product × year`, not on a stored
  id**, so a second declaration drawing on the same installation REUSES the
  first one's readings instead of opening an empty duplicate beside it.
- **Not every supplier gets a report.** Scrap merchants and electricity
  utilities supply *inputs*, not CBAM goods. They render as
  `not_applicable` with the reason, and are excluded from every count —
  otherwise a declaration sits permanently short of 100% waiting on twelve
  months of production data a scrap merchant was never asked for.

Legacy declarations that predate the wizard's supplier × product grid fall back
to resolving each supplier's free-text `material` against the catalogue. An
unresolvable one renders as a row offering the catalogue picker rather than
vanishing — a supplier who is on the declaration and absent from the list looks
forgotten.

## Who fills this in, and when

`lib/responsibility.ts`, rendered by `ResponsibilityBar` on every workspace tab
and as a legend on the declaration.

Seven identical-looking tabs were seven tabs an exporter treated identically,
and they are not:

| Tab | Owner | Cadence |
|---|---|---|
| MMD | Supplier | Once a year |
| Monthly data | Supplier | Every month |
| Precursors | Supplier | Every month |
| Shipments | **You** | Every shipment |
| Evidence (annual scope) | **You** | Once a year |

Monthly data is *twelve chases, not one*. Shipments is the only thing that
waits on nobody. Stating that on the tab is what turns the workspace from a
form into a schedule.

## Evidence moved to where the figure is

Per-month evidence now lives **inside the month**, and precursor tonnages now
live inside the month too. The Evidence tab keeps only the annual scope —
installation identity, calibration records, carbon-price receipt — plus a map
of per-month coverage that links into each month.

Nobody attaches a March gas bill from a list of twelve months in December. They
attach it while looking at March's gas reading. `MonthEvidence` in
`components/workspace/evidence-panel.tsx` is the shared block.

## The 29 verification-tab fixes

Grouped by what actually caused them.

**Data that was there but unreachable**
- The catalogue always held all 67 CBAM goods; the picker sliced it to 12 and
  said nothing, so it read as incomplete. `searchCatalog` now returns every
  match and the picker prints `Showing N of 67`, filters by sector / product
  type / sub-group, and each row is a tick carrying the CN code and a
  product-type tag.
- `aggregatedGoodsCategory()` derives the EU's Annex II grouping from the CN
  code rather than being typed 67 times.

**Inputs that fought the operator**
- `NumberInput` keeps the raw string. The old spelling
  (`value={x || ""}` + `Number(e.target.value)`) turned `0.` into `0` into `""`
  and emptied the field mid-decimal. `max` is a real clamp (percentages cannot
  exceed 100). Units render *below/inside* the field, locked — production is
  tonnes, full stop.
- Select and DatePicker triggers now use the input's own padding, so mixed rows
  line up.
- Option hints WRAP instead of truncating. A cut-off explanation teaches the
  reader that there was something to know and not what it was.
- No sample numbers in inputs. A greyed `875` is indistinguishable at a glance
  from an entered 875; examples moved into hints, in words.

**Closed lists that had no escape, and free text that had no list**
- `SelectWithOther` — standard code plus a described Other. Fuel types went
  from 8 to 25, named to IPCC 2006 families with typical NCV ranges as *hints*
  (never auto-filled: `toGJ` still refuses to guess). Electricity source became
  the EU template's four categories in the names a Thai exporter uses
  (MEA / PEA / EGAT / IEAT / direct line / PPA / own generation by technology).
  Reading frequency became a list.

**Semantics that were wrong, not just ugly**
- *Processes excluded* was a second multi-select that read as a bin. An
  excluded process is a **declaration with a ground** — each one now carries a
  reason from the standard's own list plus the detail behind it, and an
  exclusion with an empty note is flagged before finalising. This is the most
  common first-engagement finding.
- *Processes included* is now **ordered** — the sequence material moves through
  the boundary. `OrderedMultiSelect`; the verifier pack renders it numbered.
- Un-ticking "this is scrap" left a literal `0` in the SEE field, which then
  read as a measured figure. `setScrap()` clears it back to `null`.
- Precursor product ↔ CN code were two free-text boxes that could disagree.
  Picking either locks the other from the catalogue; typing both is still
  allowed but unlocked.
- Year type removed — §6 already treats fiscal-year reporters as unsupported,
  so the control changed nothing downstream.

**Things that lost work**
- Everything autosaves (`useAutoSave` + `AutoSaveBadge`). A year of readings
  entered by whoever is at the plant that week is not a form somebody completes
  in one sitting, and "Save draft" in that setting is a way to lose an
  afternoon.
- The precursor tree wrote to the store and rebuilt itself on *every keystroke*.
  Each row now edits a local draft; only shape changes rebuild the tree. This
  is what made typing feel like it was fighting back.
- A `scroll` event from inside a popover no longer re-anchors it
  (`useAnchoredStyle`), and popovers get `overscroll-behavior: contain`. The
  200-row country list was unusable without this.

**Navigation**
- Month picking is twelve cards, not a table whose only affordance was a 14px
  arrow. The current month is ringed. The table survives below, for the
  different job of reading a year.
- Submit reports through the button (`SaveButton` state machine, same as
  settings), not a toast in the corner, then returns to the month list.
- The workspace header pins at `top-16` — **below** the shell's own
  `sticky top-0` header — and compacts on scroll. Pinning it to `top-0` parks
  it underneath, which is worse than not pinning at all.
- Creating a workspace is a dialog, not a route.
- Reporting-period dates use the design-system `DatePicker`, clamped so the
  picker cannot leave the reporting year, with a `?` explaining that a
  mid-year process change means a *second* report rather than a stretched one.

## Migration

`migrateMmd()` upgrades drafts and **finalised versions** written before the
boundary section became ordered-plus-justified. Finalised versions are migrated
on READ — the stored snapshot is never edited, because that is the point of
stamping it.

## Fixed in passing

`sourceTypeForKey` used `"production_log" as EvidenceSourceType` — a cast to a
member that does not exist. It type-checked and rendered an empty chip, because
the label lookup had no such key. It is `meter_log`.
