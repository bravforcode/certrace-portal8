"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Building2, UserRound, Target, BarChart3, Check } from "lucide-react";
import { Card, Button, Field, inputClass, Eyebrow, SaveButton, useSaveState, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { CertraceLogo } from "@/components/logo";
import { useProfile } from "@/lib/profile";
import { PRODUCT_SECTORS } from "@/lib/config";
import { JOB_TITLES, JOB_TITLE_OPTIONS } from "@/lib/job-titles";
import { PREF_KEY, ALL_ON } from "@/lib/notification-prefs";

const errInput = "border-[#f87171]/60 focus:border-[#f87171]";
const OTHER = "Other";

const STEPS = [
  { key: "organisation", label: "Organisation", icon: Building2 },
  { key: "profile", label: "Profile", icon: UserRound },
  { key: "needs", label: "Your needs", icon: Target },
  { key: "business", label: "Your business", icon: BarChart3 },
] as const;

const GOAL_ACHIEVE_OPTIONS = [
  "Simplify CBAM reporting",
  "Collect supplier emissions data",
  "Calculate product emissions",
  "Ensure CBAM compliance",
  "Reduce manual work",
  "Reduce external consulting costs",
  "Prepare for verification or audits",
  "Learn about CBAM requirements",
  OTHER,
];
const CURRENT_MANAGEMENT_OPTIONS = [
  "Excel or spreadsheets",
  "Email and PDF forms",
  "Internal compliance team",
  "External consultant",
  "ERP system",
  "Another CBAM software",
  "We haven't started yet",
  OTHER,
];
const BIGGEST_CHALLENGE_OPTIONS = [
  "Suppliers are slow to respond",
  "Supplier data is incomplete",
  "Collecting emissions data",
  "Understanding CBAM requirements",
  "Managing multiple suppliers",
  "Preparing reports",
  "Calculating emissions accurately",
  "Keeping documentation organized",
  OTHER,
];
const SUPPLIER_COUNT_OPTIONS = ["1–10", "11–50", "51–200", "201–500", "More than 500"];
const HEAR_ABOUT_OPTIONS = [
  "Google Search",
  "LinkedIn",
  "Facebook",
  "Industry event",
  "Trade association",
  "Business partner",
  "Consultant",
  "Referral from a colleague",
  "Online article or media",
  OTHER,
];
const SHAPE_CERTRACE_OPTIONS = [
  "I'd like early access to new features",
  "I'd like to join the beta testing program",
  "I'd be happy to participate in future user interviews",
];

const isAnswered = (value: string, otherText: string) => value !== "" && (value !== OTHER || otherText.trim() !== "");

/* ── Selection cards — single & multi — used for the research/product
   questions on the "Your needs" and "Your business" steps. Real radio/
   checkbox semantics for screen readers; native buttons for free keyboard
   support (Tab/Enter/Space). */
function OptionCard({
  active,
  onClick,
  role,
  children,
}: {
  active: boolean;
  onClick: () => void;
  role: "radio" | "checkbox";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-[13px] leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
        active ? "border-black/25 bg-[#f0eee8] text-black/85" : "border-black/[0.08] text-black/65 hover:border-black/20 hover:bg-black/[0.02]",
      )}
    >
      <span>{children}</span>
      <span
        className={cn(
          "grid h-4 w-4 flex-none place-items-center border transition-colors",
          role === "radio" ? "rounded-full" : "rounded-[5px]",
          active ? "border-transparent bg-[#111] text-white" : "border-black/20",
        )}
      >
        {active && <Check size={10} strokeWidth={3} />}
      </span>
    </button>
  );
}

function SingleSelectCards({ options, value, onChange, ariaLabel }: { options: string[]; value: string; onChange: (v: string) => void; ariaLabel: string }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="grid gap-2 sm:grid-cols-2">
      {options.map((opt) => (
        <OptionCard key={opt} role="radio" active={value === opt} onClick={() => onChange(opt)}>
          {opt}
        </OptionCard>
      ))}
    </div>
  );
}

function MultiSelectCards({ options, values, onChange, ariaLabel }: { options: string[]; values: string[]; onChange: (v: string[]) => void; ariaLabel: string }) {
  const toggle = (opt: string) => onChange(values.includes(opt) ? values.filter((v) => v !== opt) : [...values, opt]);
  return (
    <div role="group" aria-label={ariaLabel} className="grid gap-2">
      {options.map((opt) => (
        <OptionCard key={opt} role="checkbox" active={values.includes(opt)} onClick={() => toggle(opt)}>
          {opt}
        </OptionCard>
      ))}
    </div>
  );
}

function Question({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 text-[13px] text-black/80">{label}</div>
      {children}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, update, loaded } = useProfile();
  const [step, setStep] = React.useState(0);
  const [attempted, setAttempted] = React.useState(false);

  const [companyName, setCompanyName] = React.useState(profile.companyName);
  const [sectorId, setSectorId] = React.useState(profile.sector);
  const [installationId, setInstallationId] = React.useState(profile.installationId);

  const [firstName, setFirstName] = React.useState(profile.firstName);
  const [lastName, setLastName] = React.useState(profile.lastName);
  const isPresetTitle = JOB_TITLES.includes(profile.jobTitle);
  const [jobTitleOption, setJobTitleOption] = React.useState(isPresetTitle ? profile.jobTitle : "other");
  const [jobTitleOther, setJobTitleOther] = React.useState(isPresetTitle ? "" : profile.jobTitle);

  // Page 3 — Understanding Your Needs
  const [goalAchieve, setGoalAchieve] = React.useState("");
  const [goalAchieveOther, setGoalAchieveOther] = React.useState("");
  const [currentManagement, setCurrentManagement] = React.useState("");
  const [currentManagementOther, setCurrentManagementOther] = React.useState("");
  const [biggestChallenge, setBiggestChallenge] = React.useState("");
  const [biggestChallengeOther, setBiggestChallengeOther] = React.useState("");

  // Page 4 — Understanding Your Business
  const [supplierCount, setSupplierCount] = React.useState("");
  const [hearAbout, setHearAbout] = React.useState("");
  const [hearAboutOther, setHearAboutOther] = React.useState("");
  const [shapeCertrace, setShapeCertrace] = React.useState<string[]>([]);

  const { state: finishState, run: runFinish } = useSaveState();

  // Already been through onboarding (or arrived here directly) — nothing to do
  // here. Gated on `loaded`: the profile starts as onboarded:true by default
  // and only flips after the async localStorage read completes, so checking
  // this before `loaded` would bounce a genuinely fresh signup back to
  // /dashboard on a hard refresh, before their real onboarded:false loads.
  React.useEffect(() => {
    if (loaded && profile.onboarded) router.replace("/dashboard");
  }, [loaded, profile.onboarded, router]);

  // The profile loads from localStorage a tick after mount — re-sync the
  // prefilled drafts once that lands (matters if this page is opened fresh,
  // e.g. a hard refresh mid-flow, rather than arriving via the register redirect).
  React.useEffect(() => {
    if (!loaded) return;
    setCompanyName(profile.companyName);
    setSectorId(profile.sector);
    setInstallationId(profile.installationId);
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    const preset = JOB_TITLES.includes(profile.jobTitle);
    setJobTitleOption(preset ? profile.jobTitle : "other");
    setJobTitleOther(preset ? "" : profile.jobTitle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const sectorOptions = PRODUCT_SECTORS.map((s) => ({ value: s.id, label: s.name }));
  const step1Valid = companyName.trim().length > 0;
  const step2Valid = firstName.trim().length > 0 && lastName.trim().length > 0;
  const step3Valid =
    isAnswered(goalAchieve, goalAchieveOther) && isAnswered(currentManagement, currentManagementOther) && isAnswered(biggestChallenge, biggestChallengeOther);
  const step4Valid = supplierCount !== "" && isAnswered(hearAbout, hearAboutOther);

  const goNext = () => {
    if (step === 0 && !step1Valid) {
      setAttempted(true);
      return;
    }
    if (step === 1 && !step2Valid) {
      setAttempted(true);
      return;
    }
    if (step === 2 && !step3Valid) return;
    setAttempted(false);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    if (!step1Valid || !step2Valid || !step3Valid || !step4Valid) return;
    runFinish(() => {
      update({
        companyName,
        sector: sectorId,
        installationId,
        firstName,
        lastName,
        jobTitle: jobTitleOption === "other" ? jobTitleOther || "Other" : jobTitleOption,
        goalAchieve: goalAchieve === OTHER ? goalAchieveOther : goalAchieve,
        currentManagement: currentManagement === OTHER ? currentManagementOther : currentManagement,
        biggestChallenge: biggestChallenge === OTHER ? biggestChallengeOther : biggestChallenge,
        supplierCount,
        hearAbout: hearAbout === OTHER ? hearAboutOther : hearAbout,
        shapeCertrace,
        onboarded: true,
      });
      // Onboarding doesn't ask about notification preferences — everything on by default.
      window.localStorage.setItem(PREF_KEY, JSON.stringify(ALL_ON));
      router.push("/dashboard");
    });
  };

  return (
    <div className="min-h-dvh bg-[#f5f4f0] px-6 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex justify-center">
          <CertraceLogo className="h-5 w-auto" />
        </div>

        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-black/40">
            <span>
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/45">{STEPS[step].label}</span>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <span key={s.key} className={cn("h-[3px] flex-1 rounded-full transition-colors", i <= step ? "bg-[#111]" : "bg-black/[0.08]")} />
            ))}
          </div>
        </div>

        <Card key={step} className="ct-enter mt-6 p-6 sm:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <Eyebrow>Your organisation</Eyebrow>
                <p className="mt-2 text-sm leading-relaxed text-black/50">
                  A few details so we can set up your workspace and CBAM template correctly.
                </p>
              </div>
              <Field label="Legal name">
                <input
                  className={cn(inputClass, attempted && !step1Valid && errInput)}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Siam Steel Export Co."
                />
              </Field>
              <Field label="Primary sector" hint="Which CBAM-affected industry your organisation reports under.">
                <Select value={sectorId} onChange={setSectorId} options={sectorOptions} ariaLabel="Primary sector" />
              </Field>
              <Field label="Installation / facility ID" hint="Optional — you can add this later in Settings.">
                <input className={inputClass} value={installationId} onChange={(e) => setInstallationId(e.target.value)} placeholder="e.g. TH-RYG-0418" />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <Eyebrow>Your profile</Eyebrow>
                <p className="mt-2 text-sm leading-relaxed text-black/50">Who should suppliers and teammates expect to hear from?</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name">
                  <input
                    className={cn(inputClass, attempted && !firstName.trim() && errInput)}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </Field>
                <Field label="Last name">
                  <input
                    className={cn(inputClass, attempted && !lastName.trim() && errInput)}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Job title">
                <Select value={jobTitleOption} onChange={setJobTitleOption} options={JOB_TITLE_OPTIONS} ariaLabel="Job title" />
              </Field>
              {jobTitleOption === "other" && (
                <Field label="Specify job title">
                  <input className={inputClass} value={jobTitleOther} onChange={(e) => setJobTitleOther(e.target.value)} placeholder="e.g. Regional Trade Manager" />
                </Field>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Eyebrow>Understanding your needs</Eyebrow>
                <p className="mt-2 text-sm leading-relaxed text-black/50">A few quick questions so Certrace fits how you actually work.</p>
              </div>

              <Question label="What are you hoping to achieve with Certrace?">
                <SingleSelectCards options={GOAL_ACHIEVE_OPTIONS} value={goalAchieve} onChange={setGoalAchieve} ariaLabel="What are you hoping to achieve with Certrace?" />
                {goalAchieve === OTHER && (
                  <input className={cn(inputClass, "mt-2.5")} value={goalAchieveOther} onChange={(e) => setGoalAchieveOther(e.target.value)} placeholder="Please specify" />
                )}
              </Question>

              <Question label="How are you currently managing CBAM compliance?">
                <SingleSelectCards
                  options={CURRENT_MANAGEMENT_OPTIONS}
                  value={currentManagement}
                  onChange={setCurrentManagement}
                  ariaLabel="How are you currently managing CBAM compliance?"
                />
                {currentManagement === OTHER && (
                  <input className={cn(inputClass, "mt-2.5")} value={currentManagementOther} onChange={(e) => setCurrentManagementOther(e.target.value)} placeholder="Please specify" />
                )}
              </Question>

              <Question label="What is your biggest challenge today?">
                <SingleSelectCards options={BIGGEST_CHALLENGE_OPTIONS} value={biggestChallenge} onChange={setBiggestChallenge} ariaLabel="What is your biggest challenge today?" />
                {biggestChallenge === OTHER && (
                  <input className={cn(inputClass, "mt-2.5")} value={biggestChallengeOther} onChange={(e) => setBiggestChallengeOther(e.target.value)} placeholder="Please specify" />
                )}
              </Question>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Eyebrow>Understanding your business</Eyebrow>
                <p className="mt-2 text-sm leading-relaxed text-black/50">Almost there — this helps us support you at the right scale.</p>
              </div>

              <Question label="Approximately how many suppliers will you manage in Certrace?">
                <SingleSelectCards options={SUPPLIER_COUNT_OPTIONS} value={supplierCount} onChange={setSupplierCount} ariaLabel="Approximately how many suppliers will you manage in Certrace?" />
              </Question>

              <Question label="How did you first hear about Certrace?">
                <SingleSelectCards options={HEAR_ABOUT_OPTIONS} value={hearAbout} onChange={setHearAbout} ariaLabel="How did you first hear about Certrace?" />
                {hearAbout === OTHER && (
                  <input className={cn(inputClass, "mt-2.5")} value={hearAboutOther} onChange={(e) => setHearAboutOther(e.target.value)} placeholder="Please specify" />
                )}
              </Question>

              <Question label="Would you like to help shape Certrace?">
                <MultiSelectCards options={SHAPE_CERTRACE_OPTIONS} values={shapeCertrace} onChange={setShapeCertrace} ariaLabel="Would you like to help shape Certrace?" />
              </Question>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-black/[0.06] pt-6">
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={goBack}>
                <ArrowLeft size={13} strokeWidth={1.5} /> Back
              </Button>
            ) : (
              <span />
            )}

            {step < STEPS.length - 1 ? (
              <Button size="sm" onClick={goNext} disabled={step === 2 && !step3Valid}>
                Continue <ArrowRight size={13} strokeWidth={1.5} />
              </Button>
            ) : (
              <SaveButton state={finishState} onClick={finish} disabled={!step4Valid} idleLabel="Finish setup" savingLabel="Setting up your workspace…" />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
