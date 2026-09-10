import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Legal & Compliance",
  description:
    "Named sign-offs and a complete audit trail on every CBAM declaration. Coming soon — join the waitlist.",
  alternates: { canonical: "/solutions/legal-compliance" },
};

export default function LegalComplianceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
