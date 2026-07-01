"use client";

/* Live, editable overlay on top of the static USER/ORG mock fixtures.
   Settings > Profile and Settings > Organisation write here on save; the
   top-bar account button reads from here — so a rename in Settings is
   reflected in the chrome immediately, without a page reload. Persisted to
   localStorage only (no backend in this MVP), same pattern as the other
   client-side stores in this app (notification reads, cookie prefs). */

import * as React from "react";
import { USER, ORG } from "./data";

export type Profile = {
  firstName: string;
  lastName: string;
  jobTitle: string;
  companyName: string;
  sector: string; // PRODUCT_SECTORS id, e.g. "steel"
  installationId: string;
  jurisdiction: string; // JURISDICTIONS code
  currency: string;
  unit: string; // "tCO₂e" | "kgCO₂e"
  /** Has this account been through the /onboarding wizard? Existing/demo
   *  accounts start true; a fresh /register signup flips this to false so
   *  it's routed to onboarding instead of straight to the dashboard. */
  onboarded: boolean;
  // Product/marketing/research context captured during onboarding — not
  // displayed anywhere in the UI today; kept for future personalization,
  // segmentation and roadmap prioritization.
  goalAchieve?: string;
  currentManagement?: string;
  biggestChallenge?: string;
  supplierCount?: string;
  hearAbout?: string;
  /** Multi-select, always optional — never blocks onboarding completion. */
  shapeCertrace?: string[];
};

export function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

const DEFAULT_PROFILE: Profile = {
  // USER.name ships abbreviated ("Wasawat K.") for compact chrome — the
  // editable profile uses the full name shown on /register instead.
  ...splitName("Wasawat Kiakittiwong"),
  jobTitle: USER.role,
  companyName: ORG.name,
  sector: "steel",
  installationId: "TH-RYG-0418",
  jurisdiction: "TH",
  currency: "THB",
  unit: "tCO₂e",
  onboarded: true,
};

const STORAGE_KEY = "certrace:profile";

const ProfileContext = React.createContext<{
  profile: Profile;
  update: (patch: Partial<Profile>) => void;
  /** False until the localStorage read completes. Settings/onboarding forms
   *  that snapshot `profile.x` into local draft state on mount need this to
   *  re-sync once — otherwise a component that mounts before the (async,
   *  SSR-hydration-safe) localStorage read finishes captures the hardcoded
   *  default forever, even after the real value loads a moment later. */
  loaded: boolean;
} | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = React.useState<Profile>(DEFAULT_PROFILE);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
      if (saved) setProfile((p) => ({ ...p, ...saved }));
    } catch {
      /* ignore malformed local state */
    } finally {
      setLoaded(true);
    }
  }, []);

  const update = React.useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = React.useMemo(() => ({ profile, update, loaded }), [profile, update, loaded]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = React.useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}

/** first.first-3-letters-of-last, e.g. "Wasawat" + "Kiakittiwong" -> "wasawat.kia" */
export function generateUsername(firstName: string, lastName: string) {
  const first = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const lastBit = lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 3);
  return lastBit ? `${first}.${lastBit}` : first;
}
