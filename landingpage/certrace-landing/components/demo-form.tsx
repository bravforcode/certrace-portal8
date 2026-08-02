"use client";

import { useState } from "react";
import { CONTACT_EMAIL } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import { type Booking, DemoBookingModal } from "./demo-booking";

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

/* Country calling codes. The standalone Country select is gone — the dial code
   below already carries where the company is, and asking twice on a five-field
   form was the kind of friction that loses a booking. ISO code is the option
   value — several countries share a dial code (+1, +7), so the dial code alone
   can't identify a row. Thailand leads the list and is the default: it's the
   primary market.

   `len` is the number of digits a national number has in that country, used to
   tell "typed it wrong" apart from "still typing". Ranges where a country runs
   several number lengths; anything not listed falls back to DEFAULT_LEN. */
const DEFAULT_LEN: [number, number] = [6, 14];

const DIAL_CODES: {
  iso: string;
  name: string;
  dial: string;
  len?: [number, number];
}[] = [
  { iso: "TH", name: "Thailand", dial: "+66", len: [8, 9] },
  { iso: "AE", name: "United Arab Emirates", dial: "+971", len: [8, 9] },
  { iso: "AR", name: "Argentina", dial: "+54", len: [10, 11] },
  { iso: "AT", name: "Austria", dial: "+43", len: [10, 13] },
  { iso: "AU", name: "Australia", dial: "+61", len: [9, 9] },
  { iso: "BD", name: "Bangladesh", dial: "+880", len: [10, 10] },
  { iso: "BE", name: "Belgium", dial: "+32", len: [8, 9] },
  { iso: "BG", name: "Bulgaria", dial: "+359", len: [8, 9] },
  { iso: "BR", name: "Brazil", dial: "+55", len: [10, 11] },
  { iso: "CA", name: "Canada", dial: "+1", len: [10, 10] },
  { iso: "CH", name: "Switzerland", dial: "+41", len: [9, 9] },
  { iso: "CL", name: "Chile", dial: "+56", len: [9, 9] },
  { iso: "CN", name: "China", dial: "+86", len: [11, 11] },
  { iso: "CY", name: "Cyprus", dial: "+357", len: [8, 8] },
  { iso: "CZ", name: "Czechia", dial: "+420", len: [9, 9] },
  { iso: "DE", name: "Germany", dial: "+49", len: [10, 11] },
  { iso: "DK", name: "Denmark", dial: "+45", len: [8, 8] },
  { iso: "EE", name: "Estonia", dial: "+372", len: [7, 8] },
  { iso: "EG", name: "Egypt", dial: "+20", len: [10, 10] },
  { iso: "ES", name: "Spain", dial: "+34", len: [9, 9] },
  { iso: "FI", name: "Finland", dial: "+358", len: [9, 10] },
  { iso: "FR", name: "France", dial: "+33", len: [9, 9] },
  { iso: "GB", name: "United Kingdom", dial: "+44", len: [10, 10] },
  { iso: "GR", name: "Greece", dial: "+30", len: [10, 10] },
  { iso: "HK", name: "Hong Kong", dial: "+852", len: [8, 8] },
  { iso: "HR", name: "Croatia", dial: "+385", len: [8, 9] },
  { iso: "HU", name: "Hungary", dial: "+36", len: [8, 9] },
  { iso: "ID", name: "Indonesia", dial: "+62", len: [9, 12] },
  { iso: "IE", name: "Ireland", dial: "+353", len: [9, 9] },
  { iso: "IL", name: "Israel", dial: "+972", len: [9, 9] },
  { iso: "IN", name: "India", dial: "+91", len: [10, 10] },
  { iso: "IT", name: "Italy", dial: "+39", len: [9, 10] },
  { iso: "JP", name: "Japan", dial: "+81", len: [10, 10] },
  { iso: "KH", name: "Cambodia", dial: "+855", len: [8, 9] },
  { iso: "KR", name: "South Korea", dial: "+82", len: [9, 10] },
  { iso: "KW", name: "Kuwait", dial: "+965", len: [8, 8] },
  { iso: "LA", name: "Laos", dial: "+856", len: [8, 10] },
  { iso: "LK", name: "Sri Lanka", dial: "+94", len: [9, 9] },
  { iso: "LT", name: "Lithuania", dial: "+370", len: [8, 8] },
  { iso: "LU", name: "Luxembourg", dial: "+352", len: [9, 9] },
  { iso: "LV", name: "Latvia", dial: "+371", len: [8, 8] },
  { iso: "MA", name: "Morocco", dial: "+212", len: [9, 9] },
  { iso: "MM", name: "Myanmar", dial: "+95", len: [8, 10] },
  { iso: "MT", name: "Malta", dial: "+356", len: [8, 8] },
  { iso: "MX", name: "Mexico", dial: "+52", len: [10, 10] },
  { iso: "MY", name: "Malaysia", dial: "+60", len: [9, 10] },
  { iso: "NG", name: "Nigeria", dial: "+234", len: [10, 10] },
  { iso: "NL", name: "Netherlands", dial: "+31", len: [9, 9] },
  { iso: "NO", name: "Norway", dial: "+47", len: [8, 8] },
  { iso: "NZ", name: "New Zealand", dial: "+64", len: [8, 10] },
  { iso: "PH", name: "Philippines", dial: "+63", len: [10, 10] },
  { iso: "PK", name: "Pakistan", dial: "+92", len: [10, 10] },
  { iso: "PL", name: "Poland", dial: "+48", len: [9, 9] },
  { iso: "PT", name: "Portugal", dial: "+351", len: [9, 9] },
  { iso: "QA", name: "Qatar", dial: "+974", len: [8, 8] },
  { iso: "RO", name: "Romania", dial: "+40", len: [9, 9] },
  { iso: "SA", name: "Saudi Arabia", dial: "+966", len: [9, 9] },
  { iso: "SE", name: "Sweden", dial: "+46", len: [7, 10] },
  { iso: "SG", name: "Singapore", dial: "+65", len: [8, 8] },
  { iso: "SI", name: "Slovenia", dial: "+386", len: [8, 8] },
  { iso: "SK", name: "Slovakia", dial: "+421", len: [9, 9] },
  { iso: "TR", name: "Turkey", dial: "+90", len: [10, 10] },
  { iso: "TW", name: "Taiwan", dial: "+886", len: [9, 9] },
  { iso: "UA", name: "Ukraine", dial: "+380", len: [9, 9] },
  { iso: "US", name: "United States", dial: "+1", len: [10, 10] },
  { iso: "VN", name: "Vietnam", dial: "+84", len: [9, 10] },
  { iso: "ZA", name: "South Africa", dial: "+27", len: [9, 9] },
];

/* Consumer mailbox providers. The field asks for a professional email, so a
   personal address is rejected rather than quietly accepted — a demo request
   from someone's private inbox has no company behind it to qualify. */
const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.co.th",
  "yahoo.co.jp",
  "ymail.com",
  "rocketmail.com",
  "hotmail.com",
  "hotmail.co.uk",
  "hotmail.co.th",
  "outlook.com",
  "outlook.co.th",
  "live.com",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "gmx.com",
  "gmx.net",
  "gmx.de",
  "mail.com",
  "mail.ru",
  "yandex.com",
  "yandex.ru",
  "zoho.com",
  "fastmail.com",
  "hushmail.com",
  "tutanota.com",
  "qq.com",
  "163.com",
  "126.com",
  "sina.com",
  "naver.com",
  "daum.net",
  "hanmail.net",
  "rediffmail.com",
  "thaimail.com",
  "sanook.com",
  "windowslive.com",
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "trashmail.com",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/* Matches the DS `.m-select`/`.m-input` spec exactly: white fill, 1px
   10%-black border, 10px radius, 12px text, 9px/12px padding, 35%-ink
   placeholder, border darkens to 25% on focus (no ring, no glow). */
const inputBase =
  "w-full bg-white border rounded-[10px] px-3 py-[9px] text-xs text-[#111] placeholder:text-black/35 focus:outline-none transition-colors";
const inputOk = "border-black/10 focus:border-black/25";
/* `err-text` is the DS status token from globals.css (@theme --color-err-text).
   Use the token, not a raw hex: an arbitrary hex carrying an opacity modifier
   compiled to no rule at all here, so the invalid state silently rendered with
   the normal border. */
const inputBad = "border-err-text/45 focus:border-err-text/70";
/* DS §Label: 11px, .1em tracking, uppercase, 55% ink, weight 500. */
const labelClass =
  "block text-[11px] tracking-widest uppercase text-black/55 font-medium mb-1.5";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-[11px] leading-snug text-err-text">{message}</p>
  );
}

function SelectChevron({ inset = "right-3" }: { inset?: string }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`pointer-events-none absolute ${inset} top-1/2 -translate-y-1/2 text-black/35`}
    >
      <path d="M2 3.5 5 6.5 8 3.5" />
    </svg>
  );
}

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

  const digits = form.phone.replace(/\D/g, "");
  const [minLen, maxLen] = country.len ?? DEFAULT_LEN;
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
          if (isValid) {
            setBookingOpen(true);
            // Send initial lead info to Google Sheets via Apps Script
            const scriptUrl = 'https://script.google.com/macros/s/AKfycbwR4uqNpQbeKsaYEo2EsHSJywdEZwSbBNEYEDyPCMam0J0o8BytugkB1oPl5N8QdoXe/exec';
            const formData = new FormData();
            formData.append('firstName', form.firstName);
            formData.append('lastName', form.lastName);
            formData.append('email', form.email);
            formData.append('phone', `${country.dial} ${form.phone}`);
            formData.append('company', form.company);
            formData.append('jobTitle', form.jobTitle);
            formData.append('sector', form.sector);
            formData.append('employees', form.employees);
            formData.append('type', 'demo_lead');
            fetch(scriptUrl, { method: 'POST', body: formData, mode: 'no-cors' }).catch(() => {});
          }
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
        lead={{
          firstName: form.firstName,
          company: form.company,
          email: form.email,
        }}
        onClose={() => setBookingOpen(false)}
        onComplete={setBooking}
      />
    </>
  );
}
