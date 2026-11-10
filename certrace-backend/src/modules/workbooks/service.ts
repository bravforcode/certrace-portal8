import { db } from "../../lib/db";
import { fail } from "../../lib/errors";
import { CELL_KEY, MAX_BYTES } from "./model";

type Cells = Record<string, string>;
type Editors = Record<string, { by: string; at: string }>;
type Row = { meta: unknown; cells: Cells; editors: Editors; revision: number; updated_at: Date };

const view = (r: Row | null) => ({
  changed: true as const,
  revision: r?.revision ?? 0,
  meta: (r?.meta ?? {}) as Record<string, unknown>,
  cells: r?.cells ?? {},
  editors: r?.editors ?? {},
  updatedAt: (r?.updated_at ?? new Date(0)).toISOString(),
});

const where = (companyId: string, installationId: string, year: number) => ({
  company_id_installation_id_year: { company_id: companyId, installation_id: installationId, year },
});

export async function list(companyId: string, installationId: string) {
  const rows = await db.workbooks.findMany({
    where: { company_id: companyId, installation_id: installationId },
    select: { year: true, meta: true, revision: true, updated_at: true },
    orderBy: { year: "desc" },
  });
  return {
    years: rows.map((r) => ({
      year: r.year,
      meta: r.meta,
      revision: r.revision,
      updatedAt: r.updated_at.toISOString(),
    })),
  };
}

export async function read(companyId: string, installationId: string, year: number, since?: number) {
  const r = (await db.workbooks.findUnique({ where: where(companyId, installationId, year) })) as Row | null;
  const revision = r?.revision ?? 0;
  if (since !== undefined && since === revision) return { changed: false as const, revision };
  return view(r);
}

/** Locks the row so concurrent patches apply one after another and none is lost. */
async function mutate(
  companyId: string,
  installationId: string,
  year: number,
  actorId: string,
  change: (row: Row) => Partial<Pick<Row, "meta" | "cells" | "editors">>,
) {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`INSERT INTO workbooks (company_id, installation_id, year)
      VALUES (${companyId}::uuid, ${installationId}, ${year}) ON CONFLICT DO NOTHING`;
    const [row] = await tx.$queryRaw<Row[]>`SELECT meta, cells, editors, revision, updated_at
      FROM workbooks WHERE company_id = ${companyId}::uuid AND installation_id = ${installationId}
      AND year = ${year} FOR UPDATE`;
    const next = { ...row!, ...change(row!) };
    if (
      Buffer.byteLength(JSON.stringify(next.cells)) + Buffer.byteLength(JSON.stringify(next.editors)) >
      MAX_BYTES
    )
      fail(413, "WORKBOOK_TOO_LARGE", "This workbook is too large. Remove unused rows or split the year.");
    const saved = await tx.workbooks.update({
      where: where(companyId, installationId, year),
      data: {
        meta: next.meta as object,
        cells: next.cells,
        editors: next.editors,
        revision: { increment: 1 },
        updated_by: actorId,
        updated_at: new Date(),
      },
    });
    return view(saved as unknown as Row);
  });
}

export function patchCells(
  companyId: string,
  installationId: string,
  year: number,
  actorId: string,
  patch: Record<string, string | null>,
) {
  for (const key of Object.keys(patch))
    if (!CELL_KEY.test(key)) fail(422, "INVALID_CELL_KEY", `Invalid cell ${key.slice(0, 80)}`);
  return mutate(companyId, installationId, year, actorId, (row) => {
    const cells = { ...row.cells };
    const editors = { ...row.editors };
    const at = new Date().toISOString();
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") {
        delete cells[key];
        delete editors[key];
      } else {
        cells[key] = value;
        editors[key] = { by: actorId, at };
      }
    }
    return { cells, editors };
  });
}

export const putMeta = (
  companyId: string,
  installationId: string,
  year: number,
  actorId: string,
  meta: Record<string, unknown>,
) => mutate(companyId, installationId, year, actorId, () => ({ meta }));
