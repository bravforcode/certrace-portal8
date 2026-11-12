# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-11-12T23:11:19.507Z
> Files: 84 tracked | Anatomy hits: 0 | Misses: 0

## ../


## ../../../Users/menum/.claude/projects/C--Certrace-certrace-portal8/memory/

- `subagent-model-haiku.md` (~173 tok)

## ../../../Users/menum/AppData/Local/Temp/claude/64d537baf603f96c/00828282-ea26-4a08-9dc4-4c94036a81c7/scratchpad/

- `convert_edit.py` — The workspace for this installation and year; null until an installation is chosen. (~3448 tok)

## ../../../Users/menum/AppData/Local/Temp/claude/6da0b079e6e8af05/879cb07d-9f63-49e7-809e-764e92cc9918/scratchpad/


## ../../../Users/menum/AppData/Local/Temp/claude/d0c497b39a60213e/65bb5318-25de-48ef-bd08-ed090f233055/scratchpad/


## ../certrace-backend/prisma/

- `schema.prisma` — Declares String (~7106 tok)

## ../certrace-backend/prisma/migrations/202611110005_item_links/

- `migration.sql` — SQL: tables: public (~152 tok)

## ../certrace-backend/src/

- `app.ts` — API routes: GET (4 endpoints) (~1174 tok)

## ../certrace-backend/src/modules/cera/

- `actions.ts` — Cera proposes actions; the server never executes them. The portal shows each (~2269 tok)

## ../certrace-backend/src/modules/links/

- `index.ts` — API routes: GET, PUT, POST (12 endpoints) (~2052 tok)
- `item-fields.ts` — `cell` is the installation workbook cell key (matches CELL_KEY in workbooks/model.ts). (~344 tok)
- `item-service.ts` — Maps submitted field keys to workbook cells. Only keys from this item's catalogue are accepted. (~974 tok)
- `model.ts` — Exports LinkModel (~392 tok)

## ../certrace-backend/src/modules/workbooks/

- `model.ts` — Exports CELL_KEY, MAX_BYTES, listParams, params + 2 more (~470 tok)

## ../certrace-backend/test/

- `installation-store.test.ts` — The site wizard saves the operator address in the parts the CBAM template asks for (A_InstData I38–I (~599 tok)
- `item-links.test.ts` — FIELDS_A: mint (~1753 tok)

## ../docs/superpowers/plans/

- `2026-11-12-portal-polish-and-cera-connector.md` — Portal polish, speed and Cera connector Implementation Plan (~1537 tok)
- `2026-11-13-workspace-convert-redesign.md` — Workspace + Convert redesign — evidence list and plan (2026-11-13) (~1535 tok)

## ./

- `middleware.ts` — The public site, whose /trace/preview the Trace page frames. (~1267 tok)
- `next.config.ts` — securityHeadersFromFile: output (~1300 tok)

## .claude/


## app/(portal)/

- `loading.tsx` — PortalLoading (~377 tok)
- `template.tsx` — Template (~213 tok)

## app/(portal)/carbon-cost/

- `page.tsx` — ALL (~3830 tok)

## app/(portal)/convert/

- `page.tsx` — TABS (~2600 tok)

## app/(portal)/convert/[id]/

- `page.tsx` — STATE (~4662 tok)

## app/(portal)/convert/fill/[item]/

- `page.tsx` — CBAM answers always live on row 0 of the CBAM tab. (~2534 tok)

## app/(portal)/dashboard/

- `page.tsx` — DashboardPage (~1728 tok)

## app/(portal)/declarations/


## app/(portal)/declarations/[id]/activity/

- `page.tsx` — runtime (~15960 tok)

## app/(portal)/supply-chain/

- `page.tsx` — SupplyChainPage (~1326 tok)

## app/(portal)/trace/

- `page.tsx` — COUNTRY_OPTIONS (~7439 tok)

## app/(portal)/workspace/

- `page.tsx` — WorkspacePage (~3327 tok)

## app/s/item/[token]/

- `page.tsx` — runtime — renders form (~1486 tok)

## components/

- `motion.tsx` — Fades and lifts its children into place once, on mount. (~779 tok)
- `portal-shell.tsx` — Indented under a group heading (the Prove family). (~9404 tok)
- `require-session.tsx` — RequireSession (~1231 tok)
- `scoped-installation-switcher.tsx` — ADD (~602 tok)
- `ui.tsx` — cn (~14318 tok)

## components/cera/

- `cera-cards.tsx` — EarlierVersion (~11279 tok)
- `cera-provider.tsx` — Cera has the question and has not started answering (~16292 tok)

## components/convert/

- `preverify-panel.tsx` — States from which the customer may send the workbook (again). (~3822 tok)

## components/dashboard/


## components/factory/

- `installation-directory.tsx` — PILL_TONE (~2195 tok)

## components/home/


## components/intake/

- `pdf-source-preview.tsx` — Use the same local renderer as extraction, including in browsers without a PDF plugin. (~1246 tok)
- `supplier-intake.tsx` — FIELD_LABEL (~4776 tok)

## components/workspace/

- `cbam-tab.tsx` — ITEM_LABEL (~1355 tok)
- `import-file-panel.tsx` — How long the set-up animation plays after an upload before the panel shows the files. (~3379 tok)
- `spreadsheet.tsx` — Cells one paste may write; the server takes at most 2000 cells per patch (workbooks/model.ts). (~11018 tok)

## lib/

- `ai-check.ts` — First numeric token in a free-text electricity factor ("0.399 tCO₂/MWh — grid OM"). (~5826 tok)
- `buyers.ts` — the importing company's name, as it appears on the invoice (~1206 tok)
- `compliance-intelligence.ts` — Stage 2 entry point. Reads Stage 1's facts + the submission rollup and (~2874 tok)
- `document-reading.ts` — Conservative extraction of labelled quantities from real PDF text. (~1898 tok)
- `exporter-review.ts` — true for the buyer named when the declaration was created (~10012 tok)
- `i18n-server-stub.ts` — Exports TH_ALL, ZH, HI (~186 tok)
- `i18n-th-all.ts` — The whole Thai dictionary in one chunk, loaded by `loadLocale("th")` in lib/i18n.ts. (~239 tok)
- `i18n.ts` — EVERY SCREEN of the portal speaks four languages: English and Thai, Chinese and Hindi. Chinese and H (~8557 tok)
- `installations.ts` — 2(b) non-CBAM production processes carried out at the installation (~8914 tok)
- `pdf-loader-server-stub.ts` — Stand-in for lib/pdf-loader.ts on the server and edge builds only (next.config.ts). (~125 tok)
- `pdf-loader.ts` — Loads the packaged PDF.js module from /pdf.min.mjs at runtime. (~182 tok)
- `supplier-intake.ts` — Which requested document a detected subject answers. (~3226 tok)
- `supplier.ts` — the exporter produces these goods themselves — no Smart Link is ever sent, (~5842 tok)
- `trace-profile.ts` — CN codes of the verified products to list on the profile (~872 tok)
- `workspace-sheets.ts` — One uploaded file, as the year's meta records it. (~1990 tok)

## lib/__tests__/

- `i18n-lazy.test.ts` — The test loader preloads every dictionary; this proves loading is what makes translate() answer, and (~300 tok)
- `smart-link-payload.test.ts` — TOKEN: resolution (~1364 tok)

## lib/api/

- `item-links.ts` — Exports ItemLinkField, ItemLinkResolution, createItemLink, resolveItemLink, submitItemLink (~402 tok)

## lib/cbam/

- `cbam-tab.ts` — The workbook tab's id, used as `?sheet=cbam`. Not a sheet of buildSheets, so it feeds no sheet statu (~673 tok)
- `data-gaps.ts` — ISO — the gap's own window inside the reporting period (~3493 tok)
- `installation-defaults.ts` — A_InstData answers the site wizard already collected, by CBAM field id. (~545 tok)
- `installation-profile.ts` — a key of Installation, or `monitoring.<key>` (~3310 tok)
- `reference.ts` — Above this share of total emissions, the data-gap register stops being a (~2476 tok)
- `template-fields.ts` — The Convert requirement ids (lib/convert/requirements.ts REQUIREMENT_SOURCES). (~4301 tok)

## lib/cbam/__tests__/

- `cbam-tab.test.ts` — Declares CbamField (~1066 tok)
- `data-gaps-penalty.test.ts` — Declares other (~962 tok)
- `installation-defaults.test.ts` — Declares Installation (~892 tok)
- `template-fields.test.ts` — Declares ITEMS (~645 tok)

## lib/cera/

- `actions.ts` — bare CBAM field ids, e.g. "a-i9" (see CBAM_FIELDS); null clears the cell (~2627 tok)
- `ai-reply.ts` — Keep local actions and explicit refusals deterministic; ordinary questions can use chat. (~752 tok)
- `types.ts` — What a reading is in the form — the key that lets an edited value find its way back into the month. (~2130 tok)

## lib/cera/__tests__/

- `actions.test.ts` — A deps object whose every call is recorded, so a test can prove what ran and what did not. (~2324 tok)

## lib/convert/

- `fill-items.ts` — Column key of the sheet's rows (see buildSheets in lib/workspace-sheets.ts). (~768 tok)
- `requirements.ts` — Where each requirement's data lives, and the catalogue's default fix for it. (~1164 tok)
- `use-convert-context.ts` — CBAM answers of that year, with the installation record filling the unanswered cells. (~454 tok)

## lib/convert/__tests__/

- `fill-items.test.ts` — Declares names (~728 tok)
- `requirements.test.ts` — Declares Installation (~1572 tok)

## lib/notifications/


## lib/workbook/

- `unassigned.ts` — Exports UNASSIGNED_WORKBOOK_ID (~100 tok)
- `use-workbook.ts` — A copy marks itself ready when done; the workspace timer only rescues one abandoned for this long. (~4629 tok)

## scripts/

- `test-resolver.mjs` — First existing file for a base path, trying the extensions Next would. (~843 tok)
- `write-item-fields.ts` — The backend answers Smart Links from this copy of the portal catalogue, so a public (~349 tok)
