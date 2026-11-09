"use client";

/* ════════════════════════════════════════════════════════════
   THE OVERVIEW'S HELPERS — going to a field, and lighting it

   The installation's one-time information is 17 required answers in four groups (lib/cbam/installation-profile.ts).
   The page used to carry a bar and a list above the form saying how many were answered; the form IS the page, and
   the count already sits in the header chip and on the readiness tab, so the bar is gone. What stays is what the
   readiness tab and the header chip need to send a reader to a field: `focusAnchor` and `useOverviewFocus`.

   ════════════════════════════════════════════════════════════ */

import * as React from "react";

/* ── Going to a field, and lighting it ──────────────────────────── */
export function focusAnchor(id: string): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.remove("ct-focus");
  void el.offsetWidth; // restart the animation if it is asked for twice
  el.classList.add("ct-focus");
  window.setTimeout(() => el.classList.remove("ct-focus"), 2800);
  return true;
}

/** A link from the readiness tab arrives as `#ip-<field>`: scroll there once the form has drawn, light it, and tidy the address. */
export function useOverviewFocus(ready: boolean) {
  React.useEffect(() => {
    if (!ready) return;
    const hash = window.location.hash;
    if (!hash.startsWith("#ip-")) return;
    let tries = 0;
    let timer: number | undefined;
    const attempt = () => {
      if (focusAnchor(hash.slice(1))) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        return;
      }
      if (tries++ < 30) timer = window.setTimeout(attempt, 100);
    };
    attempt();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [ready]);
}
