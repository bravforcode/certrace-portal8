# Certrace — Pre-launch Landing Page

A single, self-contained landing page for the Certrace pre-launch / discovery
phase. Its only job: make a cold-outreach recipient decide, in 30–60 seconds,
that we're real founders working on a serious problem — and worth 15 minutes.

Scope is **CBAM only** (EU Carbon Border Adjustment Mechanism), starting with
Thai steel and aluminum exporters. The page deliberately does not mention any
other regulation.

Built to the Certrace Design System (bone `#F5F4F0` ground, `#111` ink ramp,
IBM Plex Sans Light headlines, Courier Prime micro-labels, hairline borders,
status-dot motif as texture). The brand logo is the real vector mark, inlined
as SVG.

## Files

- `index.html` — the entire page. HTML + CSS + JS inline. No build step.

## Run it

Just open `index.html` in a browser, or serve the folder statically:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

The only external dependency is Google Fonts (IBM Plex Sans + Courier Prime).

## Before going live

### 1. Waitlist — two-step capture (currently console.log only)

The waitlist is a **two-step flow**, and there are **two backend capture points**.
Open `index.html`, find the **WAITLIST — two-step flow** block in the `<script>`:

1. **Step 1 — email (on the page).** A valid email opens the details popup.
   This fires **HOOK #1** immediately, *before* the popup, so the email lead is
   saved even if the visitor abandons step 2.
2. **Step 2 — qualifying details (popup).** Company name, role, "affected by
   CBAM?", and biggest CBAM challenge. On submit this fires **HOOK #2** with the
   full profile, then shows the success state.

Right now both hooks only `console.log` — **nothing is stored anywhere.** Each
hook has a `TODO` comment with two options:

- **A — Tally / Google Forms:** POST to the form endpoint, or
- **B — Your own endpoint:** uncomment the `fetch(...)` POST and set the URL.

**Recommended:** have HOOK #2 *upsert on `email`* so the step-2 details enrich
the same lead created in step 1 rather than creating a duplicate row.

Payload shapes:

```js
// HOOK #1 (email submitted, before the popup)
{ email, source: 'landing', step: 'email' }

// HOOK #2 (popup completed)
{ email, company, role, cbam_status, challenge, source: 'landing', step: 'details' }
```

The "biggest CBAM challenge" question is currently **required**. To make it
optional, see the one-line `NOTE` next to its `check(...)` call in the script.

### 2. Config block (top of `<script>`)

```js
const CONFIG = {
  CONTACT_EMAIL: 'certrace.co@gmail.com',                         // live
  LINKEDIN_URL:  'https://www.linkedin.com/company/certrace-co'   // live
};
```

- `CONTACT_EMAIL` and `LINKEDIN_URL` are already set to the real values and power
  the footer (email renders as a `mailto:`). Setting `LINKEDIN_URL` to `''` would
  hide the LinkedIn link automatically.
- Nothing else here needs wiring (the old `CALENDLY_URL` placeholder is gone —
  the "Give us 15 minutes" link was replaced by the step-2 details popup).

### 3. Nothing else

No analytics, no SEO meta, no tracking — intentional for this stage. Add later
if needed.

## Page structure (and what's intentionally absent)

Hero → **01 What is Certrace** (the clearest, most concrete paragraph) →
**02 The problem** → **03 What we're building** → CTA (email waitlist, which
opens a short qualifying-details popup) → footer.

Deliberately excluded: pricing, feature lists, screenshots, logos/customers,
metrics, testimonials, comparison tables, and any regulation other than CBAM.

## Notes for whoever edits the copy

- Total visible body copy (hero + three sections) is kept under ~150 words on
  purpose. If you add a sentence, cut one — the restraint is the point.
- Calm, plain, founder-to-founder. No hype words.

## Accessibility / behavior

- Respects `prefers-reduced-motion` (disables the blur-in reveals, the dot pulse,
  the hero canvas animation, and the popup's open transition).
- Visible focus ring on the email input and on the popup controls.
- The details popup is an accessible dialog: `role="dialog"` + `aria-modal`,
  focus is trapped inside, `Esc` / overlay-click / the × button close it, the
  page scroll is locked while it's open, and focus returns to the opener on close.
- The animated hero dot-field, and the small emerald/amber/red dot trio in the
  CTA, are decorative (`aria-hidden`) — the brand's status-dot motif used as
  texture, not functional status indicators.
- Responsive, mobile-first. Verified at 390px and 1280px.
