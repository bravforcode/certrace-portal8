import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  IBM_Plex_Sans,
  IBM_Plex_Sans_Devanagari,
  IBM_Plex_Sans_Thai,
  Courier_Prime,
} from "next/font/google";
import { LanguageProvider } from "@/lib/i18n";
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
  title: "Certrace — CBAM Proof Infrastructure for Exporters",
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
  openGraph: {
    title: "Certrace — CBAM Proof Infrastructure for Exporters",
    description:
      "Every other platform in this space sells to the EU importer. Certrace is built for the exporter: collect supplier carbon data once, calculate it into the EU's format, and keep an audit-ready report standing by.",
    url: "https://certrace.com",
    siteName: "Certrace",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Certrace — CBAM Proof Infrastructure for Exporters",
    description:
      "Buyers don't wait for the best supplier. They pick whoever proves it first.",
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
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
