import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updatesHubMetadata } from "@/lib/localized-meta";
import { PREFIXED_LANGS, isLang } from "@/lib/locales";

/* The language-prefixed copy of /updates: /th, /vi, /tr and /hi (lib/locales.ts).
   English is not here — it keeps the unprefixed address it has always had.
   Only those four prefixes are generated, and `dynamicParams = false` makes any
   other first segment a 404 rather than a page. */

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return updatesHubMetadata(lang);
}

export default async function LocalizedUpdatesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang) || lang === "en") notFound();
  return children;
}
