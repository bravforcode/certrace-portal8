import type { Metadata } from "next";
import { IBM_Plex_Sans, Geist, Geist_Mono, Courier_Prime } from "next/font/google";
import { AdminAuthProvider } from "@/lib/admin-auth";
import { Toaster } from "@/components/toast";
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

// Wordmark, eyebrow labels, module tags.
const courier = Courier_Prime({
  variable: "--font-courier",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Certrace — Admin Console",
  description: "Staff-only internal console: accounts, verification, regulatory master data, billing, support and audit across all Certrace tenants.",
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${plex.variable} ${geist.variable} ${geistMono.variable} ${courier.variable} antialiased`}>
        <AdminAuthProvider>
          {children}
          <Toaster />
        </AdminAuthProvider>
      </body>
    </html>
  );
}
