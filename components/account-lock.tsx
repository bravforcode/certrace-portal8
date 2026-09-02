"use client";

/* ════════════════════════════════════════════════════════════
   THE ACCOUNT STATE, AND WHAT HAPPENS WHEN THE TRIAL IS OVER

   TWO THINGS LIVE HERE. `AccountProvider` is the one place a screen asks
   which plan it is on, how much of a trial is left and whether the account is
   frozen. `LockGuard` is what enforces the freeze.

   ── WHY A PROVIDER AND NOT JUST lib/plan.ts ────────────────
   The plan can be overridden per browser (`?plan=trial`, `?trialDay=31` — see
   lib/plan.ts), and the trial countdown depends on today's date. Both are
   facts the SERVER cannot know, so reading either during render would produce
   markup React then refuses to hydrate. The provider therefore renders
   `ready: false` on the server and on the first client paint, and fills the
   real state in from an effect. Screens show nothing plan-shaped until
   `ready` — the same discipline /billing already used for its usage meters.

   ── HOW THE FREEZE WORKS ───────────────────────────────────
   Not by disabling 167 buttons one at a time. A capture-phase interceptor
   sits over the page body and stops any control that would CHANGE something,
   then sends the reader to LOCK_DESTINATION — which in this build is
   /account, not /billing. See the note on LOCK_DESTINATION in lib/plan.ts.

   IT IS NOT THE ONLY GUARD HERE. components/seat-lock.tsx is the same shape
   aimed at the seat rather than the plan, and the two are independent: a
   trial can end on any seat, and a seat is bounded on any plan. This one is
   the outer answer — a frozen account refuses everybody, including a
   reviewer who is otherwise allowed to correct a figure.

   THE SCOPE IS `<main>` AND OVERLAYS — deliberately, because the portal's
   chrome is outside it. The sidebar, the topbar, notifications, the language
   switcher and the account menu keep working exactly as before, which is what
   makes the locked account a reading room rather than a wall: every screen
   still opens, in either language, and every figure the exporter built during
   the month is still on it.

   WHAT COUNTS AS "CHANGING SOMETHING":
     · buttons, inputs, textareas, selects, contenteditable, switches
     · anything with `download` on it
   WHAT DOES NOT:
     · links — a link goes somewhere, and going places is the whole point
     · anything marked `data-lock="allow"` — help toggles, modal closes,
       view switches, search boxes: controls that only change what you are
       LOOKING at, never what is stored
     · anything under `data-lock="chrome"` — the shell

   IT SAYS NOTHING WHEN IT REFUSES. No toast, no banner, no dialog. The click
   simply lands on /account, which carries the whole explanation in one place
   and names the person who can lift the freeze. See the note on
   `accountLocked` in lib/plan.ts for why forty copies of that sentence would
   be worse than none. This seat cannot lift it — which is exactly why the
   destination has to name somebody who can, rather than being a pricing table
   nobody reading it can act on.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ORG } from "@/lib/data";
import {
  LOCK_DESTINATION,
  accountLocked,
  activateDemoOverride,
  currentPlan,
  currentPlanId,
  trialState,
  type Plan,
  type PlanId,
  type TrialState,
} from "@/lib/plan";

export type AccountState = {
  /** false until the client has measured the plan — render nothing plan-shaped before it */
  ready: boolean;
  planId: PlanId;
  plan: Plan;
  trial: TrialState;
  /** the trial is over: the account is read-only */
  locked: boolean;
};

const INITIAL: AccountState = {
  ready: false,
  planId: ORG.plan,
  plan: currentPlan(),
  trial: { onTrial: false },
  locked: false,
};

const AccountContext = React.createContext<AccountState>(INITIAL);

export function useAccount(): AccountState {
  return React.useContext(AccountContext);
}

/** The trial, or null when the account is not on one. Saves every caller the
    `onTrial` narrowing when all it wants is the countdown. */
export function useTrial() {
  const { trial, ready } = useAccount();
  return ready && trial.onTrial ? trial : null;
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AccountState>(INITIAL);

  React.useEffect(() => {
    activateDemoOverride();
    const read = () =>
      setState({ ready: true, planId: currentPlanId(), plan: currentPlan(), trial: trialState(), locked: accountLocked() });
    read();
    /* A trial that runs out while the tab is open should lock the tab, not
       wait for a reload. Once an hour is plenty for a countdown measured in
       days, and costs nothing. */
    const timer = window.setInterval(read, 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <AccountContext.Provider value={state}>
      <LockGuard locked={state.locked} />
      {children}
    </AccountContext.Provider>
  );
}

/* ── Routes that exist to CREATE something ──────────────────
   A link is allowed through the interceptor, so a locked account can still
   walk to the new-workspace flow — and then it is standing in front of a form
   it cannot fill in. The guard turns that into the same outcome every other
   blocked control has: /account. Prefix-matched, so a future
   /workspaces/new/step-2 needs no second entry. */
const CREATE_ROUTES = ["/workspaces/new"];

const isCreateRoute = (path: string) => CREATE_ROUTES.some((r) => path === r || path.startsWith(`${r}/`));

/* Anything that changes stored state. `label[for]` is here because clicking a
   label activates the control it points at, so leaving it out would let a
   styled checkbox through the one route nobody looks at. */
const MUTATING =
  'button, input, textarea, select, summary, label[for], [contenteditable="true"], [role="button"], [role="switch"], [role="checkbox"], [role="radio"], [role="menuitemcheckbox"], [role="menuitemradio"]';

/** Keys that only move the cursor or dismiss something — never a change. */
const INERT_KEYS = new Set(["Tab", "Escape", "Shift", "Control", "Meta", "Alt", "CapsLock", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"]);

function LockGuard({ locked }: { locked: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  /* The attribute the stylesheet keys off, so a frozen page LOOKS frozen —
     muted controls, not-allowed cursors — without a word of copy. */
  React.useEffect(() => {
    const html = document.documentElement;
    if (locked) html.setAttribute("data-account-locked", "1");
    else html.removeAttribute("data-account-locked");
    return () => html.removeAttribute("data-account-locked");
  }, [locked]);

  React.useEffect(() => {
    if (locked && isCreateRoute(pathname)) router.replace(LOCK_DESTINATION);
  }, [locked, pathname, router]);

  React.useEffect(() => {
    if (!locked) return;

    /* One navigation per gesture. A single press fires pointerdown, then
       click, and a form submit can fire on top of both — three pushes to the
       same route for one finger. */
    let lastNav = 0;
    const goToAccess = () => {
      const now = Date.now();
      if (now - lastNav < 700) return;
      lastNav = now;
      if (window.location.pathname !== LOCK_DESTINATION) router.push(LOCK_DESTINATION);
    };

    const handle = (e: Event) => {
      const target = e.target;
      if (!(target instanceof Element)) return;

      // The shell, and anything that only changes what you are looking at.
      if (target.closest('[data-lock="chrome"], [data-lock="allow"]')) return;

      // Inside the page body or an overlay, and nowhere else.
      if (!target.closest('main, [data-lock="scope"]')) return;

      const control = target.closest(MUTATING);
      const link = target.closest("a[href]");

      // A link goes somewhere. Unless it hands over a file, which is a thing
      // the plan pays for.
      if (link && !link.hasAttribute("download")) {
        if (!control || link.contains(control)) return;
      }
      if (!control && !(link && link.hasAttribute("download"))) return;

      if (e instanceof KeyboardEvent) {
        if (INERT_KEYS.has(e.key) || e.metaKey || e.ctrlKey) return;
      }

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Only a deliberate activation navigates. Tabbing across a frozen form
      // must not throw the reader off the page they are reading.
      if (e.type === "click" || e.type === "submit" || (e instanceof KeyboardEvent && (e.key === "Enter" || e.key === " "))) goToAccess();
    };

    const types = ["pointerdown", "mousedown", "click", "keydown", "paste", "drop", "submit", "change"] as const;
    types.forEach((type) => document.addEventListener(type, handle, true));
    return () => types.forEach((type) => document.removeEventListener(type, handle, true));
  }, [locked, router]);

  return null;
}
