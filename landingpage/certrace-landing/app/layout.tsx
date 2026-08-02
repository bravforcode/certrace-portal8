import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { IBM_Plex_Sans, IBM_Plex_Sans_Thai, Courier_Prime } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

/* Thai companion cut of the same type family, loaded ahead of the Thai copy
   pass so `html[lang="th"]` (see globals.css) has a design-system-correct
   typeface the moment translated content lands — no separate font decision
   needed later. */
const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  variable: "--font-ibm-plex-sans-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
});

const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Certrace — Carbon Compliance Infrastructure for Exporters",
  description:
    "Certrace runs your CBAM declaration end to end — Smart Link supplier collection, AI quality checks, a definitive-period compliance engine, and an audit-ready package your EU buyer's declarant can file on.",
  keywords: [
    "CBAM compliance",
    "CBAM definitive period",
    "Annex IV communication template",
    "O3CI portal",
    "carbon data collection",
    "supply chain emissions",
    "Scope 3 buyer requests",
    "Thai exporters",
    "carbon border adjustment",
  ],
  icons: {
    icon: "/brand/favicon-32.png",
  },
  authors: [{ name: "Certrace" }],
  openGraph: {
    title: "Certrace — Carbon Compliance Infrastructure for Exporters",
    description:
      "Collect verified emissions data from your supply chain, meet CBAM, EUDR, and CSRD requirements, and file audit-ready compliance reports.",
    url: "https://certrace.com",
    siteName: "Certrace",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Certrace — Carbon Compliance Infrastructure for Exporters",
    description:
      "Supply chain carbon compliance. Without the chaos. CBAM, EUDR, and CSRD in one structured platform.",
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
        className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexSans.variable} ${ibmPlexSansThai.variable} ${courierPrime.variable} font-sans antialiased`}
      >
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
