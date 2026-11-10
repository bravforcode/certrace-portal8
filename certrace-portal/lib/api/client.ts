import { companyHeaders } from "../company-session";
import { treaty } from "@elysiajs/eden";
import type { App } from "@certrace/backend";
import { apiBaseUrl, apiFetch, apiTimeoutMs } from "./config";
import { ApiError } from "./errors";
import {
  clearSession,
  markLegalConsentRequired,
  markAccountNotReady,
  loadSession,
  sessionEpoch,
  assertSessionUnchanged,
} from "./session";
import { markAccountSuspended, clearAccountSuspension } from "./suspension";
/** Types are inferred from Elysia's route schemas. The backend import is erased. */
const responseScopes = new WeakMap<
  Response,
  { auth: boolean; epoch: number }
>();
export function api(
  auth = true,
  expectedAccountId: string | null = loadSession()?.user.id ?? null,
) {
  const epoch = sessionEpoch();
  const base = apiBaseUrl();
  const origin =
    typeof window === "undefined"
      ? "http://localhost:3000"
      : (window.location?.origin ?? "http://localhost:3000");
  return treaty<App>(
    new URL(base || "/backend", origin).href.replace(/\/$/, ""),
    {
      // JSON documents and their validators keep calendar answers as strings.
      parseDate: false,
      headers:
        auth && expectedAccountId
          ? {
              "X-Certrace-Account": expectedAccountId,
              ...companyHeaders(expectedAccountId),
            }
          : {},
      fetcher: (async (
        input: Parameters<typeof fetch>[0],
        init?: Parameters<typeof fetch>[1],
      ) => {
        const response = await apiFetch()(input, init);
        responseScopes.set(response, { auth, epoch });
        return response;
      }) as typeof fetch,
      fetch: {
        credentials: auth ? "include" : "omit",
        signal: AbortSignal.timeout(apiTimeoutMs()),
      },
    },
  );
}
export async function result<T>(
  call: Promise<{
    data: T;
    error: unknown;
    status: number;
    response?: Response;
  }>,
): Promise<NonNullable<T>> {
  const response = await call;
  const scope = response.response && responseScopes.get(response.response);
  if (scope?.auth) {
    // Check after the complete response body, including slow downloads of JSON.
    assertSessionUnchanged(scope.epoch);
    if (response.status === 401) clearSession();
    if (response.status >= 200 && response.status < 300)
      clearAccountSuspension();
  }
  if (response.error) {
    const error = response.error as {
      value?: { detail?: { code?: string; message?: string } };
    };
    if (error.value instanceof Error)
      throw new ApiError(
        "NETWORK",
        "The server could not be reached. Please retry.",
        0,
      );
    const detail = error.value?.detail;
    const failure = new ApiError(
      detail?.code ?? `HTTP_${response.status}`,
      detail?.message ?? "The request could not be completed.",
      response.status,
    );
    if (scope?.auth && failure.code === "LEGAL_CONSENT_REQUIRED")
      markLegalConsentRequired();
    if (scope?.auth && failure.code === "ACCOUNT_NOT_READY")
      markAccountNotReady();
    if (scope?.auth && failure.code === "ACCOUNT_SUSPENDED")
      markAccountSuspended(failure.message);
    throw failure;
  }
  return response.data as NonNullable<T>;
}
