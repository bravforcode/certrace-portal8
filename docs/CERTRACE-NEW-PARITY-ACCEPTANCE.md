# Certrace frontend parity acceptance

Checked locally on 28 October 2026. The current portal implements the reference
screens and workflows over the current backend. Production deployment is separate.
`certrace-new/` remains unchanged: all 748 protected file hashes match.

## Scope and evidence

All 52 reference page patterns exist in the current portal: 43 render screens and
9 redirect. The screen inventory below includes desktop and phone captures in the
local comparison evidence. Legacy declaration pages are screens with conditional
navigation; onboarding and the Google callback are also screens, not redirects.

| Reference route | Checked behavior |
| --- | --- |
| `/billing` | Rendered comparison checked |
| `/carbon-cost` | Rendered comparison checked |
| `/dashboard` | Rendered comparison checked |
| `/declarations/[id]/activity` | Rendered comparison checked |
| `/declarations/[id]/evidence` | Rendered comparison checked |
| `/declarations/[id]/mmd` | Rendered comparison checked |
| `/declarations/[id]` | Rendered comparison checked |
| `/declarations/[id]/verification` | Rendered comparison checked |
| `/declarations` | Redirect checked |
| `/inbox` | Redirect checked |
| `/notifications` | Rendered comparison checked |
| `/regulations` | Rendered comparison checked |
| `/reports` | Rendered comparison checked |
| `/settings` | Rendered comparison checked |
| `/smart-links` | Rendered comparison checked |
| `/suppliers/[id]` | Rendered comparison checked |
| `/suppliers` | Rendered comparison checked |
| `/supply-chain` | Rendered comparison checked |
| `/team` | Rendered comparison checked |
| `/workspaces/[id]/carbon-price` | Rendered comparison checked |
| `/workspaces/[id]/evidence` | Redirect checked |
| `/workspaces/[id]/intake` | Redirect checked |
| `/workspaces/[id]/mmd` | Rendered comparison checked |
| `/workspaces/[id]/monthly/[month]` | Rendered comparison checked |
| `/workspaces/[id]/monthly` | Rendered comparison checked |
| `/workspaces/[id]/months/[month]` | Redirect checked |
| `/workspaces/[id]` | Rendered comparison checked |
| `/workspaces/[id]/precursors` | Rendered comparison checked |
| `/workspaces/[id]/readiness` | Redirect checked |
| `/workspaces/[id]/settings` | Rendered comparison checked |
| `/workspaces/[id]/tree/[nodeId]` | Redirect checked |
| `/workspaces/[id]/tree` | Redirect checked |
| `/workspaces/installation/[iid]` | Rendered comparison checked |
| `/workspaces/installation/[iid]/products` | Rendered comparison checked |
| `/workspaces/installation/[iid]/readiness` | Rendered comparison checked |
| `/workspaces/new` | Rendered comparison checked |
| `/workspaces` | Rendered comparison checked |
| `/auth/google` | Rendered comparison checked |
| `/forgot-password` | Rendered comparison checked |
| `/legal/privacy` | Rendered comparison checked |
| `/legal/terms` | Rendered comparison checked |
| `/login` | Rendered comparison checked |
| `/onboarding/done` | Rendered comparison checked |
| `/onboarding` | Rendered comparison checked |
| `/onboarding/setup` | Rendered comparison checked |
| `/p/[token]` | Rendered comparison checked |
| `/` | Redirect checked |
| `/register` | Rendered comparison checked |
| `/reset-password` | Rendered comparison checked |
| `/s/[token]` | Rendered comparison checked |
| `/self/[token]` | Rendered comparison checked |
| `/w/[token]` | Rendered comparison checked |

## Workflow checks

| Area | Evidence inspected |
| --- | --- |
| Account and onboarding | Sign-in/register presentation; stale legal-version retry; saved questionnaire resume; four setup steps; research answers, currency, preferences and trial preservation. |
| Verification | Installation and product-report creation; saved drafts; duplicate retry with one ID; archive/restore; methodology versions; monthly editing and evidence. |
| Supplier forms | Generic, monthly, precursor and self-supply forms; server acknowledgements, failed-save recovery, submission/revision and retained accepted history. |
| Internal precursors | Failed save/retry, one persisted row, quantity and source ownership retained after reload. |
| Reports | Readable PDF outputs and rendered comparison; original evidence bytes in the package; ZIP integrity; reference optional sign-off behavior. |
| Other reference screens | Supply Chain, notifications, Cera, Carbon & Cost, contacts, billing and settings; account-backed records and reference translations. |
| Routes | All eight retired reference routes use byte-identical redirect source; nine cases include both readiness branches. Production-build navigation passes, including the home route. Three retained installation aliases also pass. |

The latest checkpoint adds 28 matched public-form desktop/phone comparisons and
10 matched questionnaire/callback comparisons. The initial public-form save badge
now stays hidden until an edit is acknowledged, as in the reference. An actual
self-supply edit showed Saving then Saved, persisted, and was restored; the same
single response token was reused. The home route now sends an already-onboarded
account directly to the dashboard. Its login flow still uses the reference setup.

## Data and reference differences

The reference uses demo/browser data. The current portal uses saved server data:
real contact counts, current profile names, original trial dates, published legal
versions/content and saved questionnaire answers are retained. Existing custom
questionnaire answers remain selectable instead of being discarded. These are
deliberate data-preservation differences, not added product features.

Comparison adapters exist only in the disposable reference copy: synthetic account
records, backend calendar dates converted to date-only inputs, and an owned
self-supply declaration/response passed into the existing supplier form. Its local
missing-token path supplies the intended Invalid screen; the original reference's
missing-server-token path renders blank, while the current portal reports Invalid.
The original reference view/form code was not edited in the repository.

## Verification

- Frontend: 926 tests passed; zero failed, skipped or cancelled.
- Workspace TypeScript and generated catalogue: passed; 21 contracts, 65 sections.
- Lint: zero errors, 76 existing warnings; changed route files also pass lint.
- Final production build: passed; its 646 application source files match the
  working tree. Browser routing checks ran on this build against the disposable DB.
- Last backend/migration rehearsal: 44 tests passed, 668 assertions. It checks
  migration atomicity, user/credential/consent/onboarding-history preservation,
  the 37-model schema, all 15 reference contracts, isolation and immutable history.
  No backend, schema or test source changed after that passing rehearsal.
- Independent account reads confirm existing exporter records remain unchanged
  apart from the explicitly exercised synthetic row; questionnaire and setup
  checks preserve prior profile fields, research answers, preferences and trial.
- Reference protection: 748 hashes unchanged; no deployment or production writes.

Local evidence is under `/private/tmp/ceatrace-*`: `public-comparison.json`,
`final-flows-comparison.json`, `redirect-results.json`,
`compatibility-evidence.json`, `questionnaire-saved.json`,
`generic-preservation.log`, and the `visual-parity/` screenshots. Runtime fixtures
are disposable synthetic accounts, not copies of production user records.

## Limits of this sign-off

These checks verify the local port and backend integration. Live Google OAuth,
external email delivery and a production rollout were not exercised. The existing
Playwright CLI suite was not run; the rendered workflow evidence comes from local
CUA-driven browser journeys. The legacy production-journey script still assumes
bearer credentials in localStorage and is not evidence for cookie authentication.
Production backup contents and recovery on the user's host were not inspected.
