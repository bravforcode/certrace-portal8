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
        eyebrow="Settings"
        title="Account & organisation."
        lead="Locale and identity for your organisation, your personal profile, and how Certrace keeps you posted."
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
            <Icon size={13} strokeWidth={1.5} /> {label}
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

/* ── Organisation ─────────────────────────────────────────── */
function OrganisationTab() {
  const { profile, update, loaded } = useProfile();
  const [companyName, setCompanyName] = React.useState(profile.companyName);
  const [sectorId, setSectorId] = React.useState(profile.sector);
  const [installationId, setInstallationId] = React.useState(profile.installationId);
  const [jurisdiction, setJurisdiction] = React.useState(profile.jurisdiction);
  const [currency, setCurrency] = React.useState(profile.currency);
  const [unit, setUnit] = React.useState(profile.unit);
  const { state, run } = useSaveState();

  // The profile loads from localStorage a tick after mount (SSR-hydration-safe),
  // so re-sync these drafts once that load lands — otherwise a component that
  // mounted first keeps showing the hardcoded defaults forever.
  React.useEffect(() => {
    if (!loaded) return;
    setCompanyName(profile.companyName);
    setSectorId(profile.sector);
    setInstallationId(profile.installationId);
    setJurisdiction(profile.jurisdiction);
    setCurrency(profile.currency);
    setUnit(profile.unit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const sectorOptions = PRODUCT_SECTORS.map((s) => ({ value: s.id, label: s.name }));
  const jurisdictionOptions = [{ value: "TH", label: "Thailand", hint: "TGO / อบก. emission factors" }];
  const currencies = ["THB", "EUR"];

  const save = () => run(() => update({ companyName, sector: sectorId, installationId, jurisdiction, currency, unit }));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Eyebrow>Company</Eyebrow>
            <div className="mt-4 space-y-4">
              <Field label="Legal name">
                <input className={inputClass} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </Field>
              <Field label="Primary sector" hint="Which CBAM-affected industry your organisation reports under.">
                <Select value={sectorId} onChange={setSectorId} options={sectorOptions} ariaLabel="Primary sector" />
              </Field>
              <Field label="Installation / facility ID" hint="Required for CBAM declarant identification.">
                <input className={inputClass} value={installationId} onChange={(e) => setInstallationId(e.target.value)} />
              </Field>
            </div>
          </div>

          <div>
            <Eyebrow>Locale & units</Eyebrow>
            <div className="mt-4 space-y-4">
              <Field label="Operating jurisdiction" hint="Sets the localised emission-factor library and number formats.">
                <Select value={jurisdiction} onChange={setJurisdiction} options={jurisdictionOptions} ariaLabel="Operating jurisdiction" />
              </Field>
              <Field label="Display currency">
                <Select value={currency} onChange={setCurrency} options={currencies.map((c) => ({ value: c, label: c }))} ariaLabel="Display currency" />
              </Field>
              <Field label="Emission unit">
                <Select value={unit} onChange={setUnit} options={[{ value: "tCO₂e", label: "tCO₂e" }, { value: "kgCO₂e", label: "kgCO₂e" }]} ariaLabel="Emission unit" />
              </Field>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-black/[0.06] pt-6">
          <SaveButton state={state} onClick={save} />
        </div>
      </Card>

      <Card warm className="flex flex-col items-start justify-between gap-3 p-6 sm:flex-row sm:items-center">
        <div>
          <Eyebrow>Plan</Eyebrow>
          <p className="mt-2 text-sm text-black/55">
            You&apos;re on <span className="text-[#111]">Growth</span> — auditor portal seats + the full CBAM workflow.
          </p>
        </div>
        <Link href="/billing">
          <Button variant="secondary" size="sm">
            Manage plan
          </Button>
        </Link>
      </Card>
    </div>
  );
}

/* ── Profile ──────────────────────────────────────────────── */
function ProfileTab() {
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
        <Eyebrow>Your profile</Eyebrow>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label="Last name">
            <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
        </div>
        <p className="mt-2 text-[11px] text-black/35">
          Username <span className="font-mono text-black/50">@{generateUsername(firstName, lastName) || "—"}</span> — generated automatically from your name.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Job title">
            <Select value={jobTitleOption} onChange={setJobTitleOption} options={JOB_TITLE_OPTIONS} ariaLabel="Job title" />
          </Field>
          {jobTitleOption === "other" && (
            <Field label="Specify job title">
              <input className={inputClass} value={jobTitleOther} onChange={(e) => setJobTitleOther(e.target.value)} placeholder="e.g. Regional Trade Manager" />
            </Field>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <SaveButton state={profileState} onClick={saveProfile} idleLabel="Save profile" />
        </div>
      </Card>

      <Card className="p-6">
        <Eyebrow>Account identity</Eyebrow>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-black/[0.08] bg-[#faf9f7] px-4 py-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.08em] text-black/40">Account ID</div>
            <div className="font-mono text-[13px] text-black/70">{USER.accountId}</div>
          </div>
          <button
            onClick={copyId}
            className="inline-flex flex-none items-center gap-1.5 rounded-xl border border-black/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] text-black/55 hover:border-black/25 hover:text-black"
          >
            {copied ? <Check size={13} strokeWidth={1.5} className="text-[#047857]" /> : <Copy size={13} strokeWidth={1.5} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-black/40">
          This ID is permanent and never changes — your declarations, suppliers and seats stay attached to it even if the email below changes.
          If the person who set up this account leaves the company, ownership can move to a new email without losing any history.
        </p>
        <div className="mt-3 flex items-center justify-between text-[12px] text-black/40">
          <span>Member since</span>
          <span className="text-black/60">{USER.memberSince}</span>
        </div>
      </Card>

      <Card className="p-6">
        <Eyebrow>Email address</Eyebrow>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-black/[0.08] px-4 py-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-black/10 text-black/45">
            <Mail size={15} strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] text-black/75">{USER.email}</div>
            <div className="text-[11px] text-black/35">Primary — used to sign in and receive alerts.</div>
          </div>
        </div>

        {emailSent && (
          <div className="mt-3 rounded-xl border border-[rgba(96,165,250,0.25)] bg-[#eff6ff] px-4 py-3 text-[12px] leading-relaxed text-[#2563eb]">
            Verification sent to <span className="font-medium">{emailSent}</span>. Click the link there to finish the switch — nothing changes
            until you confirm, and your account, history and org access stay exactly the same.
          </div>
        )}

        {!changingEmail ? (
          <button
            onClick={() => setChangingEmail(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3.5 py-2 text-[11px] uppercase tracking-[0.08em] text-black/55 hover:border-black/25 hover:text-black"
          >
            Change email
          </button>
        ) : (
          <form onSubmit={sendVerification} noValidate className="mt-4 space-y-3 border-t border-black/[0.06] pt-4">
            <Field label="New email">
              <input
                className={cn(inputClass, touched.email && !emailValid && errInput)}
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                placeholder="new@company.com"
              />
            </Field>
            <Field label="Confirm current password" hint="For your security, we verify it's really you before changing anything.">
              <input
                className={cn(inputClass, touched.pw && !pwValid && errInput)}
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, pw: true }))}
                placeholder="••••••••"
              />
              {touched.pw && pw.length > 0 && !pwValid && <span className="mt-1.5 block text-xs text-[#dc2626]">That password isn&apos;t correct.</span>}
            </Field>
            <div className="flex items-center gap-2">
              <Button size="sm" type="submit" disabled={sending} className={cn(!canSendVerification && !sending && "opacity-40")}>
                {sending ? "Sending…" : "Send verification"}
              </Button>
              <Button size="sm" type="button" variant="ghost" onClick={() => setChangingEmail(false)}>
                Cancel
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
              <div className="text-[13px] text-black/80">{title}</div>
              <p className="mt-1 max-w-md text-[12px] leading-relaxed text-black/40">{body}</p>
              {locked && <p className="mt-1 text-[11px] uppercase tracking-[0.06em] text-black/30">Always on — protects your account</p>}
            </div>
          </div>
          <Switch checked={prefs[key]} onChange={(v) => toggle(key, v)} disabled={locked} ariaLabel={title} />
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
        <Eyebrow>Change password</Eyebrow>
        <form onSubmit={attemptUpdate} noValidate className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Current password">
              <input
                className={cn(inputClass, touched.current && !currentValid && errInput)}
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, current: true }))}
                placeholder="••••••••"
              />
              {touched.current && current.length > 0 && !currentValid && <span className="mt-1.5 block text-xs text-[#dc2626]">That password isn&apos;t correct.</span>}
            </Field>
          </div>
          <Field label="New password">
            <input
              className={cn(inputClass, touched.next && !nextValid && errInput)}
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, next: true }))}
              placeholder="At least 8 characters"
            />
          </Field>
          <Field label="Confirm new password">
            <input
              className={cn(inputClass, mismatch && errInput)}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
              placeholder="Re-enter new password"
            />
          </Field>
          {mismatch && <span className="sm:col-span-2 text-xs text-[#dc2626]">Passwords don&apos;t match.</span>}
          <div className="sm:col-span-2">
            <SaveButton
              state={state}
              onClick={attemptUpdate}
              idleLabel="Update password"
              savingLabel="Updating…"
              savedLabel="Updated"
              icon={<KeyRound size={13} strokeWidth={1.5} />}
              className={cn(!canUpdate && state === "idle" && "opacity-40")}
            />
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Eyebrow>Device login</Eyebrow>
          {sessions.length > 1 && (
            <SaveButton
              state={signOutState}
              onClick={signOutOthers}
              variant="secondary"
              idleLabel="Sign out of all other devices"
              savingLabel="Signing out of all other devices…"
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
                    {s.current && <Chip tone="ok">this device</Chip>}
                  </div>
                  <div className="mt-0.5 text-[11px] text-black/40">{s.location} · {s.lastActive}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <Eyebrow>Cookies</Eyebrow>
        <div className="mt-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="max-w-md text-[13px] leading-relaxed text-black/50">Configure how cookies are used across the platform — essential cookies keep you signed in; the rest are optional.</p>
          <Button variant="secondary" size="sm" onClick={() => setCookiesOpen(true)}>
            <Cookie size={13} strokeWidth={1.5} /> Manage cookies
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <Eyebrow>Legal</Eyebrow>
        <div className="mt-4 divide-y divide-black/[0.06]">
          <LegalRow
            href="/legal/terms"
            icon={FileText}
            title="Terms & Conditions"
            body="Review the terms and conditions for using the platform and its services."
          />
          <LegalRow
            href="/legal/privacy"
            icon={ShieldCheck}
            title="Privacy Policy"
            body="Learn how your personal data is collected, used and protected in accordance with applicable laws."
          />
        </div>
      </Card>

      {cookiesOpen && <CookieModal onClose={() => setCookiesOpen(false)} />}
    </div>
  );
}

function LegalRow({ href, icon: Icon, title, body }: { href: string; icon: React.ElementType; title: string; body: string }) {
  return (
    <Link href={href} target="_blank" className="-mx-3 flex items-center gap-3.5 rounded-xl px-3 py-3.5 transition-colors hover:bg-[#fafaf8]">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-xl border border-black/10 text-black/45">
        <Icon size={16} strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-black/75">{title}</div>
        <div className="mt-0.5 text-[12px] leading-relaxed text-black/40">{body}</div>
      </div>
      <ExternalLink size={14} strokeWidth={1.5} className="flex-none text-black/25" />
    </Link>
  );
}

const COOKIE_KEY = "certrace:cookie-prefs";
function CookieModal({ onClose }: { onClose: () => void }) {
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
          <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-black/35 hover:text-black">
            <X size={18} strokeWidth={1.5} />
          </button>
          <Eyebrow>Cookies</Eyebrow>
          <h2 className="mt-2 font-[family-name:var(--font-plex)] text-2xl font-light text-[#111]">Manage cookies</h2>
          <div className="mt-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[13px] text-black/75">Essential</div>
                <p className="mt-0.5 text-[12px] text-black/40">Required to keep you signed in. Can&apos;t be disabled.</p>
              </div>
              <Switch checked disabled ariaLabel="Essential cookies" />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[13px] text-black/75">Analytics</div>
                <p className="mt-0.5 text-[12px] text-black/40">Helps us see which parts of Certrace actually get used.</p>
              </div>
              <Switch checked={analytics} onChange={setAnalytics} ariaLabel="Analytics cookies" />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[13px] text-black/75">Marketing</div>
                <p className="mt-0.5 text-[12px] text-black/40">Used to tailor announcements about new coverage and features.</p>
              </div>
              <Switch checked={marketing} onChange={setMarketing} ariaLabel="Marketing cookies" />
            </div>
          </div>
          <div className="mt-6">
            <SaveButton state={state} onClick={save} idleLabel="Save preferences" />
          </div>
        </Card>
      </div>
    </Portal>
  );
}
