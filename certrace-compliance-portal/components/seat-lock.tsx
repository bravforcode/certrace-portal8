"use client";

/* ════════════════════════════════════════════════════════════
   WHAT STOPS THIS SEAT FROM WRITING

   lib/seat.ts says what the Legal / Compliance seat may do. This is the thing
   that makes the saying true across a product with several hundred inputs in
   it.

   ── READ THIS FIRST: THE FIELD GUARD IS CURRENTLY STOOD DOWN ──
   This build ended with `enterFigures` GRANTED to the compliance seat (see
   lib/seat.ts — the account holder asked for it: compliance corrects a
   reading the way a member does). Every effect below asks `can()` rather than
   assuming an answer, so as it ships:

     · the field guard does not arm. `can("enterFigures")` is true, so the
       keystroke listener returns immediately and `data-seat-readonly` is
       never set. Nothing in the product is frozen, and the toast below is
       unreachable.
     · the ROUTE guard is still live. `buildWorkspaces` is withheld, so
       /workspaces/new and /onboarding still redirect.

   NONE OF THIS IS DEAD CODE, and it should not be deleted as such. It is a
   permission mechanism doing what it is told, exactly like the `refuseWrite`
   backstops in the stores, which are also no-ops for a granted capability.
   Narrow the grant in lib/seat.ts and every line below arms again, along with
   the `data-seat="allow"` opt-outs it reads — which is why those stay too.
   The rest of this comment describes what happens when it does.

   ── WHY NOT JUST EDIT THE SCREENS ──────────────────────────
   Because "cannot enter figures" is not a button, it is a category. The
   monthly page alone renders a variable number of fuel rows, each with eight
   fields; the tree renders a field per precursor per tier; evidence is a drop
   target. Enforcing that seat-by-seat at every call site is a promise to
   remember, forever, in every future component. The trial lock in
   components/account-lock.tsx already answered this exact problem for this
   exact app, and this is the same answer aimed at a different question.

   ── HOW IT DIFFERS FROM THE TRIAL LOCK, AND WHY ────────────
   The trial lock freezes BUTTONS AND FIELDS, because a frozen account may not
   act at all. THIS GUARD BLOCKS FIELDS ONLY.

   That difference is the seat. Reading is this seat's whole job, and in this
   product reading is full of buttons: opening a month, expanding a fuel row,
   switching a tab, running a quality check, opening the tree, filtering a
   list. Freeze those and the reviewer cannot review — they are left holding
   a portal that refuses to show them the thing they are supposed to check.

   So: a button does something, and this seat is allowed to do things. A field
   ORIGINATES a value, and originating values is Operations'. The line is
   drawn there, and the two assurance surfaces that genuinely need typing —
   the sign-off name and the send-back comment — opt out with
   `data-seat="allow"`.

   ── AND UNLIKE THE TRIAL LOCK, IT SPEAKS ───────────────────
   The trial lock says nothing and navigates, because it has one screen that
   explains everything and one action that fixes it. This guard cannot do
   that: a reviewer who clicks into March's gas reading has not made a
   mistake, they were checking it, and throwing them off the page they were
   reading would be a punishment for doing their job. So the field simply
   does not take the keystroke, and a toast names the person whose figure it
   is. That is the whole remedy — send it back to them.

   ── THE THREE LAYERS ───────────────────────────────────────
   1. this guard              — the UI, everywhere at once   (stood down)
   2. `refuseWrite()` in the stores — the backstop that actually guarantees it
   3. the route guard below   — /workspaces/new has nothing to offer a seat
                                that cannot create one       (live)
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { DATA_OWNER_NAME, SEAT_DESTINATION, can } from "@/lib/seat";
import { toast } from "./toast";

/* ── Routes this seat has no use for ────────────────────────
   A link is allowed through, so the reader can still walk to the
   new-workspace flow — and then they are standing in front of a form they
   may not submit. Prefix-matched, so a future /workspaces/new/step-2 needs
   no second entry. */
const CREATE_ROUTES = ["/workspaces/new", "/onboarding"];

const isCreateRoute = (path: string) => CREATE_ROUTES.some((r) => path === r || path.startsWith(`${r}/`));

/* ── Where this guard does NOT apply ────────────────────────
   THE SUPPLIER SMART LINKS RUN THE SAME APP AND THE SAME STORES. /w is the
   supplier filling a month in; /s, /p and /self are the questionnaire, the
   precursor link and the self-serve form. They are not this seat and they are
   not even this company — a supplier answering a request has nothing to do
   with who is signed in here.

   A blanket gate would have silently stopped every supplier in the account
   from saving, and it would have looked like a broken form rather than a
   permission. Named here once, and read by `refuseWrite()` too. */
export const OPEN_ROUTES = ["/w/", "/s/", "/p/", "/self/"];

export const isOpenRoute = (path: string): boolean => OPEN_ROUTES.some((r) => path.startsWith(r));

/* ── What counts as ORIGINATING a value ─────────────────────
   Fields, and only fields. `label[for]` is here because clicking a label
   activates the control it points at, so leaving it out would let a styled
   checkbox through the one route nobody looks at.

   `button` is deliberately absent — see the header. */
const FIELDS =
  'input, textarea, select, [contenteditable="true"], [role="switch"], [role="checkbox"], [role="radio"], [role="menuitemcheckbox"], [role="menuitemradio"], label[for]';

/** Keys that only move the cursor or dismiss something — never a change.
    A reviewer must be able to tab through a form and read it. */
const INERT_KEYS = new Set([
  "Tab", "Escape", "Shift", "Control", "Meta", "Alt", "CapsLock",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "Home", "End", "PageUp", "PageDown", "Enter",
]);

/** One toast per gesture. A single keystroke can fire keydown and change and
    input; three identical toasts for one finger reads as a malfunction. */
let lastSaid = 0;

function say(): void {
  const now = Date.now();
  if (now - lastSaid < 2500) return;
  lastSaid = now;
  toast({
    message: "This is not yours to change.",
    tone: "info",
    detail: `Figures are ${DATA_OWNER_NAME}'s. Send the month back and they will correct it.`,
  });
}

export function SeatGuard() {
  const router = useRouter();
  const pathname = usePathname();

  /* The attribute the stylesheet keys off, so a field this seat may not fill
     LOOKS unfillable — muted, not-allowed cursor — without a word of copy.
     Mirrors `data-account-locked` in app/globals.css.

     `on` is false throughout this build: the seat holds `enterFigures`. */
  React.useEffect(() => {
    const html = document.documentElement;
    const on = !can("enterFigures") && !isOpenRoute(pathname);
    if (on) html.setAttribute("data-seat-readonly", "1");
    else html.removeAttribute("data-seat-readonly");
    return () => html.removeAttribute("data-seat-readonly");
  }, [pathname]);

  React.useEffect(() => {
    if (!can("buildWorkspaces") && isCreateRoute(pathname)) router.replace(SEAT_DESTINATION);
  }, [pathname, router]);

  React.useEffect(() => {
    /* THE EARLY RETURN THIS BUILD TAKES. Granted capability, no listener —
     see the note at the top of the file before removing anything below it. */
    if (can("enterFigures")) return;

    const handle = (e: Event) => {
      /* Never on a supplier's own screen. Read from the live location rather
         than the `pathname` closure so a navigation cannot leave a stale
         listener gating the wrong route. */
      if (isOpenRoute(window.location.pathname)) return;

      const target = e.target;
      if (!(target instanceof Element)) return;

      /* The shell, and the assurance surfaces that need typing: the sign-off
         name, the send-back comment, every search box and filter. A control
         that only changes what you are LOOKING at is not a write. */
      if (target.closest('[data-lock="chrome"], [data-lock="allow"], [data-seat="allow"]')) return;

      /* Inside the page body or an overlay, and nowhere else.

         `[data-lock="scope"]` was referenced by the trial lock and applied to
         nothing in the app it shipped with — a React portal mounts on <body>,
         so `closest('main')` never reaches a dialog and every field inside
         one escaped both guards. Modal and Portal now carry the attribute
         (components/ui.tsx, components/controls.tsx), which fixes the trial
         lock at the same time. */
      if (!target.closest('main, [data-lock="scope"], [data-seat="scope"]')) return;

      if (!target.closest(FIELDS)) return;

      if (e instanceof KeyboardEvent) {
        /* Copy is reading. A reviewer quoting a figure into an email is doing
           the job, and the clipboard is not the store. */
        if (INERT_KEYS.has(e.key) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c")) return;
      }

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      say();
    };

    /* `beforeinput` is what catches typing, dictation and autofill in one
       place; `keydown` alone misses everything that is not a keyboard. */
    const types = ["pointerdown", "mousedown", "click", "keydown", "beforeinput", "paste", "drop", "change"] as const;
    types.forEach((type) => document.addEventListener(type, handle, true));
    return () => types.forEach((type) => document.removeEventListener(type, handle, true));
  }, []);

  return null;
}
