"use client";

/* ════════════════════════════════════════════════════════════
   PRECURSOR NODE FORM — one upstream tier, added and filled in by a
   precursor supplier on their own /p/<token> link, recursively.

   Supersedes the old UpstreamRow, which only collected identity (company,
   precursor name, unique ID, UN/LOCODE) — a supplier-added child could
   never actually become submittable, since it had no SEE, no quantity, no
   verification package. This is the SAME set of fields the root of the
   portal already collects (app/p/[token]/page.tsx's Form), reused at every
   depth exactly the way components/precursor/supplier-editor.tsx already
   reuses one editor at every tier on the exporter's side — a supplier can
   now build out and submit several tiers of their own upstream chain in
   one sitting, rather than needing a brand new link from the exporter for
   every level.

   Each node here persists on its own explicit Save — unlike the portal's
   root, which only commits at the top-level Submit (see that file's own
   "nothing is transmitted automatically... until you submit" promise).
   That asymmetry is deliberate, not an oversight: the root's promise is
   about the ONE row the link was minted for; a child the supplier is
   choosing to add mid-session is closer in spirit to UpstreamRow's
   existing immediate-save today, and Submit's batch-stamp walk (see
   submit() in the page) only backfills the LIFECYCLE timestamps for a
   child whose field values are already durably saved by then.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Check, MapPin, Paperclip, Plus, ShieldCheck } from "lucide-react";
import { Button, Field, NumberInput, inputClass, cn } from "@/components/ui";
import { DatePicker, Select } from "@/components/controls";
import { toast } from "@/components/toast";
import { coordinateError } from "@/lib/installations";
import { COUNTRIES } from "@/lib/config";
import { SectionEvidence } from "@/components/workspace/evidence-panel";
import { annualEvidence, type RequiredKey } from "@/lib/workspace-evidence";
import { useT } from "@/lib/i18n";
import {
  emptySupplier,
  getSupplier,
  listSuppliers,
  matchesExistingInstallation,
  saveSupplier,
  type PrecursorSupplier,
} from "@/lib/precursor-suppliers";

export function PrecursorNodeForm({
  workspaceId,
  nodeId,
  depth,
  onChange,
}: {
  workspaceId: string;
  nodeId: string;
  /** 1 for a supplier's directly-added child, 2+ for their own upstream —
      indentation only, no functional limit beyond MAX_SUPPLIER_DEPTH
      (already enforced by saveSupplier's own chain). */
  depth: number;
  /** bubbles up so an ancestor's own view (and, once saved, the exporter's
      Tree/Precursors views) reflect the change without a full page reload. */
  onChange: () => void;
}) {
  const t = useT();
  const [draft, setDraft] = React.useState<PrecursorSupplier | null>(null);
  const [children, setChildren] = React.useState<PrecursorSupplier[]>([]);
  const [evidenceVersion, setEvidenceVersion] = React.useState(0);
  const [dirty, setDirty] = React.useState(false);

  const reload = React.useCallback(() => {
    setDraft(getSupplier(workspaceId, nodeId));
    setChildren(
      listSuppliers(workspaceId).filter((s) => s.parentId === nodeId),
    );
  }, [workspaceId, nodeId]);

  React.useEffect(reload, [reload]);

  /* Keeps `verificationReportFileId` pointed at whatever the Documents block
     below holds — the same effect the exporter's SupplierEditor runs. Through
     setDraft rather than set(), because an attach is not an edit: it must not
     turn the Save button on by itself. */
  React.useEffect(() => {
    const items = annualEvidence(workspaceId).filter((i) =>
      i.fieldKeys.includes(`precursor:${nodeId}`),
    );
    const latest = items[0]?.id; // annualEvidence is already newest-first
    setDraft((d) =>
      d == null || d.verificationReportFileId === latest
        ? d
        : { ...d, verificationReportFileId: latest },
    );
    const stored = getSupplier(workspaceId, nodeId);
    if (stored && stored.verificationReportFileId !== latest)
      saveSupplier({ ...stored, verificationReportFileId: latest });
  }, [workspaceId, nodeId, evidenceVersion]);

  if (!draft) return null;

  const set = (p: Partial<PrecursorSupplier>) => {
    setDraft((d) => (d ? { ...d, ...p } : d));
    setDirty(true);
  };

  const evidenceKeys: RequiredKey[] = [
    {
      key: `precursor:${nodeId}`,
      label: `${draft.precursorName || "Unnamed precursor"} — emissions figure`,
    },
  ];

  const save = () => {
    const named = Boolean(
      draft.installationUniqueId?.trim() || draft.unlocode?.trim(),
    );
    const matches = matchesExistingInstallation(workspaceId, draft);
    const saved = saveSupplier({
      ...draft,
      pendingExporterConfirmation: named && !matches,
    });
    setDraft(saved);
    setDirty(false);
    onChange();
    toast({
      message: "Saved",
      detail: matches
        ? "Matched to an installation already on file."
        : named
          ? "Recorded — the exporter will confirm this is a new installation."
          : "Saved.",
      tone: "ok",
    });
  };

  const addUpstream = () => {
    const child = saveSupplier({
      ...emptySupplier(workspaceId, nodeId),
      addedBy: "supplier",
    });
    setChildren((prev) => [...prev, child]);
    onChange();
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-black/[0.07] bg-white p-5",
        depth > 1 && "border-black/[0.09]",
      )}
      style={depth > 1 ? { marginLeft: (depth - 1) * 16 } : undefined}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-[0.1em] text-black/55">
          {depth === 1
            ? "An upstream precursor of your own"
            : `${depth} tiers upstream of you`}
        </span>
        {dirty ? (
          <Button size="sm" variant="secondary" onClick={save}>
            <Check size={13} strokeWidth={1.5} /> {t("Save")}
          </Button>
        ) : (
          <span className="text-[11px] text-black/35">{t("Saved")}</span>
        )}
      </div>

      {/* ── Product installation ──────────────────────────────────
          The same field set, in the same order, as the root form above it.
          Two forms asking for one plant in two different shapes is how the
          reference gets typed on one tier and skipped on the next. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("Company")}>
          <input
            className={inputClass}
            value={draft.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder={t("Their supplier")}
          />
        </Field>
        <Field
          label={t("Installation")}
          hint={t("Where it was actually produced.")}
        >
          <input
            className={inputClass}
            value={draft.installationName}
            onChange={(e) => set({ installationName: e.target.value })}
            placeholder={t("Their installation")}
          />
        </Field>
        <Field label={t("Country")}>
          <Select
            value={draft.country}
            onChange={(v) => set({ country: v })}
            searchable
            options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
            ariaLabel={t("Country")}
          />
        </Field>
        <Field
          label={t("Installation reference")}
          hint={t("That plant's own reference for itself.")}
        >
          <input
            className={inputClass}
            value={draft.installationUniqueId ?? ""}
            onChange={(e) => set({ installationUniqueId: e.target.value })}
            placeholder={t("TH-CHON-0042")}
          />
        </Field>
        <Field label={t("UN/LOCODE")}>
          <input
            className={cn(inputClass, "font-mono")}
            value={draft.unlocode ?? ""}
            onChange={(e) => set({ unlocode: e.target.value.toUpperCase() })}
            placeholder={t("THLCH")}
          />
        </Field>
        <Field label={t("Full address")}>
          <input
            className={inputClass}
            value={draft.fullAddress ?? ""}
            onChange={(e) => set({ fullAddress: e.target.value })}
            placeholder={t("88 Moo 4, Sriracha, Chonburi 20230")}
          />
        </Field>
        <Field
          label={t("Latitude")}
          hint={
            coordinateError(
              String(draft.latitude ?? ""),
              String(draft.longitude ?? ""),
            ) ?? undefined
          }
        >
          <NumberInput
            value={draft.latitude}
            min={-90}
            max={90}
            invalid={Boolean(
              coordinateError(
                String(draft.latitude ?? ""),
                String(draft.longitude ?? ""),
              ),
            )}
            onChange={(v) => set({ latitude: v })}
            ariaLabel={t("Latitude")}
          />
        </Field>
        <Field label={t("Longitude")}>
          <NumberInput
            value={draft.longitude}
            min={-180}
            max={180}
            onChange={(v) => set({ longitude: v })}
            ariaLabel={t("Longitude")}
          />
        </Field>
      </div>

      <div className="mt-4 rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
        <span className="mb-3 block text-[11px] uppercase tracking-[0.1em] text-black/55">
          {t("Precursor product")}
        </span>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Product name")}>
            <input
              className={inputClass}
              value={draft.precursorName}
              onChange={(e) => set({ precursorName: e.target.value })}
              placeholder={t("Steel billet")}
            />
          </Field>
          <Field label={t("CN code")}>
            <input
              className={cn(inputClass, "font-mono")}
              value={draft.cnCode}
              onChange={(e) => set({ cnCode: e.target.value })}
              placeholder="7207 11 90"
            />
          </Field>
          <Field label={t("Production route")} hint={t("How they make it.")}>
            <input
              className={inputClass}
              value={draft.productionRoute}
              onChange={(e) => set({ productionRoute: e.target.value })}
              placeholder={t("Scrap-based EAF")}
            />
          </Field>
        </div>
      </div>

      <section className="mt-4 rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
        <div className="mb-3 flex items-center gap-2">
          <MapPin size={13} strokeWidth={1.5} className="text-black/35" />
          <span className="text-[11px] uppercase tracking-[0.1em] text-black/55">
            {t("Specific embedded emissions")}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("Direct")}
            hint={t("Their own CBAM communication figure.")}
          >
            <NumberInput
              value={draft.specificEmbeddedDirectTco2PerT}
              min={0}
              unit="tCO₂e/t"
              onChange={(v) => set({ specificEmbeddedDirectTco2PerT: v })}
              ariaLabel={t("Direct SEE")}
            />
          </Field>
          <Field label={t("Indirect")}>
            <NumberInput
              value={draft.specificEmbeddedIndirectTco2PerT}
              min={0}
              unit="tCO₂e/t"
              onChange={(v) => set({ specificEmbeddedIndirectTco2PerT: v })}
              ariaLabel={t("Indirect SEE")}
            />
          </Field>
          <Field label={t("Reporting period start")}>
            <DatePicker
              value={draft.reportingPeriodStart ?? ""}
              onChange={(iso) => set({ reportingPeriodStart: iso })}
              ariaLabel={t("Reporting period start")}
            />
          </Field>
          <Field label={t("Reporting period end")}>
            <DatePicker
              value={draft.reportingPeriodEnd ?? ""}
              onChange={(iso) => set({ reportingPeriodEnd: iso })}
              ariaLabel={t("Reporting period end")}
            />
          </Field>
          <Field
            label={t("Quantity — per-tonne ratio")}
            hint={t(
              "The TOTAL they consumed to produce what they sell you, including material that never reaches the finished good — offcuts, spillage, scrap, burn-off.",
            )}
          >
            <NumberInput
              value={draft.qtyPerTonneOverride}
              min={0}
              unit="t/t"
              onChange={(v) => set({ qtyPerTonneOverride: v })}
              ariaLabel={t("Per-tonne ratio")}
            />
          </Field>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck size={13} strokeWidth={1.5} className="text-black/35" />
          <span className="text-[11px] uppercase tracking-[0.1em] text-black/55">
            {t("Verification evidence")}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Verifier name")}>
            <input
              className={inputClass}
              value={draft.verifierName ?? ""}
              onChange={(e) => set({ verifierName: e.target.value })}
              placeholder={t("SGS Thailand")}
            />
          </Field>
          <Field label={t("Accreditation number")}>
            <input
              className={inputClass}
              value={draft.verifierAccreditationNumber ?? ""}
              onChange={(e) =>
                set({ verifierAccreditationNumber: e.target.value })
              }
              placeholder={t("TH-ACC-001")}
            />
          </Field>
          <Field label={t("Accreditation issuing country")}>
            <Select
              value={draft.verifierAccreditationIssuingCountry ?? ""}
              onChange={(v) => set({ verifierAccreditationIssuingCountry: v })}
              searchable
              options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
              ariaLabel={t("Accreditation issuing country")}
            />
          </Field>
          <Field label={t("Accreditation expiry date")}>
            <DatePicker
              value={draft.verifierAccreditationExpiryDate ?? ""}
              onChange={(iso) => set({ verifierAccreditationExpiryDate: iso })}
              ariaLabel={t("Accreditation expiry date")}
            />
          </Field>
          <Field label={t("Report issue date")}>
            <DatePicker
              value={draft.verificationReportIssueDate ?? ""}
              onChange={(iso) => set({ verificationReportIssueDate: iso })}
              ariaLabel={t("Report issue date")}
            />
          </Field>
          <Field label={t("Sectoral scope")} hint={t("e.g. Iron and steel.")}>
            <input
              className={inputClass}
              value={draft.verificationSectoralScope ?? ""}
              onChange={(e) =>
                set({ verificationSectoralScope: e.target.value })
              }
              placeholder={t("Iron and steel")}
            />
          </Field>
          {/* The one field in this block that is not required, and
              deliberately: a verification report that does not lapse has no
              expiry date, and forcing one would put a made-up date on a
              compliance record. It is here — rather than exporter-only, as it
              was — because the supplier is the party holding the report. */}
          <Field
            label={t("Report expires")}
            optional
            hint={t(
              "When this report itself needs renewing — leave blank if it does not lapse.",
            )}
          >
            <DatePicker
              value={draft.verificationReportExpiresAt ?? ""}
              onChange={(iso) => set({ verificationReportExpiresAt: iso })}
              ariaLabel={t("Report expiry date")}
            />
          </Field>
        </div>
      </section>

      {/* Documents, in the same shape and against the same store as the root
          form's — one place a file behind a figure ever lives. */}
      <section className="mt-4 rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Paperclip size={13} strokeWidth={1.5} className="text-black/35" />
          <span className="text-[11px] uppercase tracking-[0.1em] text-black/55">
            {t("Documents")}
          </span>
        </div>
        <p className="mb-3 text-[12px] leading-relaxed text-black/45">
          {t(
            "The verification report, and anything else that stands behind this figure.",
          )}
        </p>
        <SectionEvidence
          workspaceId={workspaceId}
          keys={evidenceKeys}
          emptyLabel={t(
            "Nothing attached yet — this figure needs something behind it.",
          )}
          openable
          onChange={() => setEvidenceVersion((v) => v + 1)}
        />
      </section>

      <div className="mt-4 flex justify-end border-t border-black/[0.06] pt-4">
        <Button size="sm" variant="secondary" onClick={addUpstream}>
          <Plus size={13} strokeWidth={1.5} />{" "}
          {t("Add an upstream precursor of theirs")}
        </Button>
      </div>

      {children.length > 0 && (
        <div className="mt-3 space-y-3">
          {children.map((c) => (
            <PrecursorNodeForm
              key={c.id}
              workspaceId={workspaceId}
              nodeId={c.id}
              depth={depth + 1}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
