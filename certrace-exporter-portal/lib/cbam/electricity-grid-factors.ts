/* ════════════════════════════════════════════════════════════
   ELECTRICITY GRID FACTORS — country defaults, versioned by year

   NOT A POINT G VALUE. The fuel table (fuel-defaults.ts) changes only when
   the Commission amends Annex II; this table changes every year BY DESIGN —
   it is a five-year moving average of the country's own yearly grid
   emission factors, published under Annex II Point D.2.3, Equation 37.
   Treating the two tables the same way — seed once, lock forever — would be
   wrong for this one specifically.

   THE FIGURE THIS REPLACES WAS WRONG, NOT JUST STALE. The portal used to
   show Thailand's EGAT/TGO domestic grid emission factor (0.4999 tCO₂/MWh,
   2023) as if it were the CBAM country default. It is not: EGAT/TGO publish
   a Thai regulatory figure for Thai purposes, and CBAM's Annex II D.2.3
   average is a different, Commission-computed number under a different
   methodology. A verifier checking the citation against the actual
   Commission publication would find it does not match — an attribution
   error, not a rounding difference.

   THE HONEST ANSWER TO "WE DON'T HAVE IT YET" IS A BLANK, NOT A SUBSTITUTE.
   Where the Commission-published figure for a country is not yet seeded
   here, `value` is null and the citation says so. A screen reading this
   table must render that as "awaiting the published default", locked and
   empty — never fall back to displaying some other number under this
   table's citation. */

export type GridFactorRow = {
  /** ISO 3166-1 alpha-2 */
  country: string;
  /** tCO₂ per MWh. null = not yet seeded — see the file header. */
  value: number | null;
  effectiveFrom: string;
  citation: string;
};

const AWAITING = (country: string) =>
  `Awaiting the published EU default for ${country} — Commission country default, five-year moving average of yearly grid emission factors, IR (EU) 2025/2547 Annex II Point D.2.3, Equation 37.`;

export const ELECTRICITY_GRID_FACTORS: GridFactorRow[] = [
  /* THAILAND — 0.47 tCO₂/MWh, set by the operator of this portal.
     The citation deliberately does NOT claim this is the Commission's Annex II
     D.2.3 five-year average: that figure is not published yet, and attributing
     an unpublished value to it is the exact attribution error this file's
     header was written about. It is recorded here as what it is — the Thailand
     default this deployment mandates — so a verifier reading the citation is
     told where the number really came from and can challenge it on its own
     terms. Replace both value and citation the day the Commission publishes.

     Locked wherever it is shown: `isGridFactorLocked` in lib/monthly-data.ts
     already locks every grid_default row, so a grid supply in Thailand takes
     this figure and cannot be typed over. */
  { country: "TH", value: 0.47, effectiveFrom: "2026-01-01", citation: "Thailand grid emission factor, 0.47 tCO2/MWh — default set by this deployment, not a Commission-published Annex II Point D.2.3 figure." },
];

export function gridFactorFor(country: string): GridFactorRow | undefined {
  return ELECTRICITY_GRID_FACTORS.find((r) => r.country === country.trim().toUpperCase());
}

/** For a country this table has never even seen — same honesty, framed for
    "we have nothing on file" rather than "we have it but it isn't published
    yet", so the two situations don't read as the same sentence. */
export function gridFactorRowOrPlaceholder(country: string): GridFactorRow {
  return (
    gridFactorFor(country) ?? {
      country: country.trim().toUpperCase(),
      value: null,
      effectiveFrom: "",
      citation: `No grid factor is on file for ${country} yet — Commission country default, IR (EU) 2025/2547 Annex II Point D.2.3.`,
    }
  );
}
