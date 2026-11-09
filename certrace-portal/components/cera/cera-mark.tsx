import * as React from "react";

/* ════════════════════════════════════════════════════════════
   THE CERA MARK — a graphic, not an image

   Cera Intelligence's mark is two rounded panels, one behind the other, drawn
   here as vector paths. It was traced from the supplied artwork: the straight
   edges are least-squares fits to the sub-pixel edge positions of the original,
   and every corner is a circular arc with the same tangent length the artwork
   uses (50 px on a 2000 px canvas — a larger radius on the obtuse corners, a
   smaller one on the acute ones, which is what makes the corners read as one
   family). The default fills are the three flat colours sampled from the icon.

   BECAUSE IT IS CODE, IT IS THEMEABLE. The fills read three CSS variables
   (--cera-mark-back / -front / -overlap, defined in app/globals.css), so a dark
   theme recolours the mark by redefining the variables, and a caller can recolour
   one instance with `style`. `tone="ink"` is the one-colour version: it follows
   `currentColor` and builds its three tones from opacity, for places that carry
   a single ink (a disabled state, a dark button, a print stylesheet).

   Never replace this with an <img> of the artwork: a raster cannot follow a
   theme, and the soft edges of the original are the reason it was redrawn.

   The overlap is not a third shape the two panels are cut around — it is the
   front panel clipped to the back panel, so the three regions can never drift
   apart when the geometry is tuned.
   ════════════════════════════════════════════════════════════ */

/** the artwork's own proportions: 687.3 × 1121.2 */
export const CERA_MARK_ASPECT = 687.3 / 1121.2;

const BACK =
  "M277.7 229.7L645.6 4.0A27.4 27.4 0 0 1 687.3 27.8L677.7 526.1A90.6 90.6 0 0 1 634.0 601.9L264.7 824.7A27.5 27.5 0 0 1 223.0 800.5L233.9 305.8A91.7 91.7 0 0 1 277.7 229.7Z";
const FRONT =
  "M52.4 277.8L412.0 514.7A90.4 90.4 0 0 1 452.7 592.2L441.6 1094.3A27.5 27.5 0 0 1 398.9 1116.6L40.7 877.8A91.3 91.3 0 0 1 0.0 800.1L9.7 300.3A27.6 27.6 0 0 1 52.4 277.8Z";

export type CeraMarkProps = Omit<React.SVGProps<SVGSVGElement>, "viewBox" | "children"> & {
  /** "brand" — the three theme tokens (default). "ink" — one colour, `currentColor`. */
  tone?: "brand" | "ink";
  /** an accessible name; without one the mark is decorative (aria-hidden) */
  title?: string;
};

export function CeraMark({ tone = "brand", title, className, style, ...rest }: CeraMarkProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const clipId = `cera-clip-${uid}`;

  const fills =
    tone === "ink"
      ? ({
          back: { fill: "currentColor", fillOpacity: 0.42 },
          front: { fill: "currentColor", fillOpacity: 0.68 },
          overlap: { fill: "currentColor", fillOpacity: 1 },
        } as const)
      : ({
          back: { fill: "var(--cera-mark-back, #8CD499)" },
          front: { fill: "var(--cera-mark-front, #67BE8C)" },
          overlap: { fill: "var(--cera-mark-overlap, #43A97F)" },
        } as const);

  return (
    <svg
      viewBox="0 0 687.3 1121.2"
      className={className}
      style={style}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
      {...rest}
    >
      {title && <title>{title}</title>}
      <defs>
        {/* The id is made from useId, which can differ between the server's render and the client's when the shell around it renders a different tree
            on the first pass. The clip and the path that points at it both keep the server's value, so they still agree — React is told not to report it. */}
        <clipPath id={clipId} suppressHydrationWarning>
          <path d={BACK} />
        </clipPath>
      </defs>
      <path d={BACK} style={fills.back} />
      {/* In the one-colour version both panels are translucent, so where they meet
          the two layers would stack into an uncontrolled tone. The overlap path
          below is opaque and sits on top, which makes that region exactly the
          deepest of the three tones, as in the brand version. */}
      <path d={FRONT} style={fills.front} />
      <path d={FRONT} clipPath={`url(#${clipId})`} style={fills.overlap} suppressHydrationWarning />
    </svg>
  );
}
