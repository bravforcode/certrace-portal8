# Certrace — Admin Console

Staff-only internal back office for running Certrace **across all customer orgs**
(exporters, suppliers, verifier partners). Cross-tenant counterpart to the
customer-facing `certrace-portal`. **Mock-data UX MVP** — no backend; the
permission model is demonstrated in the UI and must be enforced server-side in
production.

Spec: `certrace-portal/docs/ADMIN-CONSOLE-PLAN.md` (departments & roles §2,
access matrix §3, routes §4, principles §7).

## Run

```bash
npm install
npm run dev   # http://localhost:3000 → redirects to /admin/dashboard
```

Sign-in is persona-based (`/admin/login`): pick any staff member to see the
console through their department/role. The Super Admin persona sees everything;
try Fah Rattana (Support T1) or Ben Carter (Sales) for narrow views.

## What's here

- **9 role groups** (8 departments + Super Admin), 23 staff personas, 2–3 role
  tiers each — `lib/admin-data.ts`
- **RBAC** — dept × module access matrix + per-role powers; sidebar and every
  action button respect it (`lib/admin-auth.tsx`, `ModuleGuard`)
- **Modules**: Dashboard, Accounts (+detail w/ audited impersonation),
  Declarations monitor, Verification queue (assign/resolve), Regulatory master
  data (maker-checker draft→publish, self-approval blocked), Billing, Support
  tickets (+thread detail, internal notes, escalate/resolve), Staff & roles
  (directory + permission matrix), Audit log (fixtures + live actions),
  Announcements (publish), System (feature flags, integrations), Reports,
  Legal & privacy (DPAs, DSRs, retention), Settings
- **Audit-first**: every mutating console action appends an audit event
  (`lib/admin-store.ts`, localStorage overlay = the future API seam)
- **STAFF visual treatment**: dark top bar + `#3C7ACB` strip + "Staff ·
  Internal" tag — never mistakable for a customer portal

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · lucide-react.
Design system copied from `certrace-portal` (ink-on-bone, IBM Plex 300
headlines, Courier eyebrows, color = status only).
