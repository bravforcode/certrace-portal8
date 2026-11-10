/* Finding what Cera knows about a question.

   A plain keyword match, on purpose: every entry lists the phrases a person would
   say, a question matches an entry when it contains all the words of one of
   those phrases, and the entry with the most to show for it wins. It is fast, it
   gives the same answer twice, and when it finds nothing it says so — which is
   better than an answer that sounds right and is not. */

import { CBAM_KNOWLEDGE } from "./knowledge-cbam";
import { PLATFORM_KNOWLEDGE } from "./knowledge-platform";
import { ALIASES } from "./knowledge-aliases";
import type { Entry } from "./knowledge-types";

export const KNOWLEDGE: Entry[] = [
  ...CBAM_KNOWLEDGE,
  ...PLATFORM_KNOWLEDGE,
].map((e) =>
  ALIASES[e.id] ? { ...e, keys: [...e.keys, ...ALIASES[e.id]] } : e,
);

const STOP = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "do",
  "does",
  "did",
  "i",
  "my",
  "me",
  "we",
  "our",
  "you",
  "your",
  "to",
  "of",
  "in",
  "for",
  "on",
  "at",
  "and",
  "or",
  "what",
  "how",
  "can",
  "could",
  "should",
  "would",
  "it",
  "its",
  "this",
  "that",
  "with",
  "from",
  "about",
  "tell",
  "please",
  "there",
  "be",
  "if",
  "any",
  "get",
  "need",
  "want",
  "who",
  "when",
  "where",
  "which",
  "why",
  "will",
  "has",
  "have",
  "so",
  "than",
  "then",
  "as",
  "by",
  "not",
  "no",
  "yes",
]);

/** Lower-case words, a trailing plural dropped so "emissions" meets "emission". */
export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9₂.]+/g, " ")
    .split(" ")
    .map((w) => w.replace(/\.+$/, ""))
    .filter((w) => w.length > 0 && !STOP.has(w))
    .map((w) =>
      w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w,
    );
}

const phrase = (text: string) => tokens(text).join(" ");

/* ── How much a word is worth ───────────────────────────────────
   "cbam" is in half the entries and says almost nothing; "precursor" is in a
   handful and says a lot. A word's weight is how rare it is across what Cera
   knows, so a question is matched on what is distinctive in it. */
const DF = new Map<string, number>();
for (const e of KNOWLEDGE) {
  const seen = new Set<string>();
  for (const k of e.keys) for (const t of tokens(k)) seen.add(t);
  for (const t of tokens(e.title)) seen.add(t);
  for (const t of seen) DF.set(t, (DF.get(t) ?? 0) + 1);
}
const idf = (t: string): number =>
  Math.log(1 + KNOWLEDGE.length / (DF.get(t) ?? 1));

export type Hit = { entry: Entry; score: number };

export function search(query: string): Hit[] {
  const q = [...new Set(tokens(query))];
  if (q.length === 0) return [];
  const qSet = new Set(q);
  const qText = ` ${tokens(query).join(" ")} `;

  const hits: Hit[] = [];
  for (const entry of KNOWLEDGE) {
    const scores: number[] = [];
    for (const key of entry.keys) {
      const kt = [...new Set(tokens(key))];
      if (kt.length === 0) continue;
      const matched = kt.filter((t) => qSet.has(t));
      const weight = (ts: string[]) => ts.reduce((a, t) => a + idf(t), 0);
      if (matched.length === kt.length) {
        let sc = weight(kt);
        if (kt.length > 1 && qText.includes(` ${tokens(key).join(" ")} `))
          sc *= 1.4; // the words together, in order
        scores.push(sc);
      } else if (kt.length >= 3 && matched.length / kt.length >= 0.67) {
        scores.push(weight(matched) * 0.6);
      }
    }
    if (scores.length === 0) continue;
    scores.sort((a, b) => b - a);
    // The best phrase carries it; each further phrase that also fits adds a little.
    let score =
      scores[0] + scores.slice(1, 4).reduce((a, x) => a + x * 0.15, 0);
    score += tokens(entry.title)
      .filter((t) => qSet.has(t))
      .reduce((a, t) => a + idf(t) * 0.25, 0);
    hits.push({ entry, score });
  }
  return hits.sort((a, b) => b.score - a.score);
}

/** The best answer, if there is a convincing one. */
export function best(query: string): Hit | null {
  const [top] = search(query);
  return top && top.score >= 1.6 ? top : null;
}

export const entryById = (id: string): Entry | undefined =>
  KNOWLEDGE.find((e) => e.id === id);

export { phrase };
