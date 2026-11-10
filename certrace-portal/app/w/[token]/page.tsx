"use client";

export const runtime = "edge";

/* ════════════════════════════════════════════════════════════
   THE SUPPLIER'S MONTH — what the workspace link opens

   One month, one installation, one good. No account, no seat: whoever fills
   this in is not a Certrace user and should not have to become one to answer a
   question about March.

   IT IS A FLOW, NOT A PAGE. It used to be one very long form — methodology,
   readings, precursors, documents, submit — and the person filling it in had
   no way to tell how much was left, no way to be sure they had finished a
   section, and every validation error arrived at the bottom after twenty
   minutes of typing. Six steps, in the order the work actually happens:

     0 · Overview      who is asking, for what, and what it involves
     1 · Methodology   how these figures are produced
     2 · Monthly data  the readings
     3 · Documents     what a verifier will ask to see
     4 · Check         everything wrong with it, with jump links
     5 · Sign          the internal authorisation

   WHAT IS NOT ASKED HERE: the installation's own record and the precursors
   received. The plant is asked for what only the plant can read off its meters
   each month; the site's identity is entered once by the exporter, and the
   bought-in precursors are the exporter's (their Precursors tab).

   THE CHECK COMES BEFORE THE SIGNATURE AND AFTER THE UPLOAD. Both orderings
   are load-bearing: a check that runs before there is anywhere to attach a
   document reports a fault the reader cannot fix, and a signature collected
   before the check is a signature on figures nobody has looked at.

   START FROM LAST MONTH. From the SECOND month on, most of the answer is last
   month's: the same fuels, the same meters, the same calorific values, with
   different quantities. In the first month there is nothing to copy, so the
   control is not offered — a disabled checkbox with an explanation is still a
   thing to read and decide about. "Clear the form" is its counterpart and is
   always available, because the failure mode of copying is copying the wrong
   month, and the fix has to be one click rather than a hunt for which fields
   were carried.

   Only server-issued links resolve. The autosave effect below and
   lib/workspace-link-sync.ts persist answers and submission through the server.
   ════════════════════════════════════════════════════════════ */

import * as React from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Eraser,
  FileText,
  Flag,
  LockKeyhole,
  Gauge,
  Layers,
  PenLine,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { CertraceLogo } from "@/components/logo";
import { LanguageSelect } from "@/components/language-select";
import {
  AutoSaveBadge,
  Button,
  Card,
  EnglishOnlyLine,
  EnglishOnlyNotice,
  Field,
  Modal,
  SaveButton,
  inputClass,
  useAutoSave,
  useFlash,
  useSaveState,
  cn,
} from "@/components/ui";
import { Select } from "@/components/controls";
import { toast, Toaster } from "@/components/toast";
import { Note, fmt } from "@/components/workspace/chrome";
import {
  DocumentsStep,
  MmdStep,
  MonthlyStep,
} from "@/components/supplier/month-steps";
import { CeraProvider, useCera } from "@/components/cera/cera-provider";
import { CeraButton } from "@/components/cera/cera-button";
import { CeraPanel } from "@/components/cera/cera-panel";
import { CeraMark } from "@/components/cera/cera-mark";
import { AiFillRunBanner } from "@/components/intake/ai-badge";
import { deriveMonth } from "@/lib/monthly-inputs";
import {
  coverageForMonth,
  reconcileFuelEvidence,
} from "@/lib/workspace-evidence";
import { workspaceRequiresIndirectEmissions } from "@/lib/cbam/product-category-rules";
import {
  emptyFuel,
  emptyMonth,
  FUEL_TYPE_OTHER,
  fuelEvidenceKey,
  fuelTypeLabel,
  getMonth,
  monthResult,
  monthsForWorkspace,
  saveMonth,
  type FuelEntry,
  type MonthlyEntry,
} from "@/lib/monthly-data";
import {
  ContentsBox,
  AuthorisationHistory,
} from "@/components/workspace/month-contents";
import { runMonthQualityCheck, type ContentRow } from "@/lib/month-quality";
import {
  authorisationHistory,
  type Attestation,
  type MonthSubmission,
} from "@/lib/month-submission";
import {
  REVISION_CHIP,
  REVISION_RING,
  resolveAreas,
  type RevisionArea,
} from "@/lib/month-revision";
import { monthNameLong, routeLabel } from "@/lib/workspace";
import { type WorkspaceRequest } from "@/lib/workspace-link";
import { saveDraft, type WorkspaceMmdContent } from "@/lib/workspace-mmd";
import { syncFromMmd, syncFromMonth } from "@/lib/mmd-sync";
import {
  useDispatches,
  useInvalidateWorkspaceData,
  useMmdDraft,
  useMonth,
  useMonthEvidence,
  useRequestEdit,
  useSaveMmdDraft,
  useSaveMonth,
  useSubmission,
} from "@/lib/workspace-data-query";
import { useWorkspaceRequest } from "@/lib/workspaces-query";
import {
  activeLinkSession,
  saveLinkIfChanged,
  submitWorkspaceLink,
} from "@/lib/workspace-link-sync";
import { useT } from "@/lib/i18n";
import { requestFocus } from "@/lib/cera/focus";
import { isDeadLink } from "@/lib/api/errors";

const STEPS = [
  { key: "overview", label: "Overview", icon: ClipboardList },
  { key: "mmd", label: "Methodology", icon: Layers },
  { key: "monthly", label: "Monthly data", icon: Gauge },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "check", label: "Check", icon: Sparkles },
  { key: "sign", label: "Sign", icon: PenLine },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export default function WorkspaceSupplierPage() {
  const t = useT();
  const params = useParams<{ token: string }>();
  const token = decodeURIComponent(params.token);
  const { data: req, error, refetch, isFetching } = useWorkspaceRequest(token);

  if (isDeadLink(error)) return <Invalid />;
  if (req === undefined)
    return (
      <Shell>
        <p role={error ? "alert" : "status"} className="text-sm text-black/60">
          {error
            ? t(
                "We could not load this request. Check your connection and try again.",
              )
            : t("Loading your request…")}
        </p>
        {error && (
          <Button
            className="mt-4"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {t("Try again")}
          </Button>
        )}
      </Shell>
    );
  if (req === null) return <Invalid />;
  return <Flow req={req} />;
}

function Shell({
  children,
  cera,
}: {
  children: React.ReactNode /** the Cera button in the bar, and the panel it opens — only where there is a Cera provider above */;
  cera?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-[rgba(245,244,240,0.85)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <CertraceLogo className="h-[18px] w-auto" />
          <div className="flex items-center gap-2">
            <LanguageSelect />
            {cera && <CeraButton />}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
      <Toaster />
      {cera && <CeraPanel />}
    </div>
  );
}

function Invalid() {
  const t = useT();
  return (
    <Shell>
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-black/[0.07] bg-white text-black/40">
        <ShieldCheck size={22} strokeWidth={1.5} />
      </span>
      <h1 className="mt-5 font-[family-name:var(--font-plex)] text-2xl font-light tracking-tight text-[#111]">
        {t("This link looks invalid or expired.")}
      </h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-black/50">
        {t(
          "Product report links are personal to one installation and one reporting year. Ask the exporter who contacted you to resend it.",
        )}
      </p>
    </Shell>
  );
}

function Flow({ req }: { req: WorkspaceRequest }) {
  const t = useT();
  const { workspace, months } = req;

  const [step, setStep] = React.useState<StepKey>("overview");
  const [month, setMonth] = React.useState(req.month);
  const [linkSaveError, setLinkSaveError] = React.useState<string | null>(null);
  const [documentsPending, setDocumentsPending] = React.useState(false);
  const documentRevision = React.useRef(0);

  /* ── A server link saves itself ───────────────────────────────
     When this page was opened from a server-issued link, every store it
     writes is this browser's copy of what the exporter will read. Rather than
     thread a save through each of the dozen places those stores are written,
     compare the workspace's slice every few seconds and save when it moved —
     and once more when the tab is hidden or the page goes away, which is when
     a supplier closes it. See lib/workspace-link-sync.ts. */
  React.useEffect(() => {
    if (!activeLinkSession()) return;
    const save = () => {
      const revision = documentRevision.current;
      void saveLinkIfChanged()
        .then(() => {
          setLinkSaveError(null);
          if (documentRevision.current === revision) setDocumentsPending(false);
        })
        .catch((cause) =>
          setLinkSaveError(
            cause instanceof Error
              ? cause.message
              : "Your changes have not been saved. Please retry.",
          ),
        );
    };
    const timer = window.setInterval(save, 3000);
    const onHide = () => {
      if (document.visibilityState === "hidden") save();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", save);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", save);
      save();
    };
  }, []);

  /* Everything this month needs, off the query cache. The month is part of
     the key, which is what makes the month picker a real switch rather than
     a label. */
  const monthQ = useMonth(workspace.id, month);
  const mmdQ = useMmdDraft(
    workspace.id,
    workspace.periodStart,
    workspace.periodEnd,
  );
  const { data: monthEvidence } = useMonthEvidence(workspace.id, month);
  const saveMonthMut = useSaveMonth();
  const saveMmdMut = useSaveMmdDraft();
  const requestEditMut = useRequestEdit();
  const invalidateWorkspaceData = useInvalidateWorkspaceData(workspace.id);

  /* The edit buffers. entry and mmd stay component state on
     purpose: the entry–mmd reconciliation below can only happen here, and the
     autosave writes from here. Each is seeded from its query; invalidation
     after a write brings buffer and store back into line. */
  const [entry, setEntry] = React.useState<MonthlyEntry | null>(null);
  const [mmd, setMmd] = React.useState<WorkspaceMmdContent | null>(null);
  const documentCount = monthEvidence?.length ?? 0;
  const [carried, setCarried] = React.useState(false);

  const [fullName, setFullName] = React.useState("");
  const [role, setRole] = React.useState("");
  const [confirmed, setConfirmed] = React.useState(false);
  const submit = useSaveState(900);

  /* The exporter's side of this month, read for two things the supplier
     genuinely needs: what was sent back for revision, and whether a request to
     reopen a submitted month has been answered. */
  const { data: submissionData } = useSubmission(workspace.id, month);
  /* A month opens to the plant only once the exporter has sent it. The link's own month always does — it was sent to get here. */
  const { data: dispatches } = useDispatches(workspace.id);
  const sentMonths = React.useMemo(() => {
    const sent = new Set<string>([req.month]);
    for (const [m, d] of Object.entries(dispatches ?? {}))
      if (d?.sentAt) sent.add(m);
    return sent;
  }, [dispatches, req.month]);
  const submission: MonthSubmission | null = submissionData ?? null;
  const askEdit = useSaveState(1400);
  const [editReason, setEditReason] = React.useState("");
  const [editOpen, setEditOpen] = React.useState(false);

  const previousMonth = React.useMemo(() => {
    const i = months.indexOf(month);
    return i > 0 ? months[i - 1] : null;
  }, [months, month]);

  /* Seed the buffers from the queries. A month that was never started reads
     back null, so the empty entry is fabricated here exactly as before; the
     installation falls back to the workspace's own naming of the site.

     NEVER reseed while the autosave holds keystrokes it has not written yet:
     the refetch a nearby write triggers would hand back the pre-keystroke value
     and erase them, and the reverted buffer would clear the pending save timer
     so the edit is lost for good. Read through a ref (assigned just below the
     autosave) so the resync fires on data arriving, not on the autosave's own
     transitions — the same guard the exporter's month editor documents. */
  const autosaveStatus = React.useRef("idle");
  const seeding = () =>
    autosaveStatus.current === "pending" || autosaveStatus.current === "saving";
  /* The month buffer is guarded WITHIN a month, but a month SWITCH must always
     reseed: the previous month's pending save writes it on its own, so nothing
     is lost by abandoning that buffer, and gating the switch on its pending
     status would strand the picker on the old month. (The month editor route
     avoids this by remounting per month; here the picker is in-component.) */
  const seededMonth = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (seededMonth.current === month && seeding()) return;
    if (monthQ.data !== undefined) {
      setEntry(monthQ.data ?? emptyMonth(workspace.id, month));
      seededMonth.current = month;
    }
  }, [monthQ.data, workspace.id, month]);

  React.useEffect(() => {
    if (seeding()) return;
    if (mmdQ.data) setMmd(mmdQ.data);
  }, [mmdQ.data]);

  /* A month switch resets the flow's own state; the data above re-keys and
     refetches on its own. */
  React.useEffect(() => {
    setCarried(false);
    setConfirmed(false);
    setEditOpen(false);
    setEditReason("");
  }, [workspace.id, month]);

  const readOnly =
    entry?.status === "submitted" || entry?.status === "reviewed";

  const autosave = useAutoSave(
    { entry, mmd },
    async (v) => {
      if (v.entry) await saveMonthMut.mutateAsync(v.entry);
      if (v.mmd)
        await saveMmdMut.mutateAsync({
          workspaceId: workspace.id,
          content: v.mmd,
        });
      await saveLinkIfChanged();
    },
    { enabled: Boolean(entry) && !readOnly && submit.state !== "saving" },
  );
  // Current autosave status, read by the reseed effects above at effect-run
  // time (after this render's assignment lands).
  autosaveStatus.current = autosave.status;

  const peers = React.useMemo(
    () =>
      entry
        ? monthsForWorkspace(workspace).filter((m) => m.month !== month)
        : [],
    [workspace, month, entry],
  );

  const report = React.useMemo(() => {
    if (!entry || !mmd) return null;
    return runMonthQualityCheck({
      entry,
      mmd,
      month,
      peers,
      documentCount,
      /* This form IS the supplier's. The three methodology rules they are never
         shown must not be able to block their signature. */
      audience: "supplier",
    });
  }, [entry, mmd, month, peers, documentCount]);

  /* ── What the exporter asked to have looked at again ───────────
     The areas are stored on the submission (lib/month-revision.ts). They are
     not findings and must not behave like them: a finding is transient advice
     the reader clears by fixing it, a revision area is a QUESTION SOMEBODY
     ASKED, and it stays marked until the month goes back. Hence the ring is
     applied for as long as the step is open rather than flashed for two
     seconds. */
  /** Which fuels had a supporting document a moment ago — see
      `reconcileFuelEvidence`. "Was covered" cannot be recovered from the store
      once the file is gone, so it is remembered here. */
  const fuelEvidenceRef = React.useRef<Record<string, boolean>>({});
  const requiresIndirect = workspaceRequiresIndirectEmissions(
    workspace.productId,
  );

  React.useEffect(() => {
    if (!entry) return;
    const cov = coverageForMonth(workspace.id, entry, requiresIndirect);
    fuelEvidenceRef.current = Object.fromEntries(
      entry.fuels.map((f) => [
        f.id,
        cov.rows.find((r) => r.key === fuelEvidenceKey(f.id))?.covered ?? false,
      ]),
    );
    // Only on arrival at a month — the snapshot is advanced by the reconcile
    // itself thereafter, and re-seeding on every keystroke would erase the
    // "was covered" memory the rule depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id, month]);

  const revisionAreas: RevisionArea[] = React.useMemo(
    () =>
      submission?.state === "changes_requested"
        ? resolveAreas(submission.revisionAreas)
        : [],
    [submission],
  );

  React.useEffect(() => {
    if (revisionAreas.length === 0) return;
    const ring = REVISION_RING.split(" ");
    const marked: HTMLElement[] = [];
    // After the step's own mount — the anchors do not exist until it renders.
    const t = window.setTimeout(() => {
      for (const area of revisionAreas) {
        if (area.step !== step) continue;
        const el = document.getElementById(area.anchor);
        if (!el) continue;
        el.classList.add(...ring, "rounded-xl");
        marked.push(el);
      }
    }, 60);
    return () => {
      window.clearTimeout(t);
      for (const el of marked) el.classList.remove(...ring, "rounded-xl");
    };
  }, [revisionAreas, step]);

  if (!entry || !mmd) return null;

  const patch = (p: Partial<MonthlyEntry>) =>
    setEntry((prev) => {
      if (!prev) return prev;
      // A stock change, a shared meter, a gas row or a delivery WRITES the quantity it stands for — here, so the form shows the same figure the month will hold.
      const next = deriveMonth({
        ...prev,
        ...p,
        status: prev.status === "empty" ? "draft" : prev.status,
      } as MonthlyEntry);
      // Only these two fields feed back into the methodology; syncing on every
      // keystroke of a quantity would fire a toast per digit.
      if (p.fuels !== undefined || p.electricityFactorSource !== undefined)
        queueMicrotask(() => syncMmdFromEntry(next));
      return next;
    });

  const patchFuel = (id: string, p: Partial<FuelEntry>) =>
    setEntry((prev) =>
      prev
        ? deriveMonth({
            ...prev,
            fuels: prev.fuels.map((f) => (f.id === id ? { ...f, ...p } : f)),
            status: prev.status === "empty" ? "draft" : prev.status,
          })
        : prev,
    );

  /* ── The methodology and the month, kept in step ──────────────
     Both live in this component's state, which is the only place the two can
     be reconciled without a round-trip through storage. lib/mmd-sync.ts owns
     the rules; these two callbacks are the seam.

     Notes are surfaced as ONE toast rather than several. Declaring three
     fuels at once is one action and deserves one acknowledgement — three
     stacked toasts read as three things going wrong. */
  /* One naming of a fuel, used by both directions of the sync so a toast and
     the form cannot call the same fuel two different things. */
  const fuelLabel = (id: string) => fuelTypeLabel(id);

  /* DEFERRED OUT OF THE RENDER PHASE. `announce` is reached from inside a
     `setState` updater, and an updater runs while React is rendering — firing
     a toast there updates the Toaster mid-render, which React reports as a
     bug because it is one. The microtask puts it after the commit. */
  const announce = (notes: string[]) => {
    if (notes.length === 0) return;
    queueMicrotask(() =>
      toast({
        message: t("Methodology and month updated together"),
        detail: notes.join(" "),
        tone: "info",
      }),
    );
  };

  const setMmdSynced = (incoming: WorkspaceMmdContent) => {
    /* "Other fuel" CHANGED MIND: unticking it takes the name that was typed for it away too. Left behind, the name comes back the next
       time Other is ticked, and goes into the methodology as the description of a fuel the plant said it does not burn. */
    const next =
      incoming.fuelTypeIds.includes(FUEL_TYPE_OTHER) || !incoming.fuelTypesOther
        ? incoming
        : { ...incoming, fuelTypesOther: "" };
    setMmd(next);
    setEntry((prev) => {
      if (!prev) return prev;
      const r = syncFromMmd(next, prev, fuelLabel);
      announce(r.notes);
      return r.entry.fuels === prev.fuels &&
        r.entry.electricityFactorSource === prev.electricityFactorSource
        ? prev
        : {
            ...r.entry,
            status: prev.status === "empty" ? "draft" : prev.status,
          };
    });
  };

  /* Called after a change that could have removed a fuel row or re-picked the
     factor source. It reads the ENTRY THAT WAS JUST WRITTEN rather than the
     one in scope, because `patch` is async and the stale copy would push the
     deleted fuel straight back into the methodology. */
  const syncMmdFromEntry = (nextEntry: MonthlyEntry) => {
    setMmd((prevMmd) => {
      if (!prevMmd) return prevMmd;
      const r = syncFromMonth(prevMmd, nextEntry, fuelLabel);
      announce(r.notes);
      return r.mmd;
    });
  };

  /* Copying brings the SHAPE of last month across — which fuels, on which
     meters, at which calorific values and factors — and its quantities as a
     starting point. Copying the shape without the numbers would still leave
     twelve rows to retype. */
  /* ANSWERS ON THE BUTTON, not in the corner. Returns what happened so the
     control that was pressed can say it: copied, or nothing there to copy.
     Both are answers to the same press and belong in the same place. */
  const carryOver = (): "copied" | "empty" => {
    if (!previousMonth) return "empty";
    const prev = getMonth(workspace.id, previousMonth);
    if (!prev) return "empty";
    setEntry((cur) =>
      cur
        ? {
            ...cur,
            productionTonnes: prev.productionTonnes,
            // New ids: a fuel row is an entity, and two months sharing one
            // makes editing March rewrite February.
            fuels: prev.fuels.map((f) => ({ ...f, id: emptyFuel().id })),
            electricityMwh: prev.electricityMwh,
            electricityFactorTco2PerMwh: prev.electricityFactorTco2PerMwh,
            electricityFactorSource: prev.electricityFactorSource,
            processEmissionsTco2: prev.processEmissionsTco2,
            processEmissionsBasis: prev.processEmissionsBasis,
            status: "draft",
          }
        : cur,
    );
    setCarried(true);
    return "copied";
  };

  /* Cleared, not toasted. The control sits under a paragraph that already
     says what clearing does and does not touch, so a notification repeating
     it in the corner adds nothing the reader cannot see; what they actually
     want is confirmation that the press registered, and the button gives them
     that where they pressed it. */
  const clearForm = () => {
    setEntry(emptyMonth(workspace.id, month));
    setCarried(false);
  };

  /* Removing the last document behind a Type II factor reverts that fuel to
     the EU standard value — the same rule the exporter's month screen applies,
     from the same function, because a rule that fired on one of the two
     screens is a rule an installation could walk around by using the other. */
  const onDocumentsChanged = () => {
    if (activeLinkSession()) {
      documentRevision.current++;
      setDocumentsPending(true);
    }
    // DocumentsStep writes around the mutations — settle the evidence query
    // (documentCount above) and everything else the upload moved.
    invalidateWorkspaceData();
    setEntry((cur) => {
      if (!cur) return cur;
      const r = reconcileFuelEvidence(
        workspace.id,
        cur,
        fuelEvidenceRef.current,
        requiresIndirect,
      );
      fuelEvidenceRef.current = r.covered;
      if (r.reverted.length > 0) {
        queueMicrotask(() =>
          toast({
            message: t("{fuels} reverted to the EU standard value", {
              fuels: r.reverted.join(", "),
            }),
            detail: t(
              "The document behind the Type II factor was removed, so the figure can no longer stand as entered.",
            ),
            tone: "warn",
          }),
        );
      }
      return r.entry;
    });
  };

  /* From the Check list back to the field: the step opens, the control scrolls into the middle and rings for a few seconds, and a
     line says what it is there for — the ring alone shows where, not why. */
  const goto = (
    row: Pick<ContentRow, "step" | "field" | "label" | "note" | "state">,
  ) => {
    setStep(row.step);
    window.setTimeout(() => {
      const el = document.getElementById(row.field);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-[#f59e0b]", "rounded-xl");
        window.setTimeout(
          () => el.classList.remove("ring-2", "ring-[#f59e0b]", "rounded-xl"),
          4200,
        );
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      if (row.state !== "ready")
        toast({
          message: t(row.label),
          detail: row.note ? t(row.note) : t("Fill this in."),
          tone: "info",
        });
    }, 120);
  };

  const gotoRevision = (area: RevisionArea) => {
    setStep(area.step);
    window.setTimeout(() => {
      const el = document.getElementById(area.anchor);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }, 140);
  };

  /* ── Asking to reopen a month already sent ─────────────────────
     Recorded and left pending. Nothing here unlocks anything: the exporter
     approves it on their own screen, and their approval is what puts the
     month back into draft. A supplier portal that could reopen its own
     submissions would make "submitted" mean nothing. */
  const sendEditRequest = () => {
    if (!editReason.trim()) return;
    askEdit.run(async () => {
      try {
        await requestEditMut.mutateAsync({
          workspaceId: workspace.id,
          month,
          reason: editReason.trim(),
        });
        await saveLinkIfChanged();
      } catch (cause) {
        toast({
          message: t("Not sent yet"),
          detail: cause instanceof Error ? cause.message : t("Please retry."),
          tone: "warn",
        });
        throw cause;
      }
      setEditOpen(false);
      setEditReason("");
    });
  };

  const canSign =
    Boolean(report?.canSubmit) &&
    fullName.trim().length > 1 &&
    role.trim().length > 1 &&
    confirmed;

  const doSubmit = () => {
    if (!canSign) return;
    submit.run(async () => {
      try {
        if (!(await autosave.flush()))
          throw new Error(
            "Your latest changes have not been saved. Please retry.",
          );
        saveMonth(entry);
        saveDraft(workspace.id, mmd);
        await submitWorkspaceLink(
          { signatoryName: fullName.trim(), signatoryRole: role.trim() },
          { score: report?.score ?? 0, warnings: report?.warnings.length ?? 0 },
        );
        setEntry(getMonth(workspace.id, month) ?? entry);
        invalidateWorkspaceData();
        toast({
          message: t("{month} submitted", { month: monthNameLong(month) }),
          detail: t("The exporter can see it now."),
          tone: "ok",
        });
      } catch (cause) {
        toast({
          message: t("Not sent yet"),
          detail:
            cause instanceof Error
              ? cause.message
              : t(
                  "Your answers are saved here. Check your connection and submit again.",
                ),
          tone: "warn",
        });
        throw cause;
      }
    });
  };

  const index = STEPS.findIndex((s) => s.key === step);

  const next = () => {
    const n = STEPS[Math.min(STEPS.length - 1, index + 1)];
    setStep(n.key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => {
    const p = STEPS[Math.max(0, index - 1)];
    setStep(p.key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const result = monthResult(entry);

  return (
    <CeraProvider
      scope={{
        audience: "supplier",
        workspaceId: workspace.id,
        month,
        // A file was filled into a month: bring the supplier to the readings, where the figures sit in green.
        onApplied: (m, focus) => {
          invalidateWorkspaceData();
          if (m !== month) setMonth(m);
          setStep("monthly");
          // …and to the part of the form that took most of it, which lights for a moment.
          if (focus) requestFocus(focus);
        },
      }}
    >
      <Shell cera>
        {/* ── Who is asking, and for what ─────────────────────── */}
        <div className="mb-5">
          <span className="font-pixel text-[11px] uppercase tracking-[0.18em] text-black/40">
            {t("Monthly data request")}
          </span>
          <h1 className="mt-2 font-[family-name:var(--font-plex)] text-3xl font-light tracking-tight text-[#111]">
            {monthNameLong(month)}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-black/50">
            {t(
              "For {product} produced at {installation} — everything below is about this one month.",
              {
                product: t(workspace.productName),
                installation: workspace.installationName,
              },
            )}
          </p>
        </div>

        {linkSaveError && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-[#b45309]/20 bg-[#fffbeb] p-4 text-sm text-[#b45309]"
          >
            {linkSaveError} {t("Please keep this page open while we retry.")}
          </p>
        )}

        <fieldset
          disabled={submit.state === "saving"}
          aria-busy={submit.state === "saving"}
          className="min-w-0"
        >
          <Stepper step={index} onGoto={(i) => setStep(STEPS[i].key)} />

          {readOnly && (
            <div className="mt-5">
              <Note>
                <span className="inline-flex items-center gap-2">
                  <Check size={14} strokeWidth={2} />{" "}
                  {t(
                    "{month} is submitted and read-only. Ask the exporter to reopen it if something was wrong.",
                    { month: monthNameLong(month) },
                  )}
                </span>
              </Note>
            </div>
          )}

          {step !== "overview" && step !== "check" && step !== "sign" && (
            <div className="mt-4">
              <EnglishOnlyNotice />
            </div>
          )}

          <div key={step} className="ct-enter mt-6">
            {step === "overview" && (
              <Overview
                req={req}
                month={month}
                months={months}
                sentMonths={sentMonths}
                onMonth={setMonth}
                previousMonth={previousMonth}
                carried={carried}
                onCarry={carryOver}
                onClear={clearForm}
                readOnly={readOnly}
                notManufactured={Boolean(entry.notManufactured)}
                submission={submission}
                revisionAreas={revisionAreas}
                onGotoRevision={gotoRevision}
              />
            )}

            {step === "mmd" && (
              <MmdStep
                value={mmd}
                onChange={setMmdSynced}
                readOnly={readOnly}
                cnCode={workspace.cnCode}
              />
            )}
            {step === "monthly" && (
              <div className="space-y-5">
                <AiFillRunBanner
                  scope={`ws:${workspace.id}`}
                  month={month}
                  onPickMonth={setMonth}
                  scroll={false}
                />
                <MonthlyStep
                  workspaceId={workspace.id}
                  entry={entry}
                  patch={patch}
                  patchFuel={patchFuel}
                  readOnly={readOnly}
                />
              </div>
            )}
            {step === "documents" && (
              <div className="space-y-6">
                <DocumentsStep
                  workspaceId={workspace.id}
                  workspace={workspace}
                  entry={entry}
                  onChange={onDocumentsChanged}
                  onEntryChange={patch}
                  audience="supplier"
                  uploadedBy={t("Supplier (via Smart Link)")}
                />
              </div>
            )}
            {step === "check" && report && (
              <CheckStep
                report={report}
                onGoto={goto}
                result={result}
                production={entry.productionTonnes}
                indirectCounts={requiresIndirect}
              />
            )}
            {step === "sign" && (
              <SignStep
                workspaceName={workspace.installationName}
                fullName={fullName}
                role={role}
                confirmed={confirmed}
                onFullName={setFullName}
                onRole={setRole}
                onConfirmed={setConfirmed}
                history={authorisationHistory(submission)}
                readOnly={readOnly}
              />
            )}
          </div>

          {/* ── Nav ────────────────────────────────────────────── */}
          <div className="sticky bottom-0 z-30 -mx-6 mt-7 flex items-center justify-between gap-3 border-t border-black/[0.06] bg-[#f5f4f0]/95 px-6 py-4 backdrop-blur">
            <div className="flex items-center gap-3">
              {index > 0 ? (
                <Button variant="ghost" size="sm" onClick={back}>
                  <ArrowLeft size={14} strokeWidth={1.5} /> {t("Back")}
                </Button>
              ) : (
                <span />
              )}
              {/* On a narrow phone the line of text would push Continue off the screen; the fields save either way. */}
              {!readOnly && index > 0 && index < 6 && (
                <AutoSaveBadge
                  status={
                    linkSaveError
                      ? "error"
                      : documentsPending
                        ? "saving"
                        : autosave.status
                  }
                  savedAt={autosave.savedAt}
                  className="hidden min-[430px]:inline-flex"
                />
              )}
            </div>

            {step === "sign" ? (
              <SaveButton
                state={submit.state}
                onClick={doSubmit}
                disabled={!canSign || readOnly}
                idleLabel={t("Submit {month}", { month: monthNameLong(month) })}
                savingLabel={t("Submitting…")}
                savedLabel={t("Submitted")}
              />
            ) : step === "overview" && readOnly ? (
              /* THE MONTH IS SENT, SO "START" WOULD BE A LIE. There is nothing to
             start: every field behind this button is fixed. The one thing the
             plant can still do about a mistake it has just spotted is ask for
             the month back, so that is what the button offers — and it is a
             request, not a key. */
              <SaveButton
                state={askEdit.state}
                onClick={() => setEditOpen(true)}
                disabled={submission?.editRequest?.state === "pending"}
                icon={<PenLine size={14} strokeWidth={1.5} />}
                idleLabel={
                  submission?.editRequest?.state === "pending"
                    ? t("Edit requested")
                    : t("Request an edit")
                }
                savingLabel={t("Sending…")}
                savedLabel={t("Edit requested")}
              />
            ) : (
              <Button onClick={next}>
                {step === "overview" ? t("Start") : t("Continue")}{" "}
                <ArrowRight size={15} strokeWidth={1.5} />
              </Button>
            )}
          </div>
        </fieldset>

        {/* ── Asking for the month back ─────────────────────────
          A reason is required. "Please reopen March" tells the exporter
          nothing they can act on, and the request they are answering is the
          only thing they will see. */}
        <Modal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          eyebrow={t("Submitted month")}
          title={t("Ask to reopen {month}", { month: monthNameLong(month) })}
          lead={t(
            "It goes to the exporter as a request. They decide — nothing is unlocked until they say yes.",
          )}
          width="max-w-lg"
          footer={
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditOpen(false)}
              >
                {t("Cancel")}
              </Button>
              <Button
                size="sm"
                disabled={!editReason.trim()}
                onClick={sendEditRequest}
              >
                {t("Send the request")}
              </Button>
            </>
          }
        >
          <Field
            label={t("What needs changing")}
            hint={t(
              "Name the figure and what is wrong with it — this is all they will see.",
            )}
          >
            <textarea
              className={cn(inputClass, "min-h-[110px] resize-y py-2.5")}
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder={t(
                "The February gas invoice arrived after we submitted. The quantity should be 41,200 m³, not 38,000.",
              )}
            />
          </Field>
        </Modal>
      </Shell>
    </CeraProvider>
  );
}

/* ── Stepper ──────────────────────────────────────────────────
   Bars rather than numbered circles: eight circles on a 375px phone is either
   eight unreadable labels or eight anonymous dots. A bar per step with the
   current one named underneath says where you are and how much is left in the
   width that is actually available. */
function Stepper({
  step,
  onGoto,
}: {
  step: number;
  onGoto: (i: number) => void;
}) {
  const t = useT();
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.12em] text-black/40">
          {t("Step {n} of {total}", { n: step + 1, total: STEPS.length })}
        </span>
        <span className="font-pixel text-[11px] uppercase tracking-[0.16em] text-black/65">
          {t(STEPS[step].label)}
        </span>
      </div>
      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => onGoto(i)}
            aria-label={t(s.label)}
            aria-current={i === step ? "step" : undefined}
            className="min-w-0 flex-1"
            title={t(s.label)}
          >
            <span
              className={cn(
                "block h-1 rounded-full transition-colors",
                i <= step ? "bg-[#111]" : "bg-black/[0.1]",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Step 0 · Overview ────────────────────────────────────────
   THE FIRST SCREEN ANSWERS FOUR QUESTIONS, in the order they occur to somebody
   who has just clicked a link from an email: who is this, what do they want,
   which plant is it about, and how long will it take. The old flow answered
   none of them — it opened on a production tonnage field. */
/* "Have the documents already?" — one button. It opens Cera with Smart upload switched on, so the file is read, checked and
   filled in there (a popup on a computer, the full screen on a phone). Nothing is filed until the supplier confirms. */
function SmartUploadCard() {
  const t = useT();
  const { openWithUpload } = useCera();
  return (
    <button
      type="button"
      onClick={openWithUpload}
      className="group flex w-full items-center gap-4 rounded-2xl border border-black/[0.08] bg-white px-5 py-4 text-left transition-colors hover:border-black/25 hover:bg-[#fafaf8]"
    >
      <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-[#f0eee8]">
        <CeraMark className="h-[22px] w-auto" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] uppercase tracking-[0.1em] text-black/40">
          {t("Have the documents already?")}
        </span>
        <span className="mt-1 block text-[15px] text-black/85">
          {t("Add documents & auto-fill")}
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-relaxed text-black/50">
          {t(
            "Cera reads a file and fills the form. You check every figure before it is saved — Cera can make mistakes.",
          )}
        </span>
      </span>
      <ArrowRight
        size={16}
        strokeWidth={1.5}
        className="flex-none text-black/30 transition-transform group-hover:translate-x-0.5 group-hover:text-black/60"
      />
    </button>
  );
}

function Overview({
  req,
  month,
  months,
  sentMonths,
  onMonth,
  previousMonth,
  carried,
  onCarry,
  onClear,
  readOnly,
  notManufactured,
  submission,
  revisionAreas,
  onGotoRevision,
}: {
  req: WorkspaceRequest;
  month: string;
  months: string[];
  /** months the exporter has sent — the only ones that can be opened */
  sentMonths: Set<string>;
  onMonth: (m: string) => void;
  previousMonth: string | null;
  carried: boolean;
  onCarry: () => "copied" | "empty";
  onClear: () => void;
  readOnly: boolean;
  /** the exporter recorded that nothing was made this month */
  notManufactured: boolean;
  submission: MonthSubmission | null;
  revisionAreas: RevisionArea[];
  onGotoRevision: (a: RevisionArea) => void;
  /** PROTOTYPE: files picked on the overview — the host reads them in the Documents step */
}) {
  const t = useT();
  const { workspace } = req;
  const [cleared, flashCleared] = useFlash();
  /* CLEARING IS THE ONE DESTRUCTIVE CONTROL ON THIS PAGE, and it sits two
     inches from the one that fills the form in. So it arms first and acts
     second: the first press says what the second one will do, and a press
     that was not meant lapses on its own rather than needing an undo the
     form does not have. */
  const [armed, setArmed] = React.useState(false);
  React.useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(t);
  }, [armed]);
  /* Copying answers on the button too — see `carryOver`. Two outcomes, two
     labels, one place to read them. */
  const [copyResult, setCopyResult] = React.useState<"copied" | "empty" | null>(
    null,
  );
  const [copyFlash, fireCopyFlash] = useFlash(2600);
  React.useEffect(() => {
    if (!copyFlash) setCopyResult(null);
  }, [copyFlash]);

  return (
    <div className="space-y-5">
      {/* PROTOTYPE — LESS TO READ BEFORE "START". Who this is for and the two
          facts needed before typing stay visible; the reasons behind the
          request fold away under "Why this is asked", one tap from view. The
          separate "You are answering for" card is merged into this one. */}
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <Building2
            size={16}
            strokeWidth={1.5}
            className="mt-0.5 flex-none text-black/35"
          />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.1em] text-black/40">
              {t("You are answering for")}
            </div>
            <div className="mt-1 text-[15px] text-black/85">
              {workspace.installationName}
            </div>
            <div className="mt-1 font-mono text-[11.5px] text-black/45">
              {t(workspace.productName)} · CN {workspace.cnCode || "—"} ·{" "}
              {workspace.year}
            </div>
          </div>
        </div>

        <details className="group mt-3">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[12.5px] text-black/50 hover:text-black/80 [&::-webkit-details-marker]:hidden">
            <ChevronDown
              size={13}
              strokeWidth={1.5}
              className="transition-transform group-open:rotate-180"
            />
            {t("Why this is asked")}
          </summary>
          <p className="mt-2 text-[13px] leading-relaxed text-black/60">
            {t(
              "Your customer exports this good to the EU. Under CBAM the importer must state the CO₂ embedded in every tonne they bring in, and that figure can only come from the plant that made it. These twelve monthly requests collect it.",
            )}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-black/60">
            {t(
              "If it is not reported, the importer is not let off — they fall back to a default set high enough that real data is nearly always cheaper. So what you enter here has a price attached, in both directions.",
            )}
          </p>
          <p className="mt-2 font-mono text-[11.5px] text-black/40">
            {workspace.installationId} ·{" "}
            {t(routeLabel(workspace.productionRoute))}
          </p>
        </details>

        <div className="mt-3 space-y-2 border-t border-black/[0.06] pt-3">
          <EnglishOnlyLine />
          <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-black/45">
            <ShieldCheck
              size={14}
              strokeWidth={1.5}
              className="mt-[2px] flex-none text-black/30"
            />
            <span className="min-w-0">
              {activeLinkSession() ? (
                <>
                  <strong className="font-medium text-black/70">
                    {t("Saved as you go.")}
                  </strong>{" "}
                  {t(
                    "Every answer is saved to Certrace for the company that sent you this link — you can close this page and come back to it from any device.",
                  )}
                </>
              ) : (
                <>
                  <strong className="font-medium text-black/70">
                    {t("Nothing is sent yet.")}
                  </strong>{" "}
                  {t(
                    "Every answer stays in this browser until Certrace’s hosted service is connected.",
                  )}
                </>
              )}
            </span>
          </p>
        </div>
      </Card>

      {/* ── WHAT CAME BACK, AND WHERE IT IS ───────────────────
          Directly under the card explaining why the form exists, because on a
          month that has been sent back that is the reader's actual question —
          not "what is CBAM" but "what did they not accept". Every line names a
          place in the flow, and the button walks to the first of them: a list
          of complaints with no route to the fields they are about is how the
          same figure gets changed twice and the right one never does. */}
      {submission?.state === "changes_requested" && (
        <Card className="border-[rgba(60,122,203,0.35)] bg-[#eff6ff] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Flag size={14} strokeWidth={1.5} className="text-[#1d4ed8]" />
            <span className="font-pixel text-[10px] uppercase tracking-[0.16em] text-[#1d4ed8]">
              {t("Sent back for revision")}
              {submission.revisionRound && submission.revisionRound > 1
                ? ` · ${t("round {n}", { n: submission.revisionRound })}`
                : ""}
            </span>
          </div>

          {submission.revisionNote && (
            <p className="mt-3 rounded-lg border border-[rgba(60,122,203,0.2)] bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-black/70">
              <strong className="font-medium text-black/85">
                {t("They wrote:")}
              </strong>{" "}
              {submission.revisionNote}
            </p>
          )}

          {revisionAreas.length > 0 ? (
            <>
              <p className="mt-4 text-[12px] uppercase tracking-[0.1em] text-[#1d4ed8]/70">
                {revisionAreas.length === 1
                  ? t("1 part needs another look")
                  : t("{n} parts need another look", {
                      n: revisionAreas.length,
                    })}
              </p>
              <ul className="mt-2 space-y-1.5">
                {revisionAreas.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => onGotoRevision(a)}
                      className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/70"
                    >
                      <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-[#3C7ACB]" />
                      <span className="min-w-0">
                        <span className="block text-[13px] text-black/80">
                          {a.label}
                        </span>
                        <span className="mt-0.5 block text-[12px] leading-relaxed text-black/45">
                          {a.hint}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => onGotoRevision(revisionAreas[0])}
                >
                  {t("Go to the first thing to fix")}{" "}
                  <ArrowRight size={13} strokeWidth={1.5} />
                </Button>
                <span className="text-[12px] leading-relaxed text-black/50">
                  {t(
                    "Each one is outlined in blue on its own screen, and stays outlined after you have answered it.",
                  )}
                </span>
              </div>
            </>
          ) : (
            <p className="mt-3 text-[12.5px] leading-relaxed text-black/55">
              {t(
                "No particular section was named — read the note above and work through the whole month again.",
              )}
            </p>
          )}
        </Card>
      )}

      <Card className="p-5">
        <div className="text-[10px] uppercase tracking-[0.1em] text-black/40">
          {t("What you will be asked")}
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-black/60">
          {t(
            "5 steps — methodology, monthly data, documents, then check and sign. Everything saves as you type.",
          )}
        </p>
        <details className="group mt-2">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[12.5px] text-black/50 hover:text-black/80 [&::-webkit-details-marker]:hidden">
            <ChevronDown
              size={13}
              strokeWidth={1.5}
              className="transition-transform group-open:rotate-180"
            />
            {t("See the steps")}
          </summary>
          <ol className="mt-3 space-y-3">
            {[
              [
                "Methodology",
                "Which processes these figures cover, which meters they come off, and anything you could not measure.",
              ],
              [
                "Monthly data",
                "This month's production, the fuel burned, the electricity drawn and any process emissions.",
              ],
              ["Documents", "The invoices and logs behind the figures."],
              [
                "Check and sign",
                "A quality check runs over everything, then you confirm it is accurate.",
              ],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-3">
                <span className="grid h-6 w-6 flex-none place-items-center rounded-lg bg-[#f0eee8] font-mono text-[10px] text-black/50">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] text-black/75">
                    {t(title)}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-relaxed text-black/45">
                    {t(body)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-4 border-t border-black/[0.06] pt-3 text-[12px] leading-relaxed text-black/45">
            {t(
              "Everything saves as you type, so you can leave and come back on this machine. Nothing is submitted until you sign on the last step.",
            )}
          </p>
        </details>
      </Card>

      {/* PROTOTYPE: the shortcut for a supplier who already has the paperwork —
          drop it here, and the Documents step reads it and fills the form. */}
      {!readOnly && <SmartUploadCard />}

      {/* ── Which month ──────────────────────────────────────
          GONE ONCE THE MONTH IS SENT. A picker on a submitted month is an
          invitation to keep working, and there is nothing left to work on: a
          switch from here would silently move the reader off the month they
          came to look at and onto a live one, under a heading that still says
          the old name. What replaces it is the state of the month and the one
          action still available on it — asking for it back. */}
      {readOnly ? (
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <LockKeyhole
              size={16}
              strokeWidth={1.5}
              className="mt-0.5 flex-none text-black/35"
            />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.1em] text-black/40">
                {t("This month is closed")}
              </div>
              <div className="mt-1 text-[15px] text-black/85">
                {notManufactured
                  ? t("The exporter recorded no production in {month}.", {
                      month: monthNameLong(month),
                    })
                  : t("{month} has been submitted.", {
                      month: monthNameLong(month),
                    })}
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-black/50">
                {notManufactured
                  ? t(
                      "Nothing is needed from you for this month. If the plant did produce, ask the exporter to reopen it — the button at the foot of this page sends the request, and they decide.",
                    )
                  : t(
                      "Nothing here can be changed. If a figure was wrong, ask the exporter to reopen it — the button at the foot of this page sends the request, and they decide.",
                    )}
              </p>
              {submission?.editRequest?.state === "pending" && (
                <p
                  className={cn(
                    "mt-3 inline-flex rounded-full border px-3 py-1 text-[11.5px]",
                    REVISION_CHIP,
                  )}
                >
                  {t("Edit requested — waiting on the exporter.")}
                </p>
              )}
              {submission?.editRequest?.state === "rejected" && (
                <p className="mt-3 inline-flex rounded-full border border-[#fecaca] bg-[#fef2f2] px-3 py-1 text-[11.5px] text-[#b91c1c]">
                  {t("They declined to reopen this month.")}
                </p>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <div className="text-[10px] uppercase tracking-[0.1em] text-black/40">
            {t("Which month")}
          </div>
          <div className="mt-3 sm:w-72">
            <Field
              label={t("Month")}
              hint={t(
                "Only the months the exporter has sent you can be opened.",
              )}
            >
              <Select
                value={month}
                onChange={onMonth}
                options={months.map((m) => {
                  const open = sentMonths.has(m) || m === month;
                  return {
                    value: m,
                    label: monthNameLong(m),
                    disabled: !open,
                    hint: open ? undefined : "Not sent yet",
                  };
                })}
                ariaLabel={t("Month")}
              />
            </Field>
          </div>

          {/* THE COPY CONTROL ONLY EXISTS FROM THE SECOND MONTH. In January there
              is nothing to copy, and a disabled control with an explanation is
              still something to read and decide about. */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/[0.06] pt-4">
            {previousMonth && (
              /* Width-stable through the swap, and it answers where it was
                 pressed — including the case where there was nothing to copy,
                 which used to arrive as a warning toast in the corner about a
                 button in the middle of the page. */
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setCopyResult(onCarry());
                  fireCopyFlash();
                }}
                className={cn(
                  "min-w-[13rem]",
                  copyFlash &&
                    copyResult === "copied" &&
                    "border-[rgba(5,150,105,0.35)] bg-[#ecfdf5] text-[#047857] hover:bg-[#ecfdf5] hover:text-[#047857]",
                  copyFlash &&
                    copyResult === "empty" &&
                    "border-[#fde68a] bg-[#fffbeb] text-[#b45309] hover:bg-[#fffbeb] hover:text-[#b45309]",
                )}
              >
                {copyFlash && copyResult === "copied" ? (
                  <Check size={13} strokeWidth={2} className="ct-confirm" />
                ) : copyFlash && copyResult === "empty" ? (
                  <TriangleAlert size={13} strokeWidth={1.5} />
                ) : (
                  <Layers size={13} strokeWidth={1.5} />
                )}
                {copyFlash && copyResult === "copied"
                  ? t("Copied from {month}", {
                      month: monthNameLong(previousMonth),
                    })
                  : copyFlash && copyResult === "empty"
                    ? t("{month} is empty", {
                        month: monthNameLong(previousMonth),
                      })
                    : carried
                      ? t("Re-copy from {month}", {
                          month: monthNameLong(previousMonth),
                        })
                      : t("Start from {month}", {
                          month: monthNameLong(previousMonth),
                        })}
              </Button>
            )}
            {/* TWO PRESSES. See `armed` above — the first states what the
                second will do, in the button itself. */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (!armed) {
                  setArmed(true);
                  return;
                }
                setArmed(false);
                onClear();
                flashCleared();
              }}
              className={cn(
                "min-w-[11rem]",
                armed &&
                  "bg-[#fffbeb] text-[#b45309] hover:bg-[#fffbeb] hover:text-[#b45309]",
                cleared &&
                  "bg-[#ecfdf5] text-[#047857] hover:bg-[#ecfdf5] hover:text-[#047857]",
              )}
            >
              {cleared ? (
                <Check size={13} strokeWidth={2} className="ct-confirm" />
              ) : armed ? (
                <TriangleAlert size={13} strokeWidth={1.5} />
              ) : (
                <Eraser size={13} strokeWidth={1.5} />
              )}
              {cleared
                ? t("Form cleared")
                : armed
                  ? t("Press again to clear")
                  : t("Clear the form")}
            </Button>
            <p className="mt-1 w-full text-[11.5px] leading-relaxed text-black/40">
              {previousMonth
                ? t(
                    "Copy starts from last month's figures. Clear empties this month only.",
                  )
                : t("First month of the year — nothing to copy from yet.")}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ── Step 5 · Check ──────────────────────────────────────────
   ONE QUESTION: IS EVERYTHING THERE YET? Not whether a figure is the right size
   — the exporter has the year beside it and the plant has no way to judge
   either — so there are no "out of range" or "unusual" groups. The step reads
   as the same contents list the exporter meets on the readiness page: what the
   month is made of, what is filled in, and a tag on what is not. Every row is
   a way back to its field, which rings for a few seconds when it is reached.

   The percentage is labelled COMPLETENESS, not quality. A number next to a set
   of emissions figures will be read as "87% accurate" by somebody eventually,
   and the product has never claimed to know that. */
function CheckStep({
  report,
  onGoto,
  result,
  production,
  indirectCounts,
}: {
  report: NonNullable<ReturnType<typeof runMonthQualityCheck>>;
  onGoto: (row: ContentRow) => void;
  result: ReturnType<typeof monthResult>;
  production: number;
  /** false for the goods of Annex II — steel, aluminium, hydrogen — whose electricity is not part of their figure */
  indirectCounts: boolean;
}) {
  const t = useT();
  const all = report.contents.flatMap((s) => s.rows);
  const todo = all.filter((r) => r.state !== "ready").length;
  const missing = report.mandatory.length;
  // Direct emissions only for the goods of Annex II (steel, aluminium, hydrogen): the electricity they draw is not part of their figure.
  const intensity =
    production > 0
      ? (result.directTCO2 + (indirectCounts ? result.indirectTCO2 : 0)) /
        production
      : null;
  const extra = todo - missing;

  return (
    <div className="space-y-5">
      <Card
        className={cn(
          "p-5",
          report.canSubmit
            ? "border-[rgba(5,150,105,0.25)] bg-[#ecfdf5]"
            : "border-[#fde68a] bg-[#fffbeb]",
        )}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex-none">
            {report.canSubmit ? (
              <CheckCircle2
                size={20}
                strokeWidth={1.5}
                className="text-[#047857]"
              />
            ) : (
              <TriangleAlert
                size={20}
                strokeWidth={1.5}
                className="text-[#b45309]"
              />
            )}
          </span>
          <div className="min-w-0">
            <p
              className={cn(
                "text-[14px]",
                report.canSubmit ? "text-[#047857]" : "text-[#b45309]",
              )}
            >
              {report.canSubmit
                ? extra === 0
                  ? t("Everything is filled in. Carry on to sign it off.")
                  : extra === 1
                    ? t("Ready to submit. 1 more thing is worth adding.")
                    : t("Ready to submit. {n} more things are worth adding.", {
                        n: extra,
                      })
                : missing === 1
                  ? t(
                      "1 thing must be answered before this month can be submitted.",
                    )
                  : t(
                      "{n} things must be answered before this month can be submitted.",
                      { n: missing },
                    )}
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-black/50">
              {t(
                "Completeness {score}%. This counts answered fields — it is not a judgement about whether the figures are right.",
                { score: report.score },
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* What the month adds up to, before they commit to it. */}
      <Card className="p-5">
        <div
          className={cn(
            "grid gap-4",
            indirectCounts ? "sm:grid-cols-4" : "sm:grid-cols-3",
          )}
        >
          <Summary label={t("Produced")} value={`${fmt(production, 2)} t`} />
          <Summary
            label={t("Direct CO₂")}
            value={`${fmt(result.directTCO2, 2)} tCO₂`}
          />
          {indirectCounts && (
            <Summary
              label={t("Electricity CO₂")}
              value={`${fmt(result.indirectTCO2, 2)} tCO₂`}
            />
          )}
          <Summary
            label={t("Per tonne")}
            value={intensity == null ? "—" : `${fmt(intensity, 4)} tCO₂e/t`}
          />
        </div>
      </Card>

      <ContentsBox
        report={report}
        onGoto={onGoto}
        title={t("This month’s data")}
        purpose={t(
          "Every part of the month, and whether it is filled in yet. Tap a row to go to it.",
        )}
      />
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.1em] text-black/40">
        {label}
      </div>
      <div className="mt-1 font-mono text-[15px] text-black/80">{value}</div>
    </div>
  );
}

/* ── Step 6 · The internal authorisation ──────────────────────
   NOT a signature-shaped box, and not called one. What this collects is the
   record of who inside the plant stood behind the figures — which is what a
   verifier asks for and what the month carries forward. The section is named
   for that rather than for the technology it is not: "local attestation" told
   the reader something about where the bytes live, which is the one thing
   about it they have no use for.

   Below it, the HISTORY: every time somebody pressed submit, with the minute it
   happened. The time is taken from the press itself (see `doSubmit`), not typed. */
function SignStep({
  workspaceName,
  fullName,
  role,
  confirmed,
  onFullName,
  onRole,
  onConfirmed,
  history,
  readOnly,
}: {
  workspaceName: string;
  fullName: string;
  role: string;
  confirmed: boolean;
  onFullName: (v: string) => void;
  onRole: (v: string) => void;
  onConfirmed: (v: boolean) => void;
  history: Attestation[];
  readOnly: boolean;
}) {
  const t = useT();
  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <span className="font-pixel text-[11px] uppercase tracking-[0.16em] text-black/40">
          {t("Internal authorisation")}
        </span>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t("Full name")}>
            <input
              className={inputClass}
              value={fullName}
              disabled={readOnly}
              onChange={(e) => onFullName(e.target.value)}
              placeholder={t("Somchai Prasert")}
            />
          </Field>
          <Field label={t("Role / title")}>
            <input
              className={inputClass}
              value={role}
              disabled={readOnly}
              onChange={(e) => onRole(e.target.value)}
              placeholder={t("Production Manager")}
            />
          </Field>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-black/[0.08] bg-[#faf9f7] px-4 py-3">
          <input
            type="checkbox"
            checked={confirmed}
            disabled={readOnly}
            onChange={(e) => onConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-none accent-[#111]"
          />
          <span className="text-[13px] leading-relaxed text-black/70">
            {t(
              "I confirm the information is accurate and complete to the best of my knowledge, and I’m authorised to submit it on behalf of {company}.",
              { company: workspaceName },
            )}
          </span>
        </label>
      </Card>

      <AuthorisationHistory history={history} />
    </div>
  );
}
