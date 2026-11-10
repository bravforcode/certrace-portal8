# MEASUR user flow, and what Certrace takes from it

Date: 2026-11-11. Source: MEASUR UI repository `ORNL-AMO/AMO-Tools-Desktop`
(Angular, `src/app`). This was read from source code. It is checked in
part against runtime captures (see "Runtime-observed"). `ORNL-AMO/MEASUR-Tools-Suite` is only the C++ calculation library.
Certrace does not use its energy formulas.

## What MEASUR does (observed in source)

### 1. Dashboard as a directory

- Routes: `landing-screen` and `directory-dashboard/:id`.
- Components: `dashboard/directory-dashboard/*`.
- A folder holds three kinds of item, each shown as a summary card:
  - assessments
  - diagrams
  - inventories (motor, pump, compressed air)
- Folder actions: create folder, copy, move, delete. Each folder also has
  contact info.
- A pre-assessment item gives a quick estimate before the full assessment.

### 2. One assessment uses one shell with fixed main tabs

`water/water-banner`:

- The banner shows the assessment name and "Last modified".
- Main tabs: **Baseline**, **Assessment**, **Diagram**, **Report**,
  **Calculators**.
- **Assessment is disabled until the baseline is valid** (`'disabled':
  !isBaselineValid`).
- A Share action emails the assessment data.

### 3. Baseline setup follows the physical flow, one numbered step per stage

`water-banner/setup-tabs`:

1. Assessment Settings
2. Water Intake
3. Water Discharge
4. Water Treatment
5. Water Using System
6. Wastewater

Each step has a status badge with a tooltip that explains what is missing.
Steps can be disabled until earlier steps are usable (`disabledSetupTabs`).
Sub-forms inside a step have their own tabs, for example "Intake Data | Added
Energy".

### 4. Live results beside the form

`water/results-panel`:

- system balance table
- component table
- monthly flow chart
- in-system treatment table

The numbers update while the user types. A help panel explains the focused
field (`treasure-hunt/help-panel`).

### 5. Two-way sync between diagram and data

`water-process-diagram/water-diagram-sync.service.ts`,
`update-diagram-from-assessment.service.ts`,
`water/update-assessment-from-diagram.service.ts`:

- When the diagram is saved, the assessment's components, flows and settings
  are rewritten from it.
- When the assessment is edited, diagram nodes are refreshed and the diagram
  is marked stale, so it re-mounts the next time its tab opens.
- When the assessment opens, nodes are added for any component the diagram
  lacks, so both sides start from the same components. Only changes are
  written.
- Writes run one at a time in the order requested. A sync that depends on a
  failed write is skipped, so neither side is rebuilt from data that never
  saved.

### 6. Treasure Hunt turns findings into opportunities

`treasure-hunt` tabs:

1. **Facility Basics**: assessment basics, energy usage and cost.
2. **Find Treasure**: calculators create opportunity cards.
3. **Treasure Chest**: the opportunity cards, with filter, summary card and
   import/export.
4. **Report**:
   - executive summary
   - opportunity summary
   - payback
   - graphs
   - PowerPoint export

### 7. Report Rollup combines many assessments

- Route: `report-rollup`.
- You pick several assessments and get combined summary tables, bar and pie
  charts, and an energy table.

### 8. Data Explorer imports logged data

`log-tool`, in step order:

1. Import data (CSV/Excel)
2. Select the header row
3. Refine data
4. Map date and time

Day Type Analysis and Visualization are separate tabs after setup (runtime-confirmed).

### 9. Inventories

Equipment registers (motors, pumps, compressed air): a table of equipment
records per department. This is separate from assessments.

## Runtime-observed (REA, measur.ornl.gov v1.10.0, 2026-11-11)

These are REA `capture_browser_scenario` accessibility captures of the live app (headless Chromium). They confirm the source reading except where noted below.

- Data is stored only in the browser. A privacy notice says so on every page.
- The directory dashboard (`/directory-dashboard/2`, Examples) shows:
  - Toolbar: Add Assessment, Add Pre-Assessment, Add Folder, Add Inventory and Add Diagram.
  - Bulk actions, disabled until something is selected: Move, Copy, Generate Report, Export, Import and Delete.
  - A folder info panel: company, contacts, facility, date and address.
  - A folder **Summary** table: count, annual energy and cost per assessment type, plus a Total row.
  - Folder settings: units and costs.
  - Item cards: baseline values, modification count and max savings, "Last updated", and links (Baseline, Assessment or Treasure Chest, Report, Quick Report).
- Data Exploration (`/log-tool`) differs from the source reading:
  - It redirects to `/log-tool/data-setup/import-data`.
  - **Setup has four steps**: 1 Import Data, 2 Select Header Row, 3 Refine Data, 4 Map Date and Time.
  - Day Type Analysis and Visualization are separate top tabs after setup; they are not setup steps.
  - Step 1 imports .csv or .xlsx. It also offers Import Existing and Load Example Data.
  - The footer has Reset Data and **Next, which stays disabled until data is loaded**.
- Not captured: clicks on dashboard cards timed out (15–30 s), so the assessment shell, setup badges and the results panel rest on the source reading only.

Plan changes from this:
- Task 17: Next stays disabled until a file is read; added "Start over"; completed steps are clickable.
- Task 23: added a summary line for all installations.

## Mapping to Certrace (scope confirmed with the user, 2026-11-11)

| MEASUR | Certrace |
| --- | --- |
| Directory dashboard with folders | Installations are the folders. Each shows its workbook years, flow diagram and factory profile as cards. |
| Baseline steps in physical-flow order with status badges | Workspace sheets ordered as the material flow: Installation, Products, Process steps, Materials and precursors, Energy and fuels, Outputs and waste, Transport, Evidence. Tab colour is the badge; the tooltip lists the missing cells. |
| Assessment tab disabled until baseline valid | Convert shows "complete the baseline first" per requirement; the export stays gated. |
| Live results panel | Side panel in Workspace: completeness by sheet and a mass-balance check (inputs vs outputs), plus an embedded-emissions preview. |
| Two-way diagram sync | Flow diagram generated from the workbook; adding a node or edge in the diagram writes rows through an ordered save queue (plan Task 16). |
| Treasure Hunt opportunities | Data-gap and reduction opportunities as cards, with a summary card and a printable report (plan Task 25). |
| (no MEASUR equivalent) | Factory map and CBAM cost what-if on the dashboard (plan Tasks 23, 24). |
| Report Rollup | Dashboard and reports aggregate across installations (D8). |
| Data Explorer import | Import an existing Excel/CSV into a workbook sheet with column mapping. |
| Inventories | Factory profile: processes, emission sources and equipment, and meters/data sources per installation. No energy calculations. |
