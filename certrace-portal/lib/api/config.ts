/* ════════════════════════════════════════════════════════════
   WHERE THE BACKEND IS — AND WHETHER THERE IS ONE YET

   Two jobs, and the second one is the reason this file exists.

   1. Hold the base URL. It comes from NEXT_PUBLIC_API_BASE_URL, read once at
      module load the way Next inlines it at build time.

   2. Answer `apiConfigured()`. Until the endpoints in docs/API-CONTRACT.md are
      live, the portal still has to run — the demo, the tests, and every screen
      that reads localStorage today. So each store migrates behind this check:

          if (!apiConfigured()) return loadFromLocalStorage();
          return await getFromApi();

      That lets the stores move one at a time instead of in one commit that
      breaks everything until the last endpoint lands, and it keeps a laptop
      with no .env.local working exactly as it does now.

   `configureApi()` exists for tests and for the rare call site that needs to
   point somewhere else; nothing in the app should need it.
   ════════════════════════════════════════════════════════════ */

/** Trailing slashes are stripped so `${base}${path}` never doubles up. */
function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

let baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? "");
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
  if (next.defaultTimeoutMs !== undefined) defaultTimeoutMs = next.defaultTimeoutMs;
}

export const apiBaseUrl = (): string => baseUrl;

/** False = no backend wired up; callers fall back to their localStorage path. */
export const apiConfigured = (): boolean => baseUrl.length > 0;

export const apiTimeoutMs = (): number => defaultTimeoutMs;

/* Resolved per call rather than captured once, so a test that swaps the
   implementation between cases gets the one it just installed. */
export function apiFetch(): typeof fetch {
  if (fetchImpl) return fetchImpl;
  if (typeof fetch === "function") return fetch;
  throw new Error("No fetch implementation available. Call configureApi({ fetchImpl }).");
}
