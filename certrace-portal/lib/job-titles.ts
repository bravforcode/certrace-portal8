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

export const JOB_TITLE_OPTIONS = [...JOB_TITLES.map((t) => ({ value: t, label: t })), { value: "other", label: "Other" }];
