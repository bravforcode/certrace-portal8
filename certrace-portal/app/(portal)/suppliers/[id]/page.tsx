"use client";

export const runtime = "edge";

/* ════════════════════════════════════════════════════════════
   ONE SUPPLIER — their plants, their goods, and what has been asked

   Rebuilt on the supplier record (lib/supplier-companies.ts) with
   installations hanging off it, replacing a page assembled from declaration
   fixtures.

   WHAT WAS REMOVED, and in every case for the same reason — it described
   something the product does not do:

   · SEND REMINDER · REPORT · DOCUMENTS · OPEN GUIDED FORM. Four buttons, three
     of which fired a toast and downloaded nothing, and the fourth opened
     `/s/demo-token` — a hard-coded fixture link, not this supplier's. Chasing
     happens on the MONTH that is late, in the workspace, where the link that
     gets sent is the link for that month.
   · DATA & DOCUMENTS, the documents list, and ACTIVITY. Progress bars and a
     timeline over fixture counts that no supplier submission ever wrote to.
   · THIRD-PARTY VERIFIED. A verification claim the portal cannot make: no
     verifier ever touched this build.
   · CBAM-CRITICAL. A boolean nothing set and nothing acted on.
   · SUBMITTED / ACCEPTED states on reports. Nothing here was submitted to
     anybody, and "accepted" names a decision by an authority this build has no
     path to.

   WHAT IS HERE INSTEAD is what an exporter actually comes for: the plants this
   company runs, the goods being verified at each, and — per good — which
   months have gone out and where they stand. Same row shape as the Inbox,
   because it is the same question asked from the other side.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Download,
  FileText,
  Mail,
  Pencil,
  Phone,
  Plus,
} from "lucide-react";
import { Card, Button, Eyebrow, Stat, StatusDot, cn } from "@/components/ui";
import { ErrorState, LoadingState } from "@/components/query-state";
import { toast } from "@/components/toast";
import { InstallationModal } from "@/components/workspace/installation-form";
import { SupplierModal } from "@/components/workspace/supplier-form";
import { StateChip } from "@/components/workspace/chrome";
import { getCountry } from "@/lib/config";
import { useT } from "@/lib/i18n";
import { type Installation } from "@/lib/installations";
import {
  useInstallationsForSupplier,
  useInvalidateInstallations,
} from "@/lib/installations-query";
import {
  countdownFor,
  dispatchesFor,
  effectiveDueDay,
  formatDate,
} from "@/lib/month-dispatch";
import {
  MONTH_STATUS_LABEL,
  monthsForWorkspace,
  type MonthStatus,
} from "@/lib/monthly-data";
import { workspaceReadiness } from "@/lib/readiness";
import {
  useInvalidateSupplierCompanies,
  useSupplierCompany,
} from "@/lib/suppliers-query";
import {
  monthNameLong,
  scheduleFor,
  workspaceTitle,
  type VerificationWorkspace,
} from "@/lib/workspace";
import { useWorkspaces } from "@/lib/workspaces-query";

/** One month that has actually been sent, with where it stands. */
type MonthRow = {
  month: string;
  status: MonthStatus;
  due: Date;
  countdown: string;
  overdue: boolean;
  done: boolean;
  sentAt: string;
};

type GoodRow = {
  workspace: VerificationWorkspace;
  months: MonthRow[];
  percent: number;
  overall: ReturnType<typeof workspaceReadiness>["overall"];
};

function goodsFor(workspaceList: VerificationWorkspace[]): GoodRow[] {
  return workspaceList.map((w) => {
    const schedule = scheduleFor(w);
    const dispatches = dispatchesFor(w.id);
    const readiness = workspaceReadiness(w);

    const months: MonthRow[] = [];
    for (const entry of monthsForWorkspace(w)) {
      // ONLY MONTHS THAT WERE ACTUALLY SENT. A month nobody asked for is not a
      // status this supplier can be measured against.
      const dispatch = dispatches[entry.month];
      if (!dispatch) continue;
      const done = entry.status === "submitted" || entry.status === "reviewed";
      const c = countdownFor(
        entry.month,
        effectiveDueDay(dispatch, schedule.dueDay),
      );
      months.push({
        month: entry.month,
        status: entry.status,
        due: c.due,
        countdown: c.text,
        overdue: c.overdue && !done,
        done,
        sentAt: dispatch.sentAt,
      });
    }

    return {
      workspace: w,
      months: months.reverse(),
      percent: readiness.percentComplete,
      overall: readiness.overall,
    };
  });
}

export default function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useT();
  const { id } = React.use(params);

  const {
    data: supplier,
    isError: supplierError,
    refetch: refetchSupplier,
  } = useSupplierCompany(id);
  const {
    data: plantsData,
    isError: plantsError,
    refetch: refetchPlants,
  } = useInstallationsForSupplier(supplier?.id);
  const {
    data: workspaces,
    isError: workspacesError,
    refetch: refetchWorkspaces,
  } = useWorkspaces();
  const invalidateSupplierCompanies = useInvalidateSupplierCompanies();
  const invalidateInstallations = useInvalidateInstallations();

  const [editingSupplier, setEditingSupplier] = React.useState(false);
  /** null = closed · "new" = adding a plant · an Installation = editing one */
  const [editingPlant, setEditingPlant] = React.useState<
    Installation | "new" | null
  >(null);

  const goods: GoodRow[] = React.useMemo(
    () =>
      supplier && workspaces
        ? goodsFor(workspaces.filter((w) => w.supplierId === supplier.id))
        : [],
    // `t` is here only so a change of language recomputes the countdown wording, which is built inside goodsFor
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supplier, workspaces, t],
  );

  if (supplierError || plantsError || workspacesError)
    return (
      <ErrorState
        onRetry={() => {
          void refetchSupplier();
          void refetchPlants();
          void refetchWorkspaces();
        }}
      />
    );

  // undefined = still resolving (the old `resolved` flag); null = not found.
  if (supplier === undefined) return <LoadingState />;

  if (!supplier) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <Eyebrow>{t("Supplier")}</Eyebrow>
        <h1 className="mt-3 font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">
          {t("Not in your directory.")}
        </h1>
        <p className="mt-2 text-sm text-black/45">
          {t(
            "Nothing is filed under “{slug}”. It may have been removed, or the link may be from another account.",
            { slug: id },
          )}
        </p>
        <Link href="/suppliers" className="mt-6 inline-block">
          <Button variant="secondary" size="sm">
            <ArrowLeft size={14} strokeWidth={1.5} /> {t("Back to suppliers")}
          </Button>
        </Link>
      </Card>
    );
  }

  // Same atomic first paint as the old reload(): nothing until every store answered.
  if (plantsData === undefined || workspaces === undefined)
    return <LoadingState />;
  const plants = plantsData;

  const monthsSent = goods.reduce((a, g) => a + g.months.length, 0);
  const monthsIn = goods.reduce(
    (a, g) => a + g.months.filter((m) => m.done).length,
    0,
  );

  return (
    <div className="space-y-7">
      <Link
        href="/suppliers"
        className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.08em] text-black/40 hover:text-black"
      >
        <ArrowLeft size={14} strokeWidth={1.5} /> {t("Suppliers")}
      </Link>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-black/[0.04] font-mono text-[13px] text-black/50">
            {supplier.country || "—"}
          </span>
          <div className="min-w-0">
            <h1 className="font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
              {supplier.name}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-black/45">
              <span>
                {getCountry(supplier.country)?.name ?? supplier.country}
              </span>
              {supplier.contactName && (
                <>
                  <span className="text-black/30">·</span>
                  <span>{supplier.contactName}</span>
                </>
              )}
              {supplier.contactEmail && (
                <>
                  <span className="text-black/30">·</span>
                  <a
                    href={`mailto:${supplier.contactEmail}`}
                    className="inline-flex items-center gap-1 hover:text-black"
                  >
                    <Mail size={12} strokeWidth={1.5} /> {supplier.contactEmail}
                  </a>
                </>
              )}
              {supplier.contactPhone && (
                <>
                  <span className="text-black/30">·</span>
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Phone size={12} strokeWidth={1.5} />{" "}
                    {supplier.contactPhone}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditingSupplier(true)}
          >
            <Pencil size={13} strokeWidth={1.5} /> {t("Edit supplier")}
          </Button>
          <Button size="sm" onClick={() => setEditingPlant("new")}>
            <Plus size={14} strokeWidth={1.5} /> {t("Add installation")}
          </Button>
        </div>
      </div>

      {/* ── Numbers ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-5">
          <Stat value={plants.length} label={t("Installations")} />
        </Card>
        <Card className="p-5">
          <Stat value={goods.length} label={t("Goods in verification")} />
        </Card>
        <Card className="p-5">
          <Stat value={monthsSent} label={t("Months asked for")} />
        </Card>
        <Card className="p-5">
          <Stat
            value={`${monthsIn}/${monthsSent}`}
            label={t("Months in")}
            sub={t("of what was asked")}
          />
        </Card>
      </div>

      {/* ── Installations ──────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Eyebrow>{t("Installations")}</Eyebrow>
          <button
            type="button"
            onClick={() => setEditingPlant("new")}
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-black/40 underline decoration-black/20 underline-offset-2 hover:text-black"
          >
            <Plus size={12} strokeWidth={1.5} /> {t("Add installation")}
          </button>
        </div>

        {plants.length === 0 ? (
          <Card className="p-6">
            <p className="text-[13px] leading-relaxed text-black/45">
              {t(
                "No installations recorded for this supplier yet. A product report is scoped to a plant, so until one exists there is nothing to ask them for.",
              )}
            </p>
            <Button
              className="mt-4"
              size="sm"
              onClick={() => setEditingPlant("new")}
            >
              <Plus size={14} strokeWidth={1.5} />{" "}
              {t("Add their first installation")}
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {plants.map((i) => (
              <Card key={i.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Building2
                        size={14}
                        strokeWidth={1.5}
                        className="flex-none text-black/40"
                      />
                      <span className="truncate text-[14px] text-black/85">
                        {i.name}
                      </span>
                      <span className="font-mono text-[11px] text-black/40">
                        {i.id}
                      </span>
                    </div>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-black/50">
                      {[i.street, i.city, i.postcode, i.country]
                        .filter(Boolean)
                        .join(", ") || t("No address yet.")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingPlant(i)}
                    className="flex-none rounded-lg border border-black/10 px-2.5 py-1.5 text-[11px] uppercase tracking-[0.08em] text-black/55 transition-colors hover:border-black/25 hover:text-black"
                  >
                    {t("Edit")}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── Goods, and what has been asked of each ─────────── */}
      <section className="space-y-3">
        <Eyebrow>{t("Goods")}</Eyebrow>
        <p className="max-w-2xl text-[12.5px] leading-relaxed text-black/45">
          {t(
            "What is being verified at this supplier's plants, and every month you have actually sent them. A month appears once it has gone out and leaves the late band once it is in.",
          )}
        </p>

        {goods.length === 0 ? (
          <Card className="p-6">
            <p className="text-[13px] leading-relaxed text-black/45">
              {t(
                "No goods are being verified at this supplier yet. Create a product report for one of their plants and its twelve months start here.",
              )}
            </p>
            <Link href="/workspaces/new" className="mt-4 inline-block">
              <Button size="sm" variant="secondary">
                <Plus size={14} strokeWidth={1.5} /> {t("New product report")}
              </Button>
            </Link>
          </Card>
        ) : (
          goods.map(({ workspace: w, months, percent, overall }) => (
            <Card key={w.id} className="overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-4">
                <div className="min-w-0">
                  <Link
                    href={`/workspaces/${w.id}`}
                    className="text-[14px] text-black/85 hover:underline"
                  >
                    {t(w.productName)}
                  </Link>
                  <p className="mt-0.5 font-mono text-[11px] text-black/40">
                    CN {w.cnCode || "—"} · {w.installationName} · {w.year}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-3">
                  <span className="font-mono text-[11px] text-black/35">
                    {percent}%
                  </span>
                  <StateChip state={overall} />
                </div>
              </div>

              {months.length === 0 ? (
                <p className="px-5 py-5 text-[12.5px] text-black/40">
                  {t(
                    "Nothing sent yet. Open the product report's Monthly data tab and send a month to start the trail.",
                  )}
                </p>
              ) : (
                /* The Inbox's row shape, deliberately — same question, other
                   side of it, so the two screens read as one thing. */
                <div>
                  {months.map((m) => (
                    <Link
                      key={m.month}
                      href={`/workspaces/${w.id}/monthly/${m.month}`}
                      className="flex items-center gap-4 border-b border-black/[0.05] px-5 py-3.5 transition-colors last:border-0 hover:bg-[#fafaf8]"
                    >
                      <StatusDot
                        tone={m.done ? "ok" : m.overdue ? "err" : "warn"}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] text-black/80">
                          {monthNameLong(m.month)}
                        </span>
                        <span className="mt-0.5 block truncate text-[11.5px] text-black/40">
                          {workspaceTitle(w, t)}
                        </span>
                      </span>
                      <span className="hidden flex-none text-right sm:block">
                        <span className="block font-mono text-[11px] text-black/40">
                          {t(MONTH_STATUS_LABEL[m.status])}
                        </span>
                        <span className="mt-0.5 block font-mono text-[10.5px] text-black/30">
                          {t("sent {date}", {
                            date: formatDate(new Date(m.sentAt)),
                          })}
                        </span>
                      </span>
                      <span className="flex-none text-right">
                        <span
                          className={cn(
                            "block font-mono text-[11.5px]",
                            m.done
                              ? "text-[#047857]"
                              : m.overdue
                                ? "text-[#dc2626]"
                                : "text-black/45",
                          )}
                        >
                          {m.done ? t("in") : m.countdown}
                        </span>
                        <span className="mt-0.5 block font-mono text-[10.5px] text-black/30">
                          {t("due {date}", { date: formatDate(m.due) })}
                        </span>
                      </span>
                      <ArrowRight
                        size={15}
                        strokeWidth={1.5}
                        className="flex-none text-black/25"
                      />
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          ))
        )}
      </section>

      {/* ── Generated reports ──────────────────────────────── */}
      <section className="space-y-3">
        <Eyebrow>{t("Generated report")}</Eyebrow>
        <p className="max-w-2xl text-[12.5px] leading-relaxed text-black/45">
          {t(
            "One document per good, built from what this supplier has actually sent you. Generated on download rather than stored, so it always says what the product report says today.",
          )}
        </p>

        {goods.length === 0 ? (
          <Card className="p-6">
            <p className="text-[13px] text-black/45">
              {t("Nothing to generate yet.")}
            </p>
          </Card>
        ) : (
          <Card className="divide-y divide-black/[0.06] p-0">
            {goods.map(({ workspace: w, months }) => {
              const inCount = months.filter((m) => m.done).length;
              return (
                <div
                  key={w.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-4"
                >
                  <FileText
                    size={15}
                    strokeWidth={1.5}
                    className="flex-none text-black/35"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-black/75">
                      {t(w.productName)} · {w.year}
                    </span>
                    <span className="block font-mono text-[11px] text-black/40">
                      {w.installationName} · {inCount} {t("months in")}
                    </span>
                  </span>
                  {/* The intensity figure and its "ACCEPTED" chip are gone: one
                      was a fixture, the other a claim about an authority. What
                      is offered is the document itself. */}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-none"
                    onClick={() =>
                      toast({
                        message: t("Not connected yet"),
                        detail: t(
                          "Export the verifier pack for {product} from Reports — it is built from the same months.",
                          { product: w.productName },
                        ),
                        tone: "info",
                      })
                    }
                  >
                    <Download size={13} strokeWidth={1.5} />{" "}
                    {t("Download document")}
                  </Button>
                </div>
              );
            })}
          </Card>
        )}
      </section>

      <SupplierModal
        open={editingSupplier}
        onClose={() => setEditingSupplier(false)}
        initial={supplier}
        onSaved={() => invalidateSupplierCompanies()}
      />

      <InstallationModal
        open={editingPlant !== null}
        onClose={() => setEditingPlant(null)}
        allowSelfToggle={false}
        supplierId={supplier.id}
        initial={
          editingPlant && editingPlant !== "new" ? editingPlant : undefined
        }
        title={
          editingPlant === "new"
            ? t("Add an installation for {name}", { name: supplier.name })
            : t("Edit installation")
        }
        onSaved={() => invalidateInstallations()}
      />
    </div>
  );
}
