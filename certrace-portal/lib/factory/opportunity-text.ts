import type { TFunction } from "@/lib/i18n";
import type { Opportunity } from "./opportunities";

/** The card's sentence in the reader's language. Cards carry a translatable template; older English titles fall back to themselves. */
export function cardText(t: TFunction, o: Pick<Opportunity, "title" | "text">): string {
  return o.text ? t(o.text.key, o.text.params) : t(o.title);
}
