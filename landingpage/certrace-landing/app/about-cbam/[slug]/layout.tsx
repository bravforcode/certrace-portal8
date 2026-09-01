import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLES, articleBySlug } from "@/lib/cbam-guide";
import { CBAM_EN } from "@/lib/cbam-guide-en";

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
    title: text.metaTitle,
    description: text.metaDescription,
    alternates: { canonical: `/about-cbam/${slug}` },
    openGraph: {
      title: text.metaTitle,
      description: text.metaDescription,
      type: "article",
      publishedTime: meta.updated,
      modifiedTime: meta.updated,
    },
    twitter: {
      card: "summary_large_image",
      title: text.metaTitle,
      description: text.metaDescription,
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
