import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articleBySlug } from "@/lib/cbam-guide";
import { cbamArticleMetadata, cbamArticleParams } from "@/lib/localized-meta";

/* One guide's metadata, generated on the server. This is the English address;
   app/[lang]/about-cbam/[slug] serves the same guide in the other four
   languages, each from its own dictionary, so a crawler reads every language
   at an address of its own rather than only the English pass. */

export function generateStaticParams() {
  return cbamArticleParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return cbamArticleMetadata("en", slug);
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
