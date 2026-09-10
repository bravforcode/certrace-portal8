import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EVENTS, eventBySlug } from "@/lib/events";
import { PAGES_EN } from "@/lib/pages-en";
import { siteUrl } from "@/lib/site";
import { JsonLd, ORG_ID, breadcrumbNode } from "@/components/json-ld";

/* Metadata for one event, generated on the server from the English copy — the
   same rule the CBAM guides follow (app/about-cbam/[slug]/layout.tsx): the body
   follows the reader's language, a canonical page gets one stable title.

   Until this file existed both event pages inherited the root layout wholesale,
   so /events/kmitl-expo-2026 and /events/telecomsworld-asia-2026 were served to
   Google under one shared title and one shared description — two URLs a crawler
   has no reason to treat as different pages, on the part of the site most likely
   to be searched for by name. */

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ev = eventBySlug(slug);
  const text = PAGES_EN.events.items[slug];
  if (!ev || !text) return {};

  /* Absolute: the root layout's "%s — Certrace" template reaches one level
     down, not two, so the brand is spelled out here rather than inherited. */
  const title = `${text.name} — Certrace`;

  return {
    title: { absolute: title },
    description: text.summary,
    alternates: { canonical: `/events/${slug}` },
    openGraph: {
      title,
      description: text.summary,
      type: "website",
      images: [{ url: ev.image, alt: text.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: text.summary,
      images: [ev.image],
    },
  };
}

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ev = eventBySlug(slug);
  const text = PAGES_EN.events.items[slug];
  /* A real 404 rather than the page's own "we could not find that event"
     screen, which answers 200 — a soft 404 keeps a dead URL in the index. */
  if (!ev || !text) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Event",
        "@id": siteUrl(`/events/${slug}#event`),
        name: text.name,
        description: text.summary,
        /* ISO dates, inclusive, exactly as lib/events.ts stores them. The
           exclusive-end conversion that the Google Calendar link needs is a
           quirk of that API, not of schema.org — Event.endDate is inclusive. */
        startDate: ev.start,
        endDate: ev.end,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        image: siteUrl(ev.image),
        url: siteUrl(`/events/${slug}`),
        location: {
          "@type": "Place",
          name: ev.venue,
          address: {
            "@type": "PostalAddress",
            addressLocality: ev.city,
            addressCountry: ev.country,
          },
        },
        /* We attend; we do not organise. Saying otherwise in markup is the kind
           of claim a rich-result review rejects the whole page for. */
        performer: { "@id": ORG_ID },
      },
      breadcrumbNode([
        { name: "Certrace", path: "" },
        { name: "Events", path: "/events" },
        { name: text.name },
      ]),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
    </>
  );
}
