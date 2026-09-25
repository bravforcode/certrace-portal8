# Certrace

CBAM reporting for Thai steel and aluminum exporters and their suppliers.

## What's where

| Path | What it is | Runs on |
| --- | --- | --- |
| `landingpage/certrace-landing/` | Public landing site (Next.js via OpenNext) | Cloudflare Workers |
| `certrace-portal/` | Customer + supplier portal (Next.js) | Cloudflare Workers |
| `certrace-backend/` | FastAPI API and calculation engine | Render (`api.certrace.co`) |
| `apps-script/` | Google Apps Script that writes landing form leads to Sheets | Google Apps Script |
| `docs/` | API contract and golden test fixtures | — |
| `archive/business/` | Cost models, outreach lists and one-off outreach scripts. Not part of any build. | — |
| `.github/workflows/` | CI, deploy, reminders, production header check | GitHub Actions |

More detail: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md),
[SYSTEM_SPECIFICATIONS.md](SYSTEM_SPECIFICATIONS.md), [TESTING.md](TESTING.md),
[PROJECT_STATUS.md](PROJECT_STATUS.md).
