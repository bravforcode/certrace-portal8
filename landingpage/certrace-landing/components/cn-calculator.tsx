"use client";

/* ════════════════════════════════════════════════════════════
   THE FREE CBAM ENGINE — count the CN codes, get the plan

   WHY IT EXISTS. Every plan on this site is metered on distinct CN codes, and
   almost nobody knows their own number off the top of their head — because the
   number people carry around is the number of PRODUCTS, and several products
   routinely share one eight-digit code. Asking a reader to pick a plan before
   they can answer that question is asking them to guess.

   So the page answers it for them, for free and without an account: type the
   codes, say how many products sit under each, and the engine does the two
   things the plan actually turns on — count the distinct codes, and check them
   against the real CBAM annex.

   THE BOX TAKES WHATEVER IS TYPED. No type-ahead list, no eight-digit gate:
   an exporter who knows their code as "7207.11.90", as a six-digit HS heading,
   or as an internal reference gets to type it and press the button. The count
   is of DISTINCT codes, whatever shape they came in.

   IT IS STILL CHECKED AGAINST THE REAL ANNEX. lib/cbam-cn-codes.ts is lifted
   from the exporter portal's own reference table — 569 codes across 18
   aggregated goods — but the check is now a LABEL rather than a gate: a code
   inside it names its good and sector, and one outside it is told so plainly
   and counted anyway. "This is not a CBAM good" is an answer a lot of
   exporters are paying consultants for; it is not a reason to refuse to
   count.

   IT IS ALSO THE LEAD CHANNEL, and the shape of that is deliberate. The
   counting is free and unwatched — codes, products, plants, all of it live in
   the panel as you type. The RESULT is what asks for a name: one short form
   of five identity fields, no product questions, and the numbers open on the
   page behind it. Nothing is transmitted either way in this build; the form is
   the same frontend-only seam as every other on the site.

   THE ORDER OF THE BUTTONS FOLLOWS THE READER. Before the result there is one
   button and it computes. After it there are two, and they are the two things
   somebody who has just seen their plan actually does next: ask what it costs,
   or start the trial. A free-trial link offered before the answer competes
   with the answer.

   The five answers carry into the quote dialog along with the count, so
   nobody who asks for a price after this is asked their name a second time.

   THE RECOMMENDATION reads lib/pricing-model.ts rather than restating it, so
   the engine and the comparison table can never disagree about what a tier
   covers.
   ════════════════════════════════════════════════════════════ */

import { useMemo, useState } from "react";
import { usePages } from "@/lib/i18n-pages";
import { TIERS, type Cap, type Tier } from "@/lib/pricing-model";
import { SIGNUP_URL } from "@/lib/site";
import { lookupCn, normaliseCn, type CbamGood } from "@/lib/cbam-cn-codes";
import { capLabel } from "./pricing-plans";
import { PopupForm } from "./popup-form";
import { PixelIcon } from "./pixel-icon";
import { BlurHeading, TagBadge } from "./ui";
import { inputBase, inputOk, labelClass, SelectChevron } from "./form-fields";

type Row = { id: number; code: string; products: string };

const SITE_OPTIONS = [1, 2, 3, 5, 8, 12, 20];

/* Reporting years used to be a third input here and is not asked any more: it
   is the one cap almost nobody can answer about their own operation before
   they have filed once, and a guess at it silently moved the recommendation.
   The engine now recommends against a single open year — the honest floor,
   and the only assumption a first-time filer can check — while the tier's real
   year cap still shows in the panel, where it is a fact about the plan rather
   than a question aimed at the reader. */
const ASSUMED_YEARS = 1;

/* "Does this tier's cap cover that number?" — `customFrom` is Enterprise's
   open-ended cap, so it covers anything; it exists to print "20+ custom", not
   to exclude. */
function capCovers(cap: Cap, value: number): boolean {
  switch (cap.kind) {
    case "exact":
    case "upTo":
      return value <= cap.n;
    case "unlimited":
    case "customFrom":
      return true;
  }
}

/** The cheapest tier whose caps all hold. TIERS is in ascending order. */
function planFor(codes: number, sites: number, years: number): Tier {
  return (
    TIERS.find(
      (t) =>
        capCovers(t.caps.cnCodes, codes) &&
        capCovers(t.caps.sites, sites) &&
        capCovers(t.caps.years, years),
    ) ?? TIERS[TIERS.length - 1]
  );
}

let nextId = 1;

export function CnCalculator() {
  const p = usePages();
  const pp = p.pricingPage;
  const t = pp.calc;

  const [rows, setRows] = useState<Row[]>([{ id: 0, code: "", products: "1" }]);
  const [sites, setSites] = useState(1);
  const [quoteOpen, setQuoteOpen] = useState(false);
  /* The gate. `calcOpen` is the dialog; `lead` is what came back from it, and
     holding the answers rather than a boolean is what lets them carry into the
     quote form. Non-null is what unlocks the result — one piece of state, so
     the panel and the buttons can never disagree about which side of the gate
     the reader is on. */
  const [calcOpen, setCalcOpen] = useState(false);
  const [lead, setLead] = useState<Record<string, string> | null>(null);

  const setRow = (id: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRow = () =>
    setRows((rs) => [...rs, { id: nextId++, code: "", products: "1" }]);

  const removeRow = (id: number) =>
    setRows((rs) => (rs.length === 1 ? rs : rs.filter((r) => r.id !== id)));

  /* One pass over the rows produces everything the panel shows. Duplicates are
     counted once — which is the whole point of the tool, since a plan is
     metered on distinct codes — but they are also flagged, so a reader can see
     that the row they just added did not move the number.

     A row counts as soon as it holds anything at all. Codes that resolve to
     eight digits are deduplicated on those digits, so "7207 11 90" and
     "7207.11.90" are one code; anything else is deduplicated on the text as
     typed. Whether the annex knows it only decides the sector tally. */
  const result = useMemo(() => {
    const seen = new Set<string>();
    const duplicates = new Set<number>();
    const goods = new Map<string, CbamGood>();
    let products = 0;

    for (const row of rows) {
      const raw = row.code.trim();
      if (!raw) continue;
      const digits = normaliseCn(raw);
      const good = digits.length === 8 ? lookupCn(digits) : null;
      const key = digits.length === 8 ? digits : raw.replace(/\s+/g, " ").toUpperCase();

      if (seen.has(key)) {
        duplicates.add(row.id);
      } else {
        seen.add(key);
        if (good) goods.set(good.id, good);
      }
      products += Math.max(1, Number(row.products) || 1);
    }

    const sectors = new Set([...goods.values()].map((g) => g.sector));
    return {
      codes: seen.size,
      products,
      sectors: [...sectors],
      goods: [...goods.values()],
      duplicates,
    };
  }, [rows]);

  const tier = planFor(result.codes, sites, ASSUMED_YEARS);
  const tierCopy = pp.tiers[tier.id];
  const overCap = tier.id === "enterprise";

  /* Three states, in the order a reader meets them: nothing typed yet, codes
     typed but the gate not passed, and the answer. Everything below reads
     these two booleans rather than re-deriving the condition. */
  const hasCodes = result.codes > 0;
  const revealed = hasCodes && lead !== null;

  const fill = (template: string, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
      template,
    );

  const sectorNames = result.sectors.map((s) => t.sectors[s] ?? s).join(", ");

  /* The quote form's answers are bands, and the engine holds exact numbers, so
     each one is mapped to the band it falls in — BY POSITION in the option
     list, never by matching its text, so this keeps working in all five
     languages without a parallel table of translated answers. */
  const bandFor = (opts: string[] | undefined, index: number) => opts?.[index] ?? "";

  const summary = fill(t.contextLine, {
    codes: result.codes,
    products: result.products,
    sites,
    sectors: sectorNames || "—",
  });

  /* What travels into the quote dialog. The reader answered these here; asking
     again on the next screen would be the thing the tool was built to avoid. */
  const quoteOptions = p.forms.pricing.optionSets;
  const quotePrefill: Record<string, string> = {
    /* Name, email, company and role, if the gate collected them. Spread first
       so the engine's own answers below always win — `phone` is dropped on the
       way through because the quote form has no field for it, and an unknown
       key would sit in the values map affecting nothing. */
    ...(lead
      ? {
          name: lead.name ?? "",
          email: lead.email ?? "",
          company: lead.company ?? "",
          role: lead.role ?? "",
        }
      : {}),
    cnCodes: bandFor(
      quoteOptions?.cnCodes,
      result.codes <= 5 ? 0 : result.codes <= 20 ? 1 : result.codes <= 50 ? 2 : 3,
    ),
    sites: bandFor(quoteOptions?.sites, sites <= 1 ? 0 : sites <= 5 ? 1 : sites <= 10 ? 2 : 3),
    notes: summary,
  };

  return (
    <section
      id="cbam-engine"
      className="border-t border-black/[0.06] px-6 py-24 md:px-12 lg:px-20"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <PixelIcon type="bars" size={40} />
            <div className="mt-4">
              <TagBadge>{t.eyebrow}</TagBadge>
            </div>
            {/* BlurHeading splits on "\n" itself — the copy carries the break. */}
            <BlurHeading className="mt-5 text-3xl font-light leading-[1.05] tracking-tight md:text-4xl">
              {t.heading}
            </BlurHeading>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-black/45">{t.intro}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_360px]">
          {/* ── The rows ─────────────────────────────────── */}
          <div className="rounded-2xl border border-black/[0.07] bg-white/70 p-6 md:p-8">
            <div className="flex flex-col gap-3">
              {rows.map((row) => {
                const digits = normaliseCn(row.code);
                const good = digits.length === 8 ? lookupCn(digits) : null;
                /* Only once a full eight digits are in — saying "not in the
                   annex" at the second keystroke of a code that is going to
                   resolve is noise, not information. */
                const outside = !good && digits.length >= 8;
                const dupe = result.duplicates.has(row.id);

                return (
                  <div
                    key={row.id}
                    className="rounded-xl border border-black/[0.07] bg-white p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="relative min-w-0 flex-1">
                        <label className={labelClass} htmlFor={`cn-${row.id}`}>
                          {t.codeLabel}
                        </label>
                        {/* A plain text box. It used to be numeric-only with a
                            type-ahead list attached, and both got in the way of
                            the one thing being asked for here: the code the
                            reader already has written down, in whatever form
                            they have it written down. */}
                        <input
                          id={`cn-${row.id}`}
                          type="text"
                          autoComplete="off"
                          className={`${inputBase} ${inputOk} tabular-nums`}
                          placeholder={t.codePlaceholder}
                          value={row.code}
                          onChange={(e) => setRow(row.id, { code: e.target.value })}
                        />

                        {good ? (
                          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] leading-snug text-emerald-700">
                            <span className="h-1 w-1 shrink-0 rounded-full bg-emerald-600" />
                            {good.label} · {t.sectors[good.sector] ?? good.sector}
                          </p>
                        ) : outside ? (
                          /* Grey, not red. The code is accepted and counted —
                             this is a fact about the annex, not a rejection. */
                          <p className="mt-1.5 text-[11px] leading-snug text-black/40">
                            {t.notCbam}
                          </p>
                        ) : (
                          <p className="mt-1.5 text-[11px] leading-snug text-black/30">
                            {t.codeHint}
                          </p>
                        )}
                        {dupe && (
                          <p className="mt-1 text-[11px] leading-snug text-black/45">
                            {t.duplicate}
                          </p>
                        )}
                      </div>

                      <div className="w-full sm:w-[168px] sm:shrink-0">
                        <label className={labelClass} htmlFor={`qty-${row.id}`}>
                          {t.productsLabel}
                        </label>
                        <input
                          id={`qty-${row.id}`}
                          type="number"
                          min={1}
                          max={999}
                          className={`${inputBase} ${inputOk} tabular-nums`}
                          value={row.products}
                          onChange={(e) => setRow(row.id, { products: e.target.value })}
                        />
                        <p className="mt-1.5 text-[11px] leading-snug text-black/30">
                          {t.productsHint}
                        </p>
                      </div>

                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          aria-label={t.remove}
                          className="mt-0 flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-lg border border-black/[0.08] text-black/30 transition-colors hover:border-black/25 hover:text-black sm:mt-[26px] sm:self-start"
                        >
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            aria-hidden="true"
                          >
                            <path d="M2 2l8 8M10 2l-8 8" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addRow}
              className="mt-3 w-full rounded-xl border border-dashed border-black/15 py-3 text-center font-pixel text-[10px] uppercase tracking-[0.16em] text-black/40 transition-colors hover:border-black/30 hover:text-black"
            >
              + {t.addCode}
            </button>

            {/* The other cap a plan is measured on. A select rather than a
                free number because the caps themselves are bands, and a
                spinner inviting "37" implies a precision the model does not
                have. Reporting years used to sit beside it — see
                ASSUMED_YEARS. Full width now that it is alone, rather than a
                half-width field with a hole next to it. */}
            <div className="mt-6 border-t border-black/[0.07] pt-6">
              <div className="sm:max-w-[280px]">
                <label className={labelClass} htmlFor="calc-sites">
                  {t.sitesLabel}
                </label>
                <div className="relative">
                  <select
                    id="calc-sites"
                    className={`${inputBase} ${inputOk} appearance-none pr-8`}
                    value={sites}
                    onChange={(e) => setSites(Number(e.target.value))}
                  >
                    {SITE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n === SITE_OPTIONS[SITE_OPTIONS.length - 1] ? `${n}+` : n}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/35">
                    <SelectChevron inset="right-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── The verdict ──────────────────────────────── */}
          <div className="flex flex-col rounded-2xl border border-black/[0.07] bg-[#F0EEE8] p-6 md:p-8 lg:sticky lg:top-20 lg:self-start">
            <div className="font-pixel text-[10px] uppercase tracking-[0.2em] text-black/35">
              {t.resultHeading}
            </div>

            {/* The counts, but only once the gate is behind us. They read 0
                until then — the same face the panel wears before anything is
                typed, rather than a blurred or struck-through number, which
                would be theatre about withholding something. `aria-live`
                announces them at the moment they arrive. */}
            <div
              className="mt-5 grid grid-cols-3 gap-3 border-y border-black/[0.08] py-5"
              aria-live="polite"
            >
              {(
                [
                  [t.resultCodes, result.codes],
                  [t.resultProducts, result.products],
                  [t.resultSectors, result.sectors.length],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <div
                    className="text-3xl font-light leading-none tracking-tight tabular-nums text-[#111]"
                    style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
                  >
                    {revealed ? value : 0}
                  </div>
                  <div className="mt-1.5 font-pixel text-[9px] uppercase leading-snug tracking-[0.1em] text-black/40">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {!revealed ? (
              <p className="mt-6 flex-1 text-sm leading-relaxed text-black/45">
                {hasCodes ? t.lockedState : t.emptyState}
              </p>
            ) : (
              <div className="mt-6 flex-1">
                <div className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/35">
                  {t.fits}
                </div>
                <div
                  className="mt-2 text-[28px] font-light leading-none tracking-tight text-[#111]"
                  style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
                >
                  {tierCopy.name}
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-black/55">
                  {overCap ? t.overCap : fill(t.fitsWhy, { plan: tierCopy.name })}
                </p>

                {/* What that tier actually gives, straight from the model —
                    the same caps the plan card shows, so the answer here and
                    the card the reader scrolls back up to agree.

                    Reporting years is deliberately not among them. The engine
                    stopped asking the reader for it (see ASSUMED_YEARS), and
                    printing a cap on an input nobody supplied read as an
                    answer to a question that was never put — worse here than
                    on the plan card, where it is plainly a fact about the
                    plan. It still shows in the comparison table. */}
                <dl className="mt-5 border-t border-black/[0.08]">
                  {(["cnCodes", "sites", "seats"] as const).map((key, i, all) => (
                    <div
                      key={key}
                      className={`flex items-baseline justify-between gap-3 py-2 text-[12.5px] ${
                        i < all.length - 1 ? "border-b border-black/[0.06]" : ""
                      }`}
                    >
                      <dt className="text-black/45">{pp.caps[key]}</dt>
                      <dd className="font-pixel text-[11px] uppercase tracking-[0.04em] text-black/75">
                        {capLabel(tier.caps[key], pp.caps)}
                      </dd>
                    </div>
                  ))}
                </dl>

                {sectorNames && (
                  <p className="mt-4 font-pixel text-[10px] uppercase leading-relaxed tracking-[0.1em] text-black/35">
                    {sectorNames}
                  </p>
                )}
              </div>
            )}

            {/* One button before the answer, two after it. The computing one
                is disabled with nothing typed rather than hidden: a panel that
                grows a button when you are not looking is worse than one whose
                button is plainly not ready yet. */}
            <div className="mt-7 flex flex-col gap-2">
              {revealed ? (
                <>
                  <button
                    type="button"
                    onClick={() => setQuoteOpen(true)}
                    className="w-full rounded-[10px] bg-[#111] py-3 text-center text-sm tracking-widest text-white transition-colors hover:bg-[#333]"
                  >
                    {t.quoteCta}
                  </button>
                  <a
                    href={SIGNUP_URL}
                    className="w-full rounded-[10px] border border-black/10 py-3 text-center text-sm tracking-widest text-black/60 transition-all hover:border-black/25 hover:bg-black/[0.04] hover:text-black"
                  >
                    {t.trialCta}
                  </a>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setCalcOpen(true)}
                  disabled={!hasCodes}
                  className="w-full rounded-[10px] bg-[#111] py-3 text-center text-sm tracking-widest text-white transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:bg-[#111]/25 disabled:hover:bg-[#111]/25"
                >
                  {t.computeCta}
                </button>
              )}
            </div>

            <p className="mt-5 border-t border-black/[0.08] pt-4 text-[11px] leading-relaxed text-black/35">
              {t.disclaimer}
            </p>
          </div>
        </div>
      </div>

      {/* The gate. It hands its answers back on the submit edge rather than
          on close, so the result is already on the page behind the
          confirmation panel — a reader who closes the dialog early still gets
          what they filled it in for.

          NO CONTEXT LINE HERE. It used to echo "From the engine — 1 CN codes ·
          1 products · 3 sites · Iron & steel" above the fields. On the way TO
          the answer that is the tool reciting the reader's own inputs back at
          them in the one place they are waiting to be past; the summary still
          travels into the quote form below, where it is doing real work. */}
      <PopupForm
        kind="calculate"
        open={calcOpen}
        onClose={() => setCalcOpen(false)}
        onSubmitted={setLead}
      />

      <PopupForm
        kind="pricing"
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        prefill={quotePrefill}
        context={hasCodes ? summary : undefined}
      />
    </section>
  );
}
