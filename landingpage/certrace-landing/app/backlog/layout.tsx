import type { Metadata } from "next";

/* The page itself is a client component (it reads the language context), and a
   client component can't export `metadata` — so the route's metadata lives in
   this layout instead. */
export const metadata: Metadata = {
  title: "Backlog — what we have shipped",
  description:
    "Everything we've shipped on Certrace, newest first — the CBAM compliance platform for exporters and their suppliers.",
  alternates: { canonical: "/backlog" },
};

export default function BacklogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
