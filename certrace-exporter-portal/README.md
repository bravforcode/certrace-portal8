# Certrace Exporter Portal (final)

The current build of the exporter-side portal. It lives in its own directory
rather than on top of `certrace-portal/`, so the older tree's CI job, deploy
and test setup keep working untouched.

## Relationship to `certrace-portal/`

This tree descends from a separate line of work and has diverged
substantially from `certrace-portal/`: 217 files are new, 72 have the same
path in both (61 of those differ in content), and 43 files that exist in
`certrace-portal/` are absent here.

Nothing in this directory imports any of those 43 files. They are the older
lineage (`lib/mrv/*`, `lib/fx.ts`, `lib/financial-liability.ts`,
`lib/calc-api.ts`, `lib/plant-mrv.ts`, `lib/o3ci-worksheet.ts` and their
tests), plus build/test config. This portal replaces that functionality with
its own workspace/readiness/MMD engine under `lib/`.

Both portals are still in the repository and will drift apart. Deciding which
one takes over — and removing the other — is still open.

## Build, deploy and CI

The build now matches the rest of the monorepo:

- `build-pages` uses **OpenNext** (`@opennextjs/cloudflare`, pinned to the
  version `certrace-portal/` builds with), not the older
  `@cloudflare/next-on-pages`. `open-next.config.ts` and `.npmrc` are carried
  over from there. The four token routes no longer export
  `runtime = "edge"` — that was a next-on-pages requirement and OpenNext
  rejects it.
- `wrangler.jsonc` deploys as **`certrace-exporter-portal`**. It used to
  carry `certracept`, the same worker name `certrace-portal/` deploys to, so
  a deploy from here would have overwritten production.
- `.github/workflows/ci.yml` has an `exporter-portal` job running lint,
  typecheck, unit tests, the dependency audit, `next build` and the OpenNext
  artifact build on every push and pull request.

## Running locally

```bash
npm install
npm run dev
```

## Checks

All of these pass from a clean `npm ci`:

- `npm run lint` — ESLint (`next/core-web-vitals`, `next/typescript`).
  Errors block. ~55 warnings remain (unused bindings, `exhaustive-deps`);
  once they are cleared, tighten the script to `eslint . --max-warnings=0`
  as `certrace-portal/` does.
- `npm run typecheck` — `tsc --noEmit`, clean.
- `npm run test:unit` (or `npm test`) — 418 unit tests via the Node test
  runner.
- `npm run build` — Next.js production build.
- `npm run build-pages` — OpenNext Cloudflare worker in `.open-next/`.

There is no e2e suite here yet; `certrace-portal/` keeps the Playwright
readiness-demo tests.
