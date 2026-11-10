"use client";

/* ════════════════════════════════════════════════════════════
   THE CERA PANEL — "Cera (Cera Intelligence)", in two sizes

   POPUP      floats bottom-right, 400 px wide, and is dragged by its header to
              wherever it is not in the way — it keeps that place, even through
              Hide, and across visits. The header: the avatar, the name — Cera,
              with Cera Intelligence under it as a mono label — and the controls:
              NEW CHAT, HISTORY, full screen, HIDE (fold to a pill, keep the
              conversation) and CLOSE (end it; it stays in History).

   FULL SCREEN  is not the popup made big. It is a workspace of its own: a rail
              on the left with New chat, the two things Cera does besides answer,
              and every earlier conversation; the chat on the right, held to a
              readable column. Esc, or the button in the header, brings it back
              to the popup. On a phone the rail is a drawer.

   Both sizes render the same ChatPane (cera-chat.tsx), so what the reader can
   do in one they can do in the other.

   It is ink on bone like the rest of the portal: a white surface on the canvas,
   hairline borders, IBM Plex for the voice and mono capitals for the labels —
   and no green anywhere except the mark itself, which is the one place the
   brand colour belongs.

   data-lock="chrome": a frozen account can still ask Cera a question, the same
   as it can still switch language or read its notifications.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import {
  ArrowLeft,
  ChevronDown,
  Maximize2,
  Menu,
  Minimize2,
  Minus,
  Plus,
  SquarePen,
  X,
} from "lucide-react";
import { cn } from "@/components/ui";
import { CeraMark } from "@/components/cera/cera-mark";
import {
  ChatPane,
  DeleteButton,
  HistoryList,
  when,
} from "@/components/cera/cera-chat";
import { shownTitle } from "@/lib/cera/history";
import { useCera } from "@/components/cera/cera-provider";
import { useT } from "@/lib/i18n";

const EDGE = 8; // never let the popup sit closer than this to the screen edge
const POPUP_W = 400;
/** The name, in Inter at regular weight, sentence case — plain and modern, nothing shouting. */
const CERA_NAME =
  "truncate whitespace-nowrap font-[family-name:var(--font-inter)] text-[13px] font-normal leading-[1.4] tracking-[-0.01em] text-[#111]";

export function CeraPanel() {
  const t = useT();
  const {
    open,
    minimized,
    fullscreen,
    compact,
    pos,
    setPos,
    view,
    setView,
    history,
    conversationId,
    newChat,
    show,
    hide,
    close,
    setFullscreen,
  } = useCera();
  // On a phone there is only the full screen: the popup is for a window with room beside it.
  const full = fullscreen || compact;
  const box = React.useRef<HTMLElement | null>(null);
  const drag = React.useRef<{ dx: number; dy: number } | null>(null);
  const [dragging, setDragging] = React.useState(false);

  // Esc leaves full screen, the way every full-screen view does.
  React.useEffect(() => {
    if (!open || !full || minimized) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && !compact && setFullscreen(false);
    document.addEventListener("keydown", onKey);
    // The page behind must not scroll under a view that covers it.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, full, minimized, compact, setFullscreen]);

  // A saved position from a bigger window must not strand the popup off a smaller one.
  React.useEffect(() => {
    if (!pos) return;
    const clamp = () => {
      const el = box.current;
      const w = el?.offsetWidth ?? POPUP_W;
      const h = el?.offsetHeight ?? 400;
      const x = Math.min(
        Math.max(EDGE, pos.x),
        Math.max(EDGE, window.innerWidth - w - EDGE),
      );
      const y = Math.min(
        Math.max(EDGE, pos.y),
        Math.max(EDGE, window.innerHeight - h - EDGE),
      );
      if (x !== pos.x || y !== pos.y) setPos({ x, y });
    };
    clamp();
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, [pos, setPos, open, minimized, fullscreen]);

  if (!open) return null;

  /* Folded: a pill in the corner. The conversation is untouched behind it. On a phone it
     rides above the sticky action bars (wizard footers, month save bars) instead of on them. */
  if (minimized) {
    return (
      <button
        type="button"
        data-lock="chrome"
        onClick={show}
        aria-label={t("Show Cera")}
        className="ct-enter fixed bottom-24 right-4 z-[200] flex items-center gap-2.5 rounded-full border border-black/[0.09] bg-white py-2 pl-3.5 pr-3 shadow-[0_8px_28px_rgba(0,0,0,0.12)] transition-colors hover:border-black/25 sm:bottom-6 sm:right-6"
      >
        <CeraMark className="h-5 w-auto" />
        <span className="text-[13px] text-black/75">Cera</span>
        <ChevronDown
          size={14}
          strokeWidth={1.5}
          className="rotate-180 text-black/35"
        />
      </button>
    );
  }

  if (full) return <FullScreen />;

  /* ── Dragging the popup by its header ─────────────────────────────
     Pointer events with capture, so the drag keeps going when the pointer leaves
     the header or the window; `touch-action: none` on the header so a finger drag
     moves the popup instead of scrolling the page. Only the popup drags — on a
     phone it is a full-width sheet. */
  const canDrag =
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 640px)").matches;

  const onDown = (e: React.PointerEvent<HTMLElement>) => {
    if (!canDrag || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return; // the header's own buttons stay buttons
    const el = box.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    const el = box.current;
    if (!d || !el) return;
    const x = Math.min(
      Math.max(EDGE, e.clientX - d.dx),
      Math.max(EDGE, window.innerWidth - el.offsetWidth - EDGE),
    );
    const y = Math.min(
      Math.max(EDGE, e.clientY - d.dy),
      Math.max(EDGE, window.innerHeight - el.offsetHeight - EDGE),
    );
    setPos({ x, y });
  };
  const onUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    const el = box.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setPos({ x: r.left, y: r.top }, true); // remembered
    }
  };
  // The same move for a keyboard: arrow keys on the focused header nudge the popup.
  const onKey = (e: React.KeyboardEvent<HTMLElement>) => {
    if (!canDrag || e.target !== e.currentTarget) return;
    const step = e.shiftKey ? 64 : 16;
    const dir = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }[e.key];
    const el = box.current;
    if (!dir || !el) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    const x = Math.min(
      Math.max(EDGE, r.left + dir[0]),
      Math.max(EDGE, window.innerWidth - el.offsetWidth - EDGE),
    );
    const y = Math.min(
      Math.max(EDGE, r.top + dir[1]),
      Math.max(EDGE, window.innerHeight - el.offsetHeight - EDGE),
    );
    setPos({ x, y }, true);
  };

  const placed =
    canDrag && pos
      ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
      : undefined;
  const inHistory = view === "history";

  return (
    <section
      ref={box}
      role="dialog"
      aria-label={t("Cera Intelligence")}
      data-lock="chrome"
      className={cn(
        "ct-enter fixed inset-x-3 bottom-3 z-[200] flex h-[min(640px,calc(100dvh-6rem))] flex-col overflow-hidden rounded-[26px] border border-black/[0.08] bg-white sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[400px]",
        dragging && "select-none",
      )}
      style={{
        boxShadow:
          "0 28px 70px -20px rgba(0,0,0,0.28), 0 4px 14px rgba(0,0,0,0.06)",
        ...placed,
      }}
    >
      {/* ── Header — the handle for moving the popup ─────────────── */}
      {/* A drag handle is a pointer affordance on a heading bar; the keyboard way to move the popup is `onKey` on the same element. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <header
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
        tabIndex={canDrag ? 0 : undefined}
        title={canDrag ? t("Drag to move") : undefined}
        className={cn(
          "flex flex-none items-center gap-3 px-4 pb-1 pt-3.5",
          canDrag && (dragging ? "cursor-grabbing" : "cursor-grab"),
        )}
        style={{ touchAction: canDrag ? "none" : undefined }}
      >
        {inHistory ? (
          <IconButton
            label={t("Back to the chat")}
            onClick={() => setView("chat")}
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
          </IconButton>
        ) : (
          // The mark on its own — no tile behind it.
          <CeraMark className="h-6 w-auto flex-none" />
        )}
        {/* THE MARK AND THE NAME, NOTHING ELSE — one line that fits beside the buttons. */}
        <div className="min-w-0 flex-1">
          <h2 className={CERA_NAME}>
            {inHistory ? t("History") : "Cera Intelligence"}
          </h2>
          {inHistory && (
            <p className="mt-1 truncate text-[11.5px] leading-tight text-black/40">{`${history.length} ${history.length === 1 ? t("conversation") : t("conversations")}`}</p>
          )}
        </div>
        <div className="flex flex-none items-center gap-0.5">
          <IconButton
            label={t("New chat")}
            onClick={() => {
              newChat();
              setView("chat");
            }}
          >
            <SquarePen size={15} strokeWidth={1.5} />
          </IconButton>
          {/* On a phone the popup is already a near-full-width sheet, so there is nothing to expand to. */}
          <IconButton
            label={t("Full screen")}
            onClick={() => setFullscreen(true)}
            className="max-sm:hidden"
          >
            <Maximize2 size={15} strokeWidth={1.5} />
          </IconButton>
          <IconButton label={t("Hide")} onClick={hide}>
            <Minus size={16} strokeWidth={1.5} />
          </IconButton>
          <IconButton label={t("Close")} onClick={close}>
            <X size={16} strokeWidth={1.5} />
          </IconButton>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────── */}
      {inHistory ? <HistoryList /> : <ChatPane key={conversationId} />}
    </section>
  );
}

export function IconButton({
  label,
  onClick,
  children,
  active,
  className,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-black/[0.05] hover:text-black",
        active ? "bg-black/[0.06] text-black" : "text-black/40",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════
   FULL SCREEN
   ════════════════════════════════════════════════════════════ */
function FullScreen() {
  const t = useT();
  const {
    history,
    conversationId,
    messages,
    newChat,
    openConversation,
    removeConversation,
    send,
    close,
    setFullscreen,
    hide,
  } = useCera();
  const [rail, setRail] = React.useState(false); // the drawer, on a phone
  const [armed, setArmed] = React.useState<string | null>(null);
  const saved = history.find((c) => c.id === conversationId)?.title;
  const title = saved
    ? shownTitle(saved, t)
    : (messages.find((m) => m.role === "user")?.text.slice(0, 60) ??
      t("New chat"));

  /* THE RAIL IS A PANEL, NOT A COLUMN. The whole screen is bone; the rail and the chat are two white panels laid on it, each
     with its own hairline and a soft shadow — so there are layers to read, where a flat tinted column beside a white page
     read as nothing. The New chat button is a quiet bone pill, not an ink block. */
  const Rail = (
    <div className="flex h-full w-[272px] flex-col overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_18px_40px_-28px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <CeraMark className="h-6 w-auto flex-none" />
        <p className={cn(CERA_NAME, "min-w-0")}>Cera Intelligence</p>
      </div>

      <div className="space-y-1 px-3 pb-2">
        <button
          type="button"
          onClick={() => {
            newChat();
            setRail(false);
          }}
          className="flex w-full items-center gap-2.5 rounded-xl border border-black/[0.09] bg-white px-3 py-2.5 text-left text-[13px] text-black/80 transition-colors hover:border-black/25 hover:bg-[#fafaf8]"
        >
          <span className="grid h-5 w-5 place-items-center rounded-full bg-[#f3f1ec] text-black/55">
            <Plus size={13} strokeWidth={1.75} />
          </span>
          {t("New chat")}
        </button>
      </div>

      <div className="mx-4 border-t border-black/[0.06]" />
      <p className="mt-3 px-4 font-pixel text-[9.5px] uppercase tracking-[0.16em] text-black/35">
        {t("Chat History")}
      </p>
      <ul className="mt-1.5 min-h-0 flex-1 space-y-px overflow-y-auto px-2.5 pb-3">
        {history.length === 0 && (
          <li className="px-2.5 py-2 text-[12.5px] leading-relaxed text-black/40">
            {t(
              "Every conversation you have with Cera is kept here, so you can pick it up again.",
            )}
          </li>
        )}
        {history.map((c) => (
          <li
            key={c.id}
            className={cn(
              "group flex items-center gap-1 rounded-xl pr-1 transition-colors",
              c.id === conversationId ? "bg-[#f3f1ec]" : "hover:bg-[#f9f8f5]",
            )}
          >
            <button
              type="button"
              onClick={() => {
                openConversation(c.id);
                setRail(false);
              }}
              className="min-w-0 flex-1 px-2.5 py-2 text-left"
            >
              <span
                className={cn(
                  "block truncate text-[13px]",
                  c.id === conversationId ? "text-black/90" : "text-black/65",
                )}
              >
                {shownTitle(c.title, t)}
              </span>
              <span className="block font-mono text-[10.5px] text-black/35">
                {when(c.updatedAt)}
              </span>
            </button>
            <DeleteButton
              armed={armed === c.id}
              onArm={() => setArmed(c.id)}
              onDisarm={() => setArmed((a) => (a === c.id ? null : a))}
              onConfirm={() => {
                removeConversation(c.id);
                setArmed(null);
              }}
              title={shownTitle(c.title, t)}
            />
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section
      role="dialog"
      aria-label="Cera (Cera Intelligence)"
      data-lock="chrome"
      className="ct-enter fixed inset-0 z-[210] flex gap-3 bg-[#f1efea] p-0 md:p-3"
    >
      <div className="hidden md:block">{Rail}</div>
      {rail && (
        <div className="fixed inset-0 z-10 flex bg-black/25 p-3 md:hidden">
          {Rail}
          <button
            type="button"
            aria-label={t("Close")}
            onClick={() => setRail(false)}
            className="flex-1"
          />
        </div>
      )}

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-white md:rounded-[28px] md:border md:border-black/[0.07] md:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_18px_40px_-28px_rgba(0,0,0,0.35)]">
        {/* A soft warm wash in the top corner, the way the reference's chat page has a colour behind its greeting — here in the bone of the portal, never a hue. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 94% 0%, #efece4 0%, rgba(239,236,228,0) 72%)",
          }}
        />
        <header className="relative flex h-14 flex-none items-center gap-2 px-4 md:px-6">
          <IconButton
            label={t("History")}
            onClick={() => setRail(true)}
            className="md:hidden"
          >
            <Menu size={17} strokeWidth={1.5} />
          </IconButton>
          <h2 className="min-w-0 flex-1 truncate text-[14px] text-black/70">
            {title}
          </h2>
          {/* On a phone full screen is the only size, so there is nothing to go back to. */}
          <IconButton
            label={t("Exit full screen")}
            onClick={() => setFullscreen(false)}
            className="max-sm:hidden"
          >
            <Minimize2 size={15} strokeWidth={1.5} />
          </IconButton>
          <IconButton label={t("Hide")} onClick={hide}>
            <Minus size={16} strokeWidth={1.5} />
          </IconButton>
          <IconButton label={t("Close")} onClick={close}>
            <X size={16} strokeWidth={1.5} />
          </IconButton>
        </header>
        <ChatPane key={conversationId} large />
      </div>
    </section>
  );
}

function RailAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] text-black/60 transition-colors hover:bg-[#fafaf8] hover:text-black"
    >
      <span className="text-black/45">{icon}</span> {label}
    </button>
  );
}
