/* ════════════════════════════════════════════════════════════
   THE BELL — WHAT IT SAYS, AND WHEN

   One list, derived. Nothing here is stored as "a notification": each is a situation that is true
   of the account right now (a month is late, a supplier has not answered, a package is ready, the
   trial has three days left) or something that happened lately (a month came in, a document was
   uploaded), read off the SAME DashboardData the dashboard draws. So the bell can never say a
   month is late that the dashboard calls on time, and the day the month is filed the notice is
   gone — there is nothing to clear.

   Who it is from decides what a click does. This is the rule the screen follows:

     · About YOUR work — a month, a supplier, a document, a report. The click goes to the place
       that fixes it, and for a month to the field that is empty (`#qf-production`).
     · From CERTREACE or the SYSTEM — a rule change in the EU, a date that is coming, the trial,
       a sign-in, an announcement. There is nowhere to "go": it is a message, so the click opens
       it, in full, in a popup. Exactly one of `href` and `message` is set on every notice.

   Every notice belongs to one preference group (Settings → Notifications). A group that is off
   is filtered out here, once, so no screen has to remember to.

   The feed is a pure function of its input, so it can be tested without a browser.
   ════════════════════════════════════════════════════════════ */

import { PRECURSOR_STALE_DAYS } from "../cbam/action-queue";
import type { ActionItem } from "../cbam/action-queue";
import type { DashboardData } from "../cbam/dashboard-data";
import type { Concern, ConcernKind } from "../cbam/supply-chain-model";
import type { UpdateItem } from "../cera/types";
import type { PrefKey } from "../notification-prefs";
import { CAP_LABEL, CAP_REMEDY, capBlockedText, type CapState, type TrialState } from "../plan";
import { TAB_LABEL } from "../readiness";
import type { Announcement } from "./announcements";
import type { AppEvent } from "./events";

export type Tone = "ok" | "info" | "warn" | "err" | "muted";

/** A sentence as a dictionary key and its parts, so the screen says it in the language then on screen. */
export type Say = {
  key: string;
  vars?: Record<string, string | number>;
  /** `vars.month` is an ISO month ("2026-08"), named when the sentence is drawn */
  month?: boolean;
  /** vars whose value is itself a dictionary key (a tab's name, a limit's name) */
  tv?: string[];
  /** vars whose value is an ISO date, written out when the sentence is drawn */
  dv?: string[];
  /** said as is, no lookup — a name of a product or a site */
  text?: string;
};

export type Message = {
  body: Say[];
  /** who it is from, when it is not Certrace itself */
  source?: string;
  cta?: { label: string; href?: string; /** a question to put to Cera instead of going anywhere */ ask?: string };
};

export type Notice = {
  id: string;
  group: PrefKey;
  /** needs doing · something happened · a message */
  kind: "action" | "event" | "message";
  tone: Tone;
  title: Say;
  meta?: Say;
  /** when it happened; for something that needs doing, now. A date in the future is a date that is coming. */
  at: string;
  /** a state, not an event — "the trial has 3 days left" did not happen at any moment, so no time is shown beside it */
  undated?: boolean;
  /** about the work: where a click goes */
  href?: string;
  /** from Certrace or the system: what the popup says */
  message?: Message;
  /** a supply-chain worry: its sentence is drawn by the screen that owns it */
  concern?: Concern;
  /** the rules-digest entry it is, so reading it here marks it seen there */
  updateId?: string;
  /** 0 urgent · 1 soon · 2 to do · 3 for information */
  rank: number;
  /** among the same rank, the larger is more urgent */
  urgency: number;
};

export type FeedInput = {
  now: Date;
  dash: DashboardData;
  /** the made-up estate: its links lead to nothing real, so they lead to the list instead */
  sample?: boolean;
  trial: TrialState;
  caps: CapState[];
  planName: string;
  events: AppEvent[];
  updates: UpdateItem[];
  announcements: Announcement[];
  prefs: Record<PrefKey, boolean>;
};

const DAY = 86_400_000;
const daysBetween = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / DAY);
const sayText = (text: string): Say => ({ key: "", text });

/** How far back a thing that happened is still news. */
export const HAPPENED_DAYS = 14;
/** Rule changes are news for this long after they take effect, and this long before. */
export const NEWS_BACK_DAYS = 45;
export const NEWS_AHEAD_DAYS = 14;
/** The days-to-go at which the declaration date is worth a message. One message per step, not one a day. */
export const DEADLINE_TIERS = [365, 270, 180, 120, 90, 60, 30, 14, 7, 3, 1];
export const TRIAL_TIERS = [14, 7, 3, 1];

const monthOf = (link: string) => /\/monthly\/(\d{4}-\d{2})/.exec(link)?.[1];
const toneRank = (tone: Tone) => (tone === "err" ? 0 : tone === "warn" ? 1 : 2);

/** The first field of a month that is empty — what a late month is waiting for. */
const FIRST_FIELD = "#qf-production";

/* ── About the work: what is late or about to be ──────────────── */
function fromActions(dash: DashboardData, link: (href: string) => string): Notice[] {
  const out: Notice[] = [];
  const at = dash.now.toISOString();
  const unbound: ActionItem[] = [];
  const lateMonths = new Map<string, ActionItem[]>();

  for (const a of dash.actions) {
    if (a.type === "monthly_data") {
      const month = monthOf(a.deepLink);
      if (!month) continue;
      // A late month is held back and counted with the report's others: three or more late months of one report are one notice, not three.
      if (a.daysUntilDue < 0) {
        lateMonths.set(a.workspaceId, [...(lateMonths.get(a.workspaceId) ?? []), a]);
        continue;
      }
      const n = a.daysUntilDue;
      const product = a.workspaceLabel;
      out.push({
        id: `month:${a.workspaceId}:${month}`,
        group: "declarations",
        kind: "action",
        tone: "warn",
        title: { key: "{month} data is due soon", vars: { month }, month: true },
        meta: n === 0 ? { key: "{product} · due today", vars: { product } } : { key: n === 1 ? "{product} · due tomorrow" : "{product} · due in {n} days", vars: { product, n } },
        at,
        href: link(`${a.deepLink}${FIRST_FIELD}`),
        rank: 1,
        urgency: -a.daysUntilDue,
      });
    } else if (a.type === "precursor_invite") {
      const name = String(a.say?.vars.name ?? a.label);
      const since = PRECURSOR_STALE_DAYS + -a.daysUntilDue;
      out.push({
        id: `invite:${a.workspaceId}:${name}`,
        group: "suppliers",
        kind: "action",
        tone: "warn",
        title: { key: "{name} hasn't answered", vars: { name } },
        meta: { key: "{product} · asked {n} days ago", vars: { product: a.workspaceLabel, n: since } },
        at,
        href: link(a.deepLink),
        rank: 1,
        urgency: since,
      });
    } else if (a.type === "precursor_deadline") {
      const late = a.daysUntilDue < 0;
      const tone: Tone = late ? "err" : "warn";
      out.push({
        id: `see-deadline:${a.workspaceId}`,
        group: "declarations",
        kind: "action",
        tone,
        title: { key: a.label },
        meta: sayText(a.workspaceLabel),
        at,
        href: link(a.deepLink),
        rank: toneRank(tone),
        urgency: -a.daysUntilDue,
      });
    } else if (a.type === "mmd_draft") {
      out.push({
        id: `mmd-draft:${a.workspaceId}`,
        group: "declarations",
        kind: "action",
        tone: "info",
        title: { key: a.label },
        meta: sayText(a.workspaceLabel),
        at,
        href: link(a.deepLink),
        rank: 2,
        urgency: 0,
      });
    } else if (a.type === "document_unbound") {
      unbound.push(a);
    }
  }

  for (const [ws, items] of lateMonths) {
    const worst = [...items].sort((a, b) => a.daysUntilDue - b.daysUntilDue);
    if (items.length < 3) {
      for (const a of worst) {
        const month = monthOf(a.deepLink) as string;
        const n = -a.daysUntilDue;
        out.push({
          id: `month:${ws}:${month}`,
          group: "declarations",
          kind: "action",
          tone: "err",
          title: { key: "{month} data is overdue", vars: { month }, month: true },
          meta: { key: n === 1 ? "{product} · 1 day late" : "{product} · {n} days late", vars: { product: a.workspaceLabel, n } },
          at,
          href: link(`${a.deepLink}${FIRST_FIELD}`),
          rank: 0,
          urgency: n,
        });
      }
      continue;
    }
    const oldest = worst[0];
    out.push({
      id: `months:${ws}`,
      group: "declarations",
      kind: "action",
      tone: "err",
      title: { key: "{n} months are overdue", vars: { n: items.length } },
      meta: { key: "{product} · the oldest is {month}, {days} days late", vars: { product: oldest.workspaceLabel, month: monthOf(oldest.deepLink) as string, days: -oldest.daysUntilDue }, month: true },
      at,
      href: link(`/workspaces/${ws}/monthly`),
      rank: 0,
      urgency: -oldest.daysUntilDue,
    });
  }

  // A few documents are named one by one; a pile of them is one notice, or the bell becomes the to-do list.
  if (unbound.length > 0 && unbound.length <= 3) {
    for (const a of unbound) {
      const m = monthOf(a.deepLink);
      const say: Say = a.say ? { key: a.say.key, vars: m && "month" in a.say.vars ? { ...a.say.vars, month: m } : a.say.vars, month: Boolean(m && "month" in a.say.vars) } : { key: a.label };
      out.push({
        id: `doc-unbound:${a.workspaceId}:${a.deepLink}:${a.label}`,
        group: "documents",
        kind: "action",
        tone: "info",
        title: say,
        meta: sayText(a.workspaceLabel),
        at,
        href: link(a.deepLink),
        rank: 2,
        urgency: 0,
      });
    }
  } else if (unbound.length > 3) {
    out.push({
      id: "doc-unbound:many",
      group: "documents",
      kind: "action",
      tone: "info",
      title: { key: "{n} documents are uploaded but not yet bound", vars: { n: unbound.length } },
      meta: { key: "Open Verification, then the report that holds them" },
      at,
      href: link("/workspaces"),
      rank: 2,
      urgency: 0,
    });
  }
  return out;
}

/* ── About the work: where the readiness tabs are stuck ────────── */
function fromTabs(dash: DashboardData, link: (href: string) => string): Notice[] {
  const at = dash.now.toISOString();
  const out: Notice[] = [];
  for (const t of dash.tabs) {
    if (t.blocked <= 0) continue;
    out.push({
      id: `blocked:${t.tab}`,
      group: t.tab === "evidence" ? "documents" : t.tab === "precursors" ? "suppliers" : "declarations",
      kind: "action",
      tone: "err",
      title: { key: t.blocked === 1 ? "1 report is blocked on {tab}" : "{n} reports are blocked on {tab}", vars: { n: t.blocked, tab: TAB_LABEL[t.tab] }, tv: ["tab"] },
      meta: { key: "Open Verification to see which" },
      at,
      href: link("/workspaces"),
      rank: 0,
      urgency: t.blocked,
    });
  }
  return out;
}

/* ── About the chain: the worries the Supply Chain tab ranks ──────
   Late months and stale invitations are not repeated here — they are the action queue's, and one
   situation is one notice. */
const CONCERN_GROUP: Partial<Record<ConcernKind, PrefKey>> = {
  no_contact: "suppliers",
  precursor_not_sent: "suppliers",
  precursor_default: "suppliers",
  precursor_unverified: "suppliers",
  precursor_checks: "ai_review",
};
const CONCERNS_SHOWN = 4;

function fromChain(dash: DashboardData, link: (href: string) => string): Notice[] {
  const at = dash.now.toISOString();
  // One notice per party: a supplier with three worries is one supplier to deal with, and the chain tab lists the rest.
  const seen = new Set<string>();
  return dash.chain.concerns
    .filter((c) => CONCERN_GROUP[c.kind] && c.severity !== "low")
    .filter((c) => (seen.has(c.partyId) ? false : (seen.add(c.partyId), true)))
    .slice(0, CONCERNS_SHOWN)
    .map((c) => {
      const tone: Tone = c.severity === "high" ? "err" : "warn";
      return {
        id: `concern:${c.id}`,
        group: CONCERN_GROUP[c.kind] as PrefKey,
        kind: "action" as const,
        tone,
        title: sayText(c.name),
        at,
        href: link(dash.concernLinks[c.partyId] ?? "/supply-chain"),
        concern: c,
        rank: toneRank(tone),
        urgency: c.severity === "high" ? 2 : 1,
      };
    });
}

/* ── About the work: what has just happened ───────────────────── */
function fromActivity(dash: DashboardData, link: (href: string) => string): Notice[] {
  const out: Notice[] = [];
  const now = dash.now;
  const GROUP = { supplier_submitted: "suppliers", month_submitted: "declarations", document_uploaded: "documents", mmd_finalised: "declarations" } as const;
  const TONE = { supplier_submitted: "ok", month_submitted: "ok", document_uploaded: "muted", mmd_finalised: "ok" } as const;
  for (const e of dash.activity) {
    if (daysBetween(now, new Date(e.at)) > HAPPENED_DAYS) continue;
    const isoMonth = e.say && typeof e.say.vars.month === "string" && /^\d{4}-\d{2}$/.test(e.say.vars.month);
    out.push({
      id: `${e.kind}:${e.workspaceId}:${e.at}`,
      group: GROUP[e.kind],
      kind: "event",
      tone: TONE[e.kind],
      title: e.say ? { key: e.say.key, vars: e.say.vars, month: Boolean(isoMonth) } : { key: e.label },
      meta: sayText(e.workspaceLabel),
      at: e.at,
      href: link(e.deepLink),
      rank: 3,
      urgency: 0,
    });
  }
  const at = now.toISOString();
  for (const site of dash.company.sites.slice(0, 6)) {
    for (const y of site.years) {
      if (!y.packageReady) continue;
      out.push({
        id: `package:${site.id}:${y.year}`,
        group: "declarations",
        kind: "event",
        tone: "ok",
        title: { key: "Package ready to send" },
        meta: sayText(`${site.name} · ${y.year}`),
        at,
        undated: true,
        href: link("/reports"),
        rank: 3,
        urgency: 0,
      });
    }
  }
  return out.slice(0, 10);
}

/* ── From Certrace: the date everything is working towards ───────
   One message per step of the countdown, not one a day — it is the same date, and a daily notice
   is one nobody reads by the second week. */
function fromDeadline(dash: DashboardData): Notice[] {
  const days = dash.daysToDeadline;
  const tier = [...DEADLINE_TIERS].sort((a, b) => a - b).find((t) => days <= t);
  if (!tier) return [];
  const tone: Tone = days <= 30 ? "err" : days <= 90 ? "warn" : "info";
  return [
    {
      id: `deadline:${tier}`,
      group: "declarations",
      kind: "message",
      tone,
      title: { key: days === 1 ? "1 day left to get your figures to buyers" : "{n} days left to get your figures to buyers", vars: { n: days } },
      at: dash.now.toISOString(),
      undated: true,
      message: {
        body: [
          { key: "Your buyers file their first CBAM declaration on {date} and need your verified figures before then.", vars: { date: dash.deadline.toISOString().slice(0, 10) }, dv: ["date"] },
          { key: "First-year verification includes a site visit, so line up your verifier early and keep the months coming in." },
          { key: "The dashboard shows how far each report has got, and which ones are holding the package up." },
        ],
        cta: { label: "Open Verification", href: "/workspaces" },
      },
      // far off it is information, among the messages; close it is a warning, among the things that need doing
      rank: tone === "info" ? 3 : toneRank(tone),
      urgency: 100 - Math.min(days, 100),
    },
  ];
}

/* ── From Certrace: the plan ──────────────────────────────────── */
function fromPlan(i: FeedInput): Notice[] {
  const out: Notice[] = [];
  const at = i.now.toISOString();
  const trial = i.trial;
  if (trial.onTrial) {
    if (trial.ended) {
      out.push({
        id: "trial:ended",
        group: "billing",
        kind: "message",
        tone: "err",
        title: { key: "Your free trial has ended" },
        at,
        undated: true,
        message: {
          body: [
            { key: "Everything you built is still here and still readable, but nothing can be changed, sent or downloaded until you choose a plan." },
            { key: "Suppliers keep their links and are never charged." },
          ],
          cta: { label: "See plans", href: "/billing" },
        },
        rank: 0,
        urgency: 100,
      });
    } else {
      const tier = [...TRIAL_TIERS].sort((a, b) => a - b).find((t) => trial.daysLeft <= t);
      if (tier) {
        out.push({
          id: `trial:${tier}`,
          group: "billing",
          kind: "message",
          tone: trial.daysLeft <= 3 ? "err" : "warn",
          title: { key: trial.daysLeft === 1 ? "Your free trial ends tomorrow" : "Your free trial ends in {n} days", vars: { n: trial.daysLeft } },
          at,
          undated: true,
          message: {
            body: [
              { key: "When the trial ends the account becomes read-only: you can still open everything, but nothing can be changed, sent or downloaded." },
              { key: "Choose a plan before then to keep working without a break." },
            ],
            cta: { label: "See plans", href: "/billing" },
          },
          rank: trial.daysLeft <= 3 ? 0 : 1,
          urgency: 50 - trial.daysLeft,
        });
      }
    }
  }
  for (const cap of i.caps) {
    if (!cap.atCap || cap.key === "seats") continue;
    out.push({
      id: `cap:${cap.key}:${cap.cap}`,
      group: "billing",
      kind: "message",
      tone: "warn",
      title: { key: "You've reached your plan's limit on {what}", vars: { what: CAP_LABEL[cap.key] }, tv: ["what"] },
      at,
      undated: true,
      message: { body: [{ key: capBlockedText(cap), vars: { plan: i.planName, cap: cap.cap ?? 0 } }, { key: CAP_REMEDY }], cta: { label: "See plans", href: "/billing" } },
      rank: 1,
      urgency: 10,
    });
  }
  return out;
}

/* ── From the system: the account ─────────────────────────────── */
const EVENT_TEXT = {
  sign_in: { title: "New sign-in to your account", tone: "info" as Tone, body: ["Your account was signed in on {device}.", "If that was you, there is nothing to do. If it was not, change your password now and sign out the other sessions."], cta: "Open security settings" },
  password_changed: { title: "Your password was changed", tone: "ok" as Tone, body: ["The password for your account was changed.", "If you did not do this, change it again now and sign out the other sessions."], cta: "Open security settings" },
  sessions_signed_out: { title: "Your other sessions were signed out", tone: "ok" as Tone, body: ["Every other browser and device signed in to your account was signed out.", "Only this one is signed in now."], cta: "Open security settings" },
};

function fromEvents(i: FeedInput): Notice[] {
  return i.events
    .filter((e) => daysBetween(i.now, new Date(e.at)) <= 30 && e.kind in EVENT_TEXT)
    .slice(0, 5)
    .map((e) => {
      const x = EVENT_TEXT[e.kind];
      return {
        id: e.id,
        group: "security" as const,
        kind: "message" as const,
        tone: x.tone,
        title: { key: x.title },
        meta: e.detail ? sayText(e.detail) : undefined,
        at: e.at,
        message: {
          body: x.body.map((key, n) => ({ key, vars: n === 0 && e.detail ? { device: e.detail } : undefined })),
          cta: { label: x.cta, href: "/settings?tab=privacy" },
        },
        rank: 3,
        urgency: 0,
      };
    });
}

/* ── From the EU, by way of Certrace: the rules digest ─────────── */
function fromRules(i: FeedInput): Notice[] {
  const from = new Date(i.now.getTime() - NEWS_BACK_DAYS * DAY).toISOString().slice(0, 10);
  const to = new Date(i.now.getTime() + NEWS_AHEAD_DAYS * DAY).toISOString().slice(0, 10);
  return i.updates
    .filter((u) => u.date >= from && u.date <= to)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((u) => ({
      id: `news:${u.id}`,
      group: "regulation" as const,
      kind: "message" as const,
      tone: "info" as Tone,
      title: { key: u.title },
      // a date in the future is a date that is coming — the screen says "30 Nov 2026" instead of "3 days ago"
      at: `${u.date}T09:00:00.000Z`,
      updateId: u.id,
      message: {
        body: [{ key: u.body }],
        source: u.source,
        cta: { label: "Ask Cera about this", ask: "What's new in CBAM?" },
      },
      rank: 3,
      urgency: 0,
    }));
}

function fromAnnouncements(i: FeedInput): Notice[] {
  return i.announcements
    .filter((a) => daysBetween(i.now, new Date(`${a.date}T09:00:00Z`)) <= 30 && a.date <= i.now.toISOString().slice(0, 10))
    .map((a) => ({
      id: `product:${a.id}`,
      group: "product" as const,
      kind: "message" as const,
      tone: "muted" as Tone,
      title: { key: a.title },
      at: `${a.date}T09:00:00.000Z`,
      message: { body: a.body.map((key) => ({ key })), cta: a.cta },
      rank: 3,
      urgency: 0,
    }));
}

/* ── The whole feed ────────────────────────────────────────────── */
export function buildFeed(i: FeedInput): Notice[] {
  const link = (href: string) => (i.sample && href.startsWith("/workspaces/sample") ? "/workspaces" : href);
  const all = [
    ...fromActions(i.dash, link),
    ...fromTabs(i.dash, link),
    ...fromChain(i.dash, link),
    ...fromActivity(i.dash, link),
    ...fromDeadline(i.dash),
    ...fromPlan(i),
    ...fromEvents(i),
    ...fromRules(i),
    ...fromAnnouncements(i),
  ];

  // One id is one notice, whatever put it there twice.
  const seen = new Set<string>();
  const unique = all.filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)));

  return unique
    .filter((n) => n.group === "security" || i.prefs[n.group] !== false)
    .sort((a, b) => a.rank - b.rank || (a.rank < 3 ? b.urgency - a.urgency : b.at.localeCompare(a.at)) || a.id.localeCompare(b.id));
}
