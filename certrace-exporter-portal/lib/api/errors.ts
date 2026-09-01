/* ════════════════════════════════════════════════════════════
   ONE ERROR TYPE FOR EVERY CALL

   Callers need to branch on *why* something failed — an expired Smart Link
   shows the supplier a "ask for a new link" screen, a wrong password shows a
   field error, a dead network shows "try again". Three different shapes of
   thrown value would mean three different `catch` blocks at every call site,
   so everything the client layer throws is an ApiError carrying a `code`.

   The codes are the ones docs/API-CONTRACT.md commits the backend to, plus
   three the transport itself produces (NETWORK, TIMEOUT, BAD_RESPONSE) —
   the server cannot report a failure that stopped the response from arriving.
   ════════════════════════════════════════════════════════════ */

/** Codes the client raises on its own, before or instead of a server reply. */
export const TRANSPORT_CODES = ["NETWORK", "TIMEOUT", "BAD_RESPONSE"] as const;

export class ApiError extends Error {
  readonly code: string;
  /** HTTP status, or 0 when the response never arrived. */
  readonly status: number;

  constructor(code: string, message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }

  /** True when retrying the identical request could plausibly succeed. */
  get retryable(): boolean {
    return this.code === "NETWORK" || this.code === "TIMEOUT" || this.status >= 500;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/** True when `value` is an ApiError carrying one of `codes`. */
export function hasCode(value: unknown, ...codes: string[]): boolean {
  return isApiError(value) && codes.includes(value.code);
}

/* A Smart Link that no longer opens — all three mean the same thing to the
   supplier looking at the screen ("this link is no good, ask for another"),
   so the UI branches on the group rather than on each code. */
export const DEAD_LINK_CODES = ["TOKEN_NOT_FOUND", "TOKEN_EXPIRED", "TOKEN_REVOKED"];

export const isDeadLink = (value: unknown): boolean => hasCode(value, ...DEAD_LINK_CODES);
