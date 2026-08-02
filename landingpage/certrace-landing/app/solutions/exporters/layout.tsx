import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Exporters — Certrace",
  description:
    "Run your whole CBAM declaration from one guided workspace, from supplier invite to audit-ready export.",
};

export default function ExportersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
