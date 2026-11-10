/** Installation/year calculations. A missing factor or ambiguous allocation produces a
 * blocking finding, never a guessed zero. Existing monthly values remain the source. */
import {
  fuelCO2,
  fuelGJ,
  monthCounts,
  processEmissionEntryTCO2,
  type MonthlyEntry,
} from "./monthly-data";
import { initialInputPlan, type InputPlan } from "./verification-inputs";
import {
  reportRows,
  reportAreaIssues,
  type ReportInputs,
} from "./report-inputs";
import { resolveEuPrecursorDefault } from "./eu-precursor-defaults";
import {
  validateVerificationReport,
  type PrecursorSupplier,
} from "./precursor-suppliers";
import type { VerificationWorkspace } from "./workspace";
import type { EvidenceItem } from "./workspace-evidence";
import { categoryForCn, indirectApplies } from "./cbam/template-reference";
export type ReportFinding = { ref: string; context: string; message: string };
export type ProcessTotal = {
  id: string;
  name: string;
  direct: number;
  indirect: number;
  defaultIndirect: number;
  electricityMwh: number;
  precursorDirect: number;
  precursorIndirect: number;
  defaultPrecursor: number;
  defaultPrecursorDirect: number;
  defaultPrecursorIndirect: number;
  activity: {
    product: string;
    quantity: number;
    tonnes: number;
    unit: string;
  }[];
};
export type ProductTotal = {
  id: string;
  process: string;
  name: string;
  cnCode: string;
  unit: string;
  quantity: number;
  tonnes: number;
  direct: number | null;
  indirect: number | null;
  defaultShare: number | null;
  actualIndirectShare: number | null;
  defaultIndirectShare: number | null;
  sefa: number | null;
};
export type CalculationResult = {
  ready: boolean;
  findings: ReportFinding[];
  monthsCounted: number;
  installationDirect: number;
  installationIndirect: number;
  electricityMwh: number;
  electricityFactor: number | null;
  processes: ProcessTotal[];
  products: ProductTotal[];
  balances: Record<string, string | number>[];
  precursorGroups: Record<string, string | number | null>[];
  topFive: {
    goods: Record<string, unknown>[];
    fuels: Record<string, unknown>[];
    materials: Record<string, unknown>[];
    cems: Record<string, unknown>[];
  };
  dataQuality: string;
};
const n = (r: Record<string, string>, k: string) =>
  r[k]?.trim() && Number.isFinite(Number(r[k])) ? Number(r[k]) : NaN;
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const near = (a: number, b: number) =>
  Math.abs(a - b) <= Math.max(1e-6, Math.abs(b) * 1e-6);
export function calculateInstallationReport(
  ws: VerificationWorkspace,
  data: ReportInputs,
  months: MonthlyEntry[],
  sources: PrecursorSupplier[],
  evidence: EvidenceItem[],
  inputPlan?: InputPlan,
): CalculationResult {
  const plan = inputPlan ?? initialInputPlan(ws);
  const findings: ReportFinding[] = [];
  const issue = (ref: string, message: string, context = "annual") =>
    findings.push({ ref, message, context });
  const rows = (id: string, context = "annual") =>
    reportRows(data, ws, id, context);
  const knownEvidence = new Set(evidence.map((e) => e.id));
  const processes: ProcessTotal[] = plan.processes.map((p) => ({
    id: p.id,
    name: p.name,
    direct: 0,
    indirect: 0,
    defaultIndirect: 0,
    electricityMwh: 0,
    precursorDirect: 0,
    precursorIndirect: 0,
    defaultPrecursor: 0,
    defaultPrecursorDirect: 0,
    defaultPrecursorIndirect: 0,
    activity: p.products.map((g) => ({
      product: g.id,
      quantity: 0,
      tonnes: 0,
      unit: g.unit,
    })),
  }));
  const process = (id: string) => processes.find((p) => p.id === id);
  const product = (id: string) =>
    plan.processes.flatMap((p) => p.products).find((g) => g.id === id);
  const monthly = months.filter(
    (m) =>
      m.month >= ws.periodStart.slice(0, 7) &&
      m.month <= ws.periodEnd.slice(0, 7),
  );
  for (const area of ["setup", "method", "evidence", "report"] as const)
    for (const f of reportAreaIssues(data, ws, area)) issue(f.id, f.message);
  // All entered references must still point to live records, including rows in drafts.
  const scopes = [
    { name: "annual", area: ["setup", "method", "evidence", "report"] },
    ...monthly.map((m) => ({ name: `month:${m.month}`, area: ["monthly"] })),
    ...sources
      .filter((s) => !s.parentId)
      .map((s) => ({ name: `precursor:${s.id}`, area: ["precursor"] })),
  ];
  for (const scope of scopes) {
    if (scope.name !== "annual")
      for (const area of scope.area)
        for (const f of reportAreaIssues(
          data,
          ws,
          area as "monthly" | "precursor",
          scope.name,
        ))
          issue(f.id, f.message, scope.name);
    for (const [id, a] of Object.entries(data[`${ws.id}:${scope.name}`] ?? {}))
      for (const r of a.applicability === "yes" ? a.rows : []) {
        if (r.values.evidence && !knownEvidence.has(r.values.evidence))
          issue(id, "Supporting document was removed", scope.name);
        if (r.values.process && !process(r.values.process))
          issue(id, "Production process was removed", scope.name);
        if (r.values.product && !product(r.values.product))
          issue(id, "Product was removed", scope.name);
      }
  }
  for (const p of plan.processes) {
    if (rows("2.1.11").filter((r) => r.process === p.id).length !== 1)
      issue("2.1.11", `${p.name}: select one process classification`);
    for (const g of p.products) {
      if (rows("2.1.12").filter((r) => r.product === g.id).length !== 1)
        issue("2.1.12", `${g.name}: select one product classification`);
      if (!rows("2.1.13").some((r) => r.product === g.id))
        issue("2.1.13", `${g.name}: route and equipment links missing`);
    }
  }
  let installationDirect = 0,
    installationIndirect = 0,
    electricityMwh = 0;
  const balances: CalculationResult["balances"] = [];
  const fuelRanks = new Map<string, { gj: number; emissions: number }>(),
    materialRanks = new Map<string, number>(),
    cemsRanks = new Map<string, number>();
  const counted = monthly.filter(monthCounts);
  const productElectricity = new Map<
    string,
    { emissions: number; defaults: number }
  >();
  for (const m of monthly)
    if (!monthCounts(m))
      issue(
        "2.6.12",
        `${m.month}: month has not been submitted`,
        `month:${m.month}`,
      );
  for (const m of counted) {
    const ctx = `month:${m.month}`;
    const mr = (id: string) => rows(id, ctx);
    const links = mr("2.3.33");
    const allocate = (
      key: string,
      direct: number,
      indirect = 0,
      defaultIndirect = 0,
      mwh = 0,
    ) => {
      const linksFor = links.filter((r) => r.source === key);
      if (!linksFor.length && processes.length === 1) {
        processes[0].direct += direct;
        processes[0].indirect += indirect;
        processes[0].defaultIndirect += defaultIndirect;
        processes[0].electricityMwh += mwh;
        return;
      }
      if (!near(sum(linksFor.map((r) => n(r, "share"))), 100)) {
        issue(
          "2.3.33",
          `${m.month} ${key}: process shares must total 100%`,
          ctx,
        );
        return;
      }
      for (const link of linksFor) {
        const p = process(link.process);
        if (!p) {
          issue("2.3.33", `${key}: unknown process`, ctx);
          continue;
        }
        const s = n(link, "share") / 100;
        p.direct += direct * s;
        p.indirect += indirect * s;
        p.defaultIndirect += defaultIndirect * s;
        p.electricityMwh += mwh * s;
      }
    };
    for (const f of m.fuels) {
      try {
        let co2 = fuelCO2(f);
        const overrides = mr("2.3.34").filter(
          (r) => r.source === `fuel:${f.id}`,
        );
        if (overrides.length > 1)
          issue("2.3.34", `${f.fuelType}: duplicate factor records`, ctx);
        if (overrides[0]) {
          const of = n(overrides[0], "oxidation");
          if (!Number.isFinite(of) || of <= 0 || of > 1)
            issue("2.3.34", "Invalid oxidation factor", ctx);
          else
            co2 = fuelCO2({
              ...f,
              oxidationFactorSource: "measured",
              cTotal: 1,
              cAsh: 1 - of,
            });
        }
        if (!Number.isFinite(co2)) throw new Error("Invalid fuel calculation");
        installationDirect += co2;
        allocate(`fuel:${f.id}`, co2);
        const prev = fuelRanks.get(f.fuelType) ?? { gj: 0, emissions: 0 };
        fuelRanks.set(f.fuelType, {
          gj: prev.gj + fuelGJ(f),
          emissions: prev.emissions + co2,
        });
      } catch {
        issue("2.3.11", `${m.month}: fuel energy/factor is incomplete`, ctx);
      }
    }
    for (const material of m.processEmissionEntries ?? []) {
      let co2 = processEmissionEntryTCO2(material);
      const r = mr("2.3.34").find(
        (r) => r.source === `material:${material.id}`,
      );
      if (r && material.method === "mass_balance")
        co2 = 3.664 * material.quantityT * n(r, "carbon");
      if (!Number.isFinite(co2)) {
        issue("2.3.34", "Invalid process carbon content", ctx);
        continue;
      }
      installationDirect += co2;
      allocate(`material:${material.id}`, co2);
      materialRanks.set(
        material.materialId,
        (materialRanks.get(material.materialId) ?? 0) + co2,
      );
    }
    if (!m.processEmissionEntries?.length && m.processEmissionsTco2) {
      issue(
        "2.3.45",
        `${m.month}: replace legacy process total with source records`,
        ctx,
      );
    }
    if (!m.electricitySources?.length && m.electricityMwh > 0)
      issue(
        "2.3.16",
        `${m.month}: allocate the legacy electricity total to source rows`,
        ctx,
      );
    for (const s of m.electricitySources ?? []) {
      if (s.factorTco2PerMwh == null || !Number.isFinite(s.factorTco2PerMwh)) {
        issue("2.3.18", `${m.month}: missing electricity factor`, ctx);
        continue;
      }
      const co2 = s.mwh * s.factorTco2PerMwh;
      installationIndirect += co2;
      electricityMwh += s.mwh;
      const allocated = mr("2.3.37").filter(
        (r) => r.source === `electricity:${s.id}`,
      );
      if (allocated.length) {
        if (!near(sum(allocated.map((r) => n(r, "mwh"))), s.mwh))
          issue(
            "2.3.37",
            `${m.month}: product electricity must equal source consumption`,
            ctx,
          );
        for (const r of allocated) {
          const p = process(r.process);
          if (!p || !p.activity.some((a) => a.product === r.product)) {
            issue("2.3.37", "Product does not belong to selected process", ctx);
            continue;
          }
          const c = n(r, "mwh") * s.factorTco2PerMwh;
          p.indirect += c;
          p.electricityMwh += n(r, "mwh");
          if (s.sourceType === "grid_default") p.defaultIndirect += c;
          const previous = productElectricity.get(r.product) ?? {
            emissions: 0,
            defaults: 0,
          };
          productElectricity.set(r.product, {
            emissions: previous.emissions + c,
            defaults:
              previous.defaults + (s.sourceType === "grid_default" ? c : 0),
          });
        }
      } else {
        if (mr("2.3.37").length)
          issue(
            "2.3.37",
            "Allocate every electricity source to products when using product-level readings",
            ctx,
          );
        allocate(
          `electricity:${s.id}`,
          0,
          co2,
          s.sourceType === "grid_default" ? co2 : 0,
          s.mwh,
        );
      }
      if (s.sourceType === "ppa" || s.sourceType === "direct_technical_link") {
        if (!mr("2.3.36").some((r) => r.source === `electricity:${s.id}`))
          issue("2.3.36", "Electricity producer identity missing", ctx);
        if (
          s.sourceType === "ppa" &&
          !mr("2.3.40").some((r) => r.source === `electricity:${s.id}`)
        )
          issue("2.3.40", "PPA evidence missing", ctx);
      }
    }
    const products = plan.processes.flatMap((p) => p.products);
    for (const p of processes)
      for (const a of p.activity) {
        const g = product(a.product)!;
        const routes = mr("2.3.30").filter(
          (r) => r.product === g.id && r.process === p.id,
        );
        let qty: number | undefined, tonnes: number | undefined;
        if (routes.length) {
          qty = sum(routes.map((r) => n(r, "quantity")));
          tonnes = sum(routes.map((r) => n(r, "tonnes")));
          const out = m.outputQuantities?.find((o) => o.productId === g.id);
          if (out?.quantity != null && !near(qty, out.quantity))
            issue(
              "2.3.30",
              `${g.name}: route outputs differ from product total`,
              ctx,
            );
        } else {
          const out = m.outputQuantities?.find(
            (o) => o.productId === g.id && o.processId === p.id,
          );
          qty =
            out?.quantity ??
            (products.length === 1 ? m.productionTonnes : undefined);
          tonnes = out?.tonnes ?? (g.unit === "t" ? qty : undefined);
        }
        if (new Set(routes.map((r) => r.composition)).size > 1)
          issue(
            "2.6.4",
            `${g.name}: separate composition-specific allocation is not yet supported`,
            ctx,
          );
        const conv = mr("2.3.31").find((r) => r.product === g.id);
        if (conv) {
          tonnes = n(conv, "tonnes");
          const converted = tonnes * n(conv, "factor");
          if (qty != null && !near(qty, converted))
            issue(
              "2.3.31",
              `${g.name}: functional-unit conversion does not match output`,
              ctx,
            );
          qty = converted;
        }
        if (
          qty == null ||
          !Number.isFinite(qty) ||
          tonnes == null ||
          !Number.isFinite(tonnes)
        )
          issue("2.3.31", `${g.name}: output or physical mass missing`, ctx);
        else {
          a.quantity += qty;
          a.tonnes += tonnes;
        }
      }
    for (const r of mr("2.3.35")) {
      const hours = (Date.parse(r.end) - Date.parse(r.start)) / 3600000;
      const co2 =
        (n(r, "flow") * n(r, "concentration") * hours * n(r, "gwp")) / 1e9;
      if (
        !(hours > 0) ||
        !Number.isFinite(co2) ||
        co2 < 0 ||
        !(n(r, "gwp") > 0) ||
        (r.gas === "CO2" && n(r, "gwp") !== 1)
      ) {
        issue("2.3.35", "Invalid CEMS interval/readings", ctx);
        continue;
      }
      if (r.start.slice(0, 7) !== m.month || r.end.slice(0, 7) !== m.month)
        issue("2.3.35", "Measurement interval must belong to this month", ctx);
      if (
        mr("2.3.33").some(
          (x) =>
            x.source === r.source ||
            x.source === `fuel:${r.source}` ||
            x.source === `material:${r.source}`,
        )
      )
        issue(
          "2.3.35",
          `${r.source}: source is also calculation-based; review double counting`,
          ctx,
        );
      const overlap = mr("2.3.35").filter(
        (x) =>
          x !== r &&
          x.source === r.source &&
          x.gas === r.gas &&
          x.start < r.end &&
          x.end > r.start,
      );
      if (overlap.length)
        issue("2.3.35", `${r.source}: overlapping measurement intervals`, ctx);
      const p = process(r.process);
      if (p) p.direct += co2;
      installationDirect += co2;
      cemsRanks.set(
        `${r.source}/${r.gas}`,
        (cemsRanks.get(`${r.source}/${r.gas}`) ?? 0) + co2,
      );
    }
    for (const r of mr("2.3.45")) {
      const co2 = n(r, "activity") * n(r, "factor");
      if (!Number.isFinite(co2) || co2 < 0) {
        issue("2.3.45", "Invalid method inputs", ctx);
        continue;
      }
      const p = process(r.process);
      if (p) p.direct += co2;
      installationDirect += co2;
    }
    for (const r of mr("2.3.41")) {
      const balance =
        n(r, "imported") + n(r, "produced") - n(r, "used") - n(r, "exported");
      balances.push({
        month: m.month,
        process: r.process,
        kind: r.kind,
        balance,
        unit: "GJ",
      });
      if (!near(balance, 0))
        issue("2.3.41", "Energy balance does not reconcile", ctx);
      // A recorded net transfer is not automatically an eligible emissions deduction.
      if (n(r, "imported") || n(r, "exported"))
        issue(
          "2.2.35",
          "Transfer attribution requires a reviewed sector-specific calculation; balances are recorded but not deducted automatically",
        );
    }
    for (const r of mr("2.3.38")) {
      const balance = n(r, "produced") - n(r, "used") - n(r, "exported");
      balances.push({
        month: m.month,
        process: r.process,
        kind: "electricity",
        balance,
        unit: "MWh",
      });
      if (!near(balance, 0))
        issue("2.3.38", "Electricity balance does not reconcile", ctx);
    }
    for (const r of mr("2.3.39")) {
      const net = n(r, "gross") - n(r, "ownUse");
      const energy = n(r, "fuelGj");
      balances.push({
        month: m.month,
        process: r.process,
        kind: "generation",
        netMwh: net,
        electricEfficiency: energy > 0 ? (net * 3.6) / energy : 0,
        heatEfficiency: energy > 0 ? n(r, "heatGj") / energy : 0,
      });
      if (net < 0 || energy <= 0 || net * 3.6 + n(r, "heatGj") > energy)
        issue("2.3.39", "Generation inputs do not reconcile", ctx);
    }
    if (mr("2.3.43").some((r) => n(r, "tonnes") > 0))
      issue(
        "2.3.43",
        "CO₂ transfer eligibility needs review; transferred CO₂ is not automatically deducted",
        ctx,
      );
    const stock = mr("2.3.32");
    for (const r of stock) {
      const consumed =
        n(r, "opening") +
        n(r, "receipts") -
        n(r, "returns") -
        n(r, "closing") -
        n(r, "waste") -
        n(r, "offSpec");
      balances.push({
        month: m.month,
        process: r.process,
        kind: `stock:${r.material}`,
        consumed,
        unit: "t",
      });
      if (consumed < 0)
        issue("2.3.32", "Negative stock-derived consumption", ctx);
    }
  }
  const groups = new Map<
    string,
    { quantity: number; direct: number; indirect: number }
  >();
  const internal: {
    source: PrecursorSupplier;
    rows: Record<string, string>[];
  }[] = [];
  for (const s of sources.filter((s) => !s.parentId && !s.isScrap)) {
    const ctx = `precursor:${s.id}`;
    const origin = rows("2.4.27", ctx)[0];
    if (origin?.origin === "internal") {
      internal.push({ source: s, rows: rows("2.4.28", ctx) });
      continue;
    }
    let direct: number | null = null,
      indirect: number | null = null,
      isDefault = s.dataOrigin === "default_value";
    const decision = rows("2.5.10", ctx)[0]?.decision;
    if (
      !isDefault &&
      (decision !== "accepted" ||
        validateVerificationReport(s).failedReasons.length > 0)
    )
      isDefault = true;
    if (isDefault && s.dataOrigin !== "default_value")
      issue(
        "2.5.10",
        `${s.precursorName}: report not accepted; select and confirm the applicable default`,
        ctx,
      );
    if (isDefault) {
      const d = resolveEuPrecursorDefault(s.cnCode, s.country, ws.year);
      if (d) {
        direct = d.direct;
        indirect = d.indirect ?? 0;
      }
    } else {
      direct = s.specificEmbeddedDirectTco2PerT ?? null;
      indirect = s.specificEmbeddedIndirectTco2PerT ?? 0;
    }
    if (direct == null) {
      issue(
        "2.4.13",
        `${s.precursorName}: usable report or published default unavailable`,
        ctx,
      );
      continue;
    }
    const comboRows = rows("2.4.31", ctx);
    if (comboRows.length !== 1)
      issue(
        "2.4.31",
        `${s.precursorName}: use one source record per producer reporting period`,
        ctx,
      );
    const combo = comboRows[0];
    const groupKey = `${s.cnCode.replace(/\s/g, "")}:${combo?.method === "subset" ? combo.group : "all"}`;
    for (const q of s.monthlyQuantities.filter(
      (q) =>
        q.month >= ws.periodStart.slice(0, 7) &&
        q.month <= ws.periodEnd.slice(0, 7) &&
        q.basis !== "received",
    )) {
      if (!Number.isFinite(q.tonnes) || q.tonnes < 0) {
        issue("2.4.26", "Invalid precursor consumption quantity", ctx);
        continue;
      }
      const p = process(
        q.processId ?? (processes.length === 1 ? processes[0].id : ""),
      );
      if (!p) {
        issue("2.4.26", `${s.precursorName}: consumption needs a process`, ctx);
        continue;
      }
      p.precursorDirect += q.tonnes * direct;
      p.precursorIndirect += q.tonnes * (indirect ?? 0);
      if (isDefault) {
        p.defaultPrecursor += q.tonnes * (direct + (indirect ?? 0));
        p.defaultPrecursorDirect += q.tonnes * direct;
        p.defaultPrecursorIndirect += q.tonnes * (indirect ?? 0);
      }
      const prev = groups.get(groupKey) ?? {
        quantity: 0,
        direct: 0,
        indirect: 0,
      };
      groups.set(groupKey, {
        quantity: prev.quantity + q.tonnes,
        direct: prev.direct + q.tonnes * direct,
        indirect: prev.indirect + q.tonnes * (indirect ?? 0),
      });
    }
  }
  const allocation = rows("2.2.38");
  for (const p of processes) {
    const alloc = allocation.filter((r) => r.process === p.id);
    if (
      !near(sum(alloc.map((r) => n(r, "directShare"))), 100) ||
      !near(sum(alloc.map((r) => n(r, "indirectShare"))), 100)
    )
      issue("2.2.38", `${p.name}: product shares must total 100%`);
  }
  // Topologically apply internal flows. Same-process flows are excluded, not added twice.
  const pending: Record<string, string>[] = internal
    .flatMap((s) =>
      s.rows.map(
        (r): Record<string, string> => ({ ...r, sourceId: s.source.id }),
      ),
    )
    .filter(
      (r) =>
        r.month >= ws.periodStart.slice(0, 7) &&
        r.month <= ws.periodEnd.slice(0, 7),
    );
  let attempts = pending.length + 1;
  while (pending.length && attempts-- > 0) {
    const index = pending.findIndex(
      (r) =>
        r.producingProcess === r.process ||
        !pending.some(
          (x) =>
            x.process === r.producingProcess &&
            x.producingProcess !== x.process,
        ),
    );
    if (index < 0) {
      issue("2.4.28", "Internal precursor cycle: review process boundaries");
      break;
    }
    const r = pending.splice(index, 1)[0];
    if (r.producingProcess === r.process) continue;
    const upstream = process(r.producingProcess),
      downstream = process(r.process);
    const activity = upstream?.activity.find((a) => a.product === r.product);
    const alloc = allocation.find(
      (a) => a.process === upstream?.id && a.product === r.product,
    );
    if (
      !upstream ||
      !downstream ||
      !activity ||
      !(activity.tonnes > 0) ||
      !alloc
    ) {
      issue(
        "2.4.28",
        "Internal precursor needs producing product output and allocation",
        `precursor:${r.sourceId}`,
      );
      continue;
    }
    downstream.precursorDirect +=
      (n(r, "used") *
        (upstream.direct + upstream.precursorDirect) *
        n(alloc, "directShare")) /
      100 /
      activity.tonnes;
    downstream.defaultPrecursorDirect +=
      (n(r, "used") *
        upstream.defaultPrecursorDirect *
        n(alloc, "directShare")) /
      100 /
      activity.tonnes;
    downstream.defaultPrecursorIndirect +=
      (n(r, "used") *
        (upstream.defaultIndirect + upstream.defaultPrecursorIndirect) *
        n(alloc, "indirectShare")) /
      100 /
      activity.tonnes;
    downstream.precursorIndirect +=
      (n(r, "used") *
        (upstream.indirect + upstream.precursorIndirect) *
        n(alloc, "indirectShare")) /
      100 /
      activity.tonnes;
    if (n(r, "used") > n(r, "produced"))
      issue(
        "2.4.28",
        "Internal use exceeds reported production; document stock movements",
        `precursor:${r.sourceId}`,
      );
  }
  const products: ProductTotal[] = processes.flatMap((p) =>
    p.activity.map((a) => {
      const g = product(a.product)!;
      const alloc = allocation.find(
        (r) => r.process === p.id && r.product === g.id,
      );
      const ds = alloc ? n(alloc, "directShare") / 100 : NaN,
        is = alloc ? n(alloc, "indirectShare") / 100 : NaN;
      const classification = rows("2.1.12").find((r) => r.product === g.id);
      const category = categoryForCn(g.cnCode);
      const ind = category
        ? indirectApplies(category.id)
        : classification?.indirect === "yes";
      if (!category && !classification?.legalBasis)
        issue("2.1.12", `${g.name}: unknown CN scope needs a legal reference`);
      if (
        category &&
        classification &&
        ind !== (classification.indirect === "yes")
      )
        issue(
          "2.1.12",
          `${g.name}: indirect applicability conflicts with CN category`,
        );
      const productEl = productElectricity.get(g.id);
      const direct = (p.direct + p.precursorDirect) * ds,
        indirect = ind
          ? (productEl?.emissions ?? p.indirect * is) + p.precursorIndirect * is
          : 0;
      const total = direct + indirect;
      const fa = rows("2.2.39").find((r) => r.product === g.id);
      let sefa = fa
        ? n(fa, "benchmark") * n(fa, "cbamFactor") * n(fa, "cscf")
        : null;
      if (classification?.classification === "complex") {
        sefa = null;
        issue(
          "2.6.10",
          `${g.name}: complex-good SEFA needs producer/default benchmark contributions; automatic calculation is not yet supported`,
        );
      }
      if (sefa == null || !Number.isFinite(sefa))
        issue("2.2.39", `${g.name}: reviewed benchmark and factors missing`);
      if (!(a.quantity > 0))
        issue("2.6.4", `${g.name}: no positive annual output for intensity`);
      return {
        id: g.id,
        process: p.id,
        name: g.name,
        cnCode: g.cnCode,
        unit: g.unit,
        quantity: a.quantity,
        tonnes: a.tonnes,
        direct:
          a.quantity > 0 && Number.isFinite(direct)
            ? direct / a.quantity
            : null,
        indirect: ind
          ? a.quantity > 0 && Number.isFinite(indirect)
            ? indirect / a.quantity
            : null
          : null,
        defaultShare:
          total > 0
            ? (p.defaultPrecursorDirect * ds +
                (ind
                  ? (productEl?.defaults ?? p.defaultIndirect * is) +
                    p.defaultPrecursorIndirect * is
                  : 0)) /
              total
            : null,
        actualIndirectShare:
          ind && indirect > 0
            ? 1 -
              ((productEl?.defaults ?? p.defaultIndirect * is) +
                p.defaultPrecursorIndirect * is) /
                indirect
            : null,
        defaultIndirectShare:
          ind && indirect > 0
            ? ((productEl?.defaults ?? p.defaultIndirect * is) +
                p.defaultPrecursorIndirect * is) /
              indirect
            : null,
        sefa: Number.isFinite(sefa) ? sefa : null,
      };
    }),
  );
  for (const doc of evidence) {
    if (!rows("2.5.7").some((r) => r.evidence === doc.id))
      issue("2.5.7", `${doc.fileName}: document metadata missing`);
    if (!rows("2.5.8").some((r) => r.evidence === doc.id))
      issue("2.5.8", `${doc.fileName}: disclosure choice missing`);
  }
  const eoris = rows("2.7.5").map((r) => r.eori);
  for (const eori of eoris)
    for (const id of ["2.7.6", "2.7.7", "2.7.8"])
      if (!rows(id).some((r) => r.eori === eori))
        issue(id, `${eori}: declarant record missing`);
  // Review confirmations cannot pass with a negative answer, and report coverage must
  // include every configured month (rather than treating an empty array as complete).
  const startMonth =
    Number(ws.periodStart.slice(0, 4)) * 12 +
    Number(ws.periodStart.slice(5, 7));
  const endMonth =
    Number(ws.periodEnd.slice(0, 4)) * 12 + Number(ws.periodEnd.slice(5, 7));
  if (counted.length !== endMonth - startMonth + 1)
    issue("2.6.12", "Reporting period has missing submitted months");
  for (const id of ["2.7.3", "2.7.4", "2.7.6", "2.7.9", "2.7.10"])
    for (const r of rows(id))
      for (const key of [
        "criteria",
        "sent",
        "connection",
        "emissions",
        "ppa",
        "nomination",
        "benchmarks",
        "reviewed",
      ])
        if (r[key] === "no")
          issue(id, "Required confirmation has not been met");
  if (rows("2.7.11").some((r) => r.status === "open"))
    issue("2.7.11", "Verifier findings remain open");
  for (const p of processes) {
    const alloc = allocation.filter((r) => r.process === p.id);
    const seen = new Set<string>();
    for (const r of alloc) {
      if (seen.has(r.product))
        issue("2.2.38", `${p.name}: duplicate product allocation`);
      seen.add(r.product);
      if (!p.activity.some((a) => a.product === r.product))
        issue(
          "2.2.38",
          `${p.name}: allocation product belongs to another process`,
        );
    }
    for (const a of p.activity)
      if (!alloc.some((r) => r.product === a.product))
        issue("2.2.38", `${p.name}: product allocation missing`);
  }
  for (const doc of rows("2.5.7"))
    if (doc.expiry && doc.expiry < ws.periodEnd)
      issue("2.5.7", "Document expires before the reporting period ends");
  if (installationDirect < 0)
    issue("2.6.12", "Installation direct emissions cannot be negative");
  const unique = findings.filter(
    (f, i) =>
      findings.findIndex(
        (g) =>
          g.ref === f.ref && g.context === f.context && g.message === f.message,
      ) === i,
  );
  const defaults = processes.some(
    (p) => p.defaultIndirect > 0 || p.defaultPrecursor > 0,
  );
  return {
    ready: unique.length === 0,
    findings: unique,
    monthsCounted: counted.length,
    installationDirect,
    installationIndirect,
    electricityMwh,
    electricityFactor:
      electricityMwh > 0 ? installationIndirect / electricityMwh : null,
    processes,
    products,
    balances,
    precursorGroups: [...groups].map(([group, g]) => ({
      group,
      quantity: g.quantity,
      direct: g.quantity > 0 ? g.direct / g.quantity : null,
      indirect: g.quantity > 0 ? g.indirect / g.quantity : null,
    })),
    topFive: {
      goods: processes.flatMap((p) =>
        p.activity
          .map((a) => ({
            process: p.name,
            product: product(a.product)?.name,
            cnCode: product(a.product)?.cnCode,
            tonnes: a.tonnes,
          }))
          .sort((a, b) => b.tonnes - a.tonnes)
          .slice(0, 5),
      ),
      fuels: [...fuelRanks]
        .map(([fuel, v]) => ({ fuel, ...v }))
        .sort((a, b) => b.gj - a.gj)
        .slice(0, 5),
      materials: [...materialRanks]
        .map(([material, emissions]) => ({ material, emissions }))
        .sort((a, b) => b.emissions - a.emissions)
        .slice(0, 5),
      cems: [...cemsRanks]
        .map(([source, emissions]) => ({ source, emissions }))
        .sort((a, b) => b.emissions - a.emissions)
        .slice(0, 5),
    },
    dataQuality: unique.length
      ? "Incomplete — resolve findings"
      : defaults
        ? "Default values used alongside monitored data"
        : "Determined from monitored data",
  };
}
