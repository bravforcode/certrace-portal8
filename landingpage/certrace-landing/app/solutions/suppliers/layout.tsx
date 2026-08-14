import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Suppliers — Certrace",
  description:
    "Fill it once, never fill it again. One free guided form in your own language, from any device — no account, no fee.",
};

export default function SuppliersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
