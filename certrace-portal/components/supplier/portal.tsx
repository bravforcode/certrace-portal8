"use client";

/* Top-level supplier portal. One client tree: the provider holds all state, the
   shell draws the chrome, and the current view renders inside it. Hub-and-spoke
   via internal `view` state (mirrors how the exporter's new-declaration wizard
   is a single page) so every view shares state without re-reading storage. */

import * as React from "react";
import type { SupplierRequest } from "@/lib/supplier";
import { SupplierProvider, useSupplier } from "./context";
import { SupplierShell } from "./shell";
import { FormView } from "./form-view";
import { LandingView, ProfileView, OverviewView, DocumentsView, TeamView, CheckView, SubmitView, DoneView } from "./views";

function CurrentView() {
  const { view } = useSupplier();
  switch (view) {
    case "landing":
      return <LandingView />;
    case "profile":
      return <ProfileView />;
    case "overview":
      return <OverviewView />;
    case "form":
      return <FormView />;
    case "documents":
      return <DocumentsView />;
    case "team":
      return <TeamView />;
    case "check":
      return <CheckView />;
    case "submit":
      return <SubmitView />;
    case "done":
      return <DoneView />;
    default:
      return <OverviewView />;
  }
}

export function SupplierPortal({ req }: { req: SupplierRequest }) {
  return (
    <SupplierProvider req={req}>
      <SupplierShell>
        <CurrentView />
      </SupplierShell>
    </SupplierProvider>
  );
}
