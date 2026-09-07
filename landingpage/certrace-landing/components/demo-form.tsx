"use client";

import { useState } from "react";
import { CONTACT_EMAIL } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import { leadLocaleFields, postToSheet } from "@/lib/sheet-sync";
import { type Booking, DemoBookingModal } from "./demo-booking";
import {
  DEFAULT_LEN,
  DIAL_CODES,
  EMAIL_RE,
  FieldError,
  PERSONAL_EMAIL_DOMAINS,
  SelectChevron,
  cleanNationalDigits,
  inputBad,
  inputBase,
  inputOk,
  labelClass,
} from "./form-fields";

const EMPLOYEE_RANGES = [
  "1-9",
  "10-49",
  "50-99",
  "100-249",
  "250-499",
  "500-999",
  "1000-4999",
  "5000-9999",
  "10k+",
];


type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  dialIso: string;
  phone: string;
  company: string;
  jobTitle: string;
  sector: string;
  employees: string;
};

type FieldKey = Exclude<keyof FormState, "dialIso">;

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  dialIso: "TH",
  phone: "",
  company: "",
  jobTitle: "",
  sector: "",
  employees: "",
};

export function DemoForm() {
  const { c } = useLang();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  /* A field shows its error once the user has left it, or once they've tried
     to submit — never while they're still typing their first character. */
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  /* Submitting the form opens the booking dialog rather than ending the flow —
     the contact details are step 0 of picking a slot, not the whole request. */
  const [bookingOpen, setBookingOpen] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const blur = (field: FieldKey) => () =>
    setTouched((t) => ({ ...t, [field]: true }));

  const country =
    DIAL_CODES.find((entry) => entry.iso === form.dialIso) ?? DIAL_CODES[0];

  /* The lead as the sheet names it. Built once and handed to both the
     demo_lead post and the booking dialog, so the two records describe the
     same person with the same keys instead of two hand-copied field lists.
     Dial code stays its own column — glued onto the number it is neither
     searchable nor dialable. */
  const leadFields = {
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    countryCode: country.dial,
    phone: form.phone,
    company: form.company,
    jobTitle: form.jobTitle,
    sector: form.sector,
    employees: form.employees,
  };

  const errors: Partial<Record<FieldKey, string>> = {};

  if (!form.firstName.trim()) errors.firstName = c.form.errors.required;
  if (!form.lastName.trim()) errors.lastName = c.form.errors.required;
  if (!form.company.trim()) errors.company = c.form.errors.required;
  if (!form.jobTitle) errors.jobTitle = c.form.errors.required;
  if (!form.sector) errors.sector = c.form.errors.required;
  if (!form.employees) errors.employees = c.form.errors.required;

  const email = form.email.trim().toLowerCase();
  if (!email) {
    errors.email = c.form.errors.required;
  } else if (!EMAIL_RE.test(email)) {
    errors.email = c.form.errors.emailFormat;
  } else if (PERSONAL_EMAIL_DOMAINS.has(email.slice(email.lastIndexOf("@") + 1))) {
    errors.email = c.form.errors.emailPersonal;
  }

  const [minLen, maxLen] = country.len ?? DEFAULT_LEN;
  const digits = cleanNationalDigits(form.phone, country.dial, maxLen);
  if (!digits) {
    errors.phone = c.form.errors.phoneDigits;
  } else if (digits.length < minLen || digits.length > maxLen) {
    errors.phone = c.form.errors.phoneLength;
  }

  const isValid = Object.keys(errors).length === 0;

  const errorFor = (field: FieldKey) =>
    touched[field] || submitAttempted ? errors[field] : undefined;

  /* Confirmed state replaces the form only once a slot is actually chosen.
     Closing the dialog early leaves the form (and its values) intact so the
     user can pick up where they left off. */
  if (booking && !bookingOpen) {
    return (
      <div
        className="w-full text-left p-7 rounded-2xl border border-black/[0.08] bg-white"
        style={{ animation: "fadeInUp 0.4s var(--ease-signature) both" }}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="font-pixel text-[10px] tracking-[0.2em] text-emerald-700">
            {c.form.confirmed.badge}
          </span>
        </div>
        <div className="mt-4 text-2xl font-light tracking-tight leading-tight">
          {booking.date.toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
          <br />
          {booking.time}
        </div>
        <p className="mt-4 text-xs text-black/45 leading-relaxed">
          {c.form.confirmed.detail} · {booking.timeZoneLabel}.{" "}
          {c.form.confirmed.inviteTo}{" "}
          <span className="text-black/70 break-all">{form.email}</span>.
        </p>
        <p className="mt-4 text-[11px] text-black/30 leading-relaxed">
          {c.form.confirmed.reschedule} {CONTACT_EMAIL}.
        </p>
      </div>
    );
  }

  const textFields: {
    id: string;
    key: Extract<FieldKey, "firstName" | "lastName" | "email" | "company">;
    label: string;
    placeholder: string;
    type: string;
    autoComplete: string;
  }[] = [
    {
      id: "demo-first-name",
      key: "firstName",
      label: c.form.firstName,
      placeholder: c.form.firstName,
      type: "text",
      autoComplete: "given-name",
    },
    {
      id: "demo-last-name",
      key: "lastName",
      label: c.form.lastName,
      placeholder: c.form.lastName,
      type: "text",
      autoComplete: "family-name",
    },
  ];

  const selectFields: {
    id: string;
    key: Extract<FieldKey, "jobTitle" | "sector" | "employees">;
    label: string;
    placeholder: string;
    options: string[];
  }[] = [
    {
      id: "demo-job-title",
      key: "jobTitle",
      label: c.form.jobTitle,
      placeholder: c.form.selectJobTitle,
      options: c.form.jobTitles,
    },
    {
      id: "demo-sector",
      key: "sector",
      label: c.form.sector,
      placeholder: c.form.selectSector,
      options: c.form.sectors,
    },
    {
      id: "demo-employees",
      key: "employees",
      label: c.form.employees,
      placeholder: c.form.selectEmployees,
      options: EMPLOYEE_RANGES,
    },
  ];

  return (
    /* The dialog is a sibling of the form, not a child: a text input inside a
       form submits it on Enter, which would re-fire the submit handler from
       inside the dialog. */
    <>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitAttempted(true);
          if (!isValid) return;
          setBookingOpen(true);
          /* Captured here, before the booking dialog, so a visitor who fills
             the form and then abandons the slot picker is still a lead. The
             booking post that follows merges into this same row on email. */
          postToSheet({ ...leadFields, ...leadLocaleFields(), type: "demo_lead" });
        }}
        className="text-left w-full"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {textFields.map((field) => (
            <div key={field.id}>
              <label className={labelClass} htmlFor={field.id}>
                {field.label}
              </label>
              <input
                id={field.id}
                type={field.type}
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                value={form[field.key]}
                onChange={set(field.key)}
                onBlur={blur(field.key)}
                aria-invalid={!!errorFor(field.key)}
                className={`${inputBase} ${errorFor(field.key) ? inputBad : inputOk}`}
              />
              <FieldError message={errorFor(field.key)} />
            </div>
          ))}

          <div>
            <label className={labelClass} htmlFor="demo-email">
              {c.form.email}
            </label>
            <input
              id="demo-email"
              type="email"
              autoComplete="email"
              placeholder={c.form.email}
              value={form.email}
              onChange={set("email")}
              onBlur={blur("email")}
              aria-invalid={!!errorFor("email")}
              className={`${inputBase} ${errorFor("email") ? inputBad : inputOk}`}
            />
            <FieldError message={errorFor("email")} />
          </div>

          {/* Dial code and number are one field, so they read as one value —
              joined into a single bordered group with the same focus behaviour
              as every other input. */}
          <div>
            <label className={labelClass} htmlFor="demo-phone">
              {c.form.phone}
            </label>
            <div
              className={`flex items-stretch bg-white border rounded-[10px] transition-colors ${
                errorFor("phone")
                  ? "border-err-text/45 focus-within:border-err-text/70"
                  : "border-black/10 focus-within:border-black/25"
              }`}
            >
              <div className="relative shrink-0">
                <select
                  id="demo-phone-dial"
                  aria-label={c.form.dialLabel}
                  value={form.dialIso}
                  onChange={set("dialIso")}
                  className="h-full appearance-none bg-transparent rounded-l-[10px] border-r border-black/10 pl-3 pr-8 py-[9px] text-xs text-[#111] focus:outline-none cursor-pointer"
                >
                  {DIAL_CODES.map((entry) => (
                    <option key={entry.iso} value={entry.iso}>
                      {entry.iso} {entry.dial}
                    </option>
                  ))}
                </select>
                <SelectChevron inset="right-2.5" />
              </div>
              <input
                id="demo-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder={c.form.phonePlaceholder}
                value={form.phone}
                onChange={set("phone")}
                onBlur={blur("phone")}
                aria-invalid={!!errorFor("phone")}
                className="flex-1 min-w-0 bg-transparent rounded-r-[10px] px-3 py-[9px] text-xs text-[#111] placeholder:text-black/35 focus:outline-none"
              />
            </div>
            <FieldError message={errorFor("phone")} />
          </div>

          <div>
            <label className={labelClass} htmlFor="demo-company">
              {c.form.company}
            </label>
            <input
              id="demo-company"
              type="text"
              autoComplete="organization"
              placeholder={c.form.companyPlaceholder}
              value={form.company}
              onChange={set("company")}
              onBlur={blur("company")}
              aria-invalid={!!errorFor("company")}
              className={`${inputBase} ${errorFor("company") ? inputBad : inputOk}`}
            />
            <FieldError message={errorFor("company")} />
          </div>

          {/* The chevron is positioned against a wrapper that holds *only* the
              select — anchoring it to the outer block instead centres it across
              the label too, which floats it above the control. */}
          {selectFields.map((field) => (
            <div key={field.id}>
              <label className={labelClass} htmlFor={field.id}>
                {field.label}
              </label>
              <div className="relative">
                <select
                  id={field.id}
                  value={form[field.key]}
                  onChange={set(field.key)}
                  onBlur={blur(field.key)}
                  aria-invalid={!!errorFor(field.key)}
                  className={`${inputBase} appearance-none pr-9 ${
                    errorFor(field.key) ? inputBad : inputOk
                  }`}
                >
                  <option value="">{field.placeholder}</option>
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <SelectChevron />
              </div>
              <FieldError message={errorFor(field.key)} />
            </div>
          ))}
        </div>

        {/* Full-width and directly under the last field: it's the one action on
            this form, so it shouldn't be a small box floating in the left half
            of a two-column grid. */}
        <button
          type="submit"
          disabled={!isValid}
          className="mt-7 w-full px-8 py-3.5 bg-[#111] text-white text-sm rounded-[10px] hover:bg-[#333] active:bg-[#000] disabled:bg-black/15 disabled:text-white/70 disabled:cursor-not-allowed transition-colors tracking-widest font-medium"
        >
          {c.common.bookDemo}
        </button>
        <p className="mt-3 text-[11px] text-black/35 leading-relaxed">
          {c.form.reassurance}
        </p>
      </form>

      <DemoBookingModal
        open={bookingOpen}
        lead={leadFields}
        onClose={() => setBookingOpen(false)}
        onComplete={setBooking}
      />
    </>
  );
}
