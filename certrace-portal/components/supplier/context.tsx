"use client";

/* Supplier portal — the brain. Holds the resolved request + all supplier state
   (values, docs, seats, profile, versions), persists to localStorage on change,
   and exposes the actions the views call. One provider so the hub-and-spoke
   views share state without prop-drilling or re-reading storage per view. */

import * as React from "react";
import {
  type SupplierRequest,
  type SectionKey,
  type SupplierSection,
  sectionsForRequest,
  fieldsForSection,
  fieldAppliesTo,
  fieldRequiredFor,
  valueKey,
  isOnceField,
  AUTO_FIELDS,
  verificationRequired,
} from "@/lib/supplier";
import { isComplexGood } from "@/lib/config";
import { precursorContribution } from "@/lib/precursors";
import { stampElectricityUnit } from "@/lib/cbam/electricity-migration";
import {
  type SupplierState,
  type SupplierProfile,
  type Seat,
  type SubmissionStatus,
  emptyState,
  loadState,
  saveState,
  saveProfileFor,
  pushEvent,
  uid,
} from "@/lib/supplier-store";
import {
  assessFreshness,
  canReuse,
  defaultAccessPolicy,
  getRecord,
  readRequestFromRecord,
  setReuseForOrg,
  setSectionAccess,
  writeSubmissionToRecord,
  ATTESTATION_STATEMENT,
  type AccessPolicy,
  type Audience,
  type StaleVerdict,
} from "@/lib/supplier-records";
import { runQualityCheck, type CheckResult } from "@/lib/ai-check";
import { useSaveLinkState, useSubmitLink } from "@/lib/links-query";
import { toast } from "@/components/toast";
import { useT } from "@/lib/i18n";

export type View = "landing" | "profile" | "overview" | "form" | "documents" | "sharing" | "team" | "check" | "submit" | "done";

export type DocFlag = { severity: "warning" | "revision"; message: string };
export type SaveStatus = "idle" | "saving" | "saved" | "offline";

/* A field the supplier needs to look at — either the AI flagged it in the last
   quality check, or the exporter unlocked it for a revision. Drives the stroke
   highlight + inline note on the questionnaire so the supplier is led straight
   to what needs changing instead of hunting for it. */
export type FieldFlag = {
  severity: "critical" | "warning" | "revision";
  kind: "missing" | "value";
  message: string;
};

type Ctx = {
  req: SupplierRequest;
  state: SupplierState;
  view: View;
  setView: (v: View) => void;

  sections: SupplierSection[];
  // values
  getValue: (fieldId: string, productId?: string) => string;
  setValue: (fieldId: string, productId: string | undefined, value: string) => void;
  isEditable: (key: string) => boolean;
  autoValue: (fieldId: string, productId?: string) => string | null;

  // documents (multi-file)
  addFiles: (docId: string, files: { name: string; size: number; dataUrl?: string }[]) => void;
  removeFile: (docId: string, index: number) => void;
  clearDoc: (docId: string) => void;
  isDocEditable: (docId: string) => boolean;

  // seats
  addSeat: (s: { name: string; email: string; department: string }) => void;
  removeSeat: (id: string) => void;
  toggleAssign: (seatId: string, section: SectionKey) => void;

  // profile
  saveProfile: (p: SupplierProfile) => void;
  hasSavedProfile: boolean;

  // completion
  sectionProgress: (section: SupplierSection) => { done: number; total: number; complete: boolean };
  overall: { done: number; total: number; pct: number };

  // submission
  runCheck: () => CheckResult;
  submit: (signedBy: string, role: string) => void;
  simulateRevision: () => void; // demo: exporter requests changes

  // "lead the supplier to the field" — flags + scroll-to-field focus
  flagged: Map<string, FieldFlag>;
  firstFlagKey: string | null;
  focusKey: string | null;
  focusField: (key: string) => void;
  clearFocus: () => void;
  focusRevision: () => void;

  // document flags + scroll-to-document focus (same idea, for the upload page)
  flaggedDocs: Map<string, DocFlag>;
  focusDocId: string | null;
  focusDoc: (docId: string) => void;
  clearDocFocus: () => void;

  // run-check gating — never burn an AI run on incomplete data
  hasAnyInput: boolean;
  requiredComplete: boolean;
  firstIncompleteRequired: string | null;
  missingRequiredCount: number;
  totalRequiredCount: number;
  goToCheck: () => void;

  // carried-forward data (the supplier's own record) + its freshness verdict
  carriedKeys: Set<string>;
  carriedVerdict: StaleVerdict | null;
  carriedPending: boolean;
  confirmCarried: () => void;

  // who may see what — the supplier's own policy on their record
  access: AccessPolicy;
  setAccess: (section: SectionKey, audience: Audience, allowed: boolean) => void;
  reuseAllowed: boolean;
  setReuse: (allowed: boolean) => void;

  // autosave status (shown in the header)
  saveStatus: SaveStatus;
};

const SupplierCtx = React.createContext<Ctx | null>(null);
export const useSupplier = () => {
  const v = React.useContext(SupplierCtx);
  if (!v) throw new Error("useSupplier must be used inside <SupplierProvider>");
  return v;
};

export function SupplierProvider({
  req,
  initialState,
  children,
}: {
  req: SupplierRequest;
  /* Server-backed mode: the state resolved from the API for a real Smart Link.
     When present it IS the source of truth — no localStorage read, no
     carried-forward pre-fill (that reads a local record a real supplier has
     none of) — and every change autosaves back to the server. Absent = the
     localStorage demo path, unchanged. */
  initialState?: SupplierState;
  children: React.ReactNode;
}) {
  const t = useT();
  const apiMode = initialState != null;
  const saveMutation = useSaveLinkState(req.token);
  const submitMutation = useSubmitLink(req.token);
  // Start from an empty state on BOTH server and client so the first render
  // matches (no hydration mismatch); the mount effect below loads the real
  // localStorage state right after. In API mode the server state seeds it
  // directly — it arrived on the client, so there is no SSR to mismatch.
  const [state, setState] = React.useState<SupplierState>(() => initialState ?? emptyState(req.token));
  const [view, setView] = React.useState<View>("landing");
  const sections = React.useMemo(() => sectionsForRequest(req), [req]);

  // hydrate from storage once on mount (avoids SSR/client mismatch). In API mode
  // the state is already the server's, so treat it as hydrated from the start.
  const hydrated = React.useRef(apiMode);
  React.useEffect(() => {
    if (apiMode) {
      // Server state already seeded; just land on the right view for it.
      if (initialState.status === "submitted") setView("done");
      else if (initialState.status === "revision_requested") setView("overview");
      return;
    }
    if (hydrated.current) return;
    hydrated.current = true;
    const loaded = loadState(req.token);

    /* First time this Smart Link is opened, the supplier's OWN record answers
       most of it already (lib/supplier-records.ts). Pull the slice this request
       asks for — their installation, and the goods it covers — so a returning
       mill confirms figures instead of retyping them. Nothing is carried when
       they've told us not to reuse their data for this exporter. */
    if (loaded.status === "new" && loaded.versions.length === 0) {
      const record = getRecord(req.supplierName);
      const read = canReuse(record, req.exporterName) ? readRequestFromRecord(req, record) : null;
      if (read && read.carriedKeys.length > 0) {
        const seeded: SupplierState = {
          ...loaded,
          values: { ...read.values, ...loaded.values }, // anything already typed wins
          docs: { ...read.docs, ...loaded.docs },
          profile: record?.profile ?? loaded.profile,
          profileSaved: Boolean(record?.profile) || loaded.profileSaved,
          carried: {
            keys: read.carriedKeys,
            docIds: Object.keys(read.docs),
            sourceAt: read.sourceAt,
            sourcePeriods: read.sourcePeriods,
            acknowledgedAt: null,
          },
        };
        setState(
          pushEvent(
            seeded,
            "carried_forward",
            `${read.carriedKeys.length} field${read.carriedKeys.length === 1 ? "" : "s"} pre-filled from this company's saved record — pending confirmation for ${req.period}`,
          ),
        );
        return;
      }
    }

    setState(loaded);
    // returning supplier with a submitted/revision request lands on the hub
    if (loaded.status === "submitted") setView("done");
    else if (loaded.status === "revision_requested") setView("overview");
    // Runs on the resolved request; apiMode/initialState are fixed for a given
    // link, so re-running on their identity is neither wanted nor possible.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req]);

  // persist on every change + reflect a cloud-style autosave status. We always
  // write to localStorage; the status copy mirrors "synced when online, not
  // synced when offline" so the supplier can trust their progress is kept.
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const firstPersist = React.useRef(true);
  React.useEffect(() => {
    if (!hydrated.current) return;
    if (apiMode) {
      // Once submitted the form is read-only; the submit POST is the only writer
      // of that state, so there is nothing to autosave.
      if (state.status === "submitted") return;
      // Skip the first run: that state IS what we just resolved, re-PUTting it
      // on open would be a pointless write.
      if (firstPersist.current) {
        firstPersist.current = false;
        return;
      }
      // Debounced so a burst of keystrokes is one request. The mutation carries
      // durability (retry + offline-pause); `saveStatus` is driven off it below.
      const id = setTimeout(() => saveMutation.mutate(state), 800);
      return () => clearTimeout(id);
    }
    saveState(state);
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setSaveStatus("offline");
      return;
    }
    setSaveStatus("saving");
    const t = setTimeout(() => setSaveStatus("saved"), 600);
    return () => clearTimeout(t);
    // Persist fires on state change only; apiMode/req.token/mutate are fixed per
    // link (mutate is referentially stable), so re-running on them is unwanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // API mode: mirror the autosave mutation's lifecycle into the header status.
  // isPaused = queued while offline (networkMode 'online'), will resume on
  // reconnect; isError = retries exhausted. Demo mode drives status itself above.
  React.useEffect(() => {
    if (!apiMode) return;
    if (saveMutation.isPaused || saveMutation.isError) setSaveStatus("offline");
    else if (saveMutation.isPending) setSaveStatus("saving");
    else if (saveMutation.isSuccess) setSaveStatus("saved");
  }, [apiMode, saveMutation.isPaused, saveMutation.isError, saveMutation.isPending, saveMutation.isSuccess]);

  // React to the browser going on/offline so the indicator stays honest.
  React.useEffect(() => {
    const goOnline = () => setSaveStatus("saved");
    const goOffline = () => setSaveStatus("offline");
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  /* ── editability (revision lock) ─────────────────────────── */
  const isEditable = React.useCallback(
    (key: string) => {
      if (state.status === "submitted") return false;
      if (state.status === "revision_requested" && state.unlocked.length > 0) return state.unlocked.includes(key);
      return true; // new / draft / in_check
    },
    [state.status, state.unlocked],
  );

  /* ── values ──────────────────────────────────────────────── */
  const autoValue = React.useCallback(
    (fieldId: string, productId?: string): string | null => {
      const rp = req.products.find((p) => p.product.id === productId);
      switch (fieldId) {
        case "cn-code":
          return rp ? rp.product.cnCode : null;
        case "goods-category":
          return rp ? `${rp.product.category} · ${rp.product.group}` : null;
        case "quantity":
          return rp ? `${rp.totalTonnes.toLocaleString("en-US")} t` : null;
        case "total-emissions": {
          if (!rp) return null;
          const d = Number(state.values[valueKey("direct-emissions", productId)] || "");
          const i = Number(state.values[valueKey("indirect-emissions", productId)] || "");
          if (Number.isNaN(d) && Number.isNaN(i)) return null;
          // Total embedded = own process + precursor contribution (complex goods)
          const prec = isComplexGood(rp.product) ? precursorContribution(state.values[valueKey("precursors", productId)]) : 0;
          return ((Number.isNaN(d) ? 0 : d) + (Number.isNaN(i) ? 0 : i) + prec).toFixed(2);
        }
        default:
          return null;
      }
    },
    [req.products, state.values],
  );

  const getValue = React.useCallback(
    (fieldId: string, productId?: string) => {
      if (AUTO_FIELDS.has(fieldId)) return autoValue(fieldId, productId) ?? "";
      return state.values[valueKey(fieldId, productId)] ?? "";
    },
    [state.values, autoValue],
  );

  const setValue = React.useCallback(
    (fieldId: string, productId: string | undefined, value: string) => {
      setState((s) => {
        const values = { ...s.values, [valueKey(fieldId, productId)]: value };
        /* Stamp the unit alongside the electricity figure. Every value written
           through this app is absolute MWh; an untagged value can then only be
           one collected before the unit change, which is exactly how
           lib/cbam/electricity-migration.ts recognises legacy data. */
        if (fieldId === "elec-consumed") Object.assign(values, stampElectricityUnit(productId));
        // keep total-emissions in sync when any component changes — own direct
        // + own indirect + precursor contribution for complex goods
        if (fieldId === "direct-emissions" || fieldId === "indirect-emissions" || fieldId === "precursors") {
          const d = Number(values[valueKey("direct-emissions", productId)] || "");
          const i = Number(values[valueKey("indirect-emissions", productId)] || "");
          const product = req.products.find((rp) => rp.product.id === productId)?.product;
          const prec = product && isComplexGood(product) ? precursorContribution(values[valueKey("precursors", productId)]) : 0;
          if (!Number.isNaN(d) || !Number.isNaN(i) || prec > 0) {
            values[valueKey("total-emissions", productId)] = ((Number.isNaN(d) ? 0 : d) + (Number.isNaN(i) ? 0 : i) + prec).toFixed(2);
          }
        }
        const status: SubmissionStatus = s.status === "new" ? "draft" : s.status;
        return { ...s, values, status };
      });
    },
    [req.products],
  );

  /* ── documents (multi-file) ──────────────────────────────── */
  const addFiles = React.useCallback(
    (docId: string, files: { name: string; size: number; dataUrl?: string }[]) => {
      if (files.length === 0) return;
      const label = req.documents.find((d) => d.id === docId)?.label ?? docId;
      setState((s) => {
        const existing = s.docs[docId]?.files ?? [];
        const merged = [...existing, ...files.map((f) => ({ name: f.name, size: f.size, dataUrl: f.dataUrl, addedAt: Date.now() }))];
        const next = {
          ...s,
          docs: { ...s.docs, [docId]: { id: docId, status: "uploaded" as const, files: merged } },
          status: (s.status === "new" ? "draft" : s.status) as SubmissionStatus,
        };
        return pushEvent(next, "doc_upload", `${files.length > 1 ? `${files.length} files` : files[0].name} attached to ${label}`);
      });
    },
    [req.documents],
  );
  const removeFile = React.useCallback(
    (docId: string, index: number) => {
      const label = req.documents.find((d) => d.id === docId)?.label ?? docId;
      setState((s) => {
        const removed = s.docs[docId]?.files[index];
        const files = (s.docs[docId]?.files ?? []).filter((_, i) => i !== index);
        const docs = { ...s.docs };
        if (files.length) docs[docId] = { id: docId, status: "uploaded", files };
        else delete docs[docId];
        const next = { ...s, docs };
        return removed ? pushEvent(next, "doc_remove", `${removed.name} removed from ${label}`) : next;
      });
    },
    [req.documents],
  );
  const clearDoc = React.useCallback((docId: string) => {
    setState((s) => {
      const docs = { ...s.docs };
      delete docs[docId];
      return { ...s, docs };
    });
  }, []);
  // During a revision the exporter's unlocked documents can be REPLACED, and
  // any document that was never attached can still be added — a supplier must
  // always be able to volunteer missing required evidence.
  const isDocEditable = React.useCallback(
    (docId: string) => {
      if (state.status === "submitted") return false;
      if (state.status === "revision_requested") {
        return state.unlockedDocs.includes(docId) || (state.docs[docId]?.status !== "uploaded");
      }
      return true;
    },
    [state.status, state.unlockedDocs, state.docs],
  );

  /* ── seats ───────────────────────────────────────────────── */
  const addSeat = React.useCallback((s: { name: string; email: string; department: string }) => {
    setState((prev) => ({ ...prev, seats: [...prev.seats, { id: uid(), invitedAt: Date.now(), sections: [], ...s }] }));
  }, []);
  const removeSeat = React.useCallback((id: string) => {
    setState((prev) => ({ ...prev, seats: prev.seats.filter((x) => x.id !== id) }));
  }, []);
  const toggleAssign = React.useCallback((seatId: string, section: SectionKey) => {
    setState((prev) => ({
      ...prev,
      seats: prev.seats.map((x) =>
        x.id === seatId
          ? { ...x, sections: x.sections.includes(section) ? x.sections.filter((s) => s !== section) : [...x.sections, section] }
          : x,
      ),
    }));
  }, []);

  /* ── profile ─────────────────────────────────────────────── */
  const saveProfile = React.useCallback(
    (p: SupplierProfile) => {
      // write installation values from the profile so the questionnaire pre-fills
      setState((s) => {
        const values = { ...s.values };
        values["inst-name"] = p.installationName || p.legalName;
        values["inst-country"] = p.country;
        values["inst-address"] = p.address;
        values["inst-unlocode"] = p.unlocode;
        values["inst-coords"] = p.coordinates;
        // production route applies per product
        for (const rp of req.products) values[valueKey("process-route", rp.product.id)] = p.route || values[valueKey("process-route", rp.product.id)] || "";
        return { ...s, values, profile: p, profileSaved: true, status: s.status === "new" ? "draft" : s.status };
      });
      saveProfileFor(req.supplierName, p);
    },
    [req.products, req.supplierName],
  );

  // Based on this request's own state (set after hydration) — avoids reading
  // global localStorage during render, which would mismatch on hydration.
  const hasSavedProfile = Boolean(state.profile);

  /* ── completion ──────────────────────────────────────────── */
  const sectionProgress = React.useCallback(
    (section: SupplierSection) => {
      if (section.scope === "docs") {
        const required = req.documents.filter((d) => d.required);
        const done = required.filter((d) => state.docs[d.id]?.status === "uploaded").length;
        return { done, total: required.length, complete: required.length > 0 && done === required.length };
      }
      const fields = fieldsForSection(req, section);
      let total = 0;
      let done = 0;
      for (const f of fields) {
        if (isOnceField(f.group)) {
          if (!f.required) continue;
          if (f.id === "verification" && !verificationRequired(req, state.values)) continue;
          total++;
          if (state.values[valueKey(f.id)]?.trim()) done++;
        } else {
          // only count a field against the goods it applies to & is required for
          for (const rp of req.products) {
            if (!fieldAppliesTo(f, rp.product) || !fieldRequiredFor(f, rp.product)) continue;
            total++;
            if (state.values[valueKey(f.id, rp.product.id)]?.trim()) done++;
          }
        }
      }
      return { done, total, complete: total > 0 && done === total };
    },
    [req, state.values, state.docs],
  );

  const overall = React.useMemo(() => {
    let done = 0;
    let total = 0;
    for (const sec of sections) {
      const p = sectionProgress(sec);
      done += p.done;
      total += p.total;
    }
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [sections, sectionProgress]);

  /* ── submission ──────────────────────────────────────────── */
  const runCheck = React.useCallback(() => {
    const result = runQualityCheck(req, state.values, state.docs);
    setState((s) => {
      const next = { ...s, lastCheck: result, status: (s.status === "submitted" ? s.status : "in_check") as SubmissionStatus };
      return pushEvent(next, "check_run", `AI quality check run — score ${result.score}, ${result.critical} critical, ${result.warnings} warning${result.warnings === 1 ? "" : "s"}`);
    });
    return result;
  }, [req, state.values, state.docs]);

  const submit = React.useCallback(
    (signedBy: string, role: string) => {
      const s = state;
      const result = s.lastCheck ?? runQualityCheck(req, s.values, s.docs);
      const n = (s.versions[s.versions.length - 1]?.n ?? 0) + 1;
      const version = {
        n,
        submittedAt: Date.now(),
        score: result.score,
        warnings: result.warnings,
        signedBy,
        signedRole: role,
        note: s.status === "revision_requested" ? s.revisionNote : undefined,
      };
      /* The signature is also the ATTESTATION — a named person, their role,
         the date, and the statement they agreed to, stored verbatim. Without
         it a submission is an anonymous spreadsheet and the first question at
         verification is "who says so?". Persisting it here means the record
         carries it forward to every future declaration, and the verifier
         dossier can show who stood behind each figure. */
      const attestation = {
        signatoryName: signedBy,
        signatoryRole: role,
        signedAt: new Date().toISOString().slice(0, 10),
        statement: ATTESTATION_STATEMENT,
      };
      const submitted: SupplierState = {
        ...s,
        status: "submitted",
        versions: [...s.versions, version],
        unlocked: [],
        unlockedDocs: [],
        revisionNote: "",
        attestation,
        // submitting IS the confirmation that carried figures still hold
        carried: s.carried ? { ...s.carried, acknowledgedAt: s.carried.acknowledgedAt ?? Date.now() } : null,
      };
      const trail = `Version ${n} signed by ${signedBy} (${role}) and submitted — score ${result.score}, ${result.warnings} warning${result.warnings === 1 ? "" : "s"}`;

      if (apiMode) {
        /* The server owns the evidence fields — the version number, its
           timestamp, the signer read off the attestation, the status. Send the
           PRE-submit state so the server appends the version (sending our
           optimistic one would double it), and reconcile with the authoritative
           blob it returns. Reflect the optimistic state now so the Done view
           renders without waiting on the round trip; the autosave effect skips
           it because status is already "submitted". */
        setState(pushEvent(submitted, "submit", trail));
        submitMutation.mutate(
          { state: s, attestation, check: result },
          {
            onSuccess: (server) => setState(server),
            // Retries exhausted: roll back to pre-submit so the Done view does
            // not show a "submitted" the server never received — they re-sign.
            onError: () => {
              setState(s);
              toast({ message: "Submission failed", detail: "We could not reach the server. Please try signing again.", tone: "err" });
            },
          },
        );
        return;
      }

      /* Demo path: no server, so distil the submission into the company's own
         local record. The declaration keeps the ask; the DATA now outlives it,
         ready to answer the next request from this or any other exporter. */
      writeSubmissionToRecord(req, submitted, {
        declId: req.declId,
        declName: req.declName,
        periodLabel: req.period,
        periodEnd: req.periodEnd,
        selfSupplied: req.selfSupplied,
      });
      setState(pushEvent(submitted, "submit", trail));
    },
    [req, state, apiMode, submitMutation],
  );

  // Demo only: simulate the exporter requesting a revision of specific fields and
  // a document re-upload, so both the field and the file-upload loops are shown.
  const simulateRevision = React.useCallback(() => {
    setState((s) => {
      const firstProduct = req.products[0]?.product.id;
      const unlocked = firstProduct
        ? [valueKey("direct-emissions", firstProduct), valueKey("method", firstProduct)]
        : [];
      const firstDoc = req.documents.find((d) => d.required)?.id;
      const note = "Please re-check the direct emissions figure for the main product and confirm whether actual or default data was used. Also re-upload the Mill Test Certificate — the copy attached was unreadable.";
      const next: SupplierState = {
        ...s,
        status: "revision_requested",
        unlocked,
        unlockedDocs: firstDoc ? [firstDoc] : [],
        revisionNote: note,
      };
      return pushEvent(next, "revision_requested", `${req.exporterName} requested a revision — "${note}"`);
    });
    setView("overview");
  }, [req.products, req.documents]);

  /* ── required-field completeness (gates the AI run) ──────────
     Never spend an AI run until every legally-required field has a value. */
  const requiredFieldKeys = React.useMemo(() => {
    const verifRequired = verificationRequired(req, state.values);
    const keys: string[] = [];
    for (const f of req.fields) {
      if (AUTO_FIELDS.has(f.id)) continue;
      // verification relaxes to optional when every good is on default values
      if (f.id === "verification" && !verifRequired) continue;
      if (isOnceField(f.group)) {
        if (f.required) keys.push(valueKey(f.id));
      } else {
        for (const rp of req.products) {
          if (fieldAppliesTo(f, rp.product) && fieldRequiredFor(f, rp.product)) keys.push(valueKey(f.id, rp.product.id));
        }
      }
    }
    return keys;
  }, [req, state.values]);
  const incompleteRequired = React.useMemo(
    () => requiredFieldKeys.filter((k) => !state.values[k]?.trim()),
    [requiredFieldKeys, state.values],
  );
  const firstIncompleteRequired = incompleteRequired[0] ?? null;
  const missingRequiredCount = incompleteRequired.length;
  const requiredComplete = missingRequiredCount === 0;
  const hasAnyInput = React.useMemo(
    () => Object.values(state.values).some((v) => v?.trim()) || Object.keys(state.docs).length > 0,
    [state.values, state.docs],
  );
  // Once the supplier tries to run the check with gaps, light up every gap.
  const [showRequiredGaps, setShowRequiredGaps] = React.useState(false);

  /* ── field flags + "lead me there" focus ─────────────────────
     During a revision the exporter's unlocked fields drive it; otherwise the
     last AI check (and, once a run is attempted, the required-field gaps) do.
     A "missing" flag clears itself once the field has a value. */
  const flagged = React.useMemo(() => {
    const m = new Map<string, FieldFlag>();
    if (state.status === "submitted") return m;

    if (state.status === "revision_requested") {
      for (const key of state.unlocked) {
        m.set(key, { severity: "revision", kind: "value", message: "The exporter asked you to review and revise this field." });
      }
      return m;
    }

    // pre-check nudge: every still-empty required field
    if (showRequiredGaps) {
      for (const key of requiredFieldKeys) {
        if (!state.values[key]?.trim()) {
          m.set(key, { severity: "warning", kind: "missing", message: `Required for ${req.regulationShort} — fill this in to run the quality check.` });
        }
      }
    }

    // AI findings layer on top (a more specific message wins)
    const c = state.lastCheck;
    if (c) {
      for (const f of c.findings) {
        if (f.severity === "pass" || !f.fieldId) continue;
        const key = valueKey(f.fieldId, f.productId);
        const kind: FieldFlag["kind"] = f.category === "Completeness" ? "missing" : "value";
        const message = f.fix ? `${f.detail} ${f.fix}` : f.detail;
        const prev = m.get(key);
        if (prev?.severity === "critical" && f.severity !== "critical") continue;
        m.set(key, { severity: f.severity, kind, message });
      }
    }
    return m;
  }, [state.lastCheck, state.status, state.unlocked, showRequiredGaps, requiredFieldKeys, state.values, req.regulationShort]);

  // First field still needing attention (a missing field that's now filled no
  // longer counts) — what "Jump to first issue" targets.
  const firstFlagKey = React.useMemo(() => {
    for (const [key, flag] of flagged) {
      if (flag.kind === "missing" && state.values[key]?.trim()) continue;
      return key;
    }
    return null;
  }, [flagged, state.values]);

  // Document flags — revision (blue) or a stale AI "not attached" finding (amber);
  // self-clearing once a file is attached.
  const flaggedDocs = React.useMemo(() => {
    const m = new Map<string, DocFlag>();
    if (state.status === "submitted") return m;
    if (state.status === "revision_requested") {
      for (const id of state.unlockedDocs) m.set(id, { severity: "revision", message: "The exporter asked you to update this document." });
      return m;
    }
    const c = state.lastCheck;
    if (c) {
      for (const f of c.findings) {
        if (f.severity === "pass" || !f.docId) continue;
        if (state.docs[f.docId]?.status === "uploaded") continue;
        m.set(f.docId, { severity: "warning", message: f.detail });
      }
    }
    return m;
  }, [state.lastCheck, state.status, state.unlockedDocs, state.docs]);

  const [focusKey, setFocusKey] = React.useState<string | null>(null);
  const clearFocus = React.useCallback(() => setFocusKey(null), []);
  const focusField = React.useCallback((key: string) => {
    setView("form");
    setFocusKey(null);
    // let the form mount/paint, then point at the field so its effect re-fires
    requestAnimationFrame(() => requestAnimationFrame(() => setFocusKey(key)));
  }, []);

  const [focusDocId, setFocusDocId] = React.useState<string | null>(null);
  const clearDocFocus = React.useCallback(() => setFocusDocId(null), []);
  const focusDoc = React.useCallback((docId: string) => {
    setView("documents");
    setFocusDocId(null);
    requestAnimationFrame(() => requestAnimationFrame(() => setFocusDocId(docId)));
  }, []);

  const focusRevision = React.useCallback(() => {
    if (state.unlocked[0]) focusField(state.unlocked[0]);
    else if (state.unlockedDocs[0]) focusDoc(state.unlockedDocs[0]);
    else setView("form");
  }, [state.unlocked, state.unlockedDocs, focusField, focusDoc]);

  /* ── carried-forward data + staleness ────────────────────────
     Reused figures are a gift until they're wrong. Both signals — how old the
     data is, and whether it was reported for a different period — are judged
     against THIS request, and the supplier confirms once. */
  const carriedKeys = React.useMemo(() => new Set(state.carried?.keys ?? []), [state.carried]);
  const carriedVerdict = React.useMemo(
    () => (state.carried ? assessFreshness({ sourceAt: state.carried.sourceAt, sourcePeriods: state.carried.sourcePeriods }, req.period) : null),
    [state.carried, req.period],
  );
  const carriedPending = Boolean(state.carried && !state.carried.acknowledgedAt && state.status !== "submitted");
  const confirmCarried = React.useCallback(() => {
    setState((s) => (s.carried ? { ...s, carried: { ...s.carried, acknowledgedAt: Date.now() } } : s));
    toast({ message: "Confirmed", detail: "Carried-over figures marked as still valid for this period.", tone: "ok" });
  }, []);

  /* ── access control ──────────────────────────────────────────
     Lives on the supplier's RECORD, not on this request: the point of the
     policy is that it survives the declaration and governs every future one.
     Held in React state here so the toggles are instant, written through on
     every change. */
  const [access, setAccessState] = React.useState<AccessPolicy>(defaultAccessPolicy);
  React.useEffect(() => {
    const r = getRecord(req.supplierName);
    if (r) setAccessState(r.access);
  }, [req.supplierName, state.versions.length]);

  const setAccess = React.useCallback(
    (section: SectionKey, audience: Audience, allowed: boolean) => {
      const next = setSectionAccess(req.supplierName, section, audience, allowed);
      setAccessState(next.access);
      setState((s) =>
        pushEvent(
          s,
          "access_changed",
          `${section} ${allowed ? "shared with" : "withheld from"} ${audience === "buyer" ? "downstream buyers" : "the verifier"}`,
        ),
      );
    },
    [req.supplierName],
  );

  const reuseAllowed = access.reuseByOrg[req.exporterName] !== false;
  const setReuse = React.useCallback(
    (allowed: boolean) => {
      const next = setReuseForOrg(req.supplierName, req.exporterName, allowed);
      setAccessState(next.access);
      toast({
        message: allowed ? "Re-use allowed" : "Re-use turned off",
        detail: allowed
          ? `${req.exporterName}'s next request will start pre-filled from your saved data.`
          : `${req.exporterName}'s next request will start blank. Anything already submitted stays with them.`,
        tone: allowed ? "ok" : "info",
      });
    },
    [req.supplierName, req.exporterName],
  );

  // The one entry point for "run the AI quality check". With required gaps it
  // leads the supplier to the first gap instead of burning an AI run.
  const goToCheck = React.useCallback(() => {
    if (!hasAnyInput) return;
    if (!requiredComplete) {
      setShowRequiredGaps(true);
      if (firstIncompleteRequired) focusField(firstIncompleteRequired);
      toast({
        message: "Fill the required fields first",
        detail: `${missingRequiredCount} required field${missingRequiredCount === 1 ? "" : "s"} left — the AI check runs once they're complete.`,
        tone: "info",
      });
      return;
    }
    setView("check");
  }, [hasAnyInput, requiredComplete, firstIncompleteRequired, missingRequiredCount, focusField]);

  const value: Ctx = {
    req,
    state,
    view,
    setView,
    sections,
    getValue,
    setValue,
    isEditable,
    autoValue,
    addFiles,
    removeFile,
    clearDoc,
    isDocEditable,
    addSeat,
    removeSeat,
    toggleAssign,
    saveProfile,
    hasSavedProfile,
    sectionProgress,
    overall,
    runCheck,
    submit,
    simulateRevision,
    flagged,
    firstFlagKey,
    focusKey,
    focusField,
    clearFocus,
    focusRevision,
    flaggedDocs,
    focusDocId,
    focusDoc,
    clearDocFocus,
    hasAnyInput,
    requiredComplete,
    firstIncompleteRequired,
    missingRequiredCount,
    totalRequiredCount: requiredFieldKeys.length,
    goToCheck,
    carriedKeys,
    carriedVerdict,
    carriedPending,
    confirmCarried,
    access,
    setAccess,
    reuseAllowed,
    setReuse,
    saveStatus,
  };

  return <SupplierCtx.Provider value={value}>{children}</SupplierCtx.Provider>;
}
