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

**Those counts are stale.** The two trees have since converged: as of the
password-reset work, only a handful of files exist in one and not the other,
and most of the paths that "differ in content" differ only in line endings.
What genuinely differs is the build and deploy setup (OpenNext here,
`next-on-pages` there) and the files that follow from it — `next.config.ts`,
`public/_headers`, `wrangler.jsonc`, `package.json`. Recount before quoting
the numbers above.

### Kept identical on purpose

These are byte-for-byte copies of `certrace-portal/`, and a change to either
copy should be made to both until one portal is retired:

- `lib/api/` — the client layer for `docs/API-CONTRACT.md`
- `lib/password-reset.ts`, `app/forgot-password/`, `app/reset-password/`
- `lib/__tests__/api-client.test.ts`

`middleware.ts` is the deliberate exception. Both add the backend's origin to
`connect-src` from `NEXT_PUBLIC_API_BASE_URL`, but only the comment explaining
where else the policy has to be repeated differs — there, a prerendered page
is served off Cloudflare's asset layer and needs the same origin written into
`public/_headers` by a build script; here, every document is Worker-rendered,
so this file is the only place it is needed.

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
