"use client";

/* Browser-local invoice fixture. No payment processor, tax-document authority,
   email provider or accounting backend is configured. */

import * as React from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui";
import { Modal } from "@/components/controls";
import { StatusChip } from "@/components/admin/bits";
import { toast } from "@/components/toast";
import { CertraceLogo } from "@/components/logo";
import { useAdminAuth } from "@/lib/admin-auth";
import { getOrg, thb, VAT_RATE, type Invoice } from "@/lib/admin-data";

function dueDate(issuedAt: string) {
  const d = new Date(issuedAt + "T00:00:00");
  d.setDate(d.getDate() + 14);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function invoiceLines(inv: Invoice) {
  const org = getOrg(inv.orgId);
  const subtotal = inv.amount;
  const vat = Math.round(subtotal * VAT_RATE);
  return {
    org,
    description: `${org?.plan} plan — monthly subscription (${inv.period})`,
    seatNote: `Includes ${org?.seats ?? 0} staff seat${(org?.seats ?? 0) === 1 ? "" : "s"}, unlimited declarations`,
    subtotal,
    vat,
    total: subtotal + vat,
    due: dueDate(inv.issuedAt),
  };
}

function printInvoice(inv: Invoice) {
  void inv;
  window.print();
}

export function InvoiceModal({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const { hasPower } = useAdminAuth();
  const canManage = hasPower("manage-billing");

  if (!invoice) return null;
  const L = invoiceLines(invoice);

  return (
    <Modal open onClose={onClose} width="max-w-xl" labelledBy="invoice-title">
      <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] p-6 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <CertraceLogo className="h-[14px] w-auto" />
            <span className="font-pixel text-[10px] uppercase tracking-[0.18em] text-black/35">Illustrative invoice fixture</span>
          </div>
          <h2 id="invoice-title" className="mt-3 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">
            {invoice.id}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StatusChip value={invoice.status} />
            <span className="font-mono text-[11px] text-black/40">issued {invoice.issuedAt} · due {L.due}</span>
          </div>
        </div>
        <button type="button" aria-label="Close invoice" onClick={onClose} className="rounded-lg p-2 text-black/40 transition-colors hover:bg-black/[0.05] hover:text-black">
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 p-6 pb-2 sm:grid-cols-2">
        <div>
          <div className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/35">From</div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-black/65">
            Certrace readiness demo<br />No legal issuer or tax-document authority configured
          </p>
        </div>
        <div>
          <div className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/35">Bill to</div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-black/65">
            {L.org?.name}<br />Thailand<br />
            <span className="font-mono text-[11px] text-black/40">{L.org?.plan} plan · {L.org?.seats} seats</span>
          </p>
        </div>
      </div>

      <div className="px-6">
        <div className="flex items-start justify-between gap-4 border-b border-t border-black/[0.07] py-3.5">
          <div>
            <div className="text-[13px] text-black/75">{L.description}</div>
            <div className="mt-0.5 text-xs text-black/40">{L.seatNote}</div>
          </div>
          <span className="font-mono text-[13px] text-black/75">{thb(L.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between py-2 pt-3 text-[13px] text-black/55">
          <span>Subtotal</span><span className="font-mono">{thb(L.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between py-2 text-[13px] text-black/55">
          <span>VAT (7%)</span><span className="font-mono">{thb(L.vat)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-black/15 py-3 text-[15px] text-[#111]">
          <span className="font-medium">Total due</span>
          <span className="font-[family-name:var(--font-plex)] text-xl font-light">{thb(L.total)}</span>
        </div>
        <p className="pb-1 text-xs text-black/35">Illustrative THB figures only. This is not a legal invoice, payment request, or accounting record.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 p-6 pt-4">
        <Button size="sm" variant="ghost" onClick={() => printInvoice(invoice)}>
          <Printer size={14} strokeWidth={1.5} /> Print / PDF
        </Button>
        {canManage && invoice.status !== "paid" && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => toast({ message: "Billing action unavailable", detail: "No payment, accounting, email, or audit backend is configured.", tone: "info" })}
          >
            Billing backend required
          </Button>
        )}
        {!canManage && (
          <span className="text-xs text-black/35">Read-only — billing actions need the manage-billing power.</span>
        )}
      </div>
    </Modal>
  );
}
