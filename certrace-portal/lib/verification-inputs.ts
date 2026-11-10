import type { VerificationWorkspace } from "./workspace";
import type { PrecursorSupplier } from "./precursor-suppliers";

export type InputProduct = {
  id: string;
  name: string;
  cnCode: string;
  description: string;
  unit: "t" | "kWh" | "kg N" | "t clinker";
  benchmark: string;
};
export type InputProcess = {
  id: string;
  name: string;
  routes: string[];
  steps: string[];
  products: InputProduct[];
  precursorIds: string[];
  otherInputs: string[];
};
export type InputPlan = {
  operatorName: string;
  operatorRegistration: string;
  operatorAddress: string;
  registryId: string;
  monitoringStart: string;
  processes: InputProcess[];
  additionalFlows: string[];
};
export type OutputQuantity = {
  processId: string;
  productId: string;
  route: string;
  quantity?: number;
  tonnes?: number;
};
export type OtherFlow = {
  id: string;
  kind: string;
  processId: string;
  quantity?: number;
  unit: string;
  counterpart: string;
  basis: string;
};
export const FLOW_TYPES = [
  "Electricity generated / exported",
  "Heat / CHP",
  "Waste gas",
  "CO₂ transfer / storage",
  "Continuous emissions measurement / N₂O",
  "Aluminium PFC",
];
export const inputId = () => crypto.randomUUID();
export function initialInputPlan(ws: VerificationWorkspace): InputPlan {
  return {
    operatorName: ws.supplierName ?? "",
    operatorRegistration: "",
    operatorAddress: "",
    registryId: "",
    monitoringStart: ws.periodStart,
    additionalFlows: [],
    processes: [
      {
        id: `${ws.id}:process:0`,
        name: ws.productName,
        routes: [ws.productionRoute],
        steps: [],
        precursorIds: [],
        otherInputs: [],
        products: [
          {
            id: `${ws.id}:product:0`,
            name: ws.productName,
            cnCode: ws.cnCode,
            description: "",
            unit: "t",
            benchmark: "",
          },
        ],
      },
    ],
  };
}

/** Legacy process-only links apply to every product in that process. */
export function linkedPrecursorProductIds(
  source: Pick<
    PrecursorSupplier,
    "consumingProductIds" | "consumingProcessIds"
  >,
  processes: InputProcess[],
): string[] {
  const known = new Set(
    processes.flatMap((process) =>
      process.products.map((product) => product.id),
    ),
  );
  if (source.consumingProductIds !== undefined)
    return source.consumingProductIds.filter((id) => known.has(id));
  if (source.consumingProcessIds?.length) {
    const matched = processes.filter((process) =>
      source.consumingProcessIds?.includes(process.id),
    );
    if (matched.length)
      return matched.flatMap((process) =>
        process.products.map((product) => product.id),
      );
  }
  // Older rows without a matching process ID used the first product workspace.
  return source.consumingProcessIds?.length === 0
    ? []
    : (processes[0]?.products.map((product) => product.id) ?? []);
}

export function processesForPrecursorProducts(
  productIds: string[],
  processes: InputProcess[],
): string[] {
  const selected = new Set(productIds);
  return processes
    .filter((process) =>
      process.products.some((product) => selected.has(product.id)),
    )
    .map((process) => process.id);
}

export function planWithPrecursorLink(
  plan: InputPlan,
  sourceId: string,
  productIds: string[],
): InputPlan {
  const processIds = new Set(
    processesForPrecursorProducts(productIds, plan.processes),
  );
  return {
    ...plan,
    processes: plan.processes.map((process) => ({
      ...process,
      precursorIds: processIds.has(process.id)
        ? [...new Set([...(process.precursorIds ?? []), sourceId])]
        : (process.precursorIds ?? []).filter((id) => id !== sourceId),
    })),
  };
}
export function inputPlanIssues(plan: InputPlan | undefined): string[] {
  if (!plan) return ["Set up the operator and production processes"];
  const issues: string[] = [];
  if (!plan.operatorName.trim()) issues.push("Operator legal name");
  if (!plan.operatorRegistration.trim())
    issues.push("Operator registration number");
  if (!plan.operatorAddress.trim()) issues.push("Operator address in English");
  if (!plan.processes.length) issues.push("At least one production process");
  for (const process of plan.processes) {
    if (!process.name.trim() || !process.steps.length)
      issues.push(`${process.name || "Process"}: name and production steps`);
    if (!process.products.length) issues.push(`${process.name}: add a product`);
    for (const product of process.products) {
      if (
        !product.name.trim() ||
        !/^\d{8}$/.test(product.cnCode.replace(/\s/g, ""))
      )
        issues.push(
          `${product.name || process.name}: product name and exact 8-digit CN code`,
        );
      if (!product.description.trim())
        issues.push(`${product.name || process.name}: product description`);
    }
  }
  return issues;
}

export function structuredMonthIssues(
  plan: InputPlan | undefined,
  entry: import("./monthly-data").MonthlyEntry,
): string[] {
  if (!plan) return [];
  const missing: string[] = [];
  const products = plan.processes.flatMap((process) =>
    process.products.map((product) => ({ process, product })),
  );
  if (products.length > 1)
    for (const { process, product } of products) {
      const row = entry.outputQuantities?.find(
        (r) => r.processId === process.id && r.productId === product.id,
      );
      if (
        row?.quantity == null ||
        !Number.isFinite(row.quantity) ||
        row.quantity < 0
      )
        missing.push(`${product.name}: monthly output by process`);
      if (
        process.routes.length &&
        (!row?.route || !process.routes.includes(row.route))
      )
        missing.push(`${product.name}: production route`);
    }
  for (const kind of plan.additionalFlows) {
    const row = entry.otherFlows?.find((r) => r.kind === kind);
    if (
      row?.quantity == null ||
      !Number.isFinite(row.quantity) ||
      row.quantity < 0 ||
      !row.unit.trim() ||
      !row.basis.trim() ||
      !plan.processes.some((p) => p.id === row.processId)
    )
      missing.push(
        `${kind}: quantity, unit, process and measurement reference`,
      );
  }
  return missing;
}

/** Localise the variable part of an input finding without translating product names. */
export function inputIssueText(
  issue: string,
  t: import("./i18n").TFunction,
): string {
  const suffixes = [
    "name and production steps",
    "add a product",
    "product name and exact 8-digit CN code",
    "product description",
    "monthly output by process",
    "production route",
    "quantity, unit, process and measurement reference",
  ];
  for (const suffix of suffixes) {
    const ending = `: ${suffix}`;
    if (issue.endsWith(ending))
      return t(`{item}: ${suffix}`, { item: issue.slice(0, -ending.length) });
  }
  return t(issue);
}
