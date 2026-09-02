"use client";

/* ════════════════════════════════════════════════════════════
   WHAT THIS SEAT CAN DO, AND WHO TO ASK — the compliance /billing

   In the owner build this route is Plan & billing: four tiers, a comparison
   table, usage meters and a Contact Sales button. None of that is this seat's
   to look at, let alone press. But the route could not simply be deleted,
   because THREE mechanisms in the app point here and would otherwise point at
   a 404:

     · the trial lock. When the free month is over the whole account goes
       read-only, and every blocked control navigates to LOCK_DESTINATION
       (lib/plan.ts). The lock deliberately says nothing anywhere else — no
       banner, no toast — precisely because it has one screen that carries the
       whole explanation. Take that screen away and the design becomes
       "controls silently stop working", which is the worst version of it.

     · the seat guard. SEAT_DESTINATION in lib/seat.ts is the same route on
       purpose: a reader should not have to learn two different "why did that
       not work" screens.

     · the route guards. /workspaces/new and /onboarding both redirect here —
       the first because this seat cannot create a workspace, the second
       because there is nothing here to set up.

   So the destination survives and the CONTENT changes. This page states what
   the seat is for, what it is deliberately not allowed to do, and who owns
   each of those. It quotes no price, compares no plans and offers no upgrade.

   THE ORDER ON THE PAGE IS THE ARGUMENT. "What you assure" comes first,
   because this seat's defining feature is a power, not a restriction — a
   compliance portal that opens with a list of refusals reads as a demotion
   rather than a mandate. What is withheld comes second, and every line of it
   names the person it belongs to instead of saying "not permitted".

   BOTH LISTS ARE FILTERED BY `can()`, which is what makes them trustworthy
   rather than decorative: `enterFigures` moved from the second list to the
   first when lib/seat.ts granted it, and this page needed no other edit to
   stop claiming the seat cannot type. The prose around them is not filtered,
   so it has to be read whenever a grant moves — which is why the card above
   the lists explains where the line falls rather than reciting the rows.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { Mail, Lock, ShieldCheck, Check, Minus, User } from "lucide-react";
import { Card, PageHeader, Eyebrow, ButtonLink, StatusDot } from "@/components/ui";
import { Note } from "@/components/workspace/chrome";
import { useAccount } from "@/components/account-lock";
import { ACCOUNT_OWNER, DATA_OWNER, SIGNED_IN_SEAT, can } from "@/lib/seat";
import { ORG } from "@/lib/data";
import { useT } from "@/lib/i18n";

/* Derived from lib/seat.ts rather than typed out again, so a capability that
   moves in the table moves on this page in the same commit. Each row is
   filtered by `can()` — if the grants ever change, this page tells the truth
   about the new ones without being edited. */
const ALLOWED: { cap: Parameters<typeof can>[0]; label: string }[] = [
  { cap: "reviewMonth", label: "Confirm a month, or send it back with a note saying what is wrong" },
  /* Third in the list rather than first. The seat's defining act is still the
     review — opening with "you can type" would describe a data-entry job with
     a sign-off bolted on, which is the wrong way round. It sits between
     checking a month and signing the pack because that is where it happens:
     you find the wrong digit while reviewing, and you fix it before you sign. */
  { cap: "enterFigures", label: "Enter or correct a reading, a fuel row or a production figure" },
  { cap: "signOffPack", label: "Put your name to the finished pack before it leaves the company" },
  { cap: "downloadPack", label: "Download any report or evidence pack, draft or final" },
  { cap: "viewTeam", label: "See who else is on the account" },
  { cap: "editOwnProfile", label: "Keep your own profile and notifications current" },
];

const WITHHELD: { cap: Parameters<typeof can>[0]; label: string; who: "data" | "owner" }[] = [
  { cap: "buildWorkspaces", label: "Create a verification workspace", who: "data" },
  { cap: "chaseSuppliers", label: "Send or chase a supplier smart link", who: "data" },
  { cap: "archiveWorkspace", label: "Archive a workspace", who: "data" },
  /* `deleteWorkspace` is deliberately NOT listed. Nothing in this product
     deletes a workspace outright — not this seat, not Operations, not the
     owner: /workspaces/[id]/settings and the workspace menu offer Archive and
     nothing else, and `removeWorkspace()` has no caller anywhere in the app.
     Listing it as something the owner does would have named a person who
     cannot do it either, which is the one thing this page must never do. The
     capability itself stays in lib/seat.ts so the store keeps its backstop. */
  { cap: "manageSeats", label: "Add or remove people", who: "owner" },
  { cap: "billing", label: "Change the plan or see invoices", who: "owner" },
  { cap: "editOrganisation", label: "Edit the organisation's registered details", who: "owner" },
];

export default function AccountPage() {
  const t = useT();
  const { ready, plan, trial, locked } = useAccount();

  /* The one thing a trial holds back. The MMD download button links straight
     here when it is withheld (workspaces/[id]/readiness), and that button says
     nothing itself — so if this page did not explain it, nothing would. */
  const mmdWithheld = ready && !plan.features.methodologyDoc;

  const ownerName = ACCOUNT_OWNER?.name ?? t("your account owner");
  const dataName = DATA_OWNER?.name ?? t("whoever entered it");
  const whoFor = (who: "data" | "owner") => (who === "owner" ? ownerName : dataName);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("Your access")}
        title={t("What your seat can do.")}
        lead={t(
          "You are on {org} in the Legal & Compliance seat — you check the filing, and where a figure is wrong you can correct it. What you do not do is decide what gets filed: {data} opens the workspaces and asks the suppliers, and {owner} owns the account.",
          { org: ORG.name, data: dataName, owner: ownerName },
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
                  ? t("This account is read-only. Everything already built is still here and still opens — but nothing can be signed off or sent back until {owner} restarts it.", { owner: ownerName })
                  : trial.onTrial && !trial.ended
                    ? t("The account is on its free month. When it ends everything here becomes read-only until {owner} picks a plan.", { owner: ownerName })
                    : ""}
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-black/45">
                {t("Nothing entered is lost, and nothing was sent anywhere. This is a limit on the account, not on your review.")}
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
        <div className="space-y-4">
          <Eyebrow>{t("What you assure")}</Eyebrow>
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

          {DATA_OWNER && (
            <Card warm className="p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl border border-black/10 text-black/55">
                  <User size={16} strokeWidth={1.5} />
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] text-black/70">{DATA_OWNER.name}</div>
                  <div className="mt-0.5 text-[12px] text-black/40">{t("Enters the figures")}</div>
                </div>
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-black/50">
                {t("The workspaces, the supplier requests and the month-to-month entry are theirs. Sending a month back is still the formal route when the figure has to come from them — email only when it needs a conversation as well.")}
              </p>
              {DATA_OWNER.email && (
                <ButtonLink href={`mailto:${DATA_OWNER.email}`} external variant="secondary" size="sm" className="mt-3 w-full">
                  <Mail size={14} strokeWidth={1.5} /> {t("Email {name}", { name: DATA_OWNER.name })}
                </ButtonLink>
              )}
            </Card>
          )}

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

          <Note tone="muted">
            {t("Suppliers answer through a link, without an account, and never take a seat. What they send arrives in your queue the same way an internal month does.")}
          </Note>
        </div>
      </div>

      <p className="text-[12px] text-black/35">
        {t("Signed in as {name} · {email}", { name: SIGNED_IN_SEAT.name, email: SIGNED_IN_SEAT.email })}
      </p>
    </div>
  );
}
