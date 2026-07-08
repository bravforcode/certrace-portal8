"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, ShieldCheck, BadgeCheck, User, Crown, ClipboardCheck, Inbox, UserPlus } from "lucide-react";
import { Card, PageHeader, Button, Chip, StatusLabel, Eyebrow, Stat, cn, Tone } from "@/components/ui";
import { AddMemberModal } from "@/components/add-member-modal";
import { toast } from "@/components/toast";
import { SEATS, DECLARATIONS, ORG, Seat, SeatRole } from "@/lib/data";
import { loadExporterState } from "@/lib/exporter-review";
import { loadCreatedDeclarations, loadHiddenDeclarationIds } from "@/lib/declarations-store";
import { loadTeam, type TeamMember } from "@/lib/team-store";

const roleMeta: Record<SeatRole, { label: string; tone: Tone; icon: React.ElementType; desc: string }> = {
  owner: { label: "Owner", tone: "muted", icon: Crown, desc: "Full access · billing" },
  member: { label: "Member", tone: "muted", icon: User, desc: "Build & manage declarations" },
  legal: { label: "Legal / compliance", tone: "info", icon: ShieldCheck, desc: "Review & sign off packages" },
  auditor: { label: "Verifier / auditor", tone: "ok", icon: BadgeCheck, desc: "Read-only source-data access" },
};

const stateMeta: Record<string, { label: string; tone: Tone }> = {
  active: { label: "active", tone: "ok" },
  invited: { label: "invited", tone: "muted" },
  review_requested: { label: "reviewing", tone: "info" },
  signed_off: { label: "signed off", tone: "ok" },
};

/* One designated check a person carries on an open declaration — either a
   supplier-submission review or a report sign-off. */
type Assignment = {
  declId: string;
  declName: string;
  kind: "submission" | "signoff";
  detail: string; // supplier name, or "Report sign-off"
  status: string;
  tone: Tone;
};

function seatRoleForPosition(position: string): SeatRole {
  if (position === "Legal counsel") return "legal";
  if (position === "Verifier / auditor") return "auditor";
  return "member";
}

export default function TeamPage() {
  const [seats, setSeats] = React.useState<Seat[]>(SEATS);
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [assignments, setAssignments] = React.useState<Record<string, Assignment[]>>({});
  const [showAdd, setShowAdd] = React.useState(false);

  /* Cross-reference every open declaration's exporter state — that's where the
     designated checks live: review.reviewers per submission, state.signoffs per
     report. All localStorage, so read after mount. */
  const refresh = React.useCallback(() => {
    setMembers(loadTeam());
    const hidden = loadHiddenDeclarationIds();
    // every declaration, not just open ones — a check on a finished cycle is
    // still part of a person's record, and cycles without assignments add nothing
    const all = [...loadCreatedDeclarations(), ...DECLARATIONS].filter((d) => !hidden.includes(d.id));
    const map: Record<string, Assignment[]> = {};
    const push = (memberId: string, a: Assignment) => {
      (map[memberId] ??= []).push(a);
    };
    for (const d of all) {
      const ex = loadExporterState(d.id);
      const declName = d.title ?? d.name;
      for (const [supplierId, review] of Object.entries(ex.reviews)) {
        const supplier = d.suppliers.find((s) => s.id === supplierId);
        const status =
          review.decision === "approved"
            ? { status: "approved", tone: "ok" as Tone }
            : review.decision === "changes_requested"
              ? { status: "revision requested", tone: "warn" as Tone }
              : { status: "in review", tone: "info" as Tone };
        for (const rid of review.reviewers) {
          push(rid, { declId: d.id, declName, kind: "submission", detail: supplier?.name ?? "Supplier submission", ...status });
        }
      }
      for (const s of ex.signoffs ?? []) {
        push(s.memberId, {
          declId: d.id,
          declName,
          kind: "signoff",
          detail: "Report sign-off",
          status: s.confirmedAt ? "confirmed" : "awaiting confirmation",
          tone: s.confirmedAt ? "ok" : "info",
        });
      }
    }
    setAssignments(map);
  }, []);

  React.useEffect(() => {
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);

  const totalChecks = Object.values(assignments).reduce((a, l) => a + l.length, 0);
  const openChecks = Object.values(assignments).reduce((a, l) => a + l.filter((x) => x.tone !== "ok").length, 0);
  const used = seats.length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Team & seats"
        title="Who's checking what."
        lead="Your team, and the checks each person carries right now — supplier submissions to review, reports to sign off. Assign people from any declaration; suppliers are always free and never take a seat."
        actions={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <UserPlus size={14} strokeWidth={1.5} /> Add person
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-5">
          <Stat value={`${used}/${ORG.seatsTotal}`} label="Seats used" />
        </Card>
        <Card className="p-5">
          <Stat value={openChecks} label="Open checks" sub={totalChecks > 0 ? `${totalChecks} assigned in total` : "assign from a declaration"} />
        </Card>
        <Card className="p-5">
          <Stat value={members.filter((m) => m.kind === "external").length} label="External partners" sub="legal · verifier" />
        </Card>
        <Link href="/billing" className="block">
          <Card highlight className="p-5 transition-colors hover:border-black/30">
            <Stat value={ORG.planLabel} label="Current plan" sub="upgrade for more seats →" />
          </Card>
        </Link>
      </div>

      {/* ── Designated checks — the rethink: per-person, per-declaration ── */}
      <div className="space-y-3">
        <div>
          <Eyebrow>Designated checks</Eyebrow>
          <p className="mt-1 max-w-xl text-sm text-black/45">
            Every position is assigned to specific checks, not the whole platform — a submission review here, a report sign-off there.
            Assign people from a declaration&apos;s submission page or its sign-off step.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {members.map((m) => {
            const list = assignments[m.id] ?? [];
            return (
              <Card key={m.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-black/10 font-[family-name:var(--font-plex)] text-sm font-light text-black/60">
                      {m.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm text-black/75">{m.name}</div>
                      <div className="truncate text-[11px] text-black/40">{m.role} · <span className="font-mono text-[10px]">{m.email || "no email"}</span></div>
                    </div>
                  </div>
                  <Chip tone={m.kind === "external" ? "info" : "muted"} pulse={false}>{m.kind}</Chip>
                </div>

                {list.length === 0 ? (
                  <p className="mt-4 rounded-xl border border-dashed border-black/10 px-4 py-3 text-[12px] text-black/35">
                    No checks assigned right now.
                  </p>
                ) : (
                  <div className="mt-4 space-y-1.5">
                    {list.map((a, i) => (
                      <Link
                        key={i}
                        href={`/declarations/${a.declId}`}
                        className="flex items-center gap-2.5 rounded-xl border border-black/[0.06] bg-[#fafaf8] px-3 py-2.5 transition-colors hover:border-black/20"
                      >
                        <span className={cn("grid h-6 w-6 flex-none place-items-center rounded-lg", a.kind === "signoff" ? "bg-[#f0eee8] text-black/55" : "border border-black/10 text-black/40")}>
                          {a.kind === "signoff" ? <ClipboardCheck size={13} strokeWidth={1.5} /> : <Inbox size={13} strokeWidth={1.5} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] text-black/70">{a.detail}</span>
                          <span className="block truncate text-[10.5px] text-black/35">{a.declName}</span>
                        </span>
                        <StatusLabel tone={a.tone} label={a.status} pulse={a.tone === "info"} glow={a.tone === "ok"} />
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Seat list */}
        <div className="space-y-3">
          <Eyebrow>Active seats</Eyebrow>
          <Card className="divide-y divide-black/[0.06] p-0">
            {seats.map((s) => {
              const rm = roleMeta[s.role];
              const sm = stateMeta[s.state] ?? stateMeta.invited;
              const Icon = rm.icon;
              return (
                <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-black/10 text-black/55">
                      <Icon size={17} strokeWidth={1.5} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm text-black/70">{s.name}</div>
                      <div className="truncate font-mono text-[11px] text-black/35">{s.email}</div>
                    </div>
                  </div>
                  <div className="flex flex-none flex-col items-end gap-1.5">
                    <Chip tone={rm.tone}>{rm.label}</Chip>
                    <StatusLabel tone={sm.tone} label={sm.label} glow={s.state === "active"} pulse={s.state === "review_requested"} />
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        {/* Roles explainer */}
        <div className="space-y-4">
          <Eyebrow>What each role can do</Eyebrow>
          <Card warm className="p-5">
            <div className="space-y-3">
              {(["member", "legal", "auditor"] as SeatRole[]).map((r) => {
                const rm = roleMeta[r];
                const Icon = rm.icon;
                return (
                  <div key={r} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-lg border border-black/10 text-black/55">
                      <Icon size={14} strokeWidth={1.5} />
                    </span>
                    <div>
                      <div className="text-[13px] text-black/70">{rm.label}</div>
                      <div className="text-[12px] text-black/40">{rm.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card warm className="p-5">
            <Eyebrow>Add someone new</Eyebrow>
            <p className="mt-2 text-[12.5px] leading-relaxed text-black/50">
              The same popup lives inside every declaration — add a person while reviewing a submission or requesting sign-off, and
              they show up here with their designated checks.
            </p>
            <Button className="mt-3 w-full" variant="secondary" size="sm" onClick={() => setShowAdd(true)}>
              <Plus size={14} strokeWidth={1.5} /> Add person
            </Button>
          </Card>
        </div>
      </div>

      <AddMemberModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        note="They join your team roster and take a seat. Assign their first check from any declaration — a submission review or a report sign-off."
        onAdded={(m) => {
          setMembers(loadTeam());
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
          toast({ message: `${m.name} invited`, detail: "They now appear in every reviewer picker across your declarations.", tone: "ok" });
        }}
      />
    </div>
  );
}
