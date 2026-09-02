"use client";

/* ── Chrome and field blocks for the SIGN-IN onboarding ─────────
   There are TWO onboarding journeys in this portal and they are deliberately
   not the same thing:

     /onboarding        a brand-new account, straight off /register. Asks the
                        research questions only a first-time signup can answer
                        and ENDS on a confirmation page — no product access,
                        because the trial is still being provisioned and the
                        email is what opens it. That flow is signed off and
                        nothing in this file touches it.

     /onboarding/setup  someone SIGNING IN. Asks only what Settings owns,
                        shows what the product does for them, confirms the
                        trial and drops them INTO the product.

   Which one a "Continue with Google" click starts is decided by the page the
   button was clicked on, never by the button — the identical button sits on
   both /login and /register.

   This module holds the sign-in flow's chrome, its Settings field blocks and
   the draft they edit, so the page itself holds only its step list and copy.
   ══════════════════════════════════════════════════════════════ */

import * as React from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Card, Button, Field, inputClass, Eyebrow, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { PhoneField } from "@/components/phone-field";
import { LanguageToggle } from "@/components/lang-toggle";
import { CertraceLogo } from "@/components/logo";
import { useProfile, type Profile } from "@/lib/profile";
import { PRODUCT_SECTORS } from "@/lib/config";
import { JOB_TITLES, JOB_TITLE_OPTIONS, jobTitleIncomplete, jobTitleValue } from "@/lib/job-titles";
import { isValidPhone } from "@/lib/dial-codes";
import { useT } from "@/lib/i18n";

/* ── The draft ──────────────────────────────────────────────────
   Exactly the fields Settings owns — Organisation, Profile, and the two
   contact rows — and nothing else. The point of a setup step on sign-in is
   that these get ANSWERED once rather than left on a default for somebody to
   discover months later, when the wrong sector has already shaped a CBAM
   template and the wrong job title has already gone out on a supplier
   request. */
export type SetupDraft = {
  companyName: string;
  sectorId: string;
  jurisdiction: string;
  currency: string;
  firstName: string;
  lastName: string;
  jobTitleOption: string;
  jobTitleOther: string;
  phone: string;
  lineId: string;
};

/* ── Seeded from what is already known, never from a guess ──────
   Everything the account has already told us — the name typed on /register,
   the company and locale sitting in Settings — arrives PRE-FILLED and fully
   editable, so a returning exporter confirms rather than retypes.

   A closed list is the one exception worth naming: `jobTitleOptionFor`
   resolves a stored free-text title to "other" and anything unrecognised to
   "", so the select asks instead of silently presenting a stale value as
   though it had been chosen. Empty fields still show an example placeholder
   (see the field blocks below) — a blank box under a label reads as optional,
   and none of these are. */
const jobTitleOptionFor = (stored: string) => (JOB_TITLES.includes(stored) ? stored : stored.trim() ? "other" : "");
const jobTitleOtherFor = (stored: string) => (JOB_TITLES.includes(stored) ? "" : stored);
const known = (value: string, allowed: string[]) => (allowed.includes(value) ? value : "");

const draftFrom = (p: Profile): SetupDraft => ({
  companyName: p.companyName ?? "",
  sectorId: known(p.sector ?? "", PRODUCT_SECTORS.map((s) => s.id)),
  jurisdiction: known(p.jurisdiction ?? "", ["TH"]),
  currency: known(p.currency ?? "", ["THB", "EUR"]),
  firstName: p.firstName ?? "",
  lastName: p.lastName ?? "",
  jobTitleOption: jobTitleOptionFor(p.jobTitle ?? ""),
  jobTitleOther: jobTitleOtherFor(p.jobTitle ?? ""),
  phone: p.phone ?? "",
  lineId: p.lineId ?? "",
});

export function useSetupDraft() {
  const { profile, loaded } = useProfile();
  const [draft, setDraft] = React.useState<SetupDraft>(() => draftFrom(profile));

  /* The profile loads from localStorage a tick after mount (SSR-hydration-safe),
     so re-sync once that lands — otherwise a component that mounted first keeps
     showing the hardcoded defaults forever, even on a hard refresh mid-flow.
     Same pattern as every Settings tab. */
  React.useEffect(() => {
    if (loaded) setDraft(draftFrom(profile));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const set = React.useCallback((patch: Partial<SetupDraft>) => setDraft((d) => ({ ...d, ...patch })), []);

  /* Every answer on this step shapes a filing, so every one of them is
     required — there is no optional box left here. */
  const orgValid = draft.companyName.trim() !== "" && draft.sectorId !== "" && draft.jurisdiction !== "";
  const profileValid =
    draft.firstName.trim() !== "" &&
    draft.lastName.trim() !== "" &&
    draft.jobTitleOption !== "" &&
    !jobTitleIncomplete(draft.jobTitleOption, draft.jobTitleOther);
  /* CHECKED, not merely non-empty. A number that cannot be dialled is worse
     than a blank one, because "n/a" in this box reads as done — and this is
     how a CBAM specialist reaches somebody the day a filing is at risk, the
     one moment email is too slow. */
  const phoneValid = isValidPhone(draft.phone, draft.jurisdiction || "TH");
  const contactValid = phoneValid && draft.lineId.trim() !== "";

  const toPatch = (): Partial<Profile> => ({
    companyName: draft.companyName.trim(),
    sector: draft.sectorId,
    jurisdiction: draft.jurisdiction,
    /* The stored profile keeps whatever currency it already had. The question
       is no longer asked (see OrganisationFields), and writing an empty string
       here would erase an existing account's value as a side effect of
       walking through setup again. */
    currency: draft.currency,
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    jobTitle: jobTitleValue(draft.jobTitleOption, draft.jobTitleOther),
    phone: draft.phone,
    lineId: draft.lineId.trim(),
  });

  /* ── What is still outstanding, BY NAME ─────────────────────
     The Continue button is disabled while the step is invalid, which is the
     rule everywhere in this app — but a dead button on a twelve-field form
     says only "no", never "which". This is the "which": the labels of the
     answers still missing, computed live, so the footer names them instead of
     repeating "every question is required" at somebody who believes they
     answered every question. Kept in the same order the fields appear. */
  const missing: string[] = [];
  if (draft.companyName.trim() === "") missing.push("Company name");
  if (draft.sectorId === "") missing.push("Primary sector");
  if (draft.jurisdiction === "") missing.push("Operating jurisdiction");
  if (draft.firstName.trim() === "") missing.push("First name");
  if (draft.lastName.trim() === "") missing.push("Last name");
  if (draft.jobTitleOption === "" || jobTitleIncomplete(draft.jobTitleOption, draft.jobTitleOther)) missing.push("Job title");
  if (!phoneValid) missing.push("Phone number");
  if (draft.lineId.trim() === "") missing.push("LINE ID");

  return { draft, set, orgValid, profileValid, contactValid, phoneValid, missing, toPatch };
}

/* ── Chrome ─────────────────────────────────────────────────────
   Logo, language toggle, progress, card.

   The EN/ไทย toggle is here because this flow renders BEFORE the portal shell
   exists — there is no top bar and no account menu yet, so the switcher in
   there is unreachable and a Thai exporter would otherwise fill in four steps
   of English with no way out of it.

   It is a TOGGLE, never a `?lang=` link: switching language must not navigate,
   or the step and every answer already typed — all of it React state on this
   page — would be thrown away by the remount. Setting the context re-renders
   the same tree in place. */
export function OnboardingShell({
  steps,
  step,
  children,
  footer,
}: {
  steps: readonly { key: string; label: string }[];
  step: number;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const t = useT();
  return (
    <div className="min-h-dvh bg-[#f5f4f0] px-6 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-lg">
        {/* Below sm the wordmark (~145px) and the toggle (~110px) collide in a
            327px line, so the phone gets the honest split — logo left, toggle
            right — and only wider screens centre the mark. */}
        <div className="relative flex items-center justify-between sm:justify-center">
          <CertraceLogo className="h-5 w-auto" />
          <LanguageToggle className="sm:absolute sm:right-0" />
        </div>

        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-black/40">
            <span>{t("Step {step} of {total}", { step: step + 1, total: steps.length })}</span>
            <span className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/45">{t(steps[step].label)}</span>
          </div>
          <div className="flex gap-1.5">
            {steps.map((s, i) => (
              <span key={s.key} className={cn("h-[3px] flex-1 rounded-full transition-colors", i <= step ? "bg-[#111]" : "bg-black/[0.08]")} />
            ))}
          </div>
        </div>

        <Card key={step} className="ct-enter mt-6 p-6 sm:p-8">
          {children}
          <div className="mt-8 flex items-center justify-between border-t border-black/[0.06] pt-6">{footer}</div>
        </Card>
      </div>
    </div>
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  const t = useT();
  return (
    <Button variant="ghost" size="sm" onClick={onClick}>
      <ArrowLeft size={13} strokeWidth={1.5} /> {t("Back")}
    </Button>
  );
}

export function NextButton({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <Button size="sm" onClick={onClick} disabled={disabled}>
      {label} <ArrowRight size={13} strokeWidth={1.5} />
    </Button>
  );
}

export function StepHeader({ eyebrow, body }: { eyebrow: string; body: string }) {
  return (
    <div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <p className="mt-2 text-sm leading-relaxed text-black/50">{body}</p>
    </div>
  );
}

/* Section rule inside the one long setup step — three groups of questions in
   one card reads as a wall without them. */
export function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 border-t border-black/[0.06] pt-5">
      <span className="font-pixel block text-[10px] uppercase tracking-[0.16em] text-black/45">{label}</span>
      {children}
    </div>
  );
}

/* ── The Settings field blocks ──────────────────────────────────
   Same fields, same labels and the same example placeholders Settings uses —
   one field cannot have two names, and an example is what tells somebody what
   shape of answer belongs in the box. Anything already known arrives as the
   value; anything not shows the example. */
export function OrganisationFields({ draft, set }: { draft: SetupDraft; set: (p: Partial<SetupDraft>) => void }) {
  const t = useT();
  const sectorOptions = PRODUCT_SECTORS.map((s) => ({ value: s.id, label: t(s.name), hint: s.cnHint }));
  const jurisdictionOptions = [{ value: "TH", label: t("Thailand") }];
  return (
    <>
      <Field label={t("Company name")}>
        <input
          className={inputClass}
          value={draft.companyName}
          onChange={(e) => set({ companyName: e.target.value })}
          placeholder={t("Siam Steel Export Co.")}
        />
      </Field>

      <Field label={t("Primary sector")} hint={t("Which CBAM-affected industry your organisation reports under.")}>
        <Select
          value={draft.sectorId}
          onChange={(v) => set({ sectorId: v })}
          options={sectorOptions}
          placeholder={t("Select primary sector")}
          ariaLabel={t("Primary sector")}
        />
      </Field>

      {/* NO DISPLAY CURRENCY. It asked a two-option question on the way in
          that no screen downstream reads: everything this product reports is
          in tonnes of CO₂e, and the one money field in the workspace — the
          carbon price paid in the country of origin — carries the currency of
          the receipt it is read off, which is not an account preference. */}
      <Field label={t("Operating jurisdiction")} hint={t("Sets the localised emission-factor library and number formats.")}>
        <Select
          value={draft.jurisdiction}
          onChange={(v) => set({ jurisdiction: v })}
          options={jurisdictionOptions}
          placeholder={t("Select jurisdiction")}
          ariaLabel={t("Operating jurisdiction")}
        />
      </Field>
    </>
  );
}

export function ProfileFields({ draft, set }: { draft: SetupDraft; set: (p: Partial<SetupDraft>) => void }) {
  const t = useT();
  return (
    <>
      {/* Pre-filled with the name typed on /register when there is one — this
          is a confirmation, not a re-interview. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("First name")}>
          <input
            className={inputClass}
            value={draft.firstName}
            onChange={(e) => set({ firstName: e.target.value })}
            placeholder={t("Enter your first name")}
            autoComplete="given-name"
          />
        </Field>
        <Field label={t("Last name")}>
          <input
            className={inputClass}
            value={draft.lastName}
            onChange={(e) => set({ lastName: e.target.value })}
            placeholder={t("Enter your last name")}
            autoComplete="family-name"
          />
        </Field>
      </div>

      <Field label={t("Job title")} hint={t("Shown on every supplier request you send, and on the “requested by” line a verifier reads.")}>
        <Select
          value={draft.jobTitleOption}
          onChange={(v) => set({ jobTitleOption: v })}
          options={JOB_TITLE_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
          placeholder={t("Select job title")}
          ariaLabel={t("Job title")}
        />
      </Field>

      {draft.jobTitleOption === "other" && (
        <Field label={t("Specify job title")}>
          <input
            className={inputClass}
            value={draft.jobTitleOther}
            onChange={(e) => set({ jobTitleOther: e.target.value })}
            placeholder={t("e.g. Regional Trade Manager")}
          />
        </Field>
      )}
    </>
  );
}

export function ContactFields({ draft, set, phoneValid }: { draft: SetupDraft; set: (p: Partial<SetupDraft>) => void; phoneValid: boolean }) {
  const t = useT();
  const phoneTyped = draft.phone.trim() !== "";
  return (
    <>
      {/* A <label> wrapping two controls forwards every click to the first one,
          so the phone row builds its own label instead of using <Field>. */}
      <div className="block">
        <span className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-black/55">{t("Phone number")}</span>
        <PhoneField
          value={draft.phone}
          onChange={(v) => set({ phone: v })}
          country={draft.jurisdiction || "TH"}
          invalid={phoneTyped && !phoneValid}
          searchPlaceholder={t("Country or code…")}
          dialLabel={t("Country calling code")}
          numberLabel={t("Telephone number")}
        />
        <span className="mt-1.5 block text-xs text-black/35">{t("Pick your country code, then type the rest of the number.")}</span>
        {phoneTyped && !phoneValid && (
          <span className="mt-1.5 block text-xs text-[#dc2626]">{t("Enter a real telephone number — digits only, 6 to 14 of them.")}</span>
        )}
      </div>

      <Field label={t("LINE ID")} hint={t("So our CBAM specialists can reach you on LINE.")}>
        <input
          className={inputClass}
          value={draft.lineId}
          onChange={(e) => set({ lineId: e.target.value })}
          placeholder={t("@your-line-id")}
        />
      </Field>
    </>
  );
}

/* ── Welcome ────────────────────────────────────────────────────
   Nothing to fill in. Three lines of what this is for and one honest number
   for how long it takes — the step that makes the ones after it feel finite. */
export function WelcomeStep({
  eyebrow,
  title,
  body,
  points,
}: {
  eyebrow: string;
  title: string;
  body: string;
  points: { icon: React.ElementType; title: string; body: string }[];
}) {
  const t = useT();
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-3 font-[family-name:var(--font-plex)] text-2xl font-light leading-tight tracking-tight text-[#111]">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-black/50">{body}</p>
      </div>
      <div className="space-y-3">
        {points.map(({ icon: Icon, title: pt, body: pb }) => (
          <div key={pt} className="flex gap-3 rounded-xl border border-black/[0.06] bg-[#faf9f7] px-4 py-3.5">
            <Icon size={16} strokeWidth={1.5} className="mt-0.5 flex-none text-black/40" />
            <div>
              <div className="text-[13px] text-black/80">{t(pt)}</div>
              <div className="mt-0.5 text-[12px] leading-relaxed text-black/45">{t(pb)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
