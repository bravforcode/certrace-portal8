"use client";

/* ════════════════════════════════════════════════════════════
   CERA — conversation state, shared by the header button and the floating panel

   The button lives in the top bar and the panel floats over the page, so the two
   cannot own the state between them; this provider does, once, at the shell.

   THREE STATES, AND THE DIFFERENCE BETWEEN THE LAST TWO MATTERS
     closed     nothing on screen
     open       the panel — a popup you can drag, or FULL SCREEN
     minimised  HIDE — the panel folds to a small pill at the corner and the
                conversation is kept, so a half-written question is still there
                when it comes back
   CLOSE is the other exit and it ends the conversation: the next open starts
   from the greeting again. The conversation is not lost — every one is kept in
   History (lib/cera/history.ts) and can be reopened.

   TWO WAYS IN. The button in the top bar opens the popup. The "Cera
   Intelligence" entry in the sidebar opens the same conversation FULL SCREEN,
   from any page; the panel's own expand / collapse button moves between the two.
   It is one conversation either way — only its size changes.

   WHERE THE POPUP SITS is kept here, not in the panel: hiding unmounts the panel,
   and a window that jumped back to the corner every time it was folded would
   undo the one thing dragging it was for. It is remembered across visits too.

   WHAT HAPPENS TO A QUESTION — `send` is the one door. A question goes to the
   engine (lib/cera/engine.ts) and the reply is revealed word by word; a file goes
   to the smart upload (lib/cera/smart-upload.ts), which reads it, asks only what
   it cannot tell, and shows what it found before anything is saved.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { WORD_MS, thinkingMs } from "@/lib/cera/chat";
import { reply } from "@/lib/cera/engine";
import { chunks, pick, type CeraLang } from "@/lib/cera/lang";
import { focusHash, requestFocus } from "@/lib/cera/focus";
import { localQuestion } from "@/lib/cera/knowledge-local";
import { useLanguage } from "@/lib/i18n";
import { deleteConversation, getConversation, listConversations, saveConversation, type Conversation } from "@/lib/cera/history";
import { analyzePrecursorFile, describePrecursor, precursorStep, type PrecursorAnalysis, type PrecursorApplied, type PrecursorStep } from "@/lib/cera/precursor-upload";
import type { PrecursorSupplier } from "@/lib/precursor-suppliers";
import { analyzeFile, applyPlan, describeAnalysis, editReading, monthLabel, nextStep, planProblems, sectionName, type Analysis, type Answers, type Step } from "@/lib/cera/smart-upload";
import { getWorkspace, type VerificationWorkspace } from "@/lib/workspace";
import { UPDATES_EVENT, unseenUpdates } from "@/lib/cera/updates";
import type { CeraAttachment, CeraCard, CeraMessage, ExtractionPlan } from "@/lib/cera/types";

type Ctx = {
  open: boolean;
  minimized: boolean;
  messages: CeraMessage[];
  /** Cera has the question and has not started answering */
  thinking: boolean;
  /** what Cera is doing while it thinks — "Reading report.txt…" */
  thinkingLabel: string;
  /** Cera is revealing an answer */
  answering: boolean;
  /** the panel fills the screen (opened from the sidebar, or expanded) */
  fullscreen: boolean;
  /** where the dragged popup sits, as the top-left corner in px; null = the default corner */
  pos: { x: number; y: number } | null;
  setPos: (p: { x: number; y: number } | null, persist?: boolean) => void;
  /** header button: closed → open, open → hide, hidden → open */
  toggle: () => void;
  show: () => void;
  /** sidebar entry: open the conversation full screen, from wherever you are */
  showFullscreen: () => void;
  setFullscreen: (on: boolean) => void;
  hide: () => void;
  close: () => void;
  /** a question, and any files that came with it (read in the browser — never sent anywhere) */
  send: (text: string, attachments?: CeraAttachment[], files?: File[]) => void;
  /* ── Smart upload ─────────────────────────────────────────── */
  /** a file given to the drop card */
  pickFile: (file: File) => void;
  answerChoice: (messageId: string, cardId: string, optionId: string) => void;
  /** tick or untick one row of readings (a fuel, a source, production…) */
  toggleReadings: (messageId: string, cardId: string, section: string, group: string | undefined) => void;
  /** change one reading before it goes in — a number typed, a choice picked, a unit switched; or put it back to what the file said */
  editReading: (messageId: string, cardId: string, readingId: string, patch: { raw?: string; unitId?: string } | "reset") => void;
  applyExtraction: (messageId: string, cardId: string) => void;
  discardExtraction: (messageId: string, cardId: string) => void;
  /* ── History ──────────────────────────────────────────────── */
  view: "chat" | "history";
  setView: (v: "chat" | "history") => void;
  history: Conversation[];
  newChat: () => void;
  openConversation: (id: string) => void;
  removeConversation: (id: string) => void;
  /** rule changes the reader has not seen yet */
  unseen: number;
  /** the conversation on screen — the sidebar marks it among the saved ones */
  conversationId: string;
  /** Smart upload is switched on in the typing bar: a drop area is showing and the next file sent is read */
  uploadOn: boolean;
  setUploadOn: (on: boolean) => void;
  /** a phone-sized screen: Cera opens full screen, never as a popup */
  compact: boolean;
  /** open Cera with Smart upload already switched on — what a "add documents" button on a page does */
  openWithUpload: () => void;
  /** Cera is on a supplier's link: it knows nothing about the browser's own account, so it greets nobody by name */
  supplier: boolean;
  /** …and specifically on a direct precursor's link, where the documents are about a reporting period's figure, not a month */
  precursor: boolean;
  /** on a supplier's link: take the page to a part of the month's form, without leaving it */
  followFocus: (month: string, focus: string) => void;
};

/** Where Cera is mounted outside the portal shell: the supplier's link. It narrows what Cera reads and writes to the one product
    report and month the link is about, and gives the page a way to follow a fill. */
export type CeraScope =
  | {
      audience: "supplier";
      workspaceId: string;
      month?: string;
      /** a file was filled into a month — the page brings the supplier to where the figures are (`focus`: the part that took most of them) */
      onApplied?: (month: string, focus?: string) => void;
    }
  | {
      /** A direct precursor's own link (/p): one answer for a period, not a month. Cera reads the documents behind that answer and fills the form the page holds. */
      audience: "precursor";
      /** the exporter's product report the precursor belongs to */
      workspaceId: string;
      /** the precursor's row */
      nodeId: string;
      /** the row as it stands on the page now, drafts included */
      row: () => PrecursorSupplier | null;
      /** write what the reader confirmed into the page's draft, and say what took it */
      apply: (plan: ExtractionPlan) => PrecursorApplied;
      /** bring the form to a part of itself (`focus` is a hash like "#qf-precursor-verifier") */
      onApplied?: (nodeId: string, focus?: string) => void;
    };

const CeraContext = React.createContext<Ctx | null>(null);

export function useCera(): Ctx {
  const ctx = React.useContext(CeraContext);
  if (!ctx) throw new Error("useCera must be used inside <CeraProvider>");
  return ctx;
}

const POS_KEY = "certrace:cera-position";

const mid = () => `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** `awaiting`: Cera has asked the reader to say, in their own words, what the file is — their next message is that description, not a question. */
type Session = { analysis: Analysis; answers: Answers; lang: CeraLang; awaiting?: "description" };

/** One of Cera's own questions, in the language it is being asked in. */
const ask = (lang: CeraLang, q: string) => localQuestion(lang, q);

export function CeraProvider({ children, scope }: { children: React.ReactNode; scope?: CeraScope }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = React.useRef(pathname);
  pathnameRef.current = pathname;
  /* The screen's language only decides what a message with no words of its own is answered in (a file dropped, a button with a
     number on it). Anything typed or tapped is answered in the language it was written in. */
  const { lang: screenLang } = useLanguage();
  /* Cera speaks all four languages the portal does. */
  const uiLang: CeraLang = screenLang;
  const uiLangRef = React.useRef<CeraLang>(uiLang);
  uiLangRef.current = uiLang;
  const scopeRef = React.useRef(scope);
  scopeRef.current = scope;
  const hasScope = Boolean(scope);
  const isPrecursor = scope?.audience === "precursor";
  /** The product reports Cera may put readings into: all of them in the portal, the link's own one on a supplier's link. */
  const reach = React.useCallback((): { workspaces?: VerificationWorkspace[]; answers: Answers } => {
    const sc = scopeRef.current;
    if (!sc || sc.audience !== "supplier") return { answers: {} };
    const ws = getWorkspace(sc.workspaceId);
    return { workspaces: ws ? [ws] : [], answers: { workspaceId: sc.workspaceId, fallbackMonth: sc.month, lockedMonth: sc.month } };
  }, []);
  const [open, setOpen] = React.useState(false);
  const [minimized, setMinimized] = React.useState(false);
  const [fullscreen, setFullscreenState] = React.useState(false);
  const [pos, setPosState] = React.useState<{ x: number; y: number } | null>(null);
  const [messages, setMessages] = React.useState<CeraMessage[]>([]);
  const [thinking, setThinking] = React.useState(false);
  const [thinkingLabel, setThinkingLabel] = React.useState("");
  const [answering, setAnswering] = React.useState(false);
  const [view, setView] = React.useState<"chat" | "history">("chat");
  const [history, setHistory] = React.useState<Conversation[]>([]);
  const [conversationId, setConversationId] = React.useState(() => mid());
  const [unseen, setUnseen] = React.useState(0);
  const [uploadOn, setUploadOn] = React.useState(false);
  // A phone gets Cera full screen and nothing else: the popup is for a window with room beside it.
  const [compact, setCompact] = React.useState(false);
  const compactRef = React.useRef(false);
  compactRef.current = compact;
  const fullscreenRef = React.useRef(false);
  fullscreenRef.current = fullscreen;
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setCompact(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const timers = React.useRef<{ think?: number; stream?: number; save?: number }>({});
  const messagesRef = React.useRef<CeraMessage[]>([]);
  messagesRef.current = messages;
  /** The file Cera is working on, and what the reader has said about it so far.
      In memory only: a reload closes the file. */
  const session = React.useRef<Session | null>(null);
  /** The same, on a precursor's link: the file Cera is reading and whether the reader has described it. */
  const precursorSession = React.useRef<{ analysis: PrecursorAnalysis; lang: CeraLang; described: boolean; awaiting?: "description" } | null>(null);

  const clearTimers = React.useCallback(() => {
    if (timers.current.think) window.clearTimeout(timers.current.think);
    if (timers.current.stream) window.clearInterval(timers.current.stream);
    timers.current.think = undefined;
    timers.current.stream = undefined;
  }, []);

  React.useEffect(
    () => () => {
      clearTimers();
      if (timers.current.save) window.clearTimeout(timers.current.save);
    },
    [clearTimers],
  );

  // The remembered position is read after mount, not during render: storage does
  // not exist on the server, and a first client render that differs from it breaks hydration.
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(POS_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as { x?: unknown; y?: unknown };
      if (typeof p.x === "number" && typeof p.y === "number") setPosState({ x: p.x, y: p.y });
    } catch {
      /* storage blocked or corrupt — the default corner is fine */
    }
  }, []);

  // The flag on the button: rule changes not yet opened.
  React.useEffect(() => {
    const refresh = () => setUnseen(unseenUpdates().length);
    refresh();
    window.addEventListener(UPDATES_EVENT, refresh);
    return () => window.removeEventListener(UPDATES_EVENT, refresh);
  }, []);

  const refreshHistory = React.useCallback(() => setHistory(listConversations()), []);
  React.useEffect(refreshHistory, [refreshHistory]);

  // Kept as it goes — once the reader has said something and Cera has finished replying.
  React.useEffect(() => {
    if (thinking || answering || !messages.some((m) => m.role === "user")) return;
    if (timers.current.save) window.clearTimeout(timers.current.save);
    timers.current.save = window.setTimeout(() => {
      saveConversation(conversationId, messages);
      refreshHistory();
    }, 350);
  }, [messages, thinking, answering, conversationId, refreshHistory]);

  const setPos = React.useCallback((p: { x: number; y: number } | null, persist = false) => {
    setPosState(p);
    if (!persist) return;
    try {
      if (p) window.localStorage.setItem(POS_KEY, JSON.stringify(p));
      else window.localStorage.removeItem(POS_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  // On a phone the panel draws itself full screen whatever this says (see `compact` in cera-panel.tsx), so nothing is remembered
  // here: widen the window again and the popup is back.
  const show = React.useCallback(() => {
    setOpen(true);
    setMinimized(false);
  }, []);
  const showFullscreen = React.useCallback(() => {
    setOpen(true);
    setMinimized(false);
    setFullscreenState(true);
  }, []);
  const setFullscreen = React.useCallback((on: boolean) => setFullscreenState(on), []);
  const hide = React.useCallback(() => setMinimized(true), []);

  const releaseUrls = (list: CeraMessage[]) => {
    // Pasted images were held as object URLs; let them go with the conversation.
    for (const m of list) for (const a of m.attachments ?? []) if (a.url) URL.revokeObjectURL(a.url);
  };

  const reset = React.useCallback(() => {
    clearTimers();
    setThinking(false);
    setThinkingLabel("");
    setAnswering(false);
    session.current = null;
    releaseUrls(messagesRef.current);
    setMessages([]);
    setConversationId(mid());
    setView("chat");
    setUploadOn(false);
  }, [clearTimers]);

  const close = React.useCallback(() => {
    reset();
    setOpen(false);
    setMinimized(false);
    setFullscreenState(false);
  }, [reset]);

  const openWithUpload = React.useCallback(() => {
    show();
    setView("chat");
    setUploadOn(true);
  }, [show]);

  const toggle = React.useCallback(() => {
    if (!open) show();
    else if (minimized) setMinimized(false);
    else hide();
  }, [open, minimized, show, hide]);

  /* ── Saying something ─────────────────────────────────────────
     Every reply — an answer, a question about a file, the readings found in one —
     arrives the same way: a moment of thinking, then the words, then whatever
     card goes with them. */
  const say = React.useCallback(
    (r: { text: string; cards?: CeraCard[]; suggestions?: string[]; lang?: CeraLang }, thinkMs: number, label = "") => {
      clearTimers();
      setThinking(true);
      setThinkingLabel(label || pick(r.lang ?? uiLangRef.current, "Thinking…", "กำลังคิด…", "思考中…", "सोच रही हूँ…"));
      setAnswering(false);
      timers.current.think = window.setTimeout(() => {
        const id = mid();
        const { parts: words, step } = chunks(r.text, r.lang ?? uiLangRef.current);
        let i = 0;
        setThinking(false);
        setThinkingLabel("");
        setAnswering(true);
        setMessages((prev) => [...prev, { id, role: "cera", text: "", lang: r.lang ?? uiLangRef.current }]);
        timers.current.stream = window.setInterval(() => {
          i += step; // English: a word, its space, and the next word
          const done = i >= words.length;
          const next = done ? r.text : words.slice(0, i).join("");
          setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text: next, ...(done ? { cards: r.cards, suggestions: r.suggestions } : {}) } : m)));
          if (done) {
            window.clearInterval(timers.current.stream);
            timers.current.stream = undefined;
            setAnswering(false);
          }
        }, WORD_MS);
      }, thinkMs);
    },
    [clearTimers],
  );

  /* ── A file ─────────────────────────────────────────────────── */
  const deliver = React.useCallback(
    (step: Step, a: Analysis, lead = "", lang: CeraLang = "en") => {
      const L = <V,>(en: V, th: V, zh?: V, hi?: V): V => pick(lang, en, th, zh, hi);
      const label = L("Working out where it goes…", "กำลังหาว่าจะวางไว้ที่ไหน…", "正在判断应填入哪里…", "पता लगा रही हूँ कि यह कहाँ जाता है…");
      if (step.kind === "stop") {
        say({ text: step.text, lang, suggestions: [ask(lang, "Smart upload"), ask(lang, "What does the plant fill in each month?")] }, 450, label);
      } else if (step.kind === "describe") {
        if (session.current) session.current.awaiting = "description";
        say({ text: `${lead}${step.text}`, lang }, 450, label);
      } else if (step.kind === "ask") {
        if (session.current) session.current.awaiting = step.describe ? "description" : undefined;
        say({ text: `${lead}${step.text}`, lang, cards: [step.card] }, 450, label);
      } else {
        if (session.current) session.current.awaiting = undefined;
        const p = step.plan;
        say(
          {
            text: `${lead}${L(
              `I read ${a.fileName} — it looks like a ${p.documentKind} for ${p.workspaceLabel}, ${p.monthLabel}. Here is what it says, laid out like the form it goes into. Only what I found is shown; untick anything you don't want, then fill it in.`,
              `ฉันอ่าน ${a.fileName} แล้ว — ดูเหมือน${p.documentKind}ของ ${p.workspaceLabel} ${p.monthLabel} นี่คือสิ่งที่ไฟล์ระบุ เรียงตามแบบฟอร์มที่จะกรอกลงไป แสดงเฉพาะที่ฉันพบ เอาเครื่องหมายออกจากสิ่งที่ไม่ต้องการ แล้วกดกรอกข้อมูล`,
              `我读取了 ${a.fileName} — 它看起来是 ${p.workspaceLabel} ${p.monthLabel} 的${p.documentKind}。以下是文件中的内容，按它将填入的表单排列。只显示我找到的内容；不想要的请取消勾选，然后点击填入。`,
              `मैंने ${a.fileName} पढ़ी — यह ${p.workspaceLabel}, ${p.monthLabel} के लिए ${p.documentKind} जैसी दिखती है। यह रहा इसमें क्या लिखा है, उस फ़ॉर्म की तरह सजाकर जिसमें यह जाएगा। केवल वही दिख रहा है जो मुझे मिला; जो नहीं चाहिए उस पर से निशान हटाएँ, फिर भरें।`,
            )}`,
            lang,
            cards: [{ kind: "extraction", id: mid(), plan: p, state: "open" }],
          },
          500,
          label,
        );
      }
    },
    [say],
  );

  /* A precursor's file: the same three outcomes — say what it is, ask the reader to describe it, or show what was found laid out as the form. */
  const deliverPrecursor = React.useCallback(
    (step: PrecursorStep, lead = "", lang: CeraLang = "en") => {
      const label = pick(lang, "Reading it against the form…", "กำลังอ่านเทียบกับแบบฟอร์ม…", "正在对照表单阅读…", "फ़ॉर्म से मिलाकर पढ़ रही हूँ…");
      const ps = precursorSession.current;
      if (step.kind === "stop") {
        if (ps) ps.awaiting = undefined;
        say({ text: `${lead}${step.text}`, lang, suggestions: [ask(lang, "Smart upload")] }, 450, label);
      } else if (step.kind === "describe") {
        if (ps) ps.awaiting = "description";
        say({ text: `${lead}${step.text}`, lang }, 450, label);
      } else {
        if (ps) ps.awaiting = undefined;
        const p = step.plan;
        say(
          {
            text: `${lead}${pick(
              lang,
              `I read ${p.fileName}. Here is what it says, laid out like the form it goes into — only what I found is shown. Check each one against your document, change anything that is not right, untick anything you don't want, then fill it in.`,
              `ฉันอ่าน ${p.fileName} แล้ว นี่คือสิ่งที่ไฟล์ระบุ เรียงตามแบบฟอร์มที่จะกรอกลงไป แสดงเฉพาะที่ฉันพบ ตรวจแต่ละรายการกับเอกสารของคุณ แก้สิ่งที่ไม่ถูก เอาเครื่องหมายออกจากสิ่งที่ไม่ต้องการ แล้วกดกรอกข้อมูล`,
              `我读取了 ${p.fileName}。以下是文件中的内容，按它将填入的表单排列 — 只显示我找到的内容。请对照您的文件逐项核对，修改有误之处，取消不想要的，然后点击填入。`,
              `मैंने ${p.fileName} पढ़ी। यह रहा इसमें क्या लिखा है, उस फ़ॉर्म की तरह सजाकर जिसमें यह जाएगा — केवल वही दिख रहा है जो मुझे मिला। हर एक को अपने दस्तावेज़ से मिलाएँ, जो सही न हो उसे बदलें, जो नहीं चाहिए उस पर से निशान हटाएँ, फिर भरें।`,
            )}`,
            lang,
            cards: [{ kind: "extraction", id: mid(), plan: p, state: "open" }],
          },
          500,
          label,
        );
      }
    },
    [say],
  );

  const startFile = React.useCallback(
    (file: File, extra = 0, lang: CeraLang = uiLangRef.current) => {
      session.current = null;
      precursorSession.current = null;
      clearTimers();
      setThinking(true);
      setThinkingLabel(pick(lang, `Reading ${file.name}…`, `กำลังอ่าน ${file.name}…`, `正在读取 ${file.name}…`, `${file.name} पढ़ रही हूँ…`));
      setAnswering(false);
      const psc = scopeRef.current?.audience === "precursor" ? scopeRef.current : null;
      if (psc) {
        void analyzePrecursorFile(file, psc.row() ?? ({} as PrecursorSupplier)).then((a) => {
          const row = psc.row();
          precursorSession.current = { analysis: a, lang, described: false };
          const lead = a.readable ? pick(lang, "Thanks — I've read it. ", "ขอบคุณ — ฉันอ่านแล้ว ", "谢谢 — 我已读完。", "धन्यवाद — मैंने इसे पढ़ लिया। ") : "";
          if (!row) return;
          deliverPrecursor(precursorStep(a, row, psc.workspaceId, lang), lead, lang);
        });
        return;
      }
      void analyzeFile(file).then((a) => {
        const { workspaces, answers } = reach();
        session.current = { analysis: a, answers, lang };
        const step = nextStep(a, answers, workspaces, lang);
        const lead = a.readable
          ? extra > 0
            ? pick(lang, `One file at a time, so I took ${file.name} first — send the others after. `, `รับทีละไฟล์ ฉันจึงอ่าน ${file.name} ก่อน — ส่งไฟล์อื่นตามมาได้ `, `一次只能处理一个文件，所以我先读取了 ${file.name} — 其他文件请稍后再发。`, `एक बार में एक फ़ाइल, इसलिए मैंने पहले ${file.name} ली — बाकी बाद में भेजें। `)
            : pick(lang, "Thanks — I've read it. ", "ขอบคุณ — ฉันอ่านแล้ว ", "谢谢 — 我已读完。", "धन्यवाद — मैंने इसे पढ़ लिया। ")
          : "";
        deliver(step, a, lead, lang);
      });
    },
    [clearTimers, deliver, deliverPrecursor, reach],
  );

  const pickFile = React.useCallback(
    (file: File) => {
      setMessages((prev) => [...prev, { id: mid(), role: "user", text: "", attachments: [{ name: file.name, kind: "file" }] }]);
      startFile(file);
    },
    [startFile],
  );

  const send = React.useCallback(
    (text: string, attachments: CeraAttachment[] = [], files: File[] = []) => {
      const prompt = text.trim();
      if (!prompt && attachments.length === 0 && files.length === 0) return;
      setMessages((prev) => [...prev, { id: mid(), role: "user", text: prompt, attachments: attachments.length ? attachments : undefined }]);
      /* A DESCRIPTION IS NOT A QUESTION. When Cera has just asked what a file holds, the next thing typed is the answer: read it together with the
         file and carry on from there. It comes before everything else, including a supplier's link, which otherwise would turn it away. */
      const psess = precursorSession.current;
      const psc = scopeRef.current?.audience === "precursor" ? scopeRef.current : null;
      if (psc && psess?.awaiting === "description" && prompt && files.length === 0) {
        psess.awaiting = undefined;
        psess.described = true;
        const row = psc.row();
        if (row) {
          psess.analysis = describePrecursor(psess.analysis, prompt, row);
          deliverPrecursor(precursorStep(psess.analysis, row, psc.workspaceId, psess.lang, true), "", psess.lang);
          return;
        }
      }
      const sess = session.current;
      if (sess?.awaiting === "description" && prompt && files.length === 0) {
        sess.awaiting = undefined;
        const { analysis, meterKind } = describeAnalysis(sess.analysis, prompt);
        sess.analysis = analysis;
        sess.answers = { ...sess.answers, described: true, ...(meterKind ? { meterKind } : {}) };
        deliver(nextStep(analysis, sess.answers, reach().workspaces, sess.lang), analysis, "", sess.lang);
        return;
      }
      const r = reply(prompt, { supplier: Boolean(scopeRef.current), lang: uiLangRef.current });
      const lang = r.lang ?? uiLangRef.current;
      /* ON A SUPPLIER'S LINK CERA READS DOCUMENTS FOR THIS MONTH, AND NOTHING ELSE. The plant is here to answer one month; a question
         about CBAM, the rules or the exporter's account is not Cera's to answer on their behalf, and it answers it with one line that
         says what it can do instead — and leaves the door to the file open. */
      if (scopeRef.current && files.length === 0 && attachments.length === 0 && !r.startUpload) {
        const m = scopeRef.current.audience === "supplier" ? scopeRef.current.month : undefined;
        const precursorLink = scopeRef.current.audience === "precursor";
        setUploadOn(true);
        say(
          {
            text: precursorLink
              ? pick(
                  lang,
                  "On this link I read the documents behind your emissions figure — a verification statement, your emissions summary, an accreditation certificate — and fill in the form from them; nothing else. Drop one file into the bar below and press send.",
                  "ในลิงก์นี้ ฉันอ่านเอกสารที่รองรับตัวเลขการปล่อยของคุณ — หนังสือรับรองการทวนสอบ สรุปการปล่อย ใบรับรองการรับรอง — แล้วกรอกแบบฟอร์มจากเอกสารเหล่านั้นเท่านั้น วางไฟล์หนึ่งไฟล์ในช่องด้านล่างแล้วกดส่ง",
                  "在此链接中，我只会读取支撑您排放数据的文件 — 核查声明、排放摘要、认可证书 — 并据此填写表单。请把一个文件拖入下方输入栏，然后点击发送。",
                  "इस लिंक पर मैं आपके उत्सर्जन आँकड़े के पीछे के दस्तावेज़ पढ़ती हूँ — सत्यापन वक्तव्य, आपका उत्सर्जन सार, मान्यता प्रमाणपत्र — और उनसे फ़ॉर्म भरती हूँ; और कुछ नहीं। नीचे की पट्टी में एक फ़ाइल डालें और भेजें दबाएँ।",
                )
              : pick(
                  lang,
                  `On this link I read documents for ${m ? monthLabel(m) : "this month"} and fill them in — nothing else. Drop one file into the bar below and press send.`,
                  `ในลิงก์นี้ ฉันอ่านเอกสารของ${m ? monthLabel(m, lang) : "เดือนนี้"}แล้วกรอกให้เท่านั้น วางไฟล์หนึ่งไฟล์ในช่องด้านล่างแล้วกดส่ง`,
                  `在此链接中，我只会读取${m ? monthLabel(m, lang) : "本月"}的文件并帮您填写。请把一个文件拖入下方输入栏，然后点击发送。`,
                  `इस लिंक पर मैं ${m ? monthLabel(m, lang) : "इस महीने"} के दस्तावेज़ पढ़कर उन्हें भरती हूँ — और कुछ नहीं। नीचे की पट्टी में एक फ़ाइल डालें और भेजें दबाएँ।`,
                ),
            lang,
          },
          thinkingMs(prompt),
        );
        return;
      }
      if (files.length > 0) {
        startFile(files[0], files.length - 1, lang);
        return;
      }
      if (attachments.length > 0 && !prompt) {
        say(
          {
            text: pick(
              lang,
              "I can read text and CSV files — attach one with the + button, or say \"smart upload\" and give it to me there. For a PDF or a photo, attach it on the month's Documents step.",
              "ฉันอ่านไฟล์ข้อความและ CSV ได้ — แนบด้วยปุ่ม + หรือพิมพ์ \"สมาร์ทอัพโหลด\" แล้วส่งไฟล์ตรงนั้น สำหรับ PDF หรือรูปถ่าย ให้แนบที่ขั้นเอกสารของเดือน",
              "我能读取文本和 CSV 文件 — 请用 + 按钮添加文件，或输入“智能上传”后在那里发给我。PDF 或照片请在当月“文件”步骤中上传。",
              "मैं टेक्स्ट और CSV फ़ाइलें पढ़ सकती हूँ — + बटन से कोई संलग्न करें, या “स्मार्ट अपलोड” कहें और वहीं मुझे दें। PDF या फ़ोटो के लिए उसे महीने के दस्तावेज़ चरण में संलग्न करें।",
            ),
            lang,
          },
          500,
        );
        return;
      }
      if (r.startUpload) {
        // The drop area lives in the typing bar now, so the reply points at it instead of carrying a card of its own.
        setUploadOn(true);
        say(
          {
            text: pick(
              lang,
              "Smart upload is on. Drop one file into the bar below — or choose one — and press send. I'll work out which product report and month it's for and what readings it holds, and ask only what I can't tell. Nothing is saved until you've checked what I found, changed anything that's wrong, and confirmed.",
              "เปิดสมาร์ทอัพโหลดแล้ว วางไฟล์หนึ่งไฟล์ลงในช่องด้านล่าง หรือเลือกไฟล์ แล้วกดส่ง ฉันจะดูว่าเป็นของรายงานผลิตภัณฑ์และเดือนไหน และมีค่าอะไรบ้าง และถามเฉพาะสิ่งที่ฉันบอกไม่ได้ ไม่มีอะไรถูกบันทึกจนกว่าคุณจะตรวจสิ่งที่ฉันพบ แก้สิ่งที่ผิด และยืนยัน",
              "智能上传已开启。请把一个文件拖入下方输入栏 — 或选择一个文件 — 然后点击发送。我会判断它属于哪份产品报告和哪个月份、包含哪些读数，只询问我无法判断的内容。在您核对我找到的内容、修改有误之处并确认之前，不会保存任何内容。",
              "स्मार्ट अपलोड चालू है। नीचे की पट्टी में एक फ़ाइल डालें — या कोई चुनें — और भेजें दबाएँ। मैं पता लगाऊँगी कि वह किस उत्पाद रिपोर्ट और महीने की है और उसमें कौन-सी रीडिंग हैं, और केवल वही पूछूँगी जो मैं नहीं बता सकती। जब तक आप मेरे पाए को जाँच न लें, जो गलत है उसे बदल न दें और पुष्टि न कर दें, कुछ सहेजा नहीं जाता।",
            ),
            lang,
          },
          thinkingMs(prompt),
        );
        return;
      }
      say(r, thinkingMs(prompt));
    },
    [say, startFile, deliver, deliverPrecursor, reach],
  );

  const patchCard = React.useCallback((messageId: string, cardId: string, fn: (c: CeraCard) => CeraCard) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.cards ? { ...m, cards: m.cards.map((c) => ((c.kind === "choice" || c.kind === "extraction") && c.id === cardId ? fn(c) : c)) } : m,
      ),
    );
  }, []);

  const answerChoice = React.useCallback(
    (messageId: string, cardId: string, optionId: string) => {
      const card = messagesRef.current.find((m) => m.id === messageId)?.cards?.find((c) => c.kind === "choice" && c.id === cardId);
      if (!card || card.kind !== "choice" || card.answer) return;
      const opt = card.options.find((o) => o.id === optionId);
      patchCard(messageId, cardId, (c) => (c.kind === "choice" ? { ...c, answer: optionId } : c));
      setMessages((prev) => [...prev, { id: mid(), role: "user", text: opt ? `${opt.label}${opt.hint ? ` — ${opt.hint}` : ""}` : optionId }]);

      const s = session.current;
      if (!s) {
        const lang = messagesRef.current.find((m) => m.id === messageId)?.lang ?? uiLangRef.current;
        say(
          {
            text: pick(lang, "That file isn't open any more — give it to me again with Smart upload and I'll pick up from there.", "ไฟล์นั้นไม่ได้เปิดอยู่แล้ว — ส่งให้ฉันอีกครั้งด้วยสมาร์ทอัพโหลด แล้วฉันจะทำต่อจากตรงนั้น", "该文件已不再打开 — 请用智能上传重新发给我，我会从那里继续。", "वह फ़ाइल अब खुली नहीं है — उसे स्मार्ट अपलोड से मुझे फिर दें और मैं वहीं से आगे बढ़ूँगा।"),
            lang,
            suggestions: [ask(lang, "Smart upload")],
          },
          400,
        );
        return;
      }
      const key = ({ meter: "meterKind", workspace: "workspaceId", installation: "installationId", year: "year" } as Record<string, keyof Answers>)[cardId] ?? "month";
      s.awaiting = undefined;
      s.answers = { ...s.answers, [key]: optionId };
      deliver(nextStep(s.analysis, s.answers, reach().workspaces, s.lang), s.analysis, "", s.lang);
    },
    [patchCard, say, deliver, reach],
  );

  const toggleReadings = React.useCallback(
    (messageId: string, cardId: string, section: string, group: string | undefined) => {
      patchCard(messageId, cardId, (c) => {
        if (c.kind !== "extraction" || c.state !== "open") return c;
        const rows = c.plan.readings.filter((r) => r.section === section && r.group === group);
        const on = !rows.every((r) => r.included);
        return { ...c, plan: { ...c.plan, readings: c.plan.readings.map((r) => (r.section === section && r.group === group ? { ...r, included: on } : r)) } };
      });
    },
    [patchCard],
  );

  const changeReading = React.useCallback(
    (messageId: string, cardId: string, readingId: string, patch: { raw?: string; unitId?: string } | "reset") => {
      patchCard(messageId, cardId, (c) => {
        if (c.kind !== "extraction" || c.state !== "open") return c;
        const found = c.plan.readings.find((r) => r.id === readingId)?.found;
        if (!found) return c;
        return { ...c, plan: editReading(c.plan, readingId, patch === "reset" ? { raw: found.raw, unitId: found.unitId } : patch) };
      });
    },
    [patchCard],
  );

  const applyExtraction = React.useCallback(
    (messageId: string, cardId: string) => {
      const card = messagesRef.current.find((m) => m.id === messageId)?.cards?.find((c) => c.kind === "extraction" && c.id === cardId);
      if (!card || card.kind !== "extraction" || card.state !== "open") return;
      if (Object.keys(planProblems(card.plan)).length > 0) return; // the card shows what to fix; nothing goes in until it is

      /* A PRECURSOR'S FORM is the page's own draft, so the page writes it — Cera only says what went in and where to look. */
      const psc = scopeRef.current?.audience === "precursor" ? scopeRef.current : null;
      if (card.plan.precursor) {
        const lang = card.plan.lang ?? uiLangRef.current;
        const out = psc ? psc.apply(card.plan) : null;
        patchCard(messageId, cardId, (c) => (c.kind === "extraction" ? { ...c, state: out?.ok ? "applied" : "open", appliedAt: new Date().toISOString() } : c));
        precursorSession.current = null;
        if (!out || !out.ok) {
          say({ text: pick(lang, "Nothing was written — every reading was left out.", "ไม่มีอะไรถูกเขียน — ทุกรายการถูกเอาออก", "没有写入任何内容 — 所有读数都已取消勾选。", "कुछ नहीं लिखा गया — हर रीडिंग छोड़ दी गई।"), lang }, 300);
          return;
        }
        const nodeId = card.plan.precursor.nodeId;
        const links = out.sections.map((s) => ({ label: sectionName(lang, s), href: focusHash(s), focus: focusHash(s), month: nodeId }));
        say(
          {
            text: pick(
              lang,
              `Done — your form is filled from ${card.plan.fileName}. Cera can make mistakes: check each part against the document before you submit.${out.missing.length ? `\n\nStill needed before it can be submitted: ${out.missing.join("; ")}.` : "\n\nNothing else blocks it from being submitted."}`,
              `เรียบร้อย — แบบฟอร์มของคุณถูกกรอกจาก ${card.plan.fileName} Cera อาจผิดพลาดได้ โปรดตรวจแต่ละส่วนกับเอกสารก่อนส่ง${out.missing.length ? `\n\nยังต้องมีอีกก่อนจึงจะส่งได้: ${out.missing.join("; ")}` : "\n\nไม่มีอะไรขวางการส่งแล้ว"}`,
              `完成 — 您的表单已根据 ${card.plan.fileName} 填写。Cera 可能出错：提交前请对照文件逐部分核对。${out.missing.length ? `\n\n提交之前还需要：${out.missing.join("；")}。` : "\n\n没有其他事项阻碍提交。"}`,
              `हो गया — आपका फ़ॉर्म ${card.plan.fileName} से भरा गया। Cera से गलती हो सकती है: जमा करने से पहले हर हिस्से को दस्तावेज़ से मिलाएँ।${out.missing.length ? `\n\nजमा करने से पहले अब भी चाहिए: ${out.missing.join("; ")}।` : "\n\nइसे जमा करने से अब कुछ नहीं रोकता।"}`,
            ),
            lang,
            cards: links.length > 0 ? [{ kind: "links", links }] : undefined,
            suggestions: [ask(lang, "Smart upload")],
          },
          500,
        );
        const first = out.sections[0];
        if (psc?.onApplied && first) psc.onApplied(nodeId, focusHash(first));
        return;
      }

      const done = applyPlan(card.plan);
      patchCard(messageId, cardId, (c) => (c.kind === "extraction" ? { ...c, state: done.ok ? "applied" : "open", appliedAt: new Date().toISOString() } : c));
      session.current = null;
      void queryClient.invalidateQueries();
      const sc = scopeRef.current?.audience === "supplier" ? scopeRef.current : undefined;
      const lang = card.plan.lang ?? uiLangRef.current;
      // Where most of it went: the fuels, if most of the file was fuels. The page itself leads there, not to the top of the month.
      const hash = done.focus ? focusHash(done.focus) : "";
      const { monthLabel, workspaceLabel } = card.plan;
      const monthHref = `/workspaces/${card.plan.workspaceId}/monthly/${card.plan.month}`;
      // One button for every part of the form that took something — so each can be opened and checked. If, oddly, none is named, the one for the busiest part.
      const parts = done.sections.length > 0 ? done.sections : done.focus ? [done.focus] : [];
      const links = parts.map((s) => ({ label: sectionName(lang, s), href: `${monthHref}${focusHash(s)}`, focus: focusHash(s), month: card.plan.month }));
      say(
        {
          text: done.ok
            ? pick(
                lang,
                `Done — ${monthLabel} for ${workspaceLabel} is filled in as a draft. The values I wrote show in green in the form, tagged Cera filled. Open any part below to check it.${
                  done.missing.length ? `\n\nStill needed before it can be submitted: ${done.missing.join("; ")}.` : "\n\nNothing else blocks it from being submitted."
                }`,
                `เรียบร้อย — ${monthLabel} ของ ${workspaceLabel} ถูกกรอกเป็นฉบับร่างแล้ว ค่าที่ฉันเขียนแสดงเป็นสีเขียวในแบบฟอร์ม มีป้าย "Cera กรอกให้" กดส่วนด้านล่างเพื่อไปตรวจสอบ${
                  done.missing.length ? `\n\nยังต้องมีอีกก่อนจึงจะส่งได้: ${done.missing.join("; ")}` : "\n\nไม่มีอะไรขวางการส่งแล้ว"
                }`,
                `完成 — ${workspaceLabel}的${monthLabel}已填为草稿。我写入的数值在表单中以绿色显示，并带有“Cera 已填写”标记。点击下方任一部分即可核对。${
                  done.missing.length ? `\n\n提交之前还需要：${done.missing.join("；")}。` : "\n\n没有其他事项阻碍提交。"
                }`,
                `हो गया — ${workspaceLabel} का ${monthLabel} ड्राफ़्ट के रूप में भर दिया गया। मैंने जो मान लिखे वे फ़ॉर्म में हरे दिखते हैं, “Cera ने भरा” टैग के साथ। जाँचने के लिए नीचे का कोई भी हिस्सा खोलें।${
                  done.missing.length ? `\n\nजमा करने से पहले अब भी चाहिए: ${done.missing.join("; ")}।` : "\n\nइसे जमा करने से अब कुछ नहीं रोकता।"
                }`,
              )
            : done.message,
          lang,
          cards: done.ok && links.length > 0 ? [{ kind: "links", links }] : undefined,
          suggestions: [ask(lang, "Smart upload")],
        },
        500,
      );
      if (done.ok && sc?.onApplied) sc.onApplied(card.plan.month, hash || undefined);
      /* IN THE PORTAL, CONFIRMING LEADS TO THE MONTH. The part of the form that took most of the file is brought into view — on this page if the
         month is already open, otherwise by going there — and on a phone, where Cera is the whole screen, it folds away so the page is what you see.
         The buttons in the reply still open any other part. */
      if (done.ok && !scopeRef.current) {
        if (hash) requestFocus(hash);
        if (pathnameRef.current !== monthHref) router.push(hash ? `${monthHref}${hash}` : monthHref);
        if (compactRef.current || fullscreenRef.current) {
          setFullscreenState(false);
          setMinimized(true);
        }
      }
    },
    [patchCard, say, queryClient, router],
  );

  /** A button after a fill, on a supplier's link: the page moves to the part of the month's form, it does not go anywhere else. */
  const followFocus = React.useCallback((month: string, focus: string) => {
    scopeRef.current?.onApplied?.(month, focus);
  }, []);

  const discardExtraction = React.useCallback(
    (messageId: string, cardId: string) => {
      const lang = messagesRef.current.find((m) => m.id === messageId)?.lang ?? uiLangRef.current;
      patchCard(messageId, cardId, (c) => (c.kind === "extraction" && c.state === "open" ? { ...c, state: "discarded" } : c));
      session.current = null;
      say({ text: pick(lang, "Okay — nothing was saved. Give me another file whenever you like.", "ตกลง — ไม่มีอะไรถูกบันทึก ส่งไฟล์อื่นมาเมื่อไหร่ก็ได้", "好的 — 没有保存任何内容。随时可以再发一个文件给我。", "ठीक है — कुछ सहेजा नहीं गया। जब चाहें मुझे दूसरी फ़ाइल दें।"), lang, suggestions: [ask(lang, "Smart upload")] }, 300);
    },
    [patchCard, say],
  );

  /* ── History ──────────────────────────────────────────────── */
  const newChat = React.useCallback(() => {
    reset();
  }, [reset]);

  const openConversation = React.useCallback(
    (id: string) => {
      const c = getConversation(id);
      if (!c) return;
      clearTimers();
      setThinking(false);
      setAnswering(false);
      session.current = null;
      releaseUrls(messagesRef.current);
      setConversationId(c.id);
      setMessages(c.messages);
      setView("chat");
    },
    [clearTimers],
  );

  const removeConversation = React.useCallback(
    (id: string) => {
      deleteConversation(id);
      refreshHistory();
      if (id === conversationId) reset();
    },
    [conversationId, refreshHistory, reset],
  );

  const value = React.useMemo<Ctx>(
    () => ({
      open,
      minimized,
      fullscreen,
      pos,
      setPos,
      messages,
      thinking,
      thinkingLabel,
      answering,
      toggle,
      show,
      showFullscreen,
      setFullscreen,
      hide,
      close,
      send,
      pickFile,
      answerChoice,
      toggleReadings,
      editReading: changeReading,
      applyExtraction,
      discardExtraction,
      view,
      setView: (v) => {
        if (v === "history") refreshHistory();
        setView(v);
      },
      history,
      newChat,
      openConversation,
      removeConversation,
      unseen,
      conversationId,
      uploadOn,
      setUploadOn,
      compact,
      openWithUpload,
      supplier: hasScope,
      precursor: isPrecursor,
      followFocus,
    }),
    [compact, openWithUpload, hasScope, isPrecursor, followFocus,
      open, minimized, fullscreen, pos, setPos, messages, thinking, thinkingLabel, answering, toggle, show, showFullscreen, setFullscreen, hide, close, send, pickFile,
      answerChoice, toggleReadings, changeReading, applyExtraction, discardExtraction, view, refreshHistory, history, newChat, openConversation, removeConversation, unseen, conversationId, uploadOn,
    ],
  );

  return <CeraContext.Provider value={value}>{children}</CeraContext.Provider>;
}
