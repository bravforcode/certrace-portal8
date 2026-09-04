/* ════════════════════════════════════════════════════════════
   THE ONE PLACE THAT TALKS TO THE NETWORK

   Every endpoint module goes through `request()`. That buys four things no
   scattered `fetch` call gets right consistently:

     • Errors arrive as ApiError with the contract's `code`, never as a raw
       Response that each call site has to unwrap.
     • A request that hangs is cut off rather than leaving a spinner forever.
     • The Authorization header is attached from the session — or deliberately
       withheld, which matters more than attaching it (see below).
     • A 401 clears the stored session once, centrally, instead of leaving a
       dead token behind for every later call to retry with.

   ── Why `auth: false` is a real parameter ─────────────────────
   The supplier endpoints are public by design: whoever opens a Smart Link has
   no account. If the exporter opens a link in their own browser — which they
   do, to check what the supplier sees — a blanket "attach the token if we have
   one" rule would send their credential to an endpoint that must not depend on
   it, and the server would have to decide whether to honour it. Withholding is
   the safer default for those routes, so it is stated per call, not inferred.
   ════════════════════════════════════════════════════════════ */

import { apiBaseUrl, apiFetch, apiTimeoutMs } from "./config";
import { ApiError } from "./errors";
import { accessToken, clearSession, loadSession, saveSession, type Session } from "./session";

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** Serialized as JSON. Omit for GET/DELETE. */
  body?: unknown;
  /** Send the bearer token. Defaults to true — pass false for the public Smart Link routes. */
  auth?: boolean;
  /** Caller's own cancellation, honoured alongside the timeout. */
  signal?: AbortSignal;
  timeoutMs?: number;
};

/** Shape the backend returns on failure, per docs/API-CONTRACT.md. */
type ErrorBody = { detail?: { code?: string; message?: string } | string };

function messageFor(status: number): string {
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have access to this.";
  if (status === 404) return "That is no longer here.";
  if (status >= 500) return "The server had a problem. Please try again.";
  return "That request could not be completed.";
}

/* The contract says `{ detail: { code, message } }`, but a 502 from a proxy or
   a crash before the handler runs will not follow it. Parsing has to survive
   an HTML error page without throwing a second, more confusing error. */
async function toApiError(response: Response): Promise<ApiError> {
  let code = `HTTP_${response.status}`;
  let message = messageFor(response.status);
  try {
    const body = (await response.json()) as ErrorBody;
    const detail = body?.detail;
    if (typeof detail === "string") {
      message = detail;
    } else if (detail && typeof detail === "object") {
      if (detail.code) code = detail.code;
      if (detail.message) message = detail.message;
    }
  } catch {
    /* Not JSON. The status-derived code and message above stand. */
  }
  return new ApiError(code, message, response.status);
}

/* ── Expired access tokens heal themselves ──────────────────────
   The access JWT lives an hour; the session lives a week, in the refresh
   token. A 401 on an authenticated route is therefore usually just "the hour
   is up": trade the refresh token for a new pair, replay the request once.
   Only when that trade fails — revoked, expired, never existed — is the
   person actually signed out, and the session is cleared HERE, centrally.

   One refresh at a time: a page mounting five data calls gets five 401s at
   once, and five racing rotations would burn each other's tokens (each trade
   kills the token the next one holds). */
let refreshInFlight: Promise<boolean> | null = null;

async function tradeRefreshToken(refreshToken: string): Promise<boolean> {
  try {
    const rotated = await perform<Session & { refreshToken: string }>(
      "/api/auth/refresh",
      { method: "POST", body: { refreshToken }, auth: false },
    );
    saveSession({
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
      user: rotated.user,
    });
    return true;
  } catch {
    return false;
  }
}

function refreshSession(): Promise<boolean> {
  const refreshToken = loadSession()?.refreshToken;
  if (!refreshToken) return Promise.resolve(false);
  if (!refreshInFlight) {
    const attempt = tradeRefreshToken(refreshToken);
    refreshInFlight = attempt;
    /* Cleared by identity, not blindly: were a second attempt ever started
       before this settles, its own cleanup must not be wiped out. */
    void attempt.finally(() => {
      if (refreshInFlight === attempt) refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

const isUnauthorized = (cause: unknown): boolean =>
  cause instanceof ApiError && cause.status === 401;

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true } = options;
  try {
    return await perform<T>(path, options);
  } catch (cause) {
    if (!auth || !isUnauthorized(cause)) throw cause;
    if (await refreshSession()) {
      try {
        return await perform<T>(path, options);
      } catch (retryCause) {
        /* A 401 on a token minted seconds ago is not about the token. */
        if (isUnauthorized(retryCause)) clearSession();
        throw retryCause;
      }
    }
    clearSession();
    throw cause;
  }
}

async function perform<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, signal, timeoutMs = apiTimeoutMs() } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = accessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  /* Two ways a request ends early — the timeout and the caller's own signal.
     AbortSignal.any would express this in one line but is not in every runtime
     the portal builds for, so the listener is wired by hand. */
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);
  const abortFromCaller = () => controller.abort("caller");
  signal?.addEventListener("abort", abortFromCaller, { once: true });

  let response: Response;
  try {
    response = await apiFetch()(`${apiBaseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    /* Distinguish "we gave up" from "the network did" — the first is worth
       retrying automatically, the second usually needs the person to act. */
    if (controller.signal.aborted && signal?.aborted !== true) {
      throw new ApiError("TIMEOUT", "The server took too long to answer.");
    }
    if (signal?.aborted) throw new ApiError("ABORTED", "That request was cancelled.");
    throw new ApiError("NETWORK", "Could not reach the server. Check your connection.");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abortFromCaller);
  }

  /* A 401 is NOT handled here: request() above turns it into one refresh
     attempt and a replay, and clears the session only when that fails. */
  if (!response.ok) throw await toApiError(response);

  if (response.status === 204) return undefined as T;

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("BAD_RESPONSE", "The server sent something unreadable.", response.status);
  }
}
