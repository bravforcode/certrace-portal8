"use client";

/* ════════════════════════════════════════════════════════════
   SUPPLY CHAIN — one product's chain, and the first page its card opens

   A PRODUCT AND ITS SUPPLY CHAIN ARE THE SAME LEVEL. This is the chain OF
   the product named in the bar above, not a place that happens to contain
   products: there is one good here, made at one installation, with every
   tier of precursor beneath it. The chain used to be rooted at the
   installation and list every good made there, which answered a question
   about the estate while the reader was asking about the one product they
   had just clicked.

   THIS PAGE SHOWS MANY OBJECTS, SO IT CARRIES NO OBJECT'S TABS.

   Overview / Monthly data / Readiness / Settings describe ONE entity. Above
   a page listing an installation and every tier of precursor beneath it,
   those four words had no owner: whichever node the reader was looking at,
   the tabs acted on a different one. They live on each entity's own page
   instead — for the root installation that is the workspace itself, with the
   real four tabs (lib/tree-entity.ts); for a precursor with no workspace yet
   it is app/(portal)/workspaces/[id]/tree/[nodeId]/page.tsx. The workspace
   shell knows not to draw them here (see the layout's `mode`).

   What replaces them is the product's own identity bar, with how far the
   chain reaches and how much of it is blocked.

   WHAT THE PAGE IS FOR, in one sentence, because it decides the layout:
   most people opening a chain have no figures for anybody yet. The end of
   the journey is Enter verified data and a row reading "Updated with buyer";
   the START of it, for nearly every row on nearly every visit, is Track
   report. So the row's primary button is Track report, the four-step meter
   beside it says how far that row has got, and the two of them read as one
   sentence: here is where you are, here is the next click.

   The editing itself — Track report, Enter verified data, Send, Add
   precursor and their modals — is ChainEditor
   (components/workspace/chain-editor.tsx), shared verbatim with each entity
   page so the same row behaves the same way from either side. This page owns
   only the tree/table switch, because that is a property of the PAGE rather
   than of any row on it.

   ADDING A PRECURSOR IS NOT A BUTTON ON THIS PAGE ANY MORE. Every row used to
   end with one, and it was the only control in the strip that made a NEW row
   rather than reading the one it sat on. It moved to the sidebar, where the
   chain is already drawn as a tree: a `+` on every supplier and every
   precursor, and the tier it creates is the one you can see it appearing
   under. The dialog, the parent and the cycle check are unchanged — the
   sidebar puts `?add=<nodeId>` on this address and ChainEditor opens exactly
   the dialog its own buttons used to.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { ChainEditor } from "@/components/workspace/chain-editor";
import { ChainViewToggle, useChainView } from "@/components/chain-view-toggle";
import { useT } from "@/lib/i18n";

/* useSearchParams (inside ChainEditor) suspends on the first client render,
   so the page's default export is the boundary — without it this route would
   have to opt out of prerendering entirely. */
export default function SupplyChainPage() {
  const t = useT();
  const [view, setView] = useChainView();

  return (
    <div className="space-y-4">
      {/* The explanation and the switch on one line, with the switch on the
          right: it acts on everything below it, so it belongs at the top of
          what it changes rather than buried under the first row. */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-[13px] leading-relaxed text-black/45">
          {t(
            "Everything behind this product, tier by tier — starting with the installation it is made at. Every row offers the same two things: Track report to get a report moving, and Enter verified data to record one that has arrived. To go a tier deeper, press the + beside that row in the sidebar.",
          )}
        </p>
        <ChainViewToggle view={view} onChange={setView} />
      </div>
      <React.Suspense fallback={null}>
        <ChainEditor view={view} />
      </React.Suspense>
    </div>
  );
}
