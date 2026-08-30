/* ════════════════════════════════════════════════════════════
   THE REPORT'S TABLE OF CONTENTS, WITH A STATE AGAINST EACH LINE

   Readiness answers "can we call the verifier yet" one TAB at a time. That is
   the right shape for the work — a tab is somebody's job — and the wrong shape
   for the question an exporter asks the day before they send the file: what is
   actually IN this document, and which parts of it are finished.

   The two do not line up. Section 3.4 of the report — data quality and quality
   assurance — is assembled from the MMD, the materiality self-check and the
   monthly readings; a reader looking at three green tabs still cannot say
   whether 3.4 will print with anything in it. And the mapping runs the other
   way too: one incomplete tab can leave four sections thin and three untouched.

   So this module reads the SAME state the report is built from and reports it
   in the report's own structure — part, subsection, title, in order. Nothing
   here computes an emission or changes a document: it is a view.

   IT LOOKS AT THE PRODUCTION PROCESSES ONE BY ONE. Section 2.2 and the
   methodology behind it are per-process, and an installation that declares
   three processes has three of them to answer for. A single "Methodology"
   line covering all three is the exact reading that lets somebody finalise an
   MMD describing the furnace and forget the casting line — so a declared
   process gets a numbered line of its own, and a workspace that has declared
   none gets one line saying so.

   FOUR STATES, and the middle two are genuinely different:

     ready         it will print, and a verifier will find nothing missing
     in_progress   partly answered — it will print, incomplete
     concern       answered, but something in it contradicts something else
     not_started   nothing to print at all
   ════════════════════════════════════════════════════════════ */

import { getCarbonPrice } from "./carbon-price";
import { aggregatedGoodsCategory, getCatalogProduct } from "./config";
import { getInstallation, missingFields } from "./installations";
import { monthsForWorkspace } from "./monthly-data";
import { materiality, MATERIALITY_THRESHOLD, type WorkspaceReadiness } from "./readiness";
import { finalVersionCovering, loadDraft } from "./workspace-mmd";
import { listEvidence } from "./workspace-evidence";
import { getRoute, routeMatchesCategory, type VerificationWorkspace } from "./workspace";
import { workspaceSEE } from "./workspace-see";
import type { TFunction } from "./i18n";

export type ContentState = "ready" | "in_progress" | "concern" | "not_started";

export const CONTENT_STATE_LABEL: Record<ContentState, string> = {
  ready: "Ready",
  in_progress: "In progress",
  concern: "Concern",
  not_started: "Not started",
};

/** Same four tones the rest of the platform uses for state, so a chip here and
    a chip on a readiness card mean the same thing at a glance. */
export const CONTENT_STATE_TONE: Record<ContentState, "ok" | "warn" | "err" | "muted"> = {
  ready: "ok",
  in_progress: "warn",
  concern: "err",
  not_started: "muted",
};

export type ContentItem = {
  /** the report's own numbering, e.g. "1.2" — or "2.2 · 1" for a repeat */
  number: string;
  title: string;
  state: ContentState;
  /** one line: what will print, or what is holding it */
  detail: string;
  /** where the answer is entered */
  deepLink: string;
};

export type ContentPart = {
  number: number;
  title: string;
  items: ContentItem[];
};

const link = (id: string, path = "") => `/workspaces/${id}${path}`;

/** How complete the document is, as a count rather than a percentage — a
    percentage next to a compliance document invites being read as accuracy. */
export function contentTally(parts: ContentPart[]): Record<ContentState, number> {
  const tally: Record<ContentState, number> = { ready: 0, in_progress: 0, concern: 0, not_started: 0 };
  for (const p of parts) for (const i of p.items) tally[i.state] += 1;
  return tally;
}

/* THE TRANSLATOR IS A PARAMETER, not an import. This module has no React in
   it — it is read by the readiness screen and by the report builder — so the
   one thing it cannot do is call a hook. Every sentence it composes has a
   number or a name in the middle of it, and Thai puts those somewhere else in
   the sentence, so they cannot be assembled from fragments either: each is one
   `t()` key with named placeholders, and the caller hands in the `t` it
   already has. */
export function reportContents(ws: VerificationWorkspace, readiness: WorkspaceReadiness, t: TFunction): ContentPart[] {
  const inst = getInstallation(ws.installationId);
  const mmdFinal = finalVersionCovering(ws.id, ws.periodStart, ws.periodEnd);
  const mmd = mmdFinal ? mmdFinal.content : loadDraft(ws.id, ws.periodStart, ws.periodEnd);
  const price = getCarbonPrice(ws.id);
  const see = workspaceSEE(ws);
  const months = monthsForWorkspace(ws);
  const counted = months.filter((m) => m.status === "submitted" || m.status === "reviewed");
  const evidence = listEvidence(ws.id);
  const mat = materiality(ws);

  const product = getCatalogProduct(ws.productId);
  const category = product ? aggregatedGoodsCategory(product) : null;
  const route = getRoute(ws.productionRoute);
  const routeMismatch = Boolean(category && ws.productionRoute && !routeMatchesCategory(ws.productionRoute, category));

  const monthlyTab = readiness.tabs.find((t) => t.tab === "monthly");
  const evidenceTab = readiness.tabs.find((t) => t.tab === "evidence");
  const priceTab = readiness.tabs.find((t) => t.tab === "carbon_price");

  /* ── Part 1 ─────────────────────────────────────────────────── */

  const instGaps = inst ? missingFields(inst) : ["The installation record itself"];

  const part1: ContentPart = {
    number: 1,
    title: t("Installation details"),
    items: [
      {
        number: "1.1",
        title: t("Reporting period"),
        state: "ready",
        detail: t("{from} to {to}. Fixed at creation and printed as it stands.", { from: ws.periodStart, to: ws.periodEnd }),
        deepLink: link(ws.id),
      },
      {
        number: "1.2",
        title: t("About the installation"),
        state: !inst ? "not_started" : instGaps.length === 0 ? "ready" : "in_progress",
        detail: !inst
          ? t("No installation record is attached to this workspace.")
          : instGaps.length === 0
            ? t("All fourteen template fields are answered.")
            : instGaps.length === 1
              ? t("1 template field still blank — {first}", { first: instGaps[0] })
              : t("{count} template fields still blank — {first}", { count: instGaps.length, first: instGaps[0] }),
        deepLink: link(ws.id),
      },
      {
        number: "1.3",
        title: t("Verifier of the report"),
        state: ws.verifierSignoff ? "ready" : "not_started",
        detail: ws.verifierSignoff
          ? `${ws.verifierSignoff.name}${ws.verifierSignoff.role ? ` · ${ws.verifierSignoff.role}` : ""}.`  // a person's name and their own job title — never translated
          : t("No verifier has been engaged yet. The block prints empty, which is what a pre-verification report looks like."),
        deepLink: link(ws.id, "/readiness"),
      },
      {
        number: "1.4",
        title: t("Carbon price instrument"),
        state:
          priceTab?.state === "complete"
            ? "ready"
            : priceTab?.state === "blocked"
              ? "concern"
              : price.amountPerTonne > 0
                ? "in_progress"
                : "not_started",
        detail:
          priceTab?.blockingReason ??
          (price.amountPerTonne > 0
            ? t("{amount} {currency} per tCO₂e claimed.", { amount: price.amountPerTonne, currency: price.currency })
            : t("Nothing claimed. Zero is a complete answer — record it rather than leaving it blank.")),
        deepLink: link(ws.id, "/readiness#carbon-price"),
      },
    ],
  };

  /* ── Part 2 — and the per-process repeat ────────────────────── */

  const processes = mmd.processesIncluded ?? [];
  const processItems: ContentItem[] =
    processes.length === 0
      ? [
          {
            number: "2.2 · 1",
            title: t("Production process — none declared"),
            state: "not_started",
            detail: t("The methodology names no production process, so this table prints one empty row."),
            deepLink: link(ws.id, "/mmd"),
          },
        ]
      : processes.map((p, i) => ({
          number: `2.2 · ${i + 1}`,
          title: t("Production process {n} — {process}", { n: i + 1, process: p }),
          /* A declared process is only READY once the methodology it belongs
             to has been stamped. Until then it prints under a draft, which is
             the state a verifier sends back. */
          state: mmdFinal ? "ready" : "in_progress",
          detail: mmdFinal
            ? t("Declared and covered by MMD v{version}.", { version: mmdFinal.n })
            : t("Declared in the draft methodology. It prints, but under a version nobody has stamped."),
          deepLink: link(ws.id, "/mmd"),
        }));

  const part2: ContentPart = {
    number: 2,
    title: t("Production processes and routes"),
    items: [
      {
        number: "2.1",
        title: t("Aggregated goods category and production route"),
        state: routeMismatch ? "concern" : route && category ? "ready" : "in_progress",
        detail: routeMismatch
          ? t("{route} is not a production route for {category}. The table will print a contradiction.", {
              route: route?.label ?? ws.productionRoute,
              category: category ?? "",
            })
          : route && category
            ? `${category} · ${route.label}.`
            : t("The route or the category is not set, so the route columns print empty."),
        deepLink: link(ws.id),
      },
      ...processItems,
    ],
  };

  /* ── Part 3 ─────────────────────────────────────────────────── */

  const fuelMonths = counted.filter((m) => m.fuels.length > 0).length;
  const unitFailures = see.errors.length;
  const instruments = (mmd.fuelInstruments?.length ?? 0) + (mmd.electricityInstruments?.length ?? 0);
  /* "none" is a real answer to how the figures are assured, and a different
     one from never having been asked — so it counts as answered. What does
     not count is the empty string an untouched draft carries. */
  const hasQa = Boolean(mmd.qualityAssurance);

  const part3: ContentPart = {
    number: 3,
    title: t("Emissions and data quality"),
    items: [
      {
        number: "3.1",
        title: t("Fuel balance"),
        state: unitFailures > 0 ? "concern" : counted.length === 0 ? "not_started" : fuelMonths === counted.length ? "ready" : "in_progress",
        detail:
          unitFailures > 0
            ? unitFailures === 1
              ? t("1 row the arithmetic refused — the balance would print short by it.")
              : t("{count} rows the arithmetic refused — the balance would print short by them.", { count: unitFailures })
            : counted.length === 0
              ? t("No month has been submitted, so there is nothing to balance.")
              : t("{covered} of {total} submitted months carry fuel rows.", { covered: fuelMonths, total: counted.length }),
        deepLink: link(ws.id, "/monthly"),
      },
      {
        number: "3.2",
        title: t("GHG balance by type of GHG"),
        state: !see.computable ? "not_started" : see.production.complete ? "ready" : "in_progress",
        detail: !see.computable
          ? t("Nothing is computable yet — there is no denominator to divide by.")
          : see.production.complete
            ? t("All twelve months are in. The balance prints complete.")
            : see.production.missingMonths.length === 1
              ? t("1 month missing — the table prints incomplete, not smaller.")
              : t("{count} months missing — the table prints incomplete, not smaller.", { count: see.production.missingMonths.length }),
        deepLink: link(ws.id, "/monthly"),
      },
      {
        number: "3.3",
        title: t("GHG balance by type of monitoring methodology"),
        state: instruments === 0 ? "not_started" : mmdFinal ? "ready" : "in_progress",
        detail:
          instruments === 0
            ? t("No measurement instruments are declared, so this table cannot attribute anything to a method.")
            : mmdFinal
              ? t("{count} instruments declared under MMD v{version}.", { count: instruments, version: mmdFinal.n })
              : t("{count} instruments declared, in a draft methodology.", { count: instruments }),
        deepLink: link(ws.id, "/mmd"),
      },
      {
        number: "3.4",
        title: t("Data quality and quality assurance"),
        state: mat.overThreshold ? "concern" : hasQa ? "ready" : "not_started",
        detail: mat.overThreshold
          ? t("{share}% of the year rests on estimates — past the {threshold}% self-check threshold.", {
              share: (mat.share * 100).toFixed(2),
              threshold: MATERIALITY_THRESHOLD.value * 100,
            })
          : hasQa
            ? t("The quality-assurance answers and the data-gap register will print.")
            : t("The methodology's quality-assurance block is empty, so this section prints with nothing in it."),
        deepLink: link(ws.id, "/mmd"),
      },
    ],
  };

  /* ── Part 4 and the appendix ────────────────────────────────── */

  const part4: ContentPart = {
    number: 4,
    title: t("Products and appendix"),
    items: [
      {
        number: "4.1",
        title: t("Per-product summary"),
        state: !see.computable ? "not_started" : monthlyTab?.state === "blocked" ? "concern" : see.production.complete ? "ready" : "in_progress",
        detail: !see.computable
          ? t("The specific embedded emissions are not computable yet.")
          : monthlyTab?.state === "blocked"
            ? (monthlyTab.blockingReason ?? t("A month cannot be computed, so the per-tonne figure would be wrong rather than incomplete."))
            : t("SEE total {see} tCO₂e per tonne over {counted} of 12 months.", {
                see: see.seeTotal.toFixed(4),
                counted: see.production.monthsCounted,
              }),
        deepLink: link(ws.id),
      },
      {
        number: "4.2",
        title: t("Carbon price and rebate detail"),
        state: price.amountPerTonne > 0 ? (priceTab?.state === "complete" ? "ready" : "concern") : "ready",
        detail:
          price.amountPerTonne > 0
            ? priceTab?.state === "complete"
              ? t("Claim, share and receipt are all on file.")
              : t("A deduction is claimed with something still missing behind it.")
            : t("Nothing claimed, so this section prints a nil return — which is a complete answer."),
        deepLink: link(ws.id, "/readiness#carbon-price"),
      },
      {
        number: "A",
        title: t("Supporting documents appendix"),
        state:
          evidence.length === 0 ? "not_started" : evidenceTab?.state === "complete" ? "ready" : evidenceTab?.state === "blocked" ? "concern" : "in_progress",
        detail:
          evidence.length === 0
            ? t("Nothing is attached, so the report goes out with no appendix behind its figures.")
            : evidence.length === 1
              ? t("1 document will be appended, on its own paginated page.")
              : t("{count} documents will be appended, each on its own paginated page.", { count: evidence.length }),
        deepLink: link(ws.id, "/monthly"),
      },
    ],
  };

  return [part1, part2, part3, part4];
}
