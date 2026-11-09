/* A rules-digest entry in the language on screen — the same ids, dates and figures, said in Thai, Chinese or Hindi.
   The bell opens these as messages, so it needs them outside the chat that first drew them. */

import type { UpdateItem } from "./types";
import { UPDATES_HI } from "./updates-hi";
import { UPDATES_TH } from "./updates-th";
import { UPDATES_ZH } from "./updates-zh";

const TEXT = { th: UPDATES_TH, zh: UPDATES_ZH, hi: UPDATES_HI } as const;

export function localisedUpdate<T extends Pick<UpdateItem, "id" | "title" | "body"> & { source?: string }>(u: T, lang: string): T {
  if (lang !== "th" && lang !== "zh" && lang !== "hi") return u;
  return { ...u, ...(TEXT[lang][u.id] ?? {}) };
}
