"use client";

/* ════════════════════════════════════════════════════════════
   TEAM — who is on the account (read-only for a member seat)

   In the owner build this page is "Team & seats": it counts seats against the
   plan, links to billing, invites people and removes them. Every one of those
   is a thing lib/seat.ts says a member does not do.

   IT IS NOT DELETED, THOUGH, AND THAT IS THE POINT. A member's job includes
   handing a month to somebody to review and getting a finished pack signed
   off — and both of those are "ask a particular person". A portal that hides
   the roster forces them to guess a name into a picker, or to go and ask in
   chat who the compliance person is this quarter. So the page stays and the
   CONTROLS go: the same people, the same roles, no add, no remove, no seat
   meter and no plan.

   WHAT WENT, PRECISELY:
     · "Add person" — twice (the header action and the sidebar card), plus the
       AddMemberModal behind them. `manageSeats` is the owner's.
     · REMOVE, on every row. It was the page's one destructive control.
     · The seat counter, the plan card and the /billing link. A member cannot
       buy a seat or read an invoice, and the cap notice that used to sit here
       was telling them to talk to sales on their employer's behalf.

   WHAT STAYED:
     · The roster, with each person's role and state, so a name can be found.
     · The role explainer. It is the clearest statement in the product of what
       the three seats mean, and it is the reason a member can tell who to
       send a pack to. It now marks which of the three the reader is holding.
     · External partners, counted — knowing which of these people is outside
       the company is exactly what you want before forwarding them figures.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { ShieldCheck, User, Crown } from "lucide-react";
import { Card, PageHeader, Chip, StatusLabel, Eyebrow, Stat, Tone } from "@/components/ui";
import { SEATS, Seat, SeatRole } from "@/lib/data";
import { loadTeam, type TeamMember } from "@/lib/team-store";
import { SEAT_ROLE, SIGNED_IN_SEAT } from "@/lib/seat";
import { useT } from "@/lib/i18n";

/* No `verifier` entry — see the header note in the owner build. The type in
   lib/data.ts still carries it so old fixtures type-check; nothing here
   offers it. */
const roleMeta: Partial<Record<SeatRole, { label: string; tone: Tone; icon: React.ElementType; desc: string }>> = {
  owner: {
    label: "Owner",
    tone: "info",
    icon: Crown,
    desc: "Everything a member can do, plus billing, seats and deleting workspaces. There is always exactly one.",
  },
  member: { label: "Member", tone: "muted", icon: User, desc: "Build and manage workspaces, fill months in, chase suppliers." },
  legal: { label: "Legal / compliance", tone: "info", icon: ShieldCheck, desc: "Everything a member can do, plus reviewing and signing packages off before they leave." },
};

const FALLBACK_ROLE = { label: "Member", tone: "muted" as Tone, icon: User, desc: "Build and manage workspaces." };
const metaFor = (r: SeatRole) => roleMeta[r] ?? FALLBACK_ROLE;

const stateMeta: Record<string, { label: string; tone: Tone }> = {
  active: { label: "active", tone: "ok" },
  invited: { label: "invited", tone: "muted" },
  review_requested: { label: "reviewing", tone: "info" },
  signed_off: { label: "signed off", tone: "ok" },
};

export default function TeamPage() {
  const t = useT();
  /* The verifier seat is filtered out of the fixture rather than deleted from
     it: lib/data.ts is shared with the declaration screens that still render
     history, and a row removed there would change what those say happened. */
  const seats = React.useMemo<Seat[]>(() => SEATS.filter((s) => s.role !== "verifier"), []);
  const [members, setMembers] = React.useState<TeamMember[]>([]);

  React.useEffect(() => {
    setMembers(loadTeam().filter((m) => m.role !== "Verifier"));
  }, []);

  const external = members.filter((m) => m.kind === "external").length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("Team")}
        title={t("Who is on the account.")}
        lead={t(
          "Your colleagues and what each of them can do — this is where you find the person to hand a month to, or the one who signs a finished pack off. Suppliers are always free and never take a seat: they answer through a link, without an account.",
        )}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <Card className="p-5">
          <Stat value={seats.length} label={t("People on the account")} sub={t("including you")} />
        </Card>
        <Card className="p-5">
          <Stat value={external} label={t("External partners")} sub={t("outside your company")} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* ── The roster. Rows, not controls. ─────────────── */}
        <div className="space-y-3">
          <Eyebrow>{t("Active seats")}</Eyebrow>
          <Card className="divide-y divide-black/[0.06] p-0">
            {seats.map((s) => {
              const rm = metaFor(s.role);
              const sm = stateMeta[s.state] ?? stateMeta.invited;
              const Icon = rm.icon;
              const isYou = s.id === SIGNED_IN_SEAT.id;
              return (
                <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-black/10 text-black/55">
                      <Icon size={17} strokeWidth={1.5} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm text-black/70">
                        {s.name}
                        {isYou && <span className="ml-2 text-[11px] text-black/35">{t("(you)")}</span>}
                      </div>
                      <div className="truncate font-mono text-[11px] text-black/35">{s.email}</div>
                    </div>
                  </div>
                  <div className="flex flex-none flex-col items-end gap-1.5">
                    <Chip tone={rm.tone}>{t(rm.label)}</Chip>
                    <StatusLabel tone={sm.tone} label={t(sm.label)} glow={s.state === "active"} pulse={s.state === "review_requested"} />
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        {/* ── Roles explainer ──────────────────────────────── */}
        <div className="space-y-4">
          <Eyebrow>{t("The three roles")}</Eyebrow>
          <Card warm className="p-5">
            <div className="space-y-4">
              {(["owner", "member", "legal"] as SeatRole[]).map((r) => {
                const rm = metaFor(r);
                const Icon = rm.icon;
                const yours = r === SEAT_ROLE;
                return (
                  <div key={r} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-lg border border-black/10 text-black/55">
                      <Icon size={14} strokeWidth={1.5} />
                    </span>
                    <div>
                      <div className="text-[13px] text-black/70">
                        {t(rm.label)}
                        {yours && <span className="ml-2 text-[11px] text-black/35">{t("— yours")}</span>}
                      </div>
                      <div className="mt-0.5 text-[12px] leading-relaxed text-black/45">{t(rm.desc)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Replaces "Add someone new". Says who does it instead of offering
              a control that would fail, and does not mention a price. */}
          <Card warm className="p-5">
            <Eyebrow>{t("Need someone added?")}</Eyebrow>
            <p className="mt-2 text-[12.5px] leading-relaxed text-black/50">
              {t("Seats are the account owner's to grant. Ask them and the new person appears here — and in every picker where you hand a month over.")}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
