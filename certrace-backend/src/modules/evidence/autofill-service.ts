import { db } from "../../lib/db";
import { ApiError, fail } from "../../lib/errors";
import { hash, rateLimit } from "../../lib/security";
import { trialEnded } from "../auth/trial";
import { canonical, object, string, type Json } from "../../lib/json";
import {
  listReports,
  saveReportBatch,
  currentRows,
  type StoredReport,
} from "../reporting/service";
import { validateStore, storeSpec } from "../reporting/storage";
import {
  buildCatalogue,
  AUTOFILL_VERSION,
  at,
  put,
} from "./autofill-catalogue";
import type { Shape } from "../reporting/shape";
import { autofillReference } from "./autofill-reference";
import { mapDocument, autofillModel } from "./autofill-provider";
import { normalizeValue } from "./autofill-validation";
import { readFileContent } from "../files/storage";
import { inferAutofillMonth } from "./autofill-month";
import {
  OCR_TYPES,
  OFFICE_TYPES,
  TEXT_TYPES,
  SPREADSHEET_TYPE,
  readDocumentPages,
  ocrModel,
} from "../cera/document-ocr";
import type {
  PageReading,
  AutofillResult,
  AutofillRunView,
  Proposal,
} from "./autofill-types";

type Payload = {
  filename: string;
  fileHash: string;
  sourceStored?: boolean;
  month?: string;
  monthInferred?: boolean;
  records: StoredReport[];
  seeds: Record<string, Json>;
};
type Run = {
  id: string;
  user_id: string;
  workspace_id: string;
  file_id: string;
  status: string;
  payload: Payload;
  result: AutofillResult;
  error: string | null;
  created_at: Date;
};
const publicError = (message: string) =>
  /deepseek|novita|api_key|certrace_ocr_model|certrace_autofill_model/i.test(
    message,
  )
    ? "Document reading or mapping failed. Please retry or contact support."
    : message;
const view = (r: Run): AutofillRunView => {
  return {
    id: r.id,
    status: r.status,
    fileId: r.file_id,
    sourceStored: r.payload.sourceStored !== false,
    month: r.payload.month,
    monthInferred: r.payload.monthInferred === true,
    filename: r.payload.filename,
    result: {
      proposals: r.result.proposals,
      unresolved: r.result.unresolved,
      needsVision: r.result.needsVision,
    },
    error: r.error ? publicError(r.error) : null,
  };
};
type ReadingStage = "reading" | "mapping";
function providerStatus(error: unknown): number | null {
  const value = error as { statusCode?: unknown; cause?: unknown } | null;
  if (typeof value?.statusCode === "number") return value.statusCode;
  const cause = value?.cause as { statusCode?: unknown } | undefined;
  return typeof cause?.statusCode === "number" ? cause.statusCode : null;
}
export function autofillFailure(error: unknown, stage: ReadingStage): string {
  if (error instanceof ApiError) return publicError(error.message);
  if (stage === "reading")
    return "Document reading failed before mapping. Check the PDF and retry.";
  const status = providerStatus(error);
  if (status === 401 || status === 403)
    return "Document mapping is unavailable. Please contact support.";
  if (status === 402)
    return "Document mapping is unavailable. Please contact support.";
  if (status === 429)
    return "Document mapping is busy. Retry the document later.";
  if (status === 400 || status === 404)
    return "Document mapping failed. Please contact support.";
  if (status)
    return "Document mapping failed. Please retry or contact support.";
  return "Cera could not map this document. Please retry or contact support.";
}
export function requireAutofillPlan(account: {
  plan_id: string;
  trial_started_at: Date;
}) {
  if (["standard", "enterprise"].includes(account.plan_id)) return;
  if (account.plan_id === "trial" && !trialEnded(account)) return;
  fail(
    403,
    "AUTOFILL_PLAN_REQUIRED",
    "Report autofill is available on an active trial, Standard or Enterprise plan.",
  );
}
export async function ownedRun(userId: string, id: string): Promise<Run> {
  const rows = await db.$queryRaw<
    Run[]
  >`SELECT * FROM report_autofill_runs WHERE id=${id}::uuid AND user_id=${userId}::uuid`;
  return (
    rows[0] ?? fail(404, "AUTOFILL_NOT_FOUND", "This extraction was not found.")
  );
}
export async function getRun(userId: string, id: string) {
  let row = await ownedRun(userId, id);
  if (
    row.status === "running" &&
    Date.now() - row.created_at.getTime() > 1_800_000
  ) {
    await db.$executeRaw`UPDATE report_autofill_runs SET status='failed',error='Reading was interrupted. Start a new reading; no values were applied.',updated_at=now() WHERE id=${id}::uuid AND status='running'`;
    row = await ownedRun(userId, id);
  }
  return view(row);
}
export async function recentRuns(userId: string, workspaceId: string) {
  const rows = await db.$queryRaw<
    Run[]
  >`SELECT * FROM report_autofill_runs WHERE user_id=${userId}::uuid AND workspace_id=${workspaceId} ORDER BY created_at DESC LIMIT 10`;
  return rows.map(view);
}
export async function startRun(
  userId: string,
  input: {
    workspaceId: string;
    fileId?: string;
    document?: {
      data: Buffer;
      filename: string;
      content_type: string;
      sha256: string;
    };
    month?: string;
    pages?: PageReading[];
    retry?: boolean;
  },
  mapper: typeof mapDocument = mapDocument,
  reader: typeof readDocumentPages = readDocumentPages,
) {
  if (!process.env.DEEPSEEK_API_KEY?.trim())
    fail(
      503,
      "EXTRACTION_UNAVAILABLE",
      "Smart upload is unavailable right now. Please try again later.",
    );
  if (Boolean(input.fileId) === Boolean(input.document))
    fail(422, "AUTOFILL_FILE_REQUIRED", "Provide one document to read.");
  const sourceStored = !input.document;
  const fileId = input.fileId ?? `transient-${crypto.randomUUID()}`;
  const file = input.document
    ? { ...input.document, object_key: null }
    : await db.account_files.findUnique({
        where: { user_id_id: { user_id: userId, id: fileId } },
      });
  if (
    !file ||
    !(
      OCR_TYPES.has(file.content_type) ||
      OFFICE_TYPES.has(file.content_type) ||
      TEXT_TYPES.has(file.content_type) ||
      file.content_type === SPREADSHEET_TYPE
    )
  )
    fail(
      422,
      "AUTOFILL_FILE_REQUIRED",
      "Upload PDF, PNG, JPEG, DOCX, PPTX, TXT, CSV, TSV, JSON or XLSX to your account first.",
    );
  const pages = input.pages;
  if (
    !pages &&
    OCR_TYPES.has(file.content_type) &&
    !process.env.NOVITA_API_KEY?.trim()
  )
    fail(
      503,
      "OCR_UNAVAILABLE",
      "Document reading is unavailable right now. Please try again later.",
    );
  if (pages) {
    if (
      new Set(pages.map((p) => p.page)).size !== pages.length ||
      pages.some((p) => p.page < 1)
    )
      fail(422, "INVALID_PAGES", "Pages must be unique positive numbers.");
    if (
      pages.reduce((n, p) => n + p.text.length, 0) > 60_000 ||
      pages.filter((p) => p.image).length > 6
    )
      fail(422, "AUTOFILL_PAGE_LIMIT", "Choose fewer pages.");
    for (const p of pages)
      if (
        p.image &&
        (!/^[A-Za-z0-9+/]+={0,2}$/.test(p.image) ||
          !Buffer.from(p.image, "base64")
            .subarray(0, 3)
            .equals(Buffer.from([255, 216, 255])))
      )
        fail(422, "INVALID_PAGE_IMAGE", "Use JPEG page previews.");
  }
  const records = await listReports(userId);
  const setup = (month?: string) => {
    let catalogue: ReturnType<typeof buildCatalogue>;
    try {
      catalogue = buildCatalogue(records, input.workspaceId, month);
    } catch (e) {
      fail(422, "AUTOFILL_CONTEXT", (e as Error).message);
    }
    const targets = sourceStored
      ? catalogue.targets
      : catalogue.targets.filter((target) => target.path.at(-1) !== "evidence");
    const evidenceId = sourceStored
      ? `${fileId}:${input.workspaceId}:${month ?? "annual"}`
      : null;
    for (const target of targets)
      if (evidenceId && target.options && target.path.at(-1) === "evidence")
        target.options = [...target.options, evidenceId];
    if (
      JSON.stringify({
        fields: targets,
        pages: pages?.map((p) => ({ page: p.page, text: p.text })),
      }).length > 450_000
    )
      fail(
        422,
        "AUTOFILL_CONTEXT_LIMIT",
        "This report has too many inputs for a single mapping.",
      );
    const scopedSeeds: Record<string, Json> = {};
    for (const target of targets) {
      if (!scopedSeeds[target.key])
        scopedSeeds[target.key] = Array.isArray(catalogue.seeds.get(target.key))
          ? []
          : {};
      const prefix = target.path.slice(0, 1);
      put(
        scopedSeeds[target.key]!,
        prefix,
        at(catalogue.seeds.get(target.key), prefix) as Json,
        catalogue.seeds.get(target.key)!,
      );
    }
    return {
      targets,
      scopedSeeds,
      workspace: catalogue.workspace,
      context: {
        workspace: catalogue.workspace,
        month,
        entities: catalogue.entities,
        ...(evidenceId ? { currentDocumentEvidenceId: evidenceId } : {}),
      },
    };
  };
  const initial = setup(input.month);
  const revisions = records.map((r) => [r.key, r.revision]);
  const filename = file.filename.normalize("NFC");
  const cacheKey = hash(
    canonical({
      version: AUTOFILL_VERSION,
      model: autofillModel(),
      file: file.sha256,
      filename,
      contentType: file.content_type,
      storedFileId: input.fileId ?? null,
      sourceStored,
      workspace: input.workspaceId,
      month: input.month ?? null,
      ocrModel: pages || !OCR_TYPES.has(file.content_type) ? null : ocrModel(),
      pages: pages?.map((p) => ({
        page: p.page,
        text: p.text,
        imageHash: p.image ? hash(p.image) : "",
      })),
      revisions,
    }),
  );
  const existing = await db.$queryRaw<
    Run[]
  >`SELECT * FROM report_autofill_runs WHERE user_id=${userId}::uuid AND cache_key=${cacheKey}`;
  if (existing[0] && !(existing[0].status === "failed" && input.retry))
    return view(existing[0]);
  // Counts are conservative upper bounds on paid requests, with no automatic provider retries.
  await rateLimit(`autofill-hour:${userId}`, 20, 3600);
  await rateLimit(
    `autofill-day:${userId}`,
    Number(process.env.CERTRACE_AUTOFILL_DAILY_LIMIT || 40),
    86400,
  );
  await rateLimit(
    "autofill-global-day",
    Number(process.env.CERTRACE_AUTOFILL_GLOBAL_DAILY_LIMIT || 200),
    86400,
  );
  const payload: Payload = {
    filename: file.filename,
    fileHash: file.sha256,
    sourceStored,
    month: input.month,
    records: records.map((r) => ({ ...r, value: null })),
    seeds: initial.scopedSeeds,
  };
  const empty: AutofillResult = {
    proposals: [],
    unresolved: [],
    needsVision: [],
    model: autofillModel(),
    inputTokens: 0,
    outputTokens: 0,
  };
  let created: Run[];
  if (existing[0]) {
    created = await db.$queryRaw<
      Run[]
    >`UPDATE report_autofill_runs SET status='running',payload=${JSON.stringify(payload)}::jsonb,result=${JSON.stringify(empty)}::jsonb,error=NULL,created_at=now(),updated_at=now() WHERE id=${existing[0].id}::uuid AND status='failed' RETURNING *`;
  } else {
    created = await db.$queryRaw<
      Run[]
    >`INSERT INTO report_autofill_runs(user_id,workspace_id,cache_key,file_id,payload,result) VALUES(${userId}::uuid,${input.workspaceId},${cacheKey},${fileId},${JSON.stringify(payload)}::jsonb,${JSON.stringify(empty)}::jsonb) ON CONFLICT(user_id,cache_key) DO NOTHING RETURNING *`;
  }
  if (!created[0]) {
    const winner = await db.$queryRaw<
      Run[]
    >`SELECT * FROM report_autofill_runs WHERE user_id=${userId}::uuid AND cache_key=${cacheKey}`;
    return view(winner[0]!);
  }
  const run = created[0];
  // Durable proposal/result storage. An interrupted worker is surfaced as failed, never retried silently.
  let stage: ReadingStage = "reading";
  void (async () => {
    const reading =
      pages ??
      (await reader(
        Buffer.from(input.document?.data ?? (await readFileContent(file))),
        file.content_type,
      ));
    stage = "mapping";
    const inferredMonth = input.month
      ? null
      : inferAutofillMonth(
          reading,
          filename,
          string(initial.workspace.periodStart),
          string(initial.workspace.periodEnd),
        );
    const mapped = inferredMonth ? setup(inferredMonth) : initial;
    return {
      result: await mapper(reading, mapped.targets, mapped.context),
      payload: inferredMonth
        ? {
            ...payload,
            month: inferredMonth,
            monthInferred: true,
            seeds: mapped.scopedSeeds,
          }
        : payload,
    };
  })()
    .then(async ({ result, payload: mappedPayload }) => {
      await db.$executeRaw`UPDATE report_autofill_runs SET status='review',result=${JSON.stringify(result)}::jsonb,payload=${JSON.stringify(mappedPayload)}::jsonb,updated_at=now() WHERE id=${run.id}::uuid AND status='running'`;
    })
    .catch(async (error: unknown) => {
      const message = autofillFailure(error, stage);
      console.error("Report autofill failed", {
        stage,
        status: providerStatus(error),
        code: error instanceof ApiError ? error.code : null,
      });
      await db.$executeRaw`UPDATE report_autofill_runs SET status='failed',error=${message},updated_at=now() WHERE id=${run.id}::uuid AND status='running'`;
    })
    .catch(() => {});
  return view(run);
}
function minimal(shape: Shape, value: Json): Json {
  if (shape.kind === "array") return [];
  if (shape.kind === "map") return {};
  if (shape.kind === "object")
    return Object.fromEntries(
      Object.entries(shape.fields ?? {})
        .filter(([, s]) => !s.optional)
        .flatMap(([k, s]) => {
          const v = object(value)[k];
          return v === undefined ? [] : [[k, minimal(s, v)]];
        }),
    );
  return value;
}
function shapeAt(key: string, path: (string | number)[]): Shape {
  return path.reduce(
    (s, k) =>
      s.kind === "map" || s.kind === "array" ? s.item! : s.fields![String(k)]!,
    storeSpec(key)!,
  );
}
export function prepareChanges(
  run: { workspace_id: string; payload: Payload; result: AutofillResult },
  current: StoredReport[],
  selections: { id: string; value?: unknown }[],
) {
  if (
    !selections.length ||
    new Set(selections.map((s) => s.id)).size !== selections.length
  )
    throw Error("Select at least one distinct proposal.");
  const catalog = buildCatalogue(current, run.workspace_id, run.payload.month);
  const allowed = new Set(catalog.targets.map((t) => t.id));
  const changes = new Map<string, StoredReport>();
  const selected: Proposal[] = [];
  const usedTargets = new Set<string>();
  for (const selection of selections) {
    const p = run.result.proposals.find((p) => p.id === selection.id);
    if (!p || p.blocked || !allowed.has(p.target.id))
      throw Error(
        "A selected proposal is unavailable or requires a new reading.",
      );
    if (
      run.payload.sourceStored === false &&
      p.target.path.at(-1) === "evidence"
    )
      throw Error(
        "Temporary Smart uploads cannot create document evidence links.",
      );
    if (usedTargets.has(p.target.id))
      throw Error("Choose only one proposal for each report field.");
    usedTargets.add(p.target.id);
    const original = run.payload.records.find((r) => r.key === p.target.key);
    const now = current.find((r) => r.key === p.target.key);
    if ((original?.revision ?? 0) !== (now?.revision ?? 0))
      throw Error(
        "Report values changed after this reading. Read the file again before applying.",
      );
    const value =
      selection.value === undefined
        ? p.value
        : normalizeValue(
            p.target,
            selection.value,
            p.target.unit || p.sourceUnit,
          );
    let change = changes.get(p.target.key);
    if (!change) {
      change = {
        key: p.target.key,
        revision: now?.revision ?? 0,
        value: structuredClone(
          now?.value ??
            (Array.isArray(run.payload.seeds[p.target.key]) ? [] : {}),
        ),
      };
      changes.set(change.key, change);
    }
    const seed = run.payload.seeds[p.target.key]!;
    // Materialize only ancestors of selected fields; never copy unselected template rows.
    for (let i = 1; i < p.target.path.length; i++) {
      const prefix = p.target.path.slice(0, i);
      if (at(change.value, prefix) == null) {
        const template = at(seed, prefix);
        put(
          change.value,
          prefix,
          template === undefined
            ? {}
            : minimal(shapeAt(p.target.key, prefix), template as Json),
          seed,
        );
      }
    }
    put(change.value, p.target.path, value as Json, seed);
    selected.push({ ...p, value });
  }
  for (const p of selected) {
    const parent = object(
      at(changes.get(p.target.key)!.value, p.target.path.slice(0, -1)),
    );
    const name = p.target.path.at(-1);
    // A quantity already reviewed in one unit must not acquire a different meaning on apply.
    if (name === "unit" && p.target.current && p.value !== p.target.current)
      throw Error(
        "Change an existing row's unit manually, then read the PDF again so quantities are reviewed in the new unit.",
      );
    if (
      (name === "quantity" || name === "ncvMjPerUnit") &&
      typeof parent.unit === "string"
    ) {
      const expected = name === "quantity" ? parent.unit : `MJ/${parent.unit}`;
      if (!parent.unit)
        throw Error("Select the row's unit together with its quantity.");
      const checked = normalizeValue(
        { ...p.target, unit: expected },
        p.value,
        p.target.unit || p.sourceUnit,
      );
      if (checked !== p.value)
        throw Error(
          "The selected unit changes a reviewed quantity. Use the source unit for a new row, or change the unit manually and read the PDF again.",
        );
    }
    if (
      name === "factorTco2PerMwh" &&
      !["ppa", "direct_technical_link"].includes(String(parent.sourceType))
    )
      throw Error(
        "Grid and self-generation factors must be resolved by the calculation engine.",
      );
    if (
      (name === "efTco2PerGj" || name === "ncvMjPerUnit") &&
      parent.factorSource === "eu_standard"
    )
      throw Error(
        "EU standard factors must come from the reference table. Choose a measured factor source first.",
      );
  }
  // Resolve configured factors after accepted fuel-type/source changes, using the same generated UI reference data.
  const monthly = changes.get("certrace:monthly-data");
  if (monthly)
    for (const row of Object.values(object(monthly.value)).flatMap((v) =>
      Array.isArray(v) ? v : [],
    )) {
      const entry = object(row);
      for (const f of Array.isArray(entry.fuels) ? entry.fuels : []) {
        const fuel = object(f);
        if (fuel.factorSource === "eu_standard") {
          const d = (
            autofillReference.fuels as Record<
              string,
              { ef: number; ncv: number | null }
            >
          )[`${fuel.fuelType}:${fuel.unit}`];
          if (d) {
            fuel.efTco2PerGj = d.ef;
            if (d.ncv !== null && fuel.unit !== "GJ") fuel.ncvMjPerUnit = d.ncv;
          }
        }
      }
      if (
        entry.electricityFactorSource === "grid_default" &&
        !(
          Array.isArray(entry.electricitySources) &&
          entry.electricitySources.length
        )
      )
        entry.electricityFactorTco2PerMwh =
          autofillReference.grids.find((g) => g.country === "TH")?.value ?? 0;
    }
  for (const change of changes.values())
    validateStore(change.key, change.value);
  return { changes: [...changes.values()], selected };
}
export async function applyRun(
  userId: string,
  id: string,
  selections: { id: string; value?: unknown }[],
  actorId = userId,
) {
  const run = await ownedRun(userId, id);
  if (run.status === "applied") return { applied: true };
  if (run.status !== "review")
    fail(
      409,
      "AUTOFILL_NOT_READY",
      "Wait for extraction to finish before applying.",
    );
  if (run.payload.sourceStored !== false) {
    const file = await db.account_files.findUnique({
      where: { user_id_id: { user_id: userId, id: run.file_id } },
      select: { sha256: true },
    });
    if (file?.sha256 !== run.payload.fileHash)
      fail(
        409,
        "AUTOFILL_FILE_CHANGED",
        "The source PDF changed. Read it again before applying.",
      );
  }
  const current = await listReports(userId);
  let prepared: ReturnType<typeof prepareChanges>;
  try {
    prepared = prepareChanges(run, current, selections);
  } catch (e) {
    fail(422, "AUTOFILL_REVIEW_REQUIRED", (e as Error).message);
  }
  if (run.payload.sourceStored !== false) {
    const evidenceKey = "certrace:workspace-evidence";
    const existingEvidence = current.find((r) => r.key === evidenceKey);
    const evidence = structuredClone(object(existingEvidence?.value));
    const rows = Array.isArray(evidence[run.workspace_id])
      ? (evidence[run.workspace_id] as Json[])
      : [];
    const evidenceId = `${run.file_id}:${run.workspace_id}:${run.payload.month ?? "annual"}`;
    const previous = rows.find((r) => object(r).id === evidenceId);
    const fieldKeys = [
      ...new Set([
        ...(Array.isArray(object(previous).fieldKeys)
          ? (object(previous).fieldKeys as string[])
          : []),
        ...prepared.selected.map((p) => p.target.label),
      ]),
    ];
    const source: Json = {
      ...object(previous),
      id: evidenceId,
      workspaceId: run.workspace_id,
      fieldKeys,
      sourceType: "other",
      fileName: run.payload.filename,
      mimeType: "application/pdf",
      fileHash: run.payload.fileHash,
      localFileId: run.file_id,
      capturedAt:
        typeof object(previous).capturedAt === "string"
          ? object(previous).capturedAt
          : new Date().toISOString(),
      uploadedBy: "Exporter",
      reviewedBy: actorId,
      reviewedAt: new Date().toISOString(),
    };
    if (run.payload.month) object(source).month = run.payload.month;
    if (previous) rows[rows.indexOf(previous)] = source;
    else rows.push(source);
    evidence[run.workspace_id] = rows;
    prepared.changes.push({
      key: evidenceKey,
      value: evidence,
      revision: existingEvidence?.revision ?? 0,
    });
  }
  await saveReportBatch(
    userId,
    prepared.changes,
    async (tx) => {
      // The owner lock is still held: a concurrent signoff must roll back this entire write.
      buildCatalogue(
        await currentRows(tx, userId),
        run.workspace_id,
        run.payload.month,
      );
      const updated =
        await tx.$executeRaw`UPDATE report_autofill_runs SET status='applied',result=result || ${JSON.stringify({ applied: prepared.selected, reviewedBy: actorId, reviewedAt: new Date().toISOString() })}::jsonb,updated_at=now() WHERE id=${id}::uuid AND user_id=${userId}::uuid AND status='review'`;
      if (!updated)
        fail(
          409,
          "AUTOFILL_ALREADY_APPLIED",
          "This reading has already been applied.",
        );
    },
    actorId,
  );
  return { applied: true };
}
