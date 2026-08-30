"use client";

/* ════════════════════════════════════════════════════════════
   WORKSPACE CONTEXT

   The workspace and its readiness are read once per navigation and shared
   with every tab. Two reasons that matters beyond tidiness:

     · Readiness walks twelve months, a precursor tree, the evidence index and
       the shipment log. Recomputing that per tab would be wasteful, and worse,
       two tabs could briefly disagree about whether something is green.

     · `refresh()` is the single signal that data changed. Every editor calls
       it after a save, so the tab strip's dots, the Overview's missing list
       and the Readiness cards move together rather than drifting until the
       next hard navigation.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { workspaceReadiness, type ReadinessTab, type TabState, type WorkspaceReadiness } from "@/lib/readiness";
import { getWorkspace, type VerificationWorkspace } from "@/lib/workspace";

type Ctx = {
  workspace: VerificationWorkspace;
  readiness: WorkspaceReadiness;
  states: Partial<Record<ReadinessTab, TabState>>;
  refresh: () => void;
};

const WorkspaceContext = React.createContext<Ctx | null>(null);

export function useWorkspace(): Ctx {
  const ctx = React.useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside a workspace route");
  return ctx;
}

export function WorkspaceProvider({
  workspace,
  children,
}: {
  workspace: VerificationWorkspace;
  children: React.ReactNode;
}) {
  const [current, setCurrent] = React.useState(workspace);
  const [readiness, setReadiness] = React.useState<WorkspaceReadiness>(() => workspaceReadiness(workspace));

  /* IDENTITY IS LOAD-BEARING HERE, not a micro-optimisation.

     Every store read parses JSON, so `getWorkspace` returns a brand-new object
     each call even when nothing changed. Handing that straight to setState
     changes `ctx.workspace`'s identity on every refresh — and the tabs build
     their `reload` callbacks from it and then call `refresh()` inside the
     effect that runs them. New identity → new callback → effect re-runs →
     refresh → new identity, forever. React caps it with "Maximum update depth
     exceeded", which is the symptom, not the cause.

     So state is only replaced when the VALUE actually changed. Comparing the
     serialised form is cheap at this size and, unlike a shallow compare, it
     catches an edited installation name or a newly linked declaration. */
  const refresh = React.useCallback(() => {
    const fresh = getWorkspace(workspace.id) ?? workspace;
    setCurrent((prev) => (JSON.stringify(prev) === JSON.stringify(fresh) ? prev : fresh));
    const next = workspaceReadiness(fresh);
    setReadiness((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [workspace]);

  // Recompute after mount: every store is browser-only, so the value computed
  // during the first render saw nothing.
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const states = React.useMemo(() => {
    const map: Partial<Record<ReadinessTab, TabState>> = {};
    for (const t of readiness.tabs) map[t.tab] = t.state;
    return map;
  }, [readiness]);

  const value = React.useMemo<Ctx>(() => ({ workspace: current, readiness, states, refresh }), [current, readiness, states, refresh]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
