"use client";

/* ════════════════════════════════════════════════════════════
   THE CURRENT INSTALLATION — the one site the portal is looking at

   The Verification page shows ONE installation at a time, and a new product
   report is filed at that installation (or at one filled in on the spot). Which
   one is "current" is switched from the account menu or Settings → Installation.

   The choice is a per-browser preference, like the language: one localStorage
   key, read after mount. A stored id that no longer exists falls back to the
   exporter's own site, then to the first one known — never to nothing while an
   installation exists. Same-tab listeners hear a switch through a window
   event, other tabs through `storage`.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useKnownInstallations } from "./workspaces-query";

const KEY = "certrace:active-installation";
const EVENT = "certrace:active-installation";

export type InstallationChoice = {
  id: string;
  name: string;
  self: boolean;
  supplierId?: string;
};

function readStored(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setActiveInstallationId(id: string) {
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    /* storage blocked — the in-memory event still switches this tab */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));
}

/** Every installation the account knows, own sites first, and the current one. */
export function useActiveInstallation() {
  const { data, isLoading } = useKnownInstallations();
  const options = React.useMemo<InstallationChoice[]>(
    () =>
      (data ?? [])
        .filter((i) => i.id)
        .map((i) => ({
          id: i.id,
          name: i.name || i.id,
          self: Boolean(i.self),
          supplierId: (i as { supplierId?: string }).supplierId,
        })),
    [data],
  );

  const [stored, setStored] = React.useState<string | null>(null);
  React.useEffect(() => {
    setStored(readStored());
    const onSwitch = (e: Event) =>
      setStored((e as CustomEvent<string>).detail ?? readStored());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setStored(e.newValue);
    };
    window.addEventListener(EVENT, onSwitch);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onSwitch);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const active =
    options.find((o) => o.id === stored) ??
    options.find((o) => o.self) ??
    options[0] ??
    null;

  return {
    options,
    active,
    loading: isLoading,
    setActive: setActiveInstallationId,
  };
}
