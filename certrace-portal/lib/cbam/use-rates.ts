"use client";

/* Client hooks over the EU rate data. The certificate price lives in
   localStorage (lib/cbam/cost-exposure.ts), so it is read after mount — a
   render-time read would differ between the server pass and the first client
   pass and trip hydration. */

import * as React from "react";
import {
  getExchangeRate,
  latestCertificatePriceFor,
  type CertificatePriceRow,
} from "./cost-exposure";

/** Kept for the callers written when the tables loaded lazily: every country's
    table is bundled now, so it is always ready. */
export function useDefaultsReady(_country: string): boolean {
  return true;
}

/** The latest published certificate price on or before `year`, or null. */
export function useCertificatePrice(year: number): {
  price: CertificatePriceRow | null;
  eurToThb: number;
} {
  const [state, setState] = React.useState<{
    price: CertificatePriceRow | null;
    eurToThb: number;
  }>({ price: null, eurToThb: 37.771 });
  React.useEffect(() => {
    setState({
      price: latestCertificatePriceFor(year),
      eurToThb: getExchangeRate().eurToThb,
    });
  }, [year]);
  return state;
}
