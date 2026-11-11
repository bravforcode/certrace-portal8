import { db } from "../../lib/db";
import { fail, missing } from "../../lib/errors";
import {
  object,
  array,
  string,
  number,
  canonical,
  type JsonObject,
} from "../../lib/json";
import { hash } from "../../lib/security";
import type { Prisma, smart_links } from "../../generated/prisma/client";
import {
  exchangeSlice,
  monthlyView,
  persistExchange,
} from "../reporting/exchanges";
import { assumeOwner, readRecord } from "../reporting/service";
import { trialEnded } from "../auth/trial";
export const emptyState = (token: string): JsonObject => ({
  token,
  status: "new",
  values: {},
  docs: {},
  seats: [],
  profile: null,
  profileSaved: false,
  versions: [],
  lastCheck: null,
  events: [],
  unlocked: [],
  unlockedDocs: [],
  revisionNote: "",
  carried: null,
  attestation: null,
  updatedAt: Date.now(),
});
export async function liveLink(
  token: string,
  tx: Prisma.TransactionClient = db,
) {
  const link = await tx.smart_links.findUnique({
    where: { token },
    include: { portal_declarations: { include: { users: true } } },
  });
  if (!link) return missing("TOKEN_NOT_FOUND");
  if (link.revoked_at || link.portal_declarations.users.status !== "ACTIVE")
    fail(410, "TOKEN_REVOKED", "This link was revoked.");
  if (link.expires_at <= new Date())
    fail(410, "TOKEN_EXPIRED", "This link has expired.");
  return link;
}

// Public writes add customer data to the owner's workspace, so they stop when
// the owner's trial has ended. Reads keep using liveLink.
export async function liveWritableLink(
  token: string,
  tx: Prisma.TransactionClient = db,
) {
  const link = await liveLink(token, tx);
  if (trialEnded(link.portal_declarations.users))
    fail(
      403,
      "TRIAL_ENDED",
      "Your free trial has ended. Choose a plan to keep editing.",
    );
  return link;
}
export async function ownedLink(
  userId: string,
  declarationId: string,
  token: string,
  tx: Prisma.TransactionClient = db,
) {
  const link = await tx.smart_links.findFirst({
    where: { token, user_id: userId, declaration_id: declarationId },
  });
  if (!link) return missing("TOKEN_NOT_FOUND");
  return link;
}
const serverFields = [
  "versions",
  "attestation",
  "unlocked",
  "unlockedDocs",
  "revisionNote",
];
const notContent = new Set([
  ...serverFields,
  "token",
  "status",
  "events",
  "updatedAt",
  "lastCheck",
]);
export function guardedState(
  stored: JsonObject,
  incoming: JsonObject,
  workspace: boolean,
) {
  const state = { ...stored, ...incoming };
  for (const k of serverFields) state[k] = stored[k] ?? null;
  state.status = ["submitted", "revision_requested"].includes(
    string(stored.status),
  )
    ? stored.status!
    : ["new", "draft", "in_check"].includes(string(incoming.status))
      ? incoming.status!
      : stored.status!;
  const events = array(stored.events).map(object);
  const ids = new Set(events.map((e) => e.id));
  for (const event of array(incoming.events).map(object))
    if (
      typeof event.id === "string" &&
      !ids.has(event.id) &&
      !["submit", "revision_requested"].includes(string(event.kind))
    ) {
      events.push(event);
      ids.add(event.id);
    }
  state.events = events.slice(-1000);
  if (!workspace && stored.status === "revision_requested") {
    for (const [field, unlocked] of [
      ["values", "unlocked"],
      ["docs", "unlockedDocs"],
    ] as const) {
      const next = { ...object(stored[field]) };
      const incomingFields = object(incoming[field]);
      for (const key of array(stored[unlocked]))
        if (typeof key === "string") {
          if (key in incomingFields) next[key] = incomingFields[key]!;
          else delete next[key];
        }
      state[field] = next;
    }
    // The questionnaire regenerates the total when an unlocked component changes.
    // Carry that derived value too, provided it uses the permitted input values.
    const values = object(state.values),
      incomingValues = object(incoming.values);
    const components = ["direct-emissions", "indirect-emissions", "precursors"];
    for (const key of array(stored.unlocked)) {
      if (
        typeof key !== "string" ||
        !/::(direct-emissions|indirect-emissions|precursors)$/.test(key)
      )
        continue;
      const product = key.slice(0, key.lastIndexOf("::"));
      const total = `${product}::total-emissions`;
      if (
        typeof incomingValues[total] === "string" &&
        components.every(
          (component) =>
            incomingValues[`${product}::${component}`] ===
            values[`${product}::${component}`],
        )
      )
        values[total] = incomingValues[total]!;
    }
  }
  return state;
}
export function summary(link: smart_links) {
  const state = object(link.state),
    versions = array(state.versions);
  return {
    token: link.token,
    supplierId: link.supplier_id,
    month: link.month,
    status: string(state.status, "new"),
    version: number(object(versions.at(-1)).n),
    score: object(versions.at(-1)).score ?? null,
    updatedAt: state.updatedAt ?? +link.created_at,
    lastCheck: state.lastCheck ?? null,
    versions: versions.length,
    latestVersion: versions.at(-1) ?? null,
    expiresAt: +link.expires_at,
    revokedAt: link.revoked_at ? +link.revoked_at : null,
  };
}
export async function resolve(token: string) {
  const link = await liveLink(token),
    doc = object(link.portal_declarations.doc);
  const currentProfile = await db.$transaction(async (tx) => {
    await assumeOwner(tx, link.user_id);
    return readRecord(tx, link.user_id, "certrace:profile");
  });
  const profile = object(
    currentProfile
      ? currentProfile.value
      : (
          await db.account_records.findUnique({
            where: {
              user_id_key: { user_id: link.user_id, key: "certrace:profile" },
            },
          })
        )?.value,
  );
  const common = {
    token,
    declId: link.declaration_id,
    supplierId: link.supplier_id,
    month: link.month,
    expiresAt: +link.expires_at,
    exporter: {
      companyName: string(
        profile.companyName,
        link.portal_declarations.users.company_name ?? "",
      ),
    },
    state: await readState(link),
  };
  if (doc.kind === "workspace")
    return {
      ...common,
      kind: "workspace" as const,
      workspace: object(doc.supplierView).precursor
        ? { precursor: object(doc.supplierView).precursor }
        : monthlyView(object(doc.supplierView), link),
    };
  const spec =
    array(doc.requests)
      .map(object)
      .find((r) => r.supplierId === link.supplier_id) ?? {};
  const row =
    array(doc.suppliers)
      .map(object)
      .find((r) => r.id === link.supplier_id) ?? {};
  return {
    ...common,
    declaration: {
      name: string(doc.title ?? doc.name),
      regulation: string(doc.regulation, "cbam"),
      origin: string(doc.origin),
      market: string(doc.market),
      period: string(doc.period),
      periodEnd: string(doc.periodEnd),
      due: string(doc.due),
      dueInDays: number(doc.dueInDays),
      kind: string(doc.kind, "cbam"),
      includedFieldIds: Array.isArray(doc.includedFieldIds)
        ? doc.includedFieldIds
        : null,
      note: string(doc.notesToSuppliers),
    },
    supplier: {
      name: string(row.name),
      ref: string(row.ref),
      country: string(row.country),
      material: string(row.material),
      critical: Boolean(row.critical),
      selfSupplied: Boolean(row.selfSupplied),
    },
    request: { products: array(spec.products) },
  };
}
export async function save(
  token: string,
  incoming: JsonObject,
  submission?: { attestation: JsonObject; check?: JsonObject | null },
) {
  if (Buffer.byteLength(JSON.stringify({ incoming, submission })) > 524288)
    fail(413, "STATE_TOO_LARGE", "Attach large documents as files instead.");
  return db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT token FROM smart_links WHERE token=${token} FOR UPDATE`;
      const link = await liveWritableLink(token, tx),
        workspace = object(link.portal_declarations.doc).kind === "workspace";
      const stored = await readState(link, tx);
      const invitation = object(
        object(link.portal_declarations.doc).supplierView,
      );
      const monthly = workspace && !!object(invitation.workspace).id;
      if (monthly && incoming.slice)
        incoming = {
          ...incoming,
          slice: monthlyView(object(incoming.slice), link),
        };
      if (monthly && stored.status === "submitted") {
        // A supplier may ask to correct a submitted month, but the owner is
        // the only party that can reopen its figures and methodology.
        const content = (slice: unknown) => {
          const next = structuredClone(object(slice as JsonObject));
          // Review metadata is owned by the exporter and may have advanced
          // since this supplier opened the page. persistExchange checks it.
          delete object(next.stores)["certrace:month-submissions"];
          return canonical(next);
        };
        if (
          submission ||
          content(incoming.slice ?? stored.slice) !== content(stored.slice)
        )
          fail(
            409,
            "LINK_SUBMITTED",
            "This month is submitted. Ask the exporter to reopen it before changing the figures.",
          );
      }
      if (!workspace && stored.status === "submitted")
        fail(
          409,
          "LINK_SUBMITTED",
          "This was already submitted. Ask the exporter to request a revision.",
        );
      const state = guardedState(stored, incoming, workspace),
        now = Date.now();
      if (workspace && state.slice) {
        await persistExchange(
          tx,
          link,
          object(link.portal_declarations.doc),
          object(state.slice),
          !!submission,
          submission?.attestation,
        );
        state.slice =
          (await exchangeSlice(
            tx,
            link,
            object(link.portal_declarations.doc),
          )) ?? state.slice;
      }
      if (submission) {
        const versions = array(stored.versions),
          check = submission.check ?? {};
        const version = {
          n: number(object(versions.at(-1)).n) + 1,
          submittedAt: now,
          score: check.score ?? 0,
          warnings: check.warnings ?? 0,
          signedBy: submission.attestation.signatoryName ?? "",
          signedRole: submission.attestation.signatoryRole ?? "",
          contentSha256: hash(
            canonical(
              Object.fromEntries(
                Object.entries(state).filter(([k]) => !notContent.has(k)),
              ),
            ),
          ),
          ...(stored.status === "revision_requested" && stored.revisionNote
            ? { note: stored.revisionNote }
            : {}),
        };
        state.versions = [...versions, version];
        state.status = "submitted";
        state.attestation = submission.attestation;
        state.lastCheck = submission.check ?? null;
        state.events = [
          ...array(state.events),
          {
            id: crypto.randomUUID(),
            at: now,
            kind: "submit",
            text: `Version ${version.n} signed by ${version.signedBy} and submitted`,
          },
        ];
        state.unlocked = [];
        state.unlockedDocs = [];
        state.revisionNote = "";
      }
      state.token = token;
      state.updatedAt = now;
      const persisted = { ...state };
      if (workspace && state.slice) {
        delete persisted.slice;
        persisted.hasReportSlice = true;
      }
      await tx.smart_links.update({
        where: { token },
        data: { state: persisted, updated_at: new Date() },
      });
      return state;
    },
    { timeout: 120000 },
  );
}

export async function readState(
  link: smart_links,
  tx?: Prisma.TransactionClient,
): Promise<JsonObject> {
  const read = async (client: Prisma.TransactionClient) => {
    const state = { ...emptyState(link.token), ...object(link.state) };
    const declaration = await client.portal_declarations.findUnique({
      where: { user_id_id: { user_id: link.user_id, id: link.declaration_id } },
    });
    if (object(declaration?.doc).kind === "workspace") {
      const slice = await exchangeSlice(client, link, object(declaration?.doc));
      if (slice) state.slice = slice;
      else if (
        state.slice &&
        !object(object(declaration?.doc).supplierView).precursor
      )
        state.slice = monthlyView(object(state.slice), link);
    }
    return state;
  };
  return tx ? read(tx) : db.$transaction(read, { timeout: 120000 });
}
