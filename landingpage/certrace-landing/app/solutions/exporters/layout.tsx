import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Exporters — Certrace",
  description:
    "Prove your carbon data before the buyer has to ask. One workspace: Smart Link supplier invites, a CBAM calculation engine, a carbon benchmark, and an always-ready report package.",
};

export default function ExportersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
