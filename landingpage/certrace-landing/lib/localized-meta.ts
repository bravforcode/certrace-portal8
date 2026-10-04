import type { Metadata } from "next";
import { ARTICLES, CBAM_GUIDE, articleBySlug } from "./cbam-guide";
import { PAGES } from "./pages";
import { UPDATES, updateBySlug } from "./updates";
import { OG_IMAGE, siteUrl } from "./site";
import { OG_LOCALE, languageAlternates, localePath, type Lang } from "./locales";
import { ORG_ID, breadcrumbNode } from "@/components/json-ld";

/* ════════════════════════════════════════════════════════════
   METADATA FOR THE PER-LANGUAGE SECTIONS

   One builder per route, called by the English layout with "en" and by the
   `app/[lang]` layout with the prefix — so the two cannot describe the same
   page differently. Each version carries its own canonical (a Thai page is
   its own page, not a duplicate of the English one) and names every other
   version as an hreflang alternate, which is how a search engine knows to
   show the Thai address to someone searching in Thai.

   The English strings are the ones these routes always had; the other
   languages read the same dictionaries the page body does, so the title in
   the search result and the headline on the page cannot disagree.
   ════════════════════════════════════════════════════════════ */

/** A headline with the line break the layout wants, as one line of text. */
const oneLine = (s: string) => s.replace(/\s*\n\s*/g, " ");

const CARD = { url: OG_IMAGE, width: 1200, height: 630 };

/* ── /about-cbam ─────────────────────────────────────────── */

export function cbamHubMetadata(lang: Lang): Metadata {
  const path = "/about-cbam";
  const hub = CBAM_GUIDE[lang].hub;

  const title =
    lang === "en"
      ? "About CBAM — twelve guides for exporters"
      : `${PAGES[lang].nav.aboutCbam} — ${oneLine(hub.headline)}`;
  const description =
    lang === "en"
      ? "The EU Carbon Border Adjustment Mechanism explained for non-EU exporters: what CBAM requires in its definitive phase, certificate prices, the cost formula, default values, the 20% precursor rule, verification, and the 2027 deadlines."
      : hub.intro;
  const shareDescription =
    lang === "en"
      ? "What the EU's Carbon Border Adjustment Mechanism now requires, what it costs, and what an exporter has to prove."
      : hub.intro;

  return {
    title,
    description,
    ...(lang === "en"
      ? {
          keywords: [
            "CBAM",
            "Carbon Border Adjustment Mechanism",
            "EU CBAM 2026",
            "CBAM for exporters",
            "CBAM certificate price",
            "CBAM default values",
            "CBAM verification",
            "embedded emissions",
          ],
        }
      : {}),
    alternates: { canonical: localePath(lang, path), languages: languageAlternates(path) },
    /* A route that declares `openGraph` at all replaces the root layout's block
       rather than extending it, so the shared card has to be named again here —
       without it these pages share to LinkedIn and Slack as a bare link. */
    openGraph: {
      title,
      description: shareDescription,
      type: "website",
      locale: OG_LOCALE[lang],
      images: [CARD],
    },
    twitter: { card: "summary_large_image", images: [OG_IMAGE] },
  };
}

/* ── /about-cbam/[slug] ──────────────────────────────────── */

export const cbamArticleParams = () => ARTICLES.map((a) => ({ slug: a.slug }));

export function cbamArticleMetadata(lang: Lang, slug: string): Metadata {
  const meta = articleBySlug(slug);
  const text = CBAM_GUIDE[lang].articles[slug];
  if (!meta || !text) return {};
  const path = `/about-cbam/${slug}`;

  return {
    /* Absolute: these titles are written to a length that already fits a search
       result, and the brand appended to one would push it past the truncation. */
    title: { absolute: text.metaTitle },
    description: text.metaDescription,
    alternates: { canonical: localePath(lang, path), languages: languageAlternates(path) },
    openGraph: {
      title: text.metaTitle,
      description: text.metaDescription,
      type: "article",
      locale: OG_LOCALE[lang],
      publishedTime: meta.updated,
      modifiedTime: meta.updated,
      /* Restated because a child's `openGraph` replaces the root block whole. */
      images: [CARD],
    },
    twitter: {
      card: "summary_large_image",
      title: text.metaTitle,
      description: text.metaDescription,
      images: [OG_IMAGE],
    },
  };
}

/* ── /updates ────────────────────────────────────────────── */

export function updatesHubMetadata(lang: Lang): Metadata {
  const path = "/updates";
  return {
    title: PAGES[lang].nav.updates,
    description:
      lang === "en"
        ? "Company news from the Certrace team — the rooms we sat in, the people we listened to, and what changed in the product because of it."
        : PAGES[lang].updates.intro,
    alternates: { canonical: localePath(lang, path), languages: languageAlternates(path) },
  };
}

/* ── /updates/[slug] ─────────────────────────────────────── */

export const updateParams = () => UPDATES.map((u) => ({ slug: u.slug }));

export function updateMetadata(lang: Lang, slug: string): Metadata {
  const post = updateBySlug(slug);
  const text = PAGES[lang].updates.items[slug];
  if (!post || !text) return {};
  const path = `/updates/${slug}`;

  /* The post's own cover, or the shared card — never nothing: naming an
     `openGraph` block at all replaces the root layout's, image included. */
  const cover = post.images[0] ?? OG_IMAGE;

  return {
    /* Absolute for the same reason as the event route: a title two segments
       deep does not pick up the root template. */
    title: { absolute: `${text.title} — Certrace` },
    description: text.dek,
    alternates: { canonical: localePath(lang, path), languages: languageAlternates(path) },
    openGraph: {
      title: text.title,
      description: text.dek,
      type: "article",
      locale: OG_LOCALE[lang],
      publishedTime: post.date,
      images: [{ url: cover, alt: text.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: text.title,
      description: text.dek,
      images: [cover],
    },
  };
}

/** The post's structured data, in the language of the address it is served at. */
export function updateJsonLd(lang: Lang, slug: string): object | null {
  const post = updateBySlug(slug);
  const text = PAGES[lang].updates.items[slug];
  if (!post || !text) return null;
  const url = siteUrl(localePath(lang, `/updates/${slug}`));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        /* NewsArticle rather than BlogPosting: these are records of things that
           happened on a date, with the photographs taken there — the same
           distinction lib/updates.ts draws against product announcements, which
           live on /backlog. */
        "@type": "NewsArticle",
        "@id": `${url}#article`,
        headline: text.title,
        description: text.dek,
        datePublished: post.date,
        dateModified: post.date,
        image: post.images.map((i) => siteUrl(i)),
        author: { "@id": ORG_ID },
        publisher: { "@id": ORG_ID },
        mainEntityOfPage: url,
        inLanguage: lang,
      },
      breadcrumbNode([
        { name: "Certrace", path: "" },
        { name: PAGES[lang].nav.updates, path: localePath(lang, "/updates") },
        { name: text.title },
      ]),
    ],
  };
}
