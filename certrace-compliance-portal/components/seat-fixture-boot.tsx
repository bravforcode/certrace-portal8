"use client";

/* Runs lib/seat-fixture.ts once, as early in the portal as anything renders.

   THE SEED IS IN A LAZY useState INITIALISER, NOT AN EFFECT, and that is the
   whole reason this is a component rather than two lines in the layout. A
   parent's effects run AFTER its children's, so an effect here would fire
   only once every page below had already mounted, read an empty store and
   rendered "no workspaces yet". The initialiser runs during this component's
   own render — before any sibling below it renders at all.

   It returns nothing and re-renders nothing. The store is read at render time
   by each page from localStorage, so writing it before they read it is the
   entire job. */

import * as React from "react";
import { ensureSeatFixture } from "@/lib/seat-fixture";

export function SeatFixtureBoot() {
  React.useState(() => ensureSeatFixture());
  return null;
}
