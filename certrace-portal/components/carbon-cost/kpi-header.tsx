"use client";

/* ════════════════════════════════════════════════════════════
   CARBON & COST — THE TWO HEADLINE FIGURES

   TWO CARDS, NOT FOUR. This header used to carry four, and two of them were
   removed rather than fixed:

     · COST EXPOSURE, ALL BUYERS — "€0 · 0 buyers this year". It read as a
       measurement and was an absence: the figure needs shipments logged
       against a buyer, which almost no account has, so the card spent its
       life stating a euro amount of zero next to a count of zero. A money
       figure that is nought because nothing was entered is indistinguishable
       from one that is nought because nothing is owed, and only one of those
       is good news.

     · VERIFICATION COMPLETE — "0% · 0 of 1 products". Readiness, restated on
       an analysis page. It is the Verification tab's own subject, it is
       already on every workspace card and on the report list, and a third
       telling of it here answered a question nobody arrives at Carbon & Cost
       with.

   Then a SECOND PAIR came off, and this is the change worth explaining:
   PROJECTED FULL YEAR used to be its own section of two more cards under
   these two. Same two measurements, projected, permanently on screen —
   which meant that on the overwhelmingly common visit the page carried the
   words "Nothing to project from yet" and "Nothing comparable yet" under a
   heading promising a full year, which is a card reporting its own absence.
   The projection is now a SWITCH beside the pickers, and pressing it changes
   these two cards in place rather than printing a second copy of them
   underneath. One pair of figures, in one position, that either says
   "measured" or says "projected" — which is also what makes the difference
   between the two legible, because it is the same card moving.

   Both are read at the SELECTED SCOPE (see lib/cbam/carbon-scope.ts) rather
   than always across the whole portfolio, because neither number means
   anything blended across products nobody buys together.

   NULL RENDERS AS "—", NEVER AS ZERO. See the scope module's header: a
   product with no submitted months does not have embedded emissions of nought.
   ════════════════════════════════════════════════════════════ */

import { Card, Stat, cn } from "@/components/ui";
import { useFormat, useT, type TFunction } from "@/lib/i18n";
import type { ScopeFigures, ScopeProjection, ScopeStanding, StandingReason } from "@/lib/cbam/carbon-scope";

/* Second line of defence against a non-number reaching the screen — see
   lib/cbam/carbon-scope.ts's `finite`, which is the first. "NaN t" on a
   compliance figure reads as a broken product; "—" reads as "not yet", which
   is what an unworkable figure actually is. */
const isNum = (n: number | null): n is number => n != null && Number.isFinite(n);

/* ── OFFICIAL / NOT OFFICIAL ────────────────────────────────────
   The one label that decides what an exporter may do with everything else on
   this page, so it is a chip rather than a sentence in a paragraph: it has to
   survive being glanced at.

   THREE STATES, NOT TWO. "Not official" alone would be a verdict with no next
   step — the whole value of the label is that it names WHICH of the two
   things is missing, because they are fixed in completely different places:
   a part-year is fixed on Monthly data, and unverified precursor data is
   fixed on the supply chain. See lib/cbam/carbon-scope.ts's
   `workspaceStanding` for where each state comes from. */
const STANDING_TONE: Record<StandingReason, string> = {
  official: "border-[rgba(5,150,105,0.18)] bg-[#ecfdf5] text-[#047857]",
  partial_year: "border-[rgba(180,83,9,0.18)] bg-[#fffbeb] text-[#b45309]",
  unverified_data: "border-[rgba(180,83,9,0.18)] bg-[#fffbeb] text-[#b45309]",
  no_data: "border-black/[0.08] bg-black/[0.02] text-black/50",
};

export function standingLabel(reason: StandingReason, t: TFunction): string {
  if (reason === "official") return t("Official");
  if (reason === "no_data") return t("No data yet");
  return t("Not official");
}

export function standingDetail(standing: ScopeStanding, t: TFunction): string {
  const { reason, monthsCounted, monthsPossible, monthsEntered, products } = standing;
  if (reason === "official")
    return products === 1
      ? t("All twelve months are in and every precursor is verified.")
      : t("All {count} products: twelve months in, precursors verified.", { count: products });

  if (reason === "no_data")
    return monthsEntered > 0
      ? t(
          "{entered} of {possible} months started, none submitted yet.",
          { entered: monthsEntered, possible: monthsPossible },
        )
      : t("No month submitted yet.");

  if (reason === "partial_year")
    return t(
      "{counted} of {possible} months submitted. Part of a year, so not official.",
      { counted: monthsCounted, possible: monthsPossible },
    );

  return t(
    "The year is in, but not every precursor is verified yet.",
  );
}

export function StandingChip({ standing, className }: { standing: ScopeStanding; className?: string }) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em]",
        STANDING_TONE[standing.reason],
        className,
      )}
    >
      {standingLabel(standing.reason, t)}
    </span>
  );
}

/** The projected pair carries its own chip, so a reader who has scrolled past
    the switch still knows which of the two things they are looking at. */
function ProjectedChip() {
  const t = useT();
  return (
    <span className="inline-flex items-center rounded-full border border-[rgba(60,122,203,0.25)] bg-[#eff6ff] px-2 py-0.5 text-[9.5px] uppercase tracking-[0.12em] text-[#2f62a6]">
      {t("Projected")}
    </span>
  );
}

export function CarbonCostKpiHeader({
  figures,
  projection,
  projecting,
  scopeLabel,
}: {
  figures: ScopeFigures;
  /** the same two figures carried to a full year — read only when
      `projecting`, and null when the scope cannot be projected at all */
  projection: ScopeProjection | null;
  projecting: boolean;
  scopeLabel: string;
}) {
  const t = useT();
  const { number } = useFormat();
  const { comparableCount, monthsCounted, standing } = figures;

  /* ONE SOURCE FOR BOTH STATES. The projected total is a different number;
     the projected gap is deliberately THE SAME number, because annualising
     both halves of a ratio leaves it where it was. That is stated on the card
     rather than left to look like a bug — a reader who presses a projection
     switch expects every figure to move, and the one that does not has to say
     why it does not. */
  const on = projecting && projection != null;
  const total = on ? projection.totalEmbeddedTCO2e : figures.totalEmbeddedTCO2e;
  const gap = on ? projection.avgGapPercent : figures.avgGapPercent;

  const tonnes = (n: number | null) => (isNum(n) ? `${number(n, { maximumFractionDigits: 1 })} t` : "—");
  const percent = (n: number | null) => (isNum(n) ? `${number(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : "—");

  /* WHY A FIGURE IS A DASH, IN THE WORDS OF THE THING THAT WOULD FILL IT.
     "No submitted months yet" is true and unhelpful on an account that has
     four months typed in and none sent; naming the gap between entered and
     submitted turns the empty card into the next click. */
  const totalSub = !isNum(total)
    ? standing.monthsEntered > monthsCounted
      ? standing.monthsEntered === 1
        ? t("1 month started, not submitted yet")
        : t("{entered} months started, none submitted yet", { entered: standing.monthsEntered })
      : t("No submitted months yet")
    : on
      ? t("{scope} · at this year's rate", { scope: scopeLabel })
      : monthsCounted === 1
        ? t("{scope} · 1 submitted month", { scope: scopeLabel })
        : t("{scope} · {count} submitted months", { scope: scopeLabel, count: monthsCounted });

  const gapSub = !isNum(gap)
    ? t("Nothing comparable yet")
    : on
      ? t("unchanged by scaling")
      : comparableCount === 1
        ? gap >= 0
          ? t("below the default · one product")
          : t("above the default · one product")
        : gap >= 0
          ? t("below the default · averaged over {count} products", { count: comparableCount })
          : t("above the default · averaged over {count} products", { count: comparableCount });

  return (
    <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
      <Card warm={on} className="p-6">
        {on && (
          <div className="mb-2">
            <ProjectedChip />
          </div>
        )}
        <Stat value={tonnes(total)} label={t("Total embedded emissions")} sub={totalSub} />
      </Card>

      <Card warm={on} className="p-6">
        {on && (
          <div className="mb-2">
            <ProjectedChip />
          </div>
        )}
        {/* Positive = better than the default (lower actual emissions), the
            same convention every other benchmark surface uses, so two numbers
            on two screens can never read as disagreeing. */}
        <Stat value={percent(gap)} label={t("Avg. gap vs. default")} sub={gapSub} />
      </Card>
    </div>
  );
}
