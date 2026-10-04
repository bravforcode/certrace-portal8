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

## Search visibility

What the code already does, on every build:

- **`app/sitemap.ts` → `/sitemap.xml`** — all 14 static routes plus every CBAM
  guide, event and update, each with the date its own content was last touched.
- **One URL per language for the guides and updates** (`lib/locales.ts`) —
  `/about-cbam` and `/updates` and everything under them are also served at
  `/th/…`, `/vi/…`, `/tr/…` and `/hi/…` (`app/[lang]`), rendered on the server
  in that language. English keeps the bare addresses. Each version has its own
  canonical, names the others with hreflang (in the `<head>` and the sitemap),
  and sends `Content-Language`. Every other page is still one URL whose
  language is the reader's stored choice. Titles and descriptions come from
  `lib/localized-meta.ts`, shared by the English and prefixed routes.
- **`app/robots.ts` → `/robots.txt`** — open to everything, answer engines
  included. See the caveat below: Cloudflare can add rules of its own on top.
- **Canonicals** — one per route, absolute, resolved from `metadataBase` in
  `app/layout.tsx`, which reads `SITE_URL` in `lib/site.ts`. That constant is
  the only place the public origin is written.
- **Open Graph / Twitter cards** — `public/brand/og-cover.png` (1200×630) is the
  site-wide card; event and update pages send their own photograph instead.
  NOTE: a route that declares `openGraph` at all **replaces** the root block
  rather than extending it, so any new route that sets one must name an image.
- **Structured data** (`components/json-ld.tsx`) — Organization and WebSite on
  every page, plus FAQPage + SoftwareApplication on the homepage, Article +
  FAQPage on each guide, Event on each event, NewsArticle on each update, and
  a breadcrumb trail on all three detail routes.
- **Titles** — the root layout carries a `"%s — Certrace"` template, so a route
  sets its own bare name (`"Pricing"`) and never repeats the brand. The
  template reaches direct children only; the `[slug]` routes therefore set an
  absolute title of their own.

What no amount of code can do, and has to be done once by hand:

1. **Google Search Console** — add `https://certrace.co` as a domain property,
   verify by DNS TXT in Cloudflare (or set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
   and redeploy), then submit `https://certrace.co/sitemap.xml`. Nothing
   reports on indexing until this exists. Bing Webmaster Tools is the same job
   with `NEXT_PUBLIC_BING_SITE_VERIFICATION`, and can import from Google.
2. **Check Cloudflare's managed robots.txt.** The live `/robots.txt` currently
   serves a Cloudflare-injected block ahead of ours that carries
   `Disallow: /` for GPTBot, ClaudeBot, CCBot, Google-Extended,
   meta-externalagent and Bytespider. That is a dashboard setting
   (AI Crawl Control / robots.txt managed content), not this repo, and it is
   the opposite of what `app/robots.ts` intends: the guides are written to be
   quoted by answer engines. Decide it deliberately, in the dashboard.
   `Google-Extended` does not affect ordinary Google Search ranking; `GPTBot`
   and `ClaudeBot` decide whether ChatGPT and Claude can read the site.
3. **Links from sites that already rank.** Everything above makes the site
   legible; it does not make it authoritative. The listings worth having are
   the ones an exporter searching for CBAM help already lands on — trade
   associations, TGO/BOI/DITP directories, university and event pages that
   list us as a participant (the `/events` entries are real, so ask each
   organiser for the link).
