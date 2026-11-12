# Handoff: certrace-portal8 production work

Date: 2026-11-11
Branch: `feat/portal8-production` (129 commits ahead of `main`; not merged, not pushed, not deployed)

## Goal

Make `certrace-portal8` production-real: a real backend and DB, the old portal's login, approval, trial and email lifecycle, the Excel-style workspace, team access and smart links, flow diagram, OEM fill-in, factory profile and dashboard. The scope is in the docs below.

- Plan: `docs/superpowers/plans/2026-11-10-portal8-production-plan.md` (Tasks 1–26)
- Design decisions: `docs/superpowers/specs/2026-11-10-portal8-production-design.md` (D1–D21)
- MEASUR reference: `docs/MEASUR-FLOW-REFERENCE.md`
- Structure overview: `PROJECT.md`

## Status by plan task

All tasks are merged into `feat/portal8-production` except where noted.

| Task | Feature | Status |
|---|---|---|
| 1 | Local stack, fail-closed production config, SMTP delivery | Done |
| 2 | Remove master password login | Done |
| 3 | Approval flow, trial starts at approval, lifecycle email | Done |
| 4 | Admin reject, extend trial, first-admin script | Done |
| 5 | Trial enforced on the server | Done |
| 6 | Trial reminder email job | Code done; **not scheduled (no cron yet)** |
| 7 | Password reset and password-changed email, pending page polling | Done |
| 8 | Cookie consent recorded on the server | Done |
| 9 | Legal update notice | Done |
| 10 | Onboarding validation, new company and factory fields | Done |
| 11 | `workbooks` table and API (shared, per-cell merge) | Done |
| 12 | Sheet status (tab colours) | Done |
| 13 | Workspace on the server workbook | Done |
| 14 | Installation tab | Done |
| 15 | Production flow diagram | Done |
| 16 | Two-way flow diagram | Done |
| 17 | Import Excel/CSV into a sheet | Done |
| 18 | Live panel (completeness, mass balance, emissions estimate) | Done |
| 19 | Installation switch only on Workspace and Convert | Done |
| 20 | OEM installations and live Convert requirements | Done |
| 21 | Team member first, Smart Link for outside suppliers | Done |
| 22 | Factory profile per installation | Done |
| 23 | Installation directory and factory map on dashboard | Done |
| 24 | CBAM cost what-if | Done |
| 25 | Opportunities list and report | Done |
| 26 | E2E flows, docs, final checks | Docs done; **E2E spec not merged** (user said to stop running e2e) |

Extra work after the plan, also merged:

- Verified-only `.xlsx` export, scope "Both". It holds only verifier-relevant fields and only rows that passed their check. Other rows are listed by name and reason, without values. Files: `lib/xlsx-write.ts`, `lib/export/verifier-scope.ts`, `lib/export/verification-export.ts`.
- Compact cookie banner.
- Review fixes: backend and portal.
- Copy timer is 10 minutes (`COPY_MS`).
- Register hashes the password outside the DB transaction (fixed a P2028 500).

## Verification so far

- Portal unit tests: 1259 pass. `tsc` clean (ignoring TS2882).
- Backend: lifecycle and register-hash tests pass (40). Typecheck OK.
- Production build (`next build --no-lint`) succeeds after deleting `.next`.
- Browser check: login, then navigation across Dashboard, Workspace, Workspaces, Convert, Smart links, Billing and Settings works (about 100 ms per page on the production server).
- **Not done:** a manual click-through of every feature in the browser.

## Open items (next steps, in order)

1. Click through every feature in the browser and fix what breaks. Priorities:
   - register → pending → approve → trial
   - workspace edit, sync between two accounts, and tab colours
   - Installation tab
   - flow diagram edits
   - import
   - Convert and the verified export
   - team invite and smart-link form
   - dashboard factory map and what-if
   - opportunities
2. Schedule the trial reminder job (Task 6) daily: a cron on the host, or the deploy platform's scheduler.
3. Configure real SMTP credentials. No mail leaves the local machine now.
4. Decide on the e2e branch `worktree-agent-a9f6167f9fc866974`. Its spec `certrace-portal/e2e/production-flows.spec.ts` had 10 of 12 tests failing, mostly from dev-server ChunkLoadError and Jest worker crashes. Run it against the production server (`next start`), not dev.
5. Merge `feat/portal8-production` into `main`, push and deploy. **This needs the user's approval.**
6. Cleanup:
   - leftover agent worktrees under `.claude/worktrees/`
   - the docker container `certrace-task1-pg` (confirm first)

## Running locally

Postgres runs in docker as `certrace-task1-pg`. URL: `postgresql://certrace:certrace-local@127.0.0.1:55432/certrace`

Backend (Bun at `C:/Users/menum/.bun/bin/bun.exe`), from `certrace-backend`:

```bash
DATABASE_URL=postgresql://certrace:certrace-local@127.0.0.1:55432/certrace \
CERTRACE_JWT_SECRET=<random 32-byte hex> \
CERTRACE_APP_BASE_URL=http://localhost:3000 \
COOKIE_SECURE=false \
CERTRACE_FILE_STORAGE=database \
bun src/index.ts
```

- `CERTRACE_FILE_STORAGE` must be `database` or `r2`; `local` is rejected.
- A new JWT secret invalidates old sessions, so log in again.

Portal, from `certrace-portal`. Use the production build; the dev server compiles each page for about 20 s on first visit, so tab clicks look dead.

```bash
rm -rf .next
BACKEND_INTERNAL_URL=http://127.0.0.1:8000 node_modules/.bin/next.exe build --no-lint
BACKEND_INTERNAL_URL=http://127.0.0.1:8000 node_modules/.bin/next.exe start -p 3000
```

Without `BACKEND_INTERNAL_URL`, the `/backend/*` rewrite goes to `http://backend:8000`. Locally that fails with ENOTFOUND, and the page hangs on "Loading your account…".

A stale `.next` from the dev server makes the build fail with `Invariant: no direct app page entry found for /billing`. Delete `.next` first.

Demo admin account: `demo-admin@certrace.test`. The password is in the session scratchpad file `demo-account.md`; do not paste it into chat or commit it.

## Tests

- Portal, from `certrace-portal`:
  `NODE_ENV=test node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/test-resolver.mjs --test "lib/**/__tests__/**/*.test.ts"`
- Portal types: `npx tsc --noEmit -p . | grep 'error TS' | grep -v TS2882`
- Backend: `bun test --timeout 90000 <files>`. Do not run `test/api.test.ts`.

## Rules and gotchas

- Commits: one line with a prefix, no co-author line (AGENTS.md rule 13). Never commit `.wolf/`.
- Merges: `timeout 60 git merge --no-ff ...`. After a merge, check for duplicate i18n keys and duplicate JSX attributes (TS17001).
- `git cherry-pick --abort` also undoes earlier picks in the same sequence.
- Use the Haiku model for subagents.
- A CN not in the goods table (for example 7208 flat steel) stays "unknown" in the export. This is deliberate; there is a test for it.
- Do not reapply the rejected `globals.css` / `layout.tsx` / `ui.tsx` diff.
- The user wants replies in Thai and terse.
