/* ════════════════════════════════════════════════════════════
   ABOUT CBAM — the knowledge hub

   WHAT THIS IS. Thirteen articles that between them cover the whole of the EU
   CBAM definitive regime as it stands for a non-EU exporter: the dates, the
   money, the arithmetic, the data, the verifier, and what the neighbours are
   building. Sourced from the TGO × Chulalongkorn University briefing of
   14 August 2026 and the EU instruments it cites, all named on each page.

   WHY IT IS SHAPED LIKE THIS. Every article carries, in this order:

     dek           one sentence that answers the title
     keyFacts      the extractable numbers, labelled — this is what an answer
                   engine lifts, and what a reader in a hurry reads
     sections      the actual argument
     faq           the questions people type, answered in the first sentence

   That order is deliberate for both search and generative retrieval: the
   answer is above the explanation, never after it. The FAQ block is emitted as
   FAQPage JSON-LD and the article as Article JSON-LD, so the same words serve
   the page, the snippet and the model.

   NUMBERS ARE FACTS, NOT COPY. Every figure in these articles is dated and
   attributed. Where the Commission has not published something yet — Q3/Q4
   2026 certificate prices, for one — the article says TBA and gives the date
   it lands, rather than estimating. On a compliance site an invented number is
   worse than a gap.

   TRANSLATION. Metadata lives here; every word a reader sees lives in the
   per-language modules. All five are typed against ArticleText, so a missing
   section is a build error rather than an English paragraph on a Thai page.
   ════════════════════════════════════════════════════════════ */

import type { Lang } from "./locales";
import { CBAM_EN } from "./cbam-guide-en";
import { CBAM_TH } from "./cbam-guide-th";
import { CBAM_VI } from "./cbam-guide-vi";
import { CBAM_TR } from "./cbam-guide-tr";
import { CBAM_HI } from "./cbam-guide-hi";

/* ── Cover art ──────────────────────────────────────────────
   Each article gets a generated cover rather than a stock photograph: the
   motif names which one. They are drawn in components/article-cover.tsx from
   the site's own palette, which keeps the hub on-brand, keeps every page
   self-contained, and avoids licensing a photograph of a steel mill that has
   nothing to do with the argument on the page. */
export type Motif =
  | "border" // the mechanism itself — a line goods cross
  | "calendar" // dates and deadlines
  | "price" // certificate price, a stepped series
  | "formula" // the cost equation
  | "decline" // free allocation falling to zero
  | "scope" // sectors and the downstream extension
  | "values" // actual vs default
  | "tree" // precursors and complex goods
  | "seal" // verification and accreditation
  | "tonne" // cost per tonne of steel
  | "globe" // the international comparison
  | "path" // the exporter's plan
  | "choice"; // why it matters: the buyer picks the proven figure

export type ArticleMeta = {
  slug: string;
  motif: Motif;
  /** roughly how long the English runs; the same for every language */
  readMinutes: number;
  /** last substantive review of the facts on the page */
  updated: string;
  /** the pillar sits at the top of the index and is linked from every other */
  pillar?: boolean;
  related: string[];
};

export const ARTICLES: ArticleMeta[] = [
  {
    slug: "what-is-cbam",
    motif: "border",
    readMinutes: 7,
    updated: "2026-08-31",
    pillar: true,
    related: ["cbam-key-dates", "cbam-scope-2028-extension", "cbam-exporter-action-plan"],
  },
  {
    slug: "cbam-key-dates",
    motif: "calendar",
    readMinutes: 6,
    updated: "2026-08-31",
    related: ["cbam-certificate-price", "what-is-cbam", "cbam-verifier-accreditation"],
  },
  {
    slug: "cbam-certificate-price",
    motif: "price",
    readMinutes: 6,
    updated: "2026-08-31",
    related: ["cbam-cost-formula", "cbam-key-dates", "cbam-cost-thai-steel"],
  },
  {
    slug: "cbam-cost-formula",
    motif: "formula",
    readMinutes: 7,
    updated: "2026-08-31",
    related: ["cbam-free-allocation-phase-down", "cbam-certificate-price", "cbam-cost-thai-steel"],
  },
  {
    slug: "cbam-free-allocation-phase-down",
    motif: "decline",
    readMinutes: 5,
    updated: "2026-08-31",
    related: ["cbam-cost-formula", "cbam-cost-thai-steel", "what-is-cbam"],
  },
  {
    slug: "cbam-scope-2028-extension",
    motif: "scope",
    readMinutes: 6,
    updated: "2026-08-31",
    related: ["what-is-cbam", "cbam-exporter-action-plan", "cbam-vs-uk-us"],
  },
  {
    slug: "actual-vs-default-values",
    motif: "values",
    readMinutes: 8,
    updated: "2026-08-31",
    related: ["precursors-20-percent-rule", "cbam-verifier-accreditation", "cbam-cost-formula"],
  },
  {
    slug: "precursors-20-percent-rule",
    motif: "tree",
    readMinutes: 7,
    updated: "2026-08-31",
    related: ["actual-vs-default-values", "cbam-cost-formula", "cbam-exporter-action-plan"],
  },
  {
    slug: "cbam-verifier-accreditation",
    motif: "seal",
    readMinutes: 6,
    updated: "2026-08-31",
    related: ["actual-vs-default-values", "cbam-key-dates", "cbam-exporter-action-plan"],
  },
  {
    slug: "cbam-cost-thai-steel",
    motif: "tonne",
    readMinutes: 6,
    updated: "2026-08-31",
    related: ["cbam-cost-formula", "cbam-certificate-price", "actual-vs-default-values"],
  },
  {
    slug: "cbam-vs-uk-us",
    motif: "globe",
    readMinutes: 6,
    updated: "2026-08-31",
    related: ["what-is-cbam", "cbam-scope-2028-extension", "cbam-exporter-action-plan"],
  },
  {
    slug: "cbam-exporter-action-plan",
    motif: "path",
    readMinutes: 8,
    updated: "2026-08-31",
    related: ["actual-vs-default-values", "cbam-verifier-accreditation", "cbam-cost-thai-steel"],
  },
  {
    slug: "why-cbam-matters",
    motif: "choice",
    readMinutes: 8,
    updated: "2026-10-04",
    related: ["actual-vs-default-values", "precursors-20-percent-rule", "cbam-exporter-action-plan"],
  },
];

export const articleBySlug = (slug: string) => ARTICLES.find((a) => a.slug === slug);

/* ── The text of one article ────────────────────────────────
   A section is a heading plus any of: paragraphs, a bulleted list, a small
   table, and one pull-out note. Everything optional except the heading, so a
   translator never has to invent a table to satisfy the type. */
export type Section = {
  h: string;
  p?: string[];
  list?: string[];
  table?: { head: string[]; rows: string[][] };
  note?: string;
};

export type ArticleText = {
  title: string;
  /** one sentence answering the title — the card blurb and the lead */
  dek: string;
  /** <title>; kept separate so it can carry the keyword the H1 does not */
  metaTitle: string;
  metaDescription: string;
  /** the topic label on the card */
  topic: string;
  keyFacts: { label: string; value: string }[];
  sections: Section[];
  faq: { q: string; a: string }[];
};

export type CbamGuide = {
  /** index-page furniture */
  hub: {
    eyebrow: string;
    headline: string;
    intro: string;
    searchLabel: string;
    searchPlaceholder: string;
    allTopics: string;
    noResults: string;
    clear: string;
    readTime: string;
    pillarLabel: string;
    updatedLabel: string;
  };
  article: {
    backToHub: string;
    keyFacts: string;
    onThisPage: string;
    faqHeading: string;
    relatedHeading: string;
    updatedPrefix: string;
    readPrefix: string;
    /** the closing banner every article ends on */
    ctaEyebrow: string;
    ctaHeadline: string;
    ctaBody: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  articles: Record<string, ArticleText>;
};

export const CBAM_GUIDE: Record<Lang, CbamGuide> = {
  en: CBAM_EN,
  th: CBAM_TH,
  vi: CBAM_VI,
  tr: CBAM_TR,
  hi: CBAM_HI,
};
