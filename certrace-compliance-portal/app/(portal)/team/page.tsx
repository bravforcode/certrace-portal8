"use client";

/* ════════════════════════════════════════════════════════════
   TEAM — who is on the account. READ-ONLY IN THIS BUILD.

   Seats are the owner's: granting one spends money, and revoking one takes
   somebody's access away. Neither is a compliance decision.

   THE PAGE IS KEPT ANYWAY, and that is deliberate. Everything this seat does
   ends in handing work to a named person — a month goes back to whoever
   entered it, a capped estate is the owner's to raise, a pack that needs a
   figure changed needs the person who owns the figure. A reviewer who cannot
   see the roster is a reviewer who has to ask somebody who the somebody is.

   WHAT WENT: "Add person" (twice), the per-seat remove control, the
   AddMemberModal, and the plan card that linked to /billing. What is left is
   the roster, the role explainer and the seat count — three facts, no verbs.

   ── THE ROLE EXPLAINER IS CORRECTED HERE, NOT JUST DISABLED ──
   The owner build described this seat as "Everything a member can do, plus
   reviewing and signing packages off before they leave." That sentence is the
   one thing on the page this build contradicts on purpose (see lib/seat.ts):
   this seat is not a superset of Operations. It shares the FIGURES with them
   — correcting a reading is deliberately allowed — and it does not run the
   estate: no workspace of its own, no supplier requests, no archiving.

   Leaving the old copy in place would have been the worst of both: a portal
   that refuses a control on one screen and promises it on another. So the
   descriptions say what the product actually enforces, and the seat this
   reader holds is marked as theirs. THEY ARE PROSE, NOT DERIVED FROM
   `GRANTS` — when a capability moves in lib/seat.ts, these three sentences
   have to be re-read by hand or the page starts describing a build that no
   longer exists.

   INHERITED FROM THE OWNER BUILD, UNCHANGED: no verifier seat (Certrace has
   no verifier portal, so a seat implying access that does not exist was
   removed there), and the seat cap read from the plan rather than a literal.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { ShieldCheck, User, Crown } from "lucide-react";
import { Card, PageHeader, Chip, StatusLabel, Eyebrow, Stat, Tone } from "@/components/ui";
import { Note } from "@/components/workspace/chrome";
import { SEATS, Seat, SeatRole } from "@/lib/data";
import { loadTeam, type TeamMember } from "@/lib/team-store";
import { seatCap } from "@/lib/plan";
import { useAccount } from "@/components/account-lock";
import { PlanCapNotice } from "@/components/plan-cap-notice";
import { SIGNED_IN_SEAT, DATA_OWNER_NAME, OWNER_NAME } from "@/lib/seat";
import { useT } from "@/lib/i18n";

/* No `verifier` entry — see the header. The type in lib/data.ts still carries
   it so old fixtures and stored rows type-check; nothing here offers it. */
const roleMeta: Partial<Record<SeatRole, { label: string; tone: Tone; icon: React.ElementType; desc: string }>> = {
  owner: {
    label: "Owner",
    tone: "info",
    icon: Crown,
    /* NOT "deleting workspaces". Nothing in this product deletes one — the
       owner included; Archive is the only way a workspace leaves the estate.
       See the ACCOUNT set in lib/seat.ts. */
    desc: "Everything: the figures, the sign-off, plus billing and seats. There is always exactly one.",
  },
  member: {
    label: "Member",
    tone: "muted",
    icon: User,
    desc: "Builds and manages workspaces, fills months in, chases suppliers. Cannot sign off their own work.",
  },
  legal: {
    label: "Legal / compliance",
    tone: "info",
    icon: ShieldCheck,
    /* THE CORRECTED SENTENCE. See the header. */
    desc: "Reads everything, corrects a figure that is wrong, confirms or sends back a month, and signs the finished pack off. Does not open workspaces or chase suppliers.",
  },
};

const FALLBACK_ROLE = { label: "Member", tone: "muted" as Tone, icon: User, desc: "Builds and manages workspaces." };
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
  const seats: Seat[] = React.useMemo(() => SEATS.filter((s) => s.role !== "verifier"), []);
  const [members, setMembers] = React.useState<TeamMember[]>([]);

  React.useEffect(() => {
    setMembers(loadTeam().filter((m) => m.role !== "Verifier"));
  }, []);

  const used = seats.length;
  const external = members.filter((m) => m.kind === "external").length;
  /* useAccount() is what makes this page re-render when the plan resolves on
     the client — seatCap() reads the plan directly and would otherwise still
     be answering for the boot-time one. */
  const { plan } = useAccount();
  const cap = seatCap(used);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("Team")}
        title={t("Who is on the account.")}
        lead={t("Your colleagues and what each of them can do. Seats are {owner}'s to grant — this is a roster, not a control panel.", { owner: OWNER_NAME })}
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
        {/* NOT A LINK. In the owner build this card opens /billing to compare
            tiers. The tier is a fact worth stating — it is why the seat count
            has the ceiling it has — but it is not a door this seat walks
            through. */}
        <Card className="p-5">
          <Stat value={t(plan.name)} label={t("Current plan")} sub={t("set by the account owner")} />
        </Card>
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
                        {/* Marked, because this page is the one place the
                            reader can check that the seat they hold is the
                            seat the account thinks they hold. */}
                        {isYou && <span className="ml-2 text-[11px] uppercase tracking-[0.08em] text-black/35">{t("you")}</span>}
                      </div>
                      <div className="truncate font-mono text-[11px] text-black/35">{s.email}</div>
                    </div>
                  </div>
                  <div className="flex flex-none items-center gap-3">
                    <div className="flex flex-col items-end gap-1.5">
                      <Chip tone={rm.tone}>{t(rm.label)}</Chip>
                      <StatusLabel tone={sm.tone} label={t(sm.label)} glow={s.state === "active"} pulse={s.state === "review_requested"} />
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
          <Note tone="muted">
            {t("A month you send back goes to {name}, who entered it. You will see it here again when they resubmit.", { name: DATA_OWNER_NAME })}
          </Note>
        </div>

        {/* Roles explainer */}
        <div className="space-y-4">
          <Eyebrow>{t("The three roles")}</Eyebrow>
          <Card warm className="p-5">
            <div className="space-y-4">
              {(["owner", "member", "legal"] as SeatRole[]).map((r) => {
                const rm = metaFor(r);
                const Icon = rm.icon;
                const yours = r === SIGNED_IN_SEAT.role;
                return (
                  <div key={r} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-lg border border-black/10 text-black/55">
                      <Icon size={14} strokeWidth={1.5} />
                    </span>
                    <div>
                      <div className="text-[13px] text-black/70">
                        {t(rm.label)}
                        {yours && <span className="ml-2 text-[11px] uppercase tracking-[0.08em] text-black/35">{t("yours")}</span>}
                      </div>
                      <div className="mt-0.5 text-[12px] leading-relaxed text-black/45">{t(rm.desc)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* WHERE "Add someone new" USED TO BE. A card with a disabled button
              would have been worse than this: it puts the action in front of
              the reader and then refuses it. This says who does it instead. */}
          <Card warm className="p-5">
            <Eyebrow>{t("Adding someone")}</Eyebrow>
            <p className="mt-2 text-[12.5px] leading-relaxed text-black/50">
              {t("Seats are granted by the account owner. Ask them and the new person appears here, and anywhere a month can be handed over.")}
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-black/40">
              {t("Suppliers are not seats. They answer through a link, without an account, and are free and unlimited on every tier.")}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
