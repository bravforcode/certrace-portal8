/* ════════════════════════════════════════════════════════════
   WHAT CERA KNOWS, IN THE READER'S LANGUAGE

   lib/cera/knowledge.ts is the English side; this is the other three. Thai (lib/cera/knowledge-th.ts), Chinese (knowledge-zh.ts)
   and Hindi (knowledge-hi.ts) each hold the same entries under the same ids, so there is one meaning and four ways of saying it.

   A question that is one of Cera's own suggestions — a button under a reply, a chip on the welcome screen — is recognised exactly
   and answered from the entry it stands for. Anything typed is matched on the phrases written for that language: Thai and
   Chinese are written without spaces, so matching is on letters (spaces and punctuation stripped), and a phrase counts when the
   question contains it; the longer the phrase that fits, the more it is worth. Hindi is written with spaces but is matched the
   same way, which also forgives the order of its words.

   A language that has no entry for an id gives no answer rather than a half-translated one: the engine then says so.
   ════════════════════════════════════════════════════════════ */

import { squash, type CeraLang, type LocalLang } from "./lang";
import { entryById } from "./knowledge";
import type { ThEntry } from "./knowledge-th-types";
import { Q_TH, TH_KNOWLEDGE, thaiQuestion } from "./knowledge-th";
import { HI_KNOWLEDGE, Q_HI } from "./knowledge-hi";
import { Q_ZH, ZH_KNOWLEDGE } from "./knowledge-zh";

const KNOW: Record<LocalLang, Record<string, ThEntry>> = { th: TH_KNOWLEDGE, zh: ZH_KNOWLEDGE, hi: HI_KNOWLEDGE };
const QUESTIONS: Record<LocalLang, Record<string, string>> = { th: Q_TH, zh: Q_ZH, hi: Q_HI };

/** The shortest phrase worth matching and the lowest score that counts as a match. A Chinese character carries about what a Thai
    syllable does and a Hindi word is longer than either, so the three are not held to the same length. */
const MIN_PHRASE: Record<LocalLang, number> = { th: 4, zh: 3, hi: 6 };
const MIN_SCORE: Record<LocalLang, number> = { th: 5, zh: 3, hi: 6 };

const INVERSE: Record<LocalLang, Map<string, string>> = {
  th: new Map(Object.entries(Q_TH).map(([en, local]) => [squash(local), en])),
  zh: new Map(Object.entries(Q_ZH).map(([en, local]) => [squash(local), en])),
  hi: new Map(Object.entries(Q_HI).map(([en, local]) => [squash(local), en])),
};

/** A suggestion in the language of the reply. A question with nothing written for it stays English rather than being guessed. */
export const localQuestion = (lang: CeraLang, en: string): string => (lang === "en" ? en : lang === "th" ? thaiQuestion(en) : (QUESTIONS[lang][en] ?? en));

/** The English question a suggestion stands for, if what was sent is exactly one of them. */
export const englishQuestionFor = (lang: CeraLang, text: string): string | undefined => (lang === "en" ? undefined : INVERSE[lang].get(squash(text)));

/** The entry a question is about: the one with the longest of its phrases found in the question. */
export function bestLocal(lang: LocalLang, query: string): string | null {
  const q = squash(query);
  if (q.length < MIN_PHRASE[lang] - 1) return null;
  let top: { id: string; score: number } | null = null;
  for (const [id, e] of Object.entries(KNOW[lang])) {
    let score = 0;
    for (const key of [...e.keys, e.title]) {
      const k = squash(key);
      if (k.length < MIN_PHRASE[lang] || !q.includes(k)) continue;
      // The whole question is the phrase: nothing else to weigh.
      score = Math.max(score, k === q ? k.length + 20 : k.length);
    }
    if (score > 0 && (!top || score > top.score)) top = { id, score };
  }
  return top && top.score >= MIN_SCORE[lang] ? top.id : null;
}

/** The answer for an entry id in the reader's language, and the follow-up questions in it. */
export function localAnswer(lang: LocalLang, id: string): { text: string; related: string[] } | null {
  const local = KNOW[lang][id];
  const en = entryById(id);
  if (!local || !en) return null;
  return { text: local.answer.trim(), related: (en.related ?? []).map((q) => localQuestion(lang, q)).slice(0, 3) };
}

export const localEntries = (lang: LocalLang): Record<string, ThEntry> => KNOW[lang];
