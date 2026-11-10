import { accountStorage } from "./account-storage";
import type { Profile } from "./profile";

/** Merge into the latest working copy, including questionnaire fields that the
 * current form does not edit. Queue synchronously so flushAccount can await it. */
export function patchStoredProfile(
  patch: Partial<Profile>,
  defaults: Profile,
): Profile {
  const saved = JSON.parse(
    accountStorage.getItem("certrace:profile") ?? "null",
  );
  const next = { ...defaults, ...saved, ...patch };
  accountStorage.setItem("certrace:profile", JSON.stringify(next));
  return next;
}
