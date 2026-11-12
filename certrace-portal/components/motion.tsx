"use client";

/* ════════════════════════════════════════════════════════════
   MOTION PRIMITIVES — small, quiet, and off under reduced motion

   Every primitive reads useReducedMotion() and renders a plain element when
   the OS asks for less motion, so the portal never animates for a reader who
   has turned it off. Durations are short on purpose: these are confirmations
   that something arrived, not showpieces.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

const EASE_OUT = "easeOut" as const;

/** Fades and lifts its children into place once, on mount. */
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Parent for StaggerItem children: they enter one after another. */
export function Stagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
    >
      {children}
    </motion.div>
  );
}

/** A child of Stagger. Outside a Stagger it simply fades in on its own. */
export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 6 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.2, ease: EASE_OUT },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Presses down slightly on tap and lifts a pixel on hover. */
export function PressScale({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
