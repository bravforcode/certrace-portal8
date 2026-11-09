"use client";

import * as React from "react";

/* Every figure on the analysis tabs is read from the same localStorage stores the rest of the portal writes — and several of them are written
   from another window: a plant filling its monthly link, a precursor answering, a second tab of this portal. This calls `onChange` when
   any of that happens, and when the reader comes back to the window, so the tab never shows a state the portal has already moved past. */
export function useStoreSync(onChange: () => void): void {
  const ref = React.useRef(onChange);
  ref.current = onChange;
  React.useEffect(() => {
    const fire = () => ref.current();
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
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", fire);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
