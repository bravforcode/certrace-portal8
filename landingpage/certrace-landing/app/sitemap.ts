import type { MetadataRoute } from "next";
import { ARTICLES } from "@/lib/cbam-guide";
import { EVENTS } from "@/lib/events";
import { UPDATES } from "@/lib/updates";
import { SITE_URL } from "@/lib/site";
import { LANGS, isLocalizedPath, languageAlternates, localePath } from "@/lib/locales";

/* The site map. Added with the CBAM hub: twelve guide pages that exist to be
   found are worth nothing if a crawler has to discover them by walking the
   nav, and the guides carry the newest dates on the site. */

const BASE = SITE_URL;

type Entry = MetadataRoute.Sitemap[number];

/* The per-language sections (lib/locales.ts) are listed once per language, and
   every copy carries the full set of hreflang alternates — the sitemap form of
   the <link rel="alternate"> each page also prints. Listing only the English
   address would leave the Thai one to be found by a crawler walking links. */
function withLanguages(path: string, rest: Omit<Entry, "url" | "alternates">): Entry[] {
  if (!isLocalizedPath(path)) return [{ url: `${BASE}${path}`, ...rest }];
  const languages = Object.fromEntries(
    Object.entries(languageAlternates(path)).map(([l, p]) => [l, `${BASE}${p}`]),
  );
  return LANGS.map((lang) => ({
    url: `${BASE}${localePath(lang, path)}`,
    ...rest,
    alternates: { languages },
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date();

  const statics: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1, freq: "weekly" },
    { path: "/about-cbam", priority: 0.9, freq: "weekly" },
    { path: "/pricing", priority: 0.8, freq: "monthly" },
    { path: "/solutions/exporters", priority: 0.8, freq: "monthly" },
    { path: "/solutions/suppliers", priority: 0.7, freq: "monthly" },
    { path: "/solutions/legal-compliance", priority: 0.5, freq: "monthly" },
    { path: "/solutions/importers", priority: 0.5, freq: "monthly" },
    { path: "/events", priority: 0.7, freq: "weekly" },
    { path: "/updates", priority: 0.7, freq: "weekly" },
    { path: "/about", priority: 0.6, freq: "monthly" },
    { path: "/contact", priority: 0.6, freq: "monthly" },
    { path: "/backlog", priority: 0.5, freq: "monthly" },
    { path: "/terms", priority: 0.3, freq: "yearly" },
    { path: "/privacy", priority: 0.3, freq: "yearly" },
  ];

  return [
    ...statics.flatMap((s) =>
      withLanguages(s.path, { lastModified: today, changeFrequency: s.freq, priority: s.priority }),
    ),
    /* The guides carry their own review date rather than today's — a crawler
       told everything changed today learns nothing from the field. */
    ...ARTICLES.flatMap((a) =>
      withLanguages(`/about-cbam/${a.slug}`, {
        lastModified: new Date(a.updated),
        changeFrequency: "monthly",
        priority: a.pillar ? 0.9 : 0.7,
      }),
    ),
    ...EVENTS.map((e) => ({
      url: `${BASE}/events/${e.slug}`,
      lastModified: new Date(e.end),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...UPDATES.flatMap((u) =>
      withLanguages(`/updates/${u.slug}`, {
        lastModified: new Date(u.date),
        changeFrequency: "yearly",
        priority: 0.5,
      }),
    ),
  ];
}
