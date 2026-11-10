import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* The security header set lives in public/_headers, and that file is the
   single source of truth — see the comment block at its top for why the
   asset layer, not this config, is what serves the pages visitors load.

   Parsing it here is what keeps the two in step: the asset layer reads the
   file directly, the Worker gets the same set through this function, and
   editing the policy in one place updates both. A silent drift between them
   is exactly the failure that scored the site 5/100 on Observatory.

   Cloudflare's format: a path pattern at column 0, then one indented
   `Name: value` per header. Only the `/*` block is lifted — any
   path-specific block added later stays asset-layer-only on purpose.

   The `script-src` lifted here is the hash-free base: the per-page hashes
   that scripts/build-csp-headers.mjs computes belong to prerendered files
   the Worker never serves. What the Worker does serve is rendered per
   request, and middleware.ts sets a nonce policy on those responses that
   takes precedence over this one — so the base is a floor for the paths
   middleware skips (API routes, /_next/static), none of which are
   documents. */
function securityHeadersFromFile(): { key: string; value: string }[] {
  const raw = readFileSync(
    join(import.meta.dirname, "public", "_headers"),
    "utf8",
  );
  const headers: { key: string; value: string }[] = [];
  let inGlobalBlock = false;

  for (const line of raw.split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      inGlobalBlock = line.trim() === "/*";
      continue;
    }
    if (!inGlobalBlock) continue;
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    headers.push({
      key: line.slice(0, separator).trim(),
      value: line.slice(separator + 1).trim(),
    });
  }

  if (headers.length === 0) {
    throw new Error(
      "public/_headers produced no headers for the /* block — the build would ship unprotected.",
    );
  }
  return headers;
}

const securityHeaders = securityHeadersFromFile();

const nextConfig: NextConfig = {
  // Release images are built only after the independent lint/type jobs pass.
  // Ordinary local builds still perform both checks.
  eslint: {
    ignoreDuringBuilds: process.env.CERTRACE_CI_CHECKS_PASSED === "true",
  },
  typescript: {
    ignoreBuildErrors: process.env.CERTRACE_CI_CHECKS_PASSED === "true",
  },
  // Pin the workspace root (there's another lockfile in the home dir).
  outputFileTracingRoot: join(import.meta.dirname, ".."),
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${process.env.BACKEND_INTERNAL_URL ?? "http://backend:8000"}/:path*`,
      },
    ];
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
