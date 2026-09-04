import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Sans_Thai, Geist, Geist_Mono, Courier_Prime } from "next/font/google";
import { QueryProvider } from "@/components/query-provider";
import { LanguageProvider } from "@/lib/i18n";
import { ProfileProvider } from "@/lib/profile";
import "./globals.css";

// Display: IBM Plex Sans — always weight 300 for headlines/numerals.
const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

// Body + headings.
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

// Data surfaces, logs, tables.
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

/* The Thai script cut of the display family — the same face certrace-landing
   loads, so the two products render Thai identically. Not one of Geist,
   Geist Mono or Courier Prime carries a single Thai glyph, so without this the
   portal's 114 KB of Thai copy (lib/i18n-th.ts) fell back per glyph to
   whatever the OS had, and a Thai page mixed a system face into the brand one.

   `preload: false` because it is reachable only through the `html[lang="th"]`
   rule in globals.css — preloading would push a Thai font down the wire for
   every English visitor who will never see it. The @font-face still resolves
   the moment the language switches. */
const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-plex-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
  preload: false,
});

// Wordmark, eyebrow labels, plan names.
const courier = Courier_Prime({
  variable: "--font-courier",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Certrace — Exporter Portal",
  description:
    "Collect verified carbon data from suppliers, calculate embedded emissions, and submit verification-ready CBAM declarations to buyers and authorities — without the email chaos.",
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/certrace-icon-ink.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${plex.variable} ${plexThai.variable} ${geist.variable} ${geistMono.variable} ${courier.variable} antialiased`}
      >
        <QueryProvider>
          <LanguageProvider>
            <ProfileProvider>{children}</ProfileProvider>
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
