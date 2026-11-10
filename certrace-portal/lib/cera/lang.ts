/* ════════════════════════════════════════════════════════════
   WHICH LANGUAGE CERA ANSWERS IN

   One rule, and it is the reader's, not the screen's: Cera answers in the language of what it was
   sent. A question typed in Thai is answered in Thai, in Chinese in Chinese, in Hindi in Hindi, one typed in
   English in English — whatever the interface is set to. The buttons Cera offers (the suggestions, "CBAM updates", "Smart upload") send
   their text in the interface language, so choosing Thai and pressing one of them is a question in
   Thai, and the answer is Thai too. Nothing here keeps state: the language is read off the message.

   A file sent with no words has nothing to read a language from, so it falls back to the language of
   the conversation so far, and failing that the interface.
   ════════════════════════════════════════════════════════════ */

import { translate } from "../i18n";

export type CeraLang = "th" | "en" | "zh" | "hi";

/** The three languages Cera has written knowledge for besides English. */
export type LocalLang = Exclude<CeraLang, "en">;

export const hasThai = (s: string): boolean => /[฀-๿]/.test(s);
export const hasChinese = (s: string): boolean => /[\u4e00-\u9fff]/.test(s);
export const hasHindi = (s: string): boolean => /[\u0900-\u097f]/.test(s);

/** The language a message is written in; `fallback` when it has no letters to go by ("7318 12 90"). */
export function langOf(text: string, fallback: CeraLang = "en"): CeraLang {
  if (hasThai(text)) return "th";
  if (hasChinese(text)) return "zh";
  if (hasHindi(text)) return "hi";
  if (/[A-Za-z]{2}/.test(text)) return "en";
  return fallback;
}

/** The one thing every multilingual line needs: this in English, that in Thai — and in Chinese and Hindi (the dictionary's words for the
    English line when they are not given). */
export const pick = <T>(lang: CeraLang, en: T, th: T, zh?: T, hi?: T): T => {
  if (lang === "th") return th;
  if (lang === "zh")
    return zh !== undefined
      ? zh
      : typeof en === "string"
        ? (translate("zh", en) as unknown as T)
        : en;
  if (lang === "hi")
    return hi !== undefined
      ? hi
      : typeof en === "string"
        ? (translate("hi", en) as unknown as T)
        : en;
  return en;
};

/** For matching: lower-case, no spaces, no punctuation — Thai is written without spaces, so a phrase is found by its letters. */
export const squash = (s: string): string =>
  s
    .toLowerCase()
    .replace(
      /[\s.,;:!?'"’“”()\[\]{}\-–—/\\|…。，、？！；：（）【】《》「」『』·।॥]+/g,
      "",
    );

/** A reply cut into the pieces it is revealed in, and how many to show per tick. Thai has no spaces between words, so it is cut where the
    platform's own word breaker says — the same breaks a Thai reader would stop at; Chinese is cut the same way. */
export function chunks(
  text: string,
  lang: CeraLang,
): { parts: string[]; step: number } {
  if (
    (lang === "th" || lang === "zh") &&
    typeof Intl !== "undefined" &&
    "Segmenter" in Intl
  ) {
    const seg = new Intl.Segmenter(lang, { granularity: "word" });
    return { parts: Array.from(seg.segment(text), (s) => s.segment), step: 2 };
  }
  return { parts: text.split(/(\s+)/), step: 3 }; // keep the whitespace so line breaks survive
}
