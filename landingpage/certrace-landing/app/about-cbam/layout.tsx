import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About CBAM — twelve guides for exporters",
  description:
    "The EU Carbon Border Adjustment Mechanism explained for non-EU exporters: what CBAM requires in its definitive phase, certificate prices, the cost formula, default values, the 20% precursor rule, verification, and the 2027 deadlines.",
  keywords: [
    "CBAM",
    "Carbon Border Adjustment Mechanism",
    "EU CBAM 2026",
    "CBAM for exporters",
    "CBAM certificate price",
    "CBAM default values",
    "CBAM verification",
    "embedded emissions",
  ],
  alternates: { canonical: "/about-cbam" },
  /* A route that declares `openGraph` at all replaces the root layout's block
     rather than extending it, so the shared card has to be named again here —
     without it these pages share to LinkedIn and Slack as a bare link. */
  openGraph: {
    title: "About CBAM — twelve guides for exporters",
    description:
      "What the EU's Carbon Border Adjustment Mechanism now requires, what it costs, and what an exporter has to prove.",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE],
  },
};

export default function AboutCbamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
