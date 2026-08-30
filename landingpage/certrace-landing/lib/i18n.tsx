"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CONTENT, type Content } from "./content";

export type Lang = "en" | "th" | "vi" | "tr" | "hi";

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

const LANG_CODES = LANG_OPTIONS.map((o) => o.code);

function isLang(value: string | null): value is Lang {
  return !!value && (LANG_CODES as string[]).includes(value);
}

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

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  c: Content;
};

const LangContext = createContext<LangContextValue | null>(null);

/* Sets `document.documentElement.lang`, which is what flips the type stack to
   the Thai cut (see `html[lang="th"]` in globals.css) — so the font swap and
   the copy swap can never drift apart.

   The first render is always English, matching the server-rendered HTML; the
   stored preference is applied in an effect. Reading localStorage during
   render would produce a hydration mismatch on every Thai visitor. */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

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
