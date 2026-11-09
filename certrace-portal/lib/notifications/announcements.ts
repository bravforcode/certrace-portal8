/* ════════════════════════════════════════════════════════════
   WHAT CERTRACE ITSELF HAS TO SAY

   The product's own news: a thing it can now do. Kept short and dated, shown for thirty days
   and only to people who have not switched the "Product updates" group off — which starts off,
   so nobody is told about a feature they did not ask to hear about.

   Rule changes are not here: those are the digest in lib/cera/updates.ts, which has its own group.
   ════════════════════════════════════════════════════════════ */

export type Announcement = {
  id: string;
  /** the day it was announced */
  date: string;
  title: string;
  /** paragraphs, each a dictionary key */
  body: string[];
  cta?: { label: string; href: string };
};

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "four-languages-2026-10",
    date: "2026-10-26",
    title: "Certrace now speaks 中文 and हिन्दी",
    body: [
      "The whole portal, the smart links your suppliers open, and Cera now work in English, ไทย, 中文 and हिन्दी.",
      "Change the language from the menu under your name. Cera answers in the language you write to her in.",
    ],
  },
  {
    id: "insight-pages-2026-10",
    date: "2026-10-25",
    title: "Carbon & Cost and Supply Chain were redesigned",
    body: [
      "Carbon & Cost now compares your sites, years and products in baht, euro, yuan or rupee, with the cost on your own figures set against the EU default.",
      "Supply Chain scores every supplier and precursor on how reliably the data arrives, and says where it worries us.",
    ],
    cta: { label: "Open Carbon & Cost", href: "/carbon-cost" },
  },
];
