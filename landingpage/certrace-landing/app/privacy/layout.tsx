import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Certrace collects, uses, discloses, and protects personal data, in accordance with Thailand's Personal Data Protection Act B.E. 2562 (2019).",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
