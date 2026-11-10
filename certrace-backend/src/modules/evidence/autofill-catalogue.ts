import { createHash } from "node:crypto";
import { reportSpecs } from "../reporting/catalogue";
import { autofillReference } from "./autofill-reference";
import { sections } from "../reporting/sections";
import type { Shape } from "../reporting/shape";
import type { StoredReport } from "../reporting/service";
import { object, array, string, type Json } from "../../lib/json";
import type { FieldTarget, Path } from "./autofill-types";

export const AUTOFILL_VERSION = "report-mapping-v2";
export const inputStores = [
  "certrace:workspaces",
  "certrace:installations",
  "certrace:supplier-companies",
  "certrace:workspace-mmd-draft",
  "certrace:monthly-data",
  "certrace:precursor-suppliers",
  "certrace:carbon-price",
] as const;
// These represent application actions, identity, or derived results, never extracted inputs.
const protectedFields =
  /^(id|workspaceId|installationId|supplierId|catalogProductId|supplierCompanyId|parentId|createdAt|updatedAt|capturedAt|archivedAt|status|year|periodStart|periodEnd|month|internalSignoff|verifierSignoff|signoff|submittedAt|submittedBy|reviewedAt|reviewedBy|accepted|dataOrigin|verificationStatus|verificationChecked|verificationAccepted|zeroProductionConfirmed|noElectricityConfirmed|noFuelConfirmed|biomassEvidenced|isVerified|verified|fileDataUrl|fileHash|localFileId|fileId|verificationReportFileId|diagramDataUrl|diagramFileId|diagramFileName|diagramCovers|oxidationFactor|electricityFactorTco2PerMwh|processEmissionsTco2|seeTco2ePerT)$/;
export const humanSectionFields = new Set([
  "2.5.8.access",
  "2.5.10.decision",
  "2.7.9.reviewed",
  "2.7.10.reviewed",
  "2.7.10.benchmarks",
]);
export function fieldPolicy(name: string, shape: Shape): "input" | "system" {
  return shape.derived ||
    protectedFields.test(name) ||
    /(?:Confirmed|Acknowledged|Signoff|Override|Verified|VerificationAccepted)$/.test(
      name,
    ) ||
    shape.kind === "artifact"
    ? "system"
    : "input";
}
export function at(value: unknown, path: Path): unknown {
  return path.reduce<unknown>(
    (v, k) =>
      v != null && typeof v === "object"
        ? (v as Record<string, unknown>)[k]
        : undefined,
    value,
  );
}
export function put(value: Json, path: Path, next: Json, seed: Json): void {
  let cursor = value as Record<string | number, Json>;
  path.forEach((part, index) => {
    if (["__proto__", "constructor", "prototype"].includes(String(part)))
      throw Error("Invalid field path");
    if (index === path.length - 1) cursor[part] = next;
    else {
      if (cursor[part] == null) {
        const candidate = at(seed, path.slice(0, index + 1));
        cursor[part] =
          candidate === undefined
            ? typeof path[index + 1] === "number"
              ? []
              : {}
            : (structuredClone(candidate) as Json);
      }
      cursor = cursor[part] as Record<string | number, Json>;
    }
  });
}
function blank(s: Shape, context: string, monthly = false): Json {
  if (s.kind === "array") return [];
  if (s.kind === "map") return {};
  if (s.kind === "object")
    return Object.fromEntries(
      Object.entries(s.fields ?? {})
        .filter(([, v]) => !v.optional)
        .flatMap(([k, v]) => {
          if (k === "id") return [[k, crypto.randomUUID()]];
          if (k === "workspaceId") return [[k, context.split(":month:")[0]!]];
          if (k === "month") return [[k, context.split(":month:")[1] ?? ""]];
          if (k === "status") return [[k, "draft"]];
          if (k === "electricityFactorSource") return [[k, "grid_default"]];
          if (k === "directMethod") return [[k, "calculation"]];
          if (v.kind === "number" && !v.nullable && !monthly) return [];
          if (v.kind === "boolean" && !monthly) return [];
          return [[k, blank(v, context, monthly)]];
        }),
    );
  if (s.nullable) return null;
  if (s.kind === "number") return 0;
  if (s.kind === "boolean") return false;
  return "";
}
const words = (s: string) =>
  s.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ");
function unitFor(
  name: string,
  parent: Record<string, Json>,
): string | undefined {
  if (/Tco2PerGj/i.test(name)) return "tCO2/GJ";
  if (/Tco2PerMwh/i.test(name)) return "tCO2/MWh";
  if (/Tco2.*PerT/i.test(name)) return "tCO2/t";
  if (/MjPerUnit/i.test(name))
    return parent.unit ? `MJ/${parent.unit}` : undefined;
  if (/Mwh$/i.test(name)) return "MWh";
  if (/tonnes|quantityT$|massT$/i.test(name)) return "t";
  if (/Pct$/.test(name)) return "%";
  if (/Fraction$/.test(name)) return "fraction";
  if (/quantity/i.test(name) && typeof parent.unit === "string")
    return parent.unit;
  return undefined;
}
export function buildCatalogue(
  records: StoredReport[],
  workspaceId: string,
  month?: string,
) {
  const stores = new Map(records.map((r) => [r.key, r.value]));
  const wsIndex = array(stores.get("certrace:workspaces")).findIndex(
    (v) => object(v).id === workspaceId,
  );
  if (wsIndex < 0) throw Error("Report not found in this account.");
  const ws = object(array(stores.get("certrace:workspaces"))[wsIndex]);
  if (ws.internalSignoff || ws.verifierSignoff || ws.archivedAt)
    throw Error("Reopen this report before autofilling inputs.");
  if (
    month &&
    (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
      !month.startsWith(`${ws.year}-`) ||
      month < string(ws.periodStart).slice(0, 7) ||
      month > string(ws.periodEnd).slice(0, 7))
  )
    throw Error("Choose a month within this report's period.");
  const seeds = new Map<string, Json>();
  const targets: FieldTarget[] = [];
  const sources = array(
    object(stores.get("certrace:precursor-suppliers"))[workspaceId],
  ).map(object);
  const plan = object(
    object(object(stores.get("certrace:workspace-mmd-draft"))[workspaceId])
      .inputPlan,
  );
  const processes = array(plan.processes).map(object);
  const references: Record<string, string[]> = {
    fuelTypeIds: autofillReference.choices.fuelType.map((f) => f.value),
    precursorIds: sources.map((s) => string(s.id)),
    processId: processes.length
      ? processes.map((p) => string(p.id))
      : [`${workspaceId}:process:0`],
    process: processes.map((p) => string(p.id)),
    producingProcess: processes.map((p) => string(p.id)),
    product: processes.flatMap((p) =>
      array(p.products).map((g) => string(object(g).id)),
    ),
    productId: processes.length
      ? processes.flatMap((p) =>
          array(p.products).map((g) => string(object(g).id)),
        )
      : [`${workspaceId}:product:0`],
    evidence: array(
      object(stores.get("certrace:workspace-evidence"))[workspaceId],
    ).map((e) => string(object(e).id)),
  };
  references.process = references.processId!;
  references.product = references.productId!;
  references.producingProcess = references.processId!;
  references.source = array(
    object(stores.get("certrace:monthly-data"))[workspaceId],
  )
    .filter((r) => object(r).month === month)
    .flatMap((r) => [
      ...array(object(r).fuels).map((v) => `fuel:${object(v).id}`),
      ...array(object(r).electricitySources).map(
        (v) => `electricity:${object(v).id}`,
      ),
      ...array(object(r).processEmissionEntries).map(
        (v) => `material:${object(v).id}`,
      ),
    ]);
  const add = (
    key: string,
    path: Path,
    s: Shape,
    label: string,
    context: string,
    parent: Record<string, Json>,
    options?: readonly (string | number | boolean)[],
  ) => {
    const name = String(path.at(-1));
    const id = createHash("sha256")
      .update(JSON.stringify([key, path]))
      .digest("hex")
      .slice(0, 24);
    targets.push({
      id,
      key,
      path,
      label,
      kind: s.kind,
      options:
        options ??
        s.enum ??
        references[name] ??
        (
          autofillReference.choices as Record<
            string,
            { value: string; label: string }[]
          >
        )[name]?.map((c) => c.value),
      min: s.min,
      max: s.max,
      format: s.format,
      unit:
        unitFor(name, parent) ??
        label.match(/\((MWh|kWh|GJ|MJ|kg|t|%|tCO2\/t|tCO2\/MWh)\)/i)?.[1],
      current: at(stores.get(key), path) ?? null,
      context,
      shared:
        key === "certrace:installations" ||
        key === "certrace:supplier-companies" ||
        context.startsWith("company:"),
    });
  };
  const walk = (
    key: string,
    s: Shape,
    path: Path,
    context: string,
    label: string,
  ) => {
    const seed = seeds.get(key)!;
    const v = at(seed, path);
    const name = String(path.at(-1));
    if (fieldPolicy(name, s) === "system") return;
    if (s.kind === "object") {
      if (v == null) put(seed, path, blank(s, context), seed);
      for (const [k, child] of Object.entries(s.fields ?? {}))
        walk(key, child, [...path, k], context, `${label} / ${words(k)}`);
    } else if (s.kind === "array" && s.item) {
      if (s.item.kind === "string") {
        add(
          key,
          path,
          { ...s, kind: "string[]", enum: s.item.enum },
          label,
          context,
          {},
        );
        return;
      }
      const rows = Array.isArray(v) ? v : [];
      rows.forEach((row, i) => {
        if (object(row).month && month && object(row).month !== month) return;
        if (["submitted", "reviewed"].includes(string(object(row).status)))
          return;
        walk(
          key,
          s.item!,
          [...path, i],
          context,
          `${label} / ${string(object(row).name) || string(object(row).month) || `row ${i + 1}`}`,
        );
      });
      // A bounded new-row template lets the model map fields even when a table is empty.
      if (s.item.kind === "object") {
        put(seed, [...path, rows.length], blank(s.item, context), seed);
        walk(
          key,
          s.item,
          [...path, rows.length],
          context,
          `${label} / new row`,
        );
      }
    } else if (
      ["string", "number", "boolean", "decimalText"].includes(s.kind)
    ) {
      const parent = object(at(seed, path.slice(0, -1)) as Json);
      if (
        ["efTco2PerGj", "ncvMjPerUnit"].includes(name) &&
        parent.factorSource === "eu_standard"
      )
        return;
      if (
        name === "factorTco2PerMwh" &&
        ["grid_default", "self_generated"].includes(string(parent.sourceType))
      )
        return;
      if (name === "electricityMwh" && array(parent.electricitySources).length)
        return;
      add(key, path, s, label, context, parent);
    }
  };
  for (const key of inputStores) {
    const s = reportSpecs[key]!;
    seeds.set(
      key,
      structuredClone(stores.get(key) ?? (s.kind === "array" ? [] : {})),
    );
    if (key === "certrace:workspaces") {
      // Report identity and timeframe are fixed. Product descriptions remain inputs.
      for (const k of ["productName", "cnCode", "productionRoute"])
        if (s.item?.fields?.[k])
          walk(
            key,
            s.item.fields[k]!,
            [wsIndex, k],
            "annual",
            `Report / ${words(k)}`,
          );
    } else if (
      key === "certrace:installations" ||
      key === "certrace:supplier-companies"
    ) {
      const id =
        key === "certrace:installations" ? ws.installationId : ws.supplierId;
      array(seeds.get(key)).forEach((r, i) => {
        if (object(r).id === id)
          walk(key, s.item!, [i], "annual", key.slice(9));
      });
    } else if (key === "certrace:monthly-data") {
      if (!month) continue;
      const rows = array(object(seeds.get(key))[workspaceId]);
      let index = rows.findIndex((r) => object(r).month === month);
      if (index < 0) {
        index = rows.length;
        put(
          seeds.get(key)!,
          [workspaceId, index],
          blank(s.item!.item!, `${workspaceId}:month:${month}`, true),
          seeds.get(key)!,
        );
      }
      const row = object(at(seeds.get(key), [workspaceId, index]) as Json);
      if (["submitted", "reviewed"].includes(string(row.status))) continue;
      walk(
        key,
        s.item!.item!,
        [workspaceId, index],
        `${workspaceId}:month:${month}`,
        `Monthly ${month}`,
      );
    } else {
      if (
        key === "certrace:workspace-mmd-draft" &&
        !at(seeds.get(key), [workspaceId])
      ) {
        put(
          seeds.get(key)!,
          [workspaceId],
          structuredClone(autofillReference.emptyMmd) as Json,
          seeds.get(key)!,
        );
      }
      if (s.item?.kind === "object" && !at(seeds.get(key), [workspaceId]))
        put(
          seeds.get(key)!,
          [workspaceId],
          blank(s.item, workspaceId),
          seeds.get(key)!,
        );
      if (key === "certrace:workspace-mmd-draft") {
        const draft = object(at(seeds.get(key), [workspaceId]));
        draft.periodStart = ws.periodStart!;
        draft.periodEnd = ws.periodEnd!;
      }
      walk(key, s.item!, [workspaceId], workspaceId, key.slice(9));
    }
  }
  const key = "certrace:report-inputs:v1";
  seeds.set(key, structuredClone(stores.get(key) ?? {}));
  for (const section of sections) {
    const contexts =
      section.area === "monthly"
        ? month
          ? [`month:${month}`]
          : []
        : section.area === "precursor"
          ? sources.map((s) => `precursor:${s.id}`)
          : ["annual"];
    for (const context of contexts) {
      const scope = section.id.startsWith("0.")
        ? `company:${ws.selfSupplied !== false ? "self" : (ws.supplierId ?? workspaceId)}`
        : `${workspaceId}:${context}`;
      const path: Path = [scope, section.id];
      if (!at(seeds.get(key), path))
        put(
          seeds.get(key)!,
          path,
          { applicability: "", reason: "", rows: [] },
          seeds.get(key)!,
        );
      const shape = reportSpecs[key]!.item!.fields![section.id]!;
      // Applicability is explicitly reviewed with every new section; missing evidence never means no.
      add(
        key,
        [...path, "applicability"],
        shape.fields!.applicability!,
        `${section.title} / Does this apply?`,
        scope,
        {},
      );
      add(
        key,
        [...path, "reason"],
        shape.fields!.reason!,
        `${section.title} / Applicability explanation`,
        scope,
        {},
      );
      const rows = array(object(at(seeds.get(key), path) as Json).rows);
      const existingCount = rows.length;
      if (section.repeat || !rows.length)
        rows.push({ id: crypto.randomUUID(), values: {} });
      put(seeds.get(key)!, [...path, "rows"], rows, seeds.get(key)!);
      rows.forEach((row, index) => {
        for (const field of section.fields) {
          if (humanSectionFields.has(`${section.id}.${field.key}`)) continue;
          const fieldShape =
            shape.fields!.rows!.item!.fields!.values!.fields![field.key]!;
          const choices =
            "options" in field
              ? field.options?.map((o) => o.value)
              : references[field.kind];
          const s = {
            ...fieldShape,
            format:
              field.kind === "date"
                ? "date"
                : field.kind === "email"
                  ? "email"
                  : fieldShape.format,
          };
          add(
            key,
            [...path, "rows", index, "values", field.key],
            s,
            `${section.id} ${section.title} / ${index >= existingCount ? "new row" : `row ${index + 1}`} / ${field.label}`,
            scope,
            object(object(row).values),
            choices,
          );
        }
      });
    }
  }
  if (targets.length > 2500)
    throw Error(
      "This report has too many rows for one mapping. Reduce the report scope.",
    );
  return {
    targets,
    seeds,
    workspace: ws,
    entities: {
      choices: autofillReference.choices,
      processes: processes.map((p) => ({
        id: p.id,
        name: p.name,
        products: array(p.products).map((g) => ({
          id: object(g).id,
          name: object(g).name,
        })),
      })),
      suppliers: sources.map((s) => ({
        id: s.id,
        name: s.name,
        installation: s.installationName,
        product: s.precursorName,
      })),
    },
  };
}
