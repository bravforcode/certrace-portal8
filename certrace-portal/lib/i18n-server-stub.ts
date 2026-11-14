/* Stand-in for the translated dictionaries on the server build only (next.config.ts swaps the `import()`s in lib/i18n.ts for this file).

   The dictionaries load in the browser: `loadLocale` runs from an effect and the provider renders English until it resolves, so the server never reads them. Without this stand-in the edge route bundles inlined all of them (about 3 MB of source per language per function). Empty maps make `translate()` answer English on the server, which is what it already did. */
export const TH_ALL: Record<string, string> = {};
export const ZH: Record<string, string> = {};
export const HI: Record<string, string> = {};
export const VI: Record<string, string> = {};
export const TR: Record<string, string> = {};
export const KO: Record<string, string> = {};
export const ZH_TW: Record<string, string> = {};
export const ID: Record<string, string> = {};
export const JA: Record<string, string> = {};
export const MS: Record<string, string> = {};
export const ZH_EXTRA: Record<string, string> = {};
export const HI_EXTRA: Record<string, string> = {};
