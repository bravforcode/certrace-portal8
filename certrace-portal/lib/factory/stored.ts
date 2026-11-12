import { hasCode } from "../api/errors";
import { emptyProfile, validateProfile, type FactoryProfile } from "./profile";

/** Reads a stored factory value. A value that is present but fails validation is reported as
    unreadable and never replaced by an empty profile, so a later save cannot overwrite it silently. */
export function parseStoredFactory(raw: string | null): {
  profile: FactoryProfile;
  unreadable: boolean;
} {
  if (raw === null) return { profile: emptyProfile(), unreadable: false };
  try {
    const checked = validateProfile(JSON.parse(raw));
    if (checked.ok) return { profile: checked.data, unreadable: false };
  } catch {
    // not JSON: fall through to unreadable
  }
  return { profile: emptyProfile(), unreadable: true };
}

export type SaveReason = "conflict" | "trial" | "other";

/** Which save failure this is, so the screen can say the right thing. */
export function classifySaveError(e: unknown): SaveReason {
  if (hasCode(e, "REVISION_CONFLICT")) return "conflict";
  if (hasCode(e, "TRIAL_ENDED")) return "trial";
  return "other";
}

export class FactorySaveError extends Error {
  readonly reason: SaveReason;
  constructor(reason: SaveReason, message: string) {
    super(message);
    this.name = "FactorySaveError";
    this.reason = reason;
  }
}
