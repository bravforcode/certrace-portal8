/* ════════════════════════════════════════════════════════════
   COPY FOR THE PAGES ADDED AFTER THE ORIGINAL SITE

   Events, Updates, About, Contact, the three pop-up forms and the full
   pricing page. Kept out of lib/content.ts on purpose: that file is already
   five dictionaries deep and every one of them would have grown by a third.
   Same discipline though — one typed shape, five languages, a missing key is
   a build error rather than an English paragraph on a Thai page.

   Read it with `usePages()` (lib/i18n-pages.tsx), which sits on the same
   language context the rest of the site uses, so one switch moves everything.
   ════════════════════════════════════════════════════════════ */

import type { Lang } from "./locales";
import { PAGES_EN } from "./pages-en";
import { PAGES_TH } from "./pages-th";
import { PAGES_VI } from "./pages-vi";
import { PAGES_TR } from "./pages-tr";
import { PAGES_HI } from "./pages-hi";

/* ── One event, in one language ─────────────────────────── */
export type EventCopy = {
  name: string;
  /** the card's one-liner */
  summary: string;
  /** the detail page's body, one paragraph per entry */
  body: string[];
  /** what Certrace is doing there — omitted on a past event we only attended */
  presence?: string[];
  kindLabel: string;
};

/* ── One update, in one language ────────────────────────── */
export type UpdateCopy = {
  title: string;
  dek: string;
  body: string[];
  kindLabel: string;
};

export type FormFieldCopy = {
  label: string;
  placeholder?: string;
  /** shown under the field, for the ones that need a rule explained */
  hint?: string;
};

export type FormCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  fields: Record<string, FormFieldCopy>;
  /** for a form with exactly one select */
  options?: string[];
  /** for a form with several — keyed by the spec's `optionsKey` */
  optionSets?: Record<string, string[]>;
  submit: string;
  sending: string;
  successTitle: string;
  successBody: string;
  required: string;
  invalidEmail: string;
};

export type PageCopy = {
  /* ── new nav / footer labels ───────────────────────────── */
  nav: {
    aboutCbam: string;
    aboutCbamDesc: string;
    events: string;
    eventsDesc: string;
    updates: string;
    updatesDesc: string;
    about: string;
    aboutDesc: string;
    contact: string;
    contactDesc: string;
    careers: string;
    careersDesc: string;
    requestFeature: string;
    requestFeatureDesc: string;
    reportIssue: string;
    reportIssueDesc: string;
    /** COMPANY menu row that opens the quote dialog — the same form the
        pricing page and the contact page open, reachable without leaving
        whatever page the reader is on. */
    requestPricing: string;
    requestPricingDesc: string;
    freeTrial: string;
    startFreeTrial: string;
  };

  /* ── footer ────────────────────────────────────────────── */
  footer: {
    columns: { product: string; solutions: string; resources: string; company: string };
    lineCta: string;
    lineSub: string;
    followUs: string;
    /** The newsletter strip above the legal bar. One address, no name — a
        second field on a footer sign-up buys nothing and costs sign-ups. */
    newsletter: {
      heading: string;
      body: string;
      placeholder: string;
      submit: string;
      success: string;
      invalidEmail: string;
      /** The small print. `{terms}` and `{privacy}` are replaced with links
          carrying `termsLabel` / `privacyLabel`, so each language keeps the
          clause order its grammar wants rather than the English one. */
      consent: string;
      termsLabel: string;
      privacyLabel: string;
    };
  };

  /* ── /events ───────────────────────────────────────────── */
  events: {
    eyebrow: string;
    headline: string;
    intro: string;
    searchPlaceholder: string;
    filterAll: string;
    filterUpcoming: string;
    filterPast: string;
    countUpcoming: string;
    countPast: string;
    noResults: string;
    clear: string;
    upcomingBadge: string;
    pastBadge: string;
    dateLabel: string;
    timeLabel: string;
    venueLabel: string;
    viewEvent: string;
    /* detail page */
    backToEvents: string;
    aboutHeading: string;
    presenceHeading: string;
    detailsHeading: string;
    addToCalendar: string;
    provisionalNote: string;
    relatedUpdate: string;
    ctaHeadline: string;
    ctaBody: string;
    notFound: string;
    kinds: { expo: string; conference: string; seminar: string };
    /* per-slug copy */
    items: Record<string, EventCopy>;
  };

  /* ── /updates ──────────────────────────────────────────── */
  updates: {
    eyebrow: string;
    headline: string;
    intro: string;
    searchPlaceholder: string;
    noResults: string;
    clear: string;
    readMore: string;
    backToUpdates: string;
    relatedEvent: string;
    ctaHeadline: string;
    ctaBody: string;
    notFound: string;
    kinds: { event: string; partnership: string; product: string; company: string };
    items: Record<string, UpdateCopy>;
  };

  /* ── /about ────────────────────────────────────────────── */
  about: {
    eyebrow: string;
    headline: string;
    intro: string;
    storyHeading: string;
    story: string[];
    missionHeading: string;
    mission: string;
    factsHeading: string;
    facts: { label: string; value: string }[];
    teamHeading: string;
    teamIntro: string;
    /* `name` is the seat, not a person: the roster is published by role while
       the individual names are still being confirmed, and a made-up name on an
       About page is the one thing on it that would be a lie. `photo` is a path
       under /public for the seats we have a real portrait for; the rest fall
       back to the initial, which is honest about being a placeholder in a way
       a stock face is not. */
    team: { name: string; role: string; bio: string; photo?: string }[];
    ctaHeadline: string;
    ctaBody: string;
  };

  /* ── /contact ──────────────────────────────────────────── */
  contact: {
    eyebrow: string;
    headline: string;
    intro: string;
    emailHeading: string;
    emailBody: string;
    /* the Gmail compose window's subject line — see the note in the page */
    emailSubject: string;
    lineHeading: string;
    lineBody: string;
    lineCta: string;
    socialHeading: string;
    socialBody: string;
    officeHeading: string;
    officeBody: string;
    responseNote: string;
    otherHeading: string;
    otherBody: string;
    demoCta: string;
    trialCta: string;
    /* the Request-pricing card in the row of form cards at the foot */
    pricingCardLabel: string;
    pricingCardDesc: string;
  };

  /* ── the four pop-up forms ─────────────────────────────── */
  forms: {
    close: string;
    back: string;
    careers: FormCopy;
    feature: FormCopy;
    issue: FormCopy;
    /** REQUEST PRICING — the quote form, reached from every price surface */
    pricing: FormCopy;
    /** The gate in front of the CN engine's result. Five fields, no product
        questions: the reader has already answered those by typing the codes,
        and the engine holds the answers. */
    calculate: FormCopy;
  };

  /* ── /pricing ──────────────────────────────────────────── */
  pricingPage: {
    eyebrow: string;
    headline: string;
    intro: string;
    /* cards */
    tiers: Record<string, { name: string; tag: string; line: string; builtFor: string; forLabel: string }>;
    /* No `priceOnRequest` / `priceNote` here any more. The cards used to give
       the loudest slot on the card to a line saying there was no price; the
       plan name has it now, and the quote lives on a button. `requestPricing`
       and `mostChosen` went with them — the first duplicated `common.
       requestPricing`, the second duplicated each tier's own `tag`. */
    startTrial: string;
    /* caps, rendered from the model */
    caps: {
      cnCodes: string;
      sites: string;
      years: string;
      seats: string;
      suppliers: string;
      tiersDeep: string;
      upTo: string;
      unlimited: string;
      customFrom: string;
    };
    /* the link from the short cards to the full table */
    compareLink: string;
    compareLinkSub: string;
    /* the actions row at the foot of the comparison table */
    actionsRow: string;
    /* the free CN-code engine, /pricing#cbam-engine */
    calc: {
      navLabel: string;
      navDesc: string;
      eyebrow: string;
      heading: string;
      intro: string;
      codeLabel: string;
      codePlaceholder: string;
      codeHint: string;
      productsLabel: string;
      productsHint: string;
      addCode: string;
      remove: string;
      notCbam: string;
      duplicate: string;
      sitesLabel: string;
      resultHeading: string;
      resultCodes: string;
      resultProducts: string;
      resultSectors: string;
      emptyState: string;
      fits: string;
      /* "{plan} is the smallest plan that covers what you entered." The only
         placeholder is the tier name, on purpose: a sentence carrying the
         reader's own counts has to say "1 CN codes" or grow a plural rule in
         five languages, and the counts are already on the tiles above it. */
      fitsWhy: string;
      overCap: string;
      /* The button in front of the result, and the line that stands in for the
         result until it is pressed. Both only ever show with at least one
         valid code entered — with none, `emptyState` still has the panel. */
      computeCta: string;
      lockedState: string;
      quoteCta: string;
      trialCta: string;
      contextLine: string;
      disclaimer: string;
      sectors: Record<string, string>;
    };
    /* comparison table */
    compareHeading: string;
    compareIntro: string;
    featureColumn: string;
    included: string;
    notIncluded: string;
    groups: Record<string, string>;
    rows: Record<string, string>;
    cells: Record<string, string>;
    colophon: string[];
    faqHeading: string;
    faq: { q: string; a: string }[];
    ctaHeadline: string;
    ctaBody: string;
  };
};

export const PAGES: Record<Lang, PageCopy> = {
  en: PAGES_EN,
  th: PAGES_TH,
  vi: PAGES_VI,
  tr: PAGES_TR,
  hi: PAGES_HI,
};
