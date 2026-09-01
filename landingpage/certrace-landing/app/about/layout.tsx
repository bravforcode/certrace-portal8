import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Certrace",
  description:
    "Certrace is carbon compliance infrastructure for exporters. Who we are, why we built it, and how we build.",
  alternates: { canonical: "/about" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
