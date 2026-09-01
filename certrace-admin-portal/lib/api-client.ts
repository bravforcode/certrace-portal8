/* ════════════════════════════════════════════════════════════
   CENTRAL API CLIENT FOR ADMIN CONSOLE

   Handles all requests from the admin console to the FastAPI backend.
   ════════════════════════════════════════════════════════════ */

const API_BASE_URL = typeof window !== "undefined"
  ? (window.localStorage.getItem("certrace:api-url") || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
  : "http://localhost:8000";

const SESSION_KEY = "certrace-admin:session";

export function getStoredSession(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const staffId = getStoredSession();
  
  if (staffId) {
    headers.set("Authorization", `Bearer admin_${staffId}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMsg = "API Request failed";
    try {
      const errData = await response.json();
      errMsg = errData.detail || errData.message || errMsg;
    } catch {
      /* ignore */
    }
    throw new Error(errMsg);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: "GET" }),
    
  post: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
    
  put: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
    
  patch: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
    
  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
