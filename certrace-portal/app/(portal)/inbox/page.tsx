/* The Inbox is now Smart Links (app/(portal)/smart-links/page.tsx) — a
   superset of what this route showed. Kept as a redirect rather than deleted:
   /inbox is in bookmarks, in the supplier-role prompt's history and in any
   note an exporter has written down, and a 404 on a page that has moved is
   indistinguishable from a page that has been taken away. */
import { redirect } from "next/navigation";

export default function InboxRedirect() {
  redirect("/smart-links");
}
