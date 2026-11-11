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
import {
  Button,
  Field,
  inputClass,
  SaveButton,
  useSaveState,
  Eyebrow,
  cn,
} from "@/components/ui";
import { Select } from "@/components/controls";
import { factoryBasicsErrors } from "@/lib/profile-basics";
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
import { loadSession } from "@/lib/api";
import { flushAccount } from "@/lib/account-storage";
import { useProfile } from "@/lib/profile";
import { useFormat, useT } from "@/lib/i18n";
import { trialState, currentPlan } from "@/lib/plan";
import { RoleRadios } from "@/components/workspace/installation-form";
import { ownInstallation, saveInstallation, type InstallationRole } from "@/lib/installations";

/* Who runs the plant: the same choice Settings offers, limited to the two that
   a sign-in onboarding can answer. "both" from the onboarding question stays
   "both" unless the user changes it here. */
const PLANT_ROLE_OPTIONS: { value: "own" | "oem"; label: string }[] = [
  { value: "own", label: "We run this plant" },
  { value: "oem", label: "An OEM runs it for us — we enter its data" },
];

const STEPS = [
  { key: "welcome", label: "Welcome" },
  { key: "setup", label: "Set up" },
  { key: "value", label: "What you get" },
  { key: "trial", label: "Free trial" },
] as const;

/* Factory basics seed the factory profile so it is not empty on first visit.
   Optional, but a typed count must be a whole number (see profile-basics.ts). */
const ENERGY_SOURCE_OPTIONS = [
  { value: "electricity", label: "Electricity" },
  { value: "natural-gas", label: "Natural gas" },
  { value: "oil", label: "Oil" },
  { value: "lpg", label: "LPG" },
  { value: "coal", label: "Coal" },
  { value: "biomass", label: "Biomass" },
  { value: "steam-purchased", label: "Purchased steam" },
];
const ANNUAL_PRODUCTION_OPTIONS = [
  { value: "<1k", label: "Under 1,000 t" },
  { value: "1k-10k", label: "1,000–10,000 t" },
  { value: "10k-100k", label: "10,000–100,000 t" },
  { value: ">100k", label: "Over 100,000 t" },
];

const WELCOME_POINTS = [
  {
    icon: SlidersHorizontal,
    title: "One short setup step",
    body: "The details your workspace, filings and supplier requests are built from — already filled in where we know them.",
  },
  {
    icon: Sparkles,
    title: "Then a quick look at what's inside",
    body: "The six things Certrace does for you, in about a minute.",
  },
  {
    icon: Rocket,
    title: "And straight into your workspace",
    body: "Your workspace is ready when setup is saved.",
  },
];

/* The six features, in the order the work actually happens: invite, collect,
   check, calculate, compare, hand over. The same six the public site sells —
   an onboarding that promises something the product does not do is worse than
   one that promises nothing. */
const FEATURES = [
  {
    icon: Link2,
    title: "Smart Link supplier invite",
    body: "One link per supplier. No account for them to create.",
  },
  {
    icon: UserCheck,
    title: "Fill-once supplier profile",
    body: "They answer once; every later request reuses it.",
  },
  {
    icon: ShieldCheck,
    title: "Automatic quality check",
    body: "Gaps and outliers flagged before a verifier sees them.",
  },
  {
    icon: Calculator,
    title: "CBAM calculation engine",
    body: "Embedded emissions computed to the EU method.",
  },
  {
    icon: BarChart3,
    title: "Carbon benchmark dashboard",
    body: "Your numbers against CBAM penalty rates, so you know what to fix.",
  },
  {
    icon: FileCheck2,
    title: "Always-ready report package",
    body: "Audit-ready output for your buyer, on the day they ask.",
  },
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
  const { profile, update, loaded } = useProfile();
  const {
    draft,
    set,
    orgValid,
    profileValid,
    contactValid,
    phoneValid,
    missing,
    toPatch,
  } = useSetupDraft();
  const [step, setStep] = React.useState(0);
  const { state: saveState, run: runSave } = useSaveState();

  const [saveError, setSaveError] = React.useState("");
  const [energySources, setEnergySources] = React.useState<string[]>(
    profile.energySources ?? [],
  );
  const [boilerCount, setBoilerCount] = React.useState(
    profile.boilerCount ?? "",
  );
  const [furnaceCount, setFurnaceCount] = React.useState(
    profile.furnaceCount ?? "",
  );
  const [annualProductionBand, setAnnualProductionBand] = React.useState(
    profile.annualProductionBand ?? "",
  );
  const [plantRole, setPlantRole] = React.useState<"own" | "oem">(
    profile.productionModel === "oem" ? "oem" : "own",
  );
  const factoryErrors = factoryBasicsErrors({ boilerCount, furnaceCount });
  const factoryValid = Object.keys(factoryErrors).length === 0;
  React.useEffect(() => {
    if (!loaded) return;
    setEnergySources(profile.energySources ?? []);
    setBoilerCount(profile.boilerCount ?? "");
    setFurnaceCount(profile.furnaceCount ?? "");
    setAnnualProductionBand(profile.annualProductionBand ?? "");
    setPlantRole(profile.productionModel === "oem" ? "oem" : "own");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);
  const toggleEnergySource = (value: string) =>
    setEnergySources((current) =>
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    );
  const allowed = Boolean(loadSession()?.user.onboarded);
  const trial = trialState();
  React.useEffect(() => {
    if (!allowed) router.replace("/onboarding");
  }, [allowed, router]);

  const setupValid =
    loaded && orgValid && profileValid && contactValid && factoryValid;

  /* Committed when LEAVING the setup step, not at the very end. Someone who
     closes the tab on the tour has still told us everything Settings needs,
     and the next sign-in should open with it filled in rather than ask again. */
  const saveAndContinue = () => {
    if (!setupValid) return;
    setSaveError("");
    runSave(async () => {
      try {
        // Only the displayed Settings fields change. Keep questionnaire answers,
        // access status and notification choices from the existing account.
        // The role is saved with the exporter's own installation when there is one,
        // and mirrored on the profile so a new site starts with the same answer.
        const own = ownInstallation();
        if (own) saveInstallation({ ...own, role: plantRole as InstallationRole });
        update({
          ...toPatch(),
          energySources,
          boilerCount,
          furnaceCount,
          annualProductionBand,
          productionModel:
            plantRole === "oem"
              ? "oem"
              : profile.productionModel === "both"
                ? "both"
                : "own",
        });
        await flushAccount();
        setStep(2);
      } catch (error) {
        setSaveError(t("We couldn't save your details. Please try again."));
        throw error;
      }
    });
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  if (!allowed || !loaded) return null;

  return (
    <OnboardingShell
      steps={
        trial.onTrial
          ? STEPS
          : STEPS.map((item) =>
              item.key === "trial" ? { ...item, label: "Your plan" } : item,
            )
      }
      step={step}
      footer={
        <>
          {step > 0 && step < 3 ? (
            <BackButton onClick={goBack} disabled={saveState === "saving"} />
          ) : (
            <span />
          )}
          {step === 0 && (
            <NextButton onClick={() => setStep(1)} label={t("Get started")} />
          )}
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
          {step === 2 && (
            <NextButton onClick={() => setStep(3)} label={t("Continue")} />
          )}
          {step === 3 && (
            <Button size="sm" onClick={() => router.push("/dashboard")}>
              {t("Go to your workspace")}{" "}
              <ArrowRight size={13} strokeWidth={1.5} />
            </Button>
          )}
        </>
      }
    >
      {step === 0 && (
        <WelcomeStep
          eyebrow={t("Welcome back")}
          title={
            profile.firstName
              ? t("Good to see you, {name}.", { name: profile.firstName })
              : t("Good to see you.")
          }
          body={t(
            "Before your workspace opens, a quick check that we have your details right. About two minutes.",
          )}
          points={WELCOME_POINTS.map((point, index) =>
            index === 2 && trial.onTrial && !trial.ended
              ? {
                  ...point,
                  body: "Your free trial is running the moment setup is saved.",
                }
              : point,
          )}
        />
      )}

      {step === 1 && (
        <fieldset
          disabled={saveState === "saving"}
          className="min-w-0 space-y-5"
        >
          <StepHeader
            eyebrow={t("Set up your workspace")}
            body={t(
              "These are your Settings — what your filings, supplier requests and emission figures are built from. Anything we already know is filled in; change whatever has moved on.",
            )}
          />

          <FieldGroup label={t("Who runs your plant")}>
            <RoleRadios
              name="plant-role"
              legend="Who runs this plant?"
              options={PLANT_ROLE_OPTIONS}
              value={plantRole}
              onChange={setPlantRole}
              disabled={saveState === "saving"}
            />
          </FieldGroup>

          <FieldGroup label={t("Your organisation")}>
            <OrganisationFields draft={draft} set={set} />
          </FieldGroup>

          <FieldGroup label={t("Your profile")}>
            <ProfileFields draft={draft} set={set} />
          </FieldGroup>

          <FieldGroup label={t("How we reach you")}>
            <ContactFields draft={draft} set={set} phoneValid={phoneValid} />
          </FieldGroup>

          <FieldGroup label={t("Factory basics")}>
            <div className="space-y-5">
              <div
                role="group"
                aria-label={t("Energy sources")}
                className="flex flex-wrap gap-2"
              >
                {ENERGY_SOURCE_OPTIONS.map((option) => {
                  const active = energySources.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="checkbox"
                      aria-checked={active}
                      onClick={() => toggleEnergySource(option.value)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-[13px] transition-colors",
                        active
                          ? "border-black/25 bg-[#f0eee8] text-black/85"
                          : "border-black/[0.08] text-black/65 hover:border-black/20",
                      )}
                    >
                      {t(option.label)}
                    </button>
                  );
                })}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("Boilers")}>
                  <input
                    className={cn(
                      inputClass,
                      factoryErrors.boilerCount &&
                        "border-[#f87171]/60 focus:border-[#f87171]",
                    )}
                    value={boilerCount}
                    inputMode="numeric"
                    maxLength={3}
                    onChange={(e) => setBoilerCount(e.target.value.trim())}
                    aria-invalid={Boolean(factoryErrors.boilerCount)}
                    aria-describedby={factoryErrors.boilerCount ? "boiler-count-error" : undefined}
                  />
                </Field>
                {factoryErrors.boilerCount && (
                  <p id="boiler-count-error" className="mt-1.5 text-[12px] text-[#dc2626]">
                    {t(factoryErrors.boilerCount)}
                  </p>
                )}
                <Field label={t("Furnaces")}>
                  <input
                    className={cn(
                      inputClass,
                      factoryErrors.furnaceCount &&
                        "border-[#f87171]/60 focus:border-[#f87171]",
                    )}
                    value={furnaceCount}
                    inputMode="numeric"
                    maxLength={3}
                    onChange={(e) => setFurnaceCount(e.target.value.trim())}
                    aria-invalid={Boolean(factoryErrors.furnaceCount)}
                    aria-describedby={factoryErrors.furnaceCount ? "furnace-count-error" : undefined}
                  />
                </Field>
                {factoryErrors.furnaceCount && (
                  <p id="furnace-count-error" className="mt-1.5 text-[12px] text-[#dc2626]">
                    {t(factoryErrors.furnaceCount)}
                  </p>
                )}
              </div>
              <Field label={t("Annual production")}>
                <Select
                  value={annualProductionBand}
                  onChange={setAnnualProductionBand}
                  options={ANNUAL_PRODUCTION_OPTIONS.map((o) => ({
                    value: o.value,
                    label: t(o.label),
                  }))}
                  placeholder="Select annual production"
                  ariaLabel={t("Annual production")}
                />
              </Field>
            </div>
          </FieldGroup>

          {/* No running "still to answer" list here. Every field on this step
              carries its own label and its own inline error, so a second,
              summary copy of the same fact under the form said it twice and
              named the two fields people are slowest to fill — phone and
              LINE ID — in a way that read as nagging rather than helping.
              "Save and continue" stays disabled until the step is complete,
              which is the same signal without the running commentary. */}
          <p className="text-[11px] leading-relaxed text-black/35">
            {t("All of this stays editable in Settings.")}
          </p>
          {saveError && (
            <p role="alert" className="text-[13px] text-[#dc2626]">
              {saveError}
            </p>
          )}
        </fieldset>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <StepHeader
            eyebrow={t("What you get")}
            body={t(
              "Six things Certrace does, in the order the work actually happens.",
            )}
          />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-black/[0.06] bg-[#faf9f7] px-4 py-3.5"
              >
                <Icon size={16} strokeWidth={1.5} className="text-black/40" />
                <div className="mt-2 text-[13px] leading-snug text-black/80">
                  {t(title)}
                </div>
                <div className="mt-1 text-[12px] leading-relaxed text-black/45">
                  {t(body)}
                </div>
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
  const fmt = useFormat();
  const trial = trialState();
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center">
          <span className="relative grid h-14 w-14 place-items-center rounded-full bg-[#111] text-white">
            <Check size={22} strokeWidth={2} />
            <span
              className="absolute inset-0 animate-ping rounded-full bg-[#111] opacity-10"
              aria-hidden
            />
          </span>
        </div>

        <Eyebrow className="mt-5 block">
          {trial.onTrial
            ? t(trial.ended ? "Free trial ended" : "Free trial active")
            : t(currentPlan().name)}
        </Eyebrow>
        <h2 className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light leading-tight tracking-tight text-[#111]">
          {companyName
            ? t("{company} is set up.", { company: companyName })
            : t("You're set up.")}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-black/50">
          {trial.onTrial && !trial.ended
            ? t(
                "Your workspace is built and your free trial is running. Start by inviting your first supplier.",
              )
            : t("Your workspace is ready.")}
        </p>
        {/* The length of the trial, stated once and plainly — an "active"
            badge with no end date is the thing people write in to ask about. */}
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#ecfdf5] px-3.5 py-1.5 text-[11px] uppercase tracking-[0.1em] text-[#047857]">
          {trial.onTrial
            ? t(trial.ended ? "ended {date}" : "ends {date}", {
                date: fmt.date(trial.endsOn),
              })
            : t("Your current plan")}
        </p>
      </div>

      {trial.onTrial && !trial.ended && (
        <div className="space-y-2.5 border-t border-black/[0.06] pt-5">
          <span className="font-pixel block text-[10px] uppercase tracking-[0.16em] text-black/45">
            {t("What the month gives you")}
          </span>
          {TRIAL_INCLUDED.map((title) => (
            <div
              key={title}
              className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-[#faf9f7] px-4 py-3"
            >
              <span
                className={cn(
                  "grid h-4 w-4 flex-none place-items-center rounded-full bg-[#111] text-white",
                )}
              >
                <Check size={10} strokeWidth={3} />
              </span>
              <div className="min-w-0 text-[13px] leading-snug text-black/80">
                {t(title)}
              </div>
            </div>
          ))}
          <p className="pt-1 text-[11px] leading-relaxed text-black/35">
            {t(
              "Everything above is included for the full month. Nothing is filed on your behalf and nothing leaves your workspace until you send it.",
            )}
          </p>
        </div>
      )}
    </div>
  );
}
