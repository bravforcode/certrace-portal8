"use client";

/* ── Telephone: the code is picked, the number is typed ─────────
   The same rule the supplier and installation forms follow — see
   lib/dial-codes.ts for why a single free-text field produces four unusable
   spellings of one number ("038 123456", "+66 38 123 456", "0066…").

   Lifted out of components/workspace/supplier-form.tsx so /onboarding can ask
   for a contact number without importing a supplier form, and so the two
   places cannot drift apart. The value is stored JOINED ("+66 38 123 456"),
   because that is the one string every downstream document wants. */

import * as React from "react";
import { Select } from "./controls";
import { inputClass, cn } from "./ui";
import { COUNTRIES } from "@/lib/config";
import {
  DIAL_CODES,
  dialCodeFor,
  joinPhone,
  splitPhone,
} from "@/lib/dial-codes";
import { useT } from "@/lib/i18n";

/* Labelled by country so it is searchable by name — nobody remembers that
   Thailand is 66, and a menu of 198 bare numbers is a menu nobody can use. */
export const dialOptions = (() => {
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

export function PhoneField({
  value,
  onChange,
  country = "TH",
  invalid,
  placeholder = "38 123 456",
  searchPlaceholder = "Country or code…",
  dialLabel = "Country calling code",
  numberLabel = "Telephone number",
}: {
  value: string;
  onChange: (v: string) => void;
  /** Seeds the dial code until the person overrides it. */
  country?: string;
  invalid?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  dialLabel?: string;
  numberLabel?: string;
}) {
  const t = useT();
  const parsed = splitPhone(value, country);
  const [dial, setDial] = React.useState(parsed.dial);
  const [number, setNumber] = React.useState(parsed.number);

  // Follow the country until the operator overrides the code — a Thai company
  // whose export manager is on a Singapore mobile is real, so this is a
  // default, not a lock.
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
          searchable
          searchPlaceholder={t(searchPlaceholder)}
          ariaLabel={dialLabel}
        />
      </div>
      <input
        className={cn(
          inputClass,
          "min-w-0 flex-1",
          invalid && "border-[#f87171]/60 focus:border-[#f87171]",
        )}
        value={number}
        inputMode="tel"
        onChange={(e) => push(dial, e.target.value)}
        placeholder={placeholder}
        aria-label={numberLabel}
      />
    </div>
  );
}
