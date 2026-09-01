"use client";

/* ════════════════════════════════════════════════════════════
   THE FIVE POP-UP FORMS — careers, feature, issue, pricing, and the engine

   Three of them used to be a Gmail compose window with a pre-filled subject.
   That works, but it asks the reader to write the whole thing themselves, and
   what came back was unusable: no company, no version, no way to reproduce.
   A short structured form gets a better answer AND is less work to fill in.

   THE FLOW, which is the same for all of them:
     click → the dialog opens on the form
     fill  → fields validate on blur, never mid-keystroke
     send  → a confirmation panel replaces the form
     wait  → the dialog closes itself after a beat

   Auto-close is deliberate but not aggressive: 2.6s is long enough to read one
   sentence and short enough that nobody is left staring at a dead dialog. The
   close button stays live throughout, and pressing Escape still works, so
   nothing traps a reader who reads faster or slower than we guessed.

   THE ENGINE'S GATE CLOSES FASTER — see AUTO_CLOSE_MS. Its confirmation is not
   the point of the interaction: the numbers it unlocked are already on the
   page behind it, and every extra beat is the dialog standing in front of the
   thing the reader pressed the button for.

   THE "SOMETHING ELSE" RULE. Every select on these forms ends on an escape
   hatch — "Something else", "Somewhere else". Picking it used to end the
   conversation: the one answer that most needed elaborating was the one the
   form had no room for. Each of those selects now has a companion text field
   that appears only when the last option is chosen, and is required while it
   is showing. It is keyed on "the last option of that select" rather than on
   the English string, so it keeps working in all five languages without a
   parallel list of magic words to translate.

   FRONTEND-ONLY, like every other form on this site. Nothing is transmitted;
   this is the seam where a real endpoint slots in — see `submit()` below.
   ════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePages } from "@/lib/i18n-pages";
import { useLang } from "@/lib/i18n";
import type { FormCopy } from "@/lib/pages";
import {
  EMAIL_RE,
  FieldError,
  SelectChevron,
  inputBad,
  inputBase,
  inputOk,
  labelClass,
} from "./form-fields";

export type PopupFormKind =
  | "careers"
  | "feature"
  | "issue"
  | "pricing"
  | "calculate";

/* Which fields each form asks for, and which of them are required. The copy
   for every one of these keys lives in lib/pages.ts under `forms`, in five
   languages — a field named here without copy there is a build error. */
type FieldSpec = {
  key: string;
  kind: "text" | "email" | "select" | "textarea";
  required?: boolean;
  /** half-width on desktop, so name and email share a row */
  half?: boolean;
  /** which select this field owns its own list of options for */
  optionsKey?: string;
  /** show only while `otherOf` currently holds the LAST option of its list —
      the escape hatch. Required whenever it is showing, invisible otherwise. */
  otherOf?: string;
};

const SPECS: Record<PopupFormKind, FieldSpec[]> = {
  careers: [
    { key: "name", kind: "text", required: true, half: true },
    { key: "email", kind: "email", required: true, half: true },
    { key: "role", kind: "select", required: true },
    { key: "roleOther", kind: "text", otherOf: "role" },
    /* Three link slots rather than one. Somebody who has a CV, a GitHub and a
       portfolio should not have to choose which one we get to see. None is
       required — the copy says "whatever you have" rather than "optional". */
    { key: "link1", kind: "text", half: true },
    { key: "link2", kind: "text", half: true },
    { key: "link3", kind: "text", half: true },
    { key: "message", kind: "textarea", required: true },
  ],
  feature: [
    { key: "name", kind: "text", required: true, half: true },
    { key: "email", kind: "email", required: true, half: true },
    { key: "company", kind: "text", half: true },
    { key: "area", kind: "select", required: true, half: true },
    { key: "areaOther", kind: "text", otherOf: "area" },
    { key: "summary", kind: "text", required: true },
    { key: "detail", kind: "textarea", required: true },
  ],
  issue: [
    { key: "name", kind: "text", required: true, half: true },
    { key: "email", kind: "email", required: true, half: true },
    { key: "where", kind: "select", required: true, half: true },
    { key: "severity", kind: "select", required: true, half: true },
    { key: "whereOther", kind: "text", otherOf: "where" },
    { key: "detail", kind: "textarea", required: true },
  ],
  /* THE QUOTE FORM. Every question here is one the quote actually turns on:
     the plans are metered on CN codes and plants, the timeline decides whether
     this is a filing or a research project, and the goods decide which sector
     rules and default values apply. Nothing is asked that sales would not have
     had to ask on the call anyway. */
  pricing: [
    { key: "name", kind: "text", required: true, half: true },
    { key: "email", kind: "email", required: true, half: true },
    { key: "company", kind: "text", required: true, half: true },
    { key: "role", kind: "text", half: true },
    { key: "cnCodes", kind: "select", required: true, half: true, optionsKey: "cnCodes" },
    { key: "sites", kind: "select", required: true, half: true, optionsKey: "sites" },
    { key: "goods", kind: "select", required: true, half: true, optionsKey: "goods" },
    { key: "timeline", kind: "select", required: true, half: true, optionsKey: "timeline" },
    { key: "plan", kind: "select", half: true, optionsKey: "plan" },
    { key: "volume", kind: "select", half: true, optionsKey: "volume" },
    { key: "notes", kind: "textarea" },
  ],
  /* THE ENGINE'S GATE. Five identity fields and nothing about the goods — the
     reader has already told the calculator its CN codes, its products and its
     plants, and asking again on the way to the answer would be exactly the
     duplication the tool exists to remove.

     `role` is the one optional field, matching the quote form: it sharpens who
     we are talking to but never decides anything, and a required job title on
     a form standing between somebody and a number they already computed is a
     reason to close the tab. Every key here also exists on `pricing`, which is
     what lets these answers carry straight over — see the CN calculator. */
  calculate: [
    { key: "name", kind: "text", required: true, half: true },
    { key: "email", kind: "email", required: true, half: true },
    { key: "phone", kind: "text", required: true, half: true },
    { key: "company", kind: "text", required: true, half: true },
    { key: "role", kind: "text" },
  ],
};

/* How long the confirmation panel stays up before the dialog closes itself.
   The four forms that send something somewhere hold for 2.6s, which is one
   sentence read at an unhurried pace. The engine's gate holds for barely over
   a second: it is standing between the reader and a result that has already
   rendered behind it, so the confirmation is a receipt, not a message. */
const AUTO_CLOSE_MS: Record<PopupFormKind, number> = {
  careers: 2600,
  feature: 2600,
  issue: 2600,
  pricing: 2600,
  calculate: 1200,
};

/* The one select that is not driven by `copy.options`: severity is the same
   three answers in every form that has it, so it carries its own list. */
const SEVERITY_LABELS: Record<string, [string, string, string]> = {
  en: ["Yes — I cannot finish something", "It slows me down", "Cosmetic only"],
  th: ["ใช่ — ทำงานต่อไม่ได้", "ทำให้ช้าลง", "แค่เรื่องการแสดงผล"],
  vi: ["Có — tôi không hoàn tất được", "Nó làm tôi chậm lại", "Chỉ là hiển thị"],
  tr: ["Evet — bir işi bitiremiyorum", "Beni yavaşlatıyor", "Yalnızca görsel"],
  hi: ["हाँ — काम पूरा नहीं कर पा रहा", "यह धीमा कर रहा है", "सिर्फ़ दिखावट का"],
};

export function PopupForm({
  kind,
  open,
  onClose,
  prefill,
  context,
  onSubmitted,
}: {
  kind: PopupFormKind;
  open: boolean;
  onClose: () => void;
  /** answers already known — the CN calculator hands its own over so nobody
      is asked the same question twice on the way to a quote */
  prefill?: Record<string, string>;
  /** a one-line summary shown above the fields, for the same reason */
  context?: string;
  /** fires once, with the completed answers, at the moment the form passes
      validation — for a caller that has to do something with them rather than
      just close. The CN calculator uses it to open its result. It runs on the
      submit edge, not on close, so a reader who dismisses the dialog early
      still gets what they filled the form in for. */
  onSubmitted?: (values: Record<string, string>) => void;
}) {
  const pages = usePages();
  const { lang } = useLang();
  const copy: FormCopy = pages.forms[kind];
  const spec = SPECS[kind];

  const [values, setValues] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);
  const [phase, setPhase] = useState<"form" | "sending" | "done">("form");
  const [mounted, setMounted] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  /* Reset on open, not on close: resetting on close wipes the confirmation
     message out from under the auto-close animation. */
  useEffect(() => {
    if (!open) return;
    setValues(prefill ?? {});
    setTouched({});
    setAttempted(false);
    setPhase("form");
    /* `prefill` is an object literal at most call sites, so it is a new
       reference on every render. Depending on it would reset the form under
       the reader's fingers; the open edge is the only moment it should be
       read. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    onClose();
  }, [onClose]);

  /* Escape closes, and the body stops scrolling behind the dialog. Both are
     undone on unmount so a fast open/close cycle cannot leave the page stuck. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  /* Where a field's list of options comes from. `copy.options` is the single
     list a form with one select carries; `copy.optionSets` holds the several a
     form with several selects needs. Severity is neither — it is the same
     three answers wherever it appears, so it travels with the component. */
  const optionsForKey = useCallback(
    (key: string, optionsKey?: string): string[] => {
      if (key === "severity") return SEVERITY_LABELS[lang] ?? SEVERITY_LABELS.en;
      if (optionsKey) return copy.optionSets?.[optionsKey] ?? [];
      return copy.options ?? [];
    },
    [copy, lang],
  );

  /* The escape hatch is always the LAST option of its select — see the header.
     Matching on position rather than on the English string is what lets the
     companion field work in all five languages. */
  const isOtherChosen = (dependsOn: string): boolean => {
    const parent = spec.find((f) => f.key === dependsOn);
    const opts = optionsForKey(dependsOn, parent?.optionsKey);
    const last = opts[opts.length - 1];
    return !!last && values[dependsOn] === last;
  };

  const visible = (field: FieldSpec) => !field.otherOf || isOtherChosen(field.otherOf);

  const errorFor = (field: FieldSpec): string | undefined => {
    /* A hidden field can never block the submit — including one holding a
       stale answer from before the reader changed the select above it. */
    if (!visible(field)) return undefined;
    const v = (values[field.key] ?? "").trim();
    /* The companion text field is required exactly while it is showing:
       "Something else" on its own is not an answer. */
    if ((field.required || field.otherOf) && !v) return copy.required;
    if (field.kind === "email" && v && !EMAIL_RE.test(v)) return copy.invalidEmail;
    return undefined;
  };

  const showError = (field: FieldSpec) =>
    (touched[field.key] || attempted) && errorFor(field);

  const valid = spec.every((f) => !errorFor(f));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (!valid) return;

    /* THE SEAM. A real endpoint goes here; until there is one, the dialog
       behaves exactly as it will when there is — a beat of "sending", then the
       confirmation, then it closes itself. */
    setPhase("sending");
    onSubmitted?.(values);
    setTimeout(() => {
      setPhase("done");
      closeTimer.current = setTimeout(close, AUTO_CLOSE_MS[kind]);
    }, 550);
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
    >
      <div
        aria-hidden="true"
        onClick={close}
        className="fixed inset-0 bg-[#111]/35 backdrop-blur-[3px]"
        style={{ animation: "modalFade 0.2s ease both" }}
      />

      <div
        className="relative w-full max-w-lg overflow-hidden rounded-t-2xl border border-black/[0.08] bg-[#F5F4F0] shadow-[0_24px_64px_rgba(0,0,0,0.18)] sm:rounded-2xl"
        style={{ animation: "modalIn 0.32s var(--ease-signature) both" }}
      >
        <button
          type="button"
          onClick={close}
          aria-label={pages.forms.close}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-black/35 transition-colors hover:bg-black/[0.05] hover:text-black/70"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>

        {phase === "done" ? (
          <div className="px-6 py-14 text-center sm:px-10">
            <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-emerald-600/20 bg-emerald-50">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#047857" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8.5 6.5 12 13 4.5" />
              </svg>
            </div>
            <h3
              className="text-2xl font-light tracking-tight text-[#111]"
              style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
            >
              {copy.successTitle}
            </h3>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-black/45">
              {copy.successBody}
            </p>
            {/* The reader can see the dialog is about to go. Without this the
                auto-close reads as a glitch rather than a decision — so the
                bar is driven by the same number the timer is, never a second
                hard-coded 2.6s that could drift away from it. */}
            <div className="mx-auto mt-7 h-[2px] w-24 overflow-hidden rounded-full bg-black/[0.07]">
              <div
                className="h-full rounded-full bg-emerald-600/50"
                style={{
                  animation: `popupCountdown ${AUTO_CLOSE_MS[kind]}ms linear both`,
                }}
              />
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="max-h-[85vh] overflow-y-auto px-6 py-8 sm:px-8">
            <div className="mb-6 pr-8">
              <div className="font-pixel text-[10px] tracking-[0.2em] text-black/35">
                {copy.eyebrow}
              </div>
              <h3
                className="mt-2 text-2xl font-light leading-tight tracking-tight text-[#111]"
                style={{ fontFamily: "var(--font-ibm-plex-sans), sans-serif" }}
              >
                {copy.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-black/45">{copy.intro}</p>
              {/* What the reader already told the calculator, echoed back so
                  the shorter form does not read as an arbitrary shorter form. */}
              {context && (
                <p className="mt-4 rounded-xl border border-black/[0.08] bg-white/70 px-3.5 py-2.5 font-pixel text-[10px] uppercase leading-relaxed tracking-[0.1em] text-black/50">
                  {context}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2">
              {spec.map((field) => {
                if (!visible(field)) return null;
                const f = copy.fields[field.key];
                const err = showError(field);
                const cls = `${inputBase} ${err ? inputBad : inputOk}`;
                const onBlur = () => setTouched((t) => ({ ...t, [field.key]: true }));
                const onChange = (
                  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
                ) => setValues((v) => ({ ...v, [field.key]: e.target.value }));

                return (
                  <div key={field.key} className={field.half ? "sm:col-span-1" : "sm:col-span-2"}>
                    <label className={labelClass} htmlFor={`${kind}-${field.key}`}>
                      {f.label}
                    </label>

                    {field.kind === "textarea" ? (
                      <textarea
                        id={`${kind}-${field.key}`}
                        rows={4}
                        className={`${cls} resize-y leading-relaxed`}
                        placeholder={f.placeholder}
                        value={values[field.key] ?? ""}
                        onChange={onChange}
                        onBlur={onBlur}
                      />
                    ) : field.kind === "select" ? (
                      <div className="relative">
                        <select
                          id={`${kind}-${field.key}`}
                          className={`${cls} appearance-none pr-8`}
                          value={values[field.key] ?? ""}
                          onChange={onChange}
                          onBlur={onBlur}
                        >
                          <option value="" disabled>
                            —
                          </option>
                          {optionsForKey(field.key, field.optionsKey).map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/35">
                          <SelectChevron inset="right-0" />
                        </div>
                      </div>
                    ) : (
                      <input
                        id={`${kind}-${field.key}`}
                        type={field.kind === "email" ? "email" : "text"}
                        className={cls}
                        placeholder={f.placeholder}
                        value={values[field.key] ?? ""}
                        onChange={onChange}
                        onBlur={onBlur}
                      />
                    )}

                    {f.hint && !err && (
                      <p className="mt-1.5 text-[11px] leading-snug text-black/30">{f.hint}</p>
                    )}
                    <FieldError message={err || undefined} />
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={phase === "sending"}
              className="mt-7 w-full rounded-[10px] bg-[#111] px-6 py-3 text-xs tracking-widest text-white transition-colors hover:bg-[#333] disabled:opacity-50"
            >
              {phase === "sending" ? copy.sending : copy.submit}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ── The opener ─────────────────────────────────────────────
   Nav rows, footer links and page buttons all need "a thing you click that
   opens one of these". This keeps the state next to the trigger so no page has
   to own dialog state it does not otherwise care about. */
export function PopupFormTrigger({
  kind,
  className,
  children,
  onOpen,
  prefill,
  context,
  onSubmitted,
}: {
  kind: PopupFormKind;
  className?: string;
  children: React.ReactNode;
  /** lets a nav close itself when the dialog takes over */
  onOpen?: () => void;
  prefill?: Record<string, string>;
  context?: string;
  onSubmitted?: (values: Record<string, string>) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          setOpen(true);
          onOpen?.();
        }}
      >
        {children}
      </button>
      <PopupForm
        kind={kind}
        open={open}
        onClose={() => setOpen(false)}
        prefill={prefill}
        context={context}
        onSubmitted={onSubmitted}
      />
    </>
  );
}
