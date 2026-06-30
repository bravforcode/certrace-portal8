"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, X, Copy, Check, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Card, PageHeader, Button, Chip, StatusLabel, Stat, Eyebrow, Field, inputClass, cn } from "@/components/ui";
import { toast } from "@/components/toast";
import { DECLARATIONS, SupplierRow, supplierStatusMeta, supplierSlug } from "@/lib/data";

const PAGE_SIZE = 6;

export default function SuppliersPage() {
  // de-dupe across declarations into a directory
  const seed = React.useMemo(() => {
    const map = new Map<string, SupplierRow>();
    DECLARATIONS.forEach((d) => d.suppliers.forEach((s) => map.set(s.name, s)));
    return [...map.values()];
  }, []);

  const [suppliers, setSuppliers] = React.useState<SupplierRow[]>(seed);
  const [query, setQuery] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [page, setPage] = React.useState(1);

  const filtered = suppliers.filter(
    (s) => s.name.toLowerCase().includes(query.toLowerCase()) || s.material.toLowerCase().includes(query.toLowerCase()),
  );
  const onPlatform = suppliers.filter((s) => s.status === "submitted").length;

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  React.useEffect(() => setPage(1), [query]);
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const addSupplier = (name: string, material: string) => {
    setSuppliers((list) => [
      {
        id: `new-${Date.now()}`,
        name,
        ref: `#${Math.floor(1000 + Math.random() * 8999)}`,
        country: "TH",
        material: material || "—",
        progress: 0,
        status: "not_started",
        emissions: null,
        updated: "just now",
        critical: false,
      },
      ...list,
    ]);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Suppliers"
        title="Supplier directory."
        lead="Everyone you collect data from, across every declaration. Suppliers fill a free guided form — no account, no fee — and their verified data carries forward."
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus size={15} strokeWidth={1.5} /> Add supplier
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-5">
          <Stat value={suppliers.length} label="In directory" />
        </Card>
        <Card className="p-5">
          <Stat value={onPlatform} label="Data on platform" />
        </Card>
        <Card className="p-5">
          <Stat value={suppliers.filter((s) => s.critical).length} label="CBAM-critical" />
        </Card>
        <Card className="p-5">
          <Stat value="94%" label="Avg completion" />
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} strokeWidth={1.5} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" />
        <input className={inputClass + " pl-10"} placeholder="Search suppliers…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-[1.6fr_1fr_1fr_0.9fr_auto] gap-3 border-b border-black/[0.06] bg-black/[0.02] px-5 py-2.5 font-mono text-[8px] uppercase tracking-[0.16em] text-black/30">
          <span>Supplier</span>
          <span>Material</span>
          <span>Last data</span>
          <span>Status</span>
          <span />
        </div>
        {pageRows.map((s) => {
          const meta = supplierStatusMeta[s.status];
          return (
            <Link
              key={s.id}
              href={`/suppliers/${supplierSlug(s.name)}`}
              className="grid grid-cols-[1.6fr_1fr_1fr_0.9fr_auto] items-center gap-3 border-b border-black/[0.04] px-5 py-4 transition-colors last:border-0 hover:bg-[#fafaf8]"
            >
              <span className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-black/[0.04] font-mono text-[10px] text-black/45">
                  {s.country}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-black/70">{s.name}</span>
                  <span className="block font-mono text-[11px] text-black/30">{s.ref}</span>
                </span>
              </span>
              <span className="text-[13px] text-black/55">{s.material}</span>
              <span className="font-mono text-[11px] text-black/40">{s.updated}</span>
              <span className="flex items-center gap-2">
                <StatusLabel tone={meta.tone} label={meta.label} glow={s.status === "submitted"} pulse={s.status === "in_progress"} />
                {s.critical && <Chip tone="warn">critical</Chip>}
              </span>
              <ArrowRight size={15} strokeWidth={1.5} className="text-black/25" />
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-black/35">No suppliers match “{query}”.</div>
        )}
      </Card>

      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-black/40">Page {safePage} of {pageCount}</span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
              className="grid h-8 w-8 place-items-center rounded-lg border border-black/10 text-black/50 hover:border-black/25 hover:text-black disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft size={15} strokeWidth={1.5} />
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={cn("grid h-8 min-w-8 place-items-center rounded-lg px-2 font-mono text-[12px] transition-colors", n === safePage ? "bg-[#111] text-white" : "text-black/55 hover:bg-black/[0.05]")}
              >
                {n}
              </button>
            ))}
            <button
              disabled={safePage === pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              aria-label="Next page"
              className="grid h-8 w-8 place-items-center rounded-lg border border-black/10 text-black/50 hover:border-black/25 hover:text-black disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight size={15} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {adding && <AddSupplierModal onClose={() => setAdding(false)} onAdd={addSupplier} />}
    </div>
  );
}

function AddSupplierModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, material: string) => void }) {
  const [name, setName] = React.useState("");
  const [material, setMaterial] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const link = "https://app.certrace.com/s/" + (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "invite") + "-q2";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      /* clipboard may be blocked in sandbox — non-fatal */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const send = () => {
    if (!name.trim()) {
      toast({ message: "Add a supplier name first.", tone: "warn" });
      return;
    }
    onAdd(name.trim(), material.trim());
    toast({ message: `Invite sent to ${name.trim()}.`, detail: "They get a free guided form — no account needed." });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <Card className="relative z-10 w-full max-w-md p-6">
        <div className="flex items-start justify-between">
          <div>
            <Eyebrow>Add supplier</Eyebrow>
            <h2 className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">Invite a supplier.</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-black/35 hover:text-black">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <Field label="Supplier name">
            <input className={inputClass} placeholder="e.g. Thai Special Steel" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Material supplied" hint="What they provide into your steel chain.">
            <input className={inputClass} placeholder="e.g. Steel billet" value={material} onChange={(e) => setMaterial(e.target.value)} />
          </Field>

          <div>
            <span className="mb-2 block text-[11px] uppercase tracking-[0.1em] text-black/55">Or share a guided-form link</span>
            <div className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-black/55">{link}</span>
              <button onClick={copy} className="inline-flex flex-none items-center gap-1 rounded-lg border border-black/10 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.08em] text-black/55 hover:border-black/25 hover:text-black">
                {copied ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={1.5} />} {copied ? "copied" : "copy"}
              </button>
            </div>
          </div>

          <Button className="w-full" onClick={send}>
            Send invite
          </Button>
          <p className="text-center text-[11px] text-black/35">Suppliers are always free and never take a seat.</p>
        </div>
      </Card>
    </div>
  );
}
