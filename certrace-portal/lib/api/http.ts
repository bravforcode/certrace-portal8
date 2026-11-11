import { companyHeaders } from "../company-session";
/** Binary transport for file uploads/downloads. JSON endpoints use the inferred Eden client. */
import { apiBaseUrl, apiFetch, apiTimeoutMs } from "./config";
import { ApiError, isAccountSuspended } from "./errors";
import {
  clearSession,
  markLegalConsentRequired,
  markAccountNotReady,
  markTrialEnded,
  loadSession,
  sessionEpoch,
  assertSessionUnchanged,
} from "./session";
import { clearAccountSuspension, markAccountSuspended } from "./suspension";

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** Serialized as JSON. Omit for GET/DELETE. */
  body?: unknown;
  /* ── Evidence uploads ──────────────────────────────────────────
     A file goes up as the raw body with its own content type, not as JSON and
     not as multipart: base64 inside JSON costs a third more bytes for nothing,
     and multipart would add a second place for a filename to be stated. The
     backend reads the type from the header and the name from the query string.

     `rawBody` and `body` are mutually exclusive; passing both is a caller bug
     and throws rather than silently picking one. */
  rawBody?: Blob | ArrayBuffer | Uint8Array;
  /** Content type for `rawBody`. Required with it — the server refuses an
      upload whose declared type does not match its bytes, and a Blob with no
      type would be declared as nothing at all. */
  contentType?: string;
  /** Answer as a Blob rather than JSON, for downloading a stored file. */
  responseType?: "json" | "blob";
  /** Include the HTTP-only session cookie. Defaults to true — pass false for the public Smart Link routes. */
  auth?: boolean;
  /** Caller's own cancellation, honoured alongside the timeout. */
  signal?: AbortSignal;
  timeoutMs?: number;
};

/** Shape the backend returns on failure. */
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

const isUnauthorized = (cause: unknown): boolean =>
  cause instanceof ApiError && cause.status === 401;

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true } = options;
  const epoch = sessionEpoch();
  try {
    const answer = await perform<T>(path, options);
    if (auth) assertSessionUnchanged(epoch);
    /* An authenticated call that succeeded is proof the account is being
       served again — the only proof there is, since nothing tells the browser
       when a suspension is lifted. No-ops when nothing is stored. */
    if (auth) clearAccountSuspension();
    return answer;
  } catch (cause) {
    if (auth) assertSessionUnchanged(epoch);
    /* Recorded, then rethrown unchanged: the call site still fails, but the
       app now knows WHY every other call is about to fail too. Deliberately
       above the 401 branch — a suspension must never reach clearSession(),
       which would send the person to a sign-in screen that refuses their
       correct password without saying why. */
    if (auth && cause instanceof ApiError && isAccountSuspended(cause)) {
      markAccountSuspended(cause.message);
      throw cause;
    }
    if (
      auth &&
      cause instanceof ApiError &&
      cause.code === "LEGAL_CONSENT_REQUIRED"
    )
      markLegalConsentRequired();
    if (auth && cause instanceof ApiError && cause.code === "ACCOUNT_NOT_READY")
      markAccountNotReady();
    if (auth && cause instanceof ApiError && cause.code === "TRIAL_ENDED")
      markTrialEnded();
    if (!auth || !isUnauthorized(cause)) throw cause;
    clearSession();
    throw cause;
  }
}

async function perform<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    rawBody,
    contentType,
    responseType = "json",
    auth = true,
    signal,
    timeoutMs = apiTimeoutMs(),
  } = options;

  if (body !== undefined && rawBody !== undefined) {
    throw new ApiError(
      "BAD_REQUEST",
      "A request carries either a JSON body or a raw body, not both.",
    );
  }

  const headers: Record<string, string> = {
    Accept: responseType === "blob" ? "*/*" : "application/json",
  };
  const accountId = auth ? loadSession()?.user.id : undefined;
  if (accountId)
    Object.assign(
      headers,
      { "X-Certrace-Account": accountId },
      companyHeaders(accountId),
    );
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (rawBody !== undefined && contentType)
    headers["Content-Type"] = contentType;

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
      credentials: auth ? "include" : "omit",
      headers,
      body:
        rawBody !== undefined
          ? (rawBody as BodyInit)
          : body === undefined
            ? undefined
            : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    /* Distinguish "we gave up" from "the network did" — the first is worth
       retrying automatically, the second usually needs the person to act. */
    if (controller.signal.aborted && signal?.aborted !== true) {
      throw new ApiError("TIMEOUT", "The server took too long to answer.");
    }
    if (signal?.aborted)
      throw new ApiError("ABORTED", "That request was cancelled.");
    throw new ApiError(
      "NETWORK",
      "Could not reach the server. Check your connection.",
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abortFromCaller);
  }

  /* A 401 is NOT handled here: request() above turns it into one refresh
     attempt and a replay, and clears the session only when that fails. */
  if (!response.ok) throw await toApiError(response);

  if (response.status === 204) return undefined as T;

  if (responseType === "blob") {
    try {
      return (await response.blob()) as T;
    } catch {
      throw new ApiError(
        "BAD_RESPONSE",
        "That file could not be read from the response.",
        response.status,
      );
    }
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(
      "BAD_RESPONSE",
      "The server sent something unreadable.",
      response.status,
    );
  }
}
