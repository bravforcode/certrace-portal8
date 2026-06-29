import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { Card, PageHeader, Button, Chip, Progress, StatusDot } from "@/components/ui";
import { DECLARATIONS } from "@/lib/data";
import { getRegulation, getJurisdiction } from "@/lib/config";

const STEP_LABEL: Record<string, string> = {
  collect: "Collecting",
  calculate: "Calculating",
  comply: "Compliance",
  review: "In review",
  report: "Report",
  submit: "Submitting",
  done: "Submitted",
};

export default function DeclarationsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Declarations"
        title="Reporting cycles."
        lead="Every regulation, market and period you're filing for. A declaration is the unit of compliance — scope it once, the platform runs the rest."
        actions={
          <Link href="/declarations/new">
            <Button>
              <Plus size={15} strokeWidth={1.5} /> New declaration
            </Button>
          </Link>
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        {DECLARATIONS.map((d) => {
          const reg = getRegulation(d.regulation);
          const jur = getJurisdiction(d.origin);
          const done = d.suppliers.filter((s) => s.status === "submitted").length;
          const pct = Math.round((done / d.suppliers.length) * 100);
          const tone = d.step === "done" ? "ok" : d.dueInDays < 0 ? "err" : d.dueInDays < 21 ? "warn" : "info";
          return (
            <Link key={d.id} href={`/declarations/${d.id}`} className="block">
              <Card className="flex h-full flex-col p-6 transition-colors hover:border-black/15 hover:bg-[#fafaf8]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">
                      {reg?.short}
                    </span>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-black/35">{reg?.full}</p>
                  </div>
                  <Chip tone={tone} pulse={false}>
                    {STEP_LABEL[d.step]}
                  </Chip>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-y-3 text-[12px]">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.1em] text-black/35">Period</div>
                    <div className="mt-0.5 text-black/60">{d.period}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.1em] text-black/35">Route</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-black/60">
                      <span className="font-mono text-[10px] text-black/40">{jur?.flag}</span> {d.origin} → {d.market}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.1em] text-black/35">Sector</div>
                    <div className="mt-0.5 text-black/60">{d.sector}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.1em] text-black/35">Due</div>
                    <div className="mt-0.5 text-black/60">{d.due}</div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3 border-t border-black/[0.06] pt-4">
                  <Progress value={pct} />
                  <span className="font-mono text-[11px] text-black/45">
                    {done}/{d.suppliers.length}
                  </span>
                  <ArrowRight size={15} strokeWidth={1.5} className="text-black/30" />
                </div>
              </Card>
            </Link>
          );
        })}

        {/* New declaration affordance */}
        <Link href="/declarations/new" className="block">
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 p-6 text-center transition-colors hover:border-black/25 hover:bg-[#fafaf8]">
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-black/10 text-black/50">
              <Plus size={18} strokeWidth={1.5} />
            </span>
            <p className="mt-4 text-sm font-light text-black/70">Start a new declaration</p>
            <p className="mt-1 max-w-xs text-xs text-black/40">
              CBAM steel &amp; iron, Thailand → EU. More regimes coming soon.
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5">
              <StatusDot tone="ok" /> <span className="font-mono text-[11px] text-black/40">CBAM live</span>
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
