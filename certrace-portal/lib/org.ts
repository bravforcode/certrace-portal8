/* ════════════════════════════════════════════════════════════
   ORGANISATION IDENTITY — single source of truth for "who is the exporter".

   Settings → Organisation writes a live overlay to localStorage
   (`certrace:profile`, see lib/profile.tsx). Every OUTPUT surface — the
   supplier demo link, the manual-entry worksheet, the draft PDF preview and the
   dispatch screens — must read the SAME identity, or the platform emits
   documents in the wrong legal name (the exact failure the 2026-07-13
   compliance test caught: renamed org never reached the outputs).

   Isomorphic: on the server (or before hydration) it falls back to the ORG
   fixture, so nothing breaks during SSR; client-side readers get the live
   legal name the moment localStorage is available.
   ════════════════════════════════════════════════════════════ */

import { ORG, USER } from "./data";

export type OrgIdentity = {
  name: string; // legal name shown on every output
  installationId: string; // operator reference shared with the buyer / O3CI
  origin: string; // jurisdiction code, e.g. "TH"
  sector: string;
  contact: string; // primary user, for "requested by" lines
  role: string;
};

const PROFILE_KEY = "certrace:profile";

export function getOrgIdentity(): OrgIdentity {
  const base: OrgIdentity = {
    name: ORG.name,
    installationId: ORG.installationId,
    origin: ORG.origin,
    sector: ORG.sector,
    contact: USER.name,
    role: USER.role,
  };
  if (typeof window === "undefined") return base;
  try {
    const saved = JSON.parse(window.localStorage.getItem(PROFILE_KEY) ?? "null");
    if (!saved) return base;
    const first = (saved.firstName ?? "").trim();
    const last = (saved.lastName ?? "").trim();
    return {
      ...base,
      name: (saved.companyName ?? "").trim() || base.name,
      installationId: (saved.installationId ?? "").trim() || base.installationId,
      origin: saved.jurisdiction || base.origin,
      contact: first ? `${first}${last ? ` ${last.charAt(0)}.` : ""}` : base.contact,
      role: (saved.jobTitle ?? "").trim() || base.role,
    };
  } catch {
    return base;
  }
}
