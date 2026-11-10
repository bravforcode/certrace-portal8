"use client";

/* ════════════════════════════════════════════════════════════
   THE BUYER RECORD — the EU importer a consignment goes to

   Four fields, and the EORI is the one that earns the popup. See
   lib/buyers.ts for why a buyer typed per shipment row produces three
   companies where there is one, each with an understated total.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Button, Field, HelpTip, Modal, inputClass, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { toast } from "@/components/toast";
import { COUNTRIES } from "@/lib/config";
import {
  buyerEoriError,
  canSaveBuyer,
  emptyBuyer,
  saveBuyer,
  type Buyer,
} from "@/lib/buyers";
import { EORI_HELP } from "@/lib/shipments";
import { useT } from "@/lib/i18n";

const countryOptions = COUNTRIES.map((c) => ({
  value: c.code,
  label: c.name,
  hint: c.code,
}));

export function BuyerFields({
  value,
  onChange,
}: {
  value: Buyer;
  onChange: (next: Buyer) => void;
}) {
  const t = useT();
  const set = (p: Partial<Buyer>) => onChange({ ...value, ...p });
  const eoriError = buyerEoriError(value.eori);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("Buyer name")}
          hint={t("The EU importer, as it appears on your invoice.")}
        >
          <input
            className={inputClass}
            value={value.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder={t("Rotterdam Steel Import BV")}
          />
        </Field>
        <Field
          label={t("Country")}
          hint={t("Where the importer is established.")}
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

      <div>
        <label className="block">
          <span className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/55">
            {t("EORI")}
            <HelpTip title={t("EORI")}>
              <p>{EORI_HELP}</p>
              <p className="mt-2">
                {t(
                  "Recorded here rather than on each shipment so it is typed once and is identical on every consignment — which is what lets their declarant reconcile what they received.",
                )}
              </p>
            </HelpTip>
          </span>
          <input
            className={cn(
              inputClass,
              "font-mono",
              eoriError && "border-[#dc2626]",
            )}
            value={value.eori}
            onChange={(e) => set({ eori: e.target.value.toUpperCase() })}
            placeholder={t("NL812345678")}
            aria-invalid={Boolean(eoriError)}
          />
        </label>
        {eoriError ? (
          <span className="mt-1.5 block text-[11.5px] text-[#dc2626]">
            {eoriError}
          </span>
        ) : (
          <span className="mt-1.5 block text-[11.5px] text-black/40">
            {t(
              "You can leave this until the importer sends it — the shipment still logs, and the buyer total still builds.",
            )}
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("Contact person")}
          optional
          hint={t("Who to ask about a consignment.")}
        >
          <input
            className={inputClass}
            value={value.contactName}
            onChange={(e) => set({ contactName: e.target.value })}
            placeholder={t("Jan de Vries")}
          />
        </Field>
        <Field label={t("Email")} optional>
          <input
            className={inputClass}
            type="email"
            value={value.contactEmail}
            onChange={(e) => set({ contactEmail: e.target.value })}
            placeholder={t("jan@rotterdamsteel.nl")}
          />
        </Field>
      </div>
    </div>
  );
}

export function BuyerModal({
  open,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (b: Buyer) => void;
  initial?: Buyer | null;
}) {
  const t = useT();
  const [draft, setDraft] = React.useState<Buyer>(initial ?? emptyBuyer());

  React.useEffect(() => {
    if (open) setDraft(initial ?? emptyBuyer());
  }, [open, initial]);

  const save = () => {
    if (!canSaveBuyer(draft)) return;
    const saved = saveBuyer(draft);
    toast({
      message: initial ? "Buyer updated" : "Buyer added",
      detail: saved.eori ? `${saved.name} · ${saved.eori}` : saved.name,
      tone: "ok",
    });
    onSaved(saved);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={t("Buyer")}
      title={initial ? "Edit buyer" : "Add a buyer"}
      lead={t(
        "The EU importer this consignment is going to. Recorded once, then picked on every shipment to them.",
      )}
      width="max-w-2xl"
      footer={
        <>
          <Button size="sm" variant="secondary" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button size="sm" disabled={!canSaveBuyer(draft)} onClick={save}>
            {initial ? "Save buyer" : "Add buyer"}
          </Button>
        </>
      }
    >
      <BuyerFields value={draft} onChange={setDraft} />
    </Modal>
  );
}
