/* The Thai side of one thing Cera knows: its title, the phrases a person types in Thai, and the answer. The id is the English
   entry's id (lib/cera/knowledge-types.ts), so an entry has one meaning and two languages. */
export type ThEntry = { title: string; keys: string[]; answer: string };
