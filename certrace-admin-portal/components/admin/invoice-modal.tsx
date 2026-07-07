"use client";

/* Invoice document view — opened by clicking any invoice row (Billing page,
   account detail). Renders the full tax invoice in THB with Thai VAT, plus the
   billing actions (mark paid / dunning reminder / print) gated by manage-billing. */

import * as React from "react";
import { Banknote, Printer, Send, X } from "lucide-react";
import { Button, cn } from "@/components/ui";
import { Modal } from "@/components/controls";
import { StatusChip } from "@/components/admin/bits";
import { toast } from "@/components/toast";
import { CertraceLogo } from "@/components/logo";
import { useAdminAuth } from "@/lib/admin-auth";
import { markInvoicePaid, sendInvoiceReminder } from "@/lib/admin-store";
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
  const L = invoiceLines(inv);
  const w = window.open("", "_blank", "width=760,height=920");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>${inv.id} — Certrace</title><style>
    body{font-family:Georgia,serif;color:#1a1a1a;max-width:640px;margin:48px auto;padding:0 24px}
    .mono{font-family:"Courier New",monospace}
    h1{font-size:15px;letter-spacing:.2em;text-transform:uppercase;margin:0}
    table{width:100%;border-collapse:collapse;margin-top:24px}
    td,th{padding:10px 0;border-bottom:1px solid #e5e5e5;text-align:left;font-size:14px}
    td:last-child,th:last-child{text-align:right}
    .tot td{border-bottom:none;padding:6px 0}
    .grand td{font-weight:bold;font-size:16px;border-top:2px solid #1a1a1a;padding-top:12px}
    .muted{color:#777;font-size:12px}
  </style></head><body>
    <h1>Certrace — Tax Invoice</h1>
    <p class="mono muted">${inv.id} · issued ${inv.issuedAt} · due ${L.due} · status: ${inv.status}</p>
    <p><strong>From</strong><br/>Certrace Co., Ltd.<br/>88 Sukhumvit Road, Khlong Toei, Bangkok 10110, Thailand<br/>Tax ID 0-1055-66123-45-6</p>
    <p><strong>Bill to</strong><br/>${L.org?.name ?? inv.orgId}<br/>Thailand</p>
    <table>
      <tr><th>Description</th><th>Amount</th></tr>
      <tr><td>${L.description}<br/><span class="muted">${L.seatNote}</span></td><td class="mono">${thb(L.subtotal)}</td></tr>
      <tr class="tot"><td>Subtotal</td><td class="mono">${thb(L.subtotal)}</td></tr>
      <tr class="tot"><td>VAT (7%)</td><td class="mono">${thb(L.vat)}</td></tr>
      <tr class="tot grand"><td>Total due</td><td class="mono">${thb(L.total)}</td></tr>
    </table>
    <p class="muted">All amounts in Thai baht (THB). Payment due within 14 days of issue.</p>
    <script>window.print()</script>
  </body></html>`);
  w.document.close();
}

export function InvoiceModal({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const { user, hasPower } = useAdminAuth();
  const canManage = hasPower("manage-billing");

  if (!invoice) return null;
  const L = invoiceLines(invoice);

  return (
    <Modal open onClose={onClose} width="max-w-xl" labelledBy="invoice-title">
      <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] p-6 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <CertraceLogo className="h-[14px] w-auto" />
            <span className="font-pixel text-[10px] uppercase tracking-[0.18em] text-black/35">Tax invoice</span>
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
            Certrace Co., Ltd.<br />88 Sukhumvit Road, Khlong Toei<br />Bangkok 10110, Thailand<br />
            <span className="font-mono text-[11px] text-black/40">Tax ID 0-1055-66123-45-6</span>
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
        <p className="pb-1 text-xs text-black/35">All amounts in Thai baht (THB). Payment due within 14 days of issue.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 p-6 pt-4">
        <Button size="sm" variant="ghost" onClick={() => printInvoice(invoice)}>
          <Printer size={14} strokeWidth={1.5} /> Print / PDF
        </Button>
        <div className={cn("flex flex-wrap items-center gap-2", !canManage && "hidden")}>
          {invoice.status !== "paid" && user && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  sendInvoiceReminder(user, invoice.id, L.org?.name ?? invoice.orgId);
                  toast({ message: `Reminder sent to ${L.org?.name}`, detail: `${invoice.id} · ${thb(L.total)} outstanding — logged to the audit trail.`, tone: "info" });
                }}
              >
                <Send size={13} strokeWidth={1.5} /> Send reminder
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  markInvoicePaid(user, invoice.id);
                  toast({ message: `${invoice.id} marked as paid`, detail: `${thb(L.total)} · recorded to the audit trail.` });
                }}
              >
                <Banknote size={14} strokeWidth={1.5} /> Mark as paid
              </Button>
            </>
          )}
        </div>
        {!canManage && (
          <span className="text-xs text-black/35">Read-only — billing actions need the manage-billing power.</span>
        )}
      </div>
    </Modal>
  );
}
