import { accountStorage, flushAccount } from "../account-storage";
import { emptyProfile, factoryKey, validateProfile, type FactoryProfile } from "./profile";

export function readFactory(installationId: string): FactoryProfile {
  try {
    const raw = accountStorage.getItem(factoryKey(installationId));
    const parsed = raw ? validateProfile(JSON.parse(raw)) : null;
    return parsed?.ok ? parsed.data : emptyProfile();
  } catch {
    return emptyProfile();
  }
}

export async function saveFactory(installationId: string, p: FactoryProfile) {
  const checked = validateProfile(p);
  if (!checked.ok) throw new Error(checked.errors.join("; "));
  accountStorage.setItem(factoryKey(installationId), JSON.stringify({ ...checked.data, updatedAt: new Date().toISOString() }));
  await flushAccount();
}
