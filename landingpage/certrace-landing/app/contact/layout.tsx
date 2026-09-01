import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Certrace",
  description:
    "Email, LINE Official, and every other way to reach the Certrace team in Bangkok.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
