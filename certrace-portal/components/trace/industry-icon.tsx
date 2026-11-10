import * as React from "react";
import type { TraceSector } from "@/lib/trace-profile";

/* The six CBAM industry icons, copied from the public site
   (certrace-landing-page-current components/solution-icons.tsx) so the Trace
   input here and the Trace page there draw each industry the same way. 24px
   grid, 1.5 stroke, round caps and joins, no fills, currentColor. */

const PATHS: Record<TraceSector, React.ReactNode> = {
  /* an I-beam */
  "Iron & Steel": <path d="M5 4.5h14v3h-5v9h5v3H5v-3h5v-9H5z" />,
  /* an ingot */
  Aluminium: (
    <>
      <path d="M3 18h18l-2.6-7H5.6z" />
      <path d="M5.6 11 7.4 7h9.2l1.8 4" />
    </>
  ),
  /* a cement bag */
  Cement: (
    <>
      <path d="M6.5 3.5h11L19 8l-1 12.5H6L5 8z" />
      <path d="M5 8h14M9.5 12.5h5" />
    </>
  ),
  /* a sprout */
  Fertilisers: (
    <>
      <path d="M12 21v-9" />
      <path d="M12 12c0-4.2 2.8-6.5 7-6.5 0 4.2-2.8 6.5-7 6.5z" />
      <path d="M12 15c0-3.3-2.2-5.2-5.6-5.2 0 3.3 2.2 5.2 5.6 5.2z" />
    </>
  ),
  /* an H₂ molecule */
  Hydrogen: (
    <>
      <circle cx="6.5" cy="12" r="3.2" />
      <circle cx="17.5" cy="12" r="3.2" />
      <path d="M9.7 12h4.6" />
    </>
  ),
  /* a bolt */
  Electricity: <path d="M13.5 3 5.5 13.5h6L10.5 21l8-10.5h-6z" />,
};

export function IndustryIcon({
  sector,
  className,
}: {
  sector: TraceSector;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className ?? "h-4 w-4"}`}
    >
      {PATHS[sector]}
    </svg>
  );
}
