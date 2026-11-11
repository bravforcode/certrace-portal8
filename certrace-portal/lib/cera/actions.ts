/* ════════════════════════════════════════════════════════════
   CERA ACTIONS — what Cera proposes to change, and the only way it is applied

   The server never writes. It returns actions; the card shows each one; the
   user's Confirm click runs `applyCeraAction`. Everything here is plain data
   plus injected dependencies, so the rules are testable without the app.

   The allowlists mirror certrace-backend/src/modules/cera/actions.ts. Keep them
   in step: a key the server accepts and this file drops is a change the user
   never sees.
   ════════════════════════════════════════════════════════════ */

import type { Installation } from "../installations";
import { CBAM_FIELDS } from "../cbam/template-fields";

export type CeraAction =
  | {
      tool: "set_cbam_fields";
      installationId: string;
      year: number;
      /** bare CBAM field ids, e.g. "a-i9" (see CBAM_FIELDS); null clears the cell */
      values: Record<string, string | null>;
    }
  | {
      tool: "update_installation";
      installationId: string;
      changes: Record<string, string>;
    }
  | { tool: "request_upload"; purpose: string }
  | { tool: "open_page"; path: string };

export const MAX_CERA_ACTIONS = 5;
const MAX_VALUE_LENGTH = 2000;

const CBAM_IDS: ReadonlySet<string> = new Set(CBAM_FIELDS.map((f) => f.id));
const CBAM_LABELS: ReadonlyMap<string, string> = new Map(
  CBAM_FIELDS.map((f) => [f.id, f.label]),
);
/** Template cell ids are `<sheet letter>-<cell>`, e.g. "a-i20". The set above is the real check; the shape check keeps an odd key out early. */
const CBAM_ID_SHAPE = /^[a-e]-[a-z]+\d+$/;

// Same list as the backend. `satisfies` fails the build if a name stops being an Installation field.
const INSTALLATION_KEYS = [
  "name",
  "nameLocal",
  "street",
  "economicActivity",
  "postcode",
  "poBox",
  "city",
  "country",
  "unlocode",
  "lat",
  "lng",
  "contactName",
  "contactEmail",
  "contactPhone",
  "operatorName",
  "operatorRegistrationNumber",
  "operatorAddress",
] as const satisfies readonly (keyof Installation)[];
const INSTALLATION_SET: ReadonlySet<string> = new Set(INSTALLATION_KEYS);

const PAGES = [
  "/dashboard",
  "/workspace",
  "/convert",
  "/convert/eu-cbam",
  "/suppliers",
  "/reports",
  "/settings",
  "/carbon-cost",
  "/supply-chain",
] as const;
const PAGE_SET: ReadonlySet<string> = new Set(PAGES);

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isInstallationId = (v: unknown): v is string =>
  typeof v === "string" && /^[A-Za-z0-9-]{1,64}$/.test(v);

const isYear = (v: unknown): v is number =>
  Number.isInteger(v) && (v as number) >= 2020 && (v as number) <= 2035;

const isText = (v: unknown): v is string =>
  typeof v === "string" && v.length <= MAX_VALUE_LENGTH;

function safePath(p: unknown): string | undefined {
  if (typeof p !== "string" || p.length > 300) return undefined;
  const [pathname, query, ...extra] = p.split("?");
  if (extra.length > 0 || !PAGE_SET.has(pathname!)) return undefined;
  if (query !== undefined && !/^[A-Za-z0-9._~=&%-]{0,200}$/.test(query))
    return undefined;
  return p;
}

function parseSetCbamFields(input: Record<string, unknown>): CeraAction | undefined {
  const { installationId, year, values } = input;
  if (!isInstallationId(installationId) || !isYear(year) || !isRecord(values))
    return undefined;
  const kept: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(values)) {
    if (!CBAM_IDS.has(key) || !CBAM_ID_SHAPE.test(key)) continue;
    if (value === null || isText(value)) kept[key] = value;
  }
  if (Object.keys(kept).length === 0) return undefined;
  return { tool: "set_cbam_fields", installationId, year, values: kept };
}

function parseUpdateInstallation(input: Record<string, unknown>): CeraAction | undefined {
  const { installationId, changes } = input;
  if (!isInstallationId(installationId) || !isRecord(changes)) return undefined;
  const kept: Record<string, string> = {};
  for (const [key, value] of Object.entries(changes)) {
    if (INSTALLATION_SET.has(key) && isText(value)) kept[key] = value;
  }
  if (Object.keys(kept).length === 0) return undefined;
  return { tool: "update_installation", installationId, changes: kept };
}

function parseRequestUpload(input: Record<string, unknown>): CeraAction | undefined {
  const purpose = typeof input.purpose === "string" ? input.purpose.trim() : "";
  if (purpose.length < 1 || purpose.length > 300) return undefined;
  return { tool: "request_upload", purpose };
}

function parseOpenPage(input: Record<string, unknown>): CeraAction | undefined {
  const path = safePath(input.path);
  return path === undefined ? undefined : { tool: "open_page", path };
}

const PARSERS = new Map<string, (input: Record<string, unknown>) => CeraAction | undefined>([
  ["set_cbam_fields", parseSetCbamFields],
  ["update_installation", parseUpdateInstallation],
  ["request_upload", parseRequestUpload],
  ["open_page", parseOpenPage],
]);

/** Re-checks what came back from the server. Anything not on an allowlist is dropped, and the result is capped. */
export function parseCeraActions(raw: unknown): CeraAction[] {
  if (!Array.isArray(raw)) return [];
  const out: CeraAction[] = [];
  for (const item of raw) {
    if (out.length >= MAX_CERA_ACTIONS) break;
    if (!isRecord(item) || typeof item.tool !== "string") continue;
    const action = PARSERS.get(item.tool)?.(item);
    if (action) out.push(action);
  }
  return out;
}

export type ActionRow = { label: string; from?: string; to: string };
export type ActionDescription = { title: string; rows: ActionRow[] };

/** What is already there, when the caller has looked. Without it the rows show only the new value. */
export type ActionContext = {
  /** workbook cells of the action's installation and year, keyed "cbam:0:<field id>" */
  cells?: Record<string, string>;
  /** the stored record the update would change */
  installation?: Installation;
};

const EMPTY = "(empty)";

/** Pure: no dependency is called. Safe to run while a card is only being shown. */
export function describeAction(action: CeraAction, ctx?: ActionContext): ActionDescription {
  switch (action.tool) {
    case "set_cbam_fields":
      return {
        title: `CBAM answers for ${action.year}`,
        rows: Object.entries(action.values).map(([id, value]) => {
          const cell = `cbam:0:${id}`;
          return {
            label: CBAM_LABELS.get(id) ?? id,
            ...(ctx?.cells ? { from: ctx.cells[cell] ?? EMPTY } : {}),
            to: value === null ? "(clear)" : value,
          };
        }),
      };
    case "update_installation":
      return {
        title: `Installation ${action.installationId}`,
        rows: Object.entries(action.changes).map(([key, value]) => {
          const current = ctx?.installation
            ? String((ctx.installation as unknown as Record<string, unknown>)[key] ?? "")
            : undefined;
          return {
            label: key,
            ...(current !== undefined ? { from: current || EMPTY } : {}),
            to: value,
          };
        }),
      };
    case "request_upload":
      return {
        title: "Upload a document",
        rows: [{ label: "Purpose", to: action.purpose }],
      };
    case "open_page":
      return {
        title: "Open a page",
        rows: [{ label: "Page", to: action.path }],
      };
  }
}

export type CeraActionDeps = {
  /** writes workbook cells; the caller maps nothing — keys arrive already as "cbam:0:<id>" */
  patchCells: (
    iid: string,
    year: number,
    cells: Record<string, string | null>,
  ) => Promise<unknown>;
  saveInstallation: (record: Installation) => unknown | Promise<unknown>;
  getInstallation: (id: string) => Installation | null | Promise<Installation | null>;
  /** turns on the smart-upload drop area so the next file is read */
  openUpload: (purpose: string) => void;
  navigate: (path: string) => void;
};

/** Runs one confirmed action. Throws when a write cannot be made, so the card can say so. */
export async function applyCeraAction(action: CeraAction, deps: CeraActionDeps): Promise<void> {
  switch (action.tool) {
    case "set_cbam_fields": {
      const cells: Record<string, string | null> = {};
      for (const [id, value] of Object.entries(action.values)) cells[`cbam:0:${id}`] = value;
      await deps.patchCells(action.installationId, action.year, cells);
      return;
    }
    case "update_installation": {
      // Merge onto the stored record: a save of only the changed fields would wipe the rest.
      const current = await deps.getInstallation(action.installationId);
      if (!current) throw new Error(`Installation ${action.installationId} not found`);
      await deps.saveInstallation({ ...current, ...action.changes });
      return;
    }
    case "request_upload":
      deps.openUpload(action.purpose);
      return;
    case "open_page":
      deps.navigate(action.path);
      return;
  }
}
