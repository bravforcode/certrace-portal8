# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: —

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

<!-- Project-specific conventions discovered during development. -->
- [2026-11-12] Workspace with no installation stores its year under workbook id `_unassigned` (lib/workbook/unassigned.ts). Lower case + underscore, so normaliseReference (upper case A-Z0-9-) can never produce it.
- [2026-11-13] Annex I 2026–2028 columns already include the markup (total × 1.10/1.20/1.30; fertilisers × 1.01). Use them as published.

- [2026-11-13] Pre-verification quota is 3 per installation and year (PREVERIFY_QUOTA in certrace-backend preverify/checks.ts); submit returns 402 QUOTA_EXCEEDED before the AI review runs.
- [2026-11-13] /workspaces/new is switched off (next.config redirects it to /workspace). Installations are added under /settings?tab=organisation (OwnInstallationCard).
- [2026-11-13] Readiness % counts only finished requirements. For "started" state use each requirement's `state` (complete / in-progress / missing), not the %.
- [2026-11-13] Backend tests: `~/.bun/bin/bun.exe test <files>` (bun is not on PATH).

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->
- [2026-11-12] `npm run test:unit` fails on Windows cmd.exe ("'NODE_ENV' is not recognized"). Run the same command text from bash (the Bash tool) instead.
- [2026-11-12] Unit suite once failed with one ERR_ASSERTION (test name not captured) in 1 of 4 runs; the other 3 runs passed 1333/1333. Re-run and read the ✖ line before claiming a pass.
- [2026-11-12] Vercel project `certrace-portal8` has Root Directory "." and Framework Other, but the Next app is in `certrace-portal/`. `vercel deploy --prebuilt` from repo root fails "no prebuilt output found in .vercel/output"; from `certrace-portal/` it fails "File does not exist: certrace-portal\node_modules\next". Fix project settings first; do not retry deploys.
- [2026-11-12] On `next start` 15.5.28, middleware skips the nonce policy for `Purpose: prefetch` but NOT for `Next-Router-Prefetch` (App Router prefetch). Test a header on the running server before claiming a prefetch is skipped.
- [2026-11-13] CBAM report year comes from the declaration (`periodFor(decl)` in activity/page.tsx), never `new Date()`. Data Gap markup uses that year.
- [2026-11-13] Edge validator rejected middleware: the `/pdf.min.mjs` dynamic import sat in shared `__vc__ns__` chunks that middleware loads. Fix: `lib/pdf-loader.ts` with server stub (next.config.ts). Edge bundles inline dynamic imports, so lazy loading does not shrink edge size. `vercel build` EBUSY on `.vercel/output/functions` when the shell cwd is inside it; cd out first.
- [2026-11-13] Never multiply a published default (already incl. markup) by (1+markup). `engine.defaultExposure` multiplies, so the penalty passes markup 0. Indirect counts toward chargeable only for Cement and Fertilisers (`chargeablePerTonne`), not for every sector.

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
- [2026-11-13] Vercel Hobby edge limit is 1 MB gzipped (remote reported mmd 1.2 MB). Chose Node runtime for 3 pages: declarations/[id], declarations/[id]/mmd, workspaces/installation/[iid]/readiness (user approved). Trade-off: next-on-pages (Cloudflare path) needs edge for dynamic pages, so those 3 pages break that path.
- [2026-11-13] Data Gap penalty prices the exporter's own CN (products from its self-supplied request), using the Annex I row for `decl.origin` and the reporting year. Shows no EUR figure when there are 0 or more than 1 own CN, or no Annex I row. Production is not split per CN, so several CNs cannot be priced. No new external sourcing: Annex I coverage is complete (cov.mjs: 120 country keys; ZZ has 260 CN keys; all catalogue CNs covered).
