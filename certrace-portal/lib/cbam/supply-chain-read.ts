/* ════════════════════════════════════════════════════════════
   SUPPLY CHAIN — READING THE PORTAL

   Nothing on the Supply Chain tab is stored. It is read, each time, from what
   the rest of the portal writes:

     product reports       listWorkspaces()           which plant, good, year
     plants                installationForWorkspace()  the site and who runs it
     the company           getSupplierCompany()        the named contact (the factory manager)
     the monthly asks      buildSmartLinks()           sent, waiting, late, answered — the SAME
                                                      builder the Smart Links tab prints
     readiness             workspaceReadiness()        how complete each report is
     precursor suppliers   listSuppliers(), treeFor()   link phase, data basis, the four checks
     their share           precursorContribution()     what each one carries of the good
     EU default            rateSheet()                 to put their figure beside it

   Counting asks a second way is how a summary starts disagreeing with the list
   it summarises, so the monthly cells are the Smart Links states, renamed.
   ════════════════════════════════════════════════════════════ */

import { installationForWorkspace } from "../installations";
import { workspaceReadiness } from "../readiness";
import {
  buildSmartLinks,
  type SmartLink,
  type SmartLinkState,
} from "../smart-links";
import {
  flatten,
  listSuppliers,
  precursorCompleteness,
  precursorContribution,
  treeFor,
  type PrecursorSupplier,
} from "../precursor-suppliers";
import { getSupplierCompany } from "../supplier-companies";
import {
  listWorkspaces,
  workspaceCountry,
  type VerificationWorkspace,
} from "../workspace";
import { rateSheet } from "./eu-rates";
import type {
  Contact,
  LinkPhase,
  MonthCell,
  PlantFacts,
  PlantMonth,
  PrecursorFacts,
} from "./supply-chain-model";

const CELL: Record<SmartLinkState, MonthCell> = {
  done: "done",
  late: "late",
  in_process: "waiting",
  send_now: "send",
  not_due: "later",
};

const phaseOf = (s: PrecursorSupplier): LinkPhase =>
  s.smartLinkSubmittedAt
    ? "submitted"
    : s.smartLinkOpenedAt
      ? "opened"
      : s.smartLinkSentAt
        ? "sent"
        : "not_sent";

const contactOf = (
  name: string | undefined,
  email: string | undefined,
  phone: string | undefined,
): Contact | null =>
  (name ?? "").trim() || (email ?? "").trim()
    ? {
        name: (name ?? "").trim(),
        email: (email ?? "").trim(),
        phone: (phone ?? "").trim(),
      }
    : null;

export function readPlants(
  workspaces: VerificationWorkspace[] = listWorkspaces(),
  links: SmartLink[] = buildSmartLinks(),
): PlantFacts[] {
  const monthly = links.filter((l) => l.kind === "monthly");
  const byInstallation = new Map<string, VerificationWorkspace[]>();
  for (const w of workspaces)
    byInstallation.set(w.installationId, [
      ...(byInstallation.get(w.installationId) ?? []),
      w,
    ]);

  const out: PlantFacts[] = [];
  for (const [id, list] of byInstallation) {
    const first = list[0];
    const inst = installationForWorkspace(first);
    const own = list.some((w) => w.selfSupplied) || inst.self;
    const supplierId = first.supplierId || inst.supplierId;
    const company = supplierId ? getSupplierCompany(supplierId) : null;
    const ids = new Set(list.map((w) => w.id));
    const months: PlantMonth[] = monthly
      .filter((l) => ids.has(l.workspace.id))
      .map((l) => ({
        workspaceId: l.workspace.id,
        year: l.workspace.year,
        month: l.month ?? "",
        cell: CELL[l.state],
        due: l.due.toISOString(),
        sentAt: l.sentAt,
        answeredAt: l.answeredAt,
      }));
    const readiness = list.map((w) => workspaceReadiness(w).percentComplete);
    out.push({
      id,
      name: first.installationName || inst.name || id,
      company: own ? "" : first.supplierName || company?.name || "",
      own,
      country: inst.country || workspaceCountry(first),
      contact: own
        ? null
        : contactOf(
            company?.contactName,
            company?.contactEmail,
            company?.contactPhone,
          ),
      products: [...new Set(list.map((w) => w.productName))],
      years: [...new Set(list.map((w) => w.year))].sort((a, b) => b - a),
      readinessPct: readiness.length
        ? readiness.reduce((a, b) => a + b, 0) / readiness.length
        : null,
      months,
      reportIds: list.map((w) => w.id),
    });
  }
  return out.sort(
    (a, b) => Number(b.own) - Number(a.own) || a.name.localeCompare(b.name),
  );
}

export function readPrecursors(
  workspaces: VerificationWorkspace[] = listWorkspaces(),
): PrecursorFacts[] {
  const out: PrecursorFacts[] = [];
  for (const w of workspaces) {
    const rows = listSuppliers(w.id).filter(
      (s) => !s.isScrap && s.origin !== "same_installation",
    );
    if (rows.length === 0) continue;
    const depth = new Map(flatten(treeFor(w.id)).map((n) => [n.id, n.depth]));
    const result = precursorContribution(w);
    const total = result.perTonne;
    const share = new Map(
      result.byNode.map((n) => [
        n.id,
        total > 0 ? n.contribution / total : null,
      ]),
    );
    for (const s of rows) {
      const phase = phaseOf(s);
      const c = s.verificationChecks;
      const sheet = s.cnCode
        ? rateSheet({ cn: s.cnCode, country: s.country || "ZZ", year: w.year })
        : null;
      out.push({
        id: `${w.id}:${s.id}`,
        workspaceId: w.id,
        company: s.name || s.installationName || "",
        installation: s.installationName,
        country: s.country,
        product: s.precursorName || s.cnCode || "",
        cnCode: s.cnCode,
        feeds: w.productName,
        year: w.year,
        tier: depth.get(s.id) ?? 1,
        contact: contactOf(s.contactName, s.contactEmail, s.contactPhone),
        phase,
        sentAt: s.smartLinkSentAt ?? null,
        openedAt: s.smartLinkOpenedAt ?? null,
        submittedAt: s.smartLinkSubmittedAt ?? null,
        due: w.periodEnd,
        basis:
          s.dataOrigin === "supplier_verified"
            ? "verified"
            : s.dataOrigin === "supplier_unverified"
              ? "unverified"
              : "default",
        checks: c
          ? {
              accreditation: c.accreditationValid,
              scope: c.sectoralScopeMatch,
              period: c.periodCovered,
              file: c.fileIntact,
            }
          : null,
        completenessPct: precursorCompleteness(s).percent,
        seeSupplier: s.seeTco2ePerT,
        seeDefault: sheet ? sheet.defaultValue : null,
        contribution: share.get(s.id) ?? null,
      });
    }
  }
  return out;
}
