"use client";

/* Live, editable overlay on top of the static USER/ORG mock fixtures.
   Settings > Profile and Settings > Organisation write here on save; the
   top-bar account button reads from here — so a rename in Settings is
   reflected in the chrome immediately, without a page reload. Persisted to
   localStorage only (no backend in this MVP), same pattern as the other
   client-side stores in this app (notification reads, cookie prefs). */

import * as React from "react";
import { demoModeEnabled, loadSession, onSessionChange, type AuthUser } from "./api";
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
  /** Always "tCO₂e". CBAM reports in tonnes, so this is no longer a choice
   *  the exporter is asked to make — neither Settings nor the sign-in setup
   *  offers a picker for it. Kept as a field so stored profiles still load
   *  and so a formatter has one place to read the unit from. */
  unit: string;
  /** Has this account been through the /onboarding wizard? Existing/demo
   *  accounts start true; a fresh /register signup flips this to false so
   *  it's routed to onboarding instead of straight to the dashboard. */
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
  /** True when this browser actually has a saved profile, false while every
   *  field is still DEFAULT_PROFILE — i.e. the demo fixture's identity.
   *  Callers that show a person's name need the difference: a signed-in
   *  exporter on a fresh browser has no saved profile yet, and the fixture
   *  name must lose to the one on their session. */
  stored: boolean;
} | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = React.useState<Profile>(DEFAULT_PROFILE);
  const [loaded, setLoaded] = React.useState(false);
  const [stored, setStored] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
      if (saved) {
        setProfile((p) => ({ ...p, ...saved }));
        setStored(true);
      }
    } catch {
      /* ignore malformed local state */
    } finally {
      setLoaded(true);
    }
  }, []);

  const update = React.useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      // Guarded: setItem throws in private mode, and this runs inside a state
      // updater (render-phase) — an uncaught throw white-screens the page.
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* best-effort: profile edit stays in-memory this session */
      }
      return next;
    });
    // A save is what makes this browser's profile real — see `stored`.
    setStored(true);
  }, []);

  const value = React.useMemo(
    () => ({ profile, update, loaded, stored }),
    [profile, update, loaded, stored],
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = React.useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}

/** Who is actually signed in, straight from the session — or null before the
 *  first effect runs, and for a signed-out reader.
 *
 *  Read in an effect, never during render: the session lives in localStorage,
 *  which the server cannot see — the same hydration discipline RequireSession
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

/** The signed-in address — the session's, never the fixture's.
 *
 *  `USER.email` is demo furniture. On a build with a backend the real address
 *  arrives with the session at sign-in, and it is the only one that should
 *  ever appear in the chrome; a portal that shows a paying exporter someone
 *  else's address is not a cosmetic bug, it is a reason to doubt whose data is
 *  on the screen.
 *
 *  Empty until it is known, so the first paint shows nothing rather than
 *  flashing a stranger's address, and callers render the row only when there
 *  is something true to put in it. */
export function useAccountEmail(): string {
  const user = useSessionUser();
  // No session and no backend = the local demo, where the fixture IS the
  // account. No session WITH a backend means signed out; show nothing.
  const [demo, setDemo] = React.useState(false);
  React.useEffect(() => setDemo(demoModeEnabled()), []);
  return user?.email ?? (demo ? USER.email : "");
}

/** first.first-3-letters-of-last, e.g. "Wasawat" + "Kiakittiwong" -> "wasawat.kia" */
export function generateUsername(firstName: string, lastName: string) {
  const first = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const lastBit = lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 3);
  return lastBit ? `${first}.${lastBit}` : first;
}
