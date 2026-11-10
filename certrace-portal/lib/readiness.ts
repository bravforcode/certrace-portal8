/* ════════════════════════════════════════════════════════════
   READINESS — "can we call the verifier yet?"

   The dashboard's entire value is being trustworthy. A GREEN TAB MUST MEAN A
   VERIFIER WOULD FIND NOTHING MISSING THERE. Nothing in this file rounds up,
   nothing reports a partial as a pass, and every incomplete state names the
   exact thing that is missing and links straight to the field that fixes it.

   That last part is the difference between a dashboard and a scoreboard. "Some
   data missing" is a score. "March 2026 not submitted", linking to March, is a
   dashboard — it tells the exporter what to do next, which is the only reason
   to look at it.

   Six states, and the distinctions between them are load-bearing:

     complete       every mandatory field filled, evidence where required
     incomplete     mandatory fields missing — the exact field keys are shown
     blocked        a hard rule fails; the filing would be wrong, not thin
     not_applicable e.g. precursors for a simple good — grey, never counted
     not_started    nothing has been entered at all — an empty tab is not the
                     same claim as a complete one, even when there is
                     currently nothing to flag as missing
     pending        something IS entered, but a DIFFERENT tab's gap makes it
                     impossible to check — e.g. materiality cannot be assessed
                     before there is anything to divide by

   THE FAILURE THIS SPLIT EXISTS TO CLOSE: a rule that only ever checked "is
   anything missing?" reads an EMPTY workspace as complete, because nothing
   has been entered and so nothing can be found missing. That is not
   readiness, it is the absence of data being mistaken for the absence of
   problems — a section must not read COMPLETE on the basis of an empty
   state. not_started and pending are what an empty/uncheckable state reads
   as instead; only genuinely evaluated, present data can read complete.

   `percentComplete` is DISPLAY ONLY and never a gate. A workspace at 86% with
   one blocked tab is not 86% ready; it is not ready. The percentage exists so
   an exporter can see movement week to week, and it is computed over
   applicable tabs so a simple good is never permanently stuck below 100% —
   and not_started/pending count as NOT complete in that rollup, the same as
   incomplete, even though each renders its own more precise badge.
   ════════════════════════════════════════════════════════════ */

import { carbonPriceState, getCarbonPrice } from "./carbon-price";
import {
  annualCoverage,
  annualScopeFor,
  CARBON_PRICE_KEY,
  coverageForMonth,
  isReviewed,
} from "./workspace-evidence";
import {
  monthCounts,
  monthsForWorkspace,
  monthsMissingNcv,
  type MonthlyEntry,
} from "./monthly-data";
import { listSuppliers, precursorContribution } from "./precursor-suppliers";
import {
  estimatedGapTCO2e,
  finalVersionCovering,
  loadDraft,
} from "./workspace-mmd";
import { workspaceSEE, internalContribution } from "./workspace-see";
import {
  getWorkspace,
  isComplexWorkspace,
  monthNameLong,
  type VerificationWorkspace,
} from "./workspace";
import { workspaceRequiresIndirectEmissions } from "./cbam/product-category-rules";

export type TabState =
  | "complete"
  | "incomplete"
  | "blocked"
  | "not_applicable"
  | "not_started"
  | "pending";

export type ReadinessTab =
  | "mmd"
  | "monthly"
  | "precursors"
  | "evidence"
  | "carbon_price"
  | "materiality";

export const READINESS_TABS: ReadinessTab[] = [
  "mmd",
  "monthly",
  "precursors",
  "evidence",
  "carbon_price",
  "materiality",
];

export const TAB_LABEL: Record<ReadinessTab, string> = {
  mmd: "MMD",
  monthly: "Monthly data",
  precursors: "Precursors",
  evidence: "Evidence",
  carbon_price: "Carbon price",
  materiality: "Materiality",
};

export const TAB_STATE_LABEL: Record<TabState, string> = {
  complete: "Complete",
  incomplete: "Incomplete",
  blocked: "Blocked",
  not_applicable: "Not applicable",
  not_started: "Not started",
  pending: "Pending",
};

export type MissingItem = { label: string; deepLink: string };

export type TabReadiness = {
  tab: ReadinessTab;
  state: TabState;
  /** exact, clickable — never "some data missing" */
  missing: MissingItem[];
  blockingReason?: string;
};

export type WorkspaceReadiness = {
  tabs: TabReadiness[];
  overall: TabState;
  /** display only, never a gate */
  percentComplete: number;
};

/** The materiality self-check threshold, carried forward from Part 1. */
export const MATERIALITY_THRESHOLD = {
  value: 0.05,
  source:
    "Build spec §4 — readiness is complete only when the materiality self-check is ≤ 5%",
};

const link = (id: string, path = "") => `/workspaces/${id}${path}`;

/* ── MMD ────────────────────────────────────────────────────────
   Complete when a FINAL version covers the period; otherwise BLOCKED.

   Blocked rather than incomplete on purpose: a verifier cannot begin without
   an approved methodology, so an exporter with a beautifully complete year of
   data and a draft MMD is not "nearly there" — they cannot start. */
function mmdReadiness(ws: VerificationWorkspace): TabReadiness {
  const final = finalVersionCovering(ws.id, ws.periodStart, ws.periodEnd);
  if (final) return { tab: "mmd", state: "complete", missing: [] };

  const draft = loadDraft(ws.id, ws.periodStart, ws.periodEnd);
  const hasDraft = Boolean(
    draft.boundaryDescription.trim() || draft.fuelInstruments.length > 0,
  );
  return {
    tab: "mmd",
    state: "blocked",
    blockingReason: hasDraft
      ? "The MMD is still a draft. A draft methodology does not satisfy the readiness gate — finalise it to stamp the version a verifier will work from."
      : "No final MMD exists for this period. A verifier cannot start without an approved monitoring methodology.",
    missing: [
      {
        label: hasDraft ? "Finalise the MMD" : "Write and finalise the MMD",
        deepLink: link(ws.id, "/mmd"),
      },
    ],
  };
}

/* ── Monthly data ───────────────────────────────────────────────
   Complete when all 12 months are submitted or reviewed AND each carries
   production, electricity and at least one fuel. BLOCKED when any fuel row
   has a quantity but no NCV — that is not a missing field, it is arithmetic
   that cannot be performed, and the annual figure would be wrong rather than
   incomplete. */
const monthHasSubstance = (m: MonthlyEntry): boolean =>
  // A month in which nothing was made is complete as it stands: the plant stood idle, so there is no production, power or fuel to be missing.
  Boolean(m.notManufactured) ||
  (m.productionTonnes > 0 && m.electricityMwh > 0 && m.fuels.length > 0);

function monthlyReadiness(ws: VerificationWorkspace): TabReadiness {
  const missingNcv = monthsMissingNcv(ws);
  if (missingNcv.length > 0) {
    return {
      tab: "monthly",
      state: "blocked",
      blockingReason: `${missingNcv.length === 1 ? "One month has" : `${missingNcv.length} months have`} a fuel quantity with no net calorific value. An emission factor in tCO₂/GJ cannot be applied to a volume without one, so those months cannot be converted to energy at all.`,
      missing: missingNcv.map((m) => ({
        label: `${monthNameLong(m)} — fuel is missing its NCV`,
        deepLink: link(ws.id, `/monthly/${m}`),
      })),
    };
  }

  const months = monthsForWorkspace(ws);
  const missing: MissingItem[] = [];
  for (const m of months) {
    if (!monthCounts(m)) {
      missing.push({
        label: `${monthNameLong(m.month)} not submitted`,
        deepLink: link(ws.id, `/monthly/${m.month}`),
      });
      continue;
    }
    if (!monthHasSubstance(m)) {
      const gaps: string[] = [];
      if (!(m.productionTonnes > 0)) gaps.push("production");
      if (!(m.electricityMwh > 0)) gaps.push("electricity");
      if (m.fuels.length === 0) gaps.push("fuel");
      missing.push({
        label: `${monthNameLong(m.month)} — no ${gaps.join(", ")}`,
        deepLink: link(ws.id, `/monthly/${m.month}`),
      });
    }
  }

  return {
    tab: "monthly",
    state: missing.length === 0 ? "complete" : "incomplete",
    missing,
  };
}

/* ── Precursors ─────────────────────────────────────────────────
   not_applicable for a simple good — a primary input has no precursors in
   CBAM scope, and showing it permanently amber would teach the exporter to
   ignore amber. */
function precursorReadiness(ws: VerificationWorkspace): TabReadiness {
  if (!isComplexWorkspace(ws))
    return { tab: "precursors", state: "not_applicable", missing: [] };

  const result = precursorContribution(ws);

  if (result.error) {
    return {
      tab: "precursors",
      state: "blocked",
      blockingReason: result.error.message,
      missing: [
        {
          label: "Fix the precursor chain",
          deepLink: link(ws.id, "/precursors"),
        },
      ],
    };
  }

  // Products this site makes itself are precursors too (items 18 and 19) — a good built only from those has a chain.
  const madeHere = internalContribution(ws).rows;
  if (result.byNode.length === 0 && madeHere.length === 0) {
    return {
      tab: "precursors",
      state: "incomplete",
      missing: [
        {
          label: "No precursor suppliers recorded for a complex good",
          deepLink: link(ws.id, "/precursors"),
        },
      ],
    };
  }
  const madeHereOpen = madeHere
    .filter((r) => r.issue)
    .map((r) => ({
      label: `${r.source?.productName ?? "A product made here"} — ${r.issue}`,
      deepLink: link(ws.id, "/precursors"),
    }));

  return {
    tab: "precursors",
    state:
      result.incomplete.length === 0 && madeHereOpen.length === 0
        ? "complete"
        : "incomplete",
    missing: [...madeHereOpen, ...result.incomplete].map((n) => {
      if ("deepLink" in n) return n;
      const row = listSuppliers(ws.id).find((r) => r.id === n.id);
      const who = n.precursorName || n.name || "Unnamed precursor";
      const label =
        row?.valueBasis === "actual"
          ? `${who} — actual value chosen, not yet usable (the default stands in until the precursor's verified data is complete)`
          : row?.valueBasis === "default"
            ? `${who} — missing its CN code or the quantity used`
            : `${who} — missing quantity, installation or SEE`;
      return { label, deepLink: link(ws.id, "/precursors") };
    }),
  };
}

/* ── Evidence ───────────────────────────────────────────────────
   Complete when every required field key is covered by a reviewed document.

   The deep links point at the screen the document is attached ON, not at an
   Evidence tab — there is no longer one. A month's paperwork lives in the
   month, the installation identity and calibration file live on the MMD, and
   each precursor tier's figure lives in the chain.

   The wording is plain. It used to say "3 uploads awaiting review", which is
   an accurate description of an internal extraction state and tells the reader
   nothing about what to do; "not checked yet" says the same thing in the
   language of the job. */
function evidenceReadiness(ws: VerificationWorkspace): TabReadiness {
  const months = monthsForWorkspace(ws).filter(monthCounts);

  // The false-green this guards: zero months submitted means the per-month
  // loop below contributes nothing, and if the annual-scope keys happen to
  // be trivially satisfied too, `missing` stays empty and this would read
  // COMPLETE before a single document could possibly exist to check.
  if (months.length === 0) {
    return {
      tab: "evidence",
      state: "not_started",
      missing: [
        {
          label: "No months submitted yet — there is nothing to evidence",
          deepLink: link(ws.id, "/monthly"),
        },
      ],
    };
  }

  const missing: MissingItem[] = [];
  const requiresIndirect = workspaceRequiresIndirectEmissions(ws.productId);

  for (const m of months) {
    const cov = coverageForMonth(ws.id, m, requiresIndirect);
    for (const row of cov.rows) {
      if (row.covered) continue;
      missing.push({
        label:
          row.awaitingReview > 0
            ? `${monthNameLong(m.month)} — ${row.label}: attached but not checked yet`
            : `${monthNameLong(m.month)} — ${row.label}: no document`,
        deepLink: link(ws.id, `/monthly/${m.month}`),
      });
    }
  }

  const price = getCarbonPrice(ws.id);
  for (const row of annualCoverage(
    ws.id,
    annualScopeFor(
      ws.id,
      ws.periodStart,
      ws.periodEnd,
      price.amountPerTonne > 0,
    ),
  )) {
    if (row.covered) continue;
    // The carbon-price receipt is claimed on the product's Carbon price tab; the other two annual
    // keys are asserted by the MMD, so that is where each one is fixed.
    const target = row.key === CARBON_PRICE_KEY.key ? "/carbon-price" : "/mmd";
    missing.push({
      label: `${row.label}: no document`,
      deepLink: link(ws.id, target),
    });
  }

  // Evidence is never "blocked": a missing document is a gap to fill, not
  // arithmetic that cannot be performed.
  return {
    tab: "evidence",
    state: missing.length === 0 ? "complete" : "incomplete",
    missing,
  };
}

/* ── Carbon price ───────────────────────────────────────────────
   Complete once instrument + amount are recorded — 0 IS a valid answer.
   Blocked when an amount above zero has no payment evidence. */
function carbonPriceReadiness(ws: VerificationWorkspace): TabReadiness {
  const record = getCarbonPrice(ws.id);
  // The receipt is attached on the Evidence tab against the `carbon-price`
  // key, so that is where the answer to "is it evidenced?" has to come from.
  const receipt = annualCoverage(
    ws.id,
    annualScopeFor(
      ws.id,
      ws.periodStart,
      ws.periodEnd,
      record.amountPerTonne > 0,
    ),
  ).find((r) => r.key === CARBON_PRICE_KEY.key);
  const state = carbonPriceState(record, Boolean(receipt?.covered));

  if (state.blocked) {
    return {
      tab: "carbon_price",
      state: "blocked",
      blockingReason: state.reason ?? undefined,
      missing: [
        {
          label: "Attach the carbon price payment receipt",
          deepLink: link(ws.id, "/evidence#annual"),
        },
      ],
    };
  }
  if (!state.complete) {
    return {
      tab: "carbon_price",
      state: "incomplete",
      missing: [
        {
          label: state.reason ?? "Carbon price not recorded",
          deepLink: link(ws.id, "/carbon-price"),
        },
      ],
    };
  }
  return { tab: "carbon_price", state: "complete", missing: [] };
}

/* ── Materiality ────────────────────────────────────────────────
   The share of the year's emissions that rests on estimates rather than
   measurements. Past 5% the estimate IS the number, and a verifier treats the
   whole dossier accordingly. */
export type MaterialityResult = {
  estimatedTCO2e: number;
  totalTCO2e: number;
  share: number;
  overThreshold: boolean;
};

export function materiality(ws: VerificationWorkspace): MaterialityResult {
  const see = workspaceSEE(ws);
  // Indirect emissions are part of the figure only for goods outside Annex II; for steel and aluminium the 5 % is read against the direct emissions.
  const total = see.directTCO2 + (see.indirectCounted ? see.indirectTCO2 : 0);
  const draft = loadDraft(ws.id, ws.periodStart, ws.periodEnd);
  const final = finalVersionCovering(ws.id, ws.periodStart, ws.periodEnd);
  const estimated = estimatedGapTCO2e(final ? final.content : draft);
  const share = total > 0 ? estimated / total : 0;
  return {
    estimatedTCO2e: estimated,
    totalTCO2e: total,
    share,
    overThreshold: share > MATERIALITY_THRESHOLD.value,
  };
}

function materialityReadiness(ws: VerificationWorkspace): TabReadiness {
  const m = materiality(ws);

  // The false-green this guards: with nothing recorded, totalTCO2e is 0,
  // `share` defaults to 0 rather than dividing by zero, 0 is never over the
  // 5% threshold, and this would read COMPLETE — "nothing is estimated" —
  // when the true state is "nothing has been measured either".
  if (m.totalTCO2e <= 0) {
    return {
      tab: "materiality",
      state: "not_started",
      missing: [
        {
          label: "Nothing recorded yet to assess materiality against",
          deepLink: link(ws.id, "/monthly"),
        },
      ],
    };
  }

  if (m.overThreshold) {
    return {
      tab: "materiality",
      state: "blocked",
      blockingReason: `${(m.share * 100).toFixed(1)}% of this year's emissions are estimated rather than measured, over the 5% self-check. Past that point the estimate is the number — close the largest data gaps with primary data before engaging a verifier, or brief them on it in advance rather than letting them find it.`,
      missing: [
        {
          label: "Reduce the estimated share in the MMD's data-gap register",
          deepLink: link(ws.id, "/mmd#gaps"),
        },
      ],
    };
  }
  return { tab: "materiality", state: "complete", missing: [] };
}

/* ── The whole picture ──────────────────────────────────────────
   overall = blocked if any tab is blocked; else incomplete if any applicable
   tab is incomplete; else complete. */
export function workspaceReadiness(
  workspace: VerificationWorkspace,
): WorkspaceReadiness {
  const tabs: TabReadiness[] = [
    mmdReadiness(workspace),
    monthlyReadiness(workspace),
    precursorReadiness(workspace),
    evidenceReadiness(workspace),
    carbonPriceReadiness(workspace),
    materialityReadiness(workspace),
  ];

  const applicable = tabs.filter((t) => t.state !== "not_applicable");
  // not_started and pending are their own precise per-tab badges, but for
  // the ONE overall word this collapses to, both mean the same thing
  // "incomplete" already means: not ready yet. Only complete tabs let the
  // rollup say complete.
  const overall: TabState = tabs.some((t) => t.state === "blocked")
    ? "blocked"
    : applicable.some((t) => t.state !== "complete")
      ? "incomplete"
      : "complete";

  const completeCount = applicable.filter((t) => t.state === "complete").length;
  const percentComplete =
    applicable.length > 0
      ? Math.round((completeCount / applicable.length) * 100)
      : 0;

  return { tabs, overall, percentComplete };
}

/** The seven-dot strip on the dashboard card, in tab order. */
export const dotStates = (r: WorkspaceReadiness): TabState[] =>
  READINESS_TABS.map(
    (t) => r.tabs.find((x) => x.tab === t)?.state ?? "incomplete",
  );

/** Everything not yet done, flattened — the Overview's "what's missing" list. */
export const allMissing = (
  r: WorkspaceReadiness,
): { tab: ReadinessTab; item: MissingItem }[] =>
  r.tabs.flatMap((t) => t.missing.map((item) => ({ tab: t.tab, item })));

/* ── Evidence-acceptance detail ─────────────────────────────────
   Exposed so the Evidence tab can show the same "awaiting review" figure the
   readiness rules read, rather than computing a second, subtly different one. */
export function unreviewedEvidenceCount(
  workspaceId: string,
  entries: MonthlyEntry[],
): number {
  let n = 0;
  const ws = getWorkspace(workspaceId);
  const requiresIndirect = ws
    ? workspaceRequiresIndirectEmissions(ws.productId)
    : false;
  for (const m of entries) {
    for (const row of coverageForMonth(workspaceId, m, requiresIndirect).rows) {
      n += row.items.filter((i) => !isReviewed(i)).length;
    }
  }
  return n;
}
