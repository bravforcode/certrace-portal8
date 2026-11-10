import type { CeraLang } from "./lang";
/* ════════════════════════════════════════════════════════════
   CERA — the shapes a conversation is made of

   A message is text, and sometimes a CARD: a small interactive block that sits
   under the text — a question with buttons, a file drop, the readings Cera found
   in a file laid out as the form they will go into, a digest of rule changes.

   Everything here is plain JSON so a conversation can be kept (its history) and
   reopened. The one thing that cannot be kept is the file itself: a question
   Cera asked about a file is answerable only while the file is still in the
   browser, and a reopened conversation shows it as past.
   ════════════════════════════════════════════════════════════ */

export type CeraAttachment = {
  name: string;
  kind: "image" | "file";
  url?: string;
};

export type CeraChoiceOption = { id: string; label: string; hint?: string };

/** What a reading is in the form — the key that lets an edited value find its way back into the month. */
export type ReadingField =
  | "production"
  | "fuelType"
  | "fuelQty"
  | "fuelNcv"
  | "elecFrom"
  | "elecMwh"
  | "elecFactor"
  | "elecInst"
  | "procMethod"
  | "procMaterial"
  | "procQty"
  | "scrapTonnes"
  | "scrapPre"
  | "pfcAem"
  | "notes"
  /** a precursor's answer — which one is `target`, a key of the precursor field registry (lib/cbam/precursor-fields.ts) */
  | "precursor";

/** How the reader changes it: type a number, type a line, type a paragraph, or pick from the form's own list. */
export type ReadingInput =
  | { kind: "number" }
  | { kind: "text" }
  | { kind: "textarea" }
  | { kind: "select"; options: { id: string; label: string }[] };

/** One reading Cera found in a file, as it will appear in the form it goes into. */
export type ExtractedReading = {
  id: string;
  field: ReadingField;
  input: ReadingInput;
  /** the value as the reader can edit it — "4820.5", or the id of a choice */
  raw: string;
  /** what the file said, so a change can be shown and undone */
  found: { raw: string; unitId?: string };
  /** a quantity's unit, when the reader can change that too */
  unitId?: string;
  unitOptions?: { id: string; label: string }[];
  edited?: boolean;
  section:
    | "production"
    | "fuel"
    | "electricity"
    | "process"
    | "scrap"
    | "pfc"
    | "notes"
    | "p_operator"
    | "p_period"
    | "p_emissions"
    | "p_verifier";
  /** for a precursor's answer: the registry key it is written under */
  target?: string;
  /** how a typed value must look, where it is not just a number — a date is YYYY-MM-DD */
  format?: "date";
  /** the row it belongs to within a section — one fuel, one electricity source */
  group?: string;
  /** "Fuel 1", "Source 2" — what the row is called in the form */
  groupLabel?: string;
  label: string;
  /** the boxed Annex IV item the answer goes into, as the form shows it */
  tag: string;
  need: "required" | "optional";
  /** the value as it is shown — formatted, or the choice's label */
  value: string;
  unit?: string;
  /** the line of the file it was read from, so the reader can check it */
  source?: string;
  included: boolean;
};

/** What happens to the month if the reader accepts — plain data, applied by
    lib/cera/smart-upload.ts. */
export type ApplyPayload = {
  productionTonnes?: number;
  fuels: {
    fuelType: string;
    fuelTypeOther?: string;
    quantity: number;
    unit: "m3" | "kg" | "t" | "l" | "GJ";
    ncvMjPerUnit?: number;
    efTco2PerGj?: number;
    readingIds: string[];
  }[];
  electricity: {
    sourceType:
      | "grid_default"
      | "ppa"
      | "self_generated"
      | "direct_technical_link";
    mwh: number;
    factorTco2PerMwh?: number;
    supplierInstallation?: string;
    readingIds: string[];
  }[];
  process: {
    materialId: string;
    method: "standard" | "mass_balance";
    quantityT: number;
    readingIds: string[];
  }[];
  /** scrap melted or charged, and the pre-consumer part of it (steel's carbon-balance row, aluminium's scrap block) */
  scrap?: {
    material: "steel_scrap" | "iron_scrap" | "aluminium_scrap";
    tonnes: number;
    preConsumerT?: number;
    readingIds: string[];
  }[];
  /** anode-effect minutes per cell-day, for a primary smelter's PFC block */
  pfcAem?: { aem: number; readingId: string };
  notes?: string;
  notesReadingId?: string;
};

export type ExtractionPlan = {
  fileName: string;
  /** what Cera took the file to be, in words */
  documentKind: string;
  workspaceId: string;
  /** "Iron ore · TH-RAYONG-01" */
  workspaceLabel: string;
  month: string;
  monthLabel: string;
  readings: ExtractedReading[];
  payload: ApplyPayload;
  /** set when the file belongs to a direct precursor's own form, not to a month — `workspaceId` is then the exporter's product report and this is the precursor row */
  precursor?: { nodeId: string };
  /** the language it was written in — what the card and the fill-in message are spoken in */
  lang?: CeraLang;
};

export type UpdateItem = {
  id: string;
  /** ISO date the change takes effect (or took effect) — for news, the day it was officially announced */
  date: string;
  /** who announced it, so the reader can tell the Commission's own word from a national body's or a report of it */
  source?: string;
  title: string;
  body: string;
};

export type CeraCard =
  | { kind: "upload" }
  | {
      kind: "report-autofill";
      id: string;
      fileName: string;
      fileNames?: string[];
    }
  | {
      kind: "choice";
      id: string;
      question: string;
      options: CeraChoiceOption[];
      answer?: string;
    }
  | {
      kind: "extraction";
      id: string;
      plan: ExtractionPlan;
      state: "open" | "applied" | "discarded" | "review";
      saveState?: "pending" | "failed";
      saveError?: string;
      appliedAt?: string;
    }
  | {
      kind: "updates";
      asOf: string;
      inForce: UpdateItem[];
      upcoming: UpdateItem[];
    }
  | {
      kind: "links";
      links: {
        label: string;
        href: string /** the part of the page to bring into view, as a hash like "#qf-fuels" */;
        focus?: string /** the month the part belongs to — on a supplier's link the button moves that page, it does not leave it */;
        month?: string;
      }[];
    };

export type CeraMessage = {
  id: string;
  role: "user" | "cera";
  text: string;
  /** names of files attached to a user message */
  attachments?: CeraAttachment[];
  cards?: CeraCard[];
  /** follow-up questions offered as buttons under a reply */
  suggestions?: string[];
  /** the language the reply is in, so its cards are drawn in it too (a Thai answer on an English screen, or the reverse) */
  lang?: CeraLang;
};

/** What the engine hands back for one question. */
export type CeraReply = {
  text: string;
  cards?: CeraCard[];
  suggestions?: string[];
  /** the question is a request to start the smart upload flow */
  startUpload?: boolean;
  /** the language the reply is written in — the language of the question */
  lang?: CeraLang;
};
