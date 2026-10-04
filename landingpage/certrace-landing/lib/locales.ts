/* ════════════════════════════════════════════════════════════
   LANGUAGE IN THE ADDRESS — which pages have one URL per language

   The site's copy follows a language the reader picks, and for most pages that
   is all it needs. The CBAM guides and the updates are different: they exist
   to be found, and a search engine indexes a URL, not a preference. While a
   Thai guide lived only behind a client-side switch on the English address, a
   crawler — which has no stored preference — only ever read the English pass,
   and a search in Thai could not land on the Thai text at all.

   So those two sections are published once per language: English at the
   address it always had, every other language under a prefix
   (`/th/about-cbam/what-is-cbam`). On those routes the URL decides the
   language, on the server, and every version names the others with hreflang.

   Server-safe on purpose — no "use client" — because the metadata, the
   sitemap and the route params all read it as well as the language provider.
   ════════════════════════════════════════════════════════════ */

export type Lang = "en" | "th" | "vi" | "tr" | "hi";

export const LANGS: Lang[] = ["en", "th", "vi", "tr", "hi"];

/** English is served unprefixed; these four carry their code in the path. */
export const PREFIXED_LANGS = LANGS.filter((l) => l !== "en");

/** The sections published once per language. Everything else is one URL. */
const LOCALIZED_SECTIONS = ["/about-cbam", "/updates"];

/** Open Graph wants a territory as well as a language. */
export const OG_LOCALE: Record<Lang, string> = {
  en: "en_US",
  th: "th_TH",
  vi: "vi_VN",
  tr: "tr_TR",
  hi: "hi_IN",
};

export function isLang(value: string | null | undefined): value is Lang {
  return !!value && (LANGS as string[]).includes(value);
}

/** True for a path in one of the per-language sections. Query and hash are
    ignored, so a link can be passed in as written. */
export function isLocalizedPath(path: string): boolean {
  const bare = path.split(/[?#]/)[0];
  return LOCALIZED_SECTIONS.some((s) => bare === s || bare.startsWith(`${s}/`));
}

/** The address of `path` in `lang`. Paths outside the per-language sections
    come back unchanged — there is no `/th/pricing` to send anyone to. */
export function localePath(lang: Lang, path: string): string {
  if (lang === "en" || !isLocalizedPath(path)) return path;
  return `/${lang}${path}`;
}

/** Splits a language prefix off a pathname: `/th/updates/x` → th, `/updates/x`. */
export function splitLocale(pathname: string): { lang: Lang | null; path: string } {
  const [, first, ...rest] = pathname.split("/");
  if (isLang(first) && first !== "en") {
    return { lang: first, path: `/${rest.join("/")}` };
  }
  return { lang: null, path: pathname };
}

/** The language a URL fixes, or null for a page whose language is the reader's
    choice. An unprefixed address in a per-language section is the English one. */
export function routeLang(pathname: string): Lang | null {
  const { lang, path } = splitLocale(pathname);
  if (lang) return lang;
  return isLocalizedPath(path) ? "en" : null;
}

/** `alternates.languages` for Next metadata and the sitemap: every version of
    `path`, plus English as the default for a searcher in any other language. */
export function languageAlternates(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of LANGS) out[l] = localePath(l, path);
  out["x-default"] = path;
  return out;
}
