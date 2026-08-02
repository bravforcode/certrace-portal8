import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Certrace",
  description:
    "Simple, transparent pricing for CBAM compliance infrastructure. Suppliers are always free, on every plan.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
