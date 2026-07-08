/* Certrace Admin Console — mock data seam (the future API boundary).
   Spec: certrace-portal/docs/ADMIN-CONSOLE-PLAN.md §2 (roles), §3 (matrix), §6 (model).
   Everything here is fixture data; transactional overlays live in admin-store.ts. */

/* ── Currency ─────────────────────────────────────────────── */

/* All monetary amounts platform-wide are Thai baht (THB). */
export function thb(amount: number) {
  return `฿${amount.toLocaleString("en-US")}`;
}

export function thbCompact(amount: number) {
  return `฿${(amount / 1000).toFixed(0)}k`;
}

export const VAT_RATE = 0.07; // Thai VAT

/* ── Departments, roles, permissions ─────────────────────── */

export type DeptId =
  | "exec"
  | "cs"
  | "compliance"
  | "verification"
  | "revenue"
  | "engineering"
  | "legal"
  | "support"
  | "super";

export type ModuleId =
  | "dashboard"
  | "accounts"
  | "declarations"
  | "verification"
  | "regulatory"
  | "billing"
  | "support"
  | "staff"
  | "audit"
  | "announcements"
  | "system"
  | "reports"
  | "legal";

export type AccessLevel = "none" | "view" | "act" | "admin";

export type Power =
  | "policy"
  | "reassign-accounts"
  | "edit-playbooks"
  | "draft-regdata"
  | "publish-regdata"
  | "set-reg-live"
  | "review-queue"
  | "assign-queue"
  | "calibrate-ai"
  | "manage-verifiers"
  | "manage-billing"
  | "export-finance"
  | "impersonate"
  | "flags"
  | "integrations"
  | "audit-admin"
  | "revoke-access"
  | "legal-hold"
  | "dsr"
  | "reply-tickets"
  | "escalate-tickets"
  | "sla-config"
  | "manage-staff"
  | "publish-announcements";

export const DEPARTMENTS: { id: DeptId; name: string; code: string }[] = [
  { id: "exec", name: "Executive / Leadership", code: "EXEC" },
  { id: "cs", name: "Customer Success & Onboarding", code: "CS" },
  { id: "compliance", name: "Compliance & Regulatory Affairs", code: "REG" },
  { id: "verification", name: "Verification & QA Operations", code: "VQA" },
  { id: "revenue", name: "Sales & Revenue Ops / Finance", code: "REV" },
  { id: "engineering", name: "Engineering & Platform Ops", code: "ENG" },
  { id: "legal", name: "Legal & Data Privacy", code: "LEG" },
  { id: "support", name: "Support / Helpdesk", code: "SUP" },
  { id: "super", name: "Super Admin", code: "ROOT" },
];

export function getDepartment(id: DeptId) {
  return DEPARTMENTS.find((d) => d.id === id)!;
}

export type Role = {
  id: string;
  dept: DeptId;
  name: string;
  tier: number;
  powers: Power[];
  blurb: string;
};

export const ROLES: Role[] = [
  { id: "exec-viewer", dept: "exec", name: "Exec Viewer", tier: 1, powers: [], blurb: "Read-only company-wide KPIs, risk heatmap, churn." },
  { id: "exec-admin", dept: "exec", name: "Exec Admin", tier: 2, powers: ["policy", "export-finance", "manage-staff"], blurb: "Org-wide policy settings, board-level financial exports." },

  { id: "cs-associate", dept: "cs", name: "CS Associate", tier: 1, powers: [], blurb: "Assigned accounts, onboarding checklists, health scores." },
  { id: "cs-manager", dept: "cs", name: "CS Manager", tier: 2, powers: ["reassign-accounts"], blurb: "Reassign accounts, renewal-risk flags, Sales escalation." },
  { id: "cs-head", dept: "cs", name: "Head of CS", tier: 3, powers: ["reassign-accounts", "edit-playbooks"], blurb: "Cross-portfolio analytics, onboarding playbooks." },

  { id: "reg-analyst", dept: "compliance", name: "Regulatory Analyst", tier: 1, powers: ["draft-regdata"], blurb: "Draft CN-code / emission-factor changes. Cannot publish." },
  { id: "reg-steward", dept: "compliance", name: "Regulatory Data Steward", tier: 2, powers: ["draft-regdata", "publish-regdata", "publish-announcements"], blurb: "Approve & publish master data (maker-checker), version history." },
  { id: "compliance-ops", dept: "compliance", name: "Compliance Ops Manager", tier: 3, powers: ["draft-regdata", "publish-regdata", "set-reg-live", "publish-announcements"], blurb: "Risk heatmap, regulator inquiries, live-vs-waitlist regulations." },

  { id: "verifier-reviewer", dept: "verification", name: "Verifier Reviewer", tier: 1, powers: ["review-queue"], blurb: "QA queue: AI-check flags, escalations, spot audits." },
  { id: "qa-lead", dept: "verification", name: "QA Lead", tier: 2, powers: ["review-queue", "assign-queue", "calibrate-ai"], blurb: "Assign reviewers, calibrate AI thresholds, approve resolutions." },
  { id: "verification-ops", dept: "verification", name: "Verification Ops Manager", tier: 3, powers: ["review-queue", "assign-queue", "manage-verifiers"], blurb: "SLA tracking, external verifier-partner accounts." },

  { id: "sales-rep", dept: "revenue", name: "Sales Rep", tier: 1, powers: [], blurb: "Read-only trials/prospects + usage signals for upsell." },
  { id: "revops-analyst", dept: "revenue", name: "Revenue Ops Analyst", tier: 2, powers: ["manage-billing"], blurb: "Subscriptions, invoices, dunning, discounts & credits." },
  { id: "finance-controller", dept: "revenue", name: "Finance Controller", tier: 3, powers: ["export-finance"], blurb: "Revenue reports & reconciliation. No per-account edits." },

  { id: "support-engineer", dept: "engineering", name: "Support Engineer", tier: 1, powers: ["impersonate"], blurb: "Audited, time-boxed tenant impersonation; logs; job requeue." },
  { id: "platform-admin", dept: "engineering", name: "Platform Admin", tier: 2, powers: ["impersonate", "flags", "integrations", "manage-staff"], blurb: "Feature flags, integrations/API keys, environment health." },
  { id: "security-admin", dept: "engineering", name: "Security Admin", tier: 3, powers: ["audit-admin", "revoke-access"], blurb: "Access control, audit review, incident response, break-glass revocation." },

  { id: "legal-counsel", dept: "legal", name: "Legal Counsel", tier: 1, powers: ["legal-hold"], blurb: "Contract/DPA repository, liability holds, redactions." },
  { id: "dpo", dept: "legal", name: "Data Privacy Officer", tier: 2, powers: ["dsr"], blurb: "GDPR data-subject requests, retention enforcement, breach log." },

  { id: "support-t1", dept: "support", name: "Support Agent (Tier 1)", tier: 1, powers: ["reply-tickets"], blurb: "Ticket triage, canned responses, read-only account lookup." },
  { id: "support-t2", dept: "support", name: "Support Lead (Tier 2)", tier: 2, powers: ["reply-tickets", "escalate-tickets", "sla-config"], blurb: "Escalations, cross-department routing, macros & SLA config." },

  { id: "super-admin", dept: "super", name: "Super Admin", tier: 9, powers: ["policy", "reassign-accounts", "edit-playbooks", "draft-regdata", "publish-regdata", "set-reg-live", "review-queue", "assign-queue", "calibrate-ai", "manage-verifiers", "manage-billing", "export-finance", "impersonate", "flags", "integrations", "audit-admin", "revoke-access", "legal-hold", "dsr", "reply-tickets", "escalate-tickets", "sla-config", "manage-staff", "publish-announcements"], blurb: "Break-glass override. Every action distinctly flagged in the audit log." },
];

export function getRole(id: string) {
  return ROLES.find((r) => r.id === id)!;
}

/* Dept × module access — plan doc §3 verbatim (● admin ◐ act ○ view — none).
   Dashboard is visible to every signed-in staff member. */
const M = (
  accounts: AccessLevel, declarations: AccessLevel, verification: AccessLevel,
  regulatory: AccessLevel, billing: AccessLevel, support: AccessLevel,
  staff: AccessLevel, audit: AccessLevel, announcements: AccessLevel,
  system: AccessLevel, reports: AccessLevel, legal: AccessLevel,
): Record<ModuleId, AccessLevel> => ({
  dashboard: "view",
  accounts, declarations, verification, regulatory, billing, support,
  staff, audit, announcements, system, reports, legal,
});

export const DEPT_ACCESS: Record<DeptId, Record<ModuleId, AccessLevel>> = {
  exec: M("view", "view", "view", "view", "act", "view", "act", "view", "act", "view", "admin", "view"),
  cs: M("admin", "view", "none", "none", "view", "act", "none", "none", "view", "none", "act", "none"),
  compliance: M("view", "act", "act", "admin", "none", "none", "none", "view", "admin", "none", "act", "none"),
  verification: M("view", "admin", "admin", "view", "none", "none", "none", "view", "none", "none", "act", "none"),
  revenue: M("act", "none", "none", "none", "admin", "none", "none", "view", "none", "none", "act", "none"),
  engineering: M("act", "none", "none", "none", "none", "act", "act", "admin", "view", "admin", "view", "none"),
  legal: M("view", "view", "none", "view", "none", "none", "none", "view", "view", "none", "none", "admin"),
  support: M("view", "view", "none", "none", "none", "admin", "none", "none", "view", "none", "none", "none"),
  super: M("admin", "admin", "admin", "admin", "admin", "admin", "admin", "admin", "admin", "admin", "admin", "admin"),
};

export function access(dept: DeptId, module: ModuleId): AccessLevel {
  return DEPT_ACCESS[dept][module];
}

/* ── Staff directory ──────────────────────────────────────── */

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: "active" | "invited" | "deactivated";
  lastLoginAt: string;
};

export const STAFF: StaffUser[] = [
  { id: "st-01", name: "Daniel Okafor", email: "daniel@certrace.dev", roleId: "exec-admin", status: "active", lastLoginAt: "2026-07-06 08:12" },
  { id: "st-02", name: "Araya Chan", email: "araya@certrace.dev", roleId: "exec-viewer", status: "active", lastLoginAt: "2026-07-05 17:40" },
  { id: "st-03", name: "Hannah Byrne", email: "hannah@certrace.dev", roleId: "cs-head", status: "active", lastLoginAt: "2026-07-06 07:55" },
  { id: "st-04", name: "Marco Reyes", email: "marco@certrace.dev", roleId: "cs-manager", status: "active", lastLoginAt: "2026-07-06 09:02" },
  { id: "st-05", name: "Ploy Sirikul", email: "ploy@certrace.dev", roleId: "cs-associate", status: "active", lastLoginAt: "2026-07-06 09:31" },
  { id: "st-06", name: "Jonas Weber", email: "jonas@certrace.dev", roleId: "compliance-ops", status: "active", lastLoginAt: "2026-07-06 06:47" },
  { id: "st-07", name: "Elif Demir", email: "elif@certrace.dev", roleId: "reg-steward", status: "active", lastLoginAt: "2026-07-06 08:44" },
  { id: "st-08", name: "Nok Wattana", email: "nok@certrace.dev", roleId: "reg-analyst", status: "active", lastLoginAt: "2026-07-06 09:15" },
  { id: "st-09", name: "Tomás Silva", email: "tomas@certrace.dev", roleId: "verification-ops", status: "active", lastLoginAt: "2026-07-05 19:23" },
  { id: "st-10", name: "Priya Nair", email: "priya@certrace.dev", roleId: "qa-lead", status: "active", lastLoginAt: "2026-07-06 08:58" },
  { id: "st-11", name: "Kavin Srisuwan", email: "kavin@certrace.dev", roleId: "verifier-reviewer", status: "active", lastLoginAt: "2026-07-06 09:20" },
  { id: "st-12", name: "Ingrid Larsen", email: "ingrid@certrace.dev", roleId: "finance-controller", status: "active", lastLoginAt: "2026-07-04 16:02" },
  { id: "st-13", name: "Mint Chaiyasit", email: "mint@certrace.dev", roleId: "revops-analyst", status: "active", lastLoginAt: "2026-07-06 08:36" },
  { id: "st-14", name: "Ben Carter", email: "ben@certrace.dev", roleId: "sales-rep", status: "active", lastLoginAt: "2026-07-06 07:12" },
  { id: "st-15", name: "Sofia Marino", email: "sofia@certrace.dev", roleId: "platform-admin", status: "active", lastLoginAt: "2026-07-06 08:05" },
  { id: "st-16", name: "Oat Prasert", email: "oat@certrace.dev", roleId: "support-engineer", status: "active", lastLoginAt: "2026-07-06 09:26" },
  { id: "st-17", name: "Liam O'Neill", email: "liam@certrace.dev", roleId: "security-admin", status: "active", lastLoginAt: "2026-07-05 22:14" },
  { id: "st-18", name: "Claire Dubois", email: "claire@certrace.dev", roleId: "legal-counsel", status: "active", lastLoginAt: "2026-07-03 11:30" },
  { id: "st-19", name: "Yuki Tanaka", email: "yuki@certrace.dev", roleId: "dpo", status: "active", lastLoginAt: "2026-07-05 14:48" },
  { id: "st-20", name: "Fah Rattana", email: "fah@certrace.dev", roleId: "support-t1", status: "active", lastLoginAt: "2026-07-06 09:34" },
  { id: "st-21", name: "Diego Torres", email: "diego@certrace.dev", roleId: "support-t2", status: "active", lastLoginAt: "2026-07-06 09:10" },
  { id: "st-22", name: "Wasawat Kiakittiwong", email: "wasawat@certrace.dev", roleId: "super-admin", status: "active", lastLoginAt: "2026-07-06 09:40" },
  { id: "st-23", name: "Greta Lindqvist", email: "greta@certrace.dev", roleId: "reg-analyst", status: "invited", lastLoginAt: "—" },
];

export function getStaff(id: string) {
  return STAFF.find((s) => s.id === id);
}

/* ── Tenant orgs ──────────────────────────────────────────── */

export type OrgKind = "exporter" | "supplier" | "verifier-partner";
export type Plan = "Trial" | "Starter" | "Standard" | "Enterprise" | "Partner";

export type Org = {
  id: string;
  name: string;
  kind: OrgKind;
  country: string;
  plan: Plan;
  mrr: number;
  seats: number;
  health: number;
  renewalRisk: boolean;
  csOwnerId: string;
  createdAt: string;
  lastActivity: string;
  openTickets: number;
  sectors: string[];
};

export const ORGS: Org[] = [
  { id: "org-01", name: "Siam Steel Group", kind: "exporter", country: "TH", plan: "Enterprise", mrr: 168000, seats: 14, health: 86, renewalRisk: false, csOwnerId: "st-05", createdAt: "2025-11-02", lastActivity: "2026-07-06 09:18", openTickets: 1, sectors: ["Iron & Steel"] },
  { id: "org-02", name: "Bangkok Aluminium Works", kind: "exporter", country: "TH", plan: "Standard", mrr: 56000, seats: 6, health: 74, renewalRisk: false, csOwnerId: "st-05", createdAt: "2026-01-15", lastActivity: "2026-07-06 08:02", openTickets: 2, sectors: ["Aluminium"] },
  { id: "org-03", name: "Chao Phraya Coil Co.", kind: "exporter", country: "TH", plan: "Standard", mrr: 56000, seats: 5, health: 91, renewalRisk: false, csOwnerId: "st-04", createdAt: "2026-02-20", lastActivity: "2026-07-05 18:44", openTickets: 0, sectors: ["Iron & Steel"] },
  { id: "org-04", name: "Eastern Seaboard Alloys", kind: "exporter", country: "TH", plan: "Trial", mrr: 0, seats: 3, health: 58, renewalRisk: false, csOwnerId: "st-04", createdAt: "2026-06-18", lastActivity: "2026-07-04 13:20", openTickets: 1, sectors: ["Aluminium"] },
  { id: "org-05", name: "Mekong Steel Trading", kind: "exporter", country: "TH", plan: "Standard", mrr: 56000, seats: 4, health: 41, renewalRisk: true, csOwnerId: "st-05", createdAt: "2025-12-09", lastActivity: "2026-06-22 10:05", openTickets: 3, sectors: ["Iron & Steel"] },
  { id: "org-06", name: "Ayutthaya Wireworks", kind: "exporter", country: "TH", plan: "Trial", mrr: 0, seats: 2, health: 66, renewalRisk: false, csOwnerId: "st-04", createdAt: "2026-06-30", lastActivity: "2026-07-06 07:51", openTickets: 0, sectors: ["Iron & Steel"] },
  { id: "org-07", name: "Thai Metal Pro", kind: "supplier", country: "TH", plan: "Standard", mrr: 14000, seats: 4, health: 79, renewalRisk: false, csOwnerId: "st-05", createdAt: "2026-03-04", lastActivity: "2026-07-06 09:05", openTickets: 1, sectors: ["Iron & Steel"] },
  { id: "org-08", name: "Rayong Green Metals", kind: "supplier", country: "TH", plan: "Trial", mrr: 0, seats: 2, health: 72, renewalRisk: false, csOwnerId: "st-04", createdAt: "2026-05-11", lastActivity: "2026-07-05 16:12", openTickets: 0, sectors: ["Aluminium"] },
  { id: "org-09", name: "Krung Thep Castings", kind: "supplier", country: "TH", plan: "Standard", mrr: 14000, seats: 3, health: 63, renewalRisk: false, csOwnerId: "st-05", createdAt: "2026-04-22", lastActivity: "2026-07-03 09:47", openTickets: 0, sectors: ["Iron & Steel"] },
  { id: "org-10", name: "TÜV Rheinland Thailand", kind: "verifier-partner", country: "TH", plan: "Partner", mrr: 0, seats: 5, health: 88, renewalRisk: false, csOwnerId: "st-03", createdAt: "2026-01-08", lastActivity: "2026-07-05 15:30", openTickets: 0, sectors: ["Verification"] },
];

export function getOrg(id: string) {
  return ORGS.find((o) => o.id === id);
}

/* ── Cross-tenant declarations monitor ────────────────────── */

export type DeclStatus = "collecting" | "in-review" | "approved" | "dispatched";

export type AdminDecl = {
  id: string;
  orgId: string;
  title: string;
  regulation: "EU CBAM";
  period: string;
  status: DeclStatus;
  suppliers: number;
  submitted: number;
  deadline: string;
  riskFlags: string[];
  tco2e: number;
};

export const DECLARATIONS: AdminDecl[] = [
  { id: "d-101", orgId: "org-01", title: "Q2 2026 Steel — EU CBAM", regulation: "EU CBAM", period: "2026 Q2", status: "in-review", suppliers: 6, submitted: 5, deadline: "2026-08-31", riskFlags: ["20% default cap near limit"], tco2e: 48210 },
  { id: "d-102", orgId: "org-01", title: "Q1 2026 Steel — EU CBAM", regulation: "EU CBAM", period: "2026 Q1", status: "dispatched", suppliers: 6, submitted: 6, deadline: "2026-05-31", riskFlags: [], tco2e: 45120 },
  { id: "d-103", orgId: "org-02", title: "Q2 2026 Aluminium — EU CBAM", regulation: "EU CBAM", period: "2026 Q2", status: "in-review", suppliers: 4, submitted: 4, deadline: "2026-08-31", riskFlags: ["Unverified actuals", "Scope 2 in bill"], tco2e: 30880 },
  { id: "d-104", orgId: "org-03", title: "Q2 2026 Coil — EU CBAM", regulation: "EU CBAM", period: "2026 Q2", status: "approved", suppliers: 3, submitted: 3, deadline: "2026-08-31", riskFlags: [], tco2e: 12940 },
  { id: "d-105", orgId: "org-04", title: "Trial declaration — EU CBAM", regulation: "EU CBAM", period: "2026 Q2", status: "collecting", suppliers: 2, submitted: 0, deadline: "2026-08-31", riskFlags: ["No supplier response 14d"], tco2e: 0 },
  { id: "d-106", orgId: "org-05", title: "Q2 2026 Steel — EU CBAM", regulation: "EU CBAM", period: "2026 Q2", status: "collecting", suppliers: 5, submitted: 1, deadline: "2026-08-31", riskFlags: ["Deadline risk", "Account renewal-risk"], tco2e: 8770 },
  { id: "d-107", orgId: "org-06", title: "Wire rod pilot — EU CBAM", regulation: "EU CBAM", period: "2026 Q2", status: "collecting", suppliers: 1, submitted: 1, deadline: "2026-08-31", riskFlags: [], tco2e: 1290 },
  { id: "d-108", orgId: "org-03", title: "Q1 2026 Coil — EU CBAM", regulation: "EU CBAM", period: "2026 Q1", status: "dispatched", suppliers: 3, submitted: 3, deadline: "2026-05-31", riskFlags: [], tco2e: 11830 },
  { id: "d-109", orgId: "org-02", title: "Q1 2026 Aluminium — EU CBAM", regulation: "EU CBAM", period: "2026 Q1", status: "dispatched", suppliers: 4, submitted: 4, deadline: "2026-05-31", riskFlags: [], tco2e: 29450 },
  { id: "d-110", orgId: "org-01", title: "Q3 2026 Steel — EU CBAM (draft)", regulation: "EU CBAM", period: "2026 Q3", status: "collecting", suppliers: 6, submitted: 0, deadline: "2026-11-30", riskFlags: [], tco2e: 0 },
];

/* ── Verification & QA queue ──────────────────────────────── */

export type QueueKind = "ai-critical" | "escalation" | "spot-audit";
export type QueueStatus = "open" | "assigned" | "resolved";

export type QueueItem = {
  id: string;
  kind: QueueKind;
  orgId: string;
  declId: string;
  summary: string;
  detail: string;
  raisedAt: string;
  slaHours: number;
  status: QueueStatus;
  assigneeId?: string;
  resolution?: string;
};

export const QUEUE: QueueItem[] = [
  { id: "q-01", kind: "ai-critical", orgId: "org-02", declId: "d-103", summary: "Electrolysis electricity figure 6.2× sector median", detail: "AI anomaly check flagged al-process electricity at 41.2 MWh/t vs 6.6 median for prebake anodes. Supplier: Rayong Green Metals.", raisedAt: "2026-07-05 14:22", slaHours: 24, status: "open" },
  { id: "q-02", kind: "ai-critical", orgId: "org-01", declId: "d-101", summary: "Complex good running fully on default values", detail: "Billet (7207) from Thai Metal Pro is 100% defaults — breaches the definitive-period 20% cap if filed as-is.", raisedAt: "2026-07-05 09:10", slaHours: 24, status: "assigned", assigneeId: "st-11" },
  { id: "q-03", kind: "escalation", orgId: "org-05", declId: "d-106", summary: "Exporter disputes AI completeness score", detail: "Mekong Steel claims the questionnaire marks precursor fields required that shouldn't apply to their simple goods.", raisedAt: "2026-07-04 16:45", slaHours: 48, status: "open" },
  { id: "q-04", kind: "spot-audit", orgId: "org-03", declId: "d-104", summary: "Routine spot audit — approved declaration", detail: "Quarterly 5% sample. Check evidence linkage on all three supplier chapters before dispatch window.", raisedAt: "2026-07-03 10:00", slaHours: 96, status: "assigned", assigneeId: "st-10" },
  { id: "q-05", kind: "ai-critical", orgId: "org-04", declId: "d-105", summary: "Carbon price claimed with no rebate documentation", detail: "Trial account entered a carbon price due deduction without an attached levy receipt.", raisedAt: "2026-07-05 18:03", slaHours: 24, status: "open" },
  { id: "q-06", kind: "escalation", orgId: "org-02", declId: "d-103", summary: "Verifier partner requests methodology clarification", detail: "TÜV Rheinland asks whether EU-accepted MRV monitoring plan covers the second rolling line.", raisedAt: "2026-07-02 11:30", slaHours: 72, status: "resolved", assigneeId: "st-09", resolution: "Confirmed monitoring plan scope with the Commission FAQ §4.2; verifier notified." },
  { id: "q-07", kind: "spot-audit", orgId: "org-01", declId: "d-102", summary: "Post-dispatch audit — Q1 package integrity", detail: "Verify sha-256 dataset hash in the dispatched PDF matches the sealed dataset version.", raisedAt: "2026-06-28 09:00", slaHours: 120, status: "resolved", assigneeId: "st-11", resolution: "Hash verified byte-identical. No findings." },
];

/* ── Regulatory master data + maker-checker drafts ────────── */

export type RegDataset = {
  id: string;
  name: string;
  records: number;
  version: string;
  publishedAt: string;
  publishedBy: string;
};

export const REG_DATASETS: RegDataset[] = [
  { id: "rd-cn", name: "CN code catalogue (Iron & Steel, Aluminium)", records: 57, version: "v2026.3", publishedAt: "2026-06-12", publishedBy: "Elif Demir" },
  { id: "rd-factors", name: "Default emission factors (Commission table)", records: 214, version: "v2026.2", publishedAt: "2026-05-30", publishedBy: "Elif Demir" },
  { id: "rd-fields", name: "CBAM data-point checklist (Annex IV)", records: 18, version: "v2026.1", publishedAt: "2026-04-14", publishedBy: "Jonas Weber" },
  { id: "rd-juris", name: "Jurisdictions & destination markets", records: 12, version: "v2026.2", publishedAt: "2026-05-02", publishedBy: "Elif Demir" },
  { id: "rd-markup", name: "Default-value markup schedule (by year)", records: 4, version: "v2026.1", publishedAt: "2026-03-20", publishedBy: "Jonas Weber" },
];

export type DraftStatus = "draft" | "awaiting-approval" | "published" | "rejected";

export type RegDraft = {
  id: string;
  datasetId: string;
  title: string;
  diff: string;
  status: DraftStatus;
  draftedById: string;
  draftedAt: string;
  approvedById?: string;
  decidedAt?: string;
  note?: string;
};

export const REG_DRAFTS: RegDraft[] = [
  { id: "dr-01", datasetId: "rd-factors", title: "Update pig iron default factor per Commission 2026/1441", diff: "pig-iron.direct: 1.90 → 1.86 tCO₂e/t · source: OJ L 2026/1441 Annex II", status: "awaiting-approval", draftedById: "st-08", draftedAt: "2026-07-04 15:20" },
  { id: "dr-02", datasetId: "rd-cn", title: "Add CN 7616 99 90 (other articles of aluminium)", diff: "+ 7616 99 90 · category: Aluminium · complex: yes", status: "awaiting-approval", draftedById: "st-08", draftedAt: "2026-07-05 11:02" },
  { id: "dr-03", datasetId: "rd-markup", title: "2027 default-value markup step (draft, pending OJ)", diff: "markup.2027: — → +30% (placeholder until Official Journal text)", status: "draft", draftedById: "st-08", draftedAt: "2026-07-06 08:41" },
  { id: "dr-04", datasetId: "rd-fields", title: "Split site address into address + UN/LOCODE", diff: "inst-address → inst-address + inst-unlocode (optional)", status: "published", draftedById: "st-08", draftedAt: "2026-06-27 10:15", approvedById: "st-07", decidedAt: "2026-06-29 09:00" },
  { id: "dr-05", datasetId: "rd-factors", title: "Correct ferro-manganese indirect factor typo", diff: "ferro-mn.indirect: 2.41 → 1.41 tCO₂e/t (transcription error)", status: "published", draftedById: "st-07", draftedAt: "2026-06-20 13:37", approvedById: "st-06", decidedAt: "2026-06-20 16:02" },
  { id: "dr-06", datasetId: "rd-juris", title: "Add Vietnam as live origin jurisdiction", diff: "origin.VN: waitlist → live", status: "rejected", draftedById: "st-08", draftedAt: "2026-06-15 09:24", approvedById: "st-06", decidedAt: "2026-06-16 10:11", note: "Hold until VN factor-set QA completes." },
];

/* ── Billing ──────────────────────────────────────────────── */

export type Invoice = {
  id: string;
  orgId: string;
  amount: number;
  period: string;
  status: "paid" | "due" | "overdue";
  issuedAt: string;
};

export const INVOICES: Invoice[] = [
  { id: "INV-2607", orgId: "org-01", amount: 168000, period: "Jul 2026", status: "due", issuedAt: "2026-07-01" },
  { id: "INV-2606", orgId: "org-01", amount: 168000, period: "Jun 2026", status: "paid", issuedAt: "2026-06-01" },
  { id: "INV-2605", orgId: "org-02", amount: 56000, period: "Jul 2026", status: "due", issuedAt: "2026-07-01" },
  { id: "INV-2604", orgId: "org-03", amount: 56000, period: "Jul 2026", status: "paid", issuedAt: "2026-07-01" },
  { id: "INV-2603", orgId: "org-05", amount: 56000, period: "Jun 2026", status: "overdue", issuedAt: "2026-06-01" },
  { id: "INV-2602", orgId: "org-05", amount: 56000, period: "Jul 2026", status: "due", issuedAt: "2026-07-01" },
  { id: "INV-2601", orgId: "org-07", amount: 14000, period: "Jul 2026", status: "paid", issuedAt: "2026-07-01" },
  { id: "INV-2600", orgId: "org-09", amount: 14000, period: "Jul 2026", status: "due", issuedAt: "2026-07-01" },
];

/* The three real tiers are annual-only and supplier-scaled — mirrors
   certrace-portal/lib/config.ts PLANS exactly. Trial and Partner are
   separate account states, not paid tiers, so they're listed alongside
   for revenue-ops visibility but aren't part of "the three tiers". */
export const PLANS = [
  { name: "Trial", price: "฿0", blurb: "14-day evaluation, 1 declaration, watermarked outputs.", orgs: ORGS.filter((o) => o.plan === "Trial").length },
  { name: "Starter", price: "฿180,000/yr", blurb: "Up to 20 suppliers. Smart request builder, live dashboard + reminders, audit-ready export.", orgs: ORGS.filter((o) => o.plan === "Starter").length },
  { name: "Standard", price: "฿360,000/yr", blurb: "Up to 50 suppliers. Everything in Starter, plus an auditor portal seat and multi-regulation templates.", orgs: ORGS.filter((o) => o.plan === "Standard").length },
  { name: "Enterprise", price: "฿720,000/yr", blurb: "50+ suppliers, custom above ~150. Priority support + onboarding, legal-network sign-off access.", orgs: ORGS.filter((o) => o.plan === "Enterprise").length },
  { name: "Partner", price: "rev-share", blurb: "Verifier partners — scoped portal access, no subscription.", orgs: ORGS.filter((o) => o.plan === "Partner").length },
];

/* ── Support tickets ──────────────────────────────────────── */

export type TicketStatus = "open" | "pending" | "escalated" | "resolved";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type Ticket = {
  id: string;
  orgId: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  routedTo: DeptId;
  assigneeId?: string;
  openedAt: string;
  slaDue: string;
  thread: { from: string; at: string; body: string; internal?: boolean }[];
};

export const TICKETS: Ticket[] = [
  {
    id: "T-1041", orgId: "org-05", subject: "Invoice INV-2603 disputed — duplicate charge claim", status: "escalated", priority: "high", routedTo: "revenue", assigneeId: "st-13", openedAt: "2026-07-02 10:14", slaDue: "2026-07-07 10:14",
    thread: [
      { from: "Somchai (Mekong Steel)", at: "2026-07-02 10:14", body: "We were charged twice in June. Please refund one payment or we will pause our renewal." },
      { from: "Fah Rattana", at: "2026-07-02 11:02", body: "Thank you — checking with our billing team now. You will hear back within one business day." },
      { from: "Diego Torres", at: "2026-07-02 11:40", body: "Routing to Revenue Ops. Account is already renewal-risk — handle with care.", internal: true },
    ],
  },
  {
    id: "T-1040", orgId: "org-02", subject: "Smart Link opens blank page for one supplier", status: "open", priority: "urgent", routedTo: "engineering", assigneeId: "st-16", openedAt: "2026-07-05 16:20", slaDue: "2026-07-06 16:20",
    thread: [
      { from: "Kanya (Bangkok Aluminium)", at: "2026-07-05 16:20", body: "Our supplier in Rayong says the questionnaire link shows a blank screen on their office browser (IE mode)." },
      { from: "Fah Rattana", at: "2026-07-05 16:41", body: "Sorry about that — escalating to engineering. Could you ask which browser version they use?" },
    ],
  },
  {
    id: "T-1039", orgId: "org-01", subject: "Need Q2 audit package regenerated with new legal entity name", status: "pending", priority: "normal", routedTo: "support", assigneeId: "st-20", openedAt: "2026-07-04 09:12", slaDue: "2026-07-08 09:12",
    thread: [
      { from: "Preecha (Siam Steel)", at: "2026-07-04 09:12", body: "We re-registered as Siam Steel Group PCL — the PDF cover still shows the old name." },
      { from: "Fah Rattana", at: "2026-07-04 09:45", body: "You can update the legal name under Settings → Organisation, then regenerate from the Output Center. Want me to walk you through it?" },
    ],
  },
  {
    id: "T-1038", orgId: "org-04", subject: "Trial limits — how many suppliers can we invite?", status: "resolved", priority: "low", routedTo: "support", assigneeId: "st-20", openedAt: "2026-07-03 14:30", slaDue: "2026-07-08 14:30",
    thread: [
      { from: "Nadia (Eastern Seaboard)", at: "2026-07-03 14:30", body: "Does the trial cap supplier invites?" },
      { from: "Fah Rattana", at: "2026-07-03 14:52", body: "Trials include one declaration with unlimited supplier invites — only outputs are watermarked. Happy to set up a Growth quote when ready." },
    ],
  },
  {
    id: "T-1037", orgId: "org-07", subject: "Change primary contact for questionnaire seats", status: "open", priority: "normal", routedTo: "support", openedAt: "2026-07-06 08:22", slaDue: "2026-07-09 08:22",
    thread: [
      { from: "Wirat (Thai Metal Pro)", at: "2026-07-06 08:22", body: "Our QA manager left — how do we move the e-sign responsibility to her replacement?" },
    ],
  },
  {
    id: "T-1036", orgId: "org-02", subject: "Emission factor for prebake anodes looks outdated", status: "escalated", priority: "high", routedTo: "compliance", assigneeId: "st-08", openedAt: "2026-07-01 13:05", slaDue: "2026-07-06 13:05",
    thread: [
      { from: "Kanya (Bangkok Aluminium)", at: "2026-07-01 13:05", body: "The default factor shown for prebake anodes doesn't match the June Commission update." },
      { from: "Diego Torres", at: "2026-07-01 13:30", body: "Data-correctness complaint — routing to Regulatory Affairs.", internal: true },
      { from: "Nok Wattana", at: "2026-07-02 09:15", body: "Confirmed — Commission 2026/1441 changed it. Drafting the master-data update now (dr-01)." , internal: true },
    ],
  },
];

/* ── Audit log (fixture events; live actions append via store) ── */

export type AuditEvent = {
  id: string;
  at: string;
  actorId: string;
  module: ModuleId;
  action: string;
  target: string;
  detail?: string;
  superFlag?: boolean;
};

export const AUDIT_FIXTURES: AuditEvent[] = [
  { id: "a-120", at: "2026-07-06 09:26", actorId: "st-16", module: "accounts", action: "impersonation.start", target: "org-02", detail: "Reason: reproduce blank Smart Link (T-1040). Time-boxed 30 min." },
  { id: "a-119", at: "2026-07-06 08:44", actorId: "st-07", module: "regulatory", action: "draft.review", target: "dr-01", detail: "Opened for approval review." },
  { id: "a-118", at: "2026-07-05 18:03", actorId: "st-15", module: "system", action: "flag.enable", target: "smartlink-v2-renderer", detail: "Enabled for org-02 only (canary)." },
  { id: "a-117", at: "2026-07-05 17:12", actorId: "st-13", module: "billing", action: "credit.draft", target: "org-05", detail: "Drafted ฿56,000 goodwill credit — pending Finance approval (segregation of duties)." },
  { id: "a-116", at: "2026-07-05 14:25", actorId: "st-10", module: "verification", action: "queue.assign", target: "q-02", detail: "Assigned to Kavin Srisuwan." },
  { id: "a-115", at: "2026-07-04 16:50", actorId: "st-21", module: "support", action: "ticket.escalate", target: "T-1041", detail: "Routed to Revenue Ops." },
  { id: "a-114", at: "2026-07-04 11:08", actorId: "st-22", module: "staff", action: "role.grant", target: "st-23", detail: "Invited Greta Lindqvist as Regulatory Analyst.", superFlag: true },
  { id: "a-113", at: "2026-07-03 15:40", actorId: "st-19", module: "legal", action: "dsr.open", target: "DSR-009", detail: "Data-subject access request — former supplier contact." },
  { id: "a-112", at: "2026-07-02 16:02", actorId: "st-06", module: "announcements", action: "announcement.publish", target: "ann-03", detail: "Audience: all exporter orgs." },
  { id: "a-111", at: "2026-07-01 10:12", actorId: "st-17", module: "audit", action: "access.review", target: "quarterly-review-2026Q2", detail: "Completed Q2 access recertification." },
  { id: "a-110", at: "2026-06-29 09:00", actorId: "st-07", module: "regulatory", action: "draft.publish", target: "dr-04", detail: "Published rd-fields v2026.1 → v2026.2." },
  { id: "a-109", at: "2026-06-25 13:30", actorId: "st-15", module: "system", action: "integration.rotate", target: "o3ci-bridge", detail: "Rotated API credentials." },
  { id: "a-108", at: "2026-06-22 10:40", actorId: "st-04", module: "accounts", action: "account.flag", target: "org-05", detail: "Marked renewal-risk after 14 days inactivity." },
  { id: "a-107", at: "2026-06-20 16:02", actorId: "st-06", module: "regulatory", action: "draft.publish", target: "dr-05", detail: "Emergency factor correction — expedited approval." },
  { id: "a-106", at: "2026-06-16 10:11", actorId: "st-06", module: "regulatory", action: "draft.reject", target: "dr-06", detail: "Hold until VN factor-set QA completes." },
];

/* ── Announcements ────────────────────────────────────────── */

export type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: string;
  status: "draft" | "published";
  authorId: string;
  publishedAt?: string;
};

export const ANNOUNCEMENTS: Announcement[] = [
  { id: "ann-05", title: "Scheduled maintenance — Sunday 13 Jul 02:00–04:00 UTC", body: "The portal and Smart Links will be read-only during the window. Dispatched packages are unaffected.", audience: "All orgs", status: "draft", authorId: "st-15" },
  { id: "ann-04", title: "New: default-factor update per Commission 2026/1441", body: "Pig iron default factors will update on publish of draft dr-01. Open declarations recalculate automatically; dispatched packages keep their sealed values.", audience: "Exporters — Iron & Steel", status: "draft", authorId: "st-08" },
  { id: "ann-03", title: "Definitive-period reminder: verification statements required for actual values", body: "From the 2026 reporting year, actual values must carry an accredited verification statement. The AI check now flags unverified actuals as blocking.", audience: "All exporter orgs", status: "published", authorId: "st-06", publishedAt: "2026-07-02 16:02" },
  { id: "ann-02", title: "Smart Link questionnaires now support UN/LOCODE", body: "Installation address fields now include an optional UN/LOCODE. Existing submissions are unaffected.", audience: "All orgs", status: "published", authorId: "st-07", publishedAt: "2026-06-29 10:00" },
  { id: "ann-01", title: "Welcome to the Certrace status feed", body: "Regulation changes, release notes and maintenance windows will be announced here.", audience: "All orgs", status: "published", authorId: "st-06", publishedAt: "2026-06-01 09:00" },
];

/* ── System: flags & integrations ─────────────────────────── */

export type FeatureFlag = {
  key: string;
  description: string;
  enabled: boolean;
  scope: string;
};

export const FEATURE_FLAGS: FeatureFlag[] = [
  { key: "smartlink-v2-renderer", description: "New questionnaire renderer (canary).", enabled: true, scope: "org-02 only" },
  { key: "o3ci-live-push", description: "Real O3CI portal push instead of simulated dispatch.", enabled: false, scope: "global" },
  { key: "ai-check-strict-mode", description: "Treat anomaly warnings as blocking for Enterprise orgs.", enabled: false, scope: "Enterprise plan" },
  { key: "supplier-profile-reuse", description: "Reusable supplier company profiles across exporters.", enabled: true, scope: "global" },
  { key: "billing-self-serve", description: "In-portal plan upgrades without a sales call.", enabled: false, scope: "global" },
  { key: "xml-annex-iv-export", description: "Annex IV communication-template XML in the Output Center.", enabled: true, scope: "global" },
];

export const INTEGRATIONS = [
  { name: "O3CI Portal bridge", status: "ok" as const, note: "Sandbox credentials · rotated 2026-06-25" },
  { name: "Email delivery (transactional)", status: "ok" as const, note: "99.7% delivered, 7-day window" },
  { name: "Payment processor", status: "ok" as const, note: "Webhooks healthy" },
  { name: "Accredited-verifier registry sync", status: "warn" as const, note: "Last sync 26h ago (daily expected)" },
  { name: "Commission default-factor feed", status: "ok" as const, note: "v2026.2 mirrored" },
];

/* ── Legal & privacy ──────────────────────────────────────── */

export const DPAS = [
  { orgId: "org-01", signed: "2025-11-05", version: "DPA v2.1", status: "active" },
  { orgId: "org-02", signed: "2026-01-18", version: "DPA v2.1", status: "active" },
  { orgId: "org-03", signed: "2026-02-22", version: "DPA v2.1", status: "active" },
  { orgId: "org-05", signed: "2025-12-11", version: "DPA v2.0", status: "renewal due" },
  { orgId: "org-07", signed: "2026-03-06", version: "DPA v2.1", status: "active" },
  { orgId: "org-10", signed: "2026-01-10", version: "Partner MSA v1.3", status: "active" },
];

export const DSRS = [
  { id: "DSR-009", type: "Access", subject: "Former supplier contact (Krung Thep Castings)", opened: "2026-07-03", due: "2026-08-02", status: "open", ownerId: "st-19" },
  { id: "DSR-008", type: "Erasure", subject: "Ex-employee of Mekong Steel (seat holder)", opened: "2026-06-18", due: "2026-07-18", status: "in progress", ownerId: "st-19" },
  { id: "DSR-007", type: "Access", subject: "Verifier contact (TÜV Rheinland)", opened: "2026-05-29", due: "2026-06-28", status: "closed", ownerId: "st-19" },
  { id: "DSR-006", type: "Rectification", subject: "Supplier contact email (Rayong Green Metals)", opened: "2026-05-12", due: "2026-06-11", status: "closed", ownerId: "st-19" },
];

export const RETENTION = [
  { dataClass: "Sealed audit packages (dispatched)", schedule: "10 years (CBAM/ETS-style)", enforcement: "on schedule" },
  { dataClass: "Supplier questionnaire drafts", schedule: "24 months after declaration close", enforcement: "on schedule" },
  { dataClass: "Supplier contact PII", schedule: "36 months after last activity", enforcement: "review due" },
  { dataClass: "Support ticket threads", schedule: "36 months", enforcement: "on schedule" },
  { dataClass: "Impersonation session logs", schedule: "7 years (security)", enforcement: "on schedule" },
];

/* ── Dashboard / reports rollups ──────────────────────────── */

export const KPIS = {
  mrr: ORGS.reduce((s, o) => s + o.mrr, 0),
  activeOrgs: ORGS.filter((o) => o.plan !== "Trial").length,
  trials: ORGS.filter((o) => o.plan === "Trial").length,
  renewalRisk: ORGS.filter((o) => o.renewalRisk).length,
  openQueue: QUEUE.filter((q) => q.status !== "resolved").length,
  openTickets: TICKETS.filter((t) => t.status !== "resolved").length,
  pendingDrafts: REG_DRAFTS.filter((d) => d.status === "awaiting-approval").length,
  declarationsInFlight: DECLARATIONS.filter((d) => d.status !== "dispatched").length,
};

export const MRR_TREND = [
  { month: "Feb", value: 210000 },
  { month: "Mar", value: 252000 },
  { month: "Apr", value: 294000 },
  { month: "May", value: 336000 },
  { month: "Jun", value: 364000 },
  { month: "Jul", value: 364000 },
];

export const FUNNEL = [
  { stage: "Site visitors (30d)", value: 4180 },
  { stage: "Trials started", value: 22 },
  { stage: "First declaration created", value: 14 },
  { stage: "First supplier submission", value: 9 },
  { stage: "Converted to paid", value: 5 },
];
