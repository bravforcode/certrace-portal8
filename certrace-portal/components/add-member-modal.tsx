"use client";

/* "Add person" popup — the one place a new internal reviewer / sign-off
   contact is created. Opened from a submission's reviewer picker, the report
   sign-off step, and the Team page; writes to lib/team-store.ts so the person
   immediately exists everywhere. */

import * as React from "react";
import { X, UserPlus } from "lucide-react";
import { Card, Button, Eyebrow, Field, inputClass } from "./ui";
import { Select, Portal } from "./controls";
import { addTeamMember, POSITION_OPTIONS, type TeamMember } from "@/lib/team-store";

export function AddMemberModal({
  open,
  onClose,
  onAdded,
  note,
}: {
  open: boolean;
  onClose: () => void;
  /** Called with the created (or matched-by-email) member. */
  onAdded: (member: TeamMember) => void;
  /** Context line under the title, e.g. what they'll get access to. */
  note?: string;
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState(POSITION_OPTIONS[0].value);

  // reset the form each time the popup opens
  React.useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setRole(POSITION_OPTIONS[0].value);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const valid = name.trim().length > 0 && /\S+@\S+\.\S+/.test(email);
  const submit = () => {
    if (!valid) return;
    onAdded(addTeamMember({ name, email, role }));
    onClose();
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[220] flex items-center justify-center bg-black/25 p-4 backdrop-blur-[2px]"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <Card className="ct-enter w-full max-w-md p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Eyebrow>Team</Eyebrow>
              <h3 className="mt-1.5 font-[family-name:var(--font-plex)] text-xl font-light tracking-tight text-[#111]">Add a person</h3>
            </div>
            <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 flex-none place-items-center rounded-lg text-black/35 transition-colors hover:bg-black/[0.05] hover:text-black">
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-black/50">
            {note ?? "They join this browser’s demo roster and can be assigned to a local check. No email, identity, access control, or cross-device sharing is configured."}
          </p>

          <div className="mt-5 space-y-3">
            <Field label="Full name">
              <input className={inputClass} placeholder="e.g. Preeda C." value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </Field>
            <Field label="Email">
              <input className={inputClass} type="email" placeholder="name@firm.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Position">
              <Select value={role} onChange={setRole} options={POSITION_OPTIONS.map((p) => ({ value: p.value, label: p.value, hint: p.kind === "external" ? "external" : undefined }))} ariaLabel="Position" />
            </Field>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-black/[0.06] pt-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={!valid} onClick={submit}>
              <UserPlus size={14} strokeWidth={1.5} /> Add locally
            </Button>
          </div>
        </Card>
      </div>
    </Portal>
  );
}
