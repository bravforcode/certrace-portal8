# Future Design Instructions

**Audience:** any future developer, designer, or AI agent asked to create a
new page, dashboard, onboarding flow, admin portal, mobile screen,
presentation, or marketing asset for Certrace.

**Contract:** follow every REQUIRED rule; never do a PROHIBITED one. Values
live in [design-tokens.json](./design-tokens.json). When this file and the
code disagree, this file is canonical.

---

## 1. Visual rules

**REQUIRED**
- Background of every surface: `#F5F4F0`. Cards: `#FFFFFF` (or `#FAF9F7` in
  stacks). Exactly one `#F0EEE8` highlight card per group.
- All text and lines derive from ink `#111` at the documented opacity steps
  (100 / 70 / 55 / 45 / 40 / 35 / 30 / 20%).
- Color = status only: emerald (success/live), amber (pending), red
  (overdue/error), blue (in progress) — at dot/chip/mono-text scale.
- Elevation = hairline border (`0.06–0.07`) + background shift. Shadows only
  from the token set (`shadow.nav`, `shadow.float`, `shadow.panel`).
- Decorative art = generative monochrome (pixel glyphs, node networks, dotted
  grids, bar fields), dissolved into the canvas with masked progressive blur.

**PROHIBITED**
- Dark mode, pure-white or colored page backgrounds, decorative gradients.
- Colored buttons, colored card fills, colored headings.
- Stock photos, emoji in UI, drop-shadow-heavy "floating" cards,
  glassmorphism anywhere except the navbar, images with hard edges.

## 2. Layout rules

**REQUIRED**
- Section skeleton: `py-32 px-6 md:px-12 lg:px-20` → `max-w-6xl mx-auto` →
  `border-t border-black/[0.06]` between sections.
- Card grids: `gap-3`; column layouts: `gap-8/12/20`. Mobile-first; collapse
  to one column below `md` (768px).
- Section header stack: PixelIcon(40) → `mt-4` TagBadge → `mt-5` BlurHeading
  → optional body. Headings left-aligned (center only Pricing + Final CTA).
- Dashboards/admin **[ASSUMPTION — no dashboard exists yet]:** same tokens at
  tighter rhythm — `py-8/12` sections, `p-6` cards, `gap-3`; sidebar = white,
  `border-r black/[0.06]`; content canvas stays `#F5F4F0`; data tables follow
  the LiveSupplierTable recipe at 12–13px.

**PROHIBITED**
- New max-widths or breakpoints; full-width text lines (cap paragraphs at
  `max-w-md`); two adjacent sections with identical grid layouts.

## 3. Typography rules

**REQUIRED**
- Display/H1–H2: IBM Plex Sans or Geist at **weight 300**, `tracking-tight`,
  `leading-[1.0–1.05]`, sentence case, end statements with a period.
- Body: Geist 14px `black/45` `leading-relaxed` (16px `black/40` for leads).
  Functional UI text (dashboards, forms): minimum `black/55`.
- Labels/eyebrows: 10–11px UPPERCASE `tracking-widest`; pixel-font (Courier
  Prime) for wordmark, eyebrows, plan names.
- Data: Geist Mono 8–12px; table headers `0.16em` tracking.
- Buttons: 14px UPPERCASE `tracking-widest`.

**PROHIBITED**
- Bold (≥600) headlines; italics; letter-spaced body text; new font families;
  centered long paragraphs; ALL-CAPS headlines.

## 4. Component usage rules

**REQUIRED**
- Reuse `AnimateCard`, `TagBadge`, `BlurHeading`, `PixelIcon`,
  `handleMouseGlow` for any new section. New components must be composed from
  the token set and documented in COMPONENT_LIBRARY.md.
- Buttons: primary dark / secondary outline / ghost arrow — exactly as
  specced; one primary per region.
- Radius: container 16px, control 12px, micro 8px, indicator full.
- Status dots always paired with a text label.
- Icons: 1.5-stroke ink SVGs in `w-10 h-10 rounded-xl border-black/10` boxes,
  or new 8×8 pixel glyphs.

**PROHIBITED**
- Third-party UI kits (Material, shadcn defaults, Bootstrap) without
  re-skinning to these tokens; icon fonts; spinners (use pulsing dot + mono
  text); carousels.

## 5. Color usage rules

See §1. Additionally **REQUIRED:** emerald as decorative accent only at
≤ 20% alpha (canvas pulses, bar fields, marquee dots). Chips: -50 bg + -700
text + 15% border. **PROHIBITED:** introducing any new hue; status colors at
large scale.

## 6. Motion rules

**REQUIRED**
- Entrances: blur-in (opacity + blur 8–16px + translateY 12–28px → 0) with
  `cubic-bezier(0.16,1,0.3,1)`; 700ms standard, 80ms sibling stagger;
  IntersectionObserver-gated, run once.
- Hover: ≤ 200ms color/border/glow/arrow-nudge only.
- Ambient loops: slow (≥ 2s), subtle (opacity ≤ 0.65, scale ≤ 1.12),
  `aria-hidden`.
- Respect `prefers-reduced-motion` globally (already in `globals.css` — keep
  it in every new app).

**PROHIBITED**
- Bounce/spring/elastic easings; hover scale/lift on cards; parallax;
  autoplaying motion faster than 2s loops; animating layout properties.

## 7. Accessibility requirements

**REQUIRED**
- Semantic landmarks (`nav/section/footer`), one `h1`, ordered headings.
- `aria-label` on icon-only controls; `aria-expanded` on disclosures;
  `aria-hidden` on all decorative canvas/marquee/bar elements.
- Status conveyed by text + color, never color alone.
- Visible `:focus-visible` ring (2px ink-40%) on all interactive elements —
  **this is currently missing; add it to anything new.**
- Functional text contrast ≥ 4.5:1 (`black/55`+); `black/45` reserved for
  marketing prose; `black/35`↓ decorative only.
- Forms: real labels or `aria-label`; errors as text, not color.

## 8. UX standards

- One idea per section; lead with outcome-shaped headlines.
- Primary action reachable from every viewport region; demo/CTA flow never
  more than one field.
- Prove claims with live/mock data surfaces instead of adjectives or stock
  testimonials.
- Empty/loading/error states use the patterns in COMPONENT_LIBRARY (pulse
  dot, skeleton `bg-black/[0.04]`, status chips).
- Copy voice: short declaratives, no exclamation marks, sentence case
  everywhere except label-caps.

## 9. Responsive standards

- Mobile-first; test 375px, 768px, 1024px, 1440px.
- Heading sizes step down one Tailwind step per breakpoint (defined per level
  in DESIGN_SYSTEM §3.2); body never changes size.
- Side-by-side visuals become stacked: visual on top, masked to transparent
  (module-stack mobile recipe).
- Touch targets ≥ 44px; the floating navbar collapses to hamburger below `md`.

## 10. New-surface checklists

**New marketing page:** splash optional → hero (bottom-left anchored) →
alternate pattern types from UI_PATTERN_LIBRARY → final CTA → footer.
**New dashboard screen:** canvas bg, white hairline cards `p-6`, mono data
grammar, status dots, no splash, no marquee, instant load (skeletons, not
blur-ins).
**New presentation/Canva asset:** follow BRAND_GUIDELINES §4 universal recipe.
**Any AI agent:** read DESIGN_SYSTEM_AI_CONTEXT.md first; copy exact class
recipes from COMPONENT_LIBRARY.md; never invent values not present in
design-tokens.json.
