/* ════════════════════════════════════════════════════════════
   FROM THE CHAT TO THE PLACE THE FIGURES WENT

   After Cera fills a month, "open it" is not enough: a month is a long form, and the reader
   wants to see the readings she just wrote, not the top of the page. So the button leads to the
   part of the form that took most of them — the fuels, if most of the file was fuels — and the
   form scrolls there and lights it for a moment.

   The target travels two ways, because it has two kinds of trip to make: in the link's hash (a
   page that is opened fresh, or shared) and in a small pending note (a page that is already
   open, where a hash change would not tell anyone). The form takes whichever is there.
   ════════════════════════════════════════════════════════════ */

import type { ExtractedReading } from "./types";

type Section = ExtractedReading["section"];

/** The id every field and block of the month's form carries is `qf-` and its name. */
export const ANCHOR_PREFIX = "qf-";

/** Where each kind of reading lives in the month's form — more than one id where a route can put it in either of two blocks. */
const ANCHORS: Record<Section, string[]> = {
  production: ["production"],
  fuel: ["fuels"],
  electricity: ["electricity"],
  process: ["processBasis", "materials"],
  scrap: ["scrap", "materials"], // aluminium has a block of its own; on a steel route scrap is a row of the carbon balance
  pfc: ["pfc"],
  notes: ["notes"],
  // A direct precursor's own form (/p): each group of its fields is a block with this id (components/precursor/annex-fields.tsx).
  p_operator: ["precursor-installation"],
  p_period: ["precursor-period"],
  p_emissions: ["precursor-emissions"],
  p_verifier: ["precursor-verifier"],
};

const ORDER: Section[] = ["production", "fuel", "electricity", "process", "scrap", "pfc", "notes", "p_operator", "p_period", "p_emissions", "p_verifier"];

/** The parts of the form that took something, in the order the form shows them. */
export const inFormOrder = (sections: Iterable<Section>): Section[] => {
  const have = new Set(sections);
  return ORDER.filter((s) => have.has(s));
};

/** The part of the form that took the most of what was written. A tie goes to the part that comes first in the form, and the
    notes only win when nothing else was written — they are a comment on the month, not its figures. */
export function busiestSection(readings: { section: Section; included: boolean }[]): Section {
  const count = new Map<Section, number>();
  for (const r of readings) if (r.included) count.set(r.section, (count.get(r.section) ?? 0) + (r.section === "notes" ? 0.5 : 1));
  let best: Section = "production";
  let top = -1;
  for (const s of ORDER) {
    const n = count.get(s) ?? 0;
    if (n > top) {
      top = n;
      best = s;
    }
  }
  return best;
}

/** `#qf-fuels`, or `#qf-processBasis,qf-materials` where the block depends on the route. */
export const focusHash = (section: Section): string => `#${ANCHORS[section].map((a) => `${ANCHOR_PREFIX}${a}`).join(",")}`;

/* ── The note left for a form that is already open ───────────── */
export const FOCUS_EVENT = "certrace:focus-month";
let pending: string | null = null;

export function requestFocus(hash: string): void {
  pending = hash.replace(/^#/, "");
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") window.dispatchEvent(new Event(FOCUS_EVENT));
}

/** Bring a block into view and light it for a moment — for a page that has no month form to do it (a precursor's own link). `hash` is "#id" or "#a,b" (the first that exists). */
export function focusElement(hash: string): void {
  if (typeof window === "undefined") return;
  const ids = hash.replace(/^#/, "").split(",");
  window.setTimeout(() => {
    const el = ids.map((i) => document.getElementById(i)).find(Boolean);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.remove("ct-focus");
    void el.offsetWidth; // restart the animation if it is asked for twice
    el.classList.add("ct-focus");
    window.setTimeout(() => el.classList.remove("ct-focus"), 2800);
  }, 150);
}

export function takeFocus(): string | null {
  const p = pending;
  pending = null;
  return p;
}
