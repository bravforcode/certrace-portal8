"use client";

import * as React from "react";

/* ════════════════════════════════════════════════════════════
   SAMPLE NUMBERS — one switch for the three analysis pages

   Dashboard, Carbon & Cost and Supply Chain read the account's own stores. On an
   account with nothing submitted yet that is a screen of dashes, which is the
   truth and a poor way to see what the page is for. So each page can show a
   made-up estate instead — never written anywhere — and one switch, kept here,
   turns it on or off for all three.

   THE DEFAULT FOLLOWS THE DATA. With no choice made, the sample is on exactly
   while the account has no figures of its own, and goes off the moment it does.
   A choice, once made, is kept.
   ════════════════════════════════════════════════════════════ */

const KEY = "certrace:sample-numbers";
const EVENT = "certrace:sample-numbers-changed";

type Stored = "on" | "off" | null;

function read(): Stored {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "on" || v === "off" ? v : null;
  } catch {
    return null;
  }
}

export function useSampleMode(accountHasFigures: boolean | null): { on: boolean; auto: boolean; ready: boolean; set: (v: boolean) => void } {
  const [stored, setStored] = React.useState<Stored>(null);
  /* The choice lives in the browser, so it cannot be known until after the first paint. `ready` lets a page wait for it rather than draw the
     account's own figures for a frame and then swap them for the sample. */
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    setStored(read());
    setReady(true);
    const sync = () => setStored(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const set = React.useCallback((v: boolean) => {
    try {
      window.localStorage.setItem(KEY, v ? "on" : "off");
    } catch {
      /* private window: the choice lasts until the next load */
    }
    setStored(v ? "on" : "off");
    window.dispatchEvent(new Event(EVENT));
  }, []);
  const auto = stored == null;
  const on = stored != null ? stored === "on" : accountHasFigures === false;
  return { on, auto, ready: ready && accountHasFigures !== null, set };
}
