import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ── The one cross-origin the portal is allowed to call ─────────
   `connect-src 'self'` does not cover api.certrace.co, and a CSP does not
   fail loudly: the request is simply refused in the browser, which looks
   exactly like the backend being down. Every call in lib/api goes to this
   origin, so it has to be named. Read from the same build-time variable the
   client reads, so the policy cannot disagree with the code it is policing.

   Mirrored into the static policy by scripts/build-csp-headers.mjs — this
   middleware only runs in the Worker, and a prerendered page is served off
   Cloudflare's asset layer without ever reaching it. */
function apiOrigin(): string {
  const configured = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim();
  if (!configured) return "";
  try {
    return new URL(configured).origin;
  } catch {
    /* A malformed value must not take the whole policy down with it; the
       client's own fetch will fail on it loudly enough. */
    return "";
  }
}

/** The public site, whose /trace/preview the Trace page frames. */
function landingOrigin(): string {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:3000",
    ).origin;
  } catch {
    return "";
  }
}

export function middleware(request: NextRequest) {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const api = apiOrigin();

  const cspHeader = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self'${api ? ` ${api}` : ""}${isDevelopment ? " ws: wss:" : ""}`,
    "worker-src 'self' blob:",
    // Smart upload previews an uploaded PDF in an iframe from a blob: URL,
    // which default-src 'self' would otherwise refuse.
    // ...and the Trace page frames the landing site's own profile page as its
    // live preview (app/(portal)/trace).
    `frame-src 'self' blob: ${landingOrigin()}`,
    "manifest-src 'self'",
    // Direct HTTP access to a VPS IP is used for deployment smoke tests.
    // Upgrading its asset URLs would request HTTPS on the plain HTTP port.
    ...(isDevelopment || request.nextUrl.protocol !== "https:"
      ? []
      : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("X-XSS-Protection", "0");

  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|backend|_next/static|_next/image|favicon.ico|brand|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
