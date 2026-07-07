/* Transactional overlay on top of the fixtures — localStorage, per browser.
   Every mutating console action appends an audit event here (plan doc §7:
   no module is exempt). The API seam a real backend replaces. */

import {
  AUDIT_FIXTURES,
  QUEUE,
  REG_DRAFTS,
  TICKETS,
  ANNOUNCEMENTS,
  FEATURE_FLAGS,
  INVOICES,
  STAFF,
  getRole,
  type AuditEvent,
  type ModuleId,
  type QueueItem,
  type RegDraft,
  type Ticket,
  type Announcement,
  type FeatureFlag,
  type Invoice,
  type StaffUser,
} from "@/lib/admin-data";

const KEY = "certrace-admin:store";

type Overlay = {
  audit: AuditEvent[];
  queue: Record<string, Partial<QueueItem>>;
  drafts: Record<string, Partial<RegDraft>>;
  ticketStatus: Record<string, Ticket["status"]>;
  ticketReplies: Record<string, Ticket["thread"]>;
  announcements: Record<string, Partial<Announcement>>;
  announcementsNew: Announcement[];
  flags: Record<string, boolean>;
  impersonations: { orgId: string; staffId: string; reason: string; startedAt: string }[];
  staffNew: StaffUser[];
  staffEdit: Record<string, Partial<StaffUser>>;
  invoiceStatus: Record<string, Invoice["status"]>;
};

const EMPTY: Overlay = {
  audit: [],
  queue: {},
  drafts: {},
  ticketStatus: {},
  ticketReplies: {},
  announcements: {},
  announcementsNew: [],
  flags: {},
  impersonations: [],
  staffNew: [],
  staffEdit: {},
  invoiceStatus: {},
};

function read(): Overlay {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function write(o: Overlay) {
  window.localStorage.setItem(KEY, JSON.stringify(o));
  window.dispatchEvent(new Event("admin-store"));
}

function mutate(fn: (o: Overlay) => void) {
  const o = read();
  fn(o);
  write(o);
}

export function nowStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* React hook: re-render on any store mutation. */
import * as React from "react";
export function useAdminStore() {
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    window.addEventListener("admin-store", bump);
    return () => window.removeEventListener("admin-store", bump);
  }, []);
}

/* ── Audit ────────────────────────────────────────────────── */

export function logAudit(actor: StaffUser, module: ModuleId, action: string, target: string, detail?: string) {
  mutate((o) => {
    o.audit.unshift({
      id: `live-${Date.now()}`,
      at: nowStamp(),
      actorId: actor.id,
      module,
      action,
      target,
      detail,
      superFlag: getRole(actor.roleId).dept === "super",
    });
  });
}

export function allAudit(): AuditEvent[] {
  return [...read().audit, ...AUDIT_FIXTURES];
}

/* ── Merged views (fixture + overlay) ─────────────────────── */

export function allQueue(): QueueItem[] {
  const o = read();
  return QUEUE.map((q) => ({ ...q, ...o.queue[q.id] }));
}

export function updateQueue(actor: StaffUser, id: string, patch: Partial<QueueItem>, action: string, detail?: string) {
  mutate((o) => {
    o.queue[id] = { ...o.queue[id], ...patch };
  });
  logAudit(actor, "verification", action, id, detail);
}

export function allDrafts(): RegDraft[] {
  const o = read();
  return REG_DRAFTS.map((d) => ({ ...d, ...o.drafts[d.id] }));
}

export function updateDraft(actor: StaffUser, id: string, patch: Partial<RegDraft>, action: string, detail?: string) {
  mutate((o) => {
    o.drafts[id] = { ...o.drafts[id], ...patch };
  });
  logAudit(actor, "regulatory", action, id, detail);
}

export function allTickets(): Ticket[] {
  const o = read();
  return TICKETS.map((t) => ({
    ...t,
    status: o.ticketStatus[t.id] ?? t.status,
    thread: [...t.thread, ...(o.ticketReplies[t.id] ?? [])],
  }));
}

export function setTicketStatus(actor: StaffUser, id: string, status: Ticket["status"]) {
  mutate((o) => {
    o.ticketStatus[id] = status;
  });
  logAudit(actor, "support", `ticket.${status}`, id);
}

export function replyTicket(actor: StaffUser, id: string, body: string, internal: boolean) {
  mutate((o) => {
    o.ticketReplies[id] = [...(o.ticketReplies[id] ?? []), { from: actor.name, at: nowStamp(), body, internal }];
  });
  logAudit(actor, "support", internal ? "ticket.note" : "ticket.reply", id);
}

export function allAnnouncements(): Announcement[] {
  const o = read();
  return [
    ...o.announcementsNew.map((a) => ({ ...a, ...o.announcements[a.id] })),
    ...ANNOUNCEMENTS.map((a) => ({ ...a, ...o.announcements[a.id] })),
  ];
}

export function createAnnouncement(
  actor: StaffUser,
  input: { title: string; body: string; audience: string },
  publish: boolean,
) {
  const id = `ann-live-${Date.now()}`;
  mutate((o) => {
    o.announcementsNew.unshift({
      id,
      title: input.title,
      body: input.body,
      audience: input.audience,
      status: publish ? "published" : "draft",
      authorId: actor.id,
      publishedAt: publish ? nowStamp() : undefined,
    });
  });
  logAudit(actor, "announcements", publish ? "announcement.publish" : "announcement.draft", id, input.title);
  return id;
}

export function publishAnnouncement(actor: StaffUser, id: string) {
  mutate((o) => {
    o.announcements[id] = { status: "published", publishedAt: nowStamp() };
  });
  logAudit(actor, "announcements", "announcement.publish", id);
}

export function allFlags(): FeatureFlag[] {
  const o = read();
  return FEATURE_FLAGS.map((f) => ({ ...f, enabled: o.flags[f.key] ?? f.enabled }));
}

export function toggleFlag(actor: StaffUser, key: string, enabled: boolean) {
  mutate((o) => {
    o.flags[key] = enabled;
  });
  logAudit(actor, "system", enabled ? "flag.enable" : "flag.disable", key);
}

/* ── Staff directory (fixtures + invited/edited overlay) ──── */

export function allStaff(): StaffUser[] {
  const o = read();
  return [...STAFF, ...o.staffNew].map((s) => ({ ...s, ...o.staffEdit[s.id] }));
}

export function findStaff(id: string): StaffUser | undefined {
  return allStaff().find((s) => s.id === id);
}

export function staffName(id: string) {
  return findStaff(id)?.name ?? id;
}

export function inviteStaff(actor: StaffUser, input: { name: string; email: string; roleId: string }) {
  const id = `st-live-${Date.now()}`;
  mutate((o) => {
    o.staffNew.push({ id, name: input.name, email: input.email, roleId: input.roleId, status: "invited", lastLoginAt: "—" });
  });
  logAudit(actor, "staff", "staff.invite", id, `Invited ${input.name} as ${getRole(input.roleId).name}.`);
  return id;
}

export function updateStaff(actor: StaffUser, id: string, patch: Partial<StaffUser>, action: string, detail?: string) {
  mutate((o) => {
    o.staffEdit[id] = { ...o.staffEdit[id], ...patch };
  });
  logAudit(actor, "staff", action, id, detail);
}

/* First sign-in activates an invited account; every sign-in stamps last login.
   Session bookkeeping, not a staff-management action — so no audit entry. */
export function recordLogin(id: string) {
  mutate((o) => {
    const current = findStaff(id);
    o.staffEdit[id] = {
      ...o.staffEdit[id],
      lastLoginAt: nowStamp(),
      ...(current?.status === "invited" ? { status: "active" as const } : {}),
    };
  });
}

/* ── Invoices ─────────────────────────────────────────────── */

export function allInvoices(): Invoice[] {
  const o = read();
  return INVOICES.map((i) => ({ ...i, status: o.invoiceStatus[i.id] ?? i.status }));
}

export function markInvoicePaid(actor: StaffUser, id: string) {
  mutate((o) => {
    o.invoiceStatus[id] = "paid";
  });
  logAudit(actor, "billing", "invoice.mark-paid", id, "Payment recorded manually.");
}

export function sendInvoiceReminder(actor: StaffUser, id: string, orgName: string) {
  logAudit(actor, "billing", "invoice.remind", id, `Dunning reminder emailed to ${orgName}.`);
}

export function startImpersonation(actor: StaffUser, orgId: string, reason: string) {
  mutate((o) => {
    o.impersonations.unshift({ orgId, staffId: actor.id, reason, startedAt: nowStamp() });
  });
  logAudit(actor, "accounts", "impersonation.start", orgId, `Reason: ${reason}. Time-boxed 30 min.`);
}

export function resetStore() {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("admin-store"));
}
