import { getWorkbook } from "../api/workbooks";
import { costEnv } from "../cbam/carbon-cost-read";
import {
  getInstallation,
  installationRole,
  listInstallations,
} from "../installations";
import { sheetsFromCells } from "../workbook/cells";
import { estimateEmissions } from "../workbook/estimate";
import {
  SHEET_ORDER,
  installationSheetStatus,
  sheetStatus,
} from "../workbook/status";
import { factoryGaps } from "./profile";
import {
  capOpportunities,
  mergeOpportunities,
  gapOpportunities,
  type Derived,
  type Opportunity,
} from "./opportunities";
import { readOpportunities, saveOpportunities } from "./opportunity-store";
import { readFactory } from "./store";

// Sheets that never hold data of their own, so an empty one is not a gap to close.
const NOT_DATA = new Set(["installation", "documents", "flow"]);

export type CollectResult = {
  list: Opportunity[];
  skipped: number;
  saveFailed: boolean;
};

/** Derives the cards for every own installation with a ready workbook for `year`, merges them with the stored
    cards, caps the list, saves it when it changed, and returns it with the count of new cards that did not fit
    and whether the save failed. An installation whose workbook is not ready is not read, so its cards are kept
    as they are: nothing closes for it. */
export async function collectOpportunities(
  year: number,
  now = new Date().toISOString(),
): Promise<CollectResult> {
  const priceEur = costEnv().certificatePrice(year)?.eurPerTonne ?? null;
  const derived: Derived[] = [];
  const loaded = new Set<string>();
  const factoryLoaded = new Set<string>();
  for (const inst of listInstallations()) {
    if (installationRole(inst) === "supplier") continue;
    const res = await getWorkbook(inst.id, year).catch(() => null);
    if (!res || !("cells" in res) || res.meta.status !== "ready") continue;
    loaded.add(inst.id);
    const { profile, unreadable } = readFactory(inst.id);
    if (!unreadable) factoryLoaded.add(inst.id);
    const sheets = sheetsFromCells(res.cells, res.meta.files ?? []);
    const emptySheets = sheets
      .filter(
        (s) =>
          SHEET_ORDER.includes(s.id) &&
          !NOT_DATA.has(s.id) &&
          sheetStatus(s) === "untouched",
      )
      .map((s) => s.id);
    if (installationSheetStatus(getInstallation(inst.id)) === "untouched")
      emptySheets.unshift("installation");
    const estimate = estimateEmissions(sheets, { country: inst.country, year });
    derived.push(
      ...gapOpportunities(inst.id, estimate, {
        year,
        // The share of production that is exported is not recorded yet, so all of it counts as exported.
        exportedT: estimate.productionT,
        priceEur,
        profile,
        factoryGaps: factoryGaps(profile, year),
        emptySheets,
      }),
    );
  }
  const stored = readOpportunities();
  const merged = mergeOpportunities(derived, stored, now, {
    year,
    loaded,
    factoryLoaded,
  });
  const { list, skipped } = capOpportunities(
    merged,
    new Set(stored.map((o) => o.id)),
  );
  let saveFailed = false;
  if (JSON.stringify(list) !== JSON.stringify(stored))
    await saveOpportunities(list).catch(() => {
      saveFailed = true;
    });
  return { list, skipped, saveFailed };
}
