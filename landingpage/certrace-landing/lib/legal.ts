/* Shared shape for the Terms of Service and Privacy Policy pages.

   The documents are held as structured data rather than raw markdown so the
   same renderer can lay them out in either language, and so a heading can be
   linked to from the on-page contents rail without parsing prose at runtime.

   `**bold**` inside a paragraph marks a clause lead-in (e.g. "**3.1 Account
   Creation.**") — `LegalBody` in components/legal-page.tsx renders those runs
   in medium weight. No other markup is supported, deliberately. */

import { PRIVACY_EN, PRIVACY_TH } from "./legal-privacy";
import { TERMS_EN, TERMS_TH } from "./legal-terms";

export type LegalBlock = { p: string } | { ul: string[] };

export type LegalSection = {
  /* Stable anchor id — must not change once published; the contents rail and
     any external deep link both depend on it. */
  id: string;
  heading: string;
  blocks: LegalBlock[];
};

export type LegalDoc = {
  eyebrow: string;
  title: string;
  effectiveLabel: string;
  effective: string;
  updatedLabel: string;
  updated: string;
  lede: string;
  contentsLabel: string;
  /* Thai only: the English text is the authoritative one, and saying so is
     what keeps a translated policy from becoming a second set of terms. */
  languageNote?: string;
  sections: LegalSection[];
};

export const LEGAL: Record<"en" | "th", { terms: LegalDoc; privacy: LegalDoc }> =
  {
    en: { terms: TERMS_EN, privacy: PRIVACY_EN },
    th: { terms: TERMS_TH, privacy: PRIVACY_TH },
  };
