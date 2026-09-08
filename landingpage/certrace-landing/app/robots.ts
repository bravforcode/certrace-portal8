import type { MetadataRoute } from "next";
import { SITE_URL, siteUrl } from "@/lib/site";

/* Deliberately permissive, including to the answer engines. The CBAM guides
   are written to be quoted — a page that answers a question in its first
   sentence and marks that answer up as FAQPage is only worth writing if the
   models that read it are allowed to. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: siteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
