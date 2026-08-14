"use client";

import * as React from "react";

import type { Declaration } from "./data";
import { loadLiabilityView, type LiabilityView } from "./financial-liability";

/**
 * The cost outcome for a declaration, or null until it resolves.
 *
 * The exporter state behind it is localStorage-backed, so the view can only be
 * built after mount — every consumer would otherwise reimplement the same
 * mounted-guard effect and drift on the details.
 */
export function useLiabilityView(declaration: Declaration): LiabilityView | null {
  const [view, setView] = React.useState<LiabilityView | null>(null);

  React.useEffect(() => {
    let mounted = true;
    loadLiabilityView(declaration).then((next) => {
      if (mounted) setView(next);
    });
    return () => {
      mounted = false;
    };
  }, [declaration]);

  return view;
}
