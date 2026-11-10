"use client";

/* ════════════════════════════════════════════════════════════
   TRACE PROFILE — what the company shows on certrace.co/trace

   The INPUT side of the public Trace page (certrace-landing-page-current
   lib/trace-data.ts `TraceSupplier` is the output). Field for field:

     company   name · logo (or initials) · tagline · about · head office ·
               founded · employees · export markets · certifications · photos
     factories one row per own installation — shown or hidden, its industry,
               a few words on what it does, and which verified products to list

   ONE PROFILE PER COMPANY. It is not tied to the current installation: the
   Trace page edits the same profile whichever site is current, and lists every
   own installation under it — the public page then shows "2 factories".

   Stored per browser for now (localStorage), like the rest of the mock
   screens; the verified products are sample rows until verification data is
   wired through.
   ════════════════════════════════════════════════════════════ */

export type TraceSector =
  | "Iron & Steel"
  | "Aluminium"
  | "Cement"
  | "Fertilisers"
  | "Hydrogen"
  | "Electricity";

export const TRACE_SECTORS: TraceSector[] = [
  "Iron & Steel",
  "Aluminium",
  "Cement",
  "Fertilisers",
  "Hydrogen",
  "Electricity",
];

export type TraceProductChoice = {
  cn: string;
  name: string;
  verificationId: string;
};

export type TraceFactory = {
  installationId: string;
  shown: boolean;
  sector: TraceSector;
  activity: string;
  /** CN codes of the verified products to list on the profile */
  products: string[];
};

export type TraceProfile = {
  published: boolean;
  slug: string;
  name: string;
  /** a data: URL; empty falls back to the initials */
  logo: string;
  tagline: string;
  about: string;
  city: string;
  country: string;
  founded: string;
  employees: string;
  exportMarkets: string;
  certifications: string[];
  /** data: URLs, at most five */
  photos: string[];
  factories: TraceFactory[];
};

export const MAX_PHOTOS = 5;
export const TAGLINE_MAX = 120;

const KEY = "certrace:trace-profile";

export const emptyProfile = (): TraceProfile => ({
  published: false,
  slug: "",
  name: "",
  logo: "",
  tagline: "",
  about: "",
  city: "",
  country: "TH",
  founded: "",
  employees: "",
  exportMarkets: "",
  certifications: [],
  photos: [],
  factories: [],
});

export function readProfile(): TraceProfile {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...emptyProfile(), ...JSON.parse(raw) } : emptyProfile();
  } catch {
    return emptyProfile();
  }
}

export function saveProfile(p: TraceProfile) {
  window.localStorage.setItem(KEY, JSON.stringify(p));
}

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/\b(co|ltd|plc|public|company|limited|inc)\b\.?/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z0-9]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "—";

/** Sample verified products per industry — what a factory could list until
    real verification results are wired in. CN codes are real CBAM goods. */
export const SAMPLE_PRODUCTS: Record<TraceSector, TraceProductChoice[]> = {
  "Iron & Steel": [
    { cn: "7318 15 88", name: "Hexagon screws and bolts, iron or steel", verificationId: "TRC-2025-0418-01" },
    { cn: "7318 16 92", name: "Nuts, iron or steel, ≤ 12 mm", verificationId: "TRC-2025-0418-02" },
    { cn: "7217 10 10", name: "Wire of non-alloy steel, not plated", verificationId: "TRC-2025-0506-01" },
  ],
  Aluminium: [
    { cn: "7604 29 10", name: "Hollow profiles of aluminium alloys", verificationId: "TRC-2025-0330-01" },
    { cn: "7606 12 92", name: "Sheet of aluminium alloys, < 3 mm", verificationId: "TRC-2025-0414-02" },
  ],
  Cement: [
    { cn: "2523 10 00", name: "Cement clinker", verificationId: "TRC-2025-0512-01" },
    { cn: "2523 29 00", name: "Portland cement, other than white", verificationId: "TRC-2025-0512-02" },
  ],
  Fertilisers: [
    { cn: "3102 10 10", name: "Urea, > 45 % nitrogen", verificationId: "TRC-2025-0602-01" },
  ],
  Hydrogen: [{ cn: "2804 10 00", name: "Hydrogen", verificationId: "TRC-2025-0602-02" }],
  Electricity: [{ cn: "2716 00 00", name: "Electrical energy", verificationId: "TRC-2025-0610-01" }],
};
