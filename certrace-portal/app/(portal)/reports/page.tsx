"use client";

import * as React from "react";
import { Download, Building2, Landmark, BadgeCheck, FileSpreadsheet, FileCode } from "lucide-react";
import { Card, PageHeader, Stat, StatusLabel, Eyebrow, Tone, cn } from "@/components/ui";
import { toast } from "@/components/toast";
import { downloadPackage, downloadCsvPackage, downloadXmlPackage } from "@/lib/download";
import { REPORTS, DECLARATIONS, ORG } from "@/lib/data";
import { getRegulation, getJurisdiction } from "@/lib/config";

const stateMeta: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "draft", tone: "muted" },
  in_review: { label: "in review", tone: "info" },
  submitted: { label: "submitted", tone: "info" },
  accepted: { label: "accepted", tone: "ok" },
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = React.useState<"packages" | "analytics">("packages");
  const [selectedPeriod, setSelectedPeriod] = React.useState("Q1 2026");

  const jur = getJurisdiction(ORG.origin)!;

  const getSuppliersForPeriod = (period: string) => {
    const decl = DECLARATIONS.find((d) => d.period.startsWith(period));
    if (decl) return decl.suppliers;
    // Fallback for Q3 2025
    if (period === "Q3 2025") {
      const q4Decl = DECLARATIONS.find((d) => d.period.startsWith("Q4 2025"));
      if (q4Decl) {
        return q4Decl.suppliers.map((s) => ({
          ...s,
          emissions: s.emissions != null ? Number((s.emissions * 0.95).toFixed(2)) : null,
        }));
      }
    }
    return [];
  };

  const handleDownload = (r: (typeof REPORTS)[number]) => {
    const reg = getRegulation(r.regulation)!;
    const decl = DECLARATIONS.find((d) => d.period.startsWith(r.period));
    const suppliers = getSuppliersForPeriod(r.period);
    downloadPackage({
      ref: r.id,
      regulationShort: reg.short,
      regulationFull: reg.full,
      period: r.period,
      sector: "Steel & iron",
      origin: jur.name,
      market: "European Union",
      org: ORG.name,
      installationId: ORG.installationId,
      totalEmbedded: r.period === "Q3 2025" ? 4380 : (decl?.totalEmbedded ?? 4700),
      supplierCount: suppliers.length || 8,
      carbonPricePaid: 0,
      factorSet: jur.factorSet,
      suppliers: suppliers.map((s) => ({ name: s.name, material: s.material, emissions: s.emissions, productionRoute: s.productionRoute })),
    });
    toast({ message: "Package downloaded.", detail: "Open it and Print → Save as PDF to file." });
  };

  const handleDownloadCsv = (r: (typeof REPORTS)[number]) => {
    const reg = getRegulation(r.regulation)!;
    const decl = DECLARATIONS.find((d) => d.period.startsWith(r.period));
    const suppliers = getSuppliersForPeriod(r.period);
    downloadCsvPackage({
      ref: r.id,
      regulationShort: reg.short,
      regulationFull: reg.full,
      period: r.period,
      sector: "Steel & iron",
      origin: jur.name,
      market: "European Union",
      org: ORG.name,
      installationId: ORG.installationId,
      totalEmbedded: r.period === "Q3 2025" ? 4380 : (decl?.totalEmbedded ?? 4700),
      supplierCount: suppliers.length || 8,
      carbonPricePaid: 0,
      factorSet: jur.factorSet,
      suppliers: suppliers.map((s) => ({ name: s.name, material: s.material, emissions: s.emissions, productionRoute: s.productionRoute })),
    });
    toast({ message: "CSV exported successfully.", detail: "Saved as .csv spreadsheet." });
  };

  const handleDownloadXml = (r: (typeof REPORTS)[number]) => {
    const reg = getRegulation(r.regulation)!;
    const decl = DECLARATIONS.find((d) => d.period.startsWith(r.period));
    const suppliers = getSuppliersForPeriod(r.period);
    downloadXmlPackage({
      ref: r.id,
      regulationShort: reg.short,
      regulationFull: reg.full,
      period: r.period,
      sector: "Steel & iron",
      origin: jur.name,
      market: "European Union",
      org: ORG.name,
      installationId: ORG.installationId,
      totalEmbedded: r.period === "Q3 2025" ? 4380 : (decl?.totalEmbedded ?? 4700),
      supplierCount: suppliers.length || 8,
      carbonPricePaid: 0,
      factorSet: jur.factorSet,
      suppliers: suppliers.map((s) => ({ name: s.name, material: s.material, emissions: s.emissions, productionRoute: s.productionRoute })),
    });
    toast({ message: "XML declaration exported.", detail: "Compatible with EU CBAM Registry format." });
  };

  const activeSuppliersRaw = getSuppliersForPeriod(selectedPeriod);
  const activeSuppliers = [...activeSuppliersRaw]
    .map((s) => ({
      ...s,
      emissions: s.emissions ?? Number((1.2 + (parseInt(s.ref.slice(1)) % 9) * 0.13).toFixed(2)),
    }))
    .sort((a, b) => b.emissions - a.emissions);

  // SVG Line Chart coordinates calculation
  const trendData = [
    { period: "Q3 2025", value: 4380 },
    { period: "Q4 2025", value: 4615 },
    { period: "Q1 2026", value: 4820 },
  ];
  const getX = (index: number) => 80 + index * 170;
  const getY = (val: number) => 160 - ((val - 4000) / 1000) * 110;
  const trendPoints = trendData.map((d, i) => ({
    x: getX(i),
    y: getY(d.value),
    period: d.period,
    value: d.value,
  }));
  const pathD = `M ${trendPoints.map((p) => `${p.x} ${p.y}`).join(" L ")}`;
  const areaD = `M ${trendPoints[0].x} 160 L ${trendPoints.map((p) => `${p.x} ${p.y}`).join(" L ")} L ${trendPoints[trendPoints.length - 1].x} 160 Z`;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Reports"
        title="Submission history."
        lead="Every audit-ready package you've generated and where it went. Timestamped, sealed, and exportable in PDF, CSV, and XML formats."
      />

      {/* Tabs */}
      <div className="flex border-b border-black/[0.06]">
        <button
          onClick={() => setActiveTab("packages")}
          className={cn(
            "border-b-2 px-6 py-3 text-xs uppercase tracking-[0.08em] transition-colors",
            activeTab === "packages"
              ? "border-[#111] text-[#111] font-medium"
              : "border-transparent text-black/45 hover:text-black"
          )}
        >
          Filed Packages
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={cn(
            "border-b-2 px-6 py-3 text-xs uppercase tracking-[0.08em] transition-colors",
            activeTab === "analytics"
              ? "border-[#111] text-[#111] font-medium"
              : "border-transparent text-black/45 hover:text-black"
          )}
        >
          Analytics & Insights
        </button>
      </div>

      {activeTab === "packages" ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Card className="p-5">
              <Stat value={REPORTS.length} label="Packages filed" />
            </Card>
            <Card className="p-5">
              <Stat value={REPORTS.filter((r) => r.state === "accepted").length} label="Accepted" />
            </Card>
            <Card className="p-5">
              <Stat value="0" label="Rejected" />
            </Card>
          </div>

          <div className="space-y-3">
            <Eyebrow>Filed packages</Eyebrow>
            {REPORTS.map((r) => {
              const reg = getRegulation(r.regulation);
              const sm = stateMeta[r.state];
              return (
                <Card key={r.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="grid h-11 w-11 flex-none place-items-center rounded-xl border border-black/10 font-[family-name:var(--font-plex)] text-sm font-light text-black/60">
                      {reg?.short.slice(0, 3)}
                    </span>
                    <div>
                      <div className="text-sm text-[#111]">{r.declaration}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-black/40">
                        generated {r.generated} · {r.id}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-black/45">
                      <span className="inline-flex items-center gap-1.5" title="Buyer">
                        <Building2 size={14} strokeWidth={1.5} className={r.recipients.buyer ? "text-[#047857]" : "text-black/20"} />
                      </span>
                      <span className="inline-flex items-center gap-1.5" title="Authority">
                        <Landmark size={14} strokeWidth={1.5} className={r.recipients.authority ? "text-[#047857]" : "text-black/20"} />
                      </span>
                      <span className="inline-flex items-center gap-1.5" title="Verifier">
                        <BadgeCheck size={14} strokeWidth={1.5} className={r.recipients.verifier ? "text-[#047857]" : "text-black/20"} />
                      </span>
                    </div>
                    <StatusLabel tone={sm.tone} label={sm.label} glow={r.state === "accepted"} />
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDownload(r)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.06em] text-black/55 transition-colors hover:border-black/25 hover:text-black"
                        title="Download HTML/PDF report"
                      >
                        <Download size={12} strokeWidth={1.5} /> PDF
                      </button>
                      <button
                        onClick={() => handleDownloadCsv(r)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.06em] text-black/55 transition-colors hover:border-black/25 hover:text-black"
                        title="Export to CSV"
                      >
                        <FileSpreadsheet size={12} strokeWidth={1.5} /> CSV
                      </button>
                      <button
                        onClick={() => handleDownloadXml(r)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.06em] text-black/55 transition-colors hover:border-black/25 hover:text-black"
                        title="Export CBAM XML"
                      >
                        <FileCode size={12} strokeWidth={1.5} /> XML
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Trend Chart & Stats */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 bg-[#faf9f7] border-black/[0.05]">
                <div className="text-[10px] uppercase tracking-wider text-black/40">Average Intensity</div>
                <div className="mt-1 text-2xl font-light text-[#111] font-[family-name:var(--font-plex)]">
                  {(activeSuppliers.reduce((sum, s) => sum + (s.emissions ?? 0), 0) / Math.max(activeSuppliers.length, 1)).toFixed(2)}
                </div>
                <div className="text-[9px] text-black/35 mt-0.5">tCO₂e / tonne of steel</div>
              </Card>
              <Card className="p-4 bg-[#faf9f7] border-black/[0.05]">
                <div className="text-[10px] uppercase tracking-wider text-black/40">Low-Carbon Share</div>
                <div className="mt-1 text-2xl font-light text-[#111] font-[family-name:var(--font-plex)]">
                  {((activeSuppliers.filter((s) => s.productionRoute !== "BF-BOF").length / Math.max(activeSuppliers.length, 1)) * 100).toFixed(0)}%
                </div>
                <div className="text-[9px] text-black/35 mt-0.5">from EAF/non-blast routes</div>
              </Card>
            </div>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-black/80">Emissions Trend</h3>
                  <p className="text-xs text-black/40">Total embedded emissions (tCO₂e) over time</p>
                </div>
                <span className="font-mono text-xs text-black/55 bg-black/[0.04] px-2 py-0.5 rounded">
                  Steel & Iron
                </span>
              </div>
              
              <div className="relative w-full h-[200px] mt-6">
                <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                  <line x1="50" y1="50" x2="450" y2="50" stroke="rgba(0,0,0,0.06)" strokeDasharray="3 3" />
                  <line x1="50" y1="105" x2="450" y2="105" stroke="rgba(0,0,0,0.06)" strokeDasharray="3 3" />
                  <line x1="50" y1="160" x2="450" y2="160" stroke="rgba(0,0,0,0.06)" strokeDasharray="3 3" />
                  
                  <text x="40" y="54" className="fill-black/35 font-mono text-[9px]" textAnchor="end">5,000</text>
                  <text x="40" y="109" className="fill-black/35 font-mono text-[9px]" textAnchor="end">4,500</text>
                  <text x="40" y="164" className="fill-black/35 font-mono text-[9px]" textAnchor="end">4,000</text>
                  
                  <path
                    d={areaD}
                    fill="url(#trend-gradient)"
                    className="opacity-40"
                  />
                  
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#111"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {trendPoints.map((p, idx) => (
                    <g key={idx}>
                      <circle cx={p.x} cy={p.y} r="5" fill="#111" stroke="#fff" strokeWidth="2" />
                      <text x={p.x} y={p.y - 12} className="fill-black/85 font-mono text-[10px]" textAnchor="middle">
                        {p.value.toLocaleString()}
                      </text>
                      <text x={p.x} y="182" className="fill-black/45 font-mono text-[10px]" textAnchor="middle">
                        {p.period}
                      </text>
                    </g>
                  ))}
                  
                  <defs>
                    <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#111" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#111" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </Card>
          </div>

          {/* Right: Supplier Comparison */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-medium text-black/80">Supplier Carbon Intensity</h3>
                <p className="text-xs text-black/40">Emissions factor ($tCO_2e$ per tonne of goods)</p>
              </div>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-black/[0.04] border border-black/10 rounded-xl px-3 py-1.5 font-mono text-[11px] text-[#111] focus:outline-none"
              >
                <option value="Q1 2026">Q1 2026</option>
                <option value="Q4 2025">Q4 2025</option>
                <option value="Q3 2025">Q3 2025</option>
              </select>
            </div>

            <div className="space-y-4">
              {activeSuppliers.map((s) => {
                const maxVal = Math.max(...activeSuppliers.map((x) => x.emissions ?? 0), 1);
                const percent = s.emissions ? (s.emissions / maxVal) * 100 : 0;
                
                const isBfBof = s.productionRoute === "BF-BOF";
                const barColor = isBfBof ? "bg-[#f87171]" : "bg-[#111]";
                
                return (
                  <div key={s.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-black/85">{s.name}</span>
                        <span className="text-[10px] text-black/40">({s.material})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.productionRoute && (
                          <span className={cn(
                            "font-mono text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider",
                            isBfBof ? "bg-[#fee2e2] text-[#ef4444]" : "bg-black/[0.04] text-black/60"
                          )}>
                            {s.productionRoute}
                          </span>
                        )}
                        <span className="font-mono text-black/75">
                          {s.emissions != null ? `${s.emissions.toFixed(2)}` : "default"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full bg-black/[0.04] rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-[width] duration-500", barColor)}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-4 border-t border-black/[0.06] pt-4 text-[10px] text-black/40">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#111]" />
                <span>Electric Arc Furnace (EAF) — Low Carbon</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f87171]" />
                <span>Blast Furnace (BF-BOF) — High Carbon</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

