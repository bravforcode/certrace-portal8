import { getWorkbook } from "../api/workbooks";
import { costEnv } from "../cbam/carbon-cost-read";
import { getInstallation, installationRole, listInstallations } from "../installations";
import { sheetsFromCells } from "../workbook/cells";
import { estimateEmissions } from "../workbook/estimate";
import { SHEET_ORDER, installationSheetStatus, sheetStatus } from "../workbook/status";
import { factoryGaps } from "./profile";
import { mergeOpportunities, gapOpportunities, type Derived, type Opportunity } from "./opportunities";
import { readOpportunities, saveOpportunities } from "./opportunity-store";
import { readFactory } from "./store";

// Sheets that never hold data of their own, so an empty one is not a gap to close.
const NOT_DATA = new Set(["installation", "documents", "flow"]);

/** Derives the cards for every own installation with a workbook for `year`, merges them with the stored
    cards (assignments, closed gaps), saves the result when it changed, and returns it.
    An installation whose workbook did not load is skipped, so its cards are left as they are. */
export async function collectOpportunities(year: number, now = new Date().toISOString()): Promise<Opportunity[]> {
  const priceEur = costEnv().certificatePrice(year)?.eurPerTonne ?? null;
  const derived: Derived[] = [];
  for (const inst of listInstallations()) {
    if (installationRole(inst) === "supplier") continue;
    const res = await getWorkbook(inst.id, year).catch(() => null);
    if (!res || !("cells" in res)) continue;
    const sheets = sheetsFromCells(res.cells, res.meta.files ?? []);
    const emptySheets = sheets
      .filter((s) => SHEET_ORDER.includes(s.id) && !NOT_DATA.has(s.id) && sheetStatus(s) === "untouched")
      .map((s) => s.id);
    if (installationSheetStatus(getInstallation(inst.id)) === "untouched") emptySheets.unshift("installation");
    const estimate = estimateEmissions(sheets, { country: inst.country, year });
    derived.push(
      ...gapOpportunities(inst.id, estimate, {
        year,
        // The share of production that is exported is not recorded yet, so all of it counts as exported.
        exportedT: estimate.productionT,
        priceEur,
        factoryGaps: factoryGaps(readFactory(inst.id), year),
        emptySheets,
      }),
    );
  }
  const stored = readOpportunities();
  const merged = mergeOpportunities(derived, stored, now);
  if (JSON.stringify(merged) !== JSON.stringify(stored))
    await saveOpportunities(merged).catch(() => {
      /* the list still shows; the account save reports its own failure */
    });
  return merged;
}
