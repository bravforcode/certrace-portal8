/* Shared shape for the Terms of Service and Privacy Policy pages.

   The documents are held as structured data rather than raw markdown so the
   same renderer can lay either of them out, and so a heading can be
   linked to from the on-page contents rail without parsing prose at runtime.

   `**bold**` inside a paragraph marks a clause lead-in (e.g. "**3.1 Account
   Creation.**") — `LegalBody` in components/legal-page.tsx renders those runs
   in medium weight. No other markup is supported, deliberately. */

import type { Lang } from "./i18n";
import { PRIVACY_TH } from "./legal-privacy";
import { TERMS_EN } from "./legal-terms";

export type LegalBlock = { p: string } | { ul: string[] };

export type LegalSection = {
  /* Stable anchor id — must not change once published; the contents rail and
     any external deep link both depend on it. */
  id: string;
  heading: string;
  blocks: LegalBlock[];
};

export type LegalDoc = {
  /* The language the document is written in. It differs from the interface
     language whenever the site is set to anything else, so the renderer marks
     the document with it for screen readers and line breaking. */
  lang: "en" | "th";
  eyebrow: string;
  title: string;
  effectiveLabel: string;
  effective: string;
  updatedLabel: string;
  updated: string;
  lede: string;
  contentsLabel: string;
  sections: LegalSection[];
};

/* Every interface language reads the same two documents, in the language
   each was supplied in: the Terms in English, the Privacy Policy in Thai.

   The rest of the site is translated; these are not, on purpose. They are the
   contract, they were supplied as finished text, and a translated clause that
   drifts from the original does not read as a rough edge — it reads as a
   second, conflicting set of terms. Do not add a translation here; a new
   language version has to come from the team as a supplied document. */
const DOCS = { terms: TERMS_EN, privacy: PRIVACY_TH };

export const LEGAL: Record<Lang, { terms: LegalDoc; privacy: LegalDoc }> = {
  en: DOCS,
  th: DOCS,
  vi: DOCS,
  tr: DOCS,
  hi: DOCS,
};
