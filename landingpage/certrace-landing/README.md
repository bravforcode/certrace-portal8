# Certrace — Landing Page

Carbon compliance infrastructure for exporters. Built with the design system
extracted from the `modern-agentic-landing` template: same typography, palette,
motion language, and component patterns — entirely new product, content, and
visuals.

## Stack

- Next.js 15 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 (PostCSS)
- Zero runtime dependencies beyond React/Next — all visuals are generative
  (canvas + CSS), no stock images

## Run

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # production build
```

## Design system (extracted from the template)

| Token | Value |
|---|---|
| Canvas | `#F5F4F0` (bone), cards `#fff` / `#faf9f7`, highlight `#F0EEE8` |
| Ink | `#111` with opacity steps (`black/45` body, `black/35` captions) |
| Accent | Emerald (status, success) + amber/red/blue status dots |
| Display | IBM Plex Sans 300, `tracking-tight leading-[1.05]` |
| Body | Geist Sans · Mono: Geist Mono · Labels: Courier Prime (`font-pixel`) |
| Radius | `rounded-2xl` cards, `rounded-xl` buttons/inputs, pill badges |
| Section | `py-32 px-6 md:px-12 lg:px-20`, `border-t border-black/[0.06]`, `max-w-6xl` |
| Motion | `cubic-bezier(0.16,1,0.3,1)`, blur+translate entrances, word-stagger headings |

## Signature components

- `splash-screen.tsx` — letter-by-letter CERTRACE intro with curtain lift
- `hero-canvas.tsx` — supplier-network convergence animation (replaces the
  template's hero video)
- `ui.tsx` — `TagBadge`, `BlurHeading`, `AnimateCard` + mouse-glow
- `pixel-icon.tsx` — animated canvas pixel icons (leaf, globe, shield, …)
- `module-stack.tsx` — sticky 3D card stack with CSS mock-UI product visuals
- `how-it-works.tsx` — auto-cycling step panel (platform activity log)
- `live-table.tsx` — live supplier submissions table + completion counter
- `marquee.tsx` — dual opposing marquee bands (regulations / industries)
- `faq.tsx` — accordion

See `IMAGE-CONCEPTS.md` for AI-image upgrade prompts per visual slot.
