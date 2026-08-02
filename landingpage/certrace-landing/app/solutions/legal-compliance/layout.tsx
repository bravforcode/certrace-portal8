import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Legal & Compliance — Certrace",
  description:
    "Named sign-offs and a complete audit trail on every CBAM declaration.",
};

export default function LegalComplianceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
