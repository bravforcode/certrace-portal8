"use client";
import { useCompanyDirectory } from "@/lib/team-query";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  UserRound,
  Bell,
  ShieldCheck,
  Copy,
  Check,
  Mail,
  KeyRound,
  Cookie,
  FileText,
  Sparkles,
  Megaphone,
  Scale,
  CreditCard,
  ExternalLink,
  Plus,
  Factory,
} from "lucide-react";
import { InstallationSwitcher } from "@/components/installation-switcher";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  PageHeader,
  Eyebrow,
  Field,
  inputClass,
  Chip,
  Button,
  Switch,
  SaveButton,
  useSaveState,
  cn,
} from "@/components/ui";
import { Select } from "@/components/controls";
import { CookieModal } from "@/components/cookie-modal";
import { USER } from "@/lib/data";
import { PRODUCT_SECTORS } from "@/lib/config";
import { useAccountEmail, useProfile, generateUsername } from "@/lib/profile";
import {
  type PrefKey,
  PREF_DEFAULTS,
  readNotificationPrefs,
  saveNotificationPrefs,
} from "@/lib/notification-prefs";
import { recordEvent } from "@/lib/notifications/events";
import { JOB_TITLES, JOB_TITLE_OPTIONS } from "@/lib/job-titles";
import { useT } from "@/lib/i18n";
import { LEGAL_PRIVACY_URL, LEGAL_TERMS_URL } from "@/lib/links";
import { InstallationModal } from "@/components/workspace/installation-form";
import {
  emptyInstallation,
  missingFields,
  type Installation,
} from "@/lib/installations";
import { listArchivedWorkspaces, listWorkspaces } from "@/lib/workspace";
import { InstallationMenu } from "@/components/workspace/installation-menu";
import { toast } from "@/components/toast";
import {
  useOwnInstallations,
  useRemoveInstallation,
  useSaveInstallation,
} from "@/lib/installations-query";
import { CAP_LABEL } from "@/lib/plan";
import {
  useCaps,
  useInvalidateCaps,
  useInvalidateWorkspaces,
} from "@/lib/workspaces-query";
import { useAccount } from "@/components/account-lock";
import { PlanCapNotice } from "@/components/plan-cap-notice";
import {
  beginGoogleLink,
  changePassword,
  googleSignInEnabled,
  hasCode,
  loadSession,
  onSessionChange,
} from "@/lib/api";

const errInput = "border-[#f87171]/60 focus:border-[#f87171]";

type Tab =
  | "organisation"
  | "installation"
  | "profile"
  | "notifications"
  | "privacy";
const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "organisation", label: "Organisation", icon: Building2 },
  { key: "installation", label: "Installation", icon: Factory },
  { key: "profile", label: "Profile", icon: UserRound },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "privacy", label: "Privacy & security", icon: ShieldCheck },
];

export default function SettingsPage() {
  return (
    <React.Suspense fallback={null}>
      <SettingsPageInner />
    </React.Suspense>
  );
}

function SettingsPageInner() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = React.useState<Tab>("organisation");

  // Reads from the reactive searchParams (not a one-time window.location read),
  // so a Top-bar dropdown Link to /settings?tab=X switches tabs even when
  // we're already sitting on /settings — the App Router doesn't remount this
  // page for a query-string-only navigation, so a mount-only effect would miss it.
  React.useEffect(() => {
    const q = searchParams.get("tab");
    if (
      q === "profile" ||
      q === "notifications" ||
      q === "privacy" ||
      q === "organisation" ||
      q === "installation"
    )
      setTab(q);
  }, [searchParams]);

  const go = (t: Tab) => {
    setTab(t);
    router.replace(`/settings?tab=${t}`, { scroll: false });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("Settings")}
        title={t("Account & organisation.")}
        lead={t(
          "Locale and identity for your organisation, your personal profile, and how Certrace keeps you posted.",
        )}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => go(key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] uppercase tracking-[0.08em] transition-colors",
              tab === key
                ? "border-black/25 bg-[#111] text-white"
                : "border-black/10 text-black/50 hover:border-black/25 hover:text-black",
            )}
          >
            <Icon size={13} strokeWidth={1.5} /> {t(label)}
          </button>
        ))}
      </div>

      <div key={tab} className="ct-enter">
        {tab === "organisation" && <OrganisationTab />}
        {tab === "installation" && (
          <Card className="p-6">
            <Eyebrow>{t("Current installation")}</Eyebrow>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/45">
              {t(
                "Verification shows one installation at a time, and a new product report is filed there. Switch to another site here or from your profile menu.",
              )}
            </p>
            <div className="mt-6 border-t border-black/[0.06] pt-6">
              <InstallationSwitcher />
            </div>
          </Card>
        )}
        {tab === "profile" && <ProfileTab />}
        {tab === "notifications" && <NotificationsTab />}
        {tab === "privacy" && <PrivacyTab />}
      </div>
    </div>
  );
}

/* ── Organisation ─────────────────────────────────────────── */
function OrganisationTab() {
  const t = useT();
  const company = useCompanyDirectory();
  const { profile, update, loaded } = useProfile();
  const [companyName, setCompanyName] = React.useState(profile.companyName);
  const [sectorId, setSectorId] = React.useState(profile.sector);
  const [jurisdiction, setJurisdiction] = React.useState(profile.jurisdiction);
  const { state, run } = useSaveState();

  // The profile loads from localStorage a tick after mount (SSR-hydration-safe),
  // so re-sync these drafts once that load lands — otherwise a component that
  // mounted first keeps showing the hardcoded defaults forever.
  React.useEffect(() => {
    if (!loaded) return;
    setCompanyName(profile.companyName);
    setSectorId(profile.sector);
    setJurisdiction(profile.jurisdiction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const sectorOptions = PRODUCT_SECTORS.map((s) => ({
    value: s.id,
    label: t(s.name),
  }));
  const jurisdictionOptions = [{ value: "TH", label: t("Thailand") }];

  /* NO DISPLAY CURRENCY. It was a two-option dropdown that changed nothing:
     every figure this product exists to produce is in tonnes of CO₂e, and the
     one money field in the workspace — the carbon price paid in the country of
     origin — carries its OWN currency, because it has to be the currency the
     receipt is in and not whatever the account was set to. A preference that
     no screen reads is a preference that will eventually be read by one screen
     and disagree with the receipt. */
  const save = () =>
    run(() => update({ companyName, sector: sectorId, jurisdiction }));

  return (
    <div className="space-y-6">
      {company && !company.isOwner && (
        <Card className="p-6">
          <Eyebrow>{t("Company")}</Eyebrow>
          <p>{company.name}</p>
          <p className="mt-2 text-sm">
            Only the owner can edit the company profile.
          </p>
        </Card>
      )}
      <Card className={company && !company.isOwner ? "hidden" : "p-6"}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Eyebrow>{t("Company")}</Eyebrow>
            <div className="mt-4 space-y-4">
              {/* "Company name" — the same words /onboarding asks it with.
                  One field cannot have two names. */}
              <Field label={t("Company name")}>
                <input
                  className={inputClass}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </Field>
              <Field
                label={t("Primary sector")}
                hint={t(
                  "Which CBAM-affected industry your organisation reports under.",
                )}
              >
                <Select
                  value={sectorId}
                  onChange={setSectorId}
                  options={sectorOptions}
                  ariaLabel={t("Primary sector")}
                />
              </Field>
            </div>
          </div>

          <div>
            <Eyebrow>{t("Locale")}</Eyebrow>
            <div className="mt-4 space-y-4">
              <Field
                label={t("Operating jurisdiction")}
                hint={t(
                  "Sets the localised emission-factor library and number formats.",
                )}
              >
                <Select
                  value={jurisdiction}
                  onChange={setJurisdiction}
                  options={jurisdictionOptions}
                  ariaLabel={t("Operating jurisdiction")}
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-black/[0.06] pt-6">
          <SaveButton
            state={state}
            onClick={save}
            idleLabel={t("Save changes")}
            savingLabel={t("Saving…")}
            savedLabel={t("Saved")}
          />
        </div>
      </Card>

      {/* Between the company card and the plan card, because it is the same
          kind of fact as the ones above it — who you are — and not a
          commercial setting. */}
      <OwnInstallationCard />

      {/* THE PLAN CARD NAMED A TIER THAT DOES NOT EXIST. It said "Growth —
          verifier portal seats", which was wrong twice: there is no Growth
          tier, and there is no verifier portal in this build. It reads the
          real plan now, and states the limits the rest of the product
          enforces rather than a feature line nobody could act on. */}
      <PlanCard />
    </div>
  );
}

/* ── The plan, as a fact about this account ─────────────────
   Settings does not sell. It says which tier the account is on and what that
   entitles it to; the comparison and the sales conversation live on /billing,
   one press away. */
function PlanCard() {
  const t = useT();
  /* Through the context so the card re-renders when the plan resolves on the
     client — see components/account-lock.tsx. */
  const { plan, planId } = useAccount();
  /* Two of the four read localStorage, so all four are measured after mount
     and the row renders as one thing rather than half server, half client —
     the query only resolves on the client. */
  const caps = useCaps().data;
  /* The caps read a plan override that can change while this page stays
     mounted (a demo override landing, the trial re-read); re-measure on the
     change so the row does not sit stale until remount. */
  const invalidateCaps = useInvalidateCaps();
  const lastPlan = React.useRef(planId);
  React.useEffect(() => {
    if (lastPlan.current === planId) return;
    lastPlan.current = planId;
    invalidateCaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  return (
    <Card warm className="p-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <Eyebrow>{t("Plan")}</Eyebrow>
          <p className="mt-2 text-sm text-black/55">
            {t("You're on")} <span className="text-[#111]">{t(plan.name)}</span>{" "}
            — {t(plan.line)}
          </p>
        </div>
        <Link href="/billing" className="flex-none">
          <Button variant="secondary" size="sm">
            {t("Manage plan")}
          </Button>
        </Link>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-black/[0.08] pt-4 sm:grid-cols-4">
        {(caps ? [caps.cnCodes, caps.sites, caps.years, caps.seats] : []).map(
          (c) => (
            <div key={c.key}>
              <dt className="font-pixel text-[10px] uppercase tracking-[0.12em] text-black/40">
                {t(CAP_LABEL[c.key])}
              </dt>
              <dd
                className={cn(
                  "mt-1 font-mono text-[13px] tabular-nums",
                  c.atCap ? "text-[#b45309]" : "text-black/60",
                )}
              >
                {c.cap == null ? t("Unlimited") : c.label}
              </dd>
            </div>
          ),
        )}
      </dl>

      <p className="mt-4 text-[12px] leading-relaxed text-black/40">
        {t(
          "Suppliers and precursor suppliers fill in through their link without limit on every plan, at any chain depth, and never take a seat.",
        )}
      </p>
    </Card>
  );
}

/* ── Your own installations ─────────────────────────────────────
   An exporter who produces the good is the supplier as well, and the portal
   used to have nowhere to say so: they entered their own plant inside a
   workspace as though it were a third party, and again the next year.

   THERE CAN BE MORE THAN ONE, and that is what changed. This card held exactly
   one record — "your installation" — so a company running a billet plant in
   Rayong and a rolling mill in Chonburi could register one of them and had to
   enter the other as a third-party supplier. Its months then went "out" to a
   supplier who was the exporter themselves, and never arrived in their inbox.
   `self` is no longer exclusive (see lib/installations.ts) and this is the
   list, with add and edit on each row.

   The new-workspace flow reads and writes the same store, so a site added in
   either place exists in both.
   ══════════════════════════════════════════════════════════════ */
function OwnInstallationCard() {
  const t = useT();
  const { profile } = useProfile();
  /* A stable draft for "add a site": a new object on every render would reset
     the installation form each time the page re-renders. */
  const newSiteDraft = React.useMemo(
    () => ({
      ...emptyInstallation(true),
      role: profile.productionModel === "oem" ? ("oem" as const) : ("own" as const),
    }),
    [profile.productionModel],
  );
  const own = useOwnInstallations().data;
  /** null = closed · "new" = adding · an Installation = editing that one */
  const [editing, setEditing] = React.useState<Installation | "new" | null>(
    null,
  );
  const saveOwn = useSaveInstallation();
  const removeOwn = useRemoveInstallation();
  /* The site cap counts these very installations, so every add/remove also
     re-measures the caps living under the workspaces key. */
  const invalidateCaps = useInvalidateWorkspaces();

  /* INSTALLATIONS ARE A TERM OF THE PLAN — Starter has one, Standard two,
     Enterprise three. A SUPPLIER'S plant is not one of these and
     is never counted: suppliers fill in without limit on every plan. */
  const cap = useCaps().data?.sites;

  if (!own || !cap) return null;

  /* Every product report that still names a site, archived ones too — they read
     the site's record exactly as the active ones do. */
  const reportsOf = (id: string) =>
    [...listWorkspaces(), ...listArchivedWorkspaces()].filter(
      (w) => w.installationId === id,
    ).length;

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Eyebrow>{t("Your installations")}</Eyebrow>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-black/55">
            {/* THREE WHOLE SENTENCES, not one with a noun phrase dropped into
                it. Interpolating "5 sites" left the Thai reading
                "…ครอบคลุม5 โรงงาน" — Thai sets no space between words but does
                take one before a Latin numeral, and a fragment assembled in
                English word order cannot know that. Each form is written out
                in each language instead. */}
            {cap.cap == null
              ? t(
                  "Every site you operate yourself. Register them here once and their monthly data lands in your inbox instead of going out to a supplier. Add as many as you run.",
                )
              : cap.cap === 1
                ? t(
                    "Every site you operate yourself. Register them here once and their monthly data lands in your inbox instead of going out to a supplier. Your plan covers one site.",
                  )
                : t(
                    "Every site you operate yourself. Register them here once and their monthly data lands in your inbox instead of going out to a supplier. Your plan covers {cap} sites.",
                    { cap: cap.cap },
                  )}
          </p>
        </div>
        <div className="flex flex-none items-center gap-3">
          {cap.cap != null && (
            <span
              className={cn(
                "font-mono text-[12px] tabular-nums",
                cap.atCap ? "text-[#b45309]" : "text-black/40",
              )}
            >
              {cap.label}
            </span>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditing("new")}
            disabled={cap.atCap}
          >
            <Plus size={13} strokeWidth={1.5} />{" "}
            {own.length ? t("Add a site") : t("Register your installation")}
          </Button>
        </div>
      </div>

      <PlanCapNotice cap={cap} className="mt-5" />

      {own.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-black/10 px-4 py-5 text-center text-[13px] text-black/40">
          {t(
            "No sites registered yet. If you produce the good yourself, add the plant that makes it.",
          )}
        </p>
      ) : (
        <div className="mt-5 space-y-2.5">
          {own.map((i) => {
            const gaps = missingFields(i);
            return (
              <div
                key={i.id}
                className="rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Building2
                        size={14}
                        strokeWidth={1.5}
                        className="flex-none text-black/40"
                      />
                      <span className="truncate text-[14px] text-black/85">
                        {i.name}
                      </span>
                      <span className="font-mono text-[11px] text-black/40">
                        {i.id}
                      </span>
                    </div>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-black/50">
                      {[i.street, i.city, i.postcode, i.country]
                        .filter(Boolean)
                        .join(", ") || t("No address yet.")}
                    </p>
                    {/* Named, not counted. "3 fields missing" sends the reader
                        back into the form to find out which. */}
                    {gaps.length > 0 && (
                      <p className="mt-2 text-[12px] leading-relaxed text-[#b45309]">
                        {t("Still missing:")} {gaps.join(", ")}.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-none items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(i)}
                      className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-[11px] uppercase tracking-[0.08em] text-black/55 transition-colors hover:border-black/25 hover:text-black"
                    >
                      {t("Edit")}
                    </button>
                    {/* THE ⋯ MENU, NOT A BARE ✕. A lone, unlabelled cross beside
                        Edit reads as "close this row", and it was the control
                        that deletes the site. Removal now sits in the same menu
                        the Verification page uses for the same site, last and
                        red, armed by the first click. It is disabled while a
                        product report still names the site — removing the
                        record would take the operator details and the monitoring
                        plan out from under it. */}
                    <InstallationMenu
                      installationId={i.id}
                      name={i.name}
                      remove={{
                        reports: reportsOf(i.id),
                        onRemove: () =>
                          removeOwn.mutate(i.id, {
                            onSuccess: () => {
                              invalidateCaps();
                              toast({
                                message: t("Site removed"),
                                detail: t(
                                  "{name} is off your list. Nothing else was deleted.",
                                  { name: i.name || i.id },
                                ),
                                tone: "info",
                              });
                            },
                          }),
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDITING an existing site is always allowed, even over the cap — an
          account that lands over the line on a downgrade must still be able
          to correct the sites it already has. Only ADDING a new one closes. */}
      <InstallationModal
        open={editing !== null && !(editing === "new" && cap.atCap)}
        onClose={() => setEditing(null)}
        initial={
          editing && editing !== "new"
            ? editing
            : // An OEM answer in onboarding preselects the OEM role for the next site.
              newSiteDraft
        }
        allowSelfToggle={false}
        showRole
        self
        title={editing === "new" ? t("Add a site") : t("Your installation")}
        lead={t(
          "These are the facts a verifier asks for about a producing site. Entered once here, reused by every product report.",
        )}
        onSaved={(saved) => {
          saveOwn.mutate(
            { ...saved, self: true },
            { onSuccess: invalidateCaps },
          );
        }}
      />
    </Card>
  );
}

/* The "Are you a supplier as well?" card is deliberately gone. It asked the
   same question the installation card above already answers — registering your
   own site IS saying you are the supplier — and having both meant two
   different-looking routes to one record, one of which then redirected to the
   Inbox for no reason the reader had asked for. */

/* ── Profile ──────────────────────────────────────────────── */
function ProfileTab() {
  const t = useT();
  const company = useCompanyDirectory();
  const { profile, update, loaded } = useProfile();
  const accountEmail = useAccountEmail();
  const [firstName, setFirstName] = React.useState(profile.firstName);
  const [lastName, setLastName] = React.useState(profile.lastName);
  const isPreset = JOB_TITLES.includes(profile.jobTitle);
  const [jobTitleOption, setJobTitleOption] = React.useState(
    isPreset ? profile.jobTitle : "other",
  );
  const [jobTitleOther, setJobTitleOther] = React.useState(
    isPreset ? "" : profile.jobTitle,
  );
  const { state: profileState, run: runProfile } = useSaveState();

  // See OrganisationTab — re-sync once the async profile load lands.
  React.useEffect(() => {
    if (!loaded) return;
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    const preset = JOB_TITLES.includes(profile.jobTitle);
    setJobTitleOption(preset ? profile.jobTitle : "other");
    setJobTitleOther(preset ? "" : profile.jobTitle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const [copied, setCopied] = React.useState(false);

  const copyId = () => {
    navigator.clipboard?.writeText(USER.accountId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const saveProfile = () =>
    runProfile(() => {
      update({
        firstName,
        lastName,
        jobTitle:
          jobTitleOption === "other"
            ? jobTitleOther || "Other"
            : jobTitleOption,
      });
    });

  return (
    <div className="space-y-6">
      {company && !company.isOwner && (
        <Card className="p-6">
          <Eyebrow>{t("Your profile")}</Eyebrow>
          <p>{accountEmail}</p>
          <Link className="underline" href="/team">
            Switch to your own workspace to edit your profile.
          </Link>
        </Card>
      )}
      <Card className={company && !company.isOwner ? "hidden" : "p-6"}>
        <Eyebrow>{t("Your profile")}</Eyebrow>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t("First name")}>
            <input
              className={inputClass}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </Field>
          <Field label={t("Last name")}>
            <input
              className={inputClass}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Field>
        </div>
        <p className="mt-2 text-[11px] text-black/35">
          {t("Username")}{" "}
          <span className="font-mono text-black/50">
            @{generateUsername(firstName, lastName) || "—"}
          </span>{" "}
          — {t("generated automatically from your name.")}
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label={t("Job title")}>
            <Select
              value={jobTitleOption}
              onChange={setJobTitleOption}
              options={JOB_TITLE_OPTIONS.map((o) => ({
                ...o,
                label: t(o.label),
              }))}
              ariaLabel={t("Job title")}
            />
          </Field>
          {jobTitleOption === "other" && (
            <Field label={t("Specify job title")}>
              <input
                className={inputClass}
                value={jobTitleOther}
                onChange={(e) => setJobTitleOther(e.target.value)}
                placeholder={t("e.g. Regional Trade Manager")}
              />
            </Field>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <SaveButton
            state={profileState}
            onClick={saveProfile}
            idleLabel={t("Save profile")}
            savingLabel={t("Saving…")}
            savedLabel={t("Saved")}
          />
        </div>
      </Card>

      <Card className="p-6">
        <Eyebrow>{t("Account identity")}</Eyebrow>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-black/[0.08] bg-[#faf9f7] px-4 py-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.08em] text-black/40">
              {t("Account ID")}
            </div>
            <div className="font-mono text-[13px] text-black/70">
              {USER.accountId}
            </div>
          </div>
          <button
            onClick={copyId}
            className="inline-flex flex-none items-center gap-1.5 rounded-xl border border-black/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] text-black/55 hover:border-black/25 hover:text-black"
          >
            {copied ? (
              <Check size={13} strokeWidth={1.5} className="text-[#047857]" />
            ) : (
              <Copy size={13} strokeWidth={1.5} />
            )}
            {copied ? t("Copied") : t("Copy")}
          </button>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-black/40">
          {t(
            "This ID is permanent and never changes — your declarations, suppliers and seats stay attached to it even if the email below changes. If the person who set up this account leaves the company, ownership can move to a new email without losing any history.",
          )}
        </p>
        <div className="mt-3 flex items-center justify-between text-[12px] text-black/40">
          <span>{t("Member since")}</span>
          <span className="text-black/60">{USER.memberSince}</span>
        </div>
      </Card>

      <Card className="p-6">
        <Eyebrow>{t("Email address")}</Eyebrow>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-black/[0.08] px-4 py-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-black/10 text-black/45">
            <Mail size={15} strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] text-black/75">
              {accountEmail || "—"}
            </div>
            <div className="text-[11px] text-black/35">
              {t("Primary — used to sign in and receive alerts.")}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ── Notifications ────────────────────────────────────────── */
const PREF_ROWS: {
  key: PrefKey;
  icon: React.ElementType;
  title: string;
  body: string;
  locked?: boolean;
}[] = [
  {
    key: "security",
    icon: ShieldCheck,
    title: "Security",
    body: "Account activity that matters — sign-ins, password changes and security alerts.",
    locked: true,
  },
  {
    key: "declarations",
    icon: Building2,
    title: "Declarations",
    body: "Updates on declaration progress, approvals, revisions and reporting deadlines.",
  },
  {
    key: "suppliers",
    icon: UserRound,
    title: "Suppliers",
    body: "When a supplier is invited, submits their data, or needs a follow-up.",
  },
  {
    key: "ai_review",
    icon: Sparkles,
    title: "AI Review & Compliance",
    body: "When AI flags an issue, finishes validating a submission, or compliance action is needed.",
  },
  {
    key: "documents",
    icon: FileText,
    title: "Documents",
    body: "Missing, uploaded, approved, rejected or expiring documents.",
  },
  {
    key: "regulation",
    icon: Scale,
    title: "CBAM news",
    body: "Rule changes, new certificate prices and the dates that matter — as Certrace has them.",
  },
  {
    key: "billing",
    icon: CreditCard,
    title: "Plan & billing",
    body: "Your trial, the limits of your plan and anything that needs your attention on it.",
  },
  {
    key: "product",
    icon: Megaphone,
    title: "Product updates",
    body: "New features, improvements and platform announcements.",
  },
];

function NotificationsTab() {
  const t = useT();
  const [prefs, setPrefs] =
    React.useState<Record<PrefKey, boolean>>(PREF_DEFAULTS);

  React.useEffect(() => {
    setPrefs(readNotificationPrefs());
  }, []);

  const toggle = (key: PrefKey, value: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      saveNotificationPrefs(next);
      return next;
    });
  };

  return (
    <Card className="divide-y divide-black/[0.06] p-0">
      {PREF_ROWS.map(({ key, icon: Icon, title, body, locked }) => (
        <div
          key={key}
          className="flex items-start justify-between gap-4 px-6 py-5"
        >
          <div className="flex items-start gap-3.5">
            <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl border border-black/10 text-black/45">
              <Icon size={16} strokeWidth={1.5} />
            </span>
            <div>
              <div className="text-[13px] text-black/80">{t(title)}</div>
              <p className="mt-1 max-w-md text-[12px] leading-relaxed text-black/40">
                {t(body)}
              </p>
              {locked && (
                <p className="mt-1 text-[11px] uppercase tracking-[0.06em] text-black/30">
                  {t("Always on — protects your account")}
                </p>
              )}
            </div>
          </div>
          <Switch
            checked={prefs[key]}
            onChange={(v) => toggle(key, v)}
            disabled={locked}
            ariaLabel={t(title)}
          />
        </div>
      ))}
    </Card>
  );
}

/* ── Privacy & security ───────────────────────────────────── */
function PrivacyTab() {
  const t = useT();
  const accountEmail = useAccountEmail();
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [touched, setTouched] = React.useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [cookiesOpen, setCookiesOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [updated, setUpdated] = React.useState(false);
  const [wrongPassword, setWrongPassword] = React.useState(false);
  const [error, setError] = React.useState(false);

  const currentValid = current.trim().length > 0;
  const nextValid = next.length >= 8;
  const confirmValid = confirm.length > 0 && confirm === next;
  const canUpdate = currentValid && nextValid && confirmValid;
  const mismatch = touched.confirm && confirm.length > 0 && confirm !== next;

  const attemptUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate) {
      setTouched({ current: true, next: true, confirm: true });
      return;
    }
    if (saving) return;
    setSaving(true);
    setError(false);
    setWrongPassword(false);
    setUpdated(false);
    try {
      await changePassword({
        email: accountEmail,
        currentPassword: current,
        newPassword: next,
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      setTouched({ current: false, next: false, confirm: false });
      recordEvent("password_changed");
      setUpdated(true);
    } catch (cause) {
      setWrongPassword(hasCode(cause, "INVALID_CREDENTIALS"));
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {googleSignInEnabled() && <GoogleConnectCard />}

      <Card className="p-6">
        <Eyebrow>{t("Change password")}</Eyebrow>
        <form
          onSubmit={attemptUpdate}
          noValidate
          className="mt-4 grid gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <Field label={t("Current password")}>
              <input
                className={cn(
                  inputClass,
                  ((touched.current && !currentValid) || wrongPassword) &&
                    errInput,
                )}
                type="password"
                value={current}
                onChange={(e) => {
                  setCurrent(e.target.value);
                  setUpdated(false);
                  setWrongPassword(false);
                  setError(false);
                }}
                onBlur={() => setTouched((t) => ({ ...t, current: true }))}
                placeholder="••••••••"
              />
              {wrongPassword && (
                <span className="mt-1.5 block text-xs text-[#dc2626]">
                  {t("That password isn't correct.")}
                </span>
              )}
            </Field>
          </div>
          <Field label={t("New password")}>
            <input
              className={cn(inputClass, touched.next && !nextValid && errInput)}
              type="password"
              value={next}
              onChange={(e) => {
                setNext(e.target.value);
                setUpdated(false);
              }}
              onBlur={() => setTouched((t) => ({ ...t, next: true }))}
              placeholder={t("At least 8 characters")}
            />
          </Field>
          <Field label={t("Confirm new password")}>
            <input
              className={cn(inputClass, mismatch && errInput)}
              type="password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setUpdated(false);
              }}
              onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
              placeholder={t("Re-enter new password")}
            />
          </Field>
          {mismatch && (
            <span className="sm:col-span-2 text-xs text-[#dc2626]">
              {t("Passwords don't match.")}
            </span>
          )}
          {error && !wrongPassword && (
            <span className="sm:col-span-2 text-xs text-[#dc2626]">
              {t("Could not update password. Please try again.")}
            </span>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={!canUpdate || saving}>
              <KeyRound size={13} strokeWidth={1.5} />
              {saving
                ? t("Updating…")
                : updated
                  ? t("Updated")
                  : t("Update password")}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <Eyebrow>{t("Cookies")}</Eyebrow>
        <div className="mt-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="max-w-md text-[13px] leading-relaxed text-black/50">
            {t(
              "Configure how cookies are used across the platform — essential cookies keep you signed in; the rest are optional.",
            )}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCookiesOpen(true)}
          >
            <Cookie size={13} strokeWidth={1.5} /> {t("Manage cookies")}
          </Button>
        </div>
      </Card>

      {/* THE PUBLISHED DOCUMENTS, not the in-app /legal/* copies. What a
          customer agreed to is what is on certrace.co on the day they read
          it, and a second copy inside the build is a second version to keep
          in step — one that silently goes stale the first time the published
          text is amended. The same two constants back the sign-up consent
          copy, so the terms somebody accepts at registration and the terms
          they can re-read from Settings can never drift apart. */}
      <Card className="p-6">
        <Eyebrow>{t("Legal")}</Eyebrow>
        <div className="mt-4 divide-y divide-black/[0.06]">
          <LegalRow
            href={LEGAL_TERMS_URL}
            icon={FileText}
            title={t("Terms & Conditions")}
            body={t(
              "Review the terms and conditions for using the platform and its services.",
            )}
          />
          <LegalRow
            href={LEGAL_PRIVACY_URL}
            icon={ShieldCheck}
            title={t("Privacy Policy")}
            body={t(
              "Learn how your personal data is collected, used and protected in accordance with applicable laws.",
            )}
          />
        </div>
      </Card>

      {cookiesOpen && <CookieModal onClose={() => setCookiesOpen(false)} />}
    </div>
  );
}

/* ── Connect Google ───────────────────────────────────────────────
   For an account that signs in with a password and wants Google as a second
   way in. Connecting from HERE keeps the password — the person has proved
   both the password (they are signed in with it) and the mailbox (Google
   verifies the same address). Choosing Google on /login instead, for an
   address that already has a password account, retires the password: that
   path cannot tell the owner from whoever registered the address first. The
   copy says so, because it is the one thing about the two buttons a person
   would otherwise find out by losing a password.

   The state comes from the stored session (`googleLinked`, which the backend
   sends on every sign-in and on the link itself), read as primitives so
   useSyncExternalStore gets a stable snapshot. */
function GoogleConnectCard() {
  const t = useT();
  const searchParams = useSearchParams();
  const linked = React.useSyncExternalStore(
    onSessionChange,
    () => loadSession()?.user.googleLinked === true,
    () => false,
  );
  const email = React.useSyncExternalStore(
    onSessionChange,
    () => loadSession()?.user.email ?? "",
    () => "",
  );
  const [leaving, setLeaving] = React.useState(false);
  const justConnected = searchParams.get("google") === "connected";

  return (
    <Card className="p-6">
      <Eyebrow>{t("Sign-in with Google")}</Eyebrow>
      <div className="mt-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="max-w-md">
          {linked ? (
            <p className="text-[13px] leading-relaxed text-black/60">
              {t(
                "Your Google account {email} is connected. You can sign in with Google or with your password.",
                { email },
              )}
            </p>
          ) : (
            <p className="text-[13px] leading-relaxed text-black/60">
              {t(
                "Connect the Google account for {email} to sign in with one click. Your password keeps working.",
                { email },
              )}
            </p>
          )}
          {justConnected && linked && (
            <p className="mt-2 text-[12px] text-[#047857]">
              {t("Google connected.")}
            </p>
          )}
        </div>
        {linked ? (
          <Chip tone="ok">{t("Connected")}</Chip>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled={leaving || !email}
            onClick={() => {
              setLeaving(true);
              beginGoogleLink(email);
            }}
          >
            {leaving ? t("Connecting…") : t("Connect Google")}
          </Button>
        )}
      </div>
    </Card>
  );
}

function LegalRow({
  href,
  icon: Icon,
  title,
  body,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  body: string;
}) {
  /* An off-site destination, so a plain <a> with `noopener noreferrer`
     rather than next/link — there is no client-side route to prefetch, and
     the new tab must not be handed a window.opener onto the portal. */
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="-mx-3 flex items-center gap-3.5 rounded-xl px-3 py-3.5 transition-colors hover:bg-[#fafaf8]"
    >
      <span className="grid h-9 w-9 flex-none place-items-center rounded-xl border border-black/10 text-black/45">
        <Icon size={16} strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-black/75">{title}</div>
        <div className="mt-0.5 text-[12px] leading-relaxed text-black/40">
          {body}
        </div>
      </div>
      <ExternalLink
        size={14}
        strokeWidth={1.5}
        className="flex-none text-black/25"
      />
    </a>
  );
}
