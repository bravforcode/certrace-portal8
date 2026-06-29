"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, ShieldCheck, BadgeCheck, User, Crown } from "lucide-react";
import { Card, PageHeader, Button, Chip, StatusLabel, Eyebrow, Field, inputClass, Stat, cn, Tone } from "@/components/ui";
import { SEATS, ORG, Seat, SeatRole } from "@/lib/data";

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

export default function TeamPage() {
  const [seats, setSeats] = React.useState<Seat[]>(SEATS);
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<SeatRole>("legal");

  const invite = () => {
    if (!email) return;
    setSeats((s) => [
      ...s,
      {
        id: `inv-${Date.now()}`,
        name: email.split("@")[0],
        email,
        org: email.split("@")[1] ?? "",
        role,
        state: "invited",
        lastActive: "—",
      },
    ]);
    setEmail("");
  };

  const used = seats.length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Team & seats"
        title="Who's on the platform."
        lead="Add colleagues, your legal team, or your verifier as seats. Each gets scoped access to the right declarations. Suppliers are always free and never take a seat."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-5">
          <Stat value={`${used}/${ORG.seatsTotal}`} label="Seats used" />
        </Card>
        <Card className="p-5">
          <Stat value={seats.filter((s) => s.role === "legal").length} label="Legal seats" />
        </Card>
        <Card className="p-5">
          <Stat value={seats.filter((s) => s.role === "auditor").length} label="Verifier seats" />
        </Card>
        <Link href="/billing" className="block">
          <Card highlight className="p-5 transition-colors hover:border-black/30">
            <Stat value={ORG.planLabel} label="Current plan" sub="upgrade for more seats →" />
          </Card>
        </Link>
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

        {/* Invite + roles */}
        <div className="space-y-4">
          <Eyebrow>Invite a seat</Eyebrow>
          <Card className="p-5">
            <div className="space-y-3">
              <Field label="Email">
                <input className={inputClass} placeholder="name@firm.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="Role">
                <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as SeatRole)}>
                  <option value="member">Member</option>
                  <option value="legal">Legal / compliance</option>
                  <option value="auditor">Verifier / auditor</option>
                </select>
              </Field>
              <Button className="w-full" onClick={invite}>
                <Plus size={15} strokeWidth={1.5} /> Send invite
              </Button>
            </div>
          </Card>

          <Card warm className="p-5">
            <Eyebrow>What each role can do</Eyebrow>
            <div className="mt-3 space-y-3">
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
        </div>
      </div>
    </div>
  );
}
