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
import { Check, Plus, Trash2 } from "lucide-react";
import { Button, Field, FieldLabel, HelpTip, Modal, inputClass, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { COUNTRIES } from "@/lib/config";
import { DIAL_CODES, dialCodeFor, joinPhone, splitPhone } from "@/lib/dial-codes";
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

/* The dialling-code list. Labelled by country so it is searchable by name —
   nobody remembers that Thailand is 66, and a menu of 198 bare numbers is a
   menu nobody can use. Deduplicated by code, so the +1 plan appears once. */
const dialOptions = (() => {
  const byCode = new Map<string, string[]>();
  for (const c of COUNTRIES) {
    const dial = DIAL_CODES[c.code];
    if (!dial) continue;
    byCode.set(dial, [...(byCode.get(dial) ?? []), c.name]);
  }
  return [...byCode.entries()]
    .map(([dial, names]) => ({ value: dial, label: dial, hint: names.slice(0, 3).join(", ") + (names.length > 3 ? ` +${names.length - 3} more` : "") }))
    .sort((a, b) => Number(a.value.slice(1)) - Number(b.value.slice(1)));
})();

/* ── Telephone ────────────────────────────────────────────────
   Country code picked, subscriber number typed. See lib/dial-codes.ts for why
   a free-text phone field produces four unusable spellings of one number. */
function PhoneField({ value, country, onChange, disabled }: { value: string; country: string; onChange: (v: string) => void; disabled?: boolean }) {
  const t = useT();
  const parsed = splitPhone(value, country);
  const [dial, setDial] = React.useState(parsed.dial);
  const [number, setNumber] = React.useState(parsed.number);

  // Follow the installation's country until the operator overrides the code —
  // a Thai site whose contact is on a Singapore mobile is real, so this is a
  // default, not a lock.
  const touched = React.useRef(false);
  React.useEffect(() => {
    if (touched.current) return;
    const next = dialCodeFor(country);
    if (next && !number) setDial(next);
  }, [country, number]);

  // Re-sync when the record is replaced under us (modal reopened on another
  // installation), never on our own keystrokes.
  React.useEffect(() => {
    const fresh = splitPhone(value, country);
    if (joinPhone(dial, number) !== value) {
      setDial(fresh.dial);
      setNumber(fresh.number);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const push = (d: string, n: string) => {
    setDial(d);
    setNumber(n);
    onChange(joinPhone(d, n));
  };

  return (
    <div className="flex gap-2">
      <div className="w-[124px] flex-none">
        <Select
          value={dial}
          onChange={(v) => {
            touched.current = true;
            push(v, number);
          }}
          options={dialOptions}
          disabled={disabled}
          searchable
          searchPlaceholder={t("Country or code…")}
          ariaLabel={t("Country calling code")}
        />
      </div>
      <input
        className={cn(inputClass, "min-w-0 flex-1")}
        value={number}
        inputMode="tel"
        disabled={disabled}
        onChange={(e) => push(dial, e.target.value)}
        placeholder="38 123 456"
        aria-label={t("Telephone number")}
      />
    </div>
  );
}

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

export function InstallationFields({
  value,
  onChange,
  showSelfToggle = false,
  existingId,
  disabled = false,
  lockReference = false,
  lockReferenceNote = "Set by the exporter and fixed for this site. Everything already sent about this plant is filed under it, so it cannot be changed from here — if it names the wrong plant, stop and tell the exporter rather than answering for the wrong site.",
  showAllErrors = false,
  requireEmail = false,
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
  /* Ask for the contact email, and refuse to save without it. Set by the
     new-workspace flow — see `installationErrors` for why registering a site
     and setting up a standing monthly ask are different asks. */
  requireEmail?: boolean;
}) {
  const t = useT();
  const set = (p: Partial<Installation>) => onChange({ ...value, ...p });
  const coordError = coordinateError(value.lat, value.lng);
  /* Errors are shown only for fields the reader has actually reached — an
     untouched form covered in red teaches people to ignore red. `touched`
     fills in as they type, and `canSaveInstallation` still gates the button
     on the complete set regardless of what is displayed. */
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const errs = installationErrors(value, existingId, requireEmail);
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

      {/* ii — the required one, so it leads. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <LabelWithHelp
          label={t("Name of the installation (English)")}
          helpTitle={t("Which name goes here")}
          help={<p>{t("The English name of the producing site — the one your buyer’s declarant and the verifier will use. A Thai name goes in the optional field beside it.")}</p>}
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
        <Field label={t("Name of the installation")} optional hint={t("The local-language name. Field (i) of the EU template.")}>
          <input
            className={inputClass}
            value={value.nameLocal}
            disabled={disabled}
            onChange={(e) => set({ nameLocal: e.target.value })}
            placeholder="บริษัท ไทย ทินเพลท จำกัด"
          />
        </Field>
      </div>

      {/* Not a template field — Certrace's own key for the record. It sits with
          the names because that is what it identifies. */}
      <div>
        <LabelWithHelp
          label={t("Installation reference")}
          helpTitle={t("Installation reference")}
          help={
            <>
              <p>{t("The id the buyer, the declarant and the verifier all quote for this site.")}</p>
              <p className="mt-2">{t("Country code first, then letters, numbers and single hyphens — 5 to 32 characters. The country must match, because a mismatched prefix is nearly always a reference copied from another plant.")}</p>
              <p className="mt-2">
                <strong>{t("It has to be unique.")}</strong> {t("Two sites cannot share a reference: every workspace, shipment and document points at this id, and a duplicate would attach one plant’s year of data to another. To change a site you have already added, open it from Settings → Installations rather than re-entering it here.")}
              </p>
            </>
          }
        >
          <input
            className={cn(inputClass, "font-mono", lockReference && "bg-black/[0.02] text-black/50", refError && "border-[#dc2626]")}
            value={value.id}
            readOnly={lockReference}
            disabled={disabled && !lockReference}
            onBlur={mark("id")}
            onChange={(e) => !lockReference && set({ id: normaliseReference(e.target.value) })}
            placeholder={t("TH-RAYONG-01")}
            aria-invalid={Boolean(refError)}
          />
        </LabelWithHelp>
        {lockReference ? (
          <span className="mt-1.5 block text-[11.5px] leading-relaxed text-black/40">{lockReferenceNote}</span>
        ) : (
          refError && <span className="mt-1.5 block text-[11.5px] text-[#dc2626]">{refError}</span>
        )}
      </div>

      {/* iii–viii — the address block, in template order. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("Street, number")}>
          <input
            className={cn(inputClass, err("street") && "border-[#dc2626]")}
            value={value.street}
            disabled={disabled}
            onBlur={mark("street")}
            onChange={(e) => set({ street: e.target.value })}
            placeholder={t("88 Moo 4, Map Ta Phut Industrial Estate")}
          />
          <FieldError>{err("street")}</FieldError>
        </Field>
        <LabelWithHelp
          label={t("Economic activity")}
          optional
          helpTitle={t("Economic activity")}
          help={
            <>
              <p>{t("What this site actually does, not the company’s line of business. A verifier reads it against the MMD boundary, so “manufacture of steel” is too broad.")}</p>
              <p className="mt-2 text-black/45">{t("It helps a verifier orient themselves, but nothing downstream depends on it.")}</p>
            </>
          }
        >
          <input
            className={inputClass}
            value={value.economicActivity}
            disabled={disabled}
            onChange={(e) => set({ economicActivity: e.target.value })}
            placeholder={t("Hot rolling of purchased billet into reinforcing bar")}
          />
        </LabelWithHelp>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t("Post code")}>
          <input
            className={cn(inputClass, err("postcode") && "border-[#dc2626]")}
            value={value.postcode}
            disabled={disabled}
            onBlur={mark("postcode")}
            onChange={(e) => set({ postcode: e.target.value })}
            placeholder="21150"
          />
          <FieldError>{err("postcode")}</FieldError>
        </Field>
        {/* Optional, and staying that way: most industrial sites do not have a
            P.O. Box, and requiring one would make the form unfillable for them. */}
        <Field label={t("P.O. Box")} optional>
          <input className={inputClass} value={value.poBox} disabled={disabled} onChange={(e) => set({ poBox: e.target.value })} placeholder={t("P.O. Box 42")} />
        </Field>
        <Field label={t("City")}>
          <input
            className={cn(inputClass, err("city") && "border-[#dc2626]")}
            value={value.city}
            disabled={disabled}
            onBlur={mark("city")}
            onChange={(e) => set({ city: e.target.value })}
            placeholder={t("Rayong")}
          />
          <FieldError>{err("city")}</FieldError>
        </Field>
        <Field label={t("Country")}>
          <Select value={value.country} onChange={(v) => set({ country: v })} options={countryOptions} disabled={disabled} searchable ariaLabel={t("Country")} />
        </Field>
      </div>

      {/* ix–xi */}
      <div className="grid gap-4 sm:grid-cols-3">
        <LabelWithHelp label={t("UNLOCODE")} helpTitle={t("UNLOCODE")} help={<UnlocodeHelp />}>
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
          label={t("Latitude — main emission source")}
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
        <Field label={t("Longitude — main emission source")}>
          <input
            className={cn(inputClass, "font-mono", (coordError || err("lng")) && "border-[#dc2626]")}
            value={value.lng}
            disabled={disabled}
            onBlur={mark("lng")}
            onChange={(e) => set({ lng: e.target.value })}
            placeholder="101.1590"
          />
          <FieldError>{err("lng")}</FieldError>
        </Field>
      </div>
      {coordError && <span className="-mt-2 block text-[11.5px] text-[#dc2626]">{coordError}</span>}

      {/* xii–xiv */}
      <div className="grid gap-4 sm:grid-cols-3">
        <LabelWithHelp
          label={t("Name of authorised representative")}
          optional
          helpTitle={t("Authorised representative")}
          help={
            <>
              <p>{t("The named person who can answer for these figures. A verifier will ask who signed the data off, and a department is not an answer.")}</p>
              <p className="mt-2 text-black/45">{t("You can nominate the representative later without holding up the site record, but it is worth filling in before verification.")}</p>
            </>
          }
        >
          <input
            className={inputClass}
            value={value.contactName}
            disabled={disabled}
            onChange={(e) => set({ contactName: e.target.value })}
            placeholder={t("Somchai Prasert")}
          />
        </LabelWithHelp>
        {/* NO EXPLANATORY HINT. "Where this site's monthly link and every data
            request are sent" is true, and it is also what an email address on
            an installation record obviously is — a line under the box telling
            a reader what email is for is a line they read once and skip
            forever after. The absence of the "optional" marker is the whole
            message: it is required, and the error underneath says so if it is
            left empty. */}
        <Field label={t("Email")} optional={!requireEmail}>
          <input
            className={cn(inputClass, err("contactEmail") && "border-[#dc2626]")}
            type="email"
            value={value.contactEmail}
            disabled={disabled}
            onBlur={mark("contactEmail")}
            onChange={(e) => set({ contactEmail: e.target.value })}
            placeholder={t("somchai@thaitinplate.co.th")}
            aria-invalid={Boolean(err("contactEmail"))}
          />
          <FieldError>{err("contactEmail")}</FieldError>
        </Field>
        {/* Not a <Field>: that wraps its children in a <label>, and a label
            holding two controls forwards every click to the first one — so
            tapping the number box would open the dialling-code menu. The label
            is built from the same pieces so the marker sits where it does on
            every other field. */}
        <div>
          <FieldLabel label={t("Telephone")} optional />
          <PhoneField value={value.contactPhone} country={value.country} disabled={disabled} onChange={(v) => set({ contactPhone: v })} />
        </div>
      </div>

      {/* Not a template field. Lets a verifier confirm the reported boundary
          covers only the CBAM good and nothing else this site makes. */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <FieldLabel label={t("Other goods produced at this installation")} optional>
            <HelpTip title={t("Other goods produced at this installation")}>
              <p>
                {t("If this site also makes products outside CBAM scope, list them so a verifier can confirm the boundary in this report covers only the CBAM good and nothing from another line.")}
              </p>
            </HelpTip>
          </FieldLabel>
          {!disabled && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => set({ otherGoods: [...value.otherGoods, { name: "", description: "" }] })}
            >
              <Plus size={12} strokeWidth={1.5} /> {t("Add a good")}
            </Button>
          )}
        </div>
        {value.otherGoods.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/[0.12] bg-[#faf9f7] px-4 py-3 text-[12px] leading-relaxed text-black/45">
            {t("None declared. If this site also makes products outside CBAM scope, list them here — a verifier reads this to confirm the boundary above covers only the CBAM good.")}
          </div>
        ) : (
          <div className="space-y-2">
            {value.otherGoods.map((g, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl border border-black/[0.07] bg-[#faf9f7] p-3">
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                  <input
                    className={inputClass}
                    value={g.name}
                    disabled={disabled}
                    onChange={(e) =>
                      set({ otherGoods: value.otherGoods.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })
                    }
                    placeholder={t("PVC pipe fittings")}
                  />
                  <input
                    className={inputClass}
                    value={g.description ?? ""}
                    disabled={disabled}
                    onChange={(e) =>
                      set({ otherGoods: value.otherGoods.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)) })
                    }
                    placeholder={t("Separate extrusion line, not part of the steel process (optional)")}
                  />
                </div>
                {!disabled && (
                  <button
                    type="button"
                    aria-label={t("Remove")}
                    onClick={() => set({ otherGoods: value.otherGoods.filter((_, j) => j !== i) })}
                    className="flex-none rounded-lg p-2 text-black/35 hover:bg-black/[0.05] hover:text-black/60"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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
}: {
  label: string;
  help: React.ReactNode;
  helpTitle?: string;
  children: React.ReactNode;
  /* Marked on the label rather than left to be inferred from the absence of
     an error. A reader filling a long form needs to know what they can skip
     BEFORE they start, not after they try to submit. */
  optional?: boolean;
}) {
  return (
    <label className="block">
      {/* Same label primitive as <Field>, so a field with a help tip and one
          without cannot drift into two different ways of saying "optional". */}
      <FieldLabel label={label} optional={optional}>
        <HelpTip title={helpTitle}>{help}</HelpTip>
      </FieldLabel>
      {children}
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
export const canSaveInstallation = (i: Installation, existingId?: string, requireEmail = false): boolean =>
  Object.keys(installationErrors(i, existingId, requireEmail)).length === 0;

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
  requireEmail = false,
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
  /** Refuse to save without a contact email — see `InstallationFields`. */
  requireEmail?: boolean;
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
    if (saved || !canSaveInstallation(draft, existingId, requireEmail)) return;
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
            disabled={!canSaveInstallation(draft, existingId, requireEmail)}
            onClick={save}
            className={cn("min-w-[10.5rem]", saved && "bg-[#047857] hover:bg-[#047857]")}
          >
            {saved && <Check size={13} strokeWidth={2} className="ct-confirm" />}
            {saved ? "Installation saved" : "Save installation"}
          </Button>
        </>
      }
    >
      <InstallationFields value={draft} onChange={setDraft} showSelfToggle={allowSelfToggle} existingId={existingId} requireEmail={requireEmail} />
    </Modal>
  );
}
