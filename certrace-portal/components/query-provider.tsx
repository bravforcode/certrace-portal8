"use client";

/* One QueryClient for the whole portal — TanStack Query is the cache in
   front of lib/api. Created inside useState so a re-render never mints a
   second client (and with it a second, disagreeing cache). */

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isApiError } from "@/lib/api";

function makeClient(): QueryClient {
  return new QueryClient({
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
