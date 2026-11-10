/** The portal always uses the backend; a missing override uses the same-origin proxy. */
/** Trailing slashes are stripped so `${base}${path}` never doubles up. */
function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

let baseUrl = normalizeBaseUrl(
  process.env.NODE_ENV === "test"
    ? ""
    : process.env.NEXT_PUBLIC_API_BASE_URL || "/backend",
);
let fetchImpl: typeof fetch | null = null;
let defaultTimeoutMs = 15_000;

export type ApiConfig = {
  baseUrl?: string;
  /** Injected in tests; the app always uses the platform `fetch`. */
  fetchImpl?: typeof fetch | null;
  defaultTimeoutMs?: number;
};

export function configureApi(next: ApiConfig): void {
  if (next.baseUrl !== undefined) baseUrl = normalizeBaseUrl(next.baseUrl);
  if (next.fetchImpl !== undefined) fetchImpl = next.fetchImpl;
  if (next.defaultTimeoutMs !== undefined)
    defaultTimeoutMs = next.defaultTimeoutMs;
}

export const apiBaseUrl = (): string => baseUrl;

/** An empty URL can be staged in tests; it never enables browser persistence. */
export const apiConfigured = (): boolean => baseUrl.length > 0;

export const authUnavailable = (): boolean => !apiConfigured();

export const apiTimeoutMs = (): number => defaultTimeoutMs;

/* Resolved per call rather than captured once, so a test that swaps the
   implementation between cases gets the one it just installed. */
export function apiFetch(): typeof fetch {
  if (fetchImpl) return fetchImpl;
  if (typeof fetch === "function") return fetch;
  throw new Error(
    "No fetch implementation available. Call configureApi({ fetchImpl }).",
  );
}
