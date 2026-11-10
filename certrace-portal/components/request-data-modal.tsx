"use client";

/* "Request data" — the one entry point for asking someone for data. Asks
   first whether the person is inside the company: those people become team
   editors (invite them to the workbook), outside suppliers get a Smart Link
   form instead. See lib/request-route.ts. */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal, Button, Field, inputClass, cn } from "./ui";
import { useT } from "@/lib/i18n";
import { useCompanyDirectory } from "@/lib/team-query";
import { sendInvite } from "@/lib/api/team";
import { requestRoute, type RequestRoute } from "@/lib/request-route";

type Answer = "internal" | "external";

export function RequestDataModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const directory = useCompanyDirectory();
  const isOwner = directory?.isOwner ?? false;
  const [answer, setAnswer] = React.useState<Answer | null>(null);
  const [route, setRoute] = React.useState<RequestRoute | null>(null);
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");

  // start over each time the popup opens
  React.useEffect(() => {
    if (open) {
      setAnswer(null);
      setRoute(null);
      setEmail("");
      setBusy(false);
      setError("");
      setNotice("");
    }
  }, [open]);

  const next = () => {
    if (!answer) return;
    const r = requestRoute(answer, { isOwner });
    if (r.kind === "supplier") {
      onClose();
      router.push(r.href);
      return;
    }
    setRoute(r);
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const sent = await sendInvite(email);
      // Stays open so the result line can be read; the member is saved either way.
      setNotice(
        sent.delivered
          ? t("Invitation sent to {email}.", {
              email: email.trim().toLowerCase(),
            })
          : t(
              "Invitation saved. Check delivery before asking them to join.",
            ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("Request data")}
      width="max-w-lg"
    >
      {route === null && (
        <div className="space-y-4">
          <p className="text-sm font-medium">
            {t("Who should provide this data?")}
          </p>
          <div role="radiogroup" className="grid gap-3">
            <button
              type="button"
              role="radio"
              aria-checked={answer === "internal"}
              onClick={() => setAnswer("internal")}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors",
                answer === "internal"
                  ? "border-[#111] bg-black/[0.03]"
                  : "border-black/10 hover:border-black/25",
              )}
            >
              <span className="block text-sm font-medium">
                {t("Someone in our company (factory, engineering, accounting)")}
              </span>
              <span className="mt-1 block text-[12.5px] text-black/50">
                {t("They get a portal login and edit the workspace with you")}
              </span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={answer === "external"}
              onClick={() => setAnswer("external")}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors",
                answer === "external"
                  ? "border-[#111] bg-black/[0.03]"
                  : "border-black/10 hover:border-black/25",
              )}
            >
              <span className="block text-sm font-medium">
                {t("An outside supplier of precursors or materials")}
              </span>
              <span className="mt-1 block text-[12.5px] text-black/50">
                {t("They get a secure form link; no login")}
              </span>
            </button>
          </div>
          <div className="flex justify-end gap-2 border-t border-black/[0.06] pt-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t("Cancel")}
            </Button>
            <Button size="sm" disabled={!answer} onClick={next}>
              {t("Next")}
            </Button>
          </div>
        </div>
      )}

      {route?.kind === "ask-owner" && (
        <div className="space-y-4">
          <p className="text-sm">
            {t(
              "Only the company owner can add team members. Ask them to invite this person from Team.",
            )}
          </p>
          <div className="flex justify-end border-t border-black/[0.06] pt-4">
            <Button size="sm" onClick={onClose}>
              {t("Close")}
            </Button>
          </div>
        </div>
      )}

      {route?.kind === "invite" && notice === "" && (
        <form className="space-y-4" onSubmit={(e) => void invite(e)}>
          <Field label={t("Email")}>
            <input
              type="email"
              autoFocus
              required
              disabled={busy}
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
            />
          </Field>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-black/[0.06] pt-4">
            <Button variant="ghost" size="sm" disabled={busy} onClick={onClose}>
              {t("Cancel")}
            </Button>
            <Button size="sm" type="submit" disabled={busy}>
              {t("Send invitation")}
            </Button>
          </div>
        </form>
      )}

      {route?.kind === "invite" && notice !== "" && (
        <div className="space-y-4">
          <p role="status" className="text-sm">
            {notice}
          </p>
          <div className="flex justify-end border-t border-black/[0.06] pt-4">
            <Button size="sm" onClick={onClose}>
              {t("Close")}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
