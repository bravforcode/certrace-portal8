"use client";
import { accountStorage, subscribeAccount } from "./account-storage";
import { patchStoredProfile } from "./profile-storage";

/* Live, editable account profile.
   Settings > Profile and Settings > Organisation write here on save; the
   top-bar account button reads from here — so a rename in Settings is
   reflected in the chrome immediately, without a page reload. Persisted to
   PostgreSQL-backed account storage, same pattern as the other
   client-side stores in this app (notification reads, cookie prefs). */

import * as React from "react";
import { loadSession, onSessionChange, type AuthUser } from "./api";

export type Profile = {
  firstName: string;
  lastName: string;
  jobTitle: string;
  companyName: string;
  sector: string; // PRODUCT_SECTORS id, e.g. "steel"
  installationId: string;
  jurisdiction: string; // JURISDICTIONS code
  currency: string;
  /** Always "tCO₂e". CBAM reports in tonnes, so this is no longer a choice
   *  the exporter is asked to make — neither Settings nor the sign-in setup
   *  offers a picker for it. Kept as a field so stored profiles still load
   *  and so a formatter has one place to read the unit from. */
  unit: string;
  /** Server onboarding flag. Answering the questions never changes it. */
  onboarded: boolean;
  // Product/marketing/research context captured during onboarding — not
  // displayed anywhere in the UI today; kept for future personalization,
  // segmentation and roadmap prioritization.
  /** The three "your needs" questions are MULTI-select: an exporter is
   *  usually escaping spreadsheets *and* chasing suppliers *and* preparing for
   *  verification, and forcing one answer records the tidiest of the three
   *  rather than the true picture. Stored as arrays for that reason — a
   *  comma-joined string cannot be filtered or counted later. */
  goalAchieve?: string[];
  currentManagement?: string[];
  biggestChallenge?: string[];
  // Scale of the operation — how much CBAM there is to do, and for whom.
  cbamProductCount?: string;
  supplierCount?: string;
  installationCount?: string;
  customerCount?: string;
  hearAbout?: string;
  /** Contact channels. The phone is stored joined with its dialling code
   *  ("+66 38 123 456") — see lib/dial-codes.ts. LINE is where Thai customers
   *  actually reach support, so it is asked for rather than hoped for. */
  phone?: string;
  lineId?: string;
};

export function splitName(name: string): {
  firstName: string;
  lastName: string;
} {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

const EMPTY_PROFILE: Profile = {
  firstName: "",
  lastName: "",
  jobTitle: "",
  companyName: "",
  sector: "steel",
  installationId: "",
  jurisdiction: "TH",
  currency: "THB",
  unit: "tCO₂e",
  onboarded: false,
};

/** The questionnaire writes these required answers together on its final step. */
export function onboardingQuestionsComplete(profile: Profile): boolean {
  return Boolean(
    profile.companyName.trim() &&
      profile.sector &&
      profile.jobTitle.trim() &&
      profile.goalAchieve?.length &&
      profile.currentManagement?.length &&
      profile.biggestChallenge?.length &&
      profile.cbamProductCount &&
      profile.supplierCount &&
      profile.installationCount &&
      profile.customerCount &&
      profile.hearAbout &&
      profile.phone?.trim() &&
      profile.lineId?.trim(),
  );
}

const STORAGE_KEY = "certrace:profile";

const sessionProfile = (): Profile => ({
  ...EMPTY_PROFILE,
  firstName: loadSession()?.user.firstName ?? "",
  lastName: loadSession()?.user.lastName ?? "",
});

const ProfileContext = React.createContext<{
  profile: Profile;
  update: (patch: Partial<Profile>) => void;
  /** False until the account record read completes. Settings/onboarding forms
   *  that snapshot `profile.x` into local draft state on mount need this to
   *  re-sync once — otherwise a component that mounts before the (async,
   *  SSR-hydration-safe) account read finishes captures the hardcoded
   *  default forever, even after the real value loads a moment later. */
  loaded: boolean;
  /** True when this account has a saved profile, false while fields are empty.
   *  Callers that show a person's name need the difference: a signed-in
   *  exporter on a fresh browser has no saved profile yet, and the fixture
   *  name must lose to the one on their session. */
  stored: boolean;
} | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = React.useState<Profile>(sessionProfile);
  const [loaded, setLoaded] = React.useState(false);
  const [stored, setStored] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    const read = () => {
      if (!active) return;
      try {
        const saved = JSON.parse(accountStorage.getItem(STORAGE_KEY) ?? "null");
        if (saved) {
          for (const key of [
            "id",
            "email",
            "googleLinked",
            "planId",
            "trialStartedAt",
          ])
            delete saved[key];
          setProfile({ ...sessionProfile(), ...saved });
          setStored(true);
        } else {
          setProfile(sessionProfile());
          setStored(false);
        }
      } catch {
        /* Keep the in-memory profile while a failed save is retried. */
      }
      setLoaded(true);
    };
    read();
    const unsubscribe = subscribeAccount(() => queueMicrotask(read));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const update = React.useCallback((patch: Partial<Profile>) => {
    // Writes belong to the event, not a React state updater: React may defer
    // or replay an updater after the caller has already awaited its save.
    setProfile(patchStoredProfile(patch, sessionProfile()));
    // A save is what makes this browser's profile real — see `stored`.
    setStored(true);
  }, []);

  const value = React.useMemo(
    () => ({ profile, update, loaded, stored }),
    [profile, update, loaded, stored],
  );
  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = React.useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}

/** Who is actually signed in, straight from the session — or null before the
 *  first effect runs, and for a signed-out reader.
 *
 *  Read in an effect, never during render: the session restores from a cookie,
 *  which the first client render has not loaded — the same hydration discipline RequireSession
 *  and AccountProvider already follow. */
export function useSessionUser(): AuthUser | null {
  const [user, setUser] = React.useState<AuthUser | null>(null);

  React.useEffect(() => {
    const read = () => setUser(loadSession()?.user ?? null);
    read();
    return onSessionChange(read);
  }, []);

  return user;
}

/** The signed-in address from the session, empty until it is known. */
export function useAccountEmail(): string {
  const user = useSessionUser();
  return user?.email ?? "";
}

/** first.first-3-letters-of-last, e.g. "Wasawat" + "Kiakittiwong" -> "wasawat.kia" */
export function generateUsername(firstName: string, lastName: string) {
  const first = firstName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const lastBit = lastName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 3);
  return lastBit ? `${first}.${lastBit}` : first;
}
