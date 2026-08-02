# Certrace Component Library

Inventory of every reusable component implemented in `components/` and
`app/page.tsx`, plus components *implied* by the design system but not yet
built (marked **[NOT YET BUILT]** with a recommended spec). Class strings are
extracted from the implementation.

---

## Navigation

### Navbar (`components/navbar.tsx`)

- **Purpose:** persistent floating navigation + primary CTA.
- **Anatomy:** fixed wrapper (`fixed top-4 inset-x-0 z-50`, centered,
  `max-w-3xl`) → glass pill (`rounded-2xl border-black/[0.06]`, fill
  `rgba(245,244,240,0.30)` + `backdrop-blur(16px)`, `shadow.nav`) containing
  wordmark (`font-pixel text-xs tracking-[0.25em] text-black/70`), 5 links
  (`text-[11px] text-black/60 hover:text-black`), dark CTA pill.
- **Variants:** desktop (inline links) · mobile (hamburger → dropdown card with
  same glass style, `maxHeight` transition 300ms).
- **States:** link hover (ink darkens, 200ms); hamburger morphs to ✕ (3 bars,
  300ms transforms).
- **Responsive:** links and CTA hidden below `md`; hamburger hidden above.
- **Accessibility:** `aria-label` on the toggle ("Open menu"/"Close menu");
  links are real anchors to section ids.
- **Notes:** never widen beyond `max-w-3xl`; never make it opaque.

### Footer (`app/page.tsx`)

- **Purpose:** sitemap + legal.
- **Anatomy:** `pt-16 pb-10`, hairline top border → `grid grid-cols-2
  md:grid-cols-6`: brand block (wordmark + one-line tagline, `col-span-2`) + 4
  link columns (pixel-font column titles `text-[10px] tracking-[0.2em]
  text-black/30`, links `text-xs text-black/35 hover:text-black/70`) → bottom
  bar split by `border-black/[0.04]` with copyright `text-black/20`.
- **Responsive:** 2 columns on mobile, 6 on `md+`.

---

## Buttons

All buttons: `rounded-xl`, `text-sm tracking-widest`, UPPERCASE label,
`transition-colors`/`transition-all duration-200`. Navbar-scale variant uses
`text-[11px] px-4 py-2`.

### Primary (dark)

```
px-7/8 py-3 bg-[#111] text-white rounded-xl hover:bg-[#333] tracking-widest text-sm
```
One per viewport-region maximum. Used for: REQUEST A DEMO, featured plan,
form submit.

### Secondary (outline)

```
px-7 py-3 rounded-xl border border-black/10 text-black/60
hover:border-black/25 hover:text-black hover:bg-black/[0.04]
```
Used for: SEE HOW IT WORKS, non-featured plans.

### Ghost / text link with arrow

```
inline-flex items-center gap-2 text-[11px] tracking-widest text-black/40
hover:text-black + "→" that translates x-1 on group hover (200ms)
```
Used for card-level CTAs (audience cards).

### States

- Hover: color/border only — no scale, no shadow, no movement.
- Focus: browser default ⚠️ — add `:focus-visible` ring (see DESIGN_SYSTEM §2.4).
- Disabled **[NOT YET BUILT]**: recommend `opacity-40 pointer-events-none`.

---

## Cards

### AnimateCard (`components/ui.tsx`) — the universal card

- **Purpose:** base container for every content card on the page.
- **Implementation:** `group relative rounded-2xl border border-black/[0.07]
  bg-white overflow-hidden` + scroll entrance (opacity 0→1, `translateY(28px)→0`,
  700ms `ease`, per-card `delay` prop, IntersectionObserver threshold 0.1) +
  mouse-glow overlay (400px radial `rgba(0,0,0,0.03)` at `--mouse-x/y`).
- **Hover:** `border-black/[0.15]`, bg `#fafaf8`, glow fades in 500ms.
- **Variants (by composition):**
  - *Feature card:* icon box (`w-10 h-10 rounded-xl border-black/10` + 18px
    1.5-stroke SVG) → `text-lg/xl font-light` title → `text-sm black/45` body.
    `p-8`, `min-h-[200–240px]`.
  - *Stat band:* full-width, label (`text-xs uppercase tracking-widest
    black/35`) + display numeral (`text-4xl/5xl font-light` IBM Plex).
  - *Highlight card:* add `border-black/20 bg-[#F0EEE8]` (featured plan,
    "After" panel). Max one per grid.
  - *Pricing card:* pixel-font plan name → sub → bullet list (1px dot +
    `text-sm black/55`) → full-width button.
  - *Audience card:* title → body → ghost arrow CTA, `flex flex-col` with
    `flex-1` body.
- **Grid context:** parent uses `gap-3` and `onMouseMove={handleMouseGlow}`.
- **Accessibility:** glow layers are `pointer-events-none`; cards are not
  focusable unless they contain links.

### Sticky stack card (`components/module-stack.tsx`)

- **Purpose:** sequential product modules with 3D depth-stacking on scroll.
- **Anatomy:** `bg-[#faf9f7] rounded-2xl border-black/[0.07]`; right half
  (desktop) = visual panel over 24px CSS grid texture with left gradient fade
  from `#faf9f7`; mobile = 13rem top visual masked to transparent; content
  capped `md:max-w-[55%]`; tag chips row above hairline.
- **Behavior:** `sticky top-[80+16i]px`, stacked cards scale `1−0.04·depth`
  and drop `8px·depth` (300ms signature ease).
- **Notes:** 4 cards maximum; label format `NN / MODULE NAME`.

### Testimonial card **[NOT YET BUILT]**

Recommended spec: AnimateCard + quote in `text-xl font-light leading-snug
text-black/60`, attribution as pixel-font label, optional 5px emerald dot.
(The pull-quote pattern in UI_PATTERN_LIBRARY §4 is the current substitute.)

---

## Forms

### Text input (`app/page.tsx`, demo form)

```
flex-1 bg-white border border-black/10 rounded-xl px-4 py-3 text-sm
placeholder:text-black/25 focus:outline-none focus:border-black/25
```
- Label: use `aria-label` (current) or a visible `text-[11px] tracking-widest`
  label above. Placeholder is lowercase hint text (`your@company.com`).
- **Success state:** the form is replaced by a chip: `rounded-xl
  border-emerald-600/20 bg-emerald-50 text-emerald-700 text-sm` + emerald dot.
- **Validation [NOT YET BUILT]:** error = `border-red-400/60` + `text-xs
  text-red-600/70` helper line below; never red fill.

### Textarea / Select / Checkbox **[NOT YET BUILT]**

Inherit the input recipe (white fill, `border-black/10`, `rounded-xl`). Select
chevron: 1.5-stroke ink SVG. Checkbox: 16px `rounded-[4px]` box, `#111` fill
when checked.

---

## Badges, Tags & Chips

### TagBadge (`components/ui.tsx`) — section eyebrow

```
inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px]
tracking-widest text-black/40 bg-black/[0.04]
```
UPPERCASE. One per section header, placed between pixel icon and heading.

### Outline tag (module cards)

`px-2.5 py-1 rounded-full text-[10px] tracking-wider text-black/35 border
border-black/[0.08]` — feature/capability tags.

### Status chip (regulations, success states)

Live: `border-emerald-600/15 bg-emerald-50 text-emerald-700` + pulsing
1.5px emerald dot. Neutral: `border-black/10 bg-black/[0.03] text-black/40`.
`text-[10px] tracking-widest` UPPERCASE.

### Status dot + label (tables)

5–6px round dot in status color (-400 scale) + 8px mono lowercase label in
`black/35`. `submitted` dots glow (`0 0 6px`), `in progress` pulses
(`statusPulse 2s`).

---

## Icons

### PixelIcon (`components/pixel-icon.tsx`)

- **Purpose:** animated section identity glyphs — the brand's illustration
  system.
- **Implementation:** 40px canvas, devicePixelRatio-aware, `requestAnimationFrame`
  loop, pure `rgba(0,0,0,α)` fills, `image-rendering: pixelated`,
  `aria-hidden`.
- **Variants:** `scatter` (blinking grid) · `globe` (orbiting nodes) · `funnel`
  (converging diamond) · `leaf` · `steps` (ascending bars) · `signal`
  (expanding rings) · `people` (2-frame walker) · `shield` · `bars` ·
  `doc`. New glyphs: 8×8 matrices or parametric draws, monochrome only.

### Inline SVG icons

18px, `viewBox 24`, `fill=none stroke=currentColor strokeWidth=1.5`, inside a
`w-10 h-10 rounded-xl border border-black/10` box. Never use icon fonts or
multicolor icons.

---

## Data Display

### LiveSupplierTable (`components/live-table.tsx`)

- **Purpose:** living proof-of-product; supplier submission feed.
- **Anatomy:** frame `rounded-[16px] border rgba(0,0,0,0.08) bg-white/70` →
  mono header row (8px, `0.16em` tracking, `black/30`, bg `rgba(0,0,0,0.03)`)
  → 6 rows on `border rgba(0,0,0,0.04)` with name + #ID, 2px progress bar
  (emerald when 100%), regulation, dot+status, updated.
- **Behavior:** new row every 2.8s (`rowSlideIn` on last row); names cycle a
  fixed pool sequentially; progress creeps via rAF.
- **Stats line below:** dot-prefixed `text-[11px] tracking-wide black/40`
  facts (emerald dots; amber for deadline).

### CompletionCount

Mono numeral `clamp(3rem,6vw,5rem)` weight 300, denominator at
`rgba(0,0,0,0.25)`; drifts ±1 every 2.4s within bounds.

### Activity log panel (`components/how-it-works.tsx`)

Code-well: `rounded-xl bg-rgba(0,0,0,0.03) border rgba(0,0,0,0.06) p-6`, mono
12px/24px lines, semantic colors: `✓ #16A34A` · `● #B45309` · `→ #2563EB` ·
comment `#9CA3AF` · plain `#111`. Content swaps with 220ms blur transition.

### Mock-UI mini card (`components/module-stack.tsx`)

`max-w-[300px] rounded-xl border-black/[0.08] bg-white/80 shadow.float` with
mono header strip — used to depict product screens inside marketing surfaces.

---

## Disclosure & Overlays

### FAQ accordion (`components/faq.tsx`)

- Row: hairline-divided, full-width button: question `text-base md:text-lg
  font-light` (ink 55%→85% when open) + plus icon (two 1px bars; vertical bar
  `scaleY(0)` when open, 300ms).
- Panel: `maxHeight` 0→240px + opacity, 400ms ease-in-out; answer `text-sm
  black/45 max-w-2xl`.
- One item open at a time; first item open by default.
- `aria-expanded` set on the trigger.

### Modal / Dropdown / Toast **[NOT YET BUILT]**

Recommended: modal = AnimateCard styling at `z-[90]`, backdrop
`rgba(245,244,240,0.6)` + 16px blur, entrance = signature blur-in 300ms.
Toast = status-chip styling, bottom-right, `rowSlideIn`.

---

## Feedback & Status

- **Alert / success:** inline chip pattern (see form success). Error variant:
  `border-red-400/30 bg-red-50 text-red-600/80`.
- **Loading [NOT YET BUILT]:** use `statusPulse` on a dot + mono lowercase
  text ("processing…"); skeletons = `bg-black/[0.04] rounded-xl` pulsing.
  Never spinners.
- **Empty state [NOT YET BUILT]:** PixelIcon + `text-sm black/45` line + one
  secondary button, centered in a dashed `border-black/10 rounded-2xl` well.

---

## Section-level components

### Section header

`PixelIcon(40)` → `mt-4 TagBadge` → `mt-5 BlurHeading` → optional `mt-6` body
(`max-w-md`) — or the split variant with side paragraph (`max-w-xs text-sm
black/45`) bottom-aligned right (`flex md:items-end md:justify-between`).

### BlurHeading (`components/ui.tsx`)

Word-by-word blur-in heading (per-word 8px blur, 12px rise, 700ms, 80ms
stagger; `\n` for line breaks). Use for **every** section H2.

### Statistics blocks

- Hero stat: display numeral + `text-xs uppercase tracking-widest black/40`
  label, staggered entrance.
- Stat band card and CompletionCount (above).

### CTA block

Centered `max-w-2xl`: H2 (2 lines) → `text-sm black/45` body → email+button
row (`flex-col sm:flex-row gap-2 max-w-md`) → `text-xs black/30` reassurance
line. Sits on an ambient background (CtaBarField) with blur/gradient scrims.

### Social proof

Currently: live data surfaces + marquee bands + stat numerals (no logos or
testimonials). When logos arrive: monochrome ink at 35–45% opacity, equal
height, marquee or hairline-separated row.

### SplashScreen / HeroCanvas / MarqueeBand / CtaBarField

Single-use brand components — see UI_PATTERN_LIBRARY for anatomy and reuse
rules.
