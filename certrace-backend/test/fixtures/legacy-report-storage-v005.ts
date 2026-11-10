/** Read-only migration-005 decoder, retained solely for upgrade verification. */
import { Prisma } from '../../src/generated/prisma/client';
import type { Shape } from '../../src/modules/reporting/shape';
import type { Json } from '../../src/lib/json';
type Tx = Prisma.TransactionClient;
const containers = new Set(['object','array','map']);
const quote=(name:string)=>'"'+name.replaceAll('"','""')+'"';
const table=(s:Shape)=>`reporting.${quote(s.table!)}`;
type Row=Record<string,unknown>&{_id:string;_parent_id:string;_slot:string;_null:boolean};
function scalars(s:Shape):[string,Shape][] { return s.kind==='object'?Object.entries(s.fields!).filter(([,v])=>!containers.has(v.kind)):!s.item?[['_value',s]]:[]; }
export async function readTrees(
  tx: Tx,
  s: Shape,
  parents: string[],
  scopes = new Map<string, string>(),
): Promise<Map<string, { slot: string; position: number; value: Json }[]>> {
  const out = new Map<
    string,
    { slot: string; position: number; value: Json }[]
  >();
  if (!parents.length) return out;
  const rows = await tx.$queryRawUnsafe<Row[]>(
    `SELECT * FROM ${table(s)} WHERE _parent_id IN (${parents.map((_, i) => "$" + (i + 1) + "::uuid").join(",")}) ORDER BY ${s.arrayElement ? "_slot::integer" : "_slot"}`,
    ...parents,
  );
  if (!rows.length) return out;
  const ownScopes = new Map(
    rows.map((r) => [
      r._id,
      s.scopeKey ? r._slot : (scopes.get(r._parent_id) ?? ""),
    ]),
  );
  const nested = new Map<
    string,
    Map<string, { slot: string; position: number; value: Json }[]>
  >();
  if (s.kind === "object")
    for (const [k, v] of Object.entries(s.fields!))
      if (containers.has(v.kind))
        nested.set(
          k,
          await readTrees(
            tx,
            v,
            rows.filter((r) => !r._null).map((r) => r._id),
            ownScopes,
          ),
        );

  if (s.item)
    nested.set(
      "_items",
      await readTrees(
        tx,
        s.item,
        rows.filter((r) => !r._null).map((r) => r._id),
        ownScopes,
      ),
    );
  for (const row of rows) {
    let value: Json = null;
    if (!row._null) {
      if (s.kind === "object") {
        const obj: Record<string, Json> = {};
        for (const [k, f] of scalars(s))
          if (row["p_" + k] || (f.derived && !f.optional)) {
            if (f.derived) {
              obj[k] = ownScopes.get(row._id)!;
              continue;
            }
            const v = row["f_" + k];
            obj[k] =
              f.kind === "artifact" && v !== null
                ? JSON.parse(Buffer.from(v as Uint8Array).toString("utf8"))
                : f.kind === "number" && v !== null
                  ? Number(v)
                  : f.kind === "decimalText"
                    ? v === null
                      ? ""
                      : String(v)
                    : (v as Json);
          }
        for (const [k, items] of nested) {
          const child = items.get(row._id)?.[0];
          if (child) obj[k] = child.value;
        }
        value = obj;
      } else if (s.item) {
        const items = nested.get("_items")?.get(row._id) ?? [];
        value =
          s.kind === "array"
            ? items.map((x) => x.value)
            : Object.fromEntries(items.map((x) => [x.slot, x.value]));
      } else {
        const v = row.f__value;
        value =
          s.kind === "number" && v !== null
            ? Number(v)
            : s.kind === "decimalText"
              ? v === null
                ? ""
                : String(v)
              : (v as Json);
      }
    }
    const group = out.get(row._parent_id) ?? [];
    group.push({ slot: row._slot, position: Number(row._slot) || 0, value });
    out.set(row._parent_id, group);
  }
  return out;
}
