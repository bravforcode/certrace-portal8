"use client";

import * as React from "react";
import { subscribeAccount } from "./account-storage";

/* Analysis reads the hydrated account stores. AccountDataProvider refreshes them
   from the server; this subscription updates derived figures after that merge.
   Storage events still refresh browser preferences. */
export function useStoreSync(onChange: () => void): void {
  const ref = React.useRef(onChange);
  ref.current = onChange;
  React.useEffect(() => {
    const fire = () => ref.current();
    const unsubscribe = subscribeAccount(() => queueMicrotask(fire));
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith("certrace:")) fire();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") fire();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", fire);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      unsubscribe();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", fire);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
