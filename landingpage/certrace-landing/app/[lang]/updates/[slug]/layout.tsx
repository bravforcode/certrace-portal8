import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateJsonLd, updateMetadata, updateParams } from "@/lib/localized-meta";
import { JsonLd } from "@/components/json-ld";
import type { Lang } from "@/lib/locales";

export const dynamicParams = false;

export function generateStaticParams() {
  return updateParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  return updateMetadata(lang as Lang, slug);
}

export default async function LocalizedUpdateLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const jsonLd = updateJsonLd(lang as Lang, slug);
  if (!jsonLd) notFound();

  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
    </>
  );
}
