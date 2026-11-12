# Workspace + Convert redesign — evidence list and plan (2026-11-13)

Paths are relative to `certrace-portal/` unless they start with `certrace-backend/`.

## Evidence-backed change list

### Workspace
| # | Request | Evidence (current code) | Change |
|---|---|---|---|
| W1 | Factory icon per installation in dropdown | `components/scoped-installation-switcher.tsx:34-38` options carry no `icon`; `Select` renders `o.icon` (`components/controls.tsx:535`) | pass `icon: <Factory/>` per option |
| W2 | "Add installation" under the list | no add entry in switcher; add route is `/workspaces/new` (`components/installation-switcher.tsx:35`) | trailing option `__new__` with Plus icon, routes to `/workspaces/new` |
| W3 | Installation item in profile menu | `components/portal-shell.tsx:421-452` has Profile, Notifications, Billing; settings already parses `?tab=installation` (`app/(portal)/settings/page.tsx:120-130`) | add Link `/settings?tab=installation` with Factory icon |
| W4 | Remove "1 file" row and emissions card | `app/(portal)/workspace/page.tsx:243-261` meta row; `components/workspace/live-panel.tsx:310-425` estimate card | delete both |
| W5 | Convert icon on "Go to Convert" | `workspace/page.tsx` ConvertBar uses ArrowRight only; sidebar uses `ProductMark product="convert"` (`portal-shell.tsx:169-181,210-215`) | prepend `ProductMark convert` |
| W6 | Remove Factory view | `components/workspace/spreadsheet.tsx` toggle maps `table/flow/factory` | Table/Flow only; `?view=factory` falls back to table |
| W7 | Live check can't be hidden | `live-panel.tsx:145-161` collapse button + localStorage `certrace:live-panel` | remove header/collapse; keep Completeness + Mass balance |
| W8 | fx shows something for the selected cell | fx shows `selValue` only, empty cell = blank | empty cell shows muted `Row N · Column` |
| W9 | "Import file" top-right of side panel, upload-only | "Import from file" sits in formula bar, opens CSV `ImportWizard`; upload UI only in `upload-panel.tsx` with year/blank/copy | new `ImportFilePanel` at top of side panel: drop zone + descriptions, adds files to the ready year via new `ws.addFiles` (no wipe; `confirm` clears cells, `use-workbook.ts:167`) |
| W10 | Animated "setting up" state, no solid black | `setting-up.tsx:262-275` `fill/stroke="#111"`, `:221` `bg-[#111]` | swap to mid-grey tones; show stage after an Import file upload |
| W11 | Pending / Completed review status with 5-dot red→green scale | no review field anywhere (`lib/workspace-sheets.ts:17-23`, backend `workbooks/model.ts`) | optional `reviewedAt` on `WorkspaceFile`; Pending = 1 red dot, Completed = 5 green; nothing sets it yet (roadmap: admin review endpoint) |
| W12 | Friendlier table + search | search filters rows; no match count, no clear | match count + clear button, highlight matches |
| W13 | Full-page mode | sidebar collapse only in `portal-shell.tsx:605-676` (local state) | fullscreen toggle: sheet becomes fixed full-viewport overlay, Esc exits |
| W14 | Excel-like editing, no jump | cell click calls `gridRef.focus()` without `preventScroll`; CellEditor `autoFocus`; formula bar `flex-wrap` with variable save text; only arrows/Enter handled; double-click only | type-to-edit, F2, Enter/Tab move, Delete clears, Esc cancels, Ctrl+C/V, `preventScroll`, `scrollIntoView({block:"nearest"})`, fixed-height bar |
| W15 | Uniform tab dots, icon before text, "00A"→"00" | installation badge `h-4` after name; code at `lib/workspace-sheets.ts:93` | single `h-2 w-2` dot before code; installation code "00". Note: Documents is also "00" (`:100`) — labels now duplicate, flagged |

### Convert
| # | Request | Evidence | Change |
|---|---|---|---|
| C1 | Remove "More standards on the way" + "Own plant" | `app/(portal)/convert/page.tsx:184-188`, `:51`; `convert/[id]/page.tsx:74,194` | delete card; role chip hidden for own |
| C2 | "Report history" → Pre-verification | `convert/[id]/page.tsx:331-347` | section replaced by pre-verification panel |
| C3 | Remove Submit / Complete first; move under Export | `components/convert/preverify-panel.tsx:81-95,124`; `[id]/page.tsx:229-251` | submit lives in the Pre-verified menu next to Export |
| C4 | Pre-verified dropdown, quota 3, then top up | no quota anywhere (backend `preverify/index.ts` rateLimit only) | backend counts company submissions, `402 QUOTA_EXCEEDED` at 3; GET returns `used/quota`; menu shows "n of 3 left", Top up → `/billing` |
| C5 | Two Export buttons | one button `[id]/page.tsx:216-228` | "Export for verification" (xlsx) + "Pre-verified" menu |
| C6 | Fill in goes to Excel with colour-coded cells | href `/convert/fill/...` (`lib/convert/requirements.ts:98-101`); CBAM missing shown as grey text (`cbam-tab.tsx`) | href `/workspace?installation=…&sheet=cbam`; missing fields red-tinted, filled green |
| C7 | Smart Link only on form-entry rows | every row renders Smart Link (`[id]/page.tsx:474-481`) | render only when `r.fix === "smart-link"` |
| C8 | Remove "Complete first: …" list | `[id]/page.tsx:229-251` | delete |
| C9 | Status dots Complete / Under review / Reporting | `preverify-panel.tsx:23-41` 3 step chips | red=Ready, yellow=In progress, green=Completed, derived from readiness, `preverifyState`, approval |

## Assumptions
- Upload stays metadata-only (existing design: no file bytes are sent).
- The empty-year `UploadPanel` keeps its year/blank/copy options; only the new Import file section is upload-only.
- Quota counts every submission by the company for CBAM, across installations and years. Top-up is a link to Plan & billing; no payment flow exists.
- CSV `ImportWizard` stays reachable from the Import file section as "Map a CSV into this sheet".

## Roadmap after this change
1. Admin endpoint + console button to mark uploaded files reviewed (sets `reviewedAt`; backend schema must strip it from customer PUTs).
2. Real top-up purchase that raises the pre-verification quota (billing backend).
3. Store uploaded file bytes (object storage) so Certrace can review the actual file.
4. Resolve duplicate "00" sheet code (Documents vs Installation).
5. Virtualise the grid for sheets over ~2k rows.
