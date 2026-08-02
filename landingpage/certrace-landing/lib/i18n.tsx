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

export type Lang = "en" | "th";

const STORAGE_KEY = "certrace-lang";

export const LANG_OPTIONS: { code: Lang; short: string; label: string }[] = [
  { code: "en", short: "EN", label: "English" },
  { code: "th", short: "TH", label: "ไทย" },
];

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
    if (stored === "th" || stored === "en") setLangState(stored);
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
