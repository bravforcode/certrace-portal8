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

   Both now live in the query cache. The workspace arrives as a prop from the
   layout's useWorkspace(id) query, readiness is a query under this
   workspace's workspace-data subtree — so every mutation that invalidates
   the subtree moves the dots without anyone calling refresh() — and
   refresh() itself is just invalidation, kept for the editors that still
   write to the stores directly.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { workspaceReadiness, type ReadinessTab, type TabState, type WorkspaceReadiness } from "@/lib/readiness";
import type { VerificationWorkspace } from "@/lib/workspace";
import { useInvalidateWorkspaces } from "@/lib/workspaces-query";
import { useInvalidateWorkspaceData } from "@/lib/workspace-data-query";

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
  /* Under ["workspace-data", id, ...] so useInvalidateWorkspaceData and every
     workspace-data mutation refresh it. The workspace itself sits in the key:
     readiness reads its fields too, so a changed workspace VALUE recomputes
     it — and the layout's query hands the prop down with structural sharing,
     so the key only changes when the value actually did. That replaces the
     JSON.stringify identity guard the hand-rolled refresh() needed. */
  const readinessQuery = useQuery({
    queryKey: ["workspace-data", workspace.id, "readiness", workspace],
    queryFn: () => workspaceReadiness(workspace),
    staleTime: 0,
    /* A changed workspace VALUE mints a new key whose data is undefined for one
       render. Without this the fallback below would serve the mount-time
       snapshot — readiness would jump BACKWARDS after every edit until the
       recompute lands. keepPreviousData holds the last delivered readiness
       across the key change, so it only ever moves forward, like the old
       setReadiness did. */
    placeholderData: keepPreviousData,
  });
  /* The cache is empty on the provider's very first render — the query fills
     it a tick later. Computed synchronously once, like the old lazy
     initializer, so children never see readiness missing. */
  const [initialReadiness] = React.useState<WorkspaceReadiness>(() => workspaceReadiness(workspace));
  const readiness = readinessQuery.data ?? initialReadiness;

  const invalidateWorkspaces = useInvalidateWorkspaces();
  const invalidateWorkspaceData = useInvalidateWorkspaceData(workspace.id);
  /* IDENTITY IS STILL LOAD-BEARING HERE. The tabs build their reload
     callbacks from ctx and call refresh() inside effects, so refresh() must
     not change identity per render — and the invalidate hooks above hand back
     a fresh function every render. Route through a ref: stable callback,
     current invalidators. */
  const invalidate = React.useRef<() => void>(() => {});
  invalidate.current = () => {
    invalidateWorkspaces();
    invalidateWorkspaceData();
  };
  const refresh = React.useCallback(() => invalidate.current(), []);

  const states = React.useMemo(() => {
    const map: Partial<Record<ReadinessTab, TabState>> = {};
    for (const t of readiness.tabs) map[t.tab] = t.state;
    return map;
  }, [readiness]);

  const value = React.useMemo<Ctx>(() => ({ workspace, readiness, states, refresh }), [workspace, readiness, states, refresh]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
