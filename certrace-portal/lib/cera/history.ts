import { accountStorage } from "../account-storage";
/* ════════════════════════════════════════════════════════════
   CERA'S HISTORY — every conversation, kept, and findable again

   A conversation is saved as it goes, once there is something in it from the
   reader, and stays until they delete it. Closing Cera ends the CURRENT
   conversation, it does not delete it. They use the server-backed account
   store, newest first, and are trimmed to the last forty.

   WHAT IS NOT KEPT: pasted images and the files themselves (only their names),
   and the questions Cera asked about a file that is no longer in the browser —
   those show as past when a conversation is reopened.
   ════════════════════════════════════════════════════════════ */

import type { CeraMessage } from "./types";

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: CeraMessage[];
};

const KEY = "certrace:cera-history";
const MAX_CONVERSATIONS = 40;
const MAX_MESSAGES = 120;

function read(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(accountStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(parsed)
      ? (parsed as Conversation[]).filter(
          (c) => c && typeof c.id === "string" && Array.isArray(c.messages),
        )
      : [];
  } catch {
    return [];
  }
}

function write(list: Conversation[]): void {
  try {
    accountStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* Account storage reports failed saves through the shared retry controls. */
  }
}

export const listConversations = (): Conversation[] =>
  read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export const getConversation = (id: string): Conversation | undefined =>
  read().find((c) => c.id === id);

/** What a conversation is called in the list: the first thing the reader asked. */
export function titleFor(messages: CeraMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New chat";
  const text = first.text.trim();
  if (text) return text.length > 64 ? `${text.slice(0, 61)}…` : text;
  const file = first.attachments?.[0]?.name;
  return file ? `Smart upload · ${file}` : "New chat";
}

/** The title as it reads in the language on screen. A title the reader's own words made is theirs and stays as written;
    the two this file made for them — "Smart upload · file" and "New chat" — are said in the screen's language. */
export function shownTitle(
  title: string,
  t: (en: string, vars?: Record<string, string | number>) => string,
): string {
  if (title === "New chat") return t("New chat");
  const m = /^Smart upload · (.+)$/.exec(title);
  return m ? t("Smart upload · {file}", { file: m[1] }) : title;
}

/** Blob URLs die with the page; a stored one would be a broken image. */
const portable = (messages: CeraMessage[]): CeraMessage[] =>
  messages.slice(-MAX_MESSAGES).map((m) => ({
    ...m,
    ...(m.attachments
      ? { attachments: m.attachments.map(({ name, kind }) => ({ name, kind })) }
      : {}),
    ...(m.cards
      ? {
          cards: m.cards.map((c): typeof c =>
            // A persisted conversation cannot prove whether an interrupted save
            // reached the server. Never replay its append operations on reopening.
            c.kind === "extraction" && c.saveState
              ? {
                  ...c,
                  state: "review",
                  saveState: undefined,
                  saveError: undefined,
                }
              : c,
          ),
        }
      : {}),
  }));

export function saveConversation(id: string, messages: CeraMessage[]): void {
  if (typeof window === "undefined" || !messages.some((m) => m.role === "user"))
    return;
  const all = read();
  const now = new Date().toISOString();
  const existing = all.find((c) => c.id === id);
  const next: Conversation = {
    id,
    title: titleFor(messages),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    messages: portable(messages),
  };
  write(
    [next, ...all.filter((c) => c.id !== id)]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, MAX_CONVERSATIONS),
  );
}

export function deleteConversation(id: string): void {
  if (typeof window === "undefined") return;
  write(read().filter((c) => c.id !== id));
}
