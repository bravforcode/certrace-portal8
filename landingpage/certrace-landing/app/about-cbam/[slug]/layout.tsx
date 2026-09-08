import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLES, articleBySlug } from "@/lib/cbam-guide";
import { CBAM_EN } from "@/lib/cbam-guide-en";
import { OG_IMAGE } from "@/lib/site";

/* Metadata is generated on the server, from the English dictionary.

   That is deliberate rather than a limitation: the page body follows the
   reader's chosen language client-side, but a crawler has no language context
   and a canonical page needs one stable title and description. English is the
   source these are all translated from, so it is the one that cannot be out of
   date relative to the others. */

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = articleBySlug(slug);
  const text = CBAM_EN.articles[slug];
  if (!meta || !text) return {};

  return {
    /* Absolute: these titles are written to a length that already fits a search
       result, and the brand appended to one would push it past the truncation. */
    title: { absolute: text.metaTitle },
    description: text.metaDescription,
    alternates: { canonical: `/about-cbam/${slug}` },
    openGraph: {
      title: text.metaTitle,
      description: text.metaDescription,
      type: "article",
      publishedTime: meta.updated,
      modifiedTime: meta.updated,
      /* Restated because a child's `openGraph` replaces the root block whole. */
      images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: text.metaTitle,
      description: text.metaDescription,
      images: [OG_IMAGE],
    },
  };
}

export default async function ArticleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!articleBySlug(slug)) notFound();
  return children;
}
