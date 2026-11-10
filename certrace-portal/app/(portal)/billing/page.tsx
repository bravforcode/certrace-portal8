"use client";
import { useCompanyDirectory } from "@/lib/team-query";

/* ════════════════════════════════════════════════════════════
   PLAN & BILLING — where this account stands, the three plans, and one short table

   WHAT A PLAN SIZES IS THE FILING. Companies, installations (each with its report package), CN codes, precursors, the one
   reporting year open, team seats — and the two things that cost something to run, the AI and the reading of uploaded
   files. That is the whole table: the plan's own terms, and nothing about how the product works. Suppliers and precursor
   suppliers enter and fill in through their smart link on every plan without limit, and the page says so once, in words,
   rather than as a row of ticks.

   WHAT IS NOT HERE, AND WHY:

   · THE PRICES. They are quoted, not listed. A figure on the card is a promise the sales conversation then has to re-open,
     so every card asks for the conversation instead and every CTA lands on the LINE account where a specialist answers.

   · A CHECKOUT, A STORED CARD, AN INVOICE LIST. They described a self-serve subscription this account does not have.
     Billing is handled with sales, on the agreed term.

   · THE LONG FEATURE COMPARISON. It listed forty things every plan does alike. The table is eleven rows, so it no longer
     needs a pinned header, and a phone reads it without a second scrollbar's worth of apparatus.

   THE USAGE STRIP shows how much of each ENFORCED limit is spent (lib/plan.ts): CN codes, installations, reporting years,
   seats. Companies, precursors, AI questions and smart-upload pages are stated terms the product does not measure yet, so no
   bar is drawn for them — a bar nothing fills would be a promise.

   THE TRIAL. A free-trial account has no limits to meter, so the strip above the tiers becomes a CLOCK instead: how much
   of the month is left, and what happens when it is not. It is the only screen in the product that says anything at all
   about the trial ending — see components/account-lock.tsx for why the other screens say nothing and simply come here.

   ONE RULE PER BOUNDARY. Each block inside a tier card carries exactly ONE border, on its top edge, so two hairlines never
   sit a gap apart and read as a rendering fault.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { Check, ArrowRight, Minus } from "lucide-react";
import {
  Card,
  PageHeader,
  Button,
  ButtonLink,
  Chip,
  StatusDot,
  cn,
} from "@/components/ui";
import {
  PLANS,
  PLAN_COMPARISON,
  PLAN_COLOPHON,
  CONTACT_SALES_URL,
  type Plan,
  type CompareCell,
  type CompareValue,
} from "@/lib/config";
import {
  CAP_LABEL,
  isUpgrade,
  type CapState,
  type PlanId,
  type TrialState,
} from "@/lib/plan";
import { useCaps, useInvalidateCaps } from "@/lib/workspaces-query";
import { useAccount } from "@/components/account-lock";
import { useFormat, useT, type TFunction } from "@/lib/i18n";

/* The renewal date is a DATE, not a string, so it prints as 1 Jul 2027 in
   English and 1 ก.ค. 2027 in Thai instead of carrying an English month into
   a Thai sentence. */
const RENEWS = new Date("2027-07-01T00:00:00Z");

export default function BillingPage() {
  const company = useCompanyDirectory();
  const t = useT();
  const { ready, planId, plan, trial } = useAccount();

  /* The caps read localStorage stores, so they are measured after mount —
     rendering them on the server would print a zero that then jumps. The
     query only resolves on the client, and a plan change (the demo override
     landing, the hourly re-read) re-measures via invalidation. */
  const capData = useCaps().data;
  const caps = capData
    ? [capData.cnCodes, capData.sites, capData.years, capData.seats]
    : null;
  const invalidateCaps = useInvalidateCaps();
  const lastPlan = React.useRef(planId);
  React.useEffect(() => {
    // Re-measure only when the plan actually CHANGES — the mount run would
    // otherwise flush the whole workspaces domain merely on visiting Billing.
    if (lastPlan.current === planId) return;
    lastPlan.current = planId;
    invalidateCaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const onTrial = ready && trial.onTrial;
  if (company && !company.isOwner)
    return (
      <Card className="p-6">
        <h1 className="text-xl">Billing for {company.name}</h1>
        <p className="mt-2">The company owner manages the {plan.name} plan.</p>
        <Link className="mt-3 inline-block underline" href="/team">
          Open Team
        </Link>
      </Card>
    );

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={t("Plan & billing")}
        title={t("Plans sized to your filing.")}
        lead={t(
          "Annual term. A plan counts your own side — companies, installations, CN codes, precursors and seats. Suppliers and precursor suppliers enter and fill in through their smart link on every plan, without limit.",
        )}
      />

      {/* ── Where this account stands ─────────────────────── */}
      <div className="space-y-3">
        {onTrial && trial.onTrial ? (
          <TrialClock trial={trial} t={t} />
        ) : (
          <PaidStrip planName={plan.name} t={t} />
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {(caps ?? []).map((c) => (
            <UsageMeter key={c.key} cap={c} planName={plan.name} t={t} />
          ))}
          {/* Same height as a measured meter, so the strip does not jump when
              the four counts arrive. */}
          {!caps &&
            [0, 1, 2, 3].map((i) => (
              <Card key={i} className="h-[104px] p-4" aria-hidden>
                <span />
              </Card>
            ))}
        </div>
      </div>

      {/* ── The three tiers, in brief ──────────────────────── */}
      <section
        aria-label={t("Plans at a glance")}
        className="grid gap-3 xl:grid-cols-3"
      >
        {PLANS.map((p) => (
          <TierCard
            key={p.id}
            plan={p}
            current={planId}
            onTrial={onTrial}
            t={t}
          />
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
        <Link
          href="/regulations"
          className="text-black/55 underline-offset-2 hover:text-black hover:underline"
        >
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
    <Card
      warm
      className="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 items-center gap-3">
        <StatusDot tone="ok" glow pulse />
        <p className="text-sm text-black/60">
          {t("You're on")} <span className="text-[#111]">{t(planName)}</span> ·{" "}
          {t("annual term · renews {date}", { date: fmt.date(RENEWS) })}
        </p>
      </div>
      <Chip tone="ok" className="flex-none whitespace-nowrap">
        {t("smart links unlimited")}
      </Chip>
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
            <StatusDot
              tone={trial.ended ? "warn" : "ok"}
              glow
              pulse={!trial.ended}
            />
            <span className="font-pixel text-[10.5px] uppercase tracking-[0.16em] text-black/45">
              {t("Free trial")}
            </span>
          </div>
          <p className="mt-2.5 font-[family-name:var(--font-plex)] text-[23px] font-light leading-[1.25] tracking-[-0.01em] text-[#111] sm:text-[27px]">
            {trial.ended
              ? t("Your free month is over.")
              : trial.daysLeft === 1
                ? t("One day left in your free month.")
                : t("{days} days left in your free month.", {
                    days: trial.daysLeft,
                  })}
          </p>
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-black/50">
            {trial.ended
              ? t(
                  "Everything you built is still here and still readable. Choose a tier to start working on it again.",
                )
              : t(
                  "Nothing is capped while it runs — every CN code, site, seat and supplier. It ends on {date}.",
                  { date: fmt.date(trial.endsOn) },
                )}
          </p>
        </div>

        <ButtonLink
          href={CONTACT_SALES_URL}
          external
          size="sm"
          className="flex-none"
        >
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
            style={{
              width: `${Math.round((trial.daysLeft / trial.totalDays) * 100)}%`,
              background: tone,
            }}
          />
        </div>
        <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="font-pixel text-[10.5px] uppercase tracking-[0.12em] tabular-nums text-black/40">
            {t("Day {used} of {total}", {
              used: Math.min(
                trial.daysUsed + (trial.ended ? 0 : 1),
                trial.totalDays,
              ),
              total: trial.totalDays,
            })}
          </span>
          <span
            className="font-pixel text-[10.5px] uppercase tracking-[0.12em] tabular-nums"
            style={{ color: trial.ended || urgent ? tone : "rgba(0,0,0,0.4)" }}
          >
            {trial.ended
              ? t("ended {date}", { date: fmt.date(trial.endsOn) })
              : t("ends {date}", { date: fmt.date(trial.endsOn) })}
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
function UsageMeter({
  cap,
  planName,
  t,
}: {
  cap: CapState;
  planName: string;
  t: TFunction;
}) {
  const unlimited = cap.cap == null;
  /* THE NAME SITS ALONE AT THE HEAD; THE BAR, ITS CAPTION AND THE COUNT SIT AT THE FOOT. A long name ("Reporting years
     open", or its Thai and Hindi forms) then takes the line to itself instead of fighting the count for it, and a name that
     takes two lines cannot push its bar out of line with the cards beside it. */
  return (
    <Card className="flex min-h-[104px] flex-col p-4">
      <span className="font-pixel text-[10px] uppercase leading-snug tracking-[0.1em] text-black/40 sm:tracking-[0.14em]">
        {t(CAP_LABEL[cap.key])}
      </span>
      <div className="mt-auto pt-3">
        {!unlimited && (
          <div className="mb-2.5 h-[3px] overflow-hidden rounded-full bg-black/[0.07]">
            <div
              className={cn(
                "h-full rounded-full transition-[width]",
                cap.atCap ? "bg-[#b45309]" : "bg-[#111]",
              )}
              style={{ width: `${Math.round(cap.fraction * 100)}%` }}
            />
          </div>
        )}
        <div className="flex items-baseline justify-between gap-2">
          {unlimited ? (
            <p className="font-pixel text-[10.5px] uppercase tracking-[0.1em] text-black/35">
              {t("No cap on your plan")}
            </p>
          ) : (
            <p className="text-[11px] leading-relaxed text-black/40">
              {cap.atCap
                ? t("At your plan's limit.")
                : t("In use on {plan}.", { plan: t(planName) })}
            </p>
          )}
          <span
            className={cn(
              "flex-none font-mono text-[12px] tabular-nums",
              cap.atCap ? "text-[#b45309]" : "text-black/45",
            )}
          >
            {cap.label}
          </span>
        </div>
      </div>
    </Card>
  );
}

/* ── One tier ───────────────────────────────────────────────
   THE FOUR NUMBERS THAT SIZE A FILING ARE THE CARD. A reader choosing between three plans is comparing CN codes,
   installations, precursors and seats, so those are set large, in a grid, where the eye can run across three cards and
   read three columns. The AI, the smart-upload pages and the smart links sit under them as plain rows; everything else is
   in the table below.

   ONE RULE PER BOUNDARY — see the header. Every block below the promise line opens with `border-t` and closes with
   nothing. */
function TierCard({
  plan,
  current,
  onTrial,
  t,
}: {
  plan: Plan;
  current: PlanId;
  onTrial: boolean;
  t: TFunction;
}) {
  const fmt = useFormat();
  const isCurrent = plan.id === current;
  /* ON A TRIAL EVERY TIER IS AN UPGRADE, so `isUpgrade` would paint three
     primary buttons in a row and the reader would have no idea which one the
     page thinks they want. The highlighted tier carries the weight instead —
     the same one the comparison table shades. */
  const emphasised = onTrial
    ? Boolean(plan.highlight)
    : isUpgrade(current, plan.id);

  const tiles: { label: string; value: number | null }[] = [
    { label: "CN codes", value: plan.caps.cnCodes },
    { label: "Installations", value: plan.caps.sites },
    { label: "Precursors", value: plan.allowance.precursors },
    { label: "Team seats", value: plan.caps.seats },
  ];
  const rows: { label: string; value: string }[] = [
    {
      label: "AI",
      value: t("{n} questions", {
        n: fmt.number(plan.allowance.aiQuestions ?? 0),
      }),
    },
    {
      label: "Smart upload",
      value: t("{n} pages", { n: fmt.number(plan.allowance.uploadPages ?? 0) }),
    },
    { label: "Smart link", value: t("Unlimited") },
  ];

  return (
    <Card
      highlight={plan.highlight}
      className={cn(
        "flex h-full flex-col p-6 sm:p-7",
        isCurrent && "ring-1 ring-black/15",
      )}
    >
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

      <p className="mt-5 font-[family-name:var(--font-plex)] xl:min-h-[4.35em] text-[17px] font-light leading-[1.45] text-[#111] text-balance">
        {t(plan.line)}
      </p>

      <div className="mt-5 flex flex-col gap-1.5 border-t border-black/[0.08] pt-[18px]">
        <span className="font-[family-name:var(--font-plex)] text-[27px] font-light leading-none tracking-[-0.01em] text-[#111]">
          {t(plan.amount)}
        </span>
        <span className="font-pixel text-[11px] uppercase tracking-[0.08em] text-black/55">
          {t(plan.unit)}
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-black/[0.08] pt-5 sm:grid-cols-4 xl:grid-cols-2">
        {tiles.map((x) => (
          <div key={x.label} className="min-w-0">
            <dd className="m-0 font-[family-name:var(--font-plex)] text-[34px] font-light leading-none tracking-[-0.02em] tabular-nums text-[#111]">
              {x.value == null ? t("Unlimited") : fmt.number(x.value)}
            </dd>
            <dt className="mt-2 font-pixel text-[10px] uppercase leading-snug tracking-[0.1em] text-black/45">
              {t(x.label)}
            </dt>
          </div>
        ))}
      </dl>

      <div className="mt-auto flex flex-col border-t border-black/[0.08] pt-1 [&]:mt-6">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={cn(
              "flex items-baseline justify-between gap-3.5 py-2 text-[13px]",
              i < rows.length - 1 && "border-b border-black/[0.06]",
            )}
          >
            <span className="text-black/50">{t(row.label)}</span>
            <span className="text-right font-pixel text-[12px] uppercase tracking-[0.04em] tabular-nums text-[#111]">
              {row.value}
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
          <ButtonLink
            href={CONTACT_SALES_URL}
            external
            variant={emphasised ? "primary" : "secondary"}
            className="w-full"
          >
            {t("Contact Sales")} <ArrowRight size={14} strokeWidth={1.5} />
          </ButtonLink>
        )}
      </div>
    </Card>
  );
}

/* ── The comparison ─────────────────────────────────────────
   ELEVEN ROWS, SO NO PINNED HEADER. The long comparison needed a copy of its header riding under the topbar to stay
   readable over forty rows; this one fits a screen, and the machinery that kept a duplicate header aligned with the real
   one is gone with the rows that needed it. What stays is what a phone needs: the table scrolls sideways inside its own
   box, and the label column is frozen so a value is never read without the row it belongs to. */
function ComparisonTable({ t }: { t: TFunction }) {
  const cols = PLANS;
  return (
    <section aria-label={t("Plan comparison")} className="space-y-4">
      <div
        tabIndex={0}
        role="region"
        aria-label={t("Feature comparison table, scrollable")}
        className="overflow-x-auto rounded-2xl border border-black/[0.07] bg-white"
      >
        {/* 560px keeps a figure like "300 questions" on one line on a phone: the
            label column takes about a third and one and a half tiers show at a time. */}
        <table className="w-full min-w-[560px] border-collapse bg-white sm:min-w-[720px]">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-[4] w-[34%] min-w-[130px] border-b border-black/15 bg-white px-3 pb-4 pt-[18px] text-left align-middle sm:w-[34%] sm:min-w-[240px] sm:px-5"
              >
                <span className="block font-pixel text-[11px] uppercase tracking-[0.14em] text-black/40">
                  {t("Plan")}
                </span>
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
                  {/* THE BAND SPANS THE ROW; THE TITLE STICKS INSIDE IT, so the name stays at the left edge wherever the
                      reader has scrolled to, and the warm rule still runs the full width. inline-block, not block: a sticky
                      element can only slide within the slack its containing block leaves. */}
                  <th
                    scope="colgroup"
                    colSpan={cols.length + 1}
                    className="border-y border-black/[0.08] border-t-black/15 bg-[#faf9f7] p-0 text-left"
                  >
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
                          cols[i].highlight
                            ? "bg-[#f0eee8] group-hover:bg-[#eae7e0]"
                            : "group-hover:bg-[#faf9f7]",
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

      <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-black/45">
        <li>
          {t(
            "Smart upload counts pages: an Excel file is 1 page, and every image inside it counts as one more page.",
          )}
        </li>
        <li>
          {t(
            "Suppliers and precursor suppliers enter and fill in through their smart link on every plan — no cap, no account, no seat.",
          )}
        </li>
      </ul>
    </section>
  );
}

/* One plan's name and price line. */
function HeaderCell({ plan, t }: { plan: Plan; t: TFunction }) {
  return (
    <>
      <span className="block font-[family-name:var(--font-plex)] text-[17px] font-light leading-[1.1] text-[#111] sm:text-[21px]">
        {t(plan.name)}
      </span>
      <span className="mt-[5px] block font-pixel text-[10px] leading-snug tracking-[0.06em] tabular-nums text-black/55 sm:text-[11px]">
        {t(plan.columnPrice)}
      </span>
    </>
  );
}

/* A cell is a mark, a plain value, or a number with its unit. `prose` comes from the group (see the note on CompareGroup in
   lib/config.ts) and decides which face a plain value is set in. A number with its unit is a template, so each language
   puts the number where its own noun wants it. */
function Cell({
  value,
  prose,
  t,
}: {
  value: CompareCell;
  prose?: boolean;
  t: TFunction;
}) {
  const fmt = useFormat();
  if (value === true)
    return (
      <Check
        size={14}
        strokeWidth={1.75}
        className="block text-[#047857]"
        aria-label={t("Included")}
      />
    );
  if (value === false)
    return (
      <Minus
        size={14}
        strokeWidth={1.5}
        className="block text-black/25"
        aria-label={t("Not included")}
      />
    );

  if (typeof value === "object") {
    const v: CompareValue = value;
    return (
      <>
        <span className="block font-pixel text-[12.5px] uppercase tracking-[0.03em] tabular-nums text-[#111]">
          {t(v.text, { n: fmt.number(v.n ?? 0) })}
        </span>
        {v.sub && (
          <span className="mt-0.5 block text-[12px] leading-snug text-black/45">
            {t(v.sub.text, { n: fmt.number(v.sub.n ?? 0) })}
          </span>
        )}
      </>
    );
  }
  return prose ? (
    <span className="text-[13.5px] leading-relaxed text-black/55">
      {t(value)}
    </span>
  ) : (
    <span className="font-pixel text-[12.5px] uppercase tracking-[0.03em] tabular-nums text-[#111]">
      {t(value)}
    </span>
  );
}
