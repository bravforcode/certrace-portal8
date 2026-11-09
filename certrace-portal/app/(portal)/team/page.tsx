"use client";

/* ════════════════════════════════════════════════════════════
   TEAM & SEATS — who is in, and what they can do

   WHAT WAS REMOVED AND WHY:

   · THE DESIGNATED-CHECKS BOARD. A card per person listing the submission
     reviews and report sign-offs they carried, cross-referenced out of every
     declaration's exporter state. It was the largest thing on the page and, on
     every real account, it was four cards each saying "No checks assigned
     right now" — because the assignments it read live on DECLARATIONS, which
     were retired as the spine. A board that is structurally empty is not a
     board; it is a promise the product no longer keeps. Review now happens on
     the month it is about, in the workspace.

   · THE VERIFIER ROLE, everywhere: the seat, the invite option and the role
     explainer. Certrace has no verifier portal in this build — nothing a
     verifier is granted here is reachable by them — so a seat that says
     "invited" beside an accredited body's name describes access that does not
     exist. It comes back when there is a portal behind it.

   WHAT WAS ADDED:

   · REMOVE, on a seat. Seats are finite and paid for; a page that can only
     ever add is a page where the count only goes up. The owner's seat has no
     remove control, because an organisation with nobody who can reach billing
     is a locked-out organisation.

   · THE OWNER, in the role explainer. It was the one role the page assigned
     and never described — the reader could see "OWNER" on a seat and had no
     way to find out what it meant.

   · THE SEAT CAP, actually enforced. The counter read `4/8` off a literal on
     ORG while the plan sold ten seats, and "Add person" worked at any count —
     so the number was both wrong and inert. The cap now comes from the tier
     (lib/plan.ts) and the add controls close at the line. Suppliers are
     untouched by any of this: they answer through a link, take no seat, and
     are free and unlimited on every tier.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import Link from "next/link";
import { Plus, ShieldCheck, User, Crown, UserPlus, X } from "lucide-react";
import { Card, PageHeader, Button, Chip, StatusLabel, Eyebrow, Stat, Tone } from "@/components/ui";
import { ErrorState, LoadingState } from "@/components/query-state";
import { AddMemberModal } from "@/components/add-member-modal";
import { toast } from "@/components/toast";
import { SEATS, Seat, SeatRole } from "@/lib/data";
import { useTeam, useInvalidateTeam } from "@/lib/team-query";
import { seatCap } from "@/lib/plan";
import { useAccount } from "@/components/account-lock";
import { PlanCapNotice } from "@/components/plan-cap-notice";
import { useT } from "@/lib/i18n";

/* No `verifier` entry — see the header. The type in lib/data.ts still carries
   it so old fixtures and stored rows type-check; nothing here offers it. */
const roleMeta: Partial<Record<SeatRole, { label: string; tone: Tone; icon: React.ElementType; desc: string }>> = {
  owner: {
    label: "Owner",
    tone: "info",
    icon: Crown,
    desc: "Everything a member can do, plus billing, seats and deleting product reports. There is always exactly one.",
  },
  member: { label: "Member", tone: "muted", icon: User, desc: "Build and manage product reports, fill months in, chase suppliers." },
  legal: { label: "Legal / compliance", tone: "info", icon: ShieldCheck, desc: "Everything a member can do, plus reviewing and signing packages off before they leave." },
};

const FALLBACK_ROLE = { label: "Member", tone: "muted" as Tone, icon: User, desc: "Build and manage product reports." };
const metaFor = (r: SeatRole) => roleMeta[r] ?? FALLBACK_ROLE;

const stateMeta: Record<string, { label: string; tone: Tone }> = {
  active: { label: "active", tone: "ok" },
  invited: { label: "invited", tone: "muted" },
  review_requested: { label: "reviewing", tone: "info" },
  signed_off: { label: "signed off", tone: "ok" },
};

/* The picker offers the two roles that can be granted, named exactly as
   `roleMeta` names them, so this is a lookup rather than a translation —
   see the note above POSITION_OPTIONS in lib/team-store.ts. */
function seatRoleForPosition(position: string): SeatRole {
  return position === "Legal / compliance" ? "legal" : "member";
}

export default function TeamPage() {
  const t = useT();
  /* The verifier seat is filtered out of the fixture rather than deleted from
     it: lib/data.ts is shared with the declaration screens that still render
     history, and a row removed there would change what those say happened. */
  const [seats, setSeats] = React.useState<Seat[]>(() => SEATS.filter((s) => s.role !== "verifier"));
  const team = useTeam();
  const invalidateTeam = useInvalidateTeam();
  const members = (team.data ?? []).filter((m) => m.role !== "Verifier");
  const [showAdd, setShowAdd] = React.useState(false);
  /* Two-press remove. A single click that frees a paid seat and revokes
     somebody's access is a click that gets made by accident on a trackpad. */
  const [armed, setArmed] = React.useState<string | null>(null);

  const used = seats.length;
  const external = members.filter((m) => m.kind === "external").length;
  /* Measured against the LIVE list, not the fixture count: removing a seat has
     to free the slot in the same render that removes the row. */
  /* useAccount() is what makes this page re-render when the plan resolves on
     the client — seatCap() reads the plan directly and would otherwise still
     be answering for the boot-time one. */
  const { plan } = useAccount();
  const cap = seatCap(used);

  if (team.isError) return <ErrorState onRetry={() => void team.refetch()} />;
  if (team.data === undefined) return <LoadingState />;

  const removeSeat = (s: Seat) => {
    if (armed !== s.id) {
      setArmed(s.id);
      return;
    }
    setSeats((prev) => prev.filter((x) => x.id !== s.id));
    setArmed(null);
    toast({ message: t("{name} removed", { name: s.name }), detail: t("Their seat is free. Nothing they already signed off is affected."), tone: "info" });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("Team & seats")}
        title={t("Who is on the account.")}
        lead={t("Your team and what each person can do. Suppliers never take a seat — they fill in through a link, without an account.")}
        actions={
          <Button size="sm" onClick={() => setShowAdd(true)} disabled={cap.atCap} title={cap.atCap ? t("No seats left on your plan.") : undefined}>
            <UserPlus size={14} strokeWidth={1.5} /> {t("Add person")}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <Stat
            value={cap.cap == null ? used : cap.label}
            label={t("Seats used")}
            sub={cap.cap == null ? t("no cap on your plan") : t("{plan} plan", { plan: plan.name })}
          />
        </Card>
        <Card className="p-5">
          <Stat value={external} label={t("External partners")} sub={t("outside your company")} />
        </Card>
        <Link href="/billing" className="block">
          <Card highlight className="p-5 transition-colors hover:border-black/30">
            <Stat value={t(plan.name)} label={t("Current plan")} sub={t("see what each tier includes →")} />
          </Card>
        </Link>
      </div>

      <PlanCapNotice cap={cap} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Seat list */}
        <div className="space-y-3">
          <Eyebrow>{t("Active seats")}</Eyebrow>
          <Card className="divide-y divide-black/[0.06] p-0">
            {seats.map((s) => {
              const rm = metaFor(s.role);
              const sm = stateMeta[s.state] ?? stateMeta.invited;
              const Icon = rm.icon;
              const isOwner = s.role === "owner";
              return (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-black/10 text-black/55">
                      <Icon size={17} strokeWidth={1.5} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm text-black/70">{s.name}</div>
                      <div className="truncate font-mono text-[11px] text-black/35">{s.email}</div>
                    </div>
                  </div>
                  <div className="flex flex-none items-center gap-3">
                    <div className="flex flex-col items-end gap-1.5">
                      <Chip tone={rm.tone}>{t(rm.label)}</Chip>
                      <StatusLabel tone={sm.tone} label={t(sm.label)} glow={s.state === "active"} pulse={s.state === "review_requested"} />
                    </div>
                    {/* The owner has no remove control: an organisation with
                        nobody who can reach billing is locked out of itself. */}
                    {!isOwner && (
                      <button
                        type="button"
                        onClick={() => removeSeat(s)}
                        onBlur={() => setArmed((a) => (a === s.id ? null : a))}
                        aria-label={t("Remove {name}", { name: s.name })}
                        title={armed === s.id ? t("Click again to remove") : t("Remove from the account")}
                        className={
                          armed === s.id
                            ? "rounded-lg border border-[#dc2626]/40 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.08em] text-[#dc2626]"
                            : "grid h-8 w-8 place-items-center rounded-lg text-black/30 transition-colors hover:bg-black/[0.05] hover:text-[#dc2626]"
                        }
                      >
                        {armed === s.id ? t("Confirm") : <X size={15} strokeWidth={1.5} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        {/* Roles explainer */}
        <div className="space-y-4">
          <Eyebrow>{t("The three roles")}</Eyebrow>
          <Card warm className="p-5">
            <div className="space-y-4">
              {(["owner", "member", "legal"] as SeatRole[]).map((r) => {
                const rm = metaFor(r);
                const Icon = rm.icon;
                return (
                  <div key={r} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-lg border border-black/10 text-black/55">
                      <Icon size={14} strokeWidth={1.5} />
                    </span>
                    <div>
                      <div className="text-[13px] text-black/70">{t(rm.label)}</div>
                      <div className="mt-0.5 text-[12px] leading-relaxed text-black/45">{t(rm.desc)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card warm className="p-5">
            <Eyebrow>{t("Add someone new")}</Eyebrow>
            <p className="mt-2 text-[12.5px] leading-relaxed text-black/50">
              {cap.atCap
                ? t("Every seat on your plan is taken. Remove someone to release a seat, or talk to sales — suppliers never take a seat.")
                : t("They join your team and take a seat. You can hand them a month to review from that month's screen in any product report.")}
            </p>
            <Button className="mt-3 w-full" variant="secondary" size="sm" onClick={() => setShowAdd(true)} disabled={cap.atCap}>
              <Plus size={14} strokeWidth={1.5} /> {t("Add person")}
            </Button>
          </Card>
        </div>
      </div>

      <AddMemberModal
        open={showAdd && !cap.atCap}
        onClose={() => setShowAdd(false)}
        note={t("They join your team roster and take a seat. Hand them their first month to review from any product report.")}
        onAdded={(m) => {
          invalidateTeam();
          setSeats((prev) =>
            prev.some((s) => s.email.toLowerCase() === m.email.toLowerCase())
              ? prev
              : [
                  ...prev,
                  {
                    id: `inv-${Date.now()}`,
                    name: m.name,
                    email: m.email,
                    org: m.email.split("@")[1] ?? "",
                    role: seatRoleForPosition(m.role),
                    state: "invited",
                    lastActive: "—",
                  },
                ],
          );
          toast({ message: t("{name} invited", { name: m.name }), detail: t("They now appear anywhere you can hand a month over."), tone: "ok" });
        }}
      />
    </div>
  );
}
