import type { Metadata } from "next";
import { cbamHubMetadata } from "@/lib/localized-meta";

/* The English hub. Its Thai, Vietnamese, Turkish and Hindi versions live at
   app/[lang]/about-cbam and are described by the same builder. */
export const metadata: Metadata = cbamHubMetadata("en");

export default function AboutCbamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
