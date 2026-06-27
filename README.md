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

### 1. Waitlist form (currently console.log only)

Open `index.html`, find the **WAITLIST FORM** block in the `<script>`. Right now a
valid email is validated, logged to the console, and the success state is shown —
**nothing is stored anywhere.** There's a `TODO` comment with two options:

- **A — Tally / Google Forms:** point the `<form>` at the form endpoint and let
  it POST natively, or
- **B — Your own endpoint:** uncomment the `fetch(...)` POST and set the URL.

### 2. Config block (top of `<script>`) — one placeholder left

```js
const CONFIG = {
  CALENDLY_URL:  'CALENDLY_URL_PLACEHOLDER',                       // <-- TODO: real scheduler link
  CONTACT_EMAIL: 'certrace.co@gmail.com',                         // live
  LINKEDIN_URL:  'https://www.linkedin.com/company/certrace-co'   // live
};
```

- **`CALENDLY_URL` is the only thing still to wire up.** It powers the
  "Give us 15 minutes" secondary link under the waitlist form. Drop in the real
  Calendly / Cal.com / SavvyCal link.
- `CONTACT_EMAIL` and `LINKEDIN_URL` are already set to the real values and power
  the footer (email renders as a `mailto:`). Setting `LINKEDIN_URL` to `''` would
  hide the LinkedIn link automatically.

### 3. Nothing else

No analytics, no SEO meta, no tracking — intentional for this stage. Add later
if needed.

## Page structure (and what's intentionally absent)

Hero → **01 What is Certrace** (the clearest, most concrete paragraph) →
**02 The problem** → **03 What we're building** → CTA (waitlist + a soft
"give us 15 minutes" line that doubles as the "why we're reaching out" cue) →
footer.

Deliberately excluded: pricing, feature lists, screenshots, logos/customers,
metrics, testimonials, comparison tables, and any regulation other than CBAM.

## Notes for whoever edits the copy

- Total visible body copy (hero + three sections) is kept under ~150 words on
  purpose. If you add a sentence, cut one — the restraint is the point.
- Calm, plain, founder-to-founder. No hype words.

## Accessibility / behavior

- Respects `prefers-reduced-motion` (disables the blur-in reveals, the dot pulse,
  and the hero canvas animation).
- Visible focus ring on the email input.
- The animated hero dot-field, and the small emerald/amber/red dot trio in the
  CTA, are decorative (`aria-hidden`) — the brand's status-dot motif used as
  texture, not functional status indicators.
- Responsive, mobile-first. Verified at 390px and 1280px.
