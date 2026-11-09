/* The small, shared bits of the chat that are not about what Cera says: the
   hour-of-day greeting and the pacing of a reply. What Cera says is in
   lib/cera/engine.ts; what it can be given is in lib/cera/smart-upload.ts. */

export type { CeraAttachment, CeraCard, CeraMessage, CeraReply } from "./types";
export { CERA_SUGGESTIONS, reply } from "./engine";

export type CeraPart = "morning" | "afternoon" | "evening";

export function partOfDay(d: Date = new Date()): CeraPart {
  const h = d.getHours();
  return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
}

/** How long Cera "thinks" before the first word, in ms — long enough to read as thought, short enough not to be a wait. */
export const thinkingMs = (prompt: string): number => 600 + Math.min(800, prompt.length * 10);

/** Cadence of the word-by-word reveal, in ms. */
export const WORD_MS = 22;
