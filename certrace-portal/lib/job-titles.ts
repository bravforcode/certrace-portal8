/* Shared between Settings > Profile and the onboarding flow. */

export const JOB_TITLES = [
  "Head of Export Ops",
  "Compliance Manager",
  "Sustainability / ESG Manager",
  "Supply Chain Manager",
  "Trade Compliance Officer",
  "Finance Manager",
  "Managing Director / CEO",
  "Legal Counsel",
];

export const JOB_TITLE_OPTIONS = [
  ...JOB_TITLES.map((t) => ({ value: t, label: t })),
  { value: "other", label: "Other — say which" },
];

/* ── "Other" obliges a description ──────────────────────────────
   Both call sites used to write `jobTitleOther || "Other"`, so choosing Other
   and typing nothing stored the literal string "Other" as somebody's job
   title. That reaches a verifier: the authorised representative on the
   installation record and the "requested by" line on every Smart Link both
   read this field, and "Other" is not a role anybody can be held to.

   One rule, two screens — the settings form and onboarding gate on the same
   pair of helpers rather than each writing their own fallback. */
export const jobTitleIncomplete = (option: string, other: string): boolean =>
  option === "other" && !other.trim();

/** What actually gets stored. Never a bare "Other" — callers gate on
    `jobTitleIncomplete` first, and this trims what they typed. */
export const jobTitleValue = (option: string, other: string): string =>
  option === "other" ? other.trim() : option;
