import type { Metadata } from "next";
import { updatesHubMetadata } from "@/lib/localized-meta";

export const metadata: Metadata = updatesHubMetadata("en");

export default function UpdatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
