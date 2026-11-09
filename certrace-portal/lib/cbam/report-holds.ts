/* ════════════════════════════════════════════════════════════
   WHAT HOLDS A PRODUCT REPORT BLOCKED

   A product report reads Blocked for one of two kinds of reason, and the reader is told which:

     · the SITE's one-time information is unanswered — the reports open with the operator and the installation, and a verifier cannot begin without
       them, the same footing as a methodology that is not final;
     · one of the report's own tabs is blocked (an unfinalised methodology, a fuel with no calorific value, a precursor chain that does not
       add up, an estimated share over 5%).

   Nothing here locks a screen: the readings can be typed before the site's information is complete. This is the state of the report, not a gate
   on typing.
   ════════════════════════════════════════════════════════════ */

import type { ReadinessTab, TabState, WorkspaceReadiness } from "../readiness";
import type { ProfileStatus } from "./installation-profile";

/** What holds a report Blocked, in a few words. The long reason is on the report itself. */
export type Hold = { text: string; vars?: Record<string, string | number> };

export const BLOCKED_BY: Partial<Record<ReadinessTab, string>> = {
  mmd: "Methodology not final",
  monthly: "A fuel has no calorific value",
  precursors: "Precursor chain needs fixing",
  evidence: "Evidence blocked",
  carbon_price: "Carbon price blocked",
  materiality: "Over the 5% estimate limit",
};

export function holdsFor(readiness: WorkspaceReadiness, profile: ProfileStatus): { overall: TabState; holds: Hold[] } {
  const holds: Hold[] = [];
  if (!profile.complete) holds.push({ text: "Installation info {a}/{b}", vars: { a: profile.answered, b: profile.total } });
  for (const tab of readiness.tabs) {
    const why = tab.state === "blocked" ? BLOCKED_BY[tab.tab] : undefined;
    if (why) holds.push({ text: why });
  }
  return { overall: profile.complete ? readiness.overall : "blocked", holds };
}
