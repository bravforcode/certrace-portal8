import type { MetadataRoute } from "next";

/* Internal console. The root layout already answers with a noindex meta tag
   (app/layout.tsx); this is the half of that pair a crawler reads *before* it
   requests anything, so the pages are never fetched in the first place. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
