import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Updates",
  description:
    "Company news from the Certrace team — the rooms we sat in, the people we listened to, and what changed in the product because of it.",
  alternates: { canonical: "/updates" },
};

export default function UpdatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
