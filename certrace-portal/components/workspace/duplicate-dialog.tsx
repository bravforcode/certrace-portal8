"use client";

/* ════════════════════════════════════════════════════════════
   DUPLICATE A PRODUCT REPORT — two steps

   1 · WHERE THE COPY GOES — the reporting year, and the site if the supplier has more than one.
   2 · WHAT COMES ACROSS — every part of the report, and for each one the reader's own choice:
       bring it across, or start it new. What cannot sensibly move (the good itself, and the
       figures and papers that belong to last year) is listed too, with its reason, so nothing
       is left out of the list and nothing is quietly decided.

   Two steps rather than one form because the first answer decides what the second says: a copy for a
   different site should not quietly bring the old site's fuels with it, so the parts that describe the
   plant start new there, and the second step is where that is put to the reader. Nothing is created
   until the last button, and what is created opens.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Lock } from "lucide-react";
import { Button, Modal, Field, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { Segmented } from "@/components/insight/kit";
import { toast } from "@/components/toast";
import { PlanCapNotice } from "@/components/plan-cap-notice";
import {
  carryPreview,
  defaultCarry,
  duplicateWorkspace,
  setAll,
  suggestedYear,
  type Carry,
  type CarryPreview,
  type CarrySection,
} from "@/lib/workspace-duplicate";
import {
  existingForTriple,
  routeLabel,
  type VerificationWorkspace,
} from "@/lib/workspace";
import {
  useInstallationsForSupplier,
  useOwnInstallations,
} from "@/lib/installations-query";
import { useCaps, useWorkspaces } from "@/lib/workspaces-query";
import { useT, type TFunction } from "@/lib/i18n";
import { persistReportChange } from "@/lib/persist-report-change";

const THIS_YEAR = new Date().getFullYear();

type Row = {
  id: CarrySection;
  title: string;
  body: string /** what there is to bring, when the part can be empty */;
  have?: (p: CarryPreview) => { n?: number; empty: boolean };
};
type Group = { title: string; lead?: string; rows: Row[] };

/* Every part of a report, in the order its tabs show them. English source strings, said through `t` where they are drawn. */
const GROUPS: Group[] = [
  {
    title: "The report",
    rows: [
      {
        id: "schedule",
        title: "Monthly schedule",
        body: "The day of the month each month's data is due.",
      },
    ],
  },
  {
    title: "Monitoring plan",
    lead: "Brought across as a draft you can edit. A finished version is never copied.",
    rows: [
      {
        id: "mmd_boundary",
        title: "Boundary and processes",
        body: "The boundary description, the processes inside it and what is left out, with the ground for each.",
        have: (p) => ({ n: p.exclusions, empty: false }),
      },
      {
        id: "mmd_sources",
        title: "Fuels and electricity",
        body: "The fuels burned, the electricity supply and the meter it is read from.",
      },
      {
        id: "mmd_instruments",
        title: "Measuring instruments",
        body: "The instrument and the reading frequency for each fuel and for electricity.",
        have: (p) => ({ n: p.instruments, empty: p.instruments === 0 }),
      },
      {
        id: "mmd_gaps",
        title: "Data gaps",
        body: "The estimates standing in for missing readings. They describe last year, so they start new unless you choose otherwise.",
        have: (p) => ({ n: p.gaps, empty: p.gaps === 0 }),
      },
      {
        id: "mmd_quality",
        title: "Quality assurance",
        body: "Who reviews the data, and how often.",
      },
      {
        id: "mmd_diagram",
        title: "Installation diagram",
        body: "The drawing of the installation and what it shows.",
        have: (p) => ({ empty: !p.hasDiagram }),
      },
      {
        id: "mmd_sector",
        title: "Sector parameters",
        body: "Steel: the reducing agent and the mill. Aluminium: the way perfluorocarbons are counted.",
      },
      {
        id: "mmd_sampling",
        title: "Sampling plan",
        body: "How the calculation factors are determined.",
      },
      {
        id: "mmd_control",
        title: "Control system",
        body: "The controls that keep the data right.",
      },
    ],
  },
  {
    title: "Supply chain",
    rows: [
      {
        id: "precursors",
        title: "Precursor suppliers",
        body: "Who supplies what, in the same tree: names, countries, CN codes, routes and contacts. Not their figures, reports or links — those are asked again.",
        have: (p) => ({ n: p.precursors, empty: p.precursors === 0 }),
      },
    ],
  },
  {
    title: "Carbon price paid",
    rows: [
      {
        id: "carbon_price",
        title: "Carbon price paid",
        body: "The instrument, the amount per tonne, the law it is charged under and who certifies it. The receipt and any rebate are left behind.",
        have: (p) => ({ empty: !p.carbonPrice }),
      },
    ],
  },
];

/* What always comes across, and what always starts new — the first because it is the report, the second because it belongs to the year it describes. */
const ALWAYS: { title: string; body?: string }[] = [
  { title: "The good and its CN code" },
  { title: "Production route and country" },
  { title: "Who makes it", body: "The supplier, or your own site." },
];
const NEVER: { title: string; body: string }[] = [
  {
    title: "Monthly figures",
    body: "Production, fuels and electricity for each month.",
  },
  {
    title: "Documents and evidence",
    body: "Receipts, invoices, calibration certificates.",
  },
  {
    title: "Sign-offs and finished versions",
    body: "The approvals and the stamped monitoring plans of the year behind it.",
  },
  {
    title: "Materiality",
    body: "Worked out again from the new year's figures.",
  },
];

function hint(t: TFunction, row: Row, preview: CarryPreview): string | null {
  const h = row.have?.(preview);
  if (!h) return null;
  if (h.empty) return t("Nothing recorded in this report");
  if (h.n != null && h.n > 0)
    return row.id === "precursors"
      ? t("{n} in the chain", { n: h.n })
      : row.id === "mmd_boundary"
        ? t("{n} exclusions", { n: h.n })
        : t("{n} rows", { n: h.n });
  return null;
}

export function DuplicateDialog({
  workspace,
  open,
  onClose,
}: {
  workspace: VerificationWorkspace;
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const all = useWorkspaces().data ?? [];
  const caps = useCaps().data;
  const own = useOwnInstallations().data ?? [];
  const theirs =
    useInstallationsForSupplier(
      workspace.selfSupplied ? undefined : workspace.supplierId,
    ).data ?? [];

  const [step, setStep] = React.useState(0);
  const [year, setYear] = React.useState(() => suggestedYear(workspace, all));
  const [installationId, setInstallationId] = React.useState(
    workspace.installationId,
  );
  const [carry, setCarry] = React.useState<Carry>(() => defaultCarry(true));
  const [touched, setTouched] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const pendingCopy = React.useRef<VerificationWorkspace | null>(null);
  const [preview, setPreview] = React.useState<CarryPreview>({
    instruments: 0,
    gaps: 0,
    exclusions: 0,
    precursors: 0,
    hasDiagram: false,
    carbonPrice: false,
  });

  // A fresh start each time it is opened — a copy begun and abandoned must not be waiting, half-answered, on the next one.
  React.useEffect(() => {
    if (!open) return;
    setStep(0);
    setYear(suggestedYear(workspace, all));
    setInstallationId(workspace.installationId);
    setCarry(defaultCarry(true));
    setTouched(false);
    setCreating(false);
    setError(null);
    pendingCopy.current = null;
    setPreview(carryPreview(workspace));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workspace.id]);

  const sites = (workspace.selfSupplied ? own : theirs).map((i) => ({
    value: i.id,
    label: i.name,
  }));
  if (!sites.some((s) => s.value === workspace.installationId))
    sites.unshift({
      value: workspace.installationId,
      label: workspace.installationName,
    });
  const site = sites.find((s) => s.value === installationId);
  const sameSite = installationId === workspace.installationId;

  /* A different site decides what the plant-bound parts should do — until the reader has chosen for themselves, they follow the site. */
  React.useEffect(() => {
    if (!touched) setCarry(defaultCarry(sameSite));
  }, [sameSite, touched]);

  // A year the account has not opened yet spends one of its reporting-year slots; a code it already reports spends nothing.
  const yearOpen = all.some((w) => !w.archivedAt && w.year === year);
  const yearBlocked = Boolean(caps && !yearOpen && caps.years.atCap);
  const exists = existingForTriple(installationId, workspace.productId, year);

  const years = Array.from(
    new Set([
      THIS_YEAR - 2,
      THIS_YEAR - 1,
      THIS_YEAR,
      THIS_YEAR + 1,
      THIS_YEAR + 2,
      year,
    ]),
  ).sort();

  const choose = (id: CarrySection, on: boolean) => {
    setTouched(true);
    setCarry((c) => ({ ...c, [id]: on }));
  };
  const every = (on: boolean) => {
    setTouched(true);
    setCarry(setAll(on));
  };
  // A part with nothing in it has nothing to bring, so it is not counted either way.
  const hasSomething = (r: Row) => !r.have?.(preview).empty;
  const total = GROUPS.reduce(
    (n, g) => n + g.rows.filter(hasSomething).length,
    0,
  );
  const brought = GROUPS.reduce(
    (n, g) => n + g.rows.filter((r) => hasSomething(r) && carry[r.id]).length,
    0,
  );

  const create = () => {
    if (creating || yearBlocked) return;
    setCreating(true);
    setError(null);
    window.setTimeout(async () => {
      try {
        const copy = await persistReportChange(
          () =>
            (pendingCopy.current ??= duplicateWorkspace(workspace, {
              year,
              installationId: sameSite ? undefined : installationId,
              installationName: sameSite ? undefined : site?.label,
              carry,
            })),
        );
        toast({
          message: t("Copy created"),
          detail: t("Open and ready for {year}.", { year }),
          tone: "ok",
        });
        onClose();
        router.push(`/workspaces/${copy.id}`);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        setCreating(false);
      }
    }, 400);
  };
  const locked = creating || Boolean(pendingCopy.current);
  const close = () => {
    if (!locked) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={t("Duplicate this report")}
      eyebrow={t("Step {n} of 2", { n: step + 1 })}
      width="max-w-xl"
      footer={
        <>
          {step === 0 ? (
            <Button variant="ghost" size="sm" disabled={locked} onClick={close}>
              {t("Cancel")}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled={locked}
              onClick={() => setStep(0)}
            >
              {t("Back")}
            </Button>
          )}
          {step === 0 ? (
            <Button size="sm" disabled={yearBlocked} onClick={() => setStep(1)}>
              {t("Continue")}
            </Button>
          ) : (
            <Button size="sm" disabled={creating} onClick={create}>
              {creating ? t("Creating…") : t("Create copy")}
            </Button>
          )}
        </>
      }
    >
      {error && (
        <p role="alert" className="mb-4 text-sm text-[#dc2626]">
          {error}
        </p>
      )}
      <fieldset disabled={locked}>
        {/* What is being copied — the same on both steps, so the reader never loses which report this is. */}
        <div className="rounded-xl border border-black/[0.07] bg-[#faf9f7] px-4 py-3">
          <p className="text-[13.5px] text-[#111]">
            {t(workspace.productName)}
          </p>
          <p className="mt-0.5 text-[12px] text-black/50">
            CN {workspace.cnCode} · {t(routeLabel(workspace.productionRoute))} ·{" "}
            {workspace.year} · {workspace.installationName}
          </p>
        </div>

        {step === 0 ? (
          <div className="mt-5 space-y-4">
            <p className="text-[13px] leading-relaxed text-black/55">
              {t("Where should the copy go?")}
            </p>
            <Field label={t("Reporting year")}>
              <Select
                value={String(year)}
                onChange={(v) => setYear(Number(v))}
                options={years.map((y) => ({
                  value: String(y),
                  label: String(y),
                }))}
                ariaLabel={t("Reporting year")}
              />
            </Field>
            {sites.length > 1 && (
              <Field label={t("Installation")}>
                <Select
                  value={installationId}
                  onChange={setInstallationId}
                  options={sites}
                  ariaLabel={t("Installation")}
                />
              </Field>
            )}
            {exists && (
              <p className="rounded-xl border border-[rgba(180,83,9,0.2)] bg-[#fffbeb] px-4 py-3 text-[12.5px] leading-relaxed text-[#b45309]">
                {t(
                  "There is already a report for this good at this site in {year}. You can still make the copy — a second one is how a mid-year change is kept apart.",
                  { year },
                )}
              </p>
            )}
            {yearBlocked && caps && (
              <>
                <p className="text-[12.5px] leading-relaxed text-black/55">
                  {t(
                    "{year} would be a new reporting year. Archiving a finished year frees its slot — nothing behind it is deleted.",
                    { year },
                  )}
                </p>
                <PlanCapNotice cap={caps.years} />
              </>
            )}
            <p className="text-[12px] leading-relaxed text-black/40">
              {t(
                "Same good, same CN code — a code you already report costs nothing more.",
              )}
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
              <div>
                <p className="text-[13px] text-[#111]">
                  {t("What comes across to {year}", { year })}
                </p>
                <p className="mt-0.5 text-[12px] text-black/45">
                  {t(
                    "For each part, choose whether it comes across or starts new.",
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.08em]">
                <button
                  type="button"
                  data-lock="allow"
                  onClick={() => every(true)}
                  className="text-black/50 hover:text-black"
                >
                  {t("Bring everything across")}
                </button>
                <button
                  type="button"
                  data-lock="allow"
                  onClick={() => every(false)}
                  className="text-black/50 hover:text-black"
                >
                  {t("Start everything new")}
                </button>
              </div>
            </div>

            {!sameSite && (
              <p className="rounded-xl border border-[rgba(180,83,9,0.2)] bg-[#fffbeb] px-4 py-3 text-[12.5px] leading-relaxed text-[#b45309]">
                {t(
                  "This is a different site, so the parts that describe the old plant start new. Switch any back on if they fit.",
                )}
              </p>
            )}

            <div>
              <h4 className="mb-2 text-[11px] uppercase tracking-[0.1em] text-black/40">
                {t("Always comes across")}
              </h4>
              <ul className="space-y-1.5">
                {ALWAYS.map((a) => (
                  <li
                    key={a.title}
                    className="flex items-start gap-2.5 text-[13px] text-black/70"
                  >
                    <Check
                      size={14}
                      strokeWidth={2}
                      className="mt-0.5 flex-none text-[#047857]"
                    />
                    <span>
                      {t(a.title)}
                      {a.body && (
                        <span className="text-black/45"> — {t(a.body)}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {GROUPS.map((g) => (
              <div key={g.title}>
                <h4 className="text-[11px] uppercase tracking-[0.1em] text-black/40">
                  {t(g.title)}
                </h4>
                {g.lead && (
                  <p className="mt-1 text-[12px] text-black/40">{t(g.lead)}</p>
                )}
                <ul className="mt-2 divide-y divide-black/[0.06] overflow-hidden rounded-xl border border-black/[0.07]">
                  {g.rows.map((r) => {
                    const note = hint(t, r, preview);
                    return (
                      <li
                        key={r.id}
                        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1 basis-56">
                          <div className="text-[13px] text-[#111]">
                            {t(r.title)}
                            {note && (
                              <span className="ml-2 font-mono text-[10.5px] text-black/35">
                                {note}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[12px] leading-relaxed text-black/45">
                            {t(r.body)}
                          </p>
                        </div>
                        <div className={cn(!hasSomething(r) && "opacity-50")}>
                          <Segmented<"yes" | "no">
                            value={carry[r.id] ? "yes" : "no"}
                            onChange={(v) => choose(r.id, v === "yes")}
                            ariaLabel={t(r.title)}
                            options={[
                              { value: "yes", label: t("Bring across") },
                              { value: "no", label: t("Start new") },
                            ]}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            <div>
              <h4 className="mb-1 text-[11px] uppercase tracking-[0.1em] text-black/40">
                {t("Always starts new")}
              </h4>
              <p className="mb-2 text-[12px] text-black/40">
                {t(
                  "They belong to the year they describe, so a copy never brings them.",
                )}
              </p>
              <ul className="space-y-1.5">
                {NEVER.map((a) => (
                  <li
                    key={a.title}
                    className="flex items-start gap-2.5 text-[13px] text-black/60"
                  >
                    <Lock
                      size={13}
                      strokeWidth={1.6}
                      className="mt-[3px] flex-none text-black/30"
                    />
                    <span>
                      {t(a.title)}
                      <span className="text-black/40"> — {t(a.body)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p
              className="border-t border-black/[0.06] pt-3 text-[12px] text-black/50"
              role="status"
            >
              {total === 0 || brought === 0
                ? t("Nothing comes across — everything starts new.")
                : brought === total
                  ? t("All {n} parts come across.", { n: total })
                  : t("{n} of {total} parts come across. The rest start new.", {
                      n: brought,
                      total,
                    })}
            </p>
          </div>
        )}
      </fieldset>
    </Modal>
  );
}
