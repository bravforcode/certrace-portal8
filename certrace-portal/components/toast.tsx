"use client";

import * as React from "react";
import { StatusDot } from "./ui";
import { useT } from "@/lib/i18n";

/* Lightweight, dependency-free toast.
   `toast(msg)` dispatches a window event; <Toaster/> (mounted once in the shell)
   renders the queue. Works from server-rendered pages because the trigger is a
   plain function call inside client handlers. */

type ToastTone = "ok" | "info" | "warn" | "err";
export type ToastInput = { message: string; tone?: ToastTone; detail?: string };

const EVENT = "ct-toast";

export function toast(input: string | ToastInput) {
  if (typeof window === "undefined") return;
  const payload: ToastInput =
    typeof input === "string" ? { message: input } : input;
  window.dispatchEvent(new CustomEvent<ToastInput>(EVENT, { detail: payload }));
}

type Item = ToastInput & { id: number };

export function Toaster() {
  // Said in the language on screen WHEN SHOWN, not when raised: callers hand over English (a toast is fired from lib code and event
  // handlers that have no `t`), and a reader who switches language with one open sees it switch with the page.
  const tr = useT();
  const [items, setItems] = React.useState<Item[]>([]);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ToastInput>).detail;
      const id = Date.now() + Math.random();
      setItems((list) => [...list, { ...detail, id }]);
      window.setTimeout(
        () => setItems((list) => list.filter((t) => t.id !== id)),
        4200,
      );
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-6 sm:translate-x-0">
      {items.map((t) => (
        <div
          key={t.id}
          className="ct-enter pointer-events-auto flex items-start gap-3 rounded-2xl border border-black/[0.08] bg-white px-4 py-3"
          style={{
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <span className="mt-[3px]">
            <StatusDot tone={t.tone ?? "ok"} glow pulse={t.tone === "info"} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] leading-snug text-[#111]">
              {tr(t.message)}
            </p>
            {t.detail && (
              <p className="mt-0.5 text-[12px] leading-snug text-black/40">
                {tr(t.detail)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
