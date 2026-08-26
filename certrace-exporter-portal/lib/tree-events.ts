/* ════════════════════════════════════════════════════════════
   TREE CHANGED — one signal, so the sidebar and the page agree

   The supply-chain list in the sidebar (components/workspace/supply-chain-nav.tsx)
   and the Tree page itself read the SAME localStorage-backed chain
   (lib/supplier-tree.ts), but they live on opposite sides of the portal
   layout: adding a precursor on the page re-reads the page's copy and the
   sidebar would keep showing the chain as it was a moment ago.

   No new store and no context spanning the two — the page announces that the
   chain moved, and anything rendering it re-reads. Same shape as the toaster's
   own window-event bus (components/toast.tsx), for the same reason: it is the
   smallest thing that keeps two independent readers of one store honest.
   ════════════════════════════════════════════════════════════ */

export const TREE_CHANGED_EVENT = "certrace:supplier-tree-changed";

export function notifyTreeChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TREE_CHANGED_EVENT));
}
