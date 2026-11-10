"use client";

/* Freezing the calculation — the moment "approved" starts pointing at
   something.

   Deliberately placed at the end of internal sign-off rather than as its own
   step: freezing is what sign-off MEANS. Everything above this panel is
   people agreeing; this is the agreement being made durable.

   The approver picker enforces four eyes visibly, but the rule itself lives
   in lib/cbam/freeze.ts and throws there — the UI is a courtesy, not the
   control. */

import * as React from "react";
import { Lock, LockOpen, TriangleAlert, History } from "lucide-react";
import {
  Card,
  Button,
  Eyebrow,
  Chip,
  inputClass,
  cn,
  useSaveState,
  SaveButton,
} from "@/components/ui";
import { Select } from "@/components/controls";
import { toast } from "@/components/toast";
import { displayDate } from "@/lib/cbam/boundary";
import {
  activeSnapshot,
  listSnapshots,
  compareSnapshots,
  freezeCalculation,
  driftedFromSnapshot,
  FourEyesError,
  FrozenError,
  type CalculationSnapshot,
} from "@/lib/cbam/freeze";
import type { ActivityDataset } from "@/lib/cbam/activity";
import type { PrecursorNode } from "@/lib/cbam/precursor-tree";
import type { GoodsCategory } from "@/lib/cbam/engine";
import { useT } from "@/lib/i18n";

export function FreezePanel({
  declarationId,
  dataset,
  precursorTree,
  category,
  preparerId,
  approverOptions,
  signoffComplete,
  onFrozen,
}: {
  declarationId: string;
  dataset: ActivityDataset | null;
  precursorTree: PrecursorNode[];
  category: GoodsCategory;
  preparerId: string;
  approverOptions: { value: string; label: string }[];
  signoffComplete: boolean;
  onFrozen?: (s: CalculationSnapshot) => void;
}) {
  const t = useT();
  const [snapshots, setSnapshots] = React.useState<CalculationSnapshot[]>([]);
  const [approver, setApprover] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [drifted, setDrifted] = React.useState(false);
  const save = useSaveState();

  React.useEffect(() => {
    setSnapshots(listSnapshots(declarationId));
  }, [declarationId]);

  const active = snapshots.length ? snapshots[snapshots.length - 1] : null;

  React.useEffect(() => {
    if (!active || !dataset) return;
    let cancelled = false;
    driftedFromSnapshot(active, dataset, precursorTree, category).then((d) => {
      if (!cancelled) setDrifted(d);
    });
    return () => {
      cancelled = true;
    };
  }, [active, dataset, precursorTree, category]);

  const doFreeze = () => {
    if (!dataset) {
      toast({
        message: "Nothing to freeze",
        detail:
          "Enter activity data first — a snapshot with no inputs proves nothing.",
        tone: "err",
      });
      return;
    }
    save.run(async () => {
      try {
        const snap = await freezeCalculation({
          declarationId,
          dataset,
          precursorTree,
          category,
          preparerId,
          approverId: approver,
          revisionReason: active ? reason : undefined,
        });
        setSnapshots(listSnapshots(declarationId));
        setReason("");
        onFrozen?.(snap);
        toast({
          message: `Calculation frozen — version ${snap.version}`,
          detail: `Inputs are now read-only. Hash ${snap.contentHash.slice(0, 12)}…`,
          tone: "ok",
        });
      } catch (err) {
        const message =
          err instanceof FourEyesError || err instanceof FrozenError
            ? err.message
            : err instanceof Error
              ? err.message
              : "The calculation could not be frozen.";
        toast({ message: "Not frozen", detail: message, tone: "err" });
      }
    }, 0);
  };

  const previous =
    snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;
  const changes = previous && active ? compareSnapshots(previous, active) : [];

  return (
    <Card className={cn("p-5", active && !drifted && "border-[#059669]/25")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl border border-black/10 text-black/55">
            {active ? (
              <Lock size={15} strokeWidth={1.5} />
            ) : (
              <LockOpen size={15} strokeWidth={1.5} />
            )}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] text-black/80">
                {active
                  ? `Frozen — version ${active.version}`
                  : "Calculation not frozen"}
              </span>
              {active && (
                <Chip tone={drifted ? "warn" : "ok"}>
                  {drifted ? "inputs have moved" : "matches inputs"}
                </Chip>
              )}
            </div>
            <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-black/45">
              {active
                ? `Approved by ${active.approverId} on ${displayDate(new Date(active.frozenAt).toISOString())}, effective from ${displayDate(active.effectiveFrom)}. Outputs bind to this snapshot, so what was approved is what gets filed.`
                : "Freezing captures the activity dataset, the precursor tree, the engine version and every output under one hash. After that, changing an input creates a new version with a reason rather than silently moving a signed number."}
            </p>
          </div>
        </div>
      </div>

      {active && (
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <Fact
            label={t("Chargeable")}
            value={`${active.outputs.chargeablePerTonne.toFixed(7)} tCO₂e/t`}
          />
          <Fact
            label={t("Reported")}
            value={`${active.outputs.reportedPerTonne.toFixed(7)} tCO₂e/t`}
          />
          <Fact label={t("Engine")} value={active.engineVersion} />
        </dl>
      )}

      {active && drifted && (
        <p className="mt-4 flex items-start gap-1.5 rounded-xl border border-[#d97706]/30 bg-[#fffbeb] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#b45309]">
          <TriangleAlert
            size={13}
            strokeWidth={1.8}
            className="mt-[2px] flex-none"
          />
          The activity data has changed since this version was approved. The
          filed figures still come from version {active.version} — to make the
          new inputs count, freeze a revision below and say why.
        </p>
      )}

      {snapshots.length > 1 && changes.length > 0 && (
        <div className="mt-4 border-t border-black/[0.06] pt-4">
          <Eyebrow>
            <History
              size={11}
              strokeWidth={1.5}
              className="mr-1 inline-block align-[-1px]"
            />
            Version {previous!.version} → {active!.version}
          </Eyebrow>
          <ul className="mt-2 space-y-1">
            {changes.map((c) => (
              <li
                key={c.field}
                className="font-mono text-[11.5px] text-black/55"
              >
                {c.field}: {c.before.toFixed(6)} →{" "}
                <span className="text-black/80">{c.after.toFixed(6)}</span>
                {c.deltaPct != null &&
                  ` (${c.deltaPct > 0 ? "+" : ""}${c.deltaPct.toFixed(1)}%)`}
              </li>
            ))}
          </ul>
          {active?.revisionReason && (
            <p className="mt-2 text-[12.5px] text-black/50">
              Reason: {active.revisionReason}
            </p>
          )}
        </div>
      )}

      <div className="mt-5 border-t border-black/[0.06] pt-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
          <div>
            <Lbl>Approver — cannot be {preparerId}</Lbl>
            <Select
              value={approver}
              onChange={setApprover}
              placeholder={t("Choose an approver…")}
              options={approverOptions.filter(
                (o) => o.label.toLowerCase() !== preparerId.toLowerCase(),
              )}
              ariaLabel={t("Approver")}
            />
          </div>
          {active && (
            <label className="block">
              <Lbl>{t("Why this version exists")}</Lbl>
              <input
                className={inputClass}
                value={reason}
                placeholder={t(
                  "e.g. August gas invoice arrived and replaced the estimate",
                )}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <SaveButton
            state={save.state}
            onClick={doFreeze}
            disabled={
              !approver ||
              !dataset ||
              (!!active && !reason.trim()) ||
              (!signoffComplete && !active)
            }
            idleLabel={
              active
                ? `Freeze revision — version ${active.version + 1}`
                : "Freeze calculation"
            }
            savedLabel={t("Frozen")}
          />
          {!signoffComplete && !active && (
            <span className="text-[11.5px] text-black/40">
              {t("Complete internal sign-off first.")}
            </span>
          )}
          {!approver && (
            <span className="text-[11.5px] text-black/40">
              {t(
                "Pick an approver — the preparer cannot approve their own figures.",
              )}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.12em] text-black/35">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-[12.5px] text-black/70">{value}</dd>
    </div>
  );
}

function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-black/40">
      {children}
    </span>
  );
}
