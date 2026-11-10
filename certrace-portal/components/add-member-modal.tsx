"use client";

/* "Add person" popup — the one place a new internal reviewer / sign-off
   contact is created. Opened from a submission's reviewer picker, the report
   sign-off step, and the Team page; writes to lib/team-store.ts so the person
   immediately exists everywhere. */

import * as React from "react";
import { X, UserPlus } from "lucide-react";
import { Card, Button, Eyebrow, Field, inputClass } from "./ui";
import { Portal } from "./controls";
import { addTeamMember, type TeamMember } from "@/lib/team-store";
import { flushAccount } from "@/lib/account-storage";
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
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  // reset the form each time the popup opens
  React.useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setError("");
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, busy]);

  if (!open) return null;

  const valid = name.trim().length > 0 && /\S+@\S+\.\S+/.test(email);
  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError("");
    try {
      const member = addTeamMember({ name, email });
      await flushAccount();
      onAdded(member);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Portal>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events --
      modal backdrop. Dismiss-on-outside-click is a pointer affordance; the keyboard
      equivalent is Escape, which this dialog already handles. */}
      <div
        className="fixed inset-0 z-[220] flex items-center justify-center bg-black/25 p-4 backdrop-blur-[2px]"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && !busy) onClose();
        }}
      >
        <Card className="ct-enter w-full max-w-md p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Eyebrow>{t("Team")}</Eyebrow>
              <h3 className="mt-1.5 font-[family-name:var(--font-plex)] text-xl font-light tracking-tight text-[#111]">
                {t("Add a person")}
              </h3>
            </div>
            <button
              disabled={busy}
              onClick={onClose}
              aria-label={t("Close")}
              className="grid h-8 w-8 flex-none place-items-center rounded-lg text-black/35 transition-colors hover:bg-black/[0.05] hover:text-black"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-black/50">
            {note ??
              t(
                "Save a reviewer contact. To give them company access, invite them from Team.",
              )}
          </p>

          {error && (
            <p role="alert" className="mt-3 text-sm text-[#dc2626]">
              {error}
            </p>
          )}
          <fieldset disabled={busy} className="mt-5 space-y-3">
            <Field label={t("Full name")}>
              <input
                className={inputClass}
                placeholder={t("e.g. Preeda C.")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </Field>
            <Field label={t("Email")}>
              <input
                className={inputClass}
                type="email"
                placeholder={t("name@firm.com")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
          </fieldset>

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-black/[0.06] pt-4">
            <Button variant="ghost" size="sm" disabled={busy} onClick={onClose}>
              {t("Cancel")}
            </Button>
            <Button
              size="sm"
              disabled={!valid || busy}
              onClick={() => void submit()}
            >
              <UserPlus size={14} strokeWidth={1.5} /> {t("Add contact")}
            </Button>
          </div>
        </Card>
      </div>
    </Portal>
  );
}
