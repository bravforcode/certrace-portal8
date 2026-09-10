import { OG_IMAGE, SITE_URL, siteUrl, FEED_SOCIALS } from "@/lib/site";
import { CONTACT_EMAIL } from "@/lib/content";

/* ════════════════════════════════════════════════════════════
   STRUCTURED DATA — the machine-readable half of every page

   A crawler reads two things: the prose, and this. The prose is translated
   client-side by LanguageProvider, so a crawler only ever sees the English
   pass of it; the graph below is language-independent facts — who publishes
   this site, what each page is, where it sits in the hierarchy — which is why
   it is emitted from server components rather than from the translated body.

   ONE `<script>` PER PAGE, ALWAYS AN @graph. Google merges multiple blocks,
   but a single graph with cross-references (`isPartOf`, `publisher`) is what
   lets an Organization stated once on the root layout be pointed at by name
   from a page-level node instead of repeated into it.
   ════════════════════════════════════════════════════════════ */

/** Stable @ids. Every node that needs to refer to the publisher or the site
    itself uses these rather than inlining a second copy of the organisation. */
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      /* JSON.stringify output, never user input — the only escape that matters
         here is `</script>` inside a string, which no field on this site
         contains and which the sanitiser below removes anyway. */
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** The publisher, stated once for the whole site. `sameAs` is what ties this
    domain to the social accounts a search engine already knows about — it is
    the difference between a name and an entity. */
export const organizationNode = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "Certrace",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: siteUrl("/brand/certrace-logo-horizontal-ink.svg"),
  },
  image: siteUrl(OG_IMAGE),
  description:
    "CBAM proof infrastructure for exporters: supplier carbon data collection, the EU calculation engine, and an audit-ready report package.",
  email: CONTACT_EMAIL,
  areaServed: ["TH", "VN", "IN", "TR", "EU"],
  sameAs: FEED_SOCIALS.map((s) => s.href),
};

export const webSiteNode = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: SITE_URL,
  name: "Certrace",
  publisher: { "@id": ORG_ID },
  inLanguage: ["en", "th", "vi", "hi", "tr"],
};

/** A breadcrumb trail. The last crumb carries no `item` on purpose: it is the
    page being read, and Google drops a trail whose final link points at itself. */
export function breadcrumbNode(trail: { name: string; path?: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      ...(crumb.path === undefined ? {} : { item: siteUrl(crumb.path) }),
    })),
  };
}
