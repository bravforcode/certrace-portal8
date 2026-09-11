import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Importers",
  description:
    "The EU-side CBAM declarant workspace: aggregate exporter emissions data, calculate certificates, and file the annual declaration. Coming soon.",
  alternates: { canonical: "/solutions/importers" },
};

export default function ImportersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
