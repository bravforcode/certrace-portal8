import type { NextConfig } from "next";

/* Baseline security headers for every route. A CSP is intentionally deferred:
   Next.js dev/HMR needs inline scripts, so a meaningful policy belongs in the
   production deployment config (with nonces) — see docs/SECURITY.md. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Pin the workspace root (there's another lockfile in the home dir).
  outputFileTracingRoot: import.meta.dirname,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
