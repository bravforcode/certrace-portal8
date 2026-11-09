/* ════════════════════════════════════════════════════════════
   INSTALLATIONS — the producing sites a workspace can be about

   A verification workspace is scoped to an installation, and an installation
   is always somebody's: either the exporter's own site, or a supplier's.

   THE CASE THIS EXISTS FOR is the one the old picker could not express. A
   Thai exporter of rolled coil very often IS the producing installation — the
   supplier and the exporter are the same legal person — and the old flow made
   them type their own plant in as if it were a third party, then type it again
   in Settings, with nothing connecting the two. So an installation record now
   carries `self`, one record is marked as the exporter's own, and both the
   workspace flow and Settings → Organisation read and write the same store.

   WHY A RECORD AND NOT A NAME. What a verifier asks about an installation is
   not its name: it is where it is, who operates it, what it does and how to
   reach the person who signs for the data. Those fields are the same ones the
   EU asks for on an installation, so they are captured once here rather than
   re-asked per workspace.

   Frontend-only MVP: one localStorage key, the same seam as lib/workspace.ts.
   ════════════════════════════════════════════════════════════ */

import { getOrgIdentity } from "./org";

/* ── The record IS the EU sheet ─────────────────────────────────
   Field for field, in order, from section 2 "About the installation" of the
   CBAM communication template's A_InstData sheet:

     i Name (optional) · ii Name (English) · iii Street, Number ·
     iv Economic activity · v Post code · vi P.O. Box · vii City ·
     viii Country · ix UNLOCODE · x/xi Coordinates of the MAIN EMISSION
     SOURCE · xii Name of authorised representative · xiii Email ·
     xiv Telephone

   Kept in that order and with that wording on purpose. An exporter fills this
   once here and then copies it into the actual workbook their buyer sends, and
   a portal that renames "authorised representative" to "contact" or asks for
   the site's coordinates rather than the emission source's makes that copy a
   translation exercise — which is where transcription errors come from.

   `name` is the ENGLISH name, because that is the one the template marks as
   required and the one that reaches the declarant. `nameLocal` is field (i),
   which is optional and is where "บริษัท ไทย ทินเพลท จำกัด" belongs. */
/* ── The monitoring-plan summary, entered once ─────────────────
   Annex IV to Implementing Regulation (EU) 2025/2547, items 2–6: what the
   installation does, as opposed to which goods it made this year. These facts
   change when the plant changes, not when the year does, so they are asked
   once here and printed into every year's monitoring plan and operator's
   emissions report. Free text is English (the report must be in English);
   each yes/no carries a detail line that is asked only when the answer is yes. */
export type YesNo = "" | "yes" | "no";

export type InstallationMonitoring = {
  /** 2(b) non-CBAM production processes carried out at the installation */
  nonCbamProcesses: string;
  /** 2(d) the five most important fuels, by energy content */
  topFuels: string;
  /** 2(e) the five most important materials leading to process emissions, by emissions */
  topMaterials: string;
  /** 2(f) continuous emissions measurement */
  cems: YesNo;
  cemsDetail: string;
  /** 2(g) zero-rated fuels, and how zero-rating is demonstrated */
  zeroRatedFuels: YesNo;
  zeroRatedDetail: string;
  /** 2(h) measurable heat imported from or exported to other installations */
  heatTrade: YesNo;
  heatDetail: string;
  /** 3 electricity consumed from different sources */
  electricityMixed: YesNo;
  electricityDetail: string;
  /** 4 electricity produced inside the installation */
  onsiteElectricity: YesNo;
  onsiteElectricityDetail: string;
  /** 5 waste gases produced and used, imported or exported */
  wasteGases: YesNo;
  wasteGasDetail: string;
  /** 6 CO₂ transferred to other installations or infrastructure */
  co2Transfer: YesNo;
  co2TransferDetail: string;
  /** 1.1.1 electricity from this installation is imported into the EU — the only
      trigger for the declarant-specific addendum */
  electricityToEu: YesNo;
};

export const emptyMonitoring = (): InstallationMonitoring => ({
  nonCbamProcesses: "",
  topFuels: "",
  topMaterials: "",
  cems: "",
  cemsDetail: "",
  zeroRatedFuels: "",
  zeroRatedDetail: "",
  heatTrade: "",
  heatDetail: "",
  electricityMixed: "",
  electricityDetail: "",
  onsiteElectricity: "",
  onsiteElectricityDetail: "",
  wasteGases: "",
  wasteGasDetail: "",
  co2Transfer: "",
  co2TransferDetail: "",
  electricityToEu: "",
});

export type Installation = {
  /** operator reference — the id a verifier and the buyer both quote. Not a
      template field; it is how Certrace keys the record and groups workspaces. */
  id: string;
  /** (ii) Name of the installation (English name) */
  name: string;
  /** (i) Name of the installation — optional, in the local language */
  nameLocal: string;
  /** true for the exporter's own site. Several records may carry it — an
      exporter with three plants has three own sites, and the flow that assumed
      exactly one is what forced the second and third to be entered as though
      they belonged to a third party. */
  self: boolean;
  /** The company that runs this plant — a `SupplierCompany` id from
      lib/supplier-companies.ts. Empty on own sites: the exporter is the
      company, and pointing at a supplier record for yourself would put your
      own plant on the Suppliers page. */
  supplierId: string;
  /** (iii) Street, Number */
  street: string;
  /** (iv) Economic activity */
  economicActivity: string;
  /** (v) Post code */
  postcode: string;
  /** (vi) P.O. Box */
  poBox: string;
  /** (vii) City */
  city: string;
  /** (viii) Country */
  country: string;
  /** (ix) UNLOCODE */
  unlocode: string;
  /** (x) Coordinates of the main emission source — latitude.
      Decimal degrees, held as strings so a half-typed coordinate survives. */
  lat: string;
  /** (xi) Coordinates of the main emission source — longitude */
  lng: string;
  /** (xii) Name of authorised representative */
  contactName: string;
  /** (xiii) Email */
  contactEmail: string;
  /** (xiv) Telephone */
  contactPhone: string;
  /** Products made at this site that are outside CBAM scope. Not a template
      field — it lets a verifier confirm the reported boundary covers only the
      CBAM good in a workspace and nothing else running through the same
      plant. Optional: an empty list is a complete, common answer. */
  otherGoods: { name: string; description?: string }[];

  /* ── The operator, and the installation's identity in the CBAM Registry ──
     Annex IV items 1(a)–(c) and 1(d). Entered once with the rest of this
     record and printed on every report made at the site. */
  /** 1(a) name of the operator — the legal person that runs the installation */
  operatorName: string;
  /** 1(b) corporate or activity registration number of the operator */
  operatorRegistrationNumber: string;
  /** 1(c) full address of the operator, in English */
  operatorAddress: string;
  /** 1(d) unique installation identifier in the CBAM Registry, once issued */
  registryId: string;
  /** items 2–6 */
  monitoring: InstallationMonitoring;
  createdAt: string;
};

const KEY = "certrace:installations";

/* ── Installation reference format ──────────────────────────────
   The reference is quoted by the buyer, by the declarant and on every
   document that leaves the portal, so a typo in it is expensive and silent.
   It is checked rather than merely hinted:

     · it starts with the two-letter ISO country code of the site,
     · the rest is A–Z, 0–9 and single hyphens,
     · 5 to 32 characters, no leading/trailing/double hyphen.

   The country prefix is the part that earns its keep. A reference that does
   not start with the country the installation is in is nearly always a
   reference copied from another site — the most common way two plants end up
   sharing one id and a year of data lands against the wrong one. */
const REFERENCE_RE = /^[A-Z]{2}(?:-[A-Z0-9]+)+$/;

export const MIN_REFERENCE_LENGTH = 5;
export const MAX_REFERENCE_LENGTH = 32;

/** Uppercases and strips what a reference can never contain, so paste-in from
    a spreadsheet does not fail on whitespace or lowercase. */
export const normaliseReference = (raw: string): string =>
  raw
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, MAX_REFERENCE_LENGTH);

/** null when valid; otherwise the one sentence that says what to fix. */
/** Is this reference already on another installation?

    `excludeId` is the record being EDITED — without it, editing a site and
    saving it unchanged would report its own reference as taken.

    This is the guard that makes the create flow safe. `saveInstallation`
    upserts by id, so before this existed, adding a "new" installation whose
    reference happened to match an existing one did not fail and did not warn:
    it silently replaced that site's name, address, coordinates and contact
    with whatever was in the new form. A year of workspaces stayed pointed at
    the id and quietly described a different plant. */
export function referenceTaken(raw: string, excludeId?: string): boolean {
  const value = normaliseReference(raw);
  if (!value) return false;
  const exclude = excludeId ? normaliseReference(excludeId) : null;
  return read().some((i) => i.id === value && i.id !== exclude);
}

export function referenceError(raw: string, countryCode?: string, excludeId?: string): string | null {
  const value = raw.trim();
  if (!value) return "Give this installation a reference.";
  if (value.length < MIN_REFERENCE_LENGTH) return `At least ${MIN_REFERENCE_LENGTH} characters — “TH-RAYONG-01”, not “TH1”.`;
  if (value.length > MAX_REFERENCE_LENGTH) return `At most ${MAX_REFERENCE_LENGTH} characters.`;
  if (value.startsWith("-") || value.endsWith("-")) return "Cannot start or end with a hyphen.";
  if (value.includes("--")) return "Use single hyphens.";
  if (!REFERENCE_RE.test(value)) return "Country code, then a hyphen, then letters and numbers — “TH-RAYONG-01”.";
  if (countryCode && !value.startsWith(`${countryCode.toUpperCase()}-`))
    return `Start with ${countryCode.toUpperCase()}— the country this installation is in.`;
  if (referenceTaken(value, excludeId))
    return `${normaliseReference(value)} already belongs to another installation. Every site needs its own reference — to change that site, open it from Settings → Installations.`;
  return null;
}

/* ── Required and optional ──────────────────────────────────────
   The form asks for what Annex IV of 2025/2547 item 1(d) asks for — name,
   address, UN/LOCODE, coordinates — plus the reference that keys the record.
   Certrace is stricter than the template about those, because a field left
   blank here becomes a question the verifier asks three months later.

   NOT ASKED ANY MORE: `nameLocal`, `economicActivity`, `contactName`,
   `contactEmail` and `contactPhone`. None of them is an item of a report in the
   set, so the form no longer carries them. They stay on the record (and in
   anything already stored) so nothing is lost; the legacy workbook-shaped
   documents still print them if they are there. The email in particular is NOT
   where a supplier's monthly link goes — that is the supplier company's own
   address (lib/reminder-registration.ts) — so an installation has no use for one.

   OPTIONAL, deliberately:
     · poBox            — most sites do not have one, and requiring it would
       make the form unfillable for them

   Everything else identifies the plant, and a workspace pointing at a site
   with no city or no coordinates is a workspace a declarant cannot file. */
export type InstallationFieldErrors = Partial<Record<keyof Installation | "coordinates", string>>;

export function installationErrors(i: Installation, excludeId?: string): InstallationFieldErrors {
  const e: InstallationFieldErrors = {};
  const req = (v: string, msg: string) => (v && v.trim() ? undefined : msg);

  e.name = req(i.name, "The English name of the site. This is the name the declarant and the verifier use.");
  e.id = referenceError(i.id, i.country, excludeId) ?? undefined;
  e.street = req(i.street, "Street and number. A verifier has to be able to find the site.");
  e.postcode = req(i.postcode, "Post code.");
  e.city = req(i.city, "City.");
  e.country = req(i.country, "Country.");
  e.unlocode = req(i.unlocode, "UNLOCODE. If the site does not have one, apply through UNECE — see the help beside the field.");
  const coord = coordinateError(i.lat, i.lng);
  if (coord) e.coordinates = coord;
  else {
    if (!i.lat.trim()) e.lat = "Latitude of the main emission source.";
    if (!i.lng.trim()) e.lng = "Longitude of the main emission source.";
  }

  for (const k of Object.keys(e) as (keyof InstallationFieldErrors)[]) if (!e[k]) delete e[k];
  return e;
}

/** Required-and-plausible, in the same words the supplier form uses for the
    same field (`supplierEmailError`, lib/supplier-companies.ts). Not imported
    from there: this module has no other reason to depend on the supplier
    store, and the rule is one regex. */
export function emailError(raw: string): string | null {
  const value = (raw ?? "").trim();
  if (!value) return "An email address — this is where each month's link goes.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "That does not look like an email address.";
  return null;
}

/** Latitude/longitude are optional, but a half-entered pair is not: a verifier
    reading one coordinate cannot place a site. */
export function coordinateError(lat: string, lng: string): string | null {
  const a = lat.trim();
  const b = lng.trim();
  if (!a && !b) return null;
  if (!a || !b) return "Give both coordinates, or neither.";
  const nlat = Number(a);
  const nlng = Number(b);
  if (!Number.isFinite(nlat) || nlat < -90 || nlat > 90) return "Latitude is between −90 and 90.";
  if (!Number.isFinite(nlng) || nlng < -180 || nlng > 180) return "Longitude is between −180 and 180.";
  return null;
}

/* ── Store ────────────────────────────────────────────────────── */

function read(): Installation[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as Partial<Installation>[];
    return Array.isArray(parsed) ? parsed.map(hydrate) : [];
  } catch {
    return [];
  }
}

function write(all: Installation[]): Installation[] {
  if (typeof window === "undefined") return all;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore quota */
  }
  return all;
}

/* A BLANK RECORD IS BLANK, including on the exporter's own site.

   It used to arrive pre-filled: the reference from the org profile's
   `installationId` and the English name from the COMPANY name. Both were
   wrong in the same way. A company is not an installation — "Siam Steel
   Export Co." is the legal person, and the site is "Rayong Rolling Mill 2" —
   so the prefill put a plausible-looking wrong answer in the field a verifier
   quotes. And because the reference is the record's key, a second own site
   opened the form already carrying the FIRST site's reference, which is
   exactly the duplicate the uniqueness check then refused.

   Only `country` is still seeded, because it backs a <Select> that has to
   render with something selected. */
export function emptyInstallation(self = false): Installation {
  const org = self ? getOrgIdentity() : null;
  return {
    id: "",
    name: "",
    nameLocal: "",
    self,
    supplierId: "",
    street: "",
    economicActivity: "",
    postcode: "",
    poBox: "",
    city: "",
    country: self ? (org?.origin ?? "TH") : "TH",
    unlocode: "",
    lat: "",
    lng: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    otherGoods: [],
    operatorName: "",
    operatorRegistrationNumber: "",
    operatorAddress: "",
    registryId: "",
    monitoring: emptyMonitoring(),
    createdAt: new Date().toISOString(),
  };
}

/** Records written before a field existed load as `undefined` and would render
    an uncontrolled input. Everything that reads a stored installation goes
    through here so a missing field is an empty string, never a crash. */
export const hydrate = (raw: Partial<Installation>): Installation => ({
  ...emptyInstallation(Boolean(raw.self)),
  ...raw,
  // Nested, so a record saved before these existed gets every key rather than none.
  monitoring: { ...emptyMonitoring(), ...(raw.monitoring ?? {}) },
});

/* ── The record a workspace points at ───────────────────────────
   THE OWNERSHIP COMES FROM THE WORKSPACE, NOT FROM A DEFAULT.

   A workspace names an installation by reference, and screens that open one —
   the supplier's Smart Link most of all — have to render a record even when
   the store has never seen it. The supplier's browser is exactly that case:
   every store in this build is browser-local, so the first thing their link
   does is fabricate the record from the workspace's `installationId` and
   `installationName`.

   Fabricating it with `emptyInstallation()` and nothing else got two things
   wrong, and both of them end in one record overwriting another, because
   `saveInstallation` upserts BY REFERENCE:

     · `self` fell to its default of false. A workspace on the exporter's own
       site round-tripped through that screen came back as a third-party
       record under the same reference — off the "Your installations" list in
       Settings, out of `ownInstallations()`, and its months routed out to a
       supplier who is the exporter.
     · `supplierId` fell to "". The plant stopped belonging to the company it
       belongs to, so it vanished from that supplier's page while a workspace
       still named it.

   The workspace already knows both. This is the one place that reads them, so
   the two screens cannot answer the question differently.

   NOTE WHAT IS STILL BLANK: everything the workspace does not know. The
   reference is the workspace's own, never the org profile's and never another
   site's — see `emptyInstallation` for the version of this that got that
   wrong. */
export type WorkspaceInstallationRef = {
  installationId: string;
  installationName: string;
  selfSupplied?: boolean;
  supplierId?: string;
};

export function installationForWorkspace(w: WorkspaceInstallationRef): Installation {
  const stored = getInstallation(w.installationId);
  if (stored) return stored;
  const self = Boolean(w.selfSupplied);
  return {
    ...emptyInstallation(self),
    id: w.installationId,
    name: w.installationName,
    // An own site can never also point at a supplier — the same rule
    // `saveInstallation` enforces, applied before the record is ever shown.
    supplierId: self ? "" : (w.supplierId ?? ""),
  };
}

/** Own site first, then alphabetical — the exporter's own plant is the one
    they pick most often, so it is never buried in a list of suppliers. */
export const listInstallations = (): Installation[] =>
  read().sort((a, b) => Number(b.self) - Number(a.self) || a.name.localeCompare(b.name));

export const getInstallation = (id: string): Installation | null => read().find((i) => i.id === id) ?? null;

/** Every site the exporter operates themselves.

    AN EXPORTER CAN HAVE MORE THAN ONE, and that is the change. `self` used to
    be exclusive — saving a second own-site silently moved the flag off the
    first — which meant a company with a billet plant in Rayong and a rolling
    mill in Chonburi could only ever register one of them as theirs. The second
    had to be entered as a third-party supplier, so its months went "out" to a
    supplier who was the exporter themselves, and never landed in their inbox. */
export const ownInstallations = (): Installation[] => listInstallations().filter((i) => i.self);

/** The exporter's own installation — the FIRST one, kept for the screens that
    genuinely want a single answer ("your registered site" in onboarding). Use
    `ownInstallations()` anywhere the count can be more than one. */
export const ownInstallation = (): Installation | null => ownInstallations()[0] ?? null;

export const hasOwnInstallation = (): boolean => ownInstallation() !== null;

/** Every plant belonging to one supplier company. */
export const installationsForSupplier = (supplierId: string): Installation[] =>
  listInstallations().filter((i) => !i.self && i.supplierId === supplierId);

/** Upsert by reference. `self` is NOT exclusive — see `ownInstallations`. */
export function saveInstallation(input: Installation): Installation {
  const record: Installation = {
    ...input,
    id: normaliseReference(input.id),
    name: input.name.trim(),
    // An own site is the exporter's own company, so it can never also point at
    // a supplier record. Enforced here rather than trusted from the caller: a
    // self installation carrying a supplierId would appear on the Suppliers
    // page as one of the exporter's own third parties.
    supplierId: input.self ? "" : input.supplierId,
  };
  write([...read().filter((i) => i.id !== record.id), record]);
  return record;
}

export function removeInstallation(id: string): Installation[] {
  return write(read().filter((i) => i.id !== id));
}

/** Everything a workspace needs to name an installation without loading the
    whole record — used by the picker and by the workspace card. */
export type InstallationOption = { id: string; name: string; self: boolean; supplierId?: string };

/** The picker's list. Installations already used by a workspace are folded in
    even when they predate this store, so an existing estate is never hidden by
    an upgrade — and the exporter's own site is synthesised from the org
    profile when they have not registered one yet, because "myself" has to be
    offerable before it has been filled in. */
export function pickerOptions(usedByWorkspaces: InstallationOption[] = []): InstallationOption[] {
  const seen = new Map<string, InstallationOption>();

  const own = ownInstallations();
  if (own.length > 0) {
    for (const i of own) seen.set(i.id, { id: i.id, name: i.name, self: true, supplierId: "" });
  } else {
    // "Myself" has to be offerable before it has been filled in, so the org
    // profile stands in until a real record exists.
    const org = getOrgIdentity();
    if (org.installationId) seen.set(org.installationId, { id: org.installationId, name: org.name, self: true, supplierId: "" });
  }

  for (const i of listInstallations()) if (!seen.has(i.id)) seen.set(i.id, { id: i.id, name: i.name, self: i.self, supplierId: i.supplierId });
  for (const u of usedByWorkspaces) if (!seen.has(u.id)) seen.set(u.id, u);
  return [...seen.values()].sort((a, b) => Number(b.self) - Number(a.self) || a.name.localeCompare(b.name));
}

/** Which fields a verifier will ask for and this record has not answered.
    Drives the "complete your own installation" prompt in Settings and the
    inline warning in the workspace flow — one rule, both places. */
export function missingFields(i: Installation | null): string[] {
  if (!i) return ["Everything — no installation registered yet"];
  const gaps: string[] = [];
  if (!i.name.trim()) gaps.push("Name of the installation (English)");
  /* ITS OWN REFERENCE IS NOT A DUPLICATE OF ITSELF. Without `excludeId` the
     uniqueness check compares this record's id against the stored copy of the
     same record and reports "TH-RAYONG-01 already belongs to another
     installation" against the site that IS TH-RAYONG-01 — so a complete,
     saved installation read as permanently missing its reference on every
     screen that calls this. Same fix, same reason, as `existingId` on
     InstallationStep. */
  if (referenceError(i.id, i.country, i.id)) gaps.push("Installation reference");
  if (!i.street.trim()) gaps.push("Street, number");
  if (!i.city.trim()) gaps.push("City");
  if (!i.country.trim()) gaps.push("Country");
  // The template asks for both coordinates of the main emission source, and a
  // site a verifier cannot place is a site they will ask about.
  if (!i.lat.trim() || !i.lng.trim()) gaps.push("Coordinates of the main emission source");
  return gaps;
}

export const isInstallationComplete = (i: Installation | null): boolean => missingFields(i).length === 0;
