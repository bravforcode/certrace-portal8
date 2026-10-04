import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articleBySlug } from "@/lib/cbam-guide";
import { cbamArticleMetadata, cbamArticleParams } from "@/lib/localized-meta";
import type { Lang } from "@/lib/locales";

export const dynamicParams = false;

export function generateStaticParams() {
  return cbamArticleParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  return cbamArticleMetadata(lang as Lang, slug);
}

export default async function LocalizedArticleLayout({
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
