# Certrace — AI Design Context (single-file brief)

You are generating UI/assets for **Certrace**, a carbon-compliance platform
for exporters. This file alone is sufficient to produce on-brand output.

## Identity in one line

Warm paper (`#F5F4F0`) + near-black ink (`#111`) + huge *Light-weight*
headlines + typewriter micro-labels + hairline borders + tiny living status
dots + generative monochrome art. Calm, precise, enterprise-grade. Light mode
only.

## Hard rules (violating any of these breaks the brand)

1. Page background `#F5F4F0`. Cards white with `border rgba(0,0,0,0.07)`,
   radius 16px. Buttons/inputs radius 12px. Pills fully rounded.
2. ALL text = `#111` at opacity steps: headlines 100%, body 45% (UI text 55%),
   captions 35%, metadata 25–30%. No other text colors except status.
3. Headlines: IBM Plex Sans (or Geist/Inter) **weight 300**, tracking
   -0.025em, line-height 1.05, sentence case ending with a period. NEVER bold.
4. Labels/eyebrows: 11px UPPERCASE, letter-spacing 0.1em; brand labels in
   Courier Prime (wordmark = `CERTRACE`, spacing 0.25em).
5. Body: Geist/Inter 14px, line-height 1.625, max-width ~28rem. Data/tables/
   logs: Geist Mono 8–12px lowercase.
6. Color is ONLY for status, at small scale (dots, chips, mono text):
   success `#4ADE80`/`#16A34A`, warning `#FACC15`/`#B45309`, error
   `#F87171`, info `#60A5FA`/`#2563EB`. Chips = tint-50 bg + 700 text.
   Emerald may decorate ambient art at ≤20% alpha. No brand hue exists.
7. Buttons: primary = `#111` fill, white text, hover `#333`; secondary =
   `border rgba(0,0,0,0.1)`, ink-60% text; both 14px UPPERCASE
   letter-spaced, radius 12px, padding ~28×12px. One primary per region.
8. Elevation by border + background shift, not shadow. Max shadow:
   `0 8px 32px rgba(0,0,0,0.08)` (floating nav/modals only).
9. Motion: everything enters by fading in with blur (8–16px→0) and rising
   12–28px, 700ms, easing `cubic-bezier(0.16,1,0.3,1)`, 80ms stagger between
   siblings, triggered on scroll once. Hovers: 200ms color/border only — no
   scale, no lift. Honor `prefers-reduced-motion`.
10. No: dark mode, photos, emoji, gradients-as-decoration, colored fills,
    bold headings, italics, spinners, carousels, bouncing.

## Layout grammar

- Section: vertical padding 128px, gutters 24/48/80px (mobile/tablet/desktop),
  content centered at max 1152px, separated by `border-top rgba(0,0,0,0.06)`.
- Section header: 40px animated pixel glyph → pill badge (UPPERCASE 11px,
  ink-40% on ink-4% bg) → big light heading (word-by-word blur-in) → optional
  short lead.
- Card grids: 2–4 columns, 12px gaps, equal heights; stagger entrances
  0/80/140/200ms. Single column under 768px.
- Hero: full-screen, ambient monochrome canvas art (node network) fading into
  the page via gradient + masked blur; content anchored BOTTOM-LEFT: badge →
  3-line display headline (48→96px) → short paragraph → dark + outline
  buttons → 3 stats (light numerals + uppercase micro-labels).
- Navbar: floating pill, fixed 16px from top, centered, max 768px wide,
  `rgba(245,244,240,0.3)` + backdrop-blur 16px, hairline border, wordmark
  left, 11px links, dark CTA right.
- Footer: light, wordmark + tagline + 4 link columns (pixel-font column
  titles), faint legal bar.

## Signature patterns (reuse, don't reinvent)

- **Live table:** white/70 frame, radius 16, 8px mono UPPERCASE headers
  (0.16em), rows with hairline dividers, 5px status dots + lowercase labels,
  2px progress bars; rows cycle in every ~3s.
- **Activity log panel:** ink-3% well, radius 12, mono 12px lines colored
  `✓` green / `●` amber / `→` blue / `#` gray; auto-cycling steps with 4
  step-buttons on the left.
- **Sticky module stack:** ≤4 cards pinning at `top: 80+16i px`, receding
  scale −0.04/depth; right half = mock-UI mini card over 24px hairline grid.
- **Before/After:** white card (gray dots, red ✗ ending) vs `#F0EEE8`
  highlight card (emerald dots, glowing ✓ ending), numbered mono rows.
- **Marquee divider:** two opposite-scrolling rows of dot+term cells, 22–28s
  linear loops.
- **Final CTA:** centered, 2-line headline, single email field + dark button,
  ambient breathing bar field dissolved by blur at the bottom.
- **Stat numeral:** big (36–80px) weight-300 figure + 11px UPPERCASE ink-40%
  label underneath.

## Tone of copy

Short declaratives. Outcome-first ("Late = rejected."). No exclamation
marks, no hype adjectives. Labels UPPERCASE, statuses lowercase mono.

## Accessibility

Status = color + text always. Functional text ≥ ink-55%. `aria-hidden` on
decorative art. Visible focus ring (2px ink-40%) on interactive elements.
Touch targets ≥ 44px.

Full token values: [design-tokens.json](./design-tokens.json).
