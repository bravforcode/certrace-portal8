import { fail } from "../../lib/errors";
import { object, array, string, canonical, type Json } from "../../lib/json";
import { sections } from "./sections";
function invalid(message: string): never {
  return fail(422, "INVALID_REPORT_REFERENCE", message);
}
function unique(rows: Json[], field: string, label: string) {
  const seen = new Set<string>();
  for (const row of rows) {
    const id = string(object(row)[field]);
    if (!id || seen.has(id))
      invalid(`${label}: ${field} must be nonempty and unique.`);
    seen.add(id);
  }
}
/** Validate IDs against the authenticated account's own report graph, never a global lookup. */
export function validateRelations(
  key: string,
  value: Json,
  stored: Map<string, Json>,
) {
  const all = new Map(stored);
  all.set(key, value);
  const workspaces = array(all.get("certrace:workspaces")).map(object);
  const wsById = new Map(workspaces.map((w) => [string(w.id), w]));
  const installations = array(all.get("certrace:installations")).map(object);
  const mmd = object(all.get("certrace:workspace-mmd-draft"));
  const months = object(all.get("certrace:monthly-data"));
  const precursors = object(all.get("certrace:precursor-suppliers"));
  const evidence = object(all.get("certrace:workspace-evidence"));
  const scoped = new Set([
    "certrace:final-report-snapshot",
    "certrace:workspace-mmd-draft",
    "certrace:workspace-mmd-versions",
    "certrace:monthly-data",
    "certrace:precursor-suppliers",
    "certrace:workspace-evidence",
    "certrace:pack-signoff",
    "certrace:carbon-price",
    "certrace:month-submissions",
    "certrace:monthly-requests",
    "certrace:internal-precursors",
    "certrace:unit-costs",
  ]);
  if (key.startsWith("certrace:report-snapshots:")) {
    if (!wsById.has(key.slice("certrace:report-snapshots:".length)))
      invalid("Unknown report workspace.");
    const previous = array(stored.get(key)),
      next = array(value);
    if (
      next.length < previous.length ||
      previous.some((v, i) => canonical(v) !== canonical(next[i]!))
    )
      invalid(
        "Saved report outputs are immutable. Append a corrected version.",
      );
  }
  if (key === "certrace:workspaces") {
    unique(array(value), "id", "Workspaces");
    for (const ws of workspaces) {
      const previous = array(stored.get("certrace:workspaces"))
        .map(object)
        .find((w) => w.id === ws.id);
      if (
        previous &&
        ["installationId", "productId", "year"].some(
          (k) => previous[k] !== ws[k],
        )
      )
        invalid(
          "Installation, product, and reporting year identify a report. Create a new report to change them.",
        );
      if (!installations.some((i) => i.id === ws.installationId))
        invalid(`Workspace ${ws.id}: select an installation in this account.`);
      if (
        !Number.isInteger(ws.year) ||
        Number(ws.year) < 2000 ||
        Number(ws.year) > 2200
      )
        invalid("Invalid reporting year.");
    }
    // A parent deletion must not orphan an existing report dataset.
    for (const k of scoped)
      for (const id of Object.keys(object(all.get(k))))
        if (!wsById.has(id))
          invalid(
            `Workspace ${id} still has report records. Archive it instead.`,
          );
  }
  if (key === "certrace:installations") {
    unique(array(value), "id", "Installations");
    for (const ws of workspaces)
      if (!installations.some((i) => i.id === ws.installationId))
        invalid(`Installation ${ws.installationId} is used by a workspace.`);
  }
  const scopedEntries =
    key === "certrace:workspaces"
      ? [...scoped].flatMap((k) =>
          Object.entries(object(all.get(k))).map(([id, data]) => ({
            key: k,
            id,
            data,
          })),
        )
      : scoped.has(key)
        ? Object.entries(object(value)).map(([id, data]) => ({ key, id, data }))
        : [];
  for (const { key, id, data } of scopedEntries) {
    const ws = wsById.get(id);
    if (!ws) invalid(`Workspace ${id} does not belong to this account.`);
    if (Array.isArray(data)) {
      if (
        [
          "certrace:monthly-data",
          "certrace:precursor-suppliers",
          "certrace:workspace-evidence",
        ].includes(key)
      )
        unique(data, "id", key);
      for (const item of data) {
        const row = object(item);
        if (row.workspaceId !== undefined && row.workspaceId !== id)
          invalid("A row cannot be moved to another workspace.");
        if (
          row.month !== undefined &&
          (!/^\d{4}-(0[1-9]|1[0-2])$/.test(string(row.month)) ||
            !string(row.month).startsWith(String(ws.year) + "-"))
        )
          invalid("A month must belong to the workspace reporting year.");
      }
    }
  }
  if (["certrace:monthly-data", "certrace:workspace-mmd-draft"].includes(key))
    for (const [id, data] of Object.entries(months)) {
      const rows = array(data);
      unique(rows, "month", "Monthly readings");
      const configured = array(object(object(mmd[id]).inputPlan).processes).map(
        object,
      );
      const processes = configured.length
        ? configured
        : [{ id: id + ":process:0", products: [{ id: id + ":product:0" }] }];
      for (const item of rows) {
        const row = object(item);
        for (const field of [
          "fuels",
          "electricitySources",
          "processEmissionEntries",
        ])
          if (row[field]) unique(array(row[field]), "id", field);
        for (const material of array(row.processEmissionEntries).map(object))
          if (
            material.method !== "mass_balance" &&
            Number(material.quantityT) < 0
          )
            invalid(
              "Only a mass-balance output stream can have a negative quantity.",
            );
        for (const output of array(row.outputQuantities).map(object)) {
          const p = processes.find((p) => p.id === output.processId);
          if (
            !p ||
            !array(p.products).some((g) => object(g).id === output.productId)
          )
            invalid(
              "Production output must reference a product in its selected process.",
            );
        }
      }
    }
  if (key === "certrace:precursor-suppliers")
    for (const [id, data] of Object.entries(object(value))) {
      const rows = array(data).map(object),
        byId = new Map(rows.map((r) => [string(r.id), r]));
      for (const row of rows) {
        let parent = row.parentId;
        const seen = new Set([string(row.id)]);
        while (typeof parent === "string" && parent) {
          if (seen.has(parent))
            invalid("A precursor chain cannot contain a cycle.");
          seen.add(parent);
          const p = byId.get(parent);
          if (!p) invalid("Precursor parent must be in the same workspace.");
          parent = p.parentId;
        }
      }
    }
  if (["certrace:internal-precursors", "certrace:workspaces"].includes(key)) {
    const links = object(all.get("certrace:internal-precursors"));
    for (const [id, data] of Object.entries(links)) {
      const owner = wsById.get(id);
      unique(array(data), "id", "Internal precursors");
      for (const row of array(data).map(object)) {
        const source = wsById.get(string(row.sourceWorkspaceId));
        if (
          !owner ||
          !source ||
          row.workspaceId !== id ||
          source.id === id ||
          source.installationId !== owner.installationId ||
          source.year !== owner.year
        )
          invalid(
            "An internal precursor must reference another product report at the same installation and year.",
          );
      }
      const visit = (current: string, path: Set<string>) => {
        if (path.has(current))
          invalid("Internal precursor products cannot contain a cycle.");
        const next = new Set(path).add(current);
        for (const row of array(links[current]).map(object))
          visit(string(row.sourceWorkspaceId), next);
      };
      visit(id, new Set());
    }
  }
  // Revalidate the referencing side on both child writes and parent edits/deletes.
  if (
    [
      "certrace:report-inputs:v1",
      "certrace:workspace-mmd-draft",
      "certrace:workspace-evidence",
      "certrace:monthly-data",
      "certrace:precursor-suppliers",
      "certrace:workspaces",
      "certrace:supplier-companies",
    ].includes(key)
  ) {
    const inputs = object(all.get("certrace:report-inputs:v1"));
    for (const [scope, answers] of Object.entries(inputs)) {
      if (scope.startsWith("company:")) {
        const company = scope.slice(8);
        if (
          company !== "self" &&
          !workspaces.some((w) => (w.supplierId ?? w.id) === company) &&
          !array(all.get("certrace:supplier-companies")).some(
            (c) => object(c).id === company,
          )
        )
          invalid("Unknown company report scope.");
        for (const topic of Object.keys(object(answers)))
          if (!topic.startsWith("0."))
            invalid("Only company topics belong in company scope.");
        continue;
      }
      const ws = [...workspaces]
        .sort((a, b) => string(b.id).length - string(a.id).length)
        .find((w) => scope.startsWith(string(w.id) + ":"));
      if (!ws) invalid(`Unknown report scope ${scope}.`);
      const id = string(ws.id),
        context = scope.slice(id.length + 1);
      if (
        context !== "annual" &&
        !context.startsWith("month:") &&
        !context.startsWith("precursor:")
      )
        invalid("Invalid report scope.");
      const processRows = array(
        object(object(mmd[id]).inputPlan).processes,
      ).map(object);
      // The UI seeds these IDs before a methodology is explicitly saved.
      const processIds = new Set(
        processRows.length
          ? processRows.map((p) => string(p.id))
          : [id + ":process:0"],
      );
      const productIds = new Set(
        processRows.length
          ? processRows.flatMap((p) =>
              array(p.products).map((g) => string(object(g).id)),
            )
          : [id + ":product:0"],
      );
      const evIds = new Set(
        array(evidence[id]).map((e) => string(object(e).id)),
      );
      const month = context.startsWith("month:") ? context.slice(6) : null;
      if (
        month &&
        (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
          !month.startsWith(String(ws.year) + "-"))
      )
        invalid("Invalid report month scope.");
      if (
        context.startsWith("precursor:") &&
        !array(precursors[id]).some((p) => object(p).id === context.slice(10))
      )
        invalid("Unknown precursor scope.");
      const entry =
        array(months[id])
          .map(object)
          .find((m) => m.month === month) ?? {};
      const sourceIds = new Set(
        [
          ["fuels", "fuel"],
          ["electricitySources", "electricity"],
          ["processEmissionEntries", "material"],
        ].flatMap(([k, prefix]) =>
          array(entry[k!]).map((s) => `${prefix}:${object(s).id}`),
        ),
      );
      for (const [topic, answer] of Object.entries(object(answers))) {
        const section = sections.find((s) => s.id === topic);
        if (!section) invalid("Unknown report topic.");
        if (topic.startsWith("0."))
          invalid("Company inputs require company scope.");
        unique(array(object(answer).rows), "id", `Topic ${topic}`);
        if (section.area === "monthly" && !month)
          invalid("Monthly inputs need a month scope.");
        if (section.area === "precursor" && !context.startsWith("precursor:"))
          invalid("Precursor inputs need a precursor scope.");
        if (!section.repeat && array(object(answer).rows).length > 1)
          invalid(`${topic} allows one record.`);
        for (const row of array(object(answer).rows)) {
          const values = object(object(row).values);
          for (const f of section.fields) {
            const v = string(values[f.key]);
            if (!v) continue;
            const valid =
              f.kind === "process"
                ? processIds.has(v)
                : f.kind === "product"
                  ? productIds.has(v)
                  : f.kind === "evidence"
                    ? evIds.has(v)
                    : f.kind === "source"
                      ? sourceIds.has(v)
                      : true;
            if (!valid)
              invalid(`${topic}.${f.key}: select a record from this report.`);
          }
        }
      }
    }
  }
}
