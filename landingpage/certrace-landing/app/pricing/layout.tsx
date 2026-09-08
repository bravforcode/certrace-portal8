import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for CBAM compliance infrastructure. Suppliers are always free, on every plan.",
  alternates: { canonical: "/pricing" },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
