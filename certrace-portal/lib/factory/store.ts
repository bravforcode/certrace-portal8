import {
  accountStorage,
  discardPendingRecord,
  flushAccount,
  refreshAccountRecords,
} from "../account-storage";
import { factoryKey, validateProfile, type FactoryProfile } from "./profile";
import {
  classifySaveError,
  FactorySaveError,
  parseStoredFactory,
} from "./stored";

export function readFactory(installationId: string): {
  profile: FactoryProfile;
  unreadable: boolean;
} {
  try {
    return parseStoredFactory(
      accountStorage.getItem(factoryKey(installationId)),
    );
  } catch {
    return parseStoredFactory(null);
  }
}

export async function saveFactory(installationId: string, p: FactoryProfile) {
  const checked = validateProfile(p);
  if (!checked.ok) throw new Error(checked.errors.join("; "));
  const key = factoryKey(installationId);
  accountStorage.setItem(
    key,
    JSON.stringify({ ...checked.data, updatedAt: new Date().toISOString() }),
  );
  try {
    await flushAccount();
  } catch (e) {
    const reason = classifySaveError(e);
    if (reason === "conflict") {
      // The server refused this revision. Keeping it pending would retry the same stale write forever,
      // so drop it and pull the newer copy before the user edits again.
      discardPendingRecord(key);
      await refreshAccountRecords().catch(() => false);
    }
    throw new FactorySaveError(reason, reason);
  }
}
