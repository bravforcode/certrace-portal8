"use client";

/* ════════════════════════════════════════════════════════════
   WHAT THIS SEAT CAN DO, AND WHO TO ASK — the member's /billing

   In the owner build this route is Plan & billing: four tiers, a comparison
   table, usage meters and a Contact Sales button. None of that is a member's
   to look at, let alone press. But the route could not simply be deleted,
   because two mechanisms in the app POINT here and would otherwise point at
   a 404:

     · the trial lock. When the free month is over the whole account goes
       read-only, and every blocked control navigates to LOCK_DESTINATION
       (lib/plan.ts). The lock deliberately says nothing anywhere else — no
       banner, no toast — precisely because it has one screen that carries
       the whole explanation. Take that screen away and the design becomes
       "controls silently stop working", which is the worst version of it.

     · the route guard. /workspaces/new redirects here on a locked account,
       so somebody cannot walk to a form they are not allowed to submit.

   So the destination survives and the CONTENT changes. This page states the
   account's condition, names the one person who can change it, and says what
   the seat is allowed to do. It quotes no price, compares no plans, shows no
   invoice and offers no upgrade — a member forwarding a pricing page to
   their finance team is a decision the account owner did not make.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Mail, Lock, ShieldCheck, Check, Minus, User } from "lucide-react";
import { Card, PageHeader, Eyebrow, ButtonLink, StatusDot } from "@/components/ui";
import { Note } from "@/components/workspace/chrome";
import { useAccount } from "@/components/account-lock";
import { ACCOUNT_OWNER, PACK_SIGNATORY, SIGNED_IN_SEAT, can } from "@/lib/seat";
import { ORG } from "@/lib/data";
import { useT } from "@/lib/i18n";

/* What the seat may and may not do, in the product's own words. Derived from
   lib/seat.ts rather than typed out again, so a capability that moves in the
   table moves on this page in the same commit. */
const ALLOWED: { cap: Parameters<typeof can>[0]; label: string }[] = [
  { cap: "buildWorkspaces", label: "Create verification workspaces and fill months in" },
  { cap: "chaseSuppliers", label: "Send and chase supplier smart links" },
  { cap: "signOffMonth", label: "Sign off a month you entered" },
  { cap: "downloadDraftPack", label: "Download draft reports and evidence packs" },
  { cap: "archiveWorkspace", label: "Archive a workspace you no longer report" },
  { cap: "viewTeam", label: "See who else is on the account" },
];

const WITHHELD: { cap: Parameters<typeof can>[0]; label: string; who: string }[] = [
  { cap: "signOffPack", label: "Sign a finished pack off before it leaves", who: "signatory" },
  { cap: "manageSeats", label: "Add or remove people", who: "owner" },
  { cap: "billing", label: "Change the plan or see invoices", who: "owner" },
  { cap: "editOrganisation", label: "Edit the organisation's registered details", who: "owner" },
  { cap: "deleteWorkspace", label: "Delete a workspace outright", who: "owner" },
];

export default function AccountPage() {
  const t = useT();
  const { ready, plan, trial, locked } = useAccount();

  /* The one thing a trial holds back. The MMD download button links straight
     here when it is withheld (workspaces/[id]/readiness), and that button says
     nothing itself — so if this page did not explain it, nothing would. */
  const mmdWithheld = ready && !plan.features.methodologyDoc;

  const ownerName = ACCOUNT_OWNER?.name ?? t("your account owner");
  const signatoryName = PACK_SIGNATORY?.name ?? ownerName;
  const whoFor = (who: string) => (who === "signatory" ? signatoryName : ownerName);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("Your access")}
        title={t("What your seat can do.")}
        lead={t(
          "You are on {org} as a member — the seat that builds the filing. {owner} owns the account itself.",
          { org: ORG.name, owner: ownerName },
        )}
      />

      {/* ── The condition of the account ─────────────────────
          Only rendered once the client has measured the plan. Everything
          plan-shaped waits for `ready` or the server markup and the first
          client paint disagree — see components/account-lock.tsx. */}
      {ready && (locked || trial.onTrial) && (
        <Card warm className="p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl border border-black/10 text-[#b45309]">
              <Lock size={16} strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <StatusDot tone={locked ? "warn" : "ok"} glow pulse={!locked} />
                <Eyebrow>{locked ? t("Read-only") : t("Free trial")}</Eyebrow>
              </div>
              <p className="mt-2 text-sm text-[#111]">
                {locked
                  ? t("This account is read-only. Everything you have already built is still here and still opens — nothing can be changed or added until {owner} restarts it.", { owner: ownerName })
                  : trial.onTrial && !trial.ended
                    ? t("The account is on its free month. When it ends everything here becomes read-only until {owner} picks a plan.", { owner: ownerName })
                    : ""}
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-black/45">
                {t("Nothing you entered is lost, and nothing was sent anywhere. This is a limit on the account, not on your work.")}
              </p>
              {mmdWithheld && !locked && (
                <p className="mt-2.5 border-t border-black/[0.07] pt-2.5 text-[12.5px] leading-relaxed text-black/45">
                  {t("One thing is held back while the trial runs: the Monitoring Methodology Documentation download. Every figure still computes and every other document still downloads — the MMD is the file a verifier opens first, so it waits for a plan.")}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* ── What the seat may do ──────────────────────────── */}
        <div className="space-y-4">
          <Eyebrow>{t("This seat")}</Eyebrow>
          <Card className="divide-y divide-black/5">
            {ALLOWED.filter((r) => can(r.cap)).map((r) => (
              <div key={r.cap} className="flex items-start gap-3 p-4">
                <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-lg border border-black/10 text-[#15803d]">
                  <Check size={13} strokeWidth={1.75} />
                </span>
                <p className="text-[13px] leading-relaxed text-black/70">{t(r.label)}</p>
              </div>
            ))}
          </Card>

          <Eyebrow>{t("Not this seat")}</Eyebrow>
          <Card warm className="divide-y divide-black/5">
            {WITHHELD.filter((r) => !can(r.cap)).map((r) => (
              <div key={r.cap} className="flex items-start gap-3 p-4">
                <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-lg border border-black/10 text-black/30">
                  <Minus size={13} strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] leading-relaxed text-black/70">{t(r.label)}</p>
                  <p className="mt-0.5 text-[12px] text-black/40">{t("{name} does this.", { name: whoFor(r.who) })}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* ── Who to ask ────────────────────────────────────── */}
        <div className="space-y-4">
          <Eyebrow>{t("Who to ask")}</Eyebrow>
          <Card warm className="p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl border border-black/10 text-black/55">
                <ShieldCheck size={16} strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] text-black/70">{ownerName}</div>
                <div className="mt-0.5 text-[12px] text-black/40">{t("Account owner")}</div>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-black/50">
              {t("Seats, the plan and the organisation's registered details are theirs. There is always exactly one owner on an account.")}
            </p>
            {ACCOUNT_OWNER?.email && (
              <ButtonLink href={`mailto:${ACCOUNT_OWNER.email}`} external variant="secondary" size="sm" className="mt-3 w-full">
                <Mail size={14} strokeWidth={1.5} /> {t("Email {name}", { name: ownerName })}
              </ButtonLink>
            )}
          </Card>

          {PACK_SIGNATORY && PACK_SIGNATORY.id !== ACCOUNT_OWNER?.id && (
            <Card warm className="p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl border border-black/10 text-black/55">
                  <User size={16} strokeWidth={1.5} />
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] text-black/70">{PACK_SIGNATORY.name}</div>
                  <div className="mt-0.5 text-[12px] text-black/40">{t("Signs packs off")}</div>
                </div>
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-black/50">
                {t("You build the pack and download it in draft as often as you like. They put a name to the final one before it leaves the company.")}
              </p>
              {PACK_SIGNATORY.email && (
                <ButtonLink href={`mailto:${PACK_SIGNATORY.email}`} external variant="secondary" size="sm" className="mt-3 w-full">
                  <Mail size={14} strokeWidth={1.5} /> {t("Email {name}", { name: PACK_SIGNATORY.name })}
                </ButtonLink>
              )}
            </Card>
          )}

          <Note tone="muted">
            {t("Suppliers are always free and never take a seat — they answer through a link, without an account. Sending those is yours to do.")}
          </Note>
        </div>
      </div>

      <p className="text-[12px] text-black/35">
        {t("Signed in as {name} · {email}", { name: SIGNED_IN_SEAT.name, email: SIGNED_IN_SEAT.email })}
      </p>
    </div>
  );
}
