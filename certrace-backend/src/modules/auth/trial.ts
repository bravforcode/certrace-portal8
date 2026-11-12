export const TRIAL_DAYS = 30;

/* Reminders reach at most this many days before the end and after it. A trial
   that ended longer ago is never mailed, so the first job run cannot email
   every expired account in the database. */
export const POST_END_DAYS = 7;

export const trialEndsAt = (u: { trial_started_at: Date }) =>
  new Date(u.trial_started_at.getTime() + TRIAL_DAYS * 86_400_000);

export const trialEnded = (
  u: { plan_id: string; trial_started_at: Date },
  now = new Date(),
) => u.plan_id === "trial" && now >= trialEndsAt(u);

/** Account-record keys that are settings, not customer data. Writable after the trial (D4). */
export const TRIAL_OPEN_SETTINGS_KEYS = [
  "certrace:notification-prefs",
  "certrace:lang",
] as const;

/* Writes that stay open after the trial ends. Each is an exact method and
   anchored path, so nothing else under these prefixes is opened by accident.
   Team invites are still refused by the invite gate in team/service.ts. */
const OPEN_AFTER_TRIAL: Array<{ method: string; path: RegExp }> = [
  { method: "POST", path: /^\/api\/v1\/team\/invitations$/ },
  { method: "POST", path: /^\/api\/v1\/team\/invitations\/[^/]+\/resend$/ },
  { method: "DELETE", path: /^\/api\/v1\/team\/invitations\/[^/]+$/ },
  { method: "DELETE", path: /^\/api\/v1\/team\/members\/[^/]+$/ },
  { method: "PATCH", path: /^\/api\/v1\/master-data\/organizations\/[^/]+$/ },
];

const SETTINGS_RECORD = /^\/api\/v1\/account\/records\/([^/]+)$/;

export function trialWriteOpen(method: string, url: string): boolean {
  const m = method.toUpperCase();
  const { pathname } = new URL(url);
  if (OPEN_AFTER_TRIAL.some((r) => r.method === m && r.path.test(pathname)))
    return true;
  const key = SETTINGS_RECORD.exec(pathname)?.[1];
  return (
    m === "PUT" &&
    key !== undefined &&
    (TRIAL_OPEN_SETTINGS_KEYS as readonly string[]).includes(
      decodeURIComponent(key),
    )
  );
}
