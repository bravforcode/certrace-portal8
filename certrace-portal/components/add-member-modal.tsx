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
import { useT } from "@/lib/i18n";

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
  const t = useT();
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
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events --
      modal backdrop. Dismiss-on-outside-click is a pointer affordance; the keyboard
      equivalent is Escape, which this dialog already handles. */}
      <div
        className="fixed inset-0 z-[220] flex items-center justify-center bg-black/25 p-4 backdrop-blur-[2px]"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <Card className="ct-enter w-full max-w-md p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Eyebrow>{t("Team")}</Eyebrow>
              <h3 className="mt-1.5 font-[family-name:var(--font-plex)] text-xl font-light tracking-tight text-[#111]">{t("Add a person")}</h3>
            </div>
            <button onClick={onClose} aria-label={t("Close")} className="grid h-8 w-8 flex-none place-items-center rounded-lg text-black/35 transition-colors hover:bg-black/[0.05] hover:text-black">
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-black/50">
            {note ?? t("They join your team list and can be assigned to any check. We email them an invite with scoped, read-only access — they never see anything outside what you share.")}
          </p>

          <div className="mt-5 space-y-3">
            <Field label={t("Full name")}>
              <input className={inputClass} placeholder={t("e.g. Preeda C.")} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </Field>
            <Field label={t("Email")}>
              <input className={inputClass} type="email" placeholder={t("name@firm.com")} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            {/* ROLE, NOT "POSITION". It used to offer five job titles that
                all resolved to two roles — see the note above POSITION_OPTIONS
                in lib/team-store.ts. The hint under each option is what that
                role can actually do, so the choice is made against the access
                rather than against an org chart. */}
            <Field label={t("Role")}>
              <Select
                value={role}
                onChange={setRole}
                options={POSITION_OPTIONS.map((p) => ({ value: p.value, label: t(p.value), hint: t(p.hint) }))}
                ariaLabel={t("Role")}
              />
            </Field>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-black/[0.06] pt-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t("Cancel")}
            </Button>
            <Button size="sm" disabled={!valid} onClick={submit}>
              <UserPlus size={14} strokeWidth={1.5} /> {t("Add & invite")}
            </Button>
          </div>
        </Card>
      </div>
    </Portal>
  );
}
