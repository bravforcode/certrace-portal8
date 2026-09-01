"use client";

/* ── Interface language ────────────────────────────────────────
   A real switcher, and now a real translation layer rather than a
   proof-of-plumbing over the nav.

   The dictionary is keyed by the ENGLISH SOURCE STRING, not by invented ids.
   That buys two things worth more than tidy key names: a screen reads exactly
   as it renders (`{t("Supplier directory.")}`), and an untranslated string
   degrades to correct English instead of a missing-key stub. Adding Thai to a
   screen is therefore always additive — wrap the copy, add the pair.

   `{placeholders}` interpolate, so a sentence stays one translatable unit
   instead of being welded together from fragments in English word order —
   Thai puts them elsewhere.

   NOT translated, deliberately: proper nouns (Certrace, CBAM, EUDR, CSRD,
   O3CI, EORI), CBAM master data (Annex I product names, CN/HS codes, unit
   symbols) and identifiers. Those are the legal wording of the filing — a
   translated CN description is a wrong CN description. */

import * as React from "react";
import { TH } from "./i18n-th";

export type LangCode = "en" | "th";
export const LANGUAGES: { code: LangCode; label: string; nativeLabel: string; glyph: string }[] = [
  { code: "en", label: "English", nativeLabel: "English", glyph: "EN" },
  { code: "th", label: "Thai", nativeLabel: "ไทย", glyph: "TH" },
];

const DICTS: Record<LangCode, Record<string, string>> = { en: {}, th: TH };

export type Vars = Record<string, string | number>;

function interpolate(s: string, vars?: Vars) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export function translate(lang: LangCode, en: string, vars?: Vars) {
  return interpolate(DICTS[lang][en] ?? en, vars);
}

export type TFunction = (en: string, vars?: Vars) => string;

const LangContext = React.createContext<{ lang: LangCode; setLang: (l: LangCode) => void; t: TFunction }>({
  lang: "en",
  setLang: () => {},
  t: (en, vars) => interpolate(en, vars),
});

const STORAGE_KEY = "certrace:lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<LangCode>("en");

  React.useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "th") setLangState(saved);
  }, []);

  const setLang = React.useCallback((l: LangCode) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = React.useCallback<TFunction>((en, vars) => translate(lang, en, vars), [lang]);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLanguage() {
  return React.useContext(LangContext);
}

/* ── Screens pinned to English ──────────────────────────────────
   /login, /register and /forgot-password render in English only, by product
   decision: they are the first thing a visitor sees, they carry the legal
   consent copy, and the account they belong to does not exist yet — there is
   no profile whose language preference could be honoured. The switcher lives
   one step later, on /onboarding, where the person filling the form is known.

   This has to be a PROVIDER rather than "just don't call t()": the stored
   language is global (a user who set Thai inside the portal and then signed
   out still has `certrace:lang = th`), so an auth screen inherits Thai unless
   something overrides the context above it. It also re-pins <html lang> for
   the duration, because the Thai font swap in globals.css keys off that
   attribute — leaving it "th" would render English copy in the Thai cut and
   with the Thai letter-spacing corrections. The original value is restored on
   unmount, so walking from /register into /onboarding hands the language back
   untouched. */
export function EnglishOnly({ children }: { children: React.ReactNode }) {
  const { lang } = React.useContext(LangContext);
  const langRef = React.useRef(lang);
  langRef.current = lang;

  /* <html lang> is PINNED, not merely set once. The provider above writes the
     stored language into the same attribute from its own effect, and a parent
     effect runs after its child's — so a plain assignment here loses the race
     on the very case that matters (arriving at /login with `certrace:lang =
     th` saved from a previous session). Observing the attribute settles it
     whoever writes and in whatever order. Released on unmount back to the
     real language, so /onboarding renders Thai in the Thai cut. */
  React.useEffect(() => {
    const html = document.documentElement;
    const pin = () => {
      if (html.lang !== "en") html.lang = "en";
    };
    pin();
    const observer = new MutationObserver(pin);
    observer.observe(html, { attributes: true, attributeFilter: ["lang"] });
    return () => {
      observer.disconnect();
      html.lang = langRef.current;
    };
  }, []);

  const value = React.useMemo(
    () => ({ lang: "en" as LangCode, setLang: () => {}, t: (en: string, vars?: Vars) => interpolate(en, vars) }),
    [],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

/** Sugar for the common case — `const t = useT()`. */
export function useT(): TFunction {
  return React.useContext(LangContext).t;
}

/* ── Reading the saved language past an English pin ─────────────
   `useLanguage()` inside <EnglishOnly> answers "en", which is right for the
   screen and wrong for anything the screen SENDS somewhere else. The auth
   pages are pinned to English but the email they ask the server for is read
   later, by a person whose language we do know — the one they picked before
   they signed out. This is the only way to see it from in there.

   Storage can throw (Safari private mode, a browser set to block site data),
   so the fallback is the default language, never an exception. */
export function storedLang(): LangCode {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "th" ? "th" : "en";
  } catch {
    return "en";
  }
}

/* Country names come from the platform (Intl.DisplayNames), not from a
   hand-kept table — ICU already knows every ISO 3166 region in Thai, and a
   hand-written list of 195 names would only drift. The ISO code is always what
   we store; this is display only. */
export function useCountryOptions(countries: { code: string; name: string }[]) {
  const { lang } = useLanguage();
  return React.useMemo(() => {
    let display: Intl.DisplayNames | null = null;
    try {
      display = new Intl.DisplayNames([localeFor(lang)], { type: "region" });
    } catch {
      display = null;
    }
    return countries
      .map((c) => ({ value: c.code, label: (display?.of(c.code) ?? c.name) || c.name, hint: c.code }))
      .sort((a, b) => a.label.localeCompare(b.label, localeFor(lang)));
  }, [countries, lang]);
}

/** One country's display name in the active language. */
export function useCountryName() {
  const { lang } = useLanguage();
  return React.useCallback(
    (code: string, fallback?: string) => {
      try {
        return new Intl.DisplayNames([localeFor(lang)], { type: "region" }).of(code) ?? fallback ?? code;
      } catch {
        return fallback ?? code;
      }
    },
    [lang],
  );
}

/* Locale-aware helpers, so numbers and dates follow the interface language
   rather than being hardcoded en-GB/en-US at every call site. */
export const localeFor = (lang: LangCode) => (lang === "th" ? "th-TH" : "en-GB");

export function useFormat() {
  const { lang } = useLanguage();
  const locale = localeFor(lang);
  return React.useMemo(
    () => ({
      locale,
      number: (n: number, opts?: Intl.NumberFormatOptions) => n.toLocaleString(locale, opts),
      date: (d: Date | string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) =>
        (typeof d === "string" ? new Date(d) : d).toLocaleDateString(locale, opts),
    }),
    [locale],
  );
}
