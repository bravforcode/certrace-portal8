# Certrace Design System

> **Source of truth** for the Certrace product ecosystem. Every value in this
> document is extracted directly from the implementation in `app/` and
> `components/` (Next.js 15, Tailwind CSS v4). Where the codebase is
> inconsistent, the inconsistency is flagged with ⚠️ and a canonical value is
> recommended. Assumptions are labeled **[ASSUMPTION]**.

Related files: [design-tokens.json](./design-tokens.json) ·
[COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) ·
[UI_PATTERN_LIBRARY.md](./UI_PATTERN_LIBRARY.md) ·
[FUTURE_DESIGN_INSTRUCTIONS.md](./FUTURE_DESIGN_INSTRUCTIONS.md)

---

## 1. Brand Foundation

### Brand personality

Certrace is **calm infrastructure for a stressful domain**. The product
handles regulatory deadlines, financial risk, and supply-chain chaos — so the
interface does the opposite: it is quiet, ordered, warm, and precise. The
brand reads as an instrument, not an advertisement.

### Brand attributes

| Attribute | How it shows up in the UI |
|---|---|
| Precise | Monospace data surfaces, timestamped rows, hairline borders |
| Calm | Bone-white canvas, no saturated blocks, generous whitespace |
| Trustworthy | Flat elevation, restrained color, live/verifiable data |
| Technical | Pixel-art canvas icons, terminal-style activity logs |
| Premium | Light-weight display type, slow easing, blur-in motion |
| Quietly optimistic | Emerald used only for success and life signals |

### Design principles

1. **Ink on bone.** One warm off-white canvas, one near-black ink. Everything
   else is an opacity step of the ink. Color is information, never decoration.
2. **Hierarchy through weight and opacity, not size alone.** Headlines are
   large but *light* (300). Body copy recedes via `black/45`, captions via
   `black/35`.
3. **Borders, not shadows.** Elevation is communicated with hairline borders
   and background shifts. Shadows are nearly invisible (≤ 8% black).
4. **Motion is entrance, not spectacle.** Things blur and rise into place with
   one signature easing curve. Nothing bounces, nothing spins.
5. **Data is alive.** Tables cycle, counters tick, dots pulse. Live signals
   prove the product works without a single testimonial.
6. **Monochrome generative art over stock imagery.** Visuals are drawn in code
   (canvas networks, pixel icons, CSS bar fields) — never photography.

### Visual philosophy

The interface should feel like a **beautifully printed regulatory document
that came alive**: paper-colored ground, typographic restraint, mono details,
and small living indicators. Density lives inside cards; the page itself
breathes.

### Tone and feeling

Reading the page should feel like exhaling. The target emotional arc for a
compliance manager: *"This is serious software, it is already running, and it
is going to be fine."*

### Core UX principles

- One idea per section; one section per scroll-stop.
- Every claim is shown as a working surface (live table, activity log) rather
  than stated.
- Primary action (`REQUEST A DEMO`) is always reachable: navbar, hero, pricing,
  final CTA.
- Anything animated must be `IntersectionObserver`-gated (animate on entry,
  once) and respect `prefers-reduced-motion`.
- Hover states never move layout — they shift color, border, and glow only.

---

## 2. Color System

There is **no brand hue**. The palette is a warm neutral ground + ink ramp,
with small functional status colors. Tailwind v4 is used without a theme
extension, so colors live as utility classes and inline values — the tokens
below are the canonical names to migrate toward.

### 2.1 Ground (backgrounds & surfaces)

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `ground.canvas` | `#F5F4F0` | 245 244 240 | Page background, gradient fades, nav tint |
| `ground.surface` | `#FFFFFF` | 255 255 255 | Default card background (`AnimateCard`) |
| `ground.surface-hover` | `#FAFAF8` | 250 250 248 | Card hover background |
| `ground.surface-warm` | `#FAF9F7` | 250 249 247 | Stacked module cards |
| `ground.surface-highlight` | `#F0EEE8` | 240 238 232 | Emphasized card (featured plan, "After" panel) |
| `ground.surface-glass` | `rgba(255,255,255,0.7)` | — | Translucent panels (tables, step buttons) |
| `ground.nav-glass` | `rgba(245,244,240,0.30)` | — | Navbar fill behind 16px backdrop blur |

⚠️ **Inconsistency:** the splash curtain uses `#f5f4f1` while the page canvas
is `#F5F4F0` (1-unit blue-channel difference, invisible but untokenized).
**Canonical: `#F5F4F0` everywhere.**

### 2.2 Ink (text & lines)

All text and borders are opacity steps of `ink` = `#111111` (17 17 17),
applied as Tailwind `text-black/N` / `border-black/[N]` (black `#000` at low
alpha is visually identical on this ground).

| Token | Value | Usage |
|---|---|---|
| `ink.DEFAULT` | `#111111` @ 100% | Headlines, hero stats, primary button fill |
| `ink.strong` | 70% | Nav logo, active states |
| `ink.body-strong` | 55% | List/feature text |
| `ink.body` | **45%** | Standard body copy (most used) |
| `ink.muted` | 40% | Secondary body, stat labels |
| `ink.caption` | 35% | Captions, footer links, tag text |
| `ink.faint` | 30–25% | Mono metadata, index numbers, hints |
| `ink.ghost` | 20% | Copyright, watermark numerals |

⚠️ Body copy alternates between `black/40` and `black/45` in equivalent
positions. **Canonical: `black/45` for body, `black/40` only for long lead
paragraphs next to large headings.**

**Borders** (extracted frequency in parentheses):

| Token | Value | Usage |
|---|---|---|
| `border.hairline` | `black/[0.06]` (×23) | Section dividers, table rows, inner rules |
| `border.card` | `black/[0.07]` | Card outlines |
| `border.control` | `black/10` | Buttons, inputs, icon boxes |
| `border.hover` | `black/[0.15]`–`black/25` | Card/button hover |
| `border.active` | `black/20` | Highlighted cards |

⚠️ Nine distinct border opacities exist (0.04–0.25). **Canonical set: 0.06
(hairline), 0.07 (card), 0.10 (control), 0.15 (hover), 0.20 (active).** Avoid
introducing others.

### 2.3 Status / functional colors

Dots use the light (-400) value; text uses the dark (-600/-700) value, often
on a -50 tinted chip.

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `status.success.dot` | `#4ADE80` | 74 222 128 | Live/submitted dots, glow `0 0 6px #4ADE80` |
| `status.success.accent` | `#10B981` | 16 185 129 | Canvas pulses, progress fill (emerald-500) |
| `status.success.text` | `#16A34A` / emerald-700 `#047857` | — | "✓" log lines, chip text on `#ECFDF5` (emerald-50) |
| `status.warning.dot` | `#FACC15` | 250 204 21 | Reminder/queued dots |
| `status.warning.text` | `#B45309` | 180 83 9 | "●" log lines, gap flags (`#D97706` amber-600 in mock UIs) |
| `status.error.dot` | `#F87171` | 248 113 113 | Overdue dots |
| `status.error.text` | red-600 @ 70% | — | "✗ Rejected" lines |
| `status.info.dot` | `#60A5FA` | 96 165 250 | In-progress dots |
| `status.info.text` | `#2563EB` | 37 99 235 | "→" log lines |
| `status.muted` | `#9CA3AF` / `#6B7280` | — | Mono comments / outputs |

**Usage guidelines**

- Status colors appear only at *small scale*: 5–6px dots, 8–12px mono text,
  1.5px progress bars, thin chips. Never fill a card or button with them.
- Emerald is the only status color allowed as an accent outside data surfaces
  (canvas pulses, CTA bar field) — and only at ≤ 20% alpha.
- Primary/secondary brand colors **are** the ink ramp; there is no blue/green
  "brand" button. Do not add one.

### 2.4 Accessibility & contrast

- `#111` on `#F5F4F0`: **17.6:1** — passes AAA. Use for all headlines.
- `black/55` (≈ `#6F6F6D` effective): ≈ 5.4:1 — passes AA for body.
- `black/45` (≈ `#878683` effective): ≈ 3.9:1 — passes AA **only for large
  text (≥ 18.66px bold / 24px)**. ⚠️ It is used at 14px for body copy:
  acceptable for marketing copy by deliberate style choice, **[ASSUMPTION:
  accepted risk]** but for dashboards/products use `black/55`+ for any text
  the user must read to operate the product.
- `black/35` and below: decorative/caption only — never for instructions.
- Status dot colors fail contrast on white; they are always paired with a text
  label (`submitted`, `overdue`) — keep that pairing mandatory.
- Focus: currently browser-default outlines plus `focus:border-black/25` on
  inputs. **Recommended standard:** add a visible `outline: 2px solid
  rgba(17,17,17,0.4)` on `:focus-visible` for all interactive elements.

---

## 3. Typography System

### 3.1 Families (loaded in `app/layout.tsx` via `next/font`)

| Token | Family | Weights | Role |
|---|---|---|---|
| `font.display` | IBM Plex Sans | 300, 400, 500, 600 | Hero H1, hero stats, big numerals, regulation names |
| `font.sans` | Geist Sans | variable | Default body & headings (`--font-sans`) |
| `font.mono` | Geist Mono | variable | Code/log/data surfaces (`--font-mono`) |
| `font.pixel` | Courier Prime | 400, 700 | Wordmark, eyebrow labels, plan names (`.font-pixel`) |

⚠️ **Inconsistencies:**
1. The navbar sets `fontFamily: system-ui` inline instead of Geist (inherited
   template quirk). **Canonical: Geist (`font-sans`)** — visually near
   identical; remove the inline override on next touch.
2. `live-table.tsx` uses raw `fontFamily: "monospace"` while
   `how-it-works.tsx` uses the `font-mono` (Geist Mono) class. **Canonical:
   Geist Mono everywhere.**

### 3.2 Scale & hierarchy (extracted)

All display/heading text is `font-light` (300), `tracking-tight`,
`leading-[1.0–1.05]`. Bold weights are never used for headings.

| Level | Classes (responsive) | Px | Notes |
|---|---|---|---|
| Display / H1 (hero) | `text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light leading-[1.0] tracking-tight` | 48→96 | IBM Plex Sans, manual `<br/>` line breaks |
| H2 section | `text-4xl md:text-5xl font-light tracking-tight leading-[1.05]` (+`lg:text-6xl` for marquee sections) | 36→48(→60) | Rendered via `BlurHeading`, 2 lines max |
| H3 card title | `text-xl`–`text-2xl font-light` | 20–24 | White cards |
| H3 small card | `text-lg font-light` | 18 | Trigger/feature cards |
| Big numeral | `text-4xl`/`text-5xl font-light` (IBM Plex) or mono `clamp(3rem,6vw,5rem)` w300 | 36–80 | Stats, cost band, live counter |
| Body | `text-sm text-black/45 leading-relaxed` | 14/1.625 | Default paragraph |
| Lead body | `text-base text-black/40 leading-relaxed` | 16 | Next to large headings |
| Label / eyebrow | `text-[11px] tracking-widest` (+uppercase) | 11 | TagBadge, stat labels |
| Pixel label | `font-pixel text-[10–11px] tracking-widest`–`[0.25em]` | 10–11 | Wordmark `tracking-[0.25em]`, column titles `[0.2em]` |
| Caption | `text-xs text-black/35 tracking-wide` | 12 | Footnotes, footer |
| Button | `text-sm tracking-widest` UPPERCASE | 14 | All CTAs; navbar variant `text-[11px]` |
| Data mono | 7.5–12px, `letterSpacing 0.16em` for table headers | — | Tables, logs, mock UIs |

### 3.3 Letter-spacing tokens

`tracking-tight` (headings) · `tracking-wide` (captions/links) ·
`tracking-widest` (labels, buttons) · `0.16em` (mono table headers) ·
`0.2em` (footer column titles) · `0.25em` (wordmark).

### 3.4 Responsive behavior

Headings step down one Tailwind size per breakpoint (see table). Body sizes do
**not** change across breakpoints. Hero stat values: `text-3xl sm:text-4xl`.

---

## 4. Spacing System

Base unit: **4px** (Tailwind default scale; no custom spacing configured).

| Token | Value | Usage |
|---|---|---|
| `space.section-y` | `py-32` (128px) | Every page section, top & bottom |
| `space.section-x` | `px-6 md:px-12 lg:px-20` (24/48/80px) | Section gutters |
| `space.heading-gap` | `mb-16` (64px) | Section header block → content |
| `space.card-pad` | `p-8` (32px); `p-10` for banner cards | Card interiors |
| `space.panel-pad` | `p-6` (24px) | Sub-panels, step buttons |
| `space.mini-pad` | `p-3` (12px) | Mock-UI mini cards |
| `space.card-gap` | `gap-3` (12px) | All card grids |
| `space.col-gap` | `gap-8` / `gap-12` / `gap-20` | 2-col editorial layouts |
| `space.stat-gap` | `gap-8 sm:gap-12` | Stat rows |
| `space.eyebrow-stack` | icon `→ mt-4` badge `→ mt-5` heading `→ mt-6` body | Section header rhythm |
| `space.footer-y` | `pt-16 pb-10` | Footer |

Internal card rhythm: icon box `mb-5/6` → title `mb-2/3` → body; metadata rows
`space-y-2` to `space-y-4`.

---

## 5. Grid & Layout System

| Token | Value |
|---|---|
| `container.section` | `max-w-6xl mx-auto` (1152px) — default for all sections |
| `container.pricing` | `max-w-5xl` (1024px) |
| `container.narrow` | `max-w-3xl` (768px) — navbar width, pull quotes |
| `container.cta` | `max-w-2xl` (672px) — centered CTA copy |
| `container.hero-text` | `max-w-4xl`, with paragraph capped `max-w-md` |
| `container.side-copy` | `max-w-xs` (320px) — right-aligned section lead-ins |

**Grid structure**

- Card grids: `grid grid-cols-1 md:grid-cols-{2,3,4} gap-3`, or the 12-col
  variant `grid-cols-12` with `col-span-12 md:col-span-4`.
- Editorial splits: `grid lg:grid-cols-2 gap-20 items-center` (live section) or
  `lg:grid-cols-3` with `lg:col-span-2` content panel (how-it-works, FAQ).
- Everything is single-column below `md`.

**Breakpoints** (Tailwind v4 defaults — no customization):
`sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 (unused) · mobile-first.

**Layout rules**

- Sections always: full-bleed background → gutter padding → centered max-width
  container → optional `border-t border-black/[0.06]` separator.
- The hero is `h-screen` with content absolutely anchored bottom-left.
- Sticky stack cards: `position: sticky; top: 80px + 16px·i; z-index: 10+i`.
- Navbar floats: `fixed top-4`, centered, `max-w-3xl`, `z-50`.

---

## 6. Radius System

| Token | Value | Usage |
|---|---|---|
| `radius.sm` | `rounded-lg` (8px) | Icon chips inside panels, log rows, mobile menu items |
| `radius.md` | `rounded-xl` (12px) | **Buttons, inputs, icon boxes, mini panels, code wells** |
| `radius.lg` | `rounded-2xl` (16px) | **Cards, navbar, table frames, step buttons** |
| `radius.full` | `rounded-full` | Pills/badges, status dots, progress bars |

Rule of thumb: container = 16, control = 12, micro-element = 8, indicator =
full. No other radii exist; do not add `rounded-3xl` or sharp corners.

---

## 7. Shadow & Elevation System

Elevation is **border + background first, shadow second**. All shadows are
black at ≤ 8% alpha.

| Token | Value | Used by |
|---|---|---|
| `shadow.nav` | `0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)` | Floating navbar (highest elevation in system) |
| `shadow.float` | `0 8px 24px rgba(0,0,0,0.05)` | Mock-UI mini cards |
| `shadow.panel` | `0 1px 3px rgba(0,0,0,0.04–0.06)` | Active step buttons, content panels |
| `shadow.rest` | `0 1px 2px rgba(0,0,0,0.03)` | Inactive step buttons |
| `shadow.glow-success` | `0 0 6px #4ADE80` | Live status dots only |

**Layer hierarchy (z-index tokens)**

| Token | Value | Layer |
|---|---|---|
| `z.splash` | 100 | Splash screen |
| `z.nav` | 50 | Navbar |
| `z.content` | 30 | Hero foreground text |
| `z.overlay` | 10 | Gradient/blur scrims, card inner content |
| `z.stack` | 10 + i | Sticky card stacks |
| `z.base` | 0 | Canvas/video backgrounds |

Modals/dropdowns don't exist yet. **Recommended:** modals at `z-[90]` with
`shadow.nav` and a `rgba(245,244,240,0.6)` + 16px blur backdrop;
dropdowns at `z-[60]` with `shadow.nav`.

---

## 8. Motion System

### Easing tokens

| Token | Curve | Role |
|---|---|---|
| `ease.signature` | `cubic-bezier(0.16, 1, 0.3, 1)` | **Every entrance** — fades, blur-ins, rises, panel swaps, stack scaling (×15 in code) |
| `ease.exit` | `cubic-bezier(0.4, 0, 1, 1)` | Splash letter exit (accelerating out) |
| `ease.curtain` | `cubic-bezier(0.76, 0, 0.24, 1)` | Splash curtain lift |
| `ease.linear` | `linear` | Marquees, progress bars |
| `ease.standard` | `ease` / `ease-in-out` | Color/border micro-transitions, accordions |

### Duration tokens

| Token | Value | Role |
|---|---|---|
| `duration.micro` | 200ms | Hover color/border/arrow shifts |
| `duration.swap` | 220–300ms | Panel content swap (blur 6px + 6px rise), accordion 400ms |
| `duration.exit` | 450ms | Outgoing elements |
| `duration.enter` | 700ms | Card rise-in (`translateY(28px)→0`), word blur-in |
| `duration.hero` | 900–1000ms | Hero element entrances |
| `duration.cinematic` | 1300–2000ms | Splash curtain, hero canvas scale (0.88→1.02) |

### Stagger tokens

80ms between words (`BlurHeading`) and between sibling cards (delays 0/80/140/
200ms); 90ms splash letters in, 55ms out; 120ms+80i hero stats.

### Canonical effects

- **Blur-in entrance:** `opacity 0→1, blur(8–16px)→0, translateY(12–28px)→0`
  with `ease.signature`. This is the brand's signature move.
- **Mouse glow:** 400px radial `rgba(0,0,0,0.03)` following cursor via
  `--mouse-x/--mouse-y`, fading in 500ms on group hover.
- **Live keyframes** (`globals.css`): `marqueeLeft` 28s / `marqueeRight` 22s
  (−33.333% loop), `fadeInUp` 0.5s, `rowSlideIn` 0.4s, `statusPulse` 2s,
  `barBreathe` 5–8s.
- **Scroll reveal:** `IntersectionObserver` thresholds 0.1 (cards) / 0.2
  (headings); animate once, then disconnect.

### Usage guidelines

- Never animate `width/height/margin` on hover; only `color`, `border-color`,
  `background`, `transform`, `opacity`, `filter`.
- Long ambient loops (marquee, pulse, breathe) must be subtle (opacity ≤ 0.65,
  scale ≤ 1.12) and `aria-hidden`.
- `prefers-reduced-motion: reduce` collapses all animation/transition to
  0.01ms and disables smooth scroll (implemented globally in `globals.css`) —
  keep this in every future surface.
