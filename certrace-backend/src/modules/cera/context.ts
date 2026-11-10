import { CBAM_KNOWLEDGE } from "../../../../certrace-portal/lib/cera/knowledge-cbam";
import { PLATFORM_KNOWLEDGE } from "../../../../certrace-portal/lib/cera/knowledge-platform";
import type { StoredReport } from "../reporting/service";
import type { Json } from "../../lib/json";

// Only current company/report inputs belong in chat, never settings or snapshots.
const allowedKeys = new Set([
  "certrace:profile",
  "certrace:workspaces",
  "certrace:installations",
  "certrace:supplier-companies",
  "certrace:workspace-drafts",
  "certrace:workspace-mmd-draft",
  "certrace:monthly-data",
  "certrace:precursor-suppliers",
  "certrace:internal-precursors",
  "certrace:workspace-evidence",
  "certrace:pack-signoff",
  "certrace:carbon-price",
  "certrace:reporting-periods",
  "certrace:annual-production",
  "certrace:monthly-requests",
  "certrace:month-submissions",
  "certrace:report-inputs:v1",
]);

function clean(value: Json): Json {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key]) =>
            !/token|secret|password|api.?key|(^|_)(url|data|bytes|base64)$|fileRef|storageKey/i.test(
              key,
            ),
        )
        .map(([key, child]) => [key, clean(child ?? null)]),
    );
  if (typeof value === "string") {
    if (/^(data:|https?:\/\/|blob:)/i.test(value)) return "[link omitted]";
    return value.length > 3000 ? `${value.slice(0, 3000)} [truncated]` : value;
  }
  return value;
}

export function companyContext(
  records: StoredReport[],
  query: string,
  maxChars = 100_000,
) {
  const terms = [...new Set(query.toLowerCase().match(/[\p{L}\p{N}_-]{3,}/gu))];
  const items = records
    .filter((r) => allowedKeys.has(r.key))
    .flatMap((r) => {
      const value = clean(r.value);
      const parts: [string, Json][] = Array.isArray(value)
        ? value.map((v, i) => [String(i), v])
        : value && typeof value === "object"
          ? Object.entries(value).map(([k, v]) => [k, v ?? null])
          : [["", value]];
      return parts.map(([scope, value]) => {
        const item = { key: r.key, revision: r.revision, scope, value };
        const text = JSON.stringify(item).toLowerCase();
        return {
          item,
          score:
            terms.filter((t) => text.includes(t)).length +
            (r.key === "certrace:workspaces" ? 2 : 0),
        };
      });
    })
    .sort((a, b) => b.score - a.score);
  const selected: (typeof items)[number]["item"][] = [];
  let size = 0;
  for (const { item } of items) {
    const length = JSON.stringify(item).length + 1;
    if (size + length > maxChars) continue;
    selected.push(item);
    size += length;
  }
  return { records: selected, omittedItems: items.length - selected.length };
}

export const ceraKnowledge = [...CBAM_KNOWLEDGE, ...PLATFORM_KNOWLEDGE].map(
  ({ title, answer }) => ({ title, answer }),
);
