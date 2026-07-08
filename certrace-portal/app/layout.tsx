import type { Metadata } from "next";
import { IBM_Plex_Sans, Geist, Geist_Mono, Courier_Prime } from "next/font/google";
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

// Wordmark, eyebrow labels, plan names.
const courier = Courier_Prime({
  variable: "--font-courier",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Certrace — Exporter Portal",
  description:
    "Collect verified carbon data from suppliers, calculate embedded emissions, and submit audit-ready CBAM declarations to buyers and authorities — without the email chaos.",
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
        className={`${plex.variable} ${geist.variable} ${geistMono.variable} ${courier.variable} antialiased`}
      >
        <LanguageProvider>
          <ProfileProvider>{children}</ProfileProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
