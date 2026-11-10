"use client";

/* Linking shipments to a declaration — review, then confirm. Never silently.

   The temptation is to auto-link on date: a shipment inside the period must
   belong to the declaration covering that period. It does not. Periods
   overlap — a quarterly buyer request and an annual CBAM filing cover the
   same weeks — and a shipment absorbed into the wrong one moves tonnes out of
   one buyer's total and into another's, invisibly, with no way to notice
   except by reconciling by hand.

   So the panel proposes and the exporter confirms. And once linked, shipped
   tonnes are checked against what the installation says it produced (V4),
   because more leaving the gate than was made is either an untracked
   production line or a shipment in the wrong period — and both are worth
   knowing before a verifier finds them. */

import * as React from "react";
import Link from "next/link";
import { Ship, Check, TriangleAlert, Link2, Unlink } from "lucide-react";
import { Card, Button, Eyebrow, Chip, cn } from "@/components/ui";
import { toast } from "@/components/toast";
import { displayDate } from "@/lib/cbam/boundary";
import {
  compareShippedToProduced,
  SHIPPED_OVER_PRODUCED_TOLERANCE,
} from "@/lib/annual-production";
import {
  linkShipments,
  unlinkShipments,
  shipmentsFor,
  unlinkedShipmentsFor,
  pendingShipments,
  emissionsByBuyer,
  shipmentProductName,
  shipmentCnCode,
  type Shipment,
} from "@/lib/shipments";
import { chargeableSeeForDate } from "@/lib/cbam/freeze";
import { useT } from "@/lib/i18n";

const fmt = (n: number, dp = 1) =>
  n.toLocaleString("en-US", { maximumFractionDigits: dp });

export function LinkedShipments({
  declaration,
  producedTonnes,
}: {
  declaration: { id: string; periodStart?: string; periodEnd?: string };
  producedTonnes: number | null;
}) {
  const t = useT();
  const [linked, setLinked] = React.useState<Shipment[]>([]);
  const [candidates, setCandidates] = React.useState<Shipment[]>([]);
  const [pending, setPending] = React.useState<Shipment[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [mounted, setMounted] = React.useState(false);

  const refresh = React.useCallback(() => {
    setLinked(shipmentsFor(declaration.id));
    setCandidates(unlinkedShipmentsFor(declaration));
    setPending(pendingShipments());
  }, [declaration]);

  React.useEffect(() => {
    setMounted(true);
    refresh();
  }, [refresh]);

  if (!mounted) return null;

  const shippedTonnes = linked.reduce((a, s) => a + s.quantityTonnes, 0);
  const diff = compareShippedToProduced(producedTonnes, shippedTonnes);

  /* Per-buyer totals read the snapshot valid on each shipment's own date —
     never the latest one. Tonnes with no approved figure for their date show
     as unpriced rather than being counted at zero. */
  const buyers = emissionsByBuyer(linked, (declId, date) =>
    chargeableSeeForDate(declId, date),
  );
  const totalEmbedded = buyers.reduce((a, b) => a + b.embeddedTCO2e, 0);
  const unpriced = buyers.reduce((a, b) => a + b.unpricedTonnes, 0);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const confirmLink = () => {
    if (selected.size === 0) return;
    linkShipments([...selected], declaration.id);
    const n = selected.size;
    setSelected(new Set());
    refresh();
    toast({
      message: `${n} shipment${n === 1 ? "" : "s"} linked`,
      detail: "Buyer totals now include them.",
      tone: "ok",
    });
  };

  const unlink = (id: string) => {
    unlinkShipments([id]);
    refresh();
    toast({
      message: "Shipment unlinked",
      detail: "It returns to the not-yet-attributable list.",
      tone: "info",
    });
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-xl border border-black/10 text-black/55">
            <Ship size={16} strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] text-black/80">
              {t("Linked shipments")}
            </h2>
            <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-black/45">
              {t(
                "What actually left the gate under this declaration. Buyer totals are built from these rows, so nothing is linked without you confirming it.",
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-none flex-col items-end gap-1">
          <Chip>{fmt(shippedTonnes)} t linked</Chip>
          {producedTonnes != null && (
            <span className="font-mono text-[10px] text-black/30">
              of {fmt(producedTonnes)} t produced
            </span>
          )}
        </div>
      </div>

      {/* V4 — shipped ≤ produced × 1.05 */}
      {diff.overshipped && (
        <p className="mt-4 flex items-start gap-1.5 rounded-xl border border-[#d97706]/30 bg-[#fffbeb] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#b45309]">
          <TriangleAlert
            size={13}
            strokeWidth={1.8}
            className="mt-[2px] flex-none"
          />
          <span>
            {fmt(diff.shippedTonnes)} t shipped against{" "}
            {fmt(diff.producedTonnes ?? 0)} t produced —{" "}
            {((diff.ratio ?? 1) * 100).toFixed(0)}% of output. Opening stock
            explains up to{" "}
            {Math.round((SHIPPED_OVER_PRODUCED_TOLERANCE.value - 1) * 100)}%;
            beyond that, either the production quantity is understated or a
            shipment belongs to a different period.
          </span>
        </p>
      )}
      {producedTonnes == null && linked.length > 0 && (
        <p className="mt-4 text-[12.5px] leading-relaxed text-black/45">
          No production quantity entered yet, so shipped-versus-produced cannot
          be checked. Enter it on the{" "}
          <Link
            href={`/declarations/${declaration.id}/activity`}
            className="underline underline-offset-2 hover:text-black"
          >
            {t("activity data")}
          </Link>{" "}
          screen.
        </p>
      )}

      {/* Candidates — proposed, never applied */}
      {candidates.length > 0 && (
        <div className="mt-5 rounded-2xl border border-black/[0.07] bg-[#faf9f7] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Eyebrow>
              {candidates.length} unlinked shipment
              {candidates.length === 1 ? "" : "s"} fall inside this period
            </Eyebrow>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setSelected(new Set(candidates.map((c) => c.id)))
                }
                className="text-[11px] text-black/45 hover:text-black"
              >
                {t("Select all")}
              </button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white"
                disabled={selected.size === 0}
                onClick={confirmLink}
              >
                <Link2 size={13} strokeWidth={1.5} /> Link {selected.size || ""}
              </Button>
            </div>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-black/45">
            {t(
              "Overlapping periods mean a date match is a suggestion, not an answer. Tick the ones that belong here.",
            )}
          </p>
          <div className="mt-3 space-y-1.5">
            {candidates.map((s) => (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={cn(
                  "flex w-full flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  selected.has(s.id)
                    ? "border-black/30 bg-white"
                    : "border-black/[0.07] bg-white hover:border-black/20",
                )}
              >
                <span
                  className={cn(
                    "grid h-4 w-4 flex-none place-items-center rounded border",
                    selected.has(s.id)
                      ? "border-black bg-[#111] text-white"
                      : "border-black/20",
                  )}
                >
                  {selected.has(s.id) && <Check size={11} strokeWidth={2.5} />}
                </span>
                <span className="font-mono text-[11px] text-black/45">
                  {displayDate(s.date)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-black/75">
                  {s.buyer}
                </span>
                <span className="text-[12px] text-black/50">
                  {shipmentProductName(s)}
                </span>
                <span className="font-mono text-[11px] text-black/40">
                  CN {shipmentCnCode(s)}
                </span>
                <span className="font-mono text-[12px] text-black/70">
                  {fmt(s.quantityTonnes)} t
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Linked */}
      {linked.length > 0 && (
        <div className="mt-5">
          <Eyebrow>{t("Linked")}</Eyebrow>
          <div className="mt-2 space-y-1.5">
            {linked.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-black/[0.07] px-3 py-2.5"
              >
                <span className="font-mono text-[11px] text-black/45">
                  {displayDate(s.date)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-black/75">
                  {s.buyer}
                </span>
                <span className="text-[12px] text-black/50">
                  {shipmentProductName(s)}
                </span>
                <span className="font-mono text-[12px] text-black/70">
                  {fmt(s.quantityTonnes)} t
                </span>
                <button
                  onClick={() => unlink(s.id)}
                  aria-label={t("Unlink shipment")}
                  className="flex-none text-black/25 hover:text-[#dc2626]"
                >
                  <Unlink size={14} strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-buyer summary — Formula 5 */}
      {buyers.length > 0 && (
        <div className="mt-6 border-t border-black/[0.06] pt-5">
          <Eyebrow>{t("Embedded emissions by buyer")}</Eyebrow>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="border-b border-black/[0.07] text-[10px] uppercase tracking-[0.12em] text-black/35">
                  <th className="py-2 pr-4 font-normal">{t("Buyer")}</th>
                  <th className="py-2 pr-4 font-normal">{t("Shipments")}</th>
                  <th className="py-2 pr-4 font-normal">{t("Tonnes")}</th>
                  <th className="py-2 font-normal">{t("tCO₂e embedded")}</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((b) => (
                  <tr
                    key={b.buyer}
                    className="border-b border-black/[0.04] last:border-0"
                  >
                    <td className="py-2.5 pr-4 text-[13px] text-black/75">
                      {b.buyer}
                      {b.buyerEori && (
                        <span className="block font-mono text-[10px] text-black/30">
                          EORI {b.buyerEori}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[12px] text-black/55">
                      {b.shipments}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[12px] text-black/55">
                      {fmt(b.tonnes)}
                    </td>
                    <td className="py-2.5 font-mono text-[12px] text-black/80">
                      {b.embeddedTCO2e.toFixed(4)}
                      {b.unpricedTonnes > 0 && (
                        <span className="block text-[10px] text-[#b45309]">
                          {fmt(b.unpricedTonnes)} t not yet priced
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-mono text-[11px] text-black/40">
            total {totalEmbedded.toFixed(4)} tCO₂e
            {unpriced > 0 &&
              ` · ${fmt(unpriced)} t awaiting an approved figure for their date`}
          </p>
          {unpriced > 0 && (
            <p className="mt-2 text-[11.5px] leading-relaxed text-black/45">
              {t(
                "A shipment is priced by the calculation version valid on the day it left. Tonnes shipped before any version was frozen have no approved figure yet — they are shown separately rather than counted as zero.",
              )}
            </p>
          )}
        </div>
      )}

      {/* Pending — visible, excluded, never hidden */}
      {pending.length > 0 && (
        <div className="mt-6 border-t border-black/[0.06] pt-5">
          <Eyebrow>{t("Not yet attributable")}</Eyebrow>
          <p className="mt-2 text-[12.5px] leading-relaxed text-black/45">
            {pending.length} shipment{pending.length === 1 ? "" : "s"} (
            {fmt(pending.reduce((a, s) => a + s.quantityTonnes, 0))} t) belong
            to no declaration yet. They are excluded from every total above — an
            unattributed shipment is a hole in the buyer figures, not an absence
            of one.
          </p>
          <Link
            href="/shipments"
            className="mt-2 inline-block text-[11px] uppercase tracking-[0.1em] text-black/45 hover:text-black"
          >
            {t("Open the shipment log")}
          </Link>
        </div>
      )}

      {linked.length === 0 && candidates.length === 0 && (
        <p className="mt-5 text-[12.5px] text-black/40">
          No shipments recorded in this period.{" "}
          <Link
            href="/shipments"
            className="underline underline-offset-2 hover:text-black"
          >
            {t("Log one")}
          </Link>
          .
        </p>
      )}
    </Card>
  );
}
