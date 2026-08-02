import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Certrace",
  description:
    "How Certrace collects, uses, discloses, and protects personal data, in accordance with Thailand's Personal Data Protection Act B.E. 2562 (2019).",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
