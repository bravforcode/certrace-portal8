"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { StepScreen } from "./portal-screens";

/* ════════════════════════════════════════════════════════════
   FOUR SIMPLE STEPS — now showing the four screens themselves

   WHAT CHANGED. The right-hand pane used to be a console log: coloured lines
   of pseudo-output stored as strings in lib/content.ts. It read as a terminal,
   which is not what this product is — nobody using Certrace ever sees a
   console, and a section titled "no learning curve" showing log output was
   arguing against itself.

   It now shows the actual screen for each step, drawn from the portal's own
   tokens and strings (components/portal-screens.tsx):

     1 Create        the new-workspace wizard, step 1 of 4
     2 Collect       the supplier's month form, on their own link
     3 Review        Carbon & Cost, with the figure against the EU default
     4 Always ready  the finished, signed report package

   `step.view` is still read from the dictionary and still labels the pane, so
   the step names and captions remain translated. `step.lines` is no longer
   read here; it stays in the dictionary rather than being deleted, because
   removing a key from five languages for a layout change is a bigger edit than
   leaving one unused, and the type is shared.
   ════════════════════════════════════════════════════════════ */

export function HowItWorksPanel() {
  const { c } = useLang();
  const steps = c.howItWorks.steps;

  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setActive((i) => (i + 1) % steps.length);
        setVisible(true);
      }, 180);
    }, 5200);
    return () => clearInterval(interval);
  }, [steps.length]);

  const step = steps[active];

  const selectStep = (index: number) => {
    if (index === active) return;
    setVisible(false);
    setTimeout(() => {
      setActive(index);
      setVisible(true);
    }, 180);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch">
      <div className="flex flex-col gap-3">
        {steps.map((item, index) => (
          <button
            key={item.title}
            onClick={() => selectStep(index)}
            className="flex-1 text-left rounded-2xl border transition-all duration-200 p-6 group"
            style={{
              background:
                active === index ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.7)",
              borderColor:
                active === index ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.06)",
              boxShadow:
                active === index
                  ? "0 1px 3px rgba(0,0,0,0.06)"
                  : "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <div className="flex gap-4 items-start">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-light shrink-0 transition-colors duration-200"
                style={{
                  background:
                    active === index ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.04)",
                  color:
                    active === index ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.35)",
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="min-w-0">
                <p
                  className="text-sm font-light transition-colors duration-200"
                  style={{
                    color:
                      active === index ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.5)",
                  }}
                >
                  {item.title}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "rgba(0,0,0,0.28)" }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div
        className="lg:col-span-2 rounded-2xl border border-black/[0.06] p-6 sm:p-8 flex flex-col"
        style={{
          background: "rgba(255,255,255,0.7)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          minHeight: "360px",
        }}
      >
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div
            className="text-[10px] tracking-widest uppercase"
            style={{
              opacity: visible ? 1 : 0,
              filter: visible ? "blur(0px)" : "blur(4px)",
              transition: "opacity 200ms ease, filter 200ms ease",
              color: "rgba(0,0,0,0.3)",
            }}
          >
            {step.view}
          </div>
          <div className="flex gap-1.5">
            {steps.map((_, dot) => (
              <div
                key={dot}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  background:
                    dot === active ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.08)",
                }}
              />
            ))}
          </div>
        </div>

        {/* The window is centred and capped rather than stretched: at
            lg:col-span-2 this pane is ~560px, and a browser frame that wide
            with 7px type inside reads as a diagram of a screen rather than a
            screen. `flex-1` keeps the pane height stable as the four screens
            swap, so the section does not jump between steps. */}
        <div className="flex-1 flex items-center justify-center">
          <div
            className="w-full max-w-[440px]"
            style={{
              opacity: visible ? 1 : 0,
              filter: visible ? "blur(0px)" : "blur(6px)",
              transform: visible ? "translateY(0)" : "translateY(6px)",
              transition:
                "opacity 260ms cubic-bezier(0.16,1,0.3,1), filter 260ms cubic-bezier(0.16,1,0.3,1), transform 260ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <StepScreen index={active} />
          </div>
        </div>
      </div>
    </div>
  );
}
