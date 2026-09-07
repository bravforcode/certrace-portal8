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

/* ── Which language to open in ──────────────────────────────────
   A supplier arrives on a Smart Link with no account, no profile and no
   previous visit — there is nothing on file to read a preference from, and the
   only person who can fix a page that opened in the wrong language is them,
   with a control they first have to find. The browser already carries the
   answer, so ask it.

   A SAVED choice always wins, and only an explicit switch is ever saved (see
   setLang). Detection stays a fallback rather than becoming a stored value:
   writing it down would turn a guess into a decision the reader never made,
   and one they could then only undo by finding the toggle anyway.

   The list is ORDERED, and the first entry we speak wins — not the first Thai
   entry anywhere in it. `["en-US", "th"]` is a reader who would rather have
   English and can also read Thai, and handing them Thai overrules a preference
   they stated. It is the commoner shape than it looks: an English-locale OS
   with Thai added is what a lot of Thai machines report.

   Only the language subtag is compared, so region, script and extension
   subtags come along for free — `th`, `th-TH` and `th-TH-u-nu-thai` are all
   Thai. A language we do not speak is skipped rather than answered in, and a
   list with nothing we speak in it — or no list at all — is English, the
   language the product is written in. */
export function preferredLang(saved: string | null | undefined, tags: readonly (string | undefined)[]): LangCode {
  if (saved === "en" || saved === "th") return saved;
  for (const tag of tags) {
    const subtag = tag?.toLowerCase().split("-")[0];
    if (subtag === "th" || subtag === "en") return subtag;
  }
  return "en";
}

/** The browser's own ordered preference list, or nothing to go on off-browser. */
function browserTags(): readonly (string | undefined)[] {
  if (typeof navigator === "undefined") return [];
  return navigator.languages?.length ? navigator.languages : [navigator.language];
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<LangCode>("en");

  /* Runs after the first paint on purpose: the server has neither the saved
     choice nor the browser's list, so deciding here — and only here — is what
     keeps the first client render identical to the HTML that came down. */
  React.useEffect(() => {
    setLangState(preferredLang(window.localStorage.getItem(STORAGE_KEY), browserTags()));
  }, []);

  const setLang = React.useCallback((l: LangCode) => {
    setLangState(l);
    // Guarded like storedLang(): setItem throws in private mode. Swallow so the
    // language still switches in-memory and the <html lang> swap below still runs.
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* persistence best-effort */
    }
    document.documentElement.lang = l;
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = React.useCallback<TFunction>((en, vars) => translate(lang, en, vars), [lang]);

  return React.createElement(LangContext.Provider, { value: { lang, setLang, t } }, children);
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
  return React.createElement(LangContext.Provider, { value }, children);
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
/* The language for code that runs OUTSIDE React and so cannot read the
   context — the mutation cache's error toast, mainly. Same rule as the
   provider, or a Thai reader gets a Thai screen with an English failure on it,
   which is the one sentence they most need to understand. */
export function storedLang(): LangCode {
  try {
    return preferredLang(window.localStorage.getItem(STORAGE_KEY), browserTags());
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
