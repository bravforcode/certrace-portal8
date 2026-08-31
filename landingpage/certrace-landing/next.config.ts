import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-XSS-Protection", value: "0" },
];

const nextConfig: NextConfig = {
  /* `next build` writes into the same .next directory a running `next dev` is
     serving from, which leaves the dev server throwing missing-chunk errors
     until it's restarted. Setting NEXT_DIST_DIR sends a build somewhere else,
     so a production check can run without disturbing a live preview. Unset in
     normal use, so `npm run build` behaves exactly as before. */
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
