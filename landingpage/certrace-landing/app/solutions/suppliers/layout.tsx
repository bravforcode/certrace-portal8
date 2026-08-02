import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Suppliers — Certrace",
  description:
    "One free guided form, in Thai or English, from any device — no account, no fee.",
};

export default function SuppliersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
