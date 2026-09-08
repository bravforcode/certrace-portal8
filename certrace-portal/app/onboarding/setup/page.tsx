"use client";

/* ── SIGN-IN onboarding ─────────────────────────────────────────
   The flow every sign-in takes — the email form and "Continue with Google"
   both land here, because which flow a Google click starts is decided by the
   page it was clicked on and never by the button. The identical button on
   /register starts the create-account journey at /onboarding instead.

   The two are owed different things. A brand-new signup is answering research
   questions and then waiting on a provisioning email, so THAT flow ends on a
   confirmation page with no door into the product. Someone signing in already
   has an account and is being kept out of something they came here to use —
   so this one asks only what Settings owns, confirms what they get, and lets
   them in.

     Welcome → Set up (the Settings fields) → What you get → Free trial → /dashboard

   Deliberately NOT gated on `profile.onboarded`: this is the sign-in
   experience, not a one-time wizard. Every answer arrives pre-filled from
   what the account already told us, so a returning exporter is confirming
   four screens, not filling them in.
   ══════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Sparkles,
  SlidersHorizontal,
  Rocket,
  Link2,
  UserCheck,
  ShieldCheck,
  Calculator,
  BarChart3,
  FileCheck2,
} from "lucide-react";
import { Button, SaveButton, useSaveState, Eyebrow, cn } from "@/components/ui";
import {
  OnboardingShell,
  BackButton,
  NextButton,
  StepHeader,
  FieldGroup,
  WelcomeStep,
  OrganisationFields,
  ProfileFields,
  ContactFields,
  MissingHint,
  useSetupDraft,
} from "@/components/onboarding/shared";
import { apiConfigured, markOnboarded } from "@/lib/api";
import { useProfile } from "@/lib/profile";
import { useT } from "@/lib/i18n";
import { ALL_ON, saveNotificationPrefs } from "@/lib/notification-prefs";

const STEPS = [
  { key: "welcome", label: "Welcome" },
  { key: "setup", label: "Set up" },
  { key: "value", label: "What you get" },
  { key: "trial", label: "Free trial" },
] as const;

const WELCOME_POINTS = [
  { icon: SlidersHorizontal, title: "One short setup step", body: "The details your workspace, filings and supplier requests are built from — already filled in where we know them." },
  { icon: Sparkles, title: "Then a quick look at what's inside", body: "The six things Certrace does for you, in about a minute." },
  { icon: Rocket, title: "And straight into your workspace", body: "Your free trial is running the moment setup is saved." },
];

/* The six features, in the order the work actually happens: invite, collect,
   check, calculate, compare, hand over. The same six the public site sells —
   an onboarding that promises something the product does not do is worse than
   one that promises nothing. */
const FEATURES = [
  { icon: Link2, title: "Smart Link supplier invite", body: "One link per supplier. No account for them to create." },
  { icon: UserCheck, title: "Fill-once supplier profile", body: "They answer once; every later request reuses it." },
  { icon: ShieldCheck, title: "Automatic quality check", body: "Gaps and outliers flagged before a verifier sees them." },
  { icon: Calculator, title: "CBAM calculation engine", body: "Embedded emissions computed to the EU method." },
  { icon: BarChart3, title: "Carbon benchmark dashboard", body: "Your numbers against CBAM penalty rates, so you know what to fix." },
  { icon: FileCheck2, title: "Always-ready report package", body: "Audit-ready output for your buyer, on the day they ask." },
];

/* ── What the month actually buys them ──────────────────────────
   Headlines only, no explanatory line under each: this screen sits at the very
   end of onboarding, where a scannable list is read and a paragraph is not.
   Each one is an OUTCOME rather than a feature — what is true at the end of
   the month, not what exists in the menu. */
const TRIAL_INCLUDED = [
  "The full CBAM workflow, start to finish",
  "Advanced dashboard",
  "Unlimited supplier invitations",
  "Unlimited workspaces",
  "Unlimited precursors",
];

export default function SignInSetupPage() {
  const router = useRouter();
  const t = useT();
  const { profile, update } = useProfile();
  const { draft, set, orgValid, profileValid, contactValid, phoneValid, missing, toPatch } = useSetupDraft();
  const [step, setStep] = React.useState(0);
  const { state: saveState, run: runSave } = useSaveState();

  const setupValid = orgValid && profileValid && contactValid;

  /* Committed when LEAVING the setup step, not at the very end. Someone who
     closes the tab on the tour has still told us everything Settings needs,
     and the next sign-in should open with it filled in rather than ask again. */
  const saveAndContinue = () => {
    if (!setupValid) return;
    runSave(() => {
      update({ ...toPatch(), onboarded: true });
      /* Told to the server too (fire-and-forget): the server-side flag is
         what routes the NEXT sign-in straight to /dashboard, and
         localStorage does not follow the person to a new browser. */
      if (apiConfigured()) void markOnboarded().catch(() => {});
      // Nothing here asks about notification preferences — everything on by default.
      saveNotificationPrefs(ALL_ON);
      setStep(2);
    });
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  return (
    <OnboardingShell
      steps={STEPS}
      step={step}
      footer={
        <>
          {step > 0 && step < 3 ? <BackButton onClick={goBack} /> : <span />}
          {step === 0 && <NextButton onClick={() => setStep(1)} label={t("Get started")} />}
          {step === 1 && (
            /* The hint rides with the button rather than under the form, so a
               refusal and its reason are read in one glance. */
            <div className="flex items-center gap-3">
              <MissingHint items={missing} />
              <SaveButton
                state={saveState}
                onClick={saveAndContinue}
                disabled={!setupValid}
                idleLabel={t("Save and continue")}
                savingLabel={t("Saving your details…")}
                savedLabel={t("Saved")}
              />
            </div>
          )}
          {step === 2 && <NextButton onClick={() => setStep(3)} label={t("Continue")} />}
          {step === 3 && (
            <Button size="sm" onClick={() => router.push("/dashboard")}>
              {t("Go to your workspace")} <ArrowRight size={13} strokeWidth={1.5} />
            </Button>
          )}
        </>
      }
    >
      {step === 0 && (
        <WelcomeStep
          eyebrow={t("Welcome back")}
          title={profile.firstName ? t("Good to see you, {name}.", { name: profile.firstName }) : t("Good to see you.")}
          body={t("Before your workspace opens, a quick check that we have your details right. About two minutes.")}
          points={WELCOME_POINTS}
        />
      )}

      {step === 1 && (
        <div className="space-y-5">
          <StepHeader
            eyebrow={t("Set up your workspace")}
            body={t("These are your Settings — what your filings, supplier requests and emission figures are built from. Anything we already know is filled in; change whatever has moved on.")}
          />

          <FieldGroup label={t("Your organisation")}>
            <OrganisationFields draft={draft} set={set} />
          </FieldGroup>

          <FieldGroup label={t("Your profile")}>
            <ProfileFields draft={draft} set={set} />
          </FieldGroup>

          <FieldGroup label={t("How we reach you")}>
            <ContactFields draft={draft} set={set} phoneValid={phoneValid} />
          </FieldGroup>

          {/* No running "still to answer" list here. Every field on this step
              carries its own label and its own inline error, so a second,
              summary copy of the same fact under the form said it twice and
              named the two fields people are slowest to fill — phone and
              LINE ID — in a way that read as nagging rather than helping.
              "Save and continue" stays disabled until the step is complete,
              which is the same signal without the running commentary. */}
          <p className="text-[11px] leading-relaxed text-black/35">{t("All of this stays editable in Settings.")}</p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <StepHeader eyebrow={t("What you get")} body={t("Six things Certrace does, in the order the work actually happens.")} />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border border-black/[0.06] bg-[#faf9f7] px-4 py-3.5">
                <Icon size={16} strokeWidth={1.5} className="text-black/40" />
                <div className="mt-2 text-[13px] leading-snug text-black/80">{t(title)}</div>
                <div className="mt-1 text-[12px] leading-relaxed text-black/45">{t(body)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && <TrialStep companyName={draft.companyName} />}
    </OnboardingShell>
  );
}

/* ── Free trial confirmation ────────────────────────────────────
   The counterpart to /onboarding/done — same reassurance, opposite ending.
   No "watch for an email" here: this account exists, the trial is running,
   and the button underneath opens the product. */
function TrialStep({ companyName }: { companyName: string }) {
  const t = useT();
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center">
          <span className="relative grid h-14 w-14 place-items-center rounded-full bg-[#111] text-white">
            <Check size={22} strokeWidth={2} />
            <span className="absolute inset-0 animate-ping rounded-full bg-[#111] opacity-10" aria-hidden />
          </span>
        </div>

        <Eyebrow className="mt-5 block">{t("Free trial active")}</Eyebrow>
        <h2 className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light leading-tight tracking-tight text-[#111]">
          {companyName ? t("{company} is set up.", { company: companyName }) : t("You're set up.")}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-black/50">
          {t("Your workspace is built and your free trial is running. Start by inviting your first supplier.")}
        </p>
        {/* The length of the trial, stated once and plainly — an "active"
            badge with no end date is the thing people write in to ask about. */}
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#ecfdf5] px-3.5 py-1.5 text-[11px] uppercase tracking-[0.1em] text-[#047857]">
          {t("One month, free, from today")}
        </p>
      </div>

      <div className="space-y-2.5 border-t border-black/[0.06] pt-5">
        <span className="font-pixel block text-[10px] uppercase tracking-[0.16em] text-black/45">{t("What the month gives you")}</span>
        {TRIAL_INCLUDED.map((title) => (
          <div key={title} className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-[#faf9f7] px-4 py-3">
            <span className={cn("grid h-4 w-4 flex-none place-items-center rounded-full bg-[#111] text-white")}>
              <Check size={10} strokeWidth={3} />
            </span>
            <div className="min-w-0 text-[13px] leading-snug text-black/80">{t(title)}</div>
          </div>
        ))}
        <p className="pt-1 text-[11px] leading-relaxed text-black/35">
          {t("Everything above is included for the full month. Nothing is filed on your behalf and nothing leaves your workspace until you send it.")}
        </p>
      </div>
    </div>
  );
}
