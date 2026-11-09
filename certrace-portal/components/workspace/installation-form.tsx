"use client";

/* ════════════════════════════════════════════════════════════
   THE INSTALLATION RECORD — one form, three places

   Settings → Organisation registers the exporter's OWN site with it, the
   new-workspace flow adds a supplier's site with it, and the workspace flow
   also uses it inline when the exporter picks "this installation is us" and
   has not filled their own in yet.

   One component for all three because these are the same facts. A supplier
   installation and the exporter's own installation are the same kind of
   object; only `self` differs, and a second form would drift the moment one
   of them gained a field.

   THE REFERENCE IS CHECKED, NOT HINTED. It is quoted by the buyer, by the
   declarant and on every document that leaves the portal, so `referenceError`
   in lib/installations.ts states the format and this form refuses to save
   against it — see the comment there for why the country prefix earns its
   keep.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Check } from "lucide-react";
import { Button, FieldLabel, HelpTip, Modal, inputClass, cn } from "@/components/ui";
import { AnnexLegend, AnnexTag } from "@/components/precursor/annex-fields";
import { Select } from "@/components/controls";
import { COUNTRIES } from "@/lib/config";
import { useLanguage, useT } from "@/lib/i18n";
import {
  coordinateError,
  emptyInstallation,
  installationErrors,
  normaliseReference,
  referenceError,
  saveInstallation,
  type Installation,
} from "@/lib/installations";

const countryOptions = COUNTRIES.map((c) => ({ value: c.code, label: c.name, hint: c.code }));

/* ── UNLOCODE help, shared ──────────────────────────────────────
   Exported because this exact explanation has to appear everywhere the field
   does — Settings → Organisation, the new-workspace flow, and the supplier
   portal's own installation block. Three copies of it would drift, and the
   one that drifts is always the one the supplier reads.

   The Thai line is the practical answer to "I do not have one": UNLOCODE is
   issued by UNECE, not by Thai customs, and the request goes to them
   directly. It is given in both languages because the exporter filling this
   in is often not the person who will make the application. */
export function UnlocodeHelp() {
  const { t, lang } = useLanguage();
  return (
    <>
      <p>
        {t("The UN/LOCODE for this site — five letters, the two-letter country code first, then three for the place. Thailand’s Map Ta Phut is")}
        {/* Codes, never translated — the point of a UN/LOCODE is that it reads
            the same in every language, and a "translated" one would be wrong. */}
        <span className="font-mono"> {t("THMAT")}</span>; {t("Laem Chabang is")} <span className="font-mono">{t("THLCH")}</span>.
      </p>
      <p className="mt-2">
        {t("It identifies WHERE the goods were produced. Use the code for the town or port the installation sits in — not your head office, and not the port the goods leave from if that is somewhere else.")}
      </p>
      <p className="mt-2">
        <strong>{t("If this site has no code yet:")}</strong> {t("apply for a new one directly through UNECE, which is the body that issues them. Your customs broker cannot create one for you.")}
      </p>
      {/* THE THAI GLOSS IS FOR THE ENGLISH INTERFACE ONLY. It exists because
          the exporter reading this screen in English is often not the person
          who will make the UNECE application, and that person reads Thai. In
          the Thai interface the paragraph above is already Thai, so the gloss
          would be the same sentence twice. */}
      {lang === "en" && <p className="mt-1 text-black/50">ยื่นขอรหัสใหม่ ผ่านระบบ UNECE โดยตรง</p>}
      <p className="mt-2 text-black/45">
        {t("In the meantime, use the code of the nearest listed town — an approximate but real code is more useful to a declarant than a blank field, and the coordinates below pin the exact location anyway.")}
      </p>
    </>
  );
}

/** One error line under a field. Renders nothing when there is no error, so
    call sites do not each need their own conditional. */
function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <span className="mt-1.5 block text-[11.5px] leading-relaxed text-[#dc2626]">{children}</span>;
}

/* ── Annex IV labels ────────────────────────────────────────────
   `annexTags` mode. The boxed number is the item of Annex IV to Implementing
   Regulation (EU) 2025/2547 the answer goes into, and the box is also the
   required / optional marker — see components/precursor/annex-fields.tsx.

   "—" is a field that is not an Annex IV item at all: the installation
   reference, which is Certrace's own key for the record (the CBAM Registry
   identifier is a different thing, and sits under the operator). It is still
   asked, and still marked required, so the reader can tell what blocks saving;
   it just has no regulation number to quote. Everything the form used to ask
   beyond the Annex items — the local-language name, the economic activity, the
   authorised representative, the email — went into no report, so it is no
   longer asked. */
type Annex = { tag: string; need: "required" | "optional" } | undefined;

/* A field is a grid item that is itself a two-row SUBGRID of the row it
   sits in: the label is one track, the control (with its hint or error under
   it) the other. That is what keeps the inputs level across a row when one
   label runs to three lines and its neighbour to one — without it each cell
   stacks on its own and the boxes step up and down. `gap-y-0` so the label sits
   6px above its own box and the grid's row gap only separates one field from the
   next. Always exactly two children, so no track is ever left empty. */
const CELL = "grid grid-rows-subgrid row-span-2 gap-y-0";

function TaggedLabel({ annex, label, children }: { annex: NonNullable<Annex>; label: string; children?: React.ReactNode }) {
  return (
    // The box stays beside the text however long the label runs.
    <span className="mb-1.5 flex items-start gap-2">
      <AnnexTag tag={annex.tag} need={annex.need} />
      <span className="min-w-0 text-[12.5px] leading-snug text-black/75">
        {label}
        {children && <span className="ml-1.5 inline-flex align-middle">{children}</span>}
      </span>
    </span>
  );
}

/** A labelled field: the Annex-tagged label when `annex` is given, the plain
    one otherwise — and in both, a cell that lines up with its row. */
function AField({ annex, label, optional, hint, children, id }: { annex?: Annex; label: string; optional?: boolean; hint?: string; children: React.ReactNode; id?: string }) {
  return (
    <label id={id} className={cn(CELL, "scroll-mt-44")}>
      {annex ? <TaggedLabel annex={annex} label={label} /> : <FieldLabel label={label} optional={optional} />}
      <div>
        {children}
        {hint && <span className="mt-1.5 block text-xs text-black/35">{hint}</span>}
      </div>
    </label>
  );
}

export function InstallationFields({
  value,
  onChange,
  showSelfToggle = false,
  existingId,
  disabled = false,
  lockReference = false,
  lockReferenceNote = "Set by the exporter and fixed for this site. Everything already sent about this plant is filed under it, so it cannot be changed from here — if it names the wrong plant, stop and tell the exporter rather than answering for the wrong site.",
  showAllErrors = false,
  annexTags = false,
  onReferenceBlur,
}: {
  value: Installation;
  onChange: (next: Installation) => void;
  showSelfToggle?: boolean;
  /* The reference this record already had, when editing. Passed so the
     uniqueness check does not report a site's own reference as taken —
     without it, opening an existing installation and pressing save would
     refuse. Absent in the create flow, which is exactly where the duplicate
     has to be caught. */
  existingId?: string;
  /** Every control read-only. Used by the supplier portal, which shows the
      record as settled until the reader asks to correct it. */
  disabled?: boolean;
  /* THE REFERENCE IS NOT THE SUPPLIER'S TO RE-KEY.

     It is the key of the record: the workspace, its twelve months, its
     shipments and every document the exporter has already sent all point at
     this id. `saveInstallation` upserts BY id, so a supplier who changed it
     would not rename the site — they would write a second, empty one and
     orphan the first. So in the supplier portal the field is shown, because
     the supplier has to be able to check they are answering for the right
     plant, and it is not editable. */
  lockReference?: boolean;
  /* The sentence printed under a locked reference. Defaults to the supplier
     portal's, because that is the screen the lock was built for — but the
     exporter's own Enter verified data locks it for a DIFFERENT reason (they
     set it; changing it here would orphan the record rather than rename it),
     and telling the exporter to "tell the exporter" is the kind of copy that
     makes a reader distrust the rest of the form. */
  lockReferenceNote?: React.ReactNode;
  /* Show every error immediately rather than waiting for the field to be
     touched. The right behaviour when a gate has just refused to let the
     reader past: "fill in what is required" and then a form with nothing
     marked is worse than no message at all. */
  showAllErrors?: boolean;
  /* Put the boxed Annex IV item number in front of every label, the box doubling
     as the required / optional marker (ink = required, white = optional) — the
     same system the precursor and operator fields use. Opt-in: the wizard, the
     supplier portal and Settings keep their plain labels. */
  annexTags?: boolean;
  /* The reference box lost focus. The installation page uses it to commit a
     CHANGED reference — the reference is the record's key, so it is moved once,
     when the reader has finished typing it, and never keystroke by keystroke. */
  onReferenceBlur?: () => void;
}) {
  const t = useT();
  const set = (p: Partial<Installation>) => onChange({ ...value, ...p });
  const a = (tag: string, need: "required" | "optional" = "required"): Annex => (annexTags ? { tag, need } : undefined);
  const coordError = coordinateError(value.lat, value.lng);
  /* Errors are shown only for fields the reader has actually reached — an
     untouched form covered in red teaches people to ignore red. `touched`
     fills in as they type, and `canSaveInstallation` still gates the button
     on the complete set regardless of what is displayed. */
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const errs = installationErrors(value, existingId);
  const err = (k: string) => (showAllErrors || touched[k] ? errs[k as keyof typeof errs] : undefined);
  const mark = (k: string) => () => setTouched((t) => (t[k] ? t : { ...t, [k]: true }));
  /* A locked reference cannot be wrong by the reader's hand, so it does not
     get a red box — see `lockReference`. */
  const refError = !lockReference && value.id.trim() ? referenceError(value.id, value.country, existingId) : null;

  return (
    <div className="space-y-5">
      {showSelfToggle && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/[0.08] bg-[#faf9f7] px-4 py-3">
          <input
            type="checkbox"
            checked={value.self}
            disabled={disabled}
            onChange={(e) => set({ self: e.target.checked })}
            className="mt-0.5 h-4 w-4 flex-none accent-[#111]"
          />
          <span className="min-w-0">
            <span className="block text-[13px] text-black/75">{t("This installation is us")}</span>
            <span className="mt-0.5 block text-[12px] leading-relaxed text-black/45">
              {t("Tick this when your own company produces the good. The monthly data then lands in your inbox instead of going out to a supplier.")}
            </span>
          </span>
        </label>
      )}

      {/* The name leads; the reference is Certrace's own key for the record and
          sits beside it, because that is what it identifies. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <LabelWithHelp
          id="ip-name"
          label={t("Name of the installation (English)")}
          annex={a("1(d)")}
          helpTitle={t("Which name goes here")}
          help={<p>{t("The English name of the producing site — the one your buyer’s declarant and the verifier will use.")}</p>}
        >
          <input
            className={cn(inputClass, err("name") && "border-[#dc2626]")}
            value={value.name}
            disabled={disabled}
            onBlur={mark("name")}
            onChange={(e) => set({ name: e.target.value })}
            placeholder={t("Thai Tin Plate Manufacturing Co., Ltd.")}
          />
          <FieldError>{err("name")}</FieldError>
        </LabelWithHelp>
        <LabelWithHelp
          label={t("Installation reference")}
          annex={a("—")}
          helpTitle={t("Installation reference")}
          help={
            <>
              <p>{t("The id the buyer, the declarant and the verifier all quote for this site.")}</p>
              <p className="mt-2">{t("Country code first, then letters, numbers and single hyphens — 5 to 32 characters. The country must match, because a mismatched prefix is nearly always a reference copied from another plant.")}</p>
              <p className="mt-2">
                <strong>{t("It has to be unique.")}</strong> {t("Two sites cannot share a reference: every product report, shipment and document points at this id, and a duplicate would attach one plant’s year of data to another. To change a site you have already added, open it from Settings → Installations rather than re-entering it here.")}
              </p>
            </>
          }
        >
          <input
            className={cn(inputClass, "font-mono", lockReference && "bg-black/[0.02] text-black/50", refError && "border-[#dc2626]")}
            value={value.id}
            readOnly={lockReference}
            disabled={disabled && !lockReference}
            onBlur={() => {
              mark("id")();
              onReferenceBlur?.();
            }}
            onChange={(e) => !lockReference && set({ id: normaliseReference(e.target.value) })}
            placeholder={t("TH-RAYONG-01")}
            aria-invalid={Boolean(refError)}
          />
          {lockReference ? (
            <span className="mt-1.5 block text-[11.5px] leading-relaxed text-black/40">{lockReferenceNote}</span>
          ) : (
            refError && <span className="mt-1.5 block text-[11.5px] leading-relaxed text-[#dc2626]">{refError}</span>
          )}
        </LabelWithHelp>
      </div>

      {/* The address, in template order. */}
      <div className="grid gap-4">
        <AField id="ip-address" annex={a("1(d)")} label={t("Street, number")}>
          <input
            className={cn(inputClass, err("street") && "border-[#dc2626]")}
            value={value.street}
            disabled={disabled}
            onBlur={mark("street")}
            onChange={(e) => set({ street: e.target.value })}
            placeholder={t("88 Moo 4, Map Ta Phut Industrial Estate")}
          />
          <FieldError>{err("street")}</FieldError>
        </AField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AField annex={a("1(d)")} label={t("Post code")}>
          <input
            className={cn(inputClass, err("postcode") && "border-[#dc2626]")}
            value={value.postcode}
            disabled={disabled}
            onBlur={mark("postcode")}
            onChange={(e) => set({ postcode: e.target.value })}
            placeholder="21150"
          />
          <FieldError>{err("postcode")}</FieldError>
        </AField>
        {/* Optional, and staying that way: most industrial sites do not have a
            P.O. Box, and requiring one would make the form unfillable for them. */}
        <AField annex={a("1(d)", "optional")} label={t("P.O. Box")} optional>
          <input className={inputClass} value={value.poBox} disabled={disabled} onChange={(e) => set({ poBox: e.target.value })} placeholder={t("P.O. Box 42")} />
        </AField>
        <AField annex={a("1(d)")} label={t("City")}>
          <input
            className={cn(inputClass, err("city") && "border-[#dc2626]")}
            value={value.city}
            disabled={disabled}
            onBlur={mark("city")}
            onChange={(e) => set({ city: e.target.value })}
            placeholder={t("Rayong")}
          />
          <FieldError>{err("city")}</FieldError>
        </AField>
        <AField annex={a("1(d)")} label={t("Country")}>
          <Select value={value.country} onChange={(v) => set({ country: v })} options={countryOptions} disabled={disabled} searchable ariaLabel={t("Country")} />
        </AField>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <LabelWithHelp id="ip-unlocode" label={t("UNLOCODE")} annex={a("1(d)")} helpTitle={t("UNLOCODE")} help={<UnlocodeHelp />}>
          <input
            className={cn(inputClass, "font-mono", err("unlocode") && "border-[#dc2626]")}
            value={value.unlocode}
            disabled={disabled}
            onBlur={mark("unlocode")}
            onChange={(e) => set({ unlocode: e.target.value.toUpperCase() })}
            placeholder={t("THMAT")}
          />
          <FieldError>{err("unlocode")}</FieldError>
        </LabelWithHelp>
        <LabelWithHelp
          id="ip-coords"
          label={t("Latitude — main emission source")}
          annex={a("1(d)")}
          helpTitle={t("Coordinates")}
          help={<p>{t("The main emission source, not the front gate — usually the stack of the furnace or kiln that dominates the figures. Decimal degrees, and both fields or neither.")}</p>}
        >
          <input
            className={cn(inputClass, "font-mono", coordError && "border-[#dc2626]")}
            value={value.lat}
            disabled={disabled}
            onBlur={mark("lat")}
            onChange={(e) => set({ lat: e.target.value })}
            placeholder="12.6810"
          />
          <FieldError>{err("lat")}</FieldError>
        </LabelWithHelp>
        <AField annex={a("1(d)")} label={t("Longitude — main emission source")}>
          <input
            className={cn(inputClass, "font-mono", (coordError || err("lng")) && "border-[#dc2626]")}
            value={value.lng}
            disabled={disabled}
            onBlur={mark("lng")}
            onChange={(e) => set({ lng: e.target.value })}
            placeholder="101.1590"
          />
          <FieldError>{err("lng")}</FieldError>
        </AField>
      </div>
      {coordError && <span className="-mt-2 block text-[11.5px] text-[#dc2626]">{coordError}</span>}
    </div>
  );
}

/** A field label with its help tip attached to the words it explains. */
function LabelWithHelp({
  label,
  help,
  helpTitle,
  children,
  optional,
  annex,
  id,
}: {
  id?: string;
  label: string;
  help: React.ReactNode;
  helpTitle?: string;
  children: React.ReactNode;
  /** The Annex IV box that replaces the "optional" marker — see `TaggedLabel`. */
  annex?: Annex;
  /* Marked on the label rather than left to be inferred from the absence of
     an error. A reader filling a long form needs to know what they can skip
     BEFORE they start, not after they try to submit. */
  optional?: boolean;
}) {
  return (
    <label id={id} className={cn(CELL, "scroll-mt-44")}>
      {/* Same label primitive as <Field>, so a field with a help tip and one
          without cannot drift into two different ways of saying "optional". */}
      {annex ? (
        <TaggedLabel annex={annex} label={label}>
          <HelpTip title={helpTitle}>{help}</HelpTip>
        </TaggedLabel>
      ) : (
        <FieldLabel label={label} optional={optional}>
          <HelpTip title={helpTitle}>{help}</HelpTip>
        </FieldLabel>
      )}
      <div>{children}</div>
    </label>
  );
}

/** Whether the form can be saved.

    Gated on the FULL required set now, not just name + reference. A site
    saved with no city and no coordinates is a site the declarant cannot file
    against, and the gap surfaces months later as a verifier question rather
    than here as a red field. `installationErrors` owns the list; this is a
    one-line read of it so the two can never disagree.

    `existingId` is the record being edited — see `InstallationFields`. */
export const canSaveInstallation = (i: Installation, existingId?: string): boolean =>
  Object.keys(installationErrors(i, existingId)).length === 0;

/** "Add a different installation" — a POPUP, deliberately. Adding a site is a
    detour from choosing one, and replacing the picker with a form loses the
    place the exporter was standing when they realised the site was missing.
    The dialog closes back onto the same picker with the new site selected. */
export function InstallationModal({
  open,
  onClose,
  onSaved,
  initial,
  title = "Add an installation",
  lead = "The producing site, entered once. These are the facts a verifier asks for, so they are not re-asked every year.",
  allowSelfToggle = true,
  supplierId,
  self,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (i: Installation) => void;
  initial?: Installation;
  title?: string;
  lead?: string;
  allowSelfToggle?: boolean;
  /** The supplier this plant belongs to. Set by the flows that already know —
      "add an installation" pressed on a supplier's own page has no business
      asking which supplier it is for. */
  supplierId?: string;
  /** Pre-mark the record as one of the exporter's own sites. */
  self?: boolean;
}) {
  const t = useT();
  const blank = React.useCallback(
    () => ({ ...emptyInstallation(self ?? false), supplierId: self ? "" : (supplierId ?? "") }),
    [self, supplierId],
  );
  const [draft, setDraft] = React.useState<Installation>(() => initial ?? blank());

  React.useEffect(() => {
    if (!open) return;
    // An `initial` record keeps its own ownership — reopening the dialog to
    // edit a plant must not silently reassign it to whichever supplier's page
    // it happens to be opened from.
    setDraft(initial ? { ...initial, supplierId: initial.self ? "" : initial.supplierId || (supplierId ?? "") } : blank());
  }, [open, initial, blank, supplierId]);

  /* The reference this record started with. In edit mode it is excluded from
     the uniqueness check; in create mode it is undefined, so a reference that
     already exists is refused instead of silently overwriting that site. */
  const existingId = initial?.id;

  /* THE DIALOG CONFIRMS ITSELF BEFORE IT LEAVES. Saving used to close the
     modal and drop a toast in the corner, which is the confirmation arriving
     somewhere else at the same instant the thing being confirmed disappears —
     so the reader looks up from an "Add an installation" button that has just
     stopped being a form and has to find the corner of the screen to learn
     whether it worked. Instead the button turns green and ticks, in place,
     and the dialog closes about three quarters of a second later, by which
     point the answer has already been read. `saving` also guards the second
     click during that window. */
  const [saved, setSaved] = React.useState(false);
  React.useEffect(() => {
    if (!open) setSaved(false);
  }, [open]);

  const save = () => {
    if (saved || !canSaveInstallation(draft, existingId)) return;
    const record = saveInstallation(draft);
    setSaved(true);
    window.setTimeout(() => {
      onSaved(record);
      onClose();
    }, 760);
  };

  return (
    <Modal open={open} onClose={onClose} eyebrow={t("Installation")} title={t(title)} lead={t(lead)} width="max-w-3xl"
      footer={
        <>
          <Button size="sm" variant="secondary" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button
            size="sm"
            disabled={!canSaveInstallation(draft, existingId)}
            onClick={save}
            className={cn("min-w-[10.5rem]", saved && "bg-[#047857] hover:bg-[#047857]")}
          >
            {saved && <Check size={13} strokeWidth={2} className="ct-confirm" />}
            {saved ? "Installation saved" : "Save installation"}
          </Button>
        </>
      }
    >
      {/* The same boxes as the installation page's Overview: the Annex IV item
          each answer goes into, black where it is required, white where it is
          optional. */}
      <AnnexLegend className="mb-5" showNeed showNoItem noVr />
      <InstallationFields value={draft} onChange={setDraft} showSelfToggle={allowSelfToggle} existingId={existingId} annexTags />
    </Modal>
  );
}
