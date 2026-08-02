# Build Prompt — Certrace Exporter Portal (Frontend / UX-UI MVP)

> Copy everything in the box below into Claude (Claude Code, in the Certrace
> project). It is self-contained but also points to the real files so the agent
> can read source rather than guess.

---

````
ROLE
You are a Principal Product Designer + Staff Front-End Engineer (a "design
engineer") who has shipped enterprise B2B SaaS and vertical RegTech/compliance
portals — multi-tenant, multi-locale, role-based, audit-grade. You think in
information architecture, state machines, and design tokens before pixels. You
write production-quality React/TypeScript and you treat an existing design
system as law, not inspiration. You are also pragmatic about MVP scope: this is
a FRONT-END + UX/UI build only (mock data), but it must look and behave like a
real product we could put in front of a CFO next week.

MISSION
Design and build the **Certrace Exporter Portal** — the authenticated web app an
exporter logs into to run carbon-compliance filings end to end. Not the
marketing site (that already exists). The logged-in product.

Before writing a single component, do PHASE 0 (analyze + propose) and wait for
my go-ahead. Then build.

────────────────────────────────────────────────────────
STEP 1 — READ AND INTERNALISE THESE SOURCES (do not skip)
────────────────────────────────────────────────────────
1. Pitch deck: ~/Downloads/certrace-pitch-deck_1.html  (19 slides — the problem,
   the journey, ICP, pricing, GTM, expansion, network effects).
2. Roadmap: ~/Downloads/certrace roadmap.html (phase sequencing, milestones).
3. Landing page (the product's visual voice, already built):
   ~/certrace-landing/app/page.tsx and ~/certrace-landing/components/*.tsx
4. THE DESIGN SYSTEM — this is binding. Read all of:
   ~/certrace-landing/docs/design-system/
     • design-tokens.json            (canonical values — when in doubt, this wins)
     • DESIGN_SYSTEM.md
     • COMPONENT_LIBRARY.md
     • UI_PATTERN_LIBRARY.md
     • FUTURE_DESIGN_INSTRUCTIONS.md  (esp. the dashboard/admin guidance)
     • DESIGN_SYSTEM_AI_CONTEXT.md
   Reuse the actual components (AnimateCard, TagBadge, BlurHeading, PixelIcon,
   the live-table recipe, status grammar, etc.) and the token values. Do NOT
   invent new colors, radii, type scales, or motion curves.

────────────────────────────────────────────────────────
STEP 2 — THE PROBLEM, STATED PLAINLY (so your UX solves the RIGHT thing)
────────────────────────────────────────────────────────
A mid-size Thai steel/aluminium exporter (฿100M–1B revenue, no ESG team, CFO/
Head of Export Ops as the buyer) must file carbon data for CBAM every quarter.
Today that means 10–19 weeks and ฿370–770K of manual work to chase 10–50
suppliers who reply in 200 different formats over email/WhatsApp/Excel — and the
report is STILL often late and rejected ("LATE = REJECTED"). The painful journey
is 6 steps: (1) decode the regulation & scope fields, (2) hunt every supplier
one by one, (3) chase non-responders, (4) consolidate the mess, (5) calculate
the carbon number, (6) prepare the verifier package. Certrace collapses this to
3–5 days.

The portal must make each painful step feel calm, tracked, and inevitable:
  Decode → "Create Filing" wizard (Smart Request Builder)
  Hunt   → one-click structured supplier invitations
  Chase  → automatic reminders + a live completion dashboard
  Pile-up→ structured, source-attributed submissions (no consolidation)
  Calc   → traceable tCO₂e calculation with an audit trail
  Handoff→ assemble an audit-ready package and ROUTE IT (see governance below)

────────────────────────────────────────────────────────
STEP 3 — NON-NEGOTIABLE PRODUCT TRUTHS (bake these into the architecture)
────────────────────────────────────────────────────────
A. SCALABLE BY DESIGN — Thailand is the proof, not the destination. Architect
   the front end so we expand without rewrites:
   • REGULATION AS CONFIG. Build a "regulation registry": each regulation
     (CBAM, EUDR, CSRD, Scope 3, UK-CBAM) is a typed config object that drives
     the request form schema, required fields, gap/validation rules, the
     readiness checklist, and the export-package template. Adding a regulation =
     adding a config entry, never editing screens. Ship CBAM fully + at least
     one more (EUDR) stubbed to prove the abstraction.
   • JURISDICTION/COUNTRY LAYER. TH → VN → ID → MY. A jurisdiction carries:
     locale + language, currency (฿ / ₫ / Rp / RM), emission-factor set, and the
     list of accepted verifier bodies (SGS, TÜV, Bureau Veritas, TGO/อบก., …).
   • i18n FROM DAY ONE. All copy through an i18n layer (e.g. next-intl) with
     EN + TH provided, and VI/ID keys scaffolded. No hard-coded user-facing
     strings. Number/date/currency formatting is locale-aware.
   • MULTI-TENANT + RBAC mindset even though auth is mocked.

B. THE LEGAL-SEAT GOVERNANCE MODEL — read this twice, it is the crux.
   The exporter CANNOT unilaterally "export" or "file" the final report. The
   exporter ASSEMBLES the audit-ready package, then must ROUTE it to a
   Legal/Compliance reviewer (internal team member OR an external law firm),
   who holds review/sign-off authority before it ever reaches a Verifier. This
   is deliberate separation of duties — a feature conservative buyers trust —
   and it is also our growth loop (a law firm given one client seat brings its
   other exporter clients; on-platform legal access raises switching costs).
   Implement it explicitly in the UX:
   • The primary terminal action on a finished package is "Route for Review"
     (NOT a download/export button). Direct export is disabled/locked for the
     Exporter role, with a clear, non-punitive explanation of why.
   • "Add Seat" flow: the exporter invites a collaborator to a SEAT with a
     scoped role — Viewer, Reviewer, or Sign-off (internal Legal/Compliance, or
     external Law Firm, or Verifier/Auditor). Show seat usage vs plan limits.
   • A package moves through a visible state machine:
     Draft → Collecting → Data Complete → Calculated → Assembled →
     In Legal Review → (Changes Requested ↺ back to Exporter | Approved) →
     With Verifier → Filed.
     Render this as a status timeline; gate actions by role and state.
   • Legal/Reviewer can leave comments, request changes (bounces back to the
     exporter with a reason), or sign off. Build the Legal reviewer's read-only-
     plus-approve view as part of the MVP (same shell, role-scoped).
   • Map to pricing reality: Starter = no extra seats; Standard = 1 auditor/
     legal seat; Enterprise = legal-network sign-off access. Surface this where
     seat limits bite.

C. SHOW, DON'T TELL. Like the landing page, prove the product with living data:
   completion counters, status dots, reminder activity, calculation trails,
   readiness percentages. Use realistic Thai exporter/supplier fixtures (Siam
   Yamato, Thai Metal Pro, BKK Alu Works, Rayong Steel Co, etc.).

────────────────────────────────────────────────────────
STEP 4 — SCOPE: SCREENS FOR THE MVP (frontend only, mock-data-backed)
────────────────────────────────────────────────────────
Build an authenticated app shell (left sidebar nav, white, border-r hairline,
canvas-coloured content area — per the dashboard guidance in
FUTURE_DESIGN_INSTRUCTIONS.md; NO splash/marquee inside the app; instant loads
with skeletons, not blur-in reveals).

Primary (Exporter role) screens:
 1. Onboarding (first-run): company, jurisdiction/country, industry, primary
    regulation, locale — feeds defaults everywhere.
 2. Home / Dashboard: active filings, next deadlines, overall completion, a
    "needs your attention" queue (overdue suppliers, changes requested by
    legal), recent activity.
 3. Filings: list + the "Create Filing" wizard (Smart Request Builder — pick
    regulation + industry + period → auto-generated field schema preview →
    select suppliers → send).
 4. Filing Detail with tabs:
      • Suppliers — invite, track, send/auto reminders, statuses
        (submitted / in progress / reminder sent / overdue).
      • Submissions / Data — review structured responses, see gaps & flags.
      • Calculation — tCO₂e figures, methodology reference (IPCC/GHG Protocol),
        audit trail.
      • Package — assemble, completeness checklist, and the "Route for Review"
        action + review timeline.
 5. Suppliers directory (across all filings) + supplier profile drawer.
 6. Reviews / Approvals: packages in legal review, their state, comments,
    changes-requested loop.
 7. Team & Seats: members, roles, "Add Seat" (internal + external law firm +
    verifier), seat usage vs plan.
 8. Settings: organisation, jurisdiction & regulations enabled, language/locale,
    notifications.
 9. The Legal/Reviewer role view (role-scoped reuse of the shell): inbox of
    packages to review, package viewer, comment / request-changes / sign-off.

Every screen needs its empty, loading (skeleton), and error states, plus a
zero-data first-run state. Make it responsive (sidebar collapses to a drawer
below md; tables reflow) and keyboard-accessible.

────────────────────────────────────────────────────────
STEP 5 — DESIGN-SYSTEM ADHERENCE (hard rules, summarised; full detail in docs)
────────────────────────────────────────────────────────
• Canvas #F5F4F0; white hairline-bordered cards (border rgba(0,0,0,0.06–0.07),
  radius 16; controls radius 12; pills full). Light mode only.
• Text = ink #111 opacity ramp. In-app/functional text minimum black/55 (NOT
  black/45 — that's marketing prose only). Add the visible :focus-visible ring
  (2px ink-40%) the audit flagged as missing.
• Type: IBM Plex Sans / Geist Light (300) headings, sentence case; Geist body;
  Geist Mono for all data/tables/IDs/figures; Courier Prime for the wordmark and
  small UPPERCASE labels. Use the documented scale; data tables at 12–13px.
• Colour is STATUS ONLY, at small scale: emerald = done/verified, amber =
  pending, red = overdue/rejected/changes-requested, blue = in progress. Always
  dot + text label, never colour alone. Emerald may accent ambient art ≤20%.
• Buttons: primary = #111 fill / white / hover #333; secondary = outline; ghost
  = arrow link. One primary per region.
• Elevation via border + background shift; shadows only from the token set
  (shadow.nav for overlays/modals, etc.). Tables/logs follow the
  LiveSupplierTable recipe; reuse it for supplier and review tables.
• Motion: entrances via cubic-bezier(0.16,1,0.3,1); but INSIDE the app keep it
  restrained and fast — skeletons + 200ms micro-transitions; reserve the
  signature blur-in for first paint / route transitions only. Honour
  prefers-reduced-motion (already global).
• Status grammar from the design system: ✓ green / ● amber / → blue / ✗ red.

────────────────────────────────────────────────────────
STEP 6 — TECH & ARCHITECTURE
────────────────────────────────────────────────────────
• Same stack as the landing page: Next.js 15 (App Router) + React 19 +
  TypeScript + Tailwind CSS v4. Reuse the existing globals.css tokens/keyframes.
• Build as a NEW app/route space (e.g. an /app(portal) route group or a sibling
  `certrace-portal` package — propose which in Phase 0). Share the design-system
  primitives; do not fork them.
• FRONT-END ONLY but architected for a real backend later:
  - All data behind typed service interfaces (e.g. FilingService,
    SupplierService, SeatService) with in-memory/fixture implementations. A real
    API can later replace the impl without touching components.
  - Strong TypeScript domain types: Regulation, Jurisdiction, Filing,
    FilingStatus (the state machine), Supplier, Submission, Seat, Role,
    ReviewAction, etc.
  - Regulation registry + jurisdiction registry as the config layer described
    above.
• No real auth, payments, or true carbon-calc accuracy — mock convincingly and
  label internally as stubbed. Don't fake data security claims in UI copy.

────────────────────────────────────────────────────────
STEP 7 — HOW TO PROCEED
────────────────────────────────────────────────────────
PHASE 0 — ANALYSE & PROPOSE (no app code yet). Deliver, in chat or a short
   /docs/portal/ markdown:
   (a) A crisp problem→solution restatement proving you understood the journey.
   (b) Information architecture / sitemap + navigation model.
   (c) User roles & permission matrix (Exporter, Internal Legal, External Law
       Firm, Verifier, Admin) × actions × filing states.
   (d) The Filing lifecycle STATE MACHINE diagram (states + transitions +
       who can trigger each), explicitly including the legal-routing /
       changes-requested loop and the locked-direct-export rule.
   (e) The regulation-config + jurisdiction-config schema (the scalability
       layer), with CBAM filled and EUDR stubbed.
   (f) i18n approach and the seat/RBAC model.
   (g) A screen-by-screen build order and which design-system components each
       reuses.
   Then PAUSE for my approval.

PHASE 1+ — BUILD after approval: scaffold the app + design-system primitives +
   types/services/registries first, then screens in your proposed order. After
   each meaningful slice, run it and self-verify in the browser (layout,
   states, responsive, keyboard/focus, console clean) and show me proof — never
   ask me to check manually.

GUARDRAILS
• Don't rebuild the marketing site. Don't restyle the design system.
• Don't introduce new design tokens, fonts, colours, radii, or motion curves.
• Don't claim real security/encryption/auth in UI copy for mocked features.
• If you must assume something not in the sources, label it ASSUMPTION and keep
  going — don't stall on me for low-stakes choices.
• Optimise for "a CFO believes this is real software" + "a second dev can swap
  in a backend without touching the UI."

Start with PHASE 0.
````

---

## How to use this

1. Open Claude Code inside the Certrace project and paste the box above.
2. It will first hand you an IA / roles / state-machine / config-schema proposal
   (Phase 0) — review and correct it before any code is written. That gate is
   deliberately built in so the architecture is right before pixels.
3. Then it builds the portal screen-by-screen on the existing design system.

## Decisions I baked in (change these if you disagree)

- **Senior persona** = "Principal Product Designer + Staff Front-End / design
  engineer with RegTech / multi-tenant portal experience." Swap if you'd rather
  frame it as Head of Design or VP Eng.
- **The legal model** is encoded as the literal crux: the Exporter *assembles*
  but cannot directly export/file — the terminal action is **Route for Review**,
  and **Add Seat** invites internal Legal, external law firms, or verifiers with
  scoped roles, tied to the Starter/Standard/Enterprise seat limits from your
  deck. This is treated as both governance (separation of duties) and your
  network-effect growth loop.
- **Scalability** is forced through three abstraction layers — *regulation as
  config*, *jurisdiction/country layer*, *i18n from day one* — with CBAM built
  and EUDR stubbed to prove the pattern, so TH → VN → ID → MY is config, not a
  rewrite.
- **Frontend-only, but backend-ready**: typed service interfaces with fixture
  implementations, so a real API drops in later without touching components.
- A **Phase 0 analyze-and-propose gate** before coding, because you asked it to
  "analyze deep" first — this guarantees that happens rather than jumping to UI.

Want me to also generate the **Supplier portal** and **Verifier/Auditor portal**
prompts as companions, or tighten this one toward a specific first screen (e.g.
the Create-Filing wizard) to kick off immediately?
