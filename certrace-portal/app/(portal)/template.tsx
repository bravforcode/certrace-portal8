"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

/* A template remounts on every navigation, so each page eases in once.
   No exit animation: App Router does not run exits reliably, and a page that
   waits on one would hold the next page back. The wrapper is a plain block so
   it adds no margin or layout of its own. */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <div>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
