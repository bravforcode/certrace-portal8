"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { CONTENT, type Content } from "./content";
import { isLang, localePath, routeLang, splitLocale, type Lang } from "./locales";

export type { Lang };

const STORAGE_KEY = "certrace-lang";

/* The five languages the site is published in. The order matches the LANGUAGE
   SUPPORT section on the home page — that section is about the *supplier
   forms* inside the product and carries its own live/soon status, so the two
   lists are separate things that happen to name the same languages; changing
   one does not imply changing the other. */
export const LANG_OPTIONS: { code: Lang; short: string; label: string }[] = [
  { code: "en", short: "EN", label: "English" },
  { code: "th", short: "TH", label: "ไทย" },
  { code: "vi", short: "VI", label: "Tiếng Việt" },
  { code: "tr", short: "TR", label: "Türkçe" },
  { code: "hi", short: "HI", label: "हिन्दी" },
];

/* Locales for anything the platform formats rather than the dictionary: so far
   the booking calendar's weekday and month names. Kept beside the language
   list so a sixth language can't be added without one.

   Deliberately no year in any format that uses these — `th-TH` would render it
   in the Buddhist era, which this site does not use anywhere else. */
export const DATE_LOCALE: Record<Lang, string> = {
  en: "en-GB",
  th: "th-TH",
  vi: "vi-VN",
  tr: "tr-TR",
  hi: "hi-IN",
};

/* The intro clip on the home page, one YouTube ID per language. Not copy, so
   it is not in the dictionaries — but not language-independent either, which
   is why it sits here with the locale table rather than in lib/site.ts.

   The Thai entry is a separate recording on the same channel, narrated in
   Thai, not subtitles laid over the English cut. A language with no cut of
   its own points at the English one on purpose: the section is the same shape
   in every language, and an empty entry would leave a black rectangle where
   the walkthrough should be. When a new cut is published, replacing the ID
   here is the whole change. */
const VIDEO_EN = "l4ZdQq5KA7Q";

export const HERO_VIDEO_ID: Record<Lang, string> = {
  en: VIDEO_EN,
  th: "ktOkmCM31oA",
  vi: VIDEO_EN,
  tr: VIDEO_EN,
  hi: VIDEO_EN,
};

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  c: Content;
};

const LangContext = createContext<LangContextValue | null>(null);

/* Sets `document.documentElement.lang`, which is what flips the type stack to
   the Thai cut (see `html[lang="th"]` in globals.css) — so the font swap and
   the copy swap can never drift apart.

   TWO KINDS OF PAGE. On the per-language sections (lib/locales.ts) the URL is
   the language: `/th/about-cbam/…` renders Thai on the server, which is the
   whole point — it is the only pass a crawler reads. Everywhere else the
   reader's stored choice applies, and the first render is English to match
   the server HTML; the stored preference is applied in an effect, because
   reading localStorage during render would mismatch hydration for every Thai
   visitor.

   The two stay in step. Opening a Thai address records Thai as the choice, so
   the pricing page the reader clicks through to next is Thai too; opening an
   English address in those sections with another language stored moves to
   that language's address, so a reader is never shown Thai on a URL that
   tells a crawler it is English. A crawler stores nothing and is never
   moved. Switching language on a per-language page navigates to the other
   version rather than re-rendering this one. */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const fromUrl = routeLang(pathname);
  const [chosen, setChosen] = useState<Lang>("en");
  const lang = fromUrl ?? chosen;

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (fromUrl && fromUrl !== "en") {
      if (stored !== fromUrl) window.localStorage.setItem(STORAGE_KEY, fromUrl);
      setChosen(fromUrl);
      return;
    }
    if (!isLang(stored)) return;
    setChosen(stored);
    if (fromUrl === "en" && stored !== "en") {
      router.replace(localePath(stored, splitLocale(pathname).path) + window.location.hash);
    }
  }, [fromUrl, pathname, router]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback(
    (next: Lang) => {
      setChosen(next);
      window.localStorage.setItem(STORAGE_KEY, next);
      if (fromUrl && next !== fromUrl) {
        router.push(localePath(next, splitLocale(pathname).path) + window.location.hash);
      }
    },
    [fromUrl, pathname, router],
  );

  const value = useMemo(
    () => ({ lang, setLang, c: CONTENT[lang] }),
    [lang, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
}
