"use client";

/* One QueryClient for the whole portal — TanStack Query is the cache in
   front of lib/api. Created inside useState so a re-render never mints a
   second client (and with it a second, disagreeing cache). */

import * as React from "react";
import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { isApiError } from "@/lib/api";
import { toast } from "@/components/toast";
import { storedLang, translate } from "@/lib/i18n";

/* A mutation is always a write the user just asked for — a saved month, a
   sent link, a finalised version. When one rejects and nothing says so, the
   change is silently lost, which on a compliance filing is the worst outcome.
   None of the 29 mutation hooks carry their own onError, so this one net
   catches them all. A mutation that wants a SPECIFIC message can still pass
   its own onError; add `meta: { silent: true }` here to suppress this default
   for the rare one that handles the failure itself. */
function mutationErrorToast(_error: unknown, _vars: unknown, _ctx: unknown, mutation: { meta?: Record<string, unknown> }) {
  if (mutation.meta?.silent) return;
  // Runs outside React, so the hook-based `t` is unavailable — translate with
  // the same stored language the LanguageProvider hydrates from.
  const lang = storedLang();
  toast({
    message: translate(lang, "That didn't save."),
    detail: translate(lang, "Check your connection and try again — nothing was lost on your side."),
    tone: "err",
  });
}

function makeClient(): QueryClient {
  return new QueryClient({
    mutationCache: new MutationCache({ onError: mutationErrorToast }),
    defaultOptions: {
      queries: {
        // Server data ages in seconds, not milliseconds: a tab flip should
        // not refetch a list that was fresh a moment ago.
        staleTime: 30_000,
        retry: (failureCount, error) => {
          /* Retrying a 401 re-sends a token that just failed (the refresh
             layer in lib/api/http.ts already had its one attempt), and a 404
             will not grow the row it is missing. Only transport-shaped
             failures earn a second try. */
          if (isApiError(error) && !error.retryable) return false;
          return failureCount < 2;
        },
      },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(makeClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
