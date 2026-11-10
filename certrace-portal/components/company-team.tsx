"use client";
import * as React from "react";
import { api, result } from "@/lib/api/client";
import { loadSession } from "@/lib/api/session";
import { selectCompany } from "@/lib/company-session";
import { useCompanyDirectory } from "@/lib/team-query";
import { flushAccount, refreshAccountRecords } from "@/lib/account-storage";
import { useQueryClient } from "@tanstack/react-query";
import { Card, Button, Field, inputClass } from "./ui";

export function CompanyTeam({
  showInvite,
  onClose,
}: {
  showInvite: boolean;
  onClose: () => void;
}) {
  const directory = useCompanyDirectory();
  const client = useQueryClient();
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  if (!directory) return null;
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      try {
        await refreshAccountRecords();
        await client.invalidateQueries();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      {directory.companies.length > 1 && (
        <Card className="p-4">
          <Field label="Company workspace">
            <select
              data-lock="allow"
              value={directory.id}
              disabled={busy}
              className={inputClass}
              onChange={(e) => {
                const id = e.target.value;
                void run(async () => {
                  await flushAccount();
                  selectCompany(loadSession()!.user.id, id);
                  window.location.assign("/dashboard");
                });
              }}
            >
              {directory.companies.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </Card>
      )}
      {directory.isOwner && showInvite && (
        <Card className="p-5">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const sent = await result(
                  api().api.v1.team.invitations.post({
                    email: email.trim().toLowerCase(),
                  }),
                );
                setNotice(
                  sent.delivered
                    ? "Invitation sent to " + email + "."
                    : "Invitation saved. Check delivery before asking them to join.",
                );
                setEmail("");
                onClose();
              });
            }}
          >
            <Field label="Invite someone to this company">
              <input
                type="email"
                autoFocus
                required
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
              />
            </Field>
            <p className="text-sm">
              They can work on this company’s reports after they accept. A
              pending invitation reserves one seat for seven days.
            </p>
            <Button disabled={busy} type="submit">
              Send invitation
            </Button>{" "}
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
          </form>
        </Card>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {directory.invitations.length > 0 && (
        <Card className="space-y-3 p-5">
          <h2>Pending invitations</h2>
          {directory.invitations.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center gap-3">
              <span className="grow">
                {i.email}{" "}
                <small>{i.delivered ? "Email sent" : "Email not sent"}</small>
              </span>
              {directory.isOwner && (
                <>
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const sent = await result(
                          api()
                            .api.v1.team.invitations({ id: i.id })
                            .resend.post(),
                        );
                        setNotice(
                          sent.delivered
                            ? "Invitation sent."
                            : "Invitation saved for local testing.",
                        );
                      })
                    }
                  >
                    Resend
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await result(
                          api().api.v1.team.invitations({ id: i.id }).delete(),
                        );
                      })
                    }
                  >
                    Cancel invite
                  </Button>
                </>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
