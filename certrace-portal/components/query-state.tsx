"use client";

/* The two states every query-backed page shares. Kept deliberately thin:
   a page that needs a real skeleton designs its own; these stop the two bad
   defaults — a blank screen while fetching, and a redirect that eats a mere
   network blip as if the record were gone. */

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "./ui";
import { useT } from "@/lib/i18n";

export function LoadingState() {
  const t = useT();
  return (
    <div className="grid min-h-[40vh] place-items-center" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-[13px] text-black/40">
        <span className="h-4 w-4 flex-none animate-spin rounded-full border-2 border-black/10 border-t-black/45" aria-hidden />
        {t("Loading…")}
      </div>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <div className="text-center">
        <p className="text-sm text-black/60">{t("We couldn't reach the server.")}</p>
        <p className="mt-1 text-[13px] text-black/40">{t("Check your connection and try again.")}</p>
        <Button size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw size={13} strokeWidth={1.5} />
          {t("Try again")}
        </Button>
      </div>
    </div>
  );
}
