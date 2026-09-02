/* ════════════════════════════════════════════════════════════
   INTERNAL SIGN-OFF BEFORE THE PACK LEAVES

   The two documents an exporter hands a verifier — the communication report
   and the evidence pack — are the company's own statement about its
   emissions. Somebody inside the company has to put their name to that before
   it goes out, and until now nobody did: the download button was open to
   anyone with the tab open.

   THE RULE, and it is deliberately narrow:

     · A workspace with outstanding items downloads freely, stamped DRAFT.
       Draft copies circulate internally all the time and gating them would
       stop people working.

     · A COMPLETE workspace requires a name and a job title first. That is the
       copy that gets sent, and an unsigned final pack is the one that reaches
       a regulator with nobody accountable for it.

     · EDITING AFTER SIGNING INVALIDATES THE SIGNATURE. This is the part that
       makes it mean anything. The signature records a FINGERPRINT of what was
       signed; if the underlying figures move, the fingerprint no longer
       matches and the pack must be signed again. Otherwise "signed" degrades
       into "was signed once, months ago, against numbers nobody can recover".

   It is an internal control, not an electronic signature. It is not
   cryptographic, it is not witnessed, and the UI says so — claiming otherwise
   would be worse than not having it.
   ════════════════════════════════════════════════════════════ */

export type PackSignOff = {
  workspaceId: string;
  name: string;
  jobTitle: string;
  /** ISO timestamp */
  signedAt: string;
  /** what was true when they signed — see `packFingerprint` */
  fingerprint: string;
};

const KEY = "certrace:pack-signoff";

type Store = Record<string, PackSignOff>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Store) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

/* ── The fingerprint ────────────────────────────────────────────
   The figures that, if any of them moved, mean a different document was
   signed. Deliberately the OUTPUTS rather than the inputs: an exporter who
   corrects a typo in a boundary description has not changed what they
   attested to, and forcing a re-sign for that would train people to click
   through it. A changed tonne of CO₂ is a different attestation.

   Rounded to the precision the report actually prints. A float that drifts in
   the fifteenth decimal between two renders would invalidate a signature
   nobody touched. */
export function packFingerprint(input: {
  seeDirect: number;
  seeIndirect: number;
  seePrecursor: number;
  productionTonnes: number;
  readiness: string;
  evidenceCount: number;
}): string {
  const n = (v: number) => (Number.isFinite(v) ? v.toFixed(4) : "x");
  return [
    n(input.seeDirect),
    n(input.seeIndirect),
    n(input.seePrecursor),
    n(input.productionTonnes),
    input.readiness,
    String(input.evidenceCount),
  ].join("|");
}

export const getSignOff = (workspaceId: string): PackSignOff | null => read()[workspaceId] ?? null;

export function signOffPack(workspaceId: string, name: string, jobTitle: string, fingerprint: string): PackSignOff {
  const record: PackSignOff = {
    workspaceId,
    name: name.trim(),
    jobTitle: jobTitle.trim(),
    signedAt: new Date().toISOString(),
    fingerprint,
  };
  const store = read();
  store[workspaceId] = record;
  write(store);
  return record;
}

export function clearSignOff(workspaceId: string): void {
  const store = read();
  delete store[workspaceId];
  write(store);
}

export type SignOffState =
  /** the workspace is not complete — download freely, stamped DRAFT */
  | { kind: "draft_open"; signOff: null }
  /** complete and never signed */
  | { kind: "needs_signature"; signOff: null }
  /** signed, and the figures have not moved since */
  | { kind: "signed"; signOff: PackSignOff }
  /** signed, but the figures moved afterwards — must be signed again */
  | { kind: "stale"; signOff: PackSignOff };

/** What the download button should do right now. */
export function signOffState(workspaceId: string, complete: boolean, fingerprint: string): SignOffState {
  const signOff = getSignOff(workspaceId);
  if (!complete) return { kind: "draft_open", signOff: null };
  if (!signOff) return { kind: "needs_signature", signOff: null };
  return signOff.fingerprint === fingerprint ? { kind: "signed", signOff } : { kind: "stale", signOff };
}

/** Can the final (non-draft) pack be downloaded? */
export const canDownloadFinal = (s: SignOffState): boolean => s.kind === "draft_open" || s.kind === "signed";

export const SIGNOFF_DISCLAIMER =
  "This is an internal control, not an electronic signature. It records who inside your company approved these figures and when, so that a pack " +
  "leaving the business always has somebody accountable for it. It is not witnessed and it is not cryptographic.";
