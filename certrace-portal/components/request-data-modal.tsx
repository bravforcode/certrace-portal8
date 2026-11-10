"use client";

/* "Request data" — the one entry point for asking someone for data. Asks
   first whether the person is in the company: those people become team
   editors (invite them to the workbook), outside suppliers get a Smart Link
   form instead. See lib/request-route.ts. */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal, Button, Field, inputClass } from "./ui";
import { toast } from "./toast";
import { useT } from "@/lib/i18n";
import { useCompanyDirectory } from "@/lib/team-query";
import { sendInvite } from "@/lib/api/team";
import { requestRoute, type RequestRoute } from "@/lib/request-route";

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
  // Until the directory loads we cannot tell an owner from an editor, so Yes waits.
  const [route, setRoute] = React.useState<RequestRoute | null>(null);
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  // start over each time the popup opens
  React.useEffect(() => {
    if (open) {
      setRoute(null);
      setEmail("");
      setBusy(false);
      setError("");
    }
  }, [open]);

  const answer = (inCompany: boolean) => {
    const r = requestRoute(inCompany ? "internal" : "external", { isOwner });
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
    const address = email.trim().toLowerCase();
    try {
      const sent = await sendInvite(email);
      if (sent.delivered) {
        toast({
          message: t("Invitation sent to {email}.", { email: address }),
          tone: "ok",
        });
      } else {
        toast({
          message: t(
            "Invitation saved. Check delivery before asking them to join.",
          ),
          tone: "warn",
        });
      }
      onClose();
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
            {t("Is this person in your company?")}
          </p>
          <div className="grid gap-3">
            <button
              type="button"
              disabled={directory === null}
              onClick={() => answer(true)}
              className="rounded-xl border border-black/10 p-4 text-left transition-colors hover:border-black/25 disabled:cursor-wait disabled:opacity-50"
            >
              <span className="block text-sm font-medium">{t("Yes")}</span>
              <span className="mt-1 block text-[12.5px] text-black/50">
                {t("They get a portal login and edit the workspace with you")}
              </span>
            </button>
            <button
              type="button"
              onClick={() => answer(false)}
              className="rounded-xl border border-black/10 p-4 text-left transition-colors hover:border-black/25"
            >
              <span className="block text-sm font-medium">{t("No")}</span>
              <span className="mt-1 block text-[12.5px] text-black/50">
                {t("They get a secure form link; no login")}
              </span>
            </button>
          </div>
          <div className="flex justify-end border-t border-black/[0.06] pt-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t("Cancel")}
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

      {route?.kind === "invite" && (
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
    </Modal>
  );
}
