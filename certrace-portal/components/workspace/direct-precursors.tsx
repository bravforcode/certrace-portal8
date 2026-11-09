"use client";

/* ════════════════════════════════════════════════════════════
   THE PRECURSORS TAB — direct precursors only, default or actual

   WHAT IS HERE. The goods that go straight into this product, one card each.
   Not a tree: a direct precursor's own inputs are its operator's business,
   and under CBAM that operator reports ONE figure for the precursor (its
   specific embedded emissions, Annex IV item 23(e)). Tiers are not collected
   and are not asked about.

   EACH CARD ASKS ONE QUESTION FIRST: default or actual?

     Default — Annex IV item 22. The EU's own figure for this CN code and the
               country it comes from. Nothing to ask anyone.
     Actual  — Annex IV item 23. The precursor's operator supplies a verified
               figure. That is a REQUEST sent once, with one box, for the final
               data of the year; nothing is generated for the precursor. What
               the exporter already knows (the good, where it came from, the
               quantity) the exporter fills in; the rest — the operator and
               installation, the reporting period, the emissions, the
               verifier's details and the verification report — the precursor
               fills in. Every field says which Annex IV item it feeds and
               whether it is required.

   AN ACTUAL VALUE IS USED ONLY ONCE IT CAN BE (Annex II A.1(4)–(5)): the
   precursor's figure must come from a verification report by an accredited
   verifier covering the period. Until then the default stands in, and the
   card says so in words — it never leaves an unverified figure in the filing.

   THE NOTE ABOUT DEFAULTS is written to inform, not to alarm. It is built
   from the numbers on this page (the mark-up in force, whether the country is
   known, what the precursors add against the finished good's own default) and
   it says what the arithmetic says: relying on defaults for the biggest
   input tends to raise the total, and can reach the finished good's default.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { ArrowRight, Check, ChevronDown, Clock, Copy, Info, Plus, Trash2 } from "lucide-react";
import { AutoSaveBadge, Button, Card, Checkbox, EnglishOnlyNotice, Field, Modal, TagBadge, cn, useAutoSave, type Tone } from "@/components/ui";
import { Select } from "@/components/controls";
import { toast } from "@/components/toast";
import { ProductPicker } from "@/components/workspace/product-picker";
import { MadeHerePrecursors } from "@/components/workspace/made-here-precursors";
import { ActualValueFields } from "@/components/precursor/actual-value-form";
import { AnnexFieldGroups, AnnexLegend, AnnexTag } from "@/components/precursor/annex-fields";
import { useWorkspace } from "@/components/workspace/provider";
import { COUNTRIES, countryNameShown as countryName, getCatalogProduct, isEuOrExempt } from "@/lib/config";
import { annualEvidence } from "@/lib/workspace-evidence";
import { admissibility, commitPrecursor, defaultExposure, defaultFor, type BasisState } from "@/lib/cbam/precursor-basis";
import { actualFields, basisCompleteness, defaultFields } from "@/lib/cbam/precursor-fields";
import { rateSheet } from "@/lib/cbam/eu-rates";
import { precursorLinkFor, makePrecursorLinkToken } from "@/lib/precursor-link";
import { ensurePrecursorLink } from "@/lib/precursor-link-sync";
import { emptySupplier, getSupplier, linkStatus, removeSupplier, saveSupplier, LINK_STATUS_LABEL, type PrecursorSupplier } from "@/lib/precursor-suppliers";
import { useInvalidatePrecursorSuppliers, usePrecursorSuppliers } from "@/lib/suppliers-query";
import { useInvalidateWorkspaceData } from "@/lib/workspace-data-query";
import { workspaceCountry } from "@/lib/workspace";
import { useT } from "@/lib/i18n";

const f3 = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? "—" : v.toLocaleString("en-GB", { minimumFractionDigits: 3, maximumFractionDigits: 3 }));
const pct = (v: number) => `${Math.round(v * 100)}%`;

/* ── State chip ─────────────────────────────────────────────────── */
const STATE_COPY: Record<BasisState, { label: string; tone: Tone }> = {
  default: { label: "Default value in use", tone: "muted" },
  needs_you: { label: "Your part is incomplete", tone: "warn" },
  not_requested: { label: "Not requested yet", tone: "warn" },
  awaiting_precursor: { label: "Waiting for the precursor", tone: "info" },
  not_admissible: { label: "Received — not usable yet", tone: "warn" },
  actual: { label: "Actual value in use", tone: "ok" },
};

/* ── The page ───────────────────────────────────────────────────── */
export function DirectPrecursors() {
  const t = useT();
  const { workspace, refresh } = useWorkspace();
  const { data: rows } = usePrecursorSuppliers(workspace.id);
  const invalidateRows = useInvalidatePrecursorSuppliers();
  const invalidateData = useInvalidateWorkspaceData(workspace.id);
  const [adding, setAdding] = React.useState(false);

  const direct = React.useMemo(() => (rows ?? []).filter((r) => !r.parentId), [rows]);
  const changed = React.useCallback(() => {
    invalidateRows();
    invalidateData();
    refresh();
  }, [invalidateRows, invalidateData, refresh]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className="text-[13px] leading-relaxed text-black/50">
            {t("Goods that go straight into this product. For each, use the EU default value or the producer's actual value.")}
          </p>
        </div>
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus size={14} strokeWidth={1.5} /> {t("Add direct precursor")}
        </Button>
      </div>

      {rows === undefined ? null : direct.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-[14px] text-black/70">{t("No precursor yet.")}</p>
          <p className="mx-auto mt-1.5 max-w-md text-[12.5px] leading-relaxed text-black/45">{t("Add what you buy in and use in this product.")}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {direct.map((row) => (
            <PrecursorCard key={row.id} row={row} onChanged={changed} />
          ))}
        </div>
      )}

      {/* The other kind of precursor: a product this site makes itself and uses here (items 18, 19, 27). */}
      <MadeHerePrecursors onChanged={changed} />

      <AddDialog
        open={adding}
        onClose={() => setAdding(false)}
        onAdded={() => {
          setAdding(false);
          changed();
        }}
      />
    </div>
  );
}

/* ── The note about defaults ───────────────────────────────────────
   It sits in the card of the precursor it is about, at the top of the body — the same place "Using the default value for now" takes when an actual
   value is wanted — and it appears when Default is the chosen value, not above the whole page. */
function DefaultNote({ dflt }: { dflt: ReturnType<typeof defaultFor> }) {
  const t = useT();
  const { workspace } = useWorkspace();
  // What every precursor on a default adds up to, read from what is saved — it moves when a card commits.
  const exposure = defaultExposure(workspace);
  const markup = dflt ? Math.round(dflt.markup * 100) : exposure.markup > 0 ? Math.round(exposure.markup * 100) : 10;
  return (
    <div className="rounded-xl border-l-[3px] border-l-[#2563eb] bg-[#eff6ff] px-4 py-3.5 text-[13px] leading-relaxed text-[#1e40af]">
      <div className="flex items-start gap-2.5">
        <Info size={15} strokeWidth={1.5} className="mt-0.5 flex-none" />
        <div className="min-w-0">
          <p className="font-medium">{t("About default values")}</p>
          <p className="mt-1">
            {t(
              "A default is the EU's cautious figure: +{markup}% mark-up this year, and the highest country value if the origin is unknown. A direct precursor carries most of a product's emissions, so it can raise your total. A verified actual value is often lower.",
              { markup },
            )}
          </p>
          {exposure.precursorPerTonne != null && exposure.finishedGoodDefault != null && (
            <p className="mt-2 font-mono text-[12px] text-[#1e3a8a]">
              {t("Today the precursors add {a} tCO₂e per tonne{share}; the finished good's EU default is {b}.", {
                a: f3(exposure.precursorPerTonne),
                share: exposure.defaultShare != null ? ` (${t("{p} of it on default values", { p: pct(exposure.defaultShare) })})` : "",
                b: f3(exposure.finishedGoodDefault),
              })}
            </p>
          )}
          {exposure.atOrAboveFinishedDefault && (
            <p className="mt-1.5">
              {t("The precursors alone already reach that default. Get an actual value for the largest one, or use the finished good's own default instead.")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── One precursor ───────────────────────────────────────────────── */

function PrecursorCard({ row, onChanged }: { row: PrecursorSupplier; onChanged: () => void }) {
  const t = useT();
  const { workspace } = useWorkspace();
  const [draft, setDraft] = React.useState<PrecursorSupplier>(row);
  const [docVersion, setDocVersion] = React.useState(0);
  const [open, setOpen] = React.useState(true);
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const committed = React.useRef<string>(JSON.stringify(row));

  // A change that came from outside this card — the precursor answered on its
  // own link, a document landed — replaces the draft.
  React.useEffect(() => {
    const incoming = JSON.stringify(row);
    if (incoming !== committed.current) {
      committed.current = incoming;
      setDraft(row);
    }
  }, [row]);

  const period = { year: workspace.year, periodStart: workspace.periodStart, periodEnd: workspace.periodEnd };

  const commit = React.useCallback(
    (v: PrecursorSupplier) => {
      /* The link history is stamped by the send button straight into the
         store; a draft that was loaded before the stamp must not write the
         old values back over it. */
      const cur = getSupplier(workspace.id, v.id);
      const merged: PrecursorSupplier = {
        ...v,
        smartLinkToken: cur?.smartLinkToken ?? v.smartLinkToken,
        smartLinkSentAt: cur?.smartLinkSentAt ?? v.smartLinkSentAt,
        smartLinkLastSentAt: cur?.smartLinkLastSentAt ?? v.smartLinkLastSentAt,
        smartLinkOpenedAt: cur?.smartLinkOpenedAt ?? v.smartLinkOpenedAt,
        smartLinkSubmittedAt: cur?.smartLinkSubmittedAt ?? v.smartLinkSubmittedAt,
      };
      const saved = commitPrecursor(merged, period);
      committed.current = JSON.stringify(getSupplier(workspace.id, v.id) ?? saved);
      onChanged();
      return saved;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspace.id, workspace.year, workspace.periodStart, workspace.periodEnd, onChanged],
  );

  const { status, savedAt, flush } = useAutoSave(draft, (v) => void commit(v), { delayMs: 500 });

  /* Opening the tab settles every row against the rules once: an answer that
     arrived while the tab was closed (the precursor submitted on its own link)
     is checked for use — complete, accredited, covering the period — before the
     card says what is in use. commitPrecursor is idempotent, so a row that was
     already settled is saved unchanged. */
  const settled = React.useRef(false);
  React.useEffect(() => {
    if (settled.current || !row.valueBasis) return;
    settled.current = true;
    const cur = getSupplier(workspace.id, row.id);
    if (!cur) return;
    const before = JSON.stringify(cur);
    const after = commitPrecursor(cur, period);
    if (JSON.stringify(after) !== before) {
      committed.current = JSON.stringify(getSupplier(workspace.id, row.id) ?? after);
      setDraft(getSupplier(workspace.id, row.id) ?? after);
      onChanged();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keeps `verificationReportFileId` pointed at the latest report in the
  // Documents block — an attach is not an edit, so it goes through setDraft.
  React.useEffect(() => {
    const items = annualEvidence(workspace.id).filter((i) => i.fieldKeys.includes(`precursor:${row.id}`));
    const latest = items[0]?.id;
    setDraft((d) => (d.verificationReportFileId === latest ? d : { ...d, verificationReportFileId: latest }));
  }, [workspace.id, row.id, docVersion]);

  const set = (next: PrecursorSupplier) => setDraft(next);

  const adm = admissibility(draft, period);
  const dflt = defaultFor(draft.cnCode, draft.country, workspace.year, { unknownOrigin: draft.originUnknown });
  const state: BasisState = draft.valueBasis ? adm.state : "default";
  const chip = STATE_COPY[state];
  const catalog = draft.catalogProductId ? getCatalogProduct(draft.catalogProductId) : undefined;

  const chooseBasis = (basis: "default" | "actual") => {
    setDraft((d) => ({ ...d, valueBasis: basis, reportingPeriodBasis: d.reportingPeriodBasis ?? "default_period" }));
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 sm:px-6">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-start gap-3 text-left" aria-expanded={open}>
          <ChevronDown size={16} strokeWidth={1.5} className={cn("mt-1 flex-none text-black/35 transition-transform", !open && "-rotate-90")} />
          <span className="min-w-0">
            <span className="block truncate text-[15px] text-black/85">{draft.precursorName || catalog?.name || t("Unnamed precursor")}</span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] text-black/40">
              <span>CN {draft.cnCode || "—"}</span>
              <span>·</span>
              <span>{draft.originUnknown ? t("Origin not identified") : draft.country ? countryName(draft.country) : t("Origin not set")}</span>
              {draft.valueBasis && dflt && state !== "actual" && (
                <>
                  <span>·</span>
                  <span>
                    {t("Default")} {f3(dflt.total)} tCO₂e/t
                  </span>
                </>
              )}
            </span>
          </span>
        </button>
        <div className="flex flex-none flex-wrap items-center gap-2">
          {draft.valueBasis && <TagBadge tone={chip.tone}>{t(chip.label)}</TagBadge>}
        </div>
      </div>

      {open && (
        <div className="space-y-5 border-t border-black/[0.06] px-5 py-5 sm:px-6">
          <BasisTiles basis={draft.valueBasis} onChoose={chooseBasis} dflt={dflt} actualBlocked={Boolean(draft.originUnknown)} />

          {draft.valueBasis === "default" && <DefaultBody row={draft} set={set} dflt={dflt} workspaceId={workspace.id} onDoc={() => setDocVersion((v) => v + 1)} />}

          {draft.valueBasis === "actual" && (
            <ActualBody
              row={draft}
              set={set}
              workspaceId={workspace.id}
              adm={adm}
              dflt={dflt}
              onDoc={() => setDocVersion((v) => v + 1)}
              onSent={() => {
                const cur = getSupplier(workspace.id, row.id);
                if (cur) setDraft((d) => ({ ...d, smartLinkToken: cur.smartLinkToken, smartLinkSentAt: cur.smartLinkSentAt, smartLinkLastSentAt: cur.smartLinkLastSentAt }));
                onChanged();
              }}
              flush={flush}
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-3">
            <AutoSaveBadge status={status} savedAt={savedAt} />
            {confirmRemove ? (
              <span className="flex items-center gap-2 text-[12px] text-black/55">
                {t("Remove this precursor?")}
                <button
                  type="button"
                  className="rounded-lg border border-[#dc2626]/30 px-2.5 py-1 text-[#dc2626] hover:bg-[#fef2f2]"
                  onClick={() => {
                    removeSupplier(workspace.id, row.id);
                    onChanged();
                  }}
                >
                  {t("Remove")}
                </button>
                <button type="button" className="rounded-lg border border-black/10 px-2.5 py-1 hover:border-black/25" onClick={() => setConfirmRemove(false)}>
                  {t("Keep")}
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmRemove(true)} className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/35 hover:text-[#dc2626]">
                <Trash2 size={12} strokeWidth={1.5} /> {t("Remove")}
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ── The choice ──────────────────────────────────────────────────── */
function BasisTiles({
  basis,
  onChoose,
  dflt,
  actualBlocked,
}: {
  basis: PrecursorSupplier["valueBasis"];
  onChoose: (b: "default" | "actual") => void;
  dflt: ReturnType<typeof defaultFor>;
  /** the country of production cannot be identified, so only the default is available */
  actualBlocked?: boolean;
}) {
  const t = useT();
  const tile = (id: "default" | "actual", title: string, body: string, foot?: React.ReactNode) => (
    <button
      type="button"
      onClick={() => onChoose(id)}
      aria-pressed={basis === id}
      disabled={id === "actual" && actualBlocked}
      className={cn(
        "flex flex-1 flex-col items-start rounded-xl border p-4 text-left transition-colors",
        basis === id ? "border-[#111] bg-[#faf9f7]" : "border-black/10 bg-white hover:border-black/25",
        id === "actual" && actualBlocked && "cursor-not-allowed opacity-50 hover:border-black/10",
      )}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="text-[13.5px] text-black/85">{title}</span>
        <span className={cn("grid h-4 w-4 flex-none place-items-center rounded-full border", basis === id ? "border-transparent bg-[#111] text-white" : "border-black/20")}>
          {basis === id && <Check size={10} strokeWidth={3} />}
        </span>
      </span>
      <span className="mt-1.5 text-[12.5px] leading-relaxed text-black/50">{body}</span>
      {foot && <span className="mt-2.5 font-mono text-[11.5px] text-black/60">{foot}</span>}
    </button>
  );
  return (
    <div>
      <p className="mb-2 text-[11px] uppercase tracking-[0.1em] text-black/45">{t("Which value do you want to use for this precursor?")}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {tile(
          "default",
          t("Default value"),
          t("The EU's own figure for this CN code and country of origin. Nothing to ask anyone, and nothing to upload."),
          dflt ? `${f3(dflt.total)} tCO₂e/t` : undefined,
        )}
        {tile(
          "actual",
          t("Actual value"),
          actualBlocked
            ? t("Not available while the country of production cannot be identified — an actual value needs a country of origin and an identified operator.")
            : t("Ask the precursor's operator for its verified figure for the year. It is used once their data and verification report are in; until then the default stands in."),
        )}
      </div>
    </div>
  );
}

/* ── Default body ────────────────────────────────────────────────── */
function DefaultBody({
  row,
  set,
  dflt,
  workspaceId,
  onDoc,
}: {
  row: PrecursorSupplier;
  set: (r: PrecursorSupplier) => void;
  dflt: ReturnType<typeof defaultFor>;
  workspaceId: string;
  onDoc: () => void;
}) {
  const t = useT();
  const { workspace } = useWorkspace();
  const sheet = row.cnCode ? rateSheet({ cn: row.cnCode, country: row.originUnknown ? "ZZ" : row.country || "ZZ", year: workspace.year }) : null;
  return (
    <div className="space-y-4">
      <DefaultNote dflt={dflt} />
      {/* The fields below take prose, so the notice sits under what is said about the value and above them. */}
      <EnglishOnlyNotice />
      <div className="rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <AnnexTag tag="22(d)" need="required" />
          <span className="text-[12.5px] text-black/70">{t("The applicable default value")}</span>
        </div>
        {dflt ? (
          <>
            <p className="mt-2 font-[family-name:var(--font-plex)] text-[26px] font-light leading-none tracking-tight text-[#111]">
              {f3(dflt.total)} <span className="text-[13px] text-black/40">tCO₂e/t</span>
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-black/50">
              {dflt.source === "unknown_origin"
                ? t("The country of production is not identified, so the highest default value for this CN code applies (Annex IV to Regulation 2023/956).")
                : dflt.source === "other"
                  ? t("Annex I of Implementing Regulation 2025/2621 has no row for this country and good, so “Other countries and territories” applies.")
                  : t("From Annex I of Implementing Regulation 2025/2621 for {country}.", { country: countryName(dflt.usedCountry) })}{" "}
              {t("Reporting year {year}, including the +{markup}% mark-up.", { year: dflt.year, markup: Math.round(dflt.markup * 100) })}
              {dflt.splitKnown && dflt.indirect != null && (
                <span className="font-mono">
                  {" "}
                  {t("Direct {d} · indirect {i}.", { d: f3(dflt.direct), i: f3(dflt.indirect) })}
                </span>
              )}
            </p>
            {sheet && sheet.defaultValue !== dflt.total && null}
          </>
        ) : (
          <p className="mt-2 text-[12.5px] text-[#b45309]">{t("Enter the CN code to see the default value.")}</p>
        )}
      </div>
      <AnnexFieldGroups
        fields={defaultFields()}
        row={row}
        onChange={set}
        workspaceId={workspaceId}
        onDocChange={onDoc}
        extraCountryOptions={[]}
      />
    </div>
  );
}

/* ── Actual body ─────────────────────────────────────────────────── */
function ActualBody({
  row,
  set,
  workspaceId,
  adm,
  dflt,
  onDoc,
  onSent,
  flush,
}: {
  row: PrecursorSupplier;
  set: (r: PrecursorSupplier) => void;
  workspaceId: string;
  adm: ReturnType<typeof admissibility>;
  dflt: ReturnType<typeof defaultFor>;
  onDoc: () => void;
  onSent: () => void;
  flush: () => void;
}) {
  const t = useT();
  const fields = React.useMemo(() => actualFields(row), [row.cnCode, row.catalogProductId, row.country]); // eslint-disable-line react-hooks/exhaustive-deps
  const mine = fields.filter((f) => f.owner === "exporter");
  const theirs = fields.filter((f) => f.owner === "precursor");
  const attached = { report: Boolean(row.verificationReportFileId) };
  const c = basisCompleteness(row, attached);
  /* What the operator sent is read HERE, in the form they filled in — so once they have submitted it opens on its own. Before that it stays shut:
     the list above says what they will be asked, and the form below is only for entering it on their behalf. */
  const [manual, setManual] = React.useState(Boolean(row.smartLinkSubmittedAt));

  return (
    <div className="space-y-5">
      {/* What is in use right now — said in words, always */}
      <InUse adm={adm} dflt={dflt} />
      <EnglishOnlyNotice />

      {/* ── Your part ───────────────────────────────────────── */}
      <section className="rounded-xl border border-black/[0.07] p-4 sm:p-5">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-[13px] text-black/80">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#111] font-mono text-[10px] text-white">1</span>
            {t("What you fill in")}
          </h3>
          <span className="font-mono text-[11px] text-black/40">
            {c.exporter.answered} / {c.exporter.total} {t("required answered")}
          </span>
        </header>
        <AnnexFieldGroups fields={mine} row={row} onChange={set} workspaceId={workspaceId} onDocChange={onDoc} />
      </section>

      {/* ── Their part ──────────────────────────────────────── */}
      <section className="rounded-xl border border-black/[0.07] p-4 sm:p-5">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-[13px] text-black/80">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#111] font-mono text-[10px] text-white">2</span>
            {t("What the precursor's operator fills in")}
          </h3>
          <span className="font-mono text-[11px] text-black/40">
            {c.precursor.answered} / {c.precursor.total} {t("required answered")}
          </span>
        </header>
        <p className="mb-4 text-[12.5px] leading-relaxed text-black/50">{t("One link. They answer once, after their own year is verified.")}</p>

        <RequestBox row={row} onSent={onSent} flush={flush} />

        <div className="mt-5">
          <p className="mb-2 text-[11px] uppercase tracking-[0.1em] text-black/45">{t("What they will be asked")}</p>
          <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {theirs.map((f) => {
              const answered = f.input === "file" ? Boolean(f.slot && attached[f.slot as "report"]) : false;
              void answered;
              return (
                <li key={f.key} className="flex items-start gap-2 py-0.5 text-[12.5px] text-black/65">
                  <AnnexTag tag={f.tag} need={f.need} className="mt-px" />
                  <span className="min-w-0 flex-1 leading-snug">{t(f.label)}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-5 border-t border-black/[0.06] pt-4">
          <button
            type="button"
            onClick={() => setManual((m) => !m)}
            aria-expanded={manual}
            className="inline-flex items-center gap-2 text-[11.5px] uppercase tracking-[0.1em] text-black/50 underline decoration-black/20 underline-offset-2 hover:text-black"
          >
            <ChevronDown size={13} strokeWidth={1.5} className={cn("transition-transform", !manual && "-rotate-90")} />
            {t("Check or enter the precursor's data")}
          </button>
          {manual && (
            <div className="mt-4">
              <p className="mb-4 text-[12.5px] leading-relaxed text-black/50">
                {t("What the precursor sent shows here. Check it, or enter and change anything for them — it is the same form they fill in on their link, and the same checks apply.")}
              </p>
              <ActualValueFields draft={row} set={set} workspaceId={workspaceId} onDocChange={onDoc} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ── What is in use ──────────────────────────────────────────────── */
function InUse({ adm, dflt }: { adm: ReturnType<typeof admissibility>; dflt: ReturnType<typeof defaultFor> }) {
  const t = useT();
  const usable = adm.state === "actual";
  return (
    <div className={cn("rounded-xl border-l-[3px] px-4 py-3 text-[13px] leading-relaxed", usable ? "border-l-[#047857] bg-[#ecfdf5] text-[#065f46]" : "border-l-[#d97706] bg-[#fffbeb] text-[#78350f]")}>
      <div className="flex items-start gap-2.5">
        {usable ? <Check size={15} strokeWidth={1.75} className="mt-0.5 flex-none" /> : <Clock size={15} strokeWidth={1.5} className="mt-0.5 flex-none" />}
        <div>
          {usable ? (
            <p>{t("The precursor's verified actual value is in use for this product.")}</p>
          ) : (
            <>
              <p>
                {t("Using the default value for now")}
                {dflt ? ` (${f3(dflt.total)} tCO₂e/t)` : ""}.{" "}
                {t("An actual value replaces it once the precursor's data and a verification report covering the period are in.")}
              </p>
              {adm.reasons.length > 0 && (
                <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
                  {adm.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── The request ───────────────────────────────────────────────────
   One button: copy the link and send it to the precursor's operator however you reach them. Copying counts as asking — the row
   moves to "waiting for the precursor". No contact details are kept here: the link is the request. */
function RequestBox({ row, onSent, flush }: { row: PrecursorSupplier; onSent: () => void; flush: () => void }) {
  const t = useT();
  const { workspace } = useWorkspace();
  const [copied, setCopied] = React.useState(false);
  const status = linkStatus(row);

  const copyLink = async () => {
    flush();
    const cur = getSupplier(workspace.id, row.id) ?? row;
    const token = cur.smartLinkToken ?? makePrecursorLinkToken(workspace.id, cur.id);
    const now = new Date().toISOString();
    saveSupplier({ ...cur, smartLinkToken: token, smartLinkSentAt: cur.smartLinkSentAt ?? now, smartLinkLastSentAt: now });
    const url = (await ensurePrecursorLink(workspace.id, row.id).catch(() => null)) ?? precursorLinkFor(workspace.id, row.id);
    if (url && typeof navigator !== "undefined" && navigator.clipboard) void navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
    toast({ message: t("Link copied"), detail: t("Send it to the precursor's operator."), tone: "ok" });
    onSent();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[#faf9f7] p-4">
      <Button size="sm" onClick={() => void copyLink()}>
        {copied ? <Check size={13} strokeWidth={1.5} /> : <Copy size={13} strokeWidth={1.5} />} {copied ? t("Copied") : t("Copy link")}
      </Button>
      <span className="font-mono text-[11px] text-black/40">{t(LINK_STATUS_LABEL[status])}</span>
    </div>
  );
}

/* ── Add ───────────────────────────────────────────────────────────
   TWO STEPS, in the order the questions depend on each other.

     1  Which good? — the catalogue picker, nothing else. The picker shows no
        figures here: a default value belongs to a good AND a country, and the
        country is not known yet, so a number on the row would be a guess (it used
        to be Thailand's, whatever the precursor actually was).
     2  Where was it made, and which value? — the country (or "cannot be
        identified"), the default value that country gives for the good — read
        live from Annex I of 2025/2621 for ANY country, with "Other countries and
        territories" for one Annex I does not list and Annex IV for an unidentified
        origin — and the choice between that default and an actual value.

   An unidentified country takes the default value, and only that: an actual value
   is reported under Annex IV item 23, which needs a country of origin, and item
   28, which needs the producing operator. So ticking the box greys out "Actual
   value" and says why. */
function AddDialog({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const t = useT();
  const { workspace } = useWorkspace();
  const [step, setStep] = React.useState<1 | 2>(1);
  const [productId, setProductId] = React.useState("");
  const [country, setCountry] = React.useState(workspaceCountry(workspace));
  const [unknown, setUnknown] = React.useState(false);
  const [basis, setBasis] = React.useState<"default" | "actual" | "">("");

  React.useEffect(() => {
    if (open) {
      setStep(1);
      setProductId("");
      setCountry(workspaceCountry(workspace));
      setUnknown(false);
      setBasis("");
    }
  }, [open, workspace]);

  const product = productId ? getCatalogProduct(productId) : undefined;
  const ready = Boolean(product && basis && (unknown || country));

  // No country → no actual value. Ticking the box moves the choice onto the default in the same step.
  const setUnknownOrigin = (on: boolean) => {
    setUnknown(on);
    if (on) setBasis("default");
  };

  const add = () => {
    if (!product || !basis) return;
    const row: PrecursorSupplier = {
      ...emptySupplier(workspace.id, null),
      precursorName: product.name,
      cnCode: product.cnCode,
      catalogProductId: product.id,
      country: unknown ? "" : country,
      originUnknown: unknown,
      valueBasis: unknown ? "default" : basis,
      reportingPeriodBasis: "default_period",
      origin: "purchased",
      addedBy: "exporter",
    };
    commitPrecursor(row, { year: workspace.year, periodStart: workspace.periodStart, periodEnd: workspace.periodEnd });
    onAdded();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="max-w-3xl"
      eyebrow={`${t("Precursors")} · ${t("Step {n} of 2", { n: step })}`}
      title={t("Add a direct precursor")}
      lead={
        step === 1
          ? t("Pick the good from the catalogue.")
          : t("Where it was made, and which value to use.")
      }
      footer={
        step === 1 ? (
          <>
            <Button variant="secondary" size="sm" onClick={onClose}>
              {t("Cancel")}
            </Button>
            <Button size="sm" onClick={() => setStep(2)} disabled={!product}>
              {t("Continue")} <ArrowRight size={13} strokeWidth={1.5} />
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" size="sm" onClick={() => setStep(1)}>
              {t("Back")}
            </Button>
            <Button size="sm" onClick={add} disabled={!ready}>
              {t("Add precursor")} <ArrowRight size={13} strokeWidth={1.5} />
            </Button>
          </>
        )
      }
    >
      {step === 1 ? (
        <ProductPicker value={productId} onChange={setProductId} showRates={false} year={workspace.year} defaultCategory={getCatalogProduct(workspace.productId)?.category} />
      ) : (
        <div className="space-y-6">
          {/* The good, fixed from here on — and the way back if it was the wrong one. */}
          {product && (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-black/[0.07] bg-[#faf9f7] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-[13.5px] text-black/80">{product.name}</p>
                <p className="mt-0.5 font-mono text-[11px] text-black/40">CN {product.cnCode}</p>
              </div>
              <button type="button" onClick={() => setStep(1)} className="flex-none text-[11px] uppercase tracking-[0.1em] text-black/45 underline decoration-black/20 underline-offset-2 hover:text-black">
                {t("Change")}
              </button>
            </div>
          )}

          <section>
            <h4 className="mb-2.5 border-b border-black/[0.06] pb-1.5 text-[10.5px] uppercase tracking-[0.12em] text-black/40">{t("Where it was made")}</h4>
            <div className="space-y-4">
              <Field label={t("Country of origin")} hint={t("Where this precursor was produced.")}>
                <Select
                  value={unknown ? "" : country}
                  onChange={setCountry}
                  searchable
                  disabled={unknown}
                  placeholder={unknown ? t("Not identified") : t("Choose a country")}
                  options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
                  ariaLabel={t("Country of origin")}
                />
              </Field>
              <Checkbox
                checked={unknown}
                onChange={setUnknownOrigin}
                label={t("The country of production cannot be identified")}
                hint={t("The highest default value for the CN code applies — Annex IV to Implementing Regulation 2025/2621. An actual value needs a country of origin.")}
              />
              {product && <DefaultPreview cn={product.cnCode} country={unknown ? "" : country} unknown={unknown} year={workspace.year} />}
            </div>
          </section>

          <section>
            <h4 className="mb-2.5 border-b border-black/[0.06] pb-1.5 text-[10.5px] uppercase tracking-[0.12em] text-black/40">{t("Which value do you want to use?")}</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["default", t("Default value"), t("The EU's figure. Nothing to ask anyone.")],
                  ["actual", unknown ? t("Not available — the country is not identified") : t("Actual value"), unknown ? t("An actual value needs a country of origin and an identified operator.") : t("Ask the precursor's operator for its verified figure.")],
                ] as const
              ).map(([id, title, body]) => {
                const blocked = id === "actual" && unknown;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={basis === id}
                    disabled={blocked}
                    onClick={() => setBasis(id)}
                    className={cn(
                      "rounded-xl border p-3.5 text-left transition-colors",
                      basis === id ? "border-[#111] bg-[#faf9f7]" : "border-black/10 hover:border-black/25",
                      blocked && "cursor-not-allowed opacity-50 hover:border-black/10",
                    )}
                  >
                    <span className="block text-[13px] text-black/85">{title}</span>
                    <span className="mt-1 block text-[12px] text-black/50">{body}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11.5px] text-black/40">{t("You can change this at any time.")}</p>
          </section>
        </div>
      )}
    </Modal>
  );
}

/* The default value this good has in the chosen country — read live for ANY country,
   so the figure on screen is the one the report will use. */
function DefaultPreview({ cn, country, unknown, year }: { cn: string; country: string; unknown: boolean; year: number }) {
  const t = useT();
  if (!unknown && !country) return null;
  if (!unknown && isEuOrExempt(country)) {
    return (
      <p className="rounded-xl border border-black/[0.07] bg-[#faf9f7] px-4 py-3 text-[12.5px] leading-relaxed text-black/55">
        {t("Made inside the EU or in an exempted territory, so there is no CBAM default value — its embedded emissions count as zero.")}
      </p>
    );
  }
  const d = defaultFor(cn, country, year, { unknownOrigin: unknown });
  if (!d) return <p className="text-[12.5px] text-[#b45309]">{t("The EU publishes no default value for this good.")}</p>;
  return (
    <div className="rounded-xl border border-black/[0.07] bg-[#faf9f7] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.1em] text-black/40">{t("EU default value · {year}", { year: d.year })}</p>
      <p className="mt-1 font-[family-name:var(--font-plex)] text-[24px] font-light leading-none tracking-tight text-[#111]">
        {f3(d.total)} <span className="text-[12px] text-black/40">tCO₂e/t</span>
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-black/50">
        {d.source === "unknown_origin"
          ? t("The highest default value for this CN code (Annex IV), including the +{markup}% mark-up.", { markup: Math.round(d.markup * 100) })
          : d.source === "other"
            ? t("{country} is not listed in Annex I, so “Other countries and territories” applies, including the +{markup}% mark-up.", { country: countryName(country), markup: Math.round(d.markup * 100) })
            : t("From Annex I for {country}, including the +{markup}% mark-up.", { country: countryName(country), markup: Math.round(d.markup * 100) })}
      </p>
    </div>
  );
}
