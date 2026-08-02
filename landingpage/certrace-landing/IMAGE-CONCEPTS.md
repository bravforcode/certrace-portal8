# Certrace — Image & Visual Concepts

The original template's visual identity is built on **iridescent dichroic-glass
3D renders on a pale, warm-white studio background** (soft shadows, prismatic
caustics), combined with monochrome generative pixel/canvas art.

Every image in the template that represented the original startup has been
**replaced in code with self-contained generative visuals** (canvas animations
and CSS mock-UIs), so the site ships with zero stock assets. The concepts below
are the recommended AI-generated upgrades for each slot — all written to match
the template's glass-render art direction, re-themed for Certrace.

Shared style suffix for all prompts:

> `…rendered as translucent dichroic iridescent glass, pale warm-white studio
> background (#F5F4F0), soft diffuse shadows, prismatic rainbow caustics on the
> floor, minimal composition, high-key lighting, 3D render, 8k, no text`

---

## 1. Hero — Supply Chain Convergence

- **Current implementation:** animated canvas — supplier nodes routing data
  pulses into a single hub over a dotted grid (emerald + ink on bone).
- **Purpose:** instantly communicate "many suppliers → one platform" — the
  product thesis — before a word is read.
- **Composition:** wide 16:9; a loose constellation of small glass cubes
  (suppliers) on the left two-thirds, thin light-trails arcing toward one
  larger glass cube right-of-center; generous negative space bottom-left for
  the headline.
- **AI prompt:** "A scattered field of small floating glass cubes connected by
  thin glowing light trails converging into one larger central glass cube,
  subtle pale-green light refractions, top-down three-quarter view, …"
- **Placement:** `app/page.tsx` hero section, full-bleed background (replace
  `<HeroCanvas />`). Works as a looping video or still.

## 2. Module 01 — Data Collection

- **Current implementation:** CSS mock-UI: supplier request list with status
  dots, progress bars, auto-reminder line.
- **Purpose:** show structured collection replacing inbox chaos.
- **Composition:** square-ish; four glass envelopes/sheets flowing into a glass
  inbox tray, ordered in a neat row.
- **AI prompt:** "Four translucent glass envelopes gliding in a neat row into a
  minimal glass tray, motion implied by light streaks, …"
- **Placement:** `components/module-stack.tsx`, right half of Module 01 card.

## 3. Module 02 — Carbon Calculator

- **Current implementation:** CSS mock-UI: mono calculation trail ending in a
  verified tCO₂eq total.
- **Purpose:** raw activity data becoming verified emission figures.
- **Composition:** a cluster of small irregular glass shards passing through a
  glass prism and emerging as one polished glass sphere with a soft green core.
- **AI prompt:** "Irregular small glass shards entering a triangular glass
  prism and emerging as a single flawless glass sphere with a faint emerald
  glow at its core, …"
- **Placement:** module 02 card, right half.

## 4. Module 03 — Compliance Engine

- **Current implementation:** CSS mock-UI: CBAM readiness checklist with one
  amber gap flag.
- **Purpose:** gap detection before filing — "know where you stand".
- **Composition:** a glass shield or hexagon hovering above a grid of small
  glass tiles, one tile glowing amber, the rest calm green.
- **AI prompt:** "A translucent glass shield hovering over a neat grid of small
  glass tiles, one tile glowing soft amber among green-tinted tiles, …"
- **Placement:** module 03 card, right half.

## 5. Module 04 — ESG Reporter

- **Current implementation:** CSS mock-UI: export package file list + auditor
  access chip.
- **Purpose:** the finished, audit-ready artifact.
- **Composition:** a single perfect stack of glass documents with an embossed
  glass seal, presented like a product shot.
- **AI prompt:** "A pristine stack of thin glass documents with a circular
  embossed glass seal on top, presented centrally like a luxury product
  photograph, …"
- **Placement:** module 04 card, right half.

## 6. Final CTA — Rising Bars

- **Current implementation:** CSS field of breathing translucent bars
  (emerald/ink) with progressive blur — a direct re-interpretation of the
  template's glass-columns footer image as a carbon bar chart.
- **Purpose:** quiet, optimistic close — data settled into order.
- **Composition:** wide panoramic row of vertical glass columns forming a
  gentle bell curve, shot straight-on, occupying only the bottom third.
- **AI prompt:** "A panoramic row of slim vertical glass columns of varying
  heights forming a gentle bell curve, like a minimal bar chart sculpture,
  subtle green tint on every third column, …"
- **Placement:** `app/page.tsx` `CtaBarField` (replace the CSS bars with the
  image using the same mask + blur overlay treatment).

## 7. Open Graph / Social Card

- **Purpose:** link previews for sales outreach and investor decks.
- **Composition:** 1200×630; the hero glass-network render cropped to the hub,
  wordmark "CERTRACE" set in Courier Prime top-left, tagline beneath.
- **AI prompt:** reuse the hero prompt at 1200×630, hub positioned right.
- **Placement:** `app/opengraph-image.png` (Next.js convention).

---

### Kept from the template (design system, not content)

Generative pixel-canvas icons, dotted grids, marquee bands, progressive blur
masks, and gradient fades are part of the design language and were re-drawn
with Certrace-relevant glyphs (leaf, shield, globe, document, steps, signal) —
no original imagery, branding, or copy was carried over.
