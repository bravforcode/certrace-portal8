export const TRIAL_DAYS = 30;

export const trialEndsAt = (u: { trial_started_at: Date }) =>
  new Date(u.trial_started_at.getTime() + TRIAL_DAYS * 86_400_000);

export const trialEnded = (
  u: { plan_id: string; trial_started_at: Date },
  now = new Date(),
) => u.plan_id === "trial" && now >= trialEndsAt(u);
