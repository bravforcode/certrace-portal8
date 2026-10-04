import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateJsonLd, updateMetadata, updateParams } from "@/lib/localized-meta";
import { JsonLd } from "@/components/json-ld";

/* One post's metadata and markup, server-side, at its English address. The
   other languages are served from app/[lang]/updates/[slug] by the same
   builders. Without a layout like this every post shared the /updates list
   page's title and description, which is the same page to a crawler. */

export function generateStaticParams() {
  return updateParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return updateMetadata("en", slug);
}

export default async function UpdateLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const jsonLd = updateJsonLd("en", slug);
  if (!jsonLd) notFound();

  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
    </>
  );
}
