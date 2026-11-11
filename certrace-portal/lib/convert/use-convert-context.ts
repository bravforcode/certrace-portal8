"use client";
import * as React from "react";
import { useScopedInstallation } from "../scoped-installation";
import { getInstallation, type Installation } from "../installations";
import { useWorkbook, useWorkbookYears } from "../workbook/use-workbook";
import { currentYear } from "../year-range";
import type { Sheet } from "../workspace-sheets";

/* What Convert reads to work out readiness: the installation the page is
   scoped to, and the sheets of its latest workbook year. */
export function useConvertContext(): {
  scoped: ReturnType<typeof useScopedInstallation>["scoped"];
  installation: Installation | null;
  sheets: Sheet[];
} {
  const { scoped } = useScopedInstallation();
  const iid = scoped?.id ?? null;
  const { years } = useWorkbookYears(iid);
  // Newest year first, whatever order the store returns them in.
  const latest = years
    .map((y: { year: number }) => y.year)
    .sort((a: number, b: number) => b - a)[0];
  const year = latest ?? currentYear();
  const { sheets } = useWorkbook(iid, year);
  const installation = React.useMemo(() => (iid ? getInstallation(iid) : null), [iid]);
  return { scoped, installation, sheets };
}
