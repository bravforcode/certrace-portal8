import {
  array,
  object,
  string,
  type Json,
  type JsonObject,
} from "../../lib/json";
import { fail } from "../../lib/errors";
import {
  assumeOwner,
  currentRows,
  readRecord,
  writeRevision,
  lockOwner,
} from "./service";
import {
  consolidate,
  masterWriteOrder,
  prepareMasters,
} from "../master-data/consolidation";
import { validateRelations } from "./validation";
import { sameValue, type Tx } from "./storage";
import type { smart_links } from "../../generated/prisma/client";
const keys = [
  "certrace:monthly-data",
  "certrace:month-submissions",
  "certrace:precursor-suppliers",
  "certrace:workspace-evidence",
  "certrace:workspace-mmd-draft",
  "certrace:workspace-mmd-versions",
] as const;
const supplierFields = [
  "name",
  "installationName",
  "country",
  "installationUniqueId",
  "unlocode",
  "fullAddress",
  "latitude",
  "longitude",
  "precursorName",
  "cnCode",
  "productionRoute",
  "specificEmbeddedDirectTco2PerT",
  "specificEmbeddedIndirectTco2PerT",
  "reportingPeriodStart",
  "reportingPeriodEnd",
  "verifierName",
  "verifierAccreditationNumber",
  "verifierAccreditationIssuingCountry",
  "verifierAccreditationExpiryDate",
  "verificationReportIssueDate",
  "verificationCoverageStart",
  "verificationCoverageEnd",
  "sectorParams",
  "verifierAddress",
  "verifierLeadAuditor",
  "verifierAccreditationBody",
  "verifierReasonableAssurance",
  "verificationSectoralScope",
  "verificationReportExpiresAt",
  "verificationReportFileId",
] as const;
const recordKey = (token: string, key: string) => `supplier:${token}:${key}`;
const reject = (message: string): never =>
  fail(422, "INVALID_SUPPLIER_SCOPE", message);

/** Reopen the owner's month and replace the supplier draft in the same transaction. */
export async function reopenExchange(
  tx: Tx,
  link: smart_links,
  doc: JsonObject,
  request: {
    note?: string;
    areas?: string[];
    action?: "revision" | "approve_edit";
  },
  by: string,
) {
  const workspaceId = string(object(object(doc.supplierView).workspace).id);
  const month = link.month;
  if (!workspaceId || !month) reject("The monthly invitation is incomplete.");
  await lockOwner(tx, link.user_id);
  await assumeOwner(tx, link.user_id);
  const rows = await currentRows(tx, link.user_id);
  const stores = new Map(rows.map((r) => [r.key, r.value]));
  const monthlyKey = "certrace:monthly-data",
    submissionKey = "certrace:month-submissions";
  const monthly = { ...object(stores.get(monthlyKey)) };
  const entries = array(monthly[workspaceId]);
  if (!entries.some((v) => object(v).month === month))
    reject("This month has no submission to reopen.");
  const submissions = { ...object(stores.get(submissionKey)) };
  const months = { ...object(submissions[workspaceId]) };
  const previous = object(months[month!]);
  if (!Object.keys(previous).length || previous.state === "open")
    reject("This month has not been submitted.");
  const next = { ...previous };
  if (request.action === "approve_edit") {
    if (object(previous.editRequest).state !== "pending")
      reject("There is no pending request to approve.");
    next.editRequest = {
      ...object(previous.editRequest),
      state: "approved",
      decidedAt: new Date().toISOString(),
      decidedBy: by,
    };
  } else {
    if (!request.note?.trim()) reject("Describe the revision being requested.");
    Object.assign(next, {
      state: "changes_requested",
      revisionNote: string(request.note).trim(),
      revisionAt: new Date().toISOString(),
      revisionCarriedEdits: !!previous.editedByExporter,
      revisionAreas: request.areas ?? [],
      revisionRound: Number(previous.revisionRound ?? 0) + 1,
    });
    delete next.editRequest;
  }
  months[month!] = next;
  submissions[workspaceId] = months;
  monthly[workspaceId] = entries.map((v) => {
    if (object(v).month !== month) return v;
    const reopened = { ...object(v), status: "draft" } as JsonObject;
    delete reopened.notManufactured;
    return reopened;
  });
  stores.set(monthlyKey, monthly);
  stores.set(submissionKey, submissions);
  for (const key of [monthlyKey, submissionKey]) {
    const value = stores.get(key)!;
    validateRelations(key, value, stores);
    const old = rows.find((r) => r.key === key);
    await writeRevision(tx, link.user_id, key, value, old?.revision ?? 0);
  }
  const workspace = array(stores.get("certrace:workspaces")).find(
    (w) => object(w).id === workspaceId,
  );
  const installation = array(stores.get("certrace:installations")).find(
    (i) => object(i).id === object(workspace).installationId,
  );
  const invitation: JsonObject = {
    workspace: workspace ?? null,
    installation: installation ?? null,
    stores: Object.fromEntries(
      keys.map((key) => [
        key,
        object(stores.get(key))[workspaceId] ??
          (key === "certrace:workspace-mmd-draft" || key === submissionKey
            ? {}
            : []),
      ]),
    ),
  };
  await tx.$executeRawUnsafe("RESET ROLE");
  await persistExchange(tx, link, doc, invitation, false);
}
/** A token's editable rows are constrained by its server-owned invitation and month. */
export async function persistExchange(
  tx: Tx,
  link: smart_links,
  doc: JsonObject,
  incoming: JsonObject,
  submit: boolean,
  attestation?: JsonObject,
) {
  const invitation = object(doc.supplierView),
    precursor = object(invitation.precursor);
  const isPrecursor = !!precursor.workspaceId;
  const workspaceId = string(
    isPrecursor ? precursor.workspaceId : object(invitation.workspace).id,
  );
  if (!workspaceId) reject("The invitation is missing its workspace.");
  await lockOwner(tx, link.user_id);
  await assumeOwner(tx, link.user_id);
  const current = await currentRows(tx, link.user_id),
    stores = new Map(current.map((r) => [r.key, r.value]));
  if (
    !array(stores.get("certrace:workspaces")).some(
      (w) => object(w).id === workspaceId,
    )
  )
    reject("This workspace is unavailable.");
  const drafts = new Map<string, Json>();
  let publishEditRequest = false;
  if (isPrecursor) {
    const nodeId = string(object(precursor.node).id),
      answer = object(incoming.node);
    if (answer.id !== nodeId)
      reject("This link can edit only its invited precursor.");
    const ownerRows = array(
      object(stores.get("certrace:precursor-suppliers"))[workspaceId],
    ).map(object);
    const original = ownerRows.find((r) => r.id === nodeId);
    if (!original) return reject("This precursor is unavailable.");
    const node = { ...original };
    for (const field of supplierFields)
      if (Object.hasOwn(answer, field)) node[field] = answer[field]!;
    // A producer declares a figure; receipt alone is not verification. Keep
    // exporter-owned quantity/basis fields and stamp the response on submit.
    node.supplierReportUnavailable = incoming.reportUnavailable === true;
    node.dataOrigin =
      original.valueBasis === "default"
        ? "default_value"
        : incoming.reportUnavailable === true
          ? "supplier_unverified"
          : "supplier_verified";
    delete node.verificationChecks;
    if (incoming.reportUnavailable === true) {
      if (original.valueBasis !== "default") node.seeTco2ePerT = null;
      node.specificEmbeddedDirectTco2PerT = null;
      node.specificEmbeddedIndirectTco2PerT = null;
    } else if (original.valueBasis !== "default") {
      node.seeTco2ePerT =
        node.specificEmbeddedDirectTco2PerT == null &&
        node.specificEmbeddedIndirectTco2PerT == null
          ? null
          : Number(node.specificEmbeddedDirectTco2PerT ?? 0) +
            Number(node.specificEmbeddedIndirectTco2PerT ?? 0);
    }
    if (submit) {
      const at = new Date().toISOString();
      node.supplierResponseReceived = true;
      node.smartLinkOpenedAt = original.smartLinkOpenedAt ?? at;
      node.smartLinkSubmittedAt = at;
    }
    if (
      incoming.evidence !== undefined &&
      !array(incoming.evidence).some(
        (item) => object(item).id === node.verificationReportFileId,
      )
    )
      delete node.verificationReportFileId;
    drafts.set("certrace:precursor-suppliers", { [workspaceId]: [node] });
    if (incoming.evidence !== undefined)
      drafts.set("certrace:workspace-evidence", {
        [workspaceId]: array(incoming.evidence).map((v) => {
          const key = `precursor:${nodeId}`;
          const kept = array(object(v).fieldKeys).filter(
            (k) =>
              typeof k === "string" && (k === key || k.startsWith(`${key}:`)),
          );
          return {
            ...object(v),
            workspaceId,
            fieldKeys: kept.length > 0 ? kept : [key],
          };
        }),
      });
  } else {
    if (object(incoming.workspace).id !== workspaceId)
      reject("This link cannot change workspace identity.");
    const submitted = object(incoming.stores);
    if (submit) {
      if (
        !string(attestation?.signatoryName).trim() ||
        !string(attestation?.signatoryRole).trim()
      )
        reject("A name and role are required to submit this month.");
      if (
        !array(submitted["certrace:monthly-data"]).some(
          (v) => object(v).month === link.month,
        )
      )
        reject("The invited month must be included in the submission.");
    }
    for (const key of Object.keys(submitted))
      if (!keys.includes(key as (typeof keys)[number]))
        reject("Unsupported supplier input store.");
    for (const key of keys) {
      if (
        submitted[key] === undefined &&
        !(submit && key === "certrace:month-submissions")
      )
        continue;
      let value = submitted[key] ?? {};
      if (
        key === "certrace:monthly-data" ||
        key === "certrace:workspace-evidence"
      ) {
        value = array(value).filter(
          (v) =>
            object(v).month === link.month ||
            (key === "certrace:workspace-evidence" && !object(v).month),
        );
        for (const row of array(value))
          if (object(row).workspaceId !== workspaceId)
            reject("A supplier row belongs to another workspace.");
        if (submit && key === "certrace:monthly-data")
          value = array(value).map((v) => ({
            ...object(v),
            status: "submitted",
            submittedAt: new Date().toISOString(),
            submittedBy: string(attestation?.signatoryName).trim(),
          }));
      } else if (key === "certrace:month-submissions") {
        if (!link.month)
          reject("A month is required for a monthly submission.");
        const incomingMonth = object(object(value)[link.month!]);
        if (!submit && !Object.keys(incomingMonth).length) continue;
        const previous = object(
          object(object(stores.get(key))[workspaceId])[link.month!],
        );
        const allowed: JsonObject = {
          ...previous,
          workspaceId,
          month: link.month!,
          state: submit ? "submitted" : (previous.state ?? "open"),
          attestation: previous.attestation ?? null,
          editedByExporter: previous.editedByExporter ?? false,
        };
        if (submit) {
          const stamp = {
            fullName: string(attestation?.signatoryName).trim(),
            role: string(attestation?.signatoryRole).trim(),
            at: new Date().toISOString(),
            warningsAcknowledged: 0,
          };
          allowed.attestation = stamp;
          allowed.history = [
            ...(Array.isArray(previous.history)
              ? previous.history
              : previous.attestation
                ? [previous.attestation]
                : []),
            stamp,
          ];
          allowed.submittedAt = stamp.at;
          allowed.editedByExporter = false;
          for (const field of [
            "editedAt",
            "revisionNote",
            "revisionAt",
            "revisionCarriedEdits",
            "revisionAreas",
            "editRequest",
            "confirmedAt",
            "confirmedBy",
          ])
            delete allowed[field];
        }
        if (
          !submit &&
          incomingMonth.editRequest &&
          object(incomingMonth.editRequest).state === "pending"
        ) {
          const request = object(incomingMonth.editRequest);
          if (!string(request.reason).trim())
            reject("Describe the correction being requested.");
          const prior = object(previous.editRequest);
          if (
            object(link.state).status === "submitted" &&
            prior.state !== "pending" &&
            (!prior.at || prior.at !== request.at)
          ) {
            allowed.editRequest = {
              at: new Date().toISOString(),
              reason: string(request.reason).trim(),
              state: "pending",
            };
            publishEditRequest = true;
          }
        }
        value = { [link.month!]: allowed };
      } else if (key === "certrace:workspace-mmd-versions") continue; // Finalizing methodology belongs to the owner.

      drafts.set(key, { [workspaceId]: value });
    }
  }
  if (!isPrecursor && incoming.installation) {
    const installationId = string(object(invitation.installation).id);
    const item = object(incoming.installation);
    if (!installationId || item.id !== installationId)
      reject("This link cannot change installation identity.");
    const original = array(stores.get("certrace:installations")).find(
      (i) => object(i).id === installationId,
    );
    if (!original) reject("Installation unavailable.");
    drafts.set("certrace:installations", [
      {
        ...object(original),
        ...item,
        self: object(original).self,
        supplierId: object(original).supplierId,
      },
    ]);
  }
  for (const [key, value] of drafts) {
    const k = recordKey(link.token, key),
      previous = await readRecord(tx, link.user_id, k);
    if (!previous || !sameValue(previous.value, value))
      await writeRevision(tx, link.user_id, k, value, previous?.revision ?? 0);
  }
  if (submit || publishEditRequest) {
    for (const [key, value] of drafts) {
      if (!submit && key !== "certrace:month-submissions") continue;
      if (key === "certrace:installations") {
        const replacement = object(array(value)[0]);
        stores.set(
          key,
          array(stores.get(key)).map((i) =>
            object(i).id === replacement.id ? replacement : i,
          ),
        );
        continue;
      }
      const whole = { ...object(stores.get(key)) };
      const incomingPart = object(value)[workspaceId]!;
      if (key === "certrace:month-submissions")
        whole[workspaceId] = {
          ...object(whole[workspaceId]),
          ...object(incomingPart),
        };
      else if (key === "certrace:monthly-data") {
        const incomingIds = new Set(
          array(incomingPart).map((r) => object(r).id),
        );
        if (
          array(whole[workspaceId]).some(
            (r) =>
              object(r).month !== link.month && incomingIds.has(object(r).id),
          )
        )
          reject("A month cannot reuse another month’s row identity.");
        whole[workspaceId] = [
          ...array(whole[workspaceId]).filter(
            (r) => object(r).month !== link.month,
          ),
          ...array(incomingPart),
        ];
      } else if (isPrecursor && key === "certrace:workspace-evidence") {
        const field = `precursor:${string(object(precursor.node).id)}`;
        const unrelated = array(whole[workspaceId]).filter(
          (row) =>
            !array(object(row).fieldKeys).some(
              (k) =>
                typeof k === "string" &&
                (k === field || k.startsWith(`${field}:`)),
            ),
        );
        const incomingIds = new Set(
          array(incomingPart).map((row) => object(row).id),
        );
        if (unrelated.some((row) => incomingIds.has(object(row).id)))
          reject(
            "An attachment cannot reuse another precursor's evidence identity.",
          );
        whole[workspaceId] = [...unrelated, ...array(incomingPart)];
      } else if (Array.isArray(incomingPart)) {
        const original = array(whole[workspaceId]);
        const replacements = new Map(
          incomingPart.map((row) => [string(object(row).id), row]),
        );
        const merged = original.map(
          (row) => replacements.get(string(object(row).id)) ?? row,
        );
        const ids = new Set(original.map((r) => string(object(r).id)));
        for (const row of incomingPart)
          if (!ids.has(string(object(row).id))) merged.push(row);
        whole[workspaceId] = merged;
      } else whole[workspaceId] = incomingPart;
      stores.set(key, whole);
    }
    const shared = consolidate(
      new Map(current.map((r) => [r.key, r.value])),
      stores,
    );
    await prepareMasters(tx, shared);
    for (const [key, value] of [...shared].sort(
      ([a], [b]) => masterWriteOrder(a) - masterWriteOrder(b),
    )) {
      validateRelations(key, value, shared);
      const old = current.find((r) => r.key === key);
      if (!old || !sameValue(old.value, value))
        await writeRevision(tx, link.user_id, key, value, old?.revision ?? 0);
    }
  }
  await tx.$executeRawUnsafe("RESET ROLE");
}
/** A monthly form needs the shared methodology and only its own month. */
export function monthlyView(slice: JsonObject, link: smart_links): JsonObject {
  const workspace = object(slice.workspace);
  if (!link.month || workspace.id !== link.supplier_id)
    return reject("The monthly invitation does not match this workspace.");
  const stores = object(slice.stores);
  const scoped: JsonObject = {};
  for (const key of ["certrace:monthly-data", "certrace:workspace-evidence"]) {
    if (key in stores)
      scoped[key] = array(stores[key]).filter(
        (row) =>
          object(row).workspaceId === workspace.id &&
          object(row).month === link.month,
      );
  }
  const review = object(stores["certrace:month-submissions"])[link.month];
  if (review) scoped["certrace:month-submissions"] = { [link.month]: review };
  if (stores["certrace:workspace-mmd-draft"])
    scoped["certrace:workspace-mmd-draft"] =
      stores["certrace:workspace-mmd-draft"];
  return {
    workspace: {
      ...Object.fromEntries(
        [
          "id",
          "installationId",
          "installationName",
          "productId",
          "productName",
          "cnCode",
          "productionRoute",
          "country",
          "year",
          "periodStart",
          "periodEnd",
          "createdAt",
          "schedule",
        ]
          .filter((k) => k in workspace)
          .map((k) => [k, workspace[k]!]),
      ),
      declarationIds: [],
    },
    installation: null,
    stores: scoped,
  };
}

export async function exchangeSlice(
  tx: Tx,
  link: smart_links,
  doc: JsonObject,
): Promise<JsonObject | undefined> {
  const invitation = object(doc.supplierView),
    precursor = object(invitation.precursor),
    isPrecursor = !!precursor.workspaceId;
  const workspaceId = string(
    isPrecursor ? precursor.workspaceId : object(invitation.workspace).id,
  );
  if (!workspaceId) return undefined;
  await assumeOwner(tx, link.user_id);
  const installation = await readRecord(
    tx,
    link.user_id,
    recordKey(link.token, "certrace:installations"),
  );
  const values: JsonObject = {};
  for (const key of keys) {
    const record = await readRecord(
      tx,
      link.user_id,
      recordKey(link.token, key),
    );
    if (record) values[key] = object(record.value)[workspaceId] ?? null;
  }
  if (!isPrecursor && link.month) {
    // Review decisions belong to the exporter. A closed supplier link must
    // show the latest decision even when its figures remain unchanged.
    const reviews = await readRecord(
      tx,
      link.user_id,
      "certrace:month-submissions",
    );
    const review = object(object(reviews?.value)[workspaceId])[link.month];
    if (review) values["certrace:month-submissions"] = { [link.month]: review };
  }
  await tx.$executeRawUnsafe("RESET ROLE");
  if (!Object.keys(values).length && !installation) return undefined;
  if (isPrecursor) {
    const node = object(array(values["certrace:precursor-suppliers"])[0]);
    return {
      reportUnavailable: node.supplierReportUnavailable === true,
      node: Object.fromEntries(
        ["id", ...supplierFields]
          .filter((k) => Object.hasOwn(node, k))
          .map((k) => [k, node[k]!]),
      ),
      evidence: values["certrace:workspace-evidence"] ?? [],
    };
  }
  return monthlyView(
    {
      ...invitation,
      ...(installation
        ? { installation: array(installation.value)[0] ?? null }
        : {}),
      stores: { ...object(invitation.stores), ...values },
    },
    link,
  );
}
