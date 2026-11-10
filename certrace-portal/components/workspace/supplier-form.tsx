"use client";

/* ════════════════════════════════════════════════════════════
   THE SUPPLIER RECORD — one form, three places

   The new-workspace flow creates a supplier with it, the Suppliers page
   creates one with it, and a supplier's own page edits one with it.

   FOUR FIELDS, AND NO MORE. It is tempting to ask for the address here as
   well, but the address that matters in CBAM is the INSTALLATION's, not the
   company's — a verifier scopes to a plant, and the plant carries its own
   street, coordinates and authorised representative on the installation
   record. Asking twice produces two addresses that disagree, and the one on
   the letterhead is never the one with the furnace in it.

   So a supplier is: who they are, where they are registered, and the person
   the monthly link goes to. Everything else hangs off the installations
   underneath them.

   THE PHONE IS PICKED, NOT TYPED — see lib/dial-codes.ts for why a free-text
   telephone field produces four unusable spellings of one number.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Check } from "lucide-react";
import { Button, Field, HelpTip, Modal, inputClass, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { COUNTRIES } from "@/lib/config";
import {
  DIAL_CODES,
  MAX_SUBSCRIBER_DIGITS,
  MIN_SUBSCRIBER_DIGITS,
  dialCodeFor,
  isValidSubscriberNumber,
  joinPhone,
  splitPhone,
} from "@/lib/dial-codes";
import { useT } from "@/lib/i18n";
import { persistReportChange } from "@/lib/persist-report-change";
import {
  canSaveSupplier,
  emptySupplier,
  saveSupplierCompany,
  supplierEmailError,
  type SupplierCompany,
} from "@/lib/supplier-companies";

const countryOptions = COUNTRIES.map((c) => ({
  value: c.code,
  label: c.name,
  hint: c.code,
}));

/* Labelled by country so it is searchable by name — nobody remembers that
   Thailand is 66, and a menu of 198 bare numbers is a menu nobody can use. */
const dialOptions = (() => {
  const byCode = new Map<string, string[]>();
  for (const c of COUNTRIES) {
    const dial = DIAL_CODES[c.code];
    if (!dial) continue;
    byCode.set(dial, [...(byCode.get(dial) ?? []), c.name]);
  }
  return [...byCode.entries()]
    .map(([dial, names]) => ({
      value: dial,
      label: dial,
      hint:
        names.slice(0, 3).join(", ") +
        (names.length > 3 ? ` +${names.length - 3} more` : ""),
    }))
    .sort((a, b) => Number(a.value.slice(1)) - Number(b.value.slice(1)));
})();

/** Exported because the precursor row now carries the same three contact
    facts (see PrecursorSupplier's own note), and its editor must not spell
    the telephone differently — a free-text second copy is exactly the four
    unusable spellings lib/dial-codes.ts exists to prevent. */
export function SupplierPhoneField({
  value,
  country,
  onChange,
}: {
  value: string;
  country: string;
  onChange: (v: string) => void;
}) {
  const t = useT();
  const parsed = splitPhone(value, country);
  /* The picker guarantees the "+66". Nothing used to check the rest, so
     "12", "n/a" and "call the office" all saved happily and only failed
     weeks later, in somebody else's hands, when the number was dialled.
     lib/dial-codes.ts has always known the rule (digits only, 6–14 of them);
     this is the field finally SAYING it, at the moment it is typed rather
     than at the moment it is needed. */
  const [dial, setDial] = React.useState(parsed.dial);
  const [number, setNumber] = React.useState(parsed.number);

  // Follow the supplier's country until the operator overrides the code — a
  // Thai mill whose export manager is on a Singapore mobile is real, so this
  // is a default, not a lock.
  const touched = React.useRef(false);
  React.useEffect(() => {
    if (touched.current) return;
    const next = dialCodeFor(country);
    if (next && !number) setDial(next);
  }, [country, number]);

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

  // Only once something has been typed — an empty box is not yet a mistake,
  // and marking it red on arrival is how a form teaches people to ignore red.
  const invalid = number.trim() !== "" && !isValidSubscriberNumber(number);
  const digits = number.replace(/\D/g, "").length;

  return (
    <div>
      <div className="flex gap-2">
        <div className="w-[124px] flex-none">
          <Select
            value={dial}
            onChange={(v) => {
              touched.current = true;
              push(v, number);
            }}
            options={dialOptions}
            searchable
            searchPlaceholder={t("Country or code…")}
            ariaLabel={t("Country calling code")}
          />
        </div>
        <input
          className={cn(
            inputClass,
            "min-w-0 flex-1",
            invalid && "border-[#dc2626]",
          )}
          value={number}
          inputMode="tel"
          onChange={(e) => push(dial, e.target.value)}
          placeholder="38 123 456"
          aria-label={t("Telephone number")}
          aria-invalid={invalid}
        />
      </div>
      {invalid && (
        <span className="mt-1.5 block text-[11.5px] text-[#dc2626]">
          {/^[\d\s().-]+$/.test(number.trim())
            ? `A telephone number is ${MIN_SUBSCRIBER_DIGITS}–${MAX_SUBSCRIBER_DIGITS} digits after the country code — this has ${digits}.`
            : "Digits only after the country code — spaces, brackets and dashes are fine, letters are not."}
        </span>
      )}
    </div>
  );
}

export function SupplierFields({
  value,
  onChange,
}: {
  value: SupplierCompany;
  onChange: (next: SupplierCompany) => void;
}) {
  const t = useT();
  const set = (p: Partial<SupplierCompany>) => onChange({ ...value, ...p });
  const emailError = value.contactEmail.trim()
    ? supplierEmailError(value.contactEmail)
    : null;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <LabelWithHelp
          label={t("Supplier name")}
          helpTitle={t("Which name goes here")}
          help={
            <p>
              {t(
                "The company you buy from and chase, as it appears on their invoices. Their individual plants are added underneath — one supplier can run several.",
              )}
            </p>
          }
        >
          <input
            className={inputClass}
            value={value.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder={t("G J Steel Public Company Limited")}
          />
        </LabelWithHelp>
        <Field
          label={t("Country")}
          hint={t("Where the company is registered.")}
        >
          <Select
            value={value.country}
            onChange={(v) => set({ country: v })}
            options={countryOptions}
            searchable
            ariaLabel={t("Country")}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LabelWithHelp
          label={t("Contact person")}
          helpTitle={t("Who this is")}
          help={
            <p>
              {t(
                "The named person who fills the monthly data in. A verifier asks who answered for the figures, and a department is not an answer.",
              )}
            </p>
          }
        >
          <input
            className={inputClass}
            value={value.contactName}
            onChange={(e) => set({ contactName: e.target.value })}
            placeholder={t("Somchai Prasert")}
          />
        </LabelWithHelp>
        {/* Not a <Field>: that wraps its children in a <label>, and a label
            holding two controls forwards every click to the first one — so
            tapping the number box would open the dialling-code menu. */}
        <div>
          <span className="mb-2 block text-[11px] uppercase tracking-[0.1em] text-black/55">
            {t("Telephone")}
          </span>
          <SupplierPhoneField
            value={value.contactPhone}
            country={value.country}
            onChange={(v) => set({ contactPhone: v })}
          />
        </div>
      </div>

      <div>
        <LabelWithHelp
          label={t("Email")}
          helpTitle={t("Where each month goes")}
          help={
            <p>
              {t(
                "This is the address the monthly link is sent to. It is the one field here that stops the whole arrangement working if it is wrong.",
              )}
            </p>
          }
        >
          <input
            className={cn(inputClass, emailError && "border-[#dc2626]")}
            type="email"
            value={value.contactEmail}
            onChange={(e) => set({ contactEmail: e.target.value })}
            placeholder={t("somchai@gjsteel.co.th")}
            aria-invalid={Boolean(emailError)}
          />
        </LabelWithHelp>
        {emailError && (
          <span className="mt-1.5 block text-[11.5px] text-[#dc2626]">
            {emailError}
          </span>
        )}
      </div>
    </div>
  );
}

function LabelWithHelp({
  label,
  help,
  helpTitle,
  children,
}: {
  label: string;
  help: React.ReactNode;
  helpTitle?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/55">
        {label}
        <HelpTip title={helpTitle}>{help}</HelpTip>
      </span>
      {children}
    </label>
  );
}

/** "Create a supplier" — a POPUP, deliberately. Adding a company is a detour
    from choosing one, and replacing the picker with a form loses the place the
    exporter was standing when they realised the supplier was missing. The
    dialog closes back onto the same picker with the new supplier selected. */
export function SupplierModal({
  open,
  onClose,
  onSaved,
  initial,
  title,
  lead = "The company behind the plant. Their installations are added next — one supplier can run several.",
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (s: SupplierCompany) => void;
  initial?: SupplierCompany | null;
  title?: string;
  lead?: string;
}) {
  const t = useT();
  const [draft, setDraft] = React.useState<SupplierCompany>(
    initial ?? emptySupplier(),
  );

  React.useEffect(() => {
    if (open) setDraft(initial ?? emptySupplier());
  }, [open, initial]);

  /* Confirmed on the button, then closed — the same shape as the installation
     dialog next to it. See the note on its `save`. */
  const [saved, setSaved] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!open) {
      setSaved(false);
      setError(null);
    }
  }, [open]);

  const save = async () => {
    if (saving || saved || !canSaveSupplier(draft)) return;
    setSaving(true);
    setError(null);
    try {
      const record = await persistReportChange(() =>
        saveSupplierCompany(draft),
      );
      setSaved(true);
      window.setTimeout(() => {
        onSaved(record);
        onClose();
      }, 760);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSaving(false);
    }
  };
  const close = () => {
    if (!saving && !saved) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      eyebrow={t("Supplier")}
      title={title ?? (initial ? "Edit supplier" : "Add a supplier")}
      lead={t(lead)}
      width="max-w-2xl"
      footer={
        <>
          <Button
            size="sm"
            variant="secondary"
            disabled={saving || saved}
            onClick={close}
          >
            {t("Cancel")}
          </Button>
          <Button
            size="sm"
            disabled={saving || saved || !canSaveSupplier(draft)}
            onClick={save}
            className={cn(
              "min-w-[9.5rem]",
              saved && "bg-[#047857] hover:bg-[#047857]",
            )}
          >
            {saved && (
              <Check size={13} strokeWidth={2} className="ct-confirm" />
            )}
            {saving
              ? t("Saving…")
              : saved
                ? initial
                  ? "Supplier saved"
                  : "Supplier added"
                : initial
                  ? "Save supplier"
                  : "Add supplier"}
          </Button>
        </>
      }
    >
      {error && (
        <p role="alert" className="mb-4 text-sm text-[#dc2626]">
          {error}
        </p>
      )}
      <fieldset disabled={saving || saved}>
        <SupplierFields value={draft} onChange={setDraft} />
      </fieldset>
    </Modal>
  );
}
