"use client";

import { useLang } from "./i18n";
import { CBAM_GUIDE, type CbamGuide } from "./cbam-guide";

/** The CBAM hub's copy in the reader's language, on the same context as the
    rest of the site — one switch moves the guides too. */
export function useCbamGuide(): CbamGuide {
  const { lang } = useLang();
  return CBAM_GUIDE[lang];
}
