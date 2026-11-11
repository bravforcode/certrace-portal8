# Portal polish, speed and Cera connector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the CBAM leftovers, return Fill in to the regulation page, redesign the dashboard Sites card, make tab switching fast, add motion, and let Cera propose confirmed edits to the account's data.

**Architecture:** Four work packages with disjoint files run in parallel. A (CBAM) changes the field catalogue's display layer and the Convert readiness, never the stored values. B (speed) removes redundant polling, adds a route loading state and lazy-loads the non-English dictionaries. C (motion) adds the `motion` package, a page transition and the Sites card redesign. D (Cera) adds a tool-call contract to `/api/v1/cera/chat`: the model proposes actions, the portal shows a confirm card and runs the action through the existing client APIs with the user's own session.

**Tech Stack:** Next 15.5 (edge pages, webpack dev), React 19, TanStack Query, Tailwind, bun workspaces, Elysia backend, `ai` v7 with `@ai-sdk/deepseek`.

**Spec:** the user's request of 2026-11-12 (session transcript); no separate spec file.

## Global Constraints

- Stored CBAM values stay exactly as the EU template validation stores them (`"1"`/`"0"`, `"Calcined clays "`); only labels change.
- Dynamic pages keep `export const runtime = "edge"` (Cloudflare next-on-pages).
- Never commit `.wolf/`. No co-author line in commits. Do not commit unless the user asks.
- Do not start Docker or a database. Never print `certrace-backend/.env` secrets or the demo password.
- Portal unit tests: `NODE_ENV=test node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/test-resolver.mjs --test "lib/**/__tests__/**/*.test.ts"` in `certrace-portal`.
- Portal types: `npx tsc --noEmit -p . | grep 'error TS' | grep -v TS2882` must print nothing new.
- Backend tests: `bun test --timeout 60000 <files>` in `certrace-backend`; never run `test/api.test.ts`.
- Motion respects `prefers-reduced-motion`. Animations are 120–250 ms.
- Cera never writes without an explicit user confirm, and only through the allowlisted actions.

---

### Package A: CBAM leftovers and Fill in return (controller, inline)

**Files:** `lib/cbam/template-fields.ts`, `lib/cbam/installation-defaults.ts` (new), `lib/cbam/cbam-tab.ts`, `components/workspace/cbam-tab.tsx`, `lib/convert/fill-items.ts`, `lib/convert/requirements.ts`, `app/(portal)/convert/fill/[item]/page.tsx`, `app/(portal)/convert/[id]/page.tsx`, `app/(portal)/convert/page.tsx`, `app/(portal)/workspace/page.tsx`, `next.config.ts`, tests under `lib/cbam/__tests__/` and `lib/convert/__tests__/`.

- [ ] Option labels: `CbamField.optionLabels?: Record<string,string>`; TrueFalse shows Yes/No, the goods list shows trimmed names. Fill form and CBAM tab render the label; stored value unchanged. Test: `cbamOptionLabel`.
- [ ] Installation defaults: `installationCbamCells(installation)` maps the Installation record to `cbam:0:a-i19…a-i41`; `withInstallationDefaults(cells, installation)` fills only empty cells. Used by the CBAM tab, the Fill form (prefill) and readiness. Test: record fills empty cells and never overwrites an answer.
- [ ] Readiness counts CBAM: `liveRequirements` ctx gains `cells`; a requirement's progress is the CBAM field progress when the item has fields, and complete only when every required CBAM field is filled. Test: legacy sheets complete but CBAM empty is not complete.
- [ ] Fill in return: requirement `href` carries `from=<standard id>`; the Fill back link and a "Back to <standard>" button after save go to `/convert/<from>?installation=…`. Unknown `from` falls back to `/convert`. Test: href contains `from=eu-cbam`.
- [ ] `/workspaces` (no index page, 404) redirects to `/workspace` in `next.config.ts`.
- [ ] D/E sheets: only process 1 and precursor 1 are mapped; more rows need the template file, which is not in the repo. Reported as remaining.

### Package B: speed (subagent)

**Files:** `app/(portal)/loading.tsx` (new), `app/(portal)/dashboard/page.tsx` (query options only), `app/(portal)/carbon-cost/page.tsx`, `app/(portal)/supply-chain/page.tsx`, `lib/i18n.ts` (+ new loader), `components/require-session.tsx`.

- [ ] Route loading skeleton for the portal group.
- [ ] Drop `refetchInterval: 5000` / `staleTime: 0` / `refetchOnMount: "always"` where `useStoreSync` already refetches.
- [ ] Non-English dictionaries load with `import()` when chosen; English renders until loaded.
- [ ] Session check runs once, not per pathname, unless the stored session changed.

### Package C: motion and Sites card (subagent)

**Files:** `certrace-portal/package.json`, `bun.lock`, `app/(portal)/template.tsx` (new), `components/motion.tsx` (new), `components/factory/installation-directory.tsx`.

- [ ] Add `motion`; `components/motion.tsx` exports `FadeIn`, `Stagger`, `PressScale` honouring reduced motion.
- [ ] Page transition fade/slide 160 ms in `template.tsx`.
- [ ] Sites card redesign: clear hierarchy (name, location line, role chip, year progress bar, actions row).

### Package D: Cera connector (subagent)

**Files:** backend `src/modules/cera/{service,index,actions}.ts`, `test/cera-actions.test.ts`; portal `lib/cera/actions.ts` (new), `lib/cera/ai-reply.ts`, `lib/cera/types.ts`, `components/cera/cera-cards.tsx`, `components/cera/cera-provider.tsx`, `lib/cera/__tests__/actions.test.ts`.

- [ ] Backend: AI SDK tools without `execute` (`set_workbook_cells`, `update_installation`, `request_upload`, `open_page`), validated schemas; response `{mode:"ai", text, actions}`; prompt no longer says "You cannot edit data".
- [ ] Portal: `parseCeraActions` drops anything outside the allowlist; an ActionCard lists each change (old → new) with Confirm / Discard; Confirm runs `patchWorkbookCells`, `saveInstallation`, the existing upload picker, or `router.push`.
- [ ] Tests: schema rejects unknown tools and non-allowlisted cell keys; confirm applies, discard writes nothing.
