"use client";

/* ════════════════════════════════════════════════════════════
   THE PLAN, AT RUNTIME — one place that knows what the account is allowed

   lib/config.ts holds the COMMERCIAL shape of a tier (what the billing page
   prints). This holds the OPERATIONAL half: how much of each cap is actually
   in use right now, and whether the next add is over the line.

   WHY IT IS ONE MODULE. The caps used to live as loose numbers beside the
   screens that showed them — `ORG.seatsTotal` said 8 while the tier sold 10,
   and the supplier cap was still enforced on /suppliers months after
   suppliers went unlimited and free. A number that is stated in two places is
   a number that will disagree with itself, and the copy the reader trusts is
   whichever one they happened to land on. Every screen reads its cap from
   here, so the plan can be changed in exactly one file.

   THE MEASURES ARE DERIVED, NEVER STORED. A CN code is "used" because an
   active workspace carries it, a site is used because it is registered, a
   year is open because a workspace reports it. Nothing counts twice, nothing
   drifts when a workspace is archived, and an archived year frees its slot —
   `listWorkspaces()` already excludes archived rows.

   THE CAPS ARE ADVISORY, NOT A LOCK. Certrace never blocks work that is
   already under way: a filing that stops halfway because a seat count moved
   is worse for the exporter than a filing that is one seat over. So the
   product WARNS at the line and points at the plan — the one place it does
   refuse is a NEW unit of scope (a new site, a new year, a new CN code) on an
   account already at its cap, because that is the moment the commitment is
   made, and it can always be unblocked by talking to sales.
   ════════════════════════════════════════════════════════════ */

import { CONTACT_SALES_URL, PLANS, TRIAL_DAYS, TRIAL_PLAN, getPlan, type Plan, type PlanFeatures, type PlanId } from "./config";
import { ORG, TRIAL_STARTED_ON } from "./data";
import { ownInstallations } from "./installations";
import { listWorkspaces } from "./workspace";

export { CONTACT_SALES_URL, TRIAL_DAYS };
export type { Plan, PlanId };

/* ── Showing the four states on a running build ─────────────
   `?plan=trial`, `?plan=standard`, `?trialDay=31` — read once from the URL,
   remembered in localStorage, and applied to every read below.

   IT IS OFF UNTIL THE APP SAYS SO. The override is deliberately invisible to
   the server render and to the first client paint: `override` stays null
   until `activateDemoOverride()` runs from an effect, so the markup React
   hydrates against is the markup the server produced. Without that, opening
   the app with `?plan=starter` saved would render Starter on the client
   against a Trial server tree and every screen would report a hydration
   mismatch.

   Clear it with `?plan=default`. */

type DemoOverride = { plan?: PlanId; trialDay?: number };

const OVERRIDE_KEY = "certrace:demo-plan";
const PLAN_IDS: PlanId[] = ["starter", "standard", "enterprise", "trial"];

let override: DemoOverride | null = null;

export function activateDemoOverride(): void {
  if (typeof window === "undefined") return;
  let stored: DemoOverride = {};
  try {
    stored = JSON.parse(window.localStorage.getItem(OVERRIDE_KEY) ?? "{}") as DemoOverride;
  } catch {
    stored = {};
  }

  const params = new URLSearchParams(window.location.search);
  const askedPlan = params.get("plan");
  const askedDay = params.get("trialDay");

  if (askedPlan === "default") {
    stored = {};
  } else if (askedPlan && (PLAN_IDS as string[]).includes(askedPlan)) {
    stored.plan = askedPlan as PlanId;
  }
  if (askedDay != null && Number.isFinite(Number(askedDay))) stored.trialDay = Number(askedDay);

  if (askedPlan || askedDay != null) {
    try {
      window.localStorage.setItem(OVERRIDE_KEY, JSON.stringify(stored));
    } catch {
      /* ignore quota */
    }
  }
  override = stored;
}

/** The tier this account is on. */
export const currentPlanId = (): PlanId => override?.plan ?? ORG.plan;

export const currentPlan = (): Plan => getPlan(currentPlanId()) ?? PLANS[0];

/** Tier order, for "is this an upgrade or a downgrade" questions. The trial
    sits below every paid tier: moving off it is always an upgrade. */
export const PLAN_ORDER: PlanId[] = ["trial", "starter", "standard", "enterprise"];

export const isUpgrade = (from: PlanId, to: PlanId): boolean => PLAN_ORDER.indexOf(to) > PLAN_ORDER.indexOf(from);

/* ── The trial clock ────────────────────────────────────────
   ONE FACT, DERIVED EVERYWHERE. The days-left figure on /billing, the width
   of the countdown bar beside it, the sidebar strip and the read-only lock
   are all four the same subtraction. Storing "days left" as a number instead
   would be storing an answer that goes stale overnight. */

export type TrialState =
  | { onTrial: false }
  | {
      onTrial: true;
      /** true once the month is up — the account is read-only from here */
      ended: boolean;
      /** whole days consumed, clamped to the length of the trial */
      daysUsed: number;
      /** whole days remaining, never negative */
      daysLeft: number;
      totalDays: number;
      startedOn: Date;
      endsOn: Date;
      /** 0–1, how much of the month is spent — the bar's width */
      fraction: number;
    };

const DAY_MS = 86_400_000;

export function trialState(now: Date = new Date()): TrialState {
  if (currentPlanId() !== "trial") return { onTrial: false };

  const startedOn = new Date(`${TRIAL_STARTED_ON}T00:00:00`);
  const endsOn = new Date(startedOn.getTime() + TRIAL_DAYS * DAY_MS);

  /* `?trialDay=N` pretends the account is N days into the month, so the live
     state and the ended state can both be shown without waiting a month or
     editing lib/data.ts. */
  const elapsed = override?.trialDay != null ? override.trialDay : Math.floor((now.getTime() - startedOn.getTime()) / DAY_MS);

  const daysUsed = Math.max(0, Math.min(TRIAL_DAYS, elapsed));
  const daysLeft = Math.max(0, TRIAL_DAYS - elapsed);

  return {
    onTrial: true,
    ended: elapsed >= TRIAL_DAYS,
    daysUsed,
    daysLeft,
    totalDays: TRIAL_DAYS,
    startedOn,
    endsOn,
    fraction: Math.max(0, Math.min(1, daysUsed / TRIAL_DAYS)),
  };
}

/* ── The lock ───────────────────────────────────────────────
   WHEN THE MONTH IS UP, THE ACCOUNT IS A READING ROOM. Every screen still
   opens, every figure the exporter built is still on it, every supplier
   answer is still there — and nothing can be changed, sent, added or
   downloaded. Chasing stops with it: an account that cannot be worked on must
   not keep sending a supplier reminders about a month nobody can accept.

   IT SAYS NOTHING. There is no banner, no ribbon and no "your trial ended"
   dialog anywhere in the product. A locked control simply takes the reader to
   Plan & billing, which is the only screen that can do anything about it, and
   which carries the whole story in one place. Copy repeated on forty screens
   is forty things to translate and forty places for it to go stale; a
   consistent destination is one.

   Enforced in three layers, because one is never enough:
     · components/account-lock.tsx — the interceptor over the page body
     · this module                 — `writeBlocked()`, called by the stores
     · the route guard             — /workspaces/new redirects here */
export function accountLocked(): boolean {
  const trial = trialState();
  return trial.onTrial && trial.ended;
}

/** Where every blocked control goes. One destination, named once. */
export const LOCK_DESTINATION = "/billing";

/** For the data layer: `if (writeBlocked()) return;` at the top of a mutation.
    The UI already refuses, so reaching this is a bug or a stale timer — but a
    frozen account that can still be written to by a background path is not
    frozen. */
export const writeBlocked = (): boolean => accountLocked();

/* ── Feature gates ─────────────────────────────────────────── */

/** Whether the current tier switches a feature on. Enterprise gets everything. */
export const planAllows = (feature: keyof PlanFeatures): boolean => currentPlan().features[feature];

/** The cheapest tier that carries a feature — so a locked panel can name the
    plan to move to rather than saying "upgrade" and leaving the reader to
    guess which one. */
export const firstPlanWith = (feature: keyof PlanFeatures): Plan | null =>
  PLANS.find((p) => p.features[feature]) ?? null;

/* ── Counted caps ──────────────────────────────────────────── */

export type CapKey = "cnCodes" | "sites" | "years" | "seats";

export type CapState = {
  key: CapKey;
  /** how many are in use right now */
  used: number;
  /** null = not capped on this tier */
  cap: number | null;
  /** true once used >= cap. Always false when uncapped. */
  atCap: boolean;
  /** true when used has passed the cap — possible on a downgrade, never blocked */
  overCap: boolean;
  /** "4/10" or "4" when uncapped */
  label: string;
  /** 0–1, for the meters. 0 when uncapped. */
  fraction: number;
};

function state(key: CapKey, used: number, cap: number | null): CapState {
  return {
    key,
    used,
    cap,
    atCap: cap != null && used >= cap,
    overCap: cap != null && used > cap,
    label: cap != null ? `${used}/${cap}` : String(used),
    fraction: cap != null && cap > 0 ? Math.min(1, used / cap) : 0,
  };
}

/* Each of these reads a store, so they are client-side only — every caller is
   inside a "use client" screen, and the ones that render a count already wait
   for their own load effect before they do. */

/** Distinct CN codes across the active estate. A CN code bought once covers
    every site and every year that reports it, so this is a SET — an exporter
    running the same code at three plants has spent one code, not three. */
export function cnCodesUsed(): number {
  const codes = new Set(
    listWorkspaces()
      .map((w) => w.cnCode.trim())
      .filter(Boolean),
  );
  return codes.size;
}

/** Sites the exporter operates themselves. A supplier's plant is not counted:
    suppliers are free on every tier, and so are their installations. */
export const sitesUsed = (): number => ownInstallations().length;

/** Reporting years with at least one active workspace in them. */
export function yearsOpen(): number {
  return new Set(listWorkspaces().map((w) => w.year)).size;
}

export const cnCodeCap = (): CapState => state("cnCodes", cnCodesUsed(), currentPlan().caps.cnCodes);
export const siteCap = (): CapState => state("sites", sitesUsed(), currentPlan().caps.sites);
export const yearCap = (): CapState => state("years", yearsOpen(), currentPlan().caps.years);

/** Seats are passed in rather than read: the team screen holds the live list
    in React state (a seat removed there must move the counter immediately),
    and the sidebar has only the fixture count. */
export const seatCap = (used: number = ORG.seatsUsed): CapState => state("seats", used, currentPlan().caps.seats);

/** Every counted cap, for a summary strip. */
export const allCaps = (seatsUsed?: number): CapState[] => [cnCodeCap(), siteCap(), yearCap(), seatCap(seatsUsed)];

/* ── What a cap is called on screen ─────────────────────────
   English source strings, wrapped by the caller's own `t()` so they translate
   with everything else. Kept here so /billing, /team, /settings and the
   sidebar name the same limit the same way. */

export const CAP_LABEL: Record<CapKey, string> = {
  cnCodes: "CN codes",
  sites: "Installations",
  years: "Reporting years open",
  seats: "Team seats",
};

/** The sentence a screen shows when the next add would cross the line.
    `{plan}` and `{cap}` interpolate through the caller's `t()`.

    TWO FORMS, because Starter caps three of these at ONE and "covers 1
    production sites" is the kind of sentence that makes a reader trust the
    number less. The singular form drops the digit entirely rather than
    bolting an (s) on: a cap of one is better said than counted. Thai has no
    plural, so both forms translate to the same shape there — the split costs
    nothing on that side. */
export const CAP_BLOCKED: Record<CapKey, { one: string; many: string }> = {
  cnCodes: {
    one: "Your {plan} plan covers a single CN code, and it is in use.",
    many: "Your {plan} plan covers {cap} CN codes, and all of them are in use.",
  },
  sites: {
    one: "Your {plan} plan covers a single installation, and it is registered.",
    many: "Your {plan} plan covers {cap} installations, and all of them are registered.",
  },
  years: {
    one: "Your {plan} plan keeps one reporting year open at a time.",
    many: "Your {plan} plan keeps {cap} reporting years open at once.",
  },
  seats: {
    one: "Your {plan} plan includes a single team seat, and it is taken.",
    many: "Your {plan} plan includes {cap} team seats, and all of them are taken.",
  },
};

/** The right form for a measured cap. */
export const capBlockedText = (cap: CapState): string => (cap.cap === 1 ? CAP_BLOCKED[cap.key].one : CAP_BLOCKED[cap.key].many);

/** Always the same next move: the price is quoted, so raising a cap is a
    conversation, not a checkout. */
export const CAP_REMEDY = "Talk to sales to raise it — suppliers and precursor suppliers can still fill in through their link, without limit.";
