/* ════════════════════════════════════════════════════════════
   CARBON & COST — THE SCOPE THE FIGURES ARE READ AT

   The page used to have exactly one answer: the whole portfolio, added up.
   That is the right answer to "what is my exposure this year" and the wrong
   answer to almost every question that follows it, because the two numbers an
   exporter actually negotiates with — how much carbon is embedded in this
   good, and how far under the EU default it sits — belong to A PRODUCT, at AN
   INSTALLATION. Blended across four products at two plants they describe
   nothing anybody can act on: no buyer purchases the portfolio, and no
   verifier signs it off.

   So every figure on that page is read at a SCOPE, and this module is the one
   place a scope turns into figures.

   ── A SCOPE IS NOW TWO CHOICES, NOT ONE ────────────────────────
   REPORTING YEAR first, then WHAT INSIDE IT. They were one dropdown, and that
   dropdown was quietly wrong in one specific way: "All products" summed every
   workspace the account had, across every year, into a single tonne count.
   Embedded emissions for 2026 and 2027 added together is not a bigger 2026 —
   it is a figure with no reporting period, and a reporting period is the unit
   the entire regulation is written in. A CBAM declaration covers a year; a
   verifier signs a year; a buyer asks about a year.

   So the year is picked first and is never "all", and everything below it —
   the product list, both headline figures, the chart, the projection — lives
   inside it:

     all               every product in the chosen year, added together
     inst:<id>         every product made at one plant, that year
     ws:<id>           one product, at one installation, for that year — the
                       unit the report, the verifier and the buyer all use

   ── HOW THE TWO HEADLINE FIGURES AGGREGATE, AND WHY DIFFERENTLY ──
   TOTAL EMBEDDED EMISSIONS is a MASS (tCO₂e), so it sums. Adding two
   products' embedded tonnes is a meaningful tonne count.

   AVG. GAP VS. DEFAULT is a RATIO, and ratios do not sum. It is averaged
   across the workspaces that have a comparable default on file — plainly
   averaged, one workspace one vote, NOT weighted by tonnage. That is a
   deliberate choice and it is the one the existing BenchmarkWidget already
   made, kept here so the two cannot disagree: the question the number answers
   is "how does my production compare to the default", and a tonnage weighting
   silently turns it into "how does my BIGGEST product compare", which is a
   different sentence that reads identically.

   ── OFFICIAL, OR NOT ───────────────────────────────────────────
   Every figure this module hands out carries its own standing, because the
   same arithmetic means two completely different things depending on what
   went into it. Four submitted months scaled up and twelve verified months
   both print as a tonne count; only one of them can be sent to a buyer. See
   `workspaceStanding` below for the three cases and where each comes from.

   ── WHAT "NOT VERIFIED YET" MEANS HERE ─────────────────────────
   Every figure is nullable, and null is returned rather than zero wherever
   the underlying data does not exist. A workspace with no submitted months
   has no emissions figure — it does not have an emissions figure of nought,
   and rendering one as "0.0 t" tells an exporter their plant emitted nothing.
   The screens render null as "—" and omit the line from the chart entirely.

   NOT-A-NUMBER IS THE SAME ANSWER AS ABSENT, and it is collapsed to null
   here rather than left to the formatters. The engine can return NaN from a
   month whose arithmetic it refused — a fuel row with no NCV is the usual
   cause, and lib/workspace-see.ts records it in `errors` rather than
   discarding the month. That NaN then propagates through every sum it touches
   and prints as the literal string "NaN" on a compliance screen, which is
   worse than a dash by an order of magnitude: a dash says "nothing here yet"
   and NaN says nothing at all while looking like a defect. One `finite()`
   gate on the way in, applied everywhere a figure is read, so no consumer has
   to remember.
   ════════════════════════════════════════════════════════════ */

import { annualProductionFor, monthsForWorkspace } from "../monthly-data";
import { groupByInstallation, monthsOf, type VerificationWorkspace } from "../workspace";
import { workspaceSEE, type WorkspaceSEE } from "../workspace-see";
import { defaultSeeForWorkspace } from "./cost-exposure";
import { benchmarkOutperformance } from "./see-trend";

/** A number, or null if it is not one. The single gate described in the
    header — every figure this module hands out passes through it. */
const finite = (v: number): number | null => (Number.isFinite(v) ? v : null);

/** Twelve, always. A CBAM reporting period is a calendar year, and a
    workspace covers exactly one — so "how much of the year is in" has a fixed
    denominator rather than one derived from how many months happen to have
    rows in the store. */
export const MONTHS_IN_YEAR = 12;

export type ScopeKind = "all" | "installation" | "workspace";

/** Encoded as a single string so it can live in one `Select` and one piece of
    state: `all`, `inst:<installationId>`, `ws:<workspaceId>`. */
export type ScopeValue = string;

export const SCOPE_ALL = "all";
export const scopeForInstallation = (installationId: string): ScopeValue => `inst:${installationId}`;
export const scopeForWorkspace = (workspaceId: string): ScopeValue => `ws:${workspaceId}`;

export function parseScope(value: ScopeValue): { kind: ScopeKind; id: string | null } {
  if (value.startsWith("inst:")) return { kind: "installation", id: value.slice(5) };
  if (value.startsWith("ws:")) return { kind: "workspace", id: value.slice(3) };
  return { kind: "all", id: null };
}

/** True when the scope names exactly one product. Several things on the page
    are gated on it — the precursor breakdown, the projection toggle — for the
    same reason: they describe ONE good's recipe or ONE good's year, and there
    is no honest way to draw either across a mixture of goods. */
export const isSingleProduct = (value: ScopeValue): boolean => parseScope(value).kind === "workspace";

/** Which workspaces a scope selects, out of the ones already narrowed to a
    year. An unknown id resolves to none rather than to everything — a stale
    selection must not silently widen back to the portfolio while still
    displaying one product's name. */
export function workspacesInScope(inYear: VerificationWorkspace[], value: ScopeValue): VerificationWorkspace[] {
  const { kind, id } = parseScope(value);
  if (kind === "all") return inYear;
  if (kind === "installation") return inYear.filter((w) => w.installationId === id);
  return inYear.filter((w) => w.id === id);
}

/* ── The reporting year ─────────────────────────────────────────
   Only years the account actually has a workspace in. An empty dropdown of
   the last five calendar years would offer four selections that can only
   resolve to an empty page.

   NEWEST FIRST, and the newest is the landing state: the year an exporter is
   working on is overwhelmingly the current one, and last year's closed
   figures are something you go and look up. */
export function reportingYears(workspaces: VerificationWorkspace[]): number[] {
  return [...new Set(workspaces.map((w) => w.year))].sort((a, b) => b - a);
}

export const workspacesInYear = (workspaces: VerificationWorkspace[], year: number): VerificationWorkspace[] =>
  workspaces.filter((w) => w.year === year);

/* ── The options each picker draws ──────────────────────────────
   Installations first, each immediately followed by its own products, so the
   list reads as the estate rather than as an alphabetical jumble of goods.

   AN INSTALLATION WITH ONE PRODUCT GETS NO ROW OF ITS OWN. Its "all products
   here" figure and that product's figure are the same number, and a picker
   offering the same answer twice under two names is a picker that makes the
   reader check whether they are the same answer.

   NO YEAR ON A PRODUCT'S LABEL any more. The year is the picker beside this
   one and every option in this list is already inside it, so repeating it on
   every row was noise that also implied a choice — "Billet · 2026" next to a
   year selector reading 2026 invites the reader to wonder which of the two
   wins. */
/* NOTHING IN HERE IS A DISPLAY STRING, and that is the whole shape of this
   type. An option's label is either a PROPER NOUN — an installation's name, a
   CBAM good's name — which is never translated in either language, or it is a
   PHRASE ("All products"), which always is. Returning a finished English
   sentence would put half the Thai interface's dropdown back into English,
   which is exactly what it did before: "All products" and "3 products, added
   together" sat untranslated under a Thai heading.

   So the module hands back the FACTS and the screen does the wording. The
   count travels beside the kind rather than baked into a string, because Thai
   puts it somewhere else in the sentence. */
export type ScopeOptionLabel = { kind: "all" } | { kind: "name"; name: string };
export type ScopeOptionHint =
  | { kind: "count"; count: number }
  | { kind: "installation_products"; count: number }
  | { kind: "name"; name: string };

export type ScopeOption = { value: ScopeValue; label: ScopeOptionLabel; hint: ScopeOptionHint };

export function scopeOptions(inYear: VerificationWorkspace[]): ScopeOption[] {
  const out: ScopeOption[] = [{ value: SCOPE_ALL, label: { kind: "all" }, hint: { kind: "count", count: inYear.length } }];

  for (const group of groupByInstallation(inYear)) {
    if (group.workspaces.length > 1) {
      out.push({
        value: scopeForInstallation(group.installationId),
        label: { kind: "name", name: group.installationName },
        hint: { kind: "installation_products", count: group.workspaces.length },
      });
    }
    for (const w of group.workspaces) {
      out.push({
        value: scopeForWorkspace(w.id),
        label: { kind: "name", name: w.productName },
        hint: { kind: "name", name: group.installationName },
      });
    }
  }

  return out;
}

/* ── OFFICIAL, OR NOT ───────────────────────────────────────────
   The same tonne count means two different things depending on what is behind
   it, and only one of the two can be handed to a buyer. So no figure on this
   page appears without its standing beside it, in the three states the data
   can actually be in:

     partial_year      fewer than twelve months are submitted. The figure is
                       real — it is what those months add up to — but it is a
                       part of a year, and a year is the unit that gets
                       declared. NOT OFFICIAL. This is the only state a
                       projection means anything in, which is why
                       `projectable` is set here and nowhere else.

     unverified_data   twelve months are in, and at least one precursor
                       contribution rests on a supplier figure with no
                       verification statement behind it, on a published
                       default, or on a row still missing a quantity, an
                       installation or a SEE. The year is complete and the
                       number is not yet defensible. NOT OFFICIAL. Nothing to
                       project — the year is already whole; what is missing is
                       evidence, not months.

     official          twelve months submitted, and every precursor figure
                       verified. This is the figure that goes on the report.

   WHY "VERIFIED" MEANS THE PRECURSORS. Direct and indirect emissions are the
   exporter's OWN meter readings, submitted month by month through this
   portal, and the twelve-month test already covers them. The precursor half
   is the part that comes from outside — it arrives through Enter verified
   data on a chain row, and `dataOrigin` records which of the three ways it
   arrived (lib/precursor-suppliers.ts). A workspace with no precursors at all
   has nothing outstanding and is official on its twelve months alone, which is
   correct: a good made from nothing bought in has no third party to verify.

   SCRAP IS NOT COUNTED AGAINST THE TEST. Its contribution is zero by
   construction, there is no figure to verify, and failing a year for it would
   make a zero-rated input permanently unofficial. */
export type StandingReason = "official" | "partial_year" | "unverified_data" | "no_data";

export type WorkspaceStanding = {
  workspaceId: string;
  official: boolean;
  reason: StandingReason;
  /** submitted or reviewed — the months that count toward the annual figure */
  monthsCounted: number;
  /** months with something in them, whatever their status. The gap between
      this and `monthsCounted` is the actionable one: work that has been done
      and not sent. */
  monthsEntered: number;
  /** precursor rows whose figure is not a verified supplier figure */
  unverifiedPrecursors: number;
  /** precursor rows still missing a quantity, an installation or a SEE */
  incompletePrecursors: number;
  /** a partial year, with at least one month in it — the only state where
      carrying the rate forward says anything */
  projectable: boolean;
};

export function workspaceStanding(workspace: VerificationWorkspace, see: WorkspaceSEE): WorkspaceStanding {
  const monthsCounted = see.production.monthsCounted;
  const monthsEntered = monthsForWorkspace(workspace).filter((m) => m.status !== "empty").length;

  /* Depth-1 only, matching the breakdown the page draws: an upstream tier
     already reaches the finished good through its parent's effectiveSee, so
     testing every depth would fail a chain twice for one unverified figure —
     once on the row itself and again on the parent that inherited it. */
  const roots = see.precursors.byNode.filter((n) => n.depth === 1 && !n.isScrap);
  const unverifiedPrecursors = roots.filter((n) => n.weakestOrigin !== "supplier_verified").length;
  const incompletePrecursors = roots.filter((n) => !n.complete).length;

  const yearComplete = monthsCounted >= MONTHS_IN_YEAR;
  const verified = unverifiedPrecursors === 0 && incompletePrecursors === 0;

  const reason: StandingReason =
    monthsCounted === 0 ? "no_data" : !yearComplete ? "partial_year" : !verified ? "unverified_data" : "official";

  return {
    workspaceId: workspace.id,
    official: reason === "official",
    reason,
    monthsCounted,
    monthsEntered,
    unverifiedPrecursors,
    incompletePrecursors,
    projectable: monthsCounted > 0 && monthsCounted < MONTHS_IN_YEAR,
  };
}

/** The standing of a whole scope. Official only when EVERY product in it is —
    a set of figures added together is exactly as defensible as its weakest
    member, and an "official" total containing one part-year product would be
    the most misleading thing on the page.

    The reason reported is the WORST one present, in the order they are
    written above: a scope where one product is a part-year and another has
    unverified suppliers is reported as a part-year, because that is the one
    that has to be fixed first. */
export function scopeStanding(standings: WorkspaceStanding[]): {
  official: boolean;
  reason: StandingReason;
  monthsCounted: number;
  monthsPossible: number;
  monthsEntered: number;
  /** a single product, part-way through its year — see `projectable` above.
      A scope of several products is never projectable: their years are at
      different stages and one blended rate would carry the busiest product's
      intensity across the quietest one's remaining months. */
  projectable: boolean;
  products: number;
} {
  const monthsCounted = standings.reduce((a, s) => a + s.monthsCounted, 0);
  const monthsEntered = standings.reduce((a, s) => a + s.monthsEntered, 0);
  const monthsPossible = standings.length * MONTHS_IN_YEAR;

  const reason: StandingReason = standings.every((s) => s.reason === "no_data")
    ? "no_data"
    : standings.some((s) => s.reason === "partial_year" || s.reason === "no_data")
      ? "partial_year"
      : standings.some((s) => s.reason === "unverified_data")
        ? "unverified_data"
        : "official";

  return {
    official: standings.length > 0 && standings.every((s) => s.official),
    reason,
    monthsCounted,
    monthsPossible,
    monthsEntered,
    projectable: standings.length === 1 && standings[0].projectable,
    products: standings.length,
  };
}

export type ScopeStanding = ReturnType<typeof scopeStanding>;

/* ── The figures ────────────────────────────────────────────────
   One shape, whatever the scope, so every consumer is written once. */

export type ScopeFigures = {
  /** the workspaces this scope resolved to */
  workspaces: VerificationWorkspace[];
  /** tCO₂e embedded in the production submitted so far — null when no
      workspace in scope has a computable figure yet */
  totalEmbeddedTCO2e: number | null;
  /** percent below the EU default, averaged across comparable workspaces.
      Positive is better than the default, matching every other surface's
      convention. Null when nothing is comparable yet. */
  avgGapPercent: number | null;
  /** how many of the scope's workspaces could actually be compared, so the
      average can say what it was taken over */
  comparableCount: number;
  /** tonnes of product submitted so far, and out of how many months */
  productionTonnes: number;
  monthsCounted: number;
  monthsPossible: number;
  /** kept per workspace so the projection can annualise each one on its OWN
      months rather than on the scope's pooled ratio — see `scopeProjection` */
  perWorkspace: { id: string; embedded: number | null; monthsCounted: number }[];
  /** whether these figures can be sent to anybody, and why not — see
      `workspaceStanding` */
  standing: ScopeStanding;
};

export function scopeFigures(workspaces: VerificationWorkspace[], seeByWorkspace: Map<string, WorkspaceSEE>): ScopeFigures {
  let embedded: number | null = null;
  let productionTonnes = 0;
  let monthsCounted = 0;
  const gaps: number[] = [];
  const perWorkspace: ScopeFigures["perWorkspace"] = [];
  const standings: WorkspaceStanding[] = [];

  for (const w of workspaces) {
    const see = seeByWorkspace.get(w.id);
    if (!see) continue;

    standings.push(workspaceStanding(w, see));

    let own: number | null = null;
    if (see.computable) {
      // A workspace whose arithmetic failed contributes nothing to the total
      // rather than poisoning it — the failure is reported on that workspace's
      // own screens, where the fuel row that caused it can be fixed.
      own = finite(see.seeTotal * see.production.tonnes);
      if (own != null) embedded = (embedded ?? 0) + own;
    }
    perWorkspace.push({ id: w.id, embedded: own, monthsCounted: see.production.monthsCounted });

    productionTonnes += see.production.tonnes;
    monthsCounted += see.production.monthsCounted;

    const bench = benchmarkOutperformance(w, see);
    if (bench && Number.isFinite(bench.outperformancePercent)) gaps.push(bench.outperformancePercent);
  }

  return {
    workspaces,
    totalEmbeddedTCO2e: embedded,
    avgGapPercent: gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null,
    comparableCount: gaps.length,
    productionTonnes,
    monthsCounted,
    monthsPossible: workspaces.length * MONTHS_IN_YEAR,
    perWorkspace,
    standing: scopeStanding(standings),
  };
}

/* ── The projection ─────────────────────────────────────────────
   "If the rest of the year runs like the months you have submitted."

   IT IS OFF BY DEFAULT AND IT IS A SWITCH, not a second pair of cards
   permanently below the first. It used to be four cards on this page — two
   measured, two projected — and on the overwhelmingly common visit the
   projected pair said "Nothing to project from yet" under a heading promising
   a full year. A card whose normal state is a sentence explaining that it has
   nothing to show is furniture. As a switch it is off when there is nothing
   to project, disabled when a projection would be meaningless, and when it IS
   pressed it changes the two figures already on screen rather than printing a
   second copy of them — which is also what makes the difference between the
   measured and the projected number legible, because it is the same card
   moving.

   IT IS ONLY OFFERED ON A PART-YEAR, SINGLE PRODUCT (`projectable`):

     · a complete year has nothing to extrapolate — the answer is the answer
     · a year with nothing in it has no rate to carry forward, and borrowing
       another product's would be an invention
     · several products at once would scale each on a pooled ratio, carrying
       the busiest product's intensity across the quietest one's empty months

   IT IS AN ASSUMPTION, NOT A FORECAST, and the screen says so in those words
   rather than presenting a number that looks measured. Two things follow from
   the arithmetic and both are stated on the card:

     · The TOTAL scales. Embedded tonnes are proportional to tonnes shipped,
       so twelve months of the current rate is the figure so far × 12/n.
     · The GAP DOES NOT. It is an intensity ratio, and annualising both
       halves of a ratio leaves it unchanged. So the projected gap IS the
       current gap, carried forward — which is exactly the assumption being
       made, and worth printing precisely because a reader expects a
       projection to move and should see that this one does not.

   EACH WORKSPACE IS ANNUALISED ON ITS OWN MONTHS, then the results are
   summed — the scope's pooled ratio is never used. That matters as soon as a
   scope holds more than one product at different stages, which is the normal
   case: six months in on one product and nothing yet on a second gives a
   pooled ratio of 6/24, and scaling by four would project the untouched
   product's whole year out of the first product's rate. Those are different
   goods at different plants; one has told us nothing, and the honest
   projection of nothing is nothing. Per workspace, 6/12 on the one that has
   data and no contribution from the one that has none.

   Null when there is nothing to project from. */
export type ScopeProjection = {
  totalEmbeddedTCO2e: number | null;
  avgGapPercent: number | null;
  monthsCounted: number;
  monthsPossible: number;
  /** true when every month in scope is already in, so nothing is being
      extrapolated and the screen should say the year is done instead */
  complete: boolean;
};

export function scopeProjection(figures: ScopeFigures): ScopeProjection {
  const { monthsCounted, monthsPossible } = figures;
  const complete = monthsPossible > 0 && monthsCounted >= monthsPossible;

  if (monthsCounted === 0 || monthsPossible === 0) {
    return { totalEmbeddedTCO2e: null, avgGapPercent: null, monthsCounted, monthsPossible, complete: false };
  }

  let projected: number | null = null;
  for (const w of figures.perWorkspace) {
    // Nothing submitted here yet — there is no rate to carry forward, and
    // borrowing a sibling product's would be an invention.
    if (w.embedded == null || w.monthsCounted === 0) continue;
    const scaled = finite(w.embedded * (MONTHS_IN_YEAR / w.monthsCounted));
    if (scaled != null) projected = (projected ?? 0) + scaled;
  }

  return {
    totalEmbeddedTCO2e: projected,
    avgGapPercent: figures.avgGapPercent,
    monthsCounted,
    monthsPossible,
    complete,
  };
}

/* ── The four series the chart draws ────────────────────────────
   Direct, indirect, precursor and their total, per tonne of good, month by
   month — plus the EU default as the rule they are read against.

   THE PRECURSOR SERIES IS FLAT, AND THAT IS NOT A SHORTCUT. A precursor's
   contribution is declared once for the reporting period (it is the
   supplier's own verified figure per tonne of what they ship, times how much
   of it goes into a tonne of ours) — there is no month in it to vary. The
   engine treats it the same way: M9 = M4 + M6 + M8 adds an annual M8 to
   monthly M4 and M6. Drawing it as a level line is what that arithmetic looks
   like, and the chart's own footnote says so rather than leaving a reader to
   wonder why one line never moves.

   A SERIES WITH NOTHING BEHIND IT IS ABSENT, NOT ZERO. `null` here means the
   chart draws no line and the legend prints "—". A precursor line pinned to
   the axis would say this good is made of nothing bought in; a default line
   at zero would say the EU expects zero emissions. Both are assertions, and
   neither is one the data supports.

   ── PROJECTED MONTHS ARE POINTS TOO, AND THEY SAY SO ───────────
   With the projection switched on, every month of the reporting year that has
   no submitted figure gets one anyway, at the year-to-date intensity — the
   same assumption the projected total is built on, drawn rather than stated.
   Each carries `projected: true`, and the chart draws those segments in a
   different colour, dashed, over a shaded band, with hollow markers. Four
   separate treatments for one distinction is not over-doing it: this is the
   one place on the page where a made-up number sits on the same axis as a
   measured one, and a reader who mistakes the second half of that line for
   readings has been misled by the chart rather than merely confused by it. */
export type EmissionsSeriesPoint = {
  month: string;
  monthLabel: string;
  /** null where the engine refused this month's arithmetic — see `finite` */
  direct: number | null;
  indirect: number | null;
  precursor: number | null;
  total: number | null;
  /** false for a submitted month, true for one carried forward at the
      year-to-date rate */
  projected: boolean;
};

export type EmissionsChartData = {
  points: EmissionsSeriesPoint[];
  /** flat across the year — see above */
  precursorPerTonne: number | null;
  /** the EU default for this good, when one is on file for its category */
  defaultSee: number | null;
  /** true when the scope holds more than one workspace, so the chart can say
      it is showing one of them rather than silently picking */
  multiple: boolean;
  /** how many of `points` were carried forward rather than submitted */
  projectedCount: number;
};

/** Month-by-month intensity for ONE workspace. Several products' per-tonne
    figures overlaid on one axis is not a trend, it is a coincidence — a
    tonne of ferro-chromium and a tonne of pig iron are not comparable units
    — so the chart takes a single workspace and the page passes the scope's
    first when a scope holds several. That is the same rule the quarterly
    trend this replaced already followed. */
export function emissionsChartData(
  workspace: VerificationWorkspace,
  see: WorkspaceSEE,
  multiple: boolean,
  project = false,
): EmissionsChartData {
  const precursorPerTonne = Number.isFinite(see.seePrecursor) && see.seePrecursor > 0 ? see.seePrecursor : null;
  const def = defaultSeeForWorkspace(workspace);
  const defaultSee = def ? finite(def.defaultSeeDirect + def.defaultSeeIndirect) : null;

  const measured: EmissionsSeriesPoint[] = see.months
    // A month with no production has no intensity. Plotted as zero it would
    // read as a carbon-free month rather than an empty one.
    .filter((m) => m.counted && m.productionTonnes > 0)
    .map((m) => {
      const direct = finite(m.directTCO2 / m.productionTonnes);
      const indirect = finite(m.indirectTCO2 / m.productionTonnes);
      return {
        month: m.month,
        monthLabel: m.month,
        direct,
        indirect,
        precursor: precursorPerTonne,
        // The total is only a total when every part of it is a number. A
        // month whose direct figure the engine refused has no total, and
        // silently substituting zero for the refused half would publish a
        // figure lower than the truth on a compliance screen.
        total: direct == null || indirect == null ? null : direct + indirect + (precursorPerTonne ?? 0),
        projected: false,
      };
    });

  if (!project || measured.length === 0) {
    return { points: measured, precursorPerTonne, defaultSee, multiple, projectedCount: 0 };
  }

  /* THE RATE CARRIED FORWARD IS THE ANNUAL ONE, not the last month's. M4 and
     M6 aggregate numerator and denominator across every submitted month and
     divide once (see lib/workspace-see.ts) — which is the whole discipline of
     this codebase, and the reason a projection built on it agrees to the
     decimal with the projected TOTAL on the cards above. Carrying the most
     recent month forward instead would let one quiet August decide the
     remaining four months of the year. */
  const rateDirect = finite(see.seeDirect);
  const rateIndirect = finite(see.seeIndirect);
  if (rateDirect == null || rateIndirect == null) {
    return { points: measured, precursorPerTonne, defaultSee, multiple, projectedCount: 0 };
  }

  const byMonth = new Map(measured.map((p) => [p.month, p] as const));
  const points: EmissionsSeriesPoint[] = [];
  let projectedCount = 0;

  /* Every month of the reporting year, in order, so a gap in the middle is
     filled where it sits rather than appended to the end. A workspace with
     January and March submitted and February missing gets a projected
     February BETWEEN them — which is what the year actually looks like, and
     what makes the missing month visible instead of quietly closing the line
     over it. */
  for (const ym of monthsOf(workspace)) {
    const existing = byMonth.get(ym);
    if (existing) {
      points.push(existing);
      continue;
    }
    projectedCount += 1;
    points.push({
      month: ym,
      monthLabel: ym,
      direct: rateDirect,
      indirect: rateIndirect,
      precursor: precursorPerTonne,
      total: rateDirect + rateIndirect + (precursorPerTonne ?? 0),
      projected: true,
    });
  }

  return { points, precursorPerTonne, defaultSee, multiple, projectedCount };
}

/** The scope's own production summary, for the line under the pickers — as
    FACTS, for the same reason `ScopeOption` is (see above). The screen turns
    these into a sentence in whichever language it is drawing. */
export type ScopeProduction =
  | { kind: "none" }
  | { kind: "started"; months: number }
  | { kind: "submitted"; tonnes: number; months: number };

export const scopeProduction = (f: ScopeFigures): ScopeProduction =>
  f.monthsCounted === 0
    ? f.standing.monthsEntered > 0
      ? { kind: "started", months: f.standing.monthsEntered }
      : { kind: "none" }
    : { kind: "submitted", tonnes: f.productionTonnes, months: f.monthsCounted };

/** Re-exported so a caller can build the SEE map without importing two
    modules to do one thing. */
export const seeMapFor = (workspaces: VerificationWorkspace[]): Map<string, WorkspaceSEE> =>
  new Map(workspaces.map((w) => [w.id, workspaceSEE(w)] as const));

/** Production, for the callers that need it without the whole SEE. */
export { annualProductionFor };
