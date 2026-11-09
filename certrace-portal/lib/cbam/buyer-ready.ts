/* ════════════════════════════════════════════════════════════
   "BUYER-READY" — could we send proof today, if a buyer asked

   One function, read by Widget C (the dashboard's own buyer-ready summary)
   and Widget J (the per-workspace yes/no in the workspace grid), so the two
   can never disagree about what "ready" means. Reuses workspaceReadiness()
   entirely — this is a NAME for a specific combination of tab states that
   already exists, not a new rule.
   ════════════════════════════════════════════════════════════ */

import type { TFunction } from "../i18n";
import type { ReadinessTab, WorkspaceReadiness } from "../readiness";

const GATES: ReadinessTab[] = ["mmd", "monthly", "precursors", "evidence"];

export function isBuyerReady(readiness: WorkspaceReadiness): boolean {
  return GATES.every((tab) => {
    const t = readiness.tabs.find((x) => x.tab === tab);
    // not_applicable (a simple good's Precursors tab) is a gate that does
    // not apply, not one that is failing — it must not block readiness.
    return t != null && (t.state === "complete" || t.state === "not_applicable");
  });
}

/** The single reason a workspace is NOT buyer-ready — the first blocking or
    incomplete gate, in the fixed gate order, so the dashboard's one-line
    explanation ("Tinplate — blocked on MMD final version") is deterministic
    rather than picking whichever tab happened to be evaluated last. */
export function notBuyerReadyReason(readiness: WorkspaceReadiness): string | null {
  for (const tab of GATES) {
    const t = readiness.tabs.find((x) => x.tab === tab);
    if (!t) continue;
    if (t.state !== "complete" && t.state !== "not_applicable") {
      const label = tab === "mmd" ? "MMD" : tab === "monthly" ? "Monthly data" : tab === "precursors" ? "Precursors" : "Documents";
      return `Blocked on ${label}${t.blockingReason ? ` — ${t.blockingReason}` : ""}`;
    }
  }
  return null;
}

/** The reason above, in the reader's language. The headline is a fixed set of words and always translates; the sentence after it is
    sometimes built from numbers and months, and an English tail on a non-English screen is worse than none — so there it is left out
    when there is no translation for it. */
export function buyerReasonText(reason: string, t: TFunction, translated: boolean): string {
  const m = /^Blocked on (MMD|Monthly data|Precursors|Documents)(?: — ([\s\S]+))?$/.exec(reason);
  if (!m) return t(reason);
  const head = t("Blocked on {label}", { label: t(m[1]) });
  if (!m[2]) return head;
  const tail = t(m[2]);
  return translated && tail === m[2] ? head : `${head} — ${tail}`;
}
