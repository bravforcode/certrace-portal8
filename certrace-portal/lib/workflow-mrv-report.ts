import { isElectrolysisGood, type CatalogProduct } from "./config";
import {
  classifyCnCode,
  createMrvReportDraft,
  decimal,
  decimalToString,
  measuredValue,
  MEASUREMENT_SPECS,
  REGULATORY_DATA_VERSION,
  type CalculationTrace,
  type EnergyFlow,
  type EmissionSource,
  type MonitoringPlan,
  type MrvReportDraft,
  type PrecursorInput,
  type ProductionProcess,
  type ProductionRouteCode,
  type SourceStream,
} from "./mrv";
import { calculatePlantMrv } from "./plant-mrv";
import { parsePrecursors, rowComplete } from "./precursors";
import type { SupplierRequest } from "./supplier";
import { valueKey } from "./supplier";
import type { InstallationProfile, SupplierProfile } from "./supplier-store";
import { embeddedEmissionsCalculation } from "./workflow-measurements";

export interface WorkflowMrvReportResult {
  draft: MrvReportDraft | null;
  assemblyBlockers: readonly string[];
}

function reportingPeriod(request: SupplierRequest) {
  const year = /(20\d{2})/.exec(request.period)?.[1];
  if (!year) return null;
  return { start: `${year}-01-01`, end: `${year}-12-31`, calendarYear: Number(year) } as const;
}

function lines(value: string): string[] {
  return value.split(/\r?\n|;/).map((entry) => entry.trim()).filter(Boolean);
}

function installationFor(
  reference: string,
  request: SupplierRequest,
  values: Record<string, string>,
  profile: SupplierProfile | null,
): { id: string; name: string; country: string; address: string; coordinates?: { latitude: string; longitude: string } } {
  if (reference !== "primary") {
    const found: InstallationProfile | undefined = profile?.additionalInstallations.find((installation) => installation.id === reference);
    if (found) return { id: found.id, name: found.name, country: found.country, address: found.address };
  }
  const coordinateParts = values[valueKey("inst-coords")]?.split(",").map((part) => part.trim()) ?? [];
  let coordinates: { latitude: string; longitude: string } | undefined;
  if (coordinateParts.length === 2) {
    try {
      coordinates = { latitude: decimalToString(decimal(coordinateParts[0])), longitude: decimalToString(decimal(coordinateParts[1])) };
    } catch {
      coordinates = undefined;
    }
  }
  return {
    id: reference || "primary",
    name: values[valueKey("inst-name")] || profile?.installationName || request.supplierName,
    country: values[valueKey("inst-country")] || profile?.country || request.supplierCountry,
    address: values[valueKey("inst-address")] || profile?.address || "",
    coordinates,
  };
}

function precursorInputs(
  product: CatalogProduct,
  processId: string,
  productionActivityTne: string,
  raw: string | undefined,
  blockers: string[],
): PrecursorInput[] {
  const rows = parsePrecursors(raw);
  if (raw?.trim() && rows === null) {
    blockers.push(`${product.name}: precursor rows are not structured.`);
    return [];
  }
  return (rows ?? []).filter(rowComplete).flatMap((row, index) => {
    const classified = classifyCnCode(row.cn);
    if (!classified) {
      blockers.push(`${product.name}: precursor CN ${row.cn} is not in the effective regulatory dataset.`);
      return [];
    }
    const ratio = measuredValue(MEASUREMENT_SPECS.precursorRatio, row.qty, row.qtyUnit);
    const quantity = decimalToString(decimal(ratio.canonicalValue).times(decimal(productionActivityTne)));
    const specific = measuredValue(MEASUREMENT_SPECS.specificEmissions, row.see, row.seeUnit);
    return [{
      id: `${product.id}:precursor:${index + 1}`,
      processId,
      precursorCnCode: classified.cnCode,
      precursorCategory: classified.aggregatedGoodsCategory,
      quantityConsumed: measuredValue(MEASUREMENT_SPECS.goodsMass, quantity, "TNE"),
      determinationMethod: row.method === "actual" ? "ACTUAL" as const : "DEFAULT" as const,
      actualSpecificEmbeddedEmissions: row.method === "actual" ? specific : undefined,
      unmarkedDefaultSpecificEmbeddedEmissions: row.method === "default" && row.defaultValueBasis === "unmarked_base" ? specific : undefined,
      publishedMarkedDefaultSpecificEmbeddedEmissions: row.method === "default" && row.defaultValueBasis === "published_includes_markup" ? specific : undefined,
      // Browser text is not promoted to an accredited VerificationReference.
      verificationReference: undefined,
      evidenceReferences: [],
      regulatoryDataVersion: row.regulatoryDataVersion || REGULATORY_DATA_VERSION,
    } satisfies PrecursorInput];
  });
}

export function buildWorkflowMrvReport(
  request: SupplierRequest,
  values: Record<string, string>,
  profile: SupplierProfile | null,
): WorkflowMrvReportResult {
  const period = reportingPeriod(request);
  const blockers: string[] = [];
  if (!period) return { draft: null, assemblyBlockers: ["A calendar reporting year is required."] };

  const productionProcesses: ProductionProcess[] = [];
  const sourceStreams: SourceStream[] = [];
  const emissionSources: EmissionSource[] = [];
  const energyFlows: EnergyFlow[] = [];
  const precursors: PrecursorInput[] = [];
  const calculations: CalculationTrace[] = [];
  const installationRecords = new Map<string, ReturnType<typeof installationFor>>();

  if (profile?.actorRole === "trader" && request.products.some(({ product }) => values[valueKey("method", product.id)] !== "default")) {
    blockers.push(`Trader profile for ${profile.upstreamProducer || "an unnamed upstream producer"} cannot attest installation-specific actual values.`);
  }

  for (const requestProduct of request.products) {
    const product = requestProduct.product;
    const regulatoryProduct = classifyCnCode(product.cnCode);
    if (!regulatoryProduct) {
      blockers.push(`${product.name}: CN ${product.cnCode} is not classified.`);
      continue;
    }
    const route = values[valueKey("process-route", product.id)];
    if (!(regulatoryProduct.productionRoutes as readonly string[]).includes(route)) {
      blockers.push(`${product.name}: ${route || "no production route"} is not valid for CN ${product.cnCode}.`);
      continue;
    }
    const productionActivity = values[valueKey("production-activity", product.id)];
    try {
      measuredValue(MEASUREMENT_SPECS.goodsMass, productionActivity, "TNE");
    } catch {
      blockers.push(`${product.name}: a positive exact production activity in TNE is required.`);
      continue;
    }
    if (!decimal(productionActivity).isPositive()) {
      blockers.push(`${product.name}: production activity must be greater than zero.`);
      continue;
    }

    const installationReference = values[valueKey("installation-reference", product.id)] || "primary";
    if (installationReference !== "primary" && !profile?.additionalInstallations.some((installation) => installation.id === installationReference)) {
      blockers.push(`${product.name}: producing installation ${installationReference} is not defined in the supplier profile.`);
      continue;
    }
    const installation = installationFor(installationReference, request, values, profile);
    installationRecords.set(installation.id, installation);
    const processId = `${product.id}-process`;
    const determinationMethod = values[valueKey("method", product.id)] === "default" ? "DEFAULT" as const : "ACTUAL" as const;
    const plant = determinationMethod === "ACTUAL"
      ? calculatePlantMrv(values[valueKey("plant-mrv", product.id)], productionActivity, { productId: product.id, installationId: installation.id, processId })
      : null;
    if (plant && !plant.ok) blockers.push(`${product.name}: ${plant.errors.map((error) => `${error.path}: ${error.message}`).join("; ")}`);
    if (plant?.ok) {
      const pfcSources = plant.emissionSources.filter((source) => source.methodology === "PFC_SLOPE" || source.methodology === "PFC_OVERVOLTAGE");
      if (!isElectrolysisGood(product) && pfcSources.length > 0) blockers.push(`${product.name}: PFC inputs are outside this product's regulatory route.`);
      if (isElectrolysisGood(product) && route === "PRIMARY_HALL_HEROULT" && pfcSources.length === 0) blockers.push(`${product.name}: primary electrolysis requires an applicable PFC calculation method.`);
    }
    const namespacedSourceStreams = plant?.ok
      ? plant.sourceStreams.map((row) => ({ ...row, id: `${processId}:${row.id}` }))
      : [];
    const namespacedEmissionSources = plant?.ok
      ? plant.emissionSources.map((row) => ({ ...row, id: `${processId}:${row.id}` }))
      : [];
    const namespacedEnergyFlows = plant?.ok
      ? plant.energyFlows.map((row) => ({ ...row, id: `${processId}:${row.id}` }))
      : [];
    if (plant?.ok) {
      sourceStreams.push(...namespacedSourceStreams);
      emissionSources.push(...namespacedEmissionSources);
      energyFlows.push(...namespacedEnergyFlows);
      calculations.push(...plant.traces);
    }

    const productPrecursors = precursorInputs(product, processId, productionActivity, values[valueKey("precursors", product.id)], blockers);
    precursors.push(...productPrecursors);
    const direct = plant?.ok ? plant.directSpecificEmissions.value : values[valueKey("direct-emissions", product.id)];
    const indirect = plant?.ok ? plant.indirectSpecificEmissions.value : values[valueKey("indirect-emissions", product.id)];
    try {
      const embedded = embeddedEmissionsCalculation({ product, direct, indirect, precursors: values[valueKey("precursors", product.id)], reportingPeriod: request.period });
      if (embedded) calculations.push(...embedded.traces);
      else blockers.push(`${product.name}: an embedded-emissions calculation could not be assembled.`);
    } catch (error) {
      blockers.push(`${product.name}: ${error instanceof Error ? error.message : "embedded-emissions calculation failed"}`);
    }

    const processSourceStreams = namespacedSourceStreams.map((row) => row.id);
    const processEmissionSources = namespacedEmissionSources.map((row) => row.id);
    const processEnergyFlows = namespacedEnergyFlows.map((row) => row.id);
    const sourceReferences = plant?.ok
      ? [...plant.sourceStreams, ...plant.emissionSources, ...plant.energyFlows].flatMap((row) => row.evidenceReferences)
      : values[valueKey("default-value-reference", product.id)] ? [values[valueKey("default-value-reference", product.id)]] : [];
    productionProcesses.push({
      id: processId,
      installationId: installation.id,
      name: product.name,
      route: route as ProductionRouteCode,
      aggregatedGoodsCategory: regulatoryProduct.aggregatedGoodsCategory,
      cnCodes: [regulatoryProduct.cnCode],
      systemBoundaryDescription: values[valueKey("system-boundary", product.id)],
      activityLevel: measuredValue(MEASUREMENT_SPECS.goodsMass, productionActivity, "TNE"),
      determinationMethod,
      verificationReferenceIds: [],
      outputProductIds: [product.id],
      sourceStreamIds: processSourceStreams,
      emissionSourceIds: processEmissionSources,
      energyFlowIds: processEnergyFlows,
      precursorInputIds: productPrecursors.map((row) => row.id),
      evidenceReferences: [...new Set(sourceReferences)],
      regulatoryDataVersion: REGULATORY_DATA_VERSION,
    });
  }

  if (productionProcesses.length === 0) return { draft: null, assemblyBlockers: blockers.length > 0 ? blockers : ["No production process could be assembled."] };

  const monitoringPlans: MonitoringPlan[] = [];
  for (const [installationId, installation] of installationRecords) {
    const processes = productionProcesses.filter((process) => process.installationId === installationId);
    const firstProductId = processes[0]?.outputProductIds[0];
    if (!firstProductId) continue;
    const planReference = values[valueKey("monitoring-plan-id", firstProductId)];
    const planVersion = values[valueKey("monitoring-plan-version", firstProductId)];
    const includedProcessIds = processes.map((process) => process.id);
    const processSourceIds = processes.flatMap((process) => process.sourceStreamIds);
    const processEmissionSourceIds = processes.flatMap((process) => process.emissionSourceIds);
    const processEnergyFlowIds = processes.flatMap((process) => process.energyFlowIds);
    const inconsistent = processes.some((process) => {
      const productId = process.outputProductIds[0];
      return values[valueKey("monitoring-plan-id", productId)] !== planReference || values[valueKey("monitoring-plan-version", productId)] !== planVersion;
    });
    if (inconsistent) blockers.push(`${installation.name}: products assigned to one installation use inconsistent monitoring-plan references or versions.`);
    monitoringPlans.push({
      id: `${planReference || "missing-plan"}:${installationId}`,
      version: planVersion || "missing",
      status: "DRAFT",
      reportingPeriod: period,
      installationBoundary: {
        installationId,
        installationName: installation.name,
        countryCode: installation.country,
        address: installation.address,
        geographicCoordinates: installation.coordinates,
        includedProcessIds,
        excludedActivities: [...new Set(processes.flatMap((process) => lines(values[valueKey("excluded-activities", process.outputProductIds[0])])) )],
        boundaryEvidenceReferences: [],
      },
      processIds: includedProcessIds,
      sourceStreamIds: processSourceIds,
      emissionSourceIds: processEmissionSourceIds,
      energyFlowIds: processEnergyFlowIds,
      dataGapMethodology: processes.map((process) => values[valueKey("data-gap-methodology", process.outputProductIds[0])]).filter(Boolean).join(" | "),
      controlActivities: [...new Set(processes.flatMap((process) => lines(values[valueKey("control-activities", process.outputProductIds[0])])) )],
      evidenceReferences: [],
      regulatoryDataVersion: REGULATORY_DATA_VERSION,
    });
  }

  blockers.push("Evidence file bytes, malware-scan results and immutable custody records are unavailable in the browser-only readiness demo.");
  try {
    const draft = createMrvReportDraft({
      id: `${request.declId}:${request.supplierId}:mrv-draft`,
      monitoringPlans,
      productionProcesses,
      sourceStreams,
      emissionSources,
      energyFlows,
      precursorInputs: precursors,
      calculations,
      verificationReferences: [],
      evidenceReferences: [],
      blockers,
    });
    return { draft, assemblyBlockers: [] };
  } catch (error) {
    return { draft: null, assemblyBlockers: [...blockers, error instanceof Error ? error.message : "MRV report assembly failed."] };
  }
}
