import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The legal terms governing access to and use of Certrace, the AI workflow platform connecting buyers, exporters and suppliers to automate CBAM carbon data collection.",
  alternates: { canonical: "/terms" },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
