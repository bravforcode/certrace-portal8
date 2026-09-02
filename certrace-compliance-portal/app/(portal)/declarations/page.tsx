"use client";

/* The Declarations index is retired.

   A declaration was what got FILED and a workspace is what gets VERIFIED, and
   in practice the exporter only ever worked in the second one — the filing
   list was a second place to keep track of the same estate, with its own
   creation flow, its own drafts and its own idea of what "in progress" meant.
   Verification workspaces are now the single spine, so this route redirects
   there rather than 404-ing the bookmarks and deep links that already exist.

   The per-declaration detail pages under `[id]` are still reachable, because
   Team and Suppliers link into them as history. */

import * as React from "react";
import { useRouter } from "next/navigation";

export default function DeclarationsIndexRedirect() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace("/workspaces");
  }, [router]);
  return null;
}
