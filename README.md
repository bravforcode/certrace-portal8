# Certrace — Exporter Portal (MVP)

Frontend + UX/UI MVP for the **Certrace** exporter portal. Built strictly on the
**Certrace design system** (ink-on-bone, light-mode only, status-color-only).

> Certrace is carbon-compliance workflow infrastructure for exporters. This
> portal is the **exporter** surface: collect verified supplier data → calculate
> embedded emissions → check compliance → get legal / verifier sign-off (seats) →
> generate an audit-ready package → submit it to the buyer and the authority. It
> replaces the manual "email the report to the buyer and the CBAM registry"
> handoff entirely.

## Launch posture (this MVP)

Certrace launches on the obligation that bites first: **CBAM**, for **steel & iron**
exporters from **Thailand** into the **EU**.

- **CBAM is the only live regulation.** EUDR, CSRD, Scope 3 and UK CBAM render as
  **coming soon** with a working "notify me" waitlist — never a dead end.
- **Steel & iron is the only open CBAM sector.** Aluminium, cement, fertilisers,
  hydrogen and electricity are disabled (locked) with a "notify" path.
- **Pricing is real.** Three plans (Starter / Growth / Scale), monthly ↔ annual
  toggle, and a full upgrade → checkout → receipt flow. Suppliers are always free.

All gating lives in [`lib/config.ts`](lib/config.ts) via `available` flags — flip
one boolean to open a regime, sector or country. No new UI required.

## Run locally

```bash
cd ~/certrace-portal
npm install
npm run dev
```

Open http://localhost:3000 → redirects to `/login` (credentials pre-filled — just sign in).

## The golden path (every button clicks through to the last screen)

1. `/login` → sign in
2. `/dashboard` → overview, priority alert, live supplier feed, working notifications bell
3. `/declarations/new` → 5-step wizard (regulation → route → scope → suppliers → review).
   Only CBAM + Steel are selectable; everything else is coming-soon with a notify path.
4. `/declarations/cbam-2026-q2-steel` → the **workflow**, step by step:
   - **Collect** → chase suppliers (remind / remind-all)
   - **Calculate** → embedded emissions (run calculation)
   - **Compliance** → real-time gap detection
   - **Sign-off** → invite legal/verifier **seats**, request & receive sign-off
   - **Report** → generate the audit-ready package (**downloadable** HTML → Print to PDF)
   - **Submit** → route to EU buyer + CBAM authority + verifier
   - **Receipt** → final confirmation (submission reference, delivery receipts, **download**)
5. `/billing` → plans, billing-cycle toggle, upgrade → checkout → success + invoices (downloadable)
6. `/suppliers` → directory + **Add supplier** invite modal (copy guided-form link)
7. `/s/demo-token` → the supplier's free, no-account guided form (the other side of collection)

Plus: `/reports` (re-downloadable packages), `/team` (seats), `/regulations` (coverage), `/settings`.

## What's new vs the previous version

- **Certrace** naming throughout; **logo pixel-glyph reads "C"** (5×5 grid).
- **CBAM-only / steel-only gating** with coming-soon + waitlist everywhere a user could pick.
- **Real pricing & checkout** ([`app/(portal)/billing`](app/(portal)/billing/page.tsx)).
- **Real file downloads** — packages and invoices generate actual files
  ([`lib/download.ts`](lib/download.ts)).
- **Toast system** ([`components/toast.tsx`](components/toast.tsx)) and a working
  **notifications panel** so no action is a dead end.
- Realistic mid-2026 CBAM data: steel-only supply chain, consistent deadlines.

## Architecture

| Path | Purpose |
|---|---|
| `app/globals.css` | Design-system tokens, motion, base styles |
| `app/layout.tsx` | Brand fonts (IBM Plex Sans / Geist / Geist Mono / Courier Prime) |
| `lib/config.ts` | Regulations, jurisdictions, markets, sectors, **plans** — the scalability backbone |
| `lib/data.ts` | Mock fixtures (the seam where a real API slots in) |
| `lib/download.ts` | Client-side audit-ready package / invoice generation |
| `components/ui.tsx` | Design-system primitives (Card, Button, Chip, StatusDot, …) |
| `components/toast.tsx` | Lightweight toast feedback |
| `components/portal-shell.tsx` | Sidebar + topbar + country switcher + notifications |
| `components/declaration-workflow.tsx` | The end-to-end compliance flow |
| `app/(portal)/*` | Authenticated exporter screens |
| `app/s/[token]` | Public supplier guided form |

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · lucide-react.
Frontend only — all data is mocked. No backend, no auth provider, no database.
