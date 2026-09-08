import type { MetadataRoute } from "next";

/* THE PORTAL IS NOT A PUBLIC WEBSITE. Nothing under portal.certrace.co belongs
   in a search index: /login and /register would compete with the marketing
   site's own pages for the brand's own name, and /p/[token] is a supplier's
   Smart Link — a URL that is private by virtue of being unguessable, which
   stops being true the moment a crawler files it away.

   The marketing site (landingpage/certrace-landing) is the surface that is
   meant to be found, and its app/robots.ts is deliberately open. This is the
   opposite deployment with the opposite rule. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
