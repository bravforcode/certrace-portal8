import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Sans_Devanagari, IBM_Plex_Sans_Thai, Geist, Geist_Mono, Courier_Prime, Inter, Noto_Sans_SC } from "next/font/google";
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

/* Simplified Chinese, for the supplier and precursor links. Nothing else in the stack carries a Han glyph. Like the Thai cut it is reached
   only through `html[lang^="zh"]` in globals.css, so it is not preloaded — and Google serves it in small unicode-range pieces, so a page
   downloads only the characters it shows. */
const notoZh = Noto_Sans_SC({
  variable: "--font-noto-zh",
  weight: ["300", "400", "500"],
  preload: false,
  display: "swap",
});

/* Hindi, for the supplier and precursor links and the sign-up — the Devanagari cut of the same family, reached only through `html[lang="hi"]`
   in globals.css, so like the Thai and Chinese faces it is not preloaded. */
const plexHi = IBM_Plex_Sans_Devanagari({
  variable: "--font-plex-hi",
  subsets: ["devanagari", "latin"],
  weight: ["300", "400", "500", "600"],
  preload: false,
  display: "swap",
});

// Cera's name in its header — the one place the assistant is set in Inter, at regular weight.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["300", "400", "500"] });

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
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
    ],
  },
  /* Belt and braces with app/robots.ts: robots.txt asks a crawler not to fetch
     these pages, this tag tells one that arrived by a link anyway not to index
     what it found — which is the case that matters for a supplier Smart Link
     pasted into a public chat. */
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${plex.variable} ${plexThai.variable} ${notoZh.variable} ${plexHi.variable} ${inter.variable} ${geist.variable} ${geistMono.variable} ${courier.variable} antialiased`}
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
