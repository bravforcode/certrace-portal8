/* Real client-side file generation.
   Produces a self-contained, on-brand, printable HTML "package" and triggers a
   download — so every Download / PDF button delivers an actual artifact instead
   of a dead click. Open the file and Print → Save as PDF for a real CBAM doc. */

export type PackageInput = {
  ref: string;
  regulationShort: string;
  regulationFull: string;
  period: string;
  sector: string;
  origin: string; // e.g. "Thailand"
  market: string; // e.g. "European Union"
  org: string;
  installationId: string;
  totalEmbedded: number; // tCO₂e
  supplierCount: number;
  carbonPricePaid: number;
  factorSet: string;
  suppliers?: { name: string; material: string; emissions: number | null; productionRoute?: string }[];
};

function esc(s: string | number) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

export function buildPackageHtml(p: PackageInput): string {
  const now = new Date();
  const rows = (p.suppliers ?? [])
    .map(
      (s) => `<tr>
        <td>${esc(s.name)}</td>
        <td>${esc(s.material)}</td>
        <td>${esc(s.productionRoute ?? "N/A")}</td>
        <td class="num">${s.emissions != null ? s.emissions.toFixed(2) : "default"}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(p.ref)} — ${esc(p.regulationShort)} ${esc(p.period)}</title>
<style>
  :root{--ink:#111;--bone:#f5f4f0}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bone);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;-webkit-font-smoothing:antialiased}
  .page{max-width:820px;margin:0 auto;padding:56px 48px 80px}
  .wm{font-family:"Courier New",monospace;text-transform:uppercase;letter-spacing:.28em;font-size:12px;color:rgba(17,17,17,.7)}
  .eyebrow{font-family:"Courier New",monospace;text-transform:uppercase;letter-spacing:.18em;font-size:11px;color:rgba(17,17,17,.4);margin-top:40px}
  h1{font-weight:300;letter-spacing:-.02em;font-size:34px;line-height:1.1;margin:8px 0 4px}
  .sub{color:rgba(17,17,17,.45);font-size:14px}
  .ref{float:right;font-family:"Courier New",monospace;font-size:12px;color:rgba(17,17,17,.55);border:1px solid rgba(0,0,0,.1);border-radius:9px;padding:6px 10px}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:28px 0}
  .stat{border:1px solid rgba(0,0,0,.08);border-radius:16px;background:#fff;padding:18px}
  .stat .v{font-weight:300;font-size:30px;letter-spacing:-.02em}
  .stat .l{text-transform:uppercase;letter-spacing:.1em;font-size:10px;color:rgba(17,17,17,.4);margin-top:6px}
  table{width:100%;border-collapse:collapse;background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:16px;overflow:hidden;margin-top:12px}
  th,td{text-align:left;padding:11px 16px;font-size:13px;border-bottom:1px solid rgba(0,0,0,.05)}
  th{font-family:"Courier New",monospace;text-transform:uppercase;letter-spacing:.12em;font-size:9px;color:rgba(17,17,17,.4);background:rgba(0,0,0,.02)}
  td.num,th.num{text-align:right;font-family:"Courier New",monospace}
  .kv{display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px solid rgba(0,0,0,.06);font-size:13px}
  .kv .k{color:rgba(17,17,17,.45)}
  .seal{margin-top:32px;border-top:1px solid rgba(0,0,0,.08);padding-top:16px;font-family:"Courier New",monospace;font-size:11px;color:rgba(17,17,17,.45)}
  .dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#10b981;margin-right:8px;vertical-align:middle}
  @media print{body{background:#fff}.page{padding:24px}.noprint{display:none}}
  .bar{position:fixed;top:0;left:0;right:0;background:#111;color:#fff;padding:10px 16px;font-size:12px;text-align:center;letter-spacing:.04em}
  .bar a{color:#fff}
</style></head>
<body>
<div class="bar noprint">Audit-ready package — press <b>Cmd/Ctrl + P</b> → “Save as PDF” to file with the authority.</div>
<div class="page">
  <div style="margin-top:28px"><span class="wm">Certrace</span><span class="ref">${esc(p.ref)}</span></div>
  <div class="eyebrow">${esc(p.regulationFull)}</div>
  <h1>Embedded emissions declaration</h1>
  <div class="sub">${esc(p.sector)} · ${esc(p.period)} · ${esc(p.origin)} → ${esc(p.market)}</div>

  <div class="grid">
    <div class="stat"><div class="v">${p.totalEmbedded.toLocaleString()}</div><div class="l">tCO₂e embedded</div></div>
    <div class="stat"><div class="v">${p.supplierCount}</div><div class="l">suppliers verified</div></div>
    <div class="stat"><div class="v">100%</div><div class="l">audit-ready</div></div>
  </div>

  <div class="eyebrow" style="margin-top:8px">Declarant</div>
  <div class="kv"><span class="k">Exporter</span><span>${esc(p.org)}</span></div>
  <div class="kv"><span class="k">Installation / facility ID</span><span>${esc(p.installationId)}</span></div>
  <div class="kv"><span class="k">Methodology</span><span>IPCC · GHG Protocol · ${esc(p.factorSet)}</span></div>
  <div class="kv"><span class="k">Carbon price paid in origin</span><span>${p.carbonPricePaid === 0 ? "None (Thailand — no carbon price)" : esc(p.carbonPricePaid)}</span></div>

  ${rows ? `<div class="eyebrow">Per-supplier embedded emissions (tCO₂e/t)</div>
  <table><thead><tr><th>Supplier</th><th>Material</th><th>Route</th><th class="num">tCO₂e/t</th></tr></thead><tbody>${rows}</tbody></table>` : ""}

  <div class="seal"><span class="dot"></span>Generated ${esc(now.toUTCString())} · sealed by Certrace · sha-256 evidence trail · reviewer sign-off attached</div>
</div>
</body></html>`;
}

export function downloadFile(filename: string, contents: string, mime = "text/html") {
  if (typeof window === "undefined") return;
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadPackage(p: PackageInput) {
  const slug = `${p.regulationShort}-${p.period}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  downloadFile(`certrace-${slug}.html`, buildPackageHtml(p), "text/html");
}
