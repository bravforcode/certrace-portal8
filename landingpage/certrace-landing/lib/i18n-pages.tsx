"use client";

import { useLang } from "./i18n";
import { PAGES, type PageCopy } from "./pages";

/* The page dictionary, on the same language context as the rest of the site.
   Kept as its own hook rather than folded into useLang so the original
   dictionary's shape is untouched — see the header of lib/pages.ts. */
export function usePages(): PageCopy {
  const { lang } = useLang();
  return PAGES[lang];
}
