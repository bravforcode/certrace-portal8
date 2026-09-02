"use client";

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
  Monitor,
  Smartphone,
  Cookie,
  FileText,
  Sparkles,
  Megaphone,
  ExternalLink,
  Plus,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, PageHeader, Eyebrow, Field, inputClass, Chip, Button, Switch, SaveButton, useSaveState, cn } from "@/components/ui";
import { Select, Portal } from "@/components/controls";
import { USER } from "@/lib/data";
import { PRODUCT_SECTORS } from "@/lib/config";
import { useProfile, generateUsername } from "@/lib/profile";
import { type PrefKey, PREF_KEY } from "@/lib/notification-prefs";
import { JOB_TITLES, JOB_TITLE_OPTIONS } from "@/lib/job-titles";
import { useT } from "@/lib/i18n";
import { LEGAL_PRIVACY_URL, LEGAL_TERMS_URL } from "@/lib/links";
import { InstallationModal } from "@/components/workspace/installation-form";
import { emptyInstallation, missingFields, ownInstallations, removeInstallation, saveInstallation, type Installation } from "@/lib/installations";
import { siteCap } from "@/lib/plan";
import { PlanCapNotice } from "@/components/plan-cap-notice";
import { OWNER_NAME, OWNER_REMEDY } from "@/lib/seat";

// Mock "the only password that verifies" — matches the pre-filled demo
// password on /login, since there's no real auth backend in this MVP.
const MOCK_PASSWORD = "demo-password";
const errInput = "border-[#f87171]/60 focus:border-[#f87171]";

type Tab = "organisation" | "profile" | "notifications" | "privacy";
const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "organisation", label: "Organisation", icon: Building2 },
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
    if (q === "profile" || q === "notifications" || q === "privacy" || q === "organisation") setTab(q);
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
        lead={t("Locale and identity for your organisation, your personal profile, and how Certrace keeps you posted.")}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => go(key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] uppercase tracking-[0.08em] transition-colors",
              tab === key ? "border-black/25 bg-[#111] text-white" : "border-black/10 text-black/50 hover:border-black/25 hover:text-black",
            )}
          >
            <Icon size={13} strokeWidth={1.5} /> {t(label)}
          </button>
        ))}
      </div>

      <div key={tab} className="ct-enter">
        {tab === "organisation" && <OrganisationTab />}
        {tab === "profile" && <ProfileTab />}
        {tab === "notifications" && <NotificationsTab />}
        {tab === "privacy" && <PrivacyTab />}
      </div>
    </div>
  );
}

/* ── Organisation ───────────────────────────────────────────
   THE TAB SURVIVES BUT IT SPLIT IN TWO, because the owner build had three
   unrelated things stacked in it and only one of them is a member's.

     · WHO THE COMPANY IS — its registered name, sector and jurisdiction.
       These are the identity a verifier and a customs authority read, and
       lib/seat.ts gives `editOrganisation` to the owner alone. Shown here,
       read-only: a member has to be able to CHECK that the name on the pack
       is right, and to say so to somebody, without being able to change it
       themselves at 6pm on a filing day.

     · YOUR OWN SITES — kept, and fully editable. A member cannot build a
       workspace without an installation to attach it to, so registering the
       plant they are reporting is not an account setting, it is the first
       step of the job. The site cap still bites; the notice on it now names
       the owner instead of sales (components/plan-cap-notice.tsx).

     · THE PLAN CARD — gone, with its "Manage plan" button to /billing. It
       stated four caps and a tier name, none of which this seat can move. */
function OrganisationTab() {
  const t = useT();
  const { profile, loaded } = useProfile();
  const [companyName, setCompanyName] = React.useState(profile.companyName);
  const [sectorId, setSectorId] = React.useState(profile.sector);
  const [jurisdiction, setJurisdiction] = React.useState(profile.jurisdiction);

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

  const sectorName = PRODUCT_SECTORS.find((x) => x.id === sectorId)?.name ?? sectorId;
  const jurisdictionName = jurisdiction === "TH" ? "Thailand" : jurisdiction;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <Eyebrow>{t("Company")}</Eyebrow>
          <p className="text-[12px] text-black/40">{t(OWNER_REMEDY, { owner: OWNER_NAME })}</p>
        </div>

        {/* A definition list, not disabled inputs. A greyed-out field that
            can be focused and typed into and then silently refuses to save
            is worse than a plain statement of fact: it invites the edit and
            then loses it. This reads as what it is — the record. */}
        <dl className="mt-5 grid gap-x-8 gap-y-5 border-t border-black/[0.08] pt-5 sm:grid-cols-2">
          <div>
            <dt className="font-pixel text-[10px] uppercase tracking-[0.12em] text-black/40">{t("Company name")}</dt>
            <dd className="mt-1.5 text-sm text-black/70">{companyName}</dd>
          </div>
          <div>
            <dt className="font-pixel text-[10px] uppercase tracking-[0.12em] text-black/40">{t("Primary sector")}</dt>
            <dd className="mt-1.5 text-sm text-black/70">{t(sectorName)}</dd>
            <p className="mt-1 text-[12px] leading-relaxed text-black/40">{t("Which CBAM-affected industry your organisation reports under.")}</p>
          </div>
          <div>
            <dt className="font-pixel text-[10px] uppercase tracking-[0.12em] text-black/40">{t("Operating jurisdiction")}</dt>
            <dd className="mt-1.5 text-sm text-black/70">{t(jurisdictionName)}</dd>
            <p className="mt-1 text-[12px] leading-relaxed text-black/40">{t("Sets the localised emission-factor library and number formats.")}</p>
          </div>
        </dl>

        <p className="mt-5 border-t border-black/[0.06] pt-4 text-[12px] leading-relaxed text-black/40">
          {t("This is the name and sector that appear on every pack you send. If any of it is wrong, tell {owner} before the next filing goes out — it is on the documents a verifier reads first.", { owner: OWNER_NAME })}
        </p>
      </Card>

      {/* Yours. Registering the plant you report is the first step of the
          job, not an account setting — see the note above. */}
      <OwnInstallationCard />
    </div>
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
  const [own, setOwn] = React.useState<Installation[]>([]);
  /** null = closed · "new" = adding · an Installation = editing that one */
  const [editing, setEditing] = React.useState<Installation | "new" | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [removing, setRemoving] = React.useState<string | null>(null);

  const reload = React.useCallback(() => setOwn(ownInstallations()), []);

  React.useEffect(() => {
    reload();
    setLoaded(true);
  }, [reload]);

  if (!loaded) return null;

  /* PRODUCTION SITES ARE A TERM OF THE PLAN — Starter buys one, Standard five,
     Enterprise as many as it runs. A SUPPLIER'S plant is not one of these and
     is never counted: suppliers are free and unlimited on every tier. */
  const cap = siteCap();

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
              ? t("Every site you operate yourself. Register them here once and their monthly data lands in your inbox instead of going out to a supplier. Add as many as you run.")
              : cap.cap === 1
                ? t("Every site you operate yourself. Register them here once and their monthly data lands in your inbox instead of going out to a supplier. Your plan covers one site.")
                : t(
                    "Every site you operate yourself. Register them here once and their monthly data lands in your inbox instead of going out to a supplier. Your plan covers {cap} sites.",
                    { cap: cap.cap },
                  )}
          </p>
        </div>
        <div className="flex flex-none items-center gap-3">
          {cap.cap != null && (
            <span className={cn("font-mono text-[12px] tabular-nums", cap.atCap ? "text-[#b45309]" : "text-black/40")}>{cap.label}</span>
          )}
          <Button variant="secondary" size="sm" onClick={() => setEditing("new")} disabled={cap.atCap}>
            <Plus size={13} strokeWidth={1.5} /> {own.length ? t("Add a site") : t("Register your installation")}
          </Button>
        </div>
      </div>

      <PlanCapNotice cap={cap} className="mt-5" />

      {own.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-black/10 px-4 py-5 text-center text-[13px] text-black/40">
          {t("No sites registered yet. If you produce the good yourself, add the plant that makes it.")}
        </p>
      ) : (
        <div className="mt-5 space-y-2.5">
          {own.map((i) => {
            const gaps = missingFields(i);
            return (
              <div key={i.id} className="rounded-xl border border-black/[0.07] bg-[#faf9f7] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Building2 size={14} strokeWidth={1.5} className="flex-none text-black/40" />
                      <span className="truncate text-[14px] text-black/85">{i.name}</span>
                      <span className="font-mono text-[11px] text-black/40">{i.id}</span>
                    </div>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-black/50">
                      {[i.street, i.city, i.postcode, i.country].filter(Boolean).join(", ") || t("No address yet.")}
                      {i.economicActivity ? ` · ${i.economicActivity}` : ""}
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
                    {/* Two-press. Removing a site does NOT delete the
                        workspaces that name it — those keep their denormalised
                        installation name and reference, exactly as a workspace
                        handed to a verifier must. */}
                    <button
                      type="button"
                      onClick={() => {
                        if (removing !== i.id) {
                          setRemoving(i.id);
                          return;
                        }
                        removeInstallation(i.id);
                        setRemoving(null);
                        reload();
                      }}
                      onBlur={() => setRemoving((r) => (r === i.id ? null : r))}
                      aria-label={t("Remove {name}", { name: i.name })}
                      title={removing === i.id ? t("Click again to remove") : t("Remove this site")}
                      className={
                        removing === i.id
                          ? "rounded-lg border border-[#dc2626]/40 px-2.5 py-1.5 text-[11px] uppercase tracking-[0.08em] text-[#dc2626]"
                          : "grid h-8 w-8 place-items-center rounded-lg text-black/30 transition-colors hover:bg-black/[0.05] hover:text-[#dc2626]"
                      }
                    >
                      {removing === i.id ? t("Confirm") : <X size={15} strokeWidth={1.5} />}
                    </button>
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
        initial={editing && editing !== "new" ? editing : emptyInstallation(true)}
        allowSelfToggle={false}
        self
        title={editing === "new" ? t("Add a site") : t("Your installation")}
        lead={t("These are the facts a verifier asks for about a producing site. Entered once here, reused by every workspace.")}
        onSaved={(saved) => {
          saveInstallation({ ...saved, self: true });
          reload();
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
  const { profile, update, loaded } = useProfile();
  const [firstName, setFirstName] = React.useState(profile.firstName);
  const [lastName, setLastName] = React.useState(profile.lastName);
  const isPreset = JOB_TITLES.includes(profile.jobTitle);
  const [jobTitleOption, setJobTitleOption] = React.useState(isPreset ? profile.jobTitle : "other");
  const [jobTitleOther, setJobTitleOther] = React.useState(isPreset ? "" : profile.jobTitle);
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

  const [changingEmail, setChangingEmail] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState<string | null>(null);
  const [newEmail, setNewEmail] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [touched, setTouched] = React.useState({ email: false, pw: false });
  const [sending, setSending] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim());
  const pwValid = pw === MOCK_PASSWORD;
  const canSendVerification = emailValid && pwValid;

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
        jobTitle: jobTitleOption === "other" ? jobTitleOther || "Other" : jobTitleOption,
      });
    });

  const sendVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSendVerification) {
      setTouched({ email: true, pw: true });
      return;
    }
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setEmailSent(newEmail);
      setChangingEmail(false);
      setPw("");
      setTouched({ email: false, pw: false });
    }, 700);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <Eyebrow>{t("Your profile")}</Eyebrow>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t("First name")}>
            <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label={t("Last name")}>
            <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
        </div>
        <p className="mt-2 text-[11px] text-black/35">
          {t("Username")} <span className="font-mono text-black/50">@{generateUsername(firstName, lastName) || "—"}</span> — {t("generated automatically from your name.")}
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label={t("Job title")}>
            <Select value={jobTitleOption} onChange={setJobTitleOption} options={JOB_TITLE_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))} ariaLabel={t("Job title")} />
          </Field>
          {jobTitleOption === "other" && (
            <Field label={t("Specify job title")}>
              <input className={inputClass} value={jobTitleOther} onChange={(e) => setJobTitleOther(e.target.value)} placeholder={t("e.g. Regional Trade Manager")} />
            </Field>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <SaveButton state={profileState} onClick={saveProfile} idleLabel={t("Save profile")} savingLabel={t("Saving…")} savedLabel={t("Saved")} />
        </div>
      </Card>

      <Card className="p-6">
        <Eyebrow>{t("Account identity")}</Eyebrow>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-black/[0.08] bg-[#faf9f7] px-4 py-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.08em] text-black/40">{t("Account ID")}</div>
            <div className="font-mono text-[13px] text-black/70">{USER.accountId}</div>
          </div>
          <button
            onClick={copyId}
            className="inline-flex flex-none items-center gap-1.5 rounded-xl border border-black/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] text-black/55 hover:border-black/25 hover:text-black"
          >
            {copied ? <Check size={13} strokeWidth={1.5} className="text-[#047857]" /> : <Copy size={13} strokeWidth={1.5} />}
            {copied ? t("Copied") : t("Copy")}
          </button>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-black/40">
          {t("This ID is permanent and never changes — your declarations, suppliers and seats stay attached to it even if the email below changes. If the person who set up this account leaves the company, ownership can move to a new email without losing any history.")}
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
            <div className="truncate text-[13px] text-black/75">{USER.email}</div>
            <div className="text-[11px] text-black/35">{t("Primary — used to sign in and receive alerts.")}</div>
          </div>
        </div>

        {emailSent && (
          <div className="mt-3 rounded-xl border border-[rgba(96,165,250,0.25)] bg-[#eff6ff] px-4 py-3 text-[12px] leading-relaxed text-[#2563eb]">
            {t("Verification sent to")} <span className="font-medium">{emailSent}</span>. {t("Click the link there to finish the switch — nothing changes until you confirm, and your account, history and org access stay exactly the same.")}
          </div>
        )}

        {!changingEmail ? (
          <button
            onClick={() => setChangingEmail(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3.5 py-2 text-[11px] uppercase tracking-[0.08em] text-black/55 hover:border-black/25 hover:text-black"
          >
            {t("Change email")}
          </button>
        ) : (
          <form onSubmit={sendVerification} noValidate className="mt-4 space-y-3 border-t border-black/[0.06] pt-4">
            <Field label={t("New email")}>
              <input
                className={cn(inputClass, touched.email && !emailValid && errInput)}
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                placeholder={t("new@company.com")}
              />
            </Field>
            <Field label={t("Confirm current password")} hint={t("For your security, we verify it's really you before changing anything.")}>
              <input
                className={cn(inputClass, touched.pw && !pwValid && errInput)}
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, pw: true }))}
                placeholder="••••••••"
              />
              {touched.pw && pw.length > 0 && !pwValid && <span className="mt-1.5 block text-xs text-[#dc2626]">{t("That password isn't correct.")}</span>}
            </Field>
            <div className="flex items-center gap-2">
              <Button size="sm" type="submit" disabled={sending} className={cn(!canSendVerification && !sending && "opacity-40")}>
                {sending ? t("Sending…") : t("Send verification")}
              </Button>
              <Button size="sm" type="button" variant="ghost" onClick={() => setChangingEmail(false)}>
                {t("Cancel")}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

/* ── Notifications ────────────────────────────────────────── */
const PREF_DEFAULTS: Record<PrefKey, boolean> = { declarations: true, suppliers: true, ai_review: true, documents: true, security: true, product: false };

const PREF_ROWS: { key: PrefKey; icon: React.ElementType; title: string; body: string; locked?: boolean }[] = [
  { key: "security", icon: ShieldCheck, title: "Security", body: "Account activity that matters — sign-ins, password changes and security alerts.", locked: true },
  { key: "declarations", icon: Building2, title: "Declarations", body: "Updates on declaration progress, approvals, revisions and reporting deadlines." },
  { key: "suppliers", icon: UserRound, title: "Suppliers", body: "When a supplier is invited, submits their data, or needs a follow-up." },
  { key: "ai_review", icon: Sparkles, title: "AI Review & Compliance", body: "When AI flags an issue, finishes validating a submission, or compliance action is needed." },
  { key: "documents", icon: FileText, title: "Documents", body: "Missing, uploaded, approved, rejected or expiring documents." },
  { key: "product", icon: Megaphone, title: "Product updates", body: "New features, improvements and platform announcements." },
];

function NotificationsTab() {
  const t = useT();
  const [prefs, setPrefs] = React.useState<Record<PrefKey, boolean>>(PREF_DEFAULTS);

  React.useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(PREF_KEY) ?? "null");
      if (saved) setPrefs({ ...PREF_DEFAULTS, ...saved });
    } catch {
      /* ignore malformed local state */
    }
  }, []);

  const toggle = (key: PrefKey, value: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      window.localStorage.setItem(PREF_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <Card className="divide-y divide-black/[0.06] p-0">
      {PREF_ROWS.map(({ key, icon: Icon, title, body, locked }) => (
        <div key={key} className="flex items-start justify-between gap-4 px-6 py-5">
          <div className="flex items-start gap-3.5">
            <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl border border-black/10 text-black/45">
              <Icon size={16} strokeWidth={1.5} />
            </span>
            <div>
              <div className="text-[13px] text-black/80">{t(title)}</div>
              <p className="mt-1 max-w-md text-[12px] leading-relaxed text-black/40">{t(body)}</p>
              {locked && <p className="mt-1 text-[11px] uppercase tracking-[0.06em] text-black/30">{t("Always on — protects your account")}</p>}
            </div>
          </div>
          <Switch checked={prefs[key]} onChange={(v) => toggle(key, v)} disabled={locked} ariaLabel={t(title)} />
        </div>
      ))}
    </Card>
  );
}

/* ── Privacy & security ───────────────────────────────────── */
type Session = { id: string; device: string; icon: React.ElementType; location: string; lastActive: string; current?: boolean };
const INITIAL_SESSIONS: Session[] = [
  { id: "s1", device: "Chrome on macOS", icon: Monitor, location: "Bangkok, TH", lastActive: "Active now", current: true },
  { id: "s2", device: "Safari on iPhone", icon: Smartphone, location: "Bangkok, TH", lastActive: "2 days ago" },
  { id: "s3", device: "Edge on Windows", icon: Monitor, location: "Rayong, TH", lastActive: "9 days ago" },
];

function PrivacyTab() {
  const t = useT();
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [touched, setTouched] = React.useState({ current: false, next: false, confirm: false });
  const [sessions, setSessions] = React.useState(INITIAL_SESSIONS);
  const [cookiesOpen, setCookiesOpen] = React.useState(false);
  const { state, run } = useSaveState();

  const currentValid = current === MOCK_PASSWORD;
  const nextValid = next.length >= 8;
  const confirmValid = confirm.length > 0 && confirm === next;
  const canUpdate = currentValid && nextValid && confirmValid;
  const mismatch = touched.confirm && confirm.length > 0 && confirm !== next;

  const attemptUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate) {
      setTouched({ current: true, next: true, confirm: true });
      return;
    }
    run(() => {
      setCurrent("");
      setNext("");
      setConfirm("");
      setTouched({ current: false, next: false, confirm: false });
    });
  };

  const { state: signOutState, run: runSignOutOthers } = useSaveState();
  const signOutOthers = () => {
    runSignOutOthers(() => {
      setSessions((s) => s.filter((x) => x.current));
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <Eyebrow>{t("Change password")}</Eyebrow>
        <form onSubmit={attemptUpdate} noValidate className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label={t("Current password")}>
              <input
                className={cn(inputClass, touched.current && !currentValid && errInput)}
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, current: true }))}
                placeholder="••••••••"
              />
              {touched.current && current.length > 0 && !currentValid && <span className="mt-1.5 block text-xs text-[#dc2626]">{t("That password isn't correct.")}</span>}
            </Field>
          </div>
          <Field label={t("New password")}>
            <input
              className={cn(inputClass, touched.next && !nextValid && errInput)}
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, next: true }))}
              placeholder={t("At least 8 characters")}
            />
          </Field>
          <Field label={t("Confirm new password")}>
            <input
              className={cn(inputClass, mismatch && errInput)}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
              placeholder={t("Re-enter new password")}
            />
          </Field>
          {mismatch && <span className="sm:col-span-2 text-xs text-[#dc2626]">{t("Passwords don't match.")}</span>}
          <div className="sm:col-span-2">
            <SaveButton
              state={state}
              onClick={attemptUpdate}
              idleLabel={t("Update password")}
              savingLabel={t("Updating…")}
              savedLabel={t("Updated")}
              icon={<KeyRound size={13} strokeWidth={1.5} />}
              className={cn(!canUpdate && state === "idle" && "opacity-40")}
            />
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Eyebrow>{t("Device login")}</Eyebrow>
          {sessions.length > 1 && (
            <SaveButton
              state={signOutState}
              onClick={signOutOthers}
              variant="secondary"
              idleLabel={t("Sign out of all other devices")}
              savingLabel={t("Signing out of all other devices…")}
              savedLabel={t("Saved")}
            />
          )}
        </div>
        <div className="mt-4 divide-y divide-black/[0.06]">
          {sessions.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center gap-3.5 py-3">
                <span className="grid h-9 w-9 flex-none place-items-center rounded-xl border border-black/10 text-black/45">
                  <Icon size={16} strokeWidth={1.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] text-black/75">{s.device}</span>
                    {s.current && <Chip tone="ok">{t("this device")}</Chip>}
                  </div>
                  <div className="mt-0.5 text-[11px] text-black/40">{s.location} · {t(s.lastActive)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <Eyebrow>{t("Cookies")}</Eyebrow>
        <div className="mt-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="max-w-md text-[13px] leading-relaxed text-black/50">{t("Configure how cookies are used across the platform — essential cookies keep you signed in; the rest are optional.")}</p>
          <Button variant="secondary" size="sm" onClick={() => setCookiesOpen(true)}>
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
            body={t("Review the terms and conditions for using the platform and its services.")}
          />
          <LegalRow
            href={LEGAL_PRIVACY_URL}
            icon={ShieldCheck}
            title={t("Privacy Policy")}
            body={t("Learn how your personal data is collected, used and protected in accordance with applicable laws.")}
          />
        </div>
      </Card>

      {cookiesOpen && <CookieModal onClose={() => setCookiesOpen(false)} />}
    </div>
  );
}

function LegalRow({ href, icon: Icon, title, body }: { href: string; icon: React.ElementType; title: string; body: string }) {
  /* An off-site destination, so a plain <a> with `noopener noreferrer`
     rather than next/link — there is no client-side route to prefetch, and
     the new tab must not be handed a window.opener onto the portal. */
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="-mx-3 flex items-center gap-3.5 rounded-xl px-3 py-3.5 transition-colors hover:bg-[#fafaf8]">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-xl border border-black/10 text-black/45">
        <Icon size={16} strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-black/75">{title}</div>
        <div className="mt-0.5 text-[12px] leading-relaxed text-black/40">{body}</div>
      </div>
      <ExternalLink size={14} strokeWidth={1.5} className="flex-none text-black/25" />
    </a>
  );
}

const COOKIE_KEY = "certrace:cookie-prefs";
function CookieModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [analytics, setAnalytics] = React.useState(true);
  const [marketing, setMarketing] = React.useState(false);
  // holdSavedMs must outlast the auto-close delay below, or the state
  // machine's own saved→idle revert fires first and cancels the close timer.
  const { state, run } = useSaveState(2000);

  React.useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(COOKIE_KEY) ?? "null");
      if (saved) {
        setAnalytics(Boolean(saved.analytics));
        setMarketing(Boolean(saved.marketing));
      }
    } catch {
      /* ignore malformed local state */
    }
  }, []);

  // Lock background scroll while the modal is open — otherwise the page
  // scrolls (and its scrollbar keeps showing through) underneath the overlay.
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Saved state auto-closes the popup shortly after — same "no separate
  // confirmation toast" logic as the rest of Settings.
  React.useEffect(() => {
    if (state !== "saved") return;
    const t = window.setTimeout(onClose, 500);
    return () => window.clearTimeout(t);
  }, [state, onClose]);

  const save = () => run(() => window.localStorage.setItem(COOKIE_KEY, JSON.stringify({ analytics, marketing })));

  // Portaled to <body> — this modal is rendered inside the tab's `.ct-enter`
  // wrapper, whose entrance animation leaves a lingering `transform` (fill-mode:
  // both). A transformed ancestor becomes the containing block for `position:
  // fixed` descendants, so without the portal this "fullscreen" overlay would
  // only ever cover the tab-content box, not the real viewport.
  return (
    <Portal>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} aria-hidden />
        <Card className="ct-enter relative z-10 w-full max-w-sm p-6">
          <button onClick={onClose} aria-label={t("Close")} className="absolute right-4 top-4 text-black/35 hover:text-black">
            <X size={18} strokeWidth={1.5} />
          </button>
          <Eyebrow>{t("Cookies")}</Eyebrow>
          <h2 className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">{t("Manage cookies")}</h2>
          <div className="mt-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[13px] text-black/75">{t("Essential")}</div>
                <p className="mt-0.5 text-[12px] text-black/40">{t("Required to keep you signed in. Can't be disabled.")}</p>
              </div>
              <Switch checked disabled ariaLabel={t("Essential cookies")} />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[13px] text-black/75">{t("Analytics")}</div>
                <p className="mt-0.5 text-[12px] text-black/40">{t("Helps us see which parts of Certrace actually get used.")}</p>
              </div>
              <Switch checked={analytics} onChange={setAnalytics} ariaLabel={t("Analytics cookies")} />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[13px] text-black/75">{t("Marketing")}</div>
                <p className="mt-0.5 text-[12px] text-black/40">{t("Used to tailor announcements about new coverage and features.")}</p>
              </div>
              <Switch checked={marketing} onChange={setMarketing} ariaLabel={t("Marketing cookies")} />
            </div>
          </div>
          <div className="mt-6">
            <SaveButton state={state} onClick={save} idleLabel={t("Save preferences")} savingLabel={t("Saving…")} savedLabel={t("Saved")} />
          </div>
        </Card>
      </div>
    </Portal>
  );
}
