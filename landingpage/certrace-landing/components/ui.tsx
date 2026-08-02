"use client";

import { useEffect, useRef, useState } from "react";

/* DS §Eyebrow: pixel face, 11px, .18em tracking, uppercase, 40% ink on a
   4%-black pill. (Was rendering in the sans face at a tighter track.) */
export function TagBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-pixel text-[11px] tracking-[0.18em] uppercase text-black/40 bg-black/[0.04]">
      {children}
    </span>
  );
}

export function BlurHeading({
  children,
  className = "",
  as: Tag = "h2",
  stagger = 80,
  duration = 700,
  delay = 0,
  threshold = 0.2,
}: {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
  stagger?: number;
  duration?: number;
  delay?: number;
  threshold?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const tokens: { word: string; index: number }[] = [];
  let index = 0;

  children.split(/(\n)/g).forEach((part) => {
    if (part === "\n") {
      tokens.push({ word: "\n", index: index++ });
      return;
    }
    part.split(" ").forEach((word, i, arr) => {
      if (!word) return;
      tokens.push({
        word: i < arr.length - 1 ? word + " " : word,
        index: index++,
      });
    });
  });

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{ display: "block", overflow: "hidden" }}
    >
      {tokens.map(({ word, index: i }) => {
        if (word === "\n") return <br key={`br-${i}`} />;
        const wordDelay = delay + i * stagger;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: visible ? 1 : 0,
              filter: visible ? "blur(0px)" : "blur(8px)",
              transform: visible ? "translateY(0)" : "translateY(12px)",
              transition: visible
                ? `opacity ${duration}ms cubic-bezier(0.16,1,0.3,1) ${wordDelay}ms,
                   filter  ${duration}ms cubic-bezier(0.16,1,0.3,1) ${wordDelay}ms,
                   transform ${duration}ms cubic-bezier(0.16,1,0.3,1) ${wordDelay}ms`
                : "none",
            }}
          >
            {word}
          </span>
        );
      })}
    </Tag>
  );
}

export function AnimateCard({
  children,
  className = "",
  delay = 0,
  id,
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
  /* Cards that are read rather than clicked — the backlog's stage cards, for
     instance — opt out: a hover response on something with no action behind it
     reads as an affordance that isn't there. */
  hover?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      id={id}
      className={`group relative rounded-2xl border border-black/[0.07] bg-white overflow-hidden transition-all duration-700 ${
        hover ? "hover:border-black/[0.15] hover:bg-[#fafaf8]" : ""
      } ${className}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms, border-color 0.3s ease, background-color 0.3s ease`,
      }}
    >
      {hover && (
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,0,0,0.03), transparent 60%)",
          }}
        />
      )}
      {children}
    </div>
  );
}

/* Same cursor glow as the home page's card grids, wrapped so a *server*
   component can use it: an event handler can't be passed from a server
   component to the DOM, but this client component can carry its own. */
export function GlowGrid({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className} onMouseMove={handleMouseGlow}>
      {children}
    </div>
  );
}

export function handleMouseGlow(e: React.MouseEvent<HTMLElement>) {
  const target = e.currentTarget;
  const rect = target.getBoundingClientRect();
  target.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
  target.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
}
