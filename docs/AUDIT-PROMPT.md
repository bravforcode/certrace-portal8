# Full customer-facing audit prompt (UX/UI + system)

Paste everything below the line into a fresh Claude Code session at the repo root.
Optional skills to install first (see bottom).

---

You are a senior product auditor (UX research, UI design, accessibility, frontend
performance, security and backend reliability). Audit **everything a customer can
touch** in the Certrace portal (`certrace-portal/`), end to end, and produce an
evidence-backed, prioritized report. **Audit only: do not change code** unless I
say so after the report.

## 0. Ground rules

- Read `AGENTS.md`, `PROJECT.md`, `.wolf/OPENWOLF.md`, `.wolf/anatomy.md`,
  `.wolf/cerebrum.md`, `.wolf/buglog.json` and `docs/EU-CBAM-SOURCES.md` first.
- Code, `package.json`, `prisma/schema.prisma` and tests are authoritative; `plan/`
  and `docs/` may be stale.
- Every finding needs evidence: `file:line`, a screenshot, a console/network log
  or a reproduction step. No evidence, no finding. Mark guesses as
  `UNVERIFIED`.
- Test in the real app (dev server via `.claude/launch.json` and the browser
  pane). Create your own local test account from seed or fixture data. Never ask
  me for passwords. Never test against production data.
- Test **both languages (TH and EN)**, **light and dark**, at **375px, 768px,
  1280px and 1920px**, keyboard-only, and with a slow 3G network plus CPU 4x
  throttle.
- Use subagents (model haiku) for broad parallel sweeps; keep judgment calls in
  the main session.

## 1. Inventory first (before judging anything)

Build a table of every customer surface:

| Route / screen | Role(s) | Purpose | Entry points | Key actions | Data written |

Include: marketing/landing, sign-up, login, password reset, email verification,
onboarding, dashboard, workspace (spreadsheet, flow view, CN catalogue picker,
installations tab, TGO CFP map sheets), file upload/import (XLSX), export and
download, reports (CBAM declarations, emissions, carbon footprint), settings,
team/invites, billing (if any), notifications, emails, help/docs, 404/500 and
maintenance pages, and every API route the UI calls. Also list every role and
permission level.

## 2. Core user journeys (walk each one, time it, count steps)

For each: goal, steps, clicks, time, errors hit, where a first-time user would
get stuck, and a pass/fail.

1. New customer: discover, sign up, verify, first login, onboarding.
2. Create a workbook/installation and enter production + emissions data.
3. Pick CN codes from the catalogue (search, keyboard, wrong code, no match).
4. Import an existing XLSX (valid, malformed, huge, wrong template, duplicate).
5. Build and edit the material/energy flow; check balance and estimates.
6. Review, fix validation errors, reach "complete" status.
7. Export / download the report a customer would submit to the EU or importer.
8. Invite a teammate, change roles, remove access.
9. Return after a week: find previous work, resume a half-done workbook.
10. Recover from failure: offline mid-save, session expiry, two tabs editing the
    same workbook, browser refresh during save, server 500.

## 3. Audit dimensions (score each 0-10 with evidence)

### 3.1 UX and usability
- Nielsen's 10 heuristics, applied per screen.
- Information architecture: navigation, labels, findability, depth, dead ends.
- Cognitive load: jargon (CBAM, CN, embedded emissions, precursors) explained in
  place? Defaults sensible? Progressive disclosure?
- Forms and spreadsheet editing: validation timing, inline errors, units,
  number/decimal formats (Thai vs EU), required vs optional, undo/redo, autosave
  visibility, unsaved-changes guard, copy/paste from Excel.
- Feedback: loading, saving, success, empty, partial, error and offline states
  for every screen. Flag any missing state.
- Trust and compliance clarity: does the user know which numbers are default
  values vs actual data, and which methodology/source each number uses?

### 3.2 UI and visual design
- Visual hierarchy, spacing scale, typography (Thai font rendering, line height
  for Thai script), color and contrast, iconography, density.
- Consistency: buttons, inputs, tables, modals, toasts, badges. List every
  duplicate or diverging component.
- Responsive behavior and horizontal overflow; large-table usability on mobile.
- Dark mode parity.
- Microcopy: tone, clarity, TH/EN parity, untranslated strings, truncation,
  hardcoded strings outside the i18n files.

### 3.3 Accessibility (WCAG 2.2 AA)
- Keyboard: full journeys without a mouse, focus order, visible focus, traps,
  spreadsheet and CN-picker keyboard support.
- Screen reader: landmarks, headings, labels, roles, live regions for save/status,
  table semantics.
- Contrast (text 4.5:1, UI 3:1), target size (24px min), reduced motion, zoom
  200% and 400% reflow, `lang` attribute per language.
- Run axe or Lighthouse on every route and attach results.

### 3.4 Performance
- Lighthouse / Core Web Vitals (LCP, INP, CLS) per key route, mobile and desktop.
- Bundle size per route, unused JS, heavy dependencies, image formats.
- Large workbook: 1k, 10k rows: render, scroll, edit latency, save time, memory.
- API latency p50/p95 for the main endpoints, N+1 queries, missing DB indexes
  (check `prisma/schema.prisma`).

### 3.5 Functional correctness and data integrity
- Calculations (balance, estimates, emissions, CFP) against the official
  methodology and source docs; flag any number that cannot be traced to a rule.
- Save queue / sync: lost writes, double writes, ordering, conflict handling.
- Import/export round-trip: export then re-import gives identical data?
- Rounding, units, timezone and date handling.
- Run the existing test suite and type-check; report failures and gaps in
  coverage for customer-critical logic.

### 3.6 Security and privacy (OWASP Top 10 + ASVS L2)
- AuthN/AuthZ: every API route checks session **and** ownership/tenant (IDOR test:
  access another org's workbook ID). Role escalation.
- Input handling: XSS in cell values, file names, CN search; formula injection in
  exported XLSX/CSV; file upload limits and type checks; zip bombs.
- Session: cookie flags, expiry, CSRF, logout invalidation, rate limiting on
  login/reset/invite.
- Headers: CSP, HSTS, frame-ancestors, referrer policy.
- Secrets in client bundles, verbose errors/stack traces to the client, PII in
  logs or URLs.
- PDPA (Thailand) and GDPR basics: consent, data export, deletion, retention.

### 3.7 Reliability and operations
- Error boundaries, graceful degradation, retry/backoff, offline behavior.
- Logging, monitoring, alerting on customer-facing failures.
- Behavior during deploy (VPS + Vercel): stale clients, schema changes.
- Backups and restore for customer data.

### 3.8 SEO and public pages (if public pages exist)
- Titles, meta, OG tags, sitemap, robots, structured data, TH/EN `hreflang`.

## 4. Severity scale

- **P0 Blocker**: data loss, wrong compliance numbers, security hole, journey
  impossible.
- **P1 Major**: frequent confusion or failure, WCAG AA fail on a core flow.
- **P2 Minor**: friction, inconsistency, polish.
- **P3 Nice-to-have**.

Rank within each severity by (user impact x frequency) / effort.

## 5. Output

Write the report to `docs/audit/AUDIT-<YYYY-MM-DD>.md` (in Thai, technical terms in
English) with:

1. Executive summary: top 10 issues, overall score per dimension, go/no-go for
   customers.
2. Surface inventory table (section 1).
3. Journey results table (section 2) with step counts and pass/fail.
4. Findings table:
   `ID | Severity | Dimension | Screen/Route | Problem | Evidence (file:line / screenshot) | Repro | Impact | Fix | Effort S/M/L`
5. Quick wins (under 1 hour each).
6. Roadmap: what to fix this week, this month, later.
7. What you could not test and why.

Save screenshots to `docs/audit/screens/`. Stop after the report and wait for
my decision on what to fix.

---

## Skills to use

Already installed: `impeccable` (audit/critique), `ui-ux-pro-max`,
`security-review`, `code-review`, `verify-this`, `run`.

Recommended installs (checked on skills.sh, 2026-11-14):

```bash
npx skills add vercel-labs/agent-skills@web-design-guidelines -g -y
```

```bash
npx skills add addyosmani/web-quality-skills@accessibility -g -y
```

```bash
npx skills add jezweb/claude-skills@ux-audit -g -y
```
