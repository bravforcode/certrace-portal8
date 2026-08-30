"use client";

/* ════════════════════════════════════════════════════════════
   PLAN & BILLING — the tier summaries, then the whole comparison

   THE METER CHANGED, AND THIS PAGE IS WHERE IT SHOWS. It used to sell
   supplier seats: three cards with a THB figure on each, a supplier cap under
   it, and a checkout that took a card. All four of those facts are now wrong.
   Suppliers are unlimited and free on every tier at any chain depth; what a
   plan sizes is the FILING — CN codes, the sites behind them, the years open
   at once, and the people working on it.

   WHAT WAS REMOVED, AND WHY:

   · THE PRICES, on Starter and Standard. They are quoted, not listed. A
     figure on the card is a promise the sales conversation then has to
     re-open, so the card asks for the conversation instead and every CTA
     lands on the LINE account where a specialist answers.

   · THE CHECKOUT MODAL. It charged a card for a figure the page no longer
     names. There is nothing to self-serve when the price is quoted.

   · THE PAYMENT METHOD CARD and THE INVOICE LIST. Same reason: a stored card
     and a ฿360,000 receipt described a self-serve subscription this account
     does not have. Billing is handled with sales, on the agreed term.

   WHAT WAS ADDED: the usage strip. The caps are enforced across the product
   now (lib/plan.ts), so the page that sells them is the page that has to show
   how much of each is spent — otherwise "20 CN codes" is a number the reader
   can only test by hitting the wall somewhere else.

   AND THEN THE TRIAL. A free-trial account has no caps to meter, so the strip
   above the tiers becomes a CLOCK instead: how much of the month is left, and
   what happens when it is not. It is the only screen in the product that says
   anything at all about the trial ending — see components/account-lock.tsx
   for why the other forty screens say nothing and simply come here.

   THE DOUBLE RULE IS GONE. Each block inside a tier card carries exactly ONE
   border, on its top edge. The source layout gave the price block a rule
   above AND below and then opened the next block with a rule of its own, so
   two hairlines sat a gap apart and read as a rendering fault.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { Check, ArrowRight, Minus } from "lucide-react";
import { Card, PageHeader, Button, ButtonLink, Chip, StatusDot, cn } from "@/components/ui";
import { PLANS, PLAN_COMPARISON, PLAN_COLOPHON, CONTACT_SALES_URL, type Plan, type CompareCell } from "@/lib/config";
import { CAP_LABEL, cnCodeCap, siteCap, yearCap, seatCap, isUpgrade, type CapState, type PlanId, type TrialState } from "@/lib/plan";
import { useAccount } from "@/components/account-lock";
import { useFormat, useT, type TFunction } from "@/lib/i18n";

/* The renewal date is a DATE, not a string, so it prints as 1 Jul 2027 in
   English and 1 ก.ค. 2027 in Thai instead of carrying an English month into
   a Thai sentence. */
const RENEWS = new Date("2027-07-01T00:00:00Z");

export default function BillingPage() {
  const t = useT();
  const { ready, planId, plan, trial } = useAccount();

  /* The caps read localStorage stores, so they are measured after mount —
     rendering them on the server would print a zero that then jumps. */
  const [caps, setCaps] = React.useState<CapState[] | null>(null);
  React.useEffect(() => {
    setCaps([cnCodeCap(), siteCap(), yearCap(), seatCap()]);
  }, [planId]);

  const onTrial = ready && trial.onTrial;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={t("Plan & billing")}
        title={t("Pricing that scales with CN codes, not suppliers.")}
        lead={t(
          "Three tiers, annual term. Suppliers answer for free on every tier, at any chain depth — what a plan sizes is your filing: the CN codes it covers, the sites behind them, and the people working on it.",
        )}
      />

      {/* ── Where this account stands ─────────────────────── */}
      <div className="space-y-3">
        {onTrial && trial.onTrial ? <TrialClock trial={trial} t={t} /> : <PaidStrip planName={plan.name} t={t} />}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {(caps ?? []).map((c) => (
            <UsageMeter key={c.key} cap={c} planName={plan.name} t={t} />
          ))}
          {/* Same height as a measured meter, so the strip does not jump when
              the four counts arrive. */}
          {!caps && [0, 1, 2, 3].map((i) => <Card key={i} className="h-[104px] p-4" aria-hidden><span /></Card>)}
        </div>
      </div>

      {/* ── The three tiers, in brief ──────────────────────── */}
      <section aria-label={t("Plans at a glance")} className="grid gap-3 lg:grid-cols-3">
        {PLANS.map((p) => (
          <TierCard key={p.id} plan={p} current={planId} onTrial={onTrial} t={t} />
        ))}
      </section>

      {/* ── The whole comparison ───────────────────────────── */}
      <ComparisonTable t={t} />

      <p className="flex flex-wrap gap-x-7 gap-y-1.5 border-t border-black/[0.06] pt-5 font-pixel text-[10.5px] uppercase tracking-[0.1em] text-black/35">
        {PLAN_COLOPHON.map((line) => (
          <span key={line}>{t(line)}</span>
        ))}
      </p>

      <p className="text-center text-xs text-black/35">
        {t("Need EUDR, CSRD or another origin country?")}{" "}
        <Link href="/regulations" className="text-black/55 underline-offset-2 hover:text-black hover:underline">
          {t("See what's coming")} →
        </Link>
      </p>
    </div>
  );
}

/* ── A paid account's one-line standing ─────────────────────── */
function PaidStrip({ planName, t }: { planName: string; t: TFunction }) {
  const fmt = useFormat();
  return (
    <Card warm className="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <StatusDot tone="ok" glow pulse />
        <p className="text-sm text-black/60">
          {t("You're on")} <span className="text-[#111]">{t(planName)}</span> ·{" "}
          {t("annual term · renews {date}", { date: fmt.date(RENEWS) })}
        </p>
      </div>
      <Chip tone="ok">{t("suppliers free")}</Chip>
    </Card>
  );
}

/* ── The trial, as a clock ──────────────────────────────────
   THE BAR EMPTIES. Every other meter on this page fills towards a limit; a
   countdown drawn the same way reads backwards, because the fullest bar would
   be the worst news. This one is how much month is left, so it drains.

   THE DAY NUMBER SITS BESIDE IT rather than inside it. "Day 22 of 30" is the
   fact somebody checks against their own calendar, and a figure printed on a
   3px rule is a figure nobody can read.

   ENDED IS A STATE, NOT AN ERROR. When the month is up the card says what is
   true — the account is read-only, the work is kept — and points at the one
   thing that changes it. No alarm colours beyond the amber the rest of the
   product uses for "this needs you", because a customer whose trial finished
   has not done anything wrong. */
type RunningTrial = Extract<TrialState, { onTrial: true }>;

function TrialClock({ trial, t }: { trial: RunningTrial; t: TFunction }) {
  const fmt = useFormat();
  const urgent = trial.daysLeft <= 7;
  const tone = trial.ended || urgent ? "#b45309" : "#111";

  return (
    <Card warm className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <StatusDot tone={trial.ended ? "warn" : "ok"} glow pulse={!trial.ended} />
            <span className="font-pixel text-[10.5px] uppercase tracking-[0.16em] text-black/45">{t("Free trial")}</span>
          </div>
          <p className="mt-2.5 font-[family-name:var(--font-plex)] text-[23px] font-light leading-[1.25] tracking-[-0.01em] text-[#111] sm:text-[27px]">
            {trial.ended
              ? t("Your free month is over.")
              : trial.daysLeft === 1
                ? t("One day left in your free month.")
                : t("{days} days left in your free month.", { days: trial.daysLeft })}
          </p>
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-black/50">
            {trial.ended
              ? t("Everything you built is still here and still readable. Choose a tier to start working on it again.")
              : t("Nothing is capped while it runs — every CN code, site, seat and supplier. It ends on {date}.", { date: fmt.date(trial.endsOn) })}
          </p>
        </div>

        <ButtonLink href={CONTACT_SALES_URL} external size="sm" className="flex-none">
          {t("Contact Sales")} <ArrowRight size={14} strokeWidth={1.5} />
        </ButtonLink>
      </div>

      {/* The bar itself. `aria-*` because a drained rule is not a fact a
          screen reader can read off the pixels. */}
      <div className="mt-5">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={trial.totalDays}
          aria-valuenow={trial.daysLeft}
          aria-label={t("Days left in your free trial")}
          className="h-[5px] overflow-hidden rounded-full bg-black/[0.08]"
        >
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${Math.round((trial.daysLeft / trial.totalDays) * 100)}%`, background: tone }}
          />
        </div>
        <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="font-pixel text-[10.5px] uppercase tracking-[0.12em] tabular-nums text-black/40">
            {t("Day {used} of {total}", { used: Math.min(trial.daysUsed + (trial.ended ? 0 : 1), trial.totalDays), total: trial.totalDays })}
          </span>
          <span className="font-pixel text-[10.5px] uppercase tracking-[0.12em] tabular-nums" style={{ color: trial.ended || urgent ? tone : "rgba(0,0,0,0.4)" }}>
            {trial.ended ? t("ended {date}", { date: fmt.date(trial.endsOn) }) : t("ends {date}", { date: fmt.date(trial.endsOn) })}
          </span>
        </div>
      </div>
    </Card>
  );
}

/* ── A cap, and how much of it is spent ─────────────────────
   Uncapped tiers show the count with NO BAR. A rule that can never fill is a
   rule that means nothing, and on Enterprise — or on a trial — all four of
   them are that. The row keeps its height so the strip does not change shape
   between plans. */
function UsageMeter({ cap, planName, t }: { cap: CapState; planName: string; t: TFunction }) {
  const unlimited = cap.cap == null;
  return (
    <Card className="flex min-h-[104px] flex-col p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">{t(CAP_LABEL[cap.key])}</span>
        <span className={cn("font-mono text-[12px] tabular-nums", cap.atCap ? "text-[#b45309]" : "text-black/45")}>{cap.label}</span>
      </div>
      {unlimited ? (
        <div className="mt-auto">
          <p className="font-pixel text-[10.5px] uppercase tracking-[0.1em] text-black/35">{t("No cap on your plan")}</p>
        </div>
      ) : (
        <>
          <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-black/[0.07]">
            <div
              className={cn("h-full rounded-full transition-[width]", cap.atCap ? "bg-[#b45309]" : "bg-[#111]")}
              style={{ width: `${Math.round(cap.fraction * 100)}%` }}
            />
          </div>
          <p className="mt-2.5 text-[11px] leading-relaxed text-black/40">
            {cap.atCap ? t("At your plan's limit.") : t("In use on {plan}.", { plan: t(planName) })}
          </p>
        </>
      )}
    </Card>
  );
}

/* ── One tier ───────────────────────────────────────────────
   ONE RULE PER BOUNDARY — see the header. Every block below the promise line
   opens with `border-t` and closes with nothing. */
function TierCard({ plan, current, onTrial, t }: { plan: Plan; current: PlanId; onTrial: boolean; t: TFunction }) {
  const isCurrent = plan.id === current;
  /* ON A TRIAL EVERY TIER IS AN UPGRADE, so `isUpgrade` would paint three
     primary buttons in a row and the reader would have no idea which one the
     page thinks they want. The highlighted tier carries the weight instead —
     the same one the comparison table shades. */
  const emphasised = onTrial ? Boolean(plan.highlight) : isUpgrade(current, plan.id);

  return (
    <Card highlight={plan.highlight} className={cn("flex h-full flex-col p-6 sm:p-7", isCurrent && "ring-1 ring-black/15")}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-[family-name:var(--font-plex)] text-[27px] font-light leading-[1.1] tracking-[-0.01em] text-[#111]">
          {t(plan.name)}
        </h2>
        {isCurrent ? (
          <Chip tone="ok" className="flex-none">
            {t("current")}
          </Chip>
        ) : (
          <span className="flex-none whitespace-nowrap border border-black/15 px-2.5 py-1 font-pixel text-[10px] uppercase tracking-[0.1em] text-black/55">
            {t(plan.tag)}
          </span>
        )}
      </div>

      <p className="mt-5 min-h-[2.9em] font-[family-name:var(--font-plex)] text-[17px] font-light leading-[1.45] text-[#111] text-balance">
        {t(plan.line)}
      </p>

      <div className="mt-5 flex flex-col gap-1.5 border-t border-black/[0.08] pt-[18px]">
        <span className="font-[family-name:var(--font-plex)] text-[27px] font-light leading-none tracking-[-0.01em] text-[#111]">
          {t(plan.amount)}
        </span>
        <span className="font-pixel text-[11px] uppercase tracking-[0.08em] text-black/55">{t(plan.unit)}</span>
      </div>

      <dl className="mt-4 flex flex-col gap-[7px] border-t border-black/[0.08] pt-4">
        <dt className="font-pixel text-[10px] uppercase tracking-[0.1em] text-black/40">{t("Built for")}</dt>
        <dd className="m-0 text-[13.5px] leading-[1.6] text-black/60">{t(plan.builtFor)}</dd>
      </dl>

      <div className="mt-auto flex flex-col border-t border-black/[0.08] pt-1">
        {plan.capRows.map((row, i) => (
          <div
            key={row.label}
            className={cn(
              "flex items-baseline justify-between gap-3.5 py-2 text-[13px]",
              i < plan.capRows.length - 1 && "border-b border-black/[0.06]",
            )}
          >
            <span className="text-black/50">{t(row.label)}</span>
            <span className="text-right font-pixel text-[12px] uppercase tracking-[0.04em] tabular-nums text-[#111]">
              {t(row.value)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {isCurrent ? (
          <Button variant="secondary" className="w-full" disabled>
            <Check size={14} strokeWidth={2} /> {t("Current plan")}
          </Button>
        ) : (
          <ButtonLink href={CONTACT_SALES_URL} external variant={emphasised ? "primary" : "secondary"} className="w-full">
            {t("Contact Sales")} <ArrowRight size={14} strokeWidth={1.5} />
          </ButtonLink>
        )}
      </div>
    </Card>
  );
}

/* ── The comparison ─────────────────────────────────────────
   THE HEADER PINS UNDER THE TOPBAR, AND IT IS NOT `position: sticky` ON THE
   `<th>`s. It used to be, and it did not work — it displaced them.

   The table lives inside a horizontally scrollable div, and a box with
   `overflow-x: auto` computes `overflow-y` to `auto` as well: it becomes the
   nearest scrollport, so a sticky cell inside it measures `top` against THAT
   box rather than against the page. The div never scrolls vertically, so the
   header could never stick — but `top: 64px` still applied, and pushed all
   four header cells 64px DOWN into the first rows of the table. That is the
   overlap: "20+ · priced on scope" cut in half by a header sitting on top of
   it, at every scroll position, on every screen size.

   So the pinned copy is a SIBLING of the scroller, not a child of it — a
   `sticky top-16` bar in normal page flow, where `top` means what the reader
   thinks it means. It is measured from the real header (`widths`), offset by
   the scroller's own `scrollLeft` so it tracks a sideways swipe, and it
   carries its own frozen first column exactly like the table does.

   IT ONLY EXISTS WHILE THE TABLE IS BEING READ. Above the table there is
   nothing pinned at all — the tier cards are what somebody scrolling down
   the page is looking at, and a comparison header hovering over them is
   furniture in front of the thing it describes. It appears when the real
   header goes under the topbar and disappears the moment the table's last
   row does. `h-0` so it occupies no space and pushes nothing around.

   `aria-hidden` — it is a second copy of a header the table already carries,
   and the real one is still in the accessibility tree. */

/** The portal's topbar is `sticky top-0 h-16`. Anything pinned under it lines
    up here or slides beneath it. */
const TOPBAR_H = 64;

type PinState = { show: boolean; height: number; widths: number[]; scrollLeft: number; tableWidth: number };

const EMPTY_PIN: PinState = { show: false, height: 0, widths: [], scrollLeft: 0, tableWidth: 0 };

function ComparisonTable({ t }: { t: TFunction }) {
  const cols = PLANS;
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const tableRef = React.useRef<HTMLTableElement>(null);
  const [pin, setPin] = React.useState<PinState>(EMPTY_PIN);

  React.useEffect(() => {
    const scroller = scrollerRef.current;
    const table = tableRef.current;
    if (!scroller || !table) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const head = table.tHead;
      if (!head || head.rows.length === 0) return;
      const headRect = head.getBoundingClientRect();
      const tableRect = table.getBoundingClientRect();
      const height = headRect.height;
      /* Shown only in the band where a pinned header earns its place: the
         real one has started going under the topbar, and there are still rows
         left below the line to read against it.

         `top`, not `bottom`. Waiting for the whole header to disappear leaves
         a stretch where it is half-swallowed by the translucent topbar and
         the copy has not arrived yet — the reader watches "Starter" dissolve.
         Taking over at the first pixel means the copy appears exactly where
         the real header already is, so the handover is invisible. */
      const show = headRect.top < TOPBAR_H && tableRect.bottom > TOPBAR_H + height;
      const widths = Array.from(head.rows[0].cells, (c) => c.getBoundingClientRect().width);
      const next: PinState = { show, height, widths, scrollLeft: scroller.scrollLeft, tableWidth: table.getBoundingClientRect().width };
      setPin((prev) =>
        prev.show === next.show &&
        prev.height === next.height &&
        prev.scrollLeft === next.scrollLeft &&
        prev.tableWidth === next.tableWidth &&
        prev.widths.length === next.widths.length &&
        prev.widths.every((w, i) => w === next.widths[i])
          ? prev
          : next,
      );
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    scroller.addEventListener("scroll", schedule, { passive: true });
    /* Column widths move when the language does — Thai sets wider — and when
       a font finishes loading. Neither fires a scroll event. */
    const observer = new ResizeObserver(schedule);
    observer.observe(table);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      scroller.removeEventListener("scroll", schedule);
      observer.disconnect();
    };
  }, [t]);

  return (
    <section aria-label={t("Plan comparison")} className="relative space-y-5">
      {/* The pinned copy — see the header above. */}
      <div aria-hidden className="pointer-events-none sticky top-16 z-30 h-0">
        <div
          className="relative overflow-hidden border-x border-b border-black/[0.07] border-b-black/15 bg-white"
          style={{ height: pin.height, opacity: pin.show ? 1 : 0, visibility: pin.show ? "visible" : "hidden" }}
        >
          <div className="flex" style={{ width: pin.tableWidth || undefined, transform: `translateX(${-pin.scrollLeft}px)` }}>
            <div className="flex-none" style={{ width: pin.widths[0] }} />
            {cols.map((p, i) => (
              <div
                key={p.id}
                className={cn("flex-none px-3 pb-4 pt-[18px] sm:px-5", p.highlight ? "bg-[#f0eee8]" : "bg-white")}
                style={{ width: pin.widths[i + 1] }}
              >
                <HeaderCell plan={p} t={t} />
              </div>
            ))}
          </div>
          {/* The frozen label column, over the top of the translated row —
              `sticky` cannot survive a transform, so it is drawn separately
              at the same width the real one measured. */}
          <div className="absolute left-0 top-0 bg-white px-3 pb-4 pt-[18px] sm:px-5" style={{ width: pin.widths[0], height: pin.height }}>
            <span className="block font-pixel text-[11px] uppercase tracking-[0.14em] text-black/40">{t("Feature")}</span>
          </div>
        </div>
      </div>

      <div
        ref={scrollerRef}
        tabIndex={0}
        role="region"
        aria-label={t("Feature comparison table, scrollable")}
        className="overflow-x-auto rounded-2xl border border-black/[0.07] bg-white"
      >
        {/* NARROWER ON A PHONE, and this is load-bearing rather than cosmetic.
            At the desktop 820px the frozen label column worked out at 312px of
            a 343px viewport, so swiping the table moved the tier values
            straight behind the label and the reader saw a column of empty
            cells. 500px keeps every column reachable with roughly one and a
            half tiers on screen at a time. */}
        <table ref={tableRef} className="w-full min-w-[500px] border-collapse bg-white sm:min-w-[820px]">
          <thead>
            <tr>
              <th
                scope="col"
                /* `sticky left-0` only — see the note above ComparisonTable
                   for why there is no `top` here any more. The horizontal
                   freeze is real: the scroller IS the scrollport on that
                   axis, which is the axis it actually scrolls. */
                /* NARROWER ON A PHONE. At 290px the frozen label column eats
                   a 375px screen and leaves 85px of the next tier — not
                   enough to read a value, so the reader scrolls sideways
                   without ever seeing a whole column. 220px shows one tier in
                   full beside the label it belongs to. */
                className="sticky left-0 z-[4] w-[34%] min-w-[150px] border-b border-black/15 bg-white px-3 pb-4 pt-[18px] text-left align-middle sm:w-[38%] sm:min-w-[290px] sm:px-5"
              >
                <span className="block font-pixel text-[11px] uppercase tracking-[0.14em] text-black/40">{t("Feature")}</span>
              </th>
              {cols.map((p) => (
                <th
                  key={p.id}
                  scope="col"
                  className={cn(
                    "border-b border-black/15 px-3 pb-4 pt-[18px] text-left align-middle sm:px-5",
                    p.highlight ? "bg-[#f0eee8]" : "bg-white",
                  )}
                >
                  <HeaderCell plan={p} t={t} />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {PLAN_COMPARISON.map((group) => (
              <React.Fragment key={group.title}>
                <tr>
                  {/* THE BAND SPANS THE ROW; THE TITLE STICKS INSIDE IT. A
                      sticky cell that also spans four columns pins its box and
                      lets its text scroll out of the viewport — the group name
                      clipped to "…UR SUPPLIERS" halfway through a swipe. The
                      cell stays put and an inner block does the sticking, so
                      the warm rule runs the full width and the name stays at
                      the left edge wherever the reader has scrolled to. */}
                  <th
                    scope="colgroup"
                    colSpan={cols.length + 1}
                    className="border-y border-black/[0.08] border-t-black/15 bg-[#faf9f7] p-0 text-left"
                  >
                    {/* inline-block, NOT block: a sticky element can only
                        slide within the slack left inside its containing
                        block, and a full-width child of the cell has none — it
                        computes as sticky and never moves. */}
                    <span className="sticky left-0 inline-block px-3 py-[11px] font-pixel text-[10.5px] font-bold uppercase tracking-[0.14em] text-black/55 sm:px-5">
                      {t(group.title)}
                    </span>
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.label} className="group">
                    <th
                      scope="row"
                      className="sticky left-0 z-[2] border-b border-black/[0.06] bg-white px-3 py-3.5 text-left align-middle text-[13px] font-normal leading-[1.45] text-[#111] group-hover:bg-[#faf9f7] sm:px-5 sm:text-[14px] sm:leading-[1.5]"
                    >
                      {t(row.label)}
                    </th>
                    {row.cells.map((cell, i) => (
                      <td
                        key={cols[i].id}
                        className={cn(
                          "border-b border-black/[0.06] px-3 py-3.5 align-middle text-[13px] leading-[1.45] text-black/60 sm:px-5 sm:text-[14px] sm:leading-[1.5]",
                          cols[i].highlight ? "bg-[#f0eee8] group-hover:bg-[#eae7e0]" : "group-hover:bg-[#faf9f7]",
                        )}
                      >
                        <Cell value={cell} prose={group.prose} t={t} />
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* One tier's name and price line. Shared by the real header and the pinned
   copy so the two can never drift — a pinned header that says something
   different from the header it is standing in for is worse than none. */
function HeaderCell({ plan, t }: { plan: Plan; t: TFunction }) {
  return (
    <>
      <span className="block font-[family-name:var(--font-plex)] text-[17px] font-light leading-[1.1] text-[#111] sm:text-[21px]">{t(plan.name)}</span>
      <span className="mt-[5px] block font-pixel text-[10px] leading-snug tracking-[0.06em] tabular-nums text-black/55 sm:text-[11px]">
        {t(plan.columnPrice)}
      </span>
    </>
  );
}

/* A cell is a mark or a value; `prose` comes from the group (see the note on
   CompareGroup in lib/config.ts) and decides which of the two faces it is set
   in. */
function Cell({ value, prose, t }: { value: CompareCell; prose?: boolean; t: TFunction }) {
  if (value === true) return <Check size={14} strokeWidth={1.75} className="block text-[#047857]" aria-label={t("Included")} />;
  if (value === false) return <Minus size={14} strokeWidth={1.5} className="block text-black/25" aria-label={t("Not included")} />;

  return prose ? (
    <span className="text-[13.5px] leading-relaxed text-black/55">{t(value)}</span>
  ) : (
    <span className="font-pixel text-[12.5px] uppercase tracking-[0.03em] tabular-nums text-[#111]">{t(value)}</span>
  );
}
