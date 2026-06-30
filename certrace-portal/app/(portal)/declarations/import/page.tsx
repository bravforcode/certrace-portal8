"use client";

import * as React from "react";
import Link from "next/link";
import { UploadCloud, CheckCircle2, XCircle, ArrowRight, FileSpreadsheet } from "lucide-react";
import { Button, Card, Eyebrow, Chip, Progress, cn } from "@/components/ui";
import { findCnCode, type CnCodeRecord } from "@/lib/cn-codes";

// Mock data representing what would be parsed from an uploaded CSV/Excel
const MOCK_IMPORTED_ROWS = [
  { cnCode: "72000000", description: "Iron ore", weightTonnes: 1500, origin: "CN" },
  { cnCode: "10019900", description: "Wheat", weightTonnes: 5000, origin: "US" }, // Non-CBAM
  { cnCode: "73181520", description: "Steel screws", weightTonnes: 50, origin: "TW" },
  { cnCode: "85171200", description: "Smartphones", weightTonnes: 2, origin: "KR" }, // Non-CBAM
  { cnCode: "25232900", description: "Portland cement", weightTonnes: 10000, origin: "VN" },
];

export default function ImportPage() {
  const [step, setStep] = React.useState<"upload" | "analyzing" | "results">("upload");
  
  // Results
  const [cbamItems, setCbamItems] = React.useState<Array<typeof MOCK_IMPORTED_ROWS[0] & { meta: CnCodeRecord }>>([]);
  const [nonCbamItems, setNonCbamItems] = React.useState<typeof MOCK_IMPORTED_ROWS>([]);

  const handleSimulateUpload = () => {
    setStep("analyzing");
    
    // Simulate parsing and matching
    setTimeout(() => {
      const cbam: typeof cbamItems = [];
      const nonCbam: typeof nonCbamItems = [];
      
      MOCK_IMPORTED_ROWS.forEach(row => {
        const match = findCnCode(row.cnCode);
        if (match) {
          cbam.push({ ...row, meta: match });
        } else {
          nonCbam.push(row);
        }
      });
      
      setCbamItems(cbam);
      setNonCbamItems(nonCbam);
      setStep("results");
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-black/50 mb-4">
          <Link href="/declarations" className="hover:text-black transition-colors">Declarations</Link>
          <span>/</span>
          <span className="text-black">Import Data</span>
        </div>
        <Eyebrow>Auto-Classification</Eyebrow>
        <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
          Upload Customs Data
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-black/45">
          Upload your quarterly import manifest (Excel/CSV). Our engine will automatically scan all CN Codes against the <strong>OJ:L_202502621</strong> regulation and filter out non-CBAM goods.
        </p>
      </div>

      {step === "upload" && (
        <div className="rounded-2xl border-dashed border-2 border-black/10 bg-[#fafafa] flex flex-col items-center justify-center p-16 text-center hover:bg-[#f5f5f5] transition-colors cursor-pointer" onClick={handleSimulateUpload}>
          <div className="h-16 w-16 rounded-full bg-black/5 flex items-center justify-center mb-4 text-black/40">
            <UploadCloud size={24} strokeWidth={1.5} />
          </div>
          <h3 className="font-medium text-black">Click to upload or drag and drop</h3>
          <p className="text-sm text-black/40 mt-1">CSV, XLSX (max 50MB)</p>
          
          <Button className="mt-6" onClick={(e) => { e.stopPropagation(); handleSimulateUpload(); }}>
            Simulate Upload
          </Button>
        </div>
      )}

      {step === "analyzing" && (
        <Card className="p-16 flex flex-col items-center justify-center text-center">
          <FileSpreadsheet className="text-black/40 animate-pulse mb-6" size={32} strokeWidth={1.5} />
          <h3 className="font-medium text-black">Analyzing 5 records...</h3>
          <p className="text-sm text-black/40 mt-2 mb-6 max-w-xs mx-auto">
            Matching CN Codes against EU CBAM Annex I and calculating default emission values.
          </p>
          <div className="w-64">
            <Progress value={0} />
          </div>
        </Card>
      )}

      {step === "results" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5 border-emerald-500/20 bg-emerald-50/50">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-medium text-emerald-900 mb-1">CBAM Covered Goods</h4>
                  <p className="text-3xl font-light text-emerald-700">{cbamItems.length}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 size={16} strokeWidth={2} />
                </div>
              </div>
            </Card>
            <Card className="p-5 border-black/5">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-medium text-black/60 mb-1">Non-CBAM (Filtered Out)</h4>
                  <p className="text-3xl font-light text-black/80">{nonCbamItems.length}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-black/5 flex items-center justify-center text-black/40">
                  <XCircle size={16} strokeWidth={2} />
                </div>
              </div>
            </Card>
          </div>

          {/* Results Tables */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  CBAM Goods (Requires Reporting)
                </h3>
                <Chip tone="ok">{cbamItems.length} items</Chip>
              </div>
              <Card className="overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#fcfcfc] border-b border-black/5 text-black/50">
                    <tr>
                      <th className="px-4 py-3 font-medium">CN Code</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium text-right">Default Direct (tCO2e)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {cbamItems.map((item, i) => (
                      <tr key={i} className="hover:bg-black/[0.02] transition-colors">
                        <td className="px-4 py-3 font-mono">{item.cnCode}</td>
                        <td className="px-4 py-3">{item.description}</td>
                        <td className="px-4 py-3">
                          <Chip>{item.meta.category}</Chip>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-black/60">
                          {item.meta.defaultDirectEmissions.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-black/60 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-black/20" />
                  Non-CBAM Goods (Filtered Out)
                </h3>
              </div>
              <Card className="overflow-hidden border-black/5">
                <table className="w-full text-sm text-left opacity-70">
                  <thead className="bg-[#fcfcfc] border-b border-black/5 text-black/50">
                    <tr>
                      <th className="px-4 py-3 font-medium">CN Code</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium text-right">Weight (t)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {nonCbamItems.map((item, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 font-mono">{item.cnCode}</td>
                        <td className="px-4 py-3">{item.description}</td>
                        <td className="px-4 py-3 text-right font-mono">{item.weightTonnes.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>

            {/* Next Steps */}
            <div className="flex justify-end pt-4">
              <Link href="/declarations/new">
                <Button>
                  Create Declaration <ArrowRight size={15} strokeWidth={1.5} className="ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
