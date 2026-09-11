import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UPDATES, updateBySlug } from "@/lib/updates";
import { PAGES_EN } from "@/lib/pages-en";
import { OG_IMAGE, siteUrl } from "@/lib/site";
import { JsonLd, ORG_ID, breadcrumbNode } from "@/components/json-ld";

/* One post's metadata and markup, server-side, from the English copy — see
   app/about-cbam/[slug]/layout.tsx for why English rather than the reader's
   language. Without this file every post shared the /updates list page's title
   and description, which is the same page to a crawler. */

export function generateStaticParams() {
  return UPDATES.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = updateBySlug(slug);
  const text = PAGES_EN.updates.items[slug];
  if (!post || !text) return {};

  /* The post's own cover, or the shared card — never nothing: naming an
     `openGraph` block at all replaces the root layout's, image included. */
  const cover = post.images[0] ?? OG_IMAGE;

  return {
    /* Absolute for the same reason as the event route: a title two segments
       deep does not pick up the root template. */
    title: { absolute: `${text.title} — Certrace` },
    description: text.dek,
    alternates: { canonical: `/updates/${slug}` },
    openGraph: {
      title: text.title,
      description: text.dek,
      type: "article",
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

export default async function UpdateLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = updateBySlug(slug);
  const text = PAGES_EN.updates.items[slug];
  if (!post || !text) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        /* NewsArticle rather than BlogPosting: these are records of things that
           happened on a date, with the photographs taken there — the same
           distinction lib/updates.ts draws against product announcements, which
           live on /backlog. */
        "@type": "NewsArticle",
        "@id": siteUrl(`/updates/${slug}#article`),
        headline: text.title,
        description: text.dek,
        datePublished: post.date,
        dateModified: post.date,
        image: post.images.map((i) => siteUrl(i)),
        author: { "@id": ORG_ID },
        publisher: { "@id": ORG_ID },
        mainEntityOfPage: siteUrl(`/updates/${slug}`),
        inLanguage: "en",
      },
      breadcrumbNode([
        { name: "Certrace", path: "" },
        { name: "Updates", path: "/updates" },
        { name: text.title },
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
