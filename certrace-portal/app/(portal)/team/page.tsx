"use client";

/* Team roster and reviewer contacts, persisted through the account record API. */

import * as React from "react";
import Link from "next/link";
import { Plus, User, Crown, UserPlus, X } from "lucide-react";
import {
  Card,
  PageHeader,
  Button,
  Chip,
  StatusLabel,
  Eyebrow,
  Stat,
  Tone,
} from "@/components/ui";
import { ErrorState, LoadingState } from "@/components/query-state";
import { AddMemberModal } from "@/components/add-member-modal";
import { CompanyTeam } from "@/components/company-team";
import { api, result } from "@/lib/api/client";
import { toast } from "@/components/toast";
import { Seat, SeatRole } from "@/lib/data";
import {
  useTeam,
  useCompanyDirectory,
  useInvalidateTeam,
} from "@/lib/team-query";
import { removeTeamMember } from "@/lib/team-store";
import { flushAccount, refreshAccountRecords } from "@/lib/account-storage";
import { seatCap } from "@/lib/plan";
import { useAccount } from "@/components/account-lock";
import { PlanCapNotice } from "@/components/plan-cap-notice";
import { useT } from "@/lib/i18n";

/* No `verifier` entry — see the header. The type in lib/data.ts still carries
   it so old fixtures and stored rows type-check; nothing here offers it. */
const roleMeta: Partial<
  Record<
    SeatRole,
    { label: string; tone: Tone; icon: React.ElementType; desc: string }
  >
> = {
  owner: {
    label: "Owner",
    tone: "info",
    icon: Crown,
    desc: "Everything a member can do, plus billing, seats and deleting product reports. There is always exactly one.",
  },
  member: {
    label: "Member",
    tone: "muted",
    icon: User,
    desc: "Build and manage product reports, fill months in, chase suppliers.",
  },
};

const FALLBACK_ROLE = {
  label: "Member",
  tone: "muted" as Tone,
  icon: User,
  desc: "Build and manage product reports.",
};
const metaFor = (r: SeatRole) => roleMeta[r] ?? FALLBACK_ROLE;

const stateMeta: Record<string, { label: string; tone: Tone }> = {
  active: { label: "active", tone: "ok" },
  contact: { label: "reviewer contact", tone: "muted" },
  invited: { label: "invited", tone: "muted" },
  review_requested: { label: "reviewing", tone: "info" },
  signed_off: { label: "signed off", tone: "ok" },
};

export default function TeamPage() {
  const t = useT();
  const team = useTeam();
  const invalidateTeam = useInvalidateTeam();
  const members = (team.data ?? []).filter((m) => m.role !== "Verifier");
  const directory = useCompanyDirectory();
  const owner = directory?.isOwner === true;
  const seats: Seat[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    org: m.email.split("@")[1] ?? "",
    role: directory?.id === m.id ? "owner" : "member",
    state: directory?.members.some(
      (p) => p.email.toLowerCase() === m.email.toLowerCase(),
    )
      ? "active"
      : "contact",
    lastActive: "—",
  }));
  const [error, setError] = React.useState("");
  const [removing, setRemoving] = React.useState(false);
  const [showContact, setShowContact] = React.useState(false);
  const [showAdd, setShowAdd] = React.useState(false);
  /* Two-press remove. A single click that frees a paid seat and revokes
     somebody's access is a click that gets made by accident on a trackpad. */
  const [armed, setArmed] = React.useState<string | null>(null);

  const used = directory
    ? directory.members.length + directory.invitations.length
    : seats.length;
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

  const removeSeat = async (s: Seat) => {
    if (armed !== s.id) {
      setArmed(s.id);
      return;
    }
    setRemoving(true);
    setError("");
    try {
      const active = directory?.members.find(
        (m) => m.email.toLowerCase() === s.email.toLowerCase(),
      );
      if (active) {
        await result(api().api.v1.team.members({ id: active.id }).delete());
        await refreshAccountRecords();
      } else {
        removeTeamMember(s.id);
        await flushAccount();
      }
      invalidateTeam();
      setArmed(null);
      toast({
        message: t("{name} removed", { name: s.name }),
        detail: t("The team list has been updated."),
        tone: "info",
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("Team & seats")}
        title={t("Who is on the account.")}
        lead={t(
          "Your team and what each person can do. Suppliers never take a seat — they fill in through a link, without an account.",
        )}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowContact(true)}
            >
              Add reviewer contact
            </Button>
            {owner && (
              <Button
                size="sm"
                onClick={() => setShowAdd(true)}
                disabled={!owner || cap.atCap}
                title={cap.atCap ? t("No seats left on your plan.") : undefined}
              >
                <UserPlus size={14} strokeWidth={1.5} /> {t("Invite member")}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <Stat
            value={cap.cap == null ? used : cap.label}
            label={t("Seats used")}
            sub={
              cap.cap == null
                ? t("no cap on your plan")
                : t("{plan} plan", { plan: plan.name })
            }
          />
        </Card>
        <Card className="p-5">
          <Stat
            value={external}
            label={t("External partners")}
            sub={t("outside your company")}
          />
        </Card>
        <Link href="/billing" className="block">
          <Card
            highlight
            className="p-5 transition-colors hover:border-black/30"
          >
            <Stat
              value={t(plan.name)}
              label={t("Current plan")}
              sub={t("see what each tier includes →")}
            />
          </Card>
        </Link>
      </div>

      <AddMemberModal
        open={showContact}
        onClose={() => setShowContact(false)}
        onAdded={() => {
          invalidateTeam();
          toast({ message: t("Reviewer contact saved"), tone: "ok" });
        }}
      />
      <CompanyTeam showInvite={showAdd} onClose={() => setShowAdd(false)} />
      <PlanCapNotice cap={cap} />
      {error && (
        <p role="alert" className="text-sm text-[#dc2626]">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Seat list */}
        <div className="space-y-3">
          <Eyebrow>{t("Members and reviewer contacts")}</Eyebrow>
          <Card className="divide-y divide-black/[0.06] p-0">
            {seats.map((s) => {
              const rm = metaFor(s.role);
              const sm = stateMeta[s.state] ?? stateMeta.invited;
              const Icon = rm.icon;
              const isOwner = s.role === "owner";
              return (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-black/10 text-black/55">
                      <Icon size={17} strokeWidth={1.5} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm text-black/70">
                        {s.name}
                      </div>
                      <div className="truncate font-mono text-[11px] text-black/35">
                        {s.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-none items-center gap-3">
                    <div className="flex flex-col items-end gap-1.5">
                      <Chip tone={rm.tone}>{t(rm.label)}</Chip>
                      <StatusLabel
                        tone={sm.tone}
                        label={t(sm.label)}
                        glow={s.state === "active"}
                        pulse={s.state === "review_requested"}
                      />
                    </div>
                    {/* The owner has no remove control: an organisation with
                        nobody who can reach billing is locked out of itself. */}
                    {owner && !isOwner && (
                      <button
                        type="button"
                        disabled={removing}
                        onClick={() => void removeSeat(s)}
                        onBlur={() => setArmed((a) => (a === s.id ? null : a))}
                        aria-label={t("Remove {name}", { name: s.name })}
                        title={
                          armed === s.id
                            ? t("Click again to remove")
                            : t("Remove from the account")
                        }
                        className={
                          armed === s.id
                            ? "rounded-lg border border-[#dc2626]/40 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.08em] text-[#dc2626]"
                            : "grid h-8 w-8 place-items-center rounded-lg text-black/30 transition-colors hover:bg-black/[0.05] hover:text-[#dc2626]"
                        }
                      >
                        {armed === s.id ? (
                          t("Confirm")
                        ) : (
                          <X size={15} strokeWidth={1.5} />
                        )}
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
          <Eyebrow>{t("The two roles")}</Eyebrow>
          <Card warm className="p-5">
            <div className="space-y-4">
              {(["owner", "member"] as SeatRole[]).map((r) => {
                const rm = metaFor(r);
                const Icon = rm.icon;
                return (
                  <div key={r} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-lg border border-black/10 text-black/55">
                      <Icon size={14} strokeWidth={1.5} />
                    </span>
                    <div>
                      <div className="text-[13px] text-black/70">
                        {t(rm.label)}
                      </div>
                      <div className="mt-0.5 text-[12px] leading-relaxed text-black/45">
                        {t(rm.desc)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          {owner && (
            <Card warm className="p-5">
              <Eyebrow>{t("Add someone new")}</Eyebrow>
              <p className="mt-2 text-[12.5px] leading-relaxed text-black/50">
                {cap.atCap
                  ? t(
                      "Every seat on your plan is taken. Remove someone to release a seat, or talk to sales — suppliers never take a seat.",
                    )
                  : t(
                      "Invite a teammate by email to give them access to your company’s reports.",
                    )}
              </p>
              <Button
                className="mt-3 w-full"
                variant="secondary"
                size="sm"
                onClick={() => setShowAdd(true)}
                disabled={!owner || cap.atCap}
              >
                <Plus size={14} strokeWidth={1.5} /> {t("Invite member")}
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
