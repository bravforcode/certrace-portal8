// Copy of certrace-portal/lib/team-seat-limits.ts. The portal file is the source of truth.
// certrace-backend/test/team-seat-limits.test.ts fails when this copy drifts.
export const teamSeatLimits = {
  trial: null,
  starter: 3,
  standard: 5,
  enterprise: 10,
} as const;
