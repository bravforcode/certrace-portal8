# Certrace Admin Console — Structure & Role Plan

Status: **planning doc, nothing implemented yet.** This defines what we would build,
not a build log. Written after auditing the current repo (see §0) — treat every
route/module below as a proposal, not a commitment, until confirmed.

## 0. What this is, and what it isn't

Certrace today ships two **customer-facing** surfaces inside this repo:

- **Exporter Portal** — dashboard, declarations, suppliers, team, billing, reports,
  regulations, settings. One logged-in exporter's world.
- **Supplier Smart Link** (`/s/[token]`) — the guided questionnaire a supplier fills
  out for one exporter's data request.

This doc specs a **third, staff-only surface: the Admin Console** — Certrace's own
internal back office for running the business *across all customer orgs*
(exporters, suppliers, verifier partners), not one tenant's settings page.

Explicitly **out of scope** / not to be confused with:

- The per-org **"Admin" role** already sketched in
  `docs/EXPORTER-PORTAL-REDESIGN.md` §10 — that Admin manages *one org's* users,
  approval-chain templates, and integrations. It stays as-is; this console is
  layered above it, not a replacement.
- The small `app/admin/{companies,periods,users}` stub in the separate
  `certrace-platform` repo (Prisma/RBAC backend). This doc **supersedes that stub**
  with a full department/role model — it should become the spec that repo's
  backend eventually implements, the same way `docs/EXPORTER-PORTAL-REDESIGN.md`
  drove real code changes here.

**Build approach:** same pattern used for the Supplier Portal — built *inside this
repo* as a new route group, mock-data-first (`lib/admin-data.ts` as the API seam:
multiple fixture orgs, staff users, tickets), same design system, staff session
kept fully separate from customer session.

---

## 1. Why a dedicated console (not just DB access)

Without this, "running the business" means someone with a SQL client manually
editing tenant data — no audit trail, no separation of duties, no way to let a
Support Agent look at a ticket without also being able to edit emission factors.
The console exists to give every department exactly the surface area its job
needs, nothing more, with every action logged.

---

## 2. Departments & roles

Nine groups: eight functional departments plus a narrowly-held Super Admin tier.
Each department gets 2–3 role tiers, cheapest/most-restricted first.

### 2.1 Executive / Leadership
| Role | Can do |
|---|---|
| **Exec Viewer** | Read-only company-wide KPIs (MRR/ARR, active orgs, compliance risk heatmap, churn) |
| **Exec Admin** | Everything Exec Viewer sees + org-wide policy settings, board-level financial exports |

### 2.2 Customer Success & Onboarding
| Role | Can do |
|---|---|
| **CS Associate** | View assigned accounts, onboarding checklist state, health score, hand off to Support |
| **CS Manager** | Reassign accounts across the team, set renewal-risk flags, escalate to Sales |
| **Head of CS** | Cross-portfolio analytics, edit onboarding playbooks/templates |

### 2.3 Compliance & Regulatory Affairs *(owns CBAM correctness)*
| Role | Can do |
|---|---|
| **Regulatory Analyst** | Draft changes to CN codes, emission factors, regulation text — draft only, cannot publish |
| **Regulatory Data Steward** | Approve/publish master-data changes (maker-checker — cannot approve their own draft), manage regulation version history |
| **Compliance Ops Manager** | Cross-tenant compliance-risk heatmap, regulator-inquiry responses, sets which regulations are "live" vs "waitlist" |

### 2.4 Verification & QA Operations
| Role | Can do |
|---|---|
| **Verifier Reviewer** | Internal QA queue: review AI-check flags, escalations, spot-audit exporter declarations |
| **QA Lead** | Assign reviewers, calibrate AI-check thresholds, approve escalation resolutions |
| **Verification Ops Manager** | SLA tracking, manages external verifier-partner org accounts |

### 2.5 Sales & Revenue Ops / Finance
| Role | Can do |
|---|---|
| **Sales Rep** | Read-only trial/prospect accounts + usage signals for upsell timing |
| **Revenue Ops Analyst** | Manage subscriptions/plans/invoices, dunning, discounts/credits |
| **Finance Controller** | Revenue reports, reconciliation, financial exports (no per-account edit rights) |

### 2.6 Engineering & Platform Ops
| Role | Can do |
|---|---|
| **Support Engineer** | Impersonate a tenant for debugging (fully audited + time-boxed), inspect logs, requeue jobs |
| **Platform Admin** | Feature flags, integrations/API keys, environment health, rate limits |
| **Security Admin** | Access-control config, audit-log review, incident response, break-glass revocation |

### 2.7 Legal & Data Privacy
| Role | Can do |
|---|---|
| **Legal Counsel** | Contract/DPA repository, liability holds, redaction requests |
| **Data Privacy Officer** | GDPR/data-subject request handling, retention-schedule enforcement, breach log |

### 2.8 Support / Helpdesk
| Role | Can do |
|---|---|
| **Support Agent (Tier 1)** | Ticket triage, canned responses, basic read-only account lookup |
| **Support Lead (Tier 2)** | Escalations, cross-department routing, macros/SLA configuration |

### 2.9 Super Admin *(cross-department, headcount kept intentionally tiny)*
Full override across every module, staff user/role management, break-glass
access with mandatory post-hoc justification logged. Every Super Admin action
is flagged distinctly in the audit log (not just logged — surfaced).

---

## 3. Module access summary (who touches what)

Condensed view — full action-level detail lives in each module's section (§5).
● = primary owner/admin rights · ◐ = act/approve within scope · ○ = read-only · — = no access

| Module | Exec | CS | Compliance | Verification | Sales/Finance | Engineering | Legal/Privacy | Support |
|---|---|---|---|---|---|---|---|---|
| Accounts | ○ | ● | ○ | ○ | ◐ | ◐ | ○ | ○ |
| Declarations Monitor | ○ | ○ | ◐ | ● | — | — | ○ | ○ |
| Verification Queue | ○ | — | ◐ | ● | — | — | — | — |
| Regulatory Master Data | ○ | — | ● | ○ | — | — | ○ | — |
| Billing / Subscriptions | ◐ | ○ | — | — | ● | — | — | — |
| Support Tickets | ○ | ◐ | — | — | — | ◐ | — | ● |
| Staff Users & Roles | ◐ | — | — | — | — | ◐ | — | — |
| Audit Log | ○ | — | ○ | ○ | ○ | ● | ○ | — |
| Announcements / CMS | ◐ | ○ | ● | — | — | ○ | ○ | ○ |
| Feature Flags / Integrations | ○ | — | — | — | — | ● | — | — |
| Analytics / Reports | ● | ◐ | ◐ | ◐ | ◐ | ○ | — | — |
| Legal / Privacy Requests | ○ | — | — | — | — | — | ● | — |

Super Admin = ● everywhere, not shown as its own column to keep the table readable.

---

## 4. Information architecture (route tree)

New route group, fully separate auth from the customer portals:

```
/admin/login                     staff SSO + 2FA (separate cookie/session from customer /login)
/admin/dashboard                 company-wide KPIs, risk heatmap, queue sizes, recent reg changes

/admin/accounts                  all tenant orgs — exporters, suppliers, verifier partners
/admin/accounts/[id]              org detail: profile, seats, declarations, billing, tickets,
                                   activity/audit trail, "Impersonate" (Support Engineer+)

/admin/declarations               cross-tenant declarations monitor (status, regulation, deadline)
/admin/declarations/[id]           read-mostly deep view, staff annotate-only

/admin/verification-queue         AI-flagged items, escalations, spot-audit assignments
/admin/verification-queue/[id]     reviewer workspace + resolution actions

/admin/regulatory-data             CN codes, emission factors, jurisdictions, default-value tables
/admin/regulatory-data/drafts       maker-checker: draft → approve → publish, version diff view

/admin/billing                     subscriptions/plans, invoices, usage metering, dunning

/admin/support                     ticket queue, SLA timers, macros, escalation routing
/admin/support/[ticketId]

/admin/staff                       staff directory: department, role, status, invite/deactivate
/admin/staff/roles                 role & permission-set editor (§2/§3 made configurable)

/admin/audit-log                   immutable event feed, filter by actor/module/org, export

/admin/announcements                compose customer-facing banners/release/regulation alerts,
                                    audience targeting (all / by plan / by jurisdiction)

/admin/system                      feature flags, integrations/API keys, environment health,
                                    email-template previews

/admin/reports                     adoption funnel, compliance-risk distribution, churn,
                                    verifier SLA performance

/admin/legal                       contract/DPA repository, data-subject request log,
                                    retention-schedule status

/admin/settings                    staff's own profile, 2FA, notification prefs
```

---

## 5. Module detail

### 5.1 Accounts (`/admin/accounts`)
Owner: CS. List all tenant orgs with plan tier, health score, seat count,
last-activity, open-ticket count. Detail page is the "single pane of glass" for
one org: who's on it, what they've filed, what they're paying, what they've
asked support about, and a fully-audited **Impersonate** action gated to
Support Engineer+ that time-boxes the session and stamps a visible banner in
the impersonated view.

### 5.2 Declarations Monitor (`/admin/declarations`)
Owner: Verification Ops / Compliance. Cross-tenant list of every declaration in
flight, filterable by regulation, risk flags, and deadline proximity — this is
how Compliance Ops spots a portfolio-wide problem (e.g. a CN code error hitting
every steel exporter at once) before it becomes ten separate tickets.

### 5.3 Verification Queue (`/admin/verification-queue`)
Owner: Verification & QA. Where AI-check criticals/escalations from the
exporter-side `lib/ai-check.ts` and `lib/compliance-intelligence.ts` land for
human review — reviewer assignment, resolution notes, SLA timer per item.

### 5.4 Regulatory Master Data (`/admin/regulatory-data`)
Owner: Compliance & Regulatory Affairs. The single source of truth for CN
codes, emission factors, jurisdiction/regulation coverage — today hardcoded in
`lib/config.ts`. **Maker-checker required**: a Regulatory Analyst drafts, a
different person (Regulatory Data Steward) publishes. Every publish creates a
new version with a diff, because every live exporter declaration depends on
these numbers being right.

### 5.5 Billing / Subscriptions (`/admin/billing`)
Owner: Revenue Ops / Finance. Plans, invoices, usage metering, dunning,
discounts. Sales gets read-only visibility into usage signals for upsell
timing; Finance Controller gets reporting/reconciliation without per-account
edit rights (segregation of duties on revenue recognition).

### 5.6 Support Tickets (`/admin/support`)
Owner: Support/Helpdesk. Tier 1 triages and resolves with macros; Tier 2
handles escalations and cross-department routing (e.g., a billing dispute
routes to Revenue Ops, a data-correctness complaint routes to Compliance).

### 5.7 Staff Users & Roles (`/admin/staff`)
Owner: Engineering/Platform Admin, approved by Exec/Super Admin for
department-head assignments. Directory of staff, their department + role
tier, invite/deactivate, and a role-permission editor that makes §2/§3
configurable rather than hardcoded.

### 5.8 Audit Log (`/admin/audit-log`)
Owner: Security Admin. Immutable, append-only feed of every mutating action
across every module (actor, before/after, reason, timestamp). This is the
module that makes every other module's power safe to grant — ties directly
into the hash-chained audit design already noted in `docs/SECURITY.md` and
`docs/EXPORTER-PORTAL-REDESIGN.md` §15, which currently has no server to back
it. Building this console is what would finally require that server.

### 5.9 Announcements / CMS (`/admin/announcements`)
Owner: Compliance (content) with CS/Support visibility. Compose
customer-facing banners, release notes, and regulation-change alerts, targeted
by plan tier or jurisdiction — this is how "CBAM definitive-period rule
changed" reaches every affected exporter at once instead of via one-off email.

### 5.10 System (`/admin/system`)
Owner: Platform Admin. Feature flags, integrations/API keys, environment
health dashboard, transactional email-template previews.

### 5.11 Analytics / Reports (`/admin/reports`)
Owner: Exec, contributed to by every department. Adoption funnel,
compliance-risk distribution across the portfolio, churn/renewal, verifier
SLA performance — the roll-up view that turns every other module's data into
decisions.

### 5.12 Legal / Privacy (`/admin/legal`)
Owner: Legal & Data Privacy. Contract/DPA repository, GDPR data-subject
request log, retention-schedule enforcement status (ties to the PII/retention
item already flagged as a production blocker in `docs/SECURITY.md`).

---

## 6. Data model additions (conceptual)

Mirrors the shape `certrace-platform`'s real Prisma schema would need; named
to slot in alongside its existing `Company`/`User` models:

```
StaffUser        { id, name, email, departmentId, roleId, status, lastLoginAt }
Department       { id, name, code }
Role              { id, name, departmentId, permissionSetId }
PermissionSet     { id, module, action }              // action: view | act | approve | admin
AuditLogEntry     { id, actorId, action, targetType, targetId, before, after, reason, at }
SupportTicket     { id, orgId, subject, status, priority, department, assignedToId }
Announcement      { id, title, body, audience, publishedAt, publishedById }
FeatureFlag       { key, description, enabledForOrgIds[] }
RegulatoryDraft    { id, targetTable, diff, draftedById, approvedById, publishedAt }
ImpersonationSession { id, staffId, orgId, startedAt, endedAt, reason }
```

---

## 7. Cross-cutting principles

- **Maker-checker** on anything touching customer-facing correctness (regulatory
  data publishes, prod feature flags) — drafter ≠ approver, enforced not just
  suggested.
- **Every mutating action writes an audit-log row** — actor, before/after,
  reason. No module is exempt, including Super Admin.
- **Impersonation is always banner-visible in the impersonated view, time-boxed,
  and requires a logged reason** — never silent.
- **Segregation of duties**: the person who drafts a regulatory change can't
  publish it; the person who configures a billing credit can't approve their
  own credit.
- **Visually distinct from customer portals** — same design tokens (`#3C7ACB`,
  ink-on-bone, IBM Plex 300 / Courier eyebrows) but a persistent "STAFF"
  treatment (e.g. accent strip in the top bar) so nobody mistakes which portal
  they're in mid-impersonation.
- **Mock-data-first**, matching how this repo was built end to end: a new
  `lib/admin-data.ts` becomes the API seam (several fixture orgs, staff users,
  tickets), the same role the existing `lib/data.ts` and
  `lib/supplier-store.ts` already play.

---

## 8. Build phasing (depth-first, matching how the rest of this repo shipped)

1. **Phase 1 — skeleton**: staff login (mock), `/admin/dashboard`,
   Accounts list/detail (read-only), Staff & Roles directory, Audit Log
   (read-only feed).
2. **Phase 2 — the modules that protect CBAM correctness**: Verification
   Queue + Regulatory Data Steward workflow (maker-checker). Highest business
   risk if built wrong or skipped, so it comes right after the skeleton.
3. **Phase 3 — run-the-business**: Billing/Revenue Ops + Support/Helpdesk
   ticket queue.
4. **Phase 4 — reach & visibility**: Announcements/CMS, Feature
   Flags/Integrations, full cross-department Analytics/Reports.
5. **Phase 5 — hardening**: Legal & Data Privacy module, impersonation
   audit hardening, maker-checker enforcement made non-bypassable everywhere
   (today's mock login has no real RBAC enforcement, per `docs/SECURITY.md` —
   this phase is where that debt gets paid for the admin console specifically).

---

## 9. Assumptions to confirm before building

- Department list (§2) is a standard B2B compliance-SaaS org chart (Exec, CS,
  Compliance/Regulatory, Verification Ops, Sales/Revenue, Engineering,
  Legal/Privacy, Support) — confirm against Certrace's actual/planned team
  before the role editor (§5.7) gets built as configurable vs. hardcoded.
- Staff auth assumed fully separate from customer auth (separate login route,
  separate session) — confirm, since this affects whether `/admin` can share
  any layout/session code with `app/(portal)`.
- Assumed this stays **mock-data/UX-MVP first** in `certrace-portal`, same as
  the exporter and supplier sides, before anything is wired to
  `certrace-platform`'s real Prisma backend.

Related: `docs/EXPORTER-PORTAL-REDESIGN.md` (post-submission architecture +
per-org Admin role), `docs/SECURITY.md` (production-blocking items this
console would inherit).
