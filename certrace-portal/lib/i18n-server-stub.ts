/* Stand-in for the Thai, Chinese and Hindi dictionaries on the server build only (next.config.ts swaps the three `import()`s in lib/i18n.ts for this file).

   The dictionaries load in the browser: `loadLocale` runs from an effect and the provider renders English until it resolves, so the server never reads them. Without this stand-in the edge route bundles inlined all three (about 3 MB of source per function). Empty maps make `translate()` answer English on the server, which is what it already did. */
export const TH_ALL: Record<string, string> = {};
export const ZH: Record<string, string> = {};
export const HI: Record<string, string> = {};
