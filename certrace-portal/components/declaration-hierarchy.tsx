"use client";

/* ════════════════════════════════════════════════════════════
   THE DECLARATION, AS A HIERARCHY

   Buyer at the top, because a declaration with no named buyer and no EORI
   cannot reach anyone — every number below it is work that goes nowhere.

   Then the annual reports, grouped by supplier, because a declaration is not
   one document: it fans out into one report per SUPPLIER × PRODUCT, each with
   its own methodology and its own twelve months. Three suppliers making two
   products each is six reports. An exporter who thinks they are filling in "a
   declaration" finds that out in October; this screen says it on day one.

   Each report opens the verification workspace — the same six tabs, not a
   copy of them.

   WHAT THIS SCREEN IS FOR, AND WHAT IT IS NOT FOR. It is a dispatch board.
   The realistic use is: create the declaration, see who owes what, press
   remind, close the tab. Almost nobody will walk down into a workspace from
   here, and the design assumes that — the detail is reachable but the surface
   is built for the ten-second visit.

   That is also why Suppliers and Reports remain top-level tabs in the left
   nav rather than being buried in here.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Factory,
  Link2,
  Mail,
  Package,
  ShieldCheck,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { Button, Card, EmptyState, Modal, Stat, TagBadge, cn } from "@/components/ui";
import { DotStrip, StateChip } from "@/components/workspace/chrome";
import { ProductPicker } from "@/components/workspace/product-picker";
import { toast } from "@/components/toast";
import { apiConfigured, createSmartLink } from "@/lib/api";
import { lastReminderAt, loadExporterState, remindSupplier } from "@/lib/exporter-review";
import { COUNTRIES, getCatalogProduct } from "@/lib/config";
import type { Declaration } from "@/lib/data";
import {
  annualReportsFor,
  groupBySupplier,
  openReport,
  reportStatus,
  rollup,
  type AnnualReportStatus,
  type SupplierGroup,
} from "@/lib/declaration-reports";
import { CADENCE_LABEL, OWNER_SHORT, RESPONSIBILITY, SUPPLIER_TABS } from "@/lib/responsibility";
import { TAB_LABEL } from "@/lib/readiness";
import { useT } from "@/lib/i18n";

const countryName = (code: string) => COUNTRIES.find((c) => c.code === code)?.name ?? code;

function ago(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ── The buyer, at the top ──────────────────────────────────── */
function BuyerCard({ declaration }: { declaration: Declaration }) {
  const t = useT();
  const buyer = declaration.buyer;
  return (
    <Card className={cn("p-5 sm:p-6", !buyer && "border-[#fde68a] bg-[#fffbeb]")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl bg-[#f0eee8] text-black/50">
            <Building2 size={17} strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.1em] text-black/40">{t("Filed for")}</div>
            {buyer ? (
              <>
                <div className="mt-1 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">{buyer.name}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11.5px] text-black/45">
                  <span>EORI {buyer.eori}</span>
                  <span className="inline-flex items-center gap-1">
                    <Mail size={11} strokeWidth={1.5} /> {buyer.email}
                  </span>
                  {buyer.contact && <span>{buyer.contact}</span>}
                </div>
              </>
            ) : (
              <>
                <div className="mt-1 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#78350f]">{t("No buyer named")}</div>
                <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-[#78350f]/80">
                  {t("The EU importer's Authorised CBAM Declarant is the party that actually files with the Registry. Until this declaration names one, with an EORI, everything collected below it has nowhere to go.")}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-none flex-col items-start gap-2 sm:items-end">
          <TagBadge tone="muted">{declaration.period}</TagBadge>
          <span className="text-[11.5px] text-black/40">Due {declaration.due}</span>
        </div>
      </div>
    </Card>
  );
}

/* ── One annual report ──────────────────────────────────────── */
function ReportRow({ status, onOpen, onResolve }: { status: AnnualReportStatus; onOpen: () => void; onResolve: (productId: string) => void }) {
  const t = useT();
  const { report } = status;
  const started = Boolean(report.workspace);
  const [picking, setPicking] = React.useState(false);

  /* An input supplier — scrap, electricity — has no annual report and is not a
     gap. It is shown, rather than filtered out, because a supplier who is on
     the declaration and absent from this list looks forgotten; and it is shown
     greyed, with the reason, so nobody goes looking for its missing months. */
  if (report.inputKind) {
    return (
      <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-black/[0.06] bg-[#fafaf8] px-4 py-3">
        <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg bg-black/[0.04] text-black/35">
          <Zap size={15} strokeWidth={1.5} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] text-black/60">{report.productName}</span>
          <span className="mt-0.5 block text-[11.5px] leading-relaxed text-black/45">{status.subtitle}</span>
        </span>
        <TagBadge tone="muted">{t("Input — no report")}</TagBadge>
      </div>
    );
  }

  /* A row whose material never mapped to a CN code cannot open a workspace —
     there is no good to scope it to. Rather than a dead row, it offers the
     catalogue: this is the one place the exporter can supply the fact the
     legacy declaration never recorded. */
  if (report.unresolved) {
    return (
      <>
        <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3">
          <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg bg-white text-[#dc2626]">
            <TriangleAlert size={15} strokeWidth={1.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] text-black/85">{report.productName}</span>
            <span className="mt-0.5 block text-[11.5px] text-[#991b1b]">{status.subtitle}</span>
          </span>
          <Button size="sm" variant="secondary" onClick={() => setPicking(true)}>
            {t("Choose the good")}
          </Button>
        </div>

        <Modal
          open={picking}
          onClose={() => setPicking(false)}
          eyebrow={report.supplierName}
          title={t("Which CBAM good does this supplier make for you?")}
          lead={t("This declaration recorded a material name but never a CN code. Pick the good and the annual report can be created.")}
          width="max-w-2xl"
        >
          <ProductPicker
            value=""
            onChange={(id) => {
              setPicking(false);
              onResolve(id);
            }}
          />
        </Modal>
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-3 text-left transition-colors",
        started ? "border-black/[0.08] bg-white hover:border-black/25" : "border-dashed border-black/15 bg-[#fafaf8] hover:border-black/30",
      )}
    >
      <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg bg-[#f0eee8] text-black/45">
        <Package size={15} strokeWidth={1.5} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] text-black/85">{report.productName}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="rounded bg-black/[0.05] px-1.5 py-0.5 font-mono text-[10.5px] text-black/55">CN {report.cnCode || "—"}</span>
          <span className="text-[11.5px] text-black/45">{status.subtitle}</span>
        </span>
      </span>

      <span className="flex flex-none items-center gap-3">
        {started && <DotStrip states={status.dots} />}
        <StateChip state={status.overall} />
        <ArrowRight size={15} strokeWidth={1.5} className="text-black/25 transition-colors group-hover:text-black/60" />
      </span>
    </button>
  );
}

/* ── One supplier and everything they owe ───────────────────── */
function SupplierBlock({
  declId,
  group,
  onOpenReport,
  onResolve,
  onRemind,
  lastReminded,
}: {
  declId: string;
  group: SupplierGroup;
  onOpenReport: (s: AnnualReportStatus) => void;
  onResolve: (s: AnnualReportStatus, productId: string) => void;
  onRemind: () => void;
  lastReminded: number | null;
}) {
  const [open, setOpen] = React.useState(true);
  const [linking, setLinking] = React.useState(false);
  const [linked, setLinked] = React.useState(false);

  /* Mint THIS supplier's Smart Link and copy it. The server is the only issuer
     (32 random bytes, stored mapping, expiry) — so this is a call, not a token
     built in the browser. The url it returns is the /s/<token> the supplier
     opens to reach their own slice of this declaration and its saved state. */
  const copyLink = async () => {
    setLinking(true);
    try {
      const link = await createSmartLink(declId, { supplierId: group.supplierId });
      if (typeof navigator !== "undefined" && navigator.clipboard) await navigator.clipboard.writeText(link.url);
      setLinked(true);
      setTimeout(() => setLinked(false), 2000);
      toast({ message: `Smart Link ready for ${group.supplierName}`, detail: "Copied to your clipboard — paste it wherever you reach them.", tone: "ok" });
    } catch {
      toast({ message: "Couldn't create the link", detail: "Check your connection and try again.", tone: "err" });
    } finally {
      setLinking(false);
    }
  };

  // Reports only. A supplier who provides nothing but scrap owes nothing, and
  // a "send reminder" button beside their name is a request for data that does
  // not exist.
  const reports = group.statuses.filter((s) => !s.report.inputKind);
  const inputOnly = reports.length === 0;
  const monthsOwed = reports.reduce((a, s) => a + Math.max(0, 12 - s.monthsSubmitted), 0);
  const anyStarted = reports.some((s) => s.report.workspace);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] px-5 py-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={open}
        >
          <span className="flex-none text-black/30">{open ? <ChevronDown size={15} strokeWidth={1.5} /> : <ChevronRight size={15} strokeWidth={1.5} />}</span>
          <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-[#f0eee8] text-black/45">
            <Factory size={15} strokeWidth={1.5} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[14.5px] text-black/85">{group.supplierName}</span>
            <span className="block text-[11.5px] text-black/45">
              {group.selfSupplied ? "Your own installation — nobody to chase" : countryName(group.supplierCountry)}
              {inputOnly
                ? " · supplies an input, not a CBAM good"
                : ` · ${reports.length} report${reports.length === 1 ? "" : "s"}${
                    monthsOwed > 0 ? ` · ${monthsOwed} month${monthsOwed === 1 ? "" : "s"} outstanding` : " · every month in"
                  }`}
            </span>
          </span>
        </button>

        {/* No reminder for self-supply (nobody on the other end) and none for
            an input-only supplier (nothing owed). A disabled button in either
            case would imply there was something to ask for. */}
        {!group.selfSupplied && !inputOnly && (
          <span className="flex flex-none items-center gap-2">
            {lastReminded && <span className="text-[11px] text-black/35">Reminded {ago(lastReminded)}</span>}
            {apiConfigured() && (
              <Button size="sm" variant="secondary" onClick={copyLink} disabled={linking}>
                {linked ? <Check size={13} strokeWidth={2} /> : <Link2 size={13} strokeWidth={1.5} />} {linked ? "Copied" : "Copy link"}
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={onRemind} disabled={monthsOwed === 0 && anyStarted}>
              <Bell size={13} strokeWidth={1.5} /> {monthsOwed === 0 && anyStarted ? "Nothing owed" : "Send reminder"}
            </Button>
          </span>
        )}
      </div>

      {open && (
        <div className="space-y-2 p-4">
          {group.statuses.map((s) => (
            <ReportRow key={s.report.key} status={s} onOpen={() => onOpenReport(s)} onResolve={(pid) => onResolve(s, pid)} />
          ))}
        </div>
      )}
    </Card>
  );
}

/* ── What each supplier is actually being asked for ─────────── */
function CadenceLegend() {
  const t = useT();
  return (
    <Card warm className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck size={15} strokeWidth={1.5} className="text-black/40" />
        <span className="text-[11px] uppercase tracking-[0.1em] text-black/50">{t("What every report asks for, and from whom")}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(["mmd", "monthly", "precursors", "evidence"] as const).map((tab) => {
          const r = RESPONSIBILITY[tab];
          return (
            <div key={tab} className="rounded-xl border border-black/[0.07] bg-white p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] text-black/80">{t(TAB_LABEL[tab])}</span>
                <TagBadge tone={r.owner === "supplier" ? "warn" : "info"}>{OWNER_SHORT[r.owner]}</TagBadge>
              </div>
              <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-black/35">{t(CADENCE_LABEL[r.cadence])}</div>
              <p className="mt-2 text-[11.5px] leading-relaxed text-black/50">{r.what}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11.5px] leading-relaxed text-black/45">
        The three the supplier owns — {SUPPLIER_TABS.map((t) => TAB_LABEL[t]).join(", ")} — are what the reminder above is about. The annual
        evidence scope is yours, and it does not wait on anybody.
      </p>
    </Card>
  );
}

/* ── The screen ─────────────────────────────────────────────── */
export function DeclarationHierarchy({
  declaration,
  onOpenFullWorkflow,
}: {
  declaration: Declaration;
  onOpenFullWorkflow?: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const [statuses, setStatuses] = React.useState<AnnualReportStatus[] | null>(null);
  const [reminders, setReminders] = React.useState<Record<string, number | null>>({});

  const reload = React.useCallback(() => {
    const rows = annualReportsFor(declaration).map(reportStatus);
    setStatuses(rows);
    const state = loadExporterState(declaration.id);
    const map: Record<string, number | null> = {};
    for (const r of rows) map[r.report.supplierId] = lastReminderAt(state, r.report.supplierId);
    setReminders(map);
  }, [declaration]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  const groups = React.useMemo(() => (statuses ? groupBySupplier(statuses) : []), [statuses]);
  const roll = React.useMemo(() => (statuses ? rollup(statuses) : null), [statuses]);

  const open = (s: AnnualReportStatus) => {
    // Creates the workspace on first open — see "why creation is lazy" in
    // lib/declaration-reports.ts.
    const ws = openReport(declaration, s.report);
    router.push(`/workspaces/${ws.id}`);
  };

  /* Resolving an unmapped material creates the workspace immediately and goes
     there. The exporter has just answered the only question that was blocking
     it, and bouncing them back to the list to press the row again would be a
     second click for no new information. */
  const resolve = (s: AnnualReportStatus, productId: string) => {
    const product = getCatalogProduct(productId);
    const ws = openReport(declaration, {
      ...s.report,
      productId,
      productName: product?.name ?? productId,
      cnCode: product?.cnCode ?? "",
      unresolved: false,
      workspace: null,
    });
    router.push(`/workspaces/${ws.id}`);
  };

  const remind = (group: SupplierGroup) => {
    remindSupplier(declaration.id, group.supplierId);
    reload();
    const reports = group.statuses.filter((s) => !s.report.inputKind);
    const owed = reports.reduce((a, s) => a + Math.max(0, 12 - s.monthsSubmitted), 0);
    toast({
      message: `Reminder sent to ${group.supplierName}`,
      detail: `${owed} month${owed === 1 ? "" : "s"} of readings outstanding across ${reports.length} report${reports.length === 1 ? "" : "s"}.`,
      tone: "ok",
    });
  };

  return (
    <div className="space-y-5">
      <BuyerCard declaration={declaration} />

      {roll && roll.total > 0 && (
        <Card className="p-5 sm:p-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Stat value={roll.total} label={t("Annual reports")} sub={`${groups.length} supplier${groups.length === 1 ? "" : "s"}`} />
            <Stat value={roll.complete} label={t("Verification-ready")} sub={`${roll.percentComplete}% of reports`} />
            <Stat value={roll.monthsOutstanding} label={t("Months outstanding")} sub={t("across every report")} />
            <Stat
              value={roll.blocked}
              label={t("Blocked")}
              sub={roll.blocked > 0 ? "would fail verification today" : "nothing blocking"}
            />
          </div>

          {roll.notStarted > 0 && (
            <p className="mt-5 flex items-start gap-2 rounded-xl bg-[#fffbeb] px-4 py-3 text-[12.5px] leading-relaxed text-[#78350f]">
              <TriangleAlert size={14} strokeWidth={1.5} className="mt-0.5 flex-none" />
              {roll.notStarted} of {roll.total} reports have not been started. Opening one creates its reporting year and gives you something to send a
              supplier — nothing is collected until that happens.
            </p>
          )}
        </Card>
      )}

      {statuses === null ? null : statuses.length === 0 ? (
        <EmptyState
          icon={<Package size={26} strokeWidth={1.25} />}
          title={t("No annual reports yet")}
          body={t("A declaration fans out into one report per supplier × product. This one has no supplier-and-product pairs recorded, so there is nothing to collect against — add them in the declaration's own setup and they will appear here.")}
          action={
            onOpenFullWorkflow && (
              <Button size="sm" variant="secondary" onClick={onOpenFullWorkflow}>
                {t("Open declaration setup")}
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-[family-name:var(--font-plex)] text-xl font-light tracking-tight text-[#111]">{t("Annual reports")}</h2>
            <span className="text-[11.5px] text-black/40">{t("One per supplier × product. Each one is verified separately.")}</span>
          </div>

          <div className="space-y-3">
            {groups.map((g) => (
              <SupplierBlock
                key={g.supplierId}
                declId={declaration.id}
                group={g}
                onOpenReport={open}
                onResolve={resolve}
                onRemind={() => remind(g)}
                lastReminded={reminders[g.supplierId] ?? null}
              />
            ))}
          </div>

          <CadenceLegend />
        </>
      )}

      {/* The deep workflow is still here. It is where filing, sign-off and
          dispatch live, and those are real steps — they are just not what
          somebody opening this page on a Tuesday is here for. */}
      {onOpenFullWorkflow && (
        <Card warm className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <div className="text-[13.5px] text-black/75">{t("Review, sign-off, filing and dispatch")}</div>
            <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-black/45">
              {t("The full declaration workflow — supplier submissions, the AI check, cost and carbon, the Registry XML, and sending the Communication Template to the buyer. Everything that happens once the reports above are complete.")}
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={onOpenFullWorkflow}>
            {t("Open workflow")} <ExternalLink size={13} strokeWidth={1.5} />
          </Button>
        </Card>
      )}

      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-black/40">
        <Check size={12} strokeWidth={1.5} className="text-black/30" />
        {t("Suppliers and Reports stay in the left nav — they are quick, frequent jobs, and burying them under a declaration would guarantee they never get done.")}
      </p>
    </div>
  );
}
