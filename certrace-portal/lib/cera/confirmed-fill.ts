import { flushAccount, publicScope } from "../account-storage";
import { apiConfigured } from "../api/config";
import { assertSessionUnchanged, sessionEpoch } from "../api/session";
import { activeLinkSession, saveLinkIfChanged } from "../workspace-link-sync";
import type { PrecursorSupplier } from "../precursor-suppliers";
import type { PrecursorApplied } from "./precursor-upload";
import { applyPlan, planProblems, type Applied } from "./smart-upload";
import type { ExtractionPlan } from "./types";

export type FillScope =
  | { audience: "supplier"; workspaceId: string; month?: string }
  | {
      audience: "precursor";
      workspaceId: string;
      nodeId: string;
      row: () => PrecursorSupplier | null;
      apply: (plan: ExtractionPlan) => PrecursorApplied;
      save: () => Promise<void>;
    };

type FillResult =
  | { kind: "month"; out: Applied }
  | { kind: "precursor"; out: PrecursorApplied };

/** One confirmation owns one local fill. Retrying only saves that draft: applying
 * again would append process rows and notes twice after a network failure. */
export function confirmedFill(plan: ExtractionPlan, scope?: FillScope) {
  const route = publicScope();
  const epoch = sessionEpoch();
  const link = activeLinkSession();
  let filled: FillResult | undefined;
  let running: Promise<FillResult> | undefined;
  const check = () => {
    if (publicScope() !== route)
      throw new Error("This link changed. Reopen the form before saving.");
    if (!route) assertSessionUnchanged(epoch);
    if (
      scope &&
      (plan.workspaceId !== scope.workspaceId ||
        (scope.audience === "supplier" &&
          (plan.precursor || (scope.month && plan.month !== scope.month))) ||
        (scope.audience === "precursor" &&
          plan.precursor?.nodeId !== scope.nodeId))
    )
      throw new Error("These readings belong to a different form.");
    if (plan.precursor && scope?.audience !== "precursor")
      throw new Error("Reopen the precursor form before filling it.");
    if (apiConfigured() && route && !scope)
      throw new Error("Reopen the supplier form before filling it.");
    if (
      apiConfigured() &&
      scope?.audience === "supplier" &&
      (!link ||
        activeLinkSession() !== link ||
        link.scope !== route ||
        link.workspaceId !== plan.workspaceId ||
        link.month !== plan.month)
    )
      throw new Error("Reopen the supplier link before saving.");
  };
  return (): Promise<FillResult> => {
    if (running) return running;
    running = (async () => {
      check();
      if (!filled) {
        if (
          !plan.readings.some((r) => r.included) ||
          Object.keys(planProblems(plan)).length
        )
          throw new Error(
            "Check the selected readings before filling the form.",
          );
        filled =
          scope?.audience === "precursor"
            ? { kind: "precursor", out: scope.apply(plan) }
            : { kind: "month", out: applyPlan(plan) };
      }
      if (filled.out.ok) {
        if (scope?.audience === "precursor") await scope.save();
        else if (scope?.audience === "supplier" && apiConfigured())
          await saveLinkIfChanged();
        else await flushAccount();
        check();
      }
      return filled;
    })().finally(() => {
      running = undefined;
    });
    return running;
  };
}
