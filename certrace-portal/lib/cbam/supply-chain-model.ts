/* ════════════════════════════════════════════════════════════
   SUPPLY CHAIN — WHO IS IN IT, HOW HEALTHY EACH PART IS, AND WHERE IT WORRIES US

   Two kinds of party feed an exporter's CBAM figures, and they are asked for
   different things:

     PLANTS      the installations that make the goods — the exporter's own
                 sites and the suppliers' — whose factory manager is sent a
                 monthly link and has to answer it, twelve times a year
     PRECURSORS  the suppliers of what is bought in, each asked ONCE a year for
                 a verified figure and the report behind it

   This module turns the stores' facts into a health read of each one and of
   the chain as a whole. It computes; the screen draws.

   ── A HEALTH SCORE IS FOUR THINGS, SHOWN, NOT ONE NUMBER ────────
   A single score that cannot be taken apart is a verdict nobody can act on, so
   every score here is a weighted mean of named ASPECTS and every aspect is kept
   beside it. An aspect with nothing to measure yet is `null`, never 0, and the
   remaining weights are re-scaled: a plant that has not been asked anything is
   not a failing plant, it is an unmeasured one.

     plant       Timeliness 35 · Coverage 30 · Completeness 20 · Contact 15
     precursor   Response 30 · Data basis 35 · Report checks 20 · Completeness 15

   ── AND ONE STATE, WITH A REASON ────────────────────────────────
   Completed · On track · Needs attention · At risk · Not started. The state is
   not the score banded: a plant with one month late is "needs attention" at a
   score of 90, and a plant that has never been asked is "not started" at none.
   The words are about what to DO.

   ── WHOSE MOVE IT IS ────────────────────────────────────────────
   A month that has ended and was never sent is the EXPORTER's move, not a
   fault of the plant (see lib/smart-links.ts on why it is a different pile from
   "late"). It is counted and surfaced, and kept out of the plant's health.
   ════════════════════════════════════════════════════════════ */

export type ChainState =
  | "completed"
  | "on_track"
  | "attention"
  | "at_risk"
  | "not_started";
export const CHAIN_STATES: ChainState[] = [
  "at_risk",
  "attention",
  "on_track",
  "completed",
  "not_started",
];

export type MonthCell = "done" | "late" | "waiting" | "send" | "later";

export type Contact = { name: string; email: string; phone: string };

export type PlantMonth = {
  workspaceId: string;
  year: number;
  month: string;
  cell: MonthCell;
  /** ISO — when this month is due */
  due: string;
  sentAt: string | null;
  answeredAt: string | null;
};

export type PlantFacts = {
  id: string;
  name: string;
  /** the company that runs it, or the exporter's own */
  company: string;
  own: boolean;
  country: string;
  /** who the monthly link goes to. null = nobody on file. */
  contact: Contact | null;
  products: string[];
  years: number[];
  /** mean readiness of its product reports, 0–100 — null when it has none */
  readinessPct: number | null;
  months: PlantMonth[];
  /** product report ids, to open the page of one */
  reportIds: string[];
};

export type LinkPhase = "not_sent" | "sent" | "opened" | "submitted";
export type DataBasis = "verified" | "unverified" | "default";

export type PrecursorFacts = {
  id: string;
  workspaceId: string;
  company: string;
  installation: string;
  country: string;
  /** what it supplies */
  product: string;
  cnCode: string;
  /** the good it goes into */
  feeds: string;
  year: number;
  tier: number;
  contact: Contact | null;
  phase: LinkPhase;
  sentAt: string | null;
  openedAt: string | null;
  submittedAt: string | null;
  /** end of the reporting period — what the answer is due by */
  due: string;
  basis: DataBasis;
  /** the four checks of Annex II A.1(4); null when there is no report to check */
  checks: {
    accreditation: boolean;
    scope: boolean;
    period: boolean;
    file: boolean;
  } | null;
  completenessPct: number;
  /** their own figure and the EU default for the same good, tCO₂e/t — null when either is not known */
  seeSupplier: number | null;
  seeDefault: number | null;
  /** the share of the good's precursor emissions that rests on this one, 0–1 */
  contribution: number | null;
};

export type Aspect = {
  key: string;
  label: string;
  value: number | null;
  weight: number;
};

const clamp = (n: number) => Math.min(100, Math.max(0, n));

/** Weighted mean over the aspects that could be measured; null if none could. */
export function scoreOf(aspects: Aspect[]): number | null {
  const live = aspects.filter(
    (a) => a.value != null && Number.isFinite(a.value),
  );
  const w = live.reduce((s, a) => s + a.weight, 0);
  return w > 0
    ? live.reduce((s, a) => s + (a.value as number) * a.weight, 0) / w
    : null;
}

const MS_DAY = 86_400_000;
/** A precursor invitation nobody has answered for this long is chased (lib/cbam/action-queue.ts uses the same ten days). */
export const STALE_DAYS = 10;

/* ── Concerns ────────────────────────────────────────────────── */
export type ConcernKind =
  | "late_months"
  | "no_contact"
  | "months_to_send"
  | "low_completeness"
  | "precursor_late"
  | "precursor_not_sent"
  | "precursor_stale"
  | "precursor_default"
  | "precursor_checks"
  | "precursor_unverified";

export type Concern = {
  id: string;
  kind: ConcernKind;
  severity: "high" | "medium" | "low";
  party: "plant" | "precursor";
  partyId: string;
  /** the plant or company it is about — a proper noun */
  name: string;
  /** a number or a name that goes into the sentence */
  n?: number;
  detail?: string;
};

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 } as const;

/* ── Plants ──────────────────────────────────────────────────── */
export type PlantHealth = {
  facts: PlantFacts;
  aspects: Aspect[];
  score: number | null;
  state: ChainState;
  counts: Record<MonthCell, number>;
  asked: number;
  onTimePct: number | null;
  /** most recent thing that happened: an answer, else a send */
  lastActivity: string | null;
  concerns: Concern[];
};

const emptyCounts = (): Record<MonthCell, number> => ({
  done: 0,
  late: 0,
  waiting: 0,
  send: 0,
  later: 0,
});

export function plantHealth(f: PlantFacts): PlantHealth {
  const counts = emptyCounts();
  for (const m of f.months) counts[m.cell] += 1;
  const asked = counts.done + counts.late + counts.waiting;
  const closed = counts.done + counts.late;
  const onTime = f.months.filter(
    (m) =>
      m.cell === "done" &&
      m.answeredAt != null &&
      new Date(m.answeredAt) <= new Date(m.due),
  ).length;
  const ended = counts.done + counts.late + counts.waiting + counts.send;

  const timeliness = closed > 0 ? clamp((onTime / closed) * 100) : null;
  /* Coverage: of the months that have ended, how many are in. A month waiting inside its deadline is not yet a miss, so it is left out of
     both sides; the exporter's own unsent months count against coverage, because the figures are not in. */
  const coverageDen = counts.done + counts.late + counts.send;
  const coverage =
    coverageDen > 0 ? clamp((counts.done / coverageDen) * 100) : null;
  const completeness = f.readinessPct != null ? clamp(f.readinessPct) : null;
  const contact = f.own
    ? 100
    : f.contact && f.contact.name.trim() && f.contact.email.trim()
      ? 100
      : f.contact && (f.contact.name.trim() || f.contact.email.trim())
        ? 50
        : 0;

  const aspects: Aspect[] = [
    { key: "timeliness", label: "Timeliness", value: timeliness, weight: 35 },
    {
      key: "coverage",
      label: "Coverage",
      value: ended > 0 ? coverage : null,
      weight: 30,
    },
    {
      key: "completeness",
      label: "Completeness",
      value: completeness,
      weight: 20,
    },
    { key: "contact", label: "Contact", value: contact, weight: 15 },
  ];
  const score = scoreOf(aspects);

  const concerns: Concern[] = [];
  const base = { party: "plant" as const, partyId: f.id, name: f.name };
  if (counts.late > 0)
    concerns.push({
      ...base,
      id: `${f.id}:late`,
      kind: "late_months",
      severity: counts.late >= 2 ? "high" : "medium",
      n: counts.late,
    });
  if (!f.own && contact < 100 && f.months.length > 0)
    concerns.push({
      ...base,
      id: `${f.id}:contact`,
      kind: "no_contact",
      severity: asked > 0 ? "high" : "medium",
    });
  if (counts.send > 0)
    concerns.push({
      ...base,
      id: `${f.id}:send`,
      kind: "months_to_send",
      severity: "low",
      n: counts.send,
    });
  if (completeness != null && completeness < 50 && asked > 0)
    concerns.push({
      ...base,
      id: `${f.id}:complete`,
      kind: "low_completeness",
      severity: "medium",
      n: Math.round(completeness),
    });

  let state: ChainState;
  if (f.months.length === 0 || (asked === 0 && (completeness ?? 0) === 0))
    state = "not_started";
  else if (counts.done === f.months.length) state = "completed";
  else if (
    counts.late >= 2 ||
    (counts.late > 0 && (score ?? 100) < 60) ||
    (score ?? 100) < 45 ||
    (!f.own && contact === 0 && asked > 0)
  )
    state = "at_risk";
  else if (
    counts.late > 0 ||
    (score ?? 100) < 75 ||
    concerns.some((c) => c.kind === "low_completeness")
  )
    state = "attention";
  else state = "on_track";

  const stamps = f.months
    .flatMap((m) => [m.answeredAt, m.sentAt])
    .filter((x): x is string => x != null)
    .sort();
  return {
    facts: f,
    aspects,
    score,
    state,
    counts,
    asked,
    onTimePct: timeliness,
    lastActivity: stamps.length ? stamps[stamps.length - 1] : null,
    concerns,
  };
}

/* ── Precursors ──────────────────────────────────────────────── */
export type PrecursorHealth = {
  facts: PrecursorFacts;
  aspects: Aspect[];
  score: number | null;
  state: ChainState;
  /** days since the invitation went out, while it is unanswered */
  waitingDays: number | null;
  late: boolean;
  /** SEE against the EU default, % below it (positive = better) — null when unknown */
  gapPct: number | null;
  lastActivity: string | null;
  concerns: Concern[];
};

export function precursorHealth(
  f: PrecursorFacts,
  now: Date = new Date(),
): PrecursorHealth {
  const answered = f.phase === "submitted";
  const sentAt = f.sentAt ? new Date(f.sentAt) : null;
  const waitingDays =
    !answered && sentAt
      ? Math.max(0, Math.round((now.getTime() - sentAt.getTime()) / MS_DAY))
      : null;
  const late =
    !answered && f.phase !== "not_sent" && now > new Date(`${f.due}T23:59:59`);

  const response =
    f.phase === "submitted"
      ? 100
      : f.phase === "opened"
        ? 60
        : f.phase === "sent"
          ? 30
          : 0;
  const dataBasis =
    f.basis === "verified" ? 100 : f.basis === "unverified" ? 55 : 15;
  const checks = f.checks
    ? clamp((Object.values(f.checks).filter(Boolean).length / 4) * 100)
    : null;

  const aspects: Aspect[] = [
    { key: "response", label: "Response", value: response, weight: 30 },
    { key: "basis", label: "Data basis", value: dataBasis, weight: 35 },
    { key: "checks", label: "Report checks", value: checks, weight: 20 },
    {
      key: "completeness",
      label: "Completeness",
      value: clamp(f.completenessPct),
      weight: 15,
    },
  ];
  const score = scoreOf(aspects);

  const base = {
    party: "precursor" as const,
    partyId: f.id,
    name: f.company || f.product,
  };
  const concerns: Concern[] = [];
  const heavy = (f.contribution ?? 0) >= 0.25;
  if (late)
    concerns.push({
      ...base,
      id: `${f.id}:late`,
      kind: "precursor_late",
      severity: "high",
      detail: f.product,
    });
  else if (f.phase === "not_sent")
    concerns.push({
      ...base,
      id: `${f.id}:unsent`,
      kind: "precursor_not_sent",
      severity: heavy ? "high" : "medium",
      detail: f.product,
    });
  else if (!answered && waitingDays != null && waitingDays > STALE_DAYS)
    concerns.push({
      ...base,
      id: `${f.id}:stale`,
      kind: "precursor_stale",
      severity: "medium",
      n: waitingDays,
      detail: f.product,
    });
  if (f.checks && Object.values(f.checks).some((v) => !v))
    concerns.push({
      ...base,
      id: `${f.id}:checks`,
      kind: "precursor_checks",
      severity: "high",
      detail: f.product,
    });
  if (f.basis === "default" && (answered || f.phase !== "not_sent" || heavy))
    concerns.push({
      ...base,
      id: `${f.id}:default`,
      kind: "precursor_default",
      severity: heavy ? "high" : "medium",
      n: f.contribution != null ? Math.round(f.contribution * 100) : undefined,
      detail: f.product,
    });
  else if (f.basis === "unverified" && answered)
    concerns.push({
      ...base,
      id: `${f.id}:unverified`,
      kind: "precursor_unverified",
      severity: "low",
      detail: f.product,
    });

  const gapPct =
    f.seeSupplier != null && f.seeDefault != null && f.seeDefault > 0
      ? ((f.seeDefault - f.seeSupplier) / f.seeDefault) * 100
      : null;

  let state: ChainState;
  const checksFail =
    f.checks != null && Object.values(f.checks).some((v) => !v);
  if (f.phase === "not_sent" && f.basis === "default") state = "not_started";
  else if (f.phase === "not_sent") state = "not_started";
  else if (late || checksFail || (f.basis === "default" && heavy && !answered))
    state = "at_risk";
  else if (answered && f.basis === "verified" && !checksFail)
    state = "completed";
  else if ((waitingDays ?? 0) > STALE_DAYS || f.basis !== "verified")
    state = "attention";
  else state = "on_track";

  const stamps = [f.submittedAt, f.openedAt, f.sentAt].filter(
    (x): x is string => x != null,
  );
  return {
    facts: f,
    aspects,
    score,
    state,
    waitingDays,
    late,
    gapPct,
    lastActivity: stamps.length ? stamps.sort().reverse()[0] : null,
    concerns,
  };
}

/* ── The chain ───────────────────────────────────────────────── */
export type ChainSummary = {
  total: number;
  plants: number;
  ownPlants: number;
  precursors: number;
  byState: Record<ChainState, number>;
  plantsByState: Record<ChainState, number>;
  precursorsByState: Record<ChainState, number>;
  avgScore: number | null;
  contactsOnFile: { have: number; of: number };
  /** months asked of plants: answered, waiting, late, and ready to send */
  months: { done: number; waiting: number; late: number; send: number };
  onTimePct: number | null;
  /** of the invitations that have gone out, the share answered */
  responsePct: number | null;
  /** precursor suppliers whose figure is in */
  precursorsAnswered: number;
  precursorBasis: { verified: number; unverified: number; default: number };
  verifiedPct: number | null;
  defaultPct: number | null;
  /** the average of each aspect over everything it could be measured on */
  aspects: {
    key: string;
    label: string;
    value: number | null;
    of: "plant" | "precursor";
  }[];
  concerns: Concern[];
  /** the precursor suppliers carrying the largest shares of the emissions, biggest first */
  concentration: {
    id: string;
    name: string;
    product: string;
    share: number;
    basis: DataBasis;
    state: ChainState;
  }[];
};

const avg = (xs: (number | null)[]): number | null => {
  const ok = xs.filter((x): x is number => x != null && Number.isFinite(x));
  return ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : null;
};

const zeroStates = (): Record<ChainState, number> => ({
  completed: 0,
  on_track: 0,
  attention: 0,
  at_risk: 0,
  not_started: 0,
});

export function summarise(
  plants: PlantHealth[],
  precursors: PrecursorHealth[],
): ChainSummary {
  const byState = zeroStates();
  const plantsByState = zeroStates();
  const precursorsByState = zeroStates();
  for (const p of plants) {
    byState[p.state] += 1;
    plantsByState[p.state] += 1;
  }
  for (const p of precursors) {
    byState[p.state] += 1;
    precursorsByState[p.state] += 1;
  }

  const months = plants.reduce(
    (a, p) => ({
      done: a.done + p.counts.done,
      waiting: a.waiting + p.counts.waiting,
      late: a.late + p.counts.late,
      send: a.send + p.counts.send,
    }),
    { done: 0, waiting: 0, late: 0, send: 0 },
  );
  const external = plants.filter((p) => !p.facts.own);
  const contactsHave = external.filter(
    (p) =>
      p.facts.contact &&
      p.facts.contact.name.trim() &&
      p.facts.contact.email.trim(),
  ).length;

  const sent = precursors.filter((p) => p.facts.phase !== "not_sent");
  const basis = { verified: 0, unverified: 0, default: 0 };
  for (const p of precursors) basis[p.facts.basis] += 1;

  const pick = (list: { aspects: Aspect[] }[], key: string) =>
    avg(list.map((x) => x.aspects.find((a) => a.key === key)?.value ?? null));
  const aspects: ChainSummary["aspects"] = [
    {
      key: "timeliness",
      label: "Timeliness",
      value: pick(plants, "timeliness"),
      of: "plant",
    },
    {
      key: "coverage",
      label: "Coverage",
      value: pick(plants, "coverage"),
      of: "plant",
    },
    {
      key: "completeness",
      label: "Completeness",
      value: avg(
        [...plants, ...precursors].map(
          (x) => x.aspects.find((a) => a.key === "completeness")?.value ?? null,
        ),
      ),
      of: "plant",
    },
    {
      key: "contact",
      label: "Contact",
      value: pick(plants, "contact"),
      of: "plant",
    },
    {
      key: "response",
      label: "Response",
      value: pick(precursors, "response"),
      of: "precursor",
    },
    {
      key: "basis",
      label: "Data basis",
      value: pick(precursors, "basis"),
      of: "precursor",
    },
    {
      key: "checks",
      label: "Report checks",
      value: pick(precursors, "checks"),
      of: "precursor",
    },
  ];

  const concerns = [
    ...plants.flatMap((p) => p.concerns),
    ...precursors.flatMap((p) => p.concerns),
  ].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      (b.n ?? 0) - (a.n ?? 0) ||
      a.name.localeCompare(b.name),
  );

  const concentration = precursors
    .filter((p) => p.facts.contribution != null && p.facts.contribution > 0)
    .map((p) => ({
      id: p.facts.id,
      name: p.facts.company,
      product: p.facts.product,
      share: p.facts.contribution as number,
      basis: p.facts.basis,
      state: p.state,
    }))
    .sort((a, b) => b.share - a.share);

  return {
    total: plants.length + precursors.length,
    plants: plants.length,
    ownPlants: plants.filter((p) => p.facts.own).length,
    precursors: precursors.length,
    byState,
    plantsByState,
    precursorsByState,
    avgScore: avg(
      [...plants, ...precursors]
        .filter((p) => p.state !== "not_started")
        .map((p) => p.score),
    ),
    contactsOnFile: { have: contactsHave, of: external.length },
    months,
    onTimePct: avg(plants.map((p) => p.onTimePct)),
    responsePct:
      sent.length > 0
        ? (sent.filter((p) => p.facts.phase === "submitted").length /
            sent.length) *
          100
        : null,
    precursorsAnswered: precursors.filter((p) => p.facts.phase === "submitted")
      .length,
    precursorBasis: basis,
    verifiedPct:
      precursors.length > 0 ? (basis.verified / precursors.length) * 100 : null,
    defaultPct:
      precursors.length > 0 ? (basis.default / precursors.length) * 100 : null,
    aspects,
    concerns,
    concentration,
  };
}

/** The word for a state, as a key into the dictionary. */
export const STATE_LABEL: Record<ChainState, string> = {
  completed: "Completed",
  on_track: "On track",
  attention: "Needs attention",
  at_risk: "At risk",
  not_started: "Not started",
};
