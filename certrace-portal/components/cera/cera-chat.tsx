"use client";

/* ════════════════════════════════════════════════════════════
   THE CHAT ITSELF — what the popup and the full-screen view share

   The panel (cera-panel.tsx) decides where Cera sits and how big it is; this
   file is everything inside the conversation, so the two sizes cannot drift:

     ChatPane      the conversation or the greeting, the typing bar under it, and
                   the place a file can be dropped anywhere on it
     Welcome       before the first message — the greeting, two things Cera does
                   besides answer, and a few questions to start from
     Conversation  Cera's replies in a soft card, the reader's in ink, a card
                   under a reply when there is one, and chips for what to ask next
     Composer      the bar. Not a box with a stroke round it: a raised surface
                   that lifts and takes a soft halo when it is in use

   SMART UPLOAD IS SWITCHED ON, THEN FILLED, THEN SENT. Pressing the button (or
   the tile on the greeting) opens a drop area inside the bar; the file lands in
   it as a chip, the reader may add a line, and nothing is read until they press
   send. A file dropped or pasted anywhere on the chat switches it on by itself —
   Cera only does one thing with a file.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { ArrowUp, Check, Clock, Compass, Copy, FileText, Gauge, Megaphone, MessageSquare, Paperclip, RotateCw, Scale, Sparkles, Trash2, Upload, Users, X } from "lucide-react";
import { cn } from "@/components/ui";
import { CeraMark } from "@/components/cera/cera-mark";
import { CeraCardView } from "@/components/cera/cera-cards";
import { shownTitle } from "@/lib/cera/history";
import { useCera } from "@/components/cera/cera-provider";
import { useProfile, useSessionUser } from "@/lib/profile";
import { CERA_SUGGESTIONS, partOfDay } from "@/lib/cera/chat";
import type { CeraAttachment, CeraMessage } from "@/lib/cera/types";
import { LanguageOverride, dateLocaleNow, useLanguage, useT } from "@/lib/i18n";
import { localQuestion } from "@/lib/cera/knowledge-local";

const GREETING = { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening" } as const;

/** The reader's first name, the same way the account menu resolves it. */
function useFirstName(): string {
  const { profile, stored } = useProfile();
  const session = useSessionUser();
  return (stored ? profile.firstName : session?.firstName || profile.firstName || "").trim();
}

/** Cera's avatar: the mark on a soft tile. */
export function CeraAvatar({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("grid flex-none place-items-center rounded-[10px] border border-black/[0.06] bg-gradient-to-br from-white to-[#f1efe9]", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <CeraMark className="w-auto" style={{ height: Math.round(size * 0.5) }} />
    </span>
  );
}

/* ── Words on a card ────────────────────────────────────────────
   Cera writes plain sentences, paragraphs and "•" or numbered lines. Each
   paragraph is its own block; a run of bullets becomes a list with a hanging
   indent, so a wrapped line sits under its own text instead of under the dot. */
export function Prose({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim().length > 0);
  return (
    <div className="space-y-2.5">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        return (
          <div key={i} className="space-y-1">
            {lines.map((line, j) => {
              const bullet = line.match(/^\s*[•\-–]\s+(.*)$/);
              const numbered = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
              if (bullet)
                return (
                  <p key={j} className="flex gap-2">
                    <span aria-hidden className="mt-[0.62em] h-1 w-1 flex-none rounded-full bg-black/35" />
                    <span className="min-w-0">{bullet[1]}</span>
                  </p>
                );
              if (numbered)
                return (
                  <p key={j} className="flex gap-2">
                    <span aria-hidden className="w-4 flex-none text-right font-mono text-[11.5px] leading-[1.9] text-black/40">
                      {numbered[1]}
                    </span>
                    <span className="min-w-0">{numbered[2]}</span>
                  </p>
                );
              return <p key={j}>{line}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ── Before the first message ─────────────────────────────────
   The greeting the reference dashboards give an assistant: the mark on its own,
   a quiet line with the reader's name, the question in large light type, and the
   things to start from — as cards in full screen, as rounded chips in the popup.
   Drawn in the portal's own look: white surfaces, hairlines, Plex Light. */
const chipIcon = (q: string): React.ReactNode => {
  const l = q.toLowerCase();
  const p = { size: 14, strokeWidth: 1.5 } as const;
  if (/upload/.test(l)) return <Upload {...p} />;
  if (/cbam\?|what is cbam|dates|new in/.test(l)) return <Megaphone {...p} />;
  if (/default|actual|value|free allocation/.test(l)) return <Scale {...p} />;
  if (/supplier|precursor/.test(l)) return <Users {...p} />;
  if (/where do i (start|stand)|how do i/.test(l)) return <Compass {...p} />;
  if (/cost|price|emission|stand/.test(l)) return <Gauge {...p} />;
  return <MessageSquare {...p} />;
};

function Welcome({ large, onUpload, onAsk }: { large?: boolean; onUpload: () => void; onAsk: (q: string) => void }) {
  const t = useT();
  const { lang } = useLanguage();
  const { supplier, precursor } = useCera();
  const accountName = useFirstName();
  // What a chip says is what it sends: in Thai the question goes out in Thai, and so comes back in Thai — and so for Chinese and Hindi.
  const said = (q: string) => localQuestion(lang, q);
  // A plant on its link is not the account holder of the browser it happens to be open in.
  const firstName = supplier ? "" : accountName;
  const greeting = t(GREETING[partOfDay()]);
  const extra = ["Where do I start in Certrace?", "Should I use default or actual values?"];
  // A supplier's link is for one month's documents: no rules, no questions to suggest — just the file.
  const chips = supplier ? [] : [...CERA_SUGGESTIONS.filter((q) => q !== "Smart upload" && q !== "What's new in CBAM?"), ...extra];
  const sub = precursor ? t("I read the documents behind your emissions figure and fill in the form.") : supplier ? t("I read your documents for this month and fill them in.") : t("Pick a prompt below, or just tell me what you need.");
  return (
    <div data-cera-scroll className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain text-center", large ? "px-8 pt-8" : "px-5 pt-6")} style={{ paddingBottom: "calc(var(--composer-h, 96px) + 24px)" }}>
      {/* my-auto, not justify-center: centred while it fits, and scrollable from the top — not clipped above it — when it does not */}
      <div className="my-auto flex flex-col items-center">
        <CeraMark className="w-auto" style={{ height: large ? 52 : 40 }} />
        <p className={cn("text-black/40", large ? "mt-6 text-[16px]" : "mt-5 text-[14px]")}>{firstName ? `${greeting}, ${firstName}` : greeting}</p>
        <h3 className={cn("mt-1.5 font-[family-name:var(--font-plex)] font-light leading-[1.15] tracking-tight text-[#111]", large ? "text-[34px]" : "text-[23px]")}>{t("What can Cera help you with?")}</h3>
        <p className={cn("mt-3 max-w-md text-black/50", large ? "text-[14px] leading-relaxed" : "text-[13px] leading-relaxed")}>{sub}</p>

        {large || supplier ? (
          <div className={cn("mt-7 grid w-full gap-3", supplier ? "max-w-[260px] grid-cols-1" : "max-w-3xl grid-cols-1 sm:grid-cols-3")}>
            <Tile icon={<Upload size={16} strokeWidth={1.5} />} title={t("Smart upload")} body={precursor ? t("Give me a file — I'll fill in the form") : t("Give me a file — I'll fill in the month")} onClick={onUpload} />
            {!supplier && <Tile icon={<Megaphone size={16} strokeWidth={1.5} />} title={t("CBAM updates")} body={t("What's changed, what's coming")} onClick={() => onAsk(said("What's new in CBAM?"))} />}
            {!supplier && <Tile icon={<Gauge size={16} strokeWidth={1.5} />} title={t("Your numbers")} body={t("Where you stand, what is late, what is open")} onClick={() => onAsk(said("Where do I stand?"))} />}
          </div>
        ) : (
          <div className="mt-7 flex max-w-[22rem] flex-wrap justify-center gap-2">
            <Chip icon={<Upload size={14} strokeWidth={1.5} />} label={t("Smart upload")} onClick={onUpload} />
            <Chip icon={<Megaphone size={14} strokeWidth={1.5} />} label={t("CBAM updates")} onClick={() => onAsk(said("What's new in CBAM?"))} />
            <Chip icon={<Gauge size={14} strokeWidth={1.5} />} label={t("Your numbers")} onClick={() => onAsk(said("Where do I stand?"))} />
          </div>
        )}

        {chips.length > 0 && (
          <div className={cn("flex flex-wrap justify-center gap-2", large ? "mt-5 max-w-3xl" : "mt-2.5 max-w-[22rem]")}>
            {chips.map((q) => (
              <Chip key={q} icon={chipIcon(q)} label={said(q)} onClick={() => onAsk(said(q))} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** A prompt as a rounded chip with its small line icon — the reference's "Create image · Analyze data · Make a plan". */
function Chip({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-xl border border-black/[0.09] bg-white px-3.5 py-2 text-left text-[12.5px] leading-snug text-black/70 shadow-[0_1px_1px_rgba(0,0,0,0.03)] transition-all hover:-translate-y-px hover:border-black/25 hover:text-black">
      <span className="flex-none text-black/45">{icon}</span>
      {label}
    </button>
  );
}

function Tile({ icon, title, body, onClick }: { icon: React.ReactNode; title: string; body: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-1 rounded-2xl border border-black/[0.08] bg-white px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:-translate-y-px hover:border-black/25 hover:shadow-[0_10px_24px_-16px_rgba(0,0,0,0.3)]"
    >
      <span className="mb-3 grid h-9 w-9 place-items-center rounded-full border border-black/[0.07] bg-[#f6f5f1] text-black/55">{icon}</span>
      <span className="text-[14px] text-black/85">{title}</span>
      <span className="text-[12.5px] leading-snug text-black/45">{body}</span>
    </button>
  );
}

/* ── The conversation ─────────────────────────────────────────── */
function Conversation({ messages, thinking, thinkingLabel, answering, onPick, large }: { messages: CeraMessage[]; thinking: boolean; thinkingLabel: string; answering: boolean; onPick: (q: string) => void; large?: boolean }) {
  const t = useT();
  const end = React.useRef<HTMLDivElement | null>(null);
  const last = messages[messages.length - 1];

  const scroller = React.useRef<HTMLDivElement | null>(null);
  // Follow a new message or the thinking dots — and ONLY those. A change inside a card (a figure the reader is
  // correcting) is not a new word, and must never pull them away from the field they are typing in. Scrolled to the very
  // bottom of the scroller, padding included, so the newest line clears the bar that lies over the foot of it.
  const newest = `${messages.length}:${last?.id ?? ""}`;
  React.useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [newest, thinking]);

  /* A SHADOW ON THE EDGE THAT HAS MORE BEHIND IT. At the top, when there is something above. At the foot the bar fades into the
     conversation, which is what says there is more. */
  const [edges, setEdges] = React.useState({ top: false, bottom: false });
  const measure = React.useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdges({ top: el.scrollTop > 2, bottom: el.scrollHeight - el.clientHeight - el.scrollTop > 2 });
  }, []);
  React.useEffect(() => {
    measure();
    const el = scroller.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [measure, messages.length, thinking]);

  /* The question a reply answered, so "Ask again" can put it to Cera once more. */
  const questionBefore = (i: number): string | null => {
    for (let k = i - 1; k >= 0; k -= 1) if (messages[k].role === "user" && messages[k].text) return messages[k].text;
    return null;
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-gradient-to-b from-black/[0.07] to-transparent transition-opacity duration-200", edges.top ? "opacity-100" : "opacity-0")} aria-hidden />
      <div
        ref={scroller}
        data-cera-scroll
        onScroll={measure}
        className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", large ? "px-8 pt-6" : "px-4 pt-3")}
        style={{ paddingBottom: "calc(var(--composer-h, 96px) + 20px)" }}
        aria-live="polite"
        aria-busy={thinking || answering}
      >
        <div className={cn("space-y-4", large && "mx-auto max-w-3xl")}>
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={m.id} className="flex flex-col items-end gap-1.5">
                {m.attachments && m.attachments.length > 0 && (
                  <div className="flex max-w-[85%] flex-wrap justify-end gap-1.5">
                    {m.attachments.map((a, k) => (
                      <AttachmentChip key={`${a.name}-${k}`} a={a} />
                    ))}
                  </div>
                )}
                {m.text && <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md border border-black/[0.06] bg-[#f3f1ec] px-4 py-3 text-[13.5px] leading-relaxed text-black/85">{m.text}</p>}
              </div>
            ) : (
              <LanguageOverride key={m.id} lang={m.lang}>
                <div className="group min-w-0">
                  {m.text && (
                    <div className="relative max-w-[96%]">
                      <div className="rounded-2xl rounded-tl-md border border-black/[0.08] bg-white px-4 py-3.5 text-[13.5px] leading-relaxed text-black/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                        <Prose text={m.text} />
                      </div>
                      {!(answering && m.id === last?.id) && <MessageTools text={m.text} again={questionBefore(i)} onAgain={onPick} />}
                    </div>
                  )}
                  {m.cards?.map((c, k) => (
                    <CeraCardView key={`${m.id}-${k}`} messageId={m.id} card={c} />
                  ))}
                  {m.id === last?.id && !answering && !thinking && m.suggestions && m.suggestions.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {m.suggestions.map((q) => (
                          <Suggestion key={q} q={q} onPick={onPick} />
                        ))}
                      </div>
                      <p className="mt-3 text-[12px] text-black/40">{t("Need more options? Let me know.")}</p>
                    </div>
                  )}
                </div>
              </LanguageOverride>
            ),
          )}

          {thinking && (
            <div role="status">
              <span className="inline-flex items-center gap-2.5 rounded-2xl rounded-tl-md border border-black/[0.08] bg-white px-4 py-3">
                <span className="flex items-center gap-1" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-black/35" style={{ animationDelay: `${i * 160}ms` }} />
                  ))}
                </span>
                <span className="font-pixel text-[10px] uppercase tracking-[0.14em] text-black/40">{thinkingLabel || t("Thinking…")}</span>
              </span>
            </div>
          )}
          <div ref={end} />
        </div>
      </div>
    </div>
  );
}

/** A follow-up under a reply. It is drawn in the reply's language and sends exactly what it shows, so the answer comes back in the same one. */
function Suggestion({ q, onPick }: { q: string; onPick: (q: string) => void }) {
  const t = useT();
  const said = t(q);
  return (
    <button
      type="button"
      onClick={() => onPick(said)}
      className="inline-flex items-center gap-2 rounded-xl border border-black/[0.09] bg-white px-3.5 py-2 text-left text-[12.5px] leading-snug text-black/65 shadow-[0_1px_1px_rgba(0,0,0,0.03)] transition-colors hover:border-black/30 hover:text-black"
    >
      <span className="flex-none text-black/40">{chipIcon(said)}</span>
      {said}
    </button>
  );
}

/** The little dark bar under a reply — copy it, or ask it again. Shown on hover, always on a phone where there is no hover. */
function MessageTools({ text, again, onAgain }: { text: string; again: string | null; onAgain: (q: string) => void }) {
  const t = useT();
  const [done, setDone] = React.useState(false);
  const btn = "grid h-7 w-7 place-items-center rounded-md text-white/75 transition-colors hover:bg-white/15 hover:text-white";
  return (
    <div className="absolute -bottom-3.5 right-3 flex items-center gap-0.5 rounded-lg bg-[#111] p-0.5 shadow-[0_8px_18px_-8px_rgba(0,0,0,0.6)] sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
      {again && (
        <button type="button" aria-label={t("Ask again")} title={t("Ask again")} onClick={() => onAgain(again)} className={btn}>
          <RotateCw size={13} strokeWidth={1.6} />
        </button>
      )}
      <button
        type="button"
        aria-label={t("Copy")}
        title={t("Copy")}
        onClick={() => {
          try {
            void navigator.clipboard.writeText(text);
            setDone(true);
            window.setTimeout(() => setDone(false), 1600);
          } catch {
            /* clipboard blocked — nothing to say */
          }
        }}
        className={btn}
      >
        {done ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.6} />}
      </button>
    </div>
  );
}

export function AttachmentChip({ a, onRemove }: { a: CeraAttachment; onRemove?: () => void }) {
  const t = useT();
  return (
    <span className="inline-flex max-w-[240px] items-center gap-1.5 rounded-lg border border-black/10 bg-white py-1 pl-1.5 pr-2 text-[11.5px] text-black/65">
      {a.kind === "image" && a.url ? (
        // eslint-disable-next-line @next/next/no-img-element -- a local blob preview, not a remote asset
        <img src={a.url} alt="" className="h-5 w-5 flex-none rounded object-cover" />
      ) : (
        <FileText size={13} strokeWidth={1.5} className="flex-none text-black/40" />
      )}
      <span className="truncate">{a.name}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`${t("Remove file")} ${a.name}`} className="-mr-0.5 grid h-4 w-4 flex-none place-items-center rounded text-black/35 hover:bg-black/[0.06] hover:text-black">
          <X size={11} strokeWidth={1.75} />
        </button>
      )}
    </span>
  );
}

/* ── The typing bar ─────────────────────────────────────────── */
type Held = { a: CeraAttachment; file: File };

function Composer({
  busy,
  large,
  uploadOn,
  setUploadOn,
  held,
  setHeld,
  onSend,
  inputRef,
  onHeight,
}: {
  busy: boolean;
  large?: boolean;
  uploadOn: boolean;
  setUploadOn: (on: boolean) => void;
  held: Held[];
  setHeld: React.Dispatch<React.SetStateAction<Held[]>>;
  onSend: (text: string, attachments: CeraAttachment[], files: File[]) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  /** the bar's height, so the conversation behind it can leave room at its foot */
  onHeight: (h: number) => void;
}) {
  const t = useT();
  const bar = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const report = () => onHeight(el.offsetHeight);
    report();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onHeight]);
  const [text, setText] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const [over, setOver] = React.useState(false);
  const picker = React.useRef<HTMLInputElement | null>(null);
  const touchY = React.useRef<number | null>(null);

  /* THE BAR LIES OVER THE FOOT OF THE CONVERSATION, so a wheel or a finger that lands on it has to move the conversation — not stop
     at the bar, which is a large part of a phone screen. The text area keeps its own scrolling when it has some. */
  const onOwnText = (target: EventTarget | null) => {
    const ta = (target as HTMLElement | null)?.closest("textarea");
    return Boolean(ta && ta.scrollHeight > ta.clientHeight + 1);
  };
  const moveConversation = (from: HTMLElement, dy: number) => {
    const scroller = from.closest("[data-cera-chat]")?.querySelector<HTMLElement>("[data-cera-scroll]");
    if (scroller) scroller.scrollTop += dy;
  };

  // Grow with the text, up to about six lines, then scroll.
  React.useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 136)}px`;
  }, [text, inputRef]);

  const take = (list: FileList | File[]) => {
    const first = Array.from(list)[0];
    if (!first) return;
    setHeld((prev) => {
      for (const h of prev) if (h.a.url) URL.revokeObjectURL(h.a.url);
      return [{ a: { name: first.name || "Pasted file", kind: "file" }, file: first }];
    });
    setUploadOn(true);
  };

  const removeFile = () => setHeld([]);
  const canSend = !busy && (text.trim().length > 0 || held.length > 0);

  const submit = () => {
    if (!canSend) return;
    onSend(text, held.map((h) => h.a), held.map((h) => h.file));
    setText("");
    setHeld([]);
    setUploadOn(false);
  };

  const raised = focused || uploadOn;

  return (
    /* THE BAR LIES OVER THE FOOT OF THE CONVERSATION and fades into it, so the conversation visibly goes on beneath. Its card is the
       reference's: a typing row with the send button at its end, and under it a quieter strip holding Smart upload, Attach and the
       keys — one surface, two rows. */
    <div
      ref={bar}
      className={cn(
        // pointer-events-none: the fade is only to look at. A wheel or a finger over it scrolls the conversation under it.
        "pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-white from-75% to-transparent",
        large ? "px-8 pb-5 pt-10" : "px-4 pb-3 pt-8",
      )}
    >
      <div className={cn(large && "mx-auto max-w-3xl")}>
        {/* A RAISED SURFACE, NOT A STROKE. In use it lifts and takes a soft halo; the browser's own focus ring is turned
            off on the text area, so there is one change of state on the bar and not two. */}
        <div
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onWheel={(e) => {
            if (!onOwnText(e.target)) moveConversation(e.currentTarget, e.deltaY);
          }}
          onTouchStart={(e) => {
            touchY.current = e.touches[0]?.clientY ?? null;
          }}
          onTouchMove={(e) => {
            const y = e.touches[0]?.clientY;
            if (touchY.current == null || y == null || onOwnText(e.target)) return;
            moveConversation(e.currentTarget, touchY.current - y);
            touchY.current = y;
          }}
          onTouchEnd={() => {
            touchY.current = null;
          }}
          className="pointer-events-auto overflow-hidden rounded-2xl border bg-white transition-[border-color,box-shadow] duration-200"
          style={{
            borderColor: raised ? "rgba(17,17,17,0.24)" : "rgba(17,17,17,0.10)",
            boxShadow: raised ? "0 0 0 4px rgba(17,17,17,0.045), 0 14px 32px -18px rgba(0,0,0,0.35)" : "0 1px 2px rgba(0,0,0,0.04), 0 10px 26px -22px rgba(0,0,0,0.35)",
          }}
        >
          {uploadOn && held.length === 0 && (
            /* THE WHOLE AREA IS THE BUTTON: pressing anywhere in it opens the file picker; dropping on it takes the file. */
            <div
              role="button"
              tabIndex={0}
              aria-label={t("Choose a file")}
              onClick={() => picker.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  picker.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOver(false);
                take(e.dataTransfer.files);
              }}
              className={cn("m-2 mb-0 cursor-pointer rounded-xl border border-dashed px-4 py-5 text-center transition-colors hover:border-black/30 hover:bg-[#f6f5f1]", over ? "border-black/40 bg-[#f6f5f1]" : "border-black/15 bg-[#fcfbf9]")}
            >
              <Upload size={18} strokeWidth={1.5} className="mx-auto text-black/35" />
              <p className="mt-2 text-[13px] text-black/75">{t("Drop one file here")}</p>
              <p className="mt-0.5 text-[11.5px] text-black/45">{t("Text or CSV · one at a time · or press to choose")}</p>
            </div>
          )}

          {held.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
              {held.map((h) => (
                <AttachmentChip key={h.a.name} a={h.a} onRemove={removeFile} />
              ))}
              <span className="text-[11.5px] text-black/40">{t("Press send and I'll read it.")}</span>
            </div>
          )}

          <div className="flex items-end gap-3 px-4 pb-2.5 pt-3">
            <span className="grid h-9 w-[17px] flex-none place-items-center text-black/30" aria-hidden>
              <Sparkles size={17} strokeWidth={1.5} />
            </span>
            <textarea
              ref={inputRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends, Shift+Enter breaks the line; never while an IME is composing.
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                } else if (e.key === "Escape" && uploadOn) {
                  e.stopPropagation();
                  setUploadOn(false);
                }
              }}
              onPaste={(e) => {
                // A pasted file becomes the smart upload; pasted text just goes in the bar.
                if (e.clipboardData.files.length > 0) {
                  e.preventDefault();
                  take(e.clipboardData.files);
                }
              }}
              placeholder={held.length > 0 ? t("Add a note for Cera — or leave it blank") : t("Ask Cera anything…")}
              aria-label={t("Message Cera")}
              /* inline, because the global :focus-visible rule is unlayered CSS and beats utility classes */
              style={{ outline: "none", borderRadius: 0 }}
              className={cn("block max-h-[136px] min-h-9 min-w-0 flex-1 resize-none bg-transparent py-[6px] leading-6 text-black/85 placeholder:text-black/30 focus:outline-none focus-visible:outline-none", large ? "text-[15px]" : "text-[14px]")}
            />
            <button
              type="button"
              onClick={submit}
              disabled={!canSend}
              aria-label={t("Send")}
              className={cn("grid h-9 w-9 flex-none place-items-center rounded-full transition-all", canSend ? "bg-[#111] text-white hover:bg-[#333]" : "bg-black/[0.06] text-black/25")}
            >
              <ArrowUp size={17} strokeWidth={1.75} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-black/[0.06] bg-[#faf9f7] px-3 py-2">
            <div className="flex min-w-0 flex-none items-center gap-1.5">
              <button
                type="button"
                aria-pressed={uploadOn}
                onClick={() => {
                  if (uploadOn) {
                    setUploadOn(false);
                    setHeld([]);
                  } else {
                    setUploadOn(true);
                    inputRef.current?.focus();
                  }
                }}
                title={uploadOn ? t("Smart upload is on — press to turn it off") : t("Give Cera one file and it fills in the month")}
                className={cn(
                  "inline-flex h-8 flex-none items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-[12px] transition-colors",
                  uploadOn ? "border-[#111] bg-[#111] text-white" : "border-black/10 bg-white text-black/60 hover:border-black/25 hover:text-black",
                )}
              >
                {/* The Cera mark, in one light tone: white on the pressed (ink) button, a pale grey on the plain one. */}
                <CeraMark tone="ink" className={cn("h-3.5 w-auto flex-none", uploadOn ? "text-white" : "text-black/35")} />
                {t("Smart upload")}
              </button>
              <button
                type="button"
                onClick={() => picker.current?.click()}
                aria-label={t("Attach a file")}
                title={t("Attach a file — or drop or paste one")}
                className="inline-flex h-8 flex-none items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[12px] text-black/50 transition-colors hover:bg-black/[0.05] hover:text-black"
              >
                <Paperclip size={14} strokeWidth={1.5} />
                <span className="max-sm:hidden">{t("Attach")}</span>
              </button>
            </div>
            <input
              ref={picker}
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) take(e.target.files);
                e.target.value = ""; // so the same file can be picked again
              }}
            />
            {large && <span className="hidden min-w-0 truncate whitespace-nowrap font-mono text-[10px] tracking-[0.04em] text-black/35 sm:block">{t("Enter to send · Shift+Enter for a new line")}</span>}
          </div>
        </div>
        {large && <p className="mt-2.5 text-center text-[11.5px] text-black/35">{t("Cera can make mistakes. Check important information.")}</p>}
      </div>
    </div>
  );
}

/* ── The pane ───────────────────────────────────────────────── */
export function ChatPane({ large }: { large?: boolean }) {
  const t = useT();
  const { messages, thinking, thinkingLabel, answering, send, uploadOn, setUploadOn } = useCera();
  const [held, setHeld] = React.useState<Held[]>([]);
  const [over, setOver] = React.useState(false);
  const input = React.useRef<HTMLTextAreaElement | null>(null);
  const depth = React.useRef(0);
  const [barH, setBarH] = React.useState(96);

  // Ready to type the moment the pane opens.
  React.useEffect(() => {
    input.current?.focus();
  }, []);

  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
  const empty = messages.length === 0 && !thinking;

  return (
    <div
      data-cera-chat
      className="relative flex min-h-0 flex-1 flex-col"
      style={{ "--composer-h": `${barH}px` } as React.CSSProperties}
      onDragEnter={(e) => {
        if (!hasFiles(e)) return;
        depth.current += 1;
        setOver(true);
      }}
      onDragOver={(e) => {
        if (hasFiles(e)) e.preventDefault();
      }}
      onDragLeave={(e) => {
        if (!hasFiles(e)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        const f = e.dataTransfer.files[0];
        if (f) {
          setHeld([{ a: { name: f.name, kind: "file" }, file: f }]);
          setUploadOn(true);
          input.current?.focus();
        }
      }}
    >
      {empty ? (
        <Welcome
          large={large}
          onUpload={() => {
            setUploadOn(true);
            input.current?.focus();
          }}
          onAsk={(q) => send(q)}
        />
      ) : (
        <Conversation messages={messages} thinking={thinking} thinkingLabel={thinkingLabel} answering={answering} onPick={(q) => send(q)} large={large} />
      )}
      <Composer busy={thinking || answering} large={large} uploadOn={uploadOn} setUploadOn={setUploadOn} held={held} setHeld={setHeld} onSend={send} inputRef={input} onHeight={setBarH} />

      {over && (
        <div className="pointer-events-none absolute inset-2 z-10 grid place-items-center rounded-3xl border-2 border-dashed border-black/30 bg-white/85 backdrop-blur-[2px]">
          <div className="text-center">
            <Upload size={22} strokeWidth={1.5} className="mx-auto text-black/50" />
            <p className="mt-2 text-[14px] text-black/75">{t("Drop it to read with Smart upload")}</p>
            <p className="mt-0.5 text-[12px] text-black/45">{t("One file at a time")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Saved conversations ────────────────────────────────────── */
export function when(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString(dateLocaleNow(), { weekday: "long" });
  return d.toLocaleDateString(dateLocaleNow(), { day: "numeric", month: "short", year: "numeric" });
}

/** The popup's History view — the full-screen view keeps its list in a rail beside the chat instead. */
export function HistoryList() {
  const t = useT();
  const { history, openConversation, removeConversation, newChat, setView } = useCera();
  const [armed, setArmed] = React.useState<string | null>(null);

  if (history.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
        <Clock size={22} strokeWidth={1.5} className="text-black/25" />
        <p className="mt-3 text-[14px] text-black/60">{t("No conversations yet")}</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-black/40">{t("Every conversation you have with Cera is kept here, so you can pick it up again.")}</p>
        <button
          type="button"
          onClick={() => {
            newChat();
            setView("chat");
          }}
          className="mt-4 rounded-full border border-black/12 px-3.5 py-1.5 text-[12.5px] text-black/65 hover:border-black/35 hover:text-black"
        >
          {t("Start one")}
        </button>
      </div>
    );
  }

  return (
    <ul className="min-h-0 flex-1 divide-y divide-black/[0.05] overflow-y-auto overscroll-contain px-2 py-2">
      {history.map((c) => (
        <li key={c.id} className="group flex items-center gap-1 rounded-xl px-2 hover:bg-[#faf9f7]">
          <button type="button" onClick={() => openConversation(c.id)} className="min-w-0 flex-1 py-3 text-left">
            <span className="block truncate text-[13.5px] text-black/80">{shownTitle(c.title, t)}</span>
            <span className="mt-0.5 block font-mono text-[10.5px] text-black/35">
              {when(c.updatedAt)} · {c.messages.filter((m) => m.role === "user").length} {c.messages.filter((m) => m.role === "user").length === 1 ? t("message") : t("messages")}
            </span>
          </button>
          <DeleteButton armed={armed === c.id} onArm={() => setArmed(c.id)} onDisarm={() => setArmed((a) => (a === c.id ? null : a))} onConfirm={() => { removeConversation(c.id); setArmed(null); }} title={shownTitle(c.title, t)} />
        </li>
      ))}
    </ul>
  );
}

/** Delete takes two presses — the second confirms. */
export function DeleteButton({ armed, onArm, onDisarm, onConfirm, title }: { armed: boolean; onArm: () => void; onDisarm: () => void; onConfirm: () => void; title: string }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => (armed ? onConfirm() : onArm())}
      onBlur={onDisarm}
      aria-label={`${t("Delete")} ${title}`}
      title={armed ? t("Click again to delete") : t("Delete this conversation")}
      className={cn(
        "grid h-8 flex-none place-items-center rounded-lg transition-colors",
        armed ? "bg-[#fef2f2] px-2 text-[11px] uppercase tracking-[0.08em] text-[#dc2626]" : "w-8 text-black/25 opacity-0 hover:bg-black/[0.05] hover:text-[#dc2626] focus:opacity-100 group-hover:opacity-100",
      )}
    >
      {armed ? t("Confirm") : <Trash2 size={14} strokeWidth={1.5} />}
    </button>
  );
}
