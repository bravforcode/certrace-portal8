import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing access to and use of the Certrace platform for ESG data management and CBAM compliance support.",
  alternates: { canonical: "/terms" },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
