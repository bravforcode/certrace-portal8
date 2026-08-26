"use client";

/* ════════════════════════════════════════════════════════════
   SUPPLIERS — the companies, with their plants underneath

   THE PAGE NOW MATCHES THE MODEL. It used to list rows derived from
   declarations: a "supplier" was a name plus a material plus a status, with
   nothing joining it to the installations a workspace is actually scoped to.
   So a mill running two plants appeared once, and adding its second plant on
   the workspace flow produced an unrelated site that never showed up here.

   A supplier is now a record (lib/supplier-companies.ts) and installations
   hang off it. This page lists the companies and how many plants each runs;
   the company's own page adds plants and shows the goods each one makes.

   REMOVED: the CBAM-critical tag and its counter. It was a boolean on a
   fixture with no rule behind it — nothing set it, nothing acted on it, and a
   badge reading "critical" beside a supplier who is not being treated any
   differently is a warning that trains people to ignore warnings.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Building2, Calendar, ChevronLeft, ChevronRight, Factory, Plus, Search, TriangleAlert } from "lucide-react";
import { Card, FilterChip, PageHeader, Button, Stat, inputClass, cn } from "@/components/ui";
import { SupplierModal } from "@/components/workspace/supplier-form";
import { LinkStatusChip, ValueTypeBadge } from "@/components/precursor/status-chips";
import { listSupplierRows } from "@/lib/supplier-directory";
import { installationsForSupplier } from "@/lib/installations";
import { listSupplierCompanies, seedSupplierCompaniesFrom, type SupplierCompany } from "@/lib/supplier-companies";
import { listWorkspaces } from "@/lib/workspace";
import { allPrecursorSuppliers, hasCertraceAccount, type PrecursorSupplierRow } from "@/lib/precursor-suppliers";
import { precursorSeeDeadlineFor, type Deadline } from "@/lib/cbam/precursor-deadlines";
import { getCountry } from "@/lib/config";
import { useT } from "@/lib/i18n";

const PAGE_SIZE = 8;

type Row = {
  supplier: SupplierCompany;
  installations: number;
  goods: number;
};

function build(): Row[] {
  // Fold the old directory in once, so an account that has been used does not
  // open on an empty page. See seedSupplierCompaniesFrom().
  const companies = seedSupplierCompaniesFrom(listSupplierRows().map((s) => ({ company: s.name, country: s.country })));
  const workspaces = listWorkspaces();
  return companies.map((supplier) => ({
    supplier,
    installations: installationsForSupplier(supplier.id).length,
    goods: workspaces.filter((w) => w.supplierId === supplier.id).length,
  }));
}

const DEADLINE_STYLE: Record<Deadline["status"], string> = {
  on_track: "border-black/[0.08] bg-black/[0.02] text-black/45",
  due_soon: "border-[rgba(180,83,9,0.18)] bg-[#fffbeb] text-[#b45309]",
  overdue: "border-[rgba(220,38,38,0.18)] bg-[#fef2f2] text-[#dc2626]",
};

function buildPrecursorRows(): PrecursorSupplierRow[] {
  return allPrecursorSuppliers(listWorkspaces());
}

type View = "all" | "data" | "precursor";

export default function SuppliersPage() {
  const t = useT();
  const [rows, setRows] = React.useState<Row[] | null>(null);
  const [precursorRows, setPrecursorRows] = React.useState<PrecursorSupplierRow[] | null>(null);
  const [query, setQuery] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [view, setView] = React.useState<View>("all");

  const reload = React.useCallback(() => {
    setRows(build());
    setPrecursorRows(buildPrecursorRows());
  }, []);
  React.useEffect(() => reload(), [reload]);

  const all = rows ?? [];

  const filtered = all.filter((r) => r.supplier.name.toLowerCase().includes(query.trim().toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  React.useEffect(() => setPage(1), [query]);
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const withoutPlants = all.filter((r) => r.installations === 0).length;

  const allPrecursor = precursorRows ?? [];
  const filteredPrecursor = allPrecursor.filter(
    (r) => r.supplier.name.toLowerCase().includes(query.trim().toLowerCase()) || r.supplier.precursorName.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const withAccount = allPrecursor.filter((r) => hasCertraceAccount(r.supplier)).length;

  const showData = view === "all" || view === "data";
  const showPrecursor = view === "all" || view === "precursor";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("Suppliers")}
        title={t("Who produces your goods.")}
        lead={t("Every company you collect data from, and the plants each of them runs. A supplier answers through a link each month — no account, no seat, no fee.")}
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus size={15} strokeWidth={1.5} /> {t("Add supplier")}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {/* NO CAP, ON ANY TIER. This used to read "12/50 · Standard plan cap"
            and warn at the line. Suppliers are unlimited and free on every
            plan now — the meter is CN codes — so a cap here would price the
            exporter for the shape of their supply chain. */}
        <Card className="p-5">
          <Stat value={all.length} label={t("Suppliers")} sub={t("free and unlimited on every plan")} />
        </Card>
        <Card className="p-5">
          <Stat value={all.reduce((a, r) => a + r.installations, 0)} label={t("Installations")} sub={t("across every supplier")} />
        </Card>
        <Card className="p-5">
          <Stat value={all.reduce((a, r) => a + r.goods, 0)} label={t("Goods in verification")} sub={t("workspaces on their plants")} />
        </Card>
      </div>

      {/* A supplier with no plant cannot be asked for anything: a workspace is
          scoped to an installation, so there is nothing to attach a month to. */}
      {withoutPlants > 0 && (
        <Card warm className="flex items-start gap-3 p-5">
          <TriangleAlert size={17} strokeWidth={1.5} className="mt-0.5 flex-none text-black/55" />
          <p className="text-[13px] leading-relaxed text-black/60">
            <strong className="font-medium text-[#111]">
              {withoutPlants === 1
                ? t("1 supplier has no installation recorded.")
                : t("{count} suppliers have no installation recorded.", { count: withoutPlants })}
            </strong>{" "}
            {t("A workspace is scoped to a plant, so until one is added there is nothing to ask them for. Open a supplier and add the plant that makes your good.")}
          </p>
        </Card>
      )}

      {/* §3 — the same underlying records, two entry points. "Data suppliers"
          is the SupplierCompany list above, unchanged; "Precursor suppliers"
          is the PrecursorSupplier records the Precursors tab already keeps,
          surfaced here rather than re-modelled. */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={view === "all"} onClick={() => setView("all")}>
          {t("All")} ({all.length + allPrecursor.length})
        </FilterChip>
        <FilterChip active={view === "data"} onClick={() => setView("data")}>
          {t("Data suppliers")} ({all.length})
        </FilterChip>
        <FilterChip active={view === "precursor"} onClick={() => setView("precursor")}>
          {t("Precursor suppliers")} ({allPrecursor.length})
        </FilterChip>
      </div>

      {showPrecursor && allPrecursor.length > 0 && (
        <p className="text-[12.5px] text-black/45">
          <span className="font-medium text-black/70">
            {withAccount} of {allPrecursor.length}
          </span>{" "}
          {t("precursor suppliers have a Certrace account")} — {t("saved on their own device after a submission, not a real login.")}
        </p>
      )}

      <div className="relative max-w-sm">
        <Search size={15} strokeWidth={1.5} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" />
        <input className={inputClass + " pl-10"} data-lock="allow" placeholder={t("Search suppliers…")} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {showData && (
      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-[1.8fr_1fr_1fr_auto] gap-3 border-b border-black/[0.06] bg-black/[0.02] px-5 py-2.5 font-mono text-[8px] uppercase tracking-[0.16em] text-black/30">
          <span>{t("Supplier")}</span>
          <span>{t("Installations")}</span>
          <span>{t("Goods")}</span>
          <span />
        </div>
        {rows === null ? null : pageRows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-black/35">
            {query ? t("No suppliers match “{query}”.", { query }) : t("No suppliers yet. Add the first company you buy from.")}
          </div>
        ) : (
          pageRows.map(({ supplier, installations, goods }) => (
            <Link
              key={supplier.id}
              href={`/suppliers/${supplier.id}`}
              className="grid grid-cols-[1.8fr_1fr_1fr_auto] items-center gap-3 border-b border-black/[0.04] px-5 py-4 transition-colors last:border-0 hover:bg-[#fafaf8]"
            >
              <span className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-black/[0.04] font-mono text-[10px] text-black/45">
                  {supplier.country || "—"}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-black/70">{supplier.name}</span>
                  <span className="block truncate text-[11px] text-black/35">
                    {getCountry(supplier.country)?.name ?? supplier.country}
                    {supplier.contactEmail ? ` · ${supplier.contactEmail}` : ""}
                  </span>
                </span>
              </span>
              <span className={cn("flex items-center gap-1.5 text-[13px]", installations === 0 ? "text-[#b45309]" : "text-black/55")}>
                <Factory size={13} strokeWidth={1.5} className="flex-none opacity-50" />
                {installations === 0 ? t("none yet") : installations}
              </span>
              <span className="flex items-center gap-1.5 text-[13px] text-black/55">
                <Building2 size={13} strokeWidth={1.5} className="flex-none opacity-50" />
                {goods}
              </span>
              <ArrowRight size={15} strokeWidth={1.5} className="text-black/25" />
            </Link>
          ))
        )}
      </Card>
      )}

      {showData && pageCount > 1 && (
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-black/40">{t("Page {page} of {total}", { page: safePage, total: pageCount })}</span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label={t("Previous page")}
              className="grid h-8 w-8 place-items-center rounded-lg border border-black/10 text-black/50 hover:border-black/25 hover:text-black disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft size={15} strokeWidth={1.5} />
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={cn(
                  "grid h-8 min-w-8 place-items-center rounded-lg px-2 font-mono text-[12px] transition-colors",
                  n === safePage ? "bg-[#111] text-white" : "text-black/55 hover:bg-black/[0.05]",
                )}
              >
                {n}
              </button>
            ))}
            <button
              disabled={safePage === pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              aria-label={t("Next page")}
              className="grid h-8 w-8 place-items-center rounded-lg border border-black/10 text-black/50 hover:border-black/25 hover:text-black disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight size={15} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {showPrecursor && (
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-[1.6fr_0.8fr_1.3fr_1fr_1fr] gap-3 border-b border-black/[0.06] bg-black/[0.02] px-5 py-2.5 font-mono text-[8px] uppercase tracking-[0.16em] text-black/30">
            <span>{t("Company")}</span>
            <span>{t("CN code")}</span>
            <span>{t("Workspace · period")}</span>
            <span>{t("Status")}</span>
            <span>{t("SEE & verification due")}</span>
          </div>
          {precursorRows === null ? null : filteredPrecursor.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-black/35">
              {query ? t("No precursor suppliers match “{query}”.", { query }) : t("No precursor suppliers yet — they are added from a workspace's Supply Chain — Precursor Tree.")}
            </div>
          ) : (
            filteredPrecursor.map(({ supplier, workspace }) => {
              const deadline = precursorSeeDeadlineFor(workspace);
              return (
                <Link
                  key={`${workspace.id}-${supplier.id}`}
                  href={`/workspaces/${workspace.id}/tree`}
                  className="grid grid-cols-[1.6fr_0.8fr_1.3fr_1fr_1fr] items-center gap-3 border-b border-black/[0.04] px-5 py-4 transition-colors last:border-0 hover:bg-[#fafaf8]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-black/70">{supplier.name || supplier.precursorName || t("Unnamed supplier")}</span>
                    <span className="block truncate text-[11px] text-black/35">{supplier.precursorName || "—"}</span>
                  </span>
                  <span className="truncate font-mono text-[12px] text-black/50">{supplier.cnCode || "—"}</span>
                  <span className="min-w-0 truncate text-[12.5px] text-black/55">
                    {workspace.productName} · {workspace.year}
                  </span>
                  <span className="flex flex-wrap items-center gap-1">
                    <LinkStatusChip node={supplier} />
                    <ValueTypeBadge node={supplier} />
                  </span>
                  <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em]", DEADLINE_STYLE[deadline.status])}>
                    <Calendar size={11} strokeWidth={1.5} />
                    {deadline.status === "overdue" ? `${Math.abs(deadline.daysUntilDue)}d overdue` : deadline.status === "due_soon" ? `due in ${deadline.daysUntilDue}d` : "on track"}
                  </span>
                </Link>
              );
            })
          )}
        </Card>
      )}

      {/* Creating a supplier lands ON THAT SUPPLIER'S PAGE rather than back on
          the list. The next thing to do is always to add their plant, and that
          button is there — dropping the reader back onto a directory row makes
          them find the company they just created in order to continue. */}
      <SupplierModal
        open={adding}
        onClose={() => setAdding(false)}
        onSaved={(s) => {
          setRows(build());
          window.location.href = `/suppliers/${s.id}`;
        }}
      />
    </div>
  );
}
