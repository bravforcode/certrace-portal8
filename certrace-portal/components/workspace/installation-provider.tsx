"use client";

/* The installation a page under /workspaces/installation/<reference> is about:
   its record (or one fabricated from a product report that names it — see
   installationForWorkspace), and every product report made there. Read once in
   the layout and shared with the three tabs, the same way a product report's
   layout shares its workspace. */

import * as React from "react";
import type { Installation } from "@/lib/installations";
import type { VerificationWorkspace } from "@/lib/workspace";

type Ctx = {
  /** the reference in the URL */
  id: string;
  installation: Installation;
  /** active product reports at this installation, newest year first */
  workspaces: VerificationWorkspace[];
};

const InstallationContext = React.createContext<Ctx | null>(null);

export function useInstallationPage(): Ctx {
  const ctx = React.useContext(InstallationContext);
  if (!ctx)
    throw new Error(
      "useInstallationPage must be used inside an installation route",
    );
  return ctx;
}

export function InstallationProvider({
  value,
  children,
}: {
  value: Ctx;
  children: React.ReactNode;
}) {
  return (
    <InstallationContext.Provider value={value}>
      {children}
    </InstallationContext.Provider>
  );
}
