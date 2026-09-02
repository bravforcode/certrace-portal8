"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Building2, UserRound, Target, BarChart3, Check } from "lucide-react";
import { Card, Button, Field, inputClass, Eyebrow, SaveButton, useSaveState, cn } from "@/components/ui";
import { Select } from "@/components/controls";
import { PhoneField } from "@/components/phone-field";
import { LanguageToggle } from "@/components/lang-toggle";
import { CertraceLogo } from "@/components/logo";
import { useProfile } from "@/lib/profile";
import { PRODUCT_SECTORS } from "@/lib/config";
import { JOB_TITLES, JOB_TITLE_OPTIONS, jobTitleIncomplete, jobTitleValue } from "@/lib/job-titles";
import { useT } from "@/lib/i18n";
import { PREF_KEY, ALL_ON } from "@/lib/notification-prefs";
import { isValidPhone } from "@/lib/dial-codes";

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
  "Prepare for verification",
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
const CBAM_PRODUCT_COUNT_OPTIONS = ["1–5", "6–20", "21–50", "51–100", "More than 100"];
const SUPPLIER_COUNT_OPTIONS = ["1–10", "11–50", "51–200", "201–500", "More than 500"];
const INSTALLATION_COUNT_OPTIONS = ["1", "2–5", "6–10", "11–25", "More than 25"];
const CUSTOMER_COUNT_OPTIONS = ["1–10", "11–50", "51–200", "201–500", "More than 500"];
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

/* Keep a stored answer only if it is one of the real options — anything else
   (the demo fixture's leftovers, a value retired from the list) resolves to
   "" so the field asks instead of pretending to know. */
const preset = (value: string, allowed: string[]) => (allowed.includes(value) ? value : "");

/* "" = not answered yet, a preset title = chosen, "other" = chosen and owes
   a description. A stored free-text title is an answered "other". */
const jobTitleOptionFor = (stored: string) => (JOB_TITLES.includes(stored) ? stored : stored.trim() ? "other" : "");
const jobTitleOtherFor = (stored: string) => (JOB_TITLES.includes(stored) ? "" : stored);

const isAnswered = (value: string, otherText: string) => value !== "" && (value !== OTHER || otherText.trim() !== "");
/* Same rule for the multi-select questions: at least one box ticked, and
   "Other" only counts once it has been written out. */
const isAnsweredMulti = (values: string[], otherText: string) => values.length > 0 && (!values.includes(OTHER) || otherText.trim() !== "");

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
  const t = useT();
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="grid gap-2 sm:grid-cols-2">
      {options.map((opt) => (
        <OptionCard key={opt} role="radio" active={value === opt} onClick={() => onChange(opt)}>
          {t(opt)}
        </OptionCard>
      ))}
    </div>
  );
}

function MultiSelectCards({ options, values, onChange, ariaLabel }: { options: string[]; values: string[]; onChange: (v: string[]) => void; ariaLabel: string }) {
  const t = useT();
  const toggle = (opt: string) => onChange(values.includes(opt) ? values.filter((v) => v !== opt) : [...values, opt]);
  return (
    <div role="group" aria-label={ariaLabel} className="grid gap-2 sm:grid-cols-2">
      {options.map((opt) => (
        <OptionCard key={opt} role="checkbox" active={values.includes(opt)} onClick={() => toggle(opt)}>
          {t(opt)}
        </OptionCard>
      ))}
    </div>
  );
}

function Question({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 text-[13px] text-black/80">
        {label}
        {hint && <span className="ml-2 text-[12px] text-black/35">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const t = useT();
  const { profile, update, loaded } = useProfile();
  const [step, setStep] = React.useState(0);
  const [attempted, setAttempted] = React.useState(false);

  const [companyName, setCompanyName] = React.useState(profile.companyName);
  /* ── Nothing is pre-answered ─────────────────────────────────
     Sector and job title are the two questions here with a closed list, and a
     closed list with a value already in it is not a question — the first
     option sits there looking like an answer and is submitted by everyone who
     is only reading the labels. Both start empty and show a "Select…" prompt,
     and neither is seeded from the profile the way the name fields are: a
     wrong sector reaches the CBAM template, and a wrong job title reaches the
     authorised representative on an installation record. */
  const [sectorId, setSectorId] = React.useState(preset(profile.sector, PRODUCT_SECTORS.map((x) => x.id)));

  const [firstName, setFirstName] = React.useState(profile.firstName);
  const [lastName, setLastName] = React.useState(profile.lastName);
  const [jobTitleOption, setJobTitleOption] = React.useState(jobTitleOptionFor(profile.jobTitle));
  const [jobTitleOther, setJobTitleOther] = React.useState(jobTitleOtherFor(profile.jobTitle));

  /* Page 3 — Understanding Your Needs. All three are multi-select: an
     exporter is usually escaping spreadsheets AND chasing suppliers AND
     preparing for verification at the same time, and a radio button records
     the tidiest of the three rather than the true picture. */
  const [goalAchieve, setGoalAchieve] = React.useState<string[]>([]);
  const [goalAchieveOther, setGoalAchieveOther] = React.useState("");
  const [currentManagement, setCurrentManagement] = React.useState<string[]>([]);
  const [currentManagementOther, setCurrentManagementOther] = React.useState("");
  const [biggestChallenge, setBiggestChallenge] = React.useState<string[]>([]);
  const [biggestChallengeOther, setBiggestChallengeOther] = React.useState("");

  // Page 4 — Understanding Your Business
  const [cbamProductCount, setCbamProductCount] = React.useState("");
  const [supplierCount, setSupplierCount] = React.useState("");
  const [installationCount, setInstallationCount] = React.useState("");
  const [customerCount, setCustomerCount] = React.useState("");
  const [hearAbout, setHearAbout] = React.useState("");
  const [hearAboutOther, setHearAboutOther] = React.useState("");
  const [phone, setPhone] = React.useState(profile.phone ?? "");
  const [lineId, setLineId] = React.useState(profile.lineId ?? "");

  const { state: finishState, run: runFinish } = useSaveState();

  /* Already been through onboarding (or arrived here directly) — nothing to do
     here. Gated on `loaded`: the profile starts as onboarded:true by default
     and only flips after the async localStorage read completes, so checking
     this before `loaded` would bounce a genuinely fresh signup back to
     /dashboard on a hard refresh, before their real onboarded:false loads.

     `finishing` is load-bearing, not defensive: completing the wizard sets
     onboarded:true, which re-runs this effect and would replace the route
     with /dashboard a beat after finish() pushed /onboarding/done — the
     completion page would flash and vanish into the product it says is not
     ready yet. The guard is for people ARRIVING already onboarded, so it
     stands down once we are the ones flipping the flag. */
  const finishing = React.useRef(false);
  React.useEffect(() => {
    if (finishing.current) return;
    if (loaded && profile.onboarded) router.replace("/dashboard");
  }, [loaded, profile.onboarded, router]);

  // The profile loads from localStorage a tick after mount — re-sync the
  // prefilled drafts once that lands (matters if this page is opened fresh,
  // e.g. a hard refresh mid-flow, rather than arriving via the register redirect).
  React.useEffect(() => {
    if (!loaded) return;
    setCompanyName(profile.companyName);
    setSectorId(preset(profile.sector, PRODUCT_SECTORS.map((x) => x.id)));
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setJobTitleOption(jobTitleOptionFor(profile.jobTitle));
    setJobTitleOther(jobTitleOtherFor(profile.jobTitle));
    setPhone(profile.phone ?? "");
    setLineId(profile.lineId ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const sectorOptions = PRODUCT_SECTORS.map((s) => ({ value: s.id, label: s.name }));
  const step1Valid = companyName.trim().length > 0 && sectorId !== "";
  const step2Valid = firstName.trim().length > 0 && lastName.trim().length > 0 && jobTitleOption !== "" && !jobTitleIncomplete(jobTitleOption, jobTitleOther);
  const step3Valid =
    isAnsweredMulti(goalAchieve, goalAchieveOther) &&
    isAnsweredMulti(currentManagement, currentManagementOther) &&
    isAnsweredMulti(biggestChallenge, biggestChallengeOther);
  /* Every question on the last step is required, contact details included —
     the trial is provisioned by a human who has to be able to reach back.

     Which is also why the phone number is CHECKED, not merely non-empty: a
     number that cannot be dialled is worse than a blank one, because "n/a" in
     this box reads as done. See isValidPhone in lib/dial-codes.ts. */
  const phoneTyped = phone.trim() !== "";
  const phoneValid = isValidPhone(phone, "TH");
  const step4Valid =
    cbamProductCount !== "" &&
    supplierCount !== "" &&
    installationCount !== "" &&
    customerCount !== "" &&
    isAnswered(hearAbout, hearAboutOther) &&
    phoneValid &&
    lineId.trim() !== "";

  /* One rule for the whole wizard: the step you are on decides whether
     Continue is alive. It used to be alive on steps 1 and 2 and simply do
     nothing when clicked, which reads as a broken button rather than as an
     unfinished form. */
  const stepValid = [step1Valid, step2Valid, step3Valid, step4Valid][step];

  const goNext = () => {
    if (!stepValid) {
      setAttempted(true);
      return;
    }
    setAttempted(false);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    if (!step1Valid || !step2Valid || !step3Valid || !step4Valid) return;
    finishing.current = true;
    runFinish(() => {
      update({
        companyName,
        sector: sectorId,
        firstName,
        lastName,
        jobTitle: jobTitleValue(jobTitleOption, jobTitleOther),
        goalAchieve: goalAchieve.map((v) => (v === OTHER ? goalAchieveOther : v)),
        currentManagement: currentManagement.map((v) => (v === OTHER ? currentManagementOther : v)),
        biggestChallenge: biggestChallenge.map((v) => (v === OTHER ? biggestChallengeOther : v)),
        cbamProductCount,
        supplierCount,
        installationCount,
        customerCount,
        hearAbout: hearAbout === OTHER ? hearAboutOther : hearAbout,
        phone,
        lineId,
        onboarded: true,
      });
      // Onboarding doesn't ask about notification preferences — everything on by default.
      window.localStorage.setItem(PREF_KEY, JSON.stringify(ALL_ON));
      /* Ends on the completion page, NOT in the product: the account is
         queued for a free trial that a person sets up and confirms by email,
         so a door into the dashboard here would contradict what that page
         says. */
      router.push("/onboarding/done");
    });
  };

  return (
    <div className="min-h-dvh bg-[#f5f4f0] px-6 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-lg">
        {/* The switcher lives here, not in the chrome — /onboarding renders
            before the portal shell exists, so the account-menu one is
            unreachable. Switching re-renders in place: the step and every
            answer already given survive it. See components/lang-toggle.tsx. */}
        {/* Centred wordmark with the toggle pinned right — but only once
            there is room for both. Below sm the two collide (the wordmark is
            ~145px and the toggle ~110px in a 327px line), so the phone gets
            the honest split instead: logo left, toggle right. */}
        <div className="relative flex items-center justify-between sm:justify-center">
          <CertraceLogo className="h-5 w-auto" />
          <LanguageToggle className="sm:absolute sm:right-0" />
        </div>

        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-black/40">
            <span>
              {t("Step {step} of {total}", { step: step + 1, total: STEPS.length })}
            </span>
            <span className="font-pixel text-[10px] uppercase tracking-[0.16em] text-black/45">{t(STEPS[step].label)}</span>
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
                <Eyebrow>{t("Your organisation")}</Eyebrow>
                <p className="mt-2 text-sm leading-relaxed text-black/50">
                  {t("A few details so we can set up your workspace and CBAM template correctly.")}
                </p>
              </div>
              {/* "Company name", the same words Settings uses. One field cannot
                  have two names, and "Legal name" sent people looking for a
                  registry document they did not need to fetch. */}
              <Field label={t("Company name")}>
                <input
                  className={cn(inputClass, attempted && !step1Valid && errInput)}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={t("Siam Steel Export Co.")}
                />
              </Field>
              <Field label={t("Primary sector")} hint={t("Which CBAM-affected industry your organisation reports under.")}>
                <Select
                  value={sectorId}
                  onChange={setSectorId}
                  options={sectorOptions}
                  placeholder={t("Select primary sector")}
                  invalid={attempted && sectorId === ""}
                  ariaLabel={t("Primary sector")}
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <Eyebrow>{t("Your profile")}</Eyebrow>
                <p className="mt-2 text-sm leading-relaxed text-black/50">{t("Who should suppliers and teammates expect to hear from?")}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Same prompts as /register — an empty box under a label
                    reads as optional, and these two are not. */}
                <Field label={t("First name")}>
                  <input
                    className={cn(inputClass, attempted && !firstName.trim() && errInput)}
                    placeholder={t("Enter your first name")}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                </Field>
                <Field label={t("Last name")}>
                  <input
                    className={cn(inputClass, attempted && !lastName.trim() && errInput)}
                    placeholder={t("Enter your last name")}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                </Field>
              </div>
              <Field label={t("Job title")}>
                <Select
                  value={jobTitleOption}
                  onChange={setJobTitleOption}
                  options={JOB_TITLE_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
                  placeholder={t("Select job title")}
                  invalid={attempted && jobTitleOption === ""}
                  ariaLabel={t("Job title")}
                />
              </Field>
              {jobTitleOption === "other" && (
                <Field label={t("Specify job title")}>
                  <input
                    className={cn(inputClass, attempted && jobTitleIncomplete(jobTitleOption, jobTitleOther) && errInput)}
                    value={jobTitleOther}
                    onChange={(e) => setJobTitleOther(e.target.value)}
                    placeholder={t("e.g. Regional Trade Manager")}
                  />
                </Field>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Eyebrow>{t("Understanding your needs")}</Eyebrow>
                <p className="mt-2 text-sm leading-relaxed text-black/50">{t("A few quick questions so Certrace fits how you actually work.")}</p>
              </div>

              <Question label={t("Where can Certrace help you most?")} hint={t("Select all that apply")}>
                <MultiSelectCards options={GOAL_ACHIEVE_OPTIONS} values={goalAchieve} onChange={setGoalAchieve} ariaLabel={t("Where can Certrace help you most?")} />
                {goalAchieve.includes(OTHER) && (
                  <input className={cn(inputClass, "mt-2.5")} value={goalAchieveOther} onChange={(e) => setGoalAchieveOther(e.target.value)} placeholder={t("Please specify")} />
                )}
              </Question>

              <Question label={t("How are you currently managing CBAM compliance?")} hint={t("Select all that apply")}>
                <MultiSelectCards
                  options={CURRENT_MANAGEMENT_OPTIONS}
                  values={currentManagement}
                  onChange={setCurrentManagement}
                  ariaLabel={t("How are you currently managing CBAM compliance?")}
                />
                {currentManagement.includes(OTHER) && (
                  <input className={cn(inputClass, "mt-2.5")} value={currentManagementOther} onChange={(e) => setCurrentManagementOther(e.target.value)} placeholder={t("Please specify")} />
                )}
              </Question>

              <Question label={t("What is your biggest challenge today?")} hint={t("Select all that apply")}>
                <MultiSelectCards options={BIGGEST_CHALLENGE_OPTIONS} values={biggestChallenge} onChange={setBiggestChallenge} ariaLabel={t("What is your biggest challenge today?")} />
                {biggestChallenge.includes(OTHER) && (
                  <input className={cn(inputClass, "mt-2.5")} value={biggestChallengeOther} onChange={(e) => setBiggestChallengeOther(e.target.value)} placeholder={t("Please specify")} />
                )}
              </Question>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Eyebrow>{t("Understanding your business")}</Eyebrow>
                <p className="mt-2 text-sm leading-relaxed text-black/50">{t("Almost there — this helps us support you at the right scale.")}</p>
              </div>

              {/* The scale of the job, in the order it is actually sized:
                  how many goods are in scope, who supplies them, where they
                  are made, and who is waiting for the proof. */}
              <Question label={t("How many of your products fall under CBAM?")}>
                <SingleSelectCards options={CBAM_PRODUCT_COUNT_OPTIONS} value={cbamProductCount} onChange={setCbamProductCount} ariaLabel={t("How many of your products fall under CBAM?")} />
              </Question>

              <Question label={t("Approximately how many suppliers will you manage in Certrace?")}>
                <SingleSelectCards options={SUPPLIER_COUNT_OPTIONS} value={supplierCount} onChange={setSupplierCount} ariaLabel={t("Approximately how many suppliers will you manage in Certrace?")} />
              </Question>

              <Question label={t("How many production installations do you have?")}>
                <SingleSelectCards options={INSTALLATION_COUNT_OPTIONS} value={installationCount} onChange={setInstallationCount} ariaLabel={t("How many production installations do you have?")} />
              </Question>

              <Question label={t("How many customers do you have?")}>
                <SingleSelectCards options={CUSTOMER_COUNT_OPTIONS} value={customerCount} onChange={setCustomerCount} ariaLabel={t("How many customers do you have?")} />
              </Question>

              <Question label={t("How did you first hear about Certrace?")}>
                <SingleSelectCards options={HEAR_ABOUT_OPTIONS} value={hearAbout} onChange={setHearAbout} ariaLabel={t("How did you first hear about Certrace?")} />
                {hearAbout === OTHER && (
                  <input className={cn(inputClass, "mt-2.5")} value={hearAboutOther} onChange={(e) => setHearAboutOther(e.target.value)} placeholder={t("Please specify")} />
                )}
              </Question>

              {/* Both channels, both required. Email alone is how a trial
                  request goes quiet in a spam folder; LINE is where a Thai
                  exporter actually answers, and where our CBAM specialists
                  answer back. */}
              <div className="space-y-4 border-t border-black/[0.06] pt-6">
                <Field label={t("Phone number")} hint={t("Pick your country code, then type the rest of the number.")}>
                  <PhoneField
                    value={phone}
                    onChange={setPhone}
                    country="TH"
                    invalid={phoneTyped && !phoneValid}
                    searchPlaceholder={t("Country or code…")}
                    dialLabel={t("Country calling code")}
                    numberLabel={t("Telephone number")}
                  />
                  {/* Only once something has been typed — an empty box is
                      unfinished, not wrong, and the footer note already says
                      every question here is required. */}
                  {phoneTyped && !phoneValid && (
                    <span className="mt-1.5 block text-xs text-[#dc2626]">{t("Enter a real telephone number — digits only, 6 to 14 of them.")}</span>
                  )}
                </Field>
                <Field label={t("LINE ID")} hint={t("So our CBAM specialists can reach you on LINE.")}>
                  <input className={inputClass} value={lineId} onChange={(e) => setLineId(e.target.value)} placeholder={t("@your-line-id")} />
                </Field>
              </div>
            </div>
          )}

          {step === STEPS.length - 1 && !step4Valid && (
            <p className="mt-6 text-[12px] text-black/35">{t("Every question on this step is required.")}</p>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-black/[0.06] pt-6">
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={goBack}>
                <ArrowLeft size={13} strokeWidth={1.5} /> {t("Back")}
              </Button>
            ) : (
              <span />
            )}

            {step < STEPS.length - 1 ? (
              <Button size="sm" onClick={goNext} disabled={!stepValid}>
                {t("Continue")} <ArrowRight size={13} strokeWidth={1.5} />
              </Button>
            ) : (
              <SaveButton state={finishState} onClick={finish} disabled={!step4Valid} idleLabel={t("Finish setup")} savingLabel={t("Setting up your workspace…")} savedLabel={t("Saved")} />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
