/* ════════════════════════════════════════════════════════════
   THE ACCOUNT THIS SEAT WALKS INTO

   A problem this build creates for itself, and the honest answer to it.

   The exporter portal starts empty and fills up as an operator uses it: you
   create a workspace, you ask a supplier for a month, the month comes back.
   THIS BUILD CANNOT DO MOST OF THAT. The Legal / Compliance seat may correct
   a reading — `enterFigures` is granted — but it may not create a workspace
   and may not send a supplier request, and those are the two acts an empty
   account needs. A reading can only be corrected in a month that already
   exists, so an empty account here is still an account that stays empty
   forever, and the portal would demonstrate nothing but its own restrictions.

   That is not a flaw in the seat model. It is the frontend-only architecture
   showing through: in the real product both seats read one backend, and the
   reviewer signs in to an account Operations has been working in for months.
   There is no backend here, so the estate has to arrive some other way.

   SO THIS FILE IS THE COLLEAGUE YOU DO NOT HAVE. It writes, once per browser,
   the account as Operations would have left it: two workspaces, ten months of
   readings between them, and a review conversation already part-way through —
   two months waiting on a decision, one sent back and not yet answered, five
   confirmed, and one pack signed off last month.

   THREE RULES IT KEEPS:

     1. IT RUNS ONCE, and it marks that it has. A seed that re-ran would undo
        the reader's own decisions every time they reloaded, which is worse
        than no data at all.

     2. IT NEVER OVERWRITES. If anything is already in the store — because the
        reader has been working, or because a previous version seeded it — it
        does nothing and returns.

     3. IT WRITES THROUGH THE RAW STORE KEYS, not through the app's own save
        functions. `createWorkspace` is gated for this seat (lib/seat.ts) and
        would refuse, correctly. The month saves would now go through — the
        grant covers them — but they are not used either, and deliberately:
        fixture data is not this seat acting, it is the state this seat found,
        and a seed that ran through the same doors the reader uses would leave
        ten months of readings looking like ten months of this reviewer's own
        edits. Going around the gate here is the one place that is true, and
        it is why this module is not imported by anything except the portal
        shell's boot.
   ════════════════════════════════════════════════════════════ */

import type { VerificationWorkspace } from "./workspace";
import type { MonthlyEntry } from "./monthly-data";
import type { MonthSubmission } from "./month-submission";
import type { PackSignOff } from "./pack-signoff";

const SEEDED_KEY = "certrace:seat-fixture-loaded";

/* The store keys, copied rather than imported: every one of them is a private
   const inside its own module, and exporting them purely so a fixture could
   reach them would widen four modules' surface for one caller. If a key is
   ever renamed this file goes quiet rather than wrong — the seed simply lands
   in a bucket nothing reads, and the portal is empty, which is the visible
   failure and the safe one. */
const K = {
  workspaces: "certrace:workspaces",
  months: "certrace:monthly-data",
  submissions: "certrace:month-submissions",
  packSignoff: "certrace:pack-signoff",
} as const;

const YEAR = 2026;

const WORKSPACES: VerificationWorkspace[] = [
  {
    id: "ws-fixture-billet",
    installationId: "TH-RYG-0418",
    installationName: "Rayong Works",
    productId: "billet",
    productName: "Billets (semi-finished)",
    cnCode: "7207 11 90",
    productionRoute: "scrap_eaf",
    year: YEAR,
    periodStart: `${YEAR}-01-01`,
    periodEnd: `${YEAR}-12-31`,
    declarationIds: [],
    createdAt: `${YEAR}-01-08T09:12:00.000Z`,
    selfSupplied: true,
    supplierName: "Siam Steel Export Co.",
    schedule: { dueDay: 15 },
    archivedAt: null,
  },
  {
    id: "ws-fixture-hrc",
    installationId: "TH-CBI-2207",
    installationName: "Chonburi Mill",
    productId: "hrc",
    productName: "Hot-rolled coil",
    cnCode: "7208 39 00",
    productionRoute: "rolling_only",
    year: YEAR,
    periodStart: `${YEAR}-01-01`,
    periodEnd: `${YEAR}-12-31`,
    declarationIds: [],
    createdAt: `${YEAR}-01-08T09:20:00.000Z`,
    supplierId: "d3",
    supplierName: "G J Steel",
    schedule: { dueDay: 20 },
    archivedAt: null,
  },
];

/* ── A month's readings ─────────────────────────────────────────
   Plausible for a Thai scrap-EAF billet plant: production in the low
   thousands of tonnes, natural gas in the reheat furnace, grid electricity at
   the Thai default. The figures move month to month because a fixture where
   every month is identical is a fixture that hides exactly the thing a
   reviewer is looking for. */
function monthEntry(workspaceId: string, month: string, opts: { tonnes: number; gasM3: number; mwh: number; status: MonthlyEntry["status"]; submittedAt?: string }): MonthlyEntry {
  return {
    id: `me-${workspaceId}-${month}`,
    workspaceId,
    month,
    productionTonnes: opts.tonnes,
    fuels: [
      {
        id: `fuel-${workspaceId}-${month}-ng`,
        fuelType: "natural_gas",
        quantity: opts.gasM3,
        unit: "m3",
        ncvMjPerUnit: 36.2,
        efTco2PerGj: 0.0561,
        oxidationFactor: 1,
        oxidationFactorSource: "conservative_default",
        /* Type I — the EU standard value for natural gas, which is what a
           Thai reheat furnace running on grid gas would legitimately declare
           and what locks the NCV/EF pair read-only on the month's own form. */
        factorSource: "eu_standard",
        biomassFraction: 0,
      },
    ],
    processEmissionsTco2: 0,
    electricityMwh: opts.mwh,
    electricityFactorTco2PerMwh: 0.4999,
    electricityFactorSource: "grid_default",
    electricitySources: [
      { id: `el-${workspaceId}-${month}`, sourceType: "grid_default", mwh: opts.mwh, factorTco2PerMwh: 0.4999 },
    ],
    flueGasCleaningEmissionsTco2: 0,
    status: opts.status,
    submittedAt: opts.submittedAt,
    submittedBy: opts.submittedAt ? "Ananya P." : undefined,
  };
}

const BILLET = "ws-fixture-billet";
const HRC = "ws-fixture-hrc";

const MONTHS: Record<string, MonthlyEntry[]> = {
  [BILLET]: [
    monthEntry(BILLET, `${YEAR}-01`, { tonnes: 4120, gasM3: 512000, mwh: 2380, status: "reviewed", submittedAt: `${YEAR}-02-09T04:12:00.000Z` }),
    monthEntry(BILLET, `${YEAR}-02`, { tonnes: 3880, gasM3: 478500, mwh: 2245, status: "reviewed", submittedAt: `${YEAR}-03-10T03:40:00.000Z` }),
    monthEntry(BILLET, `${YEAR}-03`, { tonnes: 4460, gasM3: 551200, mwh: 2590, status: "reviewed", submittedAt: `${YEAR}-04-11T06:05:00.000Z` }),
    monthEntry(BILLET, `${YEAR}-04`, { tonnes: 4310, gasM3: 534800, mwh: 2502, status: "submitted", submittedAt: `${YEAR}-05-12T02:55:00.000Z` }),
    monthEntry(BILLET, `${YEAR}-05`, { tonnes: 4590, gasM3: 566900, mwh: 2668, status: "submitted", submittedAt: `${YEAR}-06-11T07:31:00.000Z` }),
    monthEntry(BILLET, `${YEAR}-06`, { tonnes: 4405, gasM3: 545100, mwh: 2559, status: "draft" }),
  ],
  [HRC]: [
    monthEntry(HRC, `${YEAR}-01`, { tonnes: 7150, gasM3: 388000, mwh: 4120, status: "reviewed", submittedAt: `${YEAR}-02-14T08:02:00.000Z` }),
    monthEntry(HRC, `${YEAR}-02`, { tonnes: 6840, gasM3: 371400, mwh: 3944, status: "reviewed", submittedAt: `${YEAR}-03-16T05:18:00.000Z` }),
    monthEntry(HRC, `${YEAR}-03`, { tonnes: 7320, gasM3: 397600, mwh: 4218, status: "submitted", submittedAt: `${YEAR}-04-15T09:47:00.000Z` }),
    monthEntry(HRC, `${YEAR}-04`, { tonnes: 7005, gasM3: 380200, mwh: 4037, status: "draft" }),
  ],
};

/* ── The review conversation, already part-way through ──────────
   Three states on purpose, because they are the three the queue exists to
   separate: waiting on this reader, waiting on the supplier, and settled.
   The attestations carry a real name and a real role — an unsigned submission
   would be a month nobody claimed, which is a state the product does not
   actually produce. */
const attest = (fullName: string, role: string, at: string) => ({ fullName, role, at, warningsAcknowledged: 0 });

const SUBMISSIONS: Record<string, Record<string, MonthSubmission>> = {
  [BILLET]: {
    [`${YEAR}-01`]: {
      workspaceId: BILLET, month: `${YEAR}-01`, state: "confirmed", editedByExporter: false,
      attestation: attest("Ananya P.", "ESG / Sustainability", `${YEAR}-02-09T04:12:00.000Z`),
      submittedAt: `${YEAR}-02-09T04:12:00.000Z`, confirmedBy: "Pimchanok S.", confirmedAt: `${YEAR}-02-13T02:30:00.000Z`, revisionRound: 0,
    },
    [`${YEAR}-02`]: {
      workspaceId: BILLET, month: `${YEAR}-02`, state: "confirmed", editedByExporter: false,
      attestation: attest("Ananya P.", "ESG / Sustainability", `${YEAR}-03-10T03:40:00.000Z`),
      submittedAt: `${YEAR}-03-10T03:40:00.000Z`, confirmedBy: "Pimchanok S.", confirmedAt: `${YEAR}-03-13T08:10:00.000Z`, revisionRound: 0,
    },
    [`${YEAR}-03`]: {
      workspaceId: BILLET, month: `${YEAR}-03`, state: "confirmed", editedByExporter: false,
      attestation: attest("Ananya P.", "ESG / Sustainability", `${YEAR}-04-11T06:05:00.000Z`),
      submittedAt: `${YEAR}-04-11T06:05:00.000Z`, confirmedBy: "Pimchanok S.", confirmedAt: `${YEAR}-04-14T03:22:00.000Z`, revisionRound: 1,
    },
    [`${YEAR}-04`]: {
      workspaceId: BILLET, month: `${YEAR}-04`, state: "submitted", editedByExporter: false,
      attestation: attest("Ananya P.", "ESG / Sustainability", `${YEAR}-05-12T02:55:00.000Z`),
      submittedAt: `${YEAR}-05-12T02:55:00.000Z`, revisionRound: 0,
    },
    [`${YEAR}-05`]: {
      workspaceId: BILLET, month: `${YEAR}-05`, state: "submitted", editedByExporter: false,
      attestation: attest("Ananya P.", "ESG / Sustainability", `${YEAR}-06-11T07:31:00.000Z`),
      submittedAt: `${YEAR}-06-11T07:31:00.000Z`, revisionRound: 0,
    },
  },
  [HRC]: {
    [`${YEAR}-01`]: {
      workspaceId: HRC, month: `${YEAR}-01`, state: "confirmed", editedByExporter: false,
      attestation: attest("Anan W.", "Plant Manager, G J Steel", `${YEAR}-02-14T08:02:00.000Z`),
      submittedAt: `${YEAR}-02-14T08:02:00.000Z`, confirmedBy: "Pimchanok S.", confirmedAt: `${YEAR}-02-19T01:44:00.000Z`, revisionRound: 0,
    },
    [`${YEAR}-02`]: {
      workspaceId: HRC, month: `${YEAR}-02`, state: "confirmed", editedByExporter: false,
      attestation: attest("Anan W.", "Plant Manager, G J Steel", `${YEAR}-03-16T05:18:00.000Z`),
      submittedAt: `${YEAR}-03-16T05:18:00.000Z`, confirmedBy: "Pimchanok S.", confirmedAt: `${YEAR}-03-20T06:12:00.000Z`, revisionRound: 0,
    },
    /* The one that is sent back and has not come home. A queue with nothing in
       this state never shows the reader what "you are owed something" looks
       like, which is half of what the screen is for. */
    [`${YEAR}-03`]: {
      workspaceId: HRC, month: `${YEAR}-03`, state: "changes_requested", editedByExporter: false,
      attestation: attest("Anan W.", "Plant Manager, G J Steel", `${YEAR}-04-15T09:47:00.000Z`),
      submittedAt: `${YEAR}-04-15T09:47:00.000Z`,
      revisionNote:
        "The electricity figure is the site total, not the line's. Please split out the coil line, and attach the meter reading you took it from.",
      revisionAt: `${YEAR}-04-21T03:05:00.000Z`,
      revisionAreas: ["electricity"],
      revisionRound: 1,
    },
  },
};

/* One pack already signed, so the reader can see their own trail rather than
   an empty section explaining what would appear in it. Signed by the seat this
   build is — anything else would be a signature this reader is looking at and
   cannot account for. */
const PACK_SIGNOFFS: Record<string, PackSignOff> = {
  [HRC]: {
    workspaceId: HRC,
    name: "Pimchanok S.",
    jobTitle: "Legal & Compliance Manager",
    signedAt: `${YEAR}-05-04T07:15:00.000Z`,
    /* Deliberately not a real fingerprint of the figures above. It cannot be —
       computing one needs the SEE engine and the readiness verdict, which are
       not available at boot. The consequence is exactly right: the readiness
       page will report this signature as STALE, because the figures it was
       given for cannot be recovered. That is the honest reading of a
       signature whose subject is unknown, and it is what the product should
       say about one. */
    fingerprint: "fixture|unverifiable",
  },
};

/* ── Writing it, once ───────────────────────────────────────── */

function isEmpty(key: string): boolean {
  const raw = window.localStorage.getItem(key);
  if (!raw) return true;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.length === 0;
    return !parsed || Object.keys(parsed).length === 0;
  } catch {
    return false;
  }
}

/** Load the account Operations would have left, unless there is already one.
    Safe to call on every boot; it does nothing after the first. */
export function ensureSeatFixture(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(SEEDED_KEY)) return false;
    /* Not just "have we seeded" — "is there anything here at all". A reader
       who cleared the seeded flag but kept their workspaces must not have a
       second copy of the estate written underneath them. */
    if (!isEmpty(K.workspaces)) {
      window.localStorage.setItem(SEEDED_KEY, "skipped");
      return false;
    }

    window.localStorage.setItem(K.workspaces, JSON.stringify(WORKSPACES));
    window.localStorage.setItem(K.months, JSON.stringify(MONTHS));
    window.localStorage.setItem(K.submissions, JSON.stringify(SUBMISSIONS));
    window.localStorage.setItem(K.packSignoff, JSON.stringify(PACK_SIGNOFFS));
    window.localStorage.setItem(SEEDED_KEY, new Date().toISOString());
    return true;
  } catch {
    /* Private browsing, quota, anything — the portal opens empty, which is a
       legible failure rather than a broken one. */
    return false;
  }
}
