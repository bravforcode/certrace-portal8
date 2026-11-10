import type { Metadata } from "next";
import { AccountDataProvider } from "@/components/account-data-provider";
import { CookieBanner } from "@/components/cookie-banner";
import { QueryProvider } from "@/components/query-provider";
import { LanguageProvider } from "@/lib/i18n";
import { ProfileProvider } from "@/lib/profile";
import "./fonts.css";
import "./parity-fonts.css";
import "./globals.css";

// CSP nonces are generated per request; cached HTML cannot reuse a different nonce.
export const dynamic = "force-dynamic";

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="antialiased">
        <QueryProvider>
          <LanguageProvider>
            <AccountDataProvider>
              <ProfileProvider>{children}</ProfileProvider>
              <CookieBanner />
            </AccountDataProvider>
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
