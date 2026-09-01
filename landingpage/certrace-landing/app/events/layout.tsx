import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events — Certrace",
  description:
    "Where to meet the Certrace team: expos, conferences and CBAM seminars across Thailand and the region.",
  alternates: { canonical: "/events" },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
