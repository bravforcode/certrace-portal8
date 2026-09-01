import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About CBAM — twelve guides for exporters | Certrace",
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
  openGraph: {
    title: "About CBAM — twelve guides for exporters",
    description:
      "What the EU's Carbon Border Adjustment Mechanism now requires, what it costs, and what an exporter has to prove.",
    type: "website",
  },
};

export default function AboutCbamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
