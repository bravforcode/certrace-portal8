/* ════════════════════════════════════════════════════════════
   UPDATES — company news, in the order it happened

   Metadata only. Every word a reader sees is in UPDATE_TEXT, per language, so
   a post reads natively in all five rather than sitting in English under a
   translated heading.

   These are records of things that actually happened, with the photographs
   taken there. Nothing here is a product announcement dressed as news — that
   belongs on /backlog, which is already the public shipping record.
   ════════════════════════════════════════════════════════════ */

export type UpdateKind = "event" | "partnership" | "product" | "company";

export type Update = {
  slug: string;
  kind: UpdateKind;
  /** ISO date the thing happened, which is also how the list sorts */
  date: string;
  /** first image is the card's cover; the rest run inside the post */
  images: string[];
  /** links back to the event entry when the post is about one */
  eventSlug?: string;
};

export const UPDATES: Update[] = [
  {
    slug: "meeting-thai-exporters-association",
    kind: "partnership",
    date: "2026-08-28",
    images: ["/news/tema-meeting-1.jpg", "/news/tema-meeting-2.jpg"],
  },
  {
    slug: "tgo-chula-cbam-seminar",
    kind: "event",
    date: "2026-08-14",
    images: ["/news/tgo-chula-cbam-1.jpg", "/news/tgo-chula-cbam-2.jpg"],
    eventSlug: "tgo-chula-cbam-phase-3",
  },
];

/** Newest first — the only order this list is ever read in. */
export const UPDATES_SORTED = [...UPDATES].sort((a, b) => b.date.localeCompare(a.date));

export const updateBySlug = (slug: string) => UPDATES.find((u) => u.slug === slug);
