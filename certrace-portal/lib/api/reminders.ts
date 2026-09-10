/* ════════════════════════════════════════════════════════════
   REMINDER SUBJECTS — what the nightly job is allowed to chase

   Mirrors §8 of docs/API-CONTRACT.md. Four calls, and the split between the
   first two is the whole point: registering an ask is not sending it. A
   supplier who has heard from nobody must never receive a chase about a
   request that only exists in the exporter's draft.

   All four are the exporter's own, so all four carry the session. There is no
   supplier-facing counterpart here on purpose — the person being chased has no
   account, and nothing they do should be able to stop or redirect a chase.
   ════════════════════════════════════════════════════════════ */

import { request } from "./http";

export type ReminderSubject = {
  id: string;
  subjectKey: string;
  recipient: string;
  supplierName: string;
  periodLabel: string;
  /** 'YYYY-MM-DD' */
  dueDate: string;
  linkUrl: string;
  locale: string | null;
  accountLocked: boolean;
  /** epoch ms, null until the ask actually goes out */
  sentAt: number | null;
  resendCount: number;
  answeredAt: number | null;
  cancelledAt: number | null;
};

const path = (key: string, suffix = ""): string =>
  `/api/v1/reminder-subjects/${encodeURIComponent(key)}${suffix}`;

/** Register or correct one ask. Idempotent on the key, and deliberately does
    not touch when it was sent — correcting a deadline must not un-send it. */
export const registerReminderSubject = (key: string, body: Record<string, unknown>): Promise<ReminderSubject> =>
  request<ReminderSubject>(path(key), { method: "PUT", body });

/** It went out. The first call starts the clock, later ones count the chase. */
export const markReminderSent = (key: string): Promise<ReminderSubject> =>
  request<ReminderSubject>(path(key, "/sent"), { method: "POST" });

/** They replied. Stops the chasing without losing the record that we asked. */
export const answerReminderSubject = (key: string): Promise<ReminderSubject> =>
  request<ReminderSubject>(path(key, "/answered"), { method: "POST" });

/** We withdrew the ask. Same as answered, different reason, same history. */
export const cancelReminderSubject = (key: string): Promise<ReminderSubject> =>
  request<ReminderSubject>(path(key), { method: "DELETE" });

/** Everything registered for this account, open and closed. The closed rows
    are what "chased 3 times, answered on 12 May" is drawn from. */
export const listReminderSubjects = (): Promise<{ subjects: ReminderSubject[] }> =>
  request<{ subjects: ReminderSubject[] }>("/api/v1/reminder-subjects");
