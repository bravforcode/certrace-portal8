import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  IBM_Plex_Sans,
  IBM_Plex_Sans_Devanagari,
  IBM_Plex_Sans_Thai,
  Courier_Prime,
} from "next/font/google";
import { LanguageProvider } from "@/lib/i18n";
import { CookieConsent } from "@/components/cookie-consent";
import { JsonLd, organizationNode, webSiteNode } from "@/components/json-ld";
import { OG_IMAGE, SITE_URL } from "@/lib/site";
import "./globals.css";

/* `latin-ext` carries the Turkish letters — ğ, ş, ı and the dotted capital İ
   are Latin Extended-A, outside the base `latin` subset, so without it a
   Turkish page would fall back per glyph and mix a system face into the brand
   one. Google serves each subset as its own unicode-range @font-face, so an
   English page still fetches only the Latin file. */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

/* The display face, and the only one of the four Latin families that covers
   Vietnamese: its stacked tone marks (ế, ữ, ộ) live in Latin Extended
   Additional, which Google publishes as the `vietnamese` subset. Geist and
   Courier Prime don't carry it at all, which is why `html[lang="vi"]` in
   globals.css routes the whole stack through this one. */
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["300", "400", "500", "600"],
});

/* Script-specific cuts of the same family, one per non-Latin language.

   `preload: false` on both: they are reachable only through an
   `html[lang="th"]` / `html[lang="hi"]` rule, so a preload link would push two
   script fonts down the wire for every visitor who will never see either. The
   @font-face still resolves normally the moment the rule matches. */
const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  variable: "--font-ibm-plex-sans-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
  preload: false,
});

const ibmPlexSansDevanagari = IBM_Plex_Sans_Devanagari({
  variable: "--font-ibm-plex-sans-devanagari",
  subsets: ["devanagari", "latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
  preload: false,
});

const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  /* THE BASE EVERY RELATIVE METADATA URL IS RESOLVED AGAINST. Without it Next
     falls back to http://localhost:3000, which is what the production site was
     doing: canonical links shipped as bare paths and the Open Graph image path
     had nothing to resolve into an absolute URL — and an OG image that is not
     absolute is no OG image at all to Facebook, LinkedIn, X or Slack. */
  metadataBase: new URL(SITE_URL),
  /* `template` is what gives every page a title without each one restating the
     brand. A child that sets `title: "Pricing"` gets "Pricing — Certrace"; the
     several that set a full title of their own still win, because a child's
     absolute title replaces the template rather than nesting inside it. */
  title: {
    default: "Certrace — CBAM Proof Infrastructure for Exporters",
    template: "%s — Certrace",
  },
  description:
    "Buyers don't wait for the best supplier — they pick whoever proves it first. Certrace is the AI workflow platform built on the exporter's side: Smart Link supplier invites, fill-once profiles, automatic quality checks, the CBAM calculation engine, a carbon benchmark, and a report package that's ready before your buyer asks.",
  keywords: [
    "CBAM compliance",
    "CBAM for exporters",
    "CBAM definitive period",
    "Annex IV communication template",
    "O3CI portal",
    "carbon data collection",
    "supply chain emissions",
    "carbon benchmark",
    "Thai exporters",
    "carbon border adjustment",
  ],
  icons: {
    icon: "/brand/favicon-32.png",
  },
  authors: [{ name: "Certrace" }],
  /* Search Console and Bing Webmaster Tools each want to see a token in the
     head before they will show this site's index coverage. Both are set as
     build-time env vars rather than committed, because they are per-property
     and a stale one in the source is worse than none. Leave them unset and no
     tag is emitted. */
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } }
      : {}),
  },
  /* The homepage's own canonical. It is stated here rather than left to Next
     because every other route sets one, and a site where one page in fifteen
     has no canonical is a site whose homepage can be indexed twice — once with
     a tracking parameter on it. Child layouts override this; none inherits it. */
  alternates: { canonical: "/" },
  openGraph: {
    title: "Certrace — CBAM Proof Infrastructure for Exporters",
    description:
      "Every other platform in this space sells to the EU importer. Certrace is built for the exporter: collect supplier carbon data once, calculate it into the EU's format, and keep an audit-ready report standing by.",
    url: SITE_URL,
    siteName: "Certrace",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Certrace — CBAM proof infrastructure for exporters",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Certrace — CBAM Proof Infrastructure for Exporters",
    description:
      "Buyers don't wait for the best supplier. They pick whoever proves it first.",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* `suppressHydrationWarning`: LanguageProvider rewrites `lang` to the
       visitor's stored preference on mount, which React would otherwise flag
       as a server/client attribute mismatch on this element. */
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexSans.variable} ${ibmPlexSansThai.variable} ${ibmPlexSansDevanagari.variable} ${courierPrime.variable} font-sans antialiased`}
      >
        {/* Publisher and site identity, stated once for every page under this
            layout. Page-level nodes point at these by @id rather than
            repeating them. */}
        <JsonLd data={{ "@context": "https://schema.org", "@graph": [organizationNode, webSiteNode] }} />
        <LanguageProvider>
          {children}
          {/* Site-wide, so every entry point asks once — not just the home
              page. Inside the provider because its copy follows the language. */}
          <CookieConsent />
        </LanguageProvider>
      </body>
    </html>
  );
}
