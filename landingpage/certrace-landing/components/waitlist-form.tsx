"use client";

import Link from "next/link";
import { useState } from "react";
import { CONTACT_EMAIL } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import { AnimateCard, BlurHeading, TagBadge } from "@/components/ui";
import { syncWaitlist } from "@/lib/sheet-sync";
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
} from "@/components/form-fields";

/* The two portals that aren't open yet end on this instead of a demo booking:
   there is nothing to demo, so asking for 30 minutes would be a bait. The ask
   is the same one the demo form makes — name, professional email, phone,
   company, job title — because a waitlist entry with only an address behind it
   can't be prioritised when the side actually opens.

   Frontend-only, like the demo form and the booking dialog — nothing is
   transmitted or stored. The confirmation therefore promises an email and
   nothing more; do not let the copy drift into "you're registered" or any
   wording that implies a record exists somewhere. */

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  dialIso: string;
  phone: string;
  company: string;
  jobTitle: string;
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
};

export function WaitlistForm() {
  const { c } = useLang();
  const w = c.solutionPage.waitlist;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState("");

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const blur = (field: FieldKey) => () =>
    setTouched((t) => ({ ...t, [field]: true }));

  const country =
    DIAL_CODES.find((entry) => entry.iso === form.dialIso) ?? DIAL_CODES[0];

  const errors: Partial<Record<FieldKey, string>> = {};

  if (!form.firstName.trim()) errors.firstName = w.errors.required;
  if (!form.lastName.trim()) errors.lastName = w.errors.required;
  if (!form.company.trim()) errors.company = w.errors.required;
  if (!form.jobTitle) errors.jobTitle = w.errors.required;

  const email = form.email.trim().toLowerCase();
  if (!email) {
    errors.email = w.errors.required;
  } else if (!EMAIL_RE.test(email)) {
    errors.email = w.errors.emailFormat;
  } else if (PERSONAL_EMAIL_DOMAINS.has(email.slice(email.lastIndexOf("@") + 1))) {
    errors.email = w.errors.emailPersonal;
  }

  const [minLen, maxLen] = country.len ?? DEFAULT_LEN;
  const digits = cleanNationalDigits(form.phone, country.dial, maxLen);
  if (!digits) {
    errors.phone = w.errors.phoneDigits;
  } else if (digits.length < minLen || digits.length > maxLen) {
    errors.phone = w.errors.phoneLength;
  }

  const valid = Object.keys(errors).length === 0;

  const errorFor = (field: FieldKey) =>
    touched[field] || submitAttempted ? errors[field] : undefined;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!valid) return;
    setConfirmedEmail(form.email.trim());
    try {
      syncWaitlist({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        countryCode: country.dial,
        phone: form.phone.trim(),
        company: form.company.trim(),
        jobTitle: form.jobTitle,
      });
    } catch (err) {
      console.warn("Waitlist sync failed:", err);
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <AnimateCard className="p-8 md:p-10" hover={false}>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] tracking-widest border border-emerald-600/15 bg-emerald-50 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {w.confirmedBadge}
        </span>
        <h3 className="mt-5 text-2xl md:text-3xl font-light tracking-tight">
          {w.confirmedTitle}
        </h3>
        <p className="mt-4 text-sm text-black/45 leading-relaxed max-w-md">
          {w.confirmedBody}{" "}
          <span className="text-black/70 break-all">{confirmedEmail}</span>{" "}
          {w.confirmedTail}
        </p>
        <Link
          href="/#demo"
          className="mt-7 inline-flex px-7 py-3 bg-[#111] text-white text-sm rounded-[10px] hover:bg-[#333] transition-colors tracking-widest"
        >
          {c.common.bookDemo}
        </Link>
      </AnimateCard>
    );
  }

  /* First/last name pair up on one row from sm; everything else is full width
     inside the card, which already sits in the narrower half of a two-column
     section. */
  const nameFields: {
    id: string;
    key: Extract<FieldKey, "firstName" | "lastName">;
    label: string;
    autoComplete: string;
  }[] = [
    {
      id: "waitlist-first-name",
      key: "firstName",
      label: c.form.firstName,
      autoComplete: "given-name",
    },
    {
      id: "waitlist-last-name",
      key: "lastName",
      label: c.form.lastName,
      autoComplete: "family-name",
    },
  ];

  return (
    <AnimateCard className="p-8 md:p-10" hover={false}>
      <form onSubmit={onSubmit} noValidate className="text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {nameFields.map((field) => (
            <div key={field.id}>
              <label className={labelClass} htmlFor={field.id}>
                {field.label}
              </label>
              <input
                id={field.id}
                type="text"
                autoComplete={field.autoComplete}
                placeholder={field.label}
                value={form[field.key]}
                onChange={set(field.key)}
                onBlur={blur(field.key)}
                aria-invalid={!!errorFor(field.key)}
                className={`${inputBase} ${errorFor(field.key) ? inputBad : inputOk}`}
              />
              <FieldError message={errorFor(field.key)} />
            </div>
          ))}

          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="waitlist-email">
              {c.form.email}
            </label>
            <input
              id="waitlist-email"
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

          {/* Dial code and number are one bordered group, so they read as one
              value — same construction as the demo form. */}
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="waitlist-phone">
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
                  id="waitlist-phone-dial"
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
                id="waitlist-phone"
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
            <label className={labelClass} htmlFor="waitlist-company">
              {c.form.company}
            </label>
            <input
              id="waitlist-company"
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

          <div>
            <label className={labelClass} htmlFor="waitlist-job-title">
              {c.form.jobTitle}
            </label>
            {/* The chevron anchors to a wrapper holding only the select —
                against the outer block it centres across the label too. */}
            <div className="relative">
              <select
                id="waitlist-job-title"
                value={form.jobTitle}
                onChange={set("jobTitle")}
                onBlur={blur("jobTitle")}
                aria-invalid={!!errorFor("jobTitle")}
                className={`${inputBase} appearance-none pr-9 ${
                  errorFor("jobTitle") ? inputBad : inputOk
                }`}
              >
                <option value="">{c.form.selectJobTitle}</option>
                {c.form.jobTitles.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </div>
            <FieldError message={errorFor("jobTitle")} />
          </div>
        </div>

        <button
          type="submit"
          disabled={!valid}
          className="mt-7 w-full px-7 py-3.5 rounded-[10px] bg-[#111] text-white text-sm tracking-widest transition-colors hover:bg-[#333] disabled:bg-black/15 disabled:text-white/70 disabled:hover:bg-black/15 disabled:cursor-not-allowed"
        >
          {w.submit}
        </button>

        <p className="mt-3 text-xs text-black/30 leading-relaxed">
          {w.note}{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-black/45 hover:text-black transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </form>
    </AnimateCard>
  );
}

/* The whole section, so a solution page can drop it in with one tag. */
export function WaitlistSection() {
  const { c } = useLang();
  const w = c.solutionPage.waitlist;

  return (
    <section
      id="waitlist"
      className="py-24 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        <div>
          <TagBadge>{w.badge}</TagBadge>
          <BlurHeading className="mt-5 text-3xl md:text-4xl font-light tracking-tight leading-[1.05]">
            {w.headline}
          </BlurHeading>
          <p className="mt-6 text-sm text-black/45 leading-relaxed max-w-sm">
            {w.intro}
          </p>
        </div>
        <WaitlistForm />
      </div>
    </section>
  );
}
