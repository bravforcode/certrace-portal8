# Certrace UI Pattern Library

Section-level patterns extracted from `app/page.tsx`. Each pattern is a
reusable recipe: purpose → anatomy → best practices → responsive behavior →
reusability → common mistakes.

The page-level sequence itself is a pattern:
**Splash → Hero → Marquee → Problem → Why Now → Solution → Platform → How It
Works → Live Proof → Audiences → Coverage → Pricing → FAQ → Final CTA →
Footer.** New marketing pages should subset this order, never reshuffle it.

---

## 0. Splash intro

- **Purpose:** brand stamp on first load; covers font/canvas loading.
- **Anatomy:** full-screen `#F5F4F0` curtain (`z-100`) + wordmark letters at
  `calc((100vw−64px)/N)` size, bold, staggered blur-in (90ms) → blur-out
  (55ms) → curtain lifts 1.3s `ease.curtain`. Fires `onDone` to gate hero.
- **Best practices:** total ≤ 3.5s; show once per session on app surfaces
  (marketing page may always show). Letters only — no logos, no taglines.
- **Mistakes:** adding color; replaying on client-side navigation.

## 1. Hero (full-screen, bottom-anchored)

- **Purpose:** thesis + proof in one viewport.
- **Anatomy:** `h-screen` section; `z-0` ambient canvas visual (node network)
  that scales 0.88→1.02 over 2s when splash finishes; 3 stacked bottom scrims
  (gradient to canvas + two masked backdrop-blurs); `z-30` content block
  bottom-left (`max-w-4xl`, `pb-10`): TagBadge eyebrow → 3-line display H1 →
  `max-w-md` paragraph → primary + secondary buttons → 3-stat row. Every
  element enters with staggered blur-in (0/60/180/260/340+80i ms).
- **Best practices:** headline ≤ 3 short lines with manual breaks; exactly 3
  stats; visual must stay quieter than the text (alpha ≤ 0.55).
- **Responsive:** type steps 48→96px; buttons wrap; stats keep one row.
- **Reusability:** any product/landing hero. For dashboards, drop `h-screen`
  and reuse only the eyebrow→H1→actions stack at `py-32` scale.
- **Mistakes:** centering the content; hard-edged hero images (always dissolve
  via the scrim stack); more than 2 CTAs.

## 2. Marquee band (dual ticker)

- **Purpose:** breadth signal (regulations/industries) as a section divider.
- **Anatomy:** two full-bleed rows, hairline-bordered cells (`px-10 py-5`),
  1.5px dot + `text-sm` term; row 1 scrolls left 28s (ink 45%, emerald dots),
  row 2 right 22s (ink 30%); content tripled for seamless `-33.333%` loop.
- **Best practices:** 8–12 terms per row; keep `aria-hidden` and
  `select-none`; place after hero or between major acts only.
- **Mistakes:** clickable items; speeding it up; more than two rows.

## 3. Feature/problem card section

- **Purpose:** 3–4 parallel points (problems, triggers, features).
- **Anatomy:** section header (PixelIcon → TagBadge → BlurHeading, optional
  side paragraph `max-w-xs` bottom-right) → `mb-16` → card grid (`gap-3`,
  mouse-glow on the grid wrapper) of AnimateCards: icon box + optional
  pixel-font eyebrow → `text-lg/2xl font-light` title → `text-sm black/45`
  body; staggered delays 0/80/140(/200).
- **Variant:** + full-width stat-band card as a closing row (label left,
  display numeral right).
- **Best practices:** keep titles outcome-shaped ("Late = rejected"); bodies
  ≤ 3 lines; one idea per card.
- **Responsive:** 1-col below `md`.
- **Mistakes:** mixing icon styles in one grid; >4 cards; centering card text.

## 4. Pull quote

- **Purpose:** editorial emphasis after evidence.
- **Anatomy:** `mt-16 flex gap-6 max-w-3xl`: 1px vertical ink-15% rule +
  `text-xl md:text-2xl font-light leading-snug text-black/60` quote in curly
  quotes.
- **Reusability:** testimonials, analyst quotes, regulation citations.
- **Mistakes:** italics; attribution larger than the quote; boxing it in a card.

## 5. Before/After comparison

- **Purpose:** transformation story in one glance.
- **Anatomy:** 2-col grid `gap-3`; left = white AnimateCard "BEFORE" (pixel
  eyebrow, numbered mono rows with neutral dots, closing row after a hairline:
  red dot + `text-red-600/70` failure); right = highlight card (`bg-[#F0EEE8]
  border-black/20`) "AFTER" with emerald dots and glowing success row.
- **Best practices:** 5+1 rows each side, parallel phrasing, ≤ 6 words per row.
- **Mistakes:** equal visual weight (After must win via the highlight
  treatment); paragraphs instead of rows.

## 6. Sticky module stack

- **Purpose:** sequential deep-dive on 3–4 product modules with depth.
- **Anatomy:** see COMPONENT_LIBRARY → Sticky stack card. Cards pin at
  `top: 80+16i px` and recede (scale −0.04, +8px y per depth) as the next
  arrives.
- **Responsive:** desktop = right-half visual with left gradient fade;
  mobile = top visual masked to transparent, then text.
- **Reusability:** product tours, case-study chapters, onboarding steps.
- **Mistakes:** >4 cards (stack gets cramped); real screenshots with hard
  edges instead of mock-UI mini cards; forgetting `zIndex: 10+i`.

## 7. Tabbed walkthrough (How It Works)

- **Purpose:** 4-step process with a living product panel.
- **Anatomy:** `lg:grid-cols-3`: left column of 4 step buttons (number chip +
  title + one-liner; active = ink-4% fill, ink-12% border), right
  `col-span-2` panel (glass card, mono breadcrumb header + 4 progress dots,
  code-well with semantically colored activity log). Auto-advances every
  3.6s; manual click resets focus; content swaps with 220ms blur.
- **Best practices:** log lines ≤ 45 chars; reuse the `✓ ● →` color grammar;
  always pair auto-rotation with click override.
- **Responsive:** buttons stack above panel below `lg`.
- **Reusability:** feature tours, changelog highlights, API quickstarts.
- **Mistakes:** real code screenshots; rotation faster than ~3s; more than 4
  steps.

## 8. Live proof section (statistics + live table)

- **Purpose:** make the product feel operational — social proof via data.
- **Anatomy:** `lg:grid-cols-2 gap-20 items-center`: left = section header +
  `max-w-sm` lead + big mono CompletionCount with 2-line `text-sm black/30`
  label; right = LiveSupplierTable + dot-prefixed stat line.
- **Best practices:** numbers must drift believably (bounded random walk);
  keep table to 6 rows; statuses lowercase mono.
- **Mistakes:** unbounded counters; colorful table chrome; replacing live
  surfaces with static screenshots.

## 9. Audience grid (Who It's For)

- **Anatomy:** 2×2 AnimateCard grid; title → `flex-1` body → ghost arrow CTA.
- **Best practices:** address each audience's verb ("Manage…", "Receive…");
  CTAs deep-link to relevant sections.
- **Mistakes:** unequal card heights (use `flex flex-col` + `flex-1`); icons
  here (text-only keeps it calm).

## 10. Coverage grid (Regulations)

- **Anatomy:** 2×2 cards: display-font name (`text-3xl font-light`) +
  uppercase full-name caption, status chip top-right (emerald LIVE pulsing /
  neutral SUPPORTED), body below; centered `text-xs black/35` footer line
  under the grid.
- **Reusability:** integrations, certifications, region coverage.
- **Mistakes:** logo images instead of set-in-type names; >2 status levels.

## 11. Pricing section

- **Anatomy:** centered header (`max-w-5xl` container) → 3 plan cards:
  pixel-font plan name, `min-h` aligned sub, dot-bullet features (`flex-1`),
  full-width button. Middle plan = highlight card + dark button. Footer
  caveat line centered below.
- **Best practices:** value-anchored sub-lines; suppliers-free always stated;
  prices optional (request-based works with this system).
- **Mistakes:** "most popular" ribbons (the highlight treatment *is* the
  ribbon); feature lists longer than ~6 items.

## 12. FAQ section

- **Anatomy:** `lg:grid-cols-3`: header column (sticky-feeling) + `col-span-2`
  accordion (hairline rows, plus-icon toggles, one open, first open by
  default).
- **Best practices:** answers ≤ 4 lines, `max-w-2xl`; questions phrased as
  the buyer asks them.
- **Mistakes:** multi-open accordions on marketing pages; chevron icons
  (the brand uses the plus).

## 13. Final CTA

- **Anatomy:** `py-32/40` section; ambient CSS bar field at bottom (36
  breathing translucent columns, emerald every 3rd) dissolved by masked blur +
  gradient scrims; centered `max-w-2xl`: 2-line H2 → `text-sm` body → email
  input + dark button (`max-w-md` row) → success chip swap → `text-xs
  black/30` reassurance line.
- **Best practices:** headline echoes the hero's promise; exactly one field;
  swap form for the emerald chip on submit (no redirects).
- **Mistakes:** multi-field forms; solid-color CTA banners (keep the bone
  canvas + ambient art).

## 14. Footer

- **Anatomy:** see COMPONENT_LIBRARY → Footer. Tagline ≤ 8 words; 4 link
  columns; legal row separated by the faintest border (`0.04`).
- **Mistakes:** dark footers; social icon rows (use text links); restating
  the CTA (the Final CTA section owns that).

---

## Cross-pattern rules

1. Every section: `py-32 px-6 md:px-12 lg:px-20` + `border-t
   border-black/[0.06]` + `max-w-6xl mx-auto` (exceptions: pricing 5xl, CTA
   2xl content).
2. Every section header uses the PixelIcon → TagBadge → BlurHeading stack.
3. Every card grid: `gap-3`, `onMouseMove={handleMouseGlow}`, staggered
   AnimateCard delays.
4. Alternate section rhythms (grid → editorial split → stack → grid) so two
   identical layouts never sit adjacent.
5. Background art (canvas, bars, grids) always dissolves into `#F5F4F0` via
   progressive blur masks — never a hard edge.
