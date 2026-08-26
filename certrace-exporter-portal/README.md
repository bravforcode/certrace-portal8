# Certrace Exporter Portal (final)

The current build of the exporter-side portal. It is added here as its own
directory rather than on top of `certrace-portal/` so that nothing already
wired up — CI, the OpenNext/Cloudflare deploy, the existing test setup —
changes when this lands.

## Relationship to `certrace-portal/`

This tree descends from a separate line of work and has diverged
substantially from `certrace-portal/`: 216 files are new, 72 have the same
path in both, and 43 files that exist in `certrace-portal/` are absent here.

Nothing in this directory imports any of those 43 files. They are the older
lineage (`lib/mrv/*`, `lib/fx.ts`, `lib/financial-liability.ts`,
`lib/calc-api.ts`, `lib/plant-mrv.ts`, `lib/o3ci-worksheet.ts` and their
tests), plus build/test config. This portal replaces that functionality with
its own workspace/readiness/MMD engine under `lib/`.

## Adopting this as the portal

Two things need doing before this can take over from `certrace-portal/`, and
they are deliberately left for whoever picks it up:

1. **Build and deploy.** `package.json` here still uses the older
   `@cloudflare/next-on-pages` (`npm run build-pages`). The monorepo moved to
   OpenNext in #25. Carry over `open-next.config.ts` and `.npmrc` from
   `certrace-portal/` and switch the scripts across.
2. **CI script names.** `.github/workflows/ci.yml` runs `lint`, `typecheck`,
   `test:unit`, `build-pages` and `test:e2e` inside `certrace-portal/`. This
   tree has `test` (Node's test runner) but no `typecheck`, `test:unit` or
   `test:e2e`, and no ESLint/Vitest/Playwright config. Either add those
   scripts and configs, or point CI at the runner used here.

Until then CI continues to check `certrace-portal/` only, and this directory
is not built or deployed by any pipeline.

## Running locally

```bash
npm install
npm run dev
```

## Checks

- `npm test` — 418 unit tests via the Node test runner, all passing.
- `npx tsc --noEmit` — two pre-existing errors, both in
  `lib/__tests__/electricity-sources.test.ts` (test fixtures cast to
  `MonthlyEntry`). Application code typechecks clean. Left as-is so this
  directory is a faithful snapshot of the current build.
