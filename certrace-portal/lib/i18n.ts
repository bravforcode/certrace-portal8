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
import { usePathname } from "next/navigation";
import { TH } from "./i18n-th";
import { TH_CN } from "./i18n-th-cn";
import { TH_INTAKE } from "./i18n-th-intake";
import { TH_LINK } from "./i18n-th-link";
import { TH_POLISH } from "./i18n-th-polish";
import { TH_ROUTES } from "./i18n-th-routes";
import { TH_SECTOR } from "./i18n-th-sector";
import { TH_WORKSPACE } from "./i18n-th-workspace";
import { TH_OPPORTUNITIES } from "./i18n-th-opportunities";
import { TH_WHATIF } from "./i18n-th-whatif";
import { HI } from "./i18n-hi";
import { ZH } from "./i18n-zh";

export type LangCode = "en" | "th" | "zh" | "hi";
type LanguageInfo = {
  code: LangCode;
  label: string;
  nativeLabel: string;
  glyph: string;
};

/** EVERY SCREEN of the portal speaks four languages: English and Thai, Chinese and Hindi. Chinese and Hindi began as the languages of the two pages a
    plant or a precursor maker is sent (/w and /p) and of sign-up; the whole portal now reads in them too — menus, dropdowns, the explanation
    under a field, the dashboard and Cera. The two sign-in pages are the exception (see EnglishOnly below). */
export const LANGUAGES: LanguageInfo[] = [
  { code: "en", label: "English", nativeLabel: "English", glyph: "EN" },
  { code: "th", label: "Thai", nativeLabel: "ไทย", glyph: "TH" },
  { code: "zh", label: "Chinese", nativeLabel: "中文", glyph: "ZH" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", glyph: "HI" },
];

/* ── The language MENU: more choices than translations ───────────
   The menu offers twelve languages; four of them (English, Thai, Chinese, Hindi) have a dictionary. A choice without one keeps its own tick
   in the menu but renders the English interface (`ui: "en"`) until its dictionary exists — adding one is: add the LangCode and DICTS entry,
   then point that choice's `ui` at it. `lang` everywhere in the product stays the RENDERED language; `choice` is only what the menu shows. */
export type MenuCode =
  | "en"
  | "en-US"
  | "th"
  | "vi"
  | "tr"
  | "hi"
  | "zh"
  | "ko"
  | "zh-TW"
  | "id"
  | "ja"
  | "ms";
export type MenuLanguage = {
  code: MenuCode;
  /** The interface language this choice renders in. */
  ui: LangCode;
  label: string;
  nativeLabel: string;
};
export const MENU_LANGUAGES: MenuLanguage[] = [
  { code: "en", ui: "en", label: "English (UK)", nativeLabel: "English (UK)" },
  {
    code: "en-US",
    ui: "en",
    label: "English (US)",
    nativeLabel: "English (US)",
  },
  { code: "th", ui: "th", label: "Thai", nativeLabel: "ไทย" },
  { code: "vi", ui: "en", label: "Vietnamese", nativeLabel: "Tiếng Việt" },
  { code: "tr", ui: "en", label: "Turkish", nativeLabel: "Türkçe" },
  { code: "hi", ui: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "zh", ui: "zh", label: "Chinese", nativeLabel: "中文" },
  { code: "ko", ui: "en", label: "Korean", nativeLabel: "한국어" },
  {
    code: "zh-TW",
    ui: "en",
    label: "Traditional Chinese",
    nativeLabel: "繁體中文",
  },
  {
    code: "id",
    ui: "en",
    label: "Indonesian",
    nativeLabel: "Bahasa Indonesia",
  },
  { code: "ja", ui: "en", label: "Japanese", nativeLabel: "日本語" },
  { code: "ms", ui: "en", label: "Malay", nativeLabel: "Bahasa Melayu" },
];
const isMenuCode = (v: unknown): v is MenuCode =>
  MENU_LANGUAGES.some((l) => l.code === v);
/** The interface language a menu choice renders in. */
export const uiLang = (c: MenuCode): LangCode =>
  MENU_LANGUAGES.find((l) => l.code === c)?.ui ?? "en";

/** Kept for the callers written when only the link pages offered four: it is the same list now. */
export const LINK_LANGUAGES: LanguageInfo[] = LANGUAGES;

/** Which routes are the links. A choice made there is kept apart from the exporter's choice in the portal: a plant that picked Chinese on its
    link must not change the language an exporter testing that link in their own browser reads their account in. */
/* /w is the supplier's month, /p the precursor maker's form. The older supplier portal at /s keeps the portal's own choice. */
const LINK_ROUTE = /^\/(w|p)\//;
/* The company's own sign-up — /onboarding, its setup step and the "done" page. The person filling it in is the account holder, who may read Chinese or Hindi
   better than Thai or English; what they choose here is also the portal's language when they arrive in it. */
const ONBOARDING_ROUTE = /^\/onboarding(\/|$)/;
export const languagesFor = (_pathname?: string | null): LanguageInfo[] =>
  LANGUAGES;
const onboardingRoute = (pathname: string | null | undefined): boolean =>
  Boolean(pathname && ONBOARDING_ROUTE.test(pathname));

/* The portal-wide dictionary wins: smart upload and the steel and aluminium form add
   strings, they do not reword ones other screens already use. */
/* A Thai label never carries the English one after it. "ติดขัด (Blocked)" reads as a translation left showing — the reader chose
   Thai, so they get Thai, and the same screen in English shows only English. Only a trailing bracket holding plain English words is
   dropped; units, acronyms and codes — (MWh), (NCV), (CO₂e), (THB หรือ EUR) — stay. */
const ENGLISH_GLOSS = /\s*\([A-Z]?[a-z][A-Za-z '’&-]{3,}\)\s*$/;
const withoutGloss = (dict: Record<string, string>): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(dict))
    out[k] =
      ENGLISH_GLOSS.test(v) &&
      /[\u0E00-\u0E7F]/.test(v.replace(ENGLISH_GLOSS, ""))
        ? v.replace(ENGLISH_GLOSS, "")
        : v;
  return out;
};

const DICTS: Record<LangCode, Record<string, string>> = {
  en: {},
  th: withoutGloss({
    ...TH_WORKSPACE,
    ...TH_OPPORTUNITIES,
    ...TH_WHATIF,
    ...TH_LINK,
    ...TH_CN,
    ...TH_ROUTES,
    ...TH_SECTOR,
    ...TH_INTAKE,
    ...TH,
    ...TH_POLISH,
  }),
  zh: ZH,
  hi: HI,
};

export type Vars = Record<string, string | number>;

function interpolate(s: string, vars?: Vars) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/* ── A sentence that was assembled before it got here ───────────
   Most copy reaches `t()` as its template — `t("{n} things to fix", { n })` — and is found exactly. But a good deal of the product's wording is
   built in lib/ where there is no `t`: a validation message that names a fuel and a number is a template literal by the time any screen
   sees it. Those are written in the dictionary as the TEMPLATE ("{fuel} — emission factor out of band"), and this finds them: a string with
   no exact entry is matched against the templates, the parts that varied are lifted out, and they are put back into the translated
   template. A string that matches nothing is returned as it came — English, never a gap. The match (or the lack of one) is remembered. */
type Template = { pattern: RegExp; names: string[]; target: string };
const TEMPLATES: Partial<Record<LangCode, Template[]>> = {};
const SEEN: Partial<Record<LangCode, Map<string, Template | null>>> = {};

function templatesFor(lang: LangCode): Template[] {
  let list = TEMPLATES[lang];
  if (list) return list;
  list = [];
  for (const [key, target] of Object.entries(DICTS[lang])) {
    if (!/\{\w+\}/.test(key)) continue;
    /* A template made mostly of blanks ("{from} to {to}") would claim any sentence with a "to" in it. It has to carry enough wording of
       its own to be about something specific. */
    if (key.replace(/\{\w+\}/g, "").trim().length < 12) continue;
    const names: string[] = [];
    const source = key
      .split(/(\{\w+\})/)
      .map((part) => {
        const m = part.match(/^\{(\w+)\}$/);
        if (!m) return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        names.push(m[1]);
        return "([^\\n]{1,90}?)";
      })
      .join("");
    list.push({ pattern: new RegExp(`^${source}$`), names, target });
  }
  // The more literal text a template holds, the more specific it is — try those first.
  list.sort((a, b) => b.pattern.source.length - a.pattern.source.length);
  TEMPLATES[lang] = list;
  return list;
}

function viaTemplate(lang: LangCode, en: string): string | null {
  if (lang === "en" || en.length < 12) return null;
  const seen: Map<string, Template | null> = (SEEN[lang] ??= new Map());
  let hit: Template | null | undefined = seen.get(en);
  if (hit === undefined) {
    hit = null;
    for (const tpl of templatesFor(lang)) {
      if (tpl.pattern.test(en)) {
        hit = tpl;
        break;
      }
    }
    if (seen.size > 4000) seen.clear();
    seen.set(en, hit);
  }
  if (!hit) return null;
  const found = hit;
  const m = en.match(found.pattern);
  if (!m) return null;
  const vars: Vars = {};
  /* The parts that varied may be words of ours too — a fuel's name inside "{name} (row {i}) has no emission factor" — so each is put through the
     dictionary on its own first. Only an exact entry changes a part: a number, a date, a name somebody typed passes through as it was. */
  found.names.forEach((name, i) => {
    vars[name] = DICTS[lang][m[i + 1]] ?? m[i + 1];
  });
  return interpolate(found.target, vars);
}

/* A message made of several sentences — "{name} has a quantity in {unit} but no net calorific value. An emission factor in tCO₂/GJ cannot be
   applied to a volume…" — reaches here as one string, often built from two or three literals joined with `+`. Rather than ask for every
   combination, it is taken a sentence at a time: each is found exactly or by template, and the translated sentences are put back in the
   order they came. Chinese runs its sentences together; Thai and English separate them with a space. */
const SENTENCE_BREAK = /(?<=[.!?])\s+(?=[A-Z“"‘(0-9{])/;

function viaSentences(lang: LangCode, en: string): string | null {
  const parts = en.split(SENTENCE_BREAK);
  if (parts.length < 2) return null;
  let found = 0;
  const out = parts.map((part) => {
    const hit = DICTS[lang][part] ?? viaTemplate(lang, part);
    if (hit !== undefined && hit !== null) {
      found += 1;
      return hit;
    }
    return part;
  });
  return found === 0 ? null : out.join(lang === "zh" ? "" : " ");
}

/** A name with a word of ours in brackets after it — "CaCO3 (carbonate)", "MgO (oxide, output-based)". The name is a material somebody
    knows by its formula, so it stays; the bracket is wording, and is said in the language when it has an entry of its own. */
function viaTail(lang: LangCode, en: string): string | null {
  const m = en.match(/^(.+?) \(([^()]{3,40})\)$/);
  const tail = m ? DICTS[lang][m[2]] : undefined;
  return m && tail !== undefined ? `${m[1]} (${tail})` : null;
}

/** The values handed to a template, with any that are words of ours said in the language — a product's name, a fuel, a status — and numbers,
    dates and anything somebody typed left alone. Only an exact dictionary entry changes a value. */
function saying(lang: LangCode, vars?: Vars): Vars | undefined {
  if (!vars || lang === "en") return vars;
  let out: Vars | undefined;
  for (const [k, v] of Object.entries(vars)) {
    if (typeof v !== "string" || v.length < 4) continue;
    const said = DICTS[lang][v];
    if (said !== undefined) (out ??= { ...vars })[k] = said;
  }
  return out ?? vars;
}

export function translate(lang: LangCode, en: string, vars?: Vars) {
  const exact = DICTS[lang][en];
  if (exact !== undefined) return interpolate(exact, saying(lang, vars));
  if (lang === "en") return interpolate(en, vars);
  const shaped = !vars
    ? (viaTemplate(lang, en) ?? viaSentences(lang, en) ?? viaTail(lang, en))
    : null;
  return shaped ?? interpolate(en, saying(lang, vars));
}

export type TFunction = (en: string, vars?: Vars) => string;

const LangContext = React.createContext<{
  /** The rendered interface language. */
  lang: LangCode;
  /** The menu entry that is ticked — may be a language still shown in English. */
  choice: MenuCode;
  setLang: (l: MenuCode) => void;
  t: TFunction;
  languages: LanguageInfo[];
  menu: MenuLanguage[];
}>({
  lang: "en",
  choice: "en",
  setLang: () => {},
  t: (en, vars) => interpolate(en, vars),
  languages: LANGUAGES,
  menu: MENU_LANGUAGES,
});

const STORAGE_KEY = "certrace:lang";
/* A supplier's choice on a link is kept apart from the exporter's choice in the portal. Chinese is not a portal language, so a plant that
   picked it on a link must not turn up, next time, on a portal that cannot speak it — nor change the language an exporter testing a link
   in their own browser reads their account in. */
const LINK_STORAGE_KEY = "certrace:link-lang";
/* Chinese chosen while signing up is kept here, apart from the portal's own choice, for the same reason. English and Thai chosen on /onboarding are
   ALSO written to the portal's key — that is how the portal opens in the language the person was just using. */
const ONBOARDING_STORAGE_KEY = "certrace:onboarding-lang";

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
export function preferredLang(
  saved: string | null | undefined,
  tags: readonly (string | undefined)[],
  offered: readonly LangCode[] = LANGUAGES.map((l) => l.code),
): LangCode {
  if (offered.includes(saved as LangCode)) return saved as LangCode;
  for (const tag of tags) {
    const subtag = tag?.toLowerCase().split("-")[0] as LangCode | undefined;
    if (subtag && offered.includes(subtag)) return subtag;
  }
  return "en";
}

/** The browser's own ordered preference list, or nothing to go on off-browser. */
function browserTags(): readonly (string | undefined)[] {
  if (typeof navigator === "undefined") return [];
  return navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const languages = languagesFor(pathname);
  const onLink =
    Boolean(pathname && LINK_ROUTE.test(pathname)) &&
    !onboardingRoute(pathname);
  const onOnboarding = onboardingRoute(pathname);
  const offered = React.useMemo(
    () => languages.map((l) => l.code),
    [languages],
  );
  const [choice, setChoice] = React.useState<MenuCode>("en");
  const lang = uiLang(choice);

  /* Runs after the first paint on purpose: the server has neither the saved
     choice nor the browser's list, so deciding here — and only here — is what
     keeps the first client render identical to the HTML that came down.

     It runs again on the way onto or off a link, because the two kinds of page keep their own answer. On a link: the choice made there,
     else the one made in the portal, else the browser's list — and Chinese is on offer. */
  React.useEffect(() => {
    let saved: string | null = null;
    try {
      saved =
        (onLink
          ? window.localStorage.getItem(LINK_STORAGE_KEY)
          : onOnboarding
            ? window.localStorage.getItem(ONBOARDING_STORAGE_KEY)
            : null) ?? window.localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage blocked — the browser's list decides */
    }
    /* A saved menu choice without a dictionary of its own (Tiếng Việt, 日本語…) is honoured as the tick; it renders in English. */
    setChoice(
      isMenuCode(saved) && !offered.includes(saved as LangCode)
        ? saved
        : preferredLang(saved, browserTags(), offered),
    );
  }, [onLink, onOnboarding, offered]);

  const setLang = React.useCallback(
    (l: MenuCode) => {
      setChoice(l);
      // Guarded like storedLang(): setItem throws in private mode. Swallow so the
      // language still switches in-memory and the <html lang> swap below still runs.
      try {
        if (onOnboarding) {
          window.localStorage.setItem(ONBOARDING_STORAGE_KEY, l);
          window.localStorage.setItem(STORAGE_KEY, l);
        } else
          window.localStorage.setItem(
            onLink ? LINK_STORAGE_KEY : STORAGE_KEY,
            l,
          );
      } catch {
        /* persistence best-effort */
      }
      document.documentElement.lang = htmlLang(uiLang(l));
    },
    [onLink, onOnboarding],
  );

  React.useEffect(() => {
    document.documentElement.lang = htmlLang(lang);
  }, [lang]);

  const t = React.useCallback<TFunction>(
    (en, vars) => translate(lang, en, vars),
    [lang],
  );
  activeLang = lang;

  return React.createElement(
    LangContext.Provider,
    {
      value: { lang, choice, setLang, t, languages, menu: MENU_LANGUAGES },
    },
    children,
  );
}

/** The value of <html lang>. Chinese is written Simplified, so the type rules in globals.css reach it as `zh-CN`. */
const htmlLang = (l: LangCode): string => (l === "zh" ? "zh-CN" : l);

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
      html.lang = htmlLang(langRef.current);
    };
  }, []);

  const value = React.useMemo(
    () => ({
      lang: "en" as LangCode,
      choice: "en" as MenuCode,
      setLang: () => {},
      t: (en: string, vars?: Vars) => interpolate(en, vars),
      languages: LANGUAGES,
      menu: MENU_LANGUAGES,
    }),
    [],
  );
  return React.createElement(LangContext.Provider, { value }, children);
}

/* ── A stretch of the screen in another language than the rest ───
   Cera answers in the language of the question, and the question can be in
   either — typed English on a Thai screen is answered in English, and the cards
   under that answer (the choice, the readings found, the digest) have to be
   drawn in English too, or one message would be half of each. This swaps the
   context for the stretch below it and leaves the switcher alone. */
export function LanguageOverride({
  lang,
  children,
}: {
  lang: LangCode | undefined;
  children: React.ReactNode;
}) {
  const parent = React.useContext(LangContext);
  const value = React.useMemo(
    () =>
      lang && lang !== parent.lang
        ? {
            ...parent,
            lang,
            t: ((en: string, vars?: Vars) =>
              translate(lang, en, vars)) as TFunction,
          }
        : parent,
    [lang, parent],
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
export function storedLang(): "en" | "th" {
  try {
    // Only the portal's own choice, so only a language the portal speaks.
    return preferredLang(
      window.localStorage.getItem(STORAGE_KEY),
      browserTags(),
    ) as "en" | "th";
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
      .map((c) => ({
        value: c.code,
        label: (display?.of(c.code) ?? c.name) || c.name,
        hint: c.code,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, localeFor(lang)));
  }, [countries, lang]);
}

/** One country's display name in the active language. */
export function useCountryName() {
  const { lang } = useLanguage();
  return React.useCallback(
    (code: string, fallback?: string) => {
      try {
        return (
          new Intl.DisplayNames([localeFor(lang)], { type: "region" }).of(
            code,
          ) ??
          fallback ??
          code
        );
      } catch {
        return fallback ?? code;
      }
    },
    [lang],
  );
}

/* Locale-aware helpers, so numbers and dates follow the interface language
   rather than being hardcoded en-GB/en-US at every call site. */
/* The language on screen, readable from code that is not a component — `monthNameLong`, the label helpers in lib/. The provider writes
   it as it renders, before any child reads it, so a helper called during a render always sees the language that render is in. */
let activeLang: LangCode = "en";
export const currentLang = (): LangCode => activeLang;

export const localeFor = (lang: LangCode) =>
  lang === "th"
    ? "th-TH"
    : lang === "zh"
      ? "zh-CN"
      : lang === "hi"
        ? "hi-IN"
        : "en-GB";

/** "2nd" in English; a plain day number in Thai, where "วันที่ 2" needs no suffix. */
export const ordinalDay = (lang: LangCode, n: number): string => {
  if (lang === "th" || lang === "zh" || lang === "hi") return String(n);
  const suffix = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffix[(v - 20) % 10] ?? suffix[v] ?? suffix[0]}`;
};

export function useOrdinal() {
  const { lang } = useLanguage();
  return React.useCallback((n: number) => ordinalDay(lang, n), [lang]);
}

/** Thai month names, but the Gregorian year: a reporting year of 2026 must not turn into 2569 on one screen and stay 2026 on the next. */
export const dateLocaleFor = (lang: LangCode): string =>
  lang === "th" ? "th-TH-u-ca-gregory" : localeFor(lang);

/** The date locale for code that is not a component — English keeps its day-month-year order, every other language follows the screen. */
export const dateLocaleNow = (): string => {
  const lang = currentLang();
  return lang === "en" ? "en-GB" : dateLocaleFor(lang);
};

export function useFormat() {
  const { lang } = useLanguage();
  const locale = localeFor(lang);
  const dateLocale = dateLocaleFor(lang);
  return React.useMemo(
    () => ({
      locale,
      number: (n: number, opts?: Intl.NumberFormatOptions) =>
        n.toLocaleString(locale, opts),
      date: (
        d: Date | string,
        opts: Intl.DateTimeFormatOptions = {
          day: "numeric",
          month: "short",
          year: "numeric",
        },
      ) =>
        (typeof d === "string" ? new Date(d) : d).toLocaleDateString(
          dateLocale,
          opts,
        ),
      /** "2026-03" as the month it names, in the language on screen: March 2026 · มีนาคม 2026 · 2026年3月 */
      month: (ym: string) => {
        const [y, m] = ym.split("-").map(Number);
        return new Date(y, (m || 1) - 1, 1).toLocaleDateString(dateLocale, {
          month: "long",
          year: "numeric",
        });
      },
    }),
    [locale, dateLocale],
  );
}
