# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-11-12T23:11:19.380Z
> Files: 133 tracked | Anatomy hits: 0 | Misses: 0

## ../../Users/menum/.claude/projects/C--Certrace-certrace-portal8/memory/

- `subagent-model-haiku.md` (~173 tok)

## ../../Users/menum/AppData/Local/Temp/claude/5b6c8e673f2ed2c6/ab3fc333-5776-46d4-9e3a-b647a2368bec/scratchpad/

- `attr.mjs` — Attribute bundle characters to source files via source-map mappings (sourcesContent is absent). (~697 tok)

## ../../Users/menum/AppData/Local/Temp/claude/64d537baf603f96c/00828282-ea26-4a08-9dc4-4c94036a81c7/scratchpad/

- `convert_edit.py` — The workspace for this installation and year; null until an installation is chosen. (~3448 tok)

## ../../Users/menum/AppData/Local/Temp/claude/64d537baf603f96c/879cb07d-9f63-49e7-809e-764e92cc9918/scratchpad/

- `set-resend.sh` — Sets Resend email delivery for certrace-portal8 on sanso-vps. (~480 tok)

## ../../Users/menum/AppData/Local/Temp/claude/6da0b079e6e8af05/879cb07d-9f63-49e7-809e-764e92cc9918/scratchpad/

- `patch-next.cjs` — Declares fs (~194 tok)

## ../../Users/menum/AppData/Local/Temp/claude/6da0b079e6e8af05/879cb07d-9f63-49e7-809e-764e92cc9918/scratchpad/scripts/

- `inputs.py` (~314 tok)

## ./

- `.vercelignore` (~92 tok)
- `biome.json` (~408 tok)

## .claude/

- `launch.json` (~308 tok)

## .claude/worktrees/agent-a9f6167f9fc866974/certrace-backend/src/modules/auth/


## .claude/worktrees/agent-a9f6167f9fc866974/certrace-portal/e2e/


## certrace-backend/prisma/

- `schema.prisma` — Declares String (~7578 tok)

## certrace-backend/prisma/migrations/202611110005_item_links/

- `migration.sql` — SQL: tables: public (~152 tok)

## certrace-backend/prisma/migrations/202611120001_preverifications/

- `migration.sql` — SQL: tables: public (~293 tok)

## certrace-backend/prisma/migrations/202611120002_preverifications_indexes/

- `migration.sql` (~119 tok)

## certrace-backend/prisma/migrations/202611120003_preverifications_superseded/

- `migration.sql` (~74 tok)

## certrace-backend/scripts/

- `cera-probe.ts` — Manual probe: one real Cera turn against the configured provider. Prints the (~265 tok)

## certrace-backend/src/

- `app.ts` — API routes: GET (4 endpoints) (~1209 tok)

## certrace-backend/src/lib/

- `db.ts` — Exports db, Database (~84 tok)

## certrace-backend/src/modules/admin/

- `index.ts` — API routes: GET, PUT, POST (4 endpoints) (~2506 tok)

## certrace-backend/src/modules/cera/

- `actions.ts` — Cera proposes actions; the server never executes them. The portal shows each (~2568 tok)
- `context.ts` — Knowledge entries most related to the query that fit in maxChars; all of it when it fits. (~1144 tok)
- `provider.ts` — The configured provider when its key is present; undefined means chat falls back to rules. (~949 tok)
- `service.ts` — Exports ChatInput, chatConfigured, CeraTurn, generateTurn + 3 more (~1800 tok)

## certrace-backend/src/modules/links/

- `index.ts` — API routes: GET, PUT, POST (12 endpoints) (~2052 tok)
- `item-fields.ts` — `cell` is the installation workbook cell key (matches CELL_KEY in workbooks/model.ts). (~523 tok)
- `item-service.ts` — Maps submitted field keys to workbook cells. Only keys from this item's catalogue are accepted. (~989 tok)
- `model.ts` — Exports LinkModel (~392 tok)

## certrace-backend/src/modules/preverify/

- `checks.ts` — Keeps only real catalogue cells with text values. Stale or foreign keys never reach the checks, the (~1023 tok)
- `index.ts` — API routes: POST, GET (5 endpoints) (~579 tok)
- `review.ts` — One line per filled field: key, section · label, value. Stops at the character cap. (~1554 tok)
- `service.ts` — API routes: GET (1 endpoints) (~2342 tok)

## certrace-backend/src/modules/records/

- `service.ts` — Exports validateRecord, save (~896 tok)

## certrace-backend/src/modules/workbooks/

- `model.ts` — Exports CELL_KEY, MAX_BYTES, listParams, params + 2 more (~470 tok)

## certrace-backend/test/

- `cera-actions.test.ts` — Declares realKey (~1834 tok)
- `cera-provider.test.ts` — API routes: GET (1 endpoints) (~1293 tok)
- `installation-store.test.ts` — The site wizard saves the operator address in the parts the CBAM template asks for (A_InstData I38–I (~599 tok)
- `item-links.test.ts` — ItemField: mint (~2381 tok)
- `preverify-checks.test.ts` — Declares Finding (~1376 tok)

## certrace-portal/

- `middleware.ts` — The public site, whose /trace/preview the Trace page frames. (~1267 tok)
- `next.config.ts` — securityHeadersFromFile: output (~1300 tok)
- `package.json` — Node.js package manifest (~734 tok)

## certrace-portal/.claude/


## certrace-portal/.wolf/

- `anatomy.md` — anatomy.md (~1762 tok)
- `buglog.json` — Declares annotation (~11118 tok)
- `cerebrum.md` — Cerebrum (~888 tok)

## certrace-portal/app/(portal)/

- `loading.tsx` — PortalLoading (~377 tok)
- `template.tsx` — Template (~213 tok)

## certrace-portal/app/(portal)/carbon-cost/

- `page.tsx` — ALL (~3830 tok)

## certrace-portal/app/(portal)/convert/

- `page.tsx` — TABS (~2600 tok)

## certrace-portal/app/(portal)/convert/[id]/

- `page.tsx` — STATE (~4726 tok)

## certrace-portal/app/(portal)/convert/fill/[item]/

- `page.tsx` — CBAM answers always live on row 0 of the CBAM tab. (~2581 tok)

## certrace-portal/app/(portal)/dashboard/

- `page.tsx` — DashboardPage (~1728 tok)

## certrace-portal/app/(portal)/declarations/


## certrace-portal/app/(portal)/declarations/[id]/

- `page.tsx` — DeclarationDetailPage (~904 tok)

## certrace-portal/app/(portal)/declarations/[id]/activity/

- `page.tsx` — runtime (~15960 tok)

## certrace-portal/app/(portal)/declarations/[id]/mmd/

- `page.tsx` — periodFor (~7958 tok)

## certrace-portal/app/(portal)/supply-chain/

- `page.tsx` — SupplyChainPage (~1326 tok)

## certrace-portal/app/(portal)/trace/

- `page.tsx` — COUNTRY_OPTIONS (~7439 tok)

## certrace-portal/app/(portal)/workspace/

- `page.tsx` — WorkspacePage (~3327 tok)

## certrace-portal/app/(portal)/workspaces/installation/[iid]/readiness/

- `page.tsx` — STATE_TONE (~9384 tok)

## certrace-portal/app/admin/

- `page.tsx` — AdminPage — renders form, table, modal (~3650 tok)

## certrace-portal/app/admin/preverifications/

- `page.tsx` — STATUSES (~1591 tok)

## certrace-portal/app/admin/preverifications/[id]/

- `page.tsx` — NOTE_MAX — renders table (~2663 tok)

## certrace-portal/app/s/item/[token]/

- `page.tsx` — runtime — renders form (~1559 tok)

## certrace-portal/components/

- `motion.tsx` — Fades and lifts its children into place once, on mount. (~779 tok)
- `portal-shell.tsx` — Indented under a group heading (the Prove family). (~9404 tok)
- `require-session.tsx` — RequireSession (~1231 tok)
- `scoped-installation-switcher.tsx` — ADD (~602 tok)
- `ui.tsx` — cn (~14318 tok)

## certrace-portal/components/cera/

- `cera-button.tsx` — CeraButton (~291 tok)
- `cera-cards.tsx` — EarlierVersion (~11279 tok)
- `cera-missing.tsx` — How many missing items the panel lists before it says how many more there are. (~2136 tok)
- `cera-panel.tsx` — The name, in Inter at regular weight, sentence case — plain and modern, nothing shouting. (~5392 tok)
- `cera-provider.tsx` — Cera has the question and has not started answering (~16292 tok)

## certrace-portal/components/convert/

- `preverify-panel.tsx` — States from which the customer may send the workbook (again). (~3822 tok)

## certrace-portal/components/dashboard/


## certrace-portal/components/factory/

- `installation-directory.tsx` — PILL_TONE (~2195 tok)

## certrace-portal/components/home/


## certrace-portal/components/intake/

- `pdf-source-preview.tsx` — Use the same local renderer as extraction, including in browsers without a PDF plugin. (~1246 tok)
- `supplier-intake.tsx` — FIELD_LABEL (~4776 tok)

## certrace-portal/components/workspace/

- `cbam-tab.tsx` — ITEM_LABEL (~1355 tok)
- `import-file-panel.tsx` — How long the set-up animation plays after an upload before the panel shows the files. (~3379 tok)
- `spreadsheet.tsx` — Cells one paste may write; the server takes at most 2000 cells per patch (workbooks/model.ts). (~11018 tok)

## certrace-portal/lib/

- `ai-check.ts` — First numeric token in a free-text electricity factor ("0.399 tCO₂/MWh — grid OM"). (~5826 tok)
- `buyers.ts` — the importing company's name, as it appears on the invoice (~1206 tok)
- `compliance-intelligence.ts` — Stage 2 entry point. Reads Stage 1's facts + the submission rollup and (~2874 tok)
- `document-reading.ts` — Conservative extraction of labelled quantities from real PDF text. (~1898 tok)
- `exporter-review.ts` — true for the buyer named when the declaration was created (~10012 tok)
- `i18n-hi.ts` — Exports HI (~198736 tok)
- `i18n-server-stub.ts` — Exports TH_ALL, ZH, HI (~186 tok)
- `i18n-th-all.ts` — The whole Thai dictionary in one chunk, loaded by `loadLocale("th")` in lib/i18n.ts. (~282 tok)
- `i18n-th-cera-monitor.ts` — Thai rows for Cera's missing-data monitor: the badge count, the complete and blank states, and "Ask (~263 tok)
- `i18n-th-preverify.ts` — Exports TH_PREVERIFY (~582 tok)
- `i18n-zh.ts` — Exports ZH (~144597 tok)
- `i18n.ts` — EVERY SCREEN of the portal speaks four languages: English and Thai, Chinese and Hindi. Chinese and H (~8557 tok)
- `installations.ts` — 2(b) non-CBAM production processes carried out at the installation (~8914 tok)
- `pdf-loader-server-stub.ts` — Stand-in for lib/pdf-loader.ts on the server and edge builds only (next.config.ts). (~125 tok)
- `pdf-loader.ts` — Loads the packaged PDF.js module from /pdf.min.mjs at runtime. (~182 tok)
- `supplier-intake.ts` — Which requested document a detected subject answers. (~3226 tok)
- `supplier.ts` — the exporter produces these goods themselves — no Smart Link is ever sent, (~5842 tok)
- `trace-profile.ts` — CN codes of the verified products to list on the profile (~872 tok)
- `workspace-sheets.ts` — One uploaded file, as the year's meta records it. (~1990 tok)

## certrace-portal/lib/__tests__/

- `cera-monitor.test.ts` — Declares std (~2788 tok)
- `i18n-four-languages.test.ts` — Declares TH_ALL (~1089 tok)
- `i18n-lazy.test.ts` — The test loader preloads every dictionary; this proves loading is what makes translate() answer, and (~300 tok)
- `preverify-state.test.ts` — Declares PreverificationView (~1047 tok)
- `smart-link-payload.test.ts` — TOKEN: resolution (~1364 tok)

## certrace-portal/lib/api/

- `item-links.ts` — Repeated process or precursor block (see visibleBlocks). (~473 tok)

## certrace-portal/lib/cbam/

- `cbam-tab.ts` — The workbook tab's id, used as `?sheet=cbam`. Not a sheet of buildSheets, so it feeds no sheet statu (~761 tok)
- `data-gaps.ts` — ISO — the gap's own window inside the reporting period (~3493 tok)
- `installation-defaults.ts` — A_InstData answers the site wizard already collected, by CBAM field id. (~545 tok)
- `installation-profile.ts` — a key of Installation, or `monitoring.<key>` (~3310 tok)
- `reference.ts` — Above this share of total emissions, the data-gap register stops being a (~2476 tok)
- `template-fields.ts` — The Convert requirement ids (lib/convert/requirements.ts REQUIREMENT_SOURCES). (~5280 tok)

## certrace-portal/lib/cbam/__tests__/

- `cbam-tab.test.ts` — Declares CbamField (~1066 tok)
- `data-gaps-penalty.test.ts` — Declares other (~962 tok)
- `installation-defaults.test.ts` — Declares Installation (~892 tok)
- `template-fields.test.ts` — Declares ITEMS (~2181 tok)

## certrace-portal/lib/cera/

- `actions.ts` — bare CBAM field ids, e.g. "a-i9" (see CBAM_FIELDS); null clears the cell (~2627 tok)
- `ai-reply.ts` — Keep local actions and explicit refusals deterministic; ordinary questions can use chat. (~752 tok)
- `monitor.ts` — "field": one CBAM template cell. "requirement": a requirement with no CBAM cell of its own (carbon p (~1666 tok)
- `types.ts` — What a reading is in the form — the key that lets an edited value find its way back into the month. (~2130 tok)

## certrace-portal/lib/cera/__tests__/

- `actions.test.ts` — A deps object whose every call is recorded, so a test can prove what ran and what did not. (~2324 tok)

## certrace-portal/lib/convert/

- `fill-items.ts` — Column key of the sheet's rows (see buildSheets in lib/workspace-sheets.ts). (~830 tok)
- `requirements.ts` — Where each requirement's data lives, and the catalogue's default fix for it. (~1164 tok)
- `use-convert-context.ts` — CBAM answers of that year, with the installation record filling the unanswered cells. (~593 tok)

## certrace-portal/lib/convert/__tests__/

- `fill-items.test.ts` — Declares names (~728 tok)
- `requirements.test.ts` — Declares Installation (~1572 tok)

## certrace-portal/lib/notifications/


## certrace-portal/lib/workbook/

- `unassigned.ts` — Exports UNASSIGNED_WORKBOOK_ID (~100 tok)
- `use-workbook.ts` — A copy marks itself ready when done; the workspace timer only rescues one abandoned for this long. (~4629 tok)

## certrace-portal/lib/workbook/__tests__/

- `unassigned-workbook.test.ts` — Declares would (~255 tok)

## certrace-portal/scripts/

- `test-resolver.mjs` — First existing file for a base path, trying the extensions Next would. (~843 tok)
- `write-item-fields.ts` — The backend answers Smart Links from this copy of the portal catalogue, so a public (~378 tok)

## docs/


## docs/superpowers/plans/

- `2026-11-12-portal-polish-and-cera-connector.md` — Portal polish, speed and Cera connector Implementation Plan (~1537 tok)
- `2026-11-12-report-lock-precheck-archive.md` — Report Lock, Pre-check, Verifier Handoff and Archive Plan (~11612 tok)
- `2026-11-13-workspace-convert-redesign.md` — Workspace + Convert redesign — evidence list and plan (2026-11-13) (~1535 tok)

## docs/superpowers/specs/


## scripts/

- `test-migrations.ts` — Integration checks use only a uniquely named disposable Compose project. (~2708 tok)
- `test-verification-schema.ts` — All database work is confined to a new disposable container. No app DATABASE_URL is read. (~4949 tok)
